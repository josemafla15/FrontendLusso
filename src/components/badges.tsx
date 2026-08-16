import { Mail, MessageCircle, MousePointerClick, Star } from "lucide-react";
import type { Estado, EstadoPago, Origen } from "@/lib/types";

export const ESTADOS: Record<Estado, { label: string; className: string }> = {
  nuevo: {
    label: "Nuevo",
    className: "bg-steel/25 text-charcoal ring-steel/60",
  },
  en_conversacion: {
    label: "En conversación",
    className: "bg-neutral-200/70 text-neutral-700 ring-neutral-300",
  },
  calificado: {
    label: "Calificado",
    className: "bg-sage text-charcoal ring-sage font-semibold",
  },
  cotizado: {
    label: "Cotizado",
    className: "bg-violet-100 text-violet-800 ring-violet-200",
  },
  ganado: {
    label: "Ganado",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  perdido: {
    label: "Perdido",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
};

export const ORIGENES: Record<
  Origen,
  { label: string; Icon: typeof Mail; className: string }
> = {
  popup: {
    label: "Popup",
    Icon: MousePointerClick,
    className: "text-charcoal/80 bg-steel/25 ring-steel/60",
  },
  contacto: {
    label: "Contacto",
    Icon: Mail,
    className: "text-charcoal/70 bg-neutral-200/60 ring-neutral-300",
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: MessageCircle,
    className: "text-emerald-700 bg-emerald-100 ring-emerald-200",
  },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const cfg = ESTADOS[estado] ?? { label: estado, className: "bg-neutral-100 ring-neutral-200" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset whitespace-nowrap ${cfg.className}`}
    >
      {estado === "calificado" && <Star className="size-3" fill="currentColor" />}
      {cfg.label}
    </span>
  );
}

export const ESTADOS_PAGO: Record<EstadoPago, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  aprobado: {
    label: "Aprobado",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  declinado: {
    label: "Declinado",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
  error: {
    label: "Error",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
  anulado: {
    label: "Anulado",
    className: "bg-neutral-200/70 text-neutral-700 ring-neutral-300",
  },
  reembolsado: {
    label: "Reembolsado",
    className: "bg-violet-100 text-violet-800 ring-violet-200",
  },
};

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  const cfg = ESTADOS_PAGO[estado] ?? {
    label: estado,
    className: "bg-neutral-100 ring-neutral-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export function OrigenBadge({ origen }: { origen: Origen }) {
  const cfg = ORIGENES[origen];
  if (!cfg) {
    return <span className="text-xs text-charcoal/60">{origen}</span>;
  }
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset whitespace-nowrap ${cfg.className}`}
    >
      <Icon className="size-3.5" />
      {cfg.label}
    </span>
  );
}
