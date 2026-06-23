import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { Plus, Search } from "lucide-react";

export default async function KundenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      invoices: { select: { total: true, status: true } },
      _count: { select: { invoices: true, quotes: true } },
    },
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium">Kunden</h1>
          <p className="mt-1 text-sm text-ink-400">{customers.length} Einträge</p>
        </div>
        <Link href="/kunden/neu" className="btn btn-primary">
          <Plus size={16} /> Neuer Kunde
        </Link>
      </header>

      <form className="mb-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Kunden suchen…"
            className="input pl-9"
          />
        </div>
      </form>

      <div className="panel overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-ink-400">
            <p>Noch keine Kunden.</p>
            <Link href="/kunden/neu" className="mt-2 inline-block text-bronze-700 hover:underline">
              Ersten Kunden anlegen →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Firma</th>
                <th className="px-4 py-3 text-right font-medium">Rechnungen</th>
                <th className="px-4 py-3 text-right font-medium">Umsatz</th>
                <th className="px-4 py-3 text-left font-medium">Angelegt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {customers.map((c) => {
                const total = c.invoices.reduce((s, i) => s + i.total, 0);
                return (
                  <tr key={c.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/kunden/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      {c.email && <div className="text-xs text-ink-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-right num text-ink-500">{c._count.invoices}</td>
                    <td className="px-4 py-3 text-right num font-medium">{formatEUR(total)}</td>
                    <td className="px-4 py-3 text-xs text-ink-400">{fmtDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
