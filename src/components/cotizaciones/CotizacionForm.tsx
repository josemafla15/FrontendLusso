"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { api, uploadImagen } from "@/lib/api";
import Modal from "@/components/catalogo/Modal";
import DestinoForm, {
  emptyDestinoValues,
  type DestinoFormValues,
} from "@/components/catalogo/DestinoForm";
import HotelForm, {
  emptyHotelValues,
  type HotelFormValues,
} from "@/components/catalogo/HotelForm";
import type {
  Cotizacion,
  CotizacionHotel,
  DestinoContenido,
  HotelPartner,
  Paginado,
  Vuelo,
} from "@/lib/types";

export interface CotizacionFormValues {
  nombre_cliente: string;
  destino: string;
  fecha_inicio: string;
  fecha_fin: string;
  num_personas: number;
  incluye: string[];
  no_incluye: string[];
  inversion_lineas: string[];
  hoteles: CotizacionHotel[];
  vuelos: Vuelo[];
}

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

export function valuesFromCotizacion(c: Cotizacion): CotizacionFormValues {
  return {
    nombre_cliente: c.nombre_cliente ?? "",
    destino: c.destino ?? "",
    fecha_inicio: c.fecha_inicio ?? "",
    fecha_fin: c.fecha_fin ?? "",
    num_personas: c.num_personas ?? 1,
    incluye: c.incluye ?? [],
    no_incluye: c.no_incluye ?? [],
    inversion_lineas: c.inversion_lineas ?? [],
    hoteles: c.hoteles ?? [],
    vuelos: c.vuelos ?? [],
  };
}

/** Payload listo para POST/PATCH /api/cotizaciones/ */
export function buildPayload(v: CotizacionFormValues) {
  const multiplesHoteles = v.hoteles.length >= 2;
  return {
    nombre_cliente: v.nombre_cliente,
    destino: v.destino,
    fecha_inicio: v.fecha_inicio || null,
    fecha_fin: v.fecha_fin || null,
    num_personas: v.num_personas,
    incluye: v.incluye,
    no_incluye: v.no_incluye,
    inversion_lineas: v.hoteles.length <= 1 ? v.inversion_lineas : [],
    hoteles: v.hoteles.map((h, i) => ({
      hotel: h.hotel,
      nombre_libre: h.nombre_libre,
      noches: h.noches,
      tipo_habitacion: h.tipo_habitacion,
      plan_alimentacion: h.plan_alimentacion,
      datos_importantes: h.datos_importantes,
      precios: multiplesHoteles ? h.precios : [],
      orden: i,
      ...(h.id ? { id: h.id } : {}),
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

/* ---------- Sección: Destino (texto libre, con sugerencias del catálogo) ---------- */

function DestinoField({
  value,
  onChangeText,
  onSelectCatalogo,
  onCrearNuevo,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  onSelectCatalogo: (destino: DestinoContenido) => void;
  onCrearNuevo: () => void;
}) {
  const [results, setResults] = useState<DestinoContenido[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(v: string) {
    onChangeText(v);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      setOpen(false);
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
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wide text-charcoal/50">
          Destino (opcional)
        </label>
        <button
          type="button"
          onClick={onCrearNuevo}
          className="text-xs font-semibold text-steel hover:underline"
        >
          + Crear destino nuevo
        </button>
      </div>
      <div className="relative mt-1.5">
  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-charcoal/40" />
  <input
    value={value}
    onChange={(e) => onChange(e.target.value.slice(0, 25))}
    onFocus={() => results.length > 0 && setOpen(true)}
    onBlur={() => setTimeout(() => setOpen(false), 150)}
    maxLength={25}
    placeholder="Escribí o buscá un destino del catálogo…"
    className="w-full rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-steel"
  />
  {loading && (
    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-charcoal/40" />
  )}
</div>
<p className={`mt-1 text-right text-xs ${value.length >= 22 ? "text-amber-600" : "text-charcoal/40"}`}>
  {value.length}/25
</p>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-charcoal/10 bg-white shadow-lg">
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelectCatalogo(d);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-steel/10"
            >
              {d.nombre}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-charcoal/40">
        Si el destino no está en el catálogo, el PDF no incluirá esas páginas.
      </p>
    </div>
  );
}

/* ---------- Sección: Hoteles ---------- */

function HotelesEditor({
  destinoId,
  hoteles,
  onChange,
  onCrearNuevo,
}: {
  destinoId: number | null;
  hoteles: CotizacionHotel[];
  onChange: (hoteles: CotizacionHotel[]) => void;
  onCrearNuevo: () => void;
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
  const disponibles = catalogo.filter((h) => !hoteles.some((added) => added.hotel === h.id));

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
        _key: crypto.randomUUID(),
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
        <select
          value=""
          onChange={(e) => {
            const id = Number(e.target.value);
            const h = disponibles.find((x) => x.id === id);
            if (h) agregarDelCatalogo(h);
          }}
          disabled={!destinoId || disponibles.length === 0}
          className="rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-steel disabled:opacity-50"
        >
          <option value="">
            {!destinoId
              ? "Elegí un destino para ver hoteles del catálogo"
              : disponibles.length === 0
                ? "Sin hoteles disponibles en este destino"
                : "+ Agregar hotel del catálogo"}
          </option>
          {disponibles.map((h) => (
            <option key={h.id} value={h.id}>
              {h.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onCrearNuevo}
          className="text-xs font-semibold text-steel hover:underline"
        >
          + Crear hotel nuevo en el catálogo
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {hoteles.map((h, i) => (
          <div key={h._key ?? h.id ?? i} className="rounded-xl border border-charcoal/10 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{h.nombre_display || "Hotel del catálogo"}</p>
              <button
                type="button"
                onClick={() => quitar(i)}
                className="text-charcoal/40 hover:text-rose-600"
              >
                <Trash2 className="size-4" />
              </button>
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

function LineasEditor({
  lineas,
  onChange,
}: {
  lineas: string[];
  onChange: (lineas: string[]) => void;
}) {
  function actualizar(i: number, value: string) {
    onChange(lineas.map((l, idx) => (idx === i ? value : l)));
  }

  function quitar(i: number) {
    onChange(lineas.filter((_, idx) => idx !== i));
  }

  function agregar() {
    onChange([...lineas, ""]);
  }

  return (
    <div className="space-y-2">
      {lineas.map((linea, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={linea}
            onChange={(e) => actualizar(i, e.target.value)}
            placeholder='ej. "$ 9.600.000 Tarifa sencilla"'
            className="flex-1 rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 text-sm outline-none focus:border-steel"
          />
          <button
            type="button"
            onClick={() => quitar(i)}
            className="text-charcoal/40 hover:text-rose-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={agregar}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-charcoal/25 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5"
      >
        <Plus className="size-3.5" />
        Agregar línea
      </button>
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

  const [modalDestino, setModalDestino] = useState(false);
  const [modalHotel, setModalHotel] = useState(false);
  const [savingCatalogo, setSavingCatalogo] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);

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

  async function handleCrearDestino(destinoValues: DestinoFormValues) {
    setSavingCatalogo(true);
    setErrorCatalogo(null);
    try {
      const created = await api<DestinoContenido>("destinos", {
        method: "POST",
        body: JSON.stringify(destinoValues),
      });
      patch({ destino: created.nombre });
      setDestinoId(created.id);
      setModalDestino(false);
    } catch (e) {
      setErrorCatalogo(e instanceof Error ? e.message : "No se pudo crear el destino");
    } finally {
      setSavingCatalogo(false);
    }
  }

  async function handleCrearHotel(hotelValues: HotelFormValues) {
    setSavingCatalogo(true);
    setErrorCatalogo(null);
    try {
      const created = await api<HotelPartner>("hoteles", {
        method: "POST",
        body: JSON.stringify(hotelValues),
      });
      if (created.destino === destinoId) {
        patch({
          hoteles: [
            ...values.hoteles,
            {
              hotel: created.id,
              nombre_libre: "",
              noches: 1,
              tipo_habitacion: "",
              plan_alimentacion: "",
              datos_importantes: [],
              precios: [],
              orden: values.hoteles.length,
              nombre_display: created.nombre,
              _key: crypto.randomUUID(),
            },
          ],
        });
      }
      setModalHotel(false);
    } catch (e) {
      setErrorCatalogo(e instanceof Error ? e.message : "No se pudo crear el hotel");
    } finally {
      setSavingCatalogo(false);
    }
  }

  return (
    <>
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
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Nombre del cliente
              </label>
              <input
                value={values.nombre_cliente}
                onChange={(e) => patch({ nombre_cliente: e.target.value })}
                placeholder="Nombre a nombre de quien va la cotización"
                className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <DestinoField
              value={values.destino}
              onChangeText={(destino) => {
                patch({ destino });
                setDestinoId(null);
              }}
              onSelectCatalogo={(d) => {
                patch({ destino: d.nombre });
                setDestinoId(d.id);
              }}
              onCrearNuevo={() => setModalDestino(true)}
            />

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
              onCrearNuevo={() => setModalHotel(true)}
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
          <div className="mt-3">
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
        </div>

        {mostrarInversion && (
          <div className="rounded-xl border border-charcoal/10 bg-white p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">Inversión</h2>
            <p className="mt-1 text-xs text-charcoal/50">
              Con 2 o más hoteles, el precio se maneja por hotel (arriba).
            </p>
            <div className="mt-3">
              <label className="block text-xs uppercase tracking-wide text-charcoal/50">
                Líneas de inversión
              </label>
              <div className="mt-1.5">
                <LineasEditor
                  lineas={values.inversion_lineas}
                  onChange={(inversion_lineas) => patch({ inversion_lineas })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal/90 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>

      {modalDestino && (
        <Modal title="Nuevo destino" onClose={() => setModalDestino(false)}>
          {errorCatalogo && (
            <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
              {errorCatalogo}
            </p>
          )}
          <DestinoForm
            initial={emptyDestinoValues()}
            onSubmit={handleCrearDestino}
            saving={savingCatalogo}
            submitLabel="Crear y usar en esta cotización"
          />
        </Modal>
      )}

      {modalHotel && (
        <Modal title="Nuevo hotel" onClose={() => setModalHotel(false)}>
          {errorCatalogo && (
            <p className="mb-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
              {errorCatalogo}
            </p>
          )}
          <HotelForm
            initial={emptyHotelValues(destinoId)}
            onSubmit={handleCrearHotel}
            saving={savingCatalogo}
            submitLabel="Crear y usar en esta cotización"
          />
        </Modal>
      )}
    </>
  );
}

export { Search };