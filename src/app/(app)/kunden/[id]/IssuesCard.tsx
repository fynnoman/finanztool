import { createIssue, toggleIssue, deleteIssue } from "./issue-actions";
import { formatEUR } from "@/lib/money";
import { Check, X, Plus } from "lucide-react";

type Issue = {
  id: string;
  title: string;
  details: string;
  price: number | null;
  done: boolean;
  createdAt: Date;
};

export function IssuesCard({ customerId, issues }: { customerId: string; issues: Issue[] }) {
  const open = issues.filter((i) => !i.done);
  const openValue = open.reduce((s, i) => s + (i.price ?? 0), 0);

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium">Wünsche & Aufgaben</h2>
          <p className="text-xs text-ink-400">
            {open.length} offen · {formatEUR(openValue)} Potenzial — was der Kunde noch will
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="mb-4 text-sm text-ink-400">Noch keine Wünsche erfasst.</p>
      ) : (
        <ul className="mb-4 divide-y divide-ink-100">
          {issues.sort((a, b) => (a.done === b.done ? +b.createdAt - +a.createdAt : a.done ? 1 : -1)).map((i) => (
            <li key={i.id} className="flex items-start gap-3 py-2.5">
              <form action={toggleIssue.bind(null, i.id)}>
                <button
                  type="submit"
                  className={`mt-0.5 inline-grid h-5 w-5 place-items-center rounded border ${i.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink-200 bg-white text-ink-300 hover:border-emerald-400"}`}
                >
                  {i.done && <Check size={12} />}
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${i.done ? "text-ink-400 line-through" : "font-medium text-ink-900"}`}>{i.title}</div>
                {i.details && <div className="text-xs text-ink-500">{i.details}</div>}
              </div>
              {i.price !== null && (
                <div className="num text-sm font-medium text-ink-700">{formatEUR(i.price)}</div>
              )}
              <form action={deleteIssue.bind(null, i.id)}>
                <button type="submit" className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Löschen">
                  <X size={14} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={createIssue.bind(null, customerId)} className="border-t border-ink-100 pt-4">
        <div className="grid grid-cols-[1fr,80px,auto] gap-2">
          <input className="input" name="title" placeholder="Was wünscht sich der Kunde?" required />
          <input className="input" name="price" type="number" step="0.01" placeholder="€" />
          <button type="submit" className="btn btn-primary">
            <Plus size={14} />
          </button>
        </div>
        <input className="input mt-2" name="details" placeholder="Beschreibung (optional)" />
      </form>
    </section>
  );
}
