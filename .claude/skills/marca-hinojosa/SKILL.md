---
name: marca-hinojosa
description: Paleta con contrastes ya verificados, tipografía, tono de voz y reglas de logo de Comercial Hinojosa. Úsala al elegir cualquier color, fuente o texto del sitio, al escribir tokens CSS y al revisar si una combinación cumple contraste.
---

# Marca Comercial Hinojosa

Fuente única de verdad para color, tipografía, tono y logo. Si algo aquí contradice a `PLAN.md`, manda `PLAN.md` y hay que actualizar esta skill.

**Negocio:** venta de balanceados, alimentos y productos para animales.
**Lema:** "Nutrición que da vida". Ya va **dentro del logo**: no se repite como texto al lado del logo. En Inicio, el acento manuscrito bajo el logo es **"Tu mejor aliado para tus animales"** (decisión 2026-10-13, `PLAN.md` §0-B).
**Mascota:** Canela, perrita con gorra verde y pañuelo con la "H". Es parte de la marca (logo, insignia, gráficos), **no** una sección del sitio ni un personaje 3D. Aparece **solo en Inicio y Nosotros**.

---

## 1. Paleta

| Rol | Nombre | Hex |
|---|---|---|
| Fondos y títulos oscuros | verde bosque | `#1B4D2B` |
| Botones, hojas | verde vivo | `#2E8B2E` |
| Acentos | verde hoja | `#7BBF3A` |
| CTA, detalles | oro / maíz | `#F2B823` |
| Fondos claros | crema cálido | `#F6F1E4` |
| Calidez, mascota | canela | `#C98A3A` |
| Texto | verde casi negro | `#14301D` |

Proporción base de la marca: 60 % blanco/crema · 30 % verde · 10 % oro. **En las vistas claras manda el 55/30/15 aprobado el 2026-10-14** (abajo).

**Reparto real (revisión 2026-10-14, `PLAN.md` §2 "Reparto del color"):** el sitio usaba en la práctica dos colores (crema + bosque) y el oro y el canela casi no aparecían, por eso las vistas claras parecían plantilla. Reglas vigentes:
- **No pongas tarjetas blancas con sombra sobre crema** como recurso por defecto (blanco/crema ≈ 1,1:1, se distinguen solo por la sombra). Alterna superficies `crema-oscuro` `#EDE4CC` y `hoja-claro` `#EAF4DC`.
- **Cada vista clara lleva al menos una banda `bosque`.**
- Al terminar una vista, estima a ojo la proporción real de cada color; si el oro y el canela no llegan juntos a ~10 %, falta acento.
- **Aprobado el 2026-10-14:**
  - Proporción objetivo en las vistas claras: **55 % crema · 30 % verde · 15 % oro + canela** (sustituye al 60/30/10 en esas vistas; Inicio sigue siendo mayoritariamente verde oscuro).
  - **Trazo de pincel maíz bajo los h2** en lugar del subrayado verde (decorativo, no necesita 3:1; el subrayado verde se confundía con un enlace). **Desde 2026-10-16 es también el hover de la barra** (se dibuja bajo el rótulo no activo, sobre el crema de la barra). Es el único subrayado decorativo del sitio: no inventes otro.
  - **Canela oscuro `#8A5A1F` como fondo de banda**, con texto blanco (5.88) o crema (5.22).
  - **Tono kraft / costal `#E3CFA6`** (`--color-kraft`) para bandas, sellos, la tarima del carrusel y las cabeceras de grupo de la lista completa. Ver la tabla de la sección 2. (La ficha de Productos fue kraft hasta el 2026-10-16, bosque del 16 al 17 y **crema desde el bloque 23**, 2026-10-17.)
  - **Tarjetas de información en bosque (`.tema-oscuro`):** la tarjeta de Visítanos (y la ficha de Productos hasta el bloque 23, que la pasó a crema) usan el mismo lenguaje: título blanco (9.80), etiquetas maíz en mayúsculas (5.44), valores crema (8.69), CTA oro sin borde, foco maíz.
  - Más oro como **detalle** (aros de las razones de Nosotros, trazo bajo los h2, pin, marca de agua), nunca como texto sobre claro.

> Los hex son aproximados, tomados de los afiches. Al obtener el logo vectorial hay que afinarlos **y volver a calcular la tabla de la sección 2**.

---

## 2. Contrastes verificados (WCAG 2.2 AA)

Calculados con la fórmula de luminancia relativa de WCAG. Umbrales: **4.5:1** texto normal (1.4.3), **3:1** texto grande y bordes de componentes (1.4.11).

### Combinaciones que SÍ se pueden usar

| Frente | Fondo | Ratio | Uso |
|---|---|---|---|
| `#14301D` | `#FFFFFF` | **14.28** | Texto de cuerpo sobre blanco |
| `#14301D` | `#F6F1E4` | **12.67** | Texto de cuerpo sobre crema |
| `#FFFFFF` | `#1B4D2B` | **9.80** | **Botón primario** y texto sobre fondo verde oscuro |
| `#1B4D2B` | `#FFFFFF` | **9.80** | Títulos sobre blanco |
| `#1B4D2B` | `#F6F1E4` | **8.69** | Títulos sobre crema |
| `#14301D` | `#F2B823` | **7.93** | **Botón de CTA dorado** — texto oscuro, nunca blanco |
| `#14301D` | `#7BBF3A` | **6.36** | Pastillas y etiquetas verde claro |
| `#F2B823` | `#1B4D2B` | **5.44** | Oro como texto o detalle **solo** sobre verde oscuro |
| `#14301D` | `#C98A3A` | **4.88** | Texto sobre fondo canela |

Colores derivados (definidos en `hinojosa-web/src/styles/tokens.css`, calculados con la misma fórmula; 2026-10-12):

| Frente | Fondo | Ratio | Uso |
|---|---|---|---|
| `#FFFFFF` | `#10301B` bosque-noche | **14.38** | Fondo de Inicio, línea de pie |
| `#F6F1E4` | `#10301B` | **12.76** | Texto crema en el pie |
| `#14301D` | `#EAF4DC` hoja-claro | **12.57** | Fila activa de la lista |
| `#14301D` | `#EDE4CC` crema-oscuro | **11.27** | Pastilla "Cerrado" |
| `#1B4D2B` | `#EAF4DC` | **8.63** | Pastilla "Abierto ahora" |
| `#F2B823` | `#10301B` | **7.98** | Lema manuscrito en Inicio |
| `#3D5A45` tinta-suave | `#FFFFFF` / `#F6F1E4` | **7.64 / 6.78** | Texto secundario, borde de campos |
| `#3D5A45` | `#EAF4DC` / `#EDE4CC` | **6.73 / 6.03** | Texto secundario sobre superficies tintadas |
| `#14301D` | `#D99E0F` maiz-oscuro | **6.02** | Hover del CTA oro |
| `#8A5A1F` canela-oscuro | `#FFFFFF` / `#F6F1E4` | **5.88 / 5.22** | Texto canela legible |
| `#267A2C` marca-fuerte | `#FFFFFF` / `#F6F1E4` | **5.38 / 4.77** | Enlaces de texto (no botones) |
| `#C98A3A` (pelaje de Canela) | `#1B4D2B` | 3.35 | Solo decorativo: Canela sobre el fondo de Inicio |
| `#EAF4DC` | `#F6F1E4` | 1.01 | **No** sirve como única señal de estado activo |
| `#14301D` | `#E3CFA6` kraft | **9.35** | Texto de cuerpo sobre bandas kraft (2026-10-14) |
| `#1B4D2B` | `#E3CFA6` | **6.41** | Títulos sobre kraft |
| `#3D5A45` | `#E3CFA6` | **5.00** | Texto secundario sobre kraft |
| `#8A5A1F` | `#E3CFA6` | 3.85 | Solo texto grande (≥ 24 px o 19 px en negrita) sobre kraft |
| `#FFFFFF` / `#F6F1E4` | `#8A5A1F` canela-oscuro | **5.88 / 5.22** | Texto sobre bandas canela oscuro |
| `#8A5A1F` canela-oscuro | `#EAF4DC` hoja-claro | **5.18** | Antetítulos canela sobre bandas hoja-claro (p. ej. "Animales que atendemos") |
| `#14301D` / `#1B4D2B` | `#B4C99D` salvia | **8.01 / 5.50** | Texto y títulos sobre el fondo de Productos, Nosotros y Visítanos (bloque 27). Detalle en §5 |
| `#8A5A1F` | `#B4C99D` salvia | 3.31 | **Solo texto grande** (≥ 24 px) sobre salvia |
| `#3D5A45` / `#267A2C` | `#B4C99D` salvia | 4.29 / 3.02 | **Prohibidos** como texto sobre salvia: usar tinta / bosque subrayado |

Ratios adicionales del mapa de color (2026-10-14): ver `hinojosa-web/docs/guia-estilo.md` §3. **Prohibidos nuevos:** trazo o texto maíz sobre kraft (1.18) o sobre crema-oscuro (1.42); `marca-fuerte` sobre crema-oscuro (4.25) o kraft (3.52) como texto normal; `bosque` (1.66) u `hoja` (2.62) sobre canela-oscuro (en bandas canela el foco va en crema, clase `.tema-canela`).
| `#F2B823` (CTA) | `#F6F1E4` | 1.60 | Sobre claro, el CTA oro lleva borde `#1B4D2B` 2 px (8.69) |

### Combinaciones PROHIBIDAS

| Frente | Fondo | Ratio | Por qué |
|---|---|---|---|
| `#FFFFFF` | `#2E8B2E` | 4.33 | **Trampa principal.** El verde vivo con texto blanco es la elección obvia para botones y **no cumple**. Usa `#1B4D2B` de fondo |
| `#2E8B2E` | `#F6F1E4` / `#FFFFFF` | 3.84 / 4.33 | El verde vivo no sirve como color de texto |
| `#7BBF3A` | cualquier claro | 1.99–2.24 | El verde hoja nunca es texto sobre fondo claro |
| `#F2B823` | `#F6F1E4` / `#FFFFFF` | 1.60 / 1.80 | **El oro no es un color de texto.** Solo fondo de botón, o texto sobre verde oscuro |
| `#C98A3A` | `#F6F1E4` / `#FFFFFF` | 2.59 / 2.92 | El canela no sirve como texto sobre claro |
| `#FFFFFF` | `#F2B823` / `#C98A3A` | 1.80 / 2.92 | Blanco sobre dorado o canela es ilegible |

### Reglas que se derivan
1. **Texto:** solo `#14301D` o `#1B4D2B` sobre fondos claros, y solo blanco sobre `#1B4D2B`.
2. **Botón primario:** fondo `#1B4D2B`, texto blanco.
3. **Botón de CTA:** fondo `#F2B823`, texto `#14301D`.
4. `#2E8B2E`, `#7BBF3A` y `#C98A3A` son **colores de fondo, borde o ilustración**, nunca de texto sobre claro. Como borde de componente, `#2E8B2E` sobre blanco cumple el 3:1 (4.33).
5. Al poner texto sobre una **foto** (tarjeta del mapa, futuras fotos del local), el contraste no se puede garantizar: usa un fondo sólido u opaco detrás del texto, no una capa translúcida.
6. Un color **nunca** es el único portador de información (WCAG 1.4.1): la vista activa de la barra y el estado "Abierto / Cerrado" llevan además forma o palabra.

---

### Móvil, bloque 28 (2026-10-17, solo < 48rem; medido con la fórmula WCAG)
| Frente | Fondo | Ratio | Uso |
|---|---|---|---|
| `#F6F1E4` crema | `#315E3D` (bosque + 10 % crema) | **6.65** | Nombre e icono de las **fichas de animales** de Nosotros (no bajar de 8–12 % de mezcla: 12 % da 6.34) |
| `#F2B823` maíz (borde 1 px) | `#1B4D2B` bosque (banda) | **5.44** | Borde de la ficha contra la banda (≥ 3:1, 1.4.11) |
| `#14301D` tinta | `#F2B823` oro | **7.93** | **Botón principal "Llamar"** de Visítanos en móvil |
El fondo de la ficha frente a la banda es solo 1.2–1.4:1: **el borde maíz es lo que la delimita**, no lo quites. No hay colores nuevos: solo mezclas de tokens existentes (`color-mix(in srgb, var(--color-bosque) 90%, var(--color-crema))`).

## 3. Tipografía

| Rol | Familia | Nota |
|---|---|---|
| Títulos de marca | **Nunito 800** | Sans redondeada y gruesa, como el logo (Baloo 2 se retiró) |
| Títulos de producto | **Cormorant Garamond 700** | Serif que ya usan los afiches de producto |
| Acento manuscrito | **Caveat Brush 400** (subconjunto recortado) | Máximo una o dos frases por vista. **Nunca** texto corrido ni nada que haya que leer con detalle |
| Cuerpo | **Nunito 400** | |

- Ya están instaladas como paquetes `@fontsource` en `hinojosa-web/`: úsalas desde ahí, no desde un `<link>` a Google Fonts.
- `font-display: swap` siempre.
- Techo: **3 familias y 4 pesos** en total, por presupuesto de rendimiento.
- **Selección vigente (2026-10-12, dirección de arte):** para que los cuatro roles quepan en 3 familias se retira Baloo 2 y Nunito ExtraBold hace de título. Pesos: **Nunito 400 y 800**, **Cormorant Garamond 700**, **Caveat Brush 400**. Detalle en `hinojosa-web/docs/guia-estilo.md` §4.

---

## 4. Tono de voz

Cálido, familiar, confiable, cercano. El cliente es un ganadero, avicultor o dueño de mascota de la zona.

- Frases de **una o dos líneas**. El sitio se maneja por vistas sin scroll: el texto que no cabe se recorta, no se empuja hacia abajo.
- Español neutro de Ecuador, trato de "tú".
- Habla del animal, no del producto: "para que tus pollos crezcan sanos" antes que "balanceado de alta conversión".
- **Nada de:** jerga de marketing, superlativos vacíos ("el mejor del mercado"), urgencia falsa, emojis en el copy, promesas de envío o de compra en línea.
- Frases de marca disponibles: "Nutrición que da vida" (principal) · "Somos parte de tu familia" · "Tu mejor aliado para tus animales" · "Comercial Hinojosa siempre a tu lado" · "Calidad, Confianza, Compromiso".

### Datos que nunca se inventan
Teléfono, WhatsApp, dirección, ciudad, horario, referencias para llegar, enlaces de redes, precios, año de apertura e historia. (Confirmados el 2026-10-16: dirección "Av. del Chofer y Rubén Larson", teléfonos 099 708 5015 y 098 928 1882, correo rubenhinojosa4@yahoo.es; Facebook "@Comercial Hinojosa" sin enlace aún.) Si falta uno, en **los datos** (`negocio.json`) se escribe `PENDIENTE_CONFIRMAR` y se reporta. Un dato falso de contacto o de precio hace daño real al negocio.

**El marcador nunca llega a la pantalla.** `PENDIENTE_CONFIRMAR` es para los datos y para QA. Al visitante se le muestra texto humano: `textos.comunes.datoPendiente` ("Muy pronto publicaremos este dato.") o `textos.visitanos.contactoPendiente`. Los canales de contacto pendientes se agrupan en una sola línea, sin forma de botón: un botón que no hace nada parece un sitio roto.

Los precios de los afiches van siempre acompañados de **"Precios referenciales — consulta disponibilidad"**.

---

## 5. Sistema visual entre vistas (auditoría 2026-10-13)

- **Títulos de vista:** antetítulo (Nunito 800, mayúsculas, `text-etiqueta`, `canela-oscuro`: 5.88 sobre blanco, 5.22 sobre crema) + `h2` con una frase corta sacada de los eslóganes reales. Primera vista que lo usa (2026-10-16): **Nosotros**, antetítulo NOSOTROS + "Somos parte de tu familia" con "familia" en Caveat canela oscuro (5.22, siempre ≥ 24 px). **Sobre el fondo salvia (bloque 27) el antetítulo pasa a `bosque`** (el canela oscuro daría 3.02); "familia" sigue en canela oscuro por ser texto grande. Textos propuestos en `PLAN.md` §3, **pendientes de aprobación**; no los cambies sin ella.
- **Icono en círculo con aro maíz:** solo para las 3 razones de "Por qué elegirnos" dentro de Nosotros (2026-10-16; antes, los 4 pilares). Animales y demás iconos van sueltos. Repetir el mismo círculo en tres familias hace que el sitio parezca plantilla.
- **Tamaño mínimo de texto: 13 px**, también en la barra.
- **No dupliques mensajes:** antes de añadir un texto, comprueba que no esté ya en el logo, en la barra o en la vista vecina (el lema en Inicio, "calidad" dentro de Nosotros, que antes se repetía entre Quiénes somos y Por qué, el diferencial de especies junto a la fila de animales).
- **Iconos en botones (2026-10-15):** solo en los botones principales de Inicio, a la izquierda del texto y decorativos (`aria-hidden`; el nombre accesible es el texto): `costal` en "Ver productos", `pin` en "Cómo llegar". Los accesos por categoría y los chips no llevan icono, para no saturar Inicio (la fila de animales ya los tiene).
- **Escena de granja de Inicio (2026-10-17, `PLAN.md` §0-C):** sin colores nuevos. Cielo `crema` → `hoja-claro` con halo `maíz`; nubes blancas/crema; césped `hoja` → `verde` → `bosque`. **No hay azul en la paleta**: un cielo azul sería color nuevo y requiere aprobación. Texto de la columna izquierda en `bosque` sobre claro (≥ 9:1) o crema sobre `bosque`; verificar el logo sobre fondo claro (si no luce, panel `bosque`).
- **Tarjeta de producto nueva (bloque 23, 2026-10-17, `VistaProductos.astro` `.prod-panel`):** crema (con un velo blanco arriba a la izquierda que solo aclara: crema es el peor caso), borde kraft 1 px decorativo (1.36, no es control), radio `tarjeta-grande` y `shadow-tarjeta`; marca de agua SVG `aria-hidden`: hojas de trazo `hoja` al 40 % (mezcla ≈ `#C5DDA0`; al 14 % en Lista) y huellas `kraft` al 70 % (≈ `#E9D9B9`); sustituye a la ficha bosque del bloque 18. **Contrastes calculados (2026-10-17):** nombre `bosque` Nunito 800 sobre crema **8.69** (sobre el trazo de las hojas 6.64, sobre las huellas 7.04); etiquetas MARCA / PRESENTACIÓN / PARA en `tinta` 800 **12.67**; valores `tinta-suave` **6.78** (sobre hojas 5.18, sobre huellas 5.49); chip de precio `maíz` con `tinta` **7.93**; pastillas PARA `hoja-claro` con `bosque` **8.62**; etapas del tilapero `crema-oscuro` con `tinta` **11.27**; selector Detalle | Lista: carril `crema-oscuro` con la opción inactiva en `bosque` **7.73**, pastilla `bosque` con la activa en `crema` **8.69**; Lista sobre crema: tinta 12.67, precio `bosque` 8.69, fila activa blanca con tinta **14.28**, hover `crema-oscuro` con tinta 11.27. Foco `bosque` (8.69 sobre crema, 7.73 sobre crema-oscuro). **No uses `marca-fuerte` dentro de la tarjeta** (4.77 sobre crema, pero 3.64 sobre el trazo de las hojas).
- **Enlace "Cómo llegar" de Productos (bloque 24, `.prod-llegar`; mismo estilo en el botón de la hoja de detalle móvil, `.hoja-cta`):** píldora `bosque` con texto blanco **9.80**, pin `maíz` decorativo (5.44) y flecha que se desplaza 4 px; hover y foco `bosque-noche` (blanco **14.38**) con subrayado blanco que crece y, con ratón, elevación de 1 px; anillo de foco `bosque` por fuera (8.69 sobre crema); 44 px de alto; transiciones solo con movimiento (ni `prefers-reduced-motion` ni la pausa). Encima, la frase "Todos estos productos los encuentras en nuestro local" en `tinta` 12.67.
- **Ajustes de Productos 2026-10-17 noche (bloque 23b), contrastes calculados:**
  - **Desvanecido verde de la tarjeta:** `linear-gradient(0deg, hoja al 22 %, hoja-claro al 90 % en el 40 %, transparente en el 72 %)` sobre crema. Peor punto (base) = `#DBE6BF`: `tinta` **10.94**, `bosque` **7.50**, `tinta-suave` **5.85** (descripción y valores), `marca-fuerte` 4.12 (**prohibido** dentro de la tarjeta). Las pastillas PARA pasan a **blanco con filete hoja al 55 % y texto `bosque` 9.80** (la `hoja-claro` se perdía sobre el verde). Huellas de la marca de agua en `bosque` al 10 % (decorativas).
  - **Descripción corta** en la ficha y en la hoja móvil: `tinta-suave` (6.78 sobre crema, 5.85 en el peor punto del verde).
  - **Pestañas de categoría pintadas** (hover con `(hover: hover)` y foco de teclado): relleno `hoja` al 40 % sobre `hoja-claro` = `#BEDF9B` que barre de izquierda a derecha, borde y texto `bosque` **6.62** (recuento `tinta-suave` **5.17**); a mitad del barrido, `bosque` sobre `crema-oscuro` 7.73. Reposo: `tinta` sobre `crema-oscuro` 11.27, recuento `tinta-suave` 6.03. Activa: blanco sobre `bosque` 9.80; con hover, sobre `bosque-noche` 14.28.
  - ~~Fondo de la vista Productos: mosaico crema con huellas kraft al 20 % y ramitas hoja al 12 %~~ — **sustituido por el fondo salvia del bloque 27** (abajo).
- **Fondo común de Productos, Nosotros y Visítanos (bloque 27, 2026-10-17, `src/components/FondoHuellas.astro`):**
  - **Tono nuevo calculado: salvia `#B4C99D`** (`--color-salvia` en `tokens.css`) = `bosque` 18 % + `hoja` 22 % + `crema` 60 %. Es el "verde opaco" de la familia hoja/bosque; no es un color de texto ni de botón, solo fondo de vista.
  - Mosaico SVG inline (`<pattern>` de 288 px, ~2,9 kB sin comprimir, ~0,8 kB con gzip) de huellas de **perro, gato, vaca (pezuña partida) y pollo (tres dedos)** en `crema` al 55 % (`#D8DFC4`, **más claras** que la salvia) y **ramitas y hojas** en `hoja` al 34 % (`#A1C67B`, algo más oscuras: son el **peor píxel**). Opacidad en el grupo, no en cada forma: lo que se solapa no se oscurece. Sin giro del patrón (el giro creaba costuras antialias más oscuras). Estático, `aria-hidden`, `pointer-events: none`, oculto en `forced-colors`. Va en el `slot="fuera"` de `<Vista>` como `<svg>` y no como `background-image` (regla M5: un fondo CSS a pantalla completa pasaba a ser el candidato LCP de `#productos`; medido: el LCP sigue siendo `span.prod-frente-tarjeta > img`).
  - **Contrastes medidos sobre la captura real** (peor píxel del fondo fuera de la sombra de la barra, 1440×900): salvia `#B4C99D` / peor píxel `#A0C57B`. `tinta` **8.01 / 7.32**; `bosque` **5.50 / 5.02**; `canela-oscuro` 3.31 / **3.02** (solo texto grande); `tinta-suave` 4.29 / 3.92 (**prohibido**); `marca-fuerte` 3.02 / 2.76 (**prohibido**); `maiz` 1.01 (el trazo del h2 sigue siendo decorativo y se distingue por el tono, no por la luminancia). Anillo de foco `bosque` 5.02 (≥ 3:1).
  - **Texto que va directamente sobre el fondo y cómo queda:** Productos: h2 `bosque` (5.02), etiqueta "Buscar producto" `tinta` 800 (7.32), resultado de la búsqueda `tinta` (antes `tinta-suave`), "Ver los N" `bosque` (5.02), meta del rótulo del carrusel `tinta` (antes `tinta-suave`), nombre del rótulo en móvil `tinta`, "Ver detalle" `bosque`, frase de compra `tinta`. Nosotros: antetítulo **`bosque`** (antes canela oscuro, que daría 3.02), h2 `bosque`, "familia" Caveat `canela-oscuro` (texto grande, ≥ 3.02), misión `tinta`, "Por qué elegirnos" y títulos de las razones `bosque`, textos de las razones **`tinta`** (antes `tinta-suave`), enlace "Ver cómo llegar" **`bosque` subrayado** (antes `marca-fuerte`; hover `tinta`). Visítanos: no hay texto suelto sobre el fondo (tarjeta bosque, aviso canela, pin y error del mapa llevan superficie propia); con coordenadas, las teselas de Leaflet tapan el fondo.
  - **Con superficie propia (no cambian):** tarjeta de Productos, pestañas de categoría (`crema-oscuro`, borde `tinta-suave` 3.92 contra el fondo, ≥ 3:1), buscador blanco, flechas, lista móvil (`hoja-claro`), barra, círculo de Canela, banda de animales, tarjeta de Visítanos, aviso "Muy pronto, el mapa".
  - No subas las opacidades ni oscurezcas la salvia sin recalcular: con hojas por encima del 40 % el canela oscuro baja de 3:1 y `bosque` se acerca a 4.5.
- **Tarjetas que no son pulsables** no se inclinan al pasar el ratón: solo se elevan. El tilt (`--tilt-max`, 3°) se reserva a superficies decorativas.

---

## 6. Logo y marcas

- Se usa **solo el logo nuevo**: H blanca sobre trébol verde con maíz, "COMERCIAL" en dorado, "HINOJOSA" en verde degradado. El logo "ANTES" del primer afiche está **descartado**.
- Variantes: completo vertical, isotipo "H" suelto, versión blanca para fondos oscuros, favicon. Archivos en `hinojosa-web/public/img/marca/`.
- El logo no se deforma, no se recolorea y no se pone sobre fondos que le quiten contraste. Sobre fondo oscuro va la versión blanca.
- La optimización de imágenes **no** puede degradar el logo: se mantiene en SVG o PNG nítido, nunca en un WebP agresivo.
- **Marcas de terceros** (Pro-Can, Camperito, Nutritivos, Dog Chow, NutraPro, Bio Alimentar, Cani, Molinos Cordillera, Freemiau, Mascan…): se mencionan solo como productos que el local distribuye, con la nota al pie **"Marcas registradas de sus respectivos propietarios."** No se usan sus logos como si fueran de la marca propia.
- **Imágenes generadas o editadas con IA:** nunca pidas "fondo transparente": casi todas pintan un damero falso (pasó con `bebedero.png`). Pide un **color plano** que no exista en el objeto (azul `#0047BB` para Canela, porque su gorra y collar son verdes; verde croma `#00B140` para productos sin verde) y se quita después en `scripts-activos/`. Si se quita el fondo a mano (Paint, Adobe Express…), **guardar en PNG**: en JPG la transparencia se convierte en blanco (pasó con el bebedero; se recuperó porque el fondo quedó blanco puro).
- Las imágenes de los afiches son **referencia gráfica**, no fuente final. Varias parecen generadas con IA: antes de publicarlas hay que confirmar con la dueña los derechos de uso.

---

## 7. Al escribir tokens

Define los colores como tokens con nombre de rol, no de color, para que la regla de contraste viaje con el token:

```css
:root {
  --color-fondo:            #F6F1E4;
  --color-texto:            #14301D;
  --color-titulo:           #1B4D2B;
  --color-boton-fondo:      #1B4D2B;  /* texto blanco: 9.80 */
  --color-boton-texto:      #FFFFFF;
  --color-cta-fondo:        #F2B823;  /* texto oscuro: 7.93 */
  --color-cta-texto:        #14301D;
  --color-borde:            #2E8B2E;  /* solo borde/icono: 4.33 */
  --color-decorativo-hoja:  #7BBF3A;  /* nunca texto sobre claro */
  --color-decorativo-canela:#C98A3A;  /* nunca texto sobre claro */
}
```

Si necesitas un color que no esté en la tabla de la sección 2, **calcula su ratio antes de usarlo** y añade la fila aquí.
