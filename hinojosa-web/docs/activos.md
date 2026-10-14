# Activos web: imágenes, video y favicons

Generados desde `Pre/hinojosa-assets/` (los originales no se tocan) con los scripts de `scripts-activos/`:

```bash
cd hinojosa-web/scripts-activos
python marca_canela.py        # logo, isotipo, favicons y recortes de Canela
python afiches_productos.py   # afiches de productos y de marca (900 px y 480 px)
python videos.py              # 5 videos + posters (usa los PNG de marca/Canela: correr después)
```

La insignia de Canela usa una máscara geométrica (elipse del aro + placa con esquinas redondeadas, medidas sobre la imagen fuente y dibujadas a 4x con antialiasing), no un relleno por color: el pañuelo de Canela es del mismo verde que el fondo.

Requisitos: Python 3.13, Pillow 11, numpy, `imageio_ffmpeg` (trae ffmpeg 7.1). No hay modelo 3D de Canela: no se incluye ningún `.glb`.

## Activos del cliente (`Nuevos Req/`, recibidos el 2026-10-12)

Originales intactos en `Nuevos Req/` (no se modifican ni se publican tal cual). Se regeneran con:

```bash
python hinojosa-web/scripts-activos/nuevos_req.py            # imágenes + video
python hinojosa-web/scripts-activos/nuevos_req.py imagenes   # solo productos y Canela
python hinojosa-web/scripts-activos/nuevos_req.py video      # solo el video
```

Requisitos: Python 3.13 + Pillow + numpy; Node con `sharp` (en `node_modules`) para WebP/AVIF, vía `scripts-activos/nuevos_req_codificar.mjs`; FFmpeg 8.1 (`scoop install ffmpeg`).

### Productos: `/img/productos/<cat>/<slug>.webp` · `.avif` · `<slug>-thumb.webp`

`cat`: `granja` · `mascotas` · `comederos` · `granos`. `slug`: nombre del archivo en minúsculas, sin tildes, espacios → guiones (`balaceado` → `balanceado`). Margen transparente recortado antes de escalar. Principal: 800 px de alto, con alfa (WebP q80 / AVIF q55). Miniatura: 160 px de alto, solo WebP.

| Carpeta | Imágenes | WebP 800 | AVIF 800 | Miniaturas | Total |
|---|---|---|---|---|---|
| `granja` | 9 | 656 KB | 377 KB | 69 KB | 1103 KB |
| `mascotas` | 12 | 780 KB | 440 KB | 86 KB | 1306 KB |
| `comederos` | 5 | 247 KB | 146 KB | 34 KB | 426 KB |
| `granos` | 7 | 710 KB | 393 KB | 61 KB | 1164 KB |
| **Total** | **33** | **2393 KB** | **1356 KB** | **250 KB** | **≈ 3.9 MB** (en disco; cada visitante baja solo un formato y solo lo visible) |

Variante **`<slug>-400.webp` · `-400.avif`** (400 px de alto, mismo recorte y alfa; para el `srcset` del carrusel en móvil, cuya tarjeta mide ~116 px de ancho):

| Carpeta | WebP 400 | AVIF 400 | Total |
|---|---|---|---|
| `granja` | 241 KB | 140 KB | 381 KB |
| `mascotas` | 298 KB | 172 KB | 470 KB |
| `comederos` | 102 KB | 66 KB | 168 KB |
| `granos` | 245 KB | 141 KB | 386 KB |
| **Total (33 + 33)** | **886 KB** | **519 KB** | **≈ 1.4 MB** |

Cada WebP 400 pesa ≤ 49 KB (media ≈ 27 KB), frente a ≈ 72 KB de media en 800 px.

Miniatura **`<slug>-thumb-80.webp`** (80 px de alto, solo WebP; lista del catálogo, hueco de 40 px; QA M6): granja 25.7 KB · mascotas 31.3 KB · comederos 14.1 KB · granos 21.7 KB · **total 92.8 KB** para las 33 (frente a 250 KB de las `-thumb` de 160 px). Máximo 4.2 KB por archivo.

Por archivo: WebP 800 de 30 a 124 KB (media ≈ 72 KB), AVIF ≈ 40 % menos, miniaturas de 4 a 12 KB.

Fondos de origen:
- `granja/melaza`: venía con fondo gris de estudio. **Recortado** (modelo de fondo cuadrático + relleno desde los bordes); la sombra de contacto se conserva como sombra negra semitransparente.
- `granja/sal-en-grano` (foto con fondo texturizado) y `granos/diferentes-tipos-de-semillas` (los bordes blancos de los sobres se confunden con el fondo): **se publican con su fondo**, rectangulares.
- `comederos/bebedero` (2026-10-14): el original traía un **damero "transparente" pintado** y no se podía recortar. Se usa `bebedero_quitado_disque.jpg` (fondo quitado en Paint por el usuario, guardado en JPG sobre blanco puro), que `nuevos_req.py` recorta con `quitar_fondo_blanco` (tabla `REEMPLAZOS`). Ya se publica **transparente**, sin `conFondo`.

### Canela (`Mascota/Canela.png`, recortada con alfa)

| Ruta pública | Dimensiones | Peso WebP / AVIF | Uso |
|---|---|---|---|
| `/img/canela/canela.webp` · `.avif` | 460×600 | 38.2 / 24.0 KB | Perrito de Inicio en grande; fallback de `prefers-reduced-motion` |
| `/img/canela/canela-franja.webp` · `.avif` | 153×200 | 9.6 / 6.0 KB | Franja inferior de Inicio (1x) |
| `/img/canela/canela-franja@2x.webp` · `.avif` | 307×400 | 21.6 / 14.1 KB | Franja inferior de Inicio (2x) |

`alt` sugerido: "Canela, la perrita mascota de Comercial Hinojosa, con gorra verde y su placa de trébol".

### Video `Mascota/Canela Jugando.mp4`

Original: 1920×1080, 24 fps, 7,96 s (191 cuadros), H.264 + audio AAC, 3,3 MB. **Sin canal alfa**, pero el fondo es blanco/gris liso con sombra suave y la cámara casi fija: **se recorta limpio** cuadro a cuadro. Canela **juega en el sitio** (sentada, saluda con la pata, salta, da una vuelta y vuelve a sentarse); **no camina en horizontal**. El bucle casi calza (empieza y termina sentada en la misma pose), pero el salto último→primer cuadro es el doble del movimiento medio entre cuadros (boca cerrada → abierta y un leve cambio de encuadre): se nota un pequeño salto. En los cuadros del salto la gorra queda cortada por el borde superior del original.

| Ruta pública | Dimensiones | Peso | Notas |
|---|---|---|---|
| `/video/canela-jugando.webm` | 1280×720 | ≈ 608 KB | VP9, sin audio, con fondo |
| `/video/canela-jugando.mp4` | 1280×720 | ≈ 634 KB | H.264 High, `+faststart`, sin audio |
| `/video/canela-jugando-poster.webp` | 1280×720 | 22.3 KB | Primer cuadro |
| `/video/canela-jugando-alfa.webm` | 688×480 | ≈ 1151 KB | **VP9 con alfa** (`yuva420p`), recortado al área común de todos los cuadros; sombra semitransparente |
| `/video/canela-jugando-alfa-poster.webp` | 688×480 | ≈ 26 KB | Primer cuadro recortado con alfa; fallback de Safari/iOS y de `prefers-reduced-motion` |

Safari (macOS/iOS) **no reproduce el alfa de VP9**: muestra fondo negro o no reproduce. Detectarlo y usar `canela-jugando-alfa-poster.webp` (o `canela-franja.webp`) en su lugar. Un HEVC con alfa (`.mov`) solo se puede codificar en macOS (VideoToolbox).

## Marca y favicons

| Ruta pública | Dimensiones | Peso | Sección | `alt` sugerido |
|---|---|---|---|---|
| `/img/marca/logo.webp` | 929×489 | 56.6 KB | Hero / header (escritorio), footer | Logo de Comercial Hinojosa: Nutrición que da vida |
| `/img/marca/logo-480.webp` | 480×253 | 36.5 KB | Hero / header (móvil y `srcset`) | Logo de Comercial Hinojosa: Nutrición que da vida |
| `/img/marca/logo.png` | 929×489 | 213 KB | Respaldo PNG transparente (Open Graph, correo) | Logo de Comercial Hinojosa |
| `/img/marca/isotipo.webp` | 263×257 | 11.2 KB | Header compacto, separadores, footer | Isotipo de Comercial Hinojosa: letra H sobre hojas verdes |
| `/img/marca/isotipo.png` | 263×257 | 62.7 KB | Respaldo PNG transparente | Isotipo de Comercial Hinojosa |
| `/img/marca/isotipo-96.webp` | 98×96, transparente | 5.2 KB | Barra de navegación (se pinta a 36–40 px; cubre 2x). Generado por `nuevos_req.py` desde `isotipo.png` (QA M7) | Isotipo de Comercial Hinojosa: letra H sobre hojas verdes |
| `/favicon.svg` | 64×64 (PNG incrustado) | 6.1 KB | `<link rel="icon" type="image/svg+xml">` | (decorativo) |
| `/favicon.ico` | 16, 32 y 48 px | 8.5 KB | Favicon clásico | (decorativo) |
| `/favicon.png` | 32×32 | 2.6 KB | `<link rel="icon" type="image/png" sizes="32x32">` | (decorativo) |
| `/apple-touch-icon.png` | 180×180, fondo crema | 23.1 KB | `<link rel="apple-touch-icon">` | (decorativo) |

## Canela

| Ruta pública | Dimensiones | Peso | Sección | `alt` sugerido |
|---|---|---|---|---|
| `/img/canela/canela-insignia.webp` | 791×871, transparente | 66.2 KB | Sección "Conoce a Canela", hero escritorio | Canela, la perrita mascota de Comercial Hinojosa, con gorra verde en su insignia de Venta de balanceados |
| `/img/canela/canela-insignia-480.webp` | 480×529, transparente | 36.9 KB | Hero (recomendado) y móvil | (igual que la anterior) |
| `/img/canela/canela-insignia.png` | 791×871, transparente | 741 KB | Solo respaldo/edición; no usar en la página | (igual) |
| `/img/canela/canela-pulgar.webp` | 332×332, círculo con aro dorado | 21.3 KB | "Por qué elegirnos", CTA de WhatsApp, avatar | Canela levantando el pulgar con pañoleta verde de Comercial Hinojosa |
| `/img/canela/canela-pulgar.png` | 332×332 | 158 KB | Respaldo | (igual) |
| `/img/canela/conoce-a-canela.webp` | 900×896 | 84.3 KB | Sección Canela (afiche completo, opcional) | Afiche "¡Conoce a Canela!": la mascota de Comercial Hinojosa, alegre, cariñosa y siempre lista para jugar |
| `/img/canela/conoce-a-canela-480.webp` | 480×478 | 41.3 KB | `srcset` móvil | (igual) |

## Afiches de marca (`srcset`: `<nombre>-480.webp 480w, <nombre>.webp 900w`)

| Ruta pública | Dimensiones (900 / 480) | Peso (900 / 480) | Sección | `alt` sugerido |
|---|---|---|---|---|
| `/img/afiches/01-logo-nuevo-significado.webp` | 900×608 / 480×324 | 25.1 / 11.4 KB | Quiénes somos (historia del logo) | Afiche del nuevo logo de Comercial Hinojosa y su significado |
| `/img/afiches/03-mision-vision.webp` | 900×895 / 480×477 | 102.4 / 42.6 KB | Quiénes somos: misión y visión | Afiche con la misión y visión de Comercial Hinojosa |
| `/img/afiches/05-valores-esencia.webp` | 900×609 / 480×325 | 77.9 / 31.7 KB | Valores y esencia | Afiche "Nuestros valores": buen trato, calidez, amabilidad, responsabilidad, honestidad y compromiso con el cliente |
| `/img/afiches/06-tu-mejor-aliado.webp` | 900×899 / 480×479 | 95.9 / 40.3 KB | Por qué elegirnos | Afiche "Tu mejor aliado para tus animales" con Canela, un perro, un gato, una gallina y un cerdo |

## Productos (catálogo; mismos nombres que `src/data/productos.json`)

Los originales miden 627–661 px de ancho, así que la versión "900" conserva su ancho nativo (no se amplía). `srcset`: `<nombre>-480.webp 480w, <nombre>.webp <ancho>w`.

| Ruta pública | Dimensiones | Peso (nativo / 480) | `alt` sugerido |
|---|---|---|---|
| `/img/productos/07-nutritivos-linea-premium.webp` | 656×687 | 63.8 / 43.6 KB | Línea Premium de balanceados Nutritivos para pollos, vacas, cerdos, cuyes y gallos |
| `/img/productos/08-afrecho-trigo-arrocillo.webp` | 635×882 | 37.4 / 24.8 KB | Sacos de afrecho de trigo, trigo natural y arrocillo |
| `/img/productos/09-maiz.webp` | 642×912 | 60.7 / 39.9 KB | Sacos de maíz en grano, maíz molido natural y maíz molido vitaminizado Hinojosa |
| `/img/productos/10-bebederos-comederos-aves.webp` | 637×836 | 48.5 / 32.9 KB | Bebederos y comederos galvanizados y plásticos para aves de corral |
| `/img/productos/11-arena-gatos.webp` | 657×907 | 50.7 / 33.8 KB | Arena sanitaria para gatos Pro-Cat, NutraPro y Freemiau |
| `/img/productos/12-procan-perros.webp` | 652×902 | 61.6 / 41.7 KB | Alimento Pro-Can y Cani para perros cachorros y adultos |
| `/img/productos/13-sal-melaza.webp` | 628×853 | 32.0 / 20.9 KB | Sal en grano y melaza |
| `/img/productos/14-balanceados-camperito.webp` | 648×932 | 70.9 / 47.5 KB | Balanceados Camperito y Nutritivos para pollos de crecimiento y engorde |
| `/img/productos/15-procan-perros-2.webp` | 650×886 | 57.1 / 38.6 KB | Alimento Pro-Can para perros de razas pequeñas, medianas y grandes |
| `/img/productos/16-masticables.webp` | 632×905 | 50.5 / 35.0 KB | Masticables para mascotas Mascan, Pro-Can y Bio Cani |
| `/img/productos/17-tilapia.webp` | 658×747 | 44.3 / 31.1 KB | Balanceado tilapero Bio Alimentar Premium con tabla de proteína por etapa |
| `/img/productos/18-nutrapro-dogchow-procat.webp` | 642×871 | 49.7 / 34.5 KB | Alimentos NutraPro, Dog Chow y Pro Cat para perros y gatos |
| `/img/productos/19-bebederos-mascotas.webp` | 647×916 | 44.9 / 30.1 KB | Comederos y bebederos plásticos para mascotas |
| `/img/productos/20-semillas.webp` | 627×901 | 73.9 / 51.5 KB | Semillas de hortalizas de alta calidad: tomate, sandía, melón, pimiento, perejil, cebolla y pepino |
| `/img/productos/21-nutritivos-cerdos-vacas-cuyes.webp` | 661×918 | 56.3 / 36.7 KB | Balanceados Nutritivos para cerdos, vacas y cuyes |
| `/img/productos/22-masticables-mascan.webp` | 657×915 | 40.7 / 28.2 KB | Huesos masticables Mascan para perros |

## Videos (sin audio, 25 fps, bucle sin corte; MP4 H.264 con `+faststart`, WebM VP9)

| Ruta pública | Dimensiones | Duración | Peso WebM / MP4 | Poster (`/video/posters/…`) | Sección | `aria-label` sugerido |
|---|---|---|---|---|---|---|
| `/video/hero.webm` · `.mp4` | 1280×720 | 12 s | 1026 / 1000 KB | `hero.webp` 1280×720, 15.4 KB | Fondo del hero (escritorio) | Animación con el logo de Comercial Hinojosa y su mascota Canela |
| `/video/canela.webm` · `.mp4` | 720×1280 | 11.6 s | 873 / 903 KB | `canela.webp` 720×1280, 53.3 KB | Sección Canela / hero móvil | Animación de Canela, la mascota de Comercial Hinojosa |
| `/video/catalogo.webm` · `.mp4` | 720×1280 | 22 s | 2277 / 2296 KB | `catalogo.webp` 720×1280, 59.4 KB | Sección catálogo | Recorrido por los afiches de balanceados, granos y productos |
| `/video/nosotros.webm` · `.mp4` | 1280×720 | 11.1 s | 1247 / 1214 KB | `nosotros.webp` 1280×720, 62.1 KB | Quiénes somos, misión, visión y valores | Afiches de misión, visión y valores de Comercial Hinojosa |
| `/video/mascotas.webm` · `.mp4` | 720×1280 | 13.8 s | 1222 / 1211 KB | `mascotas.webp` 720×1280, 56.1 KB | Mascotas y accesorios | Afiches de alimentos, masticables y accesorios para mascotas |

Los videos son decorativos: usar `autoplay muted loop playsinline preload="none"` (o `metadata`) con `poster`, cargarlos de forma diferida y no reproducirlos con `prefers-reduced-motion: reduce` (dejar solo el poster). Si llevan `aria-hidden="true"`, el texto equivalente debe estar en la página.

```html
<video autoplay muted loop playsinline preload="none" poster="/video/posters/hero.webp" aria-hidden="true">
  <source src="/video/hero.webm" type="video/webm">
  <source src="/video/hero.mp4" type="video/mp4">
</video>
```

## Presupuesto de la página inicial

| Recurso visible al cargar | Peso |
|---|---|
| `logo-480.webp` (o `logo.webp` en escritorio: 56.6 KB) | 36.5 KB |
| `canela-insignia-480.webp` | 36.9 KB |
| **Logo + Canela (hero)** | **73.4 KB** (con `logo.webp` 929 px + insignia 480: 93.5 KB; ambas a tamaño completo: 122.8 KB; todas < 150 KB) |
| `video/posters/hero.webp` | 15.4 KB |
| Favicons (`favicon.svg` o `.ico`) | 6–9 KB |
| Subtotal sin video | ~97 KB |
| `video/hero.webm` (solo escritorio, autoplay) | 1026 KB |
| **Total con video del hero** | **~1.12 MB** (falta sumar CSS, JS y fuentes) |

Las imágenes del catálogo y los demás videos deben cargarse con `loading="lazy"` / `preload="none"`.

## Pendientes y advertencias

- **Modelo 3D de Canela y costales (`.glb`)**: no existen. Se usa video en bucle o imagen con parallax. Cuando exista el modelo, comprimirlo con gltf-transform (Draco/Meshopt + KTX2) y verificar que pese menos de 3 MB.
- **Logo vectorial (SVG)**: no existe. El logo y el isotipo transparentes salen de un recorte rasterizado (~930 px) y se ven suaves en pantallas grandes. Tampoco hay versión blanca para fondos oscuros: conviene pedírsela a la dueña.
- **Canela con el pulgar arriba**: no se puede aislar sin restos porque la tapan otros animales y el fondo del campo. Se entrega recortada en círculo con aro dorado y fondo crema. Necesita un arte limpio o fondo transparente de origen.
- **AVIF**: el Pillow instalado no soporta AVIF; los activos de `Nuevos Req/` se codifican con `sharp` y sí tienen AVIF. Los afiches antiguos siguen solo en WebP.
- **Perrito caminando en horizontal**: sigue sin llegar. `Canela Jugando.mp4` juega en el sitio; sirve para la franja como Canela quieta que juega (versión con alfa), no para cruzarla caminando.
- **Activos antiguos**: los afiches de `/img/productos/*.webp` (+ `-480`), y los videos `hero`, `canela`, `catalogo`, `nosotros`, `mascotas` siguen en `public/` porque `src/` los referencia (directamente o vía `src/lib/imagenes.ts`, que añade `-480`). Borrarlos cuando `src/` pase a las rutas nuevas. `/img/canela/conoce-a-canela*` ya no tiene referencias en `src/` (la sección se quitó), pero no lo reemplazan estos activos: se deja hasta confirmar.
- **Lottie**: ni `lottie-web` ni `@lottiefiles/dotlottie-web` están instaladas.
- **Derechos**: el arte de Canela y varios afiches parecen generados con IA. Hay que confirmar con la dueña los derechos de uso antes de publicar. También hay marcas de terceros en los afiches de productos y los precios impresos pueden estar desactualizados.
- **Videos**: mantienen el mismo contenido y orden de afiches que los originales. Solo cambian el fondo (crema `#F6F1E4` o verde `#1B4D2B` en lugar del margen desenfocado gris), la resolución y el empalme del bucle. En `hero` y `canela` la insignia de Canela aparece recortada sobre verde de marca, y en `canela` el "pulgar arriba" es la versión circular nueva.
