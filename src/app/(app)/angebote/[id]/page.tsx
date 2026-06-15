import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatEUR } from "@/lib/money";
import { fmtDate, toInputDate } from "@/lib/dates";
import { DocumentComposer } from "@/components/DocumentComposer";
import { updateQuote, setQuoteStatus, deleteQuote, convertQuoteToInvoice } from "../actions";
import { Trash2, FileDown, ArrowRight } from "lucide-react";
import { ConfirmButton } from "@/components/ConfirmButton";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Entwurf", cls: "pill-gray" },
  SENT: { label: "Versendet", cls: "pill-blue" },
  ACCEPTED: { label: "Angenommen", cls: "pill-green" },
  DECLINED: { label: "Abgelehnt", cls: "pill-rose" },
  EXPIRED: { label: "Abgelaufen", cls: "pill-gray" },
};

export default async function AngebotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { order: "asc" } }, invoice: true },
  });
  if (!quote) notFound();
  const s = STATUS_LABELS[quote.status] ?? STATUS_LABELS.DRAFT;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Link href="/angebote" className="text-sm text-ink-400 hover:underline">← Angebote</Link>
          <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-medium">
            {quote.number}
            <span className={s.cls}>{s.label}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            für <Link href={`/kunden/${quote.customer.id}`} className="text-ink-700 hover:underline">{quote.customer.name}</Link> · vom {fmtDate(quote.date)}
            {quote.validUntil && <> · gültig bis {fmtDate(quote.validUntil)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/quotes/${quote.id}/pdf`} className="btn btn-outline" target="_blank" rel="noreferrer">
            <FileDown size={14} /> PDF
          </a>
          {!quote.invoice && (
            <form action={convertQuoteToInvoice.bind(null, quote.id)}>
              <button type="submit" className="btn btn-accent">
                <ArrowRight size={14} /> In Rechnung umwandeln
              </button>
            </form>
          )}
        </div>
      </header>

      {quote.invoice && (
        <div className="panel mb-6 border-emerald-200 bg-emerald-50/40 p-4 text-sm">
          Angenommen und überführt in Rechnung{" "}
          <Link href={`/rechnungen/${quote.invoice.id}`} className="font-mono font-medium underline">
            {quote.invoice.number}
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <form action={updateQuote.bind(null, quote.id)} className="space-y-6">
            <div className="panel grid gap-4 p-6 md:grid-cols-2">
              <div>
                <label className="label">Datum</label>
                <input className="input" name="date" type="date" defaultValue={toInputDate(quote.date)} />
              </div>
              <div>
                <label className="label">Gültig bis</label>
                <input className="input" name="validUntil" type="date" defaultValue={toInputDate(quote.validUntil)} />
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="mb-4 font-display text-lg font-medium">Positionen</h2>
              <DocumentComposer
                initialItems={quote.items.map((i) => ({
                  details: i.details,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                }))}
                initialVatRate={quote.vatRate}
              />
            </div>

            <div className="panel p-6">
              <label className="label">Notiz</label>
              <textarea className="input min-h-24" name="notes" defaultValue={quote.notes} />
            </div>

            <button type="submit" className="btn btn-primary">Änderungen speichern</button>
          </form>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5">
            <h3 className="mb-3 font-display text-base font-medium">Status setzen</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const).map((st) => (
                <form key={st} action={setQuoteStatus.bind(null, quote.id, st)}>
                  <button
                    type="submit"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-medium ${quote.status === st ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 bg-white text-ink-500 hover:border-ink-300"}`}
                  >
                    {STATUS_LABELS[st].label}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="mb-3 font-display text-base font-medium">Summe</h3>
            <Row label="Netto" value={formatEUR(quote.subtotal)} />
            <Row label={`MwSt. (${quote.vatRate}%)`} value={formatEUR(quote.vatAmount)} />
            <div className="mt-2 border-t border-ink-100 pt-2">
              <Row label="Brutto" value={formatEUR(quote.total)} bold />
            </div>
          </section>

          <form action={deleteQuote.bind(null, quote.id)}>
            <ConfirmButton
              className="btn btn-danger w-full"
              message="Angebot wirklich löschen?"
            >
              <Trash2 size={14} /> Angebot löschen
            </ConfirmButton>
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
