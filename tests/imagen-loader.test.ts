import { describe, expect, it } from 'vitest'

import imagenLoader, { anchoVariante } from '@/lib/imagen-loader'

/**
 * El loader arma URLs de archivos que tienen que existir: si se equivoca, la
 * foto no carga. Lo que se fija acá es el contrato con los dos lados que las
 * generan (scripts/generar-variantes.mjs y las variantes de ClicNet).
 */

describe('anchoVariante', () => {
  it('elige el ancho más chico que alcanza', () => {
    expect(anchoVariante(320)).toBe(640)
    expect(anchoVariante(640)).toBe(640)
    expect(anchoVariante(641)).toBe(1280)
    expect(anchoVariante(2000)).toBe(2000)
  })

  it('se queda con el más grande si ninguno alcanza', () => {
    expect(anchoVariante(3840)).toBe(2000)
  })
})

describe('imagenLoader', () => {
  it('lleva una foto de marca a su variante WebP en /_v', () => {
    expect(imagenLoader({ src: '/fotos/hero/hero-sala.jpg', width: 1080 }))
      .toBe('/_v/fotos/hero/hero-sala-1280.webp')
    expect(imagenLoader({ src: '/fotos/app/home.webp', width: 240 }))
      .toBe('/_v/fotos/app/home-640.webp')
  })

  it('pide al backend la variante con ?w=', () => {
    expect(imagenLoader({ src: 'https://app.clicpilates.com/api/storage/sedes/8-1723.jpg', width: 750 }))
      .toBe('https://app.clicpilates.com/api/storage/sedes/8-1723.jpg?w=1280')
  })

  it('respeta un query string que ya venga en la URL', () => {
    expect(imagenLoader({ src: '/api/storage/eventos/1.png?v=2', width: 640 }))
      .toBe('/api/storage/eventos/1.png?v=2&w=640')
  })

  it('deja tal cual cualquier otra imagen', () => {
    expect(imagenLoader({ src: '/og.jpg', width: 1280 })).toBe('/og.jpg')
    expect(imagenLoader({ src: '/brand/logo.svg', width: 640 })).toBe('/brand/logo.svg')
  })
})
