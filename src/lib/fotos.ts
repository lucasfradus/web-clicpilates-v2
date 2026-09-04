/**
 * Las fotos de marca del sitio.
 *
 * Un solo lugar con todas, por dos motivos:
 *
 * 1. Los archivos van a cambiar. `public/fotos/_LEEME.md` lista las de la
 *    producción nueva que todavía hay que bajar del Drive; cuando lleguen, se
 *    reemplaza el archivo y acá no se toca nada.
 *
 * 2. **El consentimiento.** Casi todas tienen caras reconocibles, y publicar la
 *    cara de una alumna en un sitio comercial sin su permiso no es una decisión
 *    de diseño. Cada foto declara si se puede publicar; mientras esté en
 *    `false`, la sección muestra el degradado y no la foto.
 *
 * Para habilitar una: conseguir el consentimiento y poner `publicable: true`.
 */

export interface Foto {
  src: string
  alt: string
  /** Punto focal en porcentaje, para `object-position`. Por defecto, el centro. */
  foco?: { x: number; y: number }
  publicable: boolean
  /** Por qué no se publica todavía. Sólo para quien lea el código. */
  nota?: string
}

const PENDIENTE_CONSENTIMIENTO =
  'Caras reconocibles: falta el consentimiento para uso comercial (public/fotos/_LEEME.md).'

export const FOTOS = {
  hero: {
    src: '/fotos/hero/hero-sala.jpg',
    alt: 'Sala de un estudio CLIC con alumnas entrenando en reformer',
    foco: { x: 50, y: 45 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },

  metodo: {
    src: '/fotos/metodo/metodo-manos.jpg',
    alt: 'Dos alumnas trabajando sobre la barra del reformer',
    foco: { x: 55, y: 40 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },

  // Sala vacía: no hay nadie, así que no hay consentimiento que pedir.
  franquicias: {
    src: '/fotos/franquicias/franquicias-sala-vacia.jpg',
    alt: 'Sala de un estudio CLIC vacía, con la fila de reformers',
    foco: { x: 50, y: 50 },
    publicable: true,
  },

  initial: {
    src: '/fotos/niveles/initial.jpg',
    alt: 'Alumna trabajando el repertorio de Initial Pilates',
    foco: { x: 50, y: 35 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },

  // De espaldas: no se le ve la cara, así que no es identificable.
  levelUp: {
    src: '/fotos/niveles/levelup.jpg',
    alt: 'Alumna de espaldas con los brazos abiertos, en Level Up Pilates',
    foco: { x: 50, y: 30 },
    publicable: true,
  },

  // La cara queda tapada por los brazos.
  manifiesto: {
    src: '/fotos/marca/manifiesto.jpg',
    alt: 'Alumna recogida sobre el reformer, al final de un ejercicio',
    foco: { x: 55, y: 45 },
    publicable: true,
  },

  comunidad: {
    src: '/fotos/marca/comunidad-alumnas.jpg',
    alt: 'Dos alumnas en un estudio CLIC',
    foco: { x: 50, y: 40 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },

  // Todavía no existe: no hay ninguna foto de formación en ninguna fuente.
  // Es una de las tres que hay que producir (public/fotos/_LEEME.md).
  academy: null,
} as const satisfies Record<string, Foto | null>

/**
 * Devuelve la foto sólo si se puede publicar. Con `null`, quien la use tiene
 * que mostrar su degradado — que es lo que el sitio hizo hasta ahora.
 */
export function publicable (foto: Foto | null | undefined): Foto | null {
  if (foto == null || !foto.publicable) return null
  return foto
}
