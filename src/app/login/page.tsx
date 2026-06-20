import Image from "next/image";
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
          <div className="relative mx-auto mb-4 h-20 w-40">
            <Image
              src="/logo.webp"
              alt="Galabau Eifler"
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Hi, Kevin 👋</h1>
          <p className="mt-1 text-sm text-ink-400">Melde dich an.</p>
        </div>
        {sp?.registered && (
          <div className="mb-4 rounded-md bg-bronze-50 px-3 py-2 text-sm text-bronze-800">
            Account angelegt. Jetzt einloggen.
          </div>
        )}
        <div className="panel p-6">
          <LoginForm next={sp?.next} initialError={sp?.error} />
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-bronze-700 hover:underline">
            Konto anlegen
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-300">
          Deine Daten bleiben bei dir.
        </p>
      </div>
    </main>
  );
}
