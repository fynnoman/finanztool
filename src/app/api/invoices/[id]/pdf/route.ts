import { prisma } from "@/lib/db";
import { InvoicePdfDocument, type PdfDoc } from "@/lib/pdf";
import { renderToBuffer } from "@react-pdf/renderer";

const KIND_TITLE: Record<string, string> = {
  STANDARD: "Rechnung",
  ABSCHLAG: "Abschlagsrechnung",
  SCHLUSS: "Schlussrechnung",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { order: "asc" } }, parentInvoice: { include: { childInvoices: true } } },
  });
  if (!invoice) return new Response("Not found", { status: 404 });
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) return new Response("Bitte erst Stammdaten ausfüllen.", { status: 400 });

  // Sibling Abschläge to deduct on a Schlussrechnung
  let abschlaege: { number: string; amount: number }[] | undefined = undefined;
  if (invoice.kind === "SCHLUSS" && invoice.parentInvoiceId) {
    const sibs = await prisma.invoice.findMany({
      where: { parentInvoiceId: invoice.parentInvoiceId, kind: "ABSCHLAG" },
    });
    abschlaege = sibs.map((s) => ({ number: s.number, amount: s.total }));
  }

  const doc: PdfDoc = {
    kind: "INVOICE",
    title: KIND_TITLE[invoice.kind] ?? "Rechnung",
    number: invoice.number,
    date: invoice.date,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    business: {
      name: settings.businessName,
      address: settings.businessAddress,
      email: settings.businessEmail,
      phone: settings.businessPhone,
      taxId: settings.taxId,
      taxNumber: settings.taxNumber,
      iban: settings.iban,
      bic: settings.bic,
      bankName: settings.bankName,
      logoDataUrl: settings.logoDataUrl,
      footer: settings.invoiceFooter,
    },
    customer: {
      name: invoice.customer.name,
      company: invoice.customer.company,
      address: invoice.customer.address,
      taxId: invoice.customer.taxId,
    },
    items: invoice.items.map((it) => ({ details: it.details, quantity: it.quantity, unitPrice: it.unitPrice })),
    subtotal: invoice.subtotal,
    vatRate: invoice.vatRate,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    abschlaege,
  };

  const buffer = await renderToBuffer(InvoicePdfDocument(doc) as React.ReactElement);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
