import { pesos } from '@/lib/formato'

/**
 * Cómo funciona la clase de prueba.
 *
 * Es el mejor argumento comercial del negocio y hoy no está en ningún lado de
 * la web: se abona al reservar —eso deja el lugar tomado— y si la persona
 * sigue, ese valor se descuenta del plan. En la práctica, probar sale gratis
 * si te quedás.
 */
export function BloquePrueba ({ nombreSede, precioPrueba }: {
  /** Sin nombre, el texto habla en general: es el caso de la home. */
  nombreSede?: string
  precioPrueba: number | null
}) {
  return (
    <div className="trial">
      <div className="trial__step">
        <p className="trial__num">01</p>
        <h3>Reservás tu clase de prueba</h3>
        <p>
          La abonás al reservar{precioPrueba == null
            ? ''
            : nombreSede != null
              ? ` — ${pesos(precioPrueba)} en ${nombreSede}`
              : `, desde ${pesos(precioPrueba)}`}.
          Eso deja tu lugar tomado: no es una seña que se pierde ni una lista de espera.
        </p>
      </div>
      <div className="trial__step">
        <p className="trial__num">02</p>
        <h3>Venís y probás</h3>
        <p>
          Una clase completa de reformer, con la instructora que te va a acompañar después.
          Si no es para vos, ahí termina.
        </p>
      </div>
      <div className="trial__step trial__step--hl">
        <p className="trial__num">03</p>
        <h3>Si seguís, no la pagás dos veces</h3>
        <p>
          El valor de la clase de prueba se descuenta del plan que elijas.
          En la práctica, probar te sale gratis si te quedás.
        </p>
      </div>
    </div>
  )
}
