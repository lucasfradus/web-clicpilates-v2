# web-clicpilates-v2

La web nueva de CLIC studio pilates: `clicpilates.com`. Reemplaza al one-pager
actual por un sitio que sale del mismo sistema que ya usa el negocio —horarios
reales, precios reales, una landing indexable por estudio— y que sirve por
rewrite a los dos SPAs que ya funcionan.

## Arrancar

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Dónde está cada cosa

| | |
|---|---|
| `AGENTS.md` | Cómo se trabaja acá. Leer primero |
| `docs/contexto.md` | De dónde sale el design system, las trampas de la API, qué ya se decidió |
| `docs/plan.md` | El plan por fases |
| `docs/seo.md` | SEO, publicidad y medición |
| `docs/prototipo.html` | La especificación visual. Abrirlo en el navegador |
| `docs/rewrites.md` | Cómo se sirven `/reservar` y `/mi-cuenta` |
| `tasks/todo.md` | Estado actual, fase por fase |

## Estructura

```
src/app/         rutas (App Router)
src/components/  header, footer, marca
src/lib/         config del sitio y navegación
src/styles/      tokens y CSS global, todo entra por globals.css
scripts/         utilidades de una sola vez (ver el encabezado de cada una)
```

## Estado

Fase 1 (esqueleto) terminada: layout, header con sus dos estados, footer, menú
mobile, rewrites y logo vectorizado. Las páginas de contenido —`/estudios`,
`/precios`, `/academy`, `/franquicias`— llegan en las fases 3 y 5; hasta
entonces devuelven 404 a propósito.
