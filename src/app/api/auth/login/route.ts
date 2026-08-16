import { NextRequest, NextResponse } from "next/server";
import { API_URL, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let credentials: { username?: string; password?: string };
  try {
    credentials = await req.json();
  } catch {
    return NextResponse.json({ detail: "Cuerpo inválido" }, { status: 400 });
  }

  if (!credentials.username || !credentials.password) {
    return NextResponse.json(
      { detail: "Usuario y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "No se pudo conectar con el servidor" },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const status = upstream.status;
    return NextResponse.json(
      {
        detail:
          status === 401
            ? "Usuario o contraseña incorrectos"
            : "Error al iniciar sesión",
      },
      { status }
    );
  }

  const { access, refresh } = (await upstream.json()) as {
    access: string;
    refresh: string;
  };

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, { access, refresh });
  return res;
}
