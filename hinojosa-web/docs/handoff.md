# Handoff: sitio web de Comercial Hinojosa

Última actualización: **2026-10-16**. Rama de trabajo: **`Ariel`**. **Desde el 2026-10-16 el usuario quiere trabajar solo en `Ariel` y no tocar `main`** (ni push, ni merge): `main` se quedó en el commit del 2026-10-15 (`35976cb`). Cada push a `main` dispara el workflow de GitHub Pages. Los commits de esta sesión están en `Ariel` local; **no se han subido** (`git push origin Ariel` cuando el usuario lo pida).

## Estado en una línea

**El sitio tiene 4 vistas** (Inicio · Productos · Nosotros · Visítanos) desde el 2026-10-16: Quiénes somos y Por qué elegirnos se unieron en **Nosotros**, Productos cambió el panel de la lista por una **ficha del producto** con buscador de sugerencias, y Visítanos ya publica **dirección, dos teléfonos y correo**. Quedan los textos del bloque 10, WhatsApp (bloque 11), los datos que faltan (ciudad, horario, enlace de Facebook, coordenadas) y el despliegue.

## Sesión del 2026-10-16

Commits en `Ariel` (sin subir): `0e86d50` (agentes, skills y plan alineados), `120eeae` (vista Nosotros), `39b18ad` (ficha de Productos) y el de los datos de contacto + documentación.

1. **Agentes, skills y plan alineados** con el estado real (listaban como pendiente trabajo ya hecho).
2. **Vista Nosotros** (`VistaNosotros.astro`, opción A "Canela presenta"): Canela jugando con alfa sobre un círculo crema-oscuro, antetítulo NOSOTROS + "Somos parte de tu familia", misión, **3 razones en propuesta** (`textos.nosotros.razones`, pendientes de aprobación) y banda bosque de animales que enlazan a Productos. Fuera de pantalla: Visión, valores, pilares, diferenciales. `VistaPorQue.astro` se borró; `#por-que` es el `id` del bloque de razones (los enlaces viejos funcionan). Barra con "Nosotros".
3. **Video con alfa regenerado** (`python nuevos_req.py video-alfa`): solo el tramo sentada, cuadros 1–69 en ida y vuelta (640 KB). En el salto del original la gorra se sale del cuadro; girar en el cuadro 80 hacía que la pata bajara y subiera de golpe. Safari/iOS muestra el póster (`data-alfa` en `video-vista.ts`). `--centro-canela: 65 %` centra a Canela en el círculo.
4. **Productos, ficha del producto** (opción 1 de 3): carrusel al 60 %; a la derecha buscador combobox con hasta 6 sugerencias (elegir gira el carrusel; **escribir ya no**), ficha kraft (precio, marca, presentación, categoría, "Para:", tabla de la tilapia, "¿Dónde comprarlo?") y "Ver todos los productos (37)", que abre la lista en un `<dialog>`. Móvil: pestañas en una fila sin recuento y "Ver detalle" abre la hoja de detalle. Sin JS la lista se ve en la página.
5. **Datos de contacto** (dados por el usuario): dirección **Av. del Chofer y Rubén Larson**, teléfonos **099 708 5015** y **098 928 1882**, correo **rubenhinojosa4@yahoo.es**, Facebook **@Comercial Hinojosa** (sin enlace). En `negocio.json` (`telefonos` es ahora una lista, `correo` es nuevo), Visítanos (un botón "Llamar" por número, correo con `mailto:`, icono `correo` nuevo) y JSON-LD (`telephone`, `contactPoint`, `email`, `addressCountry: EC`).
6. **Medido:** Lighthouse móvil Productos 97, Inicio 99, Nosotros 98 (100 en accesibilidad, buenas prácticas y SEO); axe 0 en Nosotros, Productos (y su lista) y Visítanos a 1440, 1366 y 360 px. **No** se repitió el cierre de QA completo.

7. **Bloque 18:** hover de la barra con el trazo de pincel maíz (sustituye al fondo hoja-claro) y ficha de Productos en verde bosque (`.tema-oscuro`).
8. **Bloque 19:** Productos sin botón de compra en la ficha (línea "Todos estos productos los encuentras en nuestro local · Cómo llegar ›" en el pie) y con pestañas **Detalle / Lista (N)** en lugar de la ventana "Ver todos" (ya no hay `<dialog>` de lista: `abrirLista`/`cerrarLista` se borraron; ahora `elegirPestana`, `abrirResultados`, `quitarFiltro`, `pintarLista` en `catalogo.ts`). En móvil no hay pestañas: la lista de la categoría va bajo el carrusel. Barra: trazo a toda la palabra (`.barra-letras`), 400/250 ms.
9. **Bloque 20:** ficha compacta sin scroll (selector Detalle | Lista dentro del cuadro, sin fila Categoría, Marca/Presentación lado a lado, proteína del tilapero en pastillas, notas en una línea) y transición entre pestañas (`cruzarPaneles()`, 140/260 ms, pastilla 240 ms). Los scripts de prueba `b20_*.js` del scratchpad no persisten entre sesiones.
10. **Flujo de trabajo pedido por el usuario:** cambios → `PLAN.md` → agentes y skills → aplicar con los agentes del proyecto → commit y push a `origin Ariel`.

### Decisiones del 2026-10-16
- Trabajar solo en `Ariel`; no tocar `main`.
- Unir Quiénes somos y Por qué en **Nosotros** (opción A de 3) con el nombre "Nosotros" en la barra.
- Productos: **opción 1, ficha del producto** (descartadas: escaparate a todo el ancho, lista aligerada).

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

## Sesión del 2026-10-15

1. **Bloque 14 implementado y verificado** (commit `e309cb9`), decisiones abajo.
2. **Arreglo de la franja de Canela** (commit `0e1657f`): al quitar el botón de pausa se perdió el cierre `*/` de un comentario CSS en `VistaInicio.astro` y las reglas de `.canela-cruce` quedaban comentadas (Canela sentada y la franja se veían mal). Corregido y comprobado a 1440 y 360 px. **Ojo al editar CSS con agentes:** revisar que los comentarios queden cerrados.
3. **Texto no seleccionable: probado y revertido.** Se añadió `user-select: none` global (commit `7f37ec6`) y el usuario pidió volver atrás (commit `1e4de8e`, `git revert`). El texto vuelve a ser seleccionable. Si se retoma, lo recomendado es dar a la selección los colores de la marca con `::selection` y bloquearla solo en controles (botones, barra, pestañas, carrusel), no en el contenido.
4. **Paso a `main`:** `main` = `Ariel`. La acción de despliegue de GitHub Pages se dispara con cada push a `main` y **falla** (el workflow sigue subiendo `sitio-web/`, que no existe): GitHub Pages sigue mostrando la versión vieja. Arreglarlo es tarea del agente `despliegue`.

### Decisiones del 2026-10-15 (bloque 14)

- **Quitar los botones de pausa** de Canela (Inicio) y del video (Quiénes somos), sin reemplazo. ⚠️ Incumple WCAG 2.2.2: riesgo 11 del plan.
- **Iconos en los botones de Inicio:** pin de ubicación en "Cómo llegar" y costal en "Ver productos". Los accesos por categoría, sin icono.
- **Nuevo orden de la barra:** Inicio · Productos · Quiénes somos · Por qué elegirnos · Visítanos (también HTML, router, flechas y transiciones). Las vistas ahora buscan su etiqueta por `id` en `textos.navegacion`, no por posición.
- **Pausa guardada:** como ya no hay botón, `Layout.astro` borra `localStorage['hinojosa-movimiento']` al arrancar para que nadie quede con la pausa activada para siempre.

## Decisiones pendientes del usuario

1. **Textos de las 3 razones de Nosotros** (en propuesta) y los títulos de Productos ("Lo que tenemos para tus animales") y del bloque 10.
2. **Datos que faltan:** ciudad, **cuál de los dos teléfonos tiene WhatsApp** (si alguno), horario, **enlace de Facebook** (la URL de "@Comercial Hinojosa"), Google Maps y coordenadas, referencias para llegar, año de apertura o una línea de historia.
3. **Visítanos y Productos** fuera del reparto 55/30/15: falta medir de nuevo Productos (cambió) y Nosotros.
4. **Para la dueña:** casos dudosos del campo `animales` (melaza, sal, maíz, trigo, arrocillo, afrecho, semillas, comedero doble), unidad de "Desde $1.00" en Pro-Can.

## Mejoras menores abiertas (de `qa-informe.md`)
M-5 unidad de precio · M-6 "Mascotas" repetido en Inicio · M-8 con 5 productos los laterales del anillo tapan el frente · M-9 halo verdoso del bebedero. Ninguna bloquea. (M-7 y M-11 dejan de aplicar: Nosotros ya no tiene caja gris y escribir ya no gira el carrusel.)

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

1. Que el usuario apruebe (o cambie) las 3 razones de Nosotros y dé los datos que faltan (sobre todo WhatsApp, enlace de Facebook, ciudad y horario).
2. Repetir el cierre de QA completo (`qa-rendimiento`) tras los bloques 14–17.
3. Medir el reparto de color de Nosotros y Productos y llevar las dos vistas nuevas a `docs/guia-estilo.md` (`direccion-arte`).
4. Bloques 10 y 11 cuando lleguen textos aprobados y WhatsApp.
5. Despliegue (agente `despliegue`) cuando estén los datos; antes, decidir cómo publicar sin tocar `main` o con permiso del usuario.
6. Pruebas manuales que no se pueden hacer aquí: Safari iOS (sobre todo el video de Nosotros), Firefox y lector de pantalla real.

## Pendiente del usuario o de la dueña

- **Usuario:** aprobar los textos de títulos y las 3 razones de Nosotros.
- **Dueña:** ciudad, cuál número tiene WhatsApp, horario, enlace de Facebook, Google Maps/coordenadas, referencias; año de apertura o una línea de historia; foto del local, la fachada o el equipo; logo vectorial; 21 precios sin dato; derechos de uso de los renders. (Ya dados el 2026-10-16: dirección, teléfonos, correo y el nombre de Facebook.)

## Cuidado al implementar (no romper lo que ya funciona)

- **Regla M5:** en `#productos`, la tarjeta provisional del primer montaje del carrusel debe quedarse invisible bajo el anillo hasta la primera interacción o 1,5 s. Los fundidos nuevos (C1) no se aplican al primer montaje; si se rompe, Lighthouse móvil baja de 93–97 a 86.
- **El logo debe seguir siendo el LCP de Inicio** al añadir la vitrina y los sprites de Canela.
- **La pausa del sitio** (`html[data-movimiento="pausado"]`) hoy anula `animation` pero **no** `transition`: toda transición nueva debe condicionarse.
- **`vistas.ts` debe devolver una `Promise`**: hoy no lo hace y por eso se ve el fondo crema entre vistas.
- **Nunca mostrar `PENDIENTE_CONFIRMAR` en pantalla**; vive solo en `negocio.json`.
- **El video de Nosotros depende de su encuadre:** si se regenera con otro tramo, recalcular `--centro-canela` (centro de Canela en el video) en `VistaNosotros.astro`.
- **Productos:** el texto del buscador ya no gira el carrusel; solo elegir una sugerencia o llegar desde un animal de Nosotros (`abrirAnimal`). La lista completa vive en un `<dialog>` que sin JS se pinta en la página: no lo conviertas en algo que se genere por JS.
- **Heredocs en Bash:** en esta máquina algunos `<<'EOF'` con comillas o caracteres especiales fallan ("unexpected EOF"); escribir el script en un archivo del scratchpad y ejecutarlo.
- **Imágenes con IA:** nunca pedir "fondo transparente" (pintan un damero); pedir un color plano. Al quitar fondos a mano, guardar en PNG (en JPG la transparencia pasa a blanco).
- **Productos blancos sobre blanco:** recortar con `quitar_fondo_blanco`, no con `quitar_fondo_liso` (este vacía el sombreado neutro creyendo que es sombra).
- Para regenerar un solo producto sin recodificar todo, ver cómo se hizo con el bebedero: `nr.maestros(tmp)`, filtrar los trabajos por nombre y `nr.codificar(seleccion, tmp)`.

## Bloqueantes para publicar (sin cambios)

1. Datos que faltan en `negocio.json` con `confirmado: true`: ciudad, horario, WhatsApp, enlace de Facebook, coordenadas (dirección, teléfonos y correo ya están).
2. **Despliegue roto:** `.github/workflows/deploy-pages.yml` sube `sitio-web/`, que ya no existe. Hay que compilar `hinojosa-web/` y subir `hinojosa-web/dist`, definir `site` (y `base` si no hay dominio propio) y descomentar `Sitemap:` en `public/robots.txt`. Le corresponde al agente `despliegue`.

## Cómo arrancar

```
cd hinojosa-web
npm install
npm run dev        # http://localhost:4321
npm run build && npx astro check
```
