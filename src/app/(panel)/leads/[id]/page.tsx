"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CalendarRange,
  FileText,
  Loader2,
  MapPin,
  MessageCircle,
  Quote,
  StickyNote,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatTime,
  waLink,
} from "@/lib/format";
import type { LeadDetalle, Mensaje } from "@/lib/types";
import { OrigenBadge } from "@/components/badges";

function FichaItem({
  Icon,
  label,
  children,
}: {
  Icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-steel" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
        <div className="text-sm text-charcoal/90">{children}</div>
      </div>
    </div>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  if (mensaje.rol === "sistema") {
    return (
      <div className="my-3 flex items-center gap-3 text-charcoal/40">
        <div className="h-px flex-1 bg-charcoal/10" />
        <p className="max-w-[80%] text-center text-xs">
          {mensaje.contenido} · {formatTime(mensaje.created_at)}
        </p>
        <div className="h-px flex-1 bg-charcoal/10" />
      </div>
    );
  }

  const esCliente = mensaje.rol === "cliente";
  const esAsesor = mensaje.rol === "asesor";

  return (
    <div className={`flex ${esCliente ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
          esCliente
            ? "rounded-bl-sm bg-white ring-1 ring-charcoal/10"
            : esAsesor
              ? "rounded-br-sm bg-steel/40 text-charcoal"
              : "rounded-br-sm bg-charcoal text-cream"
        }`}
      >
        {!esCliente && (
          <p
            className={`mb-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              esAsesor ? "text-charcoal/60" : "text-sage"
            }`}
          >
            {esAsesor ? "Asesor" : "Bot"}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>
        <p
          className={`mt-1 text-right text-[11px] ${
            esCliente ? "text-charcoal/40" : esAsesor ? "text-charcoal/50" : "text-cream/50"
          }`}
        >
          {formatTime(mensaje.created_at)}
        </p>
      </div>
    </div>
  );
}

interface DetailProps {
  lead: LeadDetalle;
  saving: boolean;
  onPatch: (body: Partial<Record<string, unknown>>) => void;
}

/** Tarjeta simple y centrada compartida por leads de popup y contacto */
function SimpleDetail({ lead, showContacto }: DetailProps & { showContacto: boolean }) {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-2xl font-semibold">{lead.nombre}</h1>
      <p className="mt-1 text-sm text-charcoal/60">{lead.contacto}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <OrigenBadge origen={lead.origen} />
      </div>

      <div className="mt-6 space-y-5 border-t border-charcoal/10 pt-6">
        {showContacto && (
          <Link
            href={`/cotizaciones/nueva?lead=${lead.id}`}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-charcoal px-3 py-2 text-sm font-semibold text-cream transition hover:bg-charcoal/90"
          >
            <FileText className="size-4" />
            Armar cotización
          </Link>
        )}

        {showContacto && (
          <>
            <FichaItem Icon={MapPin} label="Destino de interés">
              {lead.destino_interes || "—"}
            </FichaItem>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-charcoal/50">
                <Quote className="size-3.5" />
                Mensaje del cliente
              </p>
              <blockquote className="rounded-lg border-l-4 border-steel bg-steel/10 px-4 py-3 text-sm whitespace-pre-wrap text-charcoal/90">
                {lead.mensaje || "—"}
              </blockquote>
            </div>
          </>
        )}

        <FichaItem Icon={CalendarRange} label="Creado">
          {formatDateTime(lead.created_at)}
        </FichaItem>
      </div>
    </div>
  );
}

function WhatsappDetail({ lead }: DetailProps) {
  const botPausado = useMemo(() => {
    if (!lead.bot_pausado_hasta) return false;
    return new Date(lead.bot_pausado_hasta).getTime() > Date.now();
  }, [lead.bot_pausado_hasta]);

  const dv = lead.datos_viaje ?? {};
  const wa = waLink(lead.telefono);
  const mensajes = lead.mensajes ?? [];

  return (
    <>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{lead.nombre}</h1>
          <p className="text-sm text-charcoal/60">
            {lead.contacto}
            {lead.telefono ? ` · ${lead.telefono}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrigenBadge origen={lead.origen} />
            <span className="text-xs text-charcoal/50">
              Creado el {formatDateTime(lead.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/cotizaciones/nueva?lead=${lead.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-2 text-sm font-semibold text-cream transition hover:bg-charcoal/90"
          >
            <FileText className="size-4" />
            Armar cotización
          </Link>

          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {botPausado && lead.bot_pausado_hasta && (
        <p className="mt-3 rounded-lg bg-sage/30 px-4 py-2 text-sm ring-1 ring-inset ring-sage">
          Bot pausado hasta el {formatDateTime(lead.bot_pausado_hasta)}.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="space-y-6 self-start rounded-xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-xl font-semibold">Datos del viaje</h2>
          <FichaItem Icon={MapPin} label="Destino">
            {dv.destino || "—"}
          </FichaItem>
          <FichaItem Icon={CalendarRange} label="Fechas">
            {dv.fecha_viaje || "—"}
          </FichaItem>
          <FichaItem Icon={Users} label="Personas">
            {dv.num_personas ?? "—"}
          </FichaItem>
          <FichaItem Icon={Wallet} label="Presupuesto">
            {formatMoney(dv.presupuesto)}
          </FichaItem>
          <FichaItem Icon={StickyNote} label="Notas">
            <span className="whitespace-pre-wrap">{dv.notas || "—"}</span>
          </FichaItem>
          <div className="border-t border-charcoal/10 pt-4">
            <FichaItem Icon={Bot} label="Bot">
              {lead.bot_activo ? (botPausado ? "Activo (en pausa)" : "Activo") : "Desactivado"}
            </FichaItem>
          </div>
        </div>

        <div className="rounded-xl border border-charcoal/10 bg-cream/60 shadow-sm">
          <div className="border-b border-charcoal/10 bg-white px-5 py-3 rounded-t-xl">
            <h2 className="font-display text-xl font-semibold">Conversación</h2>
          </div>
          <div className="max-h-[65dvh] space-y-3 overflow-y-auto p-4 sm:p-5">
            {mensajes.length === 0 && (
              <p className="py-10 text-center text-sm text-charcoal/50">
                Aún no hay mensajes.
              </p>
            )}
            {mensajes.map((m) => (
              <Burbuja key={m.id} mensaje={m} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function LeadDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLead(await api<LeadDetalle>(`leads/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el lead");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Partial<Record<string, unknown>>) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api<LeadDetalle>(`leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      // El PATCH puede no devolver mensajes[]; se conservan los ya cargados
      setLead((prev) => ({
        ...(prev as LeadDetalle),
        ...updated,
        mensajes: updated.mensajes ?? prev?.mensajes ?? [],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio");
    } finally {
      setSaving(false);
    }
  }

  if (error && !lead) {
    return (
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal"
        >
          <ArrowLeft className="size-4" /> Volver a leads
        </Link>
        <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mt-16 flex justify-center text-charcoal/50">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/leads?tab=${lead.origen}`}
        className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal"
      >
        <ArrowLeft className="size-4" /> Volver a leads
      </Link>

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {lead.origen === "whatsapp" && (
        <WhatsappDetail lead={lead} saving={saving} onPatch={patch} />
      )}
      {lead.origen === "popup" && (
        <SimpleDetail lead={lead} saving={saving} onPatch={patch} showContacto={false} />
      )}
      {lead.origen === "contacto" && (
        <SimpleDetail lead={lead} saving={saving} onPatch={patch} showContacto />
      )}
    </div>
  );
}