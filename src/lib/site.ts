/** Datos del sitio que no salen de la API y que se repiten en metadata, header,
 *  footer y JSON-LD. Un solo lugar para que no se desincronicen. */

export const SITIO = {
  nombre: 'CLIC studio pilates',
  /** Canónico. Decisión de fase 1: el sitio vive en `www`, y el apex redirige
   *  con 301 (ver `redirects()` en next.config.ts). */
  url: 'https://www.clicpilates.com',
  titulo: 'Pilates reformer en Buenos Aires · CLIC studio pilates',
  descripcion:
    'Pilates Reformer en grupos chicos, en Buenos Aires. ' +
    'Reservá tu clase de prueba y mirá los horarios reales de tu estudio.',
  /** "Hacer el clic": el momento en que decidís priorizarte. Es el activo de
   *  marca más fuerte del negocio (docs/contexto.md §5). */
  claim: 'HACÉ EL CLIC',
  locale: 'es_AR',
  redes: {
    instagram: 'https://www.instagram.com/clic.pilates',
    tiktok: 'https://www.tiktok.com/@clic.pilates',
  },
  /** La app propia. En la App Store figura como "Clic Fitness": es la misma
   *  app para las tres marcas. */
  apps: {
    ios: 'https://apps.apple.com/ar/app/clic-fitness/id6806391392',
    android: 'https://play.google.com/store/apps/details?id=com.clicestudio.app',
  },
} as const

/** Los previews no se indexan. Se activa con NEXT_PUBLIC_NOINDEX=true en el
 *  entorno de preview; producción no setea nada. */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'

/**
 * La base de las URLs absolutas de los metadatos (`og:image`, canonical).
 *
 * En producción es el canónico. En un preview no: ahí `www.clicpilates.com`
 * todavía es el sitio anterior, y un link compartido desde staging viajaba con
 * `og:image` apuntando a un `/og.jpg` que allá da 404 — WhatsApp lo mostraba
 * sin imagen. Railway expone el dominio del deploy en build y en runtime.
 */
const DOMINIO_DEL_DEPLOY = process.env.RAILWAY_PUBLIC_DOMAIN
export const URL_BASE =
  NOINDEX && DOMINIO_DEL_DEPLOY ? `https://${DOMINIO_DEL_DEPLOY}` : SITIO.url
