/**
 * PDF → text extraction.
 *
 * Uses `pdf-parse` for vector PDFs (most modern German invoices). For scanned
 * PDFs (just an image), this returns near-empty text; in that case the AI
 * extraction will fail and we surface the upload as "manuell prüfen" so the
 * user can enter the numbers themselves. A future iteration can plug in
 * tesseract.js for real OCR; for Phase 1 we keep the dependency surface tight.
 */
import pdf from "pdf-parse";

export type PdfText = {
  text: string;
  pages: number;
  empty: boolean;
};

export async function extractPdfText(buffer: Buffer): Promise<PdfText> {
  const result = await pdf(buffer);
  const text = (result.text || "").trim();
  return {
    text,
    pages: result.numpages || 0,
    empty: text.length < 30, // anything less is likely a scan
  };
}

/** Quick German-style date scan from raw OCR text as a fallback if the AI returns null. */
export function scanInvoiceDate(text: string): Date | null {
  const pattern = /\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) continue;
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** Parse "yyyy-MM-dd" or German "dd.MM.yyyy" / "d.M.yyyy" from a string. */
export function parseAnyDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // ISO
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // German
  m = /^(\d{1,2})[.](\d{1,2})[.](\d{2,4})$/.exec(trimmed);
  if (m) {
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    return new Date(y, Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}
