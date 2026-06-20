import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtDate, toInputDate } from "@/lib/dates";
import { createCashIncome, deleteCashIncome } from "./actions";
import { Trash2, Plus } from "lucide-react";
import { SubmitButton } from "@/components/SubmitButton";
import { startOfYear, endOfYear } from "date-fns";

export default async function BareinnahmenPage() {
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const [items, agg, customers] = await Promise.all([
    prisma.cashIncome.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { customer: true },
    }),
    prisma.cashIncome.aggregate({
      where: { date: { gte: yearStart, lte: yearEnd } },
      _sum: { amount: true },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">Bar bekommen</h1>
          <p className="mt-1 text-sm text-ink-400">
            {formatEUR(agg._sum.amount ?? 0)} in diesem Jahr · Geld, das du ohne Rechnung bekommen hast.
          </p>
        </div>
      </header>

      <form action={createCashIncome} className="panel mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Neuer Bar-Eintrag</h2>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="label">Wofür *</label>
            <input className="input" name="details" required placeholder="z. B. Beratungs-Termin" />
          </div>
          <div>
            <label className="label">Betrag (€) *</label>
            <input className="input" name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" name="date" type="date" defaultValue={toInputDate(new Date())} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Kunde (optional)</label>
            <select className="input" name="customerId" defaultValue="">
              <option value="">— kein —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-6">
            <label className="label">Notiz</label>
            <input className="input" name="notes" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <SubmitButton pendingLabel="Speichere…">
            <Plus size={14} /> Speichern
          </SubmitButton>
        </div>
      </form>

      <div className="panel overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Noch nix bar bekommen.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Datum</th>
                <th className="px-4 py-2 text-left font-medium">Wofür</th>
                <th className="px-4 py-2 text-left font-medium">Kunde</th>
                <th className="px-4 py-2 text-right font-medium">Betrag</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-2 text-ink-500">{fmtDate(c.date)}</td>
                  <td className="px-4 py-2 font-medium">{c.details}</td>
                  <td className="px-4 py-2 text-ink-500">{c.customer?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-right num font-medium">{formatEUR(c.amount)}</td>
                  <td className="px-2 py-2">
                    <form action={deleteCashIncome.bind(null, c.id)}>
                      <button type="submit" className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
