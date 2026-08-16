import { ErrorApi, pedir } from './cliente'
import type { CatalogoSede, Sede } from './tipos'

/**
 * Datos que van en el HTML del servidor: nombre, dirección, descripción,
 * fotos y precios. No se difieren al cliente — es exactamente el contenido por
 * el que queremos rankear.
 *
 * Que sean rápidos no se resuelve difiriéndolos sino cacheándolos: con ISR el
 * HTML se genera una vez por hora y sale del CDN. De paso esquiva el rate limit
 * de 60 req/min por IP del backend, que con SSR sin cache estrangularía el
 * sitio entero desde la IP del servidor.
 *
 * Convención de errores en este módulo:
 *   `null` → el backend falló y hay que mostrar un estado de error
 *   `[]`   → el backend contestó y no hay nada: estado vacío
 * La diferencia importa: no es lo mismo "todavía no hay clases" que "no
 * pudimos cargar las clases".
 */

export const REVALIDAR = 3600

/** La web de CLIC publica pilates. El `contexto=web` es el que lista toda sede activa. */
const PARAMETROS_WEB = { tipo: 'PILATES', contexto: 'web' } as const

export async function getSedes (): Promise<Sede[] | null> {
  try {
    return await pedir<Sede[]>('/api/public/sedes', {
      revalidar: REVALIDAR,
      parametros: PARAMETROS_WEB,
    })
  } catch (error) {
    registrar('getSedes', error)
    return null
  }
}

/**
 * Una sede por slug. El backend no tiene endpoint por slug, así que sale del
 * listado — que ya está cacheado, con lo cual no cuesta un pedido extra.
 *
 * Devuelve `null` tanto si la sede no existe como si el listado no cargó.
 * Cuando esa diferencia importa —una landing tiene que dar 404 si el slug no
 * existe, pero no si el backend está caído— hay que usar `getSedes()` y
 * buscar ahí.
 */
export async function getSede (slug: string): Promise<Sede | null> {
  const sedes = await getSedes()
  return sedes?.find((s) => s.slug === slug) ?? null
}

/** `null` = la sede no publica catálogo, o no cargó. Sin precios se muestra el mismo bloque. */
export async function getCatalogo (slug: string): Promise<CatalogoSede | null> {
  try {
    const catalogo = await pedir<CatalogoSede[]>('/api/public/catalogo', {
      revalidar: REVALIDAR,
      parametros: { sede: slug },
    })
    return catalogo[0] ?? null
  } catch (error) {
    if (error instanceof ErrorApi && error.esNoEncontrado) return null
    registrar('getCatalogo', error)
    return null
  }
}

function registrar (funcion: string, error: unknown) {
  // Va al log del servidor, no a la pantalla. La página muestra su estado de
  // error; acá queda el detalle para saber por qué.
  console.error(`[api] ${funcion} falló:`, error)
}
