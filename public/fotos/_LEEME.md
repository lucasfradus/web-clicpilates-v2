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

### Producción nueva (Drive, bajada el 4-sep)

```
franquicias/
  franquicias-belgrano.jpg      2560 × 1707   sala vacía, fila de reformers    PUBLICADA
metodo/
  estiramiento-de-espaldas.jpg  1707 × 2560   de espaldas, aro de luz al fondo PUBLICADA
  metodo-correccion.jpg         1707 × 2560   la instructora corrigiendo       espera permiso
niveles/
  initial-nueva.jpg             1707 × 2560   movimiento contenido             espera permiso
  levelup-nueva.jpg             1707 × 2560   dos alumnas                      espera permiso
og/
  grupo-clase.jpg               1707 × 2560   cuatro alumnas en clase          espera permiso
```

### Producción vieja (fototeca del sitio actual)

```
hero/
  hero-sala.jpg                 4425 × 2950   plano general, gente en clase    espera permiso
  hero-clase.jpg                4396 × 2931   cuatro alumnas en lunge
metodo/
  metodo-manos.jpg              2405 × 4275   manos sobre la barra
franquicias/
  franquicias-sala-vacia.jpg    4512 × 3008   sala vacía, fila de reformers
niveles/
  initial.jpg                   2859 × 4288   movimiento contenido, calma      espera permiso
  levelup.jpg                   2888 × 4332   de espaldas, brazos abiertos     PUBLICADA
marca/
  comunidad-alumnas.jpg         2794 × 4191   dos alumnas                      espera permiso
  manifiesto.jpg                2790 × 4185   figura recogida sobre el reformer PUBLICADA
```

Nichos con arcos, paredes beige, luz natural, registro documental. Siguen
cargadas porque tres de ellas son las que hoy se pueden publicar.

Qué archivo usa cada sección está en `src/lib/fotos.ts`, que es el único lugar
donde se toca esto.

---

## Lo que falta bajar del Drive

Es el resto de la producción nueva —hormigón, aro de luz, logos "C"
retroiluminados—. Las marcadas con ★ reemplazan a lo que hay hoy.

### Belgrano

| Bajar | Guardar como |
|---|---|
| ★ [`DSC06301.JPG`](https://drive.google.com/file/d/1Hvt5bIpx5CY3FLlr1Sk2Ry2z1Akaw2Mj/view) | `hero/hero-belgrano.jpg` |
| [`DSC06520.JPG`](https://drive.google.com/file/d/1YxLC5gvinO_LHinC2K4E5srq2FkR88m9/view) | `niveles/levelup-plancha.jpg` |

El hero es el que más falta: es lo primero que se ve y hoy muestra un degradado.

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

## La carpeta vacía

**`academy/`** está vacía a propósito. No existe ninguna foto de formación en
ninguna fuente, ni en la producción vieja ni en la nueva. Hay que producirla.

`og/` ya no está vacía, pero lo que tiene **no sirve como está**: la OG es
horizontal (1200 × 630) y `grupo-clase.jpg` es vertical. Necesita un recorte,
además del permiso.

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

1. **Academy** — una instructora formando a otra. La única que no tiene ninguna
   toma equivalente en ninguna fuente.
2. **Vestuarios** vacíos y ordenados.

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

Hoy esto está a medias en la home: "El método" ya muestra la foto nueva
(`estiramiento-de-espaldas.jpg`) pero el manifiesto sigue con la vieja, porque
es una de las tres que se pueden publicar. Se resuelve solo cuando lleguen los
permisos.

---

## Consentimiento

Es el bloqueante real de casi todo lo de acá. Publicar la cara de una alumna en
un sitio comercial sin su permiso no es una decisión de diseño, así que cada
foto declara en `src/lib/fotos.ts` si se puede publicar y, mientras esté en
`false`, la sección muestra su degradado en vez de la foto.

**Las 4 que se publican hoy** no necesitan permiso porque no hay ninguna cara
identificable:

| Archivo | Por qué pasa |
|---|---|
| `franquicias/franquicias-belgrano.jpg` | sala vacía, no hay nadie |
| `metodo/estiramiento-de-espaldas.jpg` | de espaldas y el pelo le tapa la cara |
| `niveles/levelup.jpg` | de espaldas |
| `marca/manifiesto.jpg` | la cara queda tapada por los brazos |

**Las que esperan permiso**, con quién hay que pedírselo:

| Archivo | Quién aparece |
|---|---|
| `hero/hero-sala.jpg` | varias alumnas, plano general |
| `niveles/initial-nueva.jpg` | una alumna, de frente a cámara |
| `niveles/levelup-nueva.jpg` | dos alumnas |
| `marca/comunidad-alumnas.jpg` | dos alumnas |
| `og/grupo-clase.jpg` | cuatro alumnas |
| `metodo/metodo-correccion.jpg` | la instructora (de perfil y fuera de foco) y dos alumnas |

`metodo-correccion.jpg` es la más fácil de destrabar de las seis: la persona
identificable es la instructora, no una alumna. Y es la que más suma, porque es
la prueba visual del argumento de los grupos chicos.

Para habilitar una, una vez que llegue el permiso: `publicable: true` en
`src/lib/fotos.ts`. No hay nada más que tocar.
