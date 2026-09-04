import Image from 'next/image'

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
