import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { Plus, Check } from "lucide-react";
import { setQuoteStatus } from "./actions";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Entwurf", cls: "pill-gray" },
  SENT: { label: "Verschickt", cls: "pill-blue" },
  ACCEPTED: { label: "Ja, machen wir", cls: "pill-green" },
  DECLINED: { label: "Abgesagt", cls: "pill-rose" },
  EXPIRED: { label: "Abgelaufen", cls: "pill-gray" },
};

export default async function AngebotePage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { date: "desc" },
    include: { customer: true },
  });
  const open = quotes.filter((q) => q.status === "DRAFT" || q.status === "SENT");
  const openValue = open.reduce((s, q) => s + q.total, 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">Angebote</h1>
          <p className="mt-1 text-sm text-ink-400">
            {quotes.length} insgesamt · {open.length} offen · {formatEUR(openValue)} möglich
          </p>
        </div>
        <Link href="/angebote/neu" className="btn btn-primary">
          <Plus size={16} /> Neues Angebot
        </Link>
      </header>

      <div className="panel overflow-hidden">
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-ink-400">
            <p>Noch keine Angebote.</p>
            <Link href="/angebote/neu" className="mt-2 inline-block text-bronze-700 hover:underline">
              Erstes Angebot anlegen →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nummer</th>
                <th className="px-4 py-3 text-left font-medium">Kunde</th>
                <th className="px-4 py-3 text-left font-medium">Datum</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Gesamt</th>
                <th className="px-4 py-3 text-center font-medium">Auftrag?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {quotes.map((q) => {
                const s = STATUS_LABELS[q.status] ?? STATUS_LABELS.DRAFT;
                return (
                  <tr key={q.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/angebote/${q.id}`} className="font-medium font-mono hover:underline">
                        {q.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/kunden/${q.customer.id}`} className="hover:underline">
                        {q.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{fmtDate(q.date)}</td>
                    <td className="px-4 py-3">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right num font-medium">{formatEUR(q.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <form action={setQuoteStatus.bind(null, q.id, q.status === "ACCEPTED" ? "SENT" : "ACCEPTED")}>
                        <button
                          type="submit"
                          aria-label={q.status === "ACCEPTED" ? "Annahme zurücknehmen" : "Als angenommen markieren"}
                          className={`inline-grid h-6 w-6 place-items-center rounded border ${q.status === "ACCEPTED" ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink-200 bg-white text-ink-300 hover:border-emerald-400"}`}
                        >
                          {q.status === "ACCEPTED" && <Check size={14} />}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
