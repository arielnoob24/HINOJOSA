# Handoff: sitio web de Comercial Hinojosa

Última actualización: **2026-10-14**. Rama de trabajo: **`Ariel`** (al día con `main` + la sesión de auditoría; subida a `origin/Ariel`). `main` es la rama de publicación: no se toca sin pull request.

## Estado en una línea

El sitio por vistas está **construido y verificado**, y ya hay una **auditoría de UI/UX/movimiento con todas las decisiones tomadas** (`PLAN.md` §0-B). **Todavía no se ha aplicado ningún cambio de la auditoría al código**: lo siguiente es implementar la **fase 5-B** del plan por bloques.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Plan que rige (orden de precedencia: §0-B → §0 → resto) | `PLAN.md` (raíz) |
| Auditoría completa, con códigos I/N/P/Q/V/G/T/B/C por hallazgo | `auditoria.md` (raíz) |
| Capturas "antes" de la auditoría (1440×900, 360×640, flujos) | `hinojosa-web/capturas/auditoria/` |
| Prompts de Google Flow, primer cuadro de Canela y el video generado | `flow/` (raíz) |
| Proyecto Astro | `hinojosa-web/` (Astro 7.3.8, Tailwind 4, GSAP 3.15 en diferido, Leaflet 1.9.4) |
| Originales del cliente (no se modifican) | `Nuevos Req/` (raíz) |
| Generación de derivados | `hinojosa-web/scripts-activos/nuevos_req.py` (+ `comun.py`) |
| Agentes del proyecto (puestos al día en esta sesión) | `.claude/agents/` |
| Skills del proyecto | `.claude/skills/marca-hinojosa` (paleta, contrastes, sistema visual, colores aprobados) y `.claude/skills/vistas-hinojosa` (router, transición entre vistas, barra, 18 pruebas) |

## Qué se hizo en la sesión del 2026-10-13 / 14

1. **Pull de `main` a `Ariel`** (commits `b89aa60`, `8e7d444`, `f76254f`) y `npm install` (salieron `three` y `lenis`, entró `leaflet`).
2. **Auditoría** con tres agentes (dirección de arte, QA/UX con Playwright, animación con medición por fotogramas) → `auditoria.md`.
3. **Decisiones del usuario** (todas en `PLAN.md` §0-B):
   - **Inicio:** vitrina lateral (2 costales a cada lado del bloque central, ≥ 64rem), acento manuscrito **"Tu mejor aliado para tus animales"** (el lema ya va dentro del logo), botón **"Cómo llegar"**, accesos por categoría, fila de animales. Se descartó el hero partido.
   - **Canela en Inicio:** **carrera real de borde a borde**: aparece sentada como en `Canela.png`, se levanta, corre a la izquierda hasta el borde, frena y gira, corre a la derecha, frena y gira, en bucle. Solo se sienta al principio. Franja inferior, mismo tamaño que hoy, igual en móvil.
   - **Transición entre vistas:** fundido cruzado direccional en dos capas (saliente 160 ms, entrante 380 ms con 60 ms de retraso) **+ entrada escalonada** de 2–3 bloques. Especificación exacta en `vistas-hinojosa`.
   - **Navegación:** **solo barra y teclado**. Descartados: rueda, deslizamiento, enlaces "Siguiente →" y los CTA al final de Nosotros y Por qué.
   - **Barra:** ancho reservado en negrita, pastilla con estiramiento direccional, hover, pulsación, pop del icono en móvil.
   - **Carrusel:** transiciones C1–C8 (caché/precarga/fundido de imágenes, rótulo direccional, chip de precio, fila sincronizada, cambio de categoría con medio giro…).
   - **Títulos:** sistema antetítulo + h2, aprobado en principio. **Textos propuestos aún sin aprobar:** "Calidad, confianza y compromiso" (Nosotros), "Lo que tenemos para tus animales" (Productos), "Siempre a tu lado" (Por qué).
   - **Quiénes somos:** "Visión" → "Nuestra historia" cuando la dueña dé el dato.
   - **Productos en móvil:** hoja de detalle (`<dialog>`) al tocar una fila y buscador encima del carrusel.
   - **Colores (aprobados 2026-10-14):** la paleta del logo no cambia; cambia el reparto. Vistas claras **55 % crema · 30 % verde · 15 % oro + canela**, superficies `crema-oscuro`/`hoja-claro` en vez de tarjetas blancas sobre crema, una banda `bosque` por vista clara, **trazo de pincel maíz bajo los h2**, **bandas canela oscuro** `#8A5A1F`, tono nuevo **kraft `#E3CFA6`** (`--color-kraft`, contrastes en la skill).
4. **Plan reescrito** sin lo obsoleto (Three.js, `.glb`, Lottie, Lenis, 10 categorías, ruleta de costales) y con la **fase 5-B** (bloques 1–13 + 4-B + cierre de QA).
5. **Agentes y skills** puestos al día con todo lo anterior.
6. **Video de Canela** generado por el usuario en Google Flow y revisado: `flow/Puppy_running_in_place_1080p_20261013235908.mp4`.
7. **Bebedero:** se intentó quitar el damero pintado por código y **no es fiable**; el usuario lo rehará con IA.
8. Commit `3168635` subido a `origin/Ariel`.

## Video de Canela: lo que hay que saber para procesarlo

- 1920×1080, 24 fps, 10 s, con audio (se descarta). Corre **en el sitio y centrada**.
- Tramos: **0–0,8 s** sentada de frente · **1,0–1,9 s** se levanta y gira a la izquierda · **2,0–4,8 s** carrera a la izquierda · **~4,9–5,4 s** frena y gira · **5,5–10 s** carrera a la derecha.
- Usar la **carrera nativa a la derecha**; no espejar el ciclo (el texto "HINOJOSA" de la gorra saldría al revés). Falta un giro derecha → izquierda: espejar el giro o reproducirlo al revés, decidir al verlo.
- **Fondo:** no es el azul plano pedido, sino azul medio (~`#2B73AA`) con viñeta y sombra de suelo. Recortar con `modelo_fondo` de `nuevos_req.py` + quitar el tinte azul del borde del pelaje. La sombra se descarta (el sitio pone la suya).
- Salida: **sprite sheets WebP** (~12 fps, altura de franja ×2, ≤ 450 kB los tres), cargados **después de `load`** para que el logo siga siendo el LCP.
- La página hace el bucle con una máquina de estados `sentada → arranque → corre(dir) → giro → corre(−dir)…` comparando `x` con `0` y `anchoFranja − anchoCanela` en cada fotograma. Prueba 18 de `vistas-hinojosa`.

## Herramientas en este equipo

- **ffmpeg no está en el PATH.** Se instaló el paquete de Python `imageio-ffmpeg` (2026-10-14). Ruta del binario: `python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`.
- Python 3.14 con Pillow y numpy; **sin scipy** (usar las utilidades de `scripts-activos/comun.py`: `flood_desde_bordes`, `dilatar`).
- Playwright (Chromium) vía caché de `npx`; axe-core en `devDependencies`.
- En Git Bash, las rutas `/c/...` dentro de código Python entre comillas **no** se convierten: pasar rutas de Windows (`C:\...`) a los scripts.
- Servidor de desarrollo: `cd hinojosa-web && npm run dev` → http://localhost:4321 (comprobar antes si ya hay uno: `npx astro dev status`).

## Lo siguiente (fase 5-B, orden del plan)

| Bloque | Qué | ¿Bloqueado? |
|---|---|---|
| 1 | Visítanos: quitar `PENDIENTE_CONFIRMAR` de la pantalla, contactos pendientes en una línea, texto y fondo del mapa vacío | No |
| 2 | Transición entre vistas en dos capas + entrada escalonada | No |
| 3 | Carrusel C1–C4 | No |
| 4 | Inicio: vitrina, acento, "Cómo llegar", accesos, animales, fondo, entrada | No |
| 4-B | Canela corriendo (procesar video → sprites → máquina de estados) | No (video recibido) |
| 5 | Buscador con campo `animales` y normalización, recuentos | Casos dudosos de `animales` a la dueña |
| 6 | Barra B1–B4 | No |
| 7 | Quiénes somos (video sin cortar la gorra, banda de valores) | No |
| 8 | Productos en móvil: hoja de detalle | No |
| 9 | Carrusel C5–C8, bebedero, tamaños | Bebedero: falta la imagen |
| 10 | Títulos, diferenciales, marcas, pilares | **Sí:** textos por aprobar |
| 11 | "Preguntar por este producto", contacto en la barra | **Sí:** WhatsApp de la dueña |
| 12 | Pulidos | No |
| 13 | Reparto del color | No (aprobado) |
| Cierre | Lighthouse móvil (Inicio ≥ 99, Productos ≥ 93), router 41/41 + pruebas 13–18, axe 0, capturas después | — |

Al último aviso del 2026-10-14 se le propuso al usuario empezar por los bloques 1 → 2 → 3 y luego Inicio con Canela; **no ha elegido todavía** si empezar por ahí o por Canela.

## Pendiente del usuario o de la dueña

- **Usuario:** bebedero sin damero → `flow/bebedero-nuevo.png` (recorte con IA en PNG con alfa, o regenerado sobre verde croma `#00B140`; prompt en `flow/PROMPTS.md`). Aprobar los textos de títulos y los de Por qué marcados 🔒.
- **Dueña:** dirección, ciudad, coordenadas, referencias, teléfono/WhatsApp, horario, Facebook; año de apertura o una línea de historia; foto del local, la fachada o el equipo; logo vectorial; 21 precios sin dato; derechos de uso de los renders.

## Cuidado al implementar (no romper lo que ya funciona)

- **Regla M5:** en `#productos`, la tarjeta provisional del primer montaje del carrusel debe quedarse invisible bajo el anillo hasta la primera interacción o 1,5 s. Los fundidos nuevos (C1) no se aplican al primer montaje; si se rompe, Lighthouse móvil baja de 93–97 a 86.
- **El logo debe seguir siendo el LCP de Inicio** al añadir la vitrina y los sprites de Canela.
- **La pausa del sitio** (`html[data-movimiento="pausado"]`) hoy anula `animation` pero **no** `transition`: toda transición nueva debe condicionarse.
- **`vistas.ts` debe devolver una `Promise`**: hoy no lo hace y por eso se ve el fondo crema entre vistas.
- **Nunca mostrar `PENDIENTE_CONFIRMAR` en pantalla**; vive solo en `negocio.json`.
- **Imágenes con IA:** nunca pedir "fondo transparente" (pintan un damero); pedir un color plano.

## Bloqueantes para publicar (sin cambios)

1. Datos de la dueña (contacto, ubicación, horario) en `negocio.json` con `confirmado: true`.
2. **Despliegue roto:** `.github/workflows/deploy-pages.yml` sube `sitio-web/`, que ya no existe. Hay que compilar `hinojosa-web/` y subir `hinojosa-web/dist`, definir `site` (y `base` si no hay dominio propio) y descomentar `Sitemap:` en `public/robots.txt`. Le corresponde al agente `despliegue`.

## Cómo arrancar

```
cd hinojosa-web
npm install
npm run dev        # http://localhost:4321
npm run build && npx astro check
```
