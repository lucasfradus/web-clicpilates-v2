/**
 * Emite el structured data de la página.
 *
 * Va con `dangerouslySetInnerHTML` porque React escaparía las comillas del JSON
 * y Google no lo podría parsear. El contenido no es input de usuario: sale de
 * `src/lib/jsonld.ts`, que serializa con `JSON.stringify`.
 */
export function JsonLd ({ datos }: { datos: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: datos }}
    />
  )
}
