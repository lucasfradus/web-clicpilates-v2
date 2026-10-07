/** Navegación del sitio. La comparten header, menú mobile y footer.
 *
 *  `/mi-cuenta` no es una página de este proyecto: es un rewrite al SPA del
 *  portal de clientes (ver next.config.ts). Por eso va marcado como `spa`: se
 *  enlaza con <a> y no con <Link>, porque una navegación de cliente pediría un
 *  payload de React que del otro lado no existe.
 *
 *  Reservar no tiene item propio: desde el 7-oct reservar es `/estudios` (el
 *  portal de reservas portado vive ahí), y dos items al mismo lugar confunden.
 *  `RESERVAR` queda como el destino de los botones de "Clase de prueba".
 */

export type EnlaceNav = { href: string; label: string; spa?: boolean }

export const RESERVAR = '/estudios'
export const MI_CUENTA = '/mi-cuenta'

export const NAV_PRINCIPAL: EnlaceNav[] = [
  { href: '/estudios', label: 'Estudios' },
  { href: '/academy', label: 'Academy' },
  { href: '/franquicias', label: 'Franquicias' },
]

export const NAV_FOOTER: EnlaceNav[] = [
  { href: '/estudios', label: 'Estudios' },
  { href: '/academy', label: 'Academy' },
  { href: '/franquicias', label: 'Franquicias' },
  { href: MI_CUENTA, label: 'Mi cuenta', spa: true },
  { href: '/politicas', label: 'Políticas' },
]
