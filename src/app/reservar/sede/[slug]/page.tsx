import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Checkout } from '@/components/checkout/checkout'
import { EstadoSeccion } from '@/components/estados'
import { getClases } from '@/lib/api/clases'
import { getCatalogo, getSedes } from '@/lib/api/sedes'
import type { Sede } from '@/lib/api/tipos'

// Next exige que este valor sea un literal analizable estáticamente: no acepta
// una constante importada. Tiene que coincidir con REVALIDAR de src/lib/api.
export const revalidate = 3600

/**
 * El checkout de una sede.
 *
 * **No es otra landing.** El portal que esto reemplaza mostraba su propia
 * portada —hero, planes, beneficios— antes de dejarte reservar, porque era un
 * sitio aparte y no tenía dónde más contarlo. Acá esa portada ya existe y es
 * mejor: `/estudios/<slug>`, que además es el activo de SEO. Repetirla sería
 * mantener dos versiones de lo mismo y hacer que la persona la lea dos veces.
 *
 * Así que esta página empieza directamente en la decisión:
 *
 * - sin parámetros → reservar una clase de prueba;
 * - con `?tipo=<CatalogoTipoPlan.id>` → comprar ese plan.
 *
 * Los datos los resuelve el servidor y bajan listos. El portal los pedía desde
 * el navegador y mostraba un spinner de página entera antes de cualquier cosa.
 */

async function buscarSede (slug: string): Promise<Sede | 'error' | null> {
  const sedes = await getSedes()
  if (sedes === null) return 'error'
  return sedes.find((s) => s.slug === slug) ?? null
}

export async function generateStaticParams () {
  const sedes = await getSedes()
  return (sedes ?? []).filter((s) => s.reservaOnline).map((sede) => ({ slug: sede.slug }))
}

export async function generateMetadata ({ params }: PageProps<'/reservar/sede/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const sede = await buscarSede(slug)
  if (typeof sede === 'string' || sede === null) return {}

  return {
    title: `Reservar en CLIC ${sede.nombre}`,
    description: `Elegí tu clase de prueba en CLIC ${sede.nombre} y reservá online.`,
    alternates: { canonical: `/reservar/sede/${sede.slug}` },
  }
}

export default async function ReservarSede ({ params, searchParams }: PageProps<'/reservar/sede/[slug]'>) {
  const { slug } = await params
  const sede = await buscarSede(slug)

  // Que el backend esté caído no puede convertir una sede real en un 404
  // permanente: eso le enseñaría a Google que la página no existe.
  if (sede === 'error') throw new Error(`No se pudo cargar la sede ${slug}`)
  if (sede === null) notFound()

  // Una sede sin venta online no puede cobrar. Su landing existe igual —no
  // dejamos que una configuración de cobro borre una página— pero acá no hay
  // nada que hacer, así que se dice y se manda a donde sí se puede resolver.
  if (!sede.reservaOnline) {
    return (
      <section className="section">
        <div className="container">
          <EstadoSeccion
            tipo="vacio"
            titulo={`CLIC ${sede.nombre} no toma reservas online`}
            detalle="Escribinos y coordinamos tu clase de prueba por mensaje."
          >
            <a className="btn btn--ghost btn--sm" href={`/estudios/${sede.slug}`}>
              Ver el estudio
            </a>
          </EstadoSeccion>
        </div>
      </section>
    )
  }

  const [catalogo, clases] = await Promise.all([getCatalogo(sede.slug), getClases(sede.id)])

  // `?tipo=` es el `CatalogoTipoPlan.id`, el mismo que publican las tarjetas de
  // plan de la landing. Un valor que no sea un id positivo se ignora y la
  // página cae en la rama de clase de prueba.
  const { tipo } = await searchParams
  const pedido = Number(Array.isArray(tipo) ? tipo[0] : tipo)
  const tipoId = Number.isInteger(pedido) && pedido > 0 ? pedido : null

  return <Checkout sede={sede} catalogo={catalogo} clases={clases} tipoId={tipoId} />
}
