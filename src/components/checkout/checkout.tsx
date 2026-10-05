'use client'

import { useEffect, useMemo, useState } from 'react'

import { ElegirClase } from '@/components/checkout/elegir-clase'
import { ElegirHorarios } from '@/components/checkout/elegir-horarios'
import { Formulario } from '@/components/checkout/formulario'
import { Resumen } from '@/components/checkout/resumen'
import { EstadoSeccion } from '@/components/estados'
import type { ResultadoClases } from '@/lib/api/clases'
import { checkoutPlan, checkoutPrueba, mensajeDeError } from '@/lib/api/checkout'
import { getHorarios, type ResultadoHorarios } from '@/lib/api/horarios'
import type { CatalogoSede, Clase, Sede } from '@/lib/api/tipos'
import {
  esSoloPack,
  precioCheckout,
  validar,
  variantePlan,
  type DatosComprador,
  type ErroresComprador,
} from '@/lib/checkout/reglas'
import { idsDeMeta } from '@/lib/medicion/meta'

/**
 * El checkout: elegir qué se compra, dejar los datos y salir a Mercado Pago.
 *
 * Dos ramas que comparten el último paso:
 *
 * - **prueba** — elegir la clase → datos. Tocar una clase avanza directo, sin
 *   confirmación: agregar un "continuar" ahí sólo suma un click a la decisión
 *   que la persona ya tomó.
 * - **plan** — elegir modalidad (horarios fijos o pack) → elegir los horarios
 *   si corresponde → datos.
 *
 * El modo se decide una sola vez, al entrar: con `?tipo=` es una compra de
 * plan, sin él una clase de prueba. No hay forma de cambiar de rama sin volver
 * a la landing del estudio, y es a propósito: quien llegó a esta página ya
 * eligió qué quiere.
 */

type Paso = 1 | 2
type Modalidad = 'fijo' | 'flex'

const DATOS_VACIOS: DatosComprador = {
  nombre: '', apellido: '', email: '', telefono: '', dni: '',
}

export function Checkout ({ sede, catalogo, clases, tipoId }: {
  sede: Sede
  catalogo: CatalogoSede | null
  clases: ResultadoClases
  /** `CatalogoTipoPlan.id`. Con él la rama es "comprar un plan". */
  tipoId: number | null
}) {
  const tipos = useMemo(() => catalogo?.tipos ?? [], [catalogo])
  const tipo = useMemo(
    () => tipos.find((t) => t.id === tipoId) ?? null,
    [tipos, tipoId],
  )
  // Un `?tipo=` que no matchea —plan dado de baja, o de otra sede— cae en la
  // rama de prueba en vez de romper: la página sigue sirviendo para algo.
  const modo: 'plan' | 'prueba' = tipo != null ? 'plan' : 'prueba'

  const [paso, setPaso] = useState<Paso>(1)
  const [modalidad, setModalidad] = useState<Modalidad | null>(
    esSoloPack(tipo) ? 'flex' : null,
  )
  const [claseElegida, setClaseElegida] = useState<Clase | null>(null)
  const [horarioIds, setHorarioIds] = useState<number[]>([])
  // Guardado junto al plan para el que se pidió. Así "está cargando" se deduce
  // de que lo guardado no corresponde a lo que hace falta ahora, en vez de
  // tener que ponerlo en `cargando` a mano desde el efecto.
  const [cargados, setCargados] = useState<{ planId: number; resultado: ResultadoHorarios } | null>(null)

  const [datos, setDatos] = useState<DatosComprador>(DATOS_VACIOS)
  const [errores, setErrores] = useState<ErroresComprador>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  const flex = modalidad === 'flex'
  const necesarios = flex ? 0 : tipo?.fijo.ingresosPorSemana ?? 1
  const precio = modo === 'prueba' ? sede.precioPrueba : precioCheckout(tipo, flex)

  // Los horarios fijables sólo existen para un plan de horario fijo, y se piden
  // recién cuando la modalidad está elegida: antes no se sabe si hacen falta.
  // Siempre con el `planId` del plan fijo — en modalidad pack el endpoint
  // responde 404 y eso ya es la respuesta correcta.
  const planIdHorarios = modo === 'plan' && modalidad != null && tipo != null
    ? tipo.fijo.planId
    : null

  useEffect(() => {
    if (planIdHorarios == null) return
    let cancelado = false
    getHorarios(sede.id, planIdHorarios).then((resultado) => {
      if (!cancelado) setCargados({ planId: planIdHorarios, resultado })
    })
    return () => { cancelado = true }
  }, [planIdHorarios, sede.id])

  const horarios: ResultadoHorarios | 'cargando' =
    cargados != null && cargados.planId === planIdHorarios ? cargados.resultado : 'cargando'

  const completo = modo === 'prueba'
    ? claseElegida != null
    : flex || (necesarios > 0 && horarioIds.length === necesarios)

  function elegirClase (clase: Clase) {
    setClaseElegida(clase)
    setPaso(2)
  }

  function volver () {
    setErrorEnvio(null)
    if (paso === 2) { setPaso(1); return }
    // Desde el primer paso de un plan, atrás es deshacer la modalidad.
    if (modo === 'plan' && modalidad != null && !esSoloPack(tipo)) {
      setModalidad(null)
      setHorarioIds([])
    }
  }

  async function pagar () {
    const erroresDatos = validar(datos)
    setErrores(erroresDatos)
    if (Object.keys(erroresDatos).length > 0) return

    setEnviando(true)
    setErrorEnvio(null)

    const persona = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim(),
      telefono: datos.telefono.trim(),
      dni: datos.dni.trim(),
      ...idsDeMeta(),
    }

    try {
      if (modo === 'prueba') {
        if (claseElegida == null) return
        const { initPoint } = await checkoutPrueba({
          claseId: claseElegida.id, sedeId: sede.id, ...persona,
        })
        // `enviando` queda en true a propósito: el botón sigue diciendo que
        // está redirigiendo hasta que el navegador se va.
        window.location.href = initPoint
      } else {
        if (tipo == null) return
        const { initPoint } = await checkoutPlan({
          sedeId: sede.id,
          planId: variantePlan(tipo, flex).planId,
          medio: 'online',
          ...(flex ? {} : { horarioIds }),
          ...persona,
        })
        window.location.href = initPoint
      }
    } catch (error) {
      setEnviando(false)
      setErrorEnvio(mensajeDeError(error))
      // Una clase que se llenó o desapareció obliga a volver a elegir: dejar a
      // la persona en el formulario con un error que no puede resolver desde
      // ahí es un callejón sin salida.
      if (modo === 'prueba') {
        const estado = (error as { estado?: number | null }).estado
        if (estado === 409 || estado === 404) { setClaseElegida(null); setPaso(1) }
      }
    }
  }

  if (modo === 'plan' && catalogo == null) {
    return (
      <section className="section">
        <div className="container">
          <EstadoSeccion
            tipo="error"
            titulo="No pudimos cargar los planes de este estudio"
            detalle="Es un problema nuestro, no tuyo. Probá recargar en un minuto."
          />
        </div>
      </section>
    )
  }

  const titulo = modo === 'prueba'
    ? 'Elegí tu clase de prueba'
    : tipo?.etiqueta || tipo?.nombre || 'Tu plan'

  return (
    <section className="section ckt">
      <div className="container">
        <div className="ckt__head">
          <a className="back" href={`/estudios/${sede.slug}`}>← Volver al estudio</a>
          <p className="eyebrow" style={{ marginTop: 18 }}>CLIC {sede.nombre}</p>
          <h1 className="ckt__title">{titulo}</h1>
        </div>

        <div className="ckt__grid">
          <div className="ckt__main">
            {paso === 1 && modo === 'prueba' && (
              <ElegirClase
                clases={clases}
                sede={sede}
                elegida={claseElegida}
                alElegir={elegirClase}
              />
            )}

            {paso === 1 && modo === 'plan' && tipo != null && (
              <ElegirHorarios
                tipo={tipo}
                modalidad={modalidad}
                alElegirModalidad={(m) => { setModalidad(m); setHorarioIds([]) }}
                horarios={horarios}
                elegidos={horarioIds}
                alCambiar={setHorarioIds}
                necesarios={necesarios}
                completo={completo}
                alContinuar={() => setPaso(2)}
                whatsappUrl={sede.whatsappUrl}
              />
            )}

            {paso === 2 && (
              <Formulario
                datos={datos}
                errores={errores}
                enviando={enviando}
                errorEnvio={errorEnvio}
                alCambiar={(campo, valor) => {
                  setDatos((d) => ({ ...d, [campo]: valor }))
                  setErrores((e) => ({ ...e, [campo]: undefined }))
                }}
                alEnviar={pagar}
                alVolver={volver}
              />
            )}
          </div>

          <Resumen
            sede={sede}
            modo={modo}
            tipo={tipo}
            modalidad={modalidad}
            clase={claseElegida}
            precio={precio}
            paso={paso}
          />
        </div>
      </div>
    </section>
  )
}
