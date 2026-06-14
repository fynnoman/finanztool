import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Slim middleware: just checks whether an Auth.js session cookie is present.
 * Real JWT validation + user lookup happens in the (app) layout via auth().
 * Keeping the middleware free of next-auth/bcrypt/Prisma ensures it stays
 * tiny and never throws MIDDLEWARE_INVOCATION_FAILED on Edge.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isLoginPage = url.pathname === "/login";
  const isAuthApi = url.pathname.startsWith("/api/auth");
  const isHealth = url.pathname === "/api/health";
  if (isLoginPage || isAuthApi || isHealth) return NextResponse.next();

  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.svg).*)"],
};
