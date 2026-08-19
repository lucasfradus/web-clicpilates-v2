import { NextResponse } from 'next/server'

/**
 * Recibe las consultas de Academy y Franquicias y las manda por mail.
 *
 * Usa Resend, igual que el sitio anterior, y con la misma casilla verificada.
 * Si falta la API key devuelve 503 —no 200— para que el formulario pueda decir
 * la verdad en vez de fingir que envió algo.
 *
 * Sin dependencias nuevas: es un POST a la API de Resend.
 */

const DESTINO = 'franquicias@clicpilates.com'
const REMITENTE = 'CLIC studio pilates <franquicias@clicpilates.com>'

interface Consulta {
  tipo?: string
  nombre?: string
  email?: string
  telefono?: string
  zona?: string
  mensaje?: string
  /** Honeypot: si viene con algo, es un bot. */
  sitioWeb?: string
}

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST (request: Request) {
  let datos: Consulta
  try {
    datos = await request.json() as Consulta
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  // Al bot se le contesta que sí y no se le manda nada: si devolviéramos un
  // error, aprendería a esquivar la trampa.
  if (typeof datos.sitioWeb === 'string' && datos.sitioWeb !== '') {
    return NextResponse.json({ ok: true })
  }

  const nombre = datos.nombre?.trim() ?? ''
  const email = datos.email?.trim() ?? ''
  const telefono = datos.telefono?.trim() ?? ''

  if (nombre === '' || email === '' || telefono === '' || !email.includes('@')) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey == null || apiKey === '') {
    console.warn('[contacto] sin RESEND_API_KEY: la consulta no se envió')
    return NextResponse.json({ error: 'Formulario no configurado' }, { status: 503 })
  }

  const esAcademy = datos.tipo === 'academy'
  const asunto = esAcademy ? 'Nueva consulta de Academy' : 'Nueva solicitud de franquicia'

  const filas = [
    ['Nombre', nombre],
    ['Email', email],
    ['Teléfono', telefono],
    [esAcademy ? 'Dónde vive' : 'Zona de interés', datos.zona?.trim() ?? '—'],
    ['Mensaje', datos.mensaje?.trim() ?? '—'],
  ]

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMITENTE,
        to: [DESTINO],
        reply_to: email,
        subject: asunto,
        html: `<h2>${asunto}</h2>` +
          filas.map(([k, v]) => `<p><strong>${k}:</strong> ${escapar(v)}</p>`).join(''),
      }),
    })

    if (!res.ok) {
      console.error('[contacto] Resend respondió', res.status, await res.text())
      return NextResponse.json({ error: 'No se pudo enviar' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[contacto] falló el envío:', error)
    return NextResponse.json({ error: 'No se pudo enviar' }, { status: 502 })
  }
}
