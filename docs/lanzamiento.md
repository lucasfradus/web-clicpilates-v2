# El día del cambio de dominio

El sitio nuevo vive en Railway con su URL propia y `noindex`. Este documento es
el orden exacto para pasarlo a `clicpilates.com` sin perder tráfico ni ranking.

Leerlo entero antes de empezar: hay cosas que **tienen que pasar antes** del
switch, y una que si se hace al revés deja el sitio fuera del índice.

---

## Antes (se puede hacer cualquier día)

- [ ] **CORS**: agregar `https://www.clicpilates.com` a `allowedPublicOrigins`
      en `Clicnet/src/proxy.ts`. Sin esto, la grilla en vivo tiene que seguir
      pasando por el proxy de este sitio, y todas las llamadas salen de la IP
      del servidor contra un rate limit de 60 req/min por IP.
- [ ] **Los dos SPAs**: mergear y deployar la rama `chore/base-path-rewrite` de
      `reservas-clientes-clic-v2` y de `clic-webapp-clientes`, con
      `VITE_BASE_PATH=/reservar/` y `/mi-cuenta/`. Ver `docs/rewrites.md`.
      Sin esto, `/reservar` y `/mi-cuenta` cargan el HTML del SPA pero sin sus
      assets.
- [ ] **Search Console**: verificar el dominio **por DNS**. Así vale para los
      dos sitios y no hay que tocar el código de ninguno.
- [ ] **Contenido**: confirmar los números que hoy no publicamos (4.9 de Google,
      máximo por clase), mandar los testimonios reales y las imágenes de marca,
      y las condiciones de Academy y Franquicias.
- [ ] **Apagar las sedes de prueba** desde el backoffice. Mientras estén
      activas se publican, y hoy "Sede Test orig · Calle Falsa 123 · $200"
      aparece en la home y en `/estudios`.

## El día del cambio

1. **Variables en Railway**, antes de tocar el DNS:
   - Sacar `NEXT_PUBLIC_NOINDEX` (o ponerla en `false`). **Esto es lo que
     habilita la indexación**; si se hace después del switch, el sitio queda
     días fuera de Google.
   - `NEXT_PUBLIC_API_BASE_URL=https://app.clicpilates.com` — sólo si ya se hizo
     el cambio de CORS; si no, dejar la URL del propio sitio.
   - `NEXT_PUBLIC_META_PIXEL_ID` y `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
   - `RESEND_API_KEY`, o los formularios de Academy y Franquicias no envían.
2. **Dominio en Railway**: agregar `www.clicpilates.com` como dominio
   personalizado del servicio y esperar el certificado.
3. **DNS**: apuntar `www` a Railway. El apex se resuelve solo — el redirect
   apex → `www` ya está en `next.config.ts`.
4. **Verificar en caliente**, con el sitio ya sirviendo el dominio:
   - `curl -I https://www.clicpilates.com/sede/nunez` → 301 a `/estudios/nunez`
   - `curl -I https://clicpilates.com/` → 301 a `https://www.clicpilates.com/`
   - `https://www.clicpilates.com/robots.txt` → sin `noindex`, con el sitemap
   - `https://www.clicpilates.com/sitemap.xml` → 19 URLs
   - una landing cualquiera → sin `<meta name="robots" content="noindex">`
5. **Los subdominios viejos**: `reservas.clicpilates.com` y
   `clientes.clicpilates.com` con `301` a `/reservar` y `/mi-cuenta`. Se hace
   después de confirmar que las rutas nuevas andan, no antes.
6. **Search Console**: enviar el sitemap y pedir la indexación de la home y de
   las once landings.
7. **Los perfiles de Google de cada estudio**: cambiar el sitio web al de su
   landing (`/estudios/<slug>`), no a la home. Es lo que convierte el perfil en
   tráfico calificado.

## Después, en los primeros días

- [ ] Rich Results Test sobre una landing de sede: tiene que reconocer
      `LocalBusiness`, `FAQPage` y `BreadcrumbList`.
- [ ] Search Console → Cobertura: que las URLs viejas figuren como redirigidas y
      no como errores.
- [ ] Events Manager: que el pixel reciba `PageView`, `ViewContent` y `Lead`, y
      —cuando esté la Conversions API— que no haya eventos duplicados.
- [ ] Mirar el ranking de las nueve landings viejas: la señal de que el `301`
      funcionó es que el ranking se mueve a la URL nueva, no que desaparece.

## Lo que NO hay que hacer

- **No** apagar la landing anterior el mismo día. Que siga respondiendo hasta
  confirmar que el dominio nuevo sirve todo bien.
- **No** activar los `301` de los subdominios antes del punto 4.
- **No** sacar el `noindex` del staging. Si el sitio de Railway queda indexable
  al mismo tiempo que el dominio real, compiten entre ellos por el mismo
  contenido.
