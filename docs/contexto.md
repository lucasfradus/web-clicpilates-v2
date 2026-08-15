# Contexto del proyecto — web nueva de CLIC

Este documento existe para que una sesión que arranca de cero pueda trabajar sin
volver a investigar lo que ya se investigó. Leelo antes de escribir código.

Documentos hermanos:

- `docs/plan.md` — plan de implementación por fases
- `docs/seo.md` — SEO, publicidad y medición
- `docs/prototipo.html` — prototipo navegable, abrilo en el navegador

---

## 1. Qué estamos haciendo y por qué

`clicpilates.com` es hoy un one-pager en Next.js hecho por un estudio externo. El
dueño del negocio quiere reemplazarlo: no lo representa, se siente viejo, y sobre
todo **no aprovecha nada del sistema que ya construyó** (portal de reservas,
portal de clientes, backend y app móvil).

El objetivo no es estético. Es que la web deje de ser un folleto y pase a ser el
frente público del mismo sistema: horarios reales, disponibilidad real, precios
reales, y nueve páginas locales que capten búsquedas por barrio.

Los tres problemas concretos que resuelve el proyecto:

1. **Una sola URL indexable para nueve estudios.** Es el techo de todo lo demás.
2. **Tres dominios con tres identidades.** La clienta siente que cambia de producto.
3. **La web no sabe nada del backend.** Todo lo que la haría sentir viva ya está
   en la base de datos y no se muestra.

---

## 2. Repos y qué hay en cada uno

| Repo | Qué es | Rol en este proyecto |
|---|---|---|
| `Clicnet` | Backend Next.js + Prisma + PostgreSQL en Railway | Fuente de datos. Expone `/api/public/*` |
| `reservas-clientes-clic-v2` | SPA de reservas (React + Vite) | **Fuente del design system.** Se sirve por rewrite |
| `clic-webapp-clientes` | Portal privado de clientes | Se sirve por rewrite |
| `clic-pilates-landing` | El sitio actual que reemplazamos | Solo para migrar `/politicas` y los `301` |
| `clic_app_v2` | App iOS/Android | Espeja el portal de clientes |

### El design system NO está en la landing

Esto es lo más importante de este documento.

El lenguaje visual del proyecto sale de **`reservas-clientes-clic-v2`**, no del
sitio actual. Ahí está `src/styles/globals.css` con una paleta pensada de verdad
—beige, taupe, ink, sage para "hay lugar", terracotta para "quedan pocos"—, una
escala tipográfica coherente (Poppins 300 para números e importes, Prata para
títulos editoriales) y componentes con criterio real: mirá `ClaseRow.css`,
`SedeCard.css`, `Button.css`, `Planes.css`.

El sitio actual, en cambio, es shadcn con los defaults más una capa de efectos de
MagicUI (`typing-animation`, `word-fade-in`, `text-shimmer-wave`, marquee,
ken-burns) colgados encima. **Eso es lo que lo hace ver viejo**: los efectos hacen
el trabajo que debería hacer la jerarquía. No portar nada de ahí.

Los tokens se copian tal cual de `globals.css` de reservas. No inventar una
paleta nueva.

---

## 3. La API pública, y sus trampas

Base: el backend de ClicNet. Los tipos ya están escritos en
`reservas-clientes-clic-v2/src/types/index.ts` — **reusalos, no los redefinas**.

```
GET  /api/public/sedes?tipo=PILATES        → Sede[]
GET  /api/public/sedes/:id/clases          → Clase[]
GET  /api/public/sedes/:id/horarios?planId → HorariosResponse
GET  /api/public/catalogo?sede=<slug>      → CatalogoSede[]
POST /api/public/checkout                  → { initPoint }
POST /api/public/checkout-plan             → { initPoint, solicitudId }
```

### Trampa 1 — el filtro de `/api/public/sedes` esconde sedes

```ts
where: {
  activa: true,
  ventaOnlineActiva: true,
  planes: { some: { esPrueba: true, activo: true } },
  cuentasMercadoPago: { some: { activa: true } },
}
```

Correcto para el portal de reservas: sin cuenta de Mercado Pago no se puede
cobrar. **Pero si la web pública usa el mismo filtro, una sede desaparece del
sitio cuando se le cae la configuración de cobro**, y con ella se van la landing,
el ranking acumulado y el destino del perfil de Google.

La web de marketing necesita su propia query (`?contexto=web`) que devuelva toda
sede `activa` más un booleano `reservaOnline`, para que la página decida entre
mostrar el botón de reservar o mandar a WhatsApp. **Esta migración está pendiente
del lado del backend.**

### Trampa 2 — rate limit de 60 req/min por IP

Con SSR sin cache, todas las visitas salen de la misma IP del servidor y
estrangulan el sitio entero. Se resuelve con ISR (`revalidate = 3600`) sobre
sedes y catálogo. La grilla de clases va del lado del cliente y no pasa por ahí.

### Trampa 3 — campos que faltan para el JSON-LD

`Sede` no tiene latitud/longitud, ni teléfono (está hardcodeado en
`clic-pilates-landing/src/lib/locations.ts`), ni la dirección desagregada en
calle/localidad/provincia/CP, ni horarios de apertura del estudio. Todo eso hace
falta para el `LocalBusiness`. La migración está listada en `docs/plan.md` §3.

### Lo que sí está y conviene no desperdiciar

- `Sede.metaPixelId` — píxel de Meta propio por sede, para las franquicias con
  cuenta publicitaria propia. La lógica ya existe en `reservas/src/lib/meta.ts`:
  **portarla, no reescribirla.**
- `fotosDetalle` con `foco: {x, y}` por imagen e `imagenFoco` para la principal.
  Se mapea a `object-position` de `next/image` y evita recortes feos en mobile.
- `precioPrueba` por sede y `CatalogoSede.tipos` con `fijo` y `flexible`.

---

## 4. Reglas de negocio que el sitio tiene que reflejar

1. **Los precios se discriminan por sede.** No hay lista unificada. Cada landing
   muestra la suya; la página de precios tiene selector de estudio.
2. **La clase de prueba tiene costo y se abona al reservar** — eso deja el lugar
   tomado. **Si la persona avanza, ese valor se descuenta del plan.** Es el mejor
   argumento comercial del negocio y hoy no está en ningún lado de la web. Tiene
   que verse en la sección de "cómo empezás" y como número concreto dentro de cada
   tarjeta de plan ("tu primer mes: $X, ya descontada la clase de prueba").
3. **Dos niveles**: Initial Pilates (sin experiencia previa) y Level Up (requiere
   base). Se pasa de uno a otro cuando la instructora lo indica.
4. **Nueve estudios**, grupos de hasta ocho personas, Pilates Clásico en reformer.
   *(Confirmar estos números con el dueño antes de publicarlos.)*

---

## 5. Marca

- **CLIC /klik/** — "Hacer el clic. Momento de transformación en el que decidís
  priorizarte, conectar con tu cuerpo y reencontrarte a través del movimiento."
  Es el activo de marca más fuerte y hoy está enterrado. Va en una sección propia.
- Claim: **HACÉ EL CLIC**.
- El isotipo es una C con una flecha de recarga. Se usa como marca de agua, como
  separador y en el favicon.
- Logos en `reservas-clientes-clic-v2/src/assets/` — `clic_logo_black`,
  `clic_logo_white`, `clic_iso_black`, `clic_iso_white`, `clic_iso_taupe`.
  **Falta el vectorial**; hay más variantes en el Drive de la marca.
- Tono: directo, concreto, sin promesas vacías. Nada de "transformá tu vida".

---

## 6. Decisiones ya tomadas — no reabrir sin hablarlo

| Decisión | Motivo |
|---|---|
| Un solo dominio, `clicpilates.com` | `/reservar` y `/mi-cuenta` como rutas. Sesión de primera parte, nav única |
| Rewrites a los SPAs, no reescritura | Los dos funcionan bien. El SEO vive en el proyecto nuevo |
| Web nueva de cero, no iterar la actual | Su arquitectura de one-pager es el problema |
| Franquicias en embudo aparte | Es otra audiencia, otro tráfico, otro pixel |
| Contenido SEO renderizado en servidor | Lo volátil (grilla, cupos) se difiere; lo indexable no |
| Sin `aggregateRating` propio | Google lo reserva para sitios que reseñan a terceros |

---

## 7. Cómo trabajar

El repo sigue la convención de `AGENTS.md`: plan primero en `tasks/todo.md`,
verificar antes de dar algo por hecho, capturar correcciones en `tasks/lessons.md`.

Dos cosas específicas de este proyecto:

- **Una fase por sesión.** El plan tiene ocho. Meterlas todas en una sola sesión
  degrada la calidad hacia el final. La fase 3 (landings de sede) es la que más
  rinde: si hay que elegir dónde poner el mejor esfuerzo, es ahí.
- **El prototipo es la especificación visual.** Ante una duda de layout,
  jerarquía o copy, abrí `docs/prototipo.html` antes de inventar. Su capa de datos
  simulada respeta el shape real de la API a propósito.
