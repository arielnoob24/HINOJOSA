# Informe de QA, accesibilidad y rendimiento: Comercial Hinojosa

Fase 5 de `PLAN.md` (secciones 3, 4, 6 "Reglas de rendimiento", 8 y 12), con las 12 pruebas del router de la skill `vistas-hinojosa` como referencia.
**Fecha:** 2026-10-13. **Sustituye** al informe del 2026-10-11, que auditaba el sitio de scroll anterior.
**Actualizado** el mismo día tras aplicar las mejoras M1-M8 (sección 2 bis). Las tablas de las secciones 1 a 8 conservan las cifras de la auditoría original salvo donde se indica "Tras las mejoras".

**Build auditado:** `npm run build` propio. El `dist/` se sirvió en `localhost:4341` con un servidor estático de Node con gzip y `Range`, equivalente a GitHub Pages. No se usó la preview de `:4330`: Astro solo permite una preview por proyecto y esa no era mía, así que quedó intacta. Al terminar cerré mi servidor.

**Herramientas:**
- Playwright 1.x (Python 3.13) con Chromium headless.
- axe-core 4.14.0 (`npm i -D axe-core`), inyectado desde `node_modules`.
- Lighthouse 12.8.2 (`npx lighthouse@12`) con Chrome 151 (`CHROME_PATH`).
- CDP para la limitación real: 4G lenta (150 ms RTT, 1,6 Mbps de bajada y 750 kbps de subida, CPU ×4) y 4G rápida (60 ms RTT, 9 Mbps de bajada, CPU ×2).
- `@astrojs/check` + TypeScript.

Los scripts y las capturas están fuera del proyecto, en el scratchpad de la sesión: `qa_router.py`, `qa_axe.py`, `qa_rend.py`, `solapes.py`, `respaldo.py`, `raf.py`, `manual.py`, `servidor.mjs`, `lh/*.json` y `capturas/`.

---

## 1. Resumen

| Apartado | Resultado |
|---|---|
| Build + `astro check` | Build limpio. `astro check`: había **1 error de tipos real** (corregido), ahora 0 errores, 0 avisos y 0 sugerencias en 29 archivos |
| SEO (HTML servido) | JSON-LD válido: `@graph` con 1 `PetStore`, 4 categorías y **37 ofertas**, sin address/telephone/openingHours/geo/sameAs. Las 5 vistas, 5 títulos y 37 filas de producto están en el HTML. Hay 1 `<h1>` y no se genera `sitemap.xml` |
| Router (12 pruebas × 4 tamaños) | **38/41 comprobaciones pasan**. Los 3 fallos no son de router: son 2 hallazgos de diseño (mejoras M1 y M2), analizados abajo. Las pruebas bloqueantes 1-7, 10, 11 y 12 pasan en todos los tamaños |
| axe-core (5 vistas × 2 tamaños) | **0 violaciones** en las 10 combinaciones. Los "incompletos" se verificaron a mano y todos cumplen |
| Lighthouse Inicio | Móvil **95 / 100 / 100 / 100**; escritorio **100 / 100 / 100 / 100** (Rendimiento / Accesibilidad / Buenas prácticas / SEO) |
| Lighthouse `#productos` | Móvil **83** / 100 / 100 / 100 (por debajo de 90, ver M5); escritorio **99** / 100 / 100 / 100 |
| Presupuestos | Inicio: **225 kB** transferidos (presupuesto 1,5 MB). LCP real en 4G lenta + CPU ×4: **1,13-1,14 s**. LCP simulado de Lighthouse en móvil: **2,56 s**, apenas por encima de 2,5 s (M3). CLS ≤ 0,004 en Inicio. Interacciones de 16 a 24 ms |
| Bloqueantes para publicar | **2**, los dos de datos y configuración, no de código: contacto sin confirmar y sin dominio (`site`) |
| **Tras las mejoras (sección 2 bis)** | Router **41/41**; axe 0 violaciones; `prueba_animacion.py` **68/68**; Lighthouse móvil Inicio **99** (LCP 2,0-2,1 s) y `#productos` **93-97** (LCP 2,6-3,1 s); Inicio **141,7 kB** transferidos |

---

## 2 bis. Mejoras aplicadas (M1-M8)

Verificación: `npm run build` limpio y `npx astro check` con 0 errores, 0 avisos y 0 sugerencias en 31 archivos. Se repitieron `qa_router.py`, `qa_axe.py`, `qa_rend.py`, `prueba_animacion.py` (copiada con el puerto 4341), `respaldo.py`, `solapes.py` y `raf.py`, además de Lighthouse 12.8.2: 3 corridas por configuración en móvil y 1 en escritorio.

| # | Qué se hizo | Archivos | Antes | Después |
|---|---|---|---|---|
| M1 | Las pestañas de categoría pasan a ser una **rejilla 2×2**, con consulta de contenedor sobre `.prod-izq`, y a una **fila de 4** cuando la columna mide ≥ 34rem. Desaparece el scroll horizontal propio | `VistaProductos.astro` | "Granos (7)" fuera de pantalla en 360 y 390 px (prueba 9 FALLA) | Las 4 pestañas se ven enteras, con 44 px de alto, sin texto desbordado: a 360 px, x = 16-176 y 184-344; a 1366×650, fila de 4. Prueba 9 PASA |
| M2 | En `min-width: 48rem` y `max-height: 43.75rem`, la tarjeta de Visítanos se compacta: algo más ancha (`min(32rem, 46vw)`), datos y botones en 2 columnas, menos relleno. El margen inferior baja de 3rem a 1rem porque la atribución de Leaflet va a la derecha | `VistaVisitanos.astro` | Scroll interno de 555/458 px a 1366×650 (prueba 8 FALLA) | Sin scroll interno a 1366×650 (359/359), 1440×700, 1280×600, 1024×600 y 800×600. A partir de 700 px de alto se mantiene la tarjeta original. Prueba 8 PASA |
| M3 | Caveat Brush recortada con `pyftsubset` a los 54 caracteres de las 3 frases que la usan, en mayúsculas y minúsculas, más espacio y puntuación. Se usó solo `kern`, porque `liga`/`calt` triplicaban el peso. `@font-face` propio con `swap` en `global.css`. Se quita el import de `@fontsource/caveat-brush`. El comando para regenerarla está en el comentario de `global.css` | `src/assets/fonts/caveat-brush-acento.woff2` (nuevo), `global.css`, `Layout.astro`, `tokens.css` | 66,1 kB | **9,1 kB** |
| M4 | El póster del video de Nosotros pasa a `data-poster`. `video-vista.ts` lo asigna al entrar en la vista o justo antes (puntero, foco o toque sobre un enlace `#nosotros`). Sin JS se pinta como fondo CSS del contenedor (`html:not(.js)`) | `VistaNosotros.astro`, `src/lib/video-vista.ts` | 22,5 kB en la carga de Inicio | 0 kB en Inicio. Se pide al entrar en Nosotros. Con reduced motion: `poster` asignado y video en pausa. Sin JS: fondo visible |
| M5 | (a) El script inline del `<head>` precarga **solo si la vista inicial es `#productos`** la imagen del producto al frente (`-400.avif`, `fetchpriority=high`). (b) **Tarjeta provisional en el HTML**: un `<img>` sin `src` en el mismo hueco que el frente del anillo. Un script inline contiguo le pone `src` al entrar directo, así que en Inicio no se baja. Con `html[data-carrusel-pendiente]` se ve la provisional y se oculta la rejilla de respaldo, cuyas imágenes competían con `carrusel.js`. (c) Montado el anillo, la provisional sigue **debajo** de su frente, idéntica, hasta la primera interacción o 1,5 s. Si se ocultaba al montar, Chrome descartaba su candidato LCP. (d) En el primer montaje, las 8 imágenes laterales del anillo se piden cuando el frente ya está pintado. Si no hay 3D, la carga falla o tarda más de 5 s, se quita la marca y la rejilla vuelve como respaldo | `Layout.astro`, `VistaProductos.astro`, `carrusel-carga.ts`, `carrusel.ts` | Lighthouse móvil 83, LCP 4,6 s | **93 / 96 / 97**, LCP 3,1 / 2,8 / 2,6 s. Elemento LCP: la tarjeta provisional. Escritorio **100** (LCP 0,7 s) |
| M6 | Las miniaturas de la lista usan `<slug>-thumb-80.webp` del agente de activos, con `srcset="…-thumb-80.webp 2x, …-thumb.webp 4x"`. El hueco es de 40 px, así que la de 80 px ya es 2x | `srcset-producto.ts` (`miniaturaLista`), `VistaProductos.astro` | 33 miniaturas de 160 px: 250 KiB | 33 de 80 px: **93 KiB** (−63 %). La de 160 px solo con DPR > 2 |
| M7 | El isotipo de la barra usa `isotipo-96.webp` (98×96), con `srcset` 98w/263w y `sizes` 2.25/2.5rem. `isotipo.png`/`.webp` (los usa `seo.ts`) no se tocaron | `Barra.astro` | 11,4 kB | **5,4 kB** |
| M8 | Señal de "hay más abajo" en móvil: `span.vista-sombra` (`aria-hidden`, `pointer-events: none`) en `Vista.astro`, con un degradado de tinta translúcida sobre la barra inferior. `src/lib/indicador-scroll.ts` pone `[data-mas-abajo]` en la vista cuando a su cuerpo le quedan más de 8 px por debajo, y se desvanece al llegar al final. Con reduced motion el fundido es instantáneo. Es un elemento real y no `::after`: con un pseudo-elemento, axe daba por "no determinable" el contraste de todo el texto de la vista | `Vista.astro`, `global.css`, `src/lib/indicador-scroll.ts` (nuevo), `Layout.astro` | Sin señal | 360×640: aparece en Nosotros, Productos, Por qué y Visítanos y desaparece al final. 390×844: solo en Productos y Visítanos, que son las que no caben. Escritorio: nunca |
| Extra | **Storyboard-carrusel 6.4.** Con el anillo 3D, la lista se desplaza a la fila cuando **se asienta** el giro, no cuando empieza: se movió a los 484 ms de la tecla. **Rótulo:** al elegir desde la lista un producto de otra categoría que no queda al frente, el rótulo ya no se adelanta. Cambia a mitad del salto (921 ms), no al construir la categoría | `catalogo.ts` (exporta `mostrarEnLista`), `carrusel.ts` | — | Verificado con `extras_mejoras.py` |

**Bytes de Inicio** (perfil 4G rápida, caché desactivada): **224,6 kB → 141,7 kB** (−37 %). Lo que baja ahora: logo-480 36,7 kB, HTML 30,9 kB, Nunito 800 16,3 kB, Nunito 400 16,1 kB, Canela @2x 14,3 kB, Caveat 9,1 kB, isotipo-96 5,4 kB y scripts.

**Lighthouse 12.8.2 tras las mejoras** (Rendimiento / Accesibilidad / Buenas prácticas / SEO):

| Página | Antes | Después | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|
| Inicio, móvil (3 corridas) | 95, LCP 2,56 s | **99 / 99 / 99**, 100 / 100 / 100 | 1,39-1,39 s | **1,97-2,11 s** | 0 ms | 0,002-0,004 | 144 KiB |
| Inicio, escritorio | 100 | 100, 100 / 100 / 100 | 0,37 s | 0,47 s | 0 ms | 0,002 | 136 KiB |
| `#productos`, móvil (3 corridas) | 83, LCP 4,6 s | **93 / 96 / 97**, 100 / 100 / 100 | 1,30-1,72 s | **2,64-3,09 s** | 0-16 ms | 0,015-0,048 | 545 KiB |
| `#productos`, escritorio | 99 | **100**, 100 / 100 / 100 | 0,36 s | 0,69 s | 0 ms | 0,007 | 536 KiB |

**Medidas reales con CDP (`qa_rend.py`).** El equipo estaba cargado mientras se medía. El `benchmarkIndex` de Lighthouse bajó de ~2900-3100 (auditoría original) a ~1450-1750 al final, es decir, CPU unas 2 veces más lenta. La comparación justa es la primera corrida tras M1-M4:
- 4G lenta + CPU ×4: LCP **1120 / 1100 / 1100 ms** (antes 1144 / 1136 / 1132).
- 4G rápida: LCP 228-300 ms.
- Escritorio: LCP 72-80 ms.

En las corridas finales, con el equipo más lento, salen LCP 1,3-1,6 s en 4G lenta y un INP aproximado de 16-250 ms con CPU ×4 (16-88 ms en 4G rápida). Inicio no cambió de código entre unas y otras, así que **la subida es del equipo, no del sitio**. Hay que repetirlo con el equipo en reposo.

**Pruebas repetidas tras las mejoras:**
- Router **41/41**: las pruebas 8 y 9, que fallaban por M1 y M2, ahora pasan.
- axe: **0 violaciones en las 10 combinaciones**. Los incompletos de contraste del pie de Visítanos en 360 px pasan de 5 a 0. Quedan los de siempre: el degradado de Inicio, la tabla de tilapia y `scrollable-region-focusable`.
- Objetivos: 0 por debajo de 44 px.
- `prueba_animacion.py`: **68/68**.
- `respaldo.py`:
  - Sin 3D: rejilla con 9 celdas y `alt` descriptivo, flechas, pestañas, buscador y 37 filas.
  - Imágenes caídas: aviso con `role=status`.
- `solapes.py`: 0 problemas en 20 combinaciones.
- `raf.py`: 0 rAF/s fuera de Productos y sin autogiro.

**Coste conocido de M5.** A DPR ≥ 2 en escritorio, o a 3x en móvil, la provisional pide la variante de 400 px y el anillo después la de 800 px: son +18 kB solo al entrar por Productos.

---

## 2. Correcciones aplicadas en esta fase

| # | Archivo | Qué se corrigió | Criterio |
|---|---|---|---|
| C1 | `src/lib/animacion/carrusel.ts` | `gsap.core.Tween` no existe en los tipos de `gsap/gsap-core`, el único error de `astro check`. Pasa a `ReturnType<typeof gsap.to>` | Tipos |
| C2 | `package.json` | Se añaden como devDependencies `@astrojs/check`, `typescript`, `@types/node@22` (para el helper de build) y `axe-core` | Herramientas de QA |
| C3 | `src/lib/srcset-producto.ts` (nuevo), `VistaProductos.astro`, `catalogo.ts`, `carrusel.ts` | **`srcset`/`sizes` 400/800** en las `<picture>` del anillo y de la rejilla de respaldo, en WebP y AVIF. El ancho real se lee de la cabecera WebP en el build, y el descriptor es `max(ancho, 0,75 × alto)` porque la tarjeta es 3:4 con `object-fit: contain`. Se conservan `alt={altProducto(p)}` y los `aria-hidden` | Rendimiento (punto 6 del encargo) |
| C4 | `src/lib/srcset-producto.ts` | La rejilla usa el **mismo `sizes` que el anillo**. Se pinta un instante antes de que llegue `carrusel.ts`, y con un `sizes` distinto a @2x se bajaban dos variantes de cada producto (25 peticiones frente a 17) | Rendimiento |
| C5 | `VistaVisitanos.astro` | En móvil, **el pie (lema, ©, "Marcas registradas…") quedaba tapado por la tarjeta y no se veía ni desplazando**. Causa: `.vis-escena` con `flex-shrink: 1` + `min-height: 0`, y la tarjeta con z-index flotante. Se añade `flex-shrink: 0` por debajo de 48rem | 1.3.2 / contenido cortado (prueba 9) |
| C6 | `VistaInicio.astro` | `sizes` del logo en móvil: de `72vw` a `60vw`, que es su ancho real (0,74 × 80vw). Con DPR 1,75 se bajaba la variante de 929 px (58 kB) en lugar de la de 480 px (37 kB) | Rendimiento (−20 KiB en Inicio) |
| C7 | `VistaProductos.astro`, `srcset-producto.ts` | `width`/`height` reales en las miniaturas de la lista y de la vista sin JS, en lugar de 120×160 fijos. Sin JS la tarjeta usa `width: auto` y se deformaba. Lighthouse marcaba `image-aspect-ratio`; ahora Buenas prácticas en `#productos` pasa de 96 a 100 | Buenas prácticas |

Después de los cambios: `npm run build` limpio, `npx astro check` con 0 errores y la batería completa del router repetida, con el mismo resultado de 38/41.

---

## 3. SEO: verificación sobre `dist/index.html`

Script: `seo.mjs` (Node: extrae el `<script type="application/ld+json">` y lo pasa por `JSON.parse`).

| Comprobación | Resultado |
|---|---|
| Bloques ld+json | 1, y `JSON.parse` lo acepta |
| Estructura | `@context: https://schema.org`, `@graph` con **1 nodo `PetStore`** |
| Datos sin confirmar en el JSON-LD | `address`, `telephone`, `openingHours`, `openingHoursSpecification`, `geo`, `sameAs` y `PENDIENTE`: **ninguno presente** |
| Claves del PetStore | `name, slogan, description, disambiguatingDescription, currenciesAccepted, hasOfferCatalog` |
| `hasOfferCatalog` | `OfferCatalog` con **4 categorías**: Granja 9, Mascotas 16, Comederos y Bebederos 5, Granos y Semillas 7, que suman **37 ofertas** |
| `<h1>` en el HTML | **1** (logo de Inicio con `alt`) |
| Vistas en el HTML servido | `#inicio`, `#nosotros`, `#productos`, `#por-que` y `#visitanos`: las 5, con sus 5 títulos `data-titulo-vista` |
| Productos en el HTML servido | 37 `data-producto-fila` |
| `sitemap.xml` sin `site` | **No se genera**: `getStaticPaths` devuelve `[]` y `dist/` no tiene ningún `.xml`. `robots.txt` tiene la línea `Sitemap:` comentada |
| canonical / og:url / og:image | Ausentes, como corresponde mientras no haya `site` |
| Lighthouse SEO | 100 (Inicio y `#productos`, en móvil y escritorio) |

---

## 4. Router de vistas: las 12 pruebas de `vistas-hinojosa`

Script: `qa_router.py`. Tamaños: 1440×900, 1366×650, 360×640 (móvil, DPR 2, táctil) y 390×844 (móvil, DPR 2, táctil).

| # | Prueba | 1440×900 | 1366×650 | 360×640 | 390×844 | Detalle real |
|---|---|---|---|---|---|---|
| 1 | Solo teclado: Tab+Enter a las 5 vistas, y → / ← | PASA | PASA | PASA | PASA | Enter en cada enlace de la barra, alcanzado con Shift+Tab desde el título: 5/5. → ×4 recorre nosotros, productos, por-que y visitanos; ← ×4 vuelve hasta inicio |
| 2 | `inert`: Tab no alcanza otras vistas | PASA | PASA | PASA | PASA | 0 fugas recorriendo 45 a 90 Tabs por vista. Enfocables fuera de la vista activa sin `[inert]`: 0 en las 5 vistas |
| 3 | Foco al título de la vista nueva | PASA | PASA | PASA | PASA | Medido **80 ms después del clic**, antes de que acabe la transición: el foco está en el título en las 5 vistas |
| 4 | Flechas en el buscador; en el carrusel | PASA | PASA | PASA | PASA | Con "maiz" escrito, ← ← lleva el cursor de 4 a 2 y → a 3, y la vista sigue siendo productos (3 filas filtradas). En la flecha del carrusel, → gira el anillo (de "Camperito…" a "Nutri Pollos") sin cambiar de vista |
| 5 | Entrada por `#productos` + "atrás" | PASA | PASA | PASA | PASA | Al cargar `#productos` solo esa vista es visible. Clic en Visítanos y luego `go_back()` devuelve a productos |
| 6 | Sin JavaScript, 5 vistas apiladas | PASA (1366×650) | | | | Las 5 visibles, apiladas en orden, con un documento de 5085 px de alto |
| 7 | Foco no tapado (2.4.11) | PASA | PASA | PASA | PASA | Muestreo de 9 puntos con `elementFromPoint` en cada parada de Tab: 0 tapados. En 360 px las flechas del carrusel tienen 8/9 puntos libres; el 9.º es la esquina, fuera del círculo del botón (falso positivo) |
| 8 | `body` no desborda; scroll interno solo donde toca | PASA | **FALLA** | PASA | PASA | El documento no desborda en ningún tamaño. En 1366×650, la **tarjeta de Visítanos** tiene scroll interno propio (555/458 px), que no es la lista. Ver **M2** |
| 9 | Sin desborde horizontal ni contenido cortado | PASA | PASA | **FALLA** | **FALLA** | El cuerpo de la vista nunca desborda (`scrollWidth == clientWidth` en las 5). Fallo: la fila de **pestañas de categoría** se sale del ancho y es un carrusel horizontal propio; "Granos (7)" no se ve en 360 ni en 390. Ver **M1**. (Antes de C5, el pie de Visítanos estaba tapado en 360×640) |
| 10 | Las 5 vistas en el HTML de `dist/` | PASA | | | | HTML pedido por `request.get` (no el DOM ejecutado): 5 secciones, 5 títulos, 37 filas, gzip |
| 11 | `prefers-reduced-motion` | PASA (1440×900) | | | | Perrito: `animation-name: none` e inmóvil (1310,5 → 1310,5 px). Paralaje: 0 capas movidas tras mover el ratón. Cambio de vista: ni `data-entrando` ni `data-saliendo`, y solo productos visible a los 30 ms. Carrusel: `girando=false` y posición entera a los 30 ms del clic. Video de Nosotros: en pausa y sin autoplay |
| 12 | Pausa del perrito (y del video) | PASA | | PASA | | El perrito se movía (1345 → 1271 px en 400 ms). El botón se alcanza con Tab, mide 44×44 px y se llama "Pausar animación". Con Enter queda `aria-pressed=true`, el perrito no se mueve (1250,5 → 1250,5 en 1,5 s) y hay **0 animaciones activas**. El mismo control pausa el video de Nosotros; reanudar lo reproduce (1,49 s avanzados) y volver a pausar lo detiene |
| 0 | Errores de consola / JS | PASA | PASA | PASA | PASA | Ninguno |

**Pruebas complementarias del agente** (numeración del agente qa-rendimiento):

| # | Prueba | Resultado |
|---|---|---|
| 13 | Carrusel con teclado | PASA. Las flechas son `<button>` con nombre ("Producto anterior" / "Producto siguiente"). → / ← dentro del carrusel giran. Hay región `aria-live="polite"` (`[data-carrusel-anuncio]`) |
| 14 | Sin 3D (el WebGL del plan pasa a ser CSS 3D) | PASA. Con `CSS.supports('perspective')` forzado a `false`: queda `data-modo="rejilla"`, sin anillo, 9 celdas con `alt` descriptivo ("Nutri Pollos, de Nutritivos"). La flecha mueve `aria-current`, la pestaña 4 muestra Granos, el buscador "arena" filtra 3 productos y la lista conserva las 37 filas |
| 15 | Nada se anima fuera de Productos | PASA. Contador de `requestAnimationFrame`: Inicio en reposo 0/s y Productos en reposo 0/s. Al salir de Productos con un giro en marcha: 61 rAF en 0,5-1,5 s, 5 en 1,5-2,5 s y **0 desde los 2,5 s** (el ticker de GSAP se duerme solo). Sin autogiro: la posición no cambia en 5 s |
| — | Error de carga de imágenes (heurística 9) | PASA. Con `/img/productos/**` abortado aparece "No pudimos cargar las imágenes. La lista tiene todos los productos." con `role="status"` y el botón "Reintentar" |
| — | Solapamientos (texto tapado o inalcanzable) | PASA tras C5. Script `solapes.py`: cada `h1-h3, p, li, dt, dd, a, button, label, input, th, td` se lleva al centro y se hace hit-test. 0 problemas en las 20 combinaciones (5 vistas × 4 tamaños) |

---

## 5. Accesibilidad

### 5.1 axe-core 4.14.0 (WCAG 2.0/2.1/2.2 A+AA + best-practice), barra + vista activa

| Vista | 1440×900 | 360×640 |
|---|---|---|
| Inicio | 0 violaciones (23 reglas pasan). Incompleto: `color-contrast` ×2 (degradado) | 0 violaciones (23). Mismo incompleto |
| Quiénes somos | 0 violaciones (23) | 0 violaciones (24) |
| Productos | 0 violaciones (37). Incompleto: `color-contrast` ×4 (filas de la tabla de tilapia, bajo el borde de la lista) | 0 violaciones (37) |
| Por qué elegirnos | 0 violaciones (21) | 0 violaciones (21). Incompleto: `scrollable-region-focusable` |
| Visítanos | 0 violaciones (26) | 0 violaciones (26). Incompletos: `color-contrast` ×5 (pie, tapado antes de C5) y `scrollable-region-focusable` |

**Verificación manual de los incompletos** (`manual.py`):
- **Contraste sobre el degradado de Inicio.** Se calcula contra cada parada del degradado (`#1B4D2B` → `#10301B`, más la sombra inferior). Lema oro `#F2B823`: peor caso **5,44:1** (texto grande, mínimo 3:1; cumple incluso 4,5:1). Subtítulo crema `#F6F1E4`: peor caso **8,69:1**.
- **`scrollable-region-focusable`** (Por qué y Visítanos en 360 px). El título de la vista (`tabindex=-1`) recibe el foco al entrar, y con ↓ / Espacio la vista se desplaza hasta el final (Por qué 26/26 px, Visítanos 175/175 px). En 1366×650, la tarjeta de Visítanos se desplaza con ↓ desde el título (97/97 px). Cumple 2.1.1.
- Tabla de tilapia: el texto está recortado por el borde del panel con scroll y se ve completo al desplazar. Texto `#14301D` sobre blanco: 14,28:1.

### 5.2 Comprobaciones propias (`qa_axe.py`)

| Criterio | Resultado |
|---|---|
| 2.5.8 Tamaño del objetivo | **0 objetivos por debajo de 24 px y 0 por debajo de 44 px** en las 10 combinaciones (entre 6 y 50 objetivos por vista) |
| 2.4.7 Foco visible | 0 controles sin contorno ≥ 2 px o sombra al enfocarlos con `:focus-visible` |
| 4.1.2 Nombres accesibles duplicados | 0 duplicados entre controles visibles: carrusel, pestañas, 37 filas y barra |
| Dorado como texto | 3 usos, **todos sobre verde oscuro**: lema de Inicio sobre el degradado bosque (5,44-7,98), "familia" y "VISIÓN" sobre `#1B4D2B` (5,44). La tabla de `marca-hinojosa`, que es la referencia, permite expresamente `#F2B823` sobre `#1B4D2B`. **Ningún uso sobre claro.** El chip de precio es oro de fondo con texto `#14301D` (7,93) |
| 1.4.1 Uso del color | Vista activa en la barra: pastilla de fondo + peso 800 + `aria-current="page"`. Fila activa de la lista: barra izquierda de 4 px + peso 800. "Abierto / Cerrado" lleva palabra e icono, pero **no se puede probar en vivo** porque no hay horario confirmado y el elemento no se pinta |
| 3.3.2 Etiqueta del buscador | `<label for="buscar-producto">` visible ("Buscar producto"), no solo `placeholder` |
| Imágenes | Logo con `alt` "Comercial Hinojosa: Nutrición que da vida". Perrito: `aria-hidden="true"` en el contenedor y `alt=""`, sin descripción. Anillo: `aria-hidden="true"` y `alt=""` (el nombre está en el rótulo y en la lista). Rejilla: `alt={altProducto(p)}` descriptivo |
| 2.2.2 Pausar | Ver prueba 12. Con `reduced-motion` el botón de pausa de Inicio se oculta (`display: none`) porque nada se mueve. Durante el cruce el perrito nunca tapa el botón: 0/45 muestras a 1440 y a 360 |
| Enlaces de contacto (punto 22) | **0 `href` con `PENDIENTE`** y 0 enlaces externos, `tel:` o `wa.me` en el HTML: los botones sin dato son avisos no interactivos. **7 marcadores `PENDIENTE_CONFIRMAR` visibles** en Visítanos (ver B1) |

### 5.3 No ejecutado (y por qué)

- **Lector de pantalla real** (NVDA, VoiceOver, TalkBack): no hay uno disponible en este entorno headless. Se comprobó lo que se puede comprobar automáticamente: el foco va al título (que tiene texto), `aria-live` en el carrusel y en el resultado de búsqueda, y `aria-current`. Que el anuncio se oiga de verdad **queda pendiente de una prueba manual**.
- **Navegadores no Chromium** (Safari/iOS, Firefox): solo se usó Chromium, así que `inert`, `dvh`, el alfa del video y `min()` sin probar en WebKit quedan pendientes. Prioridad: Safari iOS, por el video con alfa y la barra inferior con `safe-area`.
- **Dispositivos reales y datos de campo** (CrUX): el sitio no está publicado.
- **Mapa Leaflet**: no se carga porque no hay coordenadas confirmadas, así que su teclado y su atribución no se pudieron probar. Hoy se muestra el aviso "El mapa aparecerá cuando confirmemos la ubicación exacta".

---

## 6. Rendimiento

### 6.1 Lighthouse 12.8.2 (3 corridas por configuración, resultados idénticos)

| Página | Rend. | Acces. | B. prácticas | SEO | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|
| Inicio, móvil (Moto G, 4G lenta simulada) | **95** | 100 | 100 | 100 | 2,0 s | **2,6 s** (2564 ms) | 0 ms | 0,004 | 227 KiB |
| Inicio, escritorio | **100** | 100 | 100 | 100 | 0,5 s | 0,6 s | 0 ms | 0,002 | 219 KiB |
| `#productos`, móvil | **83** | 100 | 100 | 100 | 1,7-1,8 s | **4,6 s** | 0 ms | 0,018-0,024 | 728 KiB |
| `#productos`, escritorio | 99 | 100 | 100 | 100 | 0,5 s | 1,0 s | 0 ms | 0,002 | 719 KiB |

- **LCP de Inicio en móvil.** El elemento LCP es el logo, que ya va con `fetchpriority="high"`. Lighthouse atribuye el 82 % al "render delay": el FCP simulado (1,96 s) se alarga por las fuentes de prioridad alta que salen antes del primer pintado, sobre todo **Caveat Brush (66 kB) para una sola frase**. El FCP y el LCP observados sin limitar son de 226 ms. Ver M3.
- **`#productos` como página de entrada.** La imagen LCP la crea `carrusel.ts`, que se carga de forma diferida, así que no es descubrible en el HTML. Ver M5. Entrar por Inicio y navegar a Productos (el caso normal) no tiene este coste en la carga.

### 6.2 Medido con limitación real por CDP (`qa_rend.py`, 3 corridas)

| Perfil | LCP | FCP | CLS |
|---|---|---|---|
| 4G lenta + CPU ×4, 412×823 @1,75 | **1144 / 1136 / 1132 ms** | 316 / 312 / 304 ms | 0,0038 |
| 4G rápida (9 Mbps) + CPU ×2 | 312 / 248 / 248 ms | 144 / 112 / 116 ms | 0 |
| Escritorio sin limitar | 64 / 68 / 64 ms | 64-68 ms | 0,0025 |

**INP aproximado** (Event Timing, duración máxima por interacción): clic en la barra (×4) 16 ms; flecha del carrusel 24 ms; pestaña de categoría 16-24 ms; teclear en el buscador 16-24 ms; fila de la lista 24 ms; pausa del perrito 16 ms. Todo muy por debajo de 200 ms, también con CPU ×4.

### 6.3 Bytes por vista (transferidos, perfil 4G rápida, caché desactivada)

| Vista | Bytes | Qué baja |
|---|---|---|
| **Inicio** (carga inicial) | **224,6 kB** (presupuesto 1,5 MB) | Caveat Brush 66,1; logo-480 36,7; HTML 29,2; **póster del video de Nosotros 22,5** (M4); Nunito 800 16,3; Nunito 400 16,1; Canela @2x 14,3; isotipo 11,4 |
| Quiénes somos | 608 kB | `canela-jugando.webm` (622 kB), solo al entrar |
| Productos | 566 kB | `carrusel.js` 22,9 kB (con GSAP core), Cormorant 22,5 kB, 9 imágenes del anillo y 33 miniaturas de la lista. Con la caché desactivada la máscara del oscurecido vuelve a pedir la misma imagen; con caché normal sale de memoria |
| Por qué / Visítanos | 0 kB | Leaflet no se carga porque no hay coordenadas confirmadas |

**Carga diferida (punto 25):** en la carga de Inicio **no** se pide `carrusel.*.js`, ni `leaflet*`, ni ninguna imagen de producto. Lottie no existe (se sustituyó por CSS).

**`srcset` del anillo (C3/C4)**, imágenes de producto bajadas al entrar en Productos (categoría Granja):

| Contexto | Antes (según el encargo) | Ahora |
|---|---|---|
| 360×640 @2x (tarjeta de 116 px) | variantes de 800 px | **17 peticiones, todas de 400 px, 262 kB** |
| 1440×900 @1x (tarjeta de 180 px) | variantes de 800 px | 17, todas de 400 px, 262 kB |
| 1440×900 @2x / 390×844 @3x | variantes de 800 px | 16 de 800 px + 1 de 400 px (sal en grano, imagen ancha), 668 kB. Es la densidad que hace falta: 240 px × 2 = 480 px de alto |

---

## 7. Revisión heurística (Nielsen)

Capturas en `capturas/nq-1440-*.png` y `capturas/nq-360-*.png`, con `reduced-motion` para que sean estables.

| Heurística | Valoración | Observación |
|---|---|---|
| 1. Visibilidad del estado: ¿siempre sé en qué vista estoy? | Bien | Pastilla bosque en la barra superior (escritorio) y en la inferior con icono + palabra (móvil). `document.title` cambia por vista. En Productos, la categoría, la posición "1 de 9", el precio y la fila activa están siempre a la vista. **Pero** en móvil "Granos" no se ve en las pestañas (M1) y en Quiénes somos (360×640) la fila de los 6 valores queda bajo el pliegue sin indicio de que hay más (M8) |
| 3. Control y libertad: ¿puedo volver atrás y salir de todo? | Bien | "Atrás" funciona (prueba 5) y cada vista tiene su hash. No hay modales ni paneles que atrapen el foco. El buscador tiene botón "Borrar búsqueda" y el estado vacío ofrece borrarla |
| 6. Reconocer antes que recordar: ¿se entienden las 5 etiquetas a la primera? | Bien | Escritorio ≥ 64rem: "Inicio · Quiénes somos · Productos · Por qué elegirnos · Visítanos". Móvil: "Inicio · Nosotros · Productos · Por qué · Visítanos", con icono. "Por qué" a secas es la más ambigua, aunque el icono de medalla ayuda; aceptable |
| 9. Errores: ¿qué veo si falla el mapa o el 3D? | Bien | Sin 3D: rejilla funcional (prueba 14). Imágenes caídas: aviso con `role=status` + "Reintentar". Mapa: aviso en texto, y la dirección sigue estando en la tarjeta. Sin JS: vistas apiladas y tarjetas de categoría que enlazan a la lista |
| 8. Minimalismo | Bien | Inicio: logo, lema y un CTA. Nosotros: 2 tarjetas + 6 palabras. En Por qué (1440×900) sobra aire arriba y abajo del bloque (~150 px), un detalle cosmético |
| 5. Prevención de errores | Bien | "Precios referenciales — consulta disponibilidad" fijo bajo la lista. Ningún dato de contacto inventado |

---

## 8. Hallazgos

### 8.1 Bloqueantes para publicar

| # | Hallazgo | Ubicación | Criterio | Responsable |
|---|---|---|---|---|
| **B1** | **Datos de contacto sin confirmar.** Hay 7 `PENDIENTE_CONFIRMAR` visibles: dirección, horario, cómo llegar, Abrir en Maps, WhatsApp, Llamar y Facebook. No hay enlaces rotos, pero el sitio no sirve para contactar y no se puede probar "Abierto / Cerrado" (1.4.1) | `src/data/negocio.json` → `VistaVisitanos.astro` | PLAN §1 y §12.1 ("No se publica hasta confirmarlos"); punto 22 | contenido-estrategia (con la dueña) |
| **B2** | **Sin `site` en `astro.config.mjs`.** Por eso no hay canonical, og:url, og:image ni `sitemap.xml`, y el JSON-LD va sin `url`/`image`/`logo`. Al publicarse en `github.io/HINOJOSA/` también hace falta `base` y revisar las rutas absolutas de `/img/...` | `astro.config.mjs` | PLAN §6 (SEO local) y fase 6 | despliegue + seo-negocio-local |

Ninguna de las pruebas bloqueantes del router (1-7, 10, 11 y 12) falla.

### 8.2 Mejoras

| # | Hallazgo | Ubicación | Criterio | Responsable |
|---|---|---|---|---|
| — | **Estado tras la segunda ronda:** M1, M2, M3, M4, M5, M6, M7 y M8 **resueltas** (ver 2 bis). M9 y M10 siguen como estaban | — | — | — |
| M1 | **Pestañas de categoría en móvil**: la fila (461 px) no cabe en 336 px y es un carrusel horizontal propio. "Granos (7)" queda totalmente fuera de pantalla en 360 px (empieza en x=369) y casi entera en 390 px. La única pista es "Comederos" cortado. Propuesta: rejilla 2×2 o `flex-wrap` por debajo de 48rem | `VistaProductos.astro` `.prod-pestanas` | Heurísticas 1 y 6; prueba 9 | frontend |
| M2 | **Tarjeta de Visítanos en pantallas bajas** (1366×650): scroll interno propio de 97 px, y el botón de Facebook queda oculto bajo el borde. Funciona con teclado (↓ desde el título) y, cuando haya enlaces, también con Tab. Propuesta: compactar los datos en alturas < 700 px (dos columnas o botones en fila) | `VistaVisitanos.astro` `.vis-tarjeta` | Prueba 8 (scroll fuera de los paneles declarados) | frontend / direccion-arte |
| M3 | **LCP simulado de Inicio en móvil: 2,56 s** (presupuesto 2,5 s). Lo frenan las fuentes de prioridad alta antes del primer pintado: Caveat Brush pesa 66 kB y solo se usa en 2-3 frases. Propuesta: subconjunto de glifos (`pyftsubset` con los caracteres de las frases), que lo dejaría en ~5-8 kB, o `font-display: optional` para esta familia. El LCP real medido (1,14 s en 4G lenta) cumple con holgura | `Layout.astro` (import `@fontsource/caveat-brush/latin-400.css`) | Presupuesto de LCP | direccion-arte + frontend |
| M4 | **El póster del video de Nosotros (22,5 kB) baja en la carga inicial** aunque el video tenga `preload="none"`. Propuesta: poner `poster` (o `data-poster` → `poster`) al entrar en `#nosotros`, desde `video-vista.ts` | `VistaNosotros.astro`, `src/lib/video-vista.ts` | PLAN §6: solo Inicio se descarga de entrada | animacion-interaccion |
| M5 | **Entrada directa por `#productos` en móvil: Lighthouse 83 y LCP 4,6 s.** La imagen LCP la crea el JS diferido y no es descubrible. Propuesta: en el script inline del `<head>`, si el hash inicial es `#productos`, añadir `<link rel="preload" as="image" imagesrcset=… imagesizes=…>` de la primera imagen de la categoría inicial, o dar `fetchpriority="high"` a la celda inicial de la rejilla | `Layout.astro` (script inline), `carrusel.ts` | Lighthouse > 90 en cualquier punto de entrada | animacion-interaccion / frontend |
| M6 | Las miniaturas de la lista pesan 160 px de alto para un hueco de 40 px. Lighthouse estima un ahorro de 156 KiB en Productos. Propuesta: variante de 80 px (`-thumb80.webp`) | `public/img/productos/*/*-thumb.webp` | Rendimiento | activos |
| M7 | El isotipo de la barra (`isotipo.webp`, 263×257, 11 kB) se pinta a 36-40 px. Una variante de 80-96 px ahorra ~10 kB en cada carga | `Barra.astro` | Rendimiento | activos |
| M8 | Quiénes somos en 360×640: los 6 valores quedan bajo el pliegue (el contenido mide 686 px para un hueco de 524) sin señal de desplazamiento. Propuesta: degradado o sombra inferior en las vistas desplazables de móvil | `global.css` `.vista-cuerpo` (móvil) | Heurística 1 | frontend |
| M9 | Lighthouse `dom-size`: 983 elementos (1052 en `#productos`). Es lo esperable con las 5 vistas en el HTML (requisito SEO) y no afecta a INP (≤ 24 ms). Solo informativo | — | — | — |
| M10 | Pendiente de probar a mano: lector de pantalla (NVDA + Chrome, VoiceOver iOS), Safari iOS y Firefox | — | 4.1.2 / 2.4.3 en AT reales | qa-rendimiento (siguiente ronda) |

---

## 9. Cómo repetir las pruebas

```bash
cd hinojosa-web
npm run build && npx astro check
node <scratchpad>/servidor.mjs ./dist 4341        # servidor estatico con gzip
python <scratchpad>/qa_router.py                   # 12 pruebas x 4 tamanos -> qa_router.json
python <scratchpad>/qa_axe.py                      # axe + objetivos + dorado + nombres -> qa_axe.json
python <scratchpad>/solapes.py                     # texto tapado / inalcanzable
python <scratchpad>/respaldo.py                    # srcset elegido, sin 3D, imagenes caidas
python <scratchpad>/raf.py                         # rAF fuera de Productos
python <scratchpad>/qa_rend.py                     # LCP/CLS/INP/bytes con CDP -> qa_rend.json
python <scratchpad>/prueba_animacion_4341.py        # animacion (copia de prueba_animacion.py con puerto 4341)
python <scratchpad>/mejoras.py                      # M1, M2, M4, M5 (precarga) y M8 en 6 tamanos
python <scratchpad>/extras_mejoras.py               # relevo provisional -> anillo, lista al asentarse, rotulo
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npx lighthouse@12 http://localhost:4341/ --output=json --output-path=lh/movil.json
```
