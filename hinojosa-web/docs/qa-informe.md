# Informe de QA y rendimiento: Comercial Hinojosa

Fase 5 de `PLAN.md` (sección 5, "Calidad" y "Reglas de rendimiento"; sección 9: Lighthouse > 90 y pruebas multidispositivo).
Fecha: 2026-10-11. Build auditado: `dist/` actual (generado después del último cambio en `src/` y `public/`), servido en local con gzip (HTML 123 KB → 17 KB transferidos) y soporte de Range para video.

Herramientas: Lighthouse 12.8.2 (CLI, con el Chromium 151 de Playwright vía `CHROME_PATH`), axe-core 4.14.0 inyectado con Playwright 1.62 (Python 3.13) y CDP de Chromium para el throttling (4G: 150 ms RTT, 1,6 Mbps de bajada y 750 kbps de subida; CPU x4). Los scripts y las capturas están fuera del proyecto, en el scratchpad de la sesión (`.../scratchpad/qa/`).

## 1. Resumen ejecutivo

El sitio cumple bien en contenido, enlaces, metadatos, teclado, movimiento reducido y responsive: no hay scroll horizontal en ningún ancho, no hay enlaces rotos, no hay datos sin confirmar enlazados y los precios coinciden con el JSON. **No cumple dos objetivos del plan:**

1. **Lighthouse móvil, Performance: 77-78** (objetivo > 90) y **LCP móvil por encima de 2,5 s en 4G**: 4,1-4,3 s simulado y una mediana de 4,0 s medida con CDP. Las causas principales son la hoja de Google Fonts, que bloquea el render, y la imagen LCP (la insignia de Canela), que tiene `fetchpriority="low"`.
2. **Accessibility: 93** en móvil y escritorio, por tres reglas que axe marca como serias: la estructura de `<dl>` en Ubicación y el nombre accesible del logo del header.

Además, el filtro del catálogo responde lento con CPU x4 (INP aproximado de 400 a 1100 ms) y el giro de las tarjetas de Categorías **no se ejecuta nunca en producción**, porque el minificador de CSS genera una declaración inválida. El "bug" de las imágenes vacías en Categorías **no es un fallo para el usuario**: es un artefacto de la captura de página completa (ver punto 5).

El peso está dentro del presupuesto: la carga inicial es de 754 KiB en móvil y 846 KiB en escritorio, frente a un máximo de 2 MB.

## 2. Resultados por punto

| # | Verificación | Resultado | Detalle |
|---|---|---|---|
| 1 | Lighthouse móvil y escritorio | **Falla** | Móvil: Perf 78 / A11y 93 / BP 100 / SEO 100 (otras dos corridas: 77 y 78). Escritorio: 97 / 93 / 100 / 100 (otras corridas: Perf 96 y 88). |
| 2 | axe-core (375 y 1280 px, menú abierto, catálogo filtrado) | **Falla** | 3 reglas serias en todos los escenarios (`definition-list`, `dlitem` y `label-content-name-mismatch`) y `target-size` solo a 1280 px con el catálogo filtrado. |
| 3 | Teclado | **Pasa** | 37 paradas de Tab (31 en móvil), foco visible en todas, sin trampas. Menú con Enter/Espacio/Escape, filtros con Enter/Espacio, Canela con Enter/Espacio/Escape y "Saltar al contenido" funcionan. Hay una observación menor (B2). |
| 4 | Responsive 320-1920 px | **Falla (parcial)** | Sin scroll horizontal en los 6 anchos. El texto de los pilares de "Nuestra esencia" se desborda a 320, 360 y 375 px (M4). |
| 5 | Imágenes vacías en Categorías a 1280 px | **Pasa (no es un bug)** | Es un artefacto de la captura (lazy y full-page). Al investigarlo apareció otro fallo real: el giro de las tarjetas no funciona en producción (M1). |
| 6 | Movimiento reducido, botón de pausa y consola | **Pasa** | Con `reduce` no hay canvas ni JS diferido y todo `main` es visible. La pausa congela el canvas, CSS, GSAP, Lenis y el video, y persiste al recargar. Sin errores de consola; solo un warning de Three.js (B1). |
| 7 | Enlaces | **Pasa** | 23 `<a>`, 0 `href` vacíos, 0 anclas rotas (18 anclas, todas a ids existentes), 0 enlaces a wa.me, tel:, Facebook, Maps o mailto, y 30 recursos locales sin errores HTTP. |
| 8 | Contenido | **Pasa** | Sin carrito, pagos, formularios ni promesas de envío. 48 de 48 productos con nombre y precio idénticos a `productos.json`. Los avisos de precios (3 apariciones) y de marcas (2) están visibles. |
| 9 | Peso y Web Vitals | **Falla** (LCP e INP) / **Pasa** (peso y CLS) | Ver la sección 4. |
| 10 | Metadatos | **Pasa** | El title tiene 58 caracteres y la description 154. OG y Twitter están presentes, el JSON-LD `PetStore` parsea y `robots.txt` responde 200. Faltan canonical y `og:image` porque no hay dominio, como ya documenta `docs/seo.md`. |

## 3. Hallazgos por severidad

No hay hallazgos críticos.

### Alto

**A1. LCP móvil por encima de 2,5 s y Performance de Lighthouse móvil por debajo de 90**
- Medido:
  - Lighthouse móvil: LCP de 4,1, 4,3 y 4,3 s y FCP de 3,4 a 3,6 s.
  - CDP con 4G y CPU x4 (3 corridas): LCP de 2,2, 5,8 y 4,0 s (mediana 4,0 s) y FCP de 2,0, 5,1 y 3,4 s.
  - El elemento LCP es siempre `div.entrada-insignia > button.canela-boton > img.balanceo` (la insignia de Canela), no el logo.
- Causas:
  1. **Google Fonts bloquea el render.** La hoja `fonts.googleapis.com/css2?...` (`src/layouts/Layout.astro`, `<link rel="stylesheet">` tras los preconnect) es de un tercero y obliga a abrir conexiones a dos orígenes. Lighthouse estima 1,9 s de ahorro en móvil. Además, las 4 familias pesan 164-174 KiB; solo Caveat Brush son 52 KiB, y se usa en una frase y en la pista.
  2. **La imagen LCP tiene la prioridad más baja.** `src/components/Hero.astro:107` tiene `fetchpriority="low"` en la insignia de Canela, mientras que el logo (línea 61) tiene `high`. Lighthouse da 0 en `lcp-discovery-insight` ("fetchpriority=high should be applied"). En Lighthouse, el 89 % del LCP es "render delay".
  3. En móvil, las 10 imágenes "lazy" de Categorías (unos 450 KiB) se descargan durante la carga inicial y compiten por el ancho de banda (ver B5).
- Reproducir: `npx lighthouse http://127.0.0.1:4321/` (preset móvil por defecto), o cargar la página con throttling "Slow 4G" y CPU x4 en DevTools.
- Propuesta:
  - Autoalojar las fuentes con `@fontsource` o la API de fuentes de Astro, con `font-display: swap` y `preload` solo de Nunito 400 y Baloo 2 800.
  - Reducir pesos y variantes, o sustituir Caveat Brush por un SVG o un subconjunto de caracteres.
  - Cambiar la insignia a `fetchpriority="high"` (y dejar el logo en `auto`) o añadir `<link rel="preload" as="image" imagesrcset=... imagesizes=...>` para la insignia.
  - Volver a medir: el objetivo es Perf ≥ 90 y LCP < 2,5 s.

**A2. Interacción lenta en los filtros del catálogo (INP aproximado mayor de 200 ms)**
- Medido con Event Timing y clics reales (CPU x4):
  - Móvil 375 px: filtro de 544 a 1096 ms y Canela de 184 a 472 ms.
  - Escritorio 1280 px: filtro con mediana de 428 ms y picos de 1888 ms.
  - Escritorio sin throttling de CPU: entre 56 y 128 ms.
- Diagnóstico (A/B en escritorio): mediana de **428 ms con GSAP**, 120 ms anulando el `ScrollTrigger.refresh()` del rAF y 76 ms sin GSAP (reduced motion). El refresh síncrono antes del pintado domina en escritorio:
  - `src/lib/animacion/scroll.ts:367-370`: `requestAnimationFrame(() => { ScrollTrigger.refresh(); lenis?.resize(); })`.
- En móvil, el clic en "Todos" cuesta de 0,9 a 1,2 s incluso sin GSAP. La traza muestra unos 360 ms de hilo principal: un Layout completo de 104 ms (699 objetos sucios de 1607) más 89 ms de UpdateLayoutTree. El DOM tiene 1161 elementos (Lighthouse `dom-size`). Event Timing en headless incluye también la presentación del fotograma, así que esas cifras son pesimistas, pero el trabajo de render supera los 200 ms de todas formas.
- Reproducir: 375 px, CPU x4, filtrar "Perros" y después "Todos" en `#catalogo`.
- Propuesta:
  - Diferir el refresh fuera del fotograma de la interacción: `setTimeout(() => ScrollTrigger.refresh(), 0)` tras el pintado o `requestIdleCallback`, o usar solo `ScrollTrigger.refresh(true)` con debounce.
  - Añadir `content-visibility: auto; contain-intrinsic-size: auto 600px;` a `[data-grupo]` en `src/components/Catalogo.astro` para que mostrar los 10 grupos no relayoutee todo.
  - Volver a medir el INP con CPU x4.

### Medio

**M1. El giro de las tarjetas de Categorías no se ejecuta nunca en producción**
- El CSS compilado (`dist/_astro/index.*.css`) contiene `.tarjeta-categoria{animation:linear both girar-costal view();animation-range:entry cover 35%}`. El minificador fusionó `animation-timeline: view()` dentro del shorthand `animation`, que no lo admite:
  - `CSS.supports('animation','linear both girar-costal view()')` devuelve **false**.
  - Chromium descarta la declaración: `animation-name` computado es `none` y la regla parseada solo conserva `animation-range`.
  - El respaldo con GSAP (`scroll.ts`, `sinTimeline`) tampoco corre, porque `CSS.supports('animation-timeline: view()')` es true. Resultado: ningún navegador anima las tarjetas.
  - En `astro dev`, sin minificar, sí funciona, de modo que el fallo solo se ve en el build.
- Archivo: `src/styles/global.css:431-437`, selector `.tarjeta-categoria`.
- Propuesta: escribir solo propiedades longhand (`animation-name`, `animation-timing-function`, `animation-fill-mode`, `animation-timeline`, `animation-range`) y comprobar en `dist/` que no se fusionen. Si el minificador las sigue fusionando, mover `animation-timeline` a una regla aparte o desactivar esa optimización. Conviene añadir una comprobación (grep en `dist/` o `CSS.supports`) al QA del build.

**M2. Estructura de lista de definiciones inválida en Ubicación (axe: serious, WCAG 1.3.1)**
- Reglas: `definition-list` en `section#ubicacion dl.mt-8.space-y-5` y `dlitem` en 6 nodos (`dt` "Dirección", "Ciudad", "Horario de atención" y sus `dd`).
- Causa: `<dl>` > `<div class="flex gap-4">` > icono + `<div>` > `<dt>`/`<dd>`. Solo se admite un nivel de `<div>` que contenga directamente `dt`/`dd`.
- Archivo: `src/components/Ubicacion.astro:28-42`.
- Propuesta: hacer que el `div.flex` de cada fila contenga directamente `dt` y `dd` (con el icono dentro del `dt` y `aria-hidden`) o sustituir la `<dl>` por una `<ul>`. Esto solo arregla 2 de las 3 auditorías de Lighthouse que dejan Accessibility en 93; M3 es la tercera.

**M3. Nombre accesible del logo del header distinto del texto visible (axe: serious, WCAG 2.5.3)**
- Selector: `header a[href="#inicio"].pr-2`, con `aria-label="Comercial Hinojosa, ir al inicio"`.
- Causa: el texto visible se serializa sin espacio (`<span class="block">Comercial</span>Hinojosa` da "ComercialHinojosa"), así que no aparece dentro del nombre accesible.
- Archivo: `src/components/Header.astro:9-23`.
- Propuesta: quitar el `aria-label` y el `aria-hidden` del texto, dejar el texto visible y añadir `<span class="sr-only">, ir al inicio</span>`. También se puede poner un espacio real entre "Comercial" y "Hinojosa".

**M4. El texto de "Nuestra esencia" se desborda en móviles estrechos**
- Medido:
  - 320 px: "Naturales" termina en x=169 con su `li` en 152, y queda tapado por la insignia de "Confiables". "Confiables" y "Sostenibles" sobresalen del panel (303 y 310 frente a un `li` de 280).
  - 360 px: "Confiables" y "Sostenibles" se siguen saliendo.
  - 375 px: "Sostenibles" se sale 4 px.
  - Ver captura `pilares-320.png`.
- Selector: `#valores ul.grid.grid-cols-2 li > span.font-bold`.
- Archivo: `src/components/Valores.astro:39-46`.
- Propuesta: añadir `min-w-0` al `li` y `break-words`/`hyphens-auto` al `span`, o usar `grid-cols-1 min-[400px]:grid-cols-2`, o una insignia más pequeña por debajo de 400 px.

### Bajo

**B1. Warning de consola en cada carga con 3D** (≥ 768 px). `THREE.Material: parameter 'side' has value of undefined.` aparece dos veces por carga. Archivo: `src/lib/animacion/hero-3d.ts:169` (`side: dobleCara ? DoubleSide : undefined`). Propuesta: no pasar la clave cuando no hace falta o usar `FrontSide`.

**B2. "Saltar al contenido" pierde el padding al recibir el foco.** La caja medida es de 158 × 29 px y se superpone al logo del header: `focus:not-sr-only` restablece `padding: 0` y anula `px-5 py-3`. Funciona (Enter lleva el foco a `main#contenido`) y se ve, pero queda apretado. Archivo: `src/layouts/Layout.astro:93`. Propuesta: `focus:px-5 focus:py-3` o un estilo propio en lugar de `not-sr-only`.

**B3. El botón flotante de WhatsApp tapa contenido a 375 px.** En el primer pantallazo cubre "confirmar" del botón "WhatsApp por confirmar" del hero (captura `axe-375-menu-abierto.png`) y, mientras se desplaza la página, parte de las tarjetas de producto. El foco nunca quedó tapado (verificado en las 31 y 37 paradas de Tab). Archivo: `src/components/WhatsappFlotante.astro:28`. Propuesta: en la versión "por confirmar", usar solo el icono por debajo de 640 px u ocultarlo mientras el hero está visible.

**B4. El video de Canela se descarga en móvil y con ahorro de datos.** Al entrar en `#canela` se reproduce `canela.webm`, que suma entre 745 y 873 KiB en la sesión. No se comprueba `navigator.connection.saveData` ni la gama baja. Archivo: `src/components/Canela.astro:56-70`. Propuesta: con `saveData` o `gamaBaja()` quedarse con el poster.

**B5. Las imágenes de Categorías pesan más de lo necesario en móvil.**
- Con DPR 2, `sizes="... 72vw"` (unos 270 px de CSS, es decir, 540 px de dispositivo) elige la versión nativa de 627-661 px en lugar de la de 480. Lighthouse estima un ahorro de 206 KiB.
- Además, se descargan sin desplazarse: están a 3296 px del pliegue en móvil, pero dentro del margen de carga diferida de Chromium.
- Cerdos, Vacas y Cuyes usan la misma imagen.
- Archivo: `src/components/Categorias.astro:33-45`.
- Propuesta: añadir una variante de unos 360 px o ajustar `sizes`, valorar `fetchpriority="low"` en esas imágenes y pedir una imagen distinta por categoría al equipo de contenido.

**B6. `target-size` (axe, WCAG 2.5.8) a 1280 px con el catálogo filtrado.** Los chips `button[data-filtro="tilapia"]` y `[data-filtro="semillas"]` quedan parcialmente tapados por el header fijo en esa posición de scroll concreta. Es un caso contextual: en las demás posiciones miden 44 px de alto. Propuesta: nada obligatorio. Se puede añadir `scroll-margin-top` a `[data-filtros]`.

### Punto 5: causa exacta de las imágenes vacías en Categorías

- **Estado real:** las 10 imágenes de `#categorias .tarjeta-categoria img` cargan (`complete` = true, con `naturalWidth`), tienen `opacity` 1 y `visibility` visible, y se ven en el viewport a 1280 px (captura `cat-1280-viewport-*.png`). El `<ul>` usa `overflow-visible` en `lg`, así que no hay recorte.
- **Reproducido como artefacto:** se reproduce si las imágenes `loading="lazy"` no han llegado cuando se toma la captura `full_page`. En la prueba, retrasé 1,5 s las peticiones `/img/productos/*` y capturé sin desplazarme. El recuadro "vacío" es el fondo `bg-crema-oscuro` del propio `<img>` (`Categorias.astro:38-46`). Ver `cat-1280-a-lazy-recorte.png`.
- **Segunda vía:** con el CSS de `astro dev`, donde el giro 3D sí se aplica, la captura de página completa de Chromium deja sin pintar algunas imágenes con `transform` 3D fuera del viewport (`cat-1280-b-dev-fullpage-recorte.png`). En el viewport real se ven bien.
- **Mismo efecto en otros elementos:** el título "¿Qué vendemos?" y otros bloques salen vacíos en capturas sin desplazamiento porque GSAP los deja en `opacity: 0` hasta que entran en pantalla (`[data-revelar-hijos] > *`). Es el comportamiento esperado. La frase manuscrita del hero también desaparece en algunas capturas de página completa, pero en el viewport se ve; también es un artefacto de la captura.
- **Conclusión:** no hay ninguna imagen ausente ni oculta para el usuario. El fallo real asociado a esta sección es M1.

## 4. Métricas

### Lighthouse (12.8.2)

| Corrida | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Peso total |
|---|---|---|---|---|---|---|---|---|---|
| Móvil 1 | 78 | 93 | 100 | 100 | 3,4 s | 4,1 s | 120 ms | 0,013 | 697 KiB |
| Móvil 2 | 77 | 93 | 100 | 100 | 3,6 s | 4,3 s | 0 ms | 0,013 | |
| Móvil 3 | 78 | 93 | 100 | 100 | 3,5 s | 4,3 s | 49 ms | 0,013 | |
| Escritorio 1 | 97 | 93 | 100 | 100 | 1,0 s | 1,0 s | 0 ms | 0,001 | 833 KiB |
| Escritorio 2 | 96 | 93 | 100 | 100 | 1,1 s | 1,1 s | 25 ms | 0,001 | |
| Escritorio 3 | 88 | 93 | 100 | 100 | 1,1 s | 1,1 s | 224 ms | 0,001 | |

Oportunidades principales en móvil:
- `render-blocking` de Google Fonts y del CSS: unos 1880 ms.
- `image-delivery`: 359 KiB.
- `uses-responsive-images`: 206 KiB (`logo.webp` 929w en móvil e imágenes de categorías).
- `lcp-discovery`: falta `fetchpriority=high` en la imagen LCP.
- `unused-javascript`: 20 KiB de `scroll.js`.
- `dom-size`: 1161 elementos.
- `mainthread-work`: 3,7 s, de los que 1,39 s son estilo y layout y 1,1 s corresponden a `scroll.js` (reflows forzados por GSAP de unos 18 ms cada uno).

En escritorio, además, aparecen 81 KiB de JS sin usar (`hero-3d` 61 y `scroll` 20) y `valid-source-maps` (informativo).

### Peso transferido (CDP, caché desactivada, gzip)

| Recurso | Móvil 375 px (DPR 2) | Escritorio 1280 px |
|---|---|---|
| HTML | 16,9 KiB | 16,9 KiB |
| CSS propio | 10,1 KiB | 10,1 KiB |
| CSS Google Fonts | 1,5 KiB | 1,5 KiB |
| JS inicial (`Layout…js`) | 1,9 KiB | 1,9 KiB |
| JS diferido (idle) | 45,3 KiB (`scroll` con GSAP y Lenis) | 188,9 KiB (`hero-3d` con Three.js 137, `scroll` 45, `lenis` 6, `puntero` 1) |
| Imágenes | 504,6 KiB (10 peticiones) | 452,6 KiB (12 peticiones) |
| Fuentes (Google) | 174,1 KiB (4 woff2) | 174,1 KiB |
| Video | 0 | 0 |
| **Total de la carga inicial** | **754 KiB** | **846 KiB** |
| Después de recorrer la página | +31 a 840 KiB (video `canela.webm` de 745 a 818 KiB más `canela-pulgar.webp` de 22 KiB) | +895 KiB (video de 873 KiB más 22 KiB) |

Presupuesto del plan (página inicial < 2 MB sin 3D): **cumple**. Incluso sumando el 3D y el video tras recorrer toda la página, el total queda por debajo de 1,8 MB.

### Web Vitals (CDP, 4G y CPU x4)

| Escenario | FCP | LCP | CLS | INP aprox. (máx. por interacción) |
|---|---|---|---|---|
| Móvil 375, corrida 1 | 1956 ms | 2216 ms | 0,0013 | 1096 ms ("Todos"), 936 ms ("Perros"), 416 ms (Canela) |
| Móvil 375, corrida 2 | 5108 ms | 5816 ms | 0,0000 | 960 / 912 / 360 ms |
| Móvil 375, corrida 3 | 3352 ms | 4032 ms | 0,0013 | 928 / 768 / 264 ms |
| **Mediana móvil** | **3352 ms** | **4032 ms (falla < 2,5 s)** | **0,0013 (cumple)** | **≈ 960 ms (falla ≤ 200 ms)** |
| Escritorio 1280, corrida 1 | 1704 ms | 3476 ms | 0,035 | 1160 / 832 / 472 ms |
| Escritorio 1280, corrida 2 | 2360 ms | 2636 ms | 0,009 | 920 / 800 / 552 ms |
| Escritorio 1280, 4G sin throttling de CPU | 1136 ms | 1376 ms | 0,0006 | 64 / 56 / 128 ms |

El INP es aproximado: Event Timing en Chromium headless con CPU x4 incluye la presentación del fotograma. El trabajo del hilo principal medido en la traza para "Todos" es de unos 360 ms. En todos los casos, el elemento LCP es la insignia de Canela.

## 5. Pruebas ejecutadas

- Lighthouse CLI: 3 corridas en móvil y 3 en escritorio.
- axe-core 4.14 (WCAG 2.0/2.1/2.2 A y AA, más best-practice) en estos escenarios: 375 px página completa, 375 px con el menú abierto, 375 px con el catálogo filtrado, 1280 px página completa y 1280 px con el catálogo filtrado. En todos se recorrió antes la página para que GSAP revelara el contenido.
- Contraste medido en píxeles para los 19 tipos de nodo que axe dejó "por revisar" (degradados, imágenes, pseudo-elementos): todos cumplen. Los tres valores bajos son artefactos de la medición (borde punteado del chip "Por confirmar", subrayado decorativo de la frase y esquinas del chip girado de Canela).
- Teclado a 1280 y 375 px: recorrido completo con Tab y comprobación de `outline`/`:focus-visible`, de si el elemento está en vista y de si algo lo tapa (`elementFromPoint`). También "Saltar al contenido", el menú móvil (Enter, Espacio, Escape, Tab para salir y Enter en un enlace), los filtros (Enter y Espacio), "Ver productos" de una categoría y Canela (Enter, Espacio y Escape).
- Responsive a 320, 375, 768, 1024, 1280 y 1920 px: medición de `scrollWidth`, búsqueda de elementos desbordados y capturas del pliegue y de página completa, cortada en trozos. Revisé a ojo los trozos de 320 px (hero, Quiénes somos, Canela, Categorías, Catálogo, Valores, Por qué elegirnos, Ubicación, Contacto y footer), 768 px (hero hasta catálogo), 1024 px (hero y catálogo), 1280 px (hero y categorías) y 1920 px (hero hasta catálogo), además del menú a 375 px.
- Investigación de Categorías: estado del DOM, CSS compilado, `CSS.supports`, capturas con red lenta e imágenes retrasadas, y CSS de dev inyectado.
- Movimiento: `reduced_motion="reduce"` a 375 y 1280 px (canvas, scripts descargados y opacidad efectiva de todo el texto e imágenes de `main`); pausa (animaciones, huella del canvas a lo largo de 1,5 s, video, `localStorage`, recarga y reanudación); 375 px sin 3D. Consola recogida en todos los scripts (errores, warnings, `pageerror`, peticiones fallidas y HTTP ≥ 400).
- Enlaces, contenido, precios contra `productos.json`, avisos, metadatos, JSON-LD, encabezados, `alt` y dimensiones de imágenes, y `robots.txt`.
- Peso y Web Vitals con CDP (3 corridas en móvil y 3 en escritorio), A/B del INP con y sin GSAP y traza de rendimiento del filtro.

## 6. Lo que no se pudo ejecutar

- **Dispositivos reales y red 4G real:** todo es emulación (CDP y Lighthouse simulado). El margen de carga diferida de Chromium en un teléfono real puede ser distinto, lo que afecta a B5.
- **Firefox y Safari (WebKit):** solo estaba disponible Chromium de Playwright; no se instalaron otros navegadores. El fallo M1 debería verse también en Safari, que soporta `animation-timeline`, pero no lo verifiqué.
- **Lector de pantalla (NVDA o VoiceOver):** no se probaron los anuncios reales del globo de Canela (`role="status"`) ni del conteo del catálogo (`aria-live`). Solo comprobé que el texto cambia en el DOM.
- **INP de campo:** el INP real necesita datos de usuarios (CrUX o RUM). Aquí solo hay una aproximación en laboratorio.
- **Validadores en línea** (Rich Results Test, validator.schema.org, depurador de Facebook): requieren una URL pública y todavía no hay dominio. El JSON-LD se validó solo como JSON.
- **Validación HTML del W3C:** no se ejecutó.
- **Lighthouse CI:** no está configurado en el proyecto. Las corridas se hicieron con la CLI.
- **Revisión visual de cada trozo en los 6 anchos:** revisé la selección indicada en la sección 5. Las capturas de página completa de Chromium no son fiables para elementos con `opacity` animada, imágenes lazy o transformaciones 3D, así que las dudas se confirmaron con capturas del viewport.

---

## Revalidación tras las correcciones (2026-10-12)

Ejecutada de verdad sobre `dist/` (servidor local con gzip, Chromium de Playwright, Lighthouse 12.8.2), con los scripts del QA original.

### Lighthouse (3 corridas por perfil)

| Perfil | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Móvil, antes | 77-78 | 93 | 100 | 100 | 4,1-4,3 s | — | — |
| Móvil, ahora | 88-91 | **100** | 100 | 100 | 3,2-3,6 s | 50-70 ms | 0,012 |
| Escritorio, antes | 88-97 | 93 | 100 | 100 | 1,0-1,1 s | — | — |
| Escritorio, ahora | 97-100 | **100** | 100 | 100 | 0,6-0,9 s | 0-130 ms | 0,001 |

### Otras verificaciones

| Verificación | Resultado |
|---|---|
| axe-core (375 y 1280; menú abierto; catálogo filtrado) | 0 violaciones, salvo `target-size` en 2 chips a 1280 px tras recorrer la página (ver B6) |
| Teclado (375 y 1280) | Pasa: 0 controles tapados; menú, Escape, filtros, Canela y "Saltar al contenido" funcionan |
| Responsive (320-1920 px) | Pasa: sin scroll horizontal en ningún ancho |
| "Nuestra esencia" a 320/360/375/414 px (M4) | Pasa: sin desbordes |
| Movimiento (normal, pausa, recarga en pausa, reduced motion) | Pasa: 0 elementos ocultos en `main` tras recorrer; sin errores de consola |
| INP del filtro del catálogo (CPU x4, 12 clics) | Mediana 124 ms a 1280 px (antes 352-428) y 56 ms a 375 px (antes 208) |

### Estado de los hallazgos

| Hallazgo | Estado | Corrección |
|---|---|---|
| A1 LCP móvil | Mejorado, sin llegar al objetivo | Fuentes autoalojadas con `@fontsource`; `fetchpriority="high"` en la insignia de Canela (elemento LCP); imágenes de Categorías con `fetchpriority="low"`; CSS incrustado en el HTML (`build.inlineStylesheets: 'always'`) |
| A2 INP del filtro | Corregido | `refrescarDiferido()` fuera del fotograma; `content-visibility: auto` en `[data-grupo]` |
| M1 giro de categorías | Corregido | Propiedades `animation-*` sueltas; respaldo GSAP según el estilo calculado |
| M2 `dl` de Ubicación | Corregido | |
| M3 nombre accesible del logo | Corregido | |
| M4 desborde de "Nuestra esencia" | Corregido | Container query |
| B1 warning de Three.js | Corregido | |
| B2 "Saltar al contenido" | Corregido | |
| B3 botón flotante en móvil | Corregido | Solo icono por debajo de 640 px |
| B4 video de Canela en móvil | Corregido | El `<video>` solo se crea en ≥ 768 px, sin ahorro de datos ni gama baja |
| B5 `sizes` de Categorías | Corregido | |
| B6 `target-size` | Mitigado | `scroll-margin-top` en los controles enfocables de `main`, para que el foco de teclado no quede bajo el header (WCAG 2.4.11). Lo que axe marca sigue apareciendo en una posición de scroll arbitraria donde el header fijo cubre lo que pasa por debajo; se considera falso positivo contextual |

### Fallo nuevo encontrado y corregido en la revalidación

- **Contenido invisible al final de la página en móvil.** Tras recorrer la página a 375 px, 9 elementos de Ubicación y Contacto (incluido el título "Hablemos") quedaban con opacity 0. Causa: `content-visibility: auto` (corrección de A2) cambia el alto real del catálogo durante el scroll, y ScrollTrigger conservaba posiciones antiguas, así que las apariciones de debajo no se disparaban. Corrección: un `ResizeObserver` sobre `main` en `src/lib/animacion/scroll.ts` que llama a `refrescarDiferido()` cuando cambia el alto. Verificado dos veces: 0 elementos ocultos.

### Pendiente de rendimiento

- **LCP móvil en 3,2-3,6 s con el perfil "4G lenta" de Lighthouse** (1,6 Mbps, 150 ms de RTT y 562 ms de latencia por petición), frente al objetivo de 2,5 s. La imagen LCP se descubre pronto, con prioridad alta y sin lazy. El 85 % del tiempo es retraso de render, porque comparte ancho de banda con 6 fuentes (unos 156 KiB, prioridad máxima) y el logo de 929 px (58 KiB, elegido por la densidad 2,6 del móvil emulado). Con 4G normal (9 Mbps), el QA original medía 1,1-1,5 s.
- **Opciones si se quiere llegar a más de 90 de forma estable:**
  - Reducir pesos de fuentes (decisión de dirección de arte).
  - Cargar Caveat Brush (66 KiB) después del primer pintado.
  - Añadir un logo intermedio de unos 800 px con más compresión.
  - Probado y descartado: el subconjunto de Caveat Brush solo baja de 66 a 56 KB.
- **No verificado:** dispositivos reales, Firefox, Safari, lectores de pantalla y Lighthouse sobre el hosting real.
