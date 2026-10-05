import { ErrorApi, pedir } from './cliente'
import type { HorariosResponse } from './tipos'

/**
 * Los horarios que se pueden fijar al comprar un plan de horario fijo.
 *
 * Tres resultados por el mismo motivo que `getClases`: el 404 de este endpoint
 * **no es un error**. Significa que el plan no es de horario fijo, y el backend
 * lo usa como respuesta normal para los packs. Tratarlo como falla haría que una
 * sede que sólo vende packs mostrara un cartel de error en el paso donde hay que
 * explicarle a la persona cómo funciona lo que está comprando.
 *
 * Va sin cache: `cuposAprox` es la ocupación de la próxima clase de cada
 * horario, así que envejece igual que la grilla.
 */
export type ResultadoHorarios =
  | { estado: 'ok'; datos: HorariosResponse }
  | { estado: 'sin-horarios' }
  | { estado: 'error' }

export async function getHorarios (sedeId: number, planId: number): Promise<ResultadoHorarios> {
  try {
    const datos = await pedir<HorariosResponse>(`/api/public/sedes/${sedeId}/horarios`, {
      revalidar: false,
      parametros: { planId },
    })
    return { estado: 'ok', datos }
  } catch (error) {
    if (error instanceof ErrorApi && error.esNoEncontrado) return { estado: 'sin-horarios' }
    console.error('[api] getHorarios falló:', error)
    return { estado: 'error' }
  }
}
