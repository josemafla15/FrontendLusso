"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  FileText,
  Hotel,
  LogOut,
  MapPin,
  Menu,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Usuario } from "@/lib/types";

const NAV = [
  { href: "/leads", label: "Leads", Icon: Users },
  { href: "/cotizaciones", label: "Cotizaciones", Icon: FileText },
  { href: "/destinos", label: "Destinos", Icon: MapPin },
  { href: "/hoteles", label: "Hoteles", Icon: Hotel },
  { href: "/pagos", label: "Pagos", Icon: CreditCard },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-sage/20 text-sage font-semibold"
                : "text-cream/70 hover:bg-white/5 hover:text-cream"
            }`}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-6 py-6">
      <p className="font-display text-2xl font-semibold tracking-wide text-cream">
        Lusso Travel
      </p>
      <p className="text-xs uppercase tracking-[0.2em] text-steel">
        Panel de asesores
      </p>
    </div>
  );
}

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const router = useRouter();

  useEffect(() => {
    api<Usuario>("me").then(setUser).catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
    : "";

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      {/* Sidebar escritorio */}
      <aside className="hidden md:flex md:flex-col bg-charcoal">
        <Brand />
        <NavLinks />
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-charcoal/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-charcoal shadow-xl">
            <div className="flex items-start justify-between pr-3">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="mt-5 rounded-md p-2 text-cream/70 hover:text-cream"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-charcoal/10 bg-cream/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-charcoal hover:bg-charcoal/5 md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <p className="font-display text-lg font-semibold md:hidden">
            Lusso Travel
          </p>
          <div className="ml-auto flex items-center gap-3">
            {displayName && (
              <span className="hidden text-sm text-charcoal/70 sm:inline">
                {displayName}
              </span>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm text-charcoal/80 transition-colors hover:bg-charcoal hover:text-cream"
            >
              <LogOut className="size-4" />
              Salir
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}