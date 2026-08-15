# Los dos SPAs servidos por rewrite

`/reservar` y `/mi-cuenta` no son páginas de este proyecto: son los dos SPAs que
ya funcionan, servidos bajo el mismo dominio (`docs/plan.md` §1). Este documento
es lo que hay que saber para que eso ande el día del deploy.

## Qué pasa si sólo se pone el rewrite

Nada bueno. El rewrite devuelve el `index.html` del SPA, pero ese HTML pide sus
assets a la **raíz** del dominio (`/assets/index-abc.js`). En
`clicpilates.com` esa ruta no existe —el rewrite cubre `/reservar/*`, no
`/assets/*`— así que la página queda en blanco. Y aunque cargaran, el router
del SPA creería que su raíz es `/`, y cualquier navegación interna se saldría
del rewrite.

Las dos cosas se arreglan con el mismo dato: decirle al SPA bajo qué prefijo
vive.

## El cambio del lado de los SPAs

Ya está hecho, en una rama por repo (ver más abajo). En los dos:

```ts
// vite.config.ts
const base = process.env.VITE_BASE_PATH || '/'
export default defineConfig({ base, /* ... */ })
```

```tsx
// src/main.tsx
<BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
```

Esa barra final importa: `BASE_URL` vale `/reservar/`, y con ese valor
react-router no matchea la URL sin barra (`/reservar`). No tira error — deja la
página en blanco.

Es una sola variable y no cambia nada por defecto: **sin `VITE_BASE_PATH` el
build sale idéntico al de hoy**, así que los deploys actuales
(`clientes.clicpilates.com` y el de reservas) siguen funcionando igual hasta que
alguien decida lo contrario.

| Repo | Rama | Variable de build |
|---|---|---|
| `reservas-clientes-clic-v2` | `chore/base-path-rewrite` | `VITE_BASE_PATH=/reservar/` |
| `clic-webapp-clientes` | `chore/base-path-rewrite` | `VITE_BASE_PATH=/mi-cuenta/` |

Verificado en los dos: con la variable, `dist/index.html` pide
`/reservar/assets/...` y `/mi-cuenta/assets/...`; sin la variable, `/assets/...`.

## El cambio del lado de esta web

En `next.config.ts`, con los orígenes por variable de entorno:

```
RESERVAS_ORIGIN=https://reservas-clientes-clic-v2-production.up.railway.app
CLIENTES_ORIGIN=https://clientes.clicpilates.com
```

Contra un `vite dev` hacen falta dos cosas más, que en producción no van (el
README las explica en "Entorno local completo"):

- `RESERVAS_PREFIJO` / `CLIENTES_PREFIJO`, porque el dev server sirve todo
  debajo del prefijo y el build no.
- `API_ORIGIN`, porque detrás del rewrite los SPAs le piden la API a **este**
  origen y el proxy de Vite deja de intervenir. En producción no hace falta:
  cada SPA buildea con `VITE_API_BASE_URL` apuntando al backend real. Si algún
  día se decide exponer `clicpilates.com/api/*`, es una decisión aparte y hay
  que pensar cache y rate limit.

## Orden del día del deploy

1. Redeployar los dos SPAs con su `VITE_BASE_PATH` (los servicios nuevos que
   sirvan al rewrite; si se reusan los actuales, sus subdominios pasan a
   depender de este dominio).
2. Deployar esta web con `RESERVAS_ORIGIN` y `CLIENTES_ORIGIN` apuntando ahí.
3. Recién entonces, los `301` de los subdominios viejos a las rutas nuevas
   (fase 6). Antes no: quedarían apuntando a un rewrite que todavía no anda.

## Pendiente cuando se unifique el dominio

- **Header común.** Los SPAs replican el header con los mismos tokens, o
  consumen un fragmento de esta web. Ya comparten paleta y tipografía, así que
  el salto visual es nulo (`docs/plan.md` §1).
- **Cookies.** Al quedar todo en el mismo host, la sesión del portal pasa a ser
  de primera parte. Es la ganancia grande del esquema: hoy, en Safari, una
  cookie en `clientes.clicpilates.com` sufre restricciones que desaparecen.
