import type { Faq } from '@/lib/faqs'
import { precioPublicado, type CatalogoSede, type Sede } from '@/lib/api/tipos'
import { SITIO } from '@/lib/site'
import { zonaDe } from '@/lib/zona'

/**
 * Structured data.
 *
 * Todo lo que se declara acá tiene que estar también visible en la página: el
 * FAQPage repite el acordeón, el BreadcrumbList repite la ruta que se ve arriba
 * del título. Structured data que describe contenido que el usuario no ve es
 * motivo de penalización, no un atajo.
 *
 * El `LocalBusiness` sale incompleto a propósito: faltan `geo`, `telephone`,
 * la dirección desagregada y los horarios de apertura, que no existen todavía
 * en el modelo `Sede` (migración pendiente, ver `tasks/todo.md`). Se emite lo
 * que sí tenemos y se completa cuando lleguen: un LocalBusiness parcial es
 * mejor que ninguno, e inventar datos de dirección es peor que los dos.
 */

type Json = Record<string, unknown>

const ID_ORGANIZACION = `${SITIO.url}/#organization`

export function organizacion (): Json {
  return {
    '@type': 'Organization',
    '@id': ID_ORGANIZACION,
    name: SITIO.nombre,
    url: `${SITIO.url}/`,
    sameAs: [SITIO.redes.instagram, SITIO.redes.tiktok],
  }
}

export function negocioLocal (sede: Sede, catalogo: CatalogoSede | null): Json {
  const url = `${SITIO.url}/estudios/${sede.slug}`

  const ofertas = [
    ...(sede.precioPrueba != null
      ? [{ '@type': 'Offer', name: 'Clase de prueba', price: String(sede.precioPrueba), priceCurrency: 'ARS' }]
      : []),
    ...(catalogo?.tipos ?? []).flatMap((t) => {
      const precio = precioPublicado(t.precios)
      return precio == null
        ? []
        : [{ '@type': 'Offer', name: t.nombre, price: String(precio), priceCurrency: 'ARS' }]
    }),
  ]

  return {
    '@type': ['HealthAndBeautyBusiness', 'ExerciseGym'],
    '@id': `${url}#business`,
    name: `${SITIO.nombre} ${sede.nombre}`,
    parentOrganization: { '@id': ID_ORGANIZACION },
    url,
    ...(sede.imagenUrl != null ? { image: sede.imagenUrl } : {}),
    ...(sede.descripcion != null ? { description: sede.descripcion } : {}),
    priceRange: '$$',
    currenciesAccepted: 'ARS',
    // `streetAddress` es la dirección tal como viene, sin desagregar: el modelo
    // todavía no tiene calle, localidad y CP por separado.
    address: {
      '@type': 'PostalAddress',
      streetAddress: sede.direccion,
      addressLocality: sede.ciudad,
      addressCountry: 'AR',
    },
    areaServed: zonaDe(sede),
    ...(ofertas.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `Planes ${SITIO.nombre} ${sede.nombre}`,
            itemListElement: ofertas,
          },
        }
      : {}),
  }
}

export function paginaDeFaqs (faqs: Faq[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
    })),
  }
}

export function migasDePan (migas: Array<{ nombre: string; href?: string }>): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: migas.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: m.nombre,
      ...(m.href != null ? { item: `${SITIO.url}${m.href}` } : {}),
    })),
  }
}

/** Un solo `@graph` por página: menos ruido que varios bloques sueltos. */
export function grafo (...nodos: Json[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodos })
}
