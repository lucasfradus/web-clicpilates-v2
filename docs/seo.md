# CLIC studio pilates — SEO, publicidad y medición

Especificación de implementación para la web nueva (`clicpilates.com`, Next.js App Router).
Escrita para dejar en el repo como `docs/seo.md` y usarse como referencia al construir.

---

## 0. Lo que hay que arreglar del sitio actual

Estos no son "mejoras": son cosas que hoy están restando. Salieron de leer
`clic-pilates-landing/src/app/layout.tsx`.

**El canonical apunta a Vercel.**

```ts
metadataBase: new URL('https://clic-landing.vercel.app/'),
alternates: { canonical: '/' }
```

Eso hace que cada página declare como versión oficial una URL de
`clic-landing.vercel.app`. Google puede estar indexando el dominio de preview en
lugar de `clicpilates.com`, o repartiendo autoridad entre los dos. Es el problema
más caro de la lista y se arregla en una línea. Además, el dominio de preview
debería devolver `X-Robots-Tag: noindex` o estar protegido por Vercel Authentication.

**Search Console probablemente no esté verificada.**

```ts
verification: { google: 'your-google-verification-code' }
```

El placeholder nunca se reemplazó. Sin Search Console no ves qué consultas te
traen tráfico, ni qué páginas quedaron fuera del índice.

**Se bloquea el zoom.**

```ts
export const viewport: Viewport = { maximumScale: 1, ... }
```

Impide hacer pinch-zoom. Es una falla de accesibilidad que Lighthouse marca y que
afecta a parte real de tu público.

**El `title` no compite por nada.** "Clic Pilates" no menciona reformer, ni
pilates clásico, ni Buenos Aires, ni ninguna de las nueve zonas.

**Las `keywords` no sirven y encima mienten.** Google las ignora desde 2009, y las
que están listadas incluyen `yoga` y `meditación`, que no ofrecés. Sacarlas.

**No hay Open Graph propio, ni Twitter card, ni un solo bloque de datos
estructurados.** Cuando alguien comparte el link por WhatsApp, la preview es lo
que Google adivine.

**Una sola URL indexable para nueve estudios.** Este es el techo real: no importa
cuánto optimices `/`, no vas a rankear por nueve búsquedas locales distintas
desde una sola página.

---

## 1. Arquitectura de URLs

Una URL por intención de búsqueda. Sin `#anclas` para contenido que quiera rankear.

| Ruta | Propósito | Prioridad |
|---|---|---|
| `/` | Marca + captación general | Alta |
| `/estudios` | Índice de las nueve sedes | Alta |
| `/estudios/[slug]` | **Landing local por sede** | **Máxima** |
| `/precios` | Comparativa de planes, con selector de sede | Alta |
| `/clases/initial-pilates` | Nivel inicial | Media |
| `/clases/level-up-pilates` | Nivel avanzado | Media |
| `/reservar` | Grilla y checkout | Sin indexar |
| `/mi-cuenta/*` | Portal privado | `noindex` |
| `/academy` | Formación de instructoras | Media |
| `/franquicias` | Captación de inversores (embudo aparte) | Media |
| `/blog/[slug]` | Contenido de long tail | Media |
| `/politicas`, `/terminos` | Legales | Baja |

Los slugs de sede salen del campo `slug` que ya tenés en `Sede`, así que la web y
el backend hablan el mismo idioma: `hollywood`, `soho`, `belgrano`, `nunez`,
`olivos`, `nordelta`, `escobar`, `office`, `pilara`.

Un detalle: `office` y `pilara` son nombres internos. Para SEO conviene
`/estudios/pilar` y `/estudios/pilara`, porque nadie busca "clic office". Si
cambiás el slug público, mantené el mapeo hacia el `slug` del backend.

### Migración — no perder lo que ya tenés

El sitio actual es un one-pager con anclas. Al pasar a rutas reales:

- `301` de `/#franquicias` → `/franquicias`, `/#academy` → `/academy`, etc.
  (las anclas no llegan al servidor, así que esto se resuelve con un redirect en
  cliente para links viejos que anden dando vuelta por ahí, más los `301` de
  cualquier ruta real que hoy exista).
- Las rutas actuales `/sede/[slug]`, `/horarios/[sede]` y `/grilla/[sede]` **sí**
  existen hoy y **sí** pueden estar indexadas: `301` a `/estudios/[slug]`.
- Nunca borrar una URL indexada sin redirigirla. Un `404` tira a la basura los
  enlaces que apuntaban ahí.

---

## 2. Metadata por ruta

Con `generateMetadata()`, nunca hardcodeada en el layout.

```ts
// app/layout.tsx — solo lo que es común a todo el sitio
export const metadata: Metadata = {
  metadataBase: new URL('https://www.clicpilates.com'),   // ← el dominio real
  title: {
    default: 'CLIC studio pilates · Pilates reformer en Buenos Aires',
    template: '%s · CLIC studio pilates',
  },
  openGraph: { type: 'website', locale: 'es_AR', siteName: 'CLIC studio pilates' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
}

export const viewport: Viewport = { themeColor: '#edece7', width: 'device-width', initialScale: 1 }
// sin maximumScale
```

```ts
// app/estudios/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const sede = await getSede(params.slug)
  const titulo = `Pilates reformer en ${sede.zona}`
  return {
    title: titulo,
    description:
      `Clases de Pilates Clásico en reformer en ${sede.zona}, en grupos de hasta 8 personas. ` +
      `Mirá los horarios disponibles y reservá tu clase de prueba desde $${sede.precioPrueba}.`,
    alternates: { canonical: `/estudios/${sede.slug}` },
    openGraph: {
      title: `${titulo} · CLIC ${sede.nombre}`,
      images: [{ url: sede.imagenUrl, width: 1200, height: 630, alt: `Estudio CLIC ${sede.nombre}` }],
    },
  }
}
```

Reglas de redacción:

- **Title**: 50–60 caracteres, la keyword al principio, la marca al final.
  `Pilates reformer en Núñez · CLIC studio pilates`
- **Description**: 140–160 caracteres. No rankea, pero decide el clic. Meté el
  precio y el diferencial — el precio en la descripción sube el CTR porque filtra.
- Una `description` distinta por sede. Nueve páginas con el mismo texto le dicen
  a Google que ocho sobran.

---

## 3. Datos estructurados (JSON-LD)

Emitir por página con `<script type="application/ld+json">`. Con App Router va
directo en el componente de servidor.

### En `/` — Organization + WebSite

Un único `Organization` con `@id` estable, del que cuelgan todas las sedes.

### En `/estudios/[slug]` — el que más importa

```jsonc
{
  "@context": "https://schema.org",
  "@type": ["HealthAndBeautyBusiness", "ExerciseGym"],
  "@id": "https://www.clicpilates.com/estudios/nunez#business",
  "name": "CLIC studio pilates Núñez",
  "parentOrganization": { "@id": "https://www.clicpilates.com/#organization" },
  "url": "https://www.clicpilates.com/estudios/nunez",
  "telephone": "+5491132283985",
  "priceRange": "$$",
  "currenciesAccepted": "ARS",
  "image": ["https://www.clicpilates.com/img/nunez-1.jpg"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. del Libertador 7274",
    "addressLocality": "Ciudad Autónoma de Buenos Aires",
    "addressRegion": "CABA",
    "postalCode": "C1429",
    "addressCountry": "AR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": -34.54280, "longitude": -58.46310 },
  "openingHoursSpecification": [ /* una entrada por bloque horario */ ],
  "hasOfferCatalog": { /* clase de prueba + planes, con price y priceCurrency */ }
}
```

Notas que evitan problemas:

- `name` y `address` son las **dos únicas propiedades obligatorias**. El resto
  suma, pero sin esas dos el bloque no sirve.
- `geo` con al menos 5 decimales.
- **No marques tus propias reseñas con `aggregateRating`.** La documentación de
  Google es explícita: `aggregateRating` y `review` están pensados para sitios que
  publican reseñas *sobre otros* negocios. Un negocio que se autocalifica se
  expone a una acción manual. El 4.9 mostralo en pantalla como texto, sin schema.
- `openingHoursSpecification` tiene que coincidir con Google Business Profile. Si
  no coinciden, gana el perfil y el schema te resta confianza.

### En páginas con FAQ — `FAQPage`

Cada landing de sede lleva 5 preguntas locales ("¿cuánto sale una clase de
pilates en Núñez?"). Es contenido que responde búsquedas de cola larga y
alimenta las respuestas generadas por IA, que hoy se llevan una porción del
tráfico que antes iba al clic orgánico.

Condición: el texto del `FAQPage` tiene que estar visible en la página. Schema
que no se ve en pantalla es motivo de penalización.

### En toda ruta profunda — `BreadcrumbList`

`Inicio › Estudios › Núñez`. Cambia cómo se ve tu resultado en la búsqueda y
mejora el CTR.

Validá todo en el Rich Results Test antes de publicar.

---

## 4. Google Business Profile — el 60% del SEO local

Para un negocio con local físico, el perfil pesa más que el sitio. Nueve
estudios, nueve perfiles, y para cada uno:

- **NAP idéntico al del sitio.** Nombre, dirección y teléfono escritos exactamente
  igual en el perfil, en el `<footer>`, en el JSON-LD y en cualquier directorio.
  "Av. del Libertador 7274" y "Avenida del Libertador 7274" cuentan como dos
  negocios distintos para el algoritmo.
- Categoría principal: **Pilates studio**. Secundarias: Gimnasio, Centro de
  fitness.
- El campo web de cada perfil apunta a **su** landing (`/estudios/nunez`), no a la
  home. Este es el enlace que conecta el perfil con la página y hace que la
  landing local rankee.
- Fotos reales del estudio, actualizadas. Los perfiles con fotos recientes reciben
  bastante más interacción.
- Responder todas las reseñas, también las buenas. La tasa de respuesta es señal.
- Usar Google Posts para promos y aperturas.

Sumale consistencia de NAP en Instagram, Facebook, Waze y los directorios locales
de fitness.

---

## 5. Sitemap, robots e indexación

```ts
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sedes = await getSedes()
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/estudios`, changeFrequency: 'weekly', priority: 0.9 },
    ...sedes.map(s => ({
      url: `${BASE}/estudios/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'daily' as const,   // la grilla cambia todos los días
      priority: 0.9,
    })),
    // …resto
  ]
}
```

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/mi-cuenta/', '/reservar/checkout', '/api/'] }],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
```

`/reservar` y `/mi-cuenta` no aportan nada orgánico y sí gastan presupuesto de
rastreo. Dejalos fuera.

---

## 6. Core Web Vitals

Google mide el **percentil 75** de usuarios reales: el 75% de las visitas tiene
que estar en verde para que la página pase.

| Métrica | Bien | A mejorar | Mal |
|---|---|---|---|
| **LCP** (carga) | < 2,5 s | 2,5–4 s | > 4 s |
| **INP** (respuesta) | < 200 ms | 200–500 ms | > 500 ms |
| **CLS** (estabilidad) | < 0,1 | 0,1–0,25 | > 0,25 |

INP reemplazó a FID en marzo de 2024 y es bastante más exigente: mide *todas* las
interacciones, no solo la primera.

Lo que hay que cuidar en este proyecto en particular:

- **LCP**: la imagen del hero es el elemento más grande. `next/image` con
  `priority`, formato AVIF/WebP, `sizes` bien puesto y `preload` del recurso.
  Nada de video autoplay pesado arriba del pliegue.
- **CLS**: reservar altura para la grilla de clases *antes* de que llegue la
  respuesta de la API. Si el bloque aparece de golpe y empuja el contenido, el
  CLS se dispara. Skeleton con la misma altura que las filas reales.
- **INP**: acá está el riesgo concreto de tu caso. La grilla filtrable con nueve
  sedes y catorce días puede hacer re-render pesado en cada tap. Memoizar el
  filtrado, virtualizar si la lista crece, y mover el trabajo fuera del hilo
  principal si hace falta.
- Las fuentes con `next/font` (ya lo hacés) y `display: swap`.
- La landing de sede **renderizada en el servidor**. Si el contenido depende de
  JavaScript en el cliente, perdés en las dos puntas: indexación y LCP.

---

## 7. Mapa de contenido y keywords

Una página, una intención. El mayor volumen no está en "pilates" a secas —
imposible de ganar y encima poco rentable— sino en la combinación
zona + modalidad.

| Página | Keyword principal | Secundarias |
|---|---|---|
| `/estudios/nunez` | pilates reformer Núñez | pilates Núñez, clases de pilates Núñez, pilates cerca de mí |
| `/estudios/hollywood` | pilates Palermo Hollywood | reformer Palermo, pilates Palermo precios |
| `/estudios/nordelta` | pilates Nordelta | reformer Nordelta, pilates Tigre |
| `/clases/initial-pilates` | pilates para principiantes | primera clase de pilates, pilates sin experiencia |
| `/precios` | cuánto sale pilates Buenos Aires | precio clase de pilates, planes de pilates |
| `/academy` | formación instructor pilates | certificación pilates Buenos Aires |

Cada landing de sede necesita **texto propio**, no una plantilla con el nombre
cambiado. Mínimo: qué tiene ese estudio en particular, cómo se llega, dónde
estacionar, qué transporte lo deja cerca, quiénes son sus instructoras. Trescientas
palabras únicas por sede alcanzan, y son las que hacen la diferencia entre nueve
páginas que rankean y nueve páginas duplicadas.

Para el blog, apuntar a preguntas reales: *pilates reformer vs mat*, *cuántas
veces por semana hacer pilates*, *pilates en el embarazo*, *qué llevar a la
primera clase*. Cada nota enlaza internamente a la landing de sede más cercana al
tema.

---

## 8. Meta Ads

Ya tenés la pieza clave resuelta: `Sede.metaPixelId` permite que cada franquicia
con cuenta publicitaria propia dispare a su píxel, y el resto caiga en el general.
En `reservas` eso ya funciona (`src/lib/meta.ts`); la web nueva tiene que heredar
la misma lógica en vez de reimplementarla.

### Eventos

| Evento | Cuándo | Parámetros |
|---|---|---|
| `PageView` | Toda página | — |
| `ViewContent` | Ver landing de sede | `content_name`, `content_category: 'sede'` |
| `Search` | Filtrar la grilla | `search_string` (sede + día) |
| `AddToCart` | Elegir una clase | `value`, `currency: 'ARS'` |
| `InitiateCheckout` | Empezar el formulario | `value`, `currency` |
| `Purchase` | Pago confirmado por webhook | `value`, `currency`, `content_name` |
| `Lead` | Formulario de franquicias | `content_category: 'franquicia'` |

### Conversions API — no es opcional

Con Safari y los bloqueadores, el píxel del navegador pierde entre un cuarto y un
tercio de las conversiones. Y el evento que más importa —`Purchase`— lo confirma
Mercado Pago por webhook, o sea que ocurre **cuando el usuario ya no está en la
página**. Sin CAPI, ese `Purchase` no existe para Meta y el algoritmo optimiza a
ciegas.

Implementación: disparar del lado del servidor desde el webhook de Mercado Pago
que ya tenés, con `event_id` compartido con el evento del navegador para que Meta
deduplique. Mandar `em` y `ph` hasheados en SHA-256 — ya los tenés en el
`CheckoutPlanPayload`.

Objetivo de calidad del evento: **8 o más** en el Events Manager.

### Estructura de campañas

Una campaña por sede, no una campaña para todo. Las nueve tienen públicos
geográficos distintos y presupuestos que no deberían competir entre sí.

```
Campaña: [Sede] Núñez — Clase de prueba
  Conjunto: Radio 4 km · 25-50 · intereses fitness/wellness
  Conjunto: Retargeting — visitó /estudios/nunez y no compró (14 días)
  Conjunto: Lookalike 1% de compradores de la sede
```

El destino nunca es la home: es `/estudios/nunez` con el parámetro de campaña.
Cada clic aterriza en una página que habla de la sede que la persona vio en el
anuncio, con su precio y su grilla.

---

## 9. UTMs y atribución

Convención única, en minúsculas, sin espacios. Si cada uno inventa la suya, los
reportes no se pueden agrupar.

```
?utm_source=meta|google|instagram|whatsapp
&utm_medium=paid_social|cpc|organic_social|referral
&utm_campaign=nunez_prueba_ago26
&utm_content=carousel_a
&utm_term=pilates_reformer_nunez        // solo búsqueda
```

`utm_campaign` con el patrón `sede_objetivo_mesaño`. Se ordena solo y se lee de un
vistazo.

Los UTM tienen que **sobrevivir la navegación**: guardarlos en la primera visita
(sessionStorage o una cookie de primera parte) y adjuntarlos al `CheckoutPlanPayload`
que va al backend. Así ClicNet sabe de qué campaña vino cada venta y podés cruzar
costo publicitario contra ingreso real por sede — que es la única métrica que
importa.

Cuidado con un detalle: los parámetros de UTM en la URL de una landing generan
variantes de la misma página. El `canonical` autorreferencial (siempre a la URL
limpia) evita que Google las indexe por separado.

---

## 10. GA4 — el embudo

Un solo flujo, medido de punta a punta. Los nombres coinciden con los de Meta
para poder comparar sin traducir.

```
view_home
  → view_sede            { sede }
  → view_horarios        { sede }
  → select_clase         { sede, clase_id, actividad }
  → begin_checkout       { sede, value, currency: 'ARS' }
  → purchase             { sede, value, transaction_id, plan }
```

Con `sede` como dimensión personalizada en todos los eventos, el reporte que
querés mirar sale solo: conversión por sede, y en qué paso se cae cada una.

Definir también micro-conversiones: clic en WhatsApp, clic en Google Maps,
descarga de la app, apertura de una FAQ. No son ventas, pero anticipan.

Configurar `purchase` como conversión principal e importarla a Google Ads y a
Meta.

---

## 11. Checklist antes de publicar

**Técnico**

- [ ] `metadataBase` apunta a `https://www.clicpilates.com` (no a Vercel)
- [ ] Dominio de preview con `noindex` o protegido
- [ ] `canonical` autorreferencial en cada ruta
- [ ] Sin `maximumScale` en el viewport
- [ ] `sitemap.xml` y `robots.txt` respondiendo
- [ ] Search Console verificada, con el sitemap enviado, para el dominio real
- [ ] Bing Webmaster Tools (alimenta las respuestas de varios asistentes de IA)
- [ ] `301` desde todas las URLs viejas indexadas
- [ ] `HealthAndBeautyBusiness` + `FAQPage` + `BreadcrumbList` validados en Rich Results Test
- [ ] Sin `aggregateRating` propio
- [ ] Landings de sede renderizadas en servidor
- [ ] LCP < 2,5 s / INP < 200 ms / CLS < 0,1 en móvil, con datos de campo
- [ ] `alt` en todas las imágenes, un solo `<h1>` por página

**Local**

- [ ] Nueve perfiles de Google Business reclamados y verificados
- [ ] NAP idéntico entre perfil, sitio y JSON-LD
- [ ] Cada perfil apunta a su landing, no a la home
- [ ] Fotos actualizadas en los nueve

**Publicidad**

- [ ] Píxel por sede resolviendo contra `Sede.metaPixelId`
- [ ] CAPI andando desde el webhook de Mercado Pago
- [ ] Deduplicación por `event_id` verificada en Events Manager
- [ ] GA4 con `sede` como dimensión personalizada
- [ ] UTMs persistidos hasta el checkout y guardados en ClicNet

---

## 12. Qué mirar después

Cada mes, tres números por sede: **impresiones orgánicas** (Search Console),
**acciones en el perfil de Google** (llamadas, cómo llegar, clics al sitio) y
**costo por adquisición** (Meta contra ventas reales de ClicNet, no contra las que
reporta Meta).

El indicador de que esto funcionó no es el tráfico total. Es que cada landing de
sede reciba visitas de búsquedas con el nombre de su barrio, y que el CAC baje
porque una parte de las altas empieza a llegar sin pagar por el clic.
