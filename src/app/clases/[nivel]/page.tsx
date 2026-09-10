import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FotoFondo } from '@/components/foto-fondo'
import { JsonLd } from '@/components/json-ld'
import { Migas } from '@/components/migas'
import { grafo, migasDePan, organizacion, paginaDeFaqs } from '@/lib/jsonld'
import type { Faq } from '@/lib/faqs'
import { FOTOS, type Foto } from '@/lib/fotos'

// Literal por exigencia de Next; coincide con REVALIDAR de src/lib/api.
export const revalidate = 3600

/**
 * Los niveles. Son páginas de contenido: no dependen de la API, y existen para
 * captar las búsquedas de quien todavía no sabe por dónde empezar ("pilates
 * para principiantes", "pilates reformer avanzado").
 *
 * Los nombres son los mismos que publica la grilla en vivo —Inicial, Level Up e
 * Intense— porque son lo que la alumna ve al reservar. Antes decían "Initial
 * Pilates" y "Level Up Pilates", que no existían en ningún otro lado.
 */

interface Nivel {
  slug: string
  nombre: string
  eyebrow: string
  titulo: string
  /** La cola del <title>. Es la consulta que buscaria alguien que no sabe el nombre del nivel. */
  tituloSeo: string
  bajada: string
  descripcion: string[]
  paraQuien: string[]
  faqs: Faq[]
  foto: Foto | null
}

const NIVELES: Nivel[] = [
  {
    slug: 'inicial',
    foto: FOTOS.initial,
    nombre: 'Inicial',
    eyebrow: 'Para arrancar',
    titulo: 'Inicial',
    tituloSeo: 'pilates reformer para empezar',
    bajada:
      'La base del método, a un ritmo que te deja entender cada movimiento. Es por donde ' +
      'empieza todo el mundo, hayas hecho o no actividad física antes.',
    descripcion: [
      'En Inicial trabajamos el repertorio de reformer desde el principio: la ' +
      'respiración que sostiene cada ejercicio, la alineación y el control. La instructora ' +
      'te corrige desde el primer movimiento, que es la diferencia entre aprender el método ' +
      'y hacer una clase de gimnasia sobre un reformer.',
      'No hace falta experiencia previa ni un estado físico particular. Sí hace falta ' +
      'empezar por acá: el repertorio tiene un orden, y saltearlo es la forma más rápida de ' +
      'lesionarse o de no entender nunca qué estás haciendo.',
    ],
    paraQuien: [
      'Nunca hiciste reformer',
      'Volvés después de una pausa larga',
      'Querés entender la técnica antes de subir la intensidad',
    ],
    faqs: [
      {
        pregunta: '¿Necesito estar en forma para empezar Inicial?',
        respuesta:
          'No. El método se adapta a tu cuerpo: la instructora ajusta los resortes y la ' +
          'versión del ejercicio según lo que necesitás ese día. Por eso trabajamos en ' +
          'grupos chicos.',
      },
      {
        pregunta: '¿Cuánto tardo en pasar a Level Up?',
        respuesta:
          'No hay un plazo fijo. Se pasa cuando tu instructora ve que la base está sólida ' +
          '—control, respiración y alineación—, no cuando pasan determinados meses.',
      },
    ],
  },
  {
    slug: 'level-up',
    foto: FOTOS.levelUp,
    nombre: 'Level Up',
    eyebrow: 'Para seguir',
    titulo: 'Level Up',
    tituloSeo: 'pilates reformer intermedio y avanzado',
    bajada:
      'Secuencias más largas, más carga y menos pausas. Es el mismo método, con el ' +
      'repertorio intermedio y avanzado y otro ritmo.',
    descripcion: [
      'En Level Up la clase fluye: las transiciones son parte del ejercicio y el trabajo ' +
      'de fuerza y control se sostiene más tiempo. Entra el repertorio que en Inicial ' +
      'todavía no se toca, y con él la parte del método donde el cuerpo empieza a hacer ' +
      'cosas que antes no podía.',
      'Se entra cuando tu instructora ve que la base está sólida. No es una cuestión de ' +
      'antigüedad ni de esfuerzo: es que las secuencias avanzadas necesitan un control que ' +
      'se construye en Inicial.',
    ],
    paraQuien: [
      'Ya tenés base de Inicial',
      'Buscás más intensidad sin salir del método',
      'Querés el repertorio intermedio y avanzado',
    ],
    faqs: [
      {
        pregunta: '¿Puedo empezar directamente en Level Up?',
        respuesta:
          'Sólo si ya trabajaste Pilates Reformer. Si venís de otro estudio, ' +
          'contanos en la clase de prueba y la instructora te dice por dónde arrancar.',
      },
      {
        pregunta: '¿Puedo combinar Inicial y Level Up en la misma semana?',
        respuesta:
          'Sí. Muchas alumnas alternan según el día y cómo llegan. Tu plan te sirve para ' +
          'cualquiera de los dos.',
      },
    ],
  },
  {
    slug: 'intense',
    // Todavía no hay foto de una clase de Intense en ninguna producción.
    foto: null,
    nombre: 'Intense',
    eyebrow: 'Para exigirte',
    titulo: 'Intense',
    tituloSeo: 'pilates reformer de alta intensidad',
    bajada:
      'Movimientos más fluidos y más ritmo. Menos pausas, más fuerza y resistencia: ' +
      'salís activada y con el cuerpo trabajado.',
    descripcion: [
      'Intense corre el foco del repertorio a la continuidad. Las secuencias se encadenan ' +
      'con menos pausas entre ejercicio y ejercicio, así que el trabajo de fuerza se ' +
      'sostiene y aparece la resistencia: no es sólo cuánto podés, es cuánto podés ' +
      'sostenerlo.',
      'Sigue siendo reformer y sigue habiendo técnica —la instructora corrige igual—, pero ' +
      'la sensación al terminar es otra: salís con el pulso alto y con la clase en el ' +
      'cuerpo.',
    ],
    paraQuien: [
      'Buscás más ritmo y menos pausas',
      'Querés trabajar fuerza y resistencia',
      'Te gusta salir con sensación de entrenamiento',
    ],
    faqs: [
      {
        pregunta: '¿En qué se diferencia de Level Up?',
        respuesta:
          'Level Up sube el repertorio: entran los ejercicios intermedios y avanzados. ' +
          'Intense sube el ritmo: los ejercicios se encadenan con menos pausas y el foco ' +
          'está en la fuerza sostenida y la resistencia.',
      },
      {
        pregunta: '¿Puedo hacer Intense sin experiencia?',
        respuesta:
          'Conviene tener base. El ritmo deja menos lugar para corregir cada movimiento, ' +
          'así que si nunca hiciste reformer vas a aprovecharla mucho más después de ' +
          'Inicial. Contanos en la clase de prueba y la instructora te dice por dónde ' +
          'arrancar.',
      },
    ],
  },
]

const buscar = (slug: string) => NIVELES.find((n) => n.slug === slug)

export function generateStaticParams () {
  return NIVELES.map((n) => ({ nivel: n.slug }))
}

export async function generateMetadata ({ params }: PageProps<'/clases/[nivel]'>): Promise<Metadata> {
  const { nivel: slug } = await params
  const nivel = buscar(slug)
  if (nivel == null) return {}

  return {
    title: `${nivel.nombre}: ${nivel.tituloSeo}`,
    description: nivel.bajada,
    alternates: { canonical: `/clases/${nivel.slug}` },
    openGraph: {
      title: `${nivel.nombre} · CLIC studio pilates`,
      description: nivel.bajada,
      url: `/clases/${nivel.slug}`,
    },
  }
}

export default async function Clase ({ params }: PageProps<'/clases/[nivel]'>) {
  const { nivel: slug } = await params
  const nivel = buscar(slug)
  if (nivel == null) notFound()

  const otros = NIVELES.filter((n) => n.slug !== nivel.slug)
  const migas = [
    { nombre: 'Inicio', href: '/' },
    { nombre: 'Clases' },
    { nombre: nivel.nombre },
  ]

  return (
    <>
      <section className="subhero">
        <div className="subhero__foto">
          <FotoFondo foto={nivel.foto} prioridad sizes="100vw" />
        </div>
        <div className="container subhero__in">
          <Migas migas={migas} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>{nivel.eyebrow}</p>
          <h1>{nivel.titulo}</h1>
          <p>{nivel.bajada}</p>
          <div style={{ marginTop: 28 }}>
            <Link className="btn btn--light" href="/estudios">Ver estudios y horarios</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 760 }}>
          {nivel.descripcion.map((parrafo) => (
            <p key={parrafo.slice(0, 24)} className="method__intro">{parrafo}</p>
          ))}

          <div className="method__list">
            {nivel.paraQuien.map((item, i) => (
              <div key={item} className="method__item">
                <p className="method__num">0{i + 1}</p>
                <div><h2 style={{ fontSize: 16, fontWeight: 500 }}>{item}</h2></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2>Sobre {nivel.nombre}.</h2>
          </div>
          <div className="faq">
            {nivel.faqs.map((faq) => (
              <details key={faq.pregunta} className="faq__item">
                <summary className="faq__q">
                  <span>{faq.pregunta}</span>
                  <span className="faq__sign" aria-hidden="true">+</span>
                </summary>
                <div className="faq__a"><p>{faq.respuesta}</p></div>
              </details>
            ))}
          </div>

          {otros.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <p className="eyebrow">{otros.length === 1 ? 'El otro nivel' : 'Los otros niveles'}</p>
              <div className="nearby">
                {otros.map((o) => (
                  <Link key={o.slug} href={`/clases/${o.slug}`}>
                    {o.nombre} <span style={{ color: 'var(--ink-soft)' }}>{o.eyebrow}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), paginaDeFaqs(nivel.faqs), migasDePan(migas))} />
    </>
  )
}
