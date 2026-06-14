# Deployment auf Vercel

## 1. GitHub-Repo (1 Min)

```bash
cd /Users/fynnschulz/finanztool
git init
git add .
git commit -m "feat: initial finanztool"
```

Dann auf <https://github.com/new>:
- Name: `finanztool`
- **Private** ✓
- „Create repository"

Danach die zwei Befehle ausführen, die GitHub dir zeigt — sieht so aus:

```bash
git remote add origin https://github.com/<DEIN-USER>/finanztool.git
git branch -M main
git push -u origin main
```

## 2. Vercel-Project (2 Min)

1. <https://vercel.com> → mit GitHub einloggen
2. „Add New… → Project"
3. Bei deinem `finanztool`-Repo auf „Import" klicken
4. **Environment Variables** ausklappen und folgende **vier** Variablen einfügen:

| Name | Wert |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_uT3pzL4fKCZn@ep-proud-flower-as9dpvp7.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | (gleicher Wert wie DATABASE_URL) |
| `AUTH_SECRET` | `v9M1fVNTEkgSRlz8P0sNmArJf/p+JWs7YPwLzeN2exk=` |
| `AUTH_URL` | `https://<wird-nach-deploy-gesetzt>.vercel.app` |

`AUTH_URL` darf beim ersten Deploy auch leer bleiben — wir setzen sie gleich nach Schritt 3.

5. „Deploy" klicken → Vercel baut ca. 90 Sekunden

## 3. AUTH_URL nachsetzen

Nach dem ersten Deploy hat Vercel dir die Domain gegeben (z. B. `finanztool-fynn.vercel.app`).

1. Auf Vercel → Project → **Settings → Environment Variables**
2. `AUTH_URL` setzen / bearbeiten:
   `https://finanztool-fynn.vercel.app` (deine konkrete Vercel-URL, **mit https**, **ohne** Slash am Ende)
3. „Save"
4. „Deployments" → letzten Deploy „Redeploy" klicken

## 4. Login auf Vercel

Auf deiner Vercel-URL einloggen mit:
- E-Mail: `admin@finanztool.de`
- Passwort: `admin123`

→ sofort **Einstellungen → Passwort ändern** + OpenAI-Key + Stammdaten + Logo eintragen. (Was du lokal eingegeben hast, ist nicht auf Neon — bewusst getrennte Welten.)

## 5. Eigene Domain (optional)

Wenn du `finanz.deinedomain.de` willst:

1. Vercel → Project → **Settings → Domains** → Domain eingeben
2. Vercel zeigt dir einen `CNAME`-Eintrag — den bei deinem DNS-Anbieter (deine Domain) setzen
3. Nach 1–60 Min ist's grün
4. `AUTH_URL` in Vercel-Env auf `https://finanz.deinedomain.de` updaten + redeploy

---

## Wartung

- **Code-Update**: jedes `git push` auf `main` → Vercel deployt automatisch neu
- **Schema-Änderungen** (neue Tabellen/Felder): erst lokal `npx prisma db push` (mit gesetztem DATABASE_URL aus .env.local), dann committen
- **Backups**: Neon macht automatisch tägliche Snapshots (Free Tier: 24 h Retention). Für längere Retention → bezahltes Tier
- **Kosten**: Vercel Free (100 GB Bandbreite) + Neon Free (0.5 GB Storage, 191 Compute-Stunden) — reicht für 1 Nutzer locker
