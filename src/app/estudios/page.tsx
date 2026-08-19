import type { Metadata } from 'next'

import { EstadoSeccion } from '@/components/estados'
import { JsonLd } from '@/components/json-ld'
import { Migas } from '@/components/migas'
import { TarjetaSede } from '@/components/sede/tarjeta-sede'
import { getSedes } from '@/lib/api/sedes'
import { grafo, migasDePan, organizacion } from '@/lib/jsonld'

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

export default async function Estudios () {
  const sedes = await getSedes()

  return (
    <>
      <section className="subhero">
        <div className="container subhero__in">
          <Migas migas={MIGAS} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>
            {sedes != null && sedes.length > 0 ? `${sedes.length} estudios` : 'Estudios'}
          </p>
          <h1>Elegí tu estudio</h1>
          <p>
            Cada uno publica su propia lista de precios y sus horarios reales, que salen del
            mismo sistema con el que trabaja el equipo. Lo que ves acá es lo que hay.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {sedes === null && (
            <EstadoSeccion
              tipo="error"
              titulo="No pudimos cargar los estudios"
              detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
            />
          )}

          {sedes != null && sedes.length === 0 && (
            <EstadoSeccion tipo="vacio" titulo="Todavía no hay estudios publicados" />
          )}

          {sedes != null && sedes.length > 0 && (
            <div className="sedes">
              {sedes.map((sede, i) => (
                <TarjetaSede key={sede.id} sede={sede} prioridad={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), migasDePan(MIGAS))} />
    </>
  )
}
