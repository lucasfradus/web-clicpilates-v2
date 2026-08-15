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

Con esto se navega el sitio **y** los dos SPAs dentro del mismo dominio, contra
la base de datos local. Cuatro procesos:

| Qué | Dónde | Cómo se levanta |
|---|---|---|
| Backend ClicNet | `:3000` | `npm run dev` en el repo `Clicnet` (con su DB de Docker en `:5433`) |
| Esta web | `:3005` | `npm run dev` |
| SPA de reservas | `:5180` | `VITE_BASE_PATH=/reservar/ npx vite --port 5180` |
| SPA de clientes | `:5181` | `VITE_BASE_PATH=/mi-cuenta/ npx vite --port 5181` |

Y en `.env.local`:

```
RESERVAS_ORIGIN=http://localhost:5180
RESERVAS_PREFIJO=/reservar
CLIENTES_ORIGIN=http://localhost:5181
CLIENTES_PREFIJO=/mi-cuenta
API_ORIGIN=http://localhost:3000
```

Dos cosas que no son obvias y cuestan una tarde si no se saben:

- **`vite dev` sirve todo debajo del prefijo**, y un build de Vite no: sirve en
  la raíz aunque pida los assets con prefijo. Por eso los `*_PREFIJO`, que van
  vacíos contra un deploy.
- **Detrás del rewrite, los SPAs piden su API a este origen**, no al suyo, así
  que el proxy de Vite deja de intervenir. De ahí `API_ORIGIN`.

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
