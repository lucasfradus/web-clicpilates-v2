import { enviar, ErrorApi } from './cliente'
import type {
  CheckoutPayload,
  CheckoutPlanPayload,
  CheckoutPlanResponse,
  CheckoutResponse,
} from './tipos'

/**
 * Los dos POST que crean la preferencia de Mercado Pago.
 *
 * Ninguno cobra: crean la preferencia y devuelven el `initPoint` al que hay que
 * mandar al navegador. La plata se mueve del otro lado, y el webhook del backend
 * es el que da de alta al alumno cuando MP confirma.
 */

export async function checkoutPrueba (payload: CheckoutPayload): Promise<CheckoutResponse> {
  return enviar<CheckoutResponse>('/api/public/checkout', payload)
}

export async function checkoutPlan (payload: CheckoutPlanPayload): Promise<CheckoutPlanResponse> {
  return enviar<CheckoutPlanResponse>('/api/public/checkout-plan', payload)
}

/**
 * El mensaje que ve la persona cuando el POST falla.
 *
 * Los códigos que importan no son fallas nuestras: son **carreras**. Entre que
 * alguien abre el formulario y lo manda pueden pasar varios minutos, y en ese
 * rato la última vacante se la puede llevar otro. Decirle "error 409" a quien
 * acaba de completar sus datos es inutilizar una explicación que ya existe.
 *
 * El 429 también es real y hoy el portal lo deja caer en el mensaje genérico:
 * son 5 intentos por IP cada 15 minutos.
 */
export function mensajeDeError (error: unknown): string {
  if (!(error instanceof ErrorApi)) {
    return 'No pudimos procesar la reserva. Probá de nuevo en un momento.'
  }

  switch (error.estado) {
    case 409:
      return 'Esta clase se llenó mientras completabas el formulario. Volvé a elegir un horario.'
    case 404:
      return 'La clase ya no está disponible. Elegí otro horario.'
    case 429:
      return 'Hubo demasiados intentos desde esta conexión. Esperá unos minutos y volvé a probar.'
    case null:
      return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'
    default:
      // El backend manda frases pensadas para el usuario ("El DNI no es
      // válido", "El plan no tiene una frecuencia configurada"): se muestran
      // tal cual en vez de taparlas con un genérico.
      return error.message
  }
}
