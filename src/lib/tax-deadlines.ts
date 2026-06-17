import { addMonths, addYears, setDate, setMonth, startOfMonth, isAfter, isBefore } from "date-fns";

export type TaxDeadline = {
  id: string;
  date: Date;
  title: string;
  description: string;
  kind: "ust" | "est_vorauszahlung" | "est_jahres" | "gewerbe";
  recurring: "monatlich" | "quartalsweise" | "jährlich";
};

/**
 * Compute the upcoming German tax deadlines for a self-employed person
 * over the next 12 months. Assumes monthly USt-Voranmeldung (most common
 * for small businesses) — quarterly mode toggle is a future setting.
 *
 * Quellen:
 *   - § 18 UStG (USt-Voranmeldung — 10. Folgemonat)
 *   - § 37 EStG (Vorauszahlung — 10.03, 10.06, 10.09, 10.12)
 *   - § 25 EStG (Jahres-Erklärung — 31.07. des Folgejahres, mit StB 28./29.02. d. Folgejahres+1)
 *   - § 19 GewStG (Gewerbesteuer-Vorauszahlung — 15.02, 15.05, 15.08, 15.11)
 */
export function upcomingDeadlines(now: Date = new Date(), monthsAhead = 12, monthsBack = 0): TaxDeadline[] {
  const out: TaxDeadline[] = [];
  const horizonPast = monthsBack > 0 ? addMonths(now, -monthsBack) : now;

  // USt-Voranmeldung — 10. des Folgemonats, jeden Monat
  for (let i = -monthsBack; i <= monthsAhead; i++) {
    const month = addMonths(startOfMonth(now), i);
    const reportingMonth = addMonths(month, -1); // wir melden für den Vormonat
    const deadline = setDate(month, 10);
    if (isBefore(deadline, horizonPast)) continue;
    out.push({
      id: `ust-${deadline.toISOString().slice(0, 10)}`,
      date: deadline,
      title: "USt-Voranmeldung",
      description: `Voranmeldung für ${reportingMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" })} an Elster übermitteln.`,
      kind: "ust",
      recurring: "monatlich",
    });
  }

  // ESt-Vorauszahlungen — 10. März, 10. Juni, 10. Sep, 10. Dez
  const estMonths = [2, 5, 8, 11]; // 0-indexed
  for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
    const year = now.getFullYear() + yearOffset;
    for (const m of estMonths) {
      const date = new Date(year, m, 10);
      if (isBefore(date, horizonPast)) continue;
      if (isAfter(date, addMonths(now, monthsAhead))) continue;
      out.push({
        id: `est-vz-${year}-${m + 1}`,
        date,
        title: "Einkommensteuer-Vorauszahlung",
        description: `Quartals-Vorauszahlung Q${estMonths.indexOf(m) + 1} ${year} ans Finanzamt.`,
        kind: "est_vorauszahlung",
        recurring: "quartalsweise",
      });
    }
  }

  // Gewerbesteuer-Vorauszahlungen — 15.02, 15.05, 15.08, 15.11
  const gewMonths = [1, 4, 7, 10];
  for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
    const year = now.getFullYear() + yearOffset;
    for (const m of gewMonths) {
      const date = new Date(year, m, 15);
      if (isBefore(date, horizonPast)) continue;
      if (isAfter(date, addMonths(now, monthsAhead))) continue;
      out.push({
        id: `gew-${year}-${m + 1}`,
        date,
        title: "Gewerbesteuer-Vorauszahlung",
        description: `Quartals-Vorauszahlung an die zuständige Gemeinde.`,
        kind: "gewerbe",
        recurring: "quartalsweise",
      });
    }
  }

  // Einkommensteuer-Jahreserklärung — 31.07. des Folgejahres (ohne StB) bzw. Ende Feb. übernächstes Jahr (mit StB)
  // Wir zeigen die nächste reguläre Frist.
  for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
    const erklaerungsjahr = now.getFullYear() - 1 + yearOffset;
    const deadline = new Date(erklaerungsjahr + 1, 6, 31); // 31. Juli
    if (isBefore(deadline, horizonPast)) continue;
    if (isAfter(deadline, addMonths(now, monthsAhead))) continue;
    out.push({
      id: `est-jahr-${erklaerungsjahr}`,
      date: deadline,
      title: `Einkommensteuer-Erklärung ${erklaerungsjahr}`,
      description: `Jahreserklärung ${erklaerungsjahr} an Finanzamt. Mit Steuerberater bis 28.02.${erklaerungsjahr + 2}.`,
      kind: "est_jahres",
      recurring: "jährlich",
    });
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
