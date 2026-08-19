import type { Metadata, Viewport } from 'next'
import { Poppins, Prata } from 'next/font/google'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { NOINDEX, SITIO } from '@/lib/site'
import '@/styles/globals.css'

/* Poppins no es variable: hay que pedir los pesos. 300 es la voz "display" del
   sistema (números, importes, horarios) y 600 la de los botones. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const prata = Prata({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-prata',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: {
    default: SITIO.titulo,
    template: `%s · ${SITIO.nombre}`,
  },
  description: SITIO.descripcion,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: SITIO.locale,
    siteName: SITIO.nombre,
    title: SITIO.titulo,
    description: SITIO.descripcion,
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  robots: NOINDEX ? { index: false, follow: false } : undefined,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Sin `maximumScale`: bloquear el pinch-zoom es el error de accesibilidad que
  // arrastra el sitio actual (fase 0 del plan). No volver a ponerlo.
}

export default function RootLayout ({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={`${poppins.variable} ${prata.variable}`}>
      <body>
        {/* Los reveals arrancan invisibles y los muestra un IntersectionObserver.
            Sin JavaScript no habría quien los muestre: esta regla los deja
            visibles desde el principio. */}
        <noscript>
          <style>{'.rv{opacity:1;transform:none}'}</style>
        </noscript>
        <a className="skip" href="#contenido">Saltar al contenido</a>
        <SiteHeader />
        <main id="contenido">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
