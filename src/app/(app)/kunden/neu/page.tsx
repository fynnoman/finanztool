import { createCustomer } from "../actions";
import Link from "next/link";

export default function NeuerKundePage() {
  return (
    <div>
      <header className="mb-6">
        <Link href="/kunden" className="text-sm text-ink-400 hover:underline">
          ← Kunden
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium">Neuer Kunde</h1>
      </header>

      <form action={createCustomer} className="panel max-w-2xl p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Name *</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="label">Firma</label>
            <input className="input" name="company" />
          </div>
          <div>
            <label className="label">E-Mail</label>
            <input className="input" name="email" type="email" />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" name="phone" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Adresse</label>
            <textarea className="input min-h-20" name="address" />
          </div>
          <div>
            <label className="label">USt-ID</label>
            <input className="input" name="taxId" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notizen</label>
            <textarea className="input min-h-24" name="notes" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Link href="/kunden" className="btn btn-outline">Abbrechen</Link>
          <button type="submit" className="btn btn-primary">Anlegen</button>
        </div>
      </form>
    </div>
  );
}
