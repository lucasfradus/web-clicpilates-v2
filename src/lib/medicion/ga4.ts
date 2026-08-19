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

export function ga4Evento (nombre: string, params: Record<string, unknown> = {}) {
  if (GA_ID == null || GA_ID === '' || typeof window.gtag !== 'function') return
  window.gtag('event', nombre, params)
}
