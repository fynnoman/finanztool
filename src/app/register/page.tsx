import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900 font-display text-lg font-medium text-white">
            F
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Account erstellen</h1>
          <p className="mt-1 text-sm text-ink-400">Zugang zum Finanztool anlegen.</p>
        </div>
        <div className="panel p-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-300">
          Daten liegen auf deinem Server · keine Drittanbieter
        </p>
      </div>
    </main>
  );
}
