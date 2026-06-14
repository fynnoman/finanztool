import { prisma } from "@/lib/db";
import Link from "next/link";
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, format } from "date-fns";
import { de } from "date-fns/locale";
import { createEvent, toggleEventComplete, deleteEvent } from "./actions";
import { ChevronLeft, ChevronRight, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const KIND_PILL: Record<string, string> = {
  TERMIN: "pill-bronze",
  ZAHLUNGSFRIST: "pill-rose",
  ANGEBOT_ABLAUF: "pill-amber",
};

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const monthOffset = Number(sp.m ?? "0");
  const anchor = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [events, customers] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { start: { gte: gridStart, lte: gridEnd } },
      orderBy: { start: "asc" },
      include: { customer: true, invoice: true },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium capitalize">{format(anchor, "LLLL yyyy", { locale: de })}</h1>
          <p className="mt-1 text-sm text-ink-400">Termine · Zahlungsfristen · Angebots-Abläufe</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/kalender?m=${monthOffset - 1}`} className="btn btn-outline" aria-label="Vorheriger Monat">
            <ChevronLeft size={14} />
          </Link>
          <Link href="/kalender" className="btn btn-ghost text-xs">Heute</Link>
          <Link href={`/kalender?m=${monthOffset + 1}`} className="btn btn-outline" aria-label="Nächster Monat">
            <ChevronRight size={14} />
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Calendar grid */}
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50 text-center text-xs uppercase tracking-wider text-ink-400">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = events.filter((e) => isSameDay(new Date(e.start), day));
              const inMonth = isSameMonth(day, anchor);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-28 border-b border-r border-ink-100 p-2",
                    !inMonth && "bg-ink-50/40 text-ink-300",
                    today && "bg-bronze-50/30"
                  )}
                >
                  <div className={cn("mb-1 text-xs num", today && "font-semibold text-bronze-700")}>{format(day, "d")}</div>
                  <ul className="space-y-1">
                    {dayEvents.map((e) => (
                      <li key={e.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px]", KIND_PILL[e.kind] ?? "pill-gray", e.completed && "line-through opacity-50")}>
                        {e.invoice ? (
                          <Link href={`/rechnungen/${e.invoice.id}`} className="hover:underline">{e.title}</Link>
                        ) : (
                          <span>{e.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: list view + create form */}
        <aside className="space-y-4">
          <section className="panel p-5">
            <h2 className="mb-3 font-display text-base font-medium">Neuer Termin</h2>
            <form action={createEvent} className="space-y-3">
              <div>
                <label className="label">Titel</label>
                <input className="input" name="title" required placeholder="z. B. Steuertermin" />
              </div>
              <div>
                <label className="label">Datum</label>
                <input className="input" name="start" type="date" required defaultValue={format(anchor, "yyyy-MM-dd")} />
              </div>
              <div>
                <label className="label">Kunde (optional)</label>
                <select className="input" name="customerId" defaultValue="">
                  <option value="">— kein —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notiz</label>
                <textarea className="input min-h-16" name="details" />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                <Plus size={14} /> Anlegen
              </button>
            </form>
          </section>

          <section className="panel p-5">
            <h2 className="mb-3 font-display text-base font-medium">Diesen Monat</h2>
            {events.length === 0 ? (
              <p className="text-sm text-ink-400">Keine Einträge.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                    <div className="min-w-0">
                      <div className={cn("truncate", e.completed && "line-through text-ink-400")}>{e.title}</div>
                      <div className="text-xs text-ink-400">
                        {format(new Date(e.start), "dd.MM.yyyy")}
                        {e.customer && <> · {e.customer.name}</>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={toggleEventComplete.bind(null, e.id)}>
                        <button type="submit" className="rounded p-1 text-ink-400 hover:bg-emerald-50 hover:text-emerald-600" aria-label="erledigt">
                          <Check size={14} />
                        </button>
                      </form>
                      <form action={deleteEvent.bind(null, e.id)}>
                        <button type="submit" className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600" aria-label="löschen">
                          <X size={14} />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
