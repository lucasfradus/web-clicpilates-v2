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
 * Las dos formas de entrar al método. Son páginas de contenido: no dependen de
 * la API, y existen para captar las búsquedas de quien todavía no sabe por
 * dónde empezar ("pilates para principiantes", "pilates reformer avanzado").
 */

interface Nivel {
  slug: string
  nombre: string
  eyebrow: string
  titulo: string
  bajada: string
  descripcion: string[]
  paraQuien: string[]
  faqs: Faq[]
  foto: Foto | null
}

const NIVELES: Nivel[] = [
  {
    slug: 'initial-pilates',
    foto: FOTOS.initial,
    nombre: 'Initial Pilates',
    eyebrow: 'Para arrancar',
    titulo: 'Initial Pilates',
    bajada:
      'La base del método, a un ritmo que te deja entender cada movimiento. Es por donde ' +
      'empieza todo el mundo, hayas hecho o no actividad física antes.',
    descripcion: [
      'En Initial trabajamos el repertorio clásico de reformer desde el principio: la ' +
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
        pregunta: '¿Necesito estar en forma para empezar Initial Pilates?',
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
    slug: 'level-up-pilates',
    foto: FOTOS.levelUp,
    nombre: 'Level Up Pilates',
    eyebrow: 'Para seguir',
    titulo: 'Level Up Pilates',
    bajada:
      'Secuencias más largas, más carga y menos pausas. Es el mismo método, con el ' +
      'repertorio intermedio y avanzado y otro ritmo.',
    descripcion: [
      'En Level Up la clase fluye: las transiciones son parte del ejercicio y el trabajo ' +
      'de fuerza y control se sostiene más tiempo. Entra el repertorio que en Initial ' +
      'todavía no se toca, y con él la parte del método donde el cuerpo empieza a hacer ' +
      'cosas que antes no podía.',
      'Se entra cuando tu instructora ve que la base está sólida. No es una cuestión de ' +
      'antigüedad ni de esfuerzo: es que las secuencias avanzadas necesitan un control que ' +
      'se construye en Initial.',
    ],
    paraQuien: [
      'Ya tenés base de Initial',
      'Buscás más intensidad sin salir del método',
      'Querés el repertorio intermedio y avanzado',
    ],
    faqs: [
      {
        pregunta: '¿Puedo empezar directamente en Level Up?',
        respuesta:
          'Sólo si ya trabajaste Pilates Clásico en reformer. Si venís de otro estudio, ' +
          'contanos en la clase de prueba y la instructora te dice por dónde arrancar.',
      },
      {
        pregunta: '¿Puedo combinar Initial y Level Up en la misma semana?',
        respuesta:
          'Sí. Muchas alumnas alternan según el día y cómo llegan. Tu plan te sirve para ' +
          'cualquiera de los dos.',
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
    title: `${nivel.nombre}: pilates reformer ${nivel.slug === 'initial-pilates' ? 'para empezar' : 'intermedio y avanzado'}`,
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

  const otro = NIVELES.find((n) => n.slug !== nivel.slug)
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

          {otro != null && (
            <div style={{ marginTop: 48 }}>
              <p className="eyebrow">El otro nivel</p>
              <div className="nearby">
                <Link href={`/clases/${otro.slug}`}>
                  {otro.nombre} <span style={{ color: 'var(--ink-soft)' }}>{otro.eyebrow}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <JsonLd datos={grafo(organizacion(), paginaDeFaqs(nivel.faqs), migasDePan(migas))} />
    </>
  )
}
