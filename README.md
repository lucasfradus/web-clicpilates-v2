# web-clicpilates-v2

La web nueva de CLIC studio pilates: `clicpilates.com`. Reemplaza al one-pager
actual por un sitio que sale del mismo sistema que ya usa el negocio —horarios
reales, precios reales, una landing indexable por estudio— y que sirve por
rewrite a los dos SPAs que ya funcionan.

## Arrancar

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3005
```

El puerto es 3005 y no 3000 porque 3000 es el backend de ClicNet corriendo local.

## Entorno local completo

Contra la base de datos local hacen falta dos procesos:

| Qué | Dónde | Cómo se levanta |
|---|---|---|
| Backend ClicNet | `:3000` | `npm run dev` en el repo `Clicnet` (con su DB de Docker en `:5433`) |
| Esta web | `:3005` | `npm run dev` |

Y en `.env.local`:

```
API_ORIGIN=http://localhost:3000
```

`/reservar` es parte de este proyecto (el portal de reservas portado, ver
`src/components/reservas/`). `/mi-cuenta` redirige al portal de clientes.

## Dónde está cada cosa

| | |
|---|---|
| `AGENTS.md` | Cómo se trabaja acá. Leer primero |
| `docs/contexto.md` | De dónde sale el design system, las trampas de la API, qué ya se decidió |
| `docs/plan.md` | El plan por fases |
| `docs/seo.md` | SEO, publicidad y medición |
| `docs/prototipo.html` | La especificación visual. Abrirlo en el navegador |
| `docs/rewrites.md` | Histórico: cómo se servían `/reservar` y `/mi-cuenta` por rewrite |
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
