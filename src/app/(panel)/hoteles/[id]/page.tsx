"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import HotelForm, { valuesFromHotel, HotelFormValues } from "@/components/catalogo/HotelForm";
import type { DestinoContenido, HotelPartner } from "@/lib/types";

export default function HotelDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<HotelPartner | null>(null);
  const [destinoNombre, setDestinoNombre] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const h = await api<HotelPartner>(`hoteles/${id}`);
      setHotel(h);
      if (h.destino) {
        api<DestinoContenido>(`destinos/${h.destino}`)
          .then((d) => setDestinoNombre(d.nombre))
          .catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el hotel");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(values: HotelFormValues) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<HotelPartner>(`hoteles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      setHotel(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar el hotel");
    } finally {
      setSaving(false);
    }
  }

  if (error && !hotel) {
    return (
      <div>
        <Link href="/hoteles" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
          <ArrowLeft className="size-4" /> Volver a hoteles
        </Link>
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="mt-16 flex justify-center text-charcoal/50">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/hoteles" className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal">
        <ArrowLeft className="size-4" /> Volver a hoteles
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">{hotel.nombre}</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6">
        <HotelForm
          initial={valuesFromHotel(hotel)}
          destinoNombreInicial={destinoNombre}
          onSubmit={handleSubmit}
          saving={saving}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}