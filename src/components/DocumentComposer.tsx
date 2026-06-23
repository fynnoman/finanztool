"use client";

import { useState, useTransition } from "react";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { formatEUR } from "@/lib/money";
import { generateItemsFromText } from "@/lib/ai-items-action";

type Item = { details: string; quantity: string; unitPrice: string };

function toStr(n: number): string {
  // 1, 1.5 → "1", "1.5". 0 → "" damit der User es löschen kann.
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "";
  return String(n);
}

function num(s: string): number {
  if (!s) return 0;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function DocumentComposer({
  initialItems = [],
  initialVatRate = 19,
}: {
  initialItems?: { details: string; quantity: number; unitPrice: number }[];
  initialVatRate?: number;
}) {
  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0
      ? initialItems.map((i) => ({
          details: i.details,
          quantity: toStr(i.quantity),
          unitPrice: toStr(i.unitPrice),
        }))
      : [{ details: "", quantity: "", unitPrice: "" }]
  );
  const [vatRate, setVatRate] = useState<string>(String(initialVatRate));
  const [aiText, setAiText] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiPending, startAi] = useTransition();

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((prev) => [...prev, { details: "", quantity: "", unitPrice: "" }]);
  }
  function remove(i: number) {
    setItems((prev) => (prev.length <= 1 ? [{ details: "", quantity: "", unitPrice: "" }] : prev.filter((_, idx) => idx !== i)));
  }

  function onAiGenerate() {
    setAiError(null);
    const text = aiText;
    startAi(async () => {
      const res = await generateItemsFromText(text);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      const generated = res.items.map((it) => ({
        details: it.details,
        quantity: toStr(it.quantity),
        unitPrice: toStr(it.unitPrice),
      }));
      setItems((prev) => {
        // Wenn das Formular nur eine komplett leere Position hat, ersetzen.
        const onlyEmpty = prev.length === 1 && !prev[0].details && !prev[0].quantity && !prev[0].unitPrice;
        return onlyEmpty ? generated : [...prev, ...generated];
      });
      setAiText("");
    });
  }

  const subtotal = items.reduce((s, it) => s + num(it.quantity) * num(it.unitPrice), 0);
  const vat = num(vatRate);
  const vatAmount = subtotal * (vat / 100);
  const total = subtotal + vatAmount;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-bronze-200 bg-bronze-50/30 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-bronze-700" />
          <span className="text-sm font-medium text-ink-900">Posten aus Text erzeugen</span>
        </div>
        <p className="mb-3 text-xs text-ink-500">
          Z. B. „bei Müller den Garten geschnitten für 400 €" — die KI baut daraus eine Position.
        </p>
        <textarea
          className="input min-h-16"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder="Was hast du gemacht?"
          disabled={isAiPending}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          {aiError ? (
            <span className="text-xs text-rose-600">{aiError}</span>
          ) : (
            <span className="text-xs text-ink-400">Braucht den OpenAI-Key aus den Einstellungen.</span>
          )}
          <button
            type="button"
            onClick={onAiGenerate}
            disabled={isAiPending || !aiText.trim()}
            className="btn btn-outline disabled:opacity-50"
          >
            {isAiPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isAiPending ? "Generiere…" : "Generieren"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-100">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Leistung</th>
              <th className="w-24 px-3 py-2 text-right font-medium">Menge</th>
              <th className="w-32 px-3 py-2 text-right font-medium">Einzel (€)</th>
              <th className="w-32 px-3 py-2 text-right font-medium">Summe</th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 bg-white">
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <input
                    name="items.details"
                    className="input"
                    placeholder="z. B. Website-Entwicklung"
                    value={it.details}
                    onChange={(e) => update(i, { details: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name="items.quantity"
                    type="number"
                    step="0.01"
                    className="input text-right"
                    placeholder="1"
                    value={it.quantity}
                    onChange={(e) => update(i, { quantity: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name="items.unitPrice"
                    type="number"
                    step="0.01"
                    className="input text-right"
                    placeholder="0,00"
                    value={it.unitPrice}
                    onChange={(e) => update(i, { unitPrice: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium num">
                  {formatEUR(num(it.quantity) * num(it.unitPrice))}
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="rounded p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Position entfernen"
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add} className="btn btn-outline">
        <Plus size={14} /> Position hinzufügen
      </button>

      <div className="flex items-end justify-between border-t border-ink-100 pt-4">
        <div>
          <label className="label">MwSt.-Satz (%)</label>
          <input
            name="vatRate"
            type="number"
            step="0.1"
            className="input w-24"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-400">Netto</div>
          <div className="text-sm num">{formatEUR(subtotal)}</div>
          <div className="mt-1 text-xs text-ink-400">+ MwSt. {vat}%</div>
          <div className="text-sm num">{formatEUR(vatAmount)}</div>
          <div className="mt-2 text-xs uppercase tracking-wider text-ink-400">Brutto</div>
          <div className="font-display text-2xl font-medium num">{formatEUR(total)}</div>
        </div>
      </div>
    </div>
  );
}
