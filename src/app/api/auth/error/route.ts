import { NextResponse } from "next/server";

/**
 * Override Auth.js's built-in /api/auth/error page. Its default React-rendered
 * error page sometimes 500s on Vercel Edge — instead we just redirect to our
 * own /login page with the error code as a query parameter, where the form
 * can display a human-readable message.
 *
 * A specific route here takes precedence over the [...nextauth] catch-all.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get("error") ?? "Unknown";
  const target = new URL("/login", url.origin);
  target.searchParams.set("error", error);
  return NextResponse.redirect(target, 302);
}
