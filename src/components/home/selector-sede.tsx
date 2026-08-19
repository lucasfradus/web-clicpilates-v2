'use client'

import { useEffect, useState } from 'react'

import { getClases } from '@/lib/api/clases'
import { accionDeSede } from '@/lib/api/contacto'
import { hora } from '@/lib/formato'
import type { Sede } from '@/lib/api/tipos'

/**
 * El widget del hero: elegís estudio y ves lo que hay hoy ahí mismo.
 *
 * Es la pieza que conecta la portada con el backend — la diferencia entre un
 * folleto y un sitio que sabe lo que está pasando en el estudio. La consulta va
 * del lado del cliente porque cambia todo el tiempo y no aporta SEO.
 */
export function SelectorSede ({ sedes }: { sedes: Sede[] }) {
  const [slug, setSlug] = useState(sedes[0]?.slug ?? '')
  const sede = sedes.find((s) => s.slug === slug) ?? sedes[0]
  // El resultado guarda de qué sede es: así "cargando" se deduce comparando con
  // la sede elegida, sin tener que resetear el estado dentro del efecto.
  const [datos, setDatos] = useState<{ slug: string; resumen: string; hayLugar: boolean } | null>(null)

  useEffect(() => {
    if (sede == null) return
    let vigente = true

    void getClases(sede.id).then((r) => {
      if (!vigente) return

      if (r.estado !== 'ok') {
        setDatos({ slug: sede.slug, hayLugar: false, resumen: 'Escribinos y te pasamos los horarios' })
        return
      }

      const hoy = new Date().toDateString()
      const deHoy = r.clases.filter((c) => new Date(c.inicio).toDateString() === hoy)
      const proxima = deHoy[0] ?? r.clases[0]

      if (proxima == null) {
        setDatos({ slug: sede.slug, hayLugar: false, resumen: 'Sin lugares en los próximos días' })
        return
      }

      setDatos({
        slug: sede.slug,
        hayLugar: true,
        resumen: deHoy.length > 0
          ? `${deHoy.length} ${deHoy.length === 1 ? 'clase' : 'clases'} con lugar hoy · próxima ${hora(proxima.inicio)}`
          : `Próxima con lugar: ${hora(proxima.inicio)}`,
      })
    })

    return () => { vigente = false }
  }, [sede])

  if (sede == null) return null

  const accion = accionDeSede(sede)
  const alDia = datos?.slug === sede.slug ? datos : null

  return (
    <div className="book">
      <p className="eyebrow">Clase de prueba</p>
      <p className="book__title">Elegí tu estudio y mirá<br />las clases de hoy</p>

      <div className="book__field">
        <label className="book__label" htmlFor="selector-sede">Estudio</label>
        <select
          id="selector-sede"
          className="book__select"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        >
          {sedes.map((s) => (
            <option key={s.id} value={s.slug}>{s.nombre} · {s.ciudad}</option>
          ))}
        </select>
      </div>

      <p
        className={`book__peek${alDia == null || alDia.hayLugar ? '' : ' book__peek--vacio'}`}
        aria-live="polite"
      >
        {(alDia == null || alDia.hayLugar) && <span className="book__dot" aria-hidden="true" />}
        <span>{alDia?.resumen ?? 'Buscando lugares…'}</span>
      </p>

      <div style={{ marginTop: 18 }}>
        <a className="btn btn--primary btn--full" href={`/estudios/${sede.slug}`}>
          Ver horarios y reservar
        </a>
      </div>

      {accion != null && !accion.reserva && (
        <p className="book__note">
          Este estudio no toma reservas online todavía: se coordina por WhatsApp.
        </p>
      )}
    </div>
  )
}
