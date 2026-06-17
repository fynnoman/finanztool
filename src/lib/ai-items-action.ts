"use server";

import { getOpenAI, extractItemsFromDescription, type AiLineItem } from "./openai";

export type GenerateItemsResult =
  | { ok: true; items: AiLineItem[] }
  | { ok: false; error: string };

/**
 * Server Action: nimmt einen frei formulierten Text und gibt die daraus
 * extrahierten Rechnungs-/Angebots-Posten zurück. Wird vom DocumentComposer
 * aufgerufen. Den OpenAI-Key holt sich die Action selbst aus BusinessSettings.
 */
export async function generateItemsFromText(text: string): Promise<GenerateItemsResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Bitte Text eingeben." };

  const client = await getOpenAI();
  if (!client) {
    return {
      ok: false,
      error: "Kein OpenAI-Key in den Einstellungen hinterlegt.",
    };
  }

  try {
    const items = await extractItemsFromDescription(trimmed, client);
    if (items.length === 0) {
      return { ok: false, error: "Keine Leistung erkannt. Bitte konkreter beschreiben." };
    }
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: `KI-Fehler: ${(err as Error).message}` };
  }
}
