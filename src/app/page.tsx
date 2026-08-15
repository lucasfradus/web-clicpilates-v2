import Link from 'next/link'

import { RESERVAR } from '@/lib/nav'
import { SITIO } from '@/lib/site'

/**
 * Home.
 *
 * Fase 1: sólo el hero, que es lo que el esqueleto necesita para probarse — el
 * header transparente se apoya en él (`data-hero`) y el footer cierra abajo.
 * El contenido de marca (manifiesto CLIC, método, niveles, testimonios, grilla
 * de sedes, selector con disponibilidad real) es la fase 4.
 */
export default function Home () {
  return (
    <section className="hero" data-hero>
      <div className="hero__media" aria-hidden="true" />
      <div className="container hero__inner">
        <p className="eyebrow eyebrow--light">Pilates Clásico · Buenos Aires</p>
        <h1>{SITIO.claim}</h1>
        <p className="hero__sub">
          Reformer en grupos de hasta ocho personas, en nueve estudios. Reservá tu clase de
          prueba y empezá esta semana.
        </p>
        <div className="hero__acciones">
          <a className="btn btn--light" href={RESERVAR}>Reservar clase de prueba</a>
          <Link className="btn btn--ghost-light" href="/estudios">Ver los estudios</Link>
        </div>
      </div>
    </section>
  )
}
