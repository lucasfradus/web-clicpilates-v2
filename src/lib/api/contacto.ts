import type { Sede } from './tipos'

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
