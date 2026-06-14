import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return { id: user.id, email: user.email, name: user.name ?? user.email };
        } catch (err) {
          // DB-Probleme dürfen Auth.js nicht in den /api/auth/error-Pfad
          // werfen. Null → Auth.js liefert sauber "CredentialsSignin".
          console.error("[auth.authorize] failed:", err);
          return null;
        }
      },
    }),
  ],
});
