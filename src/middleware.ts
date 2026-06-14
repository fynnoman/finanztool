import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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
