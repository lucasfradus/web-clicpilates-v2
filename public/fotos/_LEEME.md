# Fotos del sitio — cómo está organizada esta carpeta

Una subcarpeta por slot de `docs/fotos.md`. Dentro de cada una, la elegida y sus
alternativas. Criterio de nombres: descriptivo, sin números, en minúscula y con
guiones, para que se entienda qué es cada archivo sin abrirlo.

**Antes de guardar una foto acá, pasala por el script:**

```
node scripts/preparar-fotos.mjs originales/DSC07087.jpeg public/fotos/metodo/estiramiento-de-espaldas.jpg
```

Achica el lado mayor a 2560 px y reescribe el JPEG. No es una optimización
cosmética: los originales de cámara pesan entre 6 y 9 MB, el sitio no sirve
nunca más de 2048 px de ancho (ver `deviceSizes` en `next.config.ts`) y un
binario commiteado queda en la historia de git para siempre. `next/image`
genera los tamaños chicos al vuelo desde lo que haya, así que todo lo que
exceda 2560 px es peso que nadie llega a ver. Las seis de la tanda del 4-sep
pasaron de 41 MB a 1,7 MB.

Los originales van en `originales/`, que está en `.gitignore`.

---

## Lo que está cargado

`PUBLICADA` = la usa alguna sección hoy. `alternativa` = está acá, con permiso,
pero ninguna sección la usa: son las candidatas para cuando se quiera cambiar
una. Qué archivo usa cada sección está en `src/lib/fotos.ts`, que es el único
lugar donde se toca esto.

### Producción nueva (Drive, 4-sep y 10-sep)

```
hero/
  hero-estiramiento.jpg         2560 × 1355   la fila estirando sobre la barra  PUBLICADA
franquicias/
  franquicias-belgrano.jpg      2560 × 1707   sala vacía, fila de reformers     PUBLICADA
metodo/
  estiramiento-de-espaldas.jpg  1707 × 2560   de espaldas, aro de luz al fondo  PUBLICADA
academy/
  instructora-corrigiendo.jpg   1707 × 2560   la instructora corrigiendo        PUBLICADA
niveles/
  initial-nueva.jpg             1707 × 2560   movimiento contenido              PUBLICADA
  intense.jpg                   1707 × 2560   aro entre los pies, brazos arriba PUBLICADA
  levelup-nueva.jpg             1707 × 2560   dos alumnas                       alternativa
og/
  fila-completa.jpg             2560 × 1707   el encuadre entero, con el logo   fuente de og.jpg
  grupo-clase.jpg               1707 × 2560   cuatro alumnas en clase           alternativa
```

Dos cosas sobre el hero, porque el recorte no es caprichoso:

- **`hero-estiramiento.jpg` está recortado por arriba** respecto del original.
  El encuadre completo tiene el logo CLIC retroiluminado en la pared, arriba a
  la izquierda — justo debajo del logo del header. Los dos juntos se leen como
  un logo duplicado y fuera de foco. Recortando la franja de arriba desaparece
  el problema y de paso la proporción (1,89) queda casi igual a la del hero en
  desktop, así que se pierde menos imagen.
- **El encuadre completo no se tiró**: vive en `og/fila-completa.jpg` y es la
  fuente de `public/og.jpg`. Ahí el logo suma en vez de estorbar, porque la
  imagen de compartir no tiene un header encima.

### Producción vieja (fototeca del sitio actual)

```
hero/
  hero-sala.jpg                 4425 × 2950   plano general, gente en clase    PUBLICADA
  hero-clase.jpg                4396 × 2931   cuatro alumnas en lunge          alternativa
metodo/
  metodo-manos.jpg              2405 × 4275   manos sobre la barra             alternativa
franquicias/
  franquicias-sala-vacia.jpg    4512 × 3008   sala vacía, fila de reformers    alternativa
niveles/
  initial.jpg                   2859 × 4288   movimiento contenido, calma      alternativa
  levelup.jpg                   2888 × 4332   de espaldas, brazos abiertos     PUBLICADA
marca/
  comunidad-alumnas.jpg         2794 × 4191   dos alumnas                      PUBLICADA
  manifiesto.jpg                2790 × 4185   figura recogida sobre el reformer PUBLICADA
```

Nichos con arcos, paredes beige, luz natural, registro documental.

### La imagen de compartir

```
og.jpg                          1200 × 630    recorte de hero/hero-sala.jpg
```

Vive en `public/og.jpg`, no en `public/fotos/`, porque no es una foto de una
sección: es la única imagen que se ve **fuera** del sitio. La genera
`scripts/preparar-og.mjs` respetando el punto focal, así que queda encuadrada
como la que se ve en la página. Para rehacerla desde otra foto:

```
node scripts/preparar-og.mjs public/fotos/hero/hero-sala.jpg 50 45
```

---

## Lo que falta bajar del Drive

Es el resto de la producción nueva —hormigón, aro de luz, logos "C"
retroiluminados—. Las marcadas con ★ reemplazan a lo que hay hoy.

### Belgrano

| Bajar | Guardar como |
|---|---|
| ★ [`DSC06301.JPG`](https://drive.google.com/file/d/1Hvt5bIpx5CY3FLlr1Sk2Ry2z1Akaw2Mj/view) | `hero/hero-belgrano.jpg` |
| [`DSC06520.JPG`](https://drive.google.com/file/d/1YxLC5gvinO_LHinC2K4E5srq2FkR88m9/view) | `niveles/levelup-plancha.jpg` |

El hero ya muestra una foto real (`hero-sala.jpg`), así que esto dejó de ser
urgente: es un reemplazo por una mejor, no un hueco.

### Soho

| Bajar | Guardar como |
|---|---|
| [`DSC07218.jpeg`](https://drive.google.com/file/d/1o4WZjI39HPm45cLSbKSbDOe_U5M7qMQz/view) | `metodo/metodo-pelota.jpg` |
| [`DSC07072.jpeg`](https://drive.google.com/file/d/13OWcrx7U84HaD7NzD-hydtS1IBPZBTw5/view) | `marca/botella.jpg` |

### Pilara — [carpeta](https://drive.google.com/drive/folders/1ERJ2fghrEsDGuXhNuCNh5K2syj0yrZ7t)

| Bajar | Guardar como |
|---|---|
| ★ `DSC08176.jpeg` — el living con la "C" grande | `comunes/living.jpg` |
| `DSC08137.jpeg` — dos mujeres sentadas de espaldas | `metodo/metodo-duo.jpg` |

### Office — [carpeta](https://drive.google.com/drive/folders/1k27tqSZ1NAitcVwhwZ1jRQKAcoiUKQ9V)

| Bajar | Guardar como |
|---|---|
| `DSC00130.jpeg` — tres personas con pelotas en alto | `niveles/clase-grupo.jpg` |
| `DSC00161.jpeg` — chica sonriendo, chico con remera CLIC | `marca/equipo.jpg` |

### Núñez — [carpeta](https://drive.google.com/drive/folders/12J42h7bIMzNf28zhaA3oUVmJABdhw2_L)

| Bajar | Guardar como |
|---|---|
| ★ `dji_export_20260724_photo_0003.HEIC` — el ingreso con el logo | `comunes/recepcion.jpg` |

Ojo con esta última: viene en HEIC y Next no lo procesa. Hay que convertirla a
JPG antes de guardarla. En Windows, abrirla con Fotos y usar "Guardar como"
alcanza.

---

## Ya no queda ninguna carpeta vacía

**`academy/`** tiene `instructora-corrigiendo.jpg`, que hasta el 10-sep vivía en
`metodo/` como `metodo-correccion.jpg`. Se movió porque muestra el oficio que
Academy enseña —alguien mirando un cuerpo y ajustándolo— y usar la misma foto en
las dos secciones se nota.

La imagen de compartir **ya existe** (`public/og.jpg`, generada desde el hero).
`og/grupo-clase.jpg` sigue ahí como alternativa, pero es vertical: para usarla
habría que recortarla a 1200 × 630 con `scripts/preparar-og.mjs`.

---

## Las imágenes generadas con IA no van acá

En `referencia-ia/` (fuera de `public/`, y fuera del repo) hay siete imágenes
generadas: un hero, dos de método, una de academy, las dos de niveles y una para
la OG. **No se publican.**

El motivo no es estético — son buenas—: es que muestran una sala que no es
ninguna de las once y personas que no existen. Todo el sitio está construido
sobre "lo que ves acá es lo que hay" (horarios, cupos y precios reales), y las
fotos serían el único lugar donde eso dejaría de ser cierto. Alguien reserva su
clase de prueba esperando esa sala, y entra a otra.

Para lo que **sí** sirven: son la lista de tomas. `academy.jpg` resuelve cómo
mostrar una formación, y llevárselo al fotógrafo ahorra media reunión.

(`nivel-initial-correccion.jpg` ya cumplió su función: era el encuadre de la
instructora corrigiendo, y esa foto ahora existe de verdad en
`metodo/metodo-correccion.jpg`.)

## Lo que hay que producir

1. **Una toma horizontal de una clase de Intense.** La que hay es vertical y el
   subhero es una banda ancha y baja, así que entra una franja finita: se ve el
   aro y los brazos, no la clase.
2. **Academy propiamente dicha** — una instructora formando a otra. Lo que hay
   hoy es una instructora corrigiendo en clase: funciona, pero muestra el oficio,
   no la formación.
3. **Vestuarios** vacíos y ordenados. Ojo: **el sitio no tiene un slot de
   vestuarios**. Iría como una de las tres fotos de la galería de cada estudio,
   y esas salen del backend (`sede.fotosDetalle`), o sea que se cargan desde el
   backoffice de Clicnet, no desde este repo. Lo que falta ahí no es una foto
   suelta: es que las once galerías tengan el mismo set de tres —fachada, plano
   general y un detalle— para que se lean como una familia. Si hay que elegir
   una sola, la fachada es la que más sirve.

Conviene hacerlas en Belgrano o Soho, que son las sedes fotografiadas con el
estándar nuevo, y con la misma cámara y luz.

---

## Una advertencia de coherencia

Las sedes se ven distintas entre sí: hormigón visto y aro de luz en Belgrano y
Soho, nichos con arcos en las viejas. Mezclarlas dentro de una misma página va a
leer raro.

La regla simple: **hero y páginas de marca salen de la producción nueva; cada
landing de sede muestra su propia sede.** Si en una página tenés que poner dos
fotos juntas, que sean de la misma sede.

Hoy esto está a medias en la home: "El método" muestra la foto nueva
(`estiramiento-de-espaldas.jpg`) y el hero y el manifiesto salen de la vieja.
Ya no es un problema de permisos —están todos— sino de qué foto se elige: se
resuelve reemplazando archivos, que es un cambio de una línea por foto.

---

## Consentimiento

Era el bloqueante de casi todo lo de acá. **Llegó el 10-sep, para todas**, así
que hoy no queda ninguna foto esperando permiso y ninguna sección muestra el
degradado por ese motivo.

**El interruptor no se saca.** Cada foto sigue declarando en `src/lib/fotos.ts`
si se puede publicar, y la próxima tanda entra igual: con `publicable: false`
hasta que su permiso exista. Publicar la cara de una alumna en un sitio
comercial sin su permiso no es una decisión de diseño, y que hoy la lista esté
vacía es un estado, no el final de la historia.

Para habilitar una foto nueva, una vez que llegue el permiso: `publicable: true`.
No hay nada más que tocar.
