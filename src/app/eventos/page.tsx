import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { getEventos, type Evento } from '@/lib/eventos/api'
import { horarioEvento } from '@/lib/eventos/formato'
import { pesos } from '@/lib/formato'
import { formatDayLong } from '@/lib/reservas/format'

/** Próximos eventos de CLIC con entradas a la venta. */

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Clases especiales y eventos de CLIC. Entradas online para socios y no socios.',
  alternates: { canonical: '/eventos' },
}

export default async function EventosPage () {
  const eventos = await getEventos().catch(() => null)

  return (
    <div className="rsv">
      <div className="page">
        <section className="container eventos">
          <p className="t-tag">CLIC</p>
          <h1 className="eventos__titulo t-display">Eventos</h1>

          {eventos == null ? (
            <p className="eventos__vacio">No pudimos cargar los eventos. Probá de nuevo en un rato.</p>
          ) : eventos.length === 0 ? (
            <p className="eventos__vacio">No hay eventos programados por ahora.</p>
          ) : (
            <ul className="eventos__lista">
              {eventos.map((e) => (
                <li key={e.slug}>
                  <Tarjeta evento={e} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Tarjeta ({ evento }: { evento: Evento }) {
  return (
    <Link href={`/eventos/${evento.slug}`} className="eventos__card">
      <div className="eventos__card-media">
        {evento.imagenUrl != null && (
          <Image src={evento.imagenUrl} alt="" fill sizes="(max-width: 860px) 100vw, 400px" className="evento__img" />
        )}
      </div>
      <div className="eventos__card-body">
        <p className="eventos__card-fecha">
          {formatDayLong(evento.inicio)} · {horarioEvento(evento.inicio, evento.fin)}
        </p>
        <h2 className="eventos__card-nombre">{evento.nombre}</h2>
        <p className="eventos__card-lugar">{evento.ubicacion}</p>
        <p className="eventos__card-precio">
          {evento.soloSocios
            ? `Exclusivo socios · ${pesos(evento.precioSocio)}`
            : `Socios ${pesos(evento.precioSocio)} · No socios ${pesos(evento.precioNoSocio)}`}
        </p>
        {!evento.ventaAbierta && <span className="eventos__card-agotado">Agotado</span>}
      </div>
    </Link>
  )
}
