import type { Metadata } from 'next'

import Landing from '@/components/reservas/Landing'
import { getSedes } from '@/lib/reservas/api'

// Next exige que este valor sea un literal analizable estáticamente: no acepta
// una constante importada. Tiene que coincidir con REVALIDAR de src/lib/api.
export const revalidate = 3600

/**
 * Elegir la sede para reservar.
 *
 * Esta página y las de abajo son el portal de reservas
 * (`reservas.clicpilates.com`) portado adentro del sitio: mismas pantallas,
 * mismos textos, mismo flujo, pero con el header y el nav de la web. El portal
 * dibujaba los suyos, y a la persona le parecía haberse ido del sitio justo en
 * el momento de pagar.
 *
 * `.rsv` encapsula la base visual del portal (ver `styles/reservas/base.css`)
 * para que no se mezcle con la del resto del sitio.
 */
export const metadata: Metadata = {
  title: 'Reservá tu clase de prueba',
  description: 'Elegí la sede más cercana y reservá tu primera clase de pilates reformer.',
  alternates: { canonical: '/reservar' },
}

export default async function Reservar () {
  const sedes = await getSedes().catch(() => null)

  return (
    <div className="rsv">
      <div className="page">
        <Landing sedes={sedes} />
      </div>
    </div>
  )
}
