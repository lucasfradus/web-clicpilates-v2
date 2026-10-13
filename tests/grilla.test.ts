import { afterEach, describe, expect, it, vi } from 'vitest'

import { getGrilla, limpiarGrilla, ordenarHoras, ubicarFranjas } from '@/lib/api/grilla'

/** La grilla semanal suelta (/grilla/<slug>), con el backend mockeado. */

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function responde (cuerpo: unknown, estado = 200) {
  fetchMock.mockResolvedValueOnce({
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  })
}

afterEach(() => {
  fetchMock.mockReset()
})

describe('getGrilla', () => {
  it('pide la grilla del slug sin cache', async () => {
    responde({ center: { id: 8, name: 'Office Pilates', address: 'x', slug: 'office-pilates' }, schedule: {}, updatedAt: '' })
    await getGrilla('office-pilates')
    const [url, opciones] = fetchMock.mock.calls.at(-1)!
    expect((url as URL).pathname).toBe('/api/v1/centers/office-pilates/schedule')
    expect(opciones.cache).toBe('no-store')
  })

  it('404 y 409 son "no publica grilla", no un error', async () => {
    responde({}, 404)
    expect(await getGrilla('no-existe')).toBeNull()
    responde({}, 409)
    expect(await getGrilla('sin-migrar')).toBeNull()
  })
})

describe('limpiarGrilla', () => {
  it('oculta Entrenamientos y descarta las filas que quedan vacías', () => {
    const limpia = limpiarGrilla({
      '7.00': { Lunes: { s: 'd', activity: 'Entrenamientos' } },
      '8.00': { Lunes: { s: 'b', activity: 'Inicial' }, Martes: { s: 'n', activity: 'Entrenamientos' } },
    })
    expect(Object.keys(limpia)).toEqual(['8.00'])
    expect(limpia['8.00'].Martes).toBeNull()
  })
})

describe('horas', () => {
  it('ordena por hora y no alfabéticamente', () => {
    expect(ordenarHoras(['10.00', '8.45', '9.30'])).toEqual(['8.45', '9.30', '10.00'])
  })

  it('el rango del calendario va de hora entera a hora entera', () => {
    const { desde, hasta } = ubicarFranjas({
      '7.45': { Lunes: { s: 'd', activity: 'Inicial' } },
      '19.30': { Sábado: { s: 'd', activity: 'Inicial' } },
    })
    expect([desde, hasta]).toEqual([7 * 60, 21 * 60])
  })
})
