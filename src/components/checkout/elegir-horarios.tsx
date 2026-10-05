'use client'

import { useMemo, useState } from 'react'

import { BloqueCargando } from '@/components/estados'
import { EstadoSeccion } from '@/components/estados'
import type { ResultadoHorarios } from '@/lib/api/horarios'
import type { CatalogoTipoPlan, DiaSemana, HorarioFijable } from '@/lib/api/tipos'
import { esSoloPack } from '@/lib/checkout/reglas'

/**
 * Elegir cómo se usan las clases del plan, y con cuáles horarios.
 *
 * Dos modalidades:
 *
 * - **Horarios fijos**: la persona reserva siempre los mismos días y horas.
 *   Tiene que elegir exactamente `ingresosPorSemana`, que es lo que el backend
 *   revalida.
 * - **Pack flexible**: reserva semana a semana desde la app. No elige nada acá.
 *
 * El caso que hay que no romper: **las sedes que sólo venden packs**. El
 * catálogo llama `fijo` al plan vinculado sin mirar su modalidad, así que ahí
 * hay un PACK y `ingresosPorSemana` en `null` es la única señal. En esas sedes
 * la pregunta no se hace —no hay nada que elegir— y en su lugar se explica cómo
 * funciona el pack, que es lo que la persona necesita entender antes de pagar.
 */

const DIAS: { id: DiaSemana; corto: string }[] = [
  { id: 'LUNES', corto: 'Lun' },
  { id: 'MARTES', corto: 'Mar' },
  { id: 'MIERCOLES', corto: 'Mié' },
  { id: 'JUEVES', corto: 'Jue' },
  { id: 'VIERNES', corto: 'Vie' },
  { id: 'SABADO', corto: 'Sáb' },
  { id: 'DOMINGO', corto: 'Dom' },
]

export function ElegirHorarios ({
  tipo, modalidad, alElegirModalidad, horarios, elegidos, alCambiar,
  necesarios, completo, alContinuar, whatsappUrl,
}: {
  tipo: CatalogoTipoPlan
  modalidad: 'fijo' | 'flex' | null
  alElegirModalidad: (m: 'fijo' | 'flex') => void
  horarios: ResultadoHorarios | 'cargando'
  elegidos: number[]
  alCambiar: (ids: number[]) => void
  necesarios: number
  completo: boolean
  alContinuar: () => void
  whatsappUrl: string | null
}) {
  const soloPack = esSoloPack(tipo)

  if (modalidad == null) {
    return (
      <div>
        <h2 className="ckt__paso">¿Cómo querés usar tus clases?</h2>
        <div className="ckt__ops">
          <button type="button" className="ckt__op" onClick={() => alElegirModalidad('fijo')}>
            <b>Horarios fijos</b>
            <span>
              Tu lugar reservado, mismo grupo y mismo profe cada semana. Si algún día no
              podés, reprogramás esa clase desde la app.
            </span>
          </button>

          {/* La opción de pack sólo existe si el catálogo publica la variante. */}
          {tipo.flexible != null && (
            <button type="button" className="ckt__op" onClick={() => alElegirModalidad('flex')}>
              <b>Pack flexible</b>
              <span>
                Reservás tus clases cada semana desde la app, según tu agenda. Sujeto a
                disponibilidad.
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (modalidad === 'flex') {
    return (
      <div>
        <h2 className="ckt__paso">{soloPack ? 'Cómo funciona tu pack' : 'Tu pack flexible'}</h2>
        <p className="ckt__nota">
          Comprás {tipo.flexible?.accesos ?? tipo.fijo.accesos} clases y reservás cada una
          desde la app, según tu agenda y la disponibilidad del estudio. No quedan horarios
          atados a tu nombre.
        </p>
        <div className="ckt__foot">
          <button type="button" className="btn btn--primary" onClick={alContinuar}>
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <Fijos
      horarios={horarios}
      elegidos={elegidos}
      alCambiar={alCambiar}
      necesarios={necesarios}
      completo={completo}
      alContinuar={alContinuar}
      whatsappUrl={whatsappUrl}
    />
  )
}

function Fijos ({ horarios, elegidos, alCambiar, necesarios, completo, alContinuar, whatsappUrl }: {
  horarios: ResultadoHorarios | 'cargando'
  elegidos: number[]
  alCambiar: (ids: number[]) => void
  necesarios: number
  completo: boolean
  alContinuar: () => void
  whatsappUrl: string | null
}) {
  const lista = useMemo(
    () => (horarios !== 'cargando' && horarios.estado === 'ok' ? horarios.datos.horarios : []),
    [horarios],
  )

  const porDia = useMemo(() => {
    const mapa = new Map<DiaSemana, HorarioFijable[]>()
    for (const h of lista) {
      const actuales = mapa.get(h.diaSemana)
      if (actuales != null) actuales.push(h)
      else mapa.set(h.diaSemana, [h])
    }
    for (const arr of mapa.values()) arr.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    return mapa
  }, [lista])

  const dias = DIAS.filter((d) => porDia.has(d.id))
  const [dia, setDia] = useState<DiaSemana | null>(null)
  const diaActivo = dia != null && porDia.has(dia) ? dia : dias[0]?.id ?? null
  const delDia = diaActivo != null ? porDia.get(diaActivo) ?? [] : []

  if (horarios === 'cargando') {
    return <BloqueCargando filas={5} altoFila={56} etiqueta="Cargando los horarios" />
  }

  if (horarios.estado === 'error') {
    return (
      <EstadoSeccion
        tipo="error"
        titulo="No pudimos cargar los horarios"
        detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
      />
    )
  }

  if (lista.length === 0) {
    return (
      <EstadoSeccion
        tipo="vacio"
        titulo="No hay horarios disponibles para este plan"
        detalle="Escribinos y vemos cómo acomodarte."
      >
        {whatsappUrl != null && (
          <a className="btn btn--ghost btn--sm" href={whatsappUrl} target="_blank" rel="noreferrer">
            Escribinos por WhatsApp
          </a>
        )}
      </EstadoSeccion>
    )
  }

  /**
   * Al llegar al tope, elegir otro **reemplaza el último** en vez de ignorar el
   * click. Ignorarlo deja a la persona tocando un horario que no reacciona, sin
   * nada que le diga por qué.
   */
  function alternar (id: number) {
    if (elegidos.includes(id)) {
      alCambiar(elegidos.filter((x) => x !== id))
      return
    }
    if (elegidos.length >= necesarios) {
      alCambiar([...elegidos.slice(0, necesarios - 1), id])
      return
    }
    alCambiar([...elegidos, id])
  }

  return (
    <div>
      <h2 className="ckt__paso">
        {necesarios === 1 ? 'Elegí tu horario fijo' : `Elegí tus ${necesarios} horarios fijos`}
      </h2>

      <div className="ckt__dias" role="tablist" aria-label="Día">
        {dias.map((d) => {
          const tieneElegido = (porDia.get(d.id) ?? []).some((h) => elegidos.includes(h.id))
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={d.id === diaActivo}
              className={`ckt__dia${d.id === diaActivo ? ' ckt__dia--on' : ''}`}
              onClick={() => setDia(d.id)}
            >
              {d.corto}
              {tieneElegido && <span className="ckt__punto" aria-label="con horario elegido" />}
            </button>
          )
        })}
      </div>

      <div className="ckt__slots">
        {delDia.map((h) => {
          const lleno = h.cuposAprox != null && h.cuposAprox <= 0
          const esta = elegidos.includes(h.id)
          return (
            <button
              key={h.id}
              type="button"
              disabled={lleno}
              aria-pressed={esta}
              className={`ckt__slot${esta ? ' ckt__slot--on' : ''}`}
              onClick={() => alternar(h.id)}
            >
              <b>{h.horaInicio}</b>
              {/* "Completo" sin número: el cupo de un horario recurrente es el
                  de su próxima clase, no el que va a haber cada semana. */}
              {lleno && <small>Completo</small>}
            </button>
          )
        })}
      </div>

      <div className="ckt__foot">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!completo}
          onClick={alContinuar}
        >
          {completo
            ? 'Continuar'
            : `Elegí ${necesarios - elegidos.length} horario${necesarios - elegidos.length === 1 ? '' : 's'} más`}
        </button>
      </div>
    </div>
  )
}
