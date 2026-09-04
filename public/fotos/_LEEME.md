# Fotos del sitio — cómo está organizada esta carpeta

Una subcarpeta por slot de `docs/fotos.md`. Dentro de cada una, la elegida y sus
alternativas. Criterio de nombres: descriptivo, sin números, en minúscula y con
guiones, para que se entienda qué es cada archivo sin abrirlo.

Los originales van acá tal cual salieron de cámara. No los redimensiones a mano:
`next/image` los optimiza al vuelo y genera los tamaños que hagan falta.

---

## Lo que ya está

```
hero/
  hero-sala.jpg                    4425 × 2950   plano general, gente en clase
  hero-clase.jpg                   4396 × 2931   cuatro alumnas en lunge, movimiento
metodo/
  metodo-manos.jpg                 2405 × 4275   manos sobre la barra, dos alumnas
franquicias/
  franquicias-sala-vacia.jpg       4512 × 3008   sala vacía, fila de reformers
niveles/
  initial.jpg                      2859 × 4288   movimiento contenido, calma
  levelup.jpg                      2888 × 4332   de espaldas, brazos abiertos, fuerza
marca/
  comunidad-alumnas.jpg            2794 × 4191   dos alumnas, ambiente de estudio
  manifiesto.jpg                   2790 × 4185   figura recogida sobre el reformer
```

Todas salen de la fototeca del sitio actual y son de la producción vieja: nichos
con arcos, paredes beige, luz natural, registro documental.

## Lo que falta bajar del Drive

Es la producción nueva —hormigón, aro de luz, logos "C" retroiluminados— y es
mejor. Las marcadas con ★ son las que reemplazan a lo que hay hoy.

### Belgrano

| Bajar | Guardar como |
|---|---|
| ★ [`DSC06301.JPG`](https://drive.google.com/file/d/1Hvt5bIpx5CY3FLlr1Sk2Ry2z1Akaw2Mj/view) | `hero/hero-belgrano.jpg` |
| ★ [`DSC06261.JPG`](https://drive.google.com/file/d/1zWNdD4vdwD8wfOLTx53q1RTVhXTY9vKq/view) | `franquicias/franquicias-belgrano.jpg` |
| [`DSC06520.JPG`](https://drive.google.com/file/d/1YxLC5gvinO_LHinC2K4E5srq2FkR88m9/view) | `niveles/levelup-plancha.jpg` |

### Soho

| Bajar | Guardar como |
|---|---|
| ★ [`DSC07218.jpeg`](https://drive.google.com/file/d/1o4WZjI39HPm45cLSbKSbDOe_U5M7qMQz/view) | `metodo/metodo-pelota.jpg` |
| [`DSC07087.jpeg`](https://drive.google.com/file/d/1XfCWmHOLHqTp7sFJRNlDerYIqS_vsma_/view) | `metodo/metodo-estiramiento.jpg` |
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

## Las dos carpetas vacías

**`academy/`** está vacía a propósito. No existe ninguna foto de formación en
ninguna fuente. Es una de las tres que hay que producir.

**`og/`** se genera después: es un recorte a 1200 × 630 del hero definitivo, y
conviene hacerlo recién cuando esté decidido cuál de los tres heroes queda.

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

Para lo que **sí** sirven: son la lista de tomas. `nivel-initial-correccion.jpg`
es exactamente el encuadre que falta producir —la instructora agachada,
corrigiendo, con la alumna en el reformer— y `academy.jpg` resuelve cómo
mostrar una formación. Llevárselas al fotógrafo ahorra media reunión.

## Lo que hay que producir

1. **Instructora corrigiendo a una alumna**, cerrado, manos y espalda, vertical
   4:5. Es la que falta de verdad: es la prueba visual de los grupos chicos con
   corrección personalizada, y hoy no existe en ninguna de las dos producciones.
2. **Academy** — una instructora formando a otra.
3. **Vestuarios** vacíos y ordenados.

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

---

## Consentimiento

Casi todas tienen caras reconocibles, y las de la producción nueva más todavía
porque están dirigidas. Falta el consentimiento de esas personas antes de
publicar. Las que no lo necesitan: `franquicias-belgrano.jpg`,
`franquicias-sala-vacia.jpg`, `comunes/recepcion.jpg` y cualquier recorte cerrado
de manos o equipo.
