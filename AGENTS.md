# AGENTS.md — web nueva de CLIC

## Antes de escribir una sola línea

Leer, en este orden:

1. `docs/contexto.md` — de dónde sale el design system, qué trampas tiene la API,
   qué decisiones ya están tomadas. **No es opcional.** Sin esto se toman caminos
   que parecen razonables y están mal.
2. `docs/plan.md` — el plan por fases.
3. `tasks/todo.md` — el estado actual.
4. `docs/prototipo.html` — abrilo en el navegador. Es la especificación visual.

## Cómo trabajar

- **Una fase por sesión.** El plan tiene ocho. Meterlas todas en una conversación
  degrada la calidad hacia el final.
- Plan primero en `tasks/todo.md`, con ítems marcables. Confirmar antes de
  implementar.
- **Todo pendiente se anota en `tasks/todo.md`**, aunque caiga en otro repo, no
  sea código o dependa de un tercero. Lo que queda sólo dicho en una respuesta
  se pierde.
- Verificar antes de dar algo por hecho: correr el build, mirar la página, probar
  el flujo. Nunca marcar una tarea completa sin demostrar que anda.
- Capturar correcciones del usuario en `tasks/lessons.md`.
- Cambios de alcance mínimo. Nada de refactors no pedidos.

## Las tres cosas que más se hacen mal en este proyecto

1. **Copiar el look del sitio actual.** El design system está en
   `reservas-clientes-clic-v2/src/styles/globals.css`, no en `clic-pilates-landing`.
   El sitio actual es shadcn con efectos de MagicUI encima: eso es justamente lo
   que estamos reemplazando.
2. **Reusar `/api/public/sedes` tal cual para la web pública.** Su filtro esconde
   sedes sin cuenta de Mercado Pago activa. Ver `docs/contexto.md` §3.
3. **Diferir contenido indexable al cliente.** La grilla de clases sí se difiere;
   nombre, dirección, descripción y precios de la sede van en el HTML del
   servidor, cacheados con ISR.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript. Datos desde `/api/public/*` de
ClicNet. Los tipos se reusan de `reservas-clientes-clic-v2/src/types/index.ts`.
`/reservar` y `/mi-cuenta` se sirven por rewrite a los SPAs existentes
(ver `docs/rewrites.md`).

Estilos: CSS plano y global, con la convención del design system de reservas
(`.hdr__link`, `.ftr__list`). Todo entra por `src/styles/globals.css`, en orden:
tokens, base, componentes. Los tokens no se inventan acá — salen de
`reservas-clientes-clic-v2/src/styles/globals.css`.

Comandos: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
