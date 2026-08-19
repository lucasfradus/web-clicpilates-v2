import type { NextConfig } from 'next'

/**
 * Los dos SPAs que ya funcionan se sirven por rewrite bajo el mismo dominio
 * (docs/plan.md §1). No se reescriben: el SEO vive en este proyecto y ellos
 * siguen siendo ellos, pero pasan a ser rutas de clicpilates.com. Eso da nav
 * única y, sobre todo, cookie de sesión de primera parte — hoy la sesión del
 * portal vive en `clientes.clicpilates.com` y Safari la castiga.
 *
 * Para que los assets resuelvan detrás del rewrite, cada SPA tiene que buildear
 * con `VITE_BASE_PATH=/reservar/` (o `/mi-cuenta/`). Sin eso el HTML vuelve
 * pidiendo `/assets/...` en la raíz del dominio y la página queda en blanco.
 * Ver docs/rewrites.md.
 */
const RESERVAS_ORIGIN =
  process.env.RESERVAS_ORIGIN ?? 'https://reservas-clientes-clic-v2-production.up.railway.app'
const CLIENTES_ORIGIN =
  process.env.CLIENTES_ORIGIN ?? 'https://clientes.clicpilates.com'

/**
 * Un build de Vite sirve sus archivos en la raíz del origen aunque los pida con
 * el prefijo, así que el rewrite se lo saca: `/reservar/assets/x.js` va a
 * `origen/assets/x.js`. Un `vite dev`, en cambio, sirve todo debajo del
 * prefijo, así que ahí hay que dejárselo puesto.
 *
 * De ahí estas dos variables: vacías contra un deploy, `/reservar` y
 * `/mi-cuenta` contra un dev server local. Ver docs/rewrites.md.
 */
const RESERVAS_PREFIJO = process.env.RESERVAS_PREFIJO ?? ''
const CLIENTES_PREFIJO = process.env.CLIENTES_PREFIJO ?? ''

/**
 * Proxy de `/api` hacia el backend. Es para desarrollo: los dos SPAs piden su
 * API al mismo origen que los sirve, y detrás del rewrite ese origen es este
 * sitio, no ellos. En producción no se define, porque ahí cada SPA buildea con
 * `VITE_API_BASE_URL` apuntando al backend real.
 */
const API_ORIGIN = process.env.API_ORIGIN

const nextConfig: NextConfig = {
  images: {
    // Las fotos de las sedes las sirve el backend desde su storage.
    // El backend ya genera variantes WebP y acepta `?w=`; acá igual las pasamos
    // por el optimizador de Next, que además arma el srcset y sirve AVIF.
    remotePatterns: [
      { protocol: 'https', hostname: 'app.clicpilates.com', pathname: '/api/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api/storage/**' },
    ],
  },

  async rewrites () {
    return [
      ...(API_ORIGIN
        ? [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }]
        : []),
      // La barra final del destino sin `:path*` no es cosmética: un `vite dev`
      // sirve en `/reservar/` y devuelve 404 para `/reservar`.
      { source: '/reservar', destination: `${RESERVAS_ORIGIN}${RESERVAS_PREFIJO}/` },
      { source: '/reservar/:path*', destination: `${RESERVAS_ORIGIN}${RESERVAS_PREFIJO}/:path*` },
      { source: '/mi-cuenta', destination: `${CLIENTES_ORIGIN}${CLIENTES_PREFIJO}/` },
      { source: '/mi-cuenta/:path*', destination: `${CLIENTES_ORIGIN}${CLIENTES_PREFIJO}/:path*` },
    ]
  },

  async redirects () {
    return [
      // Las URLs del sitio anterior. Se activan solas el día que el dominio
      // apunte acá; hasta entonces no molestan a nadie.
      //
      // Van con 301 explícito y no con `permanent: true`, que emite 308: los
      // dos son permanentes y Google los trata igual, pero 301 lo entiende
      // cualquier herramienta vieja.
      //
      // `office` es el único slug que cambió (ahora `office-pilates`), así que
      // va antes de la regla genérica: Next aplica la primera que matchea.
      { source: '/sede/office', destination: '/estudios/office-pilates', statusCode: 301 },
      { source: '/horarios/office', destination: '/estudios/office-pilates', statusCode: 301 },
      { source: '/grilla/office', destination: '/estudios/office-pilates', statusCode: 301 },
      // `prueba` era una página de test del sitio viejo: va al índice.
      { source: '/sede/prueba', destination: '/estudios', statusCode: 301 },
      { source: '/horarios/prueba', destination: '/estudios', statusCode: 301 },
      { source: '/grilla/prueba', destination: '/estudios', statusCode: 301 },

      { source: '/sede/:slug', destination: '/estudios/:slug', statusCode: 301 },
      // Los horarios y la grilla eran páginas aparte; ahora la grilla vive
      // dentro de la landing de cada estudio.
      { source: '/horarios/:slug', destination: '/estudios/:slug', statusCode: 301 },
      { source: '/grilla/:slug', destination: '/estudios/:slug', statusCode: 301 },

      // El sitio es `www` (decisión de fase 1, ver src/lib/site.ts). El apex
      // redirige acá y no en el DNS para que la regla viva en el repo y no se
      // pierda en un panel.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'clicpilates.com' }],
        destination: 'https://www.clicpilates.com/:path*',
        statusCode: 301,
      },
    ]
  },
}

export default nextConfig
