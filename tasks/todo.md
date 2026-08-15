# Web nueva CLIC — tareas

Plan completo en `docs/plan.md`. Contexto en `docs/contexto.md`.
Una fase por sesión. Marcar a medida que se completa.

**Todo lo que quede pendiente se anota acá**, aunque caiga en otro repo o no sea
código. Si no está en este archivo, no existe.

---

## Abierto ahora mismo

| Qué | Dónde | Estado |
|---|---|---|
| Higiene de SEO del sitio actual | [clic-pilates-landing#6](https://github.com/lucasfradus/clic-pilates-landing/pull/6) | Esperando merge. Al mergear, deploya |
| `?contexto=web` en el endpoint de sedes | [Clicnet#370](https://github.com/lucasfradus/Clicnet/pull/370) | Esperando merge. **Destraba la fase 2** |
| `base` configurable en el SPA de reservas | rama `chore/base-path-rewrite` en `reservas-clientes-clic-v2` | Commiteada, **sin pushear** |
| `base` configurable en el portal de clientes | rama `chore/base-path-rewrite` en `clic-webapp-clientes` | Commiteada, **sin pushear** |

Los dos worktrees de los SPAs están en `c:/Users/lucas/Clic/.worktrees/`. Los
cambios son no-destructivos: sin `VITE_BASE_PATH` el build sale idéntico al de
hoy, así que se pueden mergear antes de publicar la web nueva.

## Pendientes sueltos (no son de una fase)

- [ ] **Verificar el dominio en Search Console.** Necesita a Lucas. Por DNS no
      toca código; por meta tag va en el `layout.tsx` del sitio actual
- [ ] **El apex redirige con `307`, no con `308`.** `clicpilates.com` →
      `www.clicpilates.com` responde temporal en vez de permanente; para un
      redirect de host canónico conviene permanente. Es config de dominio en
      Vercel, no código
- [x] ~~Excluir las sedes de prueba del endpoint público~~ — **decidido el
      15-ago: no se excluyen.** Lucas usa las sedes de prueba para testear y las
      apaga desde el backoffice cuando terminan. El único interruptor es
      `Sede.activa`. Implica que una sede de prueba activa se publica en el
      sitio (y entra al sitemap): es el precio de tener un solo interruptor
- [ ] **El sitio actual no tiene `sitemap.xml` ni `robots.txt`.** Decidir si se
      agregan mientras siga vivo (~30 líneas) o si se espera a la fase 6 de la
      web nueva
- [ ] **Header común con los SPAs** cuando se unifique el dominio. Detalle en
      `docs/rewrites.md`

---

## Fase 0 — Higiene del sitio actual (repo `clic-pilates-landing`) ✅ (15-ago-2026)

PR abierto: [clic-pilates-landing#6](https://github.com/lucasfradus/clic-pilates-landing/pull/6)
(rama `fix/seo-higiene`, worktree en `c:/Users/lucas/Clic/.worktrees/landing-seo-fase0`).
Al mergear, Vercel deploya solo.

- [x] `metadataBase` → `https://www.clicpilates.com` (apuntaba a `clic-landing.vercel.app`, que además hoy devuelve 404)
- [x] Canonical autorreferencial en cada ruta. **No estaba en el checklist y era lo más grave**: el `canonical: '/'` vivía en el layout raíz y los hijos heredan `alternates`, así que `/sede/nunez` se declaraba duplicado de la home
- [x] Sacar `maximumScale: 1` — estaba en dos lugares, el export `viewport` y un `<meta>` hardcodeado en el `<head>` que lo pisaba
- [x] Sacar el array `keywords`
- [x] Sacar `verification.google`, que salía en producción con el placeholder literal
- [x] `noindex` en los deploys de preview (`VERCEL_ENV !== 'production'`), verificado con un build de preview
- [ ] **Necesita a Lucas**: verificar el dominio en Search Console (por DNS no toca código; si es por meta tag, va en `layout.tsx`)
- [ ] **Decisión pendiente**: el sitio actual no tiene `sitemap.xml` ni `robots.txt`. No se puede "enviar el sitemap" porque no existe. Son ~30 líneas si se quiere sumar mientras el sitio viejo siga vivo

## Fase 1 — Esqueleto ✅ (15-ago-2026)

- [x] Proyecto Next.js 16 (App Router, TypeScript, Turbopack)
- [x] Copiar tokens de `reservas-clientes-clic-v2/src/styles/globals.css` → `src/styles/tokens.css`
- [x] Fuentes con `next/font`: Poppins (200-700) + Prata, self-hosted
- [x] Layout: header con estados transparente/sólido, footer, nav mobile
- [x] `next.config.ts` con rewrites de `/reservar/*` y `/mi-cuenta/*`
- [x] `base` configurable en el `vite.config.ts` de reservas y `basename` del router
- [x] Ídem para el portal de clientes
- [x] Logo SVG (vectorizado del PNG con `scripts/trace-logo.mjs`; el vectorial de verdad sigue pendiente)
- [x] Definir `www` vs apex y redirigir el otro (`www`, con `301` desde el apex en `next.config.ts`)

Verificado: `npm run build`, `npm run lint`, `npm run typecheck` y capturas en
1440px y 390px de la home (header transparente), la home scrolleada (header
sólido), el 404 (sólido sin JS, por `:has([data-hero])`) y el menú mobile.

Decisiones de esta fase, por si hay que revisarlas:

- El header transparente/sólido no usa JavaScript para saber si la página tiene
  hero: lo resuelve `body:not(:has([data-hero]))` en CSS. Así el HTML del
  servidor ya sale bien pintado y no parpadea al hidratar. El JS sólo agrega
  `.hdr--scrolled`. Una página que quiera header transparente marca su hero con
  `data-hero`.
- Los dos estados del header salen de variables CSS y un solo bloque de
  selectores, en vez de duplicar `.hdr--solid .algo` por cada hijo como hace el
  prototipo.
- `/reservar` y `/mi-cuenta` se enlazan con `<a>` y no con `<Link>` (ver
  `src/components/enlace.tsx`): el routing de cliente de Next espera del otro
  lado una respuesta que un Vite no devuelve.
- El cambio de los SPAs quedó **commiteado y sin pushear**, en una rama
  `chore/base-path-rewrite` por repo, y es no-destructivo: sin la variable
  `VITE_BASE_PATH` el build sale idéntico al de hoy. Ver `docs/rewrites.md`.
- La home tiene sólo el hero: es lo que el esqueleto necesitaba para probarse.
  El contenido de marca es la fase 4.
- `/estudios`, `/precios`, `/academy`, `/franquicias` y `/politicas` devuelven
  404 hasta las fases 3 y 5. Es preferible a publicar páginas vacías indexables.

## Fase 2 — Capa de datos ← la que sigue

Depende de que se mergee y deploye [Clicnet#370](https://github.com/lucasfradus/Clicnet/pull/370).
Mientras tanto se puede desarrollar contra el backend del worktree
`.claude/worktrees/sedes-contexto-web` levantado en otro puerto.

- [ ] Cliente de API tipado reusando `reservas/src/types/index.ts`
- [ ] `reservaOnline` no está en el tipo `Sede` de reservas (es nuevo, sale de
      #370): decidir si se agrega allá o se extiende el tipo acá
- [ ] `getSedes` / `getSede` / `getCatalogo` con `revalidate = 3600`
- [ ] `getClases` del lado del cliente, sin cache
- [ ] Skeletons con la misma altura que el contenido real (cuidar CLS)
- [ ] Estados de error y vacío por sección
- [ ] Sede sin `reservaOnline`: mostrar WhatsApp en vez del botón de reservar
      (es para lo que existe el booleano)

## Fase 3 — Landings de sede ← la fase que más rinde

- [ ] `/estudios` (índice)
- [ ] `/estudios/[slug]` con `generateStaticParams`
- [ ] `generateMetadata` por sede: title, description, canonical, OG
- [ ] H1 por zona ("Pilates reformer en Núñez", no "Núñez")
- [ ] Breadcrumbs visibles + `BreadcrumbList`
- [ ] 5 FAQs por sede, visibles + `FAQPage`
- [ ] JSON-LD `LocalBusiness` (bloqueado por la migración de `Sede`)
- [ ] Grilla en vivo dentro de `<Suspense>`
- [ ] Planes de la sede con el descuento de la clase de prueba visible
- [ ] Galería usando `fotosDetalle[].foco` como `object-position`
- [ ] Enlazado interno a sedes cercanas

## Fase 4 — Home y marca

- [ ] Hero con selector de sede y disponibilidad real
- [ ] Sección manifiesto CLIC /klik/
- [ ] Banda HACÉ EL CLIC
- [ ] Método, niveles, testimonios, app, grilla de sedes
- [ ] Sección de cómo funciona la clase de prueba
- [ ] Reveals con `IntersectionObserver` + `prefers-reduced-motion`

## Fase 5 — Resto de páginas

- [ ] `/precios` con selector de sede
- [ ] `/clases/initial-pilates`, `/clases/level-up-pilates`
- [ ] `/academy`
- [ ] `/franquicias` con formulario propio y su pixel
- [ ] `/politicas` migrada desde la landing actual

## Fase 6 — SEO técnico

- [ ] `app/sitemap.ts` alimentado por las sedes
- [ ] `app/robots.ts` con `/mi-cuenta` y `/reservar` excluidos
- [ ] `301` desde `/sede/[slug]`, `/horarios/[sede]`, `/grilla/[sede]`
- [ ] `301` desde `reservas.` y `clientes.` a las rutas nuevas
- [ ] Canonical autorreferencial en toda ruta
- [ ] Validar todo en Rich Results Test
- [ ] Los nueve perfiles de Google apuntando a su landing

## Fase 7 — Medición

- [ ] Portar `reservas/src/lib/meta.ts` (pixel por `Sede.metaPixelId`)
- [ ] Eventos: ViewContent, Search, AddToCart, InitiateCheckout, Purchase, Lead
- [ ] Conversions API desde el webhook de Mercado Pago, con `event_id` compartido
- [ ] Verificar deduplicación en Events Manager
- [ ] GA4 con `sede` como dimensión personalizada
- [ ] UTMs persistidos hasta el `CheckoutPlanPayload`

## Fase 8 — QA y lanzamiento

- [ ] Lighthouse móvil: LCP < 2,5 s / INP < 200 ms / CLS < 0,1
- [ ] Teclado y lectores de pantalla
- [ ] iOS y Android reales
- [ ] Flujo completo end-to-end contra producción
- [ ] Deploy con los `301` activos desde el minuto cero

---

## Backend (`Clicnet`) — en paralelo, destraba la fase 3

- [x] `?contexto=web` en `/api/public/sedes`: toda sede `activa` + booleano `reservaOnline` — [PR #370](https://github.com/lucasfradus/Clicnet/pull/370), esperando merge
- [ ] Migración de `Sede`: `latitud`, `longitud`, `telefono`, `calle`, `localidad`, `provincia`, `codigoPostal`, `zona`
- [ ] Exponer `updatedAt` para el `lastModified` del sitemap
- [ ] Horarios de apertura del estudio (o derivarlos del mín/máx de la grilla)
- [ ] Excluir la IP del servidor del rate limit, o API key de servicio

---

## Bloqueado — esperando material del dueño

- [ ] Logo vectorial (SVG / AI / EPS) — mientras tanto hay un trazado del PNG,
      hecho por `scripts/trace-logo.mjs`. Cuando llegue el original se reemplaza
      `src/components/brand/logo-path.ts` y se borra el script
- [ ] Fotos de espacios comunes: recepción, vestuarios, plano general de sala,
      detalle de reformer, instructora corrigiendo, Academy enseñando
- [ ] Testimonios reales con nombre y sede
- [ ] Texto propio por sede (~300 palabras: qué tiene, cómo llegar, instructoras)
- [ ] Confirmar 4.9 en Google, máximo por clase y cantidad de sedes activas
