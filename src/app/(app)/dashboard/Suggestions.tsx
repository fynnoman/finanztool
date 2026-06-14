import Link from "next/link";
import { buildHeuristicSuggestions, type Suggestion } from "@/lib/suggestions";
import { formatEUR } from "@/lib/money";
import {
  AlertTriangle,
  Bell,
  Clock,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<Suggestion["kind"], LucideIcon> = {
  overdue: AlertTriangle,
  quote_expiring: Clock,
  quote_unanswered: Bell,
  stale: TrendingUp,
  upsell: Sparkles,
  info: Sparkles,
};

const TONES: Record<Suggestion["kind"], string> = {
  overdue: "border-rose-200 bg-rose-50/40",
  quote_expiring: "border-amber-200 bg-amber-50/40",
  quote_unanswered: "border-sky-200 bg-sky-50/40",
  stale: "border-bronze-200 bg-bronze-50/40",
  upsell: "border-emerald-200 bg-emerald-50/40",
  info: "border-ink-100 bg-ink-50/40",
};

const ICON_COLOR: Record<Suggestion["kind"], string> = {
  overdue: "text-rose-600",
  quote_expiring: "text-amber-600",
  quote_unanswered: "text-sky-600",
  stale: "text-bronze-700",
  upsell: "text-emerald-600",
  info: "text-ink-400",
};

export async function Suggestions() {
  const items = await buildHeuristicSuggestions();

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium">Was du heute angehen solltest</h2>
          <p className="text-xs text-ink-400">Auto-Erinnerungen aus deinen Rechnungen, Angeboten und Kundenhistorie.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Nichts liegt rum — alle Rechnungen bezahlt, alle Angebote frisch, alle Kunden in Bewegung. Saubere Arbeit.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const Icon = ICONS[it.kind];
            return (
              <li key={it.id}>
                <Link
                  href={it.href ?? "#"}
                  className={`group flex items-start gap-3 rounded-lg border px-4 py-3 transition hover:bg-white ${TONES[it.kind]}`}
                >
                  <Icon size={16} className={`mt-0.5 shrink-0 ${ICON_COLOR[it.kind]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-medium text-ink-900">{it.headline}</div>
                      {it.amount !== undefined && (
                        <div className="num text-sm font-semibold text-ink-900">{formatEUR(it.amount)}</div>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500">{it.reason}</div>
                  </div>
                  {it.badge && (
                    <span className="hidden shrink-0 self-center text-[10px] font-semibold uppercase tracking-wider text-ink-400 group-hover:text-ink-700 md:inline">
                      {it.badge} →
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
