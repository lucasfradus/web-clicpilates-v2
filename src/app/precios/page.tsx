import type { Metadata } from 'next'

import { EstadoSeccion } from '@/components/estados'
import { JsonLd } from '@/components/json-ld'
import { Migas } from '@/components/migas'
import { SelectorPrecios, type PreciosDeSede } from '@/components/precios/selector-precios'
import { getCatalogo, getSedes } from '@/lib/api/sedes'
import { grafo, migasDePan, organizacion } from '@/lib/jsonld'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

const MIGAS = [{ nombre: 'Inicio', href: '/' }, { nombre: 'Precios' }]

export const metadata: Metadata = {
  title: 'Precios de pilates reformer por estudio',
  description:
    'Los planes de cada estudio CLIC, con el valor de la clase de prueba y el primer ' +
    'pago ya descontado. Sin llamar ni escribir para preguntar.',
  alternates: { canonical: '/precios' },
  openGraph: {
    title: 'Precios · CLIC studio pilates',
    description: 'Cada estudio publica su lista. Mirá exactamente lo que vas a pagar.',
    url: '/precios',
  },
}

export default async function Precios () {
  const sedes = await getSedes()

  // Los catálogos se piden en paralelo y quedan cacheados con la página: el
  // selector después cambia entre ellos sin pedir nada.
  const precios: PreciosDeSede[] = sedes === null
    ? []
    : await Promise.all(
      sedes.map(async (sede) => ({ sede, catalogo: await getCatalogo(sede.slug) })),
    )

  return (
    <>
      <section className="subhero">
        <div className="container subhero__in">
          <Migas migas={MIGAS} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>Precios</p>
          <h1>Cada estudio tiene su lista</h1>
          <p>
            Los valores cambian según el estudio. Elegí el tuyo y mirá exactamente lo que
            vas a pagar — sin llamar ni escribir para preguntar.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {sedes === null
            ? (
                <EstadoSeccion
                  tipo="error"
                  titulo="No pudimos cargar los precios"
                  detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
                />
              )
            : <SelectorPrecios precios={precios} />}
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), migasDePan(MIGAS))} />
    </>
  )
}
