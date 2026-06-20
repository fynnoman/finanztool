"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtMonth } from "@/lib/dates";
import { addMonths, startOfMonth } from "date-fns";
import { cn } from "@/lib/cn";
import type { RangeKey } from "@/lib/range";

export function RangePicker({
  rangeKey,
  monthOffset,
}: {
  rangeKey: RangeKey;
  monthOffset: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setRange(r: RangeKey, m = 0) {
    const sp = new URLSearchParams(params.toString());
    sp.set("r", r);
    if (r === "month") sp.set("m", String(m));
    else sp.delete("m");
    router.push(`/dashboard?${sp.toString()}`);
  }

  const anchor = addMonths(startOfMonth(new Date()), monthOffset);

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-ink-100 bg-white p-0.5">
        {(["month", "year", "all"] as RangeKey[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r, 0)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              rangeKey === r ? "bg-bronze-600 text-white" : "text-ink-500 hover:bg-bronze-50"
            )}
          >
            {r === "month" ? "Monat" : r === "year" ? "Jahr" : "Gesamt"}
          </button>
        ))}
      </div>
      {rangeKey === "month" && (
        <div className="inline-flex items-center gap-1 rounded-lg border border-ink-100 bg-white px-1 py-0.5">
          <button
            onClick={() => setRange("month", monthOffset - 1)}
            className="rounded p-1 text-ink-500 hover:bg-ink-50"
            aria-label="Vorheriger Monat"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-32 px-2 text-center text-sm font-medium capitalize">
            {fmtMonth(anchor)}
          </span>
          <button
            onClick={() => setRange("month", monthOffset + 1)}
            disabled={monthOffset >= 0}
            className="rounded p-1 text-ink-500 hover:bg-ink-50 disabled:opacity-30"
            aria-label="Nächster Monat"
          >
            <ChevronRight size={14} />
          </button>
          {monthOffset !== 0 && (
            <button
              onClick={() => setRange("month", 0)}
              className="ml-1 px-2 text-xs text-bronze-700 hover:underline"
            >
              Heute
            </button>
          )}
        </div>
      )}
    </div>
  );
}
