import { prisma } from "@/lib/db";
import { updateSettings, changePassword } from "./actions";
import { LogoUploader } from "./LogoUploader";
import { OpenAITester } from "./OpenAITester";

export default async function EinstellungenPage() {
  const settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    return <div className="panel p-6">Stammdaten werden initialisiert. Bitte Seite neu laden.</div>;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-medium">Einstellungen</h1>
        <p className="mt-1 text-sm text-ink-400">Firma, Bank, Logo, Passwort.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <form action={updateSettings} className="md:col-span-2 space-y-6">
          <section className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Firma</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Firmenname</label>
                <input className="input" name="businessName" defaultValue={settings.businessName} required />
              </div>
              <div>
                <label className="label">E-Mail</label>
                <input className="input" name="businessEmail" defaultValue={settings.businessEmail} type="email" />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" name="businessPhone" defaultValue={settings.businessPhone} />
              </div>
              <div>
                <label className="label">USt-ID</label>
                <input className="input" name="taxId" defaultValue={settings.taxId} />
              </div>
              <div>
                <label className="label">Steuernummer</label>
                <input className="input" name="taxNumber" defaultValue={settings.taxNumber} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Anschrift</label>
                <textarea className="input min-h-24" name="businessAddress" defaultValue={settings.businessAddress} />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Bankverbindung</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Bank</label>
                <input className="input" name="bankName" defaultValue={settings.bankName} />
              </div>
              <div>
                <label className="label">BIC</label>
                <input className="input" name="bic" defaultValue={settings.bic} />
              </div>
              <div className="md:col-span-2">
                <label className="label">IBAN</label>
                <input className="input font-mono" name="iban" defaultValue={settings.iban} />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="mb-1 font-display text-lg font-medium">OpenAI</h2>
            <p className="mb-4 text-xs text-ink-400">
              Schaltet Rechnungs-OCR und Dashboard-Vorschläge frei. Der Key wird verschlüsselt nirgendwo öffentlich angezeigt.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="label">API-Key</label>
                <input
                  className="input font-mono"
                  name="openaiApiKey"
                  type="password"
                  autoComplete="off"
                  placeholder={settings.openaiApiKey ? "Hinterlegt — leer lassen zum Behalten, oder neu setzen" : "sk-..."}
                  defaultValue=""
                />
              </div>
              <div>
                <label className="label">Modell</label>
                <select className="input" name="openaiModel" defaultValue={settings.openaiModel}>
                  <option value="gpt-4o-mini">gpt-4o-mini (günstig)</option>
                  <option value="gpt-4o">gpt-4o (präziser)</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                  <option value="gpt-4.1">gpt-4.1</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <OpenAITester />
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Rechnungen — Standards</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="label">MwSt. in %</label>
                <input className="input" name="vatRate" type="number" step="0.1" defaultValue={settings.vatRate} />
              </div>
              <div>
                <label className="label">Zahlbar in Tagen</label>
                <input className="input" name="paymentTermsDays" type="number" defaultValue={settings.paymentTermsDays} />
              </div>
              <div>
                <label className="label">Rechnungs-Nummer beginnt mit</label>
                <input className="input" name="invoiceNumberPrefix" defaultValue={settings.invoiceNumberPrefix} />
              </div>
              <div>
                <label className="label">Angebots-Nummer beginnt mit</label>
                <input className="input" name="quoteNumberPrefix" defaultValue={settings.quoteNumberPrefix} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Text ganz unten auf der Rechnung</label>
                <input className="input" name="invoiceFooter" defaultValue={settings.invoiceFooter} />
              </div>
            </div>
          </section>

          <button type="submit" className="btn btn-primary">Speichern</button>
        </form>

        <aside className="space-y-6">
          <section className="panel p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Logo</h2>
            <LogoUploader existing={settings.logoDataUrl ?? null} />
          </section>

          <form action={changePassword} className="panel space-y-4 p-6">
            <h2 className="font-display text-lg font-medium">Passwort ändern</h2>
            <div>
              <label className="label">Altes Passwort</label>
              <input className="input" type="password" name="current" required autoComplete="current-password" />
            </div>
            <div>
              <label className="label">Neues Passwort (min. 8 Zeichen)</label>
              <input className="input" type="password" name="next" required autoComplete="new-password" minLength={8} />
            </div>
            <button type="submit" className="btn btn-primary w-full">Speichern</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
