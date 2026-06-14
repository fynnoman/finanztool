"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!res) {
          setError("Keine Antwort vom Auth-Server.");
          return;
        }
        if (res.error || !res.ok) {
          setError(
            res.error === "CredentialsSignin"
              ? "E-Mail oder Passwort falsch."
              : `Login fehlgeschlagen (${res.error ?? "unbekannt"}).`
          );
          return;
        }

        // Vollständiger Page-Reload damit der frische Session-Cookie sicher
        // mitgeschickt wird und die Middleware ihn beim ersten Request sieht.
        window.location.href = next || "/dashboard";
      } catch (err) {
        setError(`Fehler: ${(err as Error).message}`);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">E-Mail</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Passwort</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full disabled:opacity-50"
      >
        {isPending ? "Einen Moment…" : "Anmelden"}
      </button>
    </form>
  );
}
