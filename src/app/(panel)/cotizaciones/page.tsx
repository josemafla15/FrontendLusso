"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, formatMoney, truncate } from "@/lib/format";
import type { Cotizacion, Paginado } from "@/lib/types";

export default function CotizacionesPage() {
  const router = useRouter();
  const [data, setData] = useState<Paginado<Cotizacion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (estado) params.set("estado", estado);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const res = await api<Paginado<Cotizacion>>(`cotizaciones?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, [page, estado, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearchChange(value: string) {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(value.trim());
    }, 400);
  }

  const cotizaciones = data?.results ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Cotizaciones</h1>
          {data && (
            <p className="text-sm text-charcoal/60">
              {data.count} {data.count === 1 ? "cotización" : "cotizaciones"}
            </p>
          )}
        </div>
        <Link
          href="/cotizaciones/nueva"
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3.5 py-2 text-sm font-semibold text-cream hover:bg-charcoal/90"
        >
          <Plus className="size-4" />
          Nueva cotización
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cliente o destino…"
            className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-steel focus:ring-2 focus:ring-steel/40"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => {
            setPage(1);
            setEstado(e.target.value);
          }}
          className="rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
        >
          <option value="">Todos los estados</option>
        </select>
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
          <div
            className={`mt-4 hidden overflow-x-auto rounded-xl border border-charcoal/10 bg-white shadow-sm md:block ${loading ? "opacity-60" : ""}`}
          >
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Destino</th>
                  <th className="px-4 py-3 font-semibold">Fechas</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cotizaciones/${c.id}`)}
                    className="cursor-pointer border-b border-charcoal/5 transition-colors last:border-0 hover:bg-steel/10"
                  >
                    <td className="px-4 py-3 text-sm font-semibold">{c.lead_nombre}</td>
                    <td className="px-4 py-3 text-sm text-charcoal/80">{c.destino}</td>
                    <td className="px-4 py-3 text-sm text-charcoal/70">
                      {c.fecha_inicio ? formatDate(c.fecha_inicio) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-charcoal/70">
                      {c.precio_total ? formatMoney(c.precio_total) : c.precio_nota_total ? truncate(c.precio_nota_total, 30) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-charcoal/70">{c.estado}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-charcoal/60">
                      {formatDate(c.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cotizaciones.length === 0 && !loading && (
              <p className="px-4 py-10 text-center text-sm text-charcoal/50">
                No hay cotizaciones con estos filtros.
              </p>
            )}
          </div>

          <div className={`mt-4 space-y-3 md:hidden ${loading ? "opacity-60" : ""}`}>
            {cotizaciones.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/cotizaciones/${c.id}`)}
                className="block w-full rounded-xl border border-charcoal/10 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
              >
                <p className="text-sm font-semibold">{c.lead_nombre}</p>
                <p className="text-xs text-charcoal/50">{c.destino}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-charcoal/60">
                  <span>{c.estado}</span>
                  <span>{formatDate(c.updated_at)}</span>
                </div>
              </button>
            ))}
            {cotizaciones.length === 0 && !loading && (
              <p className="rounded-xl border border-charcoal/10 bg-white px-4 py-10 text-center text-sm text-charcoal/50">
                No hay cotizaciones con estos filtros.
              </p>
            )}
          </div>

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