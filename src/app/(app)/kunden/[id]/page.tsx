import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { updateCustomer, deleteCustomer } from "../actions";
import { Trash2 } from "lucide-react";
import { UploadCard } from "./UploadCard";
import { IssuesCard } from "./IssuesCard";

export default async function KundePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, settings] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: { orderBy: { date: "desc" } },
        quotes: { orderBy: { date: "desc" } },
        uploads: { orderBy: { uploadedAt: "desc" } },
        issues: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.businessSettings.findFirst(),
  ]);
  if (!customer) notFound();
  const aiAvailable = Boolean(settings?.openaiApiKey?.trim());

  const invoicesTotal = customer.invoices.reduce((s, i) => s + i.total, 0);
  const paidTotal = customer.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const openTotal = customer.invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Link href="/kunden" className="text-sm text-ink-400 hover:underline">
            ← Kunden
          </Link>
          <h1 className="mt-2 font-display text-3xl font-medium">{customer.name}</h1>
          {customer.company && <p className="mt-1 text-ink-500">{customer.company}</p>}
        </div>
        <form action={deleteCustomer.bind(null, customer.id)}>
          <button
            type="submit"
            className="btn btn-danger"
            formNoValidate
            onClick={(e) => {
              if (!confirm("Kunde wirklich löschen? Rechnungen & Angebote werden mitgelöscht."))
                e.preventDefault();
            }}
          >
            <Trash2 size={14} /> Löschen
          </button>
        </form>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="panel p-6">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Umsatz gesamt" value={formatEUR(invoicesTotal)} />
              <Stat label="Bezahlt" value={formatEUR(paidTotal)} tone="positive" />
              <Stat label="Offen" value={formatEUR(openTotal)} tone={openTotal > 0 ? "danger" : "muted"} />
            </div>
          </section>

          <IssuesCard
            customerId={customer.id}
            issues={customer.issues.map((i) => ({
              id: i.id,
              title: i.title,
              details: i.details,
              price: i.price,
              done: i.done,
              createdAt: i.createdAt,
            }))}
          />

          <UploadCard
            customerId={customer.id}
            aiAvailable={aiAvailable}
            uploads={customer.uploads.map((u) => ({
              id: u.id,
              filename: u.filename,
              status: u.status,
              extractedTotal: u.extractedTotal,
              extractedDate: u.extractedDate,
              errorMessage: u.errorMessage,
              invoiceId: u.invoiceId,
              uploadedAt: u.uploadedAt,
            }))}
          />

          <CustomerSection title="Rechnungen" items={customer.invoices.map((i) => ({
            href: `/rechnungen/${i.id}`,
            label: i.number,
            sub: i.status,
            date: i.date,
            amount: i.total,
          }))} />

          <CustomerSection title="Angebote" items={customer.quotes.map((q) => ({
            href: `/angebote/${q.id}`,
            label: q.number,
            sub: q.status,
            date: q.date,
            amount: q.total,
          }))} />
        </div>

        <aside>
          <form action={updateCustomer.bind(null, customer.id)} className="panel space-y-4 p-6">
            <h3 className="font-display text-lg font-medium">Stammdaten</h3>
            <div>
              <label className="label">Name</label>
              <input className="input" name="name" defaultValue={customer.name} required />
            </div>
            <div>
              <label className="label">Firma</label>
              <input className="input" name="company" defaultValue={customer.company} />
            </div>
            <div>
              <label className="label">E-Mail</label>
              <input className="input" name="email" type="email" defaultValue={customer.email} />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" name="phone" defaultValue={customer.phone} />
            </div>
            <div>
              <label className="label">Adresse</label>
              <textarea className="input min-h-24" name="address" defaultValue={customer.address} />
            </div>
            <div>
              <label className="label">USt-ID</label>
              <input className="input" name="taxId" defaultValue={customer.taxId} />
            </div>
            <div>
              <label className="label">Notizen</label>
              <textarea className="input min-h-24" name="notes" defaultValue={customer.notes} />
            </div>
            <button type="submit" className="btn btn-primary w-full">Speichern</button>
            <p className="text-xs text-ink-400">Angelegt {fmtDate(customer.createdAt)}</p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "danger" | "muted" }) {
  const color = tone === "positive" ? "text-emerald-700" : tone === "danger" ? "text-rose-700" : tone === "muted" ? "text-ink-400" : "text-ink-900";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className={`mt-1 font-display text-xl font-medium num ${color}`}>{value}</div>
    </div>
  );
}

function CustomerSection({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; sub: string; date: Date; amount: number }[];
}) {
  return (
    <section className="panel p-6">
      <h2 className="mb-4 font-display text-lg font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">Keine Einträge.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((it) => (
            <li key={it.href} className="flex items-center justify-between py-2.5">
              <div>
                <Link href={it.href} className="text-sm font-medium hover:underline">
                  {it.label}
                </Link>
                <div className="text-xs text-ink-400">{it.sub} · {fmtDate(it.date)}</div>
              </div>
              <div className="text-sm font-medium num">{formatEUR(it.amount)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
