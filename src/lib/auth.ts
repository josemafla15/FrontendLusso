import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "lusso_access";
export const REFRESH_COOKIE = "lusso_refresh";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setAuthCookies(
  res: NextResponse,
  tokens: { access?: string; refresh?: string }
) {
  if (tokens.access) {
    res.cookies.set(ACCESS_COOKIE, tokens.access, {
      ...base,
      maxAge: 30 * 60, // el access de SimpleJWT dura 30 min
    });
  }
  if (tokens.refresh) {
    res.cookies.set(REFRESH_COOKIE, tokens.refresh, {
      ...base,
      maxAge: 7 * 24 * 60 * 60, // refresh 7 días (con rotación)
    });
  }
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...base, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...base, maxAge: 0 });
}
