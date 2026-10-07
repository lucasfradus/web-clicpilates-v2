import type { Metadata } from 'next'

import { JsonLd } from '@/components/json-ld'
import Landing from '@/components/reservas/Landing'
import { grafo, migasDePan, organizacion } from '@/lib/jsonld'
import { getSedes } from '@/lib/reservas/api'

// Next exige que este valor sea un literal analizable estáticamente: no acepta
// una constante importada. Tiene que coincidir con REVALIDAR de src/lib/api.
export const revalidate = 3600

const MIGAS = [{ nombre: 'Inicio', href: '/' }, { nombre: 'Estudios' }]

export const metadata: Metadata = {
  title: 'Estudios de pilates en Buenos Aires',
  description:
    'Todos los estudios CLIC: dirección, precios y horarios reales de cada uno. ' +
    'Elegí el más cercano y reservá tu clase de prueba.',
  alternates: { canonical: '/estudios' },
  openGraph: {
    title: 'Estudios CLIC · Pilates reformer en Buenos Aires',
    description: 'Dirección, precios y horarios reales de cada estudio.',
    url: '/estudios',
  },
}

/**
 * Elegir el estudio. Es la portada del portal de reservas
 * (`reservas.clicpilates.com`) portada adentro del sitio: desde el 7-oct hay
 * una sola página por estudio, la del portal, y vive en `/estudios`. Lo que el
 * portal no tenía —título, descripción y datos estructurados— va sin cambiar lo
 * que se ve.
 *
 * `.rsv` encapsula la base visual del portal (ver `styles/reservas/base.css`).
 */
export default async function Estudios () {
  const sedes = await getSedes().catch(() => null)

  return (
    <>
      <div className="rsv">
        <div className="page">
          <Landing sedes={sedes} />
        </div>
      </div>
      <JsonLd datos={grafo(organizacion(), migasDePan(MIGAS))} />
    </>
  )
}
