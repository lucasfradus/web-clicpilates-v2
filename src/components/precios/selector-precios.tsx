'use client'

import { useState } from 'react'

import { Planes } from '@/components/sede/planes'
import type { CatalogoSede, Sede } from '@/lib/api/tipos'

export interface PreciosDeSede {
  sede: Sede
  catalogo: CatalogoSede | null
}

/**
 * Precios por estudio.
 *
 * No hay una lista unificada: cada sede publica la suya, y esa es justamente la
 * regla de negocio que la web tiene que reflejar. El selector cambia entre
 * catálogos ya cargados —vienen todos con la página, cacheados una hora— así
 * que pasar de un estudio a otro es instantáneo y no dispara ni un pedido.
 */
export function SelectorPrecios ({ precios }: { precios: PreciosDeSede[] }) {
  const [slug, setSlug] = useState(precios[0]?.sede.slug ?? '')
  const actual = precios.find((p) => p.sede.slug === slug) ?? precios[0]

  if (actual == null) return null

  return (
    <>
      <div className="price-picker">
        <label className="book__label" htmlFor="selector-precios">Estudio</label>
        <select
          id="selector-precios"
          className="book__select"
          style={{ maxWidth: 340, marginTop: 0 }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        >
          {precios.map(({ sede }) => (
            <option key={sede.id} value={sede.slug}>{sede.nombre} · {sede.ciudad}</option>
          ))}
        </select>
      </div>

      <Planes sede={actual.sede} catalogo={actual.catalogo} />

      <p className="muted" style={{ marginTop: 26, fontSize: 12 }}>
        Los valores son los de {actual.sede.nombre}. La clase de prueba de este estudio se
        descuenta del primer pago del plan que elijas.
      </p>
    </>
  )
}
