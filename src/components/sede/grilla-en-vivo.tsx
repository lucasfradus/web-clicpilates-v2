'use client'

import { useEffect, useState } from 'react'

import { getClases, type ResultadoClases } from '@/lib/api/clases'
import { accionDeSede } from '@/lib/api/contacto'
import { diaCalendario, etiquetaDia, hora } from '@/lib/formato'
import type { Clase, Sede } from '@/lib/api/tipos'
import { BloqueCargando, EstadoSeccion } from '@/components/estados'

/**
 * Grilla en vivo del estudio.
 *
 * Es lo único de la landing que se difiere al cliente: cambia cada minuto, no
 * aporta SEO y es el pedido más pesado. Todo lo demás —dirección, precios,
 * descripción, fotos— ya vino en el HTML del servidor.
 *
 * El bloque de carga ocupa la misma altura que la grilla real para que, cuando
 * llegan los datos, la página no salte.
 */
export function GrillaEnVivo ({ sede, dias = 3 }: { sede: Sede; dias?: number }) {
  const [resultado, setResultado] = useState<ResultadoClases | null>(null)

  useEffect(() => {
    let vigente = true
    void getClases(sede.id).then((r) => {
      if (vigente) setResultado(r)
    })
    return () => { vigente = false }
  }, [sede.id])

  if (resultado === null) {
    return <BloqueCargando filas={5} altoFila={72} etiqueta="las próximas clases" />
  }

  const accion = accionDeSede(sede)
  const contacto = accion != null && !accion.reserva
    ? (
        <a className="btn btn--ghost btn--sm" href={accion.href} target="_blank" rel="noreferrer">
          {accion.texto}
        </a>
      )
    : null

  if (resultado.estado === 'error') {
    return (
      <EstadoSeccion
        tipo="error"
        titulo="No pudimos cargar los horarios"
        detalle="Puede ser un momento. Probá recargar la página en un minuto."
      >
        {contacto}
      </EstadoSeccion>
    )
  }

  // El endpoint 404ea cuando la sede no puede vender online. No es que no haya
  // clases: es que este estudio no publica su grilla.
  if (resultado.estado === 'sin-grilla') {
    return (
      <EstadoSeccion
        tipo="vacio"
        titulo={`${sede.nombre} no publica su grilla online`}
        detalle="Escribinos y te pasamos los horarios de esta semana."
      >
        {contacto}
      </EstadoSeccion>
    )
  }

  if (resultado.clases.length === 0) {
    return (
      <EstadoSeccion
        tipo="vacio"
        titulo="No quedan clases con lugar en los próximos días"
        detalle="Escribinos por WhatsApp y te ubicamos en la próxima."
      >
        {contacto}
      </EstadoSeccion>
    )
  }

  return <Dias clases={resultado.clases} dias={dias} reservable={accion?.reserva ?? false} slug={sede.slug} />
}

function Dias ({ clases, dias, reservable, slug }: {
  clases: Clase[]
  dias: number
  reservable: boolean
  slug: string
}) {
  const porDia = new Map<string, Clase[]>()
  for (const clase of clases) {
    const dia = diaCalendario(clase.inicio)
    const delDia = porDia.get(dia)
    if (delDia != null) delDia.push(clase)
    else porDia.set(dia, [clase])
  }

  return (
    <>
      {[...porDia.entries()].slice(0, dias).map(([dia, delDia]) => (
        <div key={dia}>
          <p className="day-label">{etiquetaDia(delDia[0].inicio)}</p>
          {delDia.map((clase) => (
            <FilaClase key={clase.id} clase={clase} reservable={reservable} slug={slug} />
          ))}
        </div>
      ))}
    </>
  )
}

function FilaClase ({ clase, reservable, slug }: { clase: Clase; reservable: boolean; slug: string }) {
  const pocos = clase.cuposDisponibles <= 3
  const fila = (
    <>
      <span className="row__time">{hora(clase.inicio)}</span>
      <span className="row__body">
        <span className="row__name">{clase.actividad.nombre}</span>
        <span className="row__meta">
          {[clase.instructor, clase.salon?.nombre].filter(Boolean).join(' · ')}
        </span>
      </span>
      <span className={`row__cupos${pocos ? ' row__cupos--low' : ''}`}>
        <b>{pocos ? `Quedan ${clase.cuposDisponibles}` : 'Hay lugar'}</b>
      </span>
      {reservable && <span className="row__arrow" aria-hidden="true">→</span>}
    </>
  )

  // Sin reserva online la fila es informativa: un link que no lleva a ningún
  // checkout sería una promesa que la sede no puede cumplir.
  return reservable
    ? <a className="row" href={`/reservar/sede/${slug}`}>{fila}</a>
    : <div className="row row--estatica">{fila}</div>
}
