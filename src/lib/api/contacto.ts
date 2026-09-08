import type { CatalogoTipoPlan, Sede } from './tipos'

/**
 * A dónde manda el botón principal de una sede.
 *
 * Una sede sin `reservaOnline` no puede cobrar online —le falta la cuenta de
 * Mercado Pago, o tiene la venta apagada— pero su landing existe igual: no
 * dejamos que una configuración de cobro borre una página del sitio. Lo que
 * cambia es el destino del botón.
 *
 * Se resuelve acá y no en cada componente para que la regla viva en un solo
 * lugar: es la razón de ser del booleano que agrega `?contexto=web`.
 */
export interface AccionSede {
  href: string
  texto: string
  /** `true` cuando lleva al portal de reservas; `false` cuando sale a WhatsApp. */
  reserva: boolean
}

export function accionDeSede (sede: Pick<Sede, 'slug' | 'reservaOnline' | 'whatsappUrl'>): AccionSede | null {
  if (sede.reservaOnline) {
    return {
      href: `/reservar/sede/${sede.slug}`,
      texto: 'Reservar clase de prueba',
      reserva: true,
    }
  }

  // Sin WhatsApp cargado no hay a dónde mandar a nadie: mejor no mostrar botón
  // que mostrar uno que no lleva a ningún lado.
  if (sede.whatsappUrl == null || sede.whatsappUrl === '') return null

  return {
    href: sede.whatsappUrl,
    texto: 'Consultar por WhatsApp',
    reserva: false,
  }
}

/**
 * A dónde manda el botón de una tarjeta de plan.
 *
 * El portal de reservas dejó de ser sólo "reservá tu clase de prueba": la misma
 * pantalla vende planes. Hasta ahora la web publicaba los precios y ahí se
 * terminaba —las tarjetas no tenían botón—, así que quien decidía comprar tenía
 * que buscar solo el camino.
 *
 * `?tipo=` es el `CatalogoTipoPlan.id`, que es exactamente lo que el SPA guarda
 * para saber qué tarjeta elegiste. **No** es `fijo.planId` ni `flexible.planId`:
 * esos son los planes concretos de cada modalidad y se resuelven del otro lado,
 * después de que elegís entre horarios fijos y pack.
 *
 * El parámetro es inofensivo mientras el SPA no lo lea: hoy lo ignora y cae en
 * la landing de la sede, que es el mismo lugar donde caía antes.
 *
 * Si la sede no cobra online devuelve `null` y la tarjeta queda sin botón, a
 * propósito: la salida a WhatsApp ya está en el CTA del hero, y repetirla en
 * cada tarjeta serían tres botones idénticos que dicen lo mismo.
 */
export function accionDePlan (
  sede: Pick<Sede, 'slug' | 'reservaOnline'>,
  tipo: Pick<CatalogoTipoPlan, 'id'>,
): AccionSede | null {
  if (!sede.reservaOnline) return null

  return {
    href: `/reservar/sede/${sede.slug}?tipo=${tipo.id}`,
    texto: 'Empezar este plan',
    reserva: true,
  }
}
