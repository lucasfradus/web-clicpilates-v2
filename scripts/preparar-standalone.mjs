/**
 * Completa `.next/standalone` después del build.
 *
 * Con `output: 'standalone'`, Next copia solo lo que el servidor necesita y deja
 * afuera `public` y `.next/static`, porque asume un CDN adelante. Acá no lo hay:
 * los sirve el mismo `server.js`, así que se copian al lado (es lo que indica la
 * doc de `output`). En Node y no con `cp -r` para que ande también en Windows.
 */

import { cp } from 'node:fs/promises'

await cp('public', '.next/standalone/public', { recursive: true })
await cp('.next/static', '.next/standalone/.next/static', { recursive: true })
console.log('standalone: public y .next/static copiados')
