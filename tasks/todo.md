# Web nueva CLIC — tareas

Plan completo en `docs/plan.md`. Contexto en `docs/contexto.md`.
Una fase por sesión. Marcar a medida que se completa.

**Todo lo que quede pendiente se anota acá**, aunque caiga en otro repo o no sea
código. Si no está en este archivo, no existe.

## La regla que manda sobre todo lo demás

**La landing actual (`clic-pilates-landing`) no se toca más.** Cerró con la
fase 0 y sigue sirviendo `clicpilates.com` hasta el final.

Este proyecto es una versión nueva, con **su propio deploy en Railway**. Todas
las pruebas se hacen ahí, contra su URL propia, hasta estar 100% conformes. El
cambio de dominio es el último paso, no el primero: recién cuando el sitio nuevo
esté aprobado se apunta `clicpilates.com` acá y se activan los `301`.

Consecuencias prácticas:

- Nada de arreglar cosas del sitio viejo, por más que se vean mal. Si aparece
  algo, se anota y se resuelve en la versión nueva.
- El deploy de staging va con `NEXT_PUBLIC_NOINDEX=true`. Dos sitios con el
  mismo contenido compitiendo en Google es exactamente lo que vinimos a evitar.
- Todo lo que es configuración de dominio —el redirect del apex, los `301` de
  los subdominios, Search Console— se ejecuta el día del cambio, no antes.

---

## Cómo se commitea acá (decidido el 7-sep)

**De ahora en adelante: rama + PR.** Nada más directo a `main`.

Hasta el 7-sep este repo no tuvo ni un PR: los siete commits —fase 1, fotos,
franquicias, TODO— fueron todos directos a `main`, que es de donde deploya
Railway. Funcionó porque es un staging con `noindex` y sin tráfico real, pero
deja de tener sentido a medida que el sitio se acerca al cambio de dominio.

Lo ya commiteado se queda donde está. Rehacerlo como PR habría significado
force-pushear `main` para des-mergear trabajo que ya estaba deployado y
verificado en staging, y el diff no habría agregado nada: las fotos ya se
revisaron **renderizadas**, que para material visual es mejor revisión que
mirar un diff de binarios.

Si hace falta revisar una tanda vieja sin abrir un PR, la vista de compare de
GitHub renderiza las imágenes:
`https://github.com/lucasfradus/web-clicpilates-v2/compare/<sha-anterior>...main`

---

## Abierto ahora mismo

| Qué | Dónde | Estado |
|---|---|---|
| Higiene de SEO del sitio actual | [clic-pilates-landing#6](https://github.com/lucasfradus/clic-pilates-landing/pull/6) | ✅ Mergeado y **en producción** (verificado 19-ago). Cierra la fase 0 |
| `?contexto=web` en el endpoint de sedes | [Clicnet#370](https://github.com/lucasfradus/Clicnet/pull/370) | ✅ Mergeado y **en producción** (verificado 16-ago). Falta cerrar el worktree |
| `base` configurable en el SPA de reservas | [reservas-clientes-clic-v2#18](https://github.com/lucasfradus/reservas-clientes-clic-v2/pull/18) | ✅ Mergeado (4-sep) |
| `base` configurable en el portal de clientes | [clic-webapp-clientes#4](https://github.com/lucasfradus/clic-webapp-clientes/pull/4) | ✅ Mergeado (4-sep) |
| CORS: el origen de la web nueva | [Clicnet#408](https://github.com/lucasfradus/Clicnet/pull/408) | ✅ Mergeado (4-sep) y **verificado en producción** (7-sep) |
| CI: el `tsc` redundante que rompía toda rama | [Clicnet#410](https://github.com/lucasfradus/Clicnet/pull/410) | ✅ Mergeado (4-sep) |
| Convención: rama y PR en este repo | [#1](https://github.com/lucasfradus/web-clicpilates-v2/pull/1) | ✅ Mergeado (8-sep) |
| Comprar el plan desde la web | [#2](https://github.com/lucasfradus/web-clicpilates-v2/pull/2) | ✅ Mergeado (8-sep) y en el staging |
| Deep-link `?tipo=` en el portal | [reservas-clientes-clic-v2#19](https://github.com/lucasfradus/reservas-clientes-clic-v2/pull/19) | ✅ Mergeado (8-sep) y **verificado en producción** |

**No queda ningún PR abierto de este proyecto.**

Verificación del 8-sep en `reservas.clicpilates.com`, después de mergear el #19
—que es el único que toca producción—, contra la línea de base tomada antes:

- `/sede/belgrano` **sin parámetros** quedó idéntico: misma landing, mismo
  título, sin errores de consola. Era lo que había que proteger
- `?tipo=97` abre el checkout con ese plan
- `?tipo=999999` cae en la landing, sin romperse

Y desde el 9-sep el circuito **sí se puede probar entero desde la web**: se
destrabó `/reservar` poniendo `VITE_BASE_PATH` en el servicio que apunta el
rewrite (ver el punto más abajo).

Con #408 en producción, el staging dejó de proxear la grilla por su propio
servidor: `NEXT_PUBLIC_API_BASE_URL` en Railway pasó a `https://app.clicpilates.com`
(7-sep) y el preflight desde el origen de staging vuelve `200` con
`access-control-allow-origin` correcto. Eso saca de encima el rate limit de
60 req/min compartido, que era el motivo real del PR.

Falta lo mismo para el dominio definitivo: `https://www.clicpilates.com` ya está
en la allowlist de `Clicnet/src/proxy.ts`, así que el día del cambio de dominio
no hay que tocar el backend — sólo repuntar `NEXT_PUBLIC_API_BASE_URL` si
cambiara, que no es el caso.

Worktrees: los SPAs en `c:/Users/lucas/Clic/.worktrees/`, los de Clicnet en
`Clicnet/.claude/worktrees/` (`cors-dominio-web` y `ci-tsc-memoria`). Los cuatro
están mergeados y se pueden cerrar.

## Al mergear los PRs

- [x] **Clicnet#370** verificado en producción el 16-ago: devuelve `reservaOnline`
      en las 11 sedes
- [x] **clic-pilates-landing#6** verificado en producción el 19-ago: canonical
      autorreferencial en `www.clicpilates.com`, sin `keywords` y con el zoom
      desbloqueado
- [ ] Cerrar el worktree `sedes-contexto-web` de Clicnet con `/cerrar-worktree`
      (y de paso `buscador-alumnos` y `facturas-motivo-error`, que también
      están mergeados)

## Pendientes sueltos (no son de una fase)

- [x] ~~Deploy del sitio nuevo en Railway~~ — hecho el 19-ago:
      `web-clicpilates-v2-production.up.railway.app`, con `NEXT_PUBLIC_NOINDEX=true`,
      deploy automático desde `main`
- [x] ~~CORS del backend: falta el dominio de la web nueva~~ — **cerrado el
      7-sep.** Clicnet#408 mergeado y verificado contra producción: el preflight
      desde el origen de staging devuelve `204` y el GET `200`, los dos con
      `access-control-allow-origin` correcto. `NEXT_PUBLIC_API_BASE_URL` en
      Railway pasó a `https://app.clicpilates.com`, así que la grilla en vivo ya
      no se proxea por nuestro servidor. Eso era lo que importaba: proxeando,
      **todas las llamadas salían de la IP del servidor** y compartían el rate
      limit de 60 req/min de esas rutas. `https://www.clicpilates.com` también
      quedó en la allowlist, así que el cambio de dominio no toca el backend
- [x] ~~El deep-link del plan necesita su mitad en el SPA~~ — **cerrado el
      8-sep** con reservas-clientes-clic-v2#19, mergeado y verificado en
      producción. La web manda `/reservar/sede/<slug>?tipo=<id>` y el portal
      abre el checkout con ese plan
- [x] ~~`/reservar` no cargaba desde la web~~ — **cerrado el 9-sep.** Se puso
      `VITE_BASE_PATH=/reservar/` en el servicio Railway
      **`reservas-clientes-clic-v2`**, que es el que apunta el rewrite. Ahora el
      HTML del portal pide `/reservar/assets/…`, el rewrite le saca el prefijo
      (`RESERVAS_PREFIJO=''`) y el asset resuelve contra la raíz del origen.
      **Con esto el embudo queda completo de punta a punta**: desde el dominio
      de la web, `/reservar/sede/<slug>?tipo=<id>` abre el checkout con ese
      plan. Verificado con Belgrano: JS y CSS en `200`, y el Pack 24 en $327.800,
      el mismo precio que publica la tarjeta.
      Dos cosas que quedan dichas para que nadie se asuste después:
      **1.** `reservas.clicpilates.com` **no se tocó**. Vive en el *otro*
      servicio (`reservas-clientes-clic`), que sigue buildeando con `base: /`
      y responde `200`. La variable es por servicio.
      **2.** El acceso **directo** a
      `reservas-clientes-clic-v2-production.up.railway.app` quedó roto a
      propósito: ahí el HTML pide `/reservar/assets/…` y ese origen sirve los
      archivos en la raíz, así que devuelve el fallback del SPA —HTML con `200`,
      no un `404`— y la página queda en blanco. Ese servicio existe sólo como
      destino del rewrite y no tiene dominio propio, así que es un intercambio
      aceptable; pero **no sirve más para mirar el portal a mano**. Para eso
      está `reservas.clicpilates.com`
- [ ] **El portal de reservas no tiene entorno de pruebas.** Verificado en
      Railway el 8-sep: los **dos** servicios del proyecto "Reservas - Clic
      Pilates" deployan el mismo repo (`reservas-clientes-clic-v2`) y la misma
      rama (`main`). El que se llama `reservas-clientes-clic` —nombre viejo, que
      engaña— es el que tiene `reservas.clicpilates.com`. O sea: **mergear a
      `main` ahí es deployar al checkout que cobra plata**, y el otro dominio de
      Railway no sirve como staging porque es el mismo build.
      Consecuencia que ya es cierta hoy: el `/reservar` del staging de la web
      apunta a ese build de producción, así que **una compra de prueba desde el
      staging cobra de verdad**. Usar la Sede Test.
      Vale un tercer servicio apuntado a la rama del PR antes de tocar el SPA
- [ ] **`begin_checkout` cambia de significado** desde el 8-sep: con el
      deep-link en producción se dispara al cargar la página, no al hacer
      click, porque la intención se expresó en la web. El número va a subir y
      deja de ser comparable con el histórico. No es un bug, pero hay que
      saberlo antes de leer el embudo — y conviene avisarlo antes de decidir
      pauta con esa métrica
- [ ] **El repo no tiene CI.** No hay `.github/workflows/`, así que un PR acá no
      corre ningún check y `main` deploya a Railway sin que nada haya validado
      nada. Mientras se commiteaba directo era coherente; con PRs deja de serlo.
      Los cuatro comandos ya existen en `package.json`: `typecheck`, `lint`,
      `test` y `build`. Alcanza con un workflow que los corra en el PR.
      Ojo con la lección de Clicnet#410: `next build` ya typechequea el
      proyecto, así que `typecheck` aparte sólo tiene sentido por lo que el
      `tsconfig` de build excluye — y hay que darle `NODE_OPTIONS` de memoria o
      se cae por OOM
- [ ] **Intense se publica como si estuviera en todos los estudios, y hoy está
      en uno.** Medido contra la grilla real el 10-sep: `Intense` aparece en
      **Office Pilates** (11 clases) y en ninguna otra sede. `Inicial` está en 8
      y `Level Up` en 7.
      **Es una decisión tomada, no un descuido:** se eligió presentar los tres
      niveles por igual, sin aclarar disponibilidad. Queda anotado porque es la
      única parte del sitio que promete algo que no está en todos lados, y el
      resto está construido sobre "lo que ves acá es lo que hay".
      Se destraba solo de dos maneras: **(a)** que Intense llegue a más sedes,
      que es lo natural si el plan es ese, o **(b)** calcular la disponibilidad
      desde la grilla (`/api/public/sedes/:id/clases`) y mostrarla en la tarjeta
      y en `/clases/intense`. La (b) no se hizo a propósito.
      Mientras tanto: alguien de Belgrano puede leer Intense en la home, ir a
      buscar la clase y no encontrarla
- [ ] **Intense no tiene foto.** `FOTOS` no tiene una entrada para el nivel, así
      que su página muestra el degradado. Desde el 10-sep es —junto con Academy—
      **la única sección sin foto por falta de material, no de permiso**
- [ ] **Verificar el dominio en Search Console.** Necesita a Lucas. Conviene por
      DNS: así vale para el sitio nuevo sin tocar el viejo
- [ ] **El apex redirige con `307`, no con `308`.** Va con el cambio de
      dominio (fase 8), no antes: hoy es config del deploy viejo
- [ ] **La sede de prueba se está publicando, y se nota.** Hoy "Sede Test orig
      · Calle Falsa 123 · $200" sale en la home y en /estudios, y el contador
      dice 11 estudios. Por eso la home ya **no** publica un "clase de prueba
      desde $X" agregado: ese $200 se convertía en el titular del sitio. Se
      arregla apagando la sede desde el backoffice
- [x] ~~Excluir las sedes de prueba del endpoint público~~ — **decidido el
      15-ago: no se excluyen.** Lucas usa las sedes de prueba para testear y las
      apaga desde el backoffice cuando terminan. El único interruptor es
      `Sede.activa`. Implica que una sede de prueba activa se publica en el
      sitio (y entra al sitemap): es el precio de tener un solo interruptor
- [x] ~~Sitemap y robots del sitio actual~~ — **no se hacen.** La landing vieja
      no se toca más; el sitemap sale en la fase 6, acá
- [ ] **Header común con los SPAs** cuando se unifique el dominio. Detalle en
      `docs/rewrites.md`

---

## Fase 0 — Higiene del sitio actual (repo `clic-pilates-landing`) ✅ (15-ago-2026)

Mergeado el 19-ago y verificado en producción. **Con esto la landing vieja queda
cerrada: no se toca más** (ver la regla al principio de este archivo).

- [x] `metadataBase` → `https://www.clicpilates.com` (apuntaba a `clic-landing.vercel.app`, que además hoy devuelve 404)
- [x] Canonical autorreferencial en cada ruta. **No estaba en el checklist y era lo más grave**: el `canonical: '/'` vivía en el layout raíz y los hijos heredan `alternates`, así que `/sede/nunez` se declaraba duplicado de la home
- [x] Sacar `maximumScale: 1` — estaba en dos lugares, el export `viewport` y un `<meta>` hardcodeado en el `<head>` que lo pisaba
- [x] Sacar el array `keywords`
- [x] Sacar `verification.google`, que salía en producción con el placeholder literal
- [x] `noindex` en los deploys de preview (`VERCEL_ENV !== 'production'`), verificado con un build de preview
- [ ] **Necesita a Lucas**: verificar el dominio en Search Console. Conviene por
      DNS, que vale para los dos sitios y no toca el código de ninguno
- [x] ~~Sitemap del sitio viejo~~ — no se hace: sale en la fase 6, en el sitio nuevo

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

## Fase 2 — Capa de datos ✅ (16-ago-2026)

- [x] Cliente de API tipado (`src/lib/api/`), con los tipos copiados de
      `reservas/src/types/index.ts` y extendidos con lo que la web necesita
- [x] `reservaOnline` vive en el tipo de acá: el de reservas es un subconjunto
      (no modela `fotosDetalle`, `imagenFoco`, `mostrarPrecios` ni `planes`) y
      agregarle un campo que ese repo no consume sería trabajo para nadie
- [x] `getSedes` / `getSede` / `getCatalogo` con `revalidate = 3600`
- [x] `getClases` del lado del cliente, sin cache
- [x] Skeletons con altura obligatoria (`BloqueCargando`, `Skeleton`)
- [x] Estados de error y vacío por sección (`EstadoSeccion`)
- [x] Sede sin `reservaOnline`: `accionDeSede()` manda a WhatsApp

Convención de errores de la capa de datos: `null` = falló (mostrar error),
lista vacía = no hay nada (mostrar vacío). No es lo mismo "todavía no hay
clases" que "no pudimos cargar las clases". `getClases` devuelve además
`sin-grilla`, porque su endpoint 404ea cuando la sede no puede vender online.

Verificado: 14 tests con el backend mockeado, y una página temporal contra
**producción** que listó las 11 sedes con su acción resuelta y el catálogo de
Belgrano C. Los 18 campos de la respuesta real coinciden con los tipos.

## Fase 3 — Landings de sede ✅ (19-ago-2026)

- [x] `/estudios` (índice) con las tarjetas de sede y foto con foco
- [x] `/estudios/[slug]` con `generateStaticParams`: 11 landings prerenderizadas
- [x] `generateMetadata` por sede: title, description, canonical y OG
- [x] H1 por zona ("Pilates reformer en Núñez", no "Nuñez")
- [x] Migas visibles + `BreadcrumbList`
- [x] 5 FAQs por sede, visibles + `FAQPage`. Con `<details>` nativo: cero JS y
      la respuesta está en el HTML aunque el acordeón esté cerrado
- [x] JSON-LD `LocalBusiness` — **parcial a propósito**: sin `geo`,
      `telephone`, dirección desagregada ni horarios de apertura, que no
      existen en el modelo. Se completa con la migración de `Sede`
- [x] Grilla en vivo del lado del cliente, con skeleton de la misma altura
- [x] Planes de la sede con el descuento de la clase de prueba visible
- [x] Galería con `fotosDetalle[].foco` como `object-position`
- [x] Enlazado interno a sedes cercanas (misma ciudad)

Verificado contra **producción**: build con las 11 landings, `tsc`, `lint`,
14 tests, y capturas del índice, la landing (hero, grilla real, planes, FAQ) y
mobile. El JSON-LD emite Organization + LocalBusiness con 7 ofertas + FAQPage
con 5 preguntas + BreadcrumbList.

Dos cosas que salieron de mirar la página, no el código:

- **Los planes trimestrales decían "por mes"**: `$290.000` es el total de los
  tres meses del Pack 24, no su mensual. Corregido — el trimestral dice "los 3
  meses" y su descuento dice "tu primer pago", no "tu primer mes"
- El título salía duplicado ("… · CLIC Nuñez · CLIC studio pilates") porque la
  plantilla del layout ya agrega la marca

Pendientes que quedan de esta fase:

- [ ] **La grilla llega sin las clases llenas.** `/api/public/sedes/:id/clases`
      filtra `cuposDisponibles > 0`: una franja completa se ve como un hueco en
      el horario. Decidir si se muestra "completo" (necesita cambio de backend)
      o se acepta y se documenta
- [ ] **Ese endpoint 404ea para una sede sin venta online.** La landing ya lo
      resuelve mostrando "no publica su grilla" + WhatsApp, pero si se quiere
      mostrar la grilla igual hace falta el mismo `contexto=web` allá
- [ ] **`Sede.zona` no existe**: el mapa de barrios está a mano en
      `src/lib/zona.ts`. Va con la migración de `Sede`
- [ ] **Texto propio por sede (~300 palabras).** Hoy la landing usa
      `Sede.descripcion`, que es de una línea. Lo tiene que escribir el dueño


## Fase 4 — Home y marca ✅ (19-ago-2026)

- [x] Hero con selector de sede y disponibilidad real ("4 clases con lugar hoy ·
      próxima 15:00", del backend)
- [x] Sección manifiesto CLIC /klik/, con el isotipo de marca de agua
- [x] Banda HACÉ EL CLIC
- [x] Método, niveles, app, grilla de sedes
- [x] Sección de cómo funciona la clase de prueba
- [x] Reveals con `IntersectionObserver`, con `<noscript>` que los deja
      visibles sin JS y `prefers-reduced-motion` respetado
- [ ] **Testimonios: NO se hacen hasta tener los reales.** Inventar testimonios
      con nombre y sede en el sitio de un negocio real no es una opción. La
      sección entra cuando lleguen

Regla de copy que quedó aplicada en toda la home: **ningún número sin
confirmar**. Se sacaron de todo el sitio "nueve estudios", "grupos de hasta
ocho" y el "4.9 en Google" — el único número que se publica es la cantidad de
estudios, que sale de la API.

Pendientes que quedan de esta fase:

- [x] ~~Fotos: falta el consentimiento de las personas reconocibles~~ —
      **cerrado el 10-sep: llegó el permiso para todas.** Era el bloqueante real
      de la parte visual del sitio. Ya no queda ninguna foto en
      `publicable: false`, así que ninguna sección muestra el degradado por ese
      motivo: **el hero de la home dejó de ser un degradado** y la página de
      Inicial tiene su foto.
      El interruptor **no se sacó**: la próxima tanda entra igual, con
      `publicable: false` hasta que su permiso exista.
- [x] ~~La OG de 1200×630 falta~~ — **hecha el 10-sep.** `public/og.jpg`, un
      recorte del hero generado por `scripts/preparar-og.mjs` respetando el
      punto focal, y declarada en el `openGraph` del layout, así que la heredan
      todas las páginas que no traigan la suya.
      Antes de esto el sitio **no tenía ninguna**: el link viajaba sin imagen, y
      encima `twitter:card` decía `summary_large_image`, que es la variante
      grande — la peor versión posible de no tener foto.
- [ ] **Faltan tres fotos que no existen en ninguna fuente.** Ya no es un tema
      de permisos, es de producción:
      **(a) Academy** — una instructora formando a otra.
      **(b) Intense** — una clase del nivel nuevo.
      **(c) Vestuarios** — pero ojo: **el sitio no tiene un slot de vestuarios**.
      Iría como una de las tres fotos de la galería de cada estudio, y **esas
      salen del backend** (`sede.fotosDetalle`), o sea que se cargan desde el
      backoffice de Clicnet, no desde este repo. Lo que falta ahí no es "una
      foto de vestuarios": es que las once galerías hoy son heterogéneas y se
      verían como una familia con el mismo set de tres por sede — fachada,
      plano general y un detalle (ver `docs/fotos.md`). Si hay que elegir una
      sola, la fachada es la que más sirve: es la que permite reconocer el
      lugar al llegar.
      El brief original está en `docs/fotos.md` — cinco piezas, en orden de impacto, con
      qué tiene que mostrar cada una y cómo tienen que estar hechas
- [ ] **Decidir dónde va `metodo/metodo-correccion.jpg`.** Es la mejor foto sin
      usar que tenemos —la instructora corrigiendo, que es la prueba visual del
      argumento de los grupos chicos— y ya tiene permiso. Sirve para "El
      método" o para Academy, pero **no para las dos**: se nota
- [ ] **Links de las tiendas** para la sección de la app: hoy los badges se ven
      pero no son links, porque no tenemos las URLs. Un botón que no lleva a
      ningún lado es peor que no tenerlo
- [ ] **Confirmar los números** para poder publicarlos: 4.9 en Google, máximo
      por clase, y cuántos estudios son de verdad


## Fase 5 — Resto de páginas ✅ (19-ago-2026)

- [x] `/precios` con selector de estudio. Los 11 catálogos vienen con la
      página, así que cambiar de estudio no dispara ni un pedido
- [x] `/clases/initial-pilates` y `/clases/level-up-pilates`, con sus FAQs
- [x] `/academy`, con formulario propio
- [x] `/franquicias`, con formulario y embudo aparte
- [x] `/politicas` migrada del sitio actual — **texto legal portado tal cual**,
      con un script; sólo cambiaron el envoltorio y los estilos

El formulario (`/api/contacto`) manda por Resend, a la misma casilla que usaba
el sitio anterior. Tiene honeypot contra bots y valida del lado del servidor.
Sin `RESEND_API_KEY` devuelve 503 y el formulario muestra el mail para escribir
directo: un formulario que dice "gracias" y no manda nada es peor que no
tenerlo.

Verificado: las 6 rutas responden 200, `/clases/no-existe` da 404, y la API
contesta 503 sin key, 400 con datos incompletos y 200 al honeypot sin enviar
nada.

Pendientes de esta fase:

- [ ] **`RESEND_API_KEY` en Railway.** Hasta que esté, los dos formularios
      muestran el mail en vez de enviar. La key es la misma que usa el sitio
      actual (está en su proyecto de Vercel)
- [ ] **Confirmar el contenido de Academy y Franquicias.** Las dos páginas dicen
      sólo lo que podemos sostener. Falta que el dueño confirme, para poder
      publicarlas: duración, modalidad y precio de la formación; e inversión,
      plazos, fee y exclusividad territorial de la franquicia
- [ ] El pixel propio de Franquicias es de la fase 7


## Fase 6 — SEO técnico ✅ (19-ago-2026)

- [x] `app/sitemap.ts` alimentado por las sedes: 19 URLs, y una sede nueva
      entra sola dentro de la hora. Sin `lastModified`, porque el backend no
      expone `updatedAt` y poner la fecha del build sería mentirle a Google
      sobre qué cambió
- [x] `app/robots.ts` con `/api/`, `/reservar` y `/mi-cuenta` afuera
- [x] `301` desde `/sede/[slug]`, `/horarios/[sede]` y `/grilla/[sede]`.
      **`office` es el único slug que cambió** (ahora `office-pilates`) y tiene
      su regla propia antes de la genérica; `prueba`, que era una página de
      test, va al índice
- [x] Canonical autorreferencial en toda ruta. Se sacó del layout raíz: los
      hijos heredan `alternates`, así que dejarlo ahí habría repetido el bug
      que arreglamos en el sitio viejo
- [ ] **Validar en Rich Results Test.** Necesita una URL pública: se corre
      contra el staging cuando quieras, o contra el dominio el día del cambio
- [ ] **Los perfiles de Google apuntando a su landing.** Es del día del cambio
      de dominio, y lo hace Lucas desde el perfil de cada estudio

En staging el sitemap sale vacío y sin `Sitemap:` en el robots, a propósito:
el sitio va con `noindex` y no le vamos a ofrecer a Google una lista de URLs
que no tiene que indexar. Lo que **no** se hace es bloquear el rastreo — si lo
bloqueáramos, Google no podría leer el `noindex`.


## Fase 7 — Medición ✅ (19-ago-2026) — con dos partes en otros repos

- [x] Portado `reservas/src/lib/meta.ts`: pixel por `Sede.metaPixelId`, todo por
      `trackSingle`. Con varios pixels vivos, `fbq('track')` dispara a todos y
      una franquicia terminaría viendo las conversiones de otra
- [x] El mapa sede → pixel lo arma el servidor y viaja por props: la versión de
      reservas tenía que pedirlo a la API y correr una carrera contra un
      timeout; acá las sedes ya están renderizadas
- [x] GA4 con `sede` y `sede_slug` en cada evento
- [x] Eventos de este sitio: PageView, ViewContent (landing de sede, contra el
      pixel de esa sede) y Lead (formularios, sólo si el envío salió bien)
- [x] UTMs persistidas y re-adjuntadas a los links a `/reservar`, para que el
      checkout —que vive en otro SPA— no vea la venta como directa
- [x] **La medición no corre en staging.** Un deploy de pruebas mandando eventos
      a las cuentas reales ensucia los números con los que se decide la pauta

Verificado en el navegador: carga gtag y fbevents, guarda las UTMs de la URL y
el CTA a `/reservar` sale con ellas pegadas.

Lo que queda, y no es de este repo:

- [ ] **AddToCart, InitiateCheckout y Purchase** los emite el portal de reservas,
      que ya los tiene (PR #307 y #311 de Clicnet). Hay que verificar que el
      embudo se lea completo cuando los dos sitios compartan dominio
- [ ] **Conversions API desde el webhook de Mercado Pago**, con `event_id`
      compartido para deduplicar. Es backend (Clicnet) y sigue pendiente el
      token de CAPI de Clic Wellness
- [ ] **Verificar la deduplicación en Events Manager** una vez que CAPI esté
- [ ] Cargar `NEXT_PUBLIC_META_PIXEL_ID` y `NEXT_PUBLIC_GA_MEASUREMENT_ID` en
      Railway el día del lanzamiento (en staging no hacen falta: está apagada)


## Fase 8 — QA ✅ (19-ago-2026) · el lanzamiento queda listo para ejecutar

Medido con Lighthouse contra el staging:

| | Home (móvil) | Landing de sede (desktop) |
|---|---|---|
| Performance | 99 | 100 |
| Accesibilidad | 100 | 100 |
| Buenas prácticas | 100 | 100 |
| LCP | 1,6 s | 0,6 s |
| CLS | 0 | 0,001 |
| TBT | 20 ms | 0 ms |

- [x] Lighthouse móvil dentro de los objetivos (LCP < 2,5 s / CLS < 0,1)
- [x] Contraste: la primera pasada dio 96 y el chip de "quedan 2 lugares"
      estaba en 2,84:1. Se agregaron variantes de texto de los colores de marca
      (`--taupe-texto`, `--sage-texto`, `--terracotta-texto`), medidas una por
      una
- [x] Teclado: el skip link es el primer foco y lleva a `#contenido`; el menú
      mobile cerrado va con `inert`, así que sus 7 links no son alcanzables; el
      acordeón de FAQ es `<details>` nativo
- [x] Lectores: un solo `h1`, un `main`, los tres `nav` etiquetados, ninguna
      imagen sin `alt`
- [x] Flujo end-to-end en staging: home → landing → CTA → el SPA de reservas
      responde
- [x] `docs/lanzamiento.md`: el orden exacto del cambio de dominio, con lo que
      va antes, lo que va ese día y lo que **no** hay que hacer
- [ ] **iOS y Android reales.** No lo puedo hacer yo: hay que abrir el staging
      en un teléfono de verdad y probar el menú, el selector de sede y la grilla.
      Mirar de paso cuánto tarda la grilla en llenarse: en desktop, contra el
      backend real, todavía muestra el esqueleto a los ~3 s y está completa
      antes de los 9 s. No es el backend —`/api/public/sedes` responde en ~1,2 s
      y `/api/public/catalogo` en ~0,7 s—, así que es el bundle hidratando en un
      contenedor frío. En 4G puede ser bastante peor
- [ ] **El cambio de dominio.** Está todo listo y documentado; lo ejecuta Lucas

Lo único que en staging no se puede probar completo es `/reservar`: devuelve el
HTML del SPA pero pide sus assets en la raíz del dominio.

**Esto ya se puede destrabar** (7-sep): los dos PRs que faltaban están
mergeados —[reservas-clientes-clic-v2#18](https://github.com/lucasfradus/reservas-clientes-clic-v2/pull/18)
y [clic-webapp-clientes#4](https://github.com/lucasfradus/clic-webapp-clientes/pull/4)—,
así que alcanza con que esos dos deploys buildeen con `VITE_BASE_PATH`
(`/reservar` y `/clientes` respectivamente). Es el primer punto de
`docs/lanzamiento.md`. Ojo con el detalle que ya nos costó una vez:
`import.meta.env.BASE_URL` trae la barra final, y react-router necesita el
`basename` sin ella.

---

## Backend (`Clicnet`) — en paralelo, destraba la fase 3

- [x] `?contexto=web` en `/api/public/sedes`: toda sede `activa` + booleano `reservaOnline` — [PR #370](https://github.com/lucasfradus/Clicnet/pull/370), mergeado y en produccion
- [ ] Migración de `Sede`: `latitud`, `longitud`, `telefono`, `calle`, `localidad`, `provincia`, `codigoPostal`, `zona`
- [ ] Exponer `updatedAt` para el `lastModified` del sitemap
- [ ] Horarios de apertura del estudio (o derivarlos del mín/máx de la grilla)
- [x] ~~Excluir la IP del servidor del rate limit, o API key de servicio~~ — ya no hace falta: con Clicnet#408 el navegador le pega directo al backend y cada visitante gasta su propio rate limit, no el del servidor

---

## Bloqueado — esperando material del dueño

- [ ] Logo vectorial (SVG / AI / EPS) — mientras tanto hay un trazado del PNG,
      hecho por `scripts/trace-logo.mjs`. Cuando llegue el original se reemplaza
      `src/components/brand/logo-path.ts` y se borra el script
- [ ] Fotos de espacios comunes: recepción, vestuarios, plano general de sala,
      detalle de reformer y Academy enseñando. **La instructora corrigiendo ya
      no falta**: llegó el 4-sep como `metodo/metodo-correccion.jpg` y lo único
      que la frena es el consentimiento
- [ ] Testimonios reales con nombre y sede
- [ ] Texto propio por sede (~300 palabras: qué tiene, cómo llegar, instructoras)
- [ ] Confirmar 4.9 en Google, máximo por clase y cantidad de sedes activas
