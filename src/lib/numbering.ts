import { prisma } from "@/lib/db";

/**
 * Pull the next number atomically with Prisma's `increment` operator.
 * Returns the value AFTER increment so we can use the previous counter for the
 * actual document number, then bump in one round-trip — race-condition-safe.
 */
export async function nextInvoiceNumber(): Promise<string> {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Stammdaten fehlen — bitte Einstellungen ausfüllen.");
  const updated = await prisma.businessSettings.update({
    where: { id: settings.id },
    data: { invoiceCounter: { increment: 1 } },
    select: { invoiceCounter: true, invoiceNumberPrefix: true },
  });
  // updated.invoiceCounter is the NEW value, so the consumed one is -1
  const consumed = updated.invoiceCounter - 1;
  const year = new Date().getFullYear();
  return `${updated.invoiceNumberPrefix}-${year}-${String(consumed).padStart(4, "0")}`;
}

export async function nextQuoteNumber(): Promise<string> {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) throw new Error("Stammdaten fehlen — bitte Einstellungen ausfüllen.");
  const updated = await prisma.businessSettings.update({
    where: { id: settings.id },
    data: { quoteCounter: { increment: 1 } },
    select: { quoteCounter: true, quoteNumberPrefix: true },
  });
  const consumed = updated.quoteCounter - 1;
  const year = new Date().getFullYear();
  return `${updated.quoteNumberPrefix}-${year}-${String(consumed).padStart(4, "0")}`;
}
