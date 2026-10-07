import Image from 'next/image'

import { SITIO } from '@/lib/site'

/**
 * Las piezas de la app propia que se repiten en la home y en franquicias.
 *
 * Las capturas salen de las de la App Store, recortadas a la pantalla con
 * `scripts/preparar-capturas-app.mjs`. Si cambian en la tienda, se vuelve a
 * correr el script y acá no se toca nada.
 */

export function BadgesTiendas () {
  return (
    <div className="app__badges">
      <a className="badge" href={SITIO.apps.ios} target="_blank" rel="noreferrer">
        <span><small>Descargar en</small><b>App Store</b></span>
      </a>
      <a className="badge" href={SITIO.apps.android} target="_blank" rel="noreferrer">
        <span><small>Disponible en</small><b>Google Play</b></span>
      </a>
    </div>
  )
}

// 1010×2186 en el original: la proporción de la pantalla recortada.
const ANCHO = 600
const ALTO = 1299

/** Dos pantallas reales de la app, una delante de la otra. */
export function TelefonosApp () {
  return (
    <div className="telefonos">
      <figure className="telefono telefono--atras">
        <Image
          src="/fotos/app/home.webp"
          alt="Inicio de la app de CLIC: tu próxima clase y el acceso con QR"
          width={ANCHO}
          height={ALTO}
          sizes="(max-width: 900px) 45vw, 240px"
        />
      </figure>
      <figure className="telefono telefono--frente">
        <Image
          src="/fotos/app/agenda.webp"
          alt="Agenda de la app de CLIC: las clases del día con su disponibilidad"
          width={ANCHO}
          height={ALTO}
          sizes="(max-width: 900px) 45vw, 240px"
        />
      </figure>
    </div>
  )
}
