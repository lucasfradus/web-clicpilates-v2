import { afterEach, describe, expect, it, vi } from 'vitest'

import { getClases } from '@/lib/api/clases'
import { accionDeSede } from '@/lib/api/contacto'
import { getCatalogo, getSede, getSedes } from '@/lib/api/sedes'

/**
 * La capa de datos, con el backend mockeado. Lo que se fija acá es lo que rompe
 * la página si cambia: qué se le pide al backend, y qué se devuelve cuando el
 * backend no contesta lo que esperábamos.
 */

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function responde (cuerpo: unknown, estado = 200) {
  fetchMock.mockResolvedValueOnce({
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  })
}

/** La URL del último pedido. */
function urlPedida (): URL {
  return fetchMock.mock.calls.at(-1)![0] as URL
}

function opcionesPedidas (): RequestInit & { next?: { revalidate: number } } {
  return fetchMock.mock.calls.at(-1)![1]
}

const SEDE = {
  id: 1,
  slug: 'nunez',
  nombre: 'Núñez',
  reservaOnline: true,
  whatsappUrl: 'https://wa.me/5491132283985',
}

afterEach(() => {
  fetchMock.mockReset()
  vi.restoreAllMocks()
})

describe('getSedes', () => {
  it('pide el contexto web, que es el que no esconde sedes', async () => {
    responde([SEDE])
    await getSedes()

    const url = urlPedida()
    expect(url.pathname).toBe('/api/public/sedes')
    expect(url.searchParams.get('contexto')).toBe('web')
    expect(url.searchParams.get('tipo')).toBe('PILATES')
  })

  it('cachea una hora', async () => {
    responde([SEDE])
    await getSedes()

    expect(opcionesPedidas().next?.revalidate).toBe(3600)
  })

  it('devuelve null si el backend falla, para poder mostrar el error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    responde({ error: 'boom' }, 500)

    expect(await getSedes()).toBeNull()
  })

  it('devuelve null si el backend no contesta', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('timeout'))

    expect(await getSedes()).toBeNull()
  })

  it('lista vacía es vacío, no error', async () => {
    responde([])
    expect(await getSedes()).toEqual([])
  })
})

describe('getSede', () => {
  it('encuentra la sede por slug dentro del listado cacheado', async () => {
    responde([SEDE])
    expect((await getSede('nunez'))?.nombre).toBe('Núñez')
  })

  it('devuelve null cuando el slug no existe', async () => {
    responde([SEDE])
    expect(await getSede('no-existe')).toBeNull()
  })
})

describe('getCatalogo', () => {
  it('pide el catálogo de la sede y devuelve el primero', async () => {
    responde([{ sedeSlug: 'nunez', tipos: [] }])
    const catalogo = await getCatalogo('nunez')

    expect(urlPedida().searchParams.get('sede')).toBe('nunez')
    expect(catalogo?.sedeSlug).toBe('nunez')
  })

  it('devuelve null si la sede no tiene catálogo publicado', async () => {
    responde([])
    expect(await getCatalogo('nunez')).toBeNull()
  })
})

describe('getClases', () => {
  it('pide sin cache: la grilla cambia cada minuto', async () => {
    responde([])
    await getClases(1)

    expect(opcionesPedidas().cache).toBe('no-store')
    expect(opcionesPedidas().next).toBeUndefined()
  })

  // El endpoint devuelve 404 para una sede que no puede vender online. Eso no
  // es "no hay clases": es "esta sede no publica su grilla".
  it('distingue el 404 del listado vacío', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    responde({ error: 'Sede no disponible' }, 404)
    expect(await getClases(1)).toEqual({ estado: 'sin-grilla' })

    responde([])
    expect(await getClases(1)).toEqual({ estado: 'ok', clases: [] })

    responde({ error: 'boom' }, 500)
    expect(await getClases(1)).toEqual({ estado: 'error' })
  })
})

describe('accionDeSede', () => {
  it('manda a reservar cuando la sede puede cobrar online', () => {
    const accion = accionDeSede(SEDE)
    expect(accion).toEqual({
      href: '/reservar/sede/nunez',
      texto: 'Reservar clase de prueba',
      reserva: true,
    })
  })

  it('manda a WhatsApp cuando no puede', () => {
    const accion = accionDeSede({ ...SEDE, reservaOnline: false })
    expect(accion?.reserva).toBe(false)
    expect(accion?.href).toBe(SEDE.whatsappUrl)
  })

  it('no inventa un botón si no hay ni checkout ni WhatsApp', () => {
    expect(accionDeSede({ ...SEDE, reservaOnline: false, whatsappUrl: null })).toBeNull()
  })
})
