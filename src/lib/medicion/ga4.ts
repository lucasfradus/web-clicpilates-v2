declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * GA4.
 *
 * Mismo criterio que en el portal de reservas: `send_page_view: false` y las
 * vistas se mandan a mano, porque en una SPA el automático se pierde los
 * cambios de ruta y acá además queremos adjuntarle la sede.
 *
 * La sede viaja como parámetro `sede` y `sede_slug` en todos los eventos: es la
 * dimensión que hace que el embudo se pueda leer por estudio, que es como se
 * toman las decisiones de pauta.
 */
export function ga4PageView (params: { sede?: string; sedeSlug?: string } = {}) {
  if (GA_ID == null || GA_ID === '' || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_title: document.title,
    ...(params.sede != null ? { sede: params.sede } : {}),
    ...(params.sedeSlug != null ? { sede_slug: params.sedeSlug } : {}),
  })
}

/**
 * Eventos pedidos antes de que exista `gtag`; `null` cuando ya está. Mismo
 * problema que en meta.ts: en una carga completa los efectos de la página
 * corren antes que el script de GA, y el view_item o el purchase se perdían.
 */
let pendientes: Array<() => void> | null = []

/** Manda lo que quedó esperando. Lo llama el layout, después del page_view. */
export function ga4VaciarPendientes () {
  const cola = pendientes
  pendientes = null
  cola?.forEach((enviar) => enviar())
}

export function ga4Evento (nombre: string, params: Record<string, unknown> = {}) {
  if (GA_ID == null || GA_ID === '') return
  const enviar = () => window.gtag?.('event', nombre, params)
  if (pendientes != null) pendientes.push(enviar)
  else enviar()
}
