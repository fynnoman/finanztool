"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { totalsFromItems, round2 } from "@/lib/money";
import { nextInvoiceNumber } from "@/lib/numbering";

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

export async function createInvoice(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  if (!customerId) throw new Error("Kunde fehlt");
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const dueRaw = String(formData.get("dueDate") || "");
  const dueDate = dueRaw ? new Date(dueRaw) : null;
  const vatRate = Number(formData.get("vatRate") || 19);
  const notes = String(formData.get("notes") || "");
  const kind = String(formData.get("kind") || "STANDARD") as "STANDARD" | "ABSCHLAG" | "SCHLUSS";
  const parentInvoiceId = String(formData.get("parentInvoiceId") || "") || null;
  const items = parseItems(formData);

  let totals = totalsFromItems(items, vatRate);

  // For Schluss-Rechnung: subtract sum of Abschläge from gross total.
  if (kind === "SCHLUSS" && parentInvoiceId) {
    const previousAbschlaege = await prisma.invoice.findMany({
      where: { parentInvoiceId, kind: "ABSCHLAG" },
    });
    const deduction = previousAbschlaege.reduce((s, i) => s + i.total, 0);
    totals = { ...totals, total: round2(totals.total - deduction) };
  }

  const number = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      number,
      date,
      dueDate,
      kind,
      status: "DRAFT",
      vatRate,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      notes,
      customerId,
      parentInvoiceId: parentInvoiceId || undefined,
      items: { create: items.map((it, idx) => ({ ...it, order: idx })) },
    },
  });

  // Create calendar deadline event.
  if (dueDate) {
    await prisma.calendarEvent.create({
      data: {
        title: `Zahlung fällig: ${number}`,
        start: dueDate,
        end: dueDate,
        allDay: true,
        kind: "ZAHLUNGSFRIST",
        customerId,
        invoiceId: invoice.id,
      },
    });
  }

  revalidatePath("/rechnungen");
  redirect(`/rechnungen/${invoice.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const date = new Date(String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  const dueRaw = String(formData.get("dueDate") || "");
  const dueDate = dueRaw ? new Date(dueRaw) : null;
  const vatRate = Number(formData.get("vatRate") || 19);
  const notes = String(formData.get("notes") || "");
  const items = parseItems(formData);

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Rechnung nicht gefunden");

  let totals = totalsFromItems(items, vatRate);
  if (invoice.kind === "SCHLUSS" && invoice.parentInvoiceId) {
    const previousAbschlaege = await prisma.invoice.findMany({
      where: { parentInvoiceId: invoice.parentInvoiceId, kind: "ABSCHLAG", NOT: { id } },
    });
    const deduction = previousAbschlaege.reduce((s, i) => s + i.total, 0);
    totals = { ...totals, total: round2(totals.total - deduction) };
  }

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
    prisma.invoice.update({
      where: { id },
      data: {
        date,
        dueDate,
        vatRate,
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        notes,
        items: { create: items.map((it, idx) => ({ ...it, order: idx })) },
      },
    }),
  ]);

  // Sync deadline event.
  await prisma.calendarEvent.deleteMany({ where: { invoiceId: id, kind: "ZAHLUNGSFRIST" } });
  if (dueDate) {
    await prisma.calendarEvent.create({
      data: {
        title: `Zahlung fällig: ${invoice.number}`,
        start: dueDate,
        end: dueDate,
        allDay: true,
        kind: "ZAHLUNGSFRIST",
        customerId: invoice.customerId,
        invoiceId: id,
      },
    });
  }

  revalidatePath("/rechnungen");
  revalidatePath(`/rechnungen/${id}`);
}

export async function setInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PARTIAL_PAID" | "PAID" | "OVERDUE" | "CANCELLED") {
  const data: Record<string, unknown> = { status };
  if (status === "PAID") {
    const inv = await prisma.invoice.findUnique({ where: { id } });
    data.paidAt = new Date();
    data.paidAmount = inv?.total ?? 0;
  }
  await prisma.invoice.update({ where: { id }, data });
  revalidatePath("/rechnungen");
  revalidatePath(`/rechnungen/${id}`);
}

export async function recordPayment(id: string, formData: FormData) {
  const amount = Number(String(formData.get("amount")).replace(",", ".")) || 0;
  if (amount <= 0) throw new Error("Betrag muss größer als 0 sein.");
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) throw new Error("Rechnung nicht gefunden");
  const newPaid = round2(Math.min(inv.paidAmount + amount, inv.total));
  const status = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL_PAID" : inv.status;
  await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      status,
      paidAt: status === "PAID" ? new Date() : inv.paidAt,
    },
  });
  revalidatePath(`/rechnungen/${id}`);
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/rechnungen");
  redirect("/rechnungen");
}
