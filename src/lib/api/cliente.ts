/**
 * Cliente de `/api/public/*` de ClicNet.
 *
 * Dos bases distintas a propósito:
 *
 * - **Servidor** (ISR): URL absoluta al backend. `API_ORIGIN` en desarrollo,
 *   el backend real en producción.
 * - **Cliente** (la grilla en vivo): `NEXT_PUBLIC_API_BASE_URL`. En desarrollo
 *   va vacía para que el pedido salga al mismo origen y lo proxee este sitio
 *   (`next.config.ts`), que es como se esquiva CORS igual que hace el proxy de
 *   Vite en los SPAs.
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
