import { ErrorApi, pedir } from './cliente'
import type { Clase } from './tipos'

/**
 * Grilla en vivo. Es lo único que se difiere al cliente: cambia cada minuto, no
 * aporta SEO y es el pedido más pesado. Va sin cache.
 *
 * Tres resultados y no dos, porque el endpoint tiene una particularidad:
 * `/api/public/sedes/:id/clases` exige que la sede pueda vender online —venta
 * activa y cuenta de Mercado Pago— y devuelve 404 si no. Eso no es "no hay
 * clases": es "esta sede no publica su grilla". Se muestran distinto.
 */
export type ResultadoClases =
  | { estado: 'ok'; clases: Clase[] }
  | { estado: 'sin-grilla' }
  | { estado: 'error' }

export async function getClases (sedeId: number): Promise<ResultadoClases> {
  try {
    const clases = await pedir<Clase[]>(`/api/public/sedes/${sedeId}/clases`, {
      revalidar: false,
      parametros: { tipo: 'PILATES' },
    })
    return { estado: 'ok', clases }
  } catch (error) {
    if (error instanceof ErrorApi && error.esNoEncontrado) return { estado: 'sin-grilla' }
    console.error('[api] getClases falló:', error)
    return { estado: 'error' }
  }
}

/*
 * Dos cosas para tener en cuenta cuando la fase 3 dibuje la grilla:
 *
 * - El backend **filtra las clases sin cupo**. Lo que llega es "lo que se puede
 *   reservar", no la grilla completa del estudio: una franja llena se ve como un
 *   hueco.
 * - `inicio` es ISO en UTC. Agrupar por día cortando el string da el día
 *   equivocado para las clases de la noche; hay que pasar por
 *   `America/Argentina/Buenos_Aires`.
 *
 * Las dos están anotadas en `tasks/todo.md`.
 */
