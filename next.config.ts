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

const nextConfig: NextConfig = {
  async rewrites () {
    return [
      { source: '/reservar', destination: RESERVAS_ORIGIN },
      { source: '/reservar/:path*', destination: `${RESERVAS_ORIGIN}/:path*` },
      { source: '/mi-cuenta', destination: CLIENTES_ORIGIN },
      { source: '/mi-cuenta/:path*', destination: `${CLIENTES_ORIGIN}/:path*` },
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
