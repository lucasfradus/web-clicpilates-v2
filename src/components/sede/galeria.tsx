import Image from 'next/image'

import type { FotoSede } from '@/lib/api/tipos'

/**
 * Galería del estudio. Cada foto se recorta respetando su punto focal, que el
 * backend guarda por imagen — sin eso, en mobile los recortes cortan mal.
 */
export function Galeria ({ fotos, nombreSede }: { fotos: FotoSede[]; nombreSede: string }) {
  if (fotos.length === 0) return null

  return (
    <div className="galeria">
      {fotos.map((foto, i) => (
        <div key={foto.url} className="galeria__foto">
          <Image
            src={foto.url}
            alt={`Estudio CLIC ${nombreSede}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectFit: 'cover', objectPosition: `${foto.foco.x}% ${foto.foco.y}%` }}
            priority={i === 0}
          />
        </div>
      ))}
    </div>
  )
}
