import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Diagnose endpoint — confirms which env vars + DB connectivity are live in the
 * current deployment. NEVER prints the actual secret values, just whether they
 * are present and the length so you can spot truncation.
 */
export async function GET() {
  const env = {
    AUTH_SECRET: presence(process.env.AUTH_SECRET),
    AUTH_URL: process.env.AUTH_URL ?? null,
    DATABASE_URL: presence(process.env.DATABASE_URL),
    DIRECT_URL: presence(process.env.DIRECT_URL),
    NODE_ENV: process.env.NODE_ENV ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
  };

  let db: { ok: boolean; users: number | null; error: string | null } = {
    ok: false,
    users: null,
    error: null,
  };
  try {
    const c = await prisma.user.count();
    db = { ok: true, users: c, error: null };
  } catch (e) {
    db = { ok: false, users: null, error: (e as Error).message };
  }

  return NextResponse.json({ env, db, now: new Date().toISOString() });
}

function presence(v: string | undefined) {
  if (!v) return { set: false, length: 0 };
  return { set: true, length: v.length };
}
