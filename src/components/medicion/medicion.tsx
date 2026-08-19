'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { ga4PageView } from '@/lib/medicion/ga4'
import { iniciarPixels, metaPageView } from '@/lib/medicion/meta'
import { capturarUtms, conUtms } from '@/lib/medicion/utm'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const PIXEL_GENERAL = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Carga y arranque de la medición.
 *
 * Va en el layout, con el mapa de pixels por sede que arma el servidor: así no
 * hay que pedir las sedes de nuevo desde el navegador sólo para saber a qué
 * pixel mandar el evento.
 *
 * **En staging no se carga nada.** Un deploy de pruebas mandando eventos a las
 * cuentas reales ensucia justo los números con los que se decide la pauta.
 */
export function Medicion ({ pixelesPorSede, activo }: {
  pixelesPorSede: Record<string, string>
  activo: boolean
}) {
  const pathname = usePathname()
  const iniciado = useRef(false)

  useEffect(() => {
    if (!activo) return
    capturarUtms(window.location.search)

    // El checkout vive en otro SPA: si las UTMs no cruzan, la venta aparece
    // como directa. En vez de tocar cada CTA del sitio, se resuelve en el
    // click, que es el único momento en que hay que saberlo.
    const alClickear = (e: MouseEvent) => {
      const enlace = (e.target as HTMLElement | null)?.closest?.('a')
      if (enlace == null) return
      const href = enlace.getAttribute('href')
      if (href == null || !href.startsWith('/reservar')) return
      enlace.setAttribute('href', conUtms(href))
    }

    document.addEventListener('click', alClickear, { capture: true })
    return () => document.removeEventListener('click', alClickear, { capture: true })
  }, [activo])

  useEffect(() => {
    if (!activo) return

    if (!iniciado.current) {
      iniciarPixels(pixelesPorSede)
      iniciado.current = true
    }

    // La sede sale de la ruta: es la única pantalla donde el evento pertenece a
    // una cuenta publicitaria concreta.
    const slug = pathname.match(/^\/estudios\/([^/]+)/)?.[1]
    metaPageView(slug)
    ga4PageView({ sedeSlug: slug })
  }, [activo, pathname, pixelesPorSede])

  if (!activo) return null

  return (
    <>
      {PIXEL_GENERAL != null && PIXEL_GENERAL !== '' && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');`}
        </Script>
      )}

      {GA_ID != null && GA_ID !== '' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
window.gtag=gtag;gtag('js',new Date());
gtag('config','${GA_ID}',{send_page_view:false});`}
          </Script>
        </>
      )}
    </>
  )
}
