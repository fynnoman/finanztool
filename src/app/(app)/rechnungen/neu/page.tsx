import { prisma } from "@/lib/db";
import Link from "next/link";
import { createInvoice } from "../actions";
import { DocumentComposer } from "@/components/DocumentComposer";
import { SubmitButton } from "@/components/SubmitButton";
import { toInputDate, addDays } from "@/lib/dates";

export default async function NeueRechnungPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; parent?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const [customers, settings, parentInvoice] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.businessSettings.findFirst(),
    sp.parent
      ? prisma.invoice.findUnique({ where: { id: sp.parent }, include: { childInvoices: true } })
      : Promise.resolve(null),
  ]);

  if (customers.length === 0) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-2xl">Erst einen Kunden anlegen</h1>
        <Link href="/kunden/neu" className="btn btn-primary mt-4 inline-flex">Kunde anlegen →</Link>
      </div>
    );
  }

  const today = new Date();
  const defaultKind = (sp.kind || "STANDARD") as "STANDARD" | "ABSCHLAG" | "SCHLUSS";

  return (
    <div>
      <header className="mb-6">
        <Link href="/rechnungen" className="text-sm text-ink-400 hover:underline">← Rechnungen</Link>
        <h1 className="mt-2 font-display text-3xl font-medium">Neue Rechnung</h1>
      </header>

      <form action={createInvoice} className="space-y-6">
        <input type="hidden" name="parentInvoiceId" value={sp.parent ?? ""} />

        <div className="panel grid gap-4 p-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="label">Kunde *</label>
            <select className="input" name="customerId" defaultValue={sp.customerId ?? parentInvoice?.customerId ?? ""} required>
              <option value="" disabled>Bitte wählen</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Art</label>
            <select className="input" name="kind" defaultValue={defaultKind}>
              <option value="STANDARD">Rechnung</option>
              <option value="ABSCHLAG">Abschlagsrechnung</option>
              <option value="SCHLUSS">Schlussrechnung</option>
            </select>
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" name="date" type="date" defaultValue={toInputDate(today)} />
          </div>
          <div>
            <label className="label">Fällig am</label>
            <input className="input" name="dueDate" type="date" defaultValue={toInputDate(addDays(today, settings?.paymentTermsDays ?? 14))} />
          </div>
        </div>

        {parentInvoice && (
          <div className="panel border-bronze-200 bg-bronze-50/40 p-4 text-sm">
            <strong>Hinweis:</strong> Diese Rechnung wird als <em>{defaultKind === "SCHLUSS" ? "Schluss-" : "Abschlags-"}rechnung</em> der ursprünglichen Rechnung{" "}
            <Link href={`/rechnungen/${parentInvoice.id}`} className="font-mono underline">{parentInvoice.number}</Link> zugeordnet.
            {defaultKind === "SCHLUSS" && parentInvoice.childInvoices.length > 0 && (
              <> Bereits geleistete Abschläge werden vom Brutto-Betrag abgezogen.</>
            )}
          </div>
        )}

        <div className="panel p-6">
          <h2 className="mb-4 font-display text-lg font-medium">Positionen</h2>
          <DocumentComposer initialVatRate={settings?.vatRate ?? 19} />
        </div>

        <div className="panel p-6">
          <label className="label">Notiz / Zusatztext</label>
          <textarea className="input min-h-24" name="notes" placeholder="Optional" />
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/rechnungen" className="btn btn-outline">Abbrechen</Link>
          <SubmitButton pendingLabel="Lege an…">Rechnung anlegen</SubmitButton>
        </div>
      </form>
    </div>
  );
}
