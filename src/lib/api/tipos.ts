/**
 * Tipos de `/api/public/*` de ClicNet.
 *
 * Los que ya existen están copiados **tal cual** de
 * `reservas-clientes-clic-v2/src/types/index.ts`, que es donde vive el tipo
 * canónico: mismos nombres, mismas formas. Si algo cambia allá, cambia acá.
 * (No se importan por path porque son dos repos y dos deploys distintos.)
 *
 * Lo que se agrega es lo que la web necesita y el portal de reservas no mira:
 * `reservaOnline`, el foco de las fotos y los datos de precio por sede.
 */

/* ── Sede ────────────────────────────────────────────────────────────────── */

/** Punto focal de una foto, en porcentaje. Va a `object-position`. */
export interface Foco {
  x: number
  y: number
}

export interface FotoSede {
  url: string
  foco: Foco
}

export interface PlanSede {
  id: number
  nombre: string
  precio: number
  modalidad: string
  dias: number
  accesos: number
}

export interface Sede {
  id: number
  slug: string
  nombre: string
  direccion: string
  ciudad: string
  email: string | null
  descripcion: string | null
  imagenUrl: string | null
  fotos: string[]
  whatsappUrl: string | null
  googleMapsUrl: string | null
  precioPrueba: number | null
  /**
   * Pixel de Meta propio de la sede (franquicias con su propia cuenta
   * publicitaria). null = usa el pixel general de la marca.
   */
  metaPixelId: string | null

  /* Lo que agrega `?contexto=web` y lo que el portal no lee. */

  /**
   * Si la sede puede vender online de verdad: venta activa, plan de prueba y
   * cuenta de Mercado Pago (salvo gimnasios, que reservan gratis).
   *
   * En `false` la sede igual se publica —su landing no puede depender de una
   * configuración de cobro— pero el botón de reservar se reemplaza por
   * WhatsApp. Ver `contactoDeSede()`.
   */
  reservaOnline: boolean
  /** Punto focal de `imagenUrl`. */
  imagenFoco: Foco
  /** Igual que `fotos`, con el foco de cada una. */
  fotosDetalle: FotoSede[]
  /** Si la sede publica precios. En `false`, `planes` viene vacío. */
  mostrarPrecios: boolean
  planes: PlanSede[]
}

/* ── Grilla de clases ────────────────────────────────────────────────────── */

export interface Actividad {
  id: number
  nombre: string
  color: string
  descripcion: string | null
}

export interface Salon {
  id: number
  nombre: string
}

export interface Clase {
  id: number
  /** ISO 8601. */
  inicio: string
  actividad: Actividad
  salon: Salon | null
  instructor: string | null
  cuposDisponibles: number
}

/* ── Catálogo de planes ──────────────────────────────────────────────────── */

export interface CatalogoPrecios {
  /**
   * Precio de la venta online. Es el que se publica y el que se cobra.
   * Opcional mientras el backend no lo mande: hasta entonces se cae a
   * `efectivo`, que es el que coincide con él en 188 de 207 planes.
   */
  transferencia?: number | null
  efectivo: number | null
  debito: number | null
  tarjeta: number | null
}

export interface CatalogoPlanFijo {
  planId: number
  ingresosPorSemana: number | null
  accesos: number
}

export interface CatalogoPlanFlexible {
  planId: number
  accesos: number
  precios: CatalogoPrecios
}

export interface CatalogoTipoPlan {
  id: number
  nombre: string
  descripcion: string | null
  frecuencia: 'MENSUAL' | 'TRIMESTRAL'
  etiqueta: string
  subtitulo: string
  destacado: boolean
  caracteristicas: string[]
  orden: number
  /** Precios del plan fijo (compatibilidad con el render actual). */
  precios: CatalogoPrecios
  /** Plan de horarios fijos de esta tarjeta. */
  fijo: CatalogoPlanFijo
  /** Variante flexible (PACK), si está disponible. */
  flexible: CatalogoPlanFlexible | null
}

export interface CatalogoSede {
  sedeId: number
  sedeNombre: string
  sedeSlug: string
  /** Checklist único de la sede. El de cada tipo quedó solo para el sitio v1. */
  caracteristicas: string[]
  tipos: CatalogoTipoPlan[]
}

/**
 * El precio que se publica. `transferencia` es el de la venta online y es el
 * que se cobra; `efectivo` es el fallback mientras el backend no lo mande.
 */
export function precioPublicado (precios: CatalogoPrecios): number | null {
  return precios.transferencia ?? precios.efectivo
}
