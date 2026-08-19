import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/json-ld'
import { ViewContentSede } from '@/components/medicion/view-content'
import { Migas } from '@/components/migas'
import { BloqueFaq } from '@/components/sede/faq'
import { BloquePrueba } from '@/components/sede/bloque-prueba'
import { Galeria } from '@/components/sede/galeria'
import { GrillaEnVivo } from '@/components/sede/grilla-en-vivo'
import { Planes } from '@/components/sede/planes'
import { accionDeSede } from '@/lib/api/contacto'
import { getCatalogo, getSedes } from '@/lib/api/sedes'
import type { Sede } from '@/lib/api/tipos'
import { faqsDeSede } from '@/lib/faqs'
import { pesos } from '@/lib/formato'
import { grafo, migasDePan, negocioLocal, organizacion, paginaDeFaqs } from '@/lib/jsonld'
import { NOINDEX } from '@/lib/site'
import { sedesCerca, zonaDe } from '@/lib/zona'

// Next exige que este valor sea un literal analizable estáticamente: no acepta
// una constante importada. Tiene que coincidir con REVALIDAR de src/lib/api.
export const revalidate = 3600

/**
 * La landing de sede: el activo de SEO del proyecto.
 *
 * Todo lo indexable —H1 por zona, dirección, precios, FAQs, structured data—
 * sale en el HTML del servidor y se cachea una hora. Lo único que llega después
 * es la grilla, que cambia cada minuto.
 */

async function buscarSede (slug: string): Promise<Sede | 'error' | null> {
  const sedes = await getSedes()
  if (sedes === null) return 'error'
  return sedes.find((s) => s.slug === slug) ?? null
}

export async function generateStaticParams () {
  const sedes = await getSedes()
  return (sedes ?? []).map((sede) => ({ slug: sede.slug }))
}

export async function generateMetadata ({ params }: PageProps<'/estudios/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const sede = await buscarSede(slug)
  if (typeof sede === 'string' || sede === null) return {}

  const zona = zonaDe(sede)
  // Sin la marca: la agrega la plantilla del layout (`%s · CLIC studio pilates`).
  const titulo = `Pilates reformer en ${zona}`
  const descripcion =
    `Pilates Clásico en reformer en ${sede.direccion}, ${sede.ciudad}. ` +
    `Horarios reales, grupos chicos y clase de prueba desde ${pesos(sede.precioPrueba)}.`

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

export default async function LandingSede ({ params }: PageProps<'/estudios/[slug]'>) {
  const { slug } = await params
  const sede = await buscarSede(slug)

  // Que el backend esté caído no puede convertir una sede real en un 404
  // permanente: eso le enseñaría a Google que la página no existe.
  if (sede === 'error') throw new Error(`No se pudo cargar la sede ${slug}`)
  if (sede === null) notFound()

  const [catalogo, todas] = await Promise.all([getCatalogo(sede.slug), getSedes()])
  const zona = zonaDe(sede)
  const faqs = faqsDeSede(sede, catalogo)
  const cerca = sedesCerca(sede, todas ?? [])
  const accion = accionDeSede(sede)

  const migas = [
    { nombre: 'Inicio', href: '/' },
    { nombre: 'Estudios', href: '/estudios' },
    { nombre: sede.nombre },
  ]

  return (
    <>
      <section className="subhero">
        <div className="container subhero__in">
          <Migas migas={migas} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>{sede.ciudad}</p>
          <h1>Pilates reformer<br />en {zona}</h1>
          <p>
            CLIC {sede.nombre} — {sede.direccion}, {sede.ciudad}.
            {sede.descripcion != null ? ` ${sede.descripcion}` : ' Pilates Clásico en reformer, en grupos chicos.'}
          </p>
          {accion != null && (
            <div style={{ marginTop: 28 }}>
              <a
                className="btn btn--light"
                href={accion.href}
                {...(accion.reserva ? {} : { target: '_blank', rel: 'noreferrer' })}
              >
                {accion.texto}
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="container">
        <div className="info-grid">
          <div className="info">
            <p className="eyebrow">Clase de prueba</p>
            <b>{pesos(sede.precioPrueba)}</b>
            <span>Se abona al reservar y se descuenta del plan si seguís.</span>
          </div>
          <div className="info">
            <p className="eyebrow">Dirección</p>
            <b>{sede.direccion}</b>
            <span>
              {sede.googleMapsUrl != null
                ? <a href={sede.googleMapsUrl} target="_blank" rel="noreferrer" className="sub">Abrir en Google Maps</a>
                : sede.ciudad}
            </span>
          </div>
          <div className="info">
            <p className="eyebrow">Consultas</p>
            <b>{sede.whatsappUrl != null ? 'WhatsApp' : sede.email ?? 'Por la web'}</b>
            <span>
              {sede.whatsappUrl != null
                ? <a href={sede.whatsappUrl} target="_blank" rel="noreferrer" className="sub">Escribinos por WhatsApp</a>
                : 'Horarios y planes, de lunes a sábado.'}
            </span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Disponibilidad real</p>
            <h2>Próximas clases en {sede.nombre}</h2>
            <p>
              Los cupos salen del mismo sistema con el que trabaja el estudio.
              Lo que ves acá es lo que hay.
            </p>
          </div>
          <GrillaEnVivo sede={sede} />
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Cómo empezás en {sede.nombre}</p>
            <h2>Probás una vez, y si seguís no la pagás dos.</h2>
          </div>
          <BloquePrueba nombreSede={sede.nombre} precioPrueba={sede.precioPrueba} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Planes en {sede.nombre}</p>
            <h2>Elegí tu frecuencia.</h2>
            <p>Estos son los valores de este estudio. Cada sede publica su propia lista.</p>
          </div>
          <Planes sede={sede} catalogo={catalogo} />
        </div>
      </section>

      {sede.fotosDetalle.length > 0 && (
        <section className="section section--tight" style={{ background: 'var(--surface)' }}>
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">El estudio</p>
              <h2>Así es CLIC {sede.nombre}.</h2>
            </div>
            <Galeria fotos={sede.fotosDetalle} nombreSede={sede.nombre} />
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2>Sobre entrenar en {zona}.</h2>
          </div>
          <BloqueFaq faqs={faqs} />

          {cerca.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <p className="eyebrow">Otros estudios cerca</p>
              <div className="nearby">
                {cerca.map((otra) => (
                  <Link key={otra.id} href={`/estudios/${otra.slug}`}>
                    CLIC {otra.nombre} <span style={{ color: 'var(--ink-soft)' }}>{otra.ciudad}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <ViewContentSede
        slug={sede.slug}
        nombre={sede.nombre}
        precioPrueba={sede.precioPrueba}
        activo={!NOINDEX}
      />

      <JsonLd
        datos={grafo(
          organizacion(),
          negocioLocal(sede, catalogo),
          paginaDeFaqs(faqs),
          migasDePan(migas),
        )}
      />
    </>
  )
}
