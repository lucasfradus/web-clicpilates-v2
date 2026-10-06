// Google Analytics 4 — helpers de tracking del portal de reservas.
//
// Portado de `reservas-clientes-clic-v2/src/lib/analytics.ts`. La carga de
// gtag.js y los page_view los hace el layout de la web (src/components/medicion),
// así que acá quedan sólo los eventos. Sin NEXT_PUBLIC_GA_MEASUREMENT_ID (staging,
// desarrollo) todo es no-op, igual que en el portal.

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** Registra un evento personalizado (ej: reserva, selección de sede). */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (!GA_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/** Pasos del embudo de venta, con los nombres estándar de ecommerce de GA4. */
export type EventoVenta =
  | 'view_item'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase';

/** Lo que se está comprando: una clase de prueba o un plan. */
export interface ItemVenta {
  /** Nombre visible: la actividad de la clase, o el nombre del plan. */
  nombre: string;
  /**
   * Qué tipo de venta es. Las dos usan `purchase` —ambas son ventas reales—, y
   * esto es lo único que las separa después en los informes y en las campañas.
   */
  categoria: 'Trial' | 'Subscription';
  /** Nombre de la sede (ej: "Lomada Hot"). */
  sede?: string;
  /** Slug de la sede (ej: "lomada-hot"). */
  sedeSlug?: string;
  /** Precio en pesos. Sin precio el evento va sin `value` ni `currency`. */
  precio?: number | null;
}

/**
 * Evento de ecommerce de GA4, con la estructura `items` que esperan los
 * informes de Monetización.
 *
 * La sede viaja DOS veces a propósito: dentro de `items` como `item_category2`
 * y suelta como `sede`. La primera alimenta los informes de ecommerce; la
 * segunda es la que se puede usar como desglose en una exploración de embudo,
 * porque los parámetros de `items` son de ámbito ítem y ahí no se pueden usar.
 *
 * Con el tipo de venta pasa lo mismo y por el mismo motivo: va como
 * `item_category` dentro de `items` (los informes de Monetización lo cortan
 * solo) y suelto como `tipo_venta`. Sin la copia suelta no se pueden crear los
 * eventos derivados `purchase_trial` / `purchase_subscription`, porque la
 * pantalla "Crear evento" de GA4 solo ofrece parámetros de ámbito evento — y
 * sin esos eventos derivados no se puede optimizar una campaña hacia
 * suscripciones sin que le sumen también las clases de prueba.
 */
export function trackVenta(
  evento: EventoVenta,
  item: ItemVenta,
  opciones: { transactionId?: string } = {},
): void {
  if (!GA_ID || typeof window.gtag !== 'function') return;

  const params: Record<string, unknown> = {
    tipo_venta: item.categoria,
    items: [
      {
        item_name: item.nombre,
        item_category: item.categoria,
        ...(item.sede ? { item_category2: item.sede } : {}),
        ...(item.precio != null ? { price: item.precio } : {}),
        quantity: 1,
      },
    ],
  };
  if (item.sede) params.sede = item.sede;
  if (item.sedeSlug) params.sede_slug = item.sedeSlug;
  // `value` y `currency` van juntos o no van: GA4 ignora el importe si le falta
  // la moneda.
  if (item.precio != null) {
    params.value = item.precio;
    params.currency = 'ARS';
  }
  if (opciones.transactionId) params.transaction_id = opciones.transactionId;

  window.gtag('event', evento, params);
}
