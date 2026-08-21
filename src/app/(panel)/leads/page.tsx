"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Search,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRelative, truncate } from "@/lib/format";
import type { Lead, Origen, Paginado, RolMensaje } from "@/lib/types";
import { ORIGENES } from "@/components/badges";

const TABS: Origen[] = ["popup", "contacto", "whatsapp"];
const DEFAULT_TAB: Origen = "popup";

function isOrigen(value: string | null): value is Origen {
  return value !== null && (TABS as string[]).includes(value);
}

const ROL_ICON: Record<RolMensaje, typeof Bot> = {
  cliente: UserRound,
  bot: Bot,
  asesor: MessageSquare,
  sistema: MessageSquare,
};

function UltimoMensajeCell({ lead }: { lead: Lead }) {
  const msg = lead.ultimo_mensaje;
  if (!msg) return <span className="text-sm text-charcoal/40">Sin mensajes</span>;
  const Icon = ROL_ICON[msg.rol] ?? MessageSquare;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-charcoal/40" />
      <div className="min-w-0">
        <p className="truncate text-sm text-charcoal/80">{msg.contenido}</p>
        <p className="text-xs text-charcoal/50">{formatRelative(msg.created_at)}</p>
      </div>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  if (loading) return null;
  return (
    <p className="px-4 py-10 text-center text-sm text-charcoal/50">
      No hay leads con estos filtros.
    </p>
  );
}

function LeadsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Origen = isOrigen(tabParam) ? tabParam : DEFAULT_TAB;

  const [data, setData] = useState<Paginado<Lead> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cada pestaña arranca con sus propios filtros
  function changeTab(tab: Origen) {
    if (tab === activeTab) return;
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    router.push(`/leads?tab=${tab}`);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("origen", activeTab);
    params.set("page", String(page));
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const res = await api<Paginado<Lead>>(`leads?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los leads");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearchChange(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(value.trim());
    }, 400);
  }

  function goTo(id: string) {
    router.push(`/leads/${id}`);
  }

  const leads = data?.results ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Leads</h1>
          {data && (
            <p className="text-sm text-charcoal/60">
              {data.count} {data.count === 1 ? "lead" : "leads"}
            </p>
          )}
        </div>
      </div>

      {/* Pestañas por origen */}
      <div className="mt-4 flex gap-1 border-b border-charcoal/10">
        {TABS.map((tab) => {
          const cfg = ORIGENES[tab];
          const Icon = cfg.Icon;
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-charcoal text-charcoal"
                  : "border-transparent text-charcoal/50 hover:text-charcoal/80"
              }`}
            >
              <Icon className="size-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, contacto…"
            className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40"
          />
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="mt-16 flex justify-center text-charcoal/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {data && (
        <>
          {activeTab === "popup" && (
            <PopupTable leads={leads} loading={loading} onSelect={goTo} />
          )}
          {activeTab === "contacto" && (
            <ContactoTable leads={leads} loading={loading} onSelect={goTo} />
          )}
          {activeTab === "whatsapp" && (
            <WhatsappTable leads={leads} loading={loading} onSelect={goTo} />
          )}

          {/* Paginación */}
          {(data.next || data.previous) && (
            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={!data.previous || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm transition hover:bg-charcoal/5 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </button>
              <span className="text-sm text-charcoal/60">Página {page}</span>
              <button
                disabled={!data.next || loading}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm transition hover:bg-charcoal/5 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface TableProps {
  leads: Lead[];
  loading: boolean;
  onSelect: (id: string) => void;
}

function PopupTable({ leads, loading, onSelect }: TableProps) {
  return (
    <>
      <div
        className={`mt-4 hidden overflow-x-auto rounded-xl border border-charcoal/10 bg-white shadow-sm md:block ${loading ? "opacity-60" : ""}`}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Contacto</th>
              <th className="px-4 py-3 font-semibold">Creado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className="cursor-pointer border-b border-charcoal/5 transition-colors last:border-0 hover:bg-steel/10"
              >
                <td className="px-4 py-3 text-sm font-semibold">{lead.nombre}</td>
                <td className="px-4 py-3 text-sm text-charcoal/80">{lead.contacto}</td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-charcoal/60">
                  {formatRelative(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <EmptyState loading={loading} />}
      </div>

      <div className={`mt-4 space-y-3 md:hidden ${loading ? "opacity-60" : ""}`}>
        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onSelect(lead.id)}
            className="block w-full rounded-xl border border-charcoal/10 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <p className="truncate text-sm font-semibold">{lead.nombre}</p>
            <p className="truncate text-xs text-charcoal/50">{lead.contacto}</p>
            <p className="mt-2 text-xs text-charcoal/60">
              {formatRelative(lead.created_at)}
            </p>
          </button>
        ))}
        {leads.length === 0 && (
          <p className="rounded-xl border border-charcoal/10 bg-white px-4 py-10 text-center text-sm text-charcoal/50">
            {!loading && "No hay leads con estos filtros."}
          </p>
        )}
      </div>
    </>
  );
}

function ContactoTable({ leads, loading, onSelect }: TableProps) {
  return (
    <>
      <div
        className={`mt-4 hidden overflow-x-auto rounded-xl border border-charcoal/10 bg-white shadow-sm md:block ${loading ? "opacity-60" : ""}`}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Contacto</th>
              <th className="px-4 py-3 font-semibold">Destino de interés</th>
              <th className="px-4 py-3 font-semibold">Mensaje</th>
              <th className="px-4 py-3 font-semibold">Creado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className="cursor-pointer border-b border-charcoal/5 transition-colors last:border-0 hover:bg-steel/10"
              >
                <td className="px-4 py-3 text-sm font-semibold">{lead.nombre}</td>
                <td className="px-4 py-3 text-sm text-charcoal/80">{lead.contacto}</td>
                <td className="px-4 py-3 text-sm text-charcoal/80">
                  {lead.destino_interes || "—"}
                </td>
                <td className="max-w-64 px-4 py-3 text-sm text-charcoal/70">
                  {truncate(lead.mensaje, 60) || "—"}
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-charcoal/60">
                  {formatRelative(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <EmptyState loading={loading} />}
      </div>

      <div className={`mt-4 space-y-3 md:hidden ${loading ? "opacity-60" : ""}`}>
        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onSelect(lead.id)}
            className="block w-full rounded-xl border border-charcoal/10 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <p className="truncate text-sm font-semibold">{lead.nombre}</p>
            <p className="truncate text-xs text-charcoal/50">{lead.contacto}</p>
            {lead.destino_interes && (
              <p className="mt-2 text-xs text-charcoal/60">{lead.destino_interes}</p>
            )}
            {lead.mensaje && (
              <p className="mt-2 truncate text-sm text-charcoal/70">
                {truncate(lead.mensaje, 60)}
              </p>
            )}
            <p className="mt-2 text-xs text-charcoal/50">
              {formatRelative(lead.created_at)}
            </p>
          </button>
        ))}
        {leads.length === 0 && (
          <p className="rounded-xl border border-charcoal/10 bg-white px-4 py-10 text-center text-sm text-charcoal/50">
            {!loading && "No hay leads con estos filtros."}
          </p>
        )}
      </div>
    </>
  );
}

function WhatsappTable({ leads, loading, onSelect }: TableProps) {
  return (
    <>
      <div
        className={`mt-4 hidden overflow-x-auto rounded-xl border border-charcoal/10 bg-white shadow-sm md:block ${loading ? "opacity-60" : ""}`}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Destino</th>
              <th className="px-4 py-3 font-semibold">Último mensaje</th>
              <th className="px-4 py-3 font-semibold">Creado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onSelect(lead.id)}
                className="cursor-pointer border-b border-charcoal/5 transition-colors last:border-0 hover:bg-steel/10"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{lead.nombre}</p>
                  <p className="text-xs text-charcoal/50">{lead.contacto}</p>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-charcoal/80">
                  {lead.telefono || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-charcoal/80">
                  {lead.datos_viaje?.destino || "—"}
                </td>
                <td className="max-w-64 px-4 py-3">
                  <UltimoMensajeCell lead={lead} />
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap text-charcoal/60">
                  {formatRelative(lead.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <EmptyState loading={loading} />}
      </div>

      <div className={`mt-4 space-y-3 md:hidden ${loading ? "opacity-60" : ""}`}>
        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onSelect(lead.id)}
            className="block w-full rounded-xl border border-charcoal/10 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{lead.nombre}</p>
                <p className="truncate text-xs text-charcoal/50">
                  {lead.telefono || lead.contacto}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-charcoal/60">
              {lead.datos_viaje?.destino && <span>{lead.datos_viaje.destino}</span>}
              <span className="ml-auto">{formatRelative(lead.created_at)}</span>
            </div>
            <div className="mt-3 border-t border-charcoal/5 pt-2">
              <UltimoMensajeCell lead={lead} />
            </div>
          </button>
        ))}
        {leads.length === 0 && (
          <p className="rounded-xl border border-charcoal/10 bg-white px-4 py-10 text-center text-sm text-charcoal/50">
            {!loading && "No hay leads con estos filtros."}
          </p>
        )}
      </div>
    </>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-16 flex justify-center text-charcoal/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <LeadsPageInner />
    </Suspense>
  );
}