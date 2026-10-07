import type { NextConfig } from 'next'

/**
 * `/mi-cuenta` manda al portal de clientes, que sigue siendo otro sitio. Se
 * probó servirlo por rewrite bajo este dominio, pero el destino es el portal en
 * producción, que no buildea con el prefijo, y la página quedaba en blanco.
 * Hasta decidir si se porta o si se empuja la app, es un redirect: temporal,
 * para que nadie lo guarde como definitivo.
 */
const CLIENTES_ORIGIN =
  process.env.CLIENTES_ORIGIN ?? 'https://clientes.clicpilates.com'

/**
 * Proxy de `/api` hacia el backend, para los pedidos que salen del navegador
 * cuando `NEXT_PUBLIC_API_BASE_URL` apunta al propio sitio (ver
 * src/lib/api/cliente.ts). Sin definir, el sitio le pega al backend público.
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
    return API_ORIGIN
      ? [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }]
      : []
  },

  async redirects () {
    return [
      { source: '/mi-cuenta', destination: `${CLIENTES_ORIGIN}/`, permanent: false },
      { source: '/mi-cuenta/:path*', destination: `${CLIENTES_ORIGIN}/:path*`, permanent: false },

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

      // Reservar vive en /estudios desde el 7-oct: el portal de reservas portado
      // es la página de cada estudio. Esto cubre las URLs que tuvo en este sitio
      // y las del portal viejo, que el 301 de reservas.clicpilates.com manda acá
      // (campañas, QR impresos, links compartidos). Next arrastra el query
      // string solo: `?tipo=` elige el plan y las UTMs atribuyen la venta.
      // `/reservar/gracias` NO se redirige: es la vuelta de Mercado Pago.
      { source: '/reservar', destination: '/estudios', statusCode: 301 },
      { source: '/reservar/sede/:slug', destination: '/estudios/:slug', statusCode: 301 },
      { source: '/reservar/sede/:slug/precios', destination: '/estudios/:slug', statusCode: 301 },
      // El id de clase no dice de qué sede es: lo honesto es mandar a elegirla.
      { source: '/reservar/reservar/:claseId', destination: '/estudios', statusCode: 301 },

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
