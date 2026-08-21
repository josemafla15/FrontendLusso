"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ImageUploadSlot from "./ImageUploadSlot";
import type { DestinoContenido } from "@/lib/types";

export interface DestinoFormValues {
  nombre: string;
  descripcion_destino: string;
  imagen_destino: string;
  imagen_destino_secundaria: string;
  bienvenida_descripcion: string;
  imagen_bienvenida: string;
  imagen_viaje_sonado: string;
  viaje_sonado_intro_texto: string;
  viaje_sonado_texto1: string;
  imagen_arte_vivir_1: string;
  imagen_arte_vivir_2: string;
}

export function emptyDestinoValues(): DestinoFormValues {
  return {
    nombre: "",
    descripcion_destino: "",
    imagen_destino: "",
    imagen_destino_secundaria: "",
    bienvenida_descripcion: "",
    imagen_bienvenida: "",
    imagen_viaje_sonado: "",
    viaje_sonado_intro_texto: "",
    viaje_sonado_texto1: "",
    imagen_arte_vivir_1: "",
    imagen_arte_vivir_2: "",
  };
}

export function valuesFromDestino(d: DestinoContenido): DestinoFormValues {
  return {
    nombre: d.nombre ?? "",
    descripcion_destino: d.descripcion_destino ?? "",
    imagen_destino: d.imagen_destino ?? "",
    imagen_destino_secundaria: d.imagen_destino_secundaria ?? "",
    bienvenida_descripcion: d.bienvenida_descripcion ?? "",
    imagen_bienvenida: d.imagen_bienvenida ?? "",
    imagen_viaje_sonado: d.imagen_viaje_sonado ?? "",
    viaje_sonado_intro_texto: d.viaje_sonado_intro_texto ?? "",
    viaje_sonado_texto1: d.viaje_sonado_texto1 ?? "",
    imagen_arte_vivir_1: d.imagen_arte_vivir_1 ?? "",
    imagen_arte_vivir_2: d.imagen_arte_vivir_2 ?? "",
  };
}

function CharCounterInput({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
}) {
  const cerca = value.length >= maxLength * 0.9;
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-charcoal/50">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        maxLength={maxLength}
        placeholder={placeholder}
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

export default function DestinoForm({
  initial,
  onSubmit,
  saving,
  submitLabel = "Guardar",
}: {
  initial?: DestinoFormValues;
  onSubmit: (values: DestinoFormValues) => void;
  saving: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<DestinoFormValues>(initial ?? emptyDestinoValues());

  function patch(p: Partial<DestinoFormValues>) {
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
        <div className="mt-3 space-y-4">
          <CharCounterInput
            label="Nombre del destino"
            value={values.nombre}
            onChange={(nombre) => patch({ nombre })}
            maxLength={25}
            placeholder="ej. Brasil"
          />
          <CharCounterTextarea
            label="Descripción del destino"
            value={values.descripcion_destino}
            onChange={(descripcion_destino) => patch({ descripcion_destino })}
            maxLength={300}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ImageUploadSlot
            label="Imagen destino (cuadrada)"
            value={values.imagen_destino}
            onChange={(imagen_destino) => patch({ imagen_destino })}
            carpeta="destinos"
            aspectRatio="800 / 750"
          />
          <ImageUploadSlot
            label="Imagen destino (horizontal)"
            value={values.imagen_destino_secundaria}
            onChange={(imagen_destino_secundaria) => patch({ imagen_destino_secundaria })}
            carpeta="destinos"
            aspectRatio="900 / 400"
          />
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Bienvenida</h2>
        <div className="mt-3">
          <CharCounterTextarea
            label="Descripción de bienvenida"
            value={values.bienvenida_descripcion}
            onChange={(bienvenida_descripcion) => patch({ bienvenida_descripcion })}
            maxLength={500}
          />
        </div>
        <div className="mt-4 max-w-xs">
          <ImageUploadSlot
            label="Imagen bienvenida (vertical)"
            value={values.imagen_bienvenida}
            onChange={(imagen_bienvenida) => patch({ imagen_bienvenida })}
            carpeta="destinos"
            aspectRatio="600 / 800"
          />
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Viaje soñado</h2>
        <div className="mt-3 space-y-4">
          <CharCounterTextarea
            label="Texto de introducción"
            value={values.viaje_sonado_intro_texto}
            onChange={(viaje_sonado_intro_texto) => patch({ viaje_sonado_intro_texto })}
            maxLength={300}
            rows={2}
          />
          <CharCounterTextarea
            label="Texto 1"
            value={values.viaje_sonado_texto1}
            onChange={(viaje_sonado_texto1) => patch({ viaje_sonado_texto1 })}
            maxLength={320}
            rows={2}
          />
        </div>
        <div className="mt-4 max-w-xs">
          <ImageUploadSlot
            label="Imagen viaje soñado (vertical)"
            value={values.imagen_viaje_sonado}
            onChange={(imagen_viaje_sonado) => patch({ imagen_viaje_sonado })}
            carpeta="destinos"
            aspectRatio="500 / 620"
          />
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Arte de vivir</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="max-w-xs">
            <ImageUploadSlot
              label="Imagen arte de vivir 1 (vertical alargada)"
              value={values.imagen_arte_vivir_1}
              onChange={(imagen_arte_vivir_1) => patch({ imagen_arte_vivir_1 })}
              carpeta="destinos"
              aspectRatio="480 / 760"
            />
          </div>
          <div className="max-w-xs">
            <ImageUploadSlot
              label="Imagen arte de vivir 2 (vertical alargada)"
              value={values.imagen_arte_vivir_2}
              onChange={(imagen_arte_vivir_2) => patch({ imagen_arte_vivir_2 })}
              carpeta="destinos"
              aspectRatio="480 / 760"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !values.nombre}
          className="flex items-center gap-2 rounded-lg bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}