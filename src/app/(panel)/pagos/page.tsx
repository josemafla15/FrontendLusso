"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, formatMilesInput, formatMoney, parseMilesInput } from "@/lib/format";
import type { EstadoPago, Pago, Paginado } from "@/lib/types";
import { ESTADOS_PAGO, EstadoPagoBadge } from "@/components/badges";

function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard no disponible, se ignora
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-charcoal px-3 py-2 text-sm font-semibold text-cream transition hover:bg-charcoal/90"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copiado" : label}
    </button>
  );
}

function NuevoPagoLinkForm({ onCreated }: { onCreated: () => void }) {
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [montoDisplay, setMontoDisplay] = useState("");
  const [contacto, setContacto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<Pago | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const monto = parseMilesInput(montoDisplay);
    if (!nombre.trim() || !destino.trim() || !contacto.trim() || monto <= 0) {
      setError("Completa todos los campos con un monto válido.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const pago = await api<Pago>("pagos", {
        method: "POST",
        body: JSON.stringify({
          cliente_nombre: nombre.trim(),
          destino: destino.trim(),
          monto: String(monto),
          cliente_contacto: contacto.trim(),
        }),
      });
      setCreado(pago);
      setNombre("");
      setDestino("");
      setMontoDisplay("");
      setContacto("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el link de pago");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-charcoal/10 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="font-display text-xl font-semibold">Nuevo link de pago</h2>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50" htmlFor="np-nombre">
            Nombre del cliente
          </label>
          <input
            id="np-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50" htmlFor="np-destino">
            Destino
          </label>
          <input
            id="np-destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50" htmlFor="np-monto">
            Monto (COP)
          </label>
          <input
            id="np-monto"
            inputMode="numeric"
            placeholder="0"
            value={montoDisplay}
            onChange={(e) => setMontoDisplay(formatMilesInput(e.target.value))}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40 disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-charcoal/50" htmlFor="np-contacto">
            Contacto del cliente
          </label>
          <input
            id="np-contacto"
            placeholder="Teléfono o email"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
          Generar link de pago
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {creado && (
        <div className="mt-4 rounded-lg border border-sage bg-sage/20 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-charcoal/60">
            Link generado para {creado.cliente_nombre}
          </p>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-inset ring-charcoal/10">
              {creado.link_pago}
            </code>
            <CopyButton value={creado.link_pago} label="Copiar link" />
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
      <div className="mt-0.5 text-sm text-charcoal/90">{children}</div>
    </div>
  );
}

function PagoDetalle({ pago }: { pago: Pago }) {
  return (
    <div className="space-y-4 border-t border-charcoal/10 bg-cream/60 px-4 py-4 sm:px-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetalleItem label="Cliente">{pago.cliente_nombre}</DetalleItem>
        <DetalleItem label="Contacto">{pago.cliente_contacto}</DetalleItem>
        <DetalleItem label="Destino">{pago.destino}</DetalleItem>
        <DetalleItem label="Monto">{formatMoney(pago.monto)}</DetalleItem>
        <DetalleItem label="Descripción">{pago.descripcion || "—"}</DetalleItem>
        <DetalleItem label="Método de pago">{pago.metodo_pago || "—"}</DetalleItem>
        <DetalleItem label="Referencia">{pago.referencia || "—"}</DetalleItem>
        <DetalleItem label="Lead asociado">{pago.lead_nombre || "—"}</DetalleItem>
        <DetalleItem label="Creado">{formatDateTime(pago.created_at)}</DetalleItem>
        <DetalleItem label="Actualizado">{formatDateTime(pago.updated_at)}</DetalleItem>
      </div>

      <div className="border-t border-charcoal/10 pt-4">
        <p className="text-xs uppercase tracking-wide text-charcoal/50">ID de transacción Wompi</p>
        <p className="mt-1 text-[11px] text-charcoal/50">
          Úsalo para buscar la transacción en el dashboard de Wompi si el cliente solicita un reembolso — el
          reembolso es un proceso manual, no automático desde aquí.
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-inset ring-charcoal/10">
            {pago.wompi_transaction_id || "—"}
          </code>
          {pago.wompi_transaction_id && <CopyButton value={pago.wompi_transaction_id} />}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-charcoal/50">Link de pago</p>
        <div className="mt-1.5 flex items-center gap-2">
          <a
            href={pago.link_pago}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-charcoal/80 underline decoration-steel ring-1 ring-inset ring-charcoal/10 hover:text-charcoal"
          >
            {pago.link_pago}
          </a>
          <CopyButton value={pago.link_pago} />
        </div>
      </div>
    </div>
  );
}

function PagoRow({
  pago,
  expanded,
  onToggle,
}: {
  pago: Pago;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-charcoal/5 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-steel/10"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{pago.cliente_nombre}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-charcoal/50">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{pago.destino}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold whitespace-nowrap">{formatMoney(pago.monto)}</span>
          <EstadoPagoBadge estado={pago.estado} />
        </div>
      </button>
      {expanded && <PagoDetalle pago={pago} />}
    </div>
  );
}

export default function PagosPage() {
  const [data, setData] = useState<Paginado<Pago> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estado, setEstado] = useState<EstadoPago | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (estado) params.set("estado", estado);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const res = await api<Paginado<Pago>>(`pagos?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [page, estado, debouncedSearch]);

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

  function handleCreated() {
    // Si ya estamos en la página 1, el cambio de página no dispara el efecto: recargamos a mano
    if (page === 1) {
      load();
    } else {
      setPage(1);
    }
  }

  const pagos = data?.results ?? [];

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-semibold">Pagos</h1>
        {data && (
          <p className="text-sm text-charcoal/60">
            {data.count} {data.count === 1 ? "pago" : "pagos"}
          </p>
        )}
      </div>

      <div className="mt-4">
        <NuevoPagoLinkForm onCreated={handleCreated} />
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, referencia…"
            className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-steel focus:ring-2 focus:ring-steel/40"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => {
            setPage(1);
            setEstado(e.target.value as EstadoPago | "");
          }}
          className="rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_PAGO).map(([value, cfg]) => (
            <option key={value} value={value}>
              {cfg.label}
            </option>
          ))}
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
            className={`mt-4 overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-sm ${loading ? "opacity-60" : ""}`}
          >
            {pagos.map((pago) => (
              <PagoRow
                key={pago.id}
                pago={pago}
                expanded={expandedId === pago.id}
                onToggle={() => setExpandedId((id) => (id === pago.id ? null : pago.id))}
              />
            ))}
            {pagos.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-charcoal/50">
                {!loading && "No hay pagos con estos filtros."}
              </p>
            )}
          </div>

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
