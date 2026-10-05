import Image from 'next/image'

import type { Foco } from '@/lib/api/tipos'
import { publicable, type Foto } from '@/lib/fotos'

/**
 * Foto de fondo de una sección.
 *
 * Devuelve `null` si la foto no está o todavía no se puede publicar: el
 * contenedor conserva su degradado y la página no cambia. Eso hace que sumar
 * una foto sea poner un archivo y un flag, sin tocar el layout.
 *
 * El `alt` va vacío a propósito cuando es decorativa: describir un fondo que
 * sólo aporta clima le agrega ruido a un lector de pantalla.
 */
export function FotoFondo ({ foto, prioridad = false, sizes = '100vw', decorativa = true }: {
  foto: Foto | null | undefined
  /** `true` sólo para la foto que entra en el primer pantallazo (el LCP). */
  prioridad?: boolean
  sizes?: string
  decorativa?: boolean
}) {
  const ok = publicable(foto)
  if (ok == null) return null

  return (
    <Image
      src={ok.src}
      alt={decorativa ? '' : ok.alt}
      aria-hidden={decorativa ? true : undefined}
      fill
      priority={prioridad}
      sizes={sizes}
      style={{
        objectFit: 'cover',
        objectPosition: `${ok.foco?.x ?? 50}% ${ok.foco?.y ?? 50}%`,
      }}
    />
  )
}

/**
 * Lo mismo, pero para una foto que vive en el backend.
 *
 * Las de marca están en `src/lib/fotos.ts` y pasan por el interruptor de
 * consentimiento; éstas las sube el franquiciado desde el backoffice y son de
 * su propio estudio, así que no hay nada que gatear acá: si la sede tiene foto
 * se muestra, y si no, el contenedor conserva su degradado.
 *
 * El `foco` lo guarda el backend por imagen. Sin él, en mobile el recorte corta
 * mal: una sala fotografiada a lo ancho centrada deja afuera lo que importa.
 */
export function FotoFondoRemota ({ url, foco, prioridad = false, sizes = '100vw' }: {
  url: string | null | undefined
  foco?: Foco | null
  prioridad?: boolean
  sizes?: string
}) {
  if (url == null || url === '') return null

  return (
    <Image
      src={url}
      alt=""
      aria-hidden
      fill
      priority={prioridad}
      sizes={sizes}
      style={{
        objectFit: 'cover',
        objectPosition: `${foco?.x ?? 50}% ${foco?.y ?? 50}%`,
      }}
    />
  )
}
