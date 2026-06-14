# Finanztool

Web-basiertes Finanz-/Rechnungs-Tool für einen Einzel-Nutzer. Kunden, Angebote, Rechnungen (Standard / Abschlag / Schluss), Kalender mit Zahlungsfristen, Dashboard mit Steuersicht, E-Rechnung (ZUGFeRD-XML).

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **DB**: SQLite (dev) / Postgres (prod via Neon) über Prisma ORM
- **Auth**: Auth.js (NextAuth v5) Credentials-Provider
- **PDF**: `@react-pdf/renderer`
- **E-Rechnung**: eigener ZUGFeRD-Basic-XML-Generator (`src/lib/zugferd.ts`)

## Local Setup

```bash
cd /Users/fynnschulz/finanztool
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Dann auf <http://localhost:3000> öffnen.

**Initial-Login**:
- E-Mail: `admin@finanztool.de`
- Passwort: `admin123`

Passwort sofort in „Einstellungen → Passwort ändern" ändern.

## Features

| Modul | Was es kann |
|---|---|
| **Dashboard** | KPIs (Brutto/Netto/MwSt./Gewinn), Monats-/Jahresfilter mit ← →, Letzte Rechnungen + Angebote |
| **Kunden** | Liste mit Suche, CRUD, Stammdaten, Umsatz-Sicht pro Kunde |
| **Angebote** | Composer mit Positionen, Status (Entwurf/Versendet/Angenommen/Abgelehnt/Abgelaufen), „In Rechnung umwandeln", PDF-Export, Häkchen-Spalte in Liste |
| **Rechnungen** | Standard, Abschlag, Schluss (Abschläge werden automatisch abgezogen), Status-Workflow, Zahlung erfassen (Teil / voll), PDF-Export, ZUGFeRD-XML-Export |
| **Kalender** | Monatsraster mit Zahlungsfristen (auto-eingetragen aus Rechnungen) + Angebots-Abläufe + manuelle Termine, erledigt-Häkchen |
| **Steuern** | Jahres-ESt-Schätzung (Grundtabelle 2026) + Soli, USt-Voranmeldung Monat für Monat |
| **Einstellungen** | Firma, IBAN/BIC, USt-ID, MwSt-Satz, Logo-Upload, Passwort ändern |

## E-Rechnung (ZUGFeRD / XRechnung)

Jede Rechnung kann unter `/api/invoices/{id}/zugferd` als ZUGFeRD-2.x-Basic-XML (CrossIndustryInvoice) heruntergeladen werden. Die XML enthält alle relevanten Felder gemäß EN-16931.

**Phase 2 (geplant)**: Einbettung der XML in das PDF/A-3 (`factur-x.xml`), sodass eine einzige Datei sowohl optisch als Rechnung lesbar als auch maschinell als E-Rechnung verarbeitbar ist. Aktuell sind PDF und XML zwei getrennte Downloads.

## Produktion (Vercel + Neon)

1. **Neon-DB anlegen** → Connection-String kopieren.
2. **Prisma-Schema umstellen**: in `prisma/schema.prisma` `provider = "postgresql"` setzen.
3. **Auf Vercel pushen**, Environment-Variablen setzen:
   - `DATABASE_URL` (Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_URL` (deine Domain)
   - `ADMIN_EMAIL` + `ADMIN_PASSWORD` (nur fürs erste Seeding)
4. **Build-Hook** sorgt für `prisma generate && next build`.
5. **Seed einmal manuell** (lokal mit DATABASE_URL auf Neon): `npx tsx prisma/seed.ts`.

## Open / Phase 2 Ideen

- ZUGFeRD-XML in PDF/A-3 einbetten (echtes E-Rechnungs-PDF)
- E-Mail-Versand direkt aus dem Tool (Resend / Postmark)
- Mahnwesen (überfällige Rechnungen → automatische Mahnung)
- Banking-Anbindung (PSD2 für Zahlungsabgleich)
- Datev-Export (xls / csv für Steuerberater-Übergabe)
- Drag-and-Drop Kalender
- DATEV-konformer Belegimport (OCR wie in FyluAgency)
- Mehrsprachige Rechnungen (DE/EN)
