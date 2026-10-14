# Informe de QA, accesibilidad y rendimiento: Comercial Hinojosa


> **Actualización 2026-10-14 (tras el cierre):** M-1 resuelto (Inicio móvil 99/99/99, peso 340 KiB; `paralaje` y `canela-carrera` se cargan con `import()` tras `load` + primer LCP + hueco libre). M-4 resuelto (juego de sprites de Canela a 160 px, 174,8 KB, elegido según alto × DPR). M-2 y M-3 resueltos (reflujo a 320 px en Por qué y Nosotros: 0 textos fuera de su caja de 320 a 1440 px). Capturas `reflujo-*` y `canela-160-*` en `capturas/fase5b/`.

**Última actualización: 2026-10-14. Cierre de QA de la fase 5-B** (bloques 1–9, 12, 13 y 4-B; rama `Ariel`, commit `6c57db0`). Los bloques 10 y 11 están bloqueados (textos de la dueña y WhatsApp) y **no se evalúan como fallos**.
Debajo, como anexo, se conserva el informe de la fase 5 (2026-10-13) con las cifras de "antes".

**Build auditado:** `npm run build` propio (limpio) y `npx astro check` (0 errores, 0 avisos, 0 sugerencias en 35 archivos). `dist/` servido con `npx astro preview --port 4322` (gzip activo). El servidor de desarrollo del usuario en `:4321` no se tocó. Al terminar se cerró la preview de `:4322`.

**Herramientas:** Playwright (Chromium headless, caché de `npx`), axe-core 4.14.0 desde `node_modules`, Lighthouse 12.8.2 (`npx lighthouse@12`) con Chrome de `C:/Program Files/Google/Chrome`, CDP para la limitación real (4G lenta: 150 ms RTT, 1,6 Mbps, CPU ×4). Los scripts están en el scratchpad de la sesión (`qa/router.js`, `canela.js`, `zancada.js`, `carrusel.js`, `busqueda.js`, `a11y.js`, `contraste.js`, `anchos.js`, `cajas.js`, `bytes.js`, `respaldo.js`, `varios.js`, `lh/*.json`).

---

## A. Veredicto

**Ninguna prueba bloqueante falla.** Router 18/18 en los tres tamaños pedidos (y en 390×844), axe 0 violaciones en las 10 combinaciones, 0 `PENDIENTE_CONFIRMAR` visibles, Canela correcta en 1440, 1366 y 360 y tras redimensionar, carrusel coherente fotograma a fotograma.

**Dos objetivos no se cumplen del todo:**
1. **Lighthouse móvil de Inicio: 98 en las 3 corridas (objetivo ≥ 99).** No es carga del equipo: tres resultados idénticos (LCP simulado 2181–2187 ms) con `benchmarkIndex` entre 3042 y 3777. Un experimento sobre una copia de `dist` lo atribuye al script de `VistaInicio` (ver M-1).
2. **Reflujo a 320 px (WCAG 1.4.10):** en Por qué, los títulos de los pilares se salen de su caja verde entre 320 y 359 px de ancho (texto blanco sobre crema y "Sostenibles" cortado). En Nosotros, "Responsabilidad" se sale 15 px de la banda a 320 px (ver M-2 y M-3).

Lo demás cumple: `#productos` móvil 96 (≥ 93), escritorio 100 en las dos páginas, CLS ≤ 0,010, TBT 0 ms, LCP de Inicio = logo y de Productos móvil = tarjeta provisional (regla M5).

Bloqueantes **para publicar** (no de código) siguen siendo los mismos: datos de la dueña y despliegue (sección G).

---

## B. Lighthouse 12.8.2 (3 corridas por configuración)

Rendimiento / Accesibilidad / Buenas prácticas / SEO. Tiempos simulados de Lighthouse.

| Página | Corrida 1 | Corrida 2 | Corrida 3 | Mediana | FCP | LCP | TBT | CLS | Peso | Elemento LCP |
|---|---|---|---|---|---|---|---|---|---|---|
| Inicio, móvil | 98/100/100/100 | 98/100/100/100 | 98/100/100/100 | **98** (objetivo ≥ 99) | 1,39–1,52 s | **2,18 s** | 0 ms | 0,000 | 606 KiB* | `img.inicio-logo` (logo) |
| `#productos`, móvil | 96/100/100/100 | 96/100/100/100 | 96/100/100/100 | **96** (≥ 93) | 1,75–1,82 s | 2,52–2,66 s | 0 ms | 0,009–0,010 | 446 KiB | `span.prod-frente-tarjeta > img` (provisional, M5) |
| Inicio, escritorio | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 | **100** | 0,37–0,39 s | 0,50–0,51 s | 0 ms | 0,000 | 668 KiB* | `img.inicio-logo` |
| `#productos`, escritorio | 100/100/100/100 | 100/100/100/100 | 100/100/100/100 | **100** | 0,37–0,48 s | 0,78–0,79 s | 0 ms | 0,001 | 358 KiB | frente del anillo (`.anillo-item picture > img`) |

\* Incluye los sprites de Canela (442 kB), que se piden **después** de `load` (Lighthouse espera a la red en reposo).

**Comparación con el cierre de la fase 5:** Inicio móvil 99 → **98** (LCP 1,97–2,11 → 2,18 s); `#productos` móvil 93/96/97 → **96/96/96**; escritorio sin cambios (100).

**Diagnóstico del 98 (experimento, sin tocar el código del sitio):** copia de `dist` servida con gzip en un puerto propio, 2 corridas por variante.

| Variante | Rend. | FCP | LCP |
|---|---|---|---|
| `dist` tal cual | 98 / 98 | 1385 / 1383 ms | 2183 / 2182 ms |
| `dist` sin el `<script type="module">` de `VistaInicio` (paralaje + carrera de Canela + cascada) | **99 / 99** | 1507 / 1389 ms | **2106 / 2112 ms** |

Lighthouse también marca `bootup-time` de ese script: 316 ms de CPU con la limitación móvil. Ni los costales de la vitrina (no se cargan en móvil) ni los sprites (llegan tras `load`) influyen en el LCP.

**Medidas reales con CDP** (`bytes.js`, caché desactivada):

| Perfil | Vista | kB hasta `load` | kB a los 12 s | LCP real (elemento) | CLS | INP aproximado (máx.) |
|---|---|---|---|---|---|---|
| 4G lenta + CPU ×4, 412×823 | Inicio | **159,4** | **603,6** (sprites incluidos) | 1108 ms (logo) | 0,0003 | **48 ms** (21 interacciones: barra, flecha, pestaña, buscador) |
| 4G lenta + CPU ×4 | `#productos` | 201,8 | 512,5 | 504 ms (camperito-400.avif) | 0,0097 | — |
| Escritorio | Inicio | 253,9 (vitrina incluida) | 698,0 | 76 ms (logo) | 0,0002 | 32 ms |
| Escritorio | `#productos` | 183,2 | 479,0 | 64 ms | 0,0022 | — |

- **Presupuesto de Inicio (< 1,5 MB): cumple** (604–698 kB con todo).
- **Sprites tras `load`** (`canela.js`, Resource Timing): en 1440, 1366 y 360 los cuatro `carrera-*.webp` empiezan a pedirse 5–10 ms **después** de `loadEventStart`; `carrera.json`, en el mismo milisegundo. 442 kB en total (207,6 + 133,7 + 53,9 + 47,9).
- **Carga diferida:** en la carga de Inicio no se pide `carrusel.*.js`, GSAP, `leaflet*` ni ningún video. Las imágenes de producto que baja Inicio en escritorio son solo las de la vitrina (`pollos`, `procan-adultos`, `maiz-en-grano`, `cerdos`, `-400.avif`).
- **LCP con la vitrina:** el logo sigue siendo el LCP en Lighthouse (6/6 corridas de Inicio) y en la traza real (1440, 1366, 360 y 412 px). En 1366×650 hay un candidato previo (el texto de la barra, 152 ms) y el definitivo es el logo (192 ms).

---

## C. Router: pruebas 1–18 de `vistas-hinojosa`

Scripts `router.js` (1–5, 7–10, 13–16 y errores), `canela.js` (11, 12, 18), `busqueda.js` (17), `anchos.js` (6). Tamaños: 1440×900, 1366×650, 360×640 (DPR 2, táctil) y 390×844 (DPR 2, táctil).

| # | Prueba | 1440×900 | 1366×650 | 360×640 | 390×844 | Detalle real |
|---|---|---|---|---|---|---|
| 1 | Teclado: Tab+Enter a las 5 vistas, → / ← | PASA | PASA | PASA | PASA | 5/5 vistas con Tab+Enter. → ×4: nosotros, productos, por-que, visitanos; ← ×4 vuelve a inicio |
| 2 | `inert` | PASA | PASA | PASA | PASA | 0 fugas en 70 Tabs por vista; 0 enfocables fuera de la vista activa sin `[inert]` |
| 3 | Foco al título a 80 ms | PASA | PASA | PASA | PASA | 5/5 vistas |
| 4 | Flechas en el buscador y en el carrusel | PASA | PASA | PASA | PASA | Con "maiz": ←← cursor 4→2, → a 3, la vista no cambia. → en la flecha gira (Camperito → Nutri Pollos) sin cambiar de vista |
| 5 | Entrada por `#productos` + atrás | PASA | PASA | PASA | PASA | Solo productos visible; Visítanos y `goBack()` vuelve a productos |
| 6 | Sin JS, 5 vistas apiladas | PASA (1366×650) | | PASA (360×640) | | 5 vistas en orden, documento de 5006 / 6228 px, 37 filas visibles, 71 imágenes de producto, 0 desborde. Capturas `qa-sin-js-*.png` |
| 7 | Foco no tapado (2.4.11) | PASA | PASA | PASA | PASA | 40–44 paradas de Tab por vista, 9 puntos cada una: 0 con el centro tapado, 0 tapadas enteras |
| 8 | `body` no desborda; scroll solo donde toca | PASA | PASA | PASA | PASA | Documento = alto de la ventana siempre. Escritorio: solo `.prod-lista`. Móvil: `.vista-cuerpo` (permitido en móvil) |
| 9 | Sin desborde horizontal | PASA | PASA | PASA | PASA | `scrollWidth = clientWidth` en las 5 vistas. **A 320 px, ver M-2** |
| 10 | Las 5 vistas en el HTML de `dist/` | PASA | | | | HTML servido (gzip): 5 secciones, 6 `data-titulo-vista`, 37 filas, 1 `<h1>`, JSON-LD con 4 categorías y 37 ofertas, 0 `PENDIENTE_CONFIRMAR` |
| 11 | `prefers-reduced-motion` | PASA | | PASA | | Canela: sin `data-canela`, 0 sprites pedidos, sentada fija, 0 rAF en 1 s, botón de pausa oculto. Vista: sin `data-saliendo` a 30 ms. Carrusel: `girando=false` y posición entera a 30 ms. Video de Nosotros en pausa, sin autoplay |
| 12 | Pausa de Canela | PASA | PASA | PASA | | Alcanzable con Tab, 44×44, nombre "Pausar animación" + `aria-pressed`. Pausada 1,5 s: posición y cuadro idénticos, **0 rAF**, 0 animaciones activas. Al reanudar sigue desde el mismo sitio (765,2 → 768,1 px) |
| 13 | Sin destello entre vistas | PASA | PASA | PASA | PASA | 6 pares (inicio→nosotros, inicio→visitanos, nosotros→inicio, productos→por-que, visitanos→inicio, inicio→productos): 0 fotogramas con la saliente oculta y la entrante < 0,5. Control: la transición existe (15 fotogramas intermedios de la entrante; saliente 1→0 en ~160 ms, entrante 0→1 de 150 a 500 ms) |
| 14 | La barra no salta | PASA | PASA | PASA | PASA | Desplazamiento máximo de los enlaces durante el cambio: **0,00 px** en los 6 pares |
| 15 | Pausa global sin transiciones | PASA | PASA | PASA | PASA | 0 animaciones de más de 1 ms en marcha, la pastilla pasa de su posición vieja a la nueva sin intermedias (2 posiciones), 0 `data-saliendo`. Control sin pausa: 14 posiciones intermedias |
| 16 | Clics rápidos | PASA | PASA | PASA | PASA | 3 clics en 213–223 ms: queda solo por-que visible y el foco en su título |
| 17 | Hoja de detalle (móvil) | | | PASA | PASA | `<dialog>` `:modal`, foco en el título, Tab no sale a la página (sale a la interfaz del navegador, que es lo nativo), → no cambia de vista, `Esc` y "Cerrar" la cierran y el foco vuelve a la fila. Sin foto: costal con el nombre. "¿Dónde comprarlo? Visítanos" lleva a Visítanos con foco en el título. En 1440 no se abre |
| 18 | Canela corriendo | PASA | PASA | PASA | | Ver tabla de abajo |
| 0 | Errores de consola / JS | PASA | PASA | PASA | PASA | Ninguno en ningún script |

**Prueba 18 en detalle (`canela.js`, `zancada.js`):**

| Comprobación | 1440×900 | 1366×650 | 360×640 |
|---|---|---|---|
| Fuera de pantalla (muestras con la caja fuera de `[0, ancho]`) | 0 de 1625 | 0 de 1625 | 0 de 1000 |
| Giros en el borde izquierdo / derecho | 2 / 1 en 26 s (izq. llega a x = 0) | 1 / 1 | 3 / 3 en 16 s |
| Borde derecho | gira con la nariz delante del botón de pausa (caja hasta 1354,6; botón en 1352) | 1279,2 (botón en 1280) | 297,7 (botón en 299) |
| Tras redimensionar a 1000 y a 1600 px | 0 fuera; gira en 925,6 y en 1514,6 | 0 fuera; igual | — |
| Velocidad medida / esperada por la zancada (segmentos completos) | 172,0 / 172,0 y 174,6 / 174,6 px/s: **ratio 1,000** | 123,3 / 123,3 y 125,1 / 125,1: **1,000** | 106,5 / 106,5 y 108,2 / 108,1: **1,000** |
| Pausa congela y reanuda desde ahí | Sí | Sí | Sí |
| rAF fuera de Inicio | 0/s en las 4 vistas | 0/s | 0/s |
| Al volver a Inicio | empieza desde `sentada` | igual | igual |
| Entrar en Inicio con la pausa activa | sentada fija, 0 sprites pedidos; la pausa persiste al recargar | | |

> Nota de medida: con un muestreo por `setInterval` la velocidad en 360 px salía un 4–6 % alta. Al medir por segmentos completos con marcas de rAF el ratio es exactamente 1,000 en todos los tamaños. El primer valor era sesgo del muestreo, no patinaje.

**Otras pruebas del router y del agente:**

| Prueba | Resultado |
|---|---|
| Sin 3D (`CSS.supports` de `perspective` a `false`) | PASA. `data-modo="rejilla"`, sin anillo, 9 celdas con `alt` descriptivo, la flecha mueve `aria-current` y la lista tiene 37 filas. Captura `qa-sin-3d-1440x900.png` |
| Imágenes de producto caídas | PASA. "No pudimos cargar las imágenes. La lista tiene todos los productos." con `role="status"` y "Reintentar". Captura `qa-imagenes-caidas-1440x900.png` |
| El carrusel nunca gira solo | PASA. Posición idéntica tras 5 s en 1440 y en 360 |
| Fuera de `#productos`, 0 rAF del carrusel | PASA. 0/s en nosotros, por-que y visitanos, y 0/s en Productos en reposo (contador de `requestAnimationFrame`) |

**Las 41 comprobaciones de la fase 5:** se repitieron todas las que siguen aplicando: 1–5, 7–9 y errores en 4 tamaños, más 6, 10, 11 y 12. **Pasan todas.**

---

## D. Movimiento y carrusel

**Coherencia del carrusel** (`carrusel.js`). En cada `requestAnimationFrame` se lee el producto con `data-frente`, el nombre y el precio del rótulo con su opacidad, la fila con `data-resaltada` y si hay costal. Regla: cuando el rótulo es visible (opacidad > 0,5), su nombre y su precio son los del frente (o los del costal); al asentarse, la fila resaltada es la del frente.

| Acción | Fotogramas 1440 / 360 | Incoherencias | Siluetas vacías |
|---|---|---|---|
| Flecha siguiente | 97 / 97 | 0 / 0 | 0 |
| Flecha anterior | 97 / 97 | 0 / 0 | 0 |
| 3 clics seguidos (90 ms) | 134 / 134 | 0 / 0 | 0 |
| ← ← con teclado | 110 / 110 | 0 / 0 | 0 |
| Fila lejana (sal en grano) | 122 / — | 0 | 0 |
| Arrastre con el ratón | 134 / — | 0 | 0 |
| Granja → Mascotas (primera visita) | 134 / 134 | 0 / 0 | 0 |
| Mascotas → Granja (ya visitada) | 122 / 122 | 0 / 0 | **0** |
| Granja → Mascotas (ya visitada) | 122 / 122 | 0 / 0 | **0** |
| Producto sin foto (Cani Premium) | 110 / — | 0 | 0. Costal al frente con su nombre, "Consulta precio", fila resaltada |
| Salir del costal con la flecha | 110 / — | 0 | 0 |

- **Anuncio:** `aria-live="polite"` con "Pro-Can adultos razas medianas y grandes. Producto 1 de 12 con foto, Alimento Mascotas".
- **Flechas:** "Producto anterior" / "Producto siguiente", 52×52 en escritorio y 44×44 en móvil.
- **Inercia en móvil (P9),** deslizamientos táctiles por CDP: 60 px → 1 paso, 120 px → 2, 200 px rápido → 2, 300 px → 3. Antes un gesto corto saltaba 5.
- **Bebedero:** sin damero en 1440 ni en 360 (`qa-bebedero-*.png`). Ver M-9 por un leve halo verdoso.
- **Color (bloque 13):** las 4 vistas claras tienen banda `bosque` (Nosotros: tarjeta "familia" y Visión; Productos: buscador y pie; Por qué: pilares; Visítanos: tarjeta y pie) y acento canela oscuro / oro (Misión canela oscuro, banda de diferenciales canela oscuro, cabeceras kraft, trazo maíz bajo los h2, pin y marca de agua). Ninguna vista clara es solo crema + blanco.

---

## E. Accesibilidad

### E.1 axe-core 4.14.0 (wcag2a/aa, 21a/aa, 22aa, best-practice), con movimiento reducido para que no mida a mitad de una transición

| Vista | 1440×900 | 360×640 |
|---|---|---|
| Inicio | **0 violaciones** (37 reglas pasan). Incompleto: `color-contrast` ×11 (texto sobre el degradado) | **0** (37). Mismo incompleto |
| Quiénes somos | **0** (36) | **0** (36). Incompleto: `scrollable-region-focusable` |
| Productos | **0** (51). Incompleto: `color-contrast` ×9 (filas con pseudo-elemento) | **0** (51) |
| Por qué elegirnos | **0** (36) | **0** (36) |
| Visítanos | **0** (39) | **0** (39). Incompleto: `scrollable-region-focusable` |

**Incompletos verificados a mano:**
- **Inicio, por píxeles** (texto ocultado y fondo capturado). Acento oro `#F2B823`: mínimo **5,28:1** a 1440 y **5,22:1** a 360. Subtítulo crema: mínimo **8,56:1** / **8,22:1**.
- **Filas de Productos:** el texto es tinta sobre `hoja-claro` / crema (12,56 y 12,67) y el precio bosque sobre `hoja-claro` (8,62).
- **`scrollable-region-focusable`:** es el cuerpo de vista móvil. Su título (`tabindex=-1`) recibe el foco al entrar y se desplaza con ↓, igual que en la fase 5.

### E.2 Contraste real de cada par texto/fondo (`contraste.js`, 5 vistas × 2 tamaños)

Ningún par por debajo de su umbral. Los colores nuevos, contra la tabla de `marca-hinojosa`:

| Frente / fondo | Medido | Tabla | Dónde |
|---|---|---|---|
| tinta suave `#3D5A45` / kraft `#E3CFA6` | **5,00** | 5,00 ✅ | Recuento "9 productos" de la cabecera kraft |
| bosque / kraft | **6,41** | 6,41 ✅ | Cabecera de grupo de la lista |
| crema / canela oscuro `#8A5A1F` | **5,23** | 5,22 ✅ | Antetítulo "MISIÓN" |
| blanco / canela oscuro | **5,89** | 5,88 ✅ | Texto de Misión, banda de diferenciales |
| canela oscuro / crema | **5,23** (texto grande) | 5,22 ✅ | Acento manuscrito de Por qué |
| **canela oscuro / `hoja-claro`** | **5,18** | **no está en la tabla** | "ANIMALES QUE ATENDEMOS" (Por qué). Cumple 4,5; hay que añadir la fila a la skill |
| oro / bosque | 5,44 | 5,44 ✅ | "familia", "VISIÓN" |
| tinta / oro | 7,93 | 7,93 ✅ | "Ver productos" |

**Trazo de pincel maíz bajo los h2:** está sobre crema (Nosotros, Productos, Por qué) y sobre bosque (Visítanos). **Nunca sobre kraft ni `crema-oscuro`**, que son las combinaciones que prohíbe la skill. Es decorativo (1,60 sobre crema, permitido). **Oro como texto sobre claro: 0 casos.**

### E.3 Otras comprobaciones

| Criterio | Resultado |
|---|---|
| 2.5.8 Objetivos | 0 objetivos por debajo de 24 px y 0 por debajo de 44 px, en las 10 combinaciones |
| Texto < 13 px | Solo "COMERCIAL" de la barra, a 12 px con `tracking 0.16em`, que es lo que decidió G4. Nada más en las 5 vistas |
| Nombres de la barra móvil | "Inicio", "Nosotros", "Productos", "Por qué elegirnos" (la parte oculta es `sr-only`) y "Visítanos". Escritorio: nombres completos |
| Decorativos | 0 `<img>` sin `alt` y 0 con `alt` no vacío dentro de `aria-hidden` (vitrina, granos, hojas, Canela y sprites) |
| `PENDIENTE_CONFIRMAR` visible | **0** en el texto visible de las 5 vistas (1440, 360 y sin JS) y **0** en el HTML de `dist/`. Las únicas coincidencias de "pendiente" son nombres de clase y atributos `data-*` |
| Enlaces a datos no confirmados | 0 `href` externos, `tel:` o `wa.me`. Los canales pendientes van en una sola línea, sin forma de botón |

### E.4 No ejecutado (y por qué)

- **Lector de pantalla real** (NVDA, VoiceOver, TalkBack): no hay ninguno en este entorno. Sí se comprobaron foco al título, `aria-live` del carrusel y del buscador, `aria-current`/`aria-pressed` y que el `<dialog>` es modal.
- **Safari iOS y Firefox:** solo Chromium. Siguen pendientes la cancelación de la pastilla de la barra (B2), `inert`, `dvh`, el `<dialog>`, el alfa del video y la decodificación de los sprites WebP.
- **Dispositivos reales y datos de campo:** el sitio no está publicado.
- **Mapa Leaflet y "Abierto / Cerrado":** no se cargan porque no hay coordenadas ni horario confirmados.
- **Sin medir fotograma a fotograma:** la cascada de entrada de Inicio (I9), el pop del icono móvil y el estiramiento de la pastilla (B4), el retraso del color del texto (B3), el ancho animado del chip de precio (C3) y la dirección del medio giro al cambiar de categoría (C5). Están en el código (revisado), pero no tienen prueba propia.

---

## F. Buscador, accesos y flujos (`busqueda.js`)

| Consulta | Resultado | Esperado | Grupos | Estado |
|---|---|---|---|---|
| perro / perros | 14 "14 productos encontrados" | 14 con `animales: perro` | Mascotas "12 de 16", Comederos "2 de 5" | PASA |
| gato | 6 | 6 | Mascotas 4 de 16, Comederos 2 de 5 | PASA |
| pollo / gallina | 11 / 11 | 11 (`ave`) | Granja 3 de 9, Comederos 3 de 5, Granos 5 de 7 | PASA (y "pollo" no devuelve el hueso sabor pollo) |
| cerdo | 4 | 4 | | PASA |
| vaca | 4 | 4 | | PASA |
| cuy | 2 | 2 | | PASA |
| tilapia / pez | 1 "1 producto encontrado" | 1 | Granja "1 de 9" | PASA (singular correcto) |
| procan / pro can / Pro-Can | 4 | Los 4 Pro-Can | Mascotas 4 de 16 | PASA |
| maiz / maíz | 3 | Los 3 maíces | Granos "3 de 7" | PASA |
| arena / mascan | 3 / 3 | | | PASA |
| xyz | 0. "No encontramos «xyz». Prueba con otra palabra o mira una categoría:" + Granja · Mascotas · Comederos · Granos | Atajos | | PASA. El atajo "Comederos" vacía el buscador y abre la pestaña |

- **El carrusel sigue a la búsqueda (P8):** con "maiz", a los 1,8 s el frente es "Maíz en grano". A los 450 ms todavía muestra el frente de la búsqueda anterior (ver M-11).
- **Recuentos:** pestaña "Mascotas (16)" y rótulo "1 de 12 con foto". Singular y plural correctos en "1 producto encontrado" y en "N productos".
- **Accesos de Inicio** (1440 y 360): Granja, Mascotas, Comederos y Granos abren Productos con esa pestaña pulsada y su primer producto al frente. **"Cómo llegar"** lleva a Visítanos con el foco en el título.
- **Animales de Por qué** (1440 y 360): los 8 enlaces (Aves, Cerdos, Conejos, Cuyes, Vacas, Perros, Gatos, Tilapias) abren Productos con el buscador relleno y resultados: 11, 4, 2, 2, 4, 14, 6 y 1.
- **Hoja de detalle:** ver prueba 17. Capturas `qa-hoja-detalle-*.png` y `qa-hoja-sin-foto-*.png`.

**Desborde horizontal de 320 a 2560 px** (15 anchos × 5 vistas, `anchos.js`): el documento nunca desborda. Un solo fallo: **Por qué a 320 px** (cuerpo 322/320, M-2). Además, `cajas.js` (texto fuera de su caja de color) encuentra los casos de M-2 y M-3 a 320 px y ninguno a partir de 360. Los de `.prod-panel` son la lista con scroll, que es lo esperado.

---

## G. Hallazgos

### G.1 Bloqueantes

**Ninguno de código.** Las pruebas bloqueantes (teclado, `inert`, pausa, indexación, marcadores visibles y datos falsos) pasan todas.

Bloqueantes **para publicar** (sin cambios desde la fase 5):

| # | Hallazgo | Responsable |
|---|---|---|
| B1 | Datos de la dueña sin confirmar (dirección, horario, referencias, WhatsApp, teléfono, Facebook, coordenadas). Ya **no** se ven marcadores, pero el sitio sigue sin forma de contactar (G1) | contenido-estrategia (con la dueña) |
| B2 | Sin `site` en `astro.config.mjs` (sin canonical, og:url ni `sitemap.xml`) y workflow de despliegue roto | despliegue + seo-negocio-local |

### G.2 Mejoras

| # | Severidad | Hallazgo | Ubicación | Criterio | Recomendación | Responsable |
|---|---|---|---|---|---|---|
| **M-1** | Alta (objetivo del plan) | **Lighthouse móvil de Inicio 98 < 99.** LCP simulado de 2,11 a 2,18 s por la evaluación del módulo de Inicio antes del LCP (316 ms de CPU con la limitación). Sin ese `<script>`, 99/99 | `src/components/vistas/VistaInicio.astro:738-741` (imports estáticos de `paralaje` y `canela-carrera`) | PLAN §11 cierre (Inicio ≥ 99); `performance-and-web-vitals` | Cargar `paralaje` y `canela-carrera` con `import()` tras `load` (o `requestIdleCallback`). La carrera ya espera a `load` para los sprites, así que su lógica también puede esperar. Dejar en el script inicial solo la marca de la cascada. Repetir Lighthouse ×3 | animacion-interaccion |
| **M-2** | Alta (WCAG 1.4.10 a 320 px) | **Pilares de Por qué entre 320 y 359 px:** "Naturales" +2,5 px, "Confiables" +9,2 px y "Sostenibles" +18,1 px fuera de su caja bosque. Texto blanco sobre crema (ilegible) y "Sostenibles" cortado en el borde (x = 322 con ventana de 320) | `src/components/vistas/VistaPorQue.astro:155-162` (`.pq-pilar`) y `:183-189` (`.pq-pilar-titulo`, `clamp(1rem, …)`) | 1.4.10 Reflujo, 1.4.3 | Por debajo de ~22.5rem: una columna, o icono de 2rem + `min-width: 0` + `overflow-wrap: anywhere` / `hyphens: auto` en el título, o bajar el mínimo del `clamp` a 0.9375rem. Captura `qa-por-que-320x700.png` (bien a 340: `qa-por-que-340x700.png`) | frontend (con direccion-arte) |
| **M-3** | Media | **Valores de Nosotros a 320 px:** "Responsabilidad" se sale 15 px de la banda `hoja-claro` (se lee sobre crema, pero rompe la banda) | `src/components/vistas/VistaNosotros.astro:229-233` (`.nos-lista-valores`, 2 columnas) | 1.4.10 / estética | Una columna por debajo de ~22.5rem, o reducir el hueco y el icono. Captura `qa-nosotros-valores-320x640.png` | frontend |
| **M-4** | Media (rendimiento) | **Sprites de Canela sobredimensionados en móvil:** cuadros de 320 px de alto que se pintan a 70-88 px (154 px a DPR 1,75). Lighthouse estima 237-351 KiB de ahorro. No afecta al LCP (llegan tras `load`), pero son el 73 % de los bytes de Inicio en móvil | `public/img/canela/carrera-*.webp`, `carrera.json`; selección en `src/lib/animacion/canela-carrera.ts:166` (`cargar`) | Presupuesto de datos móviles | Generar un juego a 160 px de alto (~110 kB) y elegirlo si `alto × devicePixelRatio ≤ 160`. La velocidad ya escala con `alto / cuadro.alto` | activos-3d-video + animacion-interaccion |
| M-5 | Baja (dato) | "Pro-Can adultos: **Desde $1.00**" (y Pro-Can cachorros "Desde $1.40") sin unidad. Puede leerse como precio del saco | `src/data/productos.json:129-130` | Prevención de errores (Nielsen 5) | Confirmar con la dueña si es por libra y añadir la unidad ("Desde $1.00 / lb") | contenido-estrategia |
| M-6 | Baja | "Mascotas" sale dos veces en Inicio: acceso de categoría y fila de animales | `src/components/vistas/VistaInicio.astro:181-192` | `marca-hinojosa` §5 "No dupliques mensajes" | En la fila de animales, "Perros · Gatos" en lugar de "Mascotas" | direccion-arte / contenido-estrategia |
| M-7 | Baja | Nosotros en 360: el video con `object-fit: contain` deja un rectángulo gris de estudio más estrecho que la tarjeta (N2 parcial) | `src/components/vistas/VistaNosotros.astro:123-129` (`--gris-video`) | Estética | Ajustar `--gris-video` al tono exacto del borde del póster o usar el `.webm` con alfa sobre `crema-oscuro` (con respaldo para Safari) | direccion-arte |
| M-8 | Baja | Con 5 productos (Comederos), los laterales del anillo se ven casi del tamaño del frente y lo tapan en parte. Cuesta saber cuál es el producto al frente | `VistaProductos.astro:1184` (`--carrusel-ancho`) y el radio mínimo en `carrusel.ts` (`calcularRadio`) | Heurística 1 | Con N ≤ 6, radio mayor u opacidad y escala menores en los laterales | animacion-interaccion |
| M-9 | Baja | Halo verdoso tenue en el borde derecho del bebedero | `public/img/productos/comederos/bebedero*` | Estética | Erosionar 1 px el alfa o quitar el tinte del borde en `quitar_fondo_blanco` | activos-3d-video |
| M-10 | Informativa | En escritorio, el LCP de `#productos` es el frente del anillo y no la provisional (regla M5). Rendimiento 100 y LCP 0,78 s: sin impacto. En móvil la provisional sí es el LCP | `carrusel.ts` (primer montaje) | Regla M5 | Vigilar si baja de 100 | animacion-interaccion |
| M-11 | Baja | Al escribir, la lista filtra al instante, pero el carrusel tarda más de 450 ms en llevar al frente el primer resultado. Durante ese tiempo el rótulo enseña un producto que ya no está en la lista (p. ej. "Pro-Can adultos" con "gato" escrito) | `src/lib/catalogo.ts` (selección con origen `'busqueda'`) | Heurística 1 | Atenuar el rótulo mientras el frente no pertenezca al filtro, o acortar el retardo | animacion-interaccion |
| M-12 | Informativa | En 360 px cada tramo de carrera dura ~1,6 s y cada giro 1,5 s: Canela pasa la mitad del tiempo girando | `canela-carrera.ts` | Movimiento | Valorarlo al verlo en un móvil real; opcional, una pausa sentada cada N vueltas | animacion-interaccion |
| M-13 | Informativa | `dom-size`: 1123 elementos. Es lo esperable con las 5 vistas en el HTML; INP ≤ 48 ms | — | — | — | — |
| M-14 | Pendiente | Lector de pantalla, Safari iOS y Firefox | — | 4.1.2 / 2.4.3 | Prueba manual antes de publicar | qa-rendimiento |
| M-15 | Doc | Falta en `marca-hinojosa` §2 la fila canela oscuro sobre `hoja-claro` (5,18, solo texto ≥ 4,5 cumple) | `.claude/skills/marca-hinojosa/SKILL.md` | — | Añadir la fila | direccion-arte |

---

## H. Usabilidad por vista (Nielsen) y estado de la auditoría

Capturas "después" en `capturas/fase5b/qa-*.png`. Las de "antes" están en `capturas/auditoria/`. Pares directos:

| Vista | Antes | Después |
|---|---|---|
| Inicio | `auditoria/inicio-1440x900.png`, `inicio-360x640.png`, `inicio-1366x650.png` | `qa-inicio-1440x900.png`, `qa-inicio-360x640.png`, `qa-inicio-1366x650.png`, `qa-canela-carrera-*.png` |
| Quiénes somos | `nosotros-1440x900.png`, `nosotros-360x640.png` | `qa-nosotros-1440x900.png`, `qa-nosotros-360x640.png` |
| Productos | `productos-1440x900.png`, `productos-360x640.png`, `flujo-buscar-maiz-1440.png`, `flujo-buscar-vacio-1440.png`, `flujo-producto-sin-imagen-1440.png`, `flujo-movil-tap-fila-360.png` | `qa-productos-1440x900.png`, `qa-productos-360x640.png`, `qa-buscar-maiz-1440x900.png`, `qa-buscar-xyz-1440x900.png`, `qa-costal-sin-foto-1440x900.png`, `qa-hoja-detalle-360x640.png` |
| Por qué | `por-que-1440x900.png`, `por-que-360x640.png` | `qa-por-que-1440x900.png`, `qa-por-que-360x640.png`, `qa-animal-perro-*.png` |
| Visítanos | `visitanos-1440x900.png`, `visitanos-360x640.png` | `qa-visitanos-1440x900.png`, `qa-visitanos-360x640.png` |

**Resumen por vista:**
- **Inicio.** Ahora dice qué se vende (vitrina, accesos), para qué animales y da dos caminos: "Ver productos" y "Cómo llegar" (heurísticas 6 y 7). El logo sigue siendo el LCP. Pendiente: M-1 (rendimiento) y M-6 (duplicado).
- **Quiénes somos.** La gorra ya no se corta, los valores van en una sola banda y Misión lleva fondo canela oscuro. Pendiente: N2 parcial (M-7) y M-3 a 320 px.
- **Productos.** El buscador entiende animales, sinónimos, plurales y marcas con o sin guion. Recuentos "x de y", estado vacío con atajos, costal para los productos sin foto, hoja de detalle en móvil y carrusel coherente fotograma a fotograma (heurísticas 1, 5 y 9). Pendiente: P2 (bloqueado), M-8 y M-11.
- **Por qué.** Animales enlazados que filtran el catálogo y sellos de costal. Pendiente: M-2 a 320 px y los textos (Q2, Q3 y Q7, bloqueados).
- **Visítanos.** Sin marcadores técnicos, la ausencia del mapa se explica con texto humano y los canales pendientes van en una línea. Sigue sin datos (B1).

**Estado de cada código de `auditoria.md`:**

| Código | Estado | Evidencia |
|---|---|---|
| I1 | Resuelto | Vitrina de 4 costales en ≥ 64rem (`qa-inicio-1440x900.png`) |
| I2 | Resuelto | LCP = logo en 6/6 corridas de Lighthouse y en la traza real; los costales no son candidatos |
| I3 | Resuelto | "Cómo llegar" → Visítanos con foco; 4 accesos abren su pestaña |
| I4 | Resuelto | "Tu mejor aliado para tus animales" |
| I5 | Resuelto | Fila de animales bajo los accesos (ver M-6) |
| I6 | Resuelto | Aro maíz visible |
| I7 | Resuelto | Granos, hojas y marca de agua del trébol |
| I8 | Sustituido y resuelto | Carrera de borde a borde (prueba 18) |
| I9 | Implementado, no medido | `data-cascada`; sin prueba por fotogramas |
| N1 | Resuelto | Gorra entera a 1440 y 360 |
| N2 | Parcial | Rectángulo gris visible en 360 (M-7) |
| N3 | Descartado (decisión §0-B) | — |
| N4 | Bloqueado (dueña) | — |
| N5 | Resuelto | Una banda `hoja-claro` (M-3 a 320 px) |
| N6 | Resuelto | Misión y Visión en peso normal |
| N7 | Resuelto (revisado en el código) | `data-tilt` solo en la tarjeta grande y la banda |
| N8 | Parcial | En 360×640 los valores siguen bajo el pliegue (732/532), con la señal "hay más abajo" |
| P1 | Resuelto | 18 consultas correctas (sección F) |
| P2 | Bloqueado (bloque 11) | Provisional: "¿Dónde comprarlo? Visítanos" en la hoja |
| P3 | Resuelto | Sin damero (M-9 menor) |
| P4 | Resuelto | "3 de 7", "1 de 12 con foto", singular correcto |
| P5 | Resuelto | Costal con nombre; 0 incoherencias |
| P6 | Resuelto | Buscador encima del carrusel en móvil; hoja de detalle |
| P7 | Resuelto (con M-8) | `--carrusel-ancho: clamp(11.25rem, 24dvh, 15rem)` en ≥ 64rem |
| P8 | Resuelto (con M-11) | Primer resultado al frente |
| P9 | Resuelto | 1-3 pasos por gesto; flechas junto al rótulo en móvil |
| P10 | Resuelto | Miniaturas de 48 px en ≥ 48rem; recuento atenuado |
| Q1 | Resuelto | Sellos de costal junto a Aves, Cerdos, Cuyes y Vacas |
| Q2 | Bloqueado (bloque 10) | — |
| Q3 | Bloqueado (bloque 10) | El diferencial sigue repitiendo la fila de animales |
| Q4 | Resuelto | 8 animales enlazados con resultados |
| Q5 | Descartado | — |
| Q6 | Resuelto | Título arriba y bandas centradas con `margin-block: auto` (queda aire arriba a 1440×900, cosmético) |
| Q7 | Bloqueado (bloque 10) | — |
| V1 | Resuelto | 0 `PENDIENTE_CONFIRMAR` visibles; una línea de canales |
| V2 | Resuelto | "El mapa aparecerá cuando confirmemos la ubicación." |
| V3 | Resuelto | Crema con textura, trébol y pin, sin calles falsas |
| V4 | Resuelto | "Referencias" como dato |
| G1 | Bloqueado (bloque 11 y datos) | — |
| G2 | Descartado | — |
| G3 | Bloqueado (bloque 10) | Solo Visítanos tiene antetítulo |
| G4 | Resuelto | "COMERCIAL" a 12 px + 0.16em |
| G5 | Resuelto | Barra superior de 44 px; "Por qué" con nombre accesible "Por qué elegirnos" |
| T1 | Resuelto | Prueba 13 |
| T2 | Resuelto | Saliente ~160 ms y entrante hasta ~500 ms, medido |
| A+ | Implementado, no medido por bloque | `data-entra` en las vistas |
| B1 | Resuelto | 0,00 px de salto |
| B2 | Resuelto en Chromium | Sin probar en Safari/Firefox |
| B3 | Implementado, no medido | Retraso del color en el CSS |
| B4 | Implementado, no medido | Hover, pulsación y pop en el CSS |
| C1 | Resuelto | 0 siluetas al volver a una categoría |
| C2 | Resuelto | 0 incoherencias del rótulo |
| C3 | Implementado, no medido | — |
| C4 | Resuelto | Fila resaltada = frente al asentarse |
| C5 | Implementado, no medido | — |
| C6 | Implementado | Transición en `.prod-pestana` |
| C7 | Resuelto | Arrastre sin incoherencias |
| C8 | Implementado | Llegada en `carrusel.ts` |

---

## I. Cómo repetir

```bash
cd hinojosa-web
npm run build && npx astro check
npx astro preview --port 4322            # en segundo plano
node <scratchpad>/qa/router.js           # 1-5, 7-10, 13-16 x 4 tamanos
node <scratchpad>/qa/canela.js           # 11, 12, 18, sprites tras load, LCP, rAF
node <scratchpad>/qa/zancada.js          # velocidad / zancada por segmentos
node <scratchpad>/qa/carrusel.js         # coherencia por fotogramas, siluetas, bebedero
node <scratchpad>/qa/busqueda.js         # buscador, accesos, animales, 17
node <scratchpad>/qa/a11y.js             # axe, objetivos, PENDIENTE, decorativos
node <scratchpad>/qa/contraste.js        # pares texto/fondo + pixeles de Inicio
node <scratchpad>/qa/anchos.js           # sin JS, 320-2560, controles 13/15, capturas
node <scratchpad>/qa/bytes.js            # bytes, LCP y CLS reales, INP aproximado
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npx lighthouse@12 http://127.0.0.1:4322/ --output=json --output-path=lh/movil-inicio-1.json
```

---
---

# Anexo: informe de la fase 5 (2026-10-13)

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

### 1. Resumen

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

### 2 bis. Mejoras aplicadas (M1-M8)

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

### 2. Correcciones aplicadas en esta fase

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

### 3. SEO: verificación sobre `dist/index.html`

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

### 4. Router de vistas: las 12 pruebas de `vistas-hinojosa`

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

### 5. Accesibilidad

#### 5.1 axe-core 4.14.0 (WCAG 2.0/2.1/2.2 A+AA + best-practice), barra + vista activa

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

#### 5.2 Comprobaciones propias (`qa_axe.py`)

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

#### 5.3 No ejecutado (y por qué)

- **Lector de pantalla real** (NVDA, VoiceOver, TalkBack): no hay uno disponible en este entorno headless. Se comprobó lo que se puede comprobar automáticamente: el foco va al título (que tiene texto), `aria-live` en el carrusel y en el resultado de búsqueda, y `aria-current`. Que el anuncio se oiga de verdad **queda pendiente de una prueba manual**.
- **Navegadores no Chromium** (Safari/iOS, Firefox): solo se usó Chromium, así que `inert`, `dvh`, el alfa del video y `min()` sin probar en WebKit quedan pendientes. Prioridad: Safari iOS, por el video con alfa y la barra inferior con `safe-area`.
- **Dispositivos reales y datos de campo** (CrUX): el sitio no está publicado.
- **Mapa Leaflet**: no se carga porque no hay coordenadas confirmadas, así que su teclado y su atribución no se pudieron probar. Hoy se muestra el aviso "El mapa aparecerá cuando confirmemos la ubicación exacta".

---

### 6. Rendimiento

#### 6.1 Lighthouse 12.8.2 (3 corridas por configuración, resultados idénticos)

| Página | Rend. | Acces. | B. prácticas | SEO | FCP | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|
| Inicio, móvil (Moto G, 4G lenta simulada) | **95** | 100 | 100 | 100 | 2,0 s | **2,6 s** (2564 ms) | 0 ms | 0,004 | 227 KiB |
| Inicio, escritorio | **100** | 100 | 100 | 100 | 0,5 s | 0,6 s | 0 ms | 0,002 | 219 KiB |
| `#productos`, móvil | **83** | 100 | 100 | 100 | 1,7-1,8 s | **4,6 s** | 0 ms | 0,018-0,024 | 728 KiB |
| `#productos`, escritorio | 99 | 100 | 100 | 100 | 0,5 s | 1,0 s | 0 ms | 0,002 | 719 KiB |

- **LCP de Inicio en móvil.** El elemento LCP es el logo, que ya va con `fetchpriority="high"`. Lighthouse atribuye el 82 % al "render delay": el FCP simulado (1,96 s) se alarga por las fuentes de prioridad alta que salen antes del primer pintado, sobre todo **Caveat Brush (66 kB) para una sola frase**. El FCP y el LCP observados sin limitar son de 226 ms. Ver M3.
- **`#productos` como página de entrada.** La imagen LCP la crea `carrusel.ts`, que se carga de forma diferida, así que no es descubrible en el HTML. Ver M5. Entrar por Inicio y navegar a Productos (el caso normal) no tiene este coste en la carga.

#### 6.2 Medido con limitación real por CDP (`qa_rend.py`, 3 corridas)

| Perfil | LCP | FCP | CLS |
|---|---|---|---|
| 4G lenta + CPU ×4, 412×823 @1,75 | **1144 / 1136 / 1132 ms** | 316 / 312 / 304 ms | 0,0038 |
| 4G rápida (9 Mbps) + CPU ×2 | 312 / 248 / 248 ms | 144 / 112 / 116 ms | 0 |
| Escritorio sin limitar | 64 / 68 / 64 ms | 64-68 ms | 0,0025 |

**INP aproximado** (Event Timing, duración máxima por interacción): clic en la barra (×4) 16 ms; flecha del carrusel 24 ms; pestaña de categoría 16-24 ms; teclear en el buscador 16-24 ms; fila de la lista 24 ms; pausa del perrito 16 ms. Todo muy por debajo de 200 ms, también con CPU ×4.

#### 6.3 Bytes por vista (transferidos, perfil 4G rápida, caché desactivada)

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

### 7. Revisión heurística (Nielsen)

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

### 8. Hallazgos

#### 8.1 Bloqueantes para publicar

| # | Hallazgo | Ubicación | Criterio | Responsable |
|---|---|---|---|---|
| **B1** | **Datos de contacto sin confirmar.** Hay 7 `PENDIENTE_CONFIRMAR` visibles: dirección, horario, cómo llegar, Abrir en Maps, WhatsApp, Llamar y Facebook. No hay enlaces rotos, pero el sitio no sirve para contactar y no se puede probar "Abierto / Cerrado" (1.4.1) | `src/data/negocio.json` → `VistaVisitanos.astro` | PLAN §1 y §12.1 ("No se publica hasta confirmarlos"); punto 22 | contenido-estrategia (con la dueña) |
| **B2** | **Sin `site` en `astro.config.mjs`.** Por eso no hay canonical, og:url, og:image ni `sitemap.xml`, y el JSON-LD va sin `url`/`image`/`logo`. Al publicarse en `github.io/HINOJOSA/` también hace falta `base` y revisar las rutas absolutas de `/img/...` | `astro.config.mjs` | PLAN §6 (SEO local) y fase 6 | despliegue + seo-negocio-local |

Ninguna de las pruebas bloqueantes del router (1-7, 10, 11 y 12) falla.

#### 8.2 Mejoras

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

### 9. Cómo repetir las pruebas

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

