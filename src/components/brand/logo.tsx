import { LOGO_PATH, LOGO_VIEWBOX } from './logo-path'

/**
 * Logotipo CLIC. Hereda `currentColor`, que es lo que permite que el header
 * pase de blanco sobre el hero a tinta sobre el fondo beige sin cruzar dos
 * imágenes.
 *
 * El trazo está generado desde el PNG de marca (scripts/trace-logo.mjs) porque
 * el vectorial original todavía no llegó. Cuando llegue se reemplaza el path y
 * este componente no cambia.
 */
export function Logo ({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg
      className={className}
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      fillRule="evenodd"
      role={titulo ? 'img' : 'presentation'}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d={LOGO_PATH} />
    </svg>
  )
}
