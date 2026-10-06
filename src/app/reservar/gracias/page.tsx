import type { Metadata } from 'next'
import { Suspense } from 'react'

import Gracias from '@/components/reservas/Gracias'

/**
 * La vuelta de Mercado Pago. Es `Gracias.tsx` del portal, portado.
 *
 * Todo lo que muestra viene en la URL, puesto por el backend al armar la
 * preferencia (`RESERVAS_PUBLIC_URL` define la base) más lo que agrega Mercado
 * Pago al volver. **No confirma nada por sí sola**: quien da de alta al alumno es
 * el webhook del backend.
 *
 * El Suspense es obligatorio: `useSearchParams` en una ruta estática.
 */
export const metadata: Metadata = {
  title: 'Gracias',
  robots: { index: false, follow: false },
}

export default function GraciasPage () {
  return (
    <div className="rsv">
      <div className="page">
        <Suspense>
          <Gracias />
        </Suspense>
      </div>
    </div>
  )
}
