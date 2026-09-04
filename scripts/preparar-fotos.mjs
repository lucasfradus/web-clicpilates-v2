/**
 * Prepara una foto de marca para el sitio: la achica y la guarda con el nombre
 * que corresponde.
 *
 * Los originales de la producción vienen de 4000-6000 px y 6-9 MB. El sitio no
 * sirve nunca más de 2048 px de ancho (ver `deviceSizes` en next.config.ts), así
 * que todo lo que exceda 2560 px es peso que se arrastra en el repo para
 * siempre sin que nadie lo vea: `next/image` genera los tamaños chicos al vuelo
 * desde lo que haya.
 *
 * Uso: node scripts/preparar-fotos.mjs <origen> <destino>
 */

import { rename, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const LADO_MAX = 2560
const CALIDAD = 88

const [origen, destino] = process.argv.slice(2)
if (origen == null || destino == null) {
  console.error('Uso: node scripts/preparar-fotos.mjs <origen> <destino>')
  process.exit(1)
}

const entrada = resolve(origen)
const salida = resolve(destino)
const temporal = `${salida}.tmp`

const antes = (await stat(entrada)).size
const meta = await sharp(entrada).metadata()

await sharp(entrada)
  .rotate() // respeta la orientación EXIF antes de perderla al reescribir
  .resize({ width: LADO_MAX, height: LADO_MAX, fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: CALIDAD, mozjpeg: true })
  .toFile(temporal)

await rename(temporal, salida)

const despues = (await stat(salida)).size
const nuevo = await sharp(salida).metadata()
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`

console.log(
  `${origen}\n  ${meta.width}×${meta.height} ${mb(antes)}  →  ` +
  `${nuevo.width}×${nuevo.height} ${mb(despues)}  (${Math.round((1 - despues / antes) * 100)}% menos)\n  ${destino}`,
)
