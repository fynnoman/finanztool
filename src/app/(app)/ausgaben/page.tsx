import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtDate, toInputDate } from "@/lib/dates";
import { createExpense, deleteExpense, expenseCategories } from "./actions";
import { Trash2, Plus } from "lucide-react";
import { startOfYear, endOfYear } from "date-fns";

export default async function AusgabenPage() {
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());

  const [expenses, yearAgg] = await Promise.all([
    prisma.deductibleExpense.findMany({ orderBy: { date: "desc" }, take: 200 }),
    prisma.deductibleExpense.aggregate({
      where: { date: { gte: yearStart, lte: yearEnd } },
      _sum: { gross: true, net: true, vatAmount: true },
    }),
  ]);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">Absetzbare Ausgaben</h1>
          <p className="mt-1 text-sm text-ink-400">
            Brutto {formatEUR(yearAgg._sum.gross ?? 0)} · Vorsteuer {formatEUR(yearAgg._sum.vatAmount ?? 0)} · in diesem Jahr
          </p>
        </div>
      </header>

      <form action={createExpense} className="panel mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Neue Ausgabe</h2>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="label">Beschreibung *</label>
            <input className="input" name="details" required placeholder="z. B. Notion-Abo" />
          </div>
          <div>
            <label className="label">Brutto (€) *</label>
            <input className="input" name="gross" type="number" step="0.01" required />
          </div>
          <div>
            <label className="label">MwSt %</label>
            <input className="input" name="vatRate" type="number" step="0.1" defaultValue="19" />
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" name="date" type="date" defaultValue={toInputDate(new Date())} />
          </div>
          <div>
            <label className="label">Kategorie</label>
            <select className="input" name="category">
              {expenseCategories().map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-6">
            <label className="label">Notiz</label>
            <input className="input" name="notes" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn btn-primary">
            <Plus size={14} /> Speichern
          </button>
        </div>
      </form>

      <div className="panel overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Noch keine Ausgaben erfasst.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Datum</th>
                <th className="px-4 py-2 text-left font-medium">Beschreibung</th>
                <th className="px-4 py-2 text-left font-medium">Kategorie</th>
                <th className="px-4 py-2 text-right font-medium">Netto</th>
                <th className="px-4 py-2 text-right font-medium">MwSt.</th>
                <th className="px-4 py-2 text-right font-medium">Brutto</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-2 text-ink-500">{fmtDate(e.date)}</td>
                  <td className="px-4 py-2 font-medium">{e.details}</td>
                  <td className="px-4 py-2 text-ink-500">{e.category}</td>
                  <td className="px-4 py-2 text-right num">{formatEUR(e.net)}</td>
                  <td className="px-4 py-2 text-right num text-ink-500">{formatEUR(e.vatAmount)}</td>
                  <td className="px-4 py-2 text-right num font-medium">{formatEUR(e.gross)}</td>
                  <td className="px-2 py-2">
                    <form action={deleteExpense.bind(null, e.id)}>
                      <button type="submit" className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Löschen">
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
