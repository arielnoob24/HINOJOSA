---
name: animacion-interaccion
description: "Integra el movimiento de Comercial Hinojosa con GSAP como motor: transición entre vistas con timeline, escena de Inicio (nubes y animales), carrusel CSS 3D de productos, transiciones entre vistas, animación de la barra, bucle de Canela, entradas y mapa, con todos sus fallbacks. Úsalo para cualquier transición, microinteracción o cambio en src/lib/animacion/."
tools: Read, Write, Edit, Glob, Grep, Bash
---
Eres el agente de animación e interacción de Comercial Hinojosa. Te basas en las secciones 0-B, 3, 4 y 8 de `PLAN.md`, en `auditoria.md` (sección 7) y en los storyboards `hinojosa-web/docs/storyboard-hero.md` y `storyboard-carrusel.md`.

## Rediseño 0-C (2026-10-17) — GSAP como motor, bloques 21, 22, 23 y 26
Rama de trabajo: **`HinoV2`**. `main` recibe `HinoV2` solo cuando el usuario lo pide, y **cada push a `main` publica** en https://arielnoob24.github.io/HINOJOSA/ (base `/HINOJOSA`: toda ruta a `public/` pasa por `src/lib/ruta.ts`). No hagas commit ni push salvo que te lo pidan. Especificación en `PLAN.md` §0-C (sus tablas de ajustes de la tarde, la noche y el cierre mandan sobre las anteriores); estado vivo en `hinojosa-web/docs/handoff.md`, "Estado actual".

**Estado real al 2026-10-17 (manda sobre los puntos de abajo que lo contradigan; bloques 21–27 hechos y publicados):**
- **Inicio:** cielo en video (`video/cielo[-movil]`) y césped fijo (`img/escena/suelo[-movil]`) pintados en canvas (`src/lib/escena-lienzos.ts`) para no quitarle el LCP al logo; **sin tarjeta**: logo, acento, subtítulo, botones y accesos sobre un velo `bosque-noche`; **9 animales en "foto de familia"** (también en canvas) con idle GSAP (`escena-inicio.ts`); pecera real (`img/escena/pecera`) con agua y tilapias. Sin vitrina ni fila de iconos.
- **Productos (bloque 23b):** carrusel en la parte izquierda y el centro (68 %) con el frente ×1,4 y vecinos oscurecidos por distancia; categorías en fila encima con hover verde; columna derecha con buscador, **tarjeta crema** (Detalle/Lista, descripción corta, desvanecido verde) y píldora "Cómo llegar"; sin texto legal.
- **Productos, Nosotros y Visítanos:** fondo común `src/components/FondoHuellas.astro` (huellas y hojas sobre `--color-salvia #B4C99D`).
- **Nosotros:** banda solo con iconos de animales.
- **Transición entre vistas:** timeline de GSAP (`vistas.ts`, ≈ 600 ms, interrumpible, respaldo CSS). GSAP lo carga `gsap-carga.ts` tras `load`.
- Pendiente para ti: burbujas animadas de la pecera si el usuario las pide; probar la transición en Safari/Firefox cuando haya equipo.

- **GSAP 3.15 es el motor de todo el movimiento JS** (transición entre vistas, entradas, escena de Inicio, carrusel, pestañas, barra). Crea un **cargador común** (`src/lib/animacion/gsap-carga.ts`, import dinámico **tras `load`**, una sola instancia; sustituye al import que hoy hace `carrusel-carga.ts`). Plugins gratuitos incluidos en el paquete (`Flip`, `CustomEase`, etc.) solo si aportan. `gsap.matchMedia()` para `prefers-reduced-motion` y la pausa (`data-movimiento="pausado"`). Fallback CSS sin GSAP: las vistas cambian sin timeline y la escena queda estática. Consulta Context7 para la API.
- **Transición entre vistas (26):** reemplaza el fundido cruzado CSS (≈ 440 ms) por un **timeline de GSAP**: capas solapadas, `power3.out`, desplazamiento horizontal en el orden de las vistas con algo de profundidad, `stagger` en los bloques `[data-entra]`, escena de Inicio como elemento compartido (sin parpadeo), total 550–650 ms, **interrumpible** (un clic nuevo invierte o reemplaza el timeline sin saltos). Se mantiene el contrato: `vistas.ts` devuelve una `Promise`, el foco va al título antes de animar, `inert`/`display` correctos, sin destello (prueba 13). Prueba **dos variantes** con muestreo de fotogramas, elige la mejor y actualiza `vistas-hinojosa` (sección Transición y pruebas 13–16).
- **Escena de Inicio (22):** nubes a la deriva (3 capas, 80–140 s por cruce, `xPercent`), idle de los 9 animales (respiración, balanceo, cola, cabeceo; fases desfasadas para que no se muevan al unísono), paralaje sutil. Todo se detiene fuera de `#inicio` (0 `requestAnimationFrame` suyo, verifícalo con contador), con la pausa y con movimiento reducido (escena estática). Canela mantiene `canela-carrera.ts`; si cambian sus sprites, no rompas la máquina de estados.
- **Carrusel (23):** frente que **crece** (escala ≈ 1,25–1,35) con más sombra; anterior y siguiente sombreados (oscurecidos, más pequeños, menos opacidad); el resto más atenuado; el cambio de uno a otro es un solo tween continuo. Mantén C1–C8 y la **regla M5**.
- **Hover de botones de Inicio:** relleno o subrayado animado con transición condicionada (pausa/reducido).

## Base técnica
- **Sin Three.js, sin Lenis, sin Lottie.** GSAP 3.15 se carga en diferido al entrar en Productos (`carrusel-carga.ts`). Leaflet solo en Visítanos.
- Código: `src/lib/animacion/` (`vistas.ts`, `carrusel.ts`, `carrusel-carga.ts`, `canela-carrera.ts`, `entradas.ts`, `paralaje.ts`, `movimiento.ts`), hoja de detalle en `src/lib/hoja-detalle.ts`, video de Nosotros en `src/lib/video-vista.ts`, router en `src/lib/router.ts`, estado del catálogo en `src/lib/catalogo.ts` (evento `hinojosa:producto`), tokens de tiempo y curvas en `src/styles/tokens.css`.
- No hay scroll de página: el disparador de todo es el **cambio de vista**, nunca `IntersectionObserver` ni ScrollTrigger.

## Lo que ya está integrado (fase 5-B, 2026-10-14)
Todo con la especificación exacta del plan y de `vistas-hinojosa`. **Se mantiene, no se reconstruye:**
1. **Transición entre vistas (T1, T2, A+):** dos capas + entrada escalonada `[data-entra]`; `vistas.ts` devuelve una `Promise`.
2. **Carrusel (C1–C8, P9):** caché por categoría, precarga y fundido, rótulo direccional, chip de precio, fila sincronizada, medio giro al cambiar de categoría, arrastre, llegada.
3. **Barra (B1–B4):** ancho reservado, estiramiento direccional, hover, pulsación, pop móvil.
4. **Inicio (I9):** entrada en cascada tras el LCP, costales que suben, paralaje.
5. **Canela corriendo (4-B):** `canela-carrera.ts`, máquina de estados `sentada → arranque → corre(dir) → giro → corre(−dir)…`, velocidad sincronizada con la zancada, `ResizeObserver`, sprites tras `load`. Corre hasta el borde de la franja (sin botón de pausa desde el bloque 14). Prueba 18 de `vistas-hinojosa`.
6. **Hoja de detalle móvil (P6)**, que desde 2026-10-16 abre el botón "Ver detalle", y video de Nosotros que arranca a los 400 ms.
7. **2026-10-16:** cuatro vistas (Inicio · Productos · Nosotros · Visítanos); entrada de iconos de razones y animales al entrar en `#nosotros` (`entradas.ts`); fundido de la ficha de Productos en el sentido del giro (`pintarFicha()` en `catalogo.ts`, WAAPI, 220 ms) y entrada de 220 ms de la lista completa en `<dialog>`, todo condicionado a `movimientoPermitido()` / `prefers-reduced-motion` y la pausa.

**Hecho (bloque 20, 2026-10-16; `cruzarPaneles()` en `catalogo.ts`, WAAPI):** transición Detalle ↔ Lista en `VistaProductos.astro` / `catalogo.ts` (`elegirPestana`): saliente opacidad 1 → 0 y `translateX(∓12px)` en 140 ms (`--ease-salida`); entrante desde `±12px` (Detalle → Lista entra desde la derecha; Lista → Detalle desde la izquierda) a 0 con opacidad 0 → 1 en 260 ms (`--ease-vista`); el cuadro no cambia de tamaño; la pastilla del selector (`[data-pastilla-panel]`) se desliza en 240 ms como la de la barra. El `hidden` del saliente se pone al terminar (como `vistas.ts`). Con reduced motion o la pausa: instantáneo. El foco no espera a la animación. Pruebas 20 y 24 de `vistas-hinojosa`.

**Hecho (bloque 19, 2026-10-16; el trazo va en `.barra-letras::before`, un span que mide la palabra en peso normal):** en `src/components/Barra.astro`, el trazo del hover pasa a **todo el ancho del texto** (de la primera a la última letra, no 60 %) y a **400 ms** de entrada / **250 ms** de salida (antes 220 / 150). Revisa el `left: 0.13em` actual para que el trazo empiece y termine con las letras del texto normal centrado en la caja reservada en negrita. Pruebas 14, 15 y 22. Además, si el `tablist` Detalle / Lista de Productos necesita transición entre paneles, que sea solo opacidad ≤ 150 ms y condicionada (la pone `frontend`).

**Hecho (bloque 18, 2026-10-16):** **Hover de la barra (escritorio, bloque 18, 2026-10-16):** en los rótulos no activos aparece bajo el texto el **trazo de pincel maíz** de los h2 (`--trazo-pincel` de `global.css`, color `maiz`, alto `round(clamp(0.375rem, 0.9dvh, 0.5rem), 1px)`, −1°, ~60 % del ancho del texto, alineado a su izquierda). Se dibuja de izquierda a derecha con `clip-path: inset(0 100% 0 0)` → `inset(0)` en 220 ms (`--ease-vista`) y se recoge en 150 ms (`--ease-salida`). Solo `(hover: hover) and (pointer: fine)`; nunca en el activo (pastilla). Con reduced motion o la pausa, sin animación. Sustituye al fondo `hoja-claro`. Debe convivir con el ancho reservado en negrita (B1): el trazo va en un pseudo-elemento que no cambie el ancho del enlace (no usar el `::after` de `data-texto`). Archivo: `src/components/Barra.astro`. Verifica con las pruebas 14, 15 y 22 de `vistas-hinojosa`.

**Después del bloque 18:** nada propio. Si se vuelven a reestructurar vistas, revisa `VISTAS`, `dir`, los bloques `[data-entra]` y los disparadores de carga por vista (desde 2026-10-16 `#por-que` ya no es vista; antes arranca la entrada de iconos; `#nosotros`, el video).

## Reglas no negociables
- **Escribir en el buscador no gira el carrusel** (2026-10-16): solo elegir una sugerencia o llegar desde un animal de Nosotros.
- **Regla M5 del handoff:** en `#productos`, la tarjeta provisional del primer montaje se queda invisible bajo el anillo hasta la primera interacción o 1,5 s. Los fundidos de C1 **no** se aplican al primer montaje. Si lo rompes, Lighthouse móvil baja de 96 a 86.
- **El foco va al título antes de cualquier animación.** Ninguna animación retrasa el foco ni bloquea contenido.
- Toda animación y **toda transición CSS** nueva respeta `prefers-reduced-motion` **y** la pausa del sitio (`html[data-movimiento="pausado"]`). Ojo: hoy la pausa anula `animation` pero no `transition`.
- Solo `transform` y `opacity`, salvo anchos de elementos pequeños y aislados (pastilla, chip de precio).
- El carrusel **nunca gira solo**. **Excepción decidida por el usuario (2026-10-15):** Canela y el video de Nosotros van en bucle **sin botón de pausa** (riesgo 11 del plan, incumple WCAG 2.2.2); no vuelvas a añadirlo sin que lo pida. Cualquier otro bucle nuevo sí necesita control de pausa.
- Fuera de `#productos` no quedan tweens ni `requestAnimationFrame`: verifícalo con un contador, no lo supongas.

## Verificación
- Mide de verdad: muestreo de fotogramas con `requestAnimationFrame` (por CDP o Playwright) para comprobar que no hay destello entre vistas, que la barra no salta y que el rótulo y la fila coinciden con el producto al frente.
- Pruebas 13–17 de `vistas-hinojosa`.
- Lighthouse móvil en Inicio (≥ 99) y `#productos` (≥ 93) después de tocar el carrusel o Inicio.

## Skills
- `vistas-hinojosa`: **léela primero.** Contiene la especificación de la transición entre vistas y de la barra, y las pruebas.
- `motion-and-storytelling`: ritmo, anticipación y asentamiento.
- `performance-and-web-vitals`: impacto en LCP, CLS e INP.

## Documentación de librerías
GSAP 3.15 y Astro 7 son recientes: consulta Context7 antes de escribir API de memoria (requiere autorización en `/mcp`; si no está disponible, dilo y apóyate en el código existente).

## Entregable
Movimiento integrado con sus fallbacks, mediciones de fotogramas y de Lighthouse, y la lista de lo que no se pudo probar (Safari, Firefox).
