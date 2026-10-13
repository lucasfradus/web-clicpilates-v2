import { ErrorApi, pedir } from './cliente'

/**
 * La grilla semanal de un estudio, la que se comparte suelta en `/grilla/<slug>`.
 * Es la misma que tenía el sitio anterior y sale del mismo endpoint de ClicNet.
 *
 * No confundir con `getClases`: aquello son las clases reservables de los
 * próximos días, filtradas por cupo. Esto es la semana tipo con el estado de
 * cada franja, llenas incluidas.
 */

export type Estado = 'd' | 'b' | 'n' | 'p'
export type Dia = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'

export interface Franja {
  /** El nombre de la actividad tal cual viene del backend. */
  activity?: string
  s: Estado
  /** @deprecated Reemplazado por `activity`; el backend todavía lo manda. */
  l?: string
}

/** Clave: el horario en formato "H.MM" (8.45 = 8:45). */
export type Grilla = Record<string, Partial<Record<Dia, Franja | null>>>

export interface RespuestaGrilla {
  center: { id: number; name: string; address: string; slug: string }
  schedule: Grilla
  updatedAt: string
}

export const DIAS: readonly Dia[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Actividades de uso interno que no se muestran al público. */
const OCULTAS = new Set(['Entrenamientos'])

/**
 * Sin cache: el estado de cada franja cambia con cada reserva.
 *
 * 404 y 409 son "este estudio no publica grilla" (no existe o todavía no se
 * migró), no un error: devuelven null. Cualquier otra falla también, pero queda
 * registrada.
 */
export async function getGrilla (slug: string): Promise<RespuestaGrilla | null> {
  try {
    const datos = await pedir<RespuestaGrilla>(
      `/api/v1/centers/${encodeURIComponent(slug)}/schedule`,
      { revalidar: false },
    )
    return { ...datos, schedule: limpiarGrilla(datos.schedule) }
  } catch (error) {
    if (!(error instanceof ErrorApi && (error.estado === 404 || error.estado === 409))) {
      console.error('[api] getGrilla falló:', error)
    }
    return null
  }
}

/** Saca las actividades ocultas y las filas que quedan vacías. */
export function limpiarGrilla (grilla: Grilla): Grilla {
  const resultado: Grilla = {}
  for (const [hora, dias] of Object.entries(grilla)) {
    const fila: Partial<Record<Dia, Franja | null>> = {}
    let tieneAlguna = false
    for (const [dia, franja] of Object.entries(dias) as Array<[Dia, Franja | null | undefined]>) {
      const oculta = franja?.activity != null && OCULTAS.has(franja.activity)
      fila[dia] = oculta ? null : franja ?? null
      if (franja != null && !oculta) tieneAlguna = true
    }
    if (tieneAlguna) resultado[hora] = fila
  }
  return resultado
}

/** "8.45" → 525 (minutos desde las 0:00). */
export function minutosDe (hora: string): number {
  const [h, m = '0'] = hora.split('.')
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

/** Ordena las claves "H.MM" por hora, no alfabéticamente. */
export function ordenarHoras (horas: string[]): string[] {
  return [...horas].sort((a, b) => minutosDe(a) - minutosDe(b))
}

/** Las clases duran una hora: "8.30" → "8.30 - 9.30 hs". */
export function rangoHorario (hora: string): string {
  const [h, m = '00'] = hora.split('.')
  return `${hora} - ${parseInt(h, 10) + 1}.${m} hs`
}

export interface FranjaUbicada {
  dia: Dia
  hora: string
  inicio: number
  fin: number
  franja: Franja
}

const DURACION_MIN = 60

/**
 * Las franjas con su posición en el día, y el rango que cubre la grilla
 * redondeado a horas enteras (para la vista de escritorio).
 */
export function ubicarFranjas (grilla: Grilla): { franjas: FranjaUbicada[]; desde: number; hasta: number } {
  const franjas: FranjaUbicada[] = []
  for (const hora of Object.keys(grilla)) {
    const inicio = minutosDe(hora)
    for (const dia of DIAS) {
      const franja = grilla[hora][dia]
      if (franja != null) franjas.push({ dia, hora, inicio, fin: inicio + DURACION_MIN, franja })
    }
  }
  if (franjas.length === 0) return { franjas, desde: 0, hasta: 0 }

  const desde = Math.floor(Math.min(...franjas.map((f) => f.inicio)) / 60) * 60
  const hasta = Math.ceil(Math.max(...franjas.map((f) => f.fin)) / 60) * 60
  return { franjas, desde, hasta }
}
