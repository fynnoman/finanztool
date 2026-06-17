import { prisma } from "@/lib/db";

export type OpenAIClient = {
  apiKey: string;
  model: string;
};

/** Load the API key + model from settings. Returns null when no key is set. */
export async function getOpenAI(): Promise<OpenAIClient | null> {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings?.openaiApiKey?.trim()) return null;
  return { apiKey: settings.openaiApiKey.trim(), model: settings.openaiModel || "gpt-4o-mini" };
}

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callJsonSchema<T>(
  client: OpenAIClient,
  schemaName: string,
  schema: Record<string, unknown>,
  messages: Msg[]
): Promise<T> {
  const body = {
    model: client.model,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    },
    temperature: 0.2,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: leere Antwort");
  return JSON.parse(content) as T;
}

// ── Extract invoice totals from raw OCR text ──────────────────────
export type ExtractedInvoice = {
  total: number | null;
  net: number | null;
  vat: number | null;
  date: string | null; // yyyy-MM-dd
  vendor: string | null;
  description: string | null;
};

export async function extractInvoiceFromText(
  text: string,
  client: OpenAIClient
): Promise<ExtractedInvoice> {
  const system = `Du extrahierst Daten aus dem rohen Text einer deutschen Rechnung. Antworte streng im vorgegebenen JSON-Schema.

Regeln:
- total = Brutto-Endbetrag in Euro (Zahl, kein Währungszeichen)
- net = Netto-Summe, vat = MwSt-Betrag. Wenn nur total + vat bekannt: net = total - vat
- date = Rechnungsdatum, NICHT Leistungs-/Fällig-/Zahldatum, ZWINGEND im Format yyyy-MM-dd
- Wandle deutsche Daten (15.03.2026, 15. März 2026) IMMER in yyyy-MM-dd um
- vendor = Name des Rechnungsstellers (oben links auf der Rechnung)
- description = kurze Zusammenfassung der Leistung (1 Zeile)
- Bei Unsicherheit: null statt geraten.`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      total: { type: ["number", "null"] },
      net: { type: ["number", "null"] },
      vat: { type: ["number", "null"] },
      date: { type: ["string", "null"] },
      vendor: { type: ["string", "null"] },
      description: { type: ["string", "null"] },
    },
    required: ["total", "net", "vat", "date", "vendor", "description"],
  };

  return callJsonSchema<ExtractedInvoice>(client, "invoice_extract", schema, [
    { role: "system", content: system },
    { role: "user", content: text.slice(0, 8000) },
  ]);
}

// ── Freitext → Rechnungs-/Angebots-Posten ─────────────────────────
export type AiLineItem = {
  details: string;
  quantity: number;
  unitPrice: number;
};

export async function extractItemsFromDescription(
  text: string,
  client: OpenAIClient
): Promise<AiLineItem[]> {
  const system = `Du wandelst die freie Beschreibung einer erbrachten Leistung in saubere Rechnungspositionen um.

Regeln:
- Pro deutlich erkennbarer Leistung EINE Position.
- "details": kurze sachliche Bezeichnung in dritter Person, KEIN "ich habe…". Beispiele: "Gartenarbeit bei Müller", "Heckenschnitt", "Rasen mähen 200 m²".
- "quantity": Menge als Zahl. Default 1 wenn unklar. Bei Stunden/Stück/m² die Menge übernehmen.
- "unitPrice": Einzelpreis pro Mengeneinheit in Euro (nur Zahl). Wenn nur ein Gesamtbetrag genannt ist und quantity = 1, dann unitPrice = Gesamtbetrag.
- Bei mehreren Sätzen: mehrere Positionen erzeugen.
- Wenn KEINE Leistung erkennbar ist: leeres items-Array.
- Antworte auf Deutsch.`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            details: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
          },
          required: ["details", "quantity", "unitPrice"],
        },
      },
    },
    required: ["items"],
  };

  const result = await callJsonSchema<{ items: AiLineItem[] }>(
    client,
    "line_items_extract",
    schema,
    [
      { role: "system", content: system },
      { role: "user", content: text.slice(0, 4000) },
    ]
  );
  return result.items;
}

// ── Dashboard suggestions ────────────────────────────────────────
export type AiSuggestion = {
  customer: string;
  headline: string;
  reason: string;
  amount: number | null;
  action: "kontaktieren" | "mahnen" | "anbieten" | "info";
};

export type CustomerSummary = {
  name: string;
  company: string;
  services: string;          // distinct services bisher
  totalNet: number;
  daysSinceLastInvoice: number; // -1 wenn nie
  openInvoiceValue: number;     // unbezahlt
  overdueDays: number;          // 0 wenn nichts überfällig
  openIssuesCount: number;
};

export async function suggestForCustomer(
  summary: CustomerSummary,
  client: OpenAIClient
): Promise<{ headline: string; reason: string; amount: number; action: AiSuggestion["action"] }> {
  const system = `Du bist Vertriebs-/Service-Coach für einen Selbstständigen. Du bekommst die Daten EINES Kunden. Schlag den NÄCHSTEN sinnvollen Schritt vor: kontaktieren, mahnen, anbieten oder eine reine Info.

Regeln:
- Auf Deutsch, knapp, konkret.
- headline: 3-7 Wörter, klare Handlungsaufforderung
- reason: 1 Satz, warum jetzt
- amount: geschätzter € Betrag wenn anbieten/mahnen, sonst 0
- action: "mahnen" (überfällige Rechnung), "kontaktieren" (Reaktivierung), "anbieten" (Upsell), "info" (Hinweis)`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string" },
      reason: { type: "string" },
      amount: { type: "number" },
      action: { type: "string", enum: ["kontaktieren", "mahnen", "anbieten", "info"] },
    },
    required: ["headline", "reason", "amount", "action"],
  };

  const userMsg = `Kunde: ${summary.name}${summary.company ? ` (${summary.company})` : ""}
Bisherige Leistungen: ${summary.services || "keine Rechnung bisher"}
Gesamt-Netto bisher: ${Math.round(summary.totalNet)} €
Tage seit letzter Rechnung: ${summary.daysSinceLastInvoice < 0 ? "noch nie" : summary.daysSinceLastInvoice}
Offene Rechnungen: ${Math.round(summary.openInvoiceValue)} €${summary.overdueDays > 0 ? ` (überfällig seit ${summary.overdueDays} Tagen)` : ""}
Offene Aufgaben/Wünsche: ${summary.openIssuesCount}`;

  return callJsonSchema(client, "suggest", schema, [
    { role: "system", content: system },
    { role: "user", content: userMsg },
  ]);
}

// ── Ping (health check) ──────────────────────────────────────────
export async function ping(client: OpenAIClient): Promise<boolean> {
  try {
    await callJsonSchema<{ ok: boolean }>(
      client,
      "ping",
      { type: "object", additionalProperties: false, properties: { ok: { type: "boolean" } }, required: ["ok"] },
      [{ role: "user", content: 'Antworte mit {"ok": true}' }]
    );
    return true;
  } catch {
    return false;
  }
}
