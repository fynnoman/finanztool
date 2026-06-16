"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerUser } from "./actions";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("email", email);
      fd.set("password", password);

      const result = await registerUser(null, fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Direkt einloggen, damit der User nicht noch einmal Credentials eingeben muss.
      const signInRes = await signIn("credentials", {
        email: result.email,
        password,
        redirect: false,
      });
      if (!signInRes || signInRes.error || !signInRes.ok) {
        // Fallback: zum Login mit vorbefüllter E-Mail.
        window.location.href = `/login?registered=1`;
        return;
      }
      window.location.href = "/dashboard";
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">Name</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="email" className="label">E-Mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Passwort (min. 8 Zeichen)</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
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
        {isPending ? "Lege Account an…" : "Account erstellen"}
      </button>
      <p className="text-center text-xs text-ink-400">
        Schon registriert? <Link href="/login" className="text-bronze-700 hover:underline">Zum Login</Link>
      </p>
    </form>
  );
}
