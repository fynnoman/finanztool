"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(80, "Name zu lang"),
  email: z.string().trim().toLowerCase().email("Keine gültige E-Mail"),
  password: z.string().min(8, "Passwort min. 8 Zeichen").max(200, "Passwort zu lang"),
});

export type RegisterResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export async function registerUser(
  _prev: RegisterResult | null,
  formData: FormData
): Promise<RegisterResult> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "Es gibt bereits einen Account mit dieser E-Mail." };
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, name, passwordHash } });

    // Beim allerersten User die Stammdaten-Zeile sicherstellen — sonst
    // crashen Numbering / PDF / ZUGFeRD beim ersten Login.
    const settings = await prisma.businessSettings.findFirst();
    if (!settings) {
      await prisma.businessSettings.create({ data: { businessName: "Mein Unternehmen" } });
    }

    return { ok: true, email };
  } catch (err) {
    console.error("[register] failed:", err);
    return { ok: false, error: "Account konnte nicht angelegt werden. Bitte später erneut versuchen." };
  }
}
