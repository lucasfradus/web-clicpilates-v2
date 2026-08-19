/**
 * Meta Pixel.
 *
 * Portado de `reservas-clientes-clic-v2/src/lib/meta.ts` — la lógica es la
 * misma y por una buena razón: conviven varios pixels en el mismo sitio (el
 * general de la marca y el de cada franquicia con cuenta publicitaria propia,
 * en otro Business Manager).
 *
 * Por eso **nunca** se usa `fbq('track', ...)`: con varios pixels inicializados
 * eso dispara a todos, y una cuenta terminaría viendo las conversiones de la
 * otra. Todo sale por `trackSingle`, con el pixel de la sede en la que está la
 * persona.
 *
 * La diferencia con la versión de reservas: allá el mapa sede → pixel se pedía
 * a la API y había que correr una carrera contra un timeout. Acá las sedes ya
 * vienen renderizadas desde el servidor, así que el mapa se pasa por props y no
 * hay carrera que perder.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] }
  }
}

const PIXEL_GENERAL = process.env.NEXT_PUBLIC_META_PIXEL_ID

/** slug de sede → pixel propio. */
let mapaPixels = new Map<string, string>()
const pixelsIniciados = new Set<string>()

function iniciarPixel (id: string) {
  if (id === '' || pixelsIniciados.has(id) || window.fbq == null) return
  pixelsIniciados.add(id)
  window.fbq('init', id)
  // El auto-config de Meta manda clicks y form submits a TODOS los pixels
  // inicializados, ignorando trackSingle. Es exactamente la fuga entre cuentas
  // que este módulo evita, así que se apaga.
  window.fbq('set', 'autoConfig', false, id)
}

/** Inicializa el pixel general y el de cada sede. Idempotente. */
export function iniciarPixels (pixelesPorSede: Record<string, string>) {
  if (typeof window === 'undefined' || window.fbq == null) return

  if (PIXEL_GENERAL != null && PIXEL_GENERAL !== '') iniciarPixel(PIXEL_GENERAL)

  mapaPixels = new Map(Object.entries(pixelesPorSede))
  for (const pixel of mapaPixels.values()) iniciarPixel(pixel)
}

/**
 * A qué pixels va un evento.
 *
 * Con sede: el de esa sede, o el general si no tiene uno propio.
 *
 * Sin sede depende del evento, y por eso lo decide quien llama:
 *  - PageView (`aTodos`): va a todos. Es la home o el índice de estudios, y
 *    cada cuenta necesita ver el PageView de la pantalla donde cayó su anuncio.
 *  - conversiones: sólo el general. Una consulta o una venta pertenece a UNA
 *    cuenta; mandarla a todas le infla las conversiones a la que no la generó.
 */
function destinos (slug: string | null | undefined, aTodos: boolean): string[] {
  if (slug != null && slug !== '') {
    const propio = mapaPixels.get(slug)
    if (propio != null) return [propio]
    return PIXEL_GENERAL != null && PIXEL_GENERAL !== '' ? [PIXEL_GENERAL] : []
  }
  if (aTodos) return [...pixelsIniciados]
  return PIXEL_GENERAL != null && PIXEL_GENERAL !== '' ? [PIXEL_GENERAL] : []
}

export function metaPageView (slug?: string | null) {
  for (const pixel of destinos(slug, true)) {
    window.fbq?.('trackSingle', pixel, 'PageView')
  }
}

/**
 * Evento estándar de Meta (ViewContent, Lead, …).
 *
 * `eventID` sirve para deduplicar contra la Conversions API del backend: si el
 * mismo evento llega por el pixel y por el servidor con el mismo id, Meta lo
 * cuenta una sola vez.
 */
export function metaEvento (
  nombre: string,
  parametros?: Record<string, unknown>,
  opciones?: { eventID?: string },
  slug?: string | null,
) {
  for (const pixel of destinos(slug, false)) {
    if (opciones != null) window.fbq?.('trackSingle', pixel, nombre, parametros, opciones)
    else window.fbq?.('trackSingle', pixel, nombre, parametros)
  }
}
