import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE = "lusso_refresh";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  // Los endpoints de login/logout siempre pasan
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/proxy")) {
    if (!hasSession) {
      return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/leads", req.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // Todo salvo estáticos de Next y archivos públicos
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico|webp)).*)"],
};
