import Image from 'next/image'
import Link from 'next/link'

import { pesos } from '@/lib/formato'
import type { Sede } from '@/lib/api/tipos'
import { zonaDe } from '@/lib/zona'

/**
 * Tarjeta de sede del índice.
 *
 * La foto usa `imagenFoco` como `object-position`: el backend guarda el punto
 * focal de cada imagen justamente para que el recorte no le corte la cabeza a
 * nadie en mobile.
 */
export function TarjetaSede ({ sede, prioridad = false }: { sede: Sede; prioridad?: boolean }) {
  return (
    <Link className="sede" href={`/estudios/${sede.slug}`}>
      <div className="sede__media">
        {sede.imagenUrl != null && (
          <Image
            src={sede.imagenUrl}
            alt={`Estudio CLIC ${sede.nombre}`}
            fill
            priority={prioridad}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover', objectPosition: `${sede.imagenFoco.x}% ${sede.imagenFoco.y}%` }}
          />
        )}
        <span className="sede__tagcity">{zonaDe(sede)}</span>
      </div>

      <div className="sede__body">
        <p className="eyebrow">Reformer clásico</p>
        <p className="sede__name">{sede.nombre}</p>
        <p className="sede__addr">{sede.direccion}, {sede.ciudad}</p>
        <div className="sede__foot">
          <div>
            <p className="eyebrow">Clase de prueba</p>
            <p className="sede__price">{pesos(sede.precioPrueba)}</p>
          </div>
          <span className="sede__cta">Ver horarios →</span>
        </div>
      </div>
    </Link>
  )
}
