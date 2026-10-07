/**
 * Genera los íconos del sitio desde el isologo de `src/app/icon.svg`.
 *
 * Hasta el 6-oct el sitio tenía un único ícono: ese SVG, con el isologo oscuro
 * sobre transparente. Alcanzaba para la pestaña de Chrome, pero:
 *
 * - iOS ("agregar a inicio") y varios lectores de links no usan SVG: piden
 *   `apple-touch-icon` en PNG, y sin él dibujan una captura o nada.
 * - Google muestra el favicon en los resultados y prefiere PNG/ICO cuadrado
 *   múltiplo de 48 px.
 * - Oscuro sobre transparente desaparece en una pestaña con modo oscuro.
 *
 * Por eso todos llevan fondo propio: el isologo claro sobre el ink de la marca.
 *
 * Uso: node scripts/generar-iconos.mjs
 * Escribe: src/app/icon.svg, src/app/icon1.png, src/app/apple-icon.png y
 * src/app/favicon.ico. Volver a correrlo si cambia el isologo.
 */

import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const FONDO = '#23222b' // --ink-deep
const TRAZO = '#fdfbfa' // --surface

const svgActual = await readFile('src/app/icon.svg', 'utf8')
const trazado = svgActual.match(/ d="([^"]+)"/)?.[1]
if (trazado == null) {
  console.error('No encontré el trazado del isologo en src/app/icon.svg')
  process.exit(1)
}

// El trazado vive en un lienzo de 749. Se lo achica al 72% y se lo centra, para
// que respire dentro del cuadrado redondeado (y no lo corte la máscara de iOS).
const LIENZO = 749
const ESCALA = 0.72
const corrimiento = (LIENZO * (1 - ESCALA)) / 2

function svg ({ redondeo }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LIENZO} ${LIENZO}">` +
    `<rect width="${LIENZO}" height="${LIENZO}" rx="${redondeo}" fill="${FONDO}"/>` +
    `<path fill="${TRAZO}" fill-rule="evenodd" transform="translate(${corrimiento} ${corrimiento}) scale(${ESCALA})" d="${trazado}"/>` +
    '</svg>\n'
}

const conRedondeo = svg({ redondeo: 160 })
// iOS aplica su propia máscara redondeada: el PNG va cuadrado y sin transparencia.
const cuadrado = svg({ redondeo: 0 })

const png = (fuente, lado) => sharp(Buffer.from(fuente)).resize(lado, lado).png().toBuffer()

await writeFile('src/app/icon.svg', conRedondeo)
await writeFile('src/app/icon1.png', await png(conRedondeo, 192))
await writeFile('src/app/apple-icon.png', await png(cuadrado, 180))

// ICO con PNGs adentro (válido desde Windows Vista y en todos los navegadores).
const lados = [16, 32, 48]
const imagenes = await Promise.all(lados.map((l) => png(conRedondeo, l)))
const cabecera = Buffer.alloc(6)
cabecera.writeUInt16LE(0, 0)
cabecera.writeUInt16LE(1, 2)
cabecera.writeUInt16LE(lados.length, 4)
let offset = 6 + 16 * lados.length
const entradas = lados.map((lado, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(lado, 0)
  e.writeUInt8(lado, 1)
  e.writeUInt16LE(1, 4)
  e.writeUInt16LE(32, 6)
  e.writeUInt32LE(imagenes[i].length, 8)
  e.writeUInt32LE(offset, 12)
  offset += imagenes[i].length
  return e
})
await writeFile('src/app/favicon.ico', Buffer.concat([cabecera, ...entradas, ...imagenes]))

console.log('Íconos generados en src/app/')
