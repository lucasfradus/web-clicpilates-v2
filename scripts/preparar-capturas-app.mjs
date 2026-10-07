/**
 * Recorta las capturas de la app para la web, a partir de las de la App Store
 * (clic_app_v1/store-assets/capturas-ios). Esas traen fondo oscuro y un título
 * arriba; acá sólo interesa la pantalla del teléfono, con las esquinas
 * redondeadas en transparente, para montarla dentro del marco de CSS.
 *
 * Uso: node scripts/preparar-capturas-app.mjs <carpeta-capturas-ios>
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const origen = process.argv[2]
if (!origen) {
  console.error('Uso: node scripts/preparar-capturas-app.mjs <carpeta-capturas-ios>')
  process.exit(1)
}

// La pantalla dentro de la imagen de 1290×2796 de la tienda.
const PANTALLA = { left: 140, top: 470, width: 1010, height: 2186 }
const RADIO = 58
const ANCHO = 600

const mascara = Buffer.from(
  `<svg width="${PANTALLA.width}" height="${PANTALLA.height}"><rect width="100%" height="100%" rx="${RADIO}" ry="${RADIO}"/></svg>`,
)

await mkdir('public/fotos/app', { recursive: true })
for (const nombre of ['home', 'agenda']) {
  const salida = join('public/fotos/app', `${nombre}.webp`)
  // En dos pasos: sharp aplica el resize antes que el composite, y la máscara
  // tiene el tamaño del recorte, no el final.
  const recorte = await sharp(join(origen, `${nombre === 'home' ? '1-home' : '2-agenda'}.png`))
    .extract(PANTALLA)
    .composite([{ input: mascara, blend: 'dest-in' }])
    .png()
    .toBuffer()
  await sharp(recorte)
    .resize({ width: ANCHO })
    .webp({ quality: 88 })
    .toFile(salida)
  console.log(salida)
}
