import type { MetadataRoute } from 'next'

import { NOINDEX, SITIO } from '@/lib/site'

/**
 * `/reservar` y `/mi-cuenta` quedan fuera del índice: son los dos SPAs, no
 * aportan contenido indexable y sus URLs profundas son estados de una sesión.
 * `/api` tampoco.
 *
 * En staging **no** se bloquea el rastreo: el sitio ya sale con `noindex` en
 * cada página, y bloquear el rastreo impediría que Google lea justamente ese
 * `noindex`. Lo que sí se saca es el sitemap.
 */
export default function robots (): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/reservar', '/mi-cuenta'],
    },
    ...(NOINDEX ? {} : { sitemap: `${SITIO.url}/sitemap.xml`, host: SITIO.url }),
  }
}
