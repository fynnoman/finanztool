"use client";

import { useRef, useState, useTransition } from "react";
import { uploadInvoicePdf, deleteUpload } from "./upload-actions";
import { FileUp, FileText, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { formatEUR } from "@/lib/money";
import { fmtDate } from "@/lib/dates";

type UploadItem = {
  id: string;
  filename: string;
  status: string;
  extractedTotal: number | null;
  extractedDate: Date | null;
  errorMessage: string;
  invoiceId: string | null;
  uploadedAt: Date;
};

export function UploadCard({
  customerId,
  uploads,
  aiAvailable,
}: {
  customerId: string;
  uploads: UploadItem[];
  aiAvailable: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setStatus("Verarbeite PDF…");
    startTransition(async () => {
      try {
        await uploadInvoicePdf(customerId, fd);
        setStatus("Fertig.");
      } catch (err) {
        setStatus(`Fehler: ${(err as Error).message}`);
      }
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setStatus(null), 3500);
    });
  }

  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium">Rechnungen hochladen</h2>
          <p className="text-xs text-ink-400">
            {aiAvailable
              ? "OCR + KI erkennen Brutto / MwSt / Datum automatisch."
              : "Kein OpenAI-Key — Dateien werden gespeichert, Daten musst du manuell erfassen."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="btn btn-outline"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
          PDF auswählen…
        </button>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPick} />
      </div>

      {status && (
        <div className="mb-3 rounded-md bg-ink-50 px-3 py-2 text-sm text-ink-500">{status}</div>
      )}

      {uploads.length === 0 ? (
        <p className="text-sm text-ink-400">Keine hochgeladenen PDFs.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-start justify-between py-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileText size={16} className="mt-0.5 shrink-0 text-ink-400" />
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm">{u.filename}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                    {u.status === "PARSED" && (
                      <>
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>{formatEUR(u.extractedTotal ?? 0)}</span>
                        {u.extractedDate && <span>· {fmtDate(u.extractedDate)}</span>}
                        {u.invoiceId && (
                          <a href={`/rechnungen/${u.invoiceId}`} className="text-bronze-700 hover:underline">
                            → Rechnung
                          </a>
                        )}
                      </>
                    )}
                    {u.status === "MANUAL" && (
                      <>
                        <AlertTriangle size={12} className="text-amber-600" />
                        <span>{u.errorMessage || "Manuell prüfen"}</span>
                      </>
                    )}
                    {u.status === "ERROR" && (
                      <>
                        <AlertTriangle size={12} className="text-rose-600" />
                        <span className="text-rose-600">{u.errorMessage}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <form action={deleteUpload.bind(null, u.id)}>
                <button
                  type="submit"
                  className="rounded p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Löschen"
                  onClick={(e) => {
                    if (!confirm("Upload + zugehörige Rechnung löschen?")) e.preventDefault();
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
