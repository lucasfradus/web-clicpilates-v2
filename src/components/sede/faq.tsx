import type { Faq } from '@/lib/faqs'

/**
 * Acordeón de preguntas frecuentes.
 *
 * Con `<details>` nativo: cero JavaScript, funciona con teclado y lector de
 * pantalla sin que tengamos que implementar nada, y —lo importante acá— el
 * texto de la respuesta está en el HTML aunque el acordeón esté cerrado, que es
 * lo que hace que valga como contenido indexable.
 */
export function BloqueFaq ({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="faq">
      {faqs.map((faq) => (
        <details key={faq.pregunta} className="faq__item">
          <summary className="faq__q">
            <span>{faq.pregunta}</span>
            <span className="faq__sign" aria-hidden="true">+</span>
          </summary>
          <div className="faq__a">
            <p>{faq.respuesta}</p>
          </div>
        </details>
      ))}
    </div>
  )
}
