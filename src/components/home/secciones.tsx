import Link from 'next/link'

import { FotoFondo } from '@/components/foto-fondo'
import { FOTOS } from '@/lib/fotos'
import { SITIO } from '@/lib/site'

/**
 * Las secciones de marca de la home.
 *
 * Regla de copy en todo este archivo: **ningún número sin confirmar**. La
 * cantidad de estudios sale de la API; el 4.9 de Google, el máximo por clase y
 * los testimonios están pendientes de que el dueño los confirme, así que hasta
 * entonces no se publican (ver `tasks/todo.md`). Es preferible una web que dice
 * menos a una que dice algo que no podemos sostener.
 */

/** El manifiesto: la definición de CLIC, que es el activo de marca más fuerte. */
export function Manifiesto () {
  return (
    <section className="section manifesto" id="marca">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG de 1 KB usado como marca de agua; el optimizador no aporta nada */}
      <img className="manifesto__iso" src="/brand/iso.svg" alt="" aria-hidden="true" />
      <div className="container manifesto__in">
        <p className="eyebrow">La marca</p>
        <div className="manifesto__word">
          <h2>CLIC</h2>
          <span className="manifesto__pron">/klik/</span>
        </div>
        <div className="manifesto__rule" />
        <p className="manifesto__def">
          <b>Hacer el clic.</b> Momento de transformación en el que decidís priorizarte,
          conectar con tu cuerpo y reencontrarte a través del movimiento.
        </p>
        <p className="manifesto__foot">
          No le ponemos el nombre a un estudio: se lo ponemos a ese instante. Todo lo que
          hacemos —el método, los grupos chicos, los estudios, la app— existe para que ese
          clic te pase, y para que después te resulte fácil sostenerlo.
        </p>
      </div>
    </section>
  )
}

/** La banda con el claim, a tamaño de titular. */
export function Banda () {
  const repeticiones = Array.from({ length: 6 }, (_, i) => i)
  return (
    <div className="band" aria-hidden="true">
      <div className="band__track">
        {repeticiones.map((i) => (
          <span key={i} style={{ display: 'contents' }}>
            <span className={`band__word${i % 2 === 1 ? ' band__word--ghost' : ''}`}>
              {SITIO.claim}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- separador decorativo de 1 KB */}
            <img className="band__iso" src="/brand/iso.svg" alt="" />
          </span>
        ))}
      </div>
    </div>
  )
}

export function Metodo () {
  return (
    <section className="section" style={{ background: 'var(--surface)' }} id="metodo">
      <div className="container method">
        <div className="method__media" aria-hidden="true">
          <FotoFondo foto={FOTOS.metodo} sizes="(max-width: 1024px) 100vw, 40vw" />
        </div>
        <div>
          <p className="eyebrow">El método</p>
          <h2>Contrología, como fue pensada.</h2>
          <p className="method__intro">
            Trabajamos Pilates Clásico: el orden original de los ejercicios, la respiración
            que los sostiene y la progresión que Joseph Pilates diseñó. No es una clase de
            moda con música fuerte — es una práctica precisa que se vuelve tuya.
          </p>
          <div className="method__list">
            <div className="method__item">
              <p className="method__num">01</p>
              <div>
                <h3>Grupos chicos</h3>
                <p>
                  La instructora te ve. Corrige postura, ajusta resortes y adapta el
                  ejercicio a tu cuerpo, clase por clase.
                </p>
              </div>
            </div>
            <div className="method__item">
              <p className="method__num">02</p>
              <div>
                <h3>Instructoras de nuestra academy</h3>
                <p>
                  Todas se forman en CLIC Academy y siguen capacitándose. El mismo criterio
                  en todos los estudios.
                </p>
              </div>
            </div>
            <div className="method__item">
              <p className="method__num">03</p>
              <div>
                <h3>Progresión real</h3>
                <p>
                  Empezás en Initial y pasás a Level Up cuando el cuerpo está listo, no
                  cuando pasan los meses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Niveles () {
  return (
    <section className="section" id="niveles">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Niveles</p>
          <h2>Dos formas de entrar.</h2>
          <p>No hace falta experiencia previa. Hace falta empezar por el lugar correcto.</p>
        </div>
        <div className="levels">
          <article className="level level--a">
            <p className="eyebrow">Para arrancar</p>
            <h3>Initial Pilates</h3>
            <p>
              La base del método a un ritmo que te deja entender cada movimiento. Ideal si
              nunca hiciste reformer o volvés después de una pausa larga.
            </p>
            <ul>
              <li>Sin experiencia previa</li>
              <li>Foco en técnica y respiración</li>
              <li>Corrección individual</li>
            </ul>
            <div className="level__foot">
              <Link className="btn btn--ghost" href="/estudios">Ver estudios</Link>
            </div>
          </article>

          <article className="level level--b">
            <p className="eyebrow eyebrow--light">Para seguir</p>
            <h3>Level Up Pilates</h3>
            <p>
              Secuencias más largas, más carga y menos pausas. Entrás cuando tu instructora
              ve que la base está sólida.
            </p>
            <ul>
              <li>Requiere base de Initial</li>
              <li>Mayor intensidad y fluidez</li>
              <li>Repertorio intermedio y avanzado</li>
            </ul>
            <div className="level__foot">
              <Link className="btn btn--light" href="/estudios">Ver horarios</Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export function AppMovil () {
  return (
    <section className="section app">
      <div className="container app__grid">
        <div>
          <p className="eyebrow eyebrow--light">App iOS y Android</p>
          <h2>Tu cuenta, en el bolsillo.</h2>
          <p>
            Reservás, cancelás, ves tus créditos y tu historial. Lo mismo que hacés en la
            web, sin abrir el navegador.
          </p>
          {/* Sin links: todavía no tenemos las URLs de las tiendas (tasks/todo.md).
              Un botón que no lleva a ningún lado es peor que no tenerlo. */}
          <div className="app__badges">
            <span className="badge"><span><small>Descargar en</small><b>App Store</b></span></span>
            <span className="badge"><span><small>Disponible en</small><b>Google Play</b></span></span>
          </div>
        </div>
        <div />
      </div>
    </section>
  )
}

export function AcademyYFranquicias () {
  return (
    <section className="section">
      <div className="container split">
        <Link className="card-cta" href="/academy">
          <div className="card-cta__bg" style={{ background: 'linear-gradient(140deg,#c9b39a,#6f6558)' }} />
          <p className="eyebrow eyebrow--light">CLIC Academy</p>
          <h2>Formate como instructora de Pilates Clásico.</h2>
          <p>Certificación con práctica real en nuestros estudios y salida laboral en la red CLIC.</p>
          <div className="card-cta__foot">
            <span className="btn btn--ghost-light btn--sm">Conocer la formación</span>
          </div>
        </Link>

        <Link className="card-cta" href="/franquicias">
          <div className="card-cta__bg" style={{ background: 'linear-gradient(140deg,#8d8a86,#2c2f34)' }}>
            <FotoFondo foto={FOTOS.franquicias} sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <p className="eyebrow eyebrow--light">Franquicias</p>
          <h2>Abrí tu CLIC.</h2>
          <p>
            Modelo probado, manual operativo, exclusividad territorial y el mismo sistema de
            gestión que usamos nosotros.
          </p>
          <div className="card-cta__foot">
            <span className="btn btn--ghost-light btn--sm">Ver la oportunidad</span>
          </div>
        </Link>
      </div>
    </section>
  )
}
