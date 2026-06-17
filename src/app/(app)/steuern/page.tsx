import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { KpiCard } from "@/components/KpiCard";
import { germanIncomeTax, soli } from "@/lib/tax";
import { startOfYear, endOfYear, startOfMonth, endOfMonth, addMonths, format } from "date-fns";
import { de } from "date-fns/locale";
import { upcomingDeadlines, daysUntil } from "@/lib/tax-deadlines";
import { fmtDate } from "@/lib/dates";
import { CalendarClock, AlertCircle } from "lucide-react";

export default async function SteuernPage() {
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());

  const [yearInvoices, yearExpenses, yearCash] = await Promise.all([
    prisma.invoice.findMany({
      where: { date: { gte: yearStart, lte: yearEnd }, status: { not: "CANCELLED" } },
      orderBy: { date: "asc" },
    }),
    prisma.deductibleExpense.findMany({ where: { date: { gte: yearStart, lte: yearEnd } } }),
    prisma.cashIncome.findMany({ where: { date: { gte: yearStart, lte: yearEnd } } }),
  ]);

  const grossYear = yearInvoices.reduce((s, i) => s + i.total, 0);
  const netYear = yearInvoices.reduce((s, i) => s + i.subtotal, 0);
  const vatCollected = yearInvoices.reduce((s, i) => s + i.vatAmount, 0);

  const expenseNet = yearExpenses.reduce((s, e) => s + e.net, 0);
  const vorsteuer = yearExpenses.reduce((s, e) => s + e.vatAmount, 0);
  const cashYear = yearCash.reduce((s, c) => s + c.amount, 0);

  // Reingewinn für ESt (vereinfacht): (Netto Rechnungen + Bar) - Netto Ausgaben
  const zvE = Math.max(0, netYear + cashYear - expenseNet);
  const est = germanIncomeTax(zvE);
  const soliAmount = soli(est);
  const ustZahllast = Math.max(0, vatCollected - vorsteuer);
  const totalTaxBurden = est + soliAmount + ustZahllast;
  const profitAfter = zvE - est - soliAmount;

  // Monthly USt breakdown for the current year.
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = startOfMonth(addMonths(yearStart, i));
    const end = endOfMonth(start);
    const ms = yearInvoices.filter((inv) => inv.date >= start && inv.date <= end);
    return {
      label: format(start, "LLLL", { locale: de }),
      net: ms.reduce((s, x) => s + x.subtotal, 0),
      vat: ms.reduce((s, x) => s + x.vatAmount, 0),
      gross: ms.reduce((s, x) => s + x.total, 0),
    };
  });

  const allDeadlines = upcomingDeadlines(new Date(), 12, 6);
  const upcoming = allDeadlines.filter((d) => daysUntil(d.date) >= 0).slice(0, 6);
  const past = allDeadlines.filter((d) => daysUntil(d.date) < 0).slice(-6).reverse();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium">Steuern · {format(new Date(), "yyyy")}</h1>
        <p className="mt-1 text-sm text-ink-400">
          Schätzung auf Basis der Rechnungen des laufenden Jahres. Keine rechtsverbindliche Berechnung — bitte vom Steuerberater prüfen lassen.
        </p>
      </header>

      <section className="mb-8 panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-100 bg-bronze-50/40 px-5 py-4">
          <CalendarClock size={18} className="text-bronze-700" />
          <h2 className="font-display text-lg font-medium">Anstehende Fristen</h2>
        </div>
        <ul className="divide-y divide-ink-100">
          {upcoming.map((d) => {
            const days = daysUntil(d.date);
            const urgent = days <= 14;
            return (
              <li key={d.id} className="flex items-start gap-4 px-5 py-3">
                <div className="w-20 shrink-0">
                  <div className={`font-display text-2xl font-medium num ${urgent ? "text-rose-700" : "text-ink-700"}`}>
                    {days}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-400">Tage</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-ink-900">{d.title}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{d.description}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium num">{fmtDate(d.date)}</div>
                  {urgent && (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-rose-600">
                      <AlertCircle size={11} /> dringend
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {past.length > 0 && (
        <section className="mb-8 panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50 px-5 py-4">
            <CalendarClock size={18} className="text-ink-400" />
            <h2 className="font-display text-lg font-medium text-ink-700">Vergangene Fristen</h2>
          </div>
          <ul className="divide-y divide-ink-100">
            {past.map((d) => {
              const days = -daysUntil(d.date);
              return (
                <li key={d.id} className="flex items-start gap-4 px-5 py-3 text-ink-500">
                  <div className="w-20 shrink-0">
                    <div className="font-display text-2xl font-medium num text-ink-400">
                      -{days}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-400">Tage her</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{d.title}</div>
                    <div className="mt-0.5 text-xs">{d.description}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm num">{fmtDate(d.date)}</div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Netto-Umsatz" value={formatEUR(netYear)} tone="accent" hint={`${yearInvoices.length} Rechnungen`} />
        <KpiCard label="Bareinnahmen" value={formatEUR(cashYear)} tone={cashYear > 0 ? "positive" : "muted"} />
        <KpiCard label="Ausgaben (Netto)" value={formatEUR(expenseNet)} tone="muted" hint={`Brutto ${formatEUR(yearExpenses.reduce((s, e) => s + e.gross, 0))}`} />
        <KpiCard label="Zu versteuern (zvE)" value={formatEUR(zvE)} tone="accent" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="MwSt. (Soll)" value={formatEUR(vatCollected)} tone="muted" hint="aus Rechnungen" />
        <KpiCard label="Vorsteuer" value={formatEUR(vorsteuer)} tone="muted" hint="aus Ausgaben" />
        <KpiCard label="USt-Zahllast" value={formatEUR(ustZahllast)} tone={ustZahllast > 0 ? "danger" : "muted"} />
        <KpiCard label="ESt + Soli" value={formatEUR(est + soliAmount)} tone={est > 0 ? "danger" : "muted"} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Gesamt-Steuerlast" value={formatEUR(totalTaxBurden)} tone="danger" />
        <KpiCard label="Gewinn n. Steuern" value={formatEUR(profitAfter)} tone={profitAfter < 0 ? "danger" : "positive"} />
        <KpiCard label="Effektiver Steuersatz" value={zvE > 0 ? `${Math.round(((est + soliAmount) / zvE) * 100)}%` : "—"} tone="muted" />
        <KpiCard label="Brutto-Umsatz" value={formatEUR(grossYear)} tone="muted" />
      </div>

      <section className="mt-8 panel overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-display text-lg font-medium">USt-Voranmeldung (vereinfacht)</h2>
          <p className="text-xs text-ink-400">Monatswerte für die Übergabe an Steuerberater oder Elster.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Monat</th>
              <th className="px-4 py-2 text-right font-medium">Netto</th>
              <th className="px-4 py-2 text-right font-medium">MwSt.</th>
              <th className="px-4 py-2 text-right font-medium">Brutto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {months.map((m) => (
              <tr key={m.label} className={m.net === 0 ? "text-ink-400" : ""}>
                <td className="px-4 py-2 capitalize">{m.label}</td>
                <td className="px-4 py-2 text-right num">{formatEUR(m.net)}</td>
                <td className="px-4 py-2 text-right num">{formatEUR(m.vat)}</td>
                <td className="px-4 py-2 text-right num font-medium">{formatEUR(m.gross)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-ink-200 bg-ink-50 font-medium">
              <td className="px-4 py-2">Summe</td>
              <td className="px-4 py-2 text-right num">{formatEUR(netYear)}</td>
              <td className="px-4 py-2 text-right num">{formatEUR(vatCollected)}</td>
              <td className="px-4 py-2 text-right num">{formatEUR(grossYear)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
