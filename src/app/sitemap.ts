import type { MetadataRoute } from 'next'

import { getSedes } from '@/lib/api/sedes'
import { NOINDEX, SITIO } from '@/lib/site'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

/**
 * El sitemap sale de las sedes activas, no de una lista a mano: una sede nueva
 * aparece sola dentro de la hora, y una que se apaga desaparece.
 *
 * Sin `lastModified`: el backend todavía no expone `updatedAt` de la sede
 * (migración pendiente), y poner la fecha de hoy en cada build sería mentirle a
 * Google sobre qué cambió — que es peor que no decirle nada.
 */
export default async function sitemap (): Promise<MetadataRoute.Sitemap> {
  // En staging no se publica sitemap: el sitio va con noindex y no queremos
  // ofrecerle a Google una lista de URLs que no tiene que indexar.
  if (NOINDEX) return []

  const sedes = await getSedes()

  const fijas = [
    { url: '/', priority: 1 },
    { url: '/estudios', priority: 0.9 },
    { url: '/precios', priority: 0.8 },
    { url: '/clases/initial-pilates', priority: 0.7 },
    { url: '/clases/level-up-pilates', priority: 0.7 },
    { url: '/academy', priority: 0.6 },
    { url: '/franquicias', priority: 0.6 },
    { url: '/politicas', priority: 0.2 },
  ]

  // Las landings de sede son el activo de SEO del sitio: van con la prioridad
  // más alta después de la home.
  const landings = (sedes ?? []).map((sede) => ({
    url: `/estudios/${sede.slug}`,
    priority: 0.9,
  }))

  return [...fijas, ...landings].map(({ url, priority }) => ({
    url: `${SITIO.url}${url === '/' ? '' : url}`,
    changeFrequency: 'weekly' as const,
    priority,
  }))
}
