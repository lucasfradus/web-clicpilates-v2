import { ga4Evento } from './ga4'
import { metaEvento } from './meta'

/**
 * Los eventos del embudo de venta.
 *
 * Están juntos porque comparten reglas que no son obvias y que, si se rompen,
 * no avisan: el número sigue apareciendo en el informe, sólo que mal.
 *
 * 1. **`value` y `currency` van juntos o no van.** GA4 ignora un importe sin
 *    moneda, así que mandar uno solo es no mandar ninguno.
 * 2. **`content_category` lleva el tipo de venta** (`Trial` o `Subscription`),
 *    no la sede. Es el campo por el que Meta arma conversiones personalizadas, y
 *    tiene que coincidir con lo que manda la Conversions API del backend para el
 *    mismo evento, o la conversión matchea la mitad.
 * 3. **La sede va duplicada**: dentro de `items` y suelta. Los parámetros de
 *    `items` son de ámbito ítem y GA4 no los ofrece en exploraciones de embudo
 *    ni en "Crear evento"; sin la copia suelta no se puede separar la venta por
 *    estudio, que es como se decide la pauta.
 * 4. **El evento va al pixel de la sede**, nunca a todos: mandarle una venta a
 *    la cuenta publicitaria de otra franquicia le infla las conversiones con
 *    algo que no generó.
 */

export type TipoVenta = 'Trial' | 'Subscription'

interface Venta {
  tipo: TipoVenta
  /** Lo que se compró: el nombre de la clase o del plan. */
  nombre: string
  sede: string
  sedeSlug: string | null
  precio: number | null
  /** Sólo en `purchase`: el id del pago de Mercado Pago. */
  transactionId?: string
  /** Sólo en `Purchase`: para deduplicar contra la Conversions API. */
  eventID?: string
}

function emitir (nombreGa4: string, nombreMeta: string, venta: Venta) {
  // Regla 1: el importe sin moneda no existe para GA4, así que van los dos o
  // ninguno.
  const importe = venta.precio != null ? { value: venta.precio, currency: 'ARS' } : {}

  ga4Evento(nombreGa4, {
    tipo_venta: venta.tipo,
    sede: venta.sede,
    ...(venta.sedeSlug != null ? { sede_slug: venta.sedeSlug } : {}),
    items: [{
      item_name: venta.nombre,
      item_category: venta.tipo,
      item_category2: venta.sede,
      quantity: 1,
      ...(venta.precio != null ? { price: venta.precio } : {}),
    }],
    ...importe,
    ...(venta.transactionId != null ? { transaction_id: venta.transactionId } : {}),
  })

  metaEvento(
    nombreMeta,
    {
      content_name: venta.nombre,
      content_category: venta.tipo,
      sede: venta.sede,
      ...importe,
    },
    venta.eventID != null ? { eventID: venta.eventID } : undefined,
    venta.sedeSlug,
  )
}

/** Abrió el checkout: eligió qué quiere comprar. */
export function ventaIniciada (venta: Venta) {
  emitir('begin_checkout', 'AddToCart', venta)
}

/**
 * Se creó la preferencia y la persona está por salir a Mercado Pago. Va después
 * del POST y antes del redirect: emitirlo antes contaría intentos que el
 * backend rechazó.
 */
export function ventaEnviada (venta: Venta) {
  emitir('add_payment_info', 'InitiateCheckout', venta)
}

/**
 * Mercado Pago aprobó el pago.
 *
 * `transactionId` tiene que ser el id del pago, **nunca** el de la clase: GA4
 * deduplica por ese campo y con el id de clase contaría una sola compra por
 * horario, por más que lo reserven veinte personas.
 */
export function ventaConcretada (venta: Venta & { transactionId: string }) {
  emitir('purchase', 'Purchase', venta)
}

/**
 * `true` la primera vez que se pregunta por este pago.
 *
 * Doble protección: el F5 en la página de gracias y el doble montaje del modo
 * estricto de React vuelven a disparar el evento. Si el storage falla, se
 * devuelve `true`: **perder una venta real es peor que contar dos veces una
 * recarga**.
 */
export function primeraVezQueSeCuenta (transactionId: string): boolean {
  const clave = `clic:purchase:${transactionId}`
  try {
    if (sessionStorage.getItem(clave) != null) return false
    sessionStorage.setItem(clave, '1')
    return true
  } catch {
    return true
  }
}
