import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GrillaHoraria } from '@/components/grilla/grilla-horaria'
import { getGrilla } from '@/lib/api/grilla'
import { getSede } from '@/lib/api/sedes'

/**
 * La grilla semanal de un estudio, suelta: el link que se comparte para mostrar
 * qué horarios tienen lugar. Cuando la landing del estudio pasó a ser el portal
 * de reservas, esta página quedó redirigida ahí y se perdió. Vuelve como era en
 * el sitio anterior.
 *
 * Fuera del índice: el contenido indexable del estudio es su landing.
 */

export const dynamic = 'force-dynamic'

export async function generateMetadata ({ params }: PageProps<'/grilla/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const sede = await getSede(slug)
  return {
    title: sede ? `Horarios ${sede.nombre}` : 'Horarios',
    robots: { index: false, follow: true },
  }
}

export default async function GrillaPage ({ params }: PageProps<'/grilla/[slug]'>) {
  const { slug } = await params
  const [sede, datos] = await Promise.all([getSede(slug), getGrilla(slug)])

  // Sin el listado de sedes todavía se puede mostrar la grilla con lo que trae
  // el propio endpoint; sin ninguna de las dos, el estudio no existe.
  const nombre = sede?.nombre ?? datos?.center.name
  const direccion = sede?.direccion ?? datos?.center.address
  if (nombre === undefined) notFound()

  return (
    <section className="grilla">
      <div className="container">
        <header className="grilla__head">
          <div>
            <h1 className="grilla__titulo">Clic Pilates · {nombre}</h1>
            {direccion && <p className="grilla__direccion">{direccion}</p>}
          </div>
          <Link className="btn btn--primary" href={`/estudios/${slug}`}>Reservá tu clase</Link>
        </header>

        {datos === null || Object.keys(datos.schedule).length === 0 ? (
          <p className="grilla__vacio">Próximamente publicamos los horarios de este estudio.</p>
        ) : (
          <GrillaHoraria grilla={datos.schedule} />
        )}
      </div>
    </section>
  )
}
