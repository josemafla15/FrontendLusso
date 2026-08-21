"use client";

import { useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import ImageUploadSlot from "./ImageUploadSlot";
import type { DestinoContenido, HotelPartner, Paginado } from "@/lib/types";

export interface HotelFormValues {
  destino: number | null;
  nombre: string;
  ciudad: string;
  direccion: string;
  descripcion: string;
  activo: boolean;
  imagen_1: string;
  imagen_2: string;
  imagen_3: string;
}

export function emptyHotelValues(destinoInicial: number | null = null): HotelFormValues {
  return {
    destino: destinoInicial,
    nombre: "",
    ciudad: "",
    direccion: "",
    descripcion: "",
    activo: true,
    imagen_1: "",
    imagen_2: "",
    imagen_3: "",
  };
}

export function valuesFromHotel(h: HotelPartner): HotelFormValues {
  return {
    destino: h.destino ?? null,
    nombre: h.nombre ?? "",
    ciudad: h.ciudad ?? "",
    direccion: h.direccion ?? "",
    descripcion: h.descripcion ?? "",
    activo: h.activo ?? true,
    imagen_1: h.imagen_1 ?? "",
    imagen_2: h.imagen_2 ?? "",
    imagen_3: h.imagen_3 ?? "",
  };
}

function CharCounterInput({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  const cerca = value.length >= maxLength * 0.9;
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-charcoal/50">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
      />
      <p className={`mt-1 text-right text-xs ${cerca ? "text-amber-600" : "text-charcoal/40"}`}>
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

function CharCounterTextarea({
  label,
  value,
  onChange,
  maxLength,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  rows?: number;
}) {
  const cerca = value.length >= maxLength * 0.9;
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-charcoal/50">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        rows={rows}
        className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
      />
      <p className={`mt-1 text-right text-xs ${cerca ? "text-amber-600" : "text-charcoal/40"}`}>
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

function DestinoSelector({
  destinoId,
  destinoNombreInicial,
  onSelect,
}: {
  destinoId: number | null;
  destinoNombreInicial?: string;
  onSelect: (d: DestinoContenido | null) => void;
}) {
  const [query, setQuery] = useState(destinoNombreInicial ?? "");
  const [results, setResults] = useState<DestinoContenido[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    setQuery(v);
    onSelect(null);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api<Paginado<DestinoContenido> | DestinoContenido[]>(
          `destinos?search=${encodeURIComponent(v)}`
        );
        setResults(Array.isArray(res) ? res : res.results);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div className="relative">
      <label className="block text-xs uppercase tracking-wide text-charcoal/50">Destino</label>
      <div className="relative mt-1.5">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar destino…"
          className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-steel"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-charcoal/40" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-charcoal/10 bg-white shadow-lg">
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                onSelect(d);
                setQuery(d.nombre);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-steel/10"
            >
              {d.nombre}
            </button>
          ))}
        </div>
      )}
      {query && !destinoId && (
        <p className="mt-1.5 text-xs text-rose-600">
          Elegí un destino de la lista — el texto libre no es válido.
        </p>
      )}
    </div>
  );
}

export default function HotelForm({
  initial,
  destinoNombreInicial,
  onSubmit,
  saving,
  submitLabel = "Guardar",
}: {
  initial?: HotelFormValues;
  destinoNombreInicial?: string;
  onSubmit: (values: HotelFormValues) => void;
  saving: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<HotelFormValues>(initial ?? emptyHotelValues());

  function patch(p: Partial<HotelFormValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Datos generales</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <DestinoSelector
            destinoId={values.destino}
            destinoNombreInicial={destinoNombreInicial}
            onSelect={(d) => patch({ destino: d ? d.id : null })}
          />
          <CharCounterInput
            label="Nombre del hotel"
            value={values.nombre}
            onChange={(nombre) => patch({ nombre })}
            maxLength={100}
          />
          <CharCounterInput
            label="Ciudad"
            value={values.ciudad}
            onChange={(ciudad) => patch({ ciudad })}
            maxLength={100}
          />
          <CharCounterInput
            label="Dirección"
            value={values.direccion}
            onChange={(direccion) => patch({ direccion })}
            maxLength={150}
          />
          <div className="sm:col-span-2">
            <CharCounterTextarea
              label="Descripción"
              value={values.descripcion}
              onChange={(descripcion) => patch({ descripcion })}
              maxLength={500}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="activo"
              type="checkbox"
              checked={values.activo}
              onChange={(e) => patch({ activo: e.target.checked })}
              className="size-4 rounded border-charcoal/25"
            />
            <label htmlFor="activo" className="text-sm text-charcoal/80">
              Activo (visible para agregar en cotizaciones)
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Fotos</h2>
        <div className="mt-3 space-y-4">
          <ImageUploadSlot
            label="Foto principal (horizontal panorámica)"
            value={values.imagen_1}
            onChange={(imagen_1) => patch({ imagen_1 })}
            carpeta="hoteles"
            aspectRatio="900 / 340"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadSlot
              label="Foto secundaria izquierda (horizontal)"
              value={values.imagen_2}
              onChange={(imagen_2) => patch({ imagen_2 })}
              carpeta="hoteles"
              aspectRatio="420 / 300"
            />
            <ImageUploadSlot
              label="Foto secundaria derecha (horizontal)"
              value={values.imagen_3}
              onChange={(imagen_3) => patch({ imagen_3 })}
              carpeta="hoteles"
              aspectRatio="420 / 300"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !values.nombre || !values.destino}
          className="flex items-center gap-2 rounded-lg bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}