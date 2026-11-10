/**
 * Genera las variantes WebP de las fotos de marca, para `src/lib/imagen-loader.ts`.
 *
 * `public/fotos/hero/hero-sala.jpg` → `public/_v/fotos/hero/hero-sala-{640,1280,2000}.webp`
 *
 * Corre solo antes de `npm run dev` y de `npm run build` (ver package.json), así
 * que no hay que acordarse de nada al cambiar una foto: alcanza con reemplazar
 * el archivo en `public/fotos`. La salida está en .gitignore. Saltea las
 * variantes que ya están y son más nuevas que su foto, para que `dev` no tarde.
 *
 * Es lo mismo que hacía el optimizador de Next en cada pedido, pero una sola
 * vez y fuera del servidor. Ver el porqué en el loader.
 */

import { mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import sharp from 'sharp'

// Los mismos que `ANCHOS` en src/lib/imagen-loader.ts.
const ANCHOS = [640, 1280, 2000]
const CALIDAD = 80
const ORIGEN = 'public/fotos'
const DESTINO = 'public/_v/fotos'
const IMAGEN = /\.(jpe?g|png|webp)$/i

async function * imagenes (dir) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) yield * imagenes(ruta)
    else if (IMAGEN.test(entrada.name)) yield ruta
  }
}

async function mtime (ruta) {
  try {
    return (await stat(ruta)).mtimeMs
  } catch {
    return -1
  }
}

let generadas = 0
let total = 0
for await (const foto of imagenes(ORIGEN)) {
  const base = join(DESTINO, relative(ORIGEN, foto)).replace(/\.[a-z0-9]+$/i, '')
  const original = await mtime(foto)
  await mkdir(dirname(base), { recursive: true })

  for (const ancho of ANCHOS) {
    total++
    const salida = `${base}-${ancho}.webp`
    if ((await mtime(salida)) >= original) continue
    // Sin agrandar: una foto más angosta que el ancho queda en su tamaño, con
    // el nombre del ancho igual, para que el loader no tenga que saberlo.
    await sharp(foto)
      .rotate()
      .resize({ width: ancho, withoutEnlargement: true })
      .webp({ quality: CALIDAD })
      .toFile(salida)
    generadas++
  }
}

console.log(`variantes: ${generadas} generadas, ${total - generadas} al día`)
