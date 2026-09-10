/**
 * Genera la imagen que se ve al compartir el link (Open Graph).
 *
 * No es una foto más: es la única que se muestra fuera del sitio —en WhatsApp,
 * en Instagram, en Slack— y hasta el 10-sep no existía ninguna, así que el link
 * viajaba sin imagen. `twitter:card` incluso decía `summary_large_image`, que
 * es la variante grande: sin imagen, la peor versión posible.
 *
 * Recorta a 1200×630 (1,91:1, lo que piden Facebook y WhatsApp) desde el centro
 * de interés, no desde el centro geométrico: el `foco` es el mismo porcentaje
 * que usa `object-position` en `src/lib/fotos.ts`, así que la imagen compartida
 * queda encuadrada como la que se ve en la página.
 *
 * Uso: node scripts/preparar-og.mjs <origen> [focoX] [focoY]
 *   node scripts/preparar-og.mjs public/fotos/hero/hero-sala.jpg 50 45
 */

import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ANCHO = 1200
const ALTO = 630
const CALIDAD = 86
const SALIDA = 'public/og.jpg'

const [origen, fx = '50', fy = '50'] = process.argv.slice(2)
if (origen == null) {
  console.error('Uso: node scripts/preparar-og.mjs <origen> [focoX] [focoY]')
  process.exit(1)
}

const entrada = resolve(origen)
const salida = resolve(SALIDA)
const foco = { x: Number(fx) / 100, y: Number(fy) / 100 }

const meta = await sharp(entrada).metadata()
if (meta.width == null || meta.height == null) {
  console.error('No se pudo leer el tamaño de', origen)
  process.exit(1)
}

// Se recorta el rectángulo más grande con la proporción de la OG que entre en
// el original, y se lo corre hacia el foco sin salirse de la imagen.
const proporcion = ANCHO / ALTO
let ancho = meta.width
let alto = Math.round(ancho / proporcion)
if (alto > meta.height) {
  alto = meta.height
  ancho = Math.round(alto * proporcion)
}

const acotar = (v, max) => Math.max(0, Math.min(Math.round(v), max))
const left = acotar(meta.width * foco.x - ancho / 2, meta.width - ancho)
const top = acotar(meta.height * foco.y - alto / 2, meta.height - alto)

await sharp(entrada)
  .rotate()
  .extract({ left, top, width: ancho, height: alto })
  .resize(ANCHO, ALTO)
  .jpeg({ quality: CALIDAD, mozjpeg: true })
  .toFile(salida)

const kb = Math.round((await stat(salida)).size / 1024)
console.log(
  `${origen}\n  ${meta.width}×${meta.height}  →  recorte ${ancho}×${alto} en (${left}, ${top})` +
  `\n  ${SALIDA}  ${ANCHO}×${ALTO}  ${kb} KB`,
)
