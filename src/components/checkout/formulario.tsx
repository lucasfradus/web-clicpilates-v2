'use client'

import type { FormEvent } from 'react'

import type { DatosComprador, ErroresComprador } from '@/lib/checkout/reglas'

/**
 * Los datos de quien compra, y el botón que sale a Mercado Pago.
 *
 * Va con `noValidate`: la validación corre entera en `validar()`, que usa el
 * mismo criterio que el backend. Dejar también la del navegador mezcla dos
 * juegos de mensajes —uno traducido por Chrome, otro nuestro— y la persona no
 * entiende cuál le está hablando.
 *
 * Los errores aparecen recién al enviar, y se borran al tipear: marcar en rojo
 * un campo que todavía se está completando es regañar a alguien a mitad de una
 * frase.
 */

const CAMPOS = [
  { id: 'nombre', label: 'Nombre', tipo: 'text', autoComplete: 'given-name' },
  { id: 'apellido', label: 'Apellido', tipo: 'text', autoComplete: 'family-name' },
  { id: 'email', label: 'Email', tipo: 'email', autoComplete: 'email' },
  { id: 'telefono', label: 'Teléfono', tipo: 'tel', autoComplete: 'tel' },
] as const

export function Formulario ({ datos, errores, enviando, errorEnvio, alCambiar, alEnviar, alVolver }: {
  datos: DatosComprador
  errores: ErroresComprador
  enviando: boolean
  errorEnvio: string | null
  alCambiar: (campo: keyof DatosComprador, valor: string) => void
  alEnviar: () => void
  alVolver: () => void
}) {
  function enviar (e: FormEvent) {
    e.preventDefault()
    alEnviar()
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <button type="button" className="back full" onClick={alVolver}>← Volver</button>

      <h2 className="ckt__paso full">Tus datos</h2>

      {CAMPOS.map((campo) => (
        <div key={campo.id} className={`field${errores[campo.id] != null ? ' field--mal' : ''}`}>
          <label htmlFor={campo.id}>{campo.label}</label>
          <input
            id={campo.id}
            name={campo.id}
            type={campo.tipo}
            autoComplete={campo.autoComplete}
            value={datos[campo.id]}
            aria-invalid={errores[campo.id] != null}
            aria-describedby={errores[campo.id] != null ? `${campo.id}-error` : undefined}
            onChange={(e) => alCambiar(campo.id, e.target.value)}
          />
          {errores[campo.id] != null && (
            <p className="field__error" id={`${campo.id}-error`}>{errores[campo.id]}</p>
          )}
        </div>
      ))}

      <div className={`field${errores.dni != null ? ' field--mal' : ''}`}>
        <label htmlFor="dni">DNI</label>
        <input
          id="dni"
          name="dni"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={datos.dni}
          aria-invalid={errores.dni != null}
          aria-describedby={errores.dni != null ? 'dni-error' : undefined}
          onChange={(e) => alCambiar('dni', e.target.value)}
        />
        {/* El DNI no es un capricho: sin él la factura no se puede emitir y el
            comprobante queda esperando que alguien lo cargue a mano. */}
        {errores.dni != null
          ? <p className="field__error" id="dni-error">{errores.dni}</p>
          : <p className="field__ayuda">Lo necesitamos para emitir tu comprobante.</p>}
      </div>

      {errorEnvio != null && (
        <p className="form__error full" role="alert">{errorEnvio}</p>
      )}

      <div className="full ckt__foot">
        <button type="submit" className="btn btn--primary btn--full" disabled={enviando}>
          {enviando ? 'Redirigiendo a Mercado Pago…' : 'Ir a pagar'}
        </button>
        <p className="ckt__legal">
          Te llevamos a Mercado Pago para completar el pago. Al continuar aceptás nuestras{' '}
          <a href="/politicas">políticas</a>.
        </p>
      </div>
    </form>
  )
}
