import type { ReactNode } from 'react'

/**
 * Los tres estados que toda sección con datos tiene que saber mostrar:
 * cargando, error y vacío. Van por sección y no por página — que se caiga la
 * grilla no puede dejar la landing en blanco, porque el resto (dirección,
 * precios, fotos) ya está en el HTML del servidor y es lo que indexa Google.
 */

/**
 * Bloque gris del tamaño exacto que va a ocupar el contenido real.
 *
 * El alto es obligatorio a propósito: un skeleton más bajo que su contenido
 * hace saltar la página cuando llegan los datos, y eso es CLS — el mismo
 * problema que veníamos a evitar difiriendo la carga.
 */
export function Skeleton ({ alto, ancho }: { alto: number | string; ancho?: number | string }) {
  return (
    <span
      className="sk"
      style={{
        height: typeof alto === 'number' ? `${alto}px` : alto,
        width: ancho === undefined ? '100%' : typeof ancho === 'number' ? `${ancho}px` : ancho,
      }}
    />
  )
}

/** Varias filas iguales: listados, grilla de clases, tarjetas de plan. */
export function BloqueCargando ({
  filas,
  altoFila,
  etiqueta,
}: {
  filas: number
  altoFila: number
  /** Lo que se está cargando, para quien usa lector de pantalla. */
  etiqueta: string
}) {
  return (
    <div className="sk-bloque" role="status" aria-busy="true" aria-label={`Cargando ${etiqueta}`}>
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} alto={altoFila} />
      ))}
    </div>
  )
}

/**
 * Estado vacío o de error de una sección.
 *
 * La distinción no es cosmética: "todavía no hay clases publicadas" y "no
 * pudimos cargar las clases" mandan a hacer cosas distintas, y mostrar el
 * primero cuando pasó el segundo es mentirle a quien mira.
 */
export function EstadoSeccion ({
  tipo,
  titulo,
  detalle,
  children,
}: {
  tipo: 'vacio' | 'error'
  titulo: string
  detalle?: string
  /** Acción opcional: reintentar, escribir por WhatsApp, ver otra sede. */
  children?: ReactNode
}) {
  return (
    <div className={`estado estado--${tipo}`} role={tipo === 'error' ? 'alert' : undefined}>
      <p className="estado__titulo">{titulo}</p>
      {detalle !== undefined && <p className="estado__detalle">{detalle}</p>}
      {children !== undefined && <div className="estado__accion">{children}</div>}
    </div>
  )
}
