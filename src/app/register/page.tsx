import Image from "next/image";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 h-20 w-40">
            <Image
              src="/logo.webp"
              alt="Garten- und Landschaftsbau Eifler"
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-medium tracking-tight">Konto anlegen</h1>
          <p className="mt-1 text-sm text-ink-400">Nur ein paar Klicks, Kevin.</p>
        </div>
        <div className="panel p-6">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-xs text-ink-300">
          Deine Daten bleiben bei dir · keine Drittanbieter
        </p>
      </div>
    </main>
  );
}
