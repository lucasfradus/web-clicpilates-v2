import type { Metadata } from 'next'

import { FormularioContacto } from '@/components/formulario-contacto'
import { JsonLd } from '@/components/json-ld'
import { Migas } from '@/components/migas'
import { getSedes } from '@/lib/api/sedes'
import { grafo, migasDePan, organizacion } from '@/lib/jsonld'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

const MIGAS = [{ nombre: 'Inicio', href: '/' }, { nombre: 'Academy' }]

export const metadata: Metadata = {
  title: 'CLIC Academy: formación en Pilates Clásico',
  description:
    'Formación de instructoras de Pilates Clásico con práctica supervisada en estudios ' +
    'que funcionan todos los días.',
  alternates: { canonical: '/academy' },
  openGraph: {
    title: 'CLIC Academy · Formación en Pilates Clásico',
    description: 'Certificación con práctica real en los estudios de la red.',
    url: '/academy',
  },
}

/**
 * Academy.
 *
 * Página deliberadamente breve: lo único que se afirma acá es lo que sabemos
 * —que las instructoras de la red se forman en la academy y que la práctica es
 * en estudios reales—. La duración, la modalidad, el precio y el programa
 * detallado los tiene que confirmar el dueño antes de publicarlos
 * (`tasks/todo.md`). Mientras tanto la página capta la búsqueda y pide el
 * contacto, que es lo que tiene que hacer.
 */
export default async function Academy () {
  const sedes = await getSedes()

  return (
    <>
      <section className="subhero">
        <div className="container subhero__in">
          <Migas migas={MIGAS} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>CLIC Academy</p>
          <h1>Formación en Pilates Clásico</h1>
          <p>
            Certificación con práctica supervisada en estudios que funcionan todos los días,
            y salida laboral concreta en la red CLIC.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="info-grid">
          <div className="info">
            <p className="eyebrow">Práctica</p>
            <b>En estudios reales</b>
            <span>Con equipamiento y alumnas de verdad, no en un aula.</span>
          </div>
          <div className="info">
            <p className="eyebrow">Método</p>
            <b>Pilates Clásico</b>
            <span>El repertorio original de reformer, en su orden.</span>
          </div>
          <div className="info">
            <p className="eyebrow">Salida laboral</p>
            <b>La red CLIC</b>
            <span>
              {sedes != null && sedes.length > 0
                ? `Las instructoras de los ${sedes.length} estudios se forman acá.`
                : 'Las instructoras de la red se forman acá.'}
            </span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="section-head">
            <p className="eyebrow">Qué es</p>
            <h2>Las instructoras de CLIC se forman en CLIC.</h2>
          </div>
          <p className="method__intro">
            No contratamos instructoras y esperamos que compartan un criterio: lo formamos.
            Por eso una clase en un estudio de la red se parece a la de cualquier otro — el
            repertorio, las correcciones y la progresión son los mismos.
          </p>
          <p className="method__intro">
            La formación combina el trabajo teórico con horas de práctica supervisada en
            estudios que están funcionando, acompañada por una instructora con experiencia.
          </p>

          <div style={{ marginTop: 40 }}>
            <a className="btn btn--primary" href="#contacto">Pedir información</a>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)' }} id="contacto">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Información</p>
            <h2>Contanos de vos.</h2>
            <p>
              Te mandamos el programa, las fechas de la próxima camada y los valores al día.
            </p>
          </div>
          <FormularioContacto tipo="academy" emailContacto="info@clicpilates.com" />
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), migasDePan(MIGAS))} />
    </>
  )
}
