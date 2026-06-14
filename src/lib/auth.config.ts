import type { NextAuthConfig } from "next-auth";

/**
 * Slim auth config shared by middleware (Edge runtime) and the full
 * server-side auth setup. KEEP THIS FILE FREE of Node-only deps
 * (bcryptjs, Prisma, fs, …) — otherwise the middleware bundle blows
 * past Vercel's 1 MB Edge limit.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // real providers live in auth.ts (Node runtime)
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    session: ({ session, token }) => {
      if (token?.id) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
  trustHost: true,
};
