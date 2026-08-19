import { pesos } from '@/lib/formato'
import { accionDeSede } from '@/lib/api/contacto'
import { precioPublicado, type CatalogoSede, type Sede } from '@/lib/api/tipos'
import { EstadoSeccion } from '@/components/estados'

/**
 * Los planes de esta sede.
 *
 * Dos reglas del negocio que la web tiene que reflejar y hoy no refleja:
 *
 * - **Los precios se discriminan por sede.** No hay lista unificada; cada
 *   landing muestra la suya.
 * - **La clase de prueba se descuenta del plan.** Por eso cada tarjeta muestra
 *   el primer mes ya descontado, como número concreto: es la diferencia entre
 *   "sale $102.000" y "tu primer mes sale $80.000".
 */
export function Planes ({ sede, catalogo }: { sede: Sede; catalogo: CatalogoSede | null }) {
  if (catalogo == null || catalogo.tipos.length === 0) {
    const accion = accionDeSede(sede)
    return (
      <EstadoSeccion
        tipo="vacio"
        titulo="Los planes de este estudio no están publicados"
        detalle="Escribinos y te pasamos los valores al día."
      >
        {accion != null && !accion.reserva && (
          <a className="btn btn--ghost btn--sm" href={accion.href} target="_blank" rel="noreferrer">
            {accion.texto}
          </a>
        )}
      </EstadoSeccion>
    )
  }

  return (
    <div className="plans">
      {catalogo.tipos.map((tipo) => {
        const precio = precioPublicado(tipo.precios)
        const primerPago = precio != null && sede.precioPrueba != null ? precio - sede.precioPrueba : null
        // El precio de un trimestral es el de los tres meses, no el mensual:
        // decir "por mes" ahí es publicar un precio que no existe.
        const mensual = tipo.frecuencia === 'MENSUAL'

        return (
          <article key={tipo.id} className={`plan${tipo.destacado ? ' plan--hot' : ''}`}>
            {tipo.destacado && <span className="plan__badge">{tipo.etiqueta}</span>}
            <p className={`eyebrow${tipo.destacado ? ' eyebrow--light' : ''}`}>
              {tipo.frecuencia === 'MENSUAL' ? 'Mensual' : 'Trimestral'}
            </p>
            <h3 className="plan__name">{tipo.nombre}</h3>
            <p className="plan__sub">{tipo.subtitulo}</p>
            <p className="plan__price">{pesos(precio)}</p>
            <p className="plan__per">
              {mensual ? 'por mes' : 'los 3 meses'} · transferencia o efectivo
            </p>

            {primerPago != null && (
              <p className="plan__first">
                <span>{mensual ? 'Tu primer mes' : 'Tu primer pago'}</span>
                <b>{pesos(primerPago)}</b>
                <small>ya descontada la clase de prueba</small>
              </p>
            )}

            {tipo.caracteristicas.length > 0 && (
              <ul>
                {tipo.caracteristicas.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
          </article>
        )
      })}
    </div>
  )
}
