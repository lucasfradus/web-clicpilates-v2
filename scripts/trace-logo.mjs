/**
 * Vectoriza `public/brand/clic_logo_black.png` a un SVG de un solo path.
 *
 * El logo vectorial original (AI/EPS) todavía no llegó — ver `tasks/todo.md`,
 * sección "Bloqueado". Mientras tanto el header necesita un logo que herede
 * `currentColor`, porque el estado transparente sobre el hero y el estado
 * sólido al scrollear usan colores distintos: con dos PNG habría que cruzar dos
 * imágenes con opacidad, y con un trazo no hay nada que cruzar.
 *
 * Cómo: se lee el canal alfa del PNG, se binariza, se sacan los contornos con
 * marching squares (los huecos de las C salen como contornos propios y se
 * recortan con `fill-rule="evenodd"`) y se simplifican con Ramer-Douglas-Peucker.
 *
 * Uso:  node scripts/trace-logo.mjs
 * Salida: src/components/brand/logo-path.ts  (el logotipo completo)
 *         src/app/icon.svg                   (el isotipo, para el favicon)
 *         public/brand/iso.svg               (el isotipo con currentColor)
 *
 * El isotipo no se traza aparte: es la última C del logotipo, la que lleva la
 * flecha de recarga. Se recorta ese contorno y se le da un viewBox propio.
 *
 * Cuando aparezca el vectorial de verdad, esto y sus salidas se borran.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRADA = resolve(raiz, 'public/brand/clic_logo_black.png')
const SALIDA = resolve(raiz, 'src/components/brand/logo-path.ts')

const UMBRAL_ALFA = 128 // un píxel es tinta si su alfa supera esto
const EPSILON = 1.2 // px de tolerancia del simplificador, sobre el original de 2000px

/* ── PNG → canal alfa ────────────────────────────────────────────────────── */

function leerPng (ruta) {
  const buf = readFileSync(ruta)
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('no es un PNG')

  let ancho = 0, alto = 0, bits = 0, tipoColor = 0
  const trozos = []

  for (let i = 8; i < buf.length;) {
    const largo = buf.readUInt32BE(i)
    const tipo = buf.toString('ascii', i + 4, i + 8)
    const datos = buf.subarray(i + 8, i + 8 + largo)
    if (tipo === 'IHDR') {
      ancho = datos.readUInt32BE(0)
      alto = datos.readUInt32BE(4)
      bits = datos[8]
      tipoColor = datos[9]
      if (bits !== 8) throw new Error(`profundidad ${bits} no soportada`)
      if (datos[12] !== 0) throw new Error('PNG entrelazado no soportado')
    } else if (tipo === 'IDAT') {
      trozos.push(datos)
    } else if (tipo === 'IEND') {
      break
    }
    i += 12 + largo
  }

  const canales = { 0: 1, 2: 3, 4: 2, 6: 4 }[tipoColor]
  if (!canales) throw new Error(`tipo de color ${tipoColor} no soportado`)

  const crudo = inflateSync(Buffer.concat(trozos))
  const pasoBytes = ancho * canales
  const pixeles = Buffer.alloc(alto * pasoBytes)

  // deshacer los filtros por scanline (PNG spec §9)
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (pasoBytes + 1)]
    const linea = crudo.subarray(y * (pasoBytes + 1) + 1, (y + 1) * (pasoBytes + 1))
    const destino = y * pasoBytes
    const anterior = destino - pasoBytes

    for (let x = 0; x < pasoBytes; x++) {
      const cru = linea[x]
      const a = x >= canales ? pixeles[destino + x - canales] : 0
      const b = y > 0 ? pixeles[anterior + x] : 0
      const c = x >= canales && y > 0 ? pixeles[anterior + x - canales] : 0
      let valor
      switch (filtro) {
        case 0: valor = cru; break
        case 1: valor = cru + a; break
        case 2: valor = cru + b; break
        case 3: valor = cru + ((a + b) >> 1); break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          valor = cru + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)
          break
        }
        default: throw new Error(`filtro ${filtro} desconocido`)
      }
      pixeles[destino + x] = valor & 0xff
    }
  }

  return { ancho, alto, canales, pixeles }
}

/** Máscara booleana con un anillo de fondo alrededor, para que ningún contorno toque el borde. */
function mascara ({ ancho, alto, canales, pixeles }) {
  const w = ancho + 2, h = alto + 2
  const m = new Uint8Array(w * h)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const p = (y * ancho + x) * canales
      // con alfa (2 o 4 canales) manda el alfa; si es opaco, manda la luminancia
      const tinta = canales === 4 || canales === 2
        ? pixeles[p + canales - 1] > UMBRAL_ALFA
        : pixeles[p] < 255 - UMBRAL_ALFA
      if (tinta) m[(y + 1) * w + (x + 1)] = 1
    }
  }
  return { m, w, h }
}

/* ── Marching squares ────────────────────────────────────────────────────── */

/**
 * Devuelve los contornos cerrados del borde entre tinta y fondo. Cada celda de
 * 2x2 píxeles aporta 0, 1 o 2 segmentos según su configuración; después se
 * encadenan por sus extremos. Coordenadas en la grilla de esquinas (x, y).
 */
function contornos ({ m, w, h }) {
  const en = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : m[y * w + x])
  const segmentos = new Map() // "x,y" de inicio → lista de finales

  const agregar = (ax, ay, bx, by) => {
    const k = `${ax},${ay}`
    const lista = segmentos.get(k)
    if (lista) lista.push([bx, by])
    else segmentos.set(k, [[bx, by]])
  }

  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const tl = en(x, y), tr = en(x + 1, y), br = en(x + 1, y + 1), bl = en(x, y + 1)
      const caso = (tl << 3) | (tr << 2) | (br << 1) | bl
      // puntos medios de los lados de la celda, en coordenadas de esquina
      const N = [x + 0.5, y], E = [x + 1, y + 0.5], S = [x + 0.5, y + 1], O = [x, y + 0.5]
      // sentido: la tinta queda a la izquierda del segmento
      switch (caso) {
        case 1: agregar(...S, ...O); break
        case 2: agregar(...E, ...S); break
        case 3: agregar(...E, ...O); break
        case 4: agregar(...N, ...E); break
        case 5: agregar(...N, ...O); agregar(...S, ...E); break
        case 6: agregar(...N, ...S); break
        case 7: agregar(...N, ...O); break
        case 8: agregar(...O, ...N); break
        case 9: agregar(...S, ...N); break
        case 10: agregar(...O, ...S); agregar(...E, ...N); break
        case 11: agregar(...E, ...N); break
        case 12: agregar(...O, ...E); break
        case 13: agregar(...S, ...E); break
        case 14: agregar(...O, ...S); break
        default: break // 0 y 15: celda homogénea
      }
    }
  }

  const caminos = []
  while (segmentos.size) {
    const [inicio] = segmentos.keys()
    const camino = [inicio.split(',').map(Number)]
    let actual = inicio

    for (;;) {
      const lista = segmentos.get(actual)
      if (!lista || !lista.length) break
      const siguiente = lista.pop()
      if (!lista.length) segmentos.delete(actual)
      camino.push(siguiente)
      actual = `${siguiente[0]},${siguiente[1]}`
      if (actual === inicio) break
    }
    if (camino.length > 3) caminos.push(camino)
  }
  return caminos
}

/* ── Simplificación ──────────────────────────────────────────────────────── */

function rdp (puntos, eps) {
  if (puntos.length < 3) return puntos
  const [ax, ay] = puntos[0]
  const [bx, by] = puntos[puntos.length - 1]
  let peor = 0, indice = 0

  for (let i = 1; i < puntos.length - 1; i++) {
    const [px, py] = puntos[i]
    const dx = bx - ax, dy = by - ay
    const largo = Math.hypot(dx, dy)
    const d = largo === 0
      ? Math.hypot(px - ax, py - ay)
      : Math.abs(dy * px - dx * py + bx * ay - by * ax) / largo
    if (d > peor) { peor = d; indice = i }
  }

  if (peor <= eps) return [puntos[0], puntos[puntos.length - 1]]
  return [
    ...rdp(puntos.slice(0, indice + 1), eps).slice(0, -1),
    ...rdp(puntos.slice(indice), eps),
  ]
}

/* ── Salida ──────────────────────────────────────────────────────────────── */

const png = leerPng(ENTRADA)
const crudos = contornos(mascara(png))

const redondear = n => Number(n.toFixed(1)).toString()
// el ancla del marching squares está corrida un píxel por el anillo de fondo
const simplificados = crudos.map(c => rdp(c, EPSILON).map(([x, y]) => [x - 1, y - 1]))
const aPath = c => `M${c.map(([x, y]) => `${redondear(x)} ${redondear(y)}`).join('L')}Z`

const d = simplificados.map(aPath).join('')
const puntos = simplificados.reduce((n, c) => n + c.length, 0)

/* El isotipo: el contorno que arranca más a la derecha es la C de la flecha. */
const iso = simplificados.reduce((a, b) =>
  Math.max(...a.map(p => p[0])) > Math.max(...b.map(p => p[0])) ? a : b)
const caja = {
  x0: Math.min(...iso.map(p => p[0])),
  y0: Math.min(...iso.map(p => p[1])),
  x1: Math.max(...iso.map(p => p[0])),
  y1: Math.max(...iso.map(p => p[1])),
}
const margen = 40 // aire alrededor: un favicon pegado a los bordes se ve sucio
const lado = Math.max(caja.x1 - caja.x0, caja.y1 - caja.y0) + margen * 2
const desplazado = iso.map(([x, y]) => [
  x - caja.x0 + margen + (lado - margen * 2 - (caja.x1 - caja.x0)) / 2,
  y - caja.y0 + margen + (lado - margen * 2 - (caja.y1 - caja.y0)) / 2,
])

const svgIso = (relleno) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${redondear(lado)} ${redondear(lado)}">` +
  `<path fill="${relleno}" fill-rule="evenodd" d="${aPath(desplazado)}"/></svg>\n`

// El favicon lleva el color fijo; el de public/ hereda currentColor, para
// usarlo como marca de agua y como separador.
writeFileSync(resolve(raiz, 'src/app/icon.svg'), svgIso('#2c2f34'))
writeFileSync(resolve(raiz, 'public/brand/iso.svg'), svgIso('currentColor'))

mkdirSync(dirname(SALIDA), { recursive: true })
writeFileSync(SALIDA, `// Generado por scripts/trace-logo.mjs — no editar a mano.
// Trazado de public/brand/clic_logo_black.png (${png.ancho}x${png.alto}).
// Se reemplaza por el vectorial original cuando llegue.

export const LOGO_VIEWBOX = '0 0 ${png.ancho} ${png.alto}'

export const LOGO_PATH =
  '${d}'
`)

console.log(`${crudos.length} contornos, ${puntos} puntos, ${(d.length / 1024).toFixed(1)} KB de path`)
