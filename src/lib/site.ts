/** Datos del sitio que no salen de la API y que se repiten en metadata, header,
 *  footer y JSON-LD. Un solo lugar para que no se desincronicen. */

export const SITIO = {
  nombre: 'CLIC studio pilates',
  /** Canónico. Decisión de fase 1: el sitio vive en `www`, y el apex redirige
   *  con 301 (ver `redirects()` en next.config.ts). */
  url: 'https://www.clicpilates.com',
  titulo: 'Pilates reformer en Buenos Aires · CLIC studio pilates',
  descripcion:
    'Pilates Clásico en reformer, en grupos chicos, en Buenos Aires. ' +
    'Reservá tu clase de prueba y mirá los horarios reales de tu estudio.',
  /** "Hacer el clic": el momento en que decidís priorizarte. Es el activo de
   *  marca más fuerte del negocio (docs/contexto.md §5). */
  claim: 'HACÉ EL CLIC',
  locale: 'es_AR',
  redes: {
    instagram: 'https://www.instagram.com/clicstudiopilates',
    tiktok: 'https://www.tiktok.com/@clicstudiopilates',
  },
} as const

/** Los previews no se indexan. Se activa con NEXT_PUBLIC_NOINDEX=true en el
 *  entorno de preview; producción no setea nada. */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true'
