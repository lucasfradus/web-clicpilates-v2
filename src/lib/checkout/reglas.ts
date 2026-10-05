import type { CatalogoPrecios, CatalogoTipoPlan } from '@/lib/api/tipos'

/**
 * Las reglas de negocio del checkout, sin React.
 *
 * Están acá y no adentro del componente porque cada una costó un bug en
 * producción y son lo único de este flujo que vale la pena poder leer —y
 * testear— sin montar una pantalla.
 */

/**
 * Precio de la venta online: el de "Transferencia MP", que es el que se publica
 * y el que termina cobrando Mercado Pago.
 *
 * El fallback a efectivo es transitorio, hasta que el catálogo mande el campo:
 * los dos coinciden en 188 de los 207 planes de producción.
 */
export function precioLista (tipo: CatalogoTipoPlan): number | null {
  return (
    tipo.precios.transferencia ??
    tipo.precios.efectivo ??
    tipo.precios.debito ??
    tipo.precios.tarjeta ??
    null
  )
}

/**
 * `true` si la tarjeta no ofrece horarios fijos y sólo se puede comprar como
 * pack.
 *
 * El catálogo llama `fijo` al plan vinculado en `TipoPlan.plan` **sin mirar su
 * modalidad**. En una sede que sólo vende packs, ahí hay un PACK y `flexible`
 * queda vacío: `ingresosPorSemana` en `null` es la única señal de que ese plan
 * no es de horario fijo.
 *
 * Sin esto, la única modalidad ofrecida era "Horarios fijos" —lo contrario de
 * lo que la sede vende— y el checkout moría pidiendo horarios que el backend
 * nunca iba a devolver.
 */
export function esSoloPack (tipo: CatalogoTipoPlan | null): boolean {
  return tipo != null && tipo.fijo.ingresosPorSemana == null
}

/**
 * Plan y precios que corresponden a la modalidad elegida.
 *
 * En las sedes que sólo venden packs no hay variante `flexible`: el pack **es**
 * el plan vinculado como `fijo`, así que la modalidad flexible sale de ahí.
 */
export function variantePlan (
  tipo: CatalogoTipoPlan,
  flex: boolean,
): { planId: number; precios: CatalogoPrecios } {
  if (flex && tipo.flexible) {
    return { planId: tipo.flexible.planId, precios: tipo.flexible.precios }
  }
  return { planId: tipo.fijo.planId, precios: tipo.precios }
}

/**
 * El precio que se le cobra a la persona por el plan elegido.
 *
 * Sale de la misma cascada que el publicado y de la variante que eligió. Antes
 * usaba el de tarjeta de crédito y el checkout terminaba mostrando ~10% más que
 * la landing: el número que se promete y el que se cobra tienen que salir del
 * mismo lugar.
 */
export function precioCheckout (tipo: CatalogoTipoPlan | null, flex: boolean): number | null {
  if (tipo == null) return null
  const { precios } = variantePlan(tipo, flex)
  return precios.transferencia ?? precios.efectivo ?? precios.debito ?? precios.tarjeta ?? null
}

/**
 * Cuánto se ahorra un trimestral contra pagar el mismo plan mes a mes.
 *
 * La comparación honesta de un trimestral **no** es contra el precio con
 * tarjeta del mismo plan —eso mide el recargo de la financiación, no la
 * conveniencia del trimestre—: es contra tres meses del mensual equivalente. En
 * las sedes reales da entre 15% y 22%, contra el 13% que salía comparando
 * medios de pago.
 *
 * El equivalente se busca por `ingresosPorSemana`, que es lo que define la
 * intensidad del plan. Hot Clic no lo tiene cargado en ninguna tarjeta, así que
 * ahí se cae a `orden`, que en las 11 sedes mantiene el mismo lugar en las dos
 * frecuencias.
 */
export function ahorroVsMensual (
  tipo: CatalogoTipoPlan,
  tipos: CatalogoTipoPlan[],
): number | null {
  if (tipo.frecuencia !== 'TRIMESTRAL') return null

  const mensuales = tipos.filter((t) => t.frecuencia === 'MENSUAL')
  const ips = tipo.fijo.ingresosPorSemana
  const candidatos = ips != null
    ? mensuales.filter((m) => m.fijo.ingresosPorSemana === ips)
    : mensuales.filter((m) => m.orden === tipo.orden)

  // Con más de uno no se puede saber cuál es el equivalente: mejor no afirmar.
  if (candidatos.length !== 1) return null

  const mensual = precioLista(candidatos[0])
  const trimestral = precioLista(tipo)
  if (mensual == null || trimestral == null || mensual <= 0) return null

  const tresMeses = mensual * 3
  if (trimestral >= tresMeses) return null
  return Math.round((1 - trimestral / tresMeses) * 100)
}

/* ── Validación del formulario ─────────────────────────────────────────── */

export interface DatosComprador {
  nombre: string
  apellido: string
  email: string
  telefono: string
  dni: string
}

export type ErroresComprador = Partial<Record<keyof DatosComprador, string>>

/**
 * Mismo criterio que `normalizarDni` del backend: 7 u 8 dígitos, tolerando
 * puntos y espacios.
 *
 * Que coincidan no es prolijidad: si acá pasara algo que allá se descarta, el
 * alumno se guardaría sin DNI, la facturación electrónica no podría emitir y el
 * comprobante quedaría esperando que alguien lo cargue a mano.
 */
export function validarDni (dni: string): string | undefined {
  const digitos = dni.replace(/\D/g, '')
  if (digitos.length === 0) return 'Ingresá tu DNI'
  if (digitos.length < 7 || digitos.length > 8) return 'DNI inválido'
  return undefined
}

export function validar (datos: DatosComprador): ErroresComprador {
  const errores: ErroresComprador = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá tu nombre'
  if (!datos.apellido.trim()) errores.apellido = 'Ingresá tu apellido'

  if (!datos.email.trim()) {
    errores.email = 'Ingresá tu email'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
    errores.email = 'Email inválido'
  }

  if (!datos.telefono.trim()) {
    errores.telefono = 'Ingresá tu teléfono'
  } else if (datos.telefono.replace(/\D/g, '').length < 8) {
    // Sólo cantidad de dígitos: validar prefijo o formato rebota números
    // válidos escritos de otra forma, y el backend tampoco lo exige.
    errores.telefono = 'Teléfono demasiado corto'
  }

  const dni = validarDni(datos.dni)
  if (dni != null) errores.dni = dni

  return errores
}
