/**
 * Meta Pixel.
 *
 * Portado de `reservas-clientes-clic-v2/src/lib/meta.ts` — la lógica es la
 * misma y por una buena razón: conviven varios pixels en el mismo sitio (el
 * general de la marca y el de cada franquicia con cuenta publicitaria propia,
 * en otro Business Manager).
 *
 * Por eso **nunca** se usa `fbq('track', ...)`: con varios pixels inicializados
 * eso dispara a todos, y una cuenta terminaría viendo las conversiones de la
 * otra. Todo sale por `trackSingle`, con el pixel de la sede en la que está la
 * persona.
 *
 * La diferencia con la versión de reservas: allá el mapa sede → pixel se pedía
 * a la API y había que correr una carrera contra un timeout. Acá las sedes ya
 * vienen renderizadas desde el servidor, así que el mapa se pasa por props y no
 * hay carrera que perder.
 */

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] }
  }
}

const PIXEL_GENERAL = process.env.NEXT_PUBLIC_META_PIXEL_ID

/** slug de sede → pixel propio. */
let mapaPixels = new Map<string, string>()
const pixelsIniciados = new Set<string>()

function iniciarPixel (id: string) {
  if (id === '' || pixelsIniciados.has(id) || window.fbq == null) return
  pixelsIniciados.add(id)
  // Con datos del cliente (los guarda el checkout antes de ir a Mercado Pago),
  // el `init` los lleva como advanced matching: al volver a /reservar/gracias
  // el Purchase sale con email y teléfono, y no sólo con la cookie.
  const datos = datosClienteGuardados()
  if (datos != null) window.fbq('init', id, datos)
  else window.fbq('init', id)
  // El auto-config de Meta manda clicks y form submits a TODOS los pixels
  // inicializados, ignorando trackSingle. Es exactamente la fuga entre cuentas
  // que este módulo evita, así que se apaga.
  window.fbq('set', 'autoConfig', false, id)
}

/** Inicializa el pixel general y el de cada sede. Idempotente. */
export function iniciarPixels (pixelesPorSede: Record<string, string>) {
  if (typeof window === 'undefined' || window.fbq == null) return

  if (PIXEL_GENERAL != null && PIXEL_GENERAL !== '') iniciarPixel(PIXEL_GENERAL)

  mapaPixels = new Map(Object.entries(pixelesPorSede))
  for (const pixel of mapaPixels.values()) iniciarPixel(pixel)
}

/**
 * A qué pixels va un evento.
 *
 * Con sede: el de esa sede, o el general si no tiene uno propio.
 *
 * Sin sede depende del evento, y por eso lo decide quien llama:
 *  - PageView (`aTodos`): va a todos. Es la home o el índice de estudios, y
 *    cada cuenta necesita ver el PageView de la pantalla donde cayó su anuncio.
 *  - conversiones: sólo el general. Una consulta o una venta pertenece a UNA
 *    cuenta; mandarla a todas le infla las conversiones a la que no la generó.
 */
function destinos (slug: string | null | undefined, aTodos: boolean): string[] {
  if (slug != null && slug !== '') {
    const propio = mapaPixels.get(slug)
    if (propio != null) return [propio]
    return PIXEL_GENERAL != null && PIXEL_GENERAL !== '' ? [PIXEL_GENERAL] : []
  }
  if (aTodos) return [...pixelsIniciados]
  return PIXEL_GENERAL != null && PIXEL_GENERAL !== '' ? [PIXEL_GENERAL] : []
}

export function metaPageView (slug?: string | null) {
  for (const pixel of destinos(slug, true)) {
    window.fbq?.('trackSingle', pixel, 'PageView')
  }
}

/**
 * Evento estándar de Meta (ViewContent, Lead, …).
 *
 * `eventID` sirve para deduplicar contra la Conversions API del backend: si el
 * mismo evento llega por el pixel y por el servidor con el mismo id, Meta lo
 * cuenta una sola vez.
 */
export function metaEvento (
  nombre: string,
  parametros?: Record<string, unknown>,
  opciones?: { eventID?: string },
  slug?: string | null,
) {
  for (const pixel of destinos(slug, false)) {
    if (opciones != null) window.fbq?.('trackSingle', pixel, nombre, parametros, opciones)
    else window.fbq?.('trackSingle', pixel, nombre, parametros)
  }
}


// ── Identificadores para la Conversions API ─────────────────────────────────
//
// Portado tal cual de `reservas-clientes-clic-v2/src/lib/meta.ts`.
//
// El Purchase server-side lo manda ClicNet desde el webhook de Mercado Pago,
// que no ve el browser. Para que Meta pueda atribuir la venta al click del
// anuncio, el checkout le pasa al backend las cookies del pixel: `_fbp` (el
// browser) y `_fbc` (el click).

/** fbclid de la URL de llegada (un anuncio), con el momento en que llegó. */
const FBCLID_STORAGE_KEY = 'clic:fbclid'

/** Datos del cliente para el advanced matching, ya hasheados. */
const DATOS_CLIENTE_STORAGE_KEY = 'clic:metaDatosCliente'

/** Lo que acepta el backend para fbp/fbc. Más largo = basura, no se manda. */
const MAX_LARGO_IDENTIFICADOR = 500

function leerCookie (nombre: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`))
  if (match == null) return undefined
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

/**
 * Guarda el `fbclid` con el que se llegó al sitio.
 *
 * localStorage y no sessionStorage: la compra puede llegar días después del
 * click, y Meta le da a `_fbc` 90 días.
 */
export function capturarFbclid () {
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid == null || fbclid === '') return
    localStorage.setItem(FBCLID_STORAGE_KEY, JSON.stringify({ fbclid, ts: Date.now() }))
  } catch {
    // Storage bloqueado (Safari privado, cookies apagadas): queda la cookie del pixel.
  }
}

function fbcGuardado (): string | undefined {
  try {
    const raw = localStorage.getItem(FBCLID_STORAGE_KEY)
    if (raw == null) return undefined
    const { fbclid, ts } = JSON.parse(raw) as { fbclid?: unknown; ts?: unknown }
    if (typeof fbclid !== 'string' || typeof ts !== 'number') return undefined
    // Mismo formato que la cookie del pixel: fb.<subdominio>.<creación ms>.<fbclid>
    return `fb.1.${ts}.${fbclid}`
  } catch {
    return undefined
  }
}

/**
 * `fbp` y `fbc` para mandarle al backend en el checkout. Lo que no hay, no va.
 * La cookie `_fbc` del pixel manda; el fbclid guardado es el respaldo.
 */
export function identificadoresMeta (): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}
  const fbp = leerCookie('_fbp')
  const fbc = leerCookie('_fbc') ?? fbcGuardado()
  const ids: { fbp?: string; fbc?: string } = {}
  if (fbp != null && fbp.length <= MAX_LARGO_IDENTIFICADOR) ids.fbp = fbp
  if (fbc != null && fbc.length <= MAX_LARGO_IDENTIFICADOR) ids.fbc = fbc
  return ids
}

// ── Advanced matching ───────────────────────────────────────────────────────
//
// El Purchase lo dispara /reservar/gracias, una carga nueva de página al volver
// de Mercado Pago: el formulario ya no está. El checkout deja los datos del
// cliente en sessionStorage (misma pestaña), normalizados como pide Meta y
// hasheados con SHA-256 — nunca en claro —, y `iniciarPixel` los pasa en el
// `init`. El pixel reconoce los valores ya hasheados y no los vuelve a hashear.

type DatosClienteMeta = Partial<Record<'em' | 'ph' | 'fn' | 'ln' | 'country', string>>

async function sha256 (valor: string): Promise<string> {
  const bytes = new TextEncoder().encode(valor)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizarNombre (valor: string): string {
  return valor.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Teléfono en E.164 sin '+', con el 9 de móvil. Mismo criterio que la CAPI del
 * backend (`variantesTelefono` en ClicNet), que manda además la forma sin 9:
 * acá va una sola, la de celular, que es lo que carga la gente.
 */
export function telefonoMeta (telefono: string): string | null {
  let digits = telefono.replace(/\D/g, '')
  if (digits === '') return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('54')) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.startsWith('9')) digits = digits.slice(1)
  if (digits.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (digits.slice(largoArea, largoArea + 2) === '15') {
        digits = digits.slice(0, largoArea) + digits.slice(largoArea + 2)
        break
      }
    }
  }
  if (digits.length === 10 && digits.startsWith('15')) digits = `11${digits.slice(2)}`
  return digits.length === 10 ? `549${digits}` : `54${digits}`
}

/**
 * Deja los datos del cliente listos para el advanced matching del Purchase.
 * Llamar antes de redirigir a Mercado Pago. Nunca tira: si el browser no
 * puede hashear o guardar, el Purchase sale igual, sin estos datos.
 */
export async function guardarDatosClienteMeta (cliente: {
  email: string
  telefono: string
  nombre: string
  apellido: string
}): Promise<void> {
  try {
    const datos: DatosClienteMeta = { country: await sha256('ar') }
    const email = cliente.email.trim().toLowerCase()
    if (email !== '') datos.em = await sha256(email)
    const telefono = telefonoMeta(cliente.telefono)
    if (telefono != null) datos.ph = await sha256(telefono)
    const nombre = normalizarNombre(cliente.nombre)
    if (nombre !== '') datos.fn = await sha256(nombre)
    const apellido = normalizarNombre(cliente.apellido)
    if (apellido !== '') datos.ln = await sha256(apellido)
    sessionStorage.setItem(DATOS_CLIENTE_STORAGE_KEY, JSON.stringify(datos))
  } catch {
    // crypto.subtle sin contexto seguro o storage bloqueado: sin advanced matching.
  }
}

function datosClienteGuardados (): DatosClienteMeta | null {
  try {
    const raw = sessionStorage.getItem(DATOS_CLIENTE_STORAGE_KEY)
    if (raw == null) return null
    const datos = JSON.parse(raw) as DatosClienteMeta
    return datos != null && typeof datos === 'object' ? datos : null
  } catch {
    return null
  }
}
