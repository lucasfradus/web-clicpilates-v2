'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Logo } from '@/components/brand/logo'
import { Enlace } from '@/components/enlace'
import { MI_CUENTA, NAV_PRINCIPAL, RESERVAR } from '@/lib/nav'
import { SITIO } from '@/lib/site'

/**
 * Header fijo, con menú mobile.
 *
 * Es componente de cliente sólo por dos cosas: la clase `--scrolled` y el
 * estado abierto del menú. Que el header sea transparente o sólido según la
 * página tenga o no hero lo resuelve el CSS con `:has([data-hero])`, así el
 * HTML del servidor ya sale pintado bien y no parpadea al hidratar.
 */
export function SiteHeader () {
  const [scrolleado, setScrolleado] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const alScrollear = () => setScrolleado(window.scrollY > 60)
    alScrollear() // recarga a media página: el estado tiene que arrancar bien
    window.addEventListener('scroll', alScrollear, { passive: true })
    return () => window.removeEventListener('scroll', alScrollear)
  }, [])

  useEffect(() => {
    if (!menuAbierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', alTeclear)
    }
  }, [menuAbierto])

  const esActivo = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const cerrarMenu = () => setMenuAbierto(false)

  return (
    <>
      <header className={`hdr${scrolleado ? ' hdr--scrolled' : ''}`}>
        <div className="container hdr__inner">
          <Link href="/" className="hdr__brand" aria-label={`${SITIO.nombre} — inicio`}>
            <Logo className="hdr__logo" />
            <span className="hdr__tag">studio pilates</span>
          </Link>

          <nav className="hdr__nav" aria-label="Principal">
            {NAV_PRINCIPAL.map(enlace => (
              <Enlace
                key={enlace.href}
                href={enlace.href}
                spa={enlace.spa}
                className="hdr__link"
                aria-current={esActivo(enlace.href) ? 'page' : undefined}
              >
                {enlace.label}
              </Enlace>
            ))}
          </nav>

          <div className="hdr__actions">
            <a href={MI_CUENTA} className="hdr__login">Ingresar</a>
            <a href={RESERVAR} className="btn btn--sm hdr__cta">Clase de prueba</a>
            <button
              type="button"
              className="hdr__burger"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              aria-controls="menu-mobile"
              onClick={() => setMenuAbierto(true)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div id="menu-mobile" className={`mnav${menuAbierto ? ' mnav--open' : ''}`} inert={!menuAbierto}>
        <div className="mnav__top">
          <Logo className="mnav__logo" />
          <button type="button" className="mnav__close" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)}>
            &times;
          </button>
        </div>

        {/* Navegar cierra el menú: el link cambia de página sin desmontarlo. */}
        <nav className="mnav__list" aria-label="Principal (mobile)" onClick={cerrarMenu}>
          {NAV_PRINCIPAL.map(enlace => (
            <Enlace key={enlace.href} href={enlace.href} spa={enlace.spa}>
              {enlace.label}
            </Enlace>
          ))}
        </nav>

        <div className="mnav__foot" onClick={cerrarMenu}>
          <a href={RESERVAR} className="btn btn--light btn--full">Reservá tu clase de prueba</a>
          <a href={MI_CUENTA} className="btn btn--ghost-light btn--full">Ingresar a mi cuenta</a>
        </div>
      </div>
    </>
  )
}
