"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Home,
  Users,
  FileText,
  Receipt,
  Calendar,
  Calculator,
  Settings,
  LogOut,
  Sparkles,
  TrendingDown,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", label: "Start", icon: Home },
  { href: "/leads", label: "Anfragen", icon: Sparkles },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/rechnungen", label: "Rechnungen", icon: Receipt },
  { href: "/ausgaben", label: "Ausgaben", icon: TrendingDown },
  { href: "/kalender", label: "Termine", icon: Calendar },
  { href: "/steuern", label: "Steuern", icon: Calculator },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Drawer schließen, sobald der Nutzer eine Route wechselt.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body-Scroll sperren, wenn das mobile Drawer offen ist.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const NavList = (
    <nav className="flex-1 px-3 py-2">
      <ul className="space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-bronze-600 text-white"
                    : "text-ink-700 hover:bg-bronze-50"
                )}
              >
                <Icon size={16} className={cn(active ? "" : "text-ink-400")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const Brand = (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="relative h-12 w-12 shrink-0">
        <Image
          src="/logo.webp"
          alt="Garten- und Landschaftsbau Eifler"
          fill
          sizes="48px"
          className="object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink-900">{businessName}</div>
        <div className="text-[11px] uppercase tracking-wider text-ink-400">Kevin Eifler</div>
      </div>
    </div>
  );

  const SignOutButton = (
    <div className="border-t border-ink-100 p-3">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-bronze-50"
      >
        <LogOut size={16} />
        Abmelden
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop-Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-ink-100 bg-white md:flex">
        {Brand}
        {NavList}
        {SignOutButton}
      </aside>

      {/* Mobile-Topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo.webp"
              alt="Garten- und Landschaftsbau Eifler"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
          <span className="truncate text-sm font-semibold text-ink-900">{businessName}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-bronze-50"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile-Drawer + Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink-900/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-ink-100 bg-white shadow-card transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between border-b border-ink-100 pr-2">
          {Brand}
          <button
            type="button"
            aria-label="Menü schließen"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-bronze-50"
          >
            <X size={20} />
          </button>
        </div>
        {NavList}
        {SignOutButton}
      </div>
    </>
  );
}
