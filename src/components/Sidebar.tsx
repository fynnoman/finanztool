"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  return (
    <aside className="flex w-60 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative h-12 w-12 shrink-0">
          <Image
            src="/logo.webp"
            alt="Galabau Eifler"
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

      <div className="border-t border-ink-100 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-bronze-50"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
