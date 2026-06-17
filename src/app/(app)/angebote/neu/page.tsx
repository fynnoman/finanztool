import { prisma } from "@/lib/db";
import Link from "next/link";
import { createQuote } from "../actions";
import { DocumentComposer } from "@/components/DocumentComposer";
import { SubmitButton } from "@/components/SubmitButton";
import { toInputDate, addDays } from "@/lib/dates";

export default async function NeuesAngebotPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const sp = await searchParams;
  const [customers, settings] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.businessSettings.findFirst(),
  ]);

  if (customers.length === 0) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <h1 className="font-display text-2xl">Erst einen Kunden anlegen</h1>
        <p className="mt-2 text-ink-400">Für ein Angebot brauchst du einen Kunden.</p>
        <Link href="/kunden/neu" className="btn btn-primary mt-4 inline-flex">
          Kunde anlegen →
        </Link>
      </div>
    );
  }

  const today = new Date();
  return (
    <div>
      <header className="mb-6">
        <Link href="/angebote" className="text-sm text-ink-400 hover:underline">
          ← Angebote
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium">Neues Angebot</h1>
      </header>

      <form action={createQuote} className="space-y-6">
        <div className="panel grid gap-4 p-6 md:grid-cols-3">
          <div>
            <label className="label">Kunde *</label>
            <select className="input" name="customerId" defaultValue={sp.customerId ?? ""} required>
              <option value="" disabled>Bitte wählen</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" name="date" type="date" defaultValue={toInputDate(today)} />
          </div>
          <div>
            <label className="label">Gültig bis</label>
            <input className="input" name="validUntil" type="date" defaultValue={toInputDate(addDays(today, 30))} />
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="mb-4 font-display text-lg font-medium">Positionen</h2>
          <DocumentComposer initialVatRate={settings?.vatRate ?? 19} />
        </div>

        <div className="panel p-6">
          <label className="label">Notiz / Begleittext</label>
          <textarea className="input min-h-24" name="notes" placeholder="Optional — z. B. Erläuterung zur Leistung" />
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/angebote" className="btn btn-outline">Abbrechen</Link>
          <SubmitButton pendingLabel="Lege an…">Angebot anlegen</SubmitButton>
        </div>
      </form>
    </div>
  );
}
