'use client'

import { useState } from 'react'

import {
  DIAS,
  ordenarHoras,
  rangoHorario,
  ubicarFranjas,
  type Dia,
  type Estado,
  type Franja,
  type FranjaUbicada,
  type Grilla,
} from '@/lib/api/grilla'

/**
 * La grilla semanal, portada del sitio anterior. En el celular va un día por
 * vez con pestañas; en escritorio, la semana entera como calendario.
 */

type EstadoVisible = Exclude<Estado, 'p'>

const ESTADOS: Record<EstadoVisible, string> = {
  d: 'Disponible',
  b: 'Baja disponibilidad',
  n: 'No disponible',
}

const CORTO: Record<Dia, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
}

/** Las actividades con color propio; el resto va con el neutro. */
const ACTIVIDADES: Record<string, string> = {
  Inicial: 'inicial',
  'Level Up': 'levelup',
  Embarazadas: 'embarazadas',
}

export function GrillaHoraria ({ grilla }: { grilla: Grilla }) {
  const [dia, setDia] = useState<Dia>('Lunes')

  return (
    <>
      <Leyenda />

      <div className="grilla__movil">
        <div className="grilla__tabs" role="tablist" aria-label="Día">
          {DIAS.map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={d === dia}
              className="grilla__tab"
              onClick={() => setDia(d)}
            >
              {CORTO[d]}
            </button>
          ))}
        </div>
        <Lista grilla={grilla} dia={dia} />
      </div>

      <div className="grilla__escritorio">
        <Calendario grilla={grilla} />
      </div>
    </>
  )
}

function Leyenda () {
  return (
    <ul className="grilla__leyenda">
      {(Object.keys(ESTADOS) as EstadoVisible[]).map((e) => (
        <li key={e} className={`grilla__estado grilla__estado--${e}`}>
          <span className="grilla__punto" />
          {ESTADOS[e]}
        </li>
      ))}
    </ul>
  )
}

function Lista ({ grilla, dia }: { grilla: Grilla; dia: Dia }) {
  const horas = ordenarHoras(Object.keys(grilla).filter((h) => grilla[h][dia] != null))

  return (
    <>
      <h2 className="grilla__dia">{dia}</h2>
      {horas.length === 0 ? (
        <p className="grilla__vacio">Sin clases este día.</p>
      ) : (
        <ul className="grilla__lista">
          {horas.map((hora) => (
            <li key={hora} className="grilla__tarjeta">
              <span className="grilla__hora">{rangoHorario(hora)}</span>
              <Contenido franja={grilla[hora][dia]} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const FILA_PX = 24 // 15 minutos
const HORA_PX = FILA_PX * 4

function Calendario ({ grilla }: { grilla: Grilla }) {
  const { franjas, desde, hasta } = ubicarFranjas(grilla)
  if (franjas.length === 0) return <p className="grilla__vacio">Sin clases.</p>

  const filas = (hasta - desde) / 15
  const columnas = `72px repeat(${DIAS.length}, minmax(140px, 1fr))`
  const horas: number[] = []
  for (let m = desde; m < hasta; m += 60) horas.push(m)

  return (
    <div className="grilla__scroll">
      <div className="grilla__calendario">
        <div className="grilla__cabecera" style={{ gridTemplateColumns: columnas }}>
          <div />
          {DIAS.map((d) => <div key={d}>{d}</div>)}
        </div>

        <div
          className="grilla__cuerpo"
          style={{
            gridTemplateColumns: columnas,
            gridTemplateRows: `repeat(${filas}, ${FILA_PX}px)`,
            ['--hora-px' as string]: `${HORA_PX}px`,
          }}
        >
          {DIAS.map((d, i) => (
            <div key={d} className="grilla__columna" style={{ gridColumn: i + 2 }} />
          ))}

          {horas.map((m) => (
            <div
              key={m}
              className="grilla__eje"
              style={{ gridRow: `${(m - desde) / 15 + 1} / span 4` }}
            >
              {String(Math.floor(m / 60)).padStart(2, '0')}:00
            </div>
          ))}

          {franjas.map((f) => <Bloque key={`${f.dia}-${f.hora}`} f={f} desde={desde} />)}
        </div>
      </div>
    </div>
  )
}

function Bloque ({ f, desde }: { f: FranjaUbicada; desde: number }) {
  return (
    <div
      className="grilla__bloque"
      style={{
        gridColumn: DIAS.indexOf(f.dia) + 2,
        gridRow: `${(f.inicio - desde) / 15 + 1} / span ${(f.fin - f.inicio) / 15}`,
      }}
    >
      <div className="grilla__bloque-in">
        <span className="grilla__hora grilla__hora--chica">{rangoHorario(f.hora)}</span>
        <Contenido franja={f.franja} />
      </div>
    </div>
  )
}

function Contenido ({ franja }: { franja: Franja | null | undefined }) {
  // 'p' (próximamente) ya no se muestra: va como franja vacía.
  if (franja == null || franja.s === 'p') return <span className="grilla__sin">—</span>

  const actividad = franja.activity ?? franja.l ?? '—'
  const variante = ACTIVIDADES[actividad] ?? 'otra'

  return (
    <span className="grilla__contenido">
      <span className={`grilla__actividad grilla__actividad--${variante}`}>{actividad}</span>
      <span className={`grilla__estado grilla__estado--${franja.s}`}>
        <span className="grilla__punto" />
        {ESTADOS[franja.s]}
      </span>
    </span>
  )
}
