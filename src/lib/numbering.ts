import { prisma } from "@/lib/db";

/** Atomically pull the next invoice/quote number with prefix and zero-padding. */
export async function nextInvoiceNumber(): Promise<string> {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Stammdaten fehlen — bitte Einstellungen ausfüllen.");
  const year = new Date().getFullYear();
  const padded = String(settings.invoiceCounter).padStart(4, "0");
  const number = `${settings.invoiceNumberPrefix}-${year}-${padded}`;
  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: { invoiceCounter: settings.invoiceCounter + 1 },
  });
  return number;
}

export async function nextQuoteNumber(): Promise<string> {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Stammdaten fehlen — bitte Einstellungen ausfüllen.");
  const year = new Date().getFullYear();
  const padded = String(settings.quoteCounter).padStart(4, "0");
  const number = `${settings.quoteNumberPrefix}-${year}-${padded}`;
  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: { quoteCounter: settings.quoteCounter + 1 },
  });
  return number;
}
