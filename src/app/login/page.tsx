import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-ink-900 font-display text-lg font-medium text-white">
            F
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Finanztool</h1>
          <p className="mt-1 text-sm text-ink-400">Bitte anmelden.</p>
        </div>
        {sp?.registered && (
          <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Account angelegt. Bitte einloggen.
          </div>
        )}
        <div className="panel p-6">
          <LoginForm next={sp?.next} initialError={sp?.error} />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-bronze-700 hover:underline">
            Account erstellen
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-300">
          Daten liegen auf deinem Server
        </p>
      </div>
    </main>
  );
}
