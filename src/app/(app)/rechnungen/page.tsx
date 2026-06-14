import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { Plus } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Entwurf", cls: "pill-gray" },
  SENT: { label: "Versendet", cls: "pill-blue" },
  PARTIAL_PAID: { label: "Teilbezahlt", cls: "pill-amber" },
  PAID: { label: "Bezahlt", cls: "pill-green" },
  OVERDUE: { label: "Überfällig", cls: "pill-rose" },
  CANCELLED: { label: "Storniert", cls: "pill-gray" },
};

const KIND_LABELS: Record<string, string> = {
  STANDARD: "Rechnung",
  ABSCHLAG: "Abschlag",
  SCHLUSS: "Schluss",
};

export default async function RechnungenPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { date: "desc" },
    include: { customer: true },
  });

  const grossTotal = invoices.reduce((s, i) => s + i.total, 0);
  const openTotal = invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").reduce((s, i) => s + (i.total - i.paidAmount), 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">Rechnungen</h1>
          <p className="mt-1 text-sm text-ink-400">
            {invoices.length} gesamt · {formatEUR(grossTotal)} Brutto · {formatEUR(openTotal)} offen
          </p>
        </div>
        <Link href="/rechnungen/neu" className="btn btn-primary">
          <Plus size={16} /> Neue Rechnung
        </Link>
      </header>

      <div className="panel overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-ink-400">
            <p>Noch keine Rechnungen.</p>
            <Link href="/rechnungen/neu" className="mt-2 inline-block text-bronze-700 hover:underline">
              Erste Rechnung anlegen →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nummer</th>
                <th className="px-4 py-3 text-left font-medium">Art</th>
                <th className="px-4 py-3 text-left font-medium">Kunde</th>
                <th className="px-4 py-3 text-left font-medium">Datum</th>
                <th className="px-4 py-3 text-left font-medium">Fällig</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Brutto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {invoices.map((inv) => {
                const s = STATUS_LABELS[inv.status] ?? STATUS_LABELS.DRAFT;
                return (
                  <tr key={inv.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/rechnungen/${inv.id}`} className="font-medium font-mono hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">{KIND_LABELS[inv.kind] ?? inv.kind}</td>
                    <td className="px-4 py-3">
                      <Link href={`/kunden/${inv.customer.id}`} className="hover:underline">
                        {inv.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3 text-ink-500">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-4 py-3 text-right num font-medium">{formatEUR(inv.total)}</td>
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
