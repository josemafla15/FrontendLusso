"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { api, uploadImagen } from "@/lib/api";
import { formatMilesInput, parseMilesInput } from "@/lib/format";
import type {
  Cotizacion,
  CotizacionHotel,
  DestinoContenido,
  HotelPartner,
  Paginado,
  Vuelo,
} from "@/lib/types";

export interface CotizacionFormValues {
  destino: string;
  fecha_inicio: string;
  fecha_fin: string;
  num_personas: number;
  incluye: string[];
  no_incluye: string[];
  precio_total: string;
  precio_por_persona: string;
  precio_nota_total: string;
  vigencia: string;
  notas: string;
  hoteles: CotizacionHotel[];
  vuelos: Vuelo[];
}

function emptyValues(): CotizacionFormValues {
  return {
    destino: "",
    fecha_inicio: "",
    fecha_fin: "",
    num_personas: 1,
    incluye: [],
    no_incluye: [],
    precio_total: "",
    precio_por_persona: "",
    precio_nota_total: "",
    vigencia: "",
    notas: "",
    hoteles: [],
    vuelos: [],
  };
}

export function valuesFromCotizacion(c: Cotizacion): CotizacionFormValues {
  return {
    destino: c.destino ?? "",
    fecha_inicio: c.fecha_inicio ?? "",
    fecha_fin: c.fecha_fin ?? "",
    num_personas: c.num_personas ?? 1,
    incluye: c.incluye ?? [],
    no_incluye: c.no_incluye ?? [],
    precio_total: c.precio_total != null ? String(c.precio_total) : "",
    precio_por_persona: c.precio_por_persona != null ? String(c.precio_por_persona) : "",
    precio_nota_total: c.precio_nota_total ?? "",
    vigencia: c.vigencia ?? "",
    notas: c.notas ?? "",
    hoteles: c.hoteles ?? [],
    vuelos: c.vuelos ?? [],
  };
}

/** Payload listo para POST/PATCH /api/cotizaciones/ */
export function buildPayload(v: CotizacionFormValues) {
  const multiplesHoteles = v.hoteles.length >= 2;
  return {
    destino: v.destino,
    fecha_inicio: v.fecha_inicio || null,
    fecha_fin: v.fecha_fin || null,
    num_personas: v.num_personas,
    incluye: v.incluye,
    no_incluye: v.no_incluye,
    vigencia: v.vigencia || null,
    notas: v.notas,
    precio_total: v.hoteles.length <= 1 ? (parseMilesInput(v.precio_total) || null) : null,
    precio_por_persona:
      v.hoteles.length <= 1 ? (parseMilesInput(v.precio_por_persona) || null) : null,
    precio_nota_total: v.hoteles.length <= 1 ? v.precio_nota_total : "",
    hoteles: v.hoteles.map((h, i) => ({
      ...h,
      precios: multiplesHoteles ? h.precios : [],
      orden: i,
    })),
    vuelos: v.vuelos.map((vu, i) => ({ ...vu, orden: i })),
  };
}

/* ---------- Editor de listas de viñetas (tags) ---------- */

function TagList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 rounded-full bg-steel/20 px-3 py-1 text-sm text-charcoal"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-charcoal/50 hover:text-rose-600"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-steel"
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm text-charcoal/80 hover:bg-charcoal/5"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Sección: Destino ---------- */

function DestinoField({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (destino: DestinoContenido) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<DestinoContenido[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQuery(value), [value]);

  function onChange(v: string) {
    setQuery(v);
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
          placeholder="Buscar destino en el catálogo…"
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
    </div>
  );
}

/* ---------- Sección: Hoteles ---------- */

function HotelesEditor({
  destinoId,
  hoteles,
  onChange,
}: {
  destinoId: number | null;
  hoteles: CotizacionHotel[];
  onChange: (hoteles: CotizacionHotel[]) => void;
}) {
  const [catalogo, setCatalogo] = useState<HotelPartner[]>([]);

  useEffect(() => {
    if (!destinoId) {
      setCatalogo([]);
      return;
    }
    api<HotelPartner[] | Paginado<HotelPartner>>(`hoteles?destino=${destinoId}`)
      .then((res) => setCatalogo(Array.isArray(res) ? res : res.results))
      .catch(() => setCatalogo([]));
  }, [destinoId]);

  const multiples = hoteles.length >= 2;

  function agregarDelCatalogo(h: HotelPartner) {
    onChange([
      ...hoteles,
      {
        hotel: h.id,
        nombre_libre: "",
        noches: 1,
        tipo_habitacion: "",
        plan_alimentacion: "",
        datos_importantes: [],
        precios: [],
        orden: hoteles.length,
        nombre_display: h.nombre,
      },
    ]);
  }

  function agregarLibre() {
    onChange([
      ...hoteles,
      {
        hotel: null,
        nombre_libre: "",
        noches: 1,
        tipo_habitacion: "",
        plan_alimentacion: "",
        datos_importantes: [],
        precios: [],
        orden: hoteles.length,
      },
    ]);
  }

  function actualizar(i: number, patch: Partial<CotizacionHotel>) {
    onChange(hoteles.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  function quitar(i: number) {
    onChange(hoteles.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {catalogo
          .filter((h) => !hoteles.some((added) => added.hotel === h.id))
          .map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => agregarDelCatalogo(h)}
              className="flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm hover:bg-sage/15"
            >
              <Plus className="size-3.5" />
              {h.nombre}
            </button>
          ))}
        <button
          type="button"
          onClick={agregarLibre}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-charcoal/25 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5"
        >
          <Plus className="size-3.5" />
          Hotel fuera de catálogo
        </button>
        {!destinoId && (
          <p className="text-xs text-charcoal/40">Elegí un destino para ver hoteles del catálogo.</p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {hoteles.map((h, i) => (
          <div key={i} className="rounded-xl border border-charcoal/10 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              {h.hotel ? (
                <p className="font-semibold">{h.nombre_display || "Hotel del catálogo"}</p>
              ) : (
                <input
                  value={h.nombre_libre}
                  onChange={(e) => actualizar(i, { nombre_libre: e.target.value })}
                  placeholder="Nombre del hotel"
                  className="w-full max-w-xs rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-steel"
                />
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                className="text-charcoal/40 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                  Noches
                </label>
                <input
                  type="number"
                  min={1}
                  value={h.noches}
                  onChange={(e) => actualizar(i, { noches: Number(e.target.value) || 1 })}
                  className="mt-1 w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                  Tipo de habitación
                </label>
                <input
                  value={h.tipo_habitacion}
                  onChange={(e) => actualizar(i, { tipo_habitacion: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                  Plan de alimentación
                </label>
                <input
                  value={h.plan_alimentacion}
                  onChange={(e) => actualizar(i, { plan_alimentacion: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm outline-none focus:border-steel"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Datos importantes
              </label>
              <div className="mt-1.5">
                <TagList
                  items={h.datos_importantes}
                  onChange={(items) => actualizar(i, { datos_importantes: items })}
                  placeholder="Agregar dato y Enter…"
                />
              </div>
            </div>

            {multiples && (
              <div className="mt-3">
                <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                  Precios (este hotel)
                </label>
                <div className="mt-1.5">
                  <TagList
                    items={h.precios}
                    onChange={(items) => actualizar(i, { precios: items })}
                    placeholder="Agregar precio y Enter…"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Sección: Vuelos ---------- */

function VueloCard({
  tipo,
  vuelo,
  onChange,
}: {
  tipo: "ida" | "vuelta";
  vuelo: Vuelo | null;
  onChange: (v: Vuelo | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImagen(file, "vuelos");
      onChange({
        tipo,
        fecha: "",
        origen: "",
        destino: "",
        hora_salida: "",
        hora_llegada: "",
        aerolinea: "",
        paradas: 0,
        duracion: "",
        imagen: url,
        orden: tipo === "ida" ? 0 : 1,
      });
    } catch {
      // el banner de error general del form ya cubre esto si hace falta
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-charcoal/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold capitalize">Vuelo de {tipo}</p>
        {vuelo && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-charcoal/40 hover:text-rose-600"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {vuelo?.imagen ? (
        <div className="mt-3 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vuelo.imagen}
            alt={`Vuelo de ${tipo}`}
            className="h-40 w-full rounded-lg object-cover"
          />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-charcoal/25 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Reemplazar imagen
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="mt-3 flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal/25 text-sm text-charcoal/60 hover:bg-charcoal/5">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Upload className="size-5" />
              Subir imagen del vuelo de {tipo}
            </>
          )}
          <input type="file" accept="image/*" onChange={onFile} className="hidden" />
        </label>
      )}
    </div>
  );
}


/* ---------- Form principal ---------- */

export default function CotizacionForm({
  initial,
  destinoIdInicial = null,
  onSubmit,
  saving,
  submitLabel = "Guardar",
}: {
  initial?: CotizacionFormValues;
  destinoIdInicial?: number | null;
  onSubmit: (values: CotizacionFormValues) => void;
  saving: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<CotizacionFormValues>(initial ?? emptyValues());
  const [destinoId, setDestinoId] = useState<number | null>(destinoIdInicial);

  function patch(p: Partial<CotizacionFormValues>) {
    setValues((v) => ({ ...v, ...p }));
  }

  const vueloIda = values.vuelos.find((v) => v.tipo === "ida") ?? null;
  const vueloVuelta = values.vuelos.find((v) => v.tipo === "vuelta") ?? null;

  function setVuelo(tipo: "ida" | "vuelta", v: Vuelo | null) {
    const otros = values.vuelos.filter((x) => x.tipo !== tipo);
    patch({ vuelos: v ? [...otros, v] : otros });
  }

  const mostrarInversion = values.hoteles.length <= 1;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Viaje</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <DestinoField
            value={values.destino}
            onSelect={(d) => {
              patch({ destino: d.nombre });
              setDestinoId(d.id);
            }}
          />
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Personas
            </label>
            <input
              type="number"
              min={1}
              value={values.num_personas}
              onChange={(e) => patch({ num_personas: Number(e.target.value) || 1 })}
              className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Fecha inicio (opcional)
            </label>
            <input
              type="date"
              value={values.fecha_inicio}
              onChange={(e) => patch({ fecha_inicio: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Fecha fin (opcional)
            </label>
            <input
              type="date"
              value={values.fecha_fin}
              onChange={(e) => patch({ fecha_fin: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Hoteles</h2>
        <div className="mt-3">
          <HotelesEditor
            destinoId={destinoId}
            hoteles={values.hoteles}
            onChange={(hoteles) => patch({ hoteles })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Vuelos</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <VueloCard tipo="ida" vuelo={vueloIda} onChange={(v) => setVuelo("ida", v)} />
          <VueloCard tipo="vuelta" vuelo={vueloVuelta} onChange={(v) => setVuelo("vuelta", v)} />
        </div>
      </div>

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Experiencia</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Incluye
            </label>
            <div className="mt-1.5">
              <TagList
                items={values.incluye}
                onChange={(incluye) => patch({ incluye })}
                placeholder="Agregar ítem y Enter…"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              No incluye
            </label>
            <div className="mt-1.5">
              <TagList
                items={values.no_incluye}
                onChange={(no_incluye) => patch({ no_incluye })}
                placeholder="Agregar ítem y Enter…"
              />
            </div>
          </div>
        </div>
      </div>

      {mostrarInversion && (
        <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold">Inversión</h2>
          <p className="mt-1 text-xs text-charcoal/50">
            Con 2 o más hoteles, el precio se maneja por hotel (arriba).
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Precio por persona
              </label>
              <input
                inputMode="numeric"
                value={values.precio_por_persona}
                onChange={(e) =>
                  patch({ precio_por_persona: formatMilesInput(e.target.value) })
                }
                placeholder="0"
                className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Precio total
              </label>
              <input
                inputMode="numeric"
                value={values.precio_total}
                onChange={(e) => patch({ precio_total: formatMilesInput(e.target.value) })}
                placeholder="0"
                className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Nota de precio (alternativa a los campos de arriba)
              </label>
              <input
                value={values.precio_nota_total}
                onChange={(e) => patch({ precio_nota_total: e.target.value })}
                placeholder='ej. "Desde $2.500.000 por persona"'
                className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Otros</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Vigencia
            </label>
            <input
              type="date"
              value={values.vigencia}
              onChange={(e) => patch({ vigencia: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wide text-charcoal/50">
              Notas internas
            </label>
            <textarea
              value={values.notas}
              onChange={(e) => patch({ notas: e.target.value })}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !values.destino}
          className="flex items-center gap-2 rounded-lg bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export { Search };