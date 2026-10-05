import type { CatalogoTipoPlan, Clase, Sede } from '@/lib/api/tipos'
import { fechaYHora, pesos } from '@/lib/formato'

/**
 * Qué se está por comprar y cuánto sale.
 *
 * Acompaña los dos pasos en desktop; en mobile aparece recién en el segundo,
 * cuando ya hay algo concreto que resumir y el total es el dato que falta antes
 * de pagar.
 *
 * El total sale de lo que corresponde a **esta** rama: el precio de la clase de
 * prueba de la sede, o el del plan y la modalidad elegidos. Son dos números
 * distintos y mezclarlos es la clase de error que nadie reporta — la persona
 * paga otra cosa de la que leyó.
 */
export function Resumen ({ sede, modo, tipo, modalidad, clase, precio, paso }: {
  sede: Sede
  modo: 'plan' | 'prueba'
  tipo: CatalogoTipoPlan | null
  modalidad: 'fijo' | 'flex' | null
  clase: Clase | null
  precio: number | null
  paso: 1 | 2
}) {
  const esPrueba = modo === 'prueba'

  const filas: { label: string; valor: string }[] = []
  if (esPrueba && clase != null) {
    filas.push({ label: 'Clase', valor: clase.actividad.nombre })
    filas.push({ label: 'Cuándo', valor: fechaYHora(clase.inicio) })
  }
  if (!esPrueba && tipo != null && modalidad != null) {
    // Sin modalidad elegida no se afirma ninguna: decir 'Horarios fijos'
    // mientras la persona todavía está decidiendo es contarle que eligió algo
    // que no eligió.
    filas.push({ label: 'Modalidad', valor: modalidad === 'flex' ? 'Pack flexible' : 'Horarios fijos' })
    filas.push({
      label: 'Frecuencia',
      valor: tipo.frecuencia === 'MENSUAL' ? 'Mensual' : 'Trimestral',
    })
  }

  const pendiente = esPrueba
    ? 'Elegí una clase para ver el detalle'
    : 'Elegí cómo querés usar tus clases'

  return (
    <aside className={`ckt__resumen${paso === 2 ? ' ckt__resumen--visible' : ''}`}>
      <p className="eyebrow eyebrow--light">{esPrueba ? 'Tu clase de prueba' : 'Tu plan'}</p>
      <p className="ckt__resumen-titulo">
        {esPrueba ? 'Clase de prueba' : tipo?.etiqueta || tipo?.nombre || '—'}
      </p>
      <p className="ckt__resumen-sede">CLIC {sede.nombre}</p>

      {filas.length > 0
        ? (
            <dl className="ckt__filas">
              {filas.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.valor}</dd>
                </div>
              ))}
            </dl>
          )
        : <p className="ckt__pendiente">{pendiente}</p>}

      <div className="ckt__total">
        <span>Total</span>
        <b>{pesos(precio)}</b>
      </div>

      {esPrueba && (
        <p className="ckt__resumen-nota">
          Se descuenta del primer pago del plan que elijas.
        </p>
      )}

      <p className="ckt__mp">Pago seguro vía Mercado Pago</p>
    </aside>
  )
}
