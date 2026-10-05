import type { Metadata } from 'next'

import { EstadoSeccion } from '@/components/estados'
import { Migas } from '@/components/migas'
import { TarjetaSede } from '@/components/sede/tarjeta-sede'
import { getSedes } from '@/lib/api/sedes'

// Next exige que este valor sea un literal analizable estáticamente: no acepta
// una constante importada. Tiene que coincidir con REVALIDAR de src/lib/api.
export const revalidate = 3600

const MIGAS = [{ nombre: 'Inicio', href: '/' }, { nombre: 'Reservar' }]

/**
 * Primer paso de la reserva: elegir el estudio.
 *
 * Esta página y las de abajo reemplazan al portal que hasta ahora se servía por
 * rewrite. La diferencia que importa no es técnica: el portal dibujaba su propio
 * header y footer, así que a la persona le parecía haberse ido del sitio justo
 * en el momento de pagar.
 *
 * Va con `noindex` desde `robots.ts`: es un embudo, no contenido. Quien busca
 * un estudio tiene que caer en `/estudios/<slug>`, que sí está pensada para eso.
 */
export const metadata: Metadata = {
  title: 'Reservar tu clase de prueba',
  description: 'Elegí el estudio donde querés entrenar y reservá tu clase de prueba.',
  alternates: { canonical: '/reservar' },
}

export default async function Reservar () {
  const sedes = await getSedes()
  const reservables = (sedes ?? []).filter((s) => s.reservaOnline)

  return (
    <>
      <section className="subhero">
        <div className="container subhero__in">
          <Migas migas={MIGAS} />
          <p className="eyebrow eyebrow--light" style={{ marginTop: 26 }}>Clase de prueba</p>
          <h1>¿Dónde querés entrenar?</h1>
          <p>
            Elegí tu estudio y mirá las clases con lugar. Los cupos salen del mismo sistema
            con el que trabaja el equipo: lo que ves acá es lo que hay.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {sedes === null && (
            <EstadoSeccion
              tipo="error"
              titulo="No pudimos cargar los estudios"
              detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
            />
          )}

          {/* Una sede sin venta online no puede cobrar, así que no se puede
              reservar en ella: mostrarla acá sería un callejón sin salida. Su
              landing sigue existiendo, con WhatsApp como salida. */}
          {sedes != null && reservables.length === 0 && (
            <EstadoSeccion
              tipo="vacio"
              titulo="Ningún estudio está tomando reservas online"
              detalle="Escribinos por WhatsApp desde la página del estudio y te ayudamos."
            />
          )}

          {reservables.length > 0 && (
            <div className="sedes">
              {reservables.map((sede, i) => (
                <TarjetaSede
                  key={sede.id}
                  sede={sede}
                  prioridad={i < 3}
                  href={`/reservar/sede/${sede.slug}`}
                  cta="Ver clases"
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
