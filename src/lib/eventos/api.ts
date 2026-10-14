import { request } from '@/lib/reservas/api';

/**
 * Eventos con entradas que se venden online (ClicNet `/api/public/eventos`).
 *
 * El evento se pide desde el servidor con una caché corta: el contenido casi no
 * cambia, pero los lugares sí. El dato definitivo de si hay lugar lo da el
 * checkout, que retiene la entrada mientras se paga.
 */
const REVALIDAR_EVENTO = 120;

export interface Evento {
  slug: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;
  ubicacion: string;
  /** ISO, UTC. */
  inicio: string;
  fin: string | null;
  soloSocios: boolean;
  precioSocio: number;
  /** Null cuando es exclusivo para socios. */
  precioNoSocio: number | null;
  lugaresDisponibles: number;
  ventaAbierta: boolean;
  sede: { nombre: string; slug: string | null };
}

export interface DatosAsistente {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
}

export interface CheckoutEventoResponse {
  initPoint: string;
  /** Token de la entrada: vuelve en la URL de /gracias. */
  entrada: string;
  monto: number;
  esSocio: boolean;
  expiraEn: string;
}

export type EstadoEntrada = 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'SIN_LUGAR' | 'ANULADA';

export interface Entrada {
  estado: EstadoEntrada;
  nombre: string;
  apellido: string;
  monto: number;
  esSocio: boolean;
  evento: { nombre: string; inicio: string; ubicacion: string };
}

export async function getEventos(): Promise<Evento[]> {
  const r = await request<{ eventos: Evento[] }>('/api/public/eventos', {
    next: { revalidate: REVALIDAR_EVENTO },
  });
  return r.eventos;
}

/** Null si el evento no existe o no está publicado. */
export async function getEvento(slug: string): Promise<Evento | null> {
  try {
    const r = await request<{ evento: Evento }>(
      `/api/public/eventos/${encodeURIComponent(slug)}`,
      { next: { revalidate: REVALIDAR_EVENTO } },
    );
    return r.evento;
  } catch (e) {
    if (e instanceof Error && 'status' in e && e.status === 404) return null;
    throw e;
  }
}

/** Retiene la entrada y devuelve el link de pago de Mercado Pago. */
export function checkoutEvento(
  slug: string,
  datos: DatosAsistente,
): Promise<CheckoutEventoResponse> {
  return request<CheckoutEventoResponse>(
    `/api/public/eventos/${encodeURIComponent(slug)}/checkout`,
    { method: 'POST', body: JSON.stringify(datos) },
  );
}

/** Estado de la entrada al volver de MP. El backend le pregunta a MP si sigue pendiente. */
export async function getEntrada(token: string): Promise<Entrada> {
  const r = await request<{ entrada: Entrada }>(
    `/api/public/entradas-evento/${encodeURIComponent(token)}`,
    { cache: 'no-store' },
  );
  return r.entrada;
}
