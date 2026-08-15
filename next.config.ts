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
      // El sitio es `www` (decisión de fase 1, ver src/lib/site.ts). El apex
      // redirige acá y no en el DNS para que la regla viva en el repo y no se
      // pierda en un panel.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'clicpilates.com' }],
        destination: 'https://www.clicpilates.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
