import type { Metadata } from 'next'

import { FormularioContacto } from '@/components/formulario-contacto'
import { FotoFondo } from '@/components/foto-fondo'
import { JsonLd } from '@/components/json-ld'
import { Migas } from '@/components/migas'
import { getSedes } from '@/lib/api/sedes'
import { FOTOS } from '@/lib/fotos'
import { grafo, migasDePan, organizacion } from '@/lib/jsonld'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

const MIGAS = [{ nombre: 'Inicio', href: '/' }, { nombre: 'Franquicias' }]
const EMAIL = 'franquicias@clicpilates.com'

export const metadata: Metadata = {
  title: 'Franquicias de pilates reformer',
  description:
    'Abrí tu estudio CLIC: modelo probado, sistema de gestión, formación del equipo y ' +
    'acompañamiento. Pedí el dossier.',
  alternates: { canonical: '/franquicias' },
  openGraph: {
    title: 'Franquicias · CLIC studio pilates',
    description: 'Abrí tu estudio CLIC con el modelo, el sistema y la formación resueltos.',
    url: '/franquicias',
  },
}

/**
 * Franquicias: es otra audiencia, otro tráfico y —en la fase 7— su propio
 * pixel, por eso vive en un embudo aparte (docs/contexto.md §6).
 *
 * Lo que la página afirma está acotado a lo que sabemos: cuántos estudios
 * operan (sale de la API) y qué herramientas comparte la red, que son las que
 * usamos todos los días. Las condiciones comerciales —inversión, plazos,
 * exclusividad, fee— las tiene que confirmar el dueño antes de publicarlas;
 * mientras tanto, quien pregunta las recibe por mail con el dossier.
 */
export default async function Franquicias () {
  const sedes = await getSedes()

  const incluye = [
    ['Sistema de gestión', 'El mismo software que usamos: reservas, cobros, membresías y reportes.'],
    ['Formación del equipo', 'Tus instructoras se certifican en CLIC Academy antes de abrir.'],
    ['Marca y método', 'El repertorio, los niveles y el criterio de clase de toda la red.'],
    ['Campañas por sede', 'Cada estudio corre las suyas, con su propio pixel y su medición.'],
  ]

  return (
    <>
      <section className="subhero">
        <div className="subhero__foto">
          <FotoFondo foto={FOTOS.franquicias} prioridad sizes="100vw" />
        </div>
        <div className="container subhero__in">
          <Migas migas={MIGAS} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>Franquicias</p>
          <h1>Abrí tu CLIC</h1>
          <p>
            Un modelo que ya funciona{sedes != null && sedes.length > 0 ? ` en ${sedes.length} estudios` : ''},
            con el sistema de gestión, la formación y el método resueltos.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="section-head">
            <p className="eyebrow">Qué incluye</p>
            <h2>No arrancás de cero.</h2>
          </div>

          <div className="method__list">
            {incluye.map(([titulo, detalle], i) => (
              <div key={titulo} className="method__item">
                <p className="method__num">0{i + 1}</p>
                <div>
                  <h3>{titulo}</h3>
                  <p>{detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)' }} id="contacto">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Solicitud</p>
            <h2>Contanos de vos.</h2>
            <p>
              Te contactamos con el dossier completo y los números del modelo: inversión,
              plazos y condiciones de la zona que te interesa.
            </p>
          </div>
          <FormularioContacto tipo="franquicia" emailContacto={EMAIL} />
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), migasDePan(MIGAS))} />
    </>
  )
}
