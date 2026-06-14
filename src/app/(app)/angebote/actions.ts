"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { totalsFromItems } from "@/lib/money";
import { nextQuoteNumber, nextInvoiceNumber } from "@/lib/numbering";

type ItemInput = { details: string; quantity: number; unitPrice: number };

function parseItems(formData: FormData): ItemInput[] {
  const details = formData.getAll("items.details").map(String);
  const qty = formData.getAll("items.quantity").map((v) => Number(String(v).replace(",", ".")) || 0);
  const price = formData.getAll("items.unitPrice").map((v) => Number(String(v).replace(",", ".")) || 0);
  const items: ItemInput[] = [];
  for (let i = 0; i < details.length; i++) {
    const d = details[i].trim();
    if (!d) continue;
    items.push({ details: d, quantity: qty[i] || 1, unitPrice: price[i] || 0 });
  }
  return items;
}

export async function createQuote(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) throw new Error("Kunde fehlt");
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const validUntilRaw = String(formData.get("validUntil") || "");
  const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;
  const vatRate = Number(formData.get("vatRate") || 19);
  const notes = String(formData.get("notes") || "");
  const items = parseItems(formData);
  const totals = totalsFromItems(items, vatRate);

  const number = await nextQuoteNumber();

  const quote = await prisma.quote.create({
    data: {
      number,
      date,
      validUntil,
      status: "DRAFT",
      vatRate,
      ...totals,
      notes,
      customerId,
      items: {
        create: items.map((it, idx) => ({ ...it, order: idx })),
      },
    },
  });

  // If quote has a validUntil, also create a calendar event so the user sees the deadline.
  if (validUntil) {
    await prisma.calendarEvent.create({
      data: {
        title: `Angebot ${number} läuft ab`,
        start: validUntil,
        end: validUntil,
        allDay: true,
        kind: "ANGEBOT_ABLAUF",
        customerId,
      },
    });
  }

  revalidatePath("/angebote");
  redirect(`/angebote/${quote.id}`);
}

export async function updateQuote(id: string, formData: FormData) {
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const validUntilRaw = String(formData.get("validUntil") || "");
  const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;
  const vatRate = Number(formData.get("vatRate") || 19);
  const notes = String(formData.get("notes") || "");
  const items = parseItems(formData);
  const totals = totalsFromItems(items, vatRate);

  await prisma.$transaction([
    prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
    prisma.quote.update({
      where: { id },
      data: {
        date,
        validUntil,
        vatRate,
        ...totals,
        notes,
        items: { create: items.map((it, idx) => ({ ...it, order: idx })) },
      },
    }),
  ]);

  revalidatePath("/angebote");
  revalidatePath(`/angebote/${id}`);
}

export async function setQuoteStatus(id: string, status: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED") {
  const data: Record<string, unknown> = { status };
  if (status === "ACCEPTED") data.acceptedAt = new Date();
  if (status === "DECLINED") data.declinedAt = new Date();
  await prisma.quote.update({ where: { id }, data });
  revalidatePath("/angebote");
  revalidatePath(`/angebote/${id}`);
}

export async function deleteQuote(id: string) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/angebote");
  redirect("/angebote");
}

export async function convertQuoteToInvoice(id: string) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true } });
  if (!quote) throw new Error("Angebot nicht gefunden");
  if (quote.invoice) throw new Error("Angebot bereits in Rechnung umgewandelt");

  const number = await nextInvoiceNumber();
  const settings = await prisma.businessSettings.findFirst();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (settings?.paymentTermsDays ?? 14));

  const invoice = await prisma.invoice.create({
    data: {
      number,
      date: new Date(),
      dueDate,
      kind: "STANDARD",
      status: "DRAFT",
      vatRate: quote.vatRate,
      subtotal: quote.subtotal,
      vatAmount: quote.vatAmount,
      total: quote.total,
      notes: quote.notes,
      customerId: quote.customerId,
      sourceQuoteId: quote.id,
      items: {
        create: quote.items.map((it) => ({
          details: it.details,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          order: it.order,
        })),
      },
    },
  });

  // Mark quote as accepted if it isn't already.
  if (quote.status !== "ACCEPTED") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  }

  revalidatePath("/angebote");
  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoice.id}`);
}
