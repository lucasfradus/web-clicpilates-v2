import Link from 'next/link'

import { EstadoSeccion } from '@/components/estados'
import { JsonLd } from '@/components/json-ld'
import { Reveal } from '@/components/home/reveal'
import { SelectorSede } from '@/components/home/selector-sede'
import {
  AcademyYFranquicias,
  AppMovil,
  Banda,
  Manifiesto,
  Metodo,
  Niveles,
} from '@/components/home/secciones'
import { BloquePrueba } from '@/components/sede/bloque-prueba'
import { TarjetaSede } from '@/components/sede/tarjeta-sede'
import { getSedes } from '@/lib/api/sedes'
import { grafo, organizacion } from '@/lib/jsonld'
import { SITIO } from '@/lib/site'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

export default async function Home () {
  const sedes = await getSedes()

  return (
    <>
      <section className="hero" data-hero>
        <div className="hero__media" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__grid">
            <div>
              <p className="eyebrow eyebrow--light">Pilates clásico · Buenos Aires</p>
              <h1>Pilates clásico,<br /><em>tu horario.</em></h1>
              <p className="hero__sub">
                Reformer en grupos chicos, con instructoras formadas en nuestra propia
                academy. Elegís el estudio, ves los lugares que quedan y reservás en un
                minuto.
              </p>

              {/* El único número que publicamos es el que sale de la API. Un
                  "clase de prueba desde $X" agregado entre todas las sedes no va:
                  cualquier sede con precio atípico —hoy la de prueba, a $200— se
                  convierte en el titular. El precio se muestra por estudio, que es
                  donde además es verdad. */}
              {sedes != null && sedes.length > 0 && (
                <div className="hero__stats">
                  <div className="hero__stat">
                    <b>{sedes.length}</b>
                    <span>Estudios</span>
                  </div>
                </div>
              )}
            </div>

            {sedes != null && sedes.length > 0 && <SelectorSede sedes={sedes} />}
          </div>
        </div>
      </section>

      <Manifiesto />
      <Metodo />
      <Banda />
      <Niveles />

      <section className="section" id="prueba">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <p className="eyebrow">Cómo empezás</p>
              <h2>La clase de prueba se descuenta del plan.</h2>
              <p>
                Se abona al reservar, porque así el lugar queda tomado. Si después seguís,
                ese valor no lo pagás de nuevo.
              </p>
            </div>
          </Reveal>
          <Reveal>
            {/* Sin sede elegida el bloque habla en general; en cada landing muestra
                el precio de ese estudio. */}
            <BloquePrueba precioPrueba={null} />
          </Reveal>
        </div>
      </section>

      <section className="section" id="estudios" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <p className="eyebrow">Estudios</p>
              <h2>Uno cerca tuyo.</h2>
              <p>
                Cada estudio tiene su propia grilla, su equipo y su clase de prueba. Entrá
                al que te queda cómodo y reservá directo.
              </p>
            </div>
          </Reveal>

          {sedes === null
            ? (
                <EstadoSeccion
                  tipo="error"
                  titulo="No pudimos cargar los estudios"
                  detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
                />
              )
            : (
                <Reveal className="sedes">
                  {sedes.map((sede, i) => (
                    <TarjetaSede key={sede.id} sede={sede} prioridad={i < 3} />
                  ))}
                </Reveal>
              )}

          <div style={{ marginTop: 34 }}>
            <Link className="btn btn--ghost btn--sm" href="/estudios">Ver todos los estudios</Link>
          </div>
        </div>
      </section>

      <AppMovil />
      <AcademyYFranquicias />

      <JsonLd datos={grafo(organizacion(), {
        '@type': 'WebSite',
        '@id': `${SITIO.url}/#website`,
        url: `${SITIO.url}/`,
        name: SITIO.nombre,
        inLanguage: 'es-AR',
        publisher: { '@id': `${SITIO.url}/#organization` },
      })} />
    </>
  )
}
