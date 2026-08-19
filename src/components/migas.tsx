import Link from 'next/link'
import { Fragment } from 'react'

export interface Miga {
  nombre: string
  href?: string
}

/**
 * Ruta de navegación visible. Se ve poco pero pesa: es lo que hace que Google
 * muestre "clicpilates.com › Estudios › Núñez" en vez de la URL cruda, y el
 * `BreadcrumbList` del JSON-LD tiene que repetir exactamente esto.
 */
export function Migas ({ migas }: { migas: Miga[] }) {
  return (
    <nav className="crumbs" aria-label="Ruta de navegación">
      {migas.map((miga, i) => (
        <Fragment key={miga.nombre}>
          {i > 0 && <span className="crumbs__sep" aria-hidden="true">/</span>}
          {miga.href != null
            ? <Link href={miga.href}>{miga.nombre}</Link>
            : <span aria-current="page">{miga.nombre}</span>}
        </Fragment>
      ))}
    </nav>
  )
}
