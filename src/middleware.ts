import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Slim NextAuth instance — only the config, no Credentials provider with
// bcryptjs + Prisma. Keeps the middleware Edge bundle small (~150 KB).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl;
  const isLoginPage = url.pathname === "/login";
  const isAuthApi = url.pathname.startsWith("/api/auth");
  const isPublic = isLoginPage || isAuthApi;

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }
  if (req.auth && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts|.*\\.svg).*)"],
};
