"use client";

import { useState, useTransition } from "react";
import { pingOpenAI } from "./actions";
import { Loader2 } from "lucide-react";

export function OpenAITester() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="btn btn-outline"
        disabled={isPending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const r = await pingOpenAI();
            setResult(r);
          });
        }}
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Verbindung testen
      </button>
      {result && (
        <span className={`text-sm ${result.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {result.message}
        </span>
      )}
    </div>
  );
}
