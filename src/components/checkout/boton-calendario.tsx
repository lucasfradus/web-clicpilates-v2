'use client'

/**
 * "Agregar al calendario" para la clase reservada.
 *
 * Genera un `.ics` en el navegador en vez de pedirlo al servidor: el dato ya
 * está en la URL y un archivo de 300 bytes no justifica un viaje de ida y
 * vuelta. Los saltos de línea tienen que ser CRLF — es lo que pide el formato, y
 * sin eso Outlook ignora el archivo sin decir nada.
 */
export function BotonCalendario ({ actividad, inicio, sede, direccion, paymentId }: {
  actividad: string
  /** ISO 8601. */
  inicio: string
  sede: string
  direccion: string | null
  paymentId: string | null
}) {
  function descargar () {
    const desde = new Date(inicio)
    // 50 minutos: lo que dura una clase. Sin `DTEND` algunos calendarios la
    // guardan como evento de día completo.
    const hasta = new Date(desde.getTime() + 50 * 60 * 1000)
    const sello = (d: Date) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CLIC studio pilates//ES',
      'BEGIN:VEVENT',
      `UID:${paymentId ?? 'reserva'}@clicpilates.com`,
      `DTSTAMP:${sello(new Date())}`,
      `DTSTART:${sello(desde)}`,
      `DTEND:${sello(hasta)}`,
      `SUMMARY:${actividad} en CLIC ${sede}`,
      ...(direccion != null ? [`LOCATION:${direccion}`] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = 'clase-clic.ics'
    enlace.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button type="button" className="btn btn--ghost btn--sm" onClick={descargar}>
      Agregar al calendario
    </button>
  )
}
