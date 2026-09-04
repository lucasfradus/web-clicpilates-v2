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

  // El pelo le tapa la cara: no es identificable.
  metodo: {
    src: '/fotos/metodo/estiramiento-de-espaldas.jpg',
    alt: 'Alumna estirando sobre el reformer, de espaldas',
    foco: { x: 45, y: 40 },
    publicable: true,
    // Mejor para esta sección sería `metodo/metodo-correccion.jpg`, que muestra
    // a la instructora corrigiendo — que es el argumento de los grupos chicos.
    // Espera consentimiento: se le ve la cara de perfil.
  },

  // Sala vacía: no hay nadie, así que no hay consentimiento que pedir.
  // Reemplaza a `franquicias-sala-vacia.jpg`, de la producción anterior.
  franquicias: {
    src: '/fotos/franquicias/franquicias-belgrano.jpg',
    alt: 'Sala de un estudio CLIC vacía, con la fila de reformers y la C iluminada',
    foco: { x: 50, y: 55 },
    publicable: true,
  },

  initial: {
    src: '/fotos/niveles/initial-nueva.jpg',
    alt: 'Alumna trabajando el repertorio de Initial Pilates',
    foco: { x: 50, y: 35 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },

  // De espaldas: no se le ve la cara, así que no es identificable.
  // La de la producción nueva (`levelup-nueva.jpg`) es mejor, pero muestra dos
  // caras y espera consentimiento.
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

  // La imagen que se ve al compartir el link. Además del consentimiento le
  // falta el recorte: la OG es horizontal (1200×630) y esta es vertical.
  og: {
    src: '/fotos/og/grupo-clase.jpg',
    alt: 'Alumnas de CLIC en clase de reformer',
    foco: { x: 40, y: 30 },
    publicable: false,
    nota: PENDIENTE_CONSENTIMIENTO,
  },
} as const satisfies Record<string, Foto | null>

/**
 * Devuelve la foto sólo si se puede publicar. Con `null`, quien la use tiene
 * que mostrar su degradado — que es lo que el sitio hizo hasta ahora.
 */
export function publicable (foto: Foto | null | undefined): Foto | null {
  if (foto == null || !foto.publicable) return null
  return foto
}
