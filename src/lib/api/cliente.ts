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

/**
 * POST al backend. Es para el checkout, y tiene dos diferencias con `pedir`
 * que no son de estilo.
 *
 * 1. **Sale siempre desde el navegador.** Los endpoints de checkout tienen un
 *    rate limit de 5 intentos por IP cada 15 minutos. Si el POST saliera de
 *    nuestro servidor, todos los compradores caerían en la misma cubeta y el
 *    sexto de cada cuarto de hora se comería un 429. Por eso usa
 *    `BACKEND_PUBLICO` directo y no la base dual: el CORS del backend ya
 *    habilita este origen.
 *
 * 2. **Lee el mensaje de error del cuerpo.** En un GET alcanza con el código,
 *    pero acá el backend manda frases que el usuario tiene que ver tal cual
 *    ("Esta clase se llenó mientras completabas el formulario"). Perderlas y
 *    mostrar "error 409" sería inutilizar un mensaje que ya está escrito.
 */
export async function enviar<T> (ruta: string, cuerpo: unknown): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${BACKEND_PUBLICO}${ruta}`, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  } catch (error) {
    const causa = error instanceof Error ? error.message : String(error)
    throw new ErrorApi(null, ruta, `No se pudo llegar al backend: ${causa}`)
  }

  if (!respuesta.ok) {
    let mensaje = `El backend devolvió ${respuesta.status}`
    try {
      const cuerpoError = await respuesta.json() as { error?: string; message?: string }
      mensaje = cuerpoError.error ?? cuerpoError.message ?? mensaje
    } catch {
      // Un cuerpo que no es JSON no agrega nada: queda el mensaje por código.
    }
    throw new ErrorApi(respuesta.status, ruta, mensaje)
  }

  return (await respuesta.json()) as T
}
