import Link from 'next/link'
import type { ComponentProps } from 'react'

import type { EnlaceNav } from '@/lib/nav'

type Props = Omit<ComponentProps<'a'>, 'href'> & Pick<EnlaceNav, 'href' | 'spa'>

/**
 * Enlace de navegación. Usa <Link> salvo cuando el destino es un SPA servido
 * por rewrite (`/mi-cuenta`): ese necesita navegación del navegador, porque el
 * prefetch y el routing de cliente de Next esperan del otro lado una respuesta
 * que un Vite no devuelve.
 */
export function Enlace ({ href, spa, children, ...props }: Props) {
  if (spa) {
    return <a href={href} {...props}>{children}</a>
  }
  return <Link href={href} {...props}>{children}</Link>
}
