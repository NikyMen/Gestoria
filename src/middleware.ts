import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "gestoria_session";

// Chequeo liviano de presencia de cookie (Edge runtime, sin crypto).
// La verificación real de la firma se hace en src/app/(app)/layout.tsx.
export function middleware(req: NextRequest) {
  const hasCookie = Boolean(req.cookies.get(COOKIE)?.value);
  const isLogin = req.nextUrl.pathname === "/login";

  if (!hasCookie && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasCookie && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand|favicon.ico).*)"],
};
