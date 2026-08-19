/**
 * Cliente de `/api/public/*` de ClicNet.
 *
 * Dos bases distintas a propósito:
 *
 * - **Servidor** (ISR): URL absoluta al backend. `API_ORIGIN` en desarrollo,
 *   el backend real en producción.
 * - **Cliente** (la grilla en vivo): `NEXT_PUBLIC_API_BASE_URL`. Puede ser el
 *   backend real —lo normal en producción— o el propio origen del sitio, que
 *   hace que el pedido lo proxee este mismo servidor y esquive CORS.
 *
 * Esa segunda opción no es cosmética: el backend tiene una allowlist de
 * orígenes (`Clicnet/src/proxy.ts`) y un dominio que no esté en la lista se
 * come un CORS. Mientras el dominio nuevo no esté agregado, staging apunta a sí
 * mismo. Ojo que proxear tiene un costo: todas las llamadas salen de la IP del
 * servidor y comparten el rate limit de 60 req/min.
 *
 * En desarrollo alcanza con la cadena vacía, que se resuelve al origen actual.
 * En Railway **no**: una variable vacía no sobrevive, así que ahí va la URL
 * completa del propio sitio.
 */

const BACKEND_PUBLICO = 'https://app.clicpilates.com'

const enServidor = typeof window === 'undefined'

function base (): string {
  if (enServidor) return process.env.API_ORIGIN ?? BACKEND_PUBLICO
  // Se lee la variable entera y literal para que Next la pueda inlinear.
  const publica = process.env.NEXT_PUBLIC_API_BASE_URL
  if (publica === undefined) return BACKEND_PUBLICO
  // Cadena vacía = mismo origen, que es como se pide en desarrollo.
  return publica === '' ? window.location.origin : publica
}

/** Falla del backend: HTTP no-2xx, timeout o red caída. */
export class ErrorApi extends Error {
  constructor (
    readonly estado: number | null,
    readonly ruta: string,
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'ErrorApi'
  }

  /** El backend contestó, pero que no hay nada para esta ruta. */
  get esNoEncontrado (): boolean {
    return this.estado === 404
  }
}

/** Si el backend tarda más que esto, se corta. Un ISR colgado tumba el build. */
const TIMEOUT_MS = 8000

interface Opciones {
  /** Segundos de ISR. `false` = sin cache (grilla en vivo). */
  revalidar: number | false
  /** Query string, sin el `?`. */
  parametros?: Record<string, string | number | undefined>
}

export async function pedir<T> (ruta: string, opciones: Opciones): Promise<T> {
  const url = new URL(`${base()}${ruta}`)
  for (const [clave, valor] of Object.entries(opciones.parametros ?? {})) {
    if (valor !== undefined) url.searchParams.set(clave, String(valor))
  }

  let respuesta: Response
  try {
    respuesta = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: 'application/json' },
      ...(opciones.revalidar === false
        ? { cache: 'no-store' as const }
        : { next: { revalidate: opciones.revalidar } }),
    })
  } catch (error) {
    const causa = error instanceof Error ? error.message : String(error)
    throw new ErrorApi(null, ruta, `No se pudo llegar al backend: ${causa}`)
  }

  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, ruta, `El backend devolvió ${respuesta.status}`)
  }

  return (await respuesta.json()) as T
}
