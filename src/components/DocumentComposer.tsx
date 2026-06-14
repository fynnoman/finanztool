"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { formatEUR } from "@/lib/money";

type Item = { details: string; quantity: number; unitPrice: number };

export function DocumentComposer({
  initialItems = [],
  initialVatRate = 19,
}: {
  initialItems?: Item[];
  initialVatRate?: number;
}) {
  const [items, setItems] = useState<Item[]>(initialItems.length > 0 ? initialItems : [{ details: "", quantity: 1, unitPrice: 0 }]);
  const [vatRate, setVatRate] = useState<number>(initialVatRate);

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function add() {
    setItems((prev) => [...prev, { details: "", quantity: 1, unitPrice: 0 }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-ink-100">
        <table className="w-full text-sm">
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
                    value={it.quantity}
                    onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name="items.unitPrice"
                    type="number"
                    step="0.01"
                    className="input text-right"
                    value={it.unitPrice}
                    onChange={(e) => update(i, { unitPrice: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium num">
                  {formatEUR(it.quantity * it.unitPrice)}
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
            onChange={(e) => setVatRate(Number(e.target.value) || 0)}
          />
        </div>
        <div className="text-right">
          <div className="text-xs text-ink-400">Netto</div>
          <div className="text-sm num">{formatEUR(subtotal)}</div>
          <div className="mt-1 text-xs text-ink-400">+ MwSt. {vatRate}%</div>
          <div className="text-sm num">{formatEUR(vatAmount)}</div>
          <div className="mt-2 text-xs uppercase tracking-wider text-ink-400">Brutto</div>
          <div className="font-display text-2xl font-medium num">{formatEUR(total)}</div>
        </div>
      </div>
    </div>
  );
}
