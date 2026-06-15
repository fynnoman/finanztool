"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

/** Parse a number form field that may be empty. Empty/invalid → fallback. */
function numField(formData: FormData, key: string, fallback: number): number {
  const raw = formData.get(key);
  if (raw === null || raw === undefined) return fallback;
  const s = String(raw).trim();
  if (s === "") return fallback;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function strField(formData: FormData, key: string, fallback: string): string {
  const raw = formData.get(key);
  if (raw === null || raw === undefined) return fallback;
  return String(raw);
}

export async function updateSettings(formData: FormData) {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Keine Stammdaten-Zeile vorhanden");

  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: {
      businessName: strField(formData, "businessName", settings.businessName),
      businessAddress: strField(formData, "businessAddress", ""),
      businessEmail: strField(formData, "businessEmail", ""),
      businessPhone: strField(formData, "businessPhone", ""),
      taxId: strField(formData, "taxId", ""),
      taxNumber: strField(formData, "taxNumber", ""),
      iban: strField(formData, "iban", ""),
      bic: strField(formData, "bic", ""),
      bankName: strField(formData, "bankName", ""),
      vatRate: numField(formData, "vatRate", settings.vatRate),
      paymentTermsDays: numField(formData, "paymentTermsDays", settings.paymentTermsDays),
      invoiceNumberPrefix: strField(formData, "invoiceNumberPrefix", "RE"),
      quoteNumberPrefix: strField(formData, "quoteNumberPrefix", "AN"),
      invoiceFooter: strField(formData, "invoiceFooter", ""),
      // Empty input means "keep existing key" so the user doesn't have to
      // re-paste it on every save.
      openaiApiKey: (String(formData.get("openaiApiKey") ?? "").trim() || settings.openaiApiKey),
      openaiModel: strField(formData, "openaiModel", settings.openaiModel),
    },
  });

  revalidatePath("/einstellungen");
  revalidatePath("/", "layout");
}

export async function pingOpenAI(): Promise<{ ok: boolean; message: string }> {
  const { getOpenAI, ping } = await import("@/lib/openai");
  const client = await getOpenAI();
  if (!client) return { ok: false, message: "Kein Key hinterlegt." };
  const ok = await ping(client);
  return ok
    ? { ok: true, message: `OK — Verbindung zu ${client.model} hergestellt.` }
    : { ok: false, message: "Verbindung fehlgeschlagen. Key oder Modell prüfen." };
}

export async function uploadLogo(formData: FormData) {
  const dataUrl = String(formData.get("logoDataUrl") ?? "");
  if (!dataUrl) throw new Error("Kein Logo");
  if (!dataUrl.startsWith("data:image/")) throw new Error("Ungültiges Bildformat");
  if (dataUrl.length > 4_000_000) throw new Error("Logo zu groß (max ~3 MB)");

  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Keine Stammdaten-Zeile vorhanden");
  await prisma.businessSettings.update({ where: { id: settings.id }, data: { logoDataUrl: dataUrl } });
  revalidatePath("/einstellungen");
}

export async function removeLogo() {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) return;
  await prisma.businessSettings.update({ where: { id: settings.id }, data: { logoDataUrl: null } });
  revalidatePath("/einstellungen");
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht angemeldet");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) throw new Error("Neues Passwort min. 8 Zeichen");

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Kein Nutzer gefunden");

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) throw new Error("Aktuelles Passwort stimmt nicht");

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  revalidatePath("/einstellungen");
}
