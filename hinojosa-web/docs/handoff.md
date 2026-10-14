# Handoff: sitio web de Comercial Hinojosa

Última actualización: **2026-10-14**. Rama de trabajo: **`Ariel`** (al día con `main` + auditoría + fase 5-B; subida a `origin/Ariel`). `main` es la rama de publicación: no se toca sin pull request.

## Estado en una línea

**La fase 5-B está implementada y verificada** (2026-10-14): bloques 1–9, 12, 13 y 4-B, con cierre de QA (`docs/qa-informe.md`). Solo quedan los bloques **10** (textos de títulos, pilares y diferenciales: los aprueba el usuario/la dueña) y **11** (botón "Preguntar" con WhatsApp: falta el número), más los bloqueantes de publicación (datos de la dueña y despliegue).

## Resultado de la fase 5-B (2026-10-14)

| Qué | Resultado |
|---|---|
| Lighthouse móvil | Inicio **99/99/99** (LCP = logo), `#productos` **96** (LCP = tarjeta provisional, regla M5) |
| Lighthouse escritorio | 100 en Inicio y Productos; Accesibilidad, Buenas prácticas y SEO 100 en todo |
| Router | Pruebas 1–18 de `vistas-hinojosa` pasan en 1440×900, 1366×650, 390×844 y 360×640 |
| axe-core | 0 violaciones en las 5 vistas a 1440 y 360 |
| Peso de Inicio (móvil) | 340 KiB (sprites de Canela de 160 px tras `load`) |
| `PENDIENTE_CONFIRMAR` visible | 0 |

**Qué hay nuevo en el código** (commits `e2fab62` → último de la rama):
- **Visítanos:** sin marcadores; contactos pendientes en una línea; mapa vacío con textura y aviso; tarjeta bosque.
- **Quiénes somos:** video con `contain`; valores en una banda (una columna < 360 px); Misión en banda canela oscuro.
- **Productos:** buscador por animal con sinónimos (`src/lib/busqueda.ts`); recuentos "N de TOTAL"; atajos sin resultados; hoja de detalle móvil (`HojaDetalle.astro`, `hoja-detalle.ts`); carrusel C1–C8 con caché, rótulo direccional, fila sincronizada, cambio de categoría con medio giro; costal genérico para productos sin foto; frente más grande y miniaturas de 48 px.
- **Inicio:** vitrina de 4 costales, acento "Tu mejor aliado para tus animales", "Cómo llegar", accesos por categoría (`data-abrir-categoria`), fila de animales, fondo con trébol; **Canela corriendo de borde a borde** (`src/lib/animacion/canela-carrera.ts`, sprites en `public/img/canela/carrera*`, juegos de 320 y 160 px).
- **Por qué:** título arriba, sellos de costal, animales como enlaces (`data-abrir-animal`), bandas bosque y canela.
- **Transversal:** transición entre vistas en dos capas + entrada escalonada; barra con ancho reservado, estiramiento y pop; la pausa anula también transiciones; reparto del color 55/30/15 con kraft (`--color-kraft`), `.tema-canela` y trazo de pincel maíz bajo los h2.

## Decisiones pendientes del usuario (planteadas el 2026-10-14)

1. **Canela en el borde derecho:** hoy se detiene **antes del botón de pausa** (para que no le tape la cara al girar); acorta el recorrido en móvil (~275 → ~212 px). Alternativa: que pase por detrás del botón (se cambia en `medir()` de `canela-carrera.ts`, bloque `botonPausa`).
2. **Quiénes somos fuera del 55/30/15** (mide 68/21/11): a) video con alfa sobre crema-oscuro (necesita detección de Safari en `video-vista.ts`) o b) más alto a la banda bosque o a la de valores.
3. **Visítanos y Productos** quedan como excepción al reparto (79/17/4 y 74/26/0) salvo que se apruebe el panel bosque a toda altura en Visítanos (guía §2.2/§15).
4. **Textos del bloque 10:** títulos ("Calidad, confianza y compromiso", "Lo que tenemos para tus animales", "Siempre a tu lado"), pilares y diferenciales.
5. **Para la dueña:** casos dudosos del campo `animales` (melaza, sal, maíz, trigo, arrocillo, afrecho, semillas, comedero doble), unidad de "Desde $1.00" en Pro-Can, y todos los datos de contacto.

## Mejoras menores abiertas (de `qa-informe.md`)
M-5 unidad de precio · M-6 "Mascotas" repetido en Inicio · M-7 rectángulo gris del video en Nosotros a 360 · M-8 con 5 productos los laterales del anillo tapan el frente · M-9 halo verdoso del bebedero · M-11 el carrusel tarda en seguir a la búsqueda. Ninguna bloquea.

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
7. **Bebedero: resuelto.** El damero pintado no se podía quitar por código. El usuario le quitó el fondo en Paint y lo guardó en JPG (`Nuevos Req/CatalogoF/Comederos y Bebederos/bebedero_quitado_disque.jpg`, sobre blanco puro). `scripts-activos/nuevos_req.py` ahora lo usa en lugar de `bebedero.png` (tabla `REEMPLAZOS`) y lo recorta con la función nueva `quitar_fondo_blanco`. Se regeneraron solo `public/img/productos/comederos/bebedero*` (ya transparentes) y se quitó `conFondo` del producto `bebedero-aves` en `productos.json`. Comprobado con captura en `#productos`. **Es el único cambio de código del sitio en esta sesión.**
8. Commits en `origin/Ariel`: `3168635` (auditoría, plan, agentes, skills, `flow/`), `9ba2526` (handoff) y el del bebedero.

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

## Lo siguiente

1. Decisiones pendientes (arriba).
2. Bloques 10 y 11 cuando lleguen textos aprobados y WhatsApp.
3. Despliegue (agente `despliegue`) cuando estén los datos de la dueña.
4. Pruebas manuales que no se pueden hacer aquí: Safari iOS, Firefox y lector de pantalla real.

## Pendiente del usuario o de la dueña

- **Usuario:** aprobar los textos de títulos y los de Por qué marcados 🔒. Decidir por dónde empezar la fase 5-B.
- **Dueña:** dirección, ciudad, coordenadas, referencias, teléfono/WhatsApp, horario, Facebook; año de apertura o una línea de historia; foto del local, la fachada o el equipo; logo vectorial; 21 precios sin dato; derechos de uso de los renders.

## Cuidado al implementar (no romper lo que ya funciona)

- **Regla M5:** en `#productos`, la tarjeta provisional del primer montaje del carrusel debe quedarse invisible bajo el anillo hasta la primera interacción o 1,5 s. Los fundidos nuevos (C1) no se aplican al primer montaje; si se rompe, Lighthouse móvil baja de 93–97 a 86.
- **El logo debe seguir siendo el LCP de Inicio** al añadir la vitrina y los sprites de Canela.
- **La pausa del sitio** (`html[data-movimiento="pausado"]`) hoy anula `animation` pero **no** `transition`: toda transición nueva debe condicionarse.
- **`vistas.ts` debe devolver una `Promise`**: hoy no lo hace y por eso se ve el fondo crema entre vistas.
- **Nunca mostrar `PENDIENTE_CONFIRMAR` en pantalla**; vive solo en `negocio.json`.
- **Imágenes con IA:** nunca pedir "fondo transparente" (pintan un damero); pedir un color plano. Al quitar fondos a mano, guardar en PNG (en JPG la transparencia pasa a blanco).
- **Productos blancos sobre blanco:** recortar con `quitar_fondo_blanco`, no con `quitar_fondo_liso` (este vacía el sombreado neutro creyendo que es sombra).
- Para regenerar un solo producto sin recodificar todo, ver cómo se hizo con el bebedero: `nr.maestros(tmp)`, filtrar los trabajos por nombre y `nr.codificar(seleccion, tmp)`.

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
