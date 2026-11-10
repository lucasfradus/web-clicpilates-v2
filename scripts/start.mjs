/**
 * Arranca el servidor standalone (ver `output` en next.config.ts).
 *
 * `server.js` escucha en `process.env.HOSTNAME`, y dentro de un contenedor esa
 * variable la pone Docker con el nombre del contenedor: el servidor quedaría
 * escuchando en una interfaz por la que el proxy de Railway no entra. Por eso se
 * fija acá en 0.0.0.0. El puerto sale de `PORT`, que pone Railway.
 */

process.env.HOSTNAME = '0.0.0.0'
await import('../.next/standalone/server.js')
