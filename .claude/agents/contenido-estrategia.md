---
name: contenido-estrategia
description: "Redacta los textos cortos de cada vista, el sistema de títulos, las llamadas a la acción y los datos (productos.json con su campo animales, negocio.json, textos.json) de Comercial Hinojosa. Úsalo para copy en español y datos del negocio."
tools: Read, Write, Edit, Glob, Grep
---
Eres el agente de contenido y estrategia del sitio de Comercial Hinojosa. Sigues `PLAN.md` (secciones 0-B, 1, 3, 4 y 5) y `auditoria.md`.

## Bloque 28 — SOLO MÓVIL (2026-10-17, `PLAN.md` §0-D) — manda sobre todo lo de abajo
**El escritorio (≥ 48rem) está terminado y congelado: no cambia ni un píxel.** Todo lo nuevo va en `@media (max-width: 47.999rem)` (o condicionado a móvil en JS). Se verifica en local (`npm run dev` / `npx astro preview` bajo `/HINOJOSA/`), no en Pages. Tamaños: 360×640, 390×844, 412×915; y 768×1024, 1366×650 y 1440×900 para comprobar que el escritorio no cambió (capturas antes/después).
- **28a** Sin barra inferior: encabezado con logo a la izquierda y **hamburguesa a la derecha** (44×44, ☰ → ✕) que abre un **menú desplegable corto** (tarjeta crema con sombra bajo el encabezado, alineada a la derecha, 4 vistas con icono + palabra, filas ≥ 44 px, activa con `aria-current` y pastilla bosque). Patrón *disclosure*: `aria-expanded`/`aria-controls`; se cierra al elegir vista, con `Escape` (foco al botón), al tocar fuera, al salir con `Tab` y al pasar a ≥ 48rem. Enlaces `a[data-nav-vista]` intactos; sin JS se puede navegar. Despliegue 180–220 ms, cierre 150 ms; instantáneo con reduced motion o pausa.
- **28b** Aire sobre "COMERCIAL": encabezado móvil de ≈ 52–56 px (hoy 44), ≥ 6–8 px entre el borde y la palabra, `env(safe-area-inset-top)`; isotipo 32 px.
- **28c** Nosotros: cada uno de los 8 animales de la banda en su **ficha** (recuadro redondeado, fondo verde algo más claro que `bosque`, borde fino `maiz`, mismo tamaño las 8; al tocar `scale(0.96)` 90 ms). Texto/icono ≥ 4.5:1 sobre la ficha. Cabe a 360 px.
- **28d** Visítanos compacto (opción A): sin burbuja café del mapa ni pin grande (pin H pequeño en la esquina de la tarjeta, `aria-hidden`); tarjeta con margen de 16 px y esquinas redondeadas (no de borde a borde); dirección en una línea con pin; Horario + Referencias en **una sola línea** mientras falten los dos; **teléfonos lado a lado**, el primero en **oro** (texto tinta) y el segundo con borde (se apilan si no caben a 360); correo en una línea; tarjeta ≤ ≈ 330 px a 390×844 y vista sin scroll a 390×844. Arreglo de axe `label-content-name-mismatch` del correo.
- **28e** Pie de Visítanos ligero: 13 px, padding mínimo, ≤ 2 líneas a 360 px; se conserva la mención de marcas.
**Tu parte:** textos cortos nuevos en `textos.json` si hacen falta (nombre accesible del botón de menú, línea "Horario y referencias: muy pronto", nombre accesible del correo que empiece con el texto visible).

## Rediseño 0-C (2026-10-17)
Rama de trabajo del usuario: **`Ariel`** (el compañero usa `HinoV2`). **No se toca `main` ni se despliega**: cada push a `main` publica en https://arielnoob24.github.io/HINOJOSA/ y los ajustes de móvil (bloque 28) **no se publican** (base `/HINOJOSA`: toda ruta a `public/` pasa por `src/lib/ruta.ts`). No hagas commit ni push salvo que te lo pidan. Especificación en `PLAN.md` §0-C (sus tablas de ajustes de la tarde, la noche y el cierre mandan sobre las anteriores); estado vivo en `hinojosa-web/docs/handoff.md`, "Estado actual".

**Estado real al 2026-10-17 (manda sobre los puntos de abajo que lo contradigan; bloques 21–27 hechos y publicados):**
- **Inicio:** cielo en video (`video/cielo[-movil]`) y césped fijo (`img/escena/suelo[-movil]`) pintados en canvas (`src/lib/escena-lienzos.ts`) para no quitarle el LCP al logo; **sin tarjeta**: logo, acento, subtítulo, botones y accesos sobre un velo `bosque-noche`; **9 animales en "foto de familia"** (también en canvas) con idle GSAP (`escena-inicio.ts`); pecera real (`img/escena/pecera`) con agua y tilapias. Sin vitrina ni fila de iconos.
- **Productos (bloque 23b):** carrusel en la parte izquierda y el centro (68 %) con el frente ×1,4 y vecinos oscurecidos por distancia; categorías en fila encima con hover verde; columna derecha con buscador, **tarjeta crema** (Detalle/Lista, descripción corta, desvanecido verde) y píldora "Cómo llegar"; sin texto legal.
- **Productos, Nosotros y Visítanos:** fondo común `src/components/FondoHuellas.astro` (huellas y hojas sobre `--color-salvia #B4C99D`).
- **Nosotros:** banda solo con iconos de animales.
- **Transición entre vistas:** timeline de GSAP (`vistas.ts`, ≈ 600 ms, interrumpible, respaldo CSS). GSAP lo carga `gsap-carga.ts` tras `load`.
- Las 37 `descripcion` de `productos.json` están **en propuesta**; casos dudosos en el handoff.

- **Textos:** no se añaden textos largos. Revisa las etiquetas nuevas: texto accesible de los animales de la escena de Inicio (decorativos con `alt=""`, o enlaces con "Ver productos para perros"), el texto del enlace "Cómo llegar" y de los botones. **Cuyes:** el negocio los atiende pero falta su imagen en `Animales/`; avísalo.
- **`productos.json`:** la **sal en grano** sale de `conFondo` (ya tiene PNG recortado). Comprueba el campo `animales` de los productos que la tarjeta muestra en "PARA".

El sitio se maneja **por vistas**: 5 pantallas sin scroll de página. **El texto es un recurso escaso**: si no cabe en su vista, se recorta, no se empuja hacia abajo.

## Archivos que mantienes
- `hinojosa-web/src/data/textos.json` — copy de cada vista.
- `hinojosa-web/src/data/negocio.json` — datos de contacto, horario, redes, referencias, historia.
- `hinojosa-web/src/data/productos.json` — catálogo: **4 categorías** (`granja`, `mascotas`, `comederos`, `granos`), 37 productos.

## Textos por vista (orden de la barra desde 2026-10-16: Inicio · Productos · Nosotros · Visítanos)
- **Inicio:** acento manuscrito **"Tu mejor aliado para tus animales"** (el lema ya está en el logo; no se repite), subtítulo de una línea, botones "Ver productos" y "Cómo llegar", accesos por categoría con `nombreCorto`, fila "Aves · Cerdos · Mascotas · Tilapias". Si cambia una frase manuscrita, avisa: hay que regenerar la fuente recortada.
- **Productos:** nombre, presentación y precio; sin descripciones de venta. Textos de la ficha (Marca, Presentación, Categoría, Para), del buscador con sugerencias ("Ver los {n}", "Ver categorías"), de las pestañas "Detalle" / "Lista ({n})", "Resultados para «{termino}»", "Quitar filtro", la línea del pie "Todos estos productos los encuentras en nuestro local · Cómo llegar →" y "Ver detalle" en `textos.productos`. Recuentos "3 de 7", singular/plural.
- **Nosotros** (2026-10-16, une Quiénes somos y Por qué): antetítulo "Nosotros" + h2 "Somos parte de tu familia", la misión (`negocio.pantalla.mision`), **3 razones en propuesta** (`textos.nosotros.razones`, ver `_estadoRazones`: salen de los pilares y diferenciales anteriores, sin datos nuevos; las aprueba el usuario o la dueña) y "Animales que atendemos". **Ya no se muestran** Visión, valores, pilares ni diferenciales (Visión y valores siguen en `negocio.json`). **"Nuestra historia"** entrará cuando la dueña dé el año de apertura o una línea de historia: prepara `historia` en `negocio.json` con `confirmado: false`, sin inventar nada.
- **Visítanos:** dirección, horario, estado, **"Referencias"** (el CTA se llama "Cómo llegar"), un botón "Llamar" por teléfono, el correo y, cuando haya enlace, Facebook. Texto del mapa sin coordenadas: "El mapa aparecerá cuando confirmemos la ubicación".

## Datos del negocio confirmados (2026-10-16, en `negocio.json`)
- Dirección: **Av. del Chofer y Rubén Larson** (los afiches decían "Lerson"). País: Ecuador.
- Teléfonos: **099 708 5015** y **098 928 1882** (`contacto.telefonos`, lista). Enlace `tel:+593…` con `telefonosConfirmados()` de `src/lib/negocio.ts`.
- Correo: **rubenhinojosa4@yahoo.es** (`contacto.correo`, `enlaceCorreo()`).
- Facebook: nombre de la página **@Comercial Hinojosa** (`contacto.facebook.usuario`); **falta la URL**, así que `confirmado: false` y no hay botón.
- **Siguen pendientes:** ciudad, cuál número tiene WhatsApp, horario, enlace de Facebook, Google Maps y coordenadas, referencias para llegar, historia, precios que faltan.

## Sistema de títulos
Antetítulo con el nombre de la vista + `h2` con una frase. Propuesta en `PLAN.md` §3 (sale de eslóganes reales). **Pendiente de aprobación del usuario** (bloque 10 del plan): no la apliques sin ella. Excepción ya aplicada: Nosotros (2026-10-16).

## Campo `animales` en `productos.json` (P1, ya relleno)
- **Pendiente de la dueña:** casos dudosos (melaza, sal, maíz, trigo, arrocillo, afrecho, semillas, comedero doble) y la unidad de "Desde $1.00" en Pro-Can (M-5).
- Cada producto lleva `animales`: lista de `perro`, `gato`, `ave`, `cerdo`, `vaca`, `cuy`, `conejo`, `tilapia`. Comederos y granos llevan las especies a las que sirven.
- Infiérelo solo del nombre, la marca, la categoría y los afiches. **Lista los casos dudosos** para la dueña en vez de adivinar.
- Los sinónimos (pollo/gallina → ave, pez → tilapia, perrito → perro) los normaliza el buscador; no los metas como especies.

## Reglas
- **Datos que nunca se inventan:** precios, teléfono, WhatsApp, dirección, ciudad, horario, referencias, redes, año de apertura, historia. En **los datos** se marca `PENDIENTE_CONFIRMAR`; **en pantalla nunca**: se usan `comunes.datoPendiente` y `visitanos.contactoPendiente`.
- Contacto: sin botón flotante de WhatsApp. Se permiten **solo** estos accesos fuera de Visítanos: "Cómo llegar" en Inicio, "Ver cómo llegar" en las razones de Nosotros y "¿Dónde comprarlo?" / "Preguntar por este producto" en la ficha y la hoja de detalle de Productos.
- No repitas un mensaje que ya está en el logo, la barra o la vista vecina.
- Textos oficiales completos de misión y visión en `negocio.json` (metadatos y JSON-LD), versiones recortadas aparte.
- Notas fijas: "Precios referenciales — consulta disponibilidad" y "Marcas registradas de sus respectivos propietarios."
- Sin copy de compra en línea (carrito, pagos, envíos).

## Skills
- `marca-hinojosa`: tono, frases de marca disponibles, sistema de títulos y regla de datos pendientes.

## Entregable
Los tres JSON actualizados, la lista de datos pendientes para la dueña, los casos dudosos del campo `animales` y, si recortaste un texto, la versión larga y la corta.
