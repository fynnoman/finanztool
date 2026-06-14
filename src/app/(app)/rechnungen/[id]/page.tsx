import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatEUR } from "@/lib/money";
import { fmtDate, toInputDate } from "@/lib/dates";
import { DocumentComposer } from "@/components/DocumentComposer";
import { updateInvoice, setInvoiceStatus, recordPayment, deleteInvoice } from "../actions";
import { Trash2, FileDown, Plus } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Entwurf", cls: "pill-gray" },
  SENT: { label: "Versendet", cls: "pill-blue" },
  PARTIAL_PAID: { label: "Teilbezahlt", cls: "pill-amber" },
  PAID: { label: "Bezahlt", cls: "pill-green" },
  OVERDUE: { label: "Überfällig", cls: "pill-rose" },
  CANCELLED: { label: "Storniert", cls: "pill-gray" },
};

const KIND_LABELS: Record<string, string> = {
  STANDARD: "Rechnung",
  ABSCHLAG: "Abschlagsrechnung",
  SCHLUSS: "Schlussrechnung",
};

export default async function RechnungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { order: "asc" } }, childInvoices: true, parentInvoice: true, sourceQuote: true },
  });
  if (!invoice) notFound();
  const s = STATUS_LABELS[invoice.status] ?? STATUS_LABELS.DRAFT;
  const outstanding = invoice.total - invoice.paidAmount;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Link href="/rechnungen" className="text-sm text-ink-400 hover:underline">← Rechnungen</Link>
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-medium">
            {invoice.number}
            <span className={s.cls}>{s.label}</span>
            <span className="pill-bronze">{KIND_LABELS[invoice.kind] ?? invoice.kind}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            für <Link href={`/kunden/${invoice.customer.id}`} className="text-ink-700 hover:underline">{invoice.customer.name}</Link>
            {" · "}vom {fmtDate(invoice.date)}
            {invoice.dueDate && <> · fällig {fmtDate(invoice.dueDate)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/invoices/${invoice.id}/pdf`} className="btn btn-outline" target="_blank" rel="noreferrer">
            <FileDown size={14} /> PDF
          </a>
          {invoice.kind === "STANDARD" && (
            <Link href={`/rechnungen/neu?parent=${invoice.id}&kind=ABSCHLAG&customerId=${invoice.customerId}`} className="btn btn-outline">
              <Plus size={14} /> Abschlag
            </Link>
          )}
        </div>
      </header>

      {invoice.sourceQuote && (
        <div className="panel mb-6 bg-ink-50 p-3 text-sm text-ink-500">
          Aus Angebot{" "}
          <Link href={`/angebote/${invoice.sourceQuote.id}`} className="font-mono font-medium text-ink-700 underline">
            {invoice.sourceQuote.number}
          </Link>{" "}
          umgewandelt.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <form action={updateInvoice.bind(null, invoice.id)} className="space-y-6">
            <div className="panel grid gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="label">Datum</label>
                <input className="input" name="date" type="date" defaultValue={toInputDate(invoice.date)} />
              </div>
              <div>
                <label className="label">Fällig am</label>
                <input className="input" name="dueDate" type="date" defaultValue={toInputDate(invoice.dueDate)} />
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-medium">Positionen</h2>
              <DocumentComposer
                initialItems={invoice.items.map((i) => ({
                  details: i.details,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                }))}
                initialVatRate={invoice.vatRate}
              />
            </div>

            <div className="panel p-6">
              <label className="label">Notiz</label>
              <textarea className="input min-h-24" name="notes" defaultValue={invoice.notes} />
            </div>

            <button type="submit" className="btn btn-primary">Änderungen speichern</button>
          </form>

          {invoice.childInvoices.length > 0 && (
            <section className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-medium">Verknüpfte Abschläge / Schlussrechnung</h2>
              <ul className="divide-y divide-ink-100">
                {invoice.childInvoices.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <Link href={`/rechnungen/${c.id}`} className="font-mono hover:underline">{c.number}</Link>
                    <span className="text-sm text-ink-500">{KIND_LABELS[c.kind]}</span>
                    <span className="text-sm font-medium num">{formatEUR(c.total)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <h3 className="mb-3 font-display text-base font-medium">Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["DRAFT", "SENT", "PAID", "CANCELLED"] as const).map((st) => (
                <form key={st} action={setInvoiceStatus.bind(null, invoice.id, st)}>
                  <button
                    type="submit"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-medium ${invoice.status === st ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 bg-white text-ink-500 hover:border-ink-300"}`}
                  >
                    {STATUS_LABELS[st].label}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="mb-3 font-display text-base font-medium">Summe</h3>
            <Row label="Netto" value={formatEUR(invoice.subtotal)} />
            <Row label={`MwSt. (${invoice.vatRate}%)`} value={formatEUR(invoice.vatAmount)} />
            <div className="mt-2 border-t border-ink-100 pt-2">
              <Row label="Brutto" value={formatEUR(invoice.total)} bold />
            </div>
            <div className="mt-2">
              <Row label="Bezahlt" value={formatEUR(invoice.paidAmount)} />
              <Row label="Offen" value={formatEUR(outstanding)} bold />
            </div>
          </section>

          {outstanding > 0 && (
            <form action={recordPayment.bind(null, invoice.id)} className="panel space-y-2 p-5">
              <h3 className="font-display text-base font-medium">Zahlung erfassen</h3>
              <input className="input" type="number" step="0.01" name="amount" placeholder="Betrag in €" defaultValue={outstanding.toFixed(2)} />
              <button type="submit" className="btn btn-accent w-full">Zahlung buchen</button>
            </form>
          )}

          <form action={deleteInvoice.bind(null, invoice.id)}>
            <button
              type="submit"
              className="btn btn-danger w-full"
              onClick={(e) => {
                if (!confirm("Rechnung wirklich löschen?")) e.preventDefault();
              }}
            >
              <Trash2 size={14} /> Rechnung löschen
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className={`num ${bold ? "font-medium" : ""}`}>{value}</span>
    </div>
  );
}
