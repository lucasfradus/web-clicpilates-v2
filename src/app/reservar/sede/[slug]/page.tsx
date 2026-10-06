import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Planes from '@/components/reservas/Planes'
import { getCatalogo, getSedes } from '@/lib/reservas/api'
import type { Sede } from '@/lib/reservas/types'

/**
 * La página de una sede en el portal de reservas: el hero, los planes, y el
 * checkout de clase de prueba o de plan. Es `Planes.tsx` del portal, portado.
 *
 * La sede y su catálogo se resuelven acá, con caché. Las clases no: cambian
 * cada minuto y las pide el navegador.
 *
 * `?tipo=<CatalogoTipoPlan.id>` abre directamente el checkout de ese plan: es
 * lo que mandan las tarjetas de plan de la landing del estudio.
 */

async function buscarSede (slug: string): Promise<Sede | 'error' | null> {
  try {
    const sedes = await getSedes()
    return sedes.find((s) => s.slug === slug) ?? null
  } catch {
    return 'error'
  }
}

export async function generateMetadata ({ params }: PageProps<'/reservar/sede/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const sede = await buscarSede(slug)
  if (typeof sede === 'string' || sede === null) return { title: 'Reservar' }

  return {
    title: `Reservá en CLIC ${sede.nombre}`,
    description: `Clase de prueba y planes de CLIC ${sede.nombre}, ${sede.direccion}. Reservá online.`,
    alternates: { canonical: `/reservar/sede/${sede.slug}` },
  }
}

export default async function ReservarSede ({ params, searchParams }: PageProps<'/reservar/sede/[slug]'>) {
  const { slug } = await params
  const { tipo } = await searchParams
  const tipoParam = (Array.isArray(tipo) ? tipo[0] : tipo) ?? null

  const sede = await buscarSede(slug)
  if (sede === null) notFound()

  // Si el backend no contestó, la pantalla del portal muestra su propio error
  // con "Reintentar", que vuelve a pedir todo desde el navegador.
  if (sede === 'error') {
    return (
      <div className="rsv">
        <div className="page">
          <Planes slug={slug} tipoParam={tipoParam} inicial={null} />
        </div>
      </div>
    )
  }

  const catalogo = await getCatalogo(slug).catch(() => [])
  const cat = catalogo.find((c) => c.sedeSlug === slug) ?? catalogo[0]

  return (
    <div className="rsv">
      <div className="page">
        <Planes
          slug={slug}
          tipoParam={tipoParam}
          inicial={{
            sede,
            tipos: cat?.tipos ?? [],
            caracteristicas: cat?.caracteristicas ?? [],
          }}
        />
      </div>
    </div>
  )
}
