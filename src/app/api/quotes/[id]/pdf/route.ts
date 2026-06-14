import { prisma } from "@/lib/db";
import { InvoicePdfDocument, type PdfDoc } from "@/lib/pdf";
import { renderToBuffer } from "@react-pdf/renderer";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { order: "asc" } } },
  });
  if (!quote) return new Response("Not found", { status: 404 });
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) return new Response("Bitte erst Stammdaten ausfüllen.", { status: 400 });

  const doc: PdfDoc = {
    kind: "QUOTE",
    title: "Angebot",
    number: quote.number,
    date: quote.date,
    validUntil: quote.validUntil,
    notes: quote.notes,
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
      name: quote.customer.name,
      company: quote.customer.company,
      address: quote.customer.address,
      taxId: quote.customer.taxId,
    },
    items: quote.items.map((it) => ({ details: it.details, quantity: it.quantity, unitPrice: it.unitPrice })),
    subtotal: quote.subtotal,
    vatRate: quote.vatRate,
    vatAmount: quote.vatAmount,
    total: quote.total,
  };

  const buffer = await renderToBuffer(InvoicePdfDocument(doc) as React.ReactElement);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
    },
  });
}
