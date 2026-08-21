"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import type { HotelPartner, Paginado } from "@/lib/types";

export default function HotelesPage() {
  const [hoteles, setHoteles] = useState<HotelPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await api<Paginado<HotelPartner> | HotelPartner[]>(
        `hoteles?${params.toString()}`
      );
      setHoteles(Array.isArray(res) ? res : res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar hoteles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  function onSearchChange(value: string) {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(value.trim()), 400);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Hoteles</h1>
        <Link
          href="/hoteles/nuevo"
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3.5 py-2 text-sm font-semibold text-cream hover:bg-charcoal/90"
        >
          <Plus className="size-4" />
          Nuevo hotel
        </Link>
      </div>

      <div className="relative mt-4 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre o ciudad…"
          className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-steel"
        />
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-16 flex justify-center text-charcoal/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hoteles.map((h) => (
            <Link
              key={h.id}
              href={`/hoteles/${h.id}`}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-charcoal/10 bg-white p-3 shadow-sm transition hover:bg-steel/10"
            >
              {h.imagen_1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={h.imagen_1}
                  alt={h.nombre}
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="size-14 shrink-0 rounded-lg bg-charcoal/10" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{h.nombre}</p>
                <p className="truncate text-xs text-charcoal/50">
                  {h.ciudad}
                  {!h.activo && " · inactivo"}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-lg border border-charcoal/15 px-2.5 py-1 text-xs text-charcoal/70">
                <Pencil className="size-3.5" />
                Editar
              </span>
            </Link>
          ))}
          {hoteles.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-charcoal/50">
              No hay hoteles cargados todavía.
            </p>
          )}
        </div>
      )}
    </div>
  );
}