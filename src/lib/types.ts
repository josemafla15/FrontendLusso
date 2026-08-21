export type Origen = "popup" | "contacto" | "whatsapp";

export type Estado =
  | "nuevo"
  | "en_conversacion"
  | "calificado"
  | "cotizado"
  | "ganado"
  | "perdido";

export type RolMensaje = "cliente" | "bot" | "asesor" | "sistema";

export interface Usuario {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface DatosViaje {
  destino?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  num_personas?: number | null;
  presupuesto?: number | string | null;
  notas?: string | null;
}

export interface Mensaje {
  id: string;
  rol: RolMensaje;
  contenido: string;
  created_at: string;
}

export interface UltimoMensaje {
  contenido: string;
  rol: RolMensaje;
  created_at: string;
}

export interface Lead {
  id: string;
  nombre: string;
  contacto: string;
  origen: Origen;
  estado: Estado;
  asesor: Usuario | null;
  created_at: string;
  updated_at: string;
  // Solo origen "contacto"
  destino_interes?: string | null;
  mensaje?: string | null;
  // Solo origen "whatsapp"
  telefono?: string | null;
  datos_viaje?: DatosViaje | null;
  bot_activo?: boolean;
  ultimo_mensaje?: UltimoMensaje | null;
}

export interface LeadDetalle extends Lead {
  // Solo origen "whatsapp"
  mensajes?: Mensaje[];
  bot_pausado_hasta?: string | null;
}

export interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type EstadoPago =
  | "pendiente"
  | "aprobado"
  | "declinado"
  | "anulado"
  | "reembolsado"
  | "error";

export interface Pago {
  id: string;
  lead: string | null;
  lead_nombre: string | null;
  cliente_nombre: string;
  cliente_contacto: string;
  destino: string;
  descripcion: string | null;
  monto: string;
  metodo_pago: string | null;
  token: string;
  referencia: string;
  estado: EstadoPago;
  wompi_transaction_id: string | null;
  link_pago: string;
  created_at: string;
  updated_at: string;
}

export interface DestinoContenido {
  id: number;
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

export interface HotelPartner {
  id: number;
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

export interface CotizacionHotel {
  id?: number;
  hotel: number | null;
  nombre_libre: string;
  noches: number;
  tipo_habitacion: string;
  plan_alimentacion: string;
  datos_importantes: string[];
  precios: string[];
  orden: number;
  nombre_display?: string;
  _key?: string;   // <-- NUEVO: solo para React (key estable), nunca se manda al backend
}

export interface Vuelo {
  id?: number;
  tipo: "ida" | "vuelta";
  fecha: string;
  origen: string;
  destino: string;
  hora_salida: string;
  hora_llegada: string;
  aerolinea: string;
  paradas: number;
  duracion: string;
  imagen: string;
  orden: number;
}

export interface Cotizacion {
  id: string;
  lead: string | null;      
  lead_nombre: string | null;
  nombre_cliente: string;
  asesor: Usuario;
  destino: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  num_personas: number;
  incluye: string[];
  no_incluye: string[];
  precio_total: number | string | null;
  precio_por_persona: number | string | null;
  precio_nota_total: string;
  inversion_lineas: string[];   // <-- NUEVO
  vigencia: string | null;
  version: number;
  estado: string;
  pdf_url: string | null;
  notas: string;
  hoteles: CotizacionHotel[];
  vuelos: Vuelo[];
  created_at: string;
  updated_at: string;
}