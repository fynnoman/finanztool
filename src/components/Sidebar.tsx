"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Calendar,
  Calculator,
  Settings,
  LogOut,
  Sparkles,
  TrendingDown,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Sparkles },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/angebote", label: "Angebote", icon: FileText },
  { href: "/rechnungen", label: "Rechnungen", icon: Receipt },
  { href: "/ausgaben", label: "Ausgaben", icon: TrendingDown },
  { href: "/bareinnahmen", label: "Bareinnahmen", icon: Banknote },
  { href: "/kalender", label: "Kalender", icon: Calendar },
  { href: "/steuern", label: "Steuern", icon: Calculator },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col border-r border-ink-100 bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 font-display text-base font-medium text-white">
          {businessName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-900">{businessName}</div>
          <div className="text-[11px] uppercase tracking-wider text-ink-400">Finanztool</div>
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
                      ? "bg-ink-900 text-white"
                      : "text-ink-700 hover:bg-ink-50"
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-50"
        >
          <LogOut size={16} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
