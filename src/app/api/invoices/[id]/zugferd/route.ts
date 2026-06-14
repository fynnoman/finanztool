import { prisma } from "@/lib/db";
import { buildZugferdXml } from "@/lib/zugferd";

// Returns the ZUGFeRD/Factur-X CII XML for the invoice.
// Phase 2 will embed this into the PDF/A-3 (factur-x.xml) for full E-Rechnung
// conformance. For now this gives the user a downloadable structured XML.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { order: "asc" } } },
  });
  if (!invoice) return new Response("Not found", { status: 404 });
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) return new Response("Bitte erst Stammdaten ausfüllen.", { status: 400 });

  const xml = buildZugferdXml({
    number: invoice.number,
    date: invoice.date,
    dueDate: invoice.dueDate,
    buyer: {
      name: invoice.customer.company || invoice.customer.name,
      address: invoice.customer.address.split("\n")[0] ?? "",
      taxId: invoice.customer.taxId || undefined,
      countryCode: "DE",
    },
    seller: {
      name: settings.businessName,
      address: settings.businessAddress.split("\n")[0] ?? "",
      taxId: settings.taxId || undefined,
      iban: settings.iban || undefined,
      bic: settings.bic || undefined,
      countryCode: "DE",
    },
    items: invoice.items.map((it) => ({ name: it.details, quantity: it.quantity, unitPrice: it.unitPrice })),
    vatRate: invoice.vatRate,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${invoice.number}-zugferd.xml"`,
    },
  });
}
