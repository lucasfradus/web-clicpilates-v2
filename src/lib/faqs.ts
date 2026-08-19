import { pesos } from '@/lib/formato'
import { precioPublicado, type CatalogoSede, type Sede } from '@/lib/api/tipos'
import { zonaDe } from '@/lib/zona'

export interface Faq {
  pregunta: string
  respuesta: string
}

/**
 * Las cinco preguntas de cada landing. Son las que la gente escribe en Google
 * —"cuánto sale pilates en Núñez"— así que se responden con el número real de
 * esa sede, no con generalidades.
 *
 * Alimentan a la vez el acordeón visible y el `FAQPage` del JSON-LD: si sólo
 * estuvieran en el structured data serían contenido oculto, que es justo lo que
 * Google penaliza.
 */
export function faqsDeSede (sede: Sede, catalogo: CatalogoSede | null): Faq[] {
  const zona = zonaDe(sede)
  const desde = catalogo?.tipos
    .map((t) => precioPublicado(t.precios))
    .filter((p): p is number => p != null)
    .sort((a, b) => a - b)[0]

  const precioPlan = desde != null ? ` Los planes mensuales arrancan en ${pesos(desde)}.` : ''
  const comoLlegar = sede.whatsappUrl != null
    ? ' Podés abrirlo en Google Maps desde esta misma página o escribirnos por WhatsApp si necesitás indicaciones.'
    : ' Podés abrirlo en Google Maps desde esta misma página.'

  return [
    {
      pregunta: `¿Hace falta experiencia previa para entrenar en ${zona}?`,
      respuesta:
        'No. Las clases de Initial Pilates están pensadas para quien nunca hizo reformer. ' +
        'Trabajás en grupos chicos, así que la instructora te corrige desde el primer movimiento.',
    },
    {
      pregunta: `¿Cuánto sale una clase de pilates en ${zona}?`,
      respuesta:
        `La clase de prueba en ${sede.nombre} sale ${pesos(sede.precioPrueba)} y se abona al reservar, ` +
        'para dejar tu lugar tomado. Si después tomás un plan, ese valor se descuenta del primer mes.' +
        precioPlan,
    },
    {
      pregunta: '¿Qué tengo que llevar a la primera clase?',
      respuesta:
        'Ropa cómoda y medias antideslizantes; si no tenés, en el estudio conseguís. ' +
        'Te recomendamos llegar diez minutos antes para que la instructora te explique el equipo.',
    },
    {
      pregunta: '¿Puedo cambiar o cancelar una clase reservada?',
      respuesta:
        'Sí, desde la app o desde tu cuenta en la web, hasta cuatro horas antes del horario. ' +
        'La clase vuelve a tus créditos y podés usarla otro día.',
    },
    {
      pregunta: `¿Dónde queda el estudio de ${zona}?`,
      respuesta: `En ${sede.direccion}, ${sede.ciudad}.${comoLlegar}`,
    },
  ]
}
