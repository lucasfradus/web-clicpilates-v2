import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import CompraEntrada from '@/components/eventos/CompraEntrada'
import { getEvento, type Evento } from '@/lib/eventos/api'
import { horarioEvento } from '@/lib/eventos/formato'
import { pesos } from '@/lib/formato'
import { formatDayLong } from '@/lib/reservas/format'

/**
 * El link público de un evento: lo que se comparte por WhatsApp e Instagram.
 *
 * Contenido en el servidor (indexable y con vista previa al compartir), con caché
 * corta. El formulario va del lado del cliente y le pega directo al backend: el
 * checkout limita intentos por IP y tiene que contar la de quien compra.
 */

export async function generateMetadata ({ params }: PageProps<'/eventos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const evento = await getEvento(slug).catch(() => null)
  if (evento == null) return {}
  const descripcion = `${formatDayLong(evento.inicio)}, ${horarioEvento(evento.inicio, evento.fin)} · ${evento.ubicacion}. ${evento.descripcion}`.slice(0, 300)
  return {
    title: evento.nombre,
    description: descripcion,
    alternates: { canonical: `/eventos/${evento.slug}` },
    openGraph: {
      title: `${evento.nombre} · CLIC`,
      description: descripcion,
      url: `/eventos/${evento.slug}`,
      ...(evento.imagenUrl != null ? { images: [evento.imagenUrl] } : {}),
    },
  }
}

export default async function EventoPage ({ params }: PageProps<'/eventos/[slug]'>) {
  const { slug } = await params
  const evento = await getEvento(slug)
  if (evento == null) notFound()

  return (
    <div className="rsv">
      <div className="page">
        <article className="container evento">
          <Link href="/eventos" className="evento__volver">← Eventos</Link>

          <div className="evento__grid">
            <div className="evento__info">
              {evento.imagenUrl != null && (
                <div className="evento__media">
                  <Image
                    src={evento.imagenUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 860px) 100vw, 560px"
                    className="evento__img"
                  />
                </div>
              )}

              <p className="evento__eyebrow t-tag">
                {evento.soloSocios ? 'Exclusivo para socios' : 'Evento'} · {evento.sede.nombre}
              </p>
              <h1 className="evento__titulo t-display">{evento.nombre}</h1>

              <ul className="evento__datos">
                <li>
                  <span className="evento__dato-lbl">Cuándo</span>
                  <span>
                    {formatDayLong(evento.inicio)} · {horarioEvento(evento.inicio, evento.fin)}
                  </span>
                </li>
                <li>
                  <span className="evento__dato-lbl">Dónde</span>
                  <span>{evento.ubicacion}</span>
                </li>
              </ul>

              <p className="evento__desc">{evento.descripcion}</p>

              <Precios evento={evento} />
            </div>

            <div className="evento__compra">
              <Venta evento={evento} />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

function Precios ({ evento }: { evento: Evento }) {
  return (
    <div className="evento__precios">
      <div className="evento__precio">
        <span className="evento__precio-lbl">Socios CLIC</span>
        <span className="evento__precio-num">{pesos(evento.precioSocio)}</span>
      </div>
      {evento.precioNoSocio != null && (
        <div className="evento__precio">
          <span className="evento__precio-lbl">No socios</span>
          <span className="evento__precio-num">{pesos(evento.precioNoSocio)}</span>
        </div>
      )}
    </div>
  )
}

function Venta ({ evento }: { evento: Evento }) {
  if (!evento.ventaAbierta) {
    const sinLugar = evento.lugaresDisponibles <= 0 && new Date(evento.inicio) > new Date()
    return (
      <div className="planes__form">
        <h2 className="planes__form-title">{sinLugar ? 'Entradas agotadas' : 'Venta cerrada'}</h2>
        <p className="planes__form-sub">
          {sinLugar ? 'No quedan lugares para este evento.' : 'La venta de entradas para este evento ya cerró.'}
        </p>
      </div>
    )
  }
  return (
    <>
      {evento.lugaresDisponibles <= 10 && (
        <p className="evento__quedan">
          {evento.lugaresDisponibles === 1 ? 'Queda 1 lugar' : `Quedan ${evento.lugaresDisponibles} lugares`}
        </p>
      )}
      <CompraEntrada slug={evento.slug} soloSocios={evento.soloSocios} />
    </>
  )
}
