"use client";

import { ReactNode } from "react";

/**
 * Submit-Button mit nativem confirm()-Dialog. Funktioniert nur in einer
 * Client Component — onClick auf Buttons in Server Components wird stumm
 * gedroppt, was bei Delete-Aktionen zu Daten­verlust ohne Rückfrage führt.
 */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
