import { describe, expect, it } from 'vitest'

import {
  ahorroVsMensual,
  esSoloPack,
  precioCheckout,
  precioLista,
  validar,
  validarDni,
  variantePlan,
} from '@/lib/checkout/reglas'
import type { CatalogoPrecios, CatalogoTipoPlan } from '@/lib/api/tipos'

/**
 * Cada caso de acá es una regla que costó un bug en producción. El test no está
 * para cubrir líneas: está para que la próxima persona que toque el checkout no
 * las vuelva a romper sin enterarse.
 */

const SIN_PRECIO: CatalogoPrecios = {
  transferencia: null, efectivo: null, debito: null, tarjeta: null,
}

function tipo (over: Partial<CatalogoTipoPlan> & { id: number }): CatalogoTipoPlan {
  return {
    nombre: 'Pack 8',
    descripcion: null,
    frecuencia: 'MENSUAL',
    etiqueta: '',
    subtitulo: '',
    destacado: false,
    caracteristicas: [],
    orden: 1,
    precios: SIN_PRECIO,
    fijo: { planId: 100, ingresosPorSemana: 2, accesos: 8 },
    flexible: null,
    ...over,
  } as CatalogoTipoPlan
}

describe('precioLista', () => {
  it('publica el precio de transferencia, que es el que cobra Mercado Pago', () => {
    const t = tipo({ id: 1, precios: { ...SIN_PRECIO, transferencia: 100, tarjeta: 130 } })
    expect(precioLista(t)).toBe(100)
  })

  it('cae a efectivo mientras el catálogo no mande transferencia', () => {
    const t = tipo({ id: 1, precios: { ...SIN_PRECIO, efectivo: 90, tarjeta: 130 } })
    expect(precioLista(t)).toBe(90)
  })

  it('devuelve null si no hay ningún precio cargado', () => {
    expect(precioLista(tipo({ id: 1 }))).toBeNull()
  })
})

describe('esSoloPack', () => {
  it('reconoce la sede que sólo vende packs por ingresosPorSemana en null', () => {
    const soloPack = tipo({ id: 1, fijo: { planId: 7, ingresosPorSemana: null, accesos: 8 } })
    expect(esSoloPack(soloPack)).toBe(true)
  })

  it('un plan con frecuencia semanal no es sólo-pack', () => {
    expect(esSoloPack(tipo({ id: 1 }))).toBe(false)
  })
})

describe('variantePlan', () => {
  it('en modalidad fija usa el plan vinculado y los precios de la tarjeta', () => {
    const t = tipo({ id: 1, precios: { ...SIN_PRECIO, transferencia: 100 } })
    expect(variantePlan(t, false)).toEqual({ planId: 100, precios: t.precios })
  })

  it('en modalidad flexible usa el plan y los precios del pack', () => {
    const preciosPack: CatalogoPrecios = { ...SIN_PRECIO, transferencia: 120 }
    const t = tipo({ id: 1, flexible: { planId: 200, accesos: 8, precios: preciosPack } })
    expect(variantePlan(t, true)).toEqual({ planId: 200, precios: preciosPack })
  })

  it('en una sede sólo-pack, la modalidad flexible sale del plan vinculado como fijo', () => {
    // No hay `flexible`: el pack ES el plan de `fijo`. Sin esto, el checkout
    // mandaría un planId inexistente.
    const soloPack = tipo({
      id: 1,
      fijo: { planId: 7, ingresosPorSemana: null, accesos: 8 },
      flexible: null,
      precios: { ...SIN_PRECIO, transferencia: 150 },
    })
    expect(variantePlan(soloPack, true).planId).toBe(7)
  })
})

describe('precioCheckout', () => {
  it('cobra lo mismo que publica la landing, no el precio con tarjeta', () => {
    const t = tipo({ id: 1, precios: { ...SIN_PRECIO, transferencia: 100, tarjeta: 110 } })
    expect(precioCheckout(t, false)).toBe(100)
  })

  it('usa los precios del pack cuando se eligió esa modalidad', () => {
    const t = tipo({
      id: 1,
      precios: { ...SIN_PRECIO, transferencia: 100 },
      flexible: { planId: 200, accesos: 8, precios: { ...SIN_PRECIO, transferencia: 120 } },
    })
    expect(precioCheckout(t, true)).toBe(120)
  })
})

describe('ahorroVsMensual', () => {
  const mensual = tipo({ id: 1, frecuencia: 'MENSUAL', precios: { ...SIN_PRECIO, transferencia: 100 } })

  it('compara el trimestral contra tres meses del mensual equivalente', () => {
    const trimestral = tipo({
      id: 2, frecuencia: 'TRIMESTRAL', precios: { ...SIN_PRECIO, transferencia: 240 },
    })
    // 240 contra 300 = 20% de ahorro.
    expect(ahorroVsMensual(trimestral, [mensual, trimestral])).toBe(20)
  })

  it('empareja por ingresosPorSemana, no por posición', () => {
    const otraIntensidad = tipo({
      id: 3, frecuencia: 'MENSUAL', orden: 1,
      fijo: { planId: 101, ingresosPorSemana: 3, accesos: 12 },
      precios: { ...SIN_PRECIO, transferencia: 150 },
    })
    const trimestral = tipo({
      id: 2, frecuencia: 'TRIMESTRAL', precios: { ...SIN_PRECIO, transferencia: 240 },
    })
    // Hay dos mensuales, pero sólo uno con la misma intensidad: gana ése.
    expect(ahorroVsMensual(trimestral, [mensual, otraIntensidad, trimestral])).toBe(20)
  })

  it('no afirma nada si hay más de un mensual equivalente', () => {
    const gemelo = tipo({ id: 3, frecuencia: 'MENSUAL', precios: { ...SIN_PRECIO, transferencia: 110 } })
    const trimestral = tipo({
      id: 2, frecuencia: 'TRIMESTRAL', precios: { ...SIN_PRECIO, transferencia: 240 },
    })
    expect(ahorroVsMensual(trimestral, [mensual, gemelo, trimestral])).toBeNull()
  })

  it('un mensual nunca muestra ahorro', () => {
    expect(ahorroVsMensual(mensual, [mensual])).toBeNull()
  })

  it('no inventa un ahorro cuando el trimestral no es más barato', () => {
    const caro = tipo({
      id: 2, frecuencia: 'TRIMESTRAL', precios: { ...SIN_PRECIO, transferencia: 300 },
    })
    expect(ahorroVsMensual(caro, [mensual, caro])).toBeNull()
  })
})

describe('validarDni', () => {
  it.each([
    ['12345678', undefined],
    ['1234567', undefined],
    ['12.345.678', undefined],
    ['12 345 678', undefined],
  ])('acepta %s igual que el backend', (dni, esperado) => {
    expect(validarDni(dni)).toBe(esperado)
  })

  it.each(['', '123456', '123456789', 'abc'])('rechaza %s', (dni) => {
    expect(validarDni(dni)).toBeTypeOf('string')
  })
})

describe('validar', () => {
  const ok = {
    nombre: 'Ana', apellido: 'Pérez', email: 'ana@ejemplo.com',
    telefono: '11 5555 4444', dni: '30123456',
  }

  it('no se queja de datos completos', () => {
    expect(validar(ok)).toEqual({})
  })

  it('pide los campos vacíos', () => {
    const errores = validar({ ...ok, nombre: '  ', apellido: '' })
    expect(errores.nombre).toBeTypeOf('string')
    expect(errores.apellido).toBeTypeOf('string')
  })

  it('rechaza un email sin dominio', () => {
    expect(validar({ ...ok, email: 'ana@ejemplo' }).email).toBe('Email inválido')
  })

  it('cuenta dígitos del teléfono y no formato', () => {
    expect(validar({ ...ok, telefono: '+54 9 11 5555-4444' }).telefono).toBeUndefined()
    expect(validar({ ...ok, telefono: '1234' }).telefono).toBe('Teléfono demasiado corto')
  })
})
