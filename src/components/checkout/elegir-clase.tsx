'use client'

import { useMemo, useState } from 'react'

import { EstadoSeccion } from '@/components/estados'
import type { ResultadoClases } from '@/lib/api/clases'
import type { Clase, Sede } from '@/lib/api/tipos'
import { diaCalendario, etiquetaDia, hora, nombreConInicial } from '@/lib/formato'

/**
 * Elegir la clase de prueba.
 *
 * Un filtro por día y no una lista corrida: sin filtrar, una sede con dos
 * semanas de grilla arma una página de varios miles de píxeles y elegir se
 * vuelve scrollear.
 *
 * Arranca en el **primer día que tiene clases**, no en el de hoy: si hoy ya no
 * queda ninguna, abrir en un día vacío parece que la sede no tuviera nada.
 *
 * Lo que llega del backend es "lo que se puede reservar", no la grilla entera:
 * **las clases sin cupo no vienen**. Por eso acá no hay ningún "completo" — una
 * franja llena simplemente no está.
 */
export function ElegirClase ({ clases, sede, elegida, alElegir }: {
  clases: ResultadoClases
  sede: Sede
  elegida: Clase | null
  alElegir: (clase: Clase) => void
}) {
  const lista = useMemo(() => (clases.estado === 'ok' ? clases.clases : []), [clases])

  const porDia = useMemo(() => {
    const mapa = new Map<string, Clase[]>()
    for (const clase of [...lista].sort((a, b) => a.inicio.localeCompare(b.inicio))) {
      const dia = diaCalendario(clase.inicio)
      const actuales = mapa.get(dia)
      if (actuales != null) actuales.push(clase)
      else mapa.set(dia, [clase])
    }
    return mapa
  }, [lista])

  const dias = useMemo(() => [...porDia.keys()], [porDia])
  const [dia, setDia] = useState<string | null>(null)
  // El día elegido manda; si no hay, el primero con clases. Derivarlo en vez de
  // sincronizarlo con un efecto evita el parpadeo del primer render.
  const diaActivo = dia != null && porDia.has(dia) ? dia : dias[0] ?? null
  const delDia = diaActivo != null ? porDia.get(diaActivo) ?? [] : []

  if (clases.estado === 'error') {
    return (
      <EstadoSeccion
        tipo="error"
        titulo="No pudimos cargar los horarios"
        detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
      />
    )
  }

  if (clases.estado === 'sin-grilla' || lista.length === 0) {
    return (
      <EstadoSeccion
        tipo="vacio"
        titulo="No hay clases con lugar en los próximos días"
        detalle="Escribinos y te avisamos apenas se libere un lugar."
      >
        {sede.whatsappUrl != null && (
          <a className="btn btn--ghost btn--sm" href={sede.whatsappUrl} target="_blank" rel="noreferrer">
            Escribinos por WhatsApp
          </a>
        )}
      </EstadoSeccion>
    )
  }

  return (
    <div>
      <p className="ckt__nota">
        Lo que pagás por esta clase se descuenta del plan que elijas después.
      </p>

      <div className="ckt__dias" role="tablist" aria-label="Día">
        {dias.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === diaActivo}
            className={`ckt__dia${d === diaActivo ? ' ckt__dia--on' : ''}`}
            onClick={() => setDia(d)}
          >
            {etiquetaDia(porDia.get(d)![0].inicio)}
          </button>
        ))}
      </div>

      <div className="ckt__clases">
        {delDia.map((clase) => {
          const esta = elegida?.id === clase.id
          return (
            <button
              key={clase.id}
              type="button"
              className={`row row--btn${esta ? ' row--on' : ''}`}
              aria-pressed={esta}
              onClick={() => alElegir(clase)}
            >
              <span className="row__time">{hora(clase.inicio)}</span>
              <span className="row__body">
                <span className="row__name">{clase.actividad.nombre}</span>
                <span className="row__meta">
                  {[clase.instructor != null ? nombreConInicial(clase.instructor) : null, clase.salon?.nombre]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span className="row__cta">{esta ? 'Elegida' : 'Reservar'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
