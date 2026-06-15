import { prisma } from "@/lib/db";
import { createLead, setLeadStatus, deleteLead, convertLeadToCustomer } from "./actions";

const LEAD_STATUSES = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON", "LOST"] as const;
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { Plus, Trash2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  MEETING: "Termin",
  PROPOSAL: "Angebot raus",
  WON: "Gewonnen",
  LOST: "Verloren",
};

const COLS: Record<string, string> = {
  NEW: "border-ink-200",
  CONTACTED: "border-sky-200",
  MEETING: "border-amber-200",
  PROPOSAL: "border-bronze-200",
  WON: "border-emerald-200",
  LOST: "border-rose-200",
};

export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { updatedAt: "desc" } });
  const pipelineValue = leads
    .filter((l) => l.status !== "WON" && l.status !== "LOST")
    .reduce((s, l) => s + (l.expectedValue ?? 0), 0);
  const wonValue = leads.filter((l) => l.status === "WON").reduce((s, l) => s + (l.expectedValue ?? 0), 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium">Leads</h1>
          <p className="mt-1 text-sm text-ink-400">
            Pipeline {formatEUR(pipelineValue)} · Gewonnen {formatEUR(wonValue)} · {leads.length} Leads
          </p>
        </div>
      </header>

      <form action={createLead} className="panel mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-medium">Neuer Lead</h2>
        <div className="grid gap-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input className="input" name="name" required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Firma</label>
            <input className="input" name="company" />
          </div>
          <div>
            <label className="label">Quelle</label>
            <input className="input" name="source" placeholder="Empfehlung / IG / …" />
          </div>
          <div>
            <label className="label">Angebot (€)</label>
            <input className="input" name="expectedValue" type="number" step="0.01" />
          </div>
          <div className="md:col-span-3">
            <label className="label">E-Mail</label>
            <input className="input" name="email" type="email" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Telefon</label>
            <input className="input" name="phone" />
          </div>
          <div className="md:col-span-6">
            <label className="label">Was will der Lead?</label>
            <input className="input" name="offerDescription" placeholder="z. B. Website + SEO" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn btn-primary">
            <Plus size={14} /> Lead anlegen
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {LEAD_STATUSES.map((status) => {
          const col = leads.filter((l) => l.status === status);
          const colValue = col.reduce((s, l) => s + (l.expectedValue ?? 0), 0);
          return (
            <div key={status} className={`panel border-t-4 p-4 ${COLS[status] ?? "border-ink-200"}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="font-medium">{LABELS[status]}</div>
                <div className="text-xs text-ink-400">{col.length} · {formatEUR(colValue)}</div>
              </div>
              <ul className="space-y-2">
                {col.length === 0 ? (
                  <li className="rounded-md border border-dashed border-ink-100 p-3 text-center text-xs text-ink-400">leer</li>
                ) : (
                  col.map((lead) => (
                    <li key={lead.id} className="rounded-md border border-ink-100 bg-white p-3 text-sm">
                      <div className="font-medium">{lead.name}</div>
                      {lead.company && <div className="text-xs text-ink-500">{lead.company}</div>}
                      {lead.offerDescription && <div className="mt-1 text-xs text-ink-400">{lead.offerDescription}</div>}
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="num font-medium text-emerald-700">{lead.expectedValue ? formatEUR(lead.expectedValue) : "—"}</span>
                        <span className="text-ink-400">{fmtDate(lead.updatedAt)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex gap-1">
                          {/* prev/next status */}
                          {prevStatus(status) && (
                            <form action={setLeadStatus.bind(null, lead.id, prevStatus(status)!)}>
                              <button type="submit" className="rounded p-1 text-ink-400 hover:bg-ink-50" aria-label="zurück">
                                <ChevronLeft size={12} />
                              </button>
                            </form>
                          )}
                          {nextStatus(status) && (
                            <form action={setLeadStatus.bind(null, lead.id, nextStatus(status)!)}>
                              <button type="submit" className="rounded p-1 text-ink-400 hover:bg-ink-50" aria-label="weiter">
                                <ChevronRight size={12} />
                              </button>
                            </form>
                          )}
                          {status !== "WON" && status !== "LOST" && (
                            <form action={convertLeadToCustomer.bind(null, lead.id)}>
                              <button type="submit" className="rounded p-1 text-bronze-700 hover:bg-bronze-50" aria-label="Zu Kunde konvertieren" title="Zu Kunde">
                                <ArrowRight size={12} />
                              </button>
                            </form>
                          )}
                        </div>
                        <form action={deleteLead.bind(null, lead.id)}>
                          <button type="submit" className="rounded p-1 text-ink-300 hover:bg-rose-50 hover:text-rose-600" aria-label="Löschen">
                            <Trash2 size={12} />
                          </button>
                        </form>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pipeline-Reihenfolge ohne LOST — die Spalte ist absichtlich Endstation.
// LOST kann via "zurück"-Pfeil wieder in NEW geschoben werden (Reaktivierung).
function prevStatus(s: string): "NEW" | "CONTACTED" | "MEETING" | "PROPOSAL" | "WON" | "LOST" | null {
  const order = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON"] as const;
  if (s === "LOST") return "NEW"; // reaktivieren
  const i = order.indexOf(s as (typeof order)[number]);
  if (i <= 0) return null;
  return order[i - 1];
}

function nextStatus(s: string): "NEW" | "CONTACTED" | "MEETING" | "PROPOSAL" | "WON" | "LOST" | null {
  const order = ["NEW", "CONTACTED", "MEETING", "PROPOSAL", "WON"] as const;
  const i = order.indexOf(s as (typeof order)[number]);
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1];
}
