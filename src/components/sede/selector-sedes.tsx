'use client'

import type { Sede } from '@/lib/api/tipos'
import { etiquetaDeSede } from '@/lib/zona'

/**
 * Elegir estudio.
 *
 * Reemplaza al `<select>` nativo, que además de verse genérico esconde las
 * opciones: con once estudios, la persona tiene que abrir una lista para
 * enterarse de que hay uno en su barrio. Acá se ven todos de una, con la zona
 * al lado — que es el dato con el que realmente se elige.
 *
 * Son radios de verdad, no botones con `aria-pressed`: las flechas del teclado
 * ya funcionan, el grupo se anuncia como grupo y no hay que implementar nada.
 */
export function SelectorSedes ({ sedes, valor, alElegir, etiqueta, variante = 'ancho' }: {
  sedes: Sede[]
  valor: string
  alElegir: (slug: string) => void
  etiqueta: string
  /** `compacto` scrollea en una fila (columna angosta); `ancho` deja que envuelva. */
  variante?: 'compacto' | 'ancho'
}) {
  return (
    <fieldset className={`sedepick sedepick--${variante}`}>
      <legend className="book__label">{etiqueta}</legend>
      <div className="sedepick__lista">
        {sedes.map((sede) => {
          const elegida = sede.slug === valor
          const { principal, secundaria } = etiquetaDeSede(sede)
          return (
            <label key={sede.id} className={`sedepick__op${elegida ? ' sedepick__op--on' : ''}`}>
              <input
                type="radio"
                name={`sede-${etiqueta.replace(/\s/g, '-')}`}
                value={sede.slug}
                checked={elegida}
                onChange={() => alElegir(sede.slug)}
              />
              <span className="sedepick__nombre">{principal}</span>
              {secundaria != null && <span className="sedepick__zona">{secundaria}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
