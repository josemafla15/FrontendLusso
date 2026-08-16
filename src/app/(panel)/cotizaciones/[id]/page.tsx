"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, FileDown, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import CotizacionForm, {
  valuesFromCotizacion,
  buildPayload,
} from "@/components/cotizaciones/CotizacionForm";
import type { Cotizacion } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

export default function CotizacionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nombreArchivo, setNombreArchivo] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDeadline = useRef<number>(0);

  const load = useCallback(async () => {
    try {
      const c = await api<Cotizacion>(`cotizaciones/${id}`);
      setCotizacion(c);
      setNombreArchivo((prev) => prev || `${c.lead_nombre} - ${c.destino}`);
      return c;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la cotización");
      return null;
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [load]);

  async function handleSubmit(formValues: ReturnType<typeof valuesFromCotizacion>) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Cotizacion>(`cotizaciones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(formValues)),
      });
      setCotizacion(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar la cotización");
    } finally {
      setSaving(false);
    }
  }

  function pollPdf() {
    if (Date.now() > pollDeadline.current) {
      setGenerandoPdf(false);
      setPdfError("La generación está tardando más de lo esperado, intentá de nuevo.");
      return;
    }
    pollTimer.current = setTimeout(async () => {
      const c = await load();
      if (c && c.pdf_url) {
        setGenerandoPdf(false);
        setPdfError(null);
        return;
      }
      pollPdf();
    }, POLL_INTERVAL_MS);
  }

  async function generarPdf() {
    if (!nombreArchivo.trim()) return;
    setPdfError(null);
    setGenerandoPdf(true);
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;
    try {
      await api(`cotizaciones/${id}/generar-pdf`, {
        method: "POST",
        body: JSON.stringify({ nombre_archivo: nombreArchivo.trim() }),
      });
      // pdf_url se vacía en el backend apenas se encola -- reflejarlo localmente
      // para que el polling detecte bien el cambio aunque ya hubiera un PDF previo
      setCotizacion((prev) => (prev ? { ...prev, pdf_url: "" } : prev));
      pollPdf();
    } catch (e) {
      setGenerandoPdf(false);
      setPdfError(e instanceof ApiError ? e.message : "No se pudo iniciar la generación del PDF");
    }
  }

  if (error && !cotizacion) {
    return (
      <div>
        <Link href="/cotizaciones" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
          <ArrowLeft className="size-4" /> Volver a cotizaciones
        </Link>
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="mt-16 flex justify-center text-charcoal/50">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cotizaciones" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
          <ArrowLeft className="size-4" /> Volver a cotizaciones
        </Link>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <input
              value={nombreArchivo}
              onChange={(e) => setNombreArchivo(e.target.value)}
              placeholder="Nombre del archivo PDF"
              disabled={generandoPdf}
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-steel disabled:opacity-60"
            />
            <button
              onClick={generarPdf}
              disabled={generandoPdf || !nombreArchivo.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-50"
            >
              {generandoPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              {generandoPdf ? "Generando…" : "Generar PDF"}
            </button>
          </div>

          {generandoPdf && (
            <p className="text-xs text-charcoal/50">
              Puede tardar hasta 30 segundos, no cierres esta página.
            </p>
          )}

          {pdfError && (
            <p className="text-xs text-rose-600">{pdfError}</p>
          )}

          {!generandoPdf && cotizacion.pdf_url && (
            <a
              href={cotizacion.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
            >
              <Check className="size-3.5" />
              Ver último PDF generado
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <h1 className="mt-3 font-display text-3xl font-semibold">{cotizacion.lead_nombre}</h1>
      <p className="text-sm text-charcoal/60">
        {cotizacion.destino} · v{cotizacion.version} · {cotizacion.estado}
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6">
        <CotizacionForm
          initial={valuesFromCotizacion(cotizacion)}
          onSubmit={handleSubmit}
          saving={saving}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}