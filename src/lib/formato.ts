/** Formato de números, precios y fechas. Todo en es-AR y en hora de Buenos Aires. */

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'

export function pesos (n: number | null | undefined): string {
  if (n == null) return '—'
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

const hhmm = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** La hora del estudio, no la del navegador de quien mira. */
export function hora (iso: string): string {
  return hhmm.format(new Date(iso))
}

const yyyymmdd = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Día de calendario en Buenos Aires, como `2026-08-19`.
 *
 * No se puede cortar el ISO: viene en UTC, así que una clase de las 21:00 de
 * Buenos Aires cae al día siguiente y quedaría agrupada mal.
 */
export function diaCalendario (iso: string): string {
  return yyyymmdd.format(new Date(iso))
}

const diaLargo = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
})

/** "Hoy", "Mañana", o "miércoles 20". */
export function etiquetaDia (iso: string, ahora = new Date()): string {
  const dia = diaCalendario(iso)
  if (dia === diaCalendario(ahora.toISOString())) return 'Hoy'

  const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
  if (dia === diaCalendario(manana.toISOString())) return 'Mañana'

  return diaLargo.format(new Date(iso))
}

const fechaCompleta = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/**
 * "jueves 13 de agosto · 19:00", para confirmar una reserva.
 *
 * Acá no va "Hoy" ni "Mañana": es el dato que la persona va a mirar para
 * acordarse cuándo tiene que ir, y mañana deja de ser mañana.
 */
export function fechaYHora (iso: string): string {
  return `${fechaCompleta.format(new Date(iso))} · ${hora(iso)}`
}

/** "Ana P." — la última palabra es el apellido, no la segunda. */
export function nombreConInicial (completo: string): string {
  const partes = completo.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 1) return completo.trim()
  const apellido = partes[partes.length - 1]
  return `${partes.slice(0, -1).join(' ')} ${apellido[0].toUpperCase()}.`
}
