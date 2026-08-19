'use client'

import { useEffect } from 'react'

import { ga4Evento } from '@/lib/medicion/ga4'
import { metaEvento } from '@/lib/medicion/meta'

/**
 * ViewContent de la landing de un estudio: el primer escalón del embudo.
 *
 * Va contra el pixel de esa sede, no contra todos — una landing de Núñez la
 * paga la cuenta de Núñez (ver `lib/medicion/meta.ts`).
 */
export function ViewContentSede ({ slug, nombre, precioPrueba, activo }: {
  slug: string
  nombre: string
  precioPrueba: number | null
  activo: boolean
}) {
  useEffect(() => {
    if (!activo) return

    metaEvento('ViewContent', {
      content_name: nombre,
      content_category: 'sede',
      content_ids: [slug],
      content_type: 'product',
      ...(precioPrueba != null ? { value: precioPrueba, currency: 'ARS' } : {}),
    }, undefined, slug)

    ga4Evento('view_item', {
      sede: nombre,
      sede_slug: slug,
      items: [{ item_id: slug, item_name: `Clase de prueba ${nombre}`, item_category2: nombre }],
      ...(precioPrueba != null ? { value: precioPrueba, currency: 'ARS' } : {}),
    })
  }, [activo, slug, nombre, precioPrueba])

  return null
}
