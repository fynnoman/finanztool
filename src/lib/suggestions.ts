import { prisma } from "@/lib/db";
import { differenceInDays } from "date-fns";

export type Suggestion = {
  id: string;
  kind: "overdue" | "stale" | "quote_expiring" | "quote_unanswered" | "upsell" | "info";
  customerId?: string;
  customerName?: string;
  headline: string;
  reason: string;
  amount?: number;
  href?: string;
  badge?: string;
};

/**
 * Build deterministic, fast-to-compute reminders based on hard data.
 * Always runs and never depends on the AI being available.
 */
export async function buildHeuristicSuggestions(): Promise<Suggestion[]> {
  const now = new Date();
  const [invoices, quotes, customers] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "PARTIAL_PAID", "OVERDUE"] } },
      include: { customer: true },
    }),
    prisma.quote.findMany({
      where: { status: { in: ["DRAFT", "SENT"] } },
      include: { customer: true },
    }),
    prisma.customer.findMany({
      include: { invoices: { orderBy: { date: "desc" }, take: 1 } },
    }),
  ]);

  const out: Suggestion[] = [];

  // 1. Overdue invoices
  for (const inv of invoices) {
    if (!inv.dueDate) continue;
    const days = differenceInDays(now, inv.dueDate);
    if (days <= 0) continue;
    const outstanding = inv.total - inv.paidAmount;
    if (outstanding <= 0) continue;
    out.push({
      id: `overdue-${inv.id}`,
      kind: "overdue",
      customerId: inv.customerId,
      customerName: inv.customer.name,
      headline: `Rechnung ${inv.number} überfällig`,
      reason: `Seit ${days} Tagen offen · ${inv.customer.name}`,
      amount: outstanding,
      href: `/rechnungen/${inv.id}`,
      badge: "Mahnen",
    });
  }

  // 2. Stale customers — no invoice in 120+ days but had at least one before
  for (const c of customers) {
    if (c.invoices.length === 0) continue;
    const last = c.invoices[0].date;
    const days = differenceInDays(now, last);
    if (days > 120 && days < 730) {
      out.push({
        id: `stale-${c.id}`,
        kind: "stale",
        customerId: c.id,
        customerName: c.name,
        headline: `${c.name} reaktivieren`,
        reason: `Letzte Rechnung vor ${days} Tagen — passenden Service / Wartung anbieten`,
        href: `/kunden/${c.id}`,
        badge: "Anbieten",
      });
    }
  }

  // 3. Quotes expiring in <= 7 days
  for (const q of quotes) {
    if (!q.validUntil) continue;
    const days = differenceInDays(q.validUntil, now);
    if (days >= 0 && days <= 7) {
      out.push({
        id: `quote-exp-${q.id}`,
        kind: "quote_expiring",
        customerId: q.customerId,
        customerName: q.customer.name,
        headline: `Angebot ${q.number} läuft in ${days} Tagen ab`,
        reason: `${q.customer.name} nachfassen`,
        amount: q.total,
        href: `/angebote/${q.id}`,
        badge: "Nachfassen",
      });
    }
  }

  // 4. Sent quotes without answer for 14+ days
  for (const q of quotes) {
    if (q.status !== "SENT") continue;
    const days = differenceInDays(now, q.updatedAt);
    if (days >= 14) {
      out.push({
        id: `quote-unanswered-${q.id}`,
        kind: "quote_unanswered",
        customerId: q.customerId,
        customerName: q.customer.name,
        headline: `${q.number} ohne Antwort`,
        reason: `Seit ${days} Tagen versendet · ${q.customer.name}`,
        amount: q.total,
        href: `/angebote/${q.id}`,
        badge: "Kontaktieren",
      });
    }
  }

  // Sort by urgency — overdue first, then expiring, then stale.
  const rank: Record<Suggestion["kind"], number> = {
    overdue: 0,
    quote_expiring: 1,
    quote_unanswered: 2,
    stale: 3,
    upsell: 4,
    info: 5,
  };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]).slice(0, 8);
}
