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
 * El 10-sep llegó el consentimiento de todas las que estaban esperando, así que
 * hoy no hay ninguna en `false`. **El interruptor no se saca**: la próxima
 * tanda de fotos entra igual, con `publicable: false` hasta que su permiso
 * exista. Que hoy esté vacío es un estado, no el final de la historia.
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

export const FOTOS = {
  // El hero es la única foto que se recorta a alto completo de pantalla, así que
  // en un teléfono se ve más o menos un tercio del ancho. El foco corrido a la
  // derecha prioriza a las alumnas sobre el logo de la pared, que queda a la
  // izquierda: en desktop entran los dos, en mobile hay que elegir.
  hero: {
    src: '/fotos/hero/hero-estiramiento.jpg',
    alt: 'Fila de reformers en un estudio CLIC, con alumnas estirando sobre la barra',
    foco: { x: 62, y: 42 },
    publicable: true,
  },

  // El pelo le tapa la cara: no es identificable.
  metodo: {
    src: '/fotos/metodo/estiramiento-de-espaldas.jpg',
    alt: 'Alumna estirando sobre el reformer, de espaldas',
    foco: { x: 45, y: 40 },
    publicable: true,
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
    alt: 'Alumna trabajando el repertorio de Inicial',
    foco: { x: 50, y: 35 },
    publicable: true,
  },

  // De espaldas: no se le ve la cara. `niveles/levelup-nueva.jpg` es la
  // alternativa de la producción nueva, por si se quiere cambiar.
  levelUp: {
    src: '/fotos/niveles/levelup.jpg',
    alt: 'Alumna de espaldas con los brazos abiertos, en Level Up',
    foco: { x: 50, y: 30 },
    publicable: true,
  },

  intense: {
    src: '/fotos/niveles/intense.jpg',
    alt: 'Alumna trabajando con el aro sobre el reformer, en una clase de Intense',
    // Es vertical y el subhero es una banda ancha y baja, así que de la foto
    // entra una franja finita. Probados tres focos: al medio quedaban sólo las
    // piernas, más abajo un primer plano del torso. Éste agarra las manos en
    // alto y el aro, que es lo que se parece a "más ritmo".
    // Lo que de verdad falta es una toma horizontal de una clase de Intense.
    foco: { x: 50, y: 45 },
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
    publicable: true,
  },

  // La instructora corrigiendo. Es la mejor foto que tenemos para Academy
  // porque muestra el oficio que se enseña, no un aula: alguien mirando un
  // cuerpo y ajustándolo.
  academy: {
    src: '/fotos/academy/instructora-corrigiendo.jpg',
    alt: 'Instructora de CLIC corrigiendo a una alumna sobre el reformer',
    foco: { x: 60, y: 40 },
    publicable: true,
  },

  // Una alternativa horizontal para la imagen de compartir. Hoy `public/og.jpg`
  // se genera desde el hero con `scripts/preparar-og.mjs`; ésta es vertical, así
  // que usarla implicaría recortarla con el mismo script.
  og: {
    src: '/fotos/og/grupo-clase.jpg',
    alt: 'Alumnas de CLIC en clase de reformer',
    foco: { x: 40, y: 30 },
    publicable: true,
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
