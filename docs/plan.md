# CLIC — Plan de implementación de la web nueva

Proyecto: `clicpilates.com` en Next.js (App Router), un solo dominio, reutilizando
el backend y los frontends que ya funcionan.

Documento hermano: `docs/seo.md` (SEO, ads y medición).

---

## 1. Arquitectura

**Next.js nuevo para marketing y SEO. Los SPAs actuales se sirven por rewrite.**

```
clicpilates.com/                    → Next.js nuevo (SSR/ISR, indexable)
clicpilates.com/estudios/[slug]     → Next.js nuevo  ← el activo de SEO
clicpilates.com/precios             → Next.js nuevo
clicpilates.com/academy             → Next.js nuevo
clicpilates.com/franquicias         → Next.js nuevo
clicpilates.com/reservar/*          → rewrite a reservas-clientes-clic-v2
clicpilates.com/mi-cuenta/*         → rewrite a clic-webapp-clientes
```

```ts
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites () {
    return [
      { source: '/reservar', destination: `${RESERVAS_ORIGIN}/` },
      { source: '/reservar/:path*', destination: `${RESERVAS_ORIGIN}/:path*` },
      { source: '/mi-cuenta', destination: `${CLIENTES_ORIGIN}/` },
      { source: '/mi-cuenta/:path*', destination: `${CLIENTES_ORIGIN}/:path*` },
    ]
  },
}
```

Por qué así: no tocamos dos SPAs que hoy andan, ganamos el dominio único y la nav
común desde el día uno, y el SEO —que es lo que estamos yendo a buscar— vive
entero en el proyecto nuevo. Si más adelante querés absorberlos de verdad, el
rewrite se reemplaza por rutas reales sin cambiar una sola URL pública.

Puntos a resolver de este esquema:

- **Base path de los SPAs.** Vite tiene que buildear con `base: '/reservar/'` para
  que los assets resuelvan bien detrás del rewrite. Es un cambio de una línea en
  `vite.config.ts`, más el `basename` del router.
- **Cookies.** Al quedar todo en el mismo host, la sesión del portal pasa a ser
  cookie de primera parte sobre `clicpilates.com`. Esto es una mejora fuerte:
  hoy, en Safari, una cookie en `clientes.clicpilates.com` sufre restricciones que
  desaparecen al unificar el host.
- **Los subdominios viejos siguen vivos** con `301` a las rutas nuevas. Nadie
  pierde un bookmark.
- **Header compartido.** El Next.js expone el header como fragmento y los SPAs lo
  consumen, o —más simple para empezar— cada SPA replica el header con los mismos
  tokens. Ya comparten paleta y tipografía, así que el salto visual es nulo.

---

## 2. Datos: reutilizar todo, y una advertencia sobre el lazy load

El sitio consume `/api/public/*` de ClicNet. No se duplica nada.

| Endpoint | Uso en la web nueva | Cache |
|---|---|---|
| `GET /api/public/sedes?tipo=PILATES` | Listado, landings, footer, sitemap | ISR, revalidar cada 1 h |
| `GET /api/public/catalogo?sede=<slug>` | Precios por sede | ISR, revalidar cada 1 h |
| `GET /api/public/sedes/:id/clases` | Grilla en vivo | Sin cache, cliente |
| `GET /api/public/sedes/:id/horarios` | Horarios fijables | Sin cache, cliente |

### El matiz importante del "carga rápido mientras viene la info"

La intuición es correcta, pero conviene partirla en dos, porque no todo el
contenido puede llegar tarde:

**Lo que tiene que estar en el HTML que devuelve el servidor** — nombre de la
sede, dirección, teléfono, descripción, precios, la foto principal, el JSON-LD.
Si esto se carga por JavaScript después del primer render, Google puede no verlo
y el LCP se va al techo. Es exactamente el contenido por el que querés rankear:
no puede depender del cliente.

La forma de que sea rápido **no** es diferirlo, es cachearlo: con ISR ese HTML se
genera una vez y se sirve desde el CDN en milisegundos, sin tocar el backend. De
paso resuelve solo el problema del rate limit que tiene `/api/public/sedes`
(60 req/min por IP), porque con SSR sin cache todas las visitas comparten la IP
del servidor y estrangulan el sitio.

**Lo que sí conviene diferir** — la grilla de clases y los cupos. Cambia cada
minuto, no aporta SEO y es la request más pesada. Va con `<Suspense>` y streaming,
o se pide del lado del cliente después del paint.

```tsx
// app/estudios/[slug]/page.tsx
export const revalidate = 3600

export default async function Page ({ params }) {
  const sede = await getSede(params.slug)          // en el HTML: SEO + LCP
  const catalogo = await getCatalogo(params.slug)  // en el HTML: precios

  return (
    <>
      <SedeHero sede={sede} />
      <Planes catalogo={catalogo} sede={sede} />

      {/* Lo volátil llega después, sin bloquear la pintura */}
      <Suspense fallback={<GrillaSkeleton />}>
        <GrillaEnVivo sedeId={sede.id} />
      </Suspense>

      <SedeFaq sede={sede} />
      <JsonLdSede sede={sede} catalogo={catalogo} />
    </>
  )
}
```

El `GrillaSkeleton` tiene que ocupar **la misma altura** que la grilla real. Si no,
cuando llegan los datos el contenido salta y el CLS se rompe.

### Fotos

Ya están en la API y con un dato que conviene no desperdiciar: `fotosDetalle`
trae `foco: {x, y}` por imagen, e `imagenFoco` para la principal. Eso se mapea
directo a `object-position` de `next/image`, así ninguna foto queda mal recortada
en mobile.

```tsx
<Image
  src={sede.imagenUrl}
  alt={`Estudio CLIC ${sede.nombre}`}
  fill priority
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover', objectPosition: `${sede.imagenFoco.x}% ${sede.imagenFoco.y}%` }}
/>
```

Lo único que hay que conseguir aparte: **imágenes genéricas de marca** para el
hero de la home, el bloque de método, Academy y Franquicias. Cuatro o cinco piezas
buenas alcanzan. Mientras no estén, quedan los degradados del prototipo.

---

## 3. Cambios necesarios en ClicNet

Chicos, pero el sitio los necesita.

**a) Query pública separada para el sitio de marketing.** Hoy
`/api/public/sedes` filtra por `ventaOnlineActiva`, por tener plan de prueba
activo y por tener cuenta de Mercado Pago activa. Es correcto para el portal de
reservas, pero si la web pública usa el mismo filtro, **una sede desaparece del
sitio cuando se le cae la configuración de cobro** — con ella se van la landing,
el ranking y el destino del perfil de Google.

Propuesta: `?contexto=web` devuelve toda sede `activa`, agregando un booleano
`reservaOnline` para que la landing decida entre mostrar el botón de reservar o
mandar a WhatsApp.

**b) Campos nuevos en `Sede`** — hacen falta para el `LocalBusiness`:

| Campo | Para qué | Hoy |
|---|---|---|
| `latitud`, `longitud` | `geo` del JSON-LD, mapas | No existe |
| `telefono` | `telephone` del JSON-LD, clic-para-llamar | Hardcodeado en `locations.ts` |
| `calle`, `localidad`, `provincia`, `codigoPostal` | `PostalAddress` desagregado | Solo `direccion` como texto libre |
| `zona` | El barrio tal como se busca ("Pilar", no "Pilar Office") | No existe |
| `horarioApertura` | `openingHoursSpecification` | No existe |
| `updatedAt` expuesto | `lastModified` del sitemap | Existe, no se expone |

`horarioApertura` se puede derivar del mínimo y máximo de la grilla por día, que
tiene la ventaja de mantenerse solo.

**c) Rate limit.** Con ISR el volumen baja muchísimo, pero conviene igual
excluir la IP del servidor de Vercel del limitador, o usar una API key de servicio.

**d) `Content-Type` y CORS** ya están bien; no hay nada que tocar ahí.

---

## 4. Fases

### Fase 0 — Higiene del sitio actual · medio día, arranca ya

No depende de nada de lo demás y deja de restar desde el día uno.

- [ ] `metadataBase` → `https://www.clicpilates.com`
- [ ] Verificar Search Console para el dominio real y enviar el sitemap
- [ ] Sacar `maximumScale: 1` del viewport
- [ ] Sacar las `keywords` (incluyen `yoga` y `meditación`, que no ofrecen)
- [ ] `noindex` o protección en el dominio de preview de Vercel

### Fase 1 — Esqueleto · 2-3 días

- [ ] Proyecto Next.js con los tokens de `reservas-clientes-clic-v2/globals.css`
- [ ] Layout, header con estados transparente/sólido, footer, nav mobile
- [ ] Rewrites a los dos SPAs y `base` de Vite ajustado
- [ ] Logo en SVG (pedir el vectorial; si no aparece, vectorizar el PNG)
- [ ] Dominio: definir `www` o apex y redirigir el otro

### Fase 2 — Capa de datos · 2 días

- [ ] Cliente de API tipado, reusando los tipos de `src/types/index.ts`
- [ ] `getSedes`, `getSede`, `getCatalogo` con ISR; `getClases` del lado cliente
- [ ] Componentes de carga con altura reservada
- [ ] Manejo de error y estado vacío por sección, no una pantalla en blanco

### Fase 3 — Landings de sede · 4-5 días · **la fase que más rinde**

- [ ] `/estudios` y `/estudios/[slug]`
- [ ] `generateStaticParams` desde las sedes activas
- [ ] `generateMetadata` por sede
- [ ] H1 por zona, breadcrumbs, FAQs, enlazado a sedes cercanas
- [ ] JSON-LD `LocalBusiness` + `FAQPage` + `BreadcrumbList`
- [ ] Grilla en vivo con Suspense
- [ ] Planes de la sede con el descuento de la clase de prueba visible
- [ ] Galería con foco de imagen

### Fase 4 — Home y marca · 3-4 días

- [ ] Hero con selector de sede y disponibilidad real
- [ ] Manifiesto CLIC, banda HACÉ EL CLIC
- [ ] Método, niveles, testimonios, app, sedes
- [ ] Sección de clase de prueba
- [ ] Reveals con `IntersectionObserver` y respeto por `prefers-reduced-motion`

### Fase 5 — Resto de páginas · 3 días

- [ ] `/precios` con selector de sede
- [ ] `/clases/initial-pilates` y `/clases/level-up-pilates`
- [ ] `/academy`
- [ ] `/franquicias` con su formulario propio
- [ ] `/politicas` migrada de la landing actual

### Fase 6 — SEO técnico · 2 días

- [ ] `sitemap.ts` y `robots.ts`
- [ ] `301` desde `/sede/[slug]`, `/horarios/[sede]`, `/grilla/[sede]` y los subdominios
- [ ] Canonical autorreferencial en toda ruta
- [ ] Validar en Rich Results Test
- [ ] Los nueve perfiles de Google apuntando a su landing

### Fase 7 — Medición · 2-3 días

- [ ] Píxel por sede resolviendo contra `Sede.metaPixelId` (portar `lib/meta.ts`)
- [ ] Conversions API desde el webhook de Mercado Pago, con `event_id` compartido
- [ ] GA4 con `sede` como dimensión personalizada
- [ ] UTMs persistidos hasta el `CheckoutPlanPayload`
- [ ] Verificar deduplicación en Events Manager

### Fase 8 — QA y lanzamiento · 2-3 días

- [ ] Lighthouse en móvil: LCP < 2,5 s / INP < 200 ms / CLS < 0,1
- [ ] Navegación por teclado y lectores de pantalla
- [ ] Prueba real en iOS y Android
- [ ] Que el flujo completo funcione end-to-end contra producción
- [ ] Deploy con los `301` activos desde el minuto cero

**Total estimado: 4 a 5 semanas** de trabajo enfocado, con las fases 3 y 4 como el
grueso. La fase 0 no espera a nadie.

---

## 5. Dependencias — lo que hace falta que llegue

| Qué | Bloquea | Estado |
|---|---|---|
| Imágenes genéricas de hero y secciones | Fase 4 | **Falta** |
| Logo vectorial (SVG/AI/EPS) | Fase 1 | **Falta** |
| Migración de `Sede` con geo, teléfono y dirección desagregada | Fase 3 (JSON-LD) | **Falta** |
| Query pública `?contexto=web` | Fase 2 | **Falta** |
| Testimonios reales con nombre y sede | Fase 4 | **Falta** |
| Texto propio por sede (~300 palabras) | Fase 3 | **Falta** |
| Confirmar 4.9 en Google, máximo por clase y sedes activas | Fase 4 | **Falta** |
| Fotos de sede | — | Ya en el back |
| Precios por sede | — | Ya en el back |

Las landings de sede pueden empezar antes de que llegue todo: la migración de
campos solo bloquea el JSON-LD completo, no la página.

---

## 6. Orden sugerido para arrancar

1. **Fase 0 hoy.** Son cuatro cambios en el repo actual y frenan una pérdida que
   está corriendo ahora mismo.
2. **La migración de `Sede` en paralelo**, porque tiene tiempo de espera propio y
   destraba la Fase 3.
3. **Fases 1 a 3 seguidas.** Al terminar la 3 ya tenés nueve páginas indexables
   con grilla real: ese es el punto donde el proyecto empieza a devolver, mucho
   antes de estar terminado.
4. El resto se puede publicar de a partes sin romper nada.
