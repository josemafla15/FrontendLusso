"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import CotizacionForm, {
  CotizacionFormValues,
  buildPayload,
} from "@/components/cotizaciones/CotizacionForm";
import { formatDate, formatMoney, truncate } from "@/lib/format";
import type { Cotizacion, LeadDetalle } from "@/lib/types";

function emptyValues(): CotizacionFormValues {
  return {
    nombre_cliente: "",
    destino: "",
    fecha_inicio: "",
    fecha_fin: "",
    num_personas: 1,
    incluye: [],
    no_incluye: [],
    inversion_lineas: [],
    hoteles: [],
    vuelos: [],
  };
}

function LeadContextPanel({ lead }: { lead: LeadDetalle }) {
  const dv = lead.datos_viaje ?? {};
  return (
    <div className="rounded-xl border border-charcoal/10 bg-cream/60 p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">{lead.nombre}</h2>
      <p className="text-sm text-charcoal/60">{lead.contacto}</p>

      {lead.origen === "whatsapp" && (
        <div className="mt-3 space-y-2 text-sm">
          <p><span className="text-charcoal/50">Destino:</span> {dv.destino || "—"}</p>
          <p>
            <span className="text-charcoal/50">Fechas:</span>{" "}
            {dv.fecha_inicio ? `${formatDate(dv.fecha_inicio)} → ${formatDate(dv.fecha_fin)}` : "—"}
          </p>
          <p><span className="text-charcoal/50">Personas:</span> {dv.num_personas ?? "—"}</p>
          <p><span className="text-charcoal/50">Presupuesto:</span> {formatMoney(dv.presupuesto)}</p>
          {dv.notas && <p><span className="text-charcoal/50">Notas:</span> {dv.notas}</p>}
        </div>
      )}

      {lead.origen === "contacto" && (
        <div className="mt-3 space-y-2 text-sm">
          <p><span className="text-charcoal/50">Destino de interés:</span> {lead.destino_interes || "—"}</p>
          {lead.mensaje && (
            <blockquote className="rounded-lg border-l-4 border-steel bg-white px-3 py-2 text-sm">
              {truncate(lead.mensaje, 200)}
            </blockquote>
          )}
        </div>
      )}

      {lead.origen === "whatsapp" && lead.mensajes && lead.mensajes.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-charcoal/10 pt-3">
          {lead.mensajes.slice(-15).map((m) => (
            <p key={m.id} className="text-xs text-charcoal/70">
              <span className="font-semibold capitalize">{m.rol}:</span> {truncate(m.contenido, 120)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function NuevaCotizacionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("lead");

  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [loadingLead, setLoadingLead] = useState(!!leadId);
  const [values, setValues] = useState<CotizacionFormValues>(emptyValues());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscador de leads: oculto por default, el asesor lo abre si quiere vincular uno
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [candidatos, setCandidatos] = useState<LeadDetalle[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoadingLead(true);
    api<LeadDetalle>(`leads/${leadId}`)
      .then((l) => {
        setLead(l);
        const destinoPrecarga =
          l.destino_interes || l.datos_viaje?.destino || "";
        setValues((v) => ({
          ...v,
          nombre_cliente: l.nombre,
          ...(destinoPrecarga ? { destino: destinoPrecarga } : {}),
        }));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el lead"))
      .finally(() => setLoadingLead(false));
  }, [leadId]);

  async function buscarLeads(q: string) {
    setBusqueda(q);
    if (!q.trim()) {
      setCandidatos([]);
      return;
    }
    setBuscando(true);
    try {
      const res = await api<{ results: LeadDetalle[] }>(`leads?search=${encodeURIComponent(q)}`);
      setCandidatos(res.results);
    } finally {
      setBuscando(false);
    }
  }

  function elegirLead(l: LeadDetalle) {
    setLead(l);
    setMostrarBuscador(false);
    setBusqueda("");
    setCandidatos([]);
    setValues((v) => ({ ...v, nombre_cliente: v.nombre_cliente || l.nombre }));
  }

  async function handleSubmit(formValues: CotizacionFormValues) {
    setSaving(true);
    setError(null);
    try {
      const created = await api<Cotizacion>("cotizaciones", {
        method: "POST",
        body: JSON.stringify({ lead: lead?.id ?? null, ...buildPayload(formValues) }),
      });

      // Marca el lead como "cotizado" si aún no está en un estado final.
      // Solo aplica si hay un lead vinculado.
      if (lead && !["cotizado", "ganado", "perdido"].includes(lead.estado)) {
        api(`leads/${lead.id}`, {
          method: "PATCH",
          body: JSON.stringify({ estado: "cotizado" }),
        }).catch(() => {});
      }

      router.push(`/cotizaciones/${created.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear la cotización");
      setSaving(false);
    }
  }

  const backHref = leadId ? `/leads/${leadId}` : "/cotizaciones";

  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal"
      >
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold">Nueva cotización</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {loadingLead && (
        <div className="mt-16 flex justify-center text-charcoal/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!loadingLead && (
        <>
          {!lead && (
            <div className="mt-4">
              {!mostrarBuscador ? (
                <button
                  onClick={() => setMostrarBuscador(true)}
                  className="text-sm text-charcoal/60 underline hover:text-charcoal"
                >
                  Vincular a un lead existente (opcional)
                </button>
              ) : (
                <div className="max-w-md">
                  <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                    Buscar lead
                  </label>
                  <input
                    value={busqueda}
                    onChange={(e) => buscarLeads(e.target.value)}
                    placeholder="Nombre o contacto del lead…"
                    className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
                    autoFocus
                  />
                  {buscando && <Loader2 className="mt-2 size-4 animate-spin text-charcoal/40" />}
                  <div className="mt-2 space-y-1">
                    {candidatos.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => elegirLead(c)}
                        className="block w-full rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-left text-sm hover:bg-steel/10"
                      >
                        {c.nombre} <span className="text-charcoal/50">— {c.contacto}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setMostrarBuscador(false);
                      setBusqueda("");
                      setCandidatos([]);
                    }}
                    className="mt-2 text-xs text-charcoal/50 underline hover:text-charcoal"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={`mt-6 ${lead ? "grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]" : ""}`}>
            {lead && <LeadContextPanel lead={lead} />}
            <CotizacionForm
              initial={values}
              onSubmit={handleSubmit}
              saving={saving}
              submitLabel="Crear cotización"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function NuevaCotizacionPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-16 flex justify-center text-charcoal/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <NuevaCotizacionInner />
    </Suspense>
  );
}