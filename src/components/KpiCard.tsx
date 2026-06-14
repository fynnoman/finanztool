import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "danger" | "muted";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  const valueColor = {
    neutral: "text-ink-900",
    accent: "text-ink-900",
    positive: "text-emerald-700",
    danger: "text-rose-700",
    muted: "text-ink-400",
  }[tone];

  const ring = tone === "accent" ? "ring-1 ring-bronze-200" : "";

  return (
    <div className={cn("panel p-5", ring)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className={cn("mt-2 font-display text-2xl font-medium num tracking-tight", valueColor)}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}
