import type {
  CatalogoSede,
  CheckoutPayload,
  CheckoutPlanPayload,
  CheckoutPlanResponse,
  CheckoutResponse,
  Clase,
  HorariosResponse,
  Sede,
} from '@/lib/reservas/types';

/**
 * Cliente del portal de reservas, portado de
 * `reservas-clientes-clic-v2/src/api/client.ts`.
 *
 * La única diferencia es de dónde sale la base:
 *
 * - **En el navegador**, siempre el backend público. Los POST de checkout
 *   limitan a 5 intentos por IP cada 15 minutos: tienen que salir de la IP de
 *   quien compra, no de la de nuestro servidor. El CORS del backend ya habilita
 *   los orígenes de esta web.
 * - **En el servidor**, `API_ORIGIN` si está (desarrollo local) o el backend
 *   público. Lo que se pide desde acá va con caché (ver `revalidar`): las rutas
 *   públicas limitan a 60 pedidos por minuto por IP, y sin caché todas las
 *   visitas saldrían de la misma.
 */
const BACKEND_PUBLICO = 'https://app.clicpilates.com';

function baseUrl(): string {
  if (typeof window !== 'undefined') return BACKEND_PUBLICO;
  return process.env.API_ORIGIN ?? BACKEND_PUBLICO;
}

/** Segundos de caché para lo que se pide desde el servidor. */
const REVALIDAR_SERVIDOR = 3600;

/**
 * Este front es el de Pilates (reservas.clicpilates.com), un solo tenant.
 * `tipo` filtra por disciplina en la API vía `Sede.plantillaRutina`, así las
 * sedes de gimnasio (que reservan gratis desde clicfit-web) no se cuelan acá.
 */
const TIPO = 'PILATES';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  // Del lado del servidor, los GET se cachean (ver arriba). En el navegador
  // no aplica: `next.revalidate` sólo lo entiende el fetch de Next.
  const enServidor = typeof window === 'undefined';
  const cache =
    enServidor && (init?.method ?? 'GET') === 'GET' && init?.cache == null
      ? { next: { revalidate: REVALIDAR_SERVIDOR } }
      : {};
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...cache,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0);
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      /* noop */
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

/**
 * Prisma Decimal fields get serialized as strings in JSON. Normalize them
 * to number | null so the rest of the app can treat `precioPrueba` as a
 * number without repeating this guard everywhere.
 */
function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeSede(
  raw: Sede & { precioPrueba: unknown; fotos?: unknown; metaPixelId?: unknown },
): Sede {
  return {
    ...raw,
    precioPrueba: toNumber(raw.precioPrueba),
    // `fotos` puede faltar en respuestas cacheadas viejas: tratarlo como [].
    fotos: Array.isArray(raw.fotos)
      ? raw.fotos.filter((f): f is string => typeof f === 'string' && f !== '')
      : [],
    // Idem: una API vieja no manda el campo. Sin pixel propio → el general.
    metaPixelId:
      typeof raw.metaPixelId === 'string' && raw.metaPixelId !== ''
        ? raw.metaPixelId
        : null,
  };
}

export async function getSedes(): Promise<Sede[]> {
  const raw = await request<
    Array<Sede & { precioPrueba: unknown; fotos?: unknown; metaPixelId?: unknown }>
  >(`/api/public/sedes?tipo=${TIPO}`);
  return raw.map(normalizeSede);
}

/** Sin caché: los cupos cambian cada minuto. */
export function getClases(sedeId: number): Promise<Clase[]> {
  return request<Clase[]>(`/api/public/sedes/${sedeId}/clases?tipo=${TIPO}`, {
    cache: 'no-store',
  });
}

export function getCatalogo(sede?: string | number): Promise<CatalogoSede[]> {
  const query = sede != null ? `?sede=${encodeURIComponent(sede)}` : '';
  return request<CatalogoSede[]>(`/api/public/catalogo${query}`);
}

export function checkout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return request<CheckoutResponse>('/api/public/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Horarios fijables reales para un plan de horario fijo. */
export function getHorarios(
  sedeId: number,
  planId: number,
): Promise<HorariosResponse> {
  return request<HorariosResponse>(
    `/api/public/sedes/${sedeId}/horarios?planId=${planId}`,
    { cache: 'no-store' },
  );
}

/** Inicia el checkout de compra de un plan → devuelve el init_point de MP. */
export function checkoutPlan(
  payload: CheckoutPlanPayload,
): Promise<CheckoutPlanResponse> {
  return request<CheckoutPlanResponse>('/api/public/checkout-plan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
