'use client'

import { useEffect, useRef } from 'react'

import { primeraVezQueSeCuenta, ventaConcretada, type TipoVenta } from '@/lib/medicion/venta'

/**
 * El `purchase` de una compra aprobada.
 *
 * Se cuenta una sola vez por pago, y hay dos formas de contarlo de más: el
 * doble montaje del modo estricto de React y el F5 en esta página. Por eso van
 * las dos protecciones —un ref y el `sessionStorage`— y no una.
 *
 * El `eventID` viaja para que Meta pueda deduplicar contra la Conversions API
 * del backend: si el mismo pago llega por el pixel y por el servidor con el
 * mismo id, se cuenta una vez.
 */
export function MedirCompra ({ tipo, nombre, sede, sedeSlug, precio, transactionId, eventID, activo }: {
  tipo: TipoVenta
  nombre: string
  sede: string
  sedeSlug: string | null
  precio: number | null
  transactionId: string
  eventID?: string
  activo: boolean
}) {
  const contado = useRef(false)

  useEffect(() => {
    if (!activo || contado.current) return
    contado.current = true
    if (!primeraVezQueSeCuenta(transactionId)) return
    ventaConcretada({ tipo, nombre, sede, sedeSlug, precio, transactionId, eventID })
  }, [activo, tipo, nombre, sede, sedeSlug, precio, transactionId, eventID])

  return null
}
