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

## Marca y favicons

| Ruta pública | Dimensiones | Peso | Sección | `alt` sugerido |
|---|---|---|---|---|
| `/img/marca/logo.webp` | 929×489 | 56.6 KB | Hero / header (escritorio), footer | Logo de Comercial Hinojosa: Nutrición que da vida |
| `/img/marca/logo-480.webp` | 480×253 | 36.5 KB | Hero / header (móvil y `srcset`) | Logo de Comercial Hinojosa: Nutrición que da vida |
| `/img/marca/logo.png` | 929×489 | 213 KB | Respaldo PNG transparente (Open Graph, correo) | Logo de Comercial Hinojosa |
| `/img/marca/isotipo.webp` | 263×257 | 11.2 KB | Header compacto, separadores, footer | Isotipo de Comercial Hinojosa: letra H sobre hojas verdes |
| `/img/marca/isotipo.png` | 263×257 | 62.7 KB | Respaldo PNG transparente | Isotipo de Comercial Hinojosa |
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
- **AVIF**: el Pillow instalado no soporta AVIF. Solo hay WebP (soporte universal en navegadores actuales).
- **Derechos**: el arte de Canela y varios afiches parecen generados con IA. Hay que confirmar con la dueña los derechos de uso antes de publicar. También hay marcas de terceros en los afiches de productos y los precios impresos pueden estar desactualizados.
- **Videos**: mantienen el mismo contenido y orden de afiches que los originales. Solo cambian el fondo (crema `#F6F1E4` o verde `#1B4D2B` en lugar del margen desenfocado gris), la resolución y el empalme del bucle. En `hero` y `canela` la insignia de Canela aparece recortada sobre verde de marca, y en `canela` el "pulgar arriba" es la versión circular nueva.
