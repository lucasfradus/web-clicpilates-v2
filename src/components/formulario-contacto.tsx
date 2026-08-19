'use client'

import { useState } from 'react'

export type TipoConsulta = 'franquicia' | 'academy'

const ETIQUETAS: Record<TipoConsulta, { zona: string; mensaje: string; boton: string }> = {
  franquicia: {
    zona: 'Zona de interés',
    mensaje: 'Contanos brevemente tu perfil',
    boton: 'Enviar solicitud',
  },
  academy: {
    zona: 'Dónde vivís',
    mensaje: 'Contanos de vos y de tu experiencia',
    boton: 'Pedir información',
  },
}

type Estado = 'inicial' | 'enviando' | 'enviado' | 'error' | 'sin-configurar'

/**
 * Formulario de contacto de Academy y Franquicias.
 *
 * Dos cosas que no son adorno:
 *
 * - El honeypot (`sitioWeb`): un campo escondido que las personas no completan
 *   y los bots sí. Es la defensa más barata que existe contra el spam de
 *   formularios públicos.
 * - El estado `sin-configurar`: si el backend de mail no está configurado, en
 *   vez de tragarse la consulta muestra el mail para escribir directo. Un
 *   formulario que dice "gracias" y no manda nada es peor que no tenerlo.
 */
export function FormularioContacto ({ tipo, emailContacto }: {
  tipo: TipoConsulta
  emailContacto: string
}) {
  const [estado, setEstado] = useState<Estado>('inicial')
  const etiquetas = ETIQUETAS[tipo]

  async function enviar (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const datos = Object.fromEntries(new FormData(form))
    setEstado('enviando')

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, tipo }),
      })

      if (res.status === 503) { setEstado('sin-configurar'); return }
      if (!res.ok) { setEstado('error'); return }

      form.reset()
      setEstado('enviado')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="estado estado--vacio">
        <p className="estado__titulo">Recibimos tu consulta</p>
        <p className="estado__detalle">Te escribimos a la brevedad al mail que dejaste.</p>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={enviar}>
      <div className="field">
        <label htmlFor="nombre">Nombre y apellido</label>
        <input id="nombre" name="nombre" required autoComplete="name" placeholder="Tu nombre" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="vos@email.com" />
      </div>
      <div className="field">
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" name="telefono" required autoComplete="tel" placeholder="+54 9 11 ..." />
      </div>
      <div className="field">
        <label htmlFor="zona">{etiquetas.zona}</label>
        <input id="zona" name="zona" placeholder="Ciudad o barrio" />
      </div>
      <div className="field full">
        <label htmlFor="mensaje">{etiquetas.mensaje}</label>
        <textarea id="mensaje" name="mensaje" placeholder="Experiencia, motivación, plazos" />
      </div>

      {/* Honeypot: invisible para una persona, irresistible para un bot. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="sitioWeb">No completar</label>
        <input id="sitioWeb" name="sitioWeb" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="full">
        <button className="btn btn--primary" type="submit" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : etiquetas.boton}
        </button>
      </div>

      {estado === 'error' && (
        <p className="full estado__detalle" role="alert">
          No pudimos enviar tu consulta. Probá de nuevo, o escribinos a{' '}
          <a className="sub" href={`mailto:${emailContacto}`}>{emailContacto}</a>.
        </p>
      )}

      {estado === 'sin-configurar' && (
        <p className="full estado__detalle" role="alert">
          El formulario todavía no está conectado. Escribinos a{' '}
          <a className="sub" href={`mailto:${emailContacto}`}>{emailContacto}</a> y te
          respondemos igual.
        </p>
      )}
    </form>
  )
}
