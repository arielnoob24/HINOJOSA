# Guía de estilo: Comercial Hinojosa (sitio por vistas, v3)

> Revisión del 2026-10-14. Incorpora las decisiones de la auditoría (`PLAN.md` §0-B, `auditoria.md`) y el **reparto del color aprobado** (`PLAN.md` §2 "Reparto del color", bloque 13 de la fase 5-B).
> Precedencia: `PLAN.md` §0-B → §0 → resto del plan → esta guía. Si algo de aquí contradice al plan, manda el plan y hay que corregir la guía.
> Fuente de verdad de color, tipografía y tono: skill `marca-hinojosa`. Tokens: `src/styles/tokens.css`. Router, transición y barra: skill `vistas-hinojosa`.
> Storyboards: `docs/storyboard-hero.md` (Inicio, Canela corriendo, transición entre vistas) y `docs/storyboard-carrusel.md` (carrusel, C1–C8).
> Los hex siguen siendo aproximados: al llegar el logo vectorial se afinan en `tokens.css` y se recalculan la sección 3 y la tabla de la skill.
> **Lo que requiere aprobación de la dueña** está reunido en la sección 15.

---

## 1. Idea visual

"Del campo a tu casa": crema cálido, el verde del trébol del logo, el oro del maíz y el **kraft de los costales**. Una tienda de barrio de confianza, no una cadena. La firma visual es la **insignia ovalada** (aro oro + aro verde + interior claro) que ya usan los afiches.

Dos problemas que esta versión corrige:
1. **Exceso de texto mal repartido** (heurística 8): titulares de una línea, frases de una o dos, nunca párrafos. Lo que no cabe se recorta (los textos completos viven en `negocio.json`), no se esconde detrás de un clic.
2. **Color de plantilla** (revisión 2026-10-14): fuera de Inicio el sitio usaba dos colores (crema + bosque) y tarjetas blancas con sombra sobre crema (≈ 1,1:1). Ahora cada vista clara reparte **crema / verde / oro + canela** con superficies tintadas, una banda o bloque `bosque` de peso y acentos oro y canela reales (sección 2.2).

Evitamos: degradados morados, negro puro, sombras grises duras, cristal translúcido sobre fotos o mapas, **tarjetas blancas idénticas sobre crema**, más de un CTA oro por vista, el mismo patrón de icono repetido en varias familias y el subrayado verde bajo los títulos (parecía un enlace).

---

## 2. Paleta

| Token (utilidad Tailwind) | Hex | Rol |
|---|---|---|
| `bosque` | `#1B4D2B` | Títulos, **botón primario** (con blanco), bandas y bloques verdes, indicador de vista activa, foco sobre claro |
| `bosque-noche` | `#10301B` | Fondo de Inicio (degradado con `bosque`), pie, hover del primario |
| `marca` | `#2E8B2E` | Verde vivo del logo: **solo** bordes, iconos e ilustración. Nunca texto, nunca fondo con texto blanco |
| `marca-fuerte` | `#267A2C` | Enlaces de texto sobre `crema`, `blanco` u `hoja-claro`. **No** sobre `crema-oscuro` (4.25) ni `kraft` (3.52) |
| `hoja` | `#7BBF3A` | Hojas decorativas, bordes de chips sobre verde oscuro. Ya **no** se usa como subrayado de títulos |
| `hoja-claro` | `#EAF4DC` | Superficie tintada verde: tarjetas, panel de la lista, bandas claras, pastilla "Abierto" |
| `maiz` | `#F2B823` | Oro: fondo del CTA, chip de precio, **trazo de pincel bajo los h2**, aros, puntos separadores, pin, texto **solo** sobre verde oscuro |
| `maiz-oscuro` | `#D99E0F` | Hover del CTA oro |
| `crema` | `#F6F1E4` | Fondo claro principal, barra |
| `crema-oscuro` | `#EDE4CC` | Superficie tintada cálida: caja del video, pestañas inactivas, pastilla "Cerrado" |
| `kraft` **(nuevo)** | `#E3CFA6` | Tono costal: tarima del carrusel, cabeceras de grupo, sellos, tarjeta genérica de costal, aviso del mapa. Neutro, no acento |
| `canela` | `#C98A3A` | Pelaje de Canela, granos (decorativo) |
| `canela-oscuro` | `#8A5A1F` | Antetítulos sobre claro **y fondo de banda/bloque** (texto blanco o crema encima) |
| `tinta` | `#14301D` | Texto principal |
| `tinta-suave` | `#3D5A45` | Texto secundario, notas, borde de campos y pestañas inactivas |
| `blanco` | `#FFFFFF` | Interior de la insignia, campo del buscador, flechas del carrusel, fila activa del panel, foco de estudio. **Ya no es superficie de tarjeta por defecto** |

Tokens de color nuevos (2026-10-14, todos en `tokens.css` con su ratio en el comentario): `kraft`, `fila-activa-panel` (`#FFFFFF`), `filete-canela` (canela oscuro al 35 %), `pendiente-oscuro` (crema al 70 %), `velo-costal` (tinta al 25 %). Además siguen los **tokens de rol** (`boton-fondo`, `cta-fondo`, `cta-borde`, `indicador`, `fila-activa`, `foco`…): en componentes nuevos se usa el token de rol, no el de color.

### 2.1 Proporción objetivo y cómo medirla

- **Vistas claras (Nosotros, Productos, Por qué, Visítanos): 55 % crema · 30 % verde · 15 % oro + canela** (aprobado 2026-10-14; sustituye al 60/30/10 en esas vistas).
- **Inicio** sigue siendo mayoritariamente verde oscuro (≈ 80 / 10 / 10): es la portada y donde mejor luce el logo.
- **Grupos de color:** *crema* = `crema`, `crema-oscuro`, `kraft`, `blanco` · *verde* = `bosque`, `bosque-noche`, `marca`, `hoja`, `hoja-claro` · *oro + canela* = `maiz`, `maiz-oscuro`, `canela`, `canela-oscuro`.
- **Cómo medir (obligatorio al diseñar o auditar una vista; no basta con la regla escrita):** captura con Playwright a 1440×900 y 360×640 **con `img, video, picture { visibility: hidden }`** (se miden las superficies, no los renders ni el video), sin la barra; cada píxel se asigna al token más cercano (distancia RGB) y se suma por grupo. El texto (`tinta`, `tinta-suave`) se descarta del cómputo.
- **Banda de aceptación:** crema 50–62 % · verde 25–35 % · oro + canela ≥ 10 % (objetivo 15). Fuera de la banda, se corrige la vista, no la regla.

### 2.2 Mapa de color por vista

Lo aplica `frontend` (bloque 13). Es por bloque y por componente; cada fila indica la superficie, el color de cada texto con su ratio y el detalle oro. **Ninguna superficie de tarjeta queda en `blanco` sobre `crema`.**

#### Reglas comunes a las cuatro vistas claras

| Elemento | Especificación |
|---|---|
| Fondo de la vista | `crema` |
| Antetítulo (sistema G3) | Nunito 800, mayúsculas, `text-etiqueta`, `tracking-[0.08em]`, `canela-oscuro` (5.22 sobre crema). Sobre `bosque`: `maiz` (5.44) |
| h2 | Nunito 800, `text-h2`, `bosque` (8.69 sobre crema), `width: fit-content`, `text-wrap: balance`. **Sin subrayado de texto** |
| Trazo de pincel maíz bajo el h2 | Ver 2.3. Solo sobre `crema`, `hoja-claro`, `blanco` o `bosque`; **nunca** sobre `kraft` (1.18) ni `crema-oscuro` (1.42) |
| Banda o bloque `bosque` | Al menos uno por vista, de peso (≥ 8 % del área). Dentro: `.tema-oscuro` (texto blanco 9.80 o crema 8.69, oro 5.44, foco `maiz`) |
| Bloque `canela-oscuro` | Uno por vista como máximo. Dentro: `.tema-canela` (ver abajo) |
| Sombras | `shadow-suave` como mucho en superficies tintadas; la separación la da el color, no la sombra. `shadow-flotante` solo en lo que flota (tarjeta del mapa, hoja de detalle) |

**Clase `.tema-canela`** (nueva, la crea `frontend` en `global.css`): texto `blanco` (5.88) o `crema` (5.22); iconos `crema` o `kraft` (3.85, solo icono); puntos y detalles `maiz` (3.27, solo decorativo, ≥ 3 para no textual); **anillo de foco `crema` 3 px** (5.22). Prohibido dentro: `bosque` (1.66), `hoja` (2.62), `marca-fuerte`, cualquier texto `kraft` por debajo de 24 px.

#### Quiénes somos (`#nosotros`, `VistaNosotros.astro`)

| Bloque / componente | Superficie | Textos (ratio) | Detalle oro / canela |
|---|---|---|---|
| Cabecera | `crema` | Antetítulo `canela-oscuro` 5.22 · h2 `bosque` 8.69 | Trazo maíz bajo el h2 |
| Tarjeta grande: caja del video | **`crema-oscuro`** con "suelo" `hoja-claro` (elipse en el 18 % inferior, ancho 90 %) | — | Pelaje de Canela (video) |
| Tarjeta grande: banda de la frase | **`bosque`** opaca (bloque verde de la vista) | Frase blanco 9.80; "familia" Caveat `maiz` 5.44 (acento de la vista) | Caveat oro |
| Misión | **`canela-oscuro`** (`.tema-canela`) | Antetítulo "MISIÓN" `crema` 800 5.22 · texto Nunito 400 `text-lead` `blanco` 5.88 | Es el bloque canela de la vista |
| Visión (→ Nuestra historia) | **`bosque`** (`.tema-oscuro`) | Antetítulo `maiz` 5.44 · texto Nunito 400 `text-lead` `blanco` 9.80 | Antetítulo oro |
| Banda de valores | **`hoja-claro`**, `rounded-tarjeta`, a lo ancho de la retícula | Icono 28 px trazo `bosque` (8.62) · palabra Nunito 800 `text-cuerpo` `tinta` 12.57 | Punto `maiz` de 6 px entre valores (decorativo) |

Estimación con imágenes ocultas (1440×900): **crema 61 % · verde 29 % · oro + canela 11 %**. Dentro de la banda.
Si la caja del video no puede usar `canela-jugando-alfa.webm` (sección 7.2), su fondo es el gris medido del póster y cuenta como crema; la proporción no cambia de forma apreciable.

#### Productos (`#productos`, `VistaProductos.astro`)

| Bloque / componente | Superficie | Textos (ratio) | Detalle oro / canela |
|---|---|---|---|
| Cabecera | `crema` | Antetítulo `canela-oscuro` 5.22 · h2 `bosque` 8.69 | Trazo maíz bajo el h2 |
| Pestañas inactivas | **`crema-oscuro`**, borde 1,5 px `tinta-suave` (6.78 contra crema) | Nombre `tinta` 11.27; recuento al 75 % de opacidad (P10) | — |
| Pestaña activa | `bosque` | Blanco 800, 9.80 | — |
| Escenario del carrusel | `crema` + foco de estudio `blanco` 85 % (no cambia: los costales necesitan neutro) | — | Los costales aportan el color |
| Tarima | **`kraft`** en degradado radial (centro) → transparente, filete 1,5 px `filete-canela` | — | Kraft une costales y marca |
| Rótulo | `crema` | Nombre Cormorant `tinta` 12.67 · meta `tinta-suave` 6.78 | Chip de precio `maiz` + `tinta` 800 (7.93) |
| "Preguntar por este producto" | CTA oro con borde `bosque` 2 px (8.69) | `tinta` 7.93 | Único CTA oro de la vista |
| Panel de la lista | **`hoja-claro`**, `rounded-panel`, sin `shadow-tarjeta` | Nombre `tinta` 12.57 · marca/presentación `tinta-suave` 6.73 · precio `bosque` 800 8.62 · enlaces `marca-fuerte` 4.73 | — |
| Cabecera del panel (buscador) | **`bosque`** (`.tema-oscuro`, bloque verde de la vista) | Etiqueta "Buscar producto" `crema` 800 8.69; campo `blanco`, texto `tinta` 14.28; foco `maiz` 5.44 | — |
| Cabeceras de grupo (sticky) | **`kraft`**, 36 px de alto, a sangre del panel | `bosque` 800 mayúsculas 6.41; recuento `tinta-suave` 5.00 | Sustituyen al subrayado `hoja` de 3 px |
| Fila activa | **`fila-activa-panel`** (`blanco`) + barra izquierda 4 px `bosque` + nombre 800 | `tinta` 14.28 | La barra es la señal no cromática |
| Hover de fila | `crema` | — | — |
| Pie del panel (notas) | **`bosque`** | `crema` `text-chico` 8.69 | — |
| Tarjeta genérica de costal (P5) | **`kraft`** (sección 7.3) | Nombre Cormorant `bosque` 6.41 · categoría `tinta-suave` 5.00 | Costura `canela-oscuro` |

Estimación con imágenes ocultas: **crema 64 % · verde 34 % · oro + canela 2 %**. **Excepción declarada:** el plan prohíbe poner color detrás de los productos ("crema detrás de los productos"); en esta vista el 15 % de acento lo ponen los costales (rojos, naranjas, amarillos), que el método de medida excluye. Con imágenes visibles, el acento cálido supera el 15 %. Ver sección 15.

#### Por qué elegirnos (`#por-que`, `VistaPorQue.astro`)

| Bloque / componente | Superficie | Textos (ratio) | Detalle oro / canela |
|---|---|---|---|
| Cabecera (siempre arriba, Q6) | `crema` | Antetítulo `canela-oscuro` 5.22 · h2 `bosque` 8.69 · acento Caveat, si se conserva, `canela-oscuro` ≥ 24 px (5.22) | Trazo maíz bajo el h2 |
| Pilares (4) | **`bosque`** (`.tema-oscuro`), `rounded-tarjeta`, sin sombra (bloque verde de la vista) | Título blanco 800 9.80 · descripción `crema` 8.69 | **Icono en círculo**: interior `hoja-claro`, icono `bosque` (8.62), **aro `maiz` 3 px** (5.44). Es la única familia con círculo |
| Banda de diferenciales | **`canela-oscuro`** (`.tema-canela`), **a sangre** (100 % del ancho de la vista), 96–104 px | Texto `blanco` 5.88; "Ubicación" enlazada (Q2): blanco subrayado, foco `crema` | Iconos 32 px `maiz` (3.27, no textual); filetes `kraft` al 40 % |
| Banda de animales | **`hoja-claro`**, `rounded-tarjeta` | Icono suelto (sin círculo) `bosque` 8.62 · palabra `tinta` 12.57. Cuando sean enlaces (Q4): foco `bosque` 8.62 | **Sellos de costal** junto a Aves, Cerdos, Vacas y Cuyes: miniatura `-thumb-80` a 40 px sobre una etiqueta `kraft` 44×44, `rounded-miniatura`, borde 1 px `filete-canela`, `rotate(-6deg)` |

Estimación con imágenes ocultas (pilares 220 px, banda de animales 150 px): **crema 52 % · verde 35 % · oro + canela 13 %**. Está en el borde alto del verde: si la medida real pasa del 35 %, la banda de animales baja a 120 px o pierde el fondo y queda solo el borde superior `hoja`.

#### Visítanos (`#visitanos`, `VistaVisitanos.astro`), sin mapa

| Bloque / componente | Superficie | Textos (ratio) | Detalle oro / canela |
|---|---|---|---|
| Fondo sin mapa (V3) | `crema` + textura de hojas y granos de Inicio al 8 % de opacidad. **Sin calles ni cuadrícula** | — | **Marca de agua del trébol** en `maiz` al 15 % de opacidad, ~60dvh, centrada en la mitad derecha |
| Pin | `bosque` con aro `maiz` 3 px e isotipo, 4–5 rem | — | Aro oro |
| Aviso "el mapa aparecerá…" (texto de `textos.json`) | **`canela-oscuro`** (`.tema-canela`), `rounded-tarjeta`, bajo el pin | Texto `blanco` 5.88; isotipo del trébol en `kraft` | Es el bloque canela de la vista |
| Tarjeta de datos (opaca) | **`bosque`** 100 % opaca (`.tema-oscuro`), `rounded-tarjeta-grande`, `shadow-flotante` (bloque verde de la vista) | Antetítulo `maiz` 5.44 · h2 "Comercial Hinojosa" blanco 9.80 · etiquetas (Dirección, Horario, Referencias) `maiz` 800 5.44 · valores blanco 9.80 · `datoPendiente` `crema` 8.69 | Trazo maíz bajo el h2 (5.44 sobre bosque) |
| Pastilla de estado | Abierto: `hoja-claro` + `bosque` 8.63 · Cerrado: `crema-oscuro` + `tinta` 11.27 | Icono + palabra | — |
| CTA "Cómo llegar" | `maiz` **sin borde** (5.44 contra bosque) | `tinta` 7.93 | Único CTA oro |
| WhatsApp / Llamar (cuando existan) | **Secundario invertido**: borde 2 px `crema` (8.69), texto `crema`, fondo transparente; hover `crema` al 12 % | `crema` 8.69 | — |
| Línea de contactos pendientes (V1) | En la tarjeta | Iconos `pendiente-oscuro` (5.17) · texto `crema` 8.69, una línea, sin forma de botón | — |
| Pie | `bosque-noche` | `crema` `text-chico` 12.76 | — |

Estimación con imágenes ocultas: **crema 69 % · verde 22 % · oro + canela 9 %**. **Fuera de la banda.** El plan fija el fondo sin mapa en `crema` (V3), y con mapa real los mosaicos de OpenStreetMap son claros, así que esta vista no llegará al 55/30/15 sin cambiar ese fondo. Pasar el fondo a `hoja-claro` tampoco sirve (el verde pasaría del 85 %). Propuesta (requiere aprobación, sección 15): la tarjeta deja de flotar y pasa a **panel `bosque` a toda altura** pegado a la izquierda (440 px de ancho, sin margen, el mapa o el fondo a su derecha) y el aviso del mapa crece a ~520×260 px → **crema 52 · verde 35 · oro + canela 13**. Si no se aprueba, Visítanos queda como excepción con la composición de la tabla.

#### Inicio (vista oscura, referencia)

| Bloque | Color |
|---|---|
| Fondo | Radial `bosque` (centro) → `bosque-noche` (bordes) |
| Insignia | Interior `blanco`, aro triple (sección 7.1) |
| Acento | Caveat `maiz` 7.98 / 5.44 |
| Subtítulo | `crema` 8.69–12.76 |
| CTA "Ver productos" | `maiz` sin borde + `tinta` 7.93 |
| "Cómo llegar" | Secundario invertido (borde y texto `crema`) |
| Accesos por categoría | Chips: borde 1,5 px `hoja` (4.36), texto `crema` 800 |
| Fila de animales | Icono `hoja` + palabra `crema` 400, puntos `maiz` |
| Granos, hojas, marca de agua | `maiz`/`canela`, `hoja` al 20–30 %, trébol `hoja` al 5 % |

### 2.3 Trazo de pincel maíz bajo los h2

Sustituye al subrayado verde (que se leía como enlace). Decorativo: no necesita 3:1.

- **Implementación: máscara CSS** en un `::after` del h2, para que el color siga siendo el token y no haya petición extra. El SVG va como `data:` URI en una variable de `global.css` (`--trazo-pincel`), < 600 bytes:
  ```css
  .titulo-vista::after {
    content: "";
    display: block;
    width: clamp(4.5rem, 55%, 13rem);   /* 55 % del ancho del h2, nunca todo */
    height: clamp(0.375rem, 0.9dvh, 0.5rem); /* 8 px a 1440×900, 6 px a 360×640 */
    margin-top: 0.3em;
    background: var(--color-maiz);
    mask: var(--trazo-pincel) no-repeat 0 0 / 100% 100%;
    transform: rotate(-1deg);
    transform-origin: left center;
  }
  @media (forced-colors: active) { .titulo-vista::after { display: none; } }
  ```
- Forma del trazo (`viewBox="0 0 200 12"`, `preserveAspectRatio="none"`): entrada gruesa a la izquierda, se afina hacia la derecha con el final deshilachado. Referencia: `M2 7.5C30 4.2 62 3.4 98 4.1c34 .6 66 1.9 99 .8l1 3.2c-35 2.4-68 2.6-101 2.1-32-.5-63-.4-95 1.3z`.
- El h2 lleva `width: fit-content` para que el 55 % sea del texto, no de la columna. Alineado a la izquierda con el texto.
- Color: `maiz` siempre. Sobre `crema` (1.60), `hoja-claro` (1.58), `blanco` (1.80) y `bosque` (5.44). **Nunca** sobre `kraft` ni `crema-oscuro`: ahí desaparece.
- Sin animación propia: entra con el bloque del título (`[data-entra]`).
- No se usa en Inicio (no hay h2) ni bajo h3.

### 2.4 Dónde va el oro (resumen)

| Vista | Detalles oro |
|---|---|
| Inicio | CTA, acento manuscrito, aro interior de la insignia, granos, puntos de la fila de animales |
| Nosotros | Trazo del h2, "familia", antetítulo de Visión, puntos entre valores |
| Productos | Trazo del h2, chip de precio, CTA "Preguntar" |
| Por qué | Trazo del h2, aros de los pilares, iconos de diferenciales |
| Visítanos | Trazo del h2, etiquetas de la tarjeta, CTA "Cómo llegar", aro del pin, marca de agua |

El oro **nunca** es texto sobre claro (1.60–1.80).

---

## 3. Contrastes verificados (WCAG 2.2 AA)

Fórmula de luminancia relativa de WCAG, (L1 + 0.05) / (L2 + 0.05). Umbrales: **4.5:1** texto normal (1.4.3), **3:1** texto grande (≥ 24 px, o ≥ 18.66 px en negrita) y componentes/indicadores (1.4.11). Los marcados **(2026-10-14)** se calcularon para el reparto del color y hay que copiarlos a la skill `marca-hinojosa`.

### 3.1 Texto: pares permitidos

| Frente | Fondo | Ratio | Uso |
|---|---|---|---|
| `blanco` | `bosque-noche` | **14.38** | Texto sobre el fondo de Inicio y el pie |
| `tinta` | `blanco` | **14.28** | Fila activa del panel, campo del buscador |
| `crema` | `bosque-noche` | **12.76** | Pie, subtítulo de Inicio |
| `tinta` | `crema` | **12.67** | Cuerpo sobre crema |
| `tinta` | `hoja-claro` | **12.57** | Panel de la lista, banda de valores y de animales |
| `tinta` | `crema-oscuro` | **11.27** | Pestañas inactivas, pastilla "Cerrado" |
| `blanco` | `bosque` | **9.80** | Botón primario, bloques verdes |
| `tinta` | `kraft` | **9.35** | Cuerpo sobre kraft |
| `bosque` | `crema` | **8.69** | Títulos sobre crema |
| `crema` | `bosque` | **8.69** | Texto claro en bloques verdes |
| `bosque` | `hoja-claro` | **8.63** | Precios del panel, pastilla "Abierto" |
| `maiz` | `bosque-noche` | **7.98** | Acento manuscrito de Inicio |
| `tinta` | `maiz` | **7.93** | CTA oro, chip de precio |
| `bosque` | `crema-oscuro` | **7.73** (2026-10-14) | Títulos sobre crema-oscuro |
| `tinta-suave` | `crema` | **6.78** | Notas |
| `tinta-suave` | `hoja-claro` | **6.73** | Marca/presentación en el panel |
| `bosque` | `kraft` | **6.41** | Cabeceras de grupo, nombre en la tarjeta de costal |
| `kraft` | `bosque` | **6.41** (2026-10-14) | Texto kraft sobre verde (si hiciera falta) |
| `tinta-suave` | `crema-oscuro` | **6.03** | Horario en la pastilla "Cerrado" |
| `blanco` | `canela-oscuro` | **5.88** | Bloques y bandas canela oscuro |
| `maiz` | `bosque` | **5.44** | Oro como texto sobre verde (antetítulos, etiquetas) |
| `canela-oscuro` | `crema` | **5.22** | Antetítulos |
| `crema` | `canela-oscuro` | **5.22** | Antetítulo de Misión |
| `canela-oscuro` | `hoja-claro` | **5.18** (2026-10-14) | Antetítulo sobre hoja-claro |
| `tinta-suave` | `kraft` | **5.00** | Recuento en cabeceras de grupo |
| `marca-fuerte` | `hoja-claro` | **4.73** (2026-10-14) | Enlaces dentro del panel |
| `canela-oscuro` | `crema-oscuro` | **4.65** (2026-10-14) | Antetítulo sobre crema-oscuro (justo; preferir crema) |
| `marca-fuerte` | `crema` | **4.77** | Enlaces sobre crema |

### 3.2 Componentes e indicadores (3:1)

| Elemento | Contra | Ratio | Nota |
|---|---|---|---|
| Pastilla de vista activa `bosque` | barra `crema` | **8.69** | La forma rellena es la señal no cromática |
| Borde de flechas y pestañas `bosque` 2 px | `crema` / `blanco` | **8.69 / 9.80** | |
| Borde de pestañas inactivas `tinta-suave` | `crema` | **6.78** | |
| CTA oro | `bosque` | **5.44** | Inicio y tarjeta de Visítanos: sin borde |
| CTA oro con borde `bosque` 2 px | claro | **8.69** (borde) | Obligatorio sobre claro (oro/crema = 1.60) |
| CTA oro con borde `bosque` 2 px | `kraft` | **6.41** (borde) | |
| Anillo de foco `bosque` 3 px | `crema` / `hoja-claro` / `kraft` | **8.69 / 8.62 / 6.41** | |
| Anillo de foco `maiz` 3 px | `bosque` / `bosque-noche` | **5.44 / 7.98** | `.tema-oscuro` |
| Anillo de foco `crema` 3 px | `canela-oscuro` | **5.22** (2026-10-14) | `.tema-canela` |
| Chips de categoría de Inicio, borde `hoja` | `bosque` / `bosque-noche` | **4.36 / 6.40** | |
| Secundario invertido, borde `crema` | `bosque` | **8.69** | "Cómo llegar" de Inicio, WhatsApp/Llamar en Visítanos |
| Iconos `maiz` | `canela-oscuro` | **3.27** (2026-10-14) | Solo icono o punto, nunca texto |
| Iconos `crema` al 70 % (`pendiente-oscuro`) | `bosque` | **5.17** (2026-10-14) | Canales pendientes |
| Iconos `kraft` | `canela-oscuro` | **3.85** | |
| Borde `marca` | `blanco` / `crema` | **4.33 / 3.84** | Solo borde o icono |
| Iconos `hoja` | `bosque` | **4.36** | |
| Pelaje de Canela `canela` | `bosque` | **3.35** | Decorativo |

### 3.3 Prohibidos

| Frente | Fondo | Ratio | Por qué |
|---|---|---|---|
| `blanco` | `marca` | 4.33 | **Trampa principal**: primario = `bosque` |
| `marca` | `crema` / `blanco` | 3.84 / 4.33 | El verde vivo no es texto |
| `hoja` | cualquier claro | 1.99–2.24 | Nunca texto sobre claro |
| `maiz` | `crema` / `blanco` | 1.60 / 1.80 | **El oro no es texto** sobre claro |
| `canela` | `crema` / `blanco` | 2.59 / 2.92 | Para texto, `canela-oscuro` |
| `blanco` | `maiz` / `canela` | 1.80 / 2.92 | Ilegible |
| `marca-fuerte` | `crema-oscuro` / `kraft` | 4.25 / 3.52 (2026-10-14) | No hay enlaces de texto sobre esas superficies |
| `canela-oscuro` | `kraft` (texto < 24 px) | 3.85 | Solo texto grande |
| `bosque` | `canela-oscuro` | 1.66 (2026-10-14) | Ni texto ni anillo de foco dentro de `.tema-canela` |
| `hoja` | `canela-oscuro` | 2.62 (2026-10-14) | Ni icono |
| `maiz` (trazo) | `kraft` / `crema-oscuro` | 1.18 / 1.42 | Decorativo invisible: el h2 no va sobre esas superficies |
| `hoja-claro` | `crema` | 1.01 | No es **única** señal de estado activo |
| `crema-oscuro` / `kraft` | `crema` | 1.12 / 1.36 | Separan superficies, no indican estado ni son bordes de control |
| Cualquier texto | foto o mapa sin fondo opaco | impredecible | Fondo sólido detrás siempre |

El logo está exento (1.4.3, logotipo), pero su texto alternativo dice el nombre completo.

### 3.4 Reglas derivadas
1. Texto sobre claro: `tinta`, `tinta-suave`, `bosque`, `marca-fuerte` (solo crema, blanco, hoja-claro) o `canela-oscuro`. Sobre `bosque`: `blanco`, `crema` o `maiz`. Sobre `canela-oscuro`: `blanco` o `crema`.
2. **Jerarquía de botones única** (heurística 4):
   - **CTA oro** (Nunito 800): la acción principal de la vista. **Máximo uno por vista.** Sobre claro lleva borde `bosque` 2 px; sobre `bosque`, sin borde.
   - **Primario** (`bosque` + blanco): acciones importantes secundarias sobre claro.
   - **Secundario** (borde 2 px `bosque`, texto `bosque`): el resto sobre claro. **Secundario invertido** (borde y texto `crema`) sobre verde oscuro.
   - Alto mínimo 48 px, `rounded-boton`, `:active` → `scale(0.96)` en 90 ms.
3. Un color **nunca** es el único portador de información (1.4.1): vista activa = pastilla + peso 800 + `aria-current`; fila activa = barra de 4 px + 800; "Abierto/Cerrado" = palabra + icono.

---

## 4. Tipografía

**Presupuesto: 3 familias, 4 pesos** (sin cambios): Nunito 400 y 800, Cormorant Garamond 700, Caveat Brush 400 (subconjunto recortado).

| Rol | Familia | Peso | Utilidad | Reglas |
|---|---|---|---|---|
| Títulos, botones, precios, antetítulos, etiqueta activa | **Nunito** | **800** | `font-display font-titulo` | `text-wrap: balance` |
| Cuerpo, Misión/Visión, etiquetas inactivas | **Nunito** | **400** | `font-sans` | |
| Nombre de producto | **Cormorant Garamond** | **700** | `font-serif font-producto` | Solo ≥ 22 px |
| Acento manuscrito | **Caveat Brush** | **400** | `font-script` | 1–2 frases por vista, ≥ 24 px, nunca en botones |

- **Caveat Brush** es un subconjunto propio (`src/assets/fonts/caveat-brush-acento.woff2`). Al cambiar el acento de Inicio a **"Tu mejor aliado para tus animales"** hay que **regenerarlo** (comando comentado en `global.css`) con los glifos de todas las frases manuscritas vigentes.
- Precargar solo Nunito 800. Sin 600 ni 700.

### Escala (depende también del alto, porque no hay scroll)

| Token | 1440×900 | 360×640 | Uso |
|---|---|---|---|
| `text-frase` | 58 px | 32 px | "Somos parte de tu familia" |
| `text-h2` | 40 px | 24 px | h2 de cada vista |
| `text-acento` | 37 px | 24 px | Acento manuscrito |
| `text-producto` | 32 px | 22 px | Producto al frente |
| `text-h3` | 23 px | 18 px | Títulos de pilares |
| `text-lead` | 22 px | 17 px | Subtítulo de Inicio, **texto de Misión y Visión** |
| `text-cuerpo` | 17 px | 15 px | Filas de la lista, valores, diferenciales |
| `text-etiqueta` | 16 px | 13 px | Barra, pestañas, antetítulos |
| `text-chico` | 14 px | 13 px | Notas, pie |

**Mínimo absoluto 13 px**, también en la barra ("COMERCIAL" sube de 11 a 12 px con más interletrado: es un rótulo del logotipo, no texto de lectura; ver 6).

---

## 5. Retícula general

- **Vista** = `100dvh` menos la barra. Escritorio: barra 64 px → vista útil de **836 px** a 1440×900; padding `spacing-vista` (44 px) → **748 px** de contenido. Móvil: barra superior **44 px** + barra inferior 64 px (+ `safe-area-inset-bottom`) → **532 px** a 360×640.
- Escritorio: 12 columnas, `max-w-contenido` (1280 px), gutter `spacing-mosaico` (22 px). Móvil: 4 columnas, margen 16 px, gutter 10 px.
- **Sistema de títulos:** en las 4 vistas claras la cabecera (antetítulo + h2 + trazo) va **siempre arriba a la izquierda**, en la misma posición (Q6). Ocupa 72 px en escritorio y 52 px en móvil.
- Si en 360×640 una vista no cabe: scroll interno de esa vista (excepción declarada), nunca recorte de contenido esencial ni contenido detrás de un clic.
- Probar también 1366×650.

---

## 6. Barra de navegación

### Escritorio (≥ 48rem)

- Fondo `crema` **opaco**, `shadow-barra`, 64 px. Igual en las 5 vistas.
- Marca: isotipo 40 px + bloque de dos líneas: **"COMERCIAL"** Nunito 800, **12 px** (`0.75rem`), mayúsculas, `tracking-[0.16em]`, `canela-oscuro` (5.22) (G4: antes 11 px) y **"Hinojosa"** Nunito 800, 20 px, `bosque`. Enlaza a `#inicio`.
- 5 ítems con nombres completos (heurística 6).
- **Vista activa:** pastilla `bosque` de 40 px con texto blanco (9.80) **y** peso 800 **y** `aria-current="page"`.
- **Animación (B1–B4, detalle en `vistas-hinojosa`):**
  - Cada rótulo reserva el ancho de su versión en 800 (pseudo-elemento invisible con `content: attr(data-texto)`): los vecinos no se mueven.
  - Pastilla que se desliza con **estiramiento direccional**: el borde que va delante tarda 240 ms y el de atrás 300 ms, `ease-vista`.
  - El texto del ítem nuevo se vuelve blanco cuando la pastilla ya está debajo (retraso de 150 ms; versión pulida: inversión exacta con `clip-path` sobre una copia `aria-hidden`).
  - Hover inactivo: fondo `hoja-claro` en 150 ms (tinta encima 12.57). Pulsación: `scale(0.96)` en 90 ms.
  - `.anima` no se retira hasta el `transitionend`.
  - Con movimiento reducido o pausa: la pastilla salta.
- Foco: anillo `bosque` 3 px + 3 px de separación.

### Móvil (< 48rem)

- **Barra superior de 44 px** (G5; antes 52), isotipo **32 px** y el mismo bloque "COMERCIAL / Hinojosa" (12 / 16 px). Sin controles.
- **Barra inferior de 5 ítems**, 64 px + safe-area: icono 24 px + etiqueta `text-etiqueta` (13 px). Etiquetas cortas "Nosotros", "Por qué"; "Por qué" lleva nombre accesible "Por qué elegirnos" (contiene la etiqueta visible, WCAG 2.5.3).
- Activo: pastilla `bosque` 56×32 detrás del icono (icono blanco), etiqueta `bosque` 800, `aria-current`. Al llegar, el icono hace un "pop" `scale(0.92)` → 1 en 220 ms con `--ease-rebote`. Al tocar: fondo `hoja-claro` en 90 ms. Sin pop con movimiento reducido o pausa.
- Nota para `frontend`: el token `--spacing-barra` del bloque móvil de `tokens.css` sigue en `3.25rem`; hay que pasarlo a `2.75rem` al aplicar G5 (esta guía no toca tokens existentes).

---

## 7. Las 5 vistas

### 7.1 Inicio: vitrina lateral (decisión 0-B)

El **hero partido con Canela grande se descartó**. Se mantiene el bloque centrado y Canela en la franja inferior; se enriquece con costales, un segundo botón, accesos y animales.

**1440×900**
```
┌──────────────────────── barra 64 ─────────────────────────────┐
│  · grano          fondo radial bosque → bosque-noche   hoja ·  │
│                     ░ marca de agua del trébol ░               │
│                      ╭──────────────────╮                      │
│  ┌──┐┐              (  LOGO en insignia  )  30dvh       ┌┌──┐  │
│  │  ││ atrás         ╰──────────────────╯       atrás  ││  │  │
│  │fr││ −4°   Tu mejor aliado para tus animales   +4°   ││fr│  │
│  │en││     Venta de balanceados y productos para tus   ││en│  │
│  │te││                    animales                     ││te│  │
│  │−5°│        [ Ver productos ]  [ Cómo llegar ]       │+5°│  │
│  └──┘    (Granja) (Mascotas) (Comederos) (Granos)      └──┘  │
│        ⟡ Aves · ⟡ Cerdos · ⟡ Mascotas · ⟡ Tilapias           │
│ ═══════════════════════ horizonte hoja 25 % ═════════════════ │
│                     🐕 → corre de borde a borde      [❚❚]     │ franja
└──────────────────────────────────────────────────────────────┘
```

**Retícula:** `grid-template-rows: 1fr var(--franja-canela)` (sin cambios). La vitrina vive en la fila 1, apoyada en el horizonte; Canela en la fila 2.

**Bloque central** (columna centrada, `max-w-[36rem]`)
| Elemento | Especificación |
|---|---|
| Logo | `<h1>` dentro de la insignia, **máx. 30dvh** (270 px a 900; antes 34dvh) para dejar sitio a botones, accesos y animales. Es el **LCP**: sin animación, `fetchpriority="high"` |
| Insignia | Interior `blanco`. **Aro triple (I6):** `box-shadow: 0 0 0 4px var(--color-maiz), 0 0 0 10px var(--color-bosque-noche), 0 0 0 12px var(--color-horizonte-fuerte)` |
| Acento | **"Tu mejor aliado para tus animales"** (I4), Caveat `text-acento`, `maiz` (7.98 / 5.44). Único acento de la vista. Sustituye al lema, que ya está en el logo |
| Subtítulo | "Venta de balanceados y productos para tus animales", Nunito 400 `text-lead`, `crema`, `max-w-[28ch]` |
| Botones (I3) | **"Ver productos"** CTA oro sin borde (principal) + **"Cómo llegar"** secundario invertido (borde 2 px y texto `crema`, ancla a `#visitanos`). En fila, gap 12 px, 52 px de alto |
| Accesos por categoría (I3) | 4 **chips-enlace** "Granja · Mascotas · Comederos · Granos" → `#productos` con esa pestaña elegida. 44 px de alto, `rounded-chip`, borde 1,5 px `hoja` (4.36), texto `crema` 800 `text-etiqueta`; hover: fondo `hoja` al 15 %; foco `maiz` |
| Fila de animales (I5) | **Informativa, no son botones:** icono 24 px `hoja` + palabra `crema` 400 `text-etiqueta`, separados por un punto `maiz` de 5 px. Sin bordes ni fondo (se distingue de los chips de arriba) |

Presupuesto vertical (696 px útiles sobre la franja): insignia 270 + 20 + acento 44 + 12 + subtítulo 64 + 24 + botones 52 + 20 + accesos 44 + 16 + animales 28 = **594 px**. A 1366×650: insignia 195 → **465 de 482 px**; los huecos usan `clamp()` con `dvh`.

**Vitrina lateral (I1, I2): solo en ≥ 64rem**
| Lado | Frente (exterior, más grande) | Atrás (interior, hacia el logo) |
|---|---|---|
| Izquierda | `granja/pollos`, `rotate(-5deg)` | `mascotas/procan-adultos`, `rotate(4deg)` |
| Derecha | `granos/maiz-en-grano`, `rotate(5deg)` | `granja/cerdos`, `rotate(-4deg)` |

- El de **frente** enmarca la vista desde el borde; el de **atrás** queda detrás y hacia el centro, solapado un 30 % con el de frente, `scale(0.8)`, 6 % más arriba, con la capa `velo-costal` (tinta al 25 %) recortada con `mask-image` de la propia imagen (misma regla de profundidad que el carrusel).
- **Alto máximo: `min(24dvh, 15vw)`** (216 px a 1440×900; 154 px a 1024). El área del costal de frente (≈ 35 000 px²) queda muy por debajo de la insignia (≈ 97 000 px²): **el logo sigue siendo el LCP**. Si Lighthouse móvil o escritorio dijera lo contrario, se inyectan tras `load`.
- Apoyados en el horizonte (base del costal en la línea de suelo de la fila 1), con sombra de contacto: elipse 70 % del ancho × 12 px, `tinta` al 35 %, `blur(6px)` estático.
- Margen al borde: `spacing-vista`. Nunca invaden la columna central: si `100vw − 36rem` no deja 2 × 13rem libres, se oculta el de atrás.
- `-400.avif` (~16 kB c/u, ~64 kB en total), `aria-hidden="true"`, `alt=""`, `decoding="async"`, `fetchpriority="low"`, `data-profundidad="0.6"` (paralaje).

**Fondo (I7)**: SVG inline, < 3 kB en total.
- **3 granos** de 24–36 px (`maiz` con veta `canela`), cerca, `data-profundidad="0.5"`.
- **4–5 hojas del trébol del logo**, lejos, `hoja` al 20–30 %, 48–96 px, giradas al azar (fijo, no aleatorio en cada carga), `data-profundidad="0.2"`.
- **Marca de agua del trébol del isotipo** a ~70dvh, `hoja` al 5 %, centrada detrás de la insignia. Estática.
- Paralaje ≤ 8 px solo con `(hover: hover) and (pointer: fine)`; nada con movimiento reducido o pausa.

**Franja de Canela:** ver `storyboard-hero.md` (carrera de borde a borde). Botón de pausa 44×44 abajo a la derecha.

**Entrada (I9):** cascada tras el LCP, ver `storyboard-hero.md` §3.

**360×640** (sin vitrina, sin paralaje)
```
┌──────────── 44 ─────┐
│   ╭────────────╮    │
│  (  LOGO 22dvh )    │ 141
│   ╰────────────╯    │
│ Tu mejor aliado para│ 30 (24 px)
│  tus animales       │
│ Venta de balanceados│ 50
│ y productos...      │
│[Ver productos][Cómo llegar]│ 48, dos columnas
│(Granja)(Mascotas)(Comederos)(Granos)│ 44, una fila
│ Aves · Cerdos · Mascotas · Tilapias │ 28
│ ═══════════════════ │
│   🐕 →         [❚❚] │ franja 91
├──────────── 64 ─────┤
```
Presupuesto: 141 + 12 + 30 + 8 + 50 + 16 + 48 + 12 + 44 + 12 + 28 = **401 de 441 px**. La fila de animales ocupa el aire que antes quedaba entre el CTA y la franja (I5). Si el acento ocupa dos líneas, la insignia baja a 20dvh.

### 7.2 Quiénes somos (mosaico, todo visible, sin clics)

**1440×900**
```
┌──────────────────────── barra ───────────────────────────┐
│ QUIÉNES SOMOS                                            │ antetítulo
│ Calidad, confianza y compromiso   (h2, texto pendiente)  │ 72
│ ▔▔▔▔▔▔▔▔ trazo maíz                                      │
│ ┌──────────────────────────────┐ ┌────────────────────┐  │
│ │ crema-oscuro                  │ │ MISIÓN canela-oscuro│ │
│ │   [video de Canela, contain]  │ │ 2 líneas, lead 400  │ │
│ │  ░░░ suelo hoja-claro ░░░     │ └────────────────────┘  │
│ ├──────────────────────────────┤ ┌────────────────────┐  │
│ │ Somos parte de tu familia     │ │ VISIÓN bosque       │ │
│ │ (banda bosque)                │ │ 2 líneas, lead 400  │ │
│ └──────────────────────────────┘ └────────────────────┘  │
│ ┌ hoja-claro ────────────────────────────────────────────┐│
│ │ ⟡ Buen trato • ⟡ Calidez • ⟡ Amabilidad • ⟡ Respons. •…││ 84
│ └────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```
- Alturas: 72 + 22 + **548** + 22 + 84 = **748 px**. Los ~60 px que libera la banda de valores van a la tarjeta grande (N5).
- **Tarjeta grande:** `rounded-tarjeta-grande`, `overflow: hidden`.
  - **Video (N1, N2):** `object-fit: contain; object-position: 50% 100%` (la gorra nunca se corta). Ideal: `canela-jugando-alfa.webm` sobre `crema-oscuro` con el suelo `hoja-claro`, y póster con alfa (WebP) para Safari, que no reproduce alfa VP9. Si se queda el video con fondo: la caja toma el **gris medido en el póster** para que no se vea el marco. Silenciado, `poster`, botón de pausa propio, `play()` a los 400 ms (al terminar la transición de vista).
  - **Banda de la frase:** `bosque` opaca, frase `text-frase` 800 blanco; "familia" Caveat `maiz` (5.44).
  - Cuando exista foto del local, puede sustituir o acompañar al video.
- **Misión:** `canela-oscuro`; antetítulo `crema` 800; texto **Nunito 400 `text-lead`** `blanco` (N6), 2 líneas.
- **Visión** (→ **"Nuestra historia"** cuando la dueña dé el año y la familia): `bosque`; antetítulo `maiz`; texto Nunito 400 `text-lead` blanco, 2 líneas.
- **Banda de valores (N5):** **una sola banda** `hoja-claro`, 6 × "icono 28 px trazo `bosque` + palabra Nunito 800 `tinta`" en línea, separados por un punto `maiz` de 6 px. Icono **sin círculo** (el círculo con aro es solo de los pilares).
- **Hover (N7):** tilt de hasta `--tilt-max` (3°) **solo en la tarjeta grande y la banda de valores** (superficies no pulsables decorativas). Misión y Visión **solo se elevan** (`translateY(-4px)` + `shadow-suave`). Nunca revela contenido. Solo con `(hover: hover)`, nada con movimiento reducido o pausa.
- Nada en esta vista depende de un clic.

**360×640**: título 52 · tarjeta grande con video `aspect-ratio: 16/8` (N8) + banda de frase · Misión · Visión · banda de valores en 2 columnas × 3 filas (palabra sola, sin icono, 14 px, puntos maíz al inicio de cada palabra). Scroll interno de la vista como red de seguridad.

### 7.3 Productos (pantalla partida)

**1440×900**
```
┌──────────────────────────── barra ─────────────────────────────────┐
│ PRODUCTOS                               │ ┌ bosque ─────────────────┐│
│ Lo que tenemos para tus animales        │ │ Buscar producto          ││
│ ▔▔▔▔▔ trazo maíz                        │ │ [🔍 Escribe un nombre  ×]││
│ [Granja 9] (Mascotas 16) (Com. 5) (Gr 7)│ ├ kraft ── GRANJA · 9 ─────┤│
│     ▫    ▫     ▫     ▫                  │ │▌[48] Camperito pollos  $ ││ ← fila activa blanca
│ (◄)       ┌────────┐         (►)        │ │ [48] Nutri Pollos      $ ││   panel hoja-claro
│   ▫       │ FRENTE │          ▫         │ │ [48] ...          ↕      ││
│           │ 15rem  │                    │ ├ kraft ── MASCOTAS · 16 ──┤│
│           └────────┘                    │ │ ...                      ││
│      ════ tarima kraft ════             │ ├ bosque ──────────────────┤│
│     Camperito pollos (Cormorant 32)     │ │ Precios referenciales —  ││
│  Granja · 1 de 9  [$28.00]              │ │ Marcas registradas…      ││
│  [ Preguntar por este producto ]  oro   │ └──────────────────────────┘│
└──────────────── 55 % ───────────────────┴──────── 45 % ──────────────┘
```
- Columnas 55 / 45, gap 22 px. Superficies y textos: mapa 2.2.
- **Producto al frente más grande (P7):** en ≥ 64rem, `--carrusel-ancho: clamp(11.25rem, 24dvh, 15rem)` (216 px a 900 de alto → 288 de alto). Comprobar que el anillo de 12 de Mascotas no se recorte en el 55 %.
- **Pestañas:** 44 px; activa `bosque` + blanco 800; inactiva `crema-oscuro` + borde `tinta-suave` + `tinta` 400; recuento al 75 % en inactivas (P10). Color en 180 ms y pulsación `scale(0.97)` (C6).
- **Rótulo:** nombre Cormorant `text-producto`, categoría · posición, chip de precio. Si el producto no tiene posición en el anillo (sin imagen), **no** se muestra el "·" (P5).
- **"Preguntar por este producto" (P2):** CTA oro con borde `bosque`, bajo el rótulo. Con WhatsApp confirmado: `wa.me` con el nombre del producto; mientras tanto, texto y destino definidos por `contenido-estrategia` → `#visitanos`.
- **Lista:** filas de 64 px con **miniatura de 48 px** en ≥ 48rem (P10; 40 px por debajo), `rounded-miniatura`, fondo `crema` en las que tienen alfa. Único panel con scroll interno.
- **Buscador (P1):** etiqueta visible, filtra mientras se escribe, busca también en `animales`. Sin resultados: mensaje + las 4 categorías como atajos (botones secundarios).
- **Fila activa (C4):** `aria-current` inmediato; resaltado visual al asentarse el anillo (ver storyboard-carrusel).
- **Tarjeta genérica de costal (P5)**, para productos sin imagen al frente del anillo y en su miniatura:
  - Misma huella 3:4 que los renders. Silueta de costal en CSS/SVG inline (< 1 kB): cuerpo `kraft` con las esquinas inferiores redondeadas (`rounded-b-[1.25rem]`) y la boca superior cosida: línea discontinua 2 px `canela-oscuro` al 12 % del alto y dos "orejas" en las esquinas superiores.
  - Trébol del isotipo en `bosque` al 12 %, centrado en el tercio superior.
  - **Nombre del producto** en Cormorant 700 `bosque` (6.41), centrado, máx. 3 líneas; debajo la categoría en `text-chico` `tinta-suave` (5.00). **Sin texto nuevo** (nada de "sin foto").
  - Sombra de contacto como los demás productos. En la miniatura de 48 px: solo el cuerpo kraft con el trébol.
- Notas fijas al pie del panel (bosque): "Precios referenciales — consulta disponibilidad" y "Marcas registradas de sus respectivos propietarios."

**360×640** (scroll interno de la vista, excepción declarada)
```
│ PRODUCTOS             │
│ Lo que tenemos…  ▔▔▔  │
│ ┌ bosque ───────────┐ │ ← buscador ARRIBA del carrusel (P6)
│ │ [🔍 Buscar ...   ]│ │
│ └───────────────────┘ │
│ (Granja)(Mascotas)(Co…│ ← pestañas con scroll-snap
│ ▫  ┌────┐  ▫          │ escenario 230 px
│    └────┘             │
│ Nombre (min-height 2lh)│
│ (◄) Granja · 1 de 9 (►)│ ← flechas junto al rótulo (P9)
│ [ Preguntar ]         │
│ ┌ lista hoja-claro ─┐ │
```
- **Hoja de detalle (decisión 0-B, P6):** tocar una fila abre un `<dialog>` modal desde abajo.
  - Fondo `crema`, `rounded-t-[1.75rem]`, `shadow-flotante`, asa `crema-oscuro` 40×4 px. Telón: `velo-franja` (bosque-noche al 60 %).
  - Contenido: imagen del producto sobre `crema` con foco de estudio `blanco` (o la tarjeta de costal), nombre Cormorant `text-producto` `tinta` (es el título del diálogo, recibe el foco), presentación `tinta-suave`, chip de precio `maiz`, **CTA oro "Preguntar"** con borde `bosque` a todo el ancho, botón secundario **"Cerrar"** (44 px).
  - Máx. 85dvh; scroll propio si no cabe. `Esc` y "Cerrar" la cierran; el foco vuelve a la fila. Con la hoja abierta, `←`/`→` no cambian de vista.
  - Entra con `translateY(100%)` → 0 en 300 ms `ease-vista` (sale en 200 ms `ease-salida`); con movimiento reducido o pausa aparece sin desplazamiento.

### 7.4 Por qué elegirnos

**1440×900**
```
┌────────────────────────── barra ─────────────────────────────┐
│ POR QUÉ ELEGIRNOS                                             │
│ Siempre a tu lado  (h2, texto pendiente)      ▔▔▔ trazo       │ 72
│ ┌ bosque ────┐┌ bosque ────┐┌ bosque ────┐┌ bosque ────┐      │
│ │ (◯ aro oro)││ (◯ aro oro)││ (◯ aro oro)││ (◯ aro oro)│      │ 220
│ │ Naturales  ││ Confiables ││ De calidad ││ Sostenibles│      │
│ └────────────┘└────────────┘└────────────┘└────────────┘      │
│█████ canela-oscuro A SANGRE: ◆ diferenciales (iconos oro) █████│ 100
│ ┌ hoja-claro ──────────────────────────────────────────────┐ │
│ │ ANIMALES QUE ATENDEMOS                                    │ │
│ │ ⟡Aves[sello] ⟡Cerdos[sello] ⟡Conejos ⟡Cuyes[sello] ⟡Vacas[sello] …│ 150
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
- **Título siempre arriba** (Q6); solo el grupo de bandas se centra con `margin-block: auto`.
- **Pilares:** 4 bloques `bosque`, icono 64 px (72 px si se quitan las descripciones, Q7) **en círculo con aro `maiz` 3 px** e interior `hoja-claro`: es la **única** familia con este patrón. Entrada única a los 400 ms. Solo se elevan al pasar el ratón (no son pulsables: sin tilt).
- **Diferenciales:** banda `canela-oscuro` a sangre, 4 columnas, iconos `maiz` 32 px, texto blanco, filetes `kraft` al 40 %. Textos 🔒 pendientes (Q2, Q3).
- **Animales:** banda `hoja-claro`; icono **suelto** 40 px `bosque` + palabra `tinta`; **sellos de costal** (40 px sobre etiqueta kraft girada −6°) junto a Aves, Cerdos, Vacas y Cuyes (Q1). Cuando exista `animales` en el catálogo, cada animal es un enlace a `#productos` filtrado (Q4): subrayado al hover y foco `bosque`.
- Alturas: 72 + 28 + 220 + 28 + 100 + 28 + 150 = **626 de 748 px**. Sin cifras inventadas.

**360×640:** título 52 · pilares 2×2 `bosque` (icono 40 + palabra) · diferenciales 2×2 en banda canela oscuro (14 px, 2 líneas) · animales 4×2 en banda `hoja-claro` (icono 32 + palabra 13 px; sellos de 28 px solo en las 4 especies). ≈ **510 de 532 px**.

### 7.5 Visítanos (sin mapa mientras no haya coordenadas)

**1440×900**
```
┌──────────────────────────── barra ──────────────────────────────┐
│ crema + textura hojas/granos 8 %            ░ trébol maíz 15 % ░ │
│  ┌ bosque (opaca) ────────────┐                                  │
│  │ VISÍTANOS (maíz)           │                 (PIN 5rem)        │
│  │ Comercial Hinojosa  ▔▔▔    │            ┌ canela-oscuro ─────┐ │
│  │ DIRECCIÓN  Muy pronto…     │            │ [trébol] El mapa    │ │
│  │ (✓ Abierto / ☾ Cerrado)    │            │ aparecerá cuando…   │ │
│  │ HORARIO  …                 │            └─────────────────────┘ │
│  │ REFERENCIAS  …             │                                  │
│  │ [ Cómo llegar ] oro        │                                  │
│  │ ⓦ ☎ ⓕ Muy pronto publicaremos… (una línea)                    │
│  └────────────────────────────┘                                  │
│ Comercial Hinojosa siempre a tu lado · © 2026 · Marcas…  (pie)   │
└──────────────────────────────────────────────────────────────────┘
```
- **Sin mapa (V3):** fondo `crema` con la textura de Inicio al 8 %, marca de agua del trébol en `maiz` al 15 %, pin de 4–5 rem y el aviso en un bloque `canela-oscuro` con el isotipo. **No** se dibujan calles, cuadrícula ni nada que pueda leerse como ubicación real.
- **Con mapa (Leaflet, solo con coordenadas confirmadas):** el mapa sustituye al fondo y al aviso; la tarjeta no cambia.
- **Tarjeta de datos:** `max-w-tarjeta-mapa`, a 44 px del borde izquierdo, centrada en vertical. **`bosque` 100 % opaca**, sin `backdrop-filter`. h2 "Comercial Hinojosa" (ya cumple el sistema de títulos) con trazo maíz.
  - Datos pendientes: `textos.comunes.datoPendiente`; **nunca** `PENDIENTE_CONFIRMAR` en pantalla (V1).
  - Canales pendientes en **una sola línea** (`textos.visitanos.contactoPendiente`) con iconos `pendiente-oscuro`, sin forma de botón.
  - CTA = "Cómo llegar"; el dato = "Referencias" (V4).
  - Estado: pastilla con icono + palabra (nunca solo color).
- **Fachada:** recuadro 288×200, marco `blanco` 6 px, cuando exista; hasta entonces no se reserva el hueco.
- **Pie** `bosque-noche`, una línea.
- WCAG 2.4.11: ningún control enfocable del mapa queda bajo la tarjeta (`panBy` si hace falta).

**360×640:** fondo con pin y aviso en 200 px arriba; la tarjeta pasa a hoja inferior `bosque` opaca con scroll interno, CTA a todo el ancho, pie al final.

---

## 8. Componentes base

- **Botones:** jerarquía en 3.4. Nunito 800, `rounded-boton`, mínimo 48 px.
- **Superficie** (sustituye a "tarjeta blanca"): `crema-oscuro`, `hoja-claro`, `kraft`, `bosque` o `canela-oscuro` según el mapa 2.2, `rounded-tarjeta`, sin borde, `shadow-suave` como mucho. Las no pulsables solo se elevan al hover; el tilt es solo para superficies decorativas (tarjeta grande y banda de valores).
- **Cabecera de vista:** antetítulo + h2 + trazo de pincel (2.3), `tabindex="-1"` en el h2 para el foco del router.
- **Insignia:** óvalo, interior `blanco`, aro triple en Inicio.
- **Icono en círculo con aro maíz:** **solo pilares**. Valores y animales: icono suelto.
- **Chip-enlace** (accesos por categoría): 44 px, borde visible, texto 800. **Fila informativa** (animales de Inicio): sin borde ni fondo, con puntos `maiz`. Que no se confundan (heurística 4).
- **Sello de costal:** miniatura 40 px (28 px en móvil) sobre etiqueta `kraft`, borde `filete-canela`, `rotate(-6deg)`, `aria-hidden` (la palabra del animal es el texto).
- **Pastilla de estado:** `rounded-chip`, 32 px, icono 16 px + palabra.
- **Foco:** anillo 3 px + 3 px de separación: `bosque` sobre claro, `maiz` en `.tema-oscuro`, `crema` en `.tema-canela`. Nunca se quita.
- **Objetivos táctiles:** 44×44 px.
- **Capas (`--z-*`):** vista 0 · Canela 10 · controles 20 · flotantes 30 · barra 50.

---

## 9. Logo

- **Solo el logo nuevo**. El logo "ANTES" está **descartado**: ni como referencia de color.
- El PNG actual tiene fondo blanco: va dentro de la insignia o sobre blanco. La versión blanca para fondos oscuros queda pendiente del vectorial.
- Mínimos: completo 160 px de ancho; isotipo 32 px (barra móvil) y 40 px (barra escritorio). Área de respeto: la altura de la "H".
- No se estira, recolorea, gira ni se le pone sombra o contorno. La **marca de agua** y las **hojas del fondo** son un trébol redibujado en SVG, no el logo: pueden ir en `hoja` o `maiz` a baja opacidad.
- Alt: "Comercial Hinojosa: Nutrición que da vida".

## 10. Canela

- Activos: `Canela.png` (sentada, pose inicial, reposo y movimiento reducido), sprites de carrera sacados de `flow/Puppy_running_in_place_1080p_20261013235908.mp4` y el video `Canela Jugando` (Quiénes somos).
- Aparece **solo en Inicio y Quiénes somos**.
- En Inicio: **carrera real de borde a borde** con giro en cada borde; solo se sienta al principio (ver `storyboard-hero.md`). Mismo tamaño que hoy (12–18 % del alto) e igual en móvil.
- **No se espeja la carrera** (el texto "HINOJOSA" de la gorra saldría al revés): se usa el tramo nativo hacia la derecha del video. El giro del borde derecho puede espejarse (~0,3 s, a tamaño de franja apenas se nota) o reproducirse al revés; se decide al verlo en la página.
- No se cambia el pelaje ni se quitan los accesorios. El render no lleva pañuelo: **confirmar con la dueña** que es la versión oficial.
- Decorativa: `aria-hidden="true"`.

## 11. Fotografía e imágenes de producto

- Fuente final preferida: **fotos propias del local**. Las imágenes de los afiches son referencia, no fuente final.
- Renders de `CatalogoF/` en el carrusel, la lista, la vitrina de Inicio, los sellos de la vista 4 y la hoja de detalle. Confirmar con la dueña derechos y que acepta mostrarlos.
- Siempre sobre **crema** (con foco `blanco`) o sobre `kraft` en los sellos; nunca sobre verde oscuro salvo la vitrina de Inicio, donde van separados del fondo por su sombra de contacto y el velo del de atrás.
- Iconos: trazo redondeado 2 px. Texturas (granos, hojas, trébol) en SVG ligero, nunca como imagen pesada de fondo.

## 12. Movimiento (resumen; detalle en los storyboards y en `vistas-hinojosa`)

**Una sola metáfora:** desplazamiento horizontal en el orden de las vistas (izquierda ↔ derecha, como la barra).

| Qué | Duración | Curva | Dónde |
|---|---|---|---|
| Vista saliente (opacidad + `translateX(-dir·1rem)`) | 160 ms | `ease-salida` | storyboard-hero §4 |
| Vista entrante (opacidad + `translateX(dir·2.5rem)` → 0) | 380 ms, +60 ms | `cubic-bezier(0.25, 1, 0.5, 1)` | storyboard-hero §4 |
| Bloques `[data-entra]` (2–3 por vista) | 300 ms, 50 ms entre bloques | `ease-vista` | storyboard-hero §4 |
| Pastilla de la barra (estiramiento direccional) | 240 / 300 ms | `ease-vista` | sección 6 |
| Cascada de Inicio en carga directa (I9) | 400 ms, 80 ms entre elementos; costales 600 ms | `ease-vista` | storyboard-hero §3 |
| Canela: carrera, frenada y giro | sprites a 12 fps, velocidad = zancada | lineal / frenada ease-out | storyboard-hero §2 |
| Giro de un paso del carrusel | 450 ms | `ease-giro` | storyboard-carrusel |
| Cambio de categoría (C5) | 160 + 320 ms | `ease-salida` / `ease-giro` | storyboard-carrusel |
| Rótulo (C2) | 110 + 200 ms | `ease-salida` / `ease-vista` | storyboard-carrusel |
| Hoja de detalle móvil | 300 ms (sale 200) | `ease-vista` / `ease-salida` | 7.3 |
| Hover de superficies | 200 ms | `ease-vista` | `--duracion-hover`, `--tilt-max` |
| Pulsación | 90 ms | ease-out | `--duracion-presion` |

- Solo `transform` y `opacity` (salvo el ancho del chip de precio, C3).
- Toda transición nueva respeta `prefers-reduced-motion` **y** la pausa del sitio (`html[data-movimiento="pausado"]`, que hoy no anula `transition`).
- Bucles de más de 5 s (Canela, video) con **pausa** visible (WCAG 2.2.2). El carrusel nunca gira solo.
- Los tokens `--duracion-vista` (400 ms), `--desplazamiento-vista`, `animate-vista-*` y `animate-canela-*` describen la versión 1 y se mantienen hasta que `animacion-interaccion` añada los nuevos keyframes; no se usan en componentes nuevos.

## 13. Comprobación con las heurísticas de Nielsen

| # | Heurística | Cómo la cumple esta guía |
|---|---|---|
| 1 | Visibilidad del estado | Pastilla en la barra; rótulo y fila activa que coinciden (C4, C7); "Abierto/Cerrado" con palabra |
| 4 | Consistencia | Una metáfora de movimiento; una jerarquía de botones; **un sistema de títulos** en las 4 vistas claras; el círculo con aro solo en pilares; chips-enlace distintos de filas informativas |
| 6 | Reconocer antes que recordar | Las 5 vistas siempre en la barra; accesos por categoría en Inicio; lista completa junto al carrusel |
| 8 | Minimalista | Sin lema repetido; valores en una banda; Misión/Visión en 2 líneas; un acento manuscrito y un CTA oro por vista |

## 14. Checklist de una vista nueva o modificada

- [ ] Cabecera antetítulo + h2 + trazo maíz arriba a la izquierda.
- [ ] Ninguna tarjeta `blanco` sobre `crema`.
- [ ] Un bloque `bosque` de peso; como mucho un bloque `canela-oscuro`.
- [ ] Proporción **medida sobre captura** dentro de la banda de 2.1 (o excepción declarada).
- [ ] Cada texto con un par de la tabla 3.1; ningún par de 3.3.
- [ ] Un solo CTA oro; el oro nunca como texto sobre claro.
- [ ] Revisado a 1440×900 y 360×640 (y 1366×650 en Inicio).

## 15. Requiere aprobación de la dueña

| # | Qué | Estado |
|---|---|---|
| 1 | **Textos del sistema de títulos** (antetítulo + h2): "QUIÉNES SOMOS / Calidad, confianza y compromiso", "PRODUCTOS / Lo que tenemos para tus animales", "POR QUÉ ELEGIRNOS / Siempre a tu lado". El sistema está aprobado; los textos no | Pendiente |
| 2 | **Visítanos fuera del 55/30/15** (≈ 69/22/9): aceptar la excepción o cambiar la tarjeta flotante por un panel `bosque` a toda altura con el aviso del mapa más grande (≈ 52/35/13; cambia la composición de la vista 5 del plan) | Pendiente |
| 3 | **Productos**: el 15 % de acento lo aportan los costales (el plan prohíbe color detrás de los productos). Confirmar que se acepta como excepción | Pendiente (informativo) |
| 4 | Textos 🔒 de Por qué: descripciones de los pilares (Q7), diferencial de categorías (Q3), franja de marcas y "Ubicación" enlazada (Q2) | Pendiente |
| 5 | Si se conserva el acento manuscrito de Por qué ("Calidad que alimenta, amor que se siente") junto al nuevo h2 | Pendiente |
| 6 | "Nuestra historia" en lugar de Visión: depende del año de apertura y la familia | Pendiente de datos |
| 7 | Render de Canela sin pañuelo como versión oficial; derechos de los renders de producto | Pendiente |

Ya aprobado y aplicado aquí (no requiere más): vitrina lateral, acento "Tu mejor aliado para tus animales", botones "Ver productos" + "Cómo llegar", accesos por categoría, fila de animales, Canela corriendo, transición en dos capas + entrada escalonada, navegación solo por barra, hoja de detalle móvil, reparto del color 55/30/15, trazo de pincel maíz, bandas canela oscuro y tono kraft.
