import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtMonth } from "@/lib/dates";
import { KpiCard } from "@/components/KpiCard";
import { RangePicker } from "./RangePicker";
import { resolveRange, RangeKey } from "@/lib/range";
import { germanIncomeTax, soli } from "@/lib/tax";
import { startOfYear, endOfYear, addMonths, startOfMonth } from "date-fns";
import Link from "next/link";
import { Suggestions } from "./Suggestions";

type SearchParams = { r?: string; m?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rangeKey = (sp.r as RangeKey) || "month";
  const monthOffset = Number(sp.m ?? "0");
  const { start, end } = resolveRange(rangeKey, monthOffset);

  const invoiceWhere = {
    AND: [
      start ? { date: { gte: start } } : {},
      end ? { date: { lt: end } } : {},
      { status: { not: "CANCELLED" } },
    ],
  };
  const quoteWhere = {
    AND: [
      start ? { date: { gte: start } } : {},
      end ? { date: { lt: end } } : {},
    ],
  };

  const cashWhere = {
    AND: [
      start ? { date: { gte: start } } : {},
      end ? { date: { lt: end } } : {},
    ],
  };
  const expenseWhere = cashWhere;

  const [invoices, quotes, customers, yearInvoices, cashIncomes, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: invoiceWhere }),
    prisma.quote.findMany({ where: quoteWhere }),
    prisma.customer.count(),
    prisma.invoice.findMany({
      where: {
        date: { gte: startOfYear(new Date()), lte: endOfYear(new Date()) },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.cashIncome.findMany({ where: cashWhere }),
    prisma.deductibleExpense.findMany({ where: expenseWhere }),
  ]);

  const cashTotal = cashIncomes.reduce((s, c) => s + c.amount, 0);
  const expenseGross = expenses.reduce((s, e) => s + e.gross, 0);
  const vorsteuer = expenses.reduce((s, e) => s + e.vatAmount, 0);

  const grossTotal = invoices.reduce((s, i) => s + i.total, 0);
  const netTotal = invoices.reduce((s, i) => s + i.subtotal, 0);
  const vatTotal = invoices.reduce((s, i) => s + i.vatAmount, 0);
  const paidTotal = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const openTotal = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  const openQuotes = quotes
    .filter((q) => q.status === "SENT" || q.status === "DRAFT")
    .reduce((s, q) => s + q.total, 0);

  // Steuer-Anteil im Range (geschätzt): ESt anteilig zum Jahresgewinn.
  const yearNet = yearInvoices.reduce((s, i) => s + i.subtotal, 0);
  const yearTax = germanIncomeTax(yearNet) + soli(germanIncomeTax(yearNet));
  const rangeEstShare = yearNet > 0 ? netTotal / yearNet : 0;
  const incomeTaxOnRange = Math.round(yearTax * rangeEstShare);
  // Reingewinn-Schätzung: Brutto (Rechnungen) + Bar - Ausgaben - ESt - USt-Zahllast (Soll-Vorsteuer)
  const ustZahllast = Math.max(0, vatTotal - vorsteuer);
  const profitAfterTaxes = grossTotal + cashTotal - expenseGross - incomeTaxOnRange - ustZahllast;

  const rangeLabel =
    rangeKey === "year"
      ? "Dieses Jahr"
      : rangeKey === "all"
      ? "Alles zusammen"
      : fmtMonth(addMonths(startOfMonth(new Date()), monthOffset));

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium">Hi, Kevin 👋</h1>
          <p className="mt-1 text-sm text-ink-400">
            Hier ist dein Überblick für <span className="font-medium text-ink-700">{rangeLabel}</span> · {invoices.length} Rechnungen · {quotes.length} Angebote
          </p>
        </div>
        <RangePicker rangeKey={rangeKey} monthOffset={monthOffset} />
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Eingenommen" value={formatEUR(grossTotal)} tone="accent" hint={`${invoices.length} Rechnungen`} />
        <KpiCard label="Bar bekommen" value={formatEUR(cashTotal)} tone={cashTotal > 0 ? "positive" : "muted"} />
        <KpiCard label="Ausgegeben" value={formatEUR(expenseGross)} tone="muted" hint={`MwSt. zurück ${formatEUR(vorsteuer)}`} />
        <KpiCard
          label="Übrig nach Steuern"
          value={formatEUR(profitAfterTaxes)}
          tone={profitAfterTaxes < 0 ? "danger" : "positive"}
          hint={`Einkommensteuer ${formatEUR(incomeTaxOnRange)} · MwSt. ans Finanzamt ${formatEUR(ustZahllast)}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Netto" value={formatEUR(netTotal)} tone="muted" />
        <KpiCard label="MwSt." value={formatEUR(vatTotal)} tone="muted" />
        <KpiCard label="Schon bezahlt" value={formatEUR(paidTotal)} tone="positive" />
        <KpiCard label="Noch offen" value={formatEUR(openTotal)} tone={openTotal > 0 ? "danger" : "muted"} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Angebote offen" value={formatEUR(openQuotes)} tone="muted" hint={`${quotes.filter((q) => q.status === "SENT").length} verschickt`} />
        <KpiCard label="Kunden" value={String(customers)} tone="muted" />
        <KpiCard label="Bar-Einträge" value={String(cashIncomes.length)} tone="muted" />
        <KpiCard label="Belege" value={String(expenses.length)} tone="muted" />
      </div>

      <div className="mt-8">
        <Suggestions />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <RecentInvoices rangeStart={start} rangeEnd={end} />
        <RecentQuotes rangeStart={start} rangeEnd={end} />
      </div>
    </div>
  );
}

async function RecentInvoices({ rangeStart, rangeEnd }: { rangeStart?: Date; rangeEnd?: Date }) {
  const items = await prisma.invoice.findMany({
    where: {
      AND: [
        rangeStart ? { date: { gte: rangeStart } } : {},
        rangeEnd ? { date: { lt: rangeEnd } } : {},
        { status: { not: "CANCELLED" } },
      ],
    },
    orderBy: { date: "desc" },
    take: 6,
    include: { customer: true },
  });

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Letzte Rechnungen</h2>
        <Link href="/rechnungen" className="text-sm text-bronze-700 hover:underline">
          Alle ansehen →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">Noch keine Rechnungen in dieser Zeit.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <Link href={`/rechnungen/${inv.id}`} className="text-sm font-medium hover:underline">
                  {inv.number}
                </Link>
                <div className="truncate text-xs text-ink-400">{inv.customer.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium num">{formatEUR(inv.total)}</div>
                <StatusPill status={inv.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function RecentQuotes({ rangeStart, rangeEnd }: { rangeStart?: Date; rangeEnd?: Date }) {
  const items = await prisma.quote.findMany({
    where: {
      AND: [
        rangeStart ? { date: { gte: rangeStart } } : {},
        rangeEnd ? { date: { lt: rangeEnd } } : {},
      ],
    },
    orderBy: { date: "desc" },
    take: 6,
    include: { customer: true },
  });

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Letzte Angebote</h2>
        <Link href="/angebote" className="text-sm text-bronze-700 hover:underline">
          Alle ansehen →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">Noch keine Angebote in dieser Zeit.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((q) => (
            <li key={q.id} className="flex items-center justify-between py-2.5">
              <div className="min-w-0">
                <Link href={`/angebote/${q.id}`} className="text-sm font-medium hover:underline">
                  {q.number}
                </Link>
                <div className="truncate text-xs text-ink-400">{q.customer.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium num">{formatEUR(q.total)}</div>
                <QuoteStatusPill status={q.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Entwurf", cls: "pill-gray" },
    SENT: { label: "Verschickt", cls: "pill-blue" },
    PARTIAL_PAID: { label: "Teil-bezahlt", cls: "pill-amber" },
    PAID: { label: "Bezahlt", cls: "pill-green" },
    OVERDUE: { label: "Zu spät", cls: "pill-rose" },
    CANCELLED: { label: "Abgesagt", cls: "pill-gray" },
  };
  const s = map[status] ?? { label: status, cls: "pill-gray" };
  return <span className={s.cls}>{s.label}</span>;
}

function QuoteStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Entwurf", cls: "pill-gray" },
    SENT: { label: "Verschickt", cls: "pill-blue" },
    ACCEPTED: { label: "Angenommen", cls: "pill-green" },
    DECLINED: { label: "Abgelehnt", cls: "pill-rose" },
    EXPIRED: { label: "Abgelaufen", cls: "pill-gray" },
  };
  const s = map[status] ?? { label: status, cls: "pill-gray" };
  return <span className={s.cls}>{s.label}</span>;
}
