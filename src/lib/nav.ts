/** Navegación del sitio. La comparten header, menú mobile y footer.
 *
 *  `/reservar` y `/mi-cuenta` no son páginas de este proyecto: son rewrites a
 *  los dos SPAs que ya funcionan (ver next.config.ts). Por eso van marcados
 *  como `spa`: se enlazan con <a> y no con <Link>, porque una navegación de
 *  cliente pediría un payload de React que del otro lado no existe.
 *
 *  El resto de las rutas llega en las fases 3 y 5 del plan; hasta entonces
 *  devuelven 404, que es preferible a publicar una página vacía indexable.
 */

export type EnlaceNav = { href: string; label: string; spa?: boolean }

export const RESERVAR = '/reservar'
export const MI_CUENTA = '/mi-cuenta'

export const NAV_PRINCIPAL: EnlaceNav[] = [
  { href: RESERVAR, label: 'Reservar', spa: true },
  { href: '/estudios', label: 'Estudios' },
  { href: '/precios', label: 'Precios' },
  { href: '/academy', label: 'Academy' },
  { href: '/franquicias', label: 'Franquicias' },
]

export const NAV_FOOTER: EnlaceNav[] = [
  { href: RESERVAR, label: 'Reservar clase', spa: true },
  { href: '/precios', label: 'Precios' },
  { href: '/estudios', label: 'Estudios' },
  { href: '/academy', label: 'Academy' },
  { href: '/franquicias', label: 'Franquicias' },
  { href: MI_CUENTA, label: 'Mi cuenta', spa: true },
  { href: '/politicas', label: 'Políticas' },
]
