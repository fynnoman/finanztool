"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getOpenAI, extractInvoiceFromText } from "@/lib/openai";
import { extractPdfText, parseAnyDate, scanInvoiceDate } from "@/lib/pdf-text";
import { nextInvoiceNumber } from "@/lib/numbering";
import { round2 } from "@/lib/money";

export async function uploadInvoicePdf(customerId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Keine Datei");
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Nur PDF-Dateien sind unterstützt.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("PDF zu groß (max 8 MB).");
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Kunde nicht gefunden");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileData = buffer.toString("base64");

  // 1. PDF → text
  let pdfText: { text: string; empty: boolean };
  try {
    pdfText = await extractPdfText(buffer);
  } catch (err) {
    await prisma.uploadedInvoice.create({
      data: {
        filename: file.name,
        fileData,
        status: "ERROR",
        errorMessage: `PDF konnte nicht gelesen werden: ${(err as Error).message}`,
        customerId,
      },
    });
    revalidatePath(`/kunden/${customerId}`);
    return;
  }

  if (pdfText.empty) {
    await prisma.uploadedInvoice.create({
      data: {
        filename: file.name,
        fileData,
        status: "MANUAL",
        extractedRaw: pdfText.text,
        errorMessage: "PDF enthält keinen lesbaren Text (vermutlich Scan). Bitte Daten manuell erfassen.",
        customerId,
      },
    });
    revalidatePath(`/kunden/${customerId}`);
    return;
  }

  // 2. Text → KI extraction (optional)
  const openai = await getOpenAI();
  if (!openai) {
    await prisma.uploadedInvoice.create({
      data: {
        filename: file.name,
        fileData,
        status: "MANUAL",
        extractedRaw: pdfText.text.slice(0, 4000),
        errorMessage: "Kein OpenAI-Key hinterlegt. Datei gespeichert — Daten bitte manuell eintragen.",
        customerId,
      },
    });
    revalidatePath(`/kunden/${customerId}`);
    return;
  }

  let parsed: Awaited<ReturnType<typeof extractInvoiceFromText>>;
  try {
    parsed = await extractInvoiceFromText(pdfText.text, openai);
  } catch (err) {
    await prisma.uploadedInvoice.create({
      data: {
        filename: file.name,
        fileData,
        status: "ERROR",
        extractedRaw: pdfText.text.slice(0, 4000),
        errorMessage: `KI-Extraktion fehlgeschlagen: ${(err as Error).message}`,
        customerId,
      },
    });
    revalidatePath(`/kunden/${customerId}`);
    return;
  }

  // 3. Resolve invoice date robustly
  const aiDate = parseAnyDate(parsed.date) ?? scanInvoiceDate(pdfText.text);
  const invoiceDate = aiDate ?? new Date();

  // 4. Persist UploadedInvoice + create matching Invoice if a total was found.
  const hasTotal = typeof parsed.total === "number" && parsed.total > 0;

  if (!hasTotal) {
    await prisma.uploadedInvoice.create({
      data: {
        filename: file.name,
        fileData,
        status: "MANUAL",
        extractedRaw: pdfText.text.slice(0, 4000),
        extractedTotal: parsed.total ?? undefined,
        extractedNet: parsed.net ?? undefined,
        extractedVat: parsed.vat ?? undefined,
        extractedDate: aiDate ?? undefined,
        errorMessage: "Beträge nicht eindeutig erkannt. Bitte manuell prüfen.",
        customerId,
      },
    });
    revalidatePath(`/kunden/${customerId}`);
    return;
  }

  // Derive net/vat/vatRate
  const settings = await prisma.businessSettings.findFirst();
  const total = round2(parsed.total!);
  let net = parsed.net ?? null;
  let vat = parsed.vat ?? null;
  let vatRate = settings?.vatRate ?? 19;
  if (net !== null && vat !== null && net > 0) {
    vatRate = Math.round((vat / net) * 100);
  } else if (net !== null) {
    vat = round2(total - net);
    vatRate = net > 0 ? Math.round((vat / net) * 100) : vatRate;
  } else if (vat !== null) {
    net = round2(total - vat);
    vatRate = net > 0 ? Math.round((vat / net) * 100) : vatRate;
  } else {
    net = round2(total / (1 + vatRate / 100));
    vat = round2(total - net);
  }

  // Create the Invoice
  const number = await nextInvoiceNumber();
  const description = parsed.description?.slice(0, 100) || `Importierte Rechnung: ${file.name}`;
  const invoice = await prisma.invoice.create({
    data: {
      number,
      date: invoiceDate,
      kind: "STANDARD",
      status: "PAID", // PDF wurde uploaded → ist eine empfangene/bezahlte Rechnung. User kann ändern.
      subtotal: net,
      vatRate,
      vatAmount: vat,
      total,
      paidAmount: total,
      paidAt: invoiceDate,
      notes: `Aus PDF-Upload erkannt: ${file.name}${parsed.vendor ? ` · ${parsed.vendor}` : ""}`,
      customerId,
      items: {
        create: [
          { details: description, quantity: 1, unitPrice: net, order: 0 },
        ],
      },
    },
  });

  await prisma.uploadedInvoice.create({
    data: {
      filename: file.name,
      fileData,
      status: "PARSED",
      extractedRaw: pdfText.text.slice(0, 4000),
      extractedTotal: total,
      extractedNet: net,
      extractedVat: vat,
      extractedDate: invoiceDate,
      customerId,
      invoiceId: invoice.id,
    },
  });

  revalidatePath(`/kunden/${customerId}`);
  revalidatePath("/rechnungen");
  revalidatePath("/dashboard");
}

export async function deleteUpload(id: string) {
  const up = await prisma.uploadedInvoice.findUnique({ where: { id } });
  if (!up) return;
  if (up.invoiceId) {
    await prisma.invoice.delete({ where: { id: up.invoiceId } }).catch(() => {});
  }
  await prisma.uploadedInvoice.delete({ where: { id } });
  revalidatePath(`/kunden/${up.customerId}`);
}
