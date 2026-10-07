import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/json-ld'
import Planes from '@/components/reservas/Planes'
import { getCatalogo as getCatalogoWeb, getSedes as getSedesWeb } from '@/lib/api/sedes'
import { pesos } from '@/lib/formato'
import { grafo, migasDePan, negocioLocal, organizacion } from '@/lib/jsonld'
import { getCatalogo, getSedes } from '@/lib/reservas/api'
import type { Sede } from '@/lib/reservas/types'
import { zonaDe } from '@/lib/zona'

/**
 * La página de un estudio. Desde el 7-oct es una sola: la del portal de
 * reservas (hero, planes y checkout de clase de prueba o de plan), que antes
 * vivía en `/reservar/sede/<slug>` y convivía con una landing propia que
 * repetía lo mismo.
 *
 * Lo que la landing aportaba para Google y el portal no tenía va sin cambiar lo
 * que se ve: título y descripción por zona, imagen para compartir y el JSON-LD
 * del negocio. Las FAQs no: Google pide que el FAQPage esté visible.
 *
 * La sede y su catálogo se resuelven acá, con caché. Las clases no: cambian
 * cada minuto y las pide el navegador.
 *
 * `?tipo=<CatalogoTipoPlan.id>` abre directamente el checkout de ese plan.
 */

async function buscarSede (slug: string): Promise<Sede | 'error' | null> {
  try {
    const sedes = await getSedes()
    return sedes.find((s) => s.slug === slug) ?? null
  } catch {
    return 'error'
  }
}

export async function generateMetadata ({ params }: PageProps<'/estudios/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const sede = (await getSedesWeb())?.find((s) => s.slug === slug)
  if (sede == null) return {}

  const zona = zonaDe(sede)
  // Sin la marca: la agrega la plantilla del layout (`%s · CLIC studio pilates`).
  const titulo = `Pilates reformer en ${zona}`
  const descripcion =
    `Pilates Reformer en ${sede.direccion}, ${sede.ciudad}. ` +
    (sede.precioPrueba != null
      ? `Horarios reales, grupos chicos y clase de prueba desde ${pesos(sede.precioPrueba)}.`
      : 'Horarios reales y grupos chicos.')

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/estudios/${sede.slug}` },
    openGraph: {
      title: `${titulo} · CLIC ${sede.nombre}`,
      description: descripcion,
      url: `/estudios/${sede.slug}`,
      ...(sede.imagenUrl != null ? { images: [sede.imagenUrl] } : {}),
    },
  }
}

export default async function Estudio ({ params, searchParams }: PageProps<'/estudios/[slug]'>) {
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

  const [catalogo, sedeWeb, catalogoWeb] = await Promise.all([
    getCatalogo(slug).catch(() => []),
    getSedesWeb().then((s) => s?.find((x) => x.slug === slug) ?? null),
    getCatalogoWeb(slug),
  ])
  const cat = catalogo.find((c) => c.sedeSlug === slug) ?? catalogo[0]

  const migas = [
    { nombre: 'Inicio', href: '/' },
    { nombre: 'Estudios', href: '/estudios' },
    { nombre: sede.nombre },
  ]

  return (
    <>
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
      {sedeWeb != null && (
        <JsonLd
          datos={grafo(organizacion(), negocioLocal(sedeWeb, catalogoWeb), migasDePan(migas))}
        />
      )}
    </>
  )
}
