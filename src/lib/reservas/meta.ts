/**
 * Meta Pixel para el portal de reservas.
 *
 * Expone los mismos nombres que `reservas-clientes-clic-v2/src/lib/meta.ts`
 * para que las pantallas portadas no cambien, pero no inicializa nada: los
 * pixels los arranca una sola vez el layout de la web
 * (`src/components/medicion/medicion.tsx`), con el mapa sede → pixel que arma
 * el servidor. Inicializarlos de nuevo acá los duplicaría.
 *
 * Las reglas son las mismas del portal: todo sale por `trackSingle`, nunca por
 * `track`, y una conversión va al pixel de su sede, nunca a todos.
 */

import { metaEvento } from '@/lib/medicion/meta';

export {
  guardarDatosClienteMeta,
  identificadoresMeta,
  telefonoMeta,
} from '@/lib/medicion/meta';

/** Última sede visitada, para las rutas que no llevan el slug en la URL. */
const SLUG_STORAGE_KEY = 'clic:sedeSlug';

/** Deja registrada la sede para las rutas que después no la llevan en la URL. */
export function recordarSede(slug: string): void {
  try {
    sessionStorage.setItem(SLUG_STORAGE_KEY, slug);
  } catch {
    // Safari en modo privado puede tirar acá. No es crítico.
  }
}

function slugGuardado(): string | null {
  try {
    return sessionStorage.getItem(SLUG_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Sede de la pantalla actual, en orden de confiabilidad:
 *   1. `?sedeSlug=` — lo pone el backend en el back_url de Mercado Pago (/gracias)
 *   2. la ruta `/reservar/sede/:slug/...`
 *   3. la última sede visitada
 *   4. null → no hay sede (la landing)
 */
export function slugDeRuta(pathname: string, search: string): string | null {
  const desdeQuery = new URLSearchParams(search).get('sedeSlug');
  if (desdeQuery) return desdeQuery;

  const enRuta = pathname.match(/^\/reservar\/sede\/([^/]+)/);
  if (enRuta) return decodeURIComponent(enRuta[1]);

  return slugGuardado();
}

/**
 * Evento estándar de Meta (ViewContent, InitiateCheckout, Purchase, ...).
 * Misma firma que en el portal; el destino lo resuelve `metaEvento`.
 */
export function trackMetaEvent(
  name: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
  slug?: string | null,
): void {
  metaEvento(name, params, options, slug);
}
