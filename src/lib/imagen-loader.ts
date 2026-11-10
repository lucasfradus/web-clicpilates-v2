'use client'

/**
 * Loader de `next/image`: arma el srcset con imágenes que ya existen como
 * archivo, en vez de pasarlas por el optimizador de Next.
 *
 * **Por qué.** En Railway el sitio es un `next start` prendido 24 horas y se
 * paga la memoria por minuto. El optimizador redimensiona cada foto con sharp
 * dentro de ese mismo proceso, y sharp/libvips guardan memoria que nunca le
 * devuelven al sistema: el servicio quedó clavado en ~0,95 GB (unos $9,50 por
 * mes) para un sitio que sin eso anda en 150-250 MB. En Vercel no se notaba
 * porque ahí las imágenes las optimiza su CDN, fuera de nuestra función.
 *
 * Los tres anchos son los mismos en los dos orígenes, y coinciden con
 * `deviceSizes` en next.config.ts:
 *
 * - **Fotos del backend** (sedes, eventos: `/api/storage/...`): ClicNet genera
 *   las variantes WebP al subir la foto y las sirve con `?w=640|1280|2000`. Si
 *   la variante no existe (foto vieja, GIF animado), devuelve el original.
 * - **Fotos de marca** (`/fotos/...` en `public`): las variantes las genera
 *   `scripts/generar-variantes.mjs` antes de `dev` y de `build`, en `public/_v`.
 *
 * Cualquier otra imagen se sirve tal cual.
 */

export const ANCHOS = [640, 1280, 2000] as const

/** El ancho más chico que alcanza, o el más grande si ninguno alcanza. */
export function anchoVariante (ancho: number): number {
  return ANCHOS.find((a) => a >= ancho) ?? ANCHOS[ANCHOS.length - 1]
}

const FOTO_LOCAL = /^\/fotos\/.+\.(jpe?g|png|webp)$/i

export default function imagenLoader ({ src, width }: { src: string; width: number }): string {
  const ancho = anchoVariante(width)

  if (FOTO_LOCAL.test(src)) {
    return `/_v${src.replace(/\.[a-z0-9]+$/i, '')}-${ancho}.webp`
  }

  if (src.includes('/api/storage/')) {
    return `${src}${src.includes('?') ? '&' : '?'}w=${ancho}`
  }

  return src
}
