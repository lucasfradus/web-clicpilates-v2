import { Logo } from '@/components/brand/logo'
import { Enlace } from '@/components/enlace'
import { NAV_FOOTER } from '@/lib/nav'
import { SITIO } from '@/lib/site'

type Sede = { slug: string; nombre: string }

/**
 * Footer del sitio.
 *
 * La columna de estudios recibe las sedes por props en vez de pedirlas acá:
 * el cliente de API con ISR llega en la fase 2, y mientras tanto el footer no
 * inventa una lista hardcodeada que después haya que salir a cazar. Sin sedes,
 * la columna es un solo enlace al índice.
 */
export function SiteFooter ({ sedes = [] }: { sedes?: Sede[] }) {
  const anio = new Date().getFullYear()

  return (
    <footer className="ftr">
      <div className="container">
        <div className="ftr__grid">
          <div>
            <Logo className="ftr__logo" titulo={SITIO.nombre} />
            <p className="ftr__bio">
              Pilates Clásico en nueve estudios de Buenos Aires. Reformer en grupos chicos,
              instructoras formadas en casa.
            </p>
          </div>

          <div>
            <h2>Explorar</h2>
            <div className="ftr__list">
              {NAV_FOOTER.map(enlace => (
                <Enlace key={enlace.href} href={enlace.href} spa={enlace.spa}>
                  {enlace.label}
                </Enlace>
              ))}
            </div>
          </div>

          <div>
            <h2>Estudios</h2>
            <div className="ftr__list">
              {sedes.length > 0
                ? sedes.map(sede => (
                  <Enlace key={sede.slug} href={`/estudios/${sede.slug}`}>{sede.nombre}</Enlace>
                ))
                : <Enlace href="/estudios">Ver los nueve estudios</Enlace>}
            </div>
          </div>

          <div>
            <h2>Seguinos</h2>
            <div className="ftr__list">
              <a href={SITIO.redes.instagram} target="_blank" rel="noreferrer">Instagram</a>
              <a href={SITIO.redes.tiktok} target="_blank" rel="noreferrer">TikTok</a>
            </div>
          </div>
        </div>

        <div className="ftr__bottom">
          <span>© {anio} {SITIO.nombre}</span>
          <Enlace href="/politicas">Políticas de uso y privacidad</Enlace>
        </div>
      </div>
    </footer>
  )
}
