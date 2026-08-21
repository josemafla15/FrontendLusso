"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import DestinoForm, { valuesFromDestino, DestinoFormValues } from "@/components/catalogo/DestinoForm";
import type { DestinoContenido } from "@/lib/types";

export default function DestinoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [destino, setDestino] = useState<DestinoContenido | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDestino(await api<DestinoContenido>(`destinos/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el destino");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(values: DestinoFormValues) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<DestinoContenido>(`destinos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      setDestino(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar el destino");
    } finally {
      setSaving(false);
    }
  }

  if (error && !destino) {
    return (
      <div>
        <Link href="/destinos" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
          <ArrowLeft className="size-4" /> Volver a destinos
        </Link>
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      </div>
    );
  }

  if (!destino) {
    return (
      <div className="mt-16 flex justify-center text-charcoal/50">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/destinos" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
        <ArrowLeft className="size-4" /> Volver a destinos
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">{destino.nombre}</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6">
        <DestinoForm
          initial={valuesFromDestino(destino)}
          onSubmit={handleSubmit}
          saving={saving}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}