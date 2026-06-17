"use client";

import { useFormStatus } from "react-dom";
import { ReactNode } from "react";

/**
 * Submit-Button, der während der laufenden Server-Action disabled ist.
 * Verhindert Mehrfach-Submits, wenn der User wiederholt klickt, während die
 * Action noch läuft (Cold-Start + langsame DB sonst → Duplikate in der DB).
 */
export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingLabel = "Speichere…",
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
