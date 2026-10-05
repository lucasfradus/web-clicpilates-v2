import type { Metadata } from 'next'
import Link from 'next/link'

import { BotonCalendario } from '@/components/checkout/boton-calendario'
import { MedirCompra } from '@/components/checkout/medir-compra'
import { fechaYHora, pesos } from '@/lib/formato'
import { NOINDEX } from '@/lib/site'

/**
 * La vuelta de Mercado Pago.
 *
 * Todo lo que muestra viene en la URL, puesto por el backend al armar la
 * preferencia (`RESERVAS_PUBLIC_URL` define la base) más lo que agrega Mercado
 * Pago al volver. No hay ninguna llamada: no hace falta, y además esta página se
 * abre justo cuando la persona está más ansiosa por confirmar que su plata llegó
 * a algún lado.
 *
 * **No confirma nada por sí sola.** Quien da de alta al alumno es el webhook del
 * backend, que escucha a Mercado Pago. Esto es el acuse de recibo.
 */

export const metadata: Metadata = {
  title: 'Gracias',
  robots: { index: false, follow: false },
}

/** Todo lo que no sea aprobado o rechazado es "pendiente". */
function estadoDe (valor: string | null): 'aprobado' | 'rechazado' | 'pendiente' {
  if (valor === 'approved') return 'aprobado'
  if (valor === 'rejected') return 'rechazado'
  return 'pendiente'
}

function uno (v: string | string[] | undefined): string | null {
  const valor = Array.isArray(v) ? v[0] : v
  return valor != null && valor !== '' ? valor : null
}

export default async function Gracias ({ searchParams }: PageProps<'/reservar/gracias'>) {
  const p = await searchParams

  const estado = estadoDe(uno(p.collection_status) ?? uno(p.status))
  const esPlan = uno(p.tipo) === 'plan'

  const sede = uno(p.sede) ?? 'CLIC'
  const sedeSlug = uno(p.sedeSlug)
  const actividad = uno(p.actividad)
  const fecha = uno(p.fecha)
  const direccion = uno(p.direccion)
  const whatsapp = uno(p.whatsapp)
  const plan = uno(p.plan)
  const precio = Number(uno(p.precio))
  const importe = Number.isFinite(precio) && precio > 0 ? precio : null
  const pagoId = uno(p.payment_id) ?? uno(p.collection_id)

  // El checkout de plan no manda actividad ni fecha: ahí no hay una clase
  // reservada todavía, se reservan después desde la app.
  const hayClase = actividad != null && fecha != null && !Number.isNaN(Date.parse(fecha))

  if (estado === 'rechazado') {
    return (
      <Pantalla
        titulo="El pago no se procesó"
        detalle="No se hizo ningún cargo. Podés intentar de nuevo con otro medio de pago."
      >
        <Link className="btn btn--primary" href="/reservar">Volver a intentar</Link>
      </Pantalla>
    )
  }

  if (estado === 'pendiente') {
    return (
      <Pantalla
        titulo="Tu pago está pendiente"
        detalle={
          'Mercado Pago todavía no lo confirmó. Apenas lo haga te llega el mail con tu ' +
          'reserva — no hace falta que lo pagues de nuevo.'
        }
      >
        {whatsapp != null && (
          <a className="btn btn--ghost" href={whatsapp} target="_blank" rel="noreferrer">
            Escribinos por WhatsApp
          </a>
        )}
      </Pantalla>
    )
  }

  return (
    <Pantalla
      titulo={esPlan ? '¡Ya sos parte de CLIC!' : '¡Reserva confirmada!'}
      detalle={
        esPlan
          ? 'Te mandamos el comprobante por mail. Desde la app reservás tus clases.'
          : 'Te mandamos el detalle por mail. Te esperamos en el estudio.'
      }
    >
      <dl className="ckt__filas ckt__filas--claro">
        {esPlan && plan != null && (
          <div><dt>Plan</dt><dd>{plan}</dd></div>
        )}
        {hayClase && (
          <>
            <div><dt>Clase</dt><dd>{actividad}</dd></div>
            <div><dt>Cuándo</dt><dd>{fechaYHora(fecha)}</dd></div>
          </>
        )}
        <div><dt>Estudio</dt><dd>CLIC {sede}{direccion != null ? ` · ${direccion}` : ''}</dd></div>
        {importe != null && (
          <div><dt>Pagaste</dt><dd>{pesos(importe)}</dd></div>
        )}
      </dl>

      <div className="ckt__acciones">
        {hayClase && (
          <BotonCalendario
            actividad={actividad}
            inicio={fecha}
            sede={sede}
            direccion={direccion}
            paymentId={pagoId}
          />
        )}
        {whatsapp != null && (
          <a className="btn btn--ghost btn--sm" href={whatsapp} target="_blank" rel="noreferrer">
            Escribinos por WhatsApp
          </a>
        )}
      </div>

      <p className="ckt__legal">
        {esPlan
          ? 'Descargá la app de CLIC para reservar tus clases.'
          : 'Si es tu primera vez: llegá 10 minutos antes y vení con medias antideslizantes.'}
      </p>

      {pagoId != null && (
        <MedirCompra
          tipo={esPlan ? 'Subscription' : 'Trial'}
          nombre={esPlan ? plan ?? 'Plan' : actividad ?? 'Clase de prueba'}
          sede={sede}
          sedeSlug={sedeSlug}
          precio={importe}
          transactionId={pagoId}
          eventID={uno(p.event_id) ?? undefined}
          activo={!NOINDEX}
        />
      )}
    </Pantalla>
  )
}

function Pantalla ({ titulo, detalle, children }: {
  titulo: string
  detalle: string
  children?: React.ReactNode
}) {
  return (
    <section className="section">
      <div className="container ckt__gracias">
        <h1>{titulo}</h1>
        <p className="ckt__gracias-detalle">{detalle}</p>
        {children}
      </div>
    </section>
  )
}
