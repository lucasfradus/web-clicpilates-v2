/**
 * UTMs.
 *
 * El embudo empieza acá y termina en el checkout, que vive en otro SPA. Si los
 * parámetros de campaña se pierden en el salto, la venta aparece como directa y
 * la pauta que la generó queda sin atribución — que es la forma más cara de no
 * medir.
 *
 * Dos cosas entonces: se guardan al llegar (la primera campaña gana, porque es
 * la que trajo a la persona) y se re-adjuntan a los links que salen a
 * `/reservar`.
 */

const CLAVE = 'clic:utm'
const PARAMETROS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  // Identificadores de click: valen más que las UTMs para atribuir, y los
  // necesita la Conversions API para casar el evento con el anuncio.
  'fbclid',
  'gclid',
] as const

export type Utms = Partial<Record<(typeof PARAMETROS)[number], string>>

function leerGuardadas (): Utms {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    return crudo != null ? JSON.parse(crudo) as Utms : {}
  } catch {
    // Safari en modo privado puede tirar acá. No es crítico.
    return {}
  }
}

/** Guarda las UTMs de la URL actual. La primera campaña de la sesión gana. */
export function capturarUtms (search: string): void {
  const url = new URLSearchParams(search)
  const nuevas: Utms = {}
  for (const p of PARAMETROS) {
    const valor = url.get(p)
    if (valor != null && valor !== '') nuevas[p] = valor
  }
  if (Object.keys(nuevas).length === 0) return

  const guardadas = leerGuardadas()
  if (Object.keys(guardadas).length > 0) return

  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(nuevas))
  } catch {
    // idem
  }
}

/** Pega las UTMs guardadas a una URL interna, sin pisar las que ya tenga. */
export function conUtms (href: string): string {
  const guardadas = leerGuardadas()
  if (Object.keys(guardadas).length === 0) return href

  const [ruta, query = ''] = href.split('?')
  const params = new URLSearchParams(query)
  for (const [clave, valor] of Object.entries(guardadas)) {
    if (!params.has(clave)) params.set(clave, valor)
  }
  return `${ruta}?${params.toString()}`
}
