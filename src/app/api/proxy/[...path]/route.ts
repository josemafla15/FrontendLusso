import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth";

type Ctx = { params: Promise<{ path: string[] }> };
type Tokens = { access: string; refresh?: string };

// Single-flight: si varios requests disparan un refresh casi al mismo tiempo,
// todos esperan esta misma promesa en vez de rotar el refresh token cada uno
// por su cuenta (lo cual invalida el token de los que llegan después).
let refreshInFlight: Promise<Tokens | null> | null = null;

async function callBackend(
  req: NextRequest,
  url: string,
  access: string | undefined,
  body: BodyInit | undefined,
  contentType: string | null
) {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (access) headers.Authorization = `Bearer ${access}`;
  return fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });
}

async function doRefresh(refresh: string): Promise<Tokens | null> {
  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as Tokens;
}

/**
 * Envuelve doRefresh en single-flight: si ya hay un refresh en curso
 * (disparado por otro request concurrente), reutiliza esa misma promesa
 * en vez de llamar a /api/auth/refresh/ de nuevo con un refresh token
 * que puede haber quedado rotado por el primero en llegar.
 */
function refreshTokensSingleFlight(refresh: string): Promise<Tokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(refresh).finally(() => {
      // Se libera apenas termina (éxito o falla), para que el próximo
      // 401 real (más adelante, con un token distinto) dispare su propio refresh.
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function buildResponse(
  upstream: Response,
  tokens?: { access: string; refresh?: string }
) {
  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf.byteLength ? buf : null, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
  if (tokens) setAuthCookies(res, tokens);
  return res;
}

async function handler(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const url = `${API_URL}/${path.join("/")}/${req.nextUrl.search}`;

  const incomingContentType = req.headers.get("content-type");
  const isMultipart = incomingContentType?.startsWith("multipart/form-data") ?? false;

  let body: BodyInit | undefined;
  let contentType: string | null;

  if (req.method === "GET" || req.method === "HEAD") {
    body = undefined;
    contentType = null;
  } else if (isMultipart) {
    body = await req.arrayBuffer();
    contentType = incomingContentType;
  } else {
    body = await req.text();
    contentType = "application/json";
  }

  const access = req.cookies.get(ACCESS_COOKIE)?.value;

  let upstream: Response;
  try {
    upstream = await callBackend(req, url, access, body, contentType);
  } catch {
    return NextResponse.json(
      { detail: "No se pudo conectar con el servidor" },
      { status: 502 }
    );
  }

  if (upstream.status !== 401) {
    return buildResponse(upstream);
  }

  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    const res = NextResponse.json({ detail: "Sesión expirada" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const tokens = await refreshTokensSingleFlight(refresh);
  if (!tokens) {
    const res = NextResponse.json({ detail: "Sesión expirada" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const retried = await callBackend(req, url, tokens.access, body, contentType);
  return buildResponse(retried, tokens);
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};