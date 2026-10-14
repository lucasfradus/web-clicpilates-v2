import type { Metadata } from 'next'
import { Suspense } from 'react'

import GraciasEntrada from '@/components/eventos/GraciasEntrada'

/**
 * La vuelta de Mercado Pago al comprar una entrada. El backend arma la URL
 * (`EVENTOS_PUBLIC_URL/eventos/<slug>/gracias?entrada=<token>`) y MP le suma
 * `collection_status`. El estado real lo consulta el componente.
 *
 * El Suspense es obligatorio: `useSearchParams` en una ruta estática.
 */
export const metadata: Metadata = {
  title: 'Tu entrada',
  robots: { index: false, follow: false },
}

export default async function GraciasEntradaPage ({ params }: PageProps<'/eventos/[slug]/gracias'>) {
  const { slug } = await params
  return (
    <div className="rsv">
      <div className="page">
        <Suspense>
          <GraciasEntrada slug={slug} />
        </Suspense>
      </div>
    </div>
  )
}
