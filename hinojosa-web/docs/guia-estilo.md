# Guía de estilo: Comercial Hinojosa (sitio por vistas, v2)

> Fase 1 (diseño), revisada el 2026-10-12 para el modelo de **5 vistas a pantalla completa sin scroll** (`PLAN.md`, sección 3) y para los activos recibidos ese día (sección 0).
> Fuente de verdad de color, tipografía y tono: skill `marca-hinojosa`. Tokens: `src/styles/tokens.css` (importado desde `global.css`).
> Storyboards: `docs/storyboard-hero.md` (Canela en Inicio + transición entre vistas) y `docs/storyboard-carrusel.md` (carrusel 3D de Productos).
> Estado: **propuesta pendiente de aprobación de la dueña.** Los hex siguen siendo aproximados: al llegar el logo vectorial se afinan en `tokens.css` y se recalcula la tabla de la sección 3 (y la de la skill).

---

## 1. Idea visual

"Del campo a tu casa": crema cálido, el verde del trébol del logo y el oro del maíz. Una tienda de barrio de confianza, no una cadena. La firma visual es la **insignia ovalada** (aro verde bosque + aro oro + interior claro) que ya usan los afiches: enmarca el logo en Inicio, los iconos de valores y el pin del mapa.

El rediseño responde a un problema concreto: **había exceso de texto mal repartido** (heurística 8 de Nielsen). En cada vista el texto es un recurso escaso: titulares de una línea, frases de una o dos, nunca párrafos. Lo que no cabe se recorta (los textos completos viven en `negocio.json`), no se esconde detrás de un clic.

Evitamos: degradados morados, negro puro, sombras grises duras, cristal translúcido sobre fotos o mapas, tarjetas idénticas en rejilla de plantilla y más de un botón oro por pantalla.

---

## 2. Paleta

| Token (utilidad Tailwind) | Hex | Rol |
|---|---|---|
| `bosque` | `#1B4D2B` | Títulos, **botón primario** (con blanco), indicador de vista activa, foco sobre claro |
| `bosque-noche` | `#10301B` | Fondo de Inicio (degradado con `bosque`), línea de pie, hover del primario |
| `marca` | `#2E8B2E` | Verde vivo del logo: **solo** bordes, iconos e ilustración. Nunca texto, nunca fondo de botón con texto blanco |
| `marca-fuerte` | `#267A2C` | Enlaces de texto sobre claro. No se usa como botón (un solo verde de botón: `bosque`) |
| `hoja` | `#7BBF3A` | Acento decorativo: hojas, línea de la tarima, subrayados |
| `hoja-claro` | `#EAF4DC` | Fila activa de la lista, pastilla "Abierto ahora", fondo de iconos |
| `maiz` | `#F2B823` | Oro: fondo del CTA (texto `tinta`), acento manuscrito sobre `bosque` |
| `maiz-oscuro` | `#D99E0F` | Hover del CTA oro |
| `crema` | `#F6F1E4` | Fondo claro principal y de la barra |
| `crema-oscuro` | `#EDE4CC` | Tarima del carrusel, pastilla "Cerrado", bordes decorativos |
| `canela` | `#C98A3A` | Calidez, granos (decorativo) |
| `canela-oscuro` | `#8A5A1F` | Texto canela legible (eyebrows de Misión) |
| `tinta` | `#14301D` | Texto principal |
| `tinta-suave` | `#3D5A45` | Texto secundario, notas, borde de campos y pestañas inactivas |
| `blanco` | `#FFFFFF` | Tarjetas, panel de lista, **tarjeta del mapa (opaca)** |

Además hay **tokens de rol** (`boton-fondo`, `cta-fondo`, `cta-borde`, `indicador`, `fila-activa`, `estado-abierto-fondo`, `borde-campo`, `foco`…) que llevan la regla de contraste en su comentario. En componentes nuevos se usa el token de rol, no el de color.

### Proporción 60 / 30 / 10 por vista

| Vista | 60 % claro | 30 % verde | 10 % oro |
|---|---|---|---|
| Inicio | barra crema, insignia del logo | **fondo `bosque-noche`→`bosque`** (excepción: es la portada) | CTA "Ver productos", lema manuscrito, granos |
| Quiénes somos | fondo crema, tarjetas blancas | banda de la frase y tarjeta Visión en `bosque` | eyebrow oro de Visión, aro de los iconos |
| Productos | fondo crema, panel blanco | pestaña activa, flechas, cabeceras | chip de precio del producto al frente |
| Por qué elegirnos | fondo crema, tarjetas | banda de diferenciales en `bosque` | iconos de diferenciales en oro |
| Visítanos | mapa (tonos claros), tarjeta blanca | pie `bosque-noche`, botón WhatsApp | CTA "Cómo llegar" |

`canela` y `hoja` quedan por debajo del 5 %. Si el oro aparece en más de 2–3 puntos de una misma pantalla, sobra.

---

## 3. Contrastes verificados (WCAG 2.2 AA)

Fórmula de luminancia relativa de WCAG, (L1 + 0.05) / (L2 + 0.05). Umbrales: **4.5:1** texto normal (1.4.3), **3:1** texto grande (≥ 24 px, o ≥ 18.66 px en negrita) y componentes/indicadores (1.4.11). Los pares de la skill `marca-hinojosa` se copian tal cual; los marcados **(nuevo)** se calcularon para este rediseño.

### 3.1 Texto: pares permitidos

| Frente | Fondo | Ratio | Uso |
|---|---|---|---|
| `blanco` | `bosque-noche` | **14.38** | Texto sobre el fondo de Inicio y el pie |
| `tinta` `#14301D` | `blanco` | **14.28** | Cuerpo sobre blanco (tarjetas, panel, tarjeta del mapa) |
| `crema` | `bosque-noche` | **12.76** (nuevo) | Línea de pie de Visítanos, subtítulo de Inicio |
| `tinta` | `crema` `#F6F1E4` | **12.67** | Cuerpo sobre crema |
| `tinta` | `hoja-claro` | **12.57** | Fila activa de la lista |
| `tinta` | `crema-oscuro` | **11.27** | Pastilla "Cerrado" |
| `blanco` | `bosque` `#1B4D2B` | **9.80** | **Botón primario**, pastilla de vista activa, banda de la frase |
| `bosque` | `blanco` | **9.80** | Títulos sobre blanco |
| `bosque` | `crema` | **8.69** | Títulos sobre crema |
| `crema` | `bosque` | **8.69** | Texto claro en bandas verdes |
| `bosque` | `hoja-claro` | **8.63** (nuevo) | Pastilla "Abierto ahora" |
| `maiz` | `bosque-noche` | **7.98** | Lema manuscrito en Inicio |
| `tinta` | `maiz` `#F2B823` | **7.93** | **CTA oro**; chip de precio |
| `tinta-suave` | `blanco` | **7.64** | Texto secundario en tarjetas y lista |
| `tinta-suave` | `crema` | **6.78** | Notas sobre fondo crema |
| `tinta-suave` | `hoja-claro` | **6.73** (nuevo) | Marca/presentación en la fila activa |
| `tinta` | `hoja` | **6.36** | Etiquetas verde claro |
| `tinta-suave` | `crema-oscuro` | **6.03** (nuevo) | Horario dentro de la pastilla "Cerrado" |
| `tinta` | `maiz-oscuro` | **6.02** | Hover del CTA oro |
| `canela-oscuro` | `blanco` | **5.88** (nuevo) | Eyebrow "MISIÓN" en tarjeta blanca |
| `maiz` | `bosque` | **5.44** | Oro como texto **solo** sobre verde oscuro (eyebrow de Visión) |
| `marca-fuerte` | `blanco` | **5.38** | Enlaces |
| `canela-oscuro` | `crema` | **5.22** | Texto canela sobre crema |
| `tinta` | `canela` | **4.88** | Texto sobre bloque canela |
| `marca-fuerte` | `crema` | **4.77** | Enlaces sobre crema |

### 3.2 Componentes e indicadores (3:1)

| Elemento | Contra | Ratio | Nota |
|---|---|---|---|
| Pastilla de vista activa `bosque` | barra `crema` | **8.69** | La forma rellena es la señal no cromática |
| Borde de flechas y pestañas `bosque` 2 px | `crema` / `blanco` | **8.69 / 9.80** | |
| Borde de buscador y pestañas inactivas `tinta-suave` | `blanco` / `crema` | **7.64 / 6.78** | |
| CTA oro | fondo `bosque` | **5.44** | En Inicio el botón se distingue por sí solo |
| CTA oro **con borde `bosque` 2 px** | fondo claro | **8.69** (borde) | Obligatorio: el oro solo contra crema da 1.60 |
| Anillo de foco `bosque` 3 px | `crema` / `blanco` | **8.69 / 9.80** | |
| Anillo de foco `maiz` 3 px | `bosque` / `bosque-noche` | **5.44 / 7.98** | Inicio y bandas verdes (`.tema-oscuro`) |
| Borde `marca` | `blanco` / `crema` | **4.33 / 3.84** | Solo borde o icono |
| Iconos `hoja` | `bosque` | **4.36** | |
| Pelaje de Canela `canela` | `bosque` | **3.35** (nuevo) | Decorativo; se lee bien sobre el fondo de Inicio |

### 3.3 Prohibidos

| Frente | Fondo | Ratio | Por qué |
|---|---|---|---|
| `blanco` | `marca` `#2E8B2E` | 4.33 | **Trampa principal**: el botón verde vivo con texto blanco no cumple. Primario = `bosque` |
| `marca` | `crema` / `blanco` | 3.84 / 4.33 | El verde vivo no es color de texto |
| `hoja` | cualquier claro | 1.99–2.24 | Nunca texto sobre claro |
| `maiz` | `crema` / `blanco` | 1.60 / 1.80 | **El oro no es color de texto** sobre claro |
| `canela` | `crema` / `blanco` | 2.59 / 2.92 | Para texto, `canela-oscuro` |
| `blanco` | `maiz` / `canela` | 1.80 / 2.92 | Ilegible |
| `hoja-claro` | `crema` | 1.01 (nuevo) | No sirve como **única** señal de estado activo: va con barra `bosque` o forma |
| `crema-oscuro` | `crema` | 1.12 (nuevo) | Solo como borde decorativo de tarjetas **no interactivas** |
| Cualquier texto | foto o mapa sin fondo opaco | impredecible | Texto sobre imagen siempre con fondo sólido detrás |

El logo está exento (1.4.3, logotipo), pero su texto alternativo dice el nombre completo.

### 3.4 Reglas derivadas
1. Texto sobre claro: solo `tinta`, `tinta-suave`, `bosque`, `marca-fuerte` (enlaces) o `canela-oscuro`. Sobre verde oscuro: `blanco`, `crema` o `maiz`.
2. **Jerarquía de botones única en todo el sitio** (heurística 4):
   - **CTA oro** (`cta-fondo` + `cta-texto`, Nunito 800): la acción principal de la vista. **Máximo uno por vista.** Sobre claro lleva borde `bosque` 2 px.
   - **Primario** (`bosque` + blanco): acciones importantes secundarias (WhatsApp, Llamar).
   - **Secundario** (borde 2 px `bosque`, texto `bosque`, fondo transparente): el resto.
   - Alto mínimo 48 px, `rounded-boton`, `:active` → `scale(0.96)` en 90 ms.
3. Un color **nunca** es el único portador de información (1.4.1): vista activa = pastilla rellena + peso 800 + `aria-current`; "Abierto/Cerrado" = palabra + icono distinto + color.

---

## 4. Tipografía

**Presupuesto: 3 familias, 4 pesos.** El sitio anterior cargaba 4 familias y 7 pesos (Baloo 2 700/800, Nunito 400/600/700, Cormorant 700, Caveat 400). Para respetar el techo sin perder ninguno de los cuatro roles, **se retira Baloo 2** y Nunito ExtraBold hace de título de marca (opción que el PLAN admite). Nunito tiene las terminaciones redondeadas que piden el logo y los afiches.

| Rol | Familia | Peso | Utilidad | Reglas |
|---|---|---|---|---|
| Títulos de marca, botones, precios, etiqueta activa | **Nunito** | **800** | `font-display font-titulo` | `text-wrap: balance` |
| Cuerpo, etiquetas inactivas | **Nunito** | **400** | `font-sans` | |
| Nombre de producto | **Cormorant Garamond** | **700** | `font-serif font-producto` | Solo ≥ 22 px (`text-producto`) |
| Acento manuscrito | **Caveat Brush** | **400** | `font-script` | 1–2 frases por vista, ≥ 24 px, nunca en botones ni texto corrido |

Imports `@fontsource` (en `Layout.astro`; el frontend debe sustituir los actuales):
```
@fontsource/nunito/latin-400.css
@fontsource/nunito/latin-800.css
@fontsource/cormorant-garamond/latin-700.css
@fontsource/caveat-brush/latin-400.css
```
`font-display: swap` viene incluido. Precargar solo Nunito 800 (titulares de Inicio). Sin 600 ni 700: si un texto necesita "semi-negrita", es 800 o es 400.

### Escala (depende también del alto, porque no hay scroll)

| Token | 1440×900 | 360×640 | Uso |
|---|---|---|---|
| `text-frase` | 58 px | 32 px | "Somos parte de tu familia" |
| `text-h2` | 40 px | 24 px | Título de cada vista |
| `text-acento` | 37 px | 24 px | Lema manuscrito |
| `text-producto` | 32 px | 22 px | Producto al frente del carrusel |
| `text-h3` | 23 px | 18 px | Títulos de tarjeta |
| `text-lead` | 22 px | 17 px | Subtítulo de Inicio |
| `text-cuerpo` | 17 px | 15 px | Texto de tarjetas, filas de la lista |
| `text-etiqueta` | 16 px | 13 px | Barra, pestañas, eyebrows (mayúsculas, +0.06 em) |
| `text-chico` | 14 px | 13 px | Notas legales, pie |

Los tamaños grandes usan `min(vw, dvh)`: en un portátil de 1366×650 bajan solos en lugar de empujar contenido fuera de la vista. Precios: Nunito 800 + `tabular-nums` (clase `.cifra`).

---

## 5. Retícula general

- **Vista** = `100dvh` menos la barra. Escritorio: barra 64 px → vista útil de **836 px** a 1440×900; padding `spacing-vista` (44 px) → **748 px** de contenido. Móvil: barra superior 52 px + barra inferior 64 px (+ `safe-area-inset-bottom`) → **524 px** a 360×640.
- Escritorio: 12 columnas, `max-w-contenido` (1280 px), gutter `spacing-mosaico` (22 px).
- Móvil: 4 columnas, margen 16 px, gutter 10 px.
- Cada vista tiene un presupuesto de altura (abajo). Si en 360×640 no cabe, se aplica la **excepción declarada** del PLAN: scroll interno de esa vista, nunca recorte de contenido esencial ni contenido detrás de un clic. Las vistas que lo necesitan están marcadas.
- Probar también 1366×650 (portátil con barra de navegador): es el caso más apretado en escritorio.

---

## 6. Barra de navegación

### Escritorio (≥ 768 px)

```
┌───────────────────────────────────────────────────────────────────────┐ 64 px, crema opaca
│ [H] Comercial Hinojosa      Inicio  (Quiénes somos)  Productos  Por qué elegirnos  Visítanos │
│                                     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                    │
└───────────────────────────────────────────────────────────────────────┘ sombra-barra
```

- Fondo `crema` **opaco**, `shadow-barra`. Igual en las 5 vistas (también sobre el verde de Inicio): la barra no cambia de piel.
- Izquierda: isotipo "H" 40 px + "Comercial Hinojosa" en Nunito 800, 20 px, `bosque`. Enlaza a `#inicio`.
- Derecha: 5 ítems con los nombres completos (heurística 6: siempre visibles).
- **Vista activa (heurística 1, WCAG 1.4.1):** pastilla rellena `bosque` de 40 px de alto con texto blanco (9.80) **y** peso 800 frente a 400 de los inactivos, **y** `aria-current="page"`. La pastilla contrasta 8.69 con la barra, así que la forma por sí sola ya comunica el estado.
- Al cambiar de vista, la pastilla **se desliza** hasta el nuevo ítem: `--duracion-indicador` 300 ms, `ease-vista`. Es la misma metáfora horizontal de la transición (sección 3 del storyboard-hero). Con `prefers-reduced-motion`, salta sin animación.
- Inactivo hover: fondo `hoja-claro` (tinta encima 12.57). Foco: anillo `bosque` 3 px + 3 px de separación.
- Objetivos: 40 px de alto × ancho del texto + 32 px de padding (≥ 44 px de ancho en todos).

### Móvil (< 768 px)

```
┌──────────────────────────────┐ 52 px
│ [H] Comercial Hinojosa       │
├──────────────────────────────┤
│                              │
│          (vista)             │ 524 px
│                              │
├──────────────────────────────┤ 64 px + safe-area
│  ⌂     ☺     ▦     ★     ⌖   │
│Inicio Nosotros Productos Por qué Visítanos│
└──────────────────────────────┘
```

- **Barra inferior de 5 ítems** en vez de hamburguesa: las 5 vistas siguen visibles (heurística 6) y no hay panel que abrir. 72 px de ancho por ítem a 360 px.
- Ítem: icono 24 px + etiqueta `text-etiqueta` (13 px). Las etiquetas visibles son cortas ("Nosotros", "Por qué") y son también el nombre accesible (WCAG 2.5.3, la etiqueta visible debe estar en el nombre).
- Activo: pastilla `bosque` de 56×32 detrás del icono (icono blanco), etiqueta `bosque` 800, `aria-current`. Inactivo: icono y etiqueta `tinta-suave` 400.
- La barra superior móvil solo lleva la marca; no tiene controles.

---

## 7. Las 5 vistas

### 7.1 Inicio

**1440×900**
```
┌──────────────────────── barra 64 ────────────────────────┐
│              fondo: radial bosque (centro) → bosque-noche │
│   ·  granos (6, paralaje ≤ 8 px)                ·        │
│                  ╭──────────────────╮                    │
│                 (  LOGO en insignia  )  máx 34dvh (306)  │
│                  ╰──────────────────╯                    │
│              Nutrición que da vida      Caveat, maiz 37  │
│      Venta de balanceados y productos   lead, crema 22   │
│              para tus animales                           │
│                [  Ver productos  ]      CTA oro          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ ← horizonte hoja 25 %
│                                        ◄─ Canela   [❚❚]  │ franja 140 px (16.7 %)
└──────────────────────────────────────────────────────────┘
```

- Retícula: `grid-template-rows: 1fr var(--franja-canela)`. El contenido se centra en la fila 1; **la franja es una fila propia**, así Canela nunca tapa texto ni botón (no es un `position: absolute` encima del contenido).
- Fondo: `radial-gradient` de `bosque` (centro, detrás del logo) a `bosque-noche` (bordes). **No** se usa `marca` en el degradado detrás de texto: blanco sobre `marca` no cumple.
- Logo: el PNG actual no es transparente ni hay versión blanca, así que va **dentro de la insignia**: óvalo con interior `blanco`, aro `maiz` 4 px y aro exterior `bosque` 8 px. Es el `<h1>` (alt "Comercial Hinojosa: Nutrición que da vida") y el elemento LCP: sin animación de entrada. Cuando llegue el logo vectorial blanco, se puede quitar la insignia.
- Lema "Nutrición que da vida" en `font-script`, `maiz` (7.98 sobre `bosque-noche`, 5.44 en el peor punto `bosque`). Es el único acento manuscrito de la vista.
- Subtítulo en `crema`, Nunito 400, máximo 2 líneas (`max-w-[28ch]`).
- **Un solo botón**: CTA oro "Ver productos" (sin borde: contrasta 5.44 con el fondo). Foco `maiz`.
- Franja: línea de horizonte de 1 px `hoja` al 25 % y suelo con un degradado muy leve a `bosque-noche`. Canela y su sombra viven aquí (ver `storyboard-hero.md`). Botón de pausa 44×44 abajo a la derecha.
- Presupuesto vertical: insignia 306 + 24 + lema 44 + 16 + subtítulo 64 + 32 + botón 52 = **538 de 696 px**.

**360×640**
```
┌──────────────── 52 ─┐
│   ╭────────────╮    │
│  (  LOGO 26dvh )    │ 166
│   ╰────────────╯    │
│ Nutrición que da vida│ 24 px
│ Venta de balanceados │ 2 líneas, 17 px
│ y productos...      │
│  [ Ver productos ]  │ ancho 100 %, 52 px
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│        ◄─ Canela [❚❚]│ franja 91 px (17 %)
├──────────── 64 ─────┤
```
Presupuesto: 166 + 30 + 50 + 52 + gaps 48 = **346 de 433 px**. Sin paralaje en táctil.

### 7.2 Quiénes somos (mosaico, todo visible, sin clics)

**1440×900**
```
┌──────────────────────── barra ───────────────────────────┐
│ QUIÉNES SOMOS (h2 40)                                    │ 48
│ ┌───────────────────────────────┐ ┌────────────────────┐ │
│ │                               │ │ MISIÓN  (canela-osc)│ │
│ │   [foto del local / video     │ │ Alimentos y productos│ │ 219
│ │    de Canela jugando]         │ │ de calidad... (2 lín)│ │
│ │                               │ └────────────────────┘ │
│ ├───────────────────────────────┤ ┌────────────────────┐ │ 460
│ │ "Somos parte de tu familia"   │ │ VISIÓN (maiz)  bosque│ │
│ │  banda bosque opaca, frase 58 │ │ Ser el referente... │ │ 219
│ └───────────────────────────────┘ └────────────────────┘ │
│ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐         │
│ │ (ico)││ (ico)││ (ico)││ (ico)││ (ico)││ (ico)│         │ 170
│ │Buen  ││Calidez││Amabi-││Respon-││Hones-││Compro-│      │
│ │trato ││      ││lidad ││sabil. ││tidad ││miso  │        │
│ └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘         │
└──────────────────────────────────────────────────────────┘
```

- Columnas: tarjeta grande 1–7, medianas 8–12 apiladas; valores en 6 × 2 columnas. Alturas: 48 + 22 + 460 + 22 + 170 = **722 de 748 px**.
- **Tarjeta grande (ancla):** `rounded-tarjeta-grande`, `overflow: hidden`. Arriba 62 % la foto del local (`object-fit: cover`); mientras no haya foto, el video `Canela Jugando` si se confirma que no hay fondo útil (silenciado, `poster`, botón de pausa propio). Abajo 38 % una **banda `bosque` opaca** con la frase en `text-frase` Nunito 800 blanco (9.80). La frase **no va sobre la foto** (regla 5 de la skill). Opcional: "familia" en `font-script` `maiz` (5.44), que cuenta como el acento de la vista.
- **Misión:** fondo `blanco`, borde 1 px `crema-oscuro`, eyebrow "MISIÓN" `text-etiqueta` 800 `canela-oscuro` (5.88), texto `text-h3` Nunito 800 `tinta`, **2 líneas**.
- **Visión:** fondo `bosque`, eyebrow "VISIÓN" `maiz` (5.44), texto `text-h3` blanco. La alternancia blanco/verde da ritmo y aporta el 30 % de verde.
- **Valores:** tarjetas `blanco`, `rounded-tarjeta`; icono 40 px de trazo redondeado 2 px `bosque` dentro de un círculo `hoja-claro` con aro `maiz` 2 px; debajo **una palabra** en Nunito 800 `text-h3` limitada a 20 px (con 193 px de tarjeta, "Responsabilidad" cabe en una línea a 18–20 px). Iconos `aria-hidden`; la palabra es HTML real.
- **Interacción:** ninguna obligatoria. `hover` solo con ratón: `translateY(-4px)` + `rotate` de 2–3° (`--tilt-max`) + `shadow-elevada`, 200 ms. **Nunca** revela texto nuevo. Sin tilt con `prefers-reduced-motion` ni en táctil.

**360×640** — vista con **scroll interno declarado como red de seguridad**
```
│ QUIÉNES SOMOS      24 │ 32
│ ┌───────────────────┐ │
│ │ foto (40 %)       │ │ 128
│ │ Somos parte de tu │ │
│ │ familia (banda)   │ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ MISIÓN · 2-3 lín. │ │ 96
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ VISIÓN · 2-3 lín. │ │ 96
│ └───────────────────┘ │
│ [Buen trato][Calidez] │ 2 col × 3 filas,
│ [Amabilidad][Respons.]│ pastillas de 40 px
│ [Honestidad][Comprom.]│ (palabra sola, 14 px)
```
Alturas: 32 + 128 + 96 + 96 + 136 + gaps 40 = **528 px** frente a 524: cabe al límite; si el texto de Misión/Visión ocupa 3 líneas, la vista hace scroll interno. En móvil los valores pierden el icono (la palabra "Responsabilidad" no cabe con icono en 162 px).

### 7.3 Productos (pantalla partida)

**1440×900**
```
┌──────────────────────────── barra ──────────────────────────────┐
│ NUESTROS PRODUCTOS (h2)                │ ┌───────────────────────┐│
│ (Granja 9) [Mascotas 12] (Comed. 5) (Granos 7) │ Buscar producto       ││
│                                        │ │ [🔍 Escribe un nombre ×]││
│        ▫     ▫    ▫     ▫              │ ├───────────────────────┤│
│     ▫                      ▫           │ │ ALIMENTO MASCOTAS · 12 ││
│ (◄)         ┌──────┐          (►)      │ │ ▌[img] Pro-Can adultos $││ ← fila activa
│     ▫       │ FRENTE│        ▫          │ │  [img] Dog Chow       $││
│             └──────┘                    │ │  ...           ↕ scroll││
│        ════ tarima elíptica ════        │ │ GRANOS Y SEMILLAS · 7  ││
│        Pro-Can Adultos  (Cormorant 32)  │ │  ...                   ││
│   Alimento Mascotas · 4 de 12  [desde $2.25]│ ├───────────────────────┤│
│                                        │ │ Precios referenciales —││
│                                        │ │ consulta disponibilidad││
└──────────────── 55 % ──────────────────┴───────── 45 % ──────────┘
```

- Columnas 55 / 45 con gap 22 px. Izquierda sobre `crema`; derecha es un panel `blanco` de altura completa, `rounded-panel`, `shadow-tarjeta`.
- Carrusel, pestañas, flechas, rótulo y tarima: **ver `storyboard-carrusel.md`**.
- **Pestañas de categoría** (4): pastillas de 44 px. Activa `bosque` + blanco + 800; inactiva `blanco`, borde 1.5 px `tinta-suave`, texto `tinta` 400. Nombre corto en la pestaña ("Granja", "Mascotas", "Comederos", "Granos") + cuenta; el nombre completo de la categoría aparece en el rótulo y en la lista.
- **Buscador:** etiqueta **visible** "Buscar producto" (`text-etiqueta` 800, WCAG 3.3.2) sobre un campo de 48 px, `rounded-campo`, borde 1.5 px `tinta-suave` (7.64), icono de lupa decorativo, botón "Borrar búsqueda" 44×44 cuando hay texto. Filtra mientras se escribe.
- **Lista (scroll interno declarado):** cabeceras de grupo fijas (`position: sticky`) "ALIMENTO MASCOTAS · 12" en `text-etiqueta` 800 `tinta-suave`, mayúsculas, con subrayado `hoja` 3 px decorativo. Filas de 56 px: miniatura 40×40 (`rounded-miniatura`, fondo `crema` para las que tienen alfa), nombre `text-cuerpo` `tinta`, marca/presentación `text-chico` `tinta-suave`, precio a la derecha Nunito 800 `.cifra` `bosque`.
- **Fila activa (sincronizada con el carrusel):** fondo `hoja-claro` + **barra izquierda de 4 px `bosque`** + nombre en 800. La barra es la señal no cromática.
- Sin resultados: "No encontramos «…». Prueba con otra palabra." + botón secundario "Borrar búsqueda".
- Nota fija al pie del panel (no se desplaza con la lista): "Precios referenciales — consulta disponibilidad" y "Marcas registradas de sus respectivos propietarios." en `text-chico` `tinta-suave`.

**360×640** — **la vista entera hace scroll interno** (excepción declarada; el carrusel y la lista no caben juntos)
```
│ NUESTROS PRODUCTOS   │
│ (Granja)(Mascotas)(Co…│ ← pestañas desplazables en horizontal
│   ▫   ┌────┐   ▫     │
│ (◄)   │    │    (►)  │ escenario 230 px
│   ▫   └────┘   ▫     │
│ Pro-Can Adultos      │ rótulo 64 px
│ Mascotas · 4 de 12   │
│ ┌ Buscar producto ──┐│ ← fijo arriba al hacer scroll
│ │ [🔍 ...         ] ││
│ │ lista ...         ││
```

### 7.4 Por qué elegirnos

**1440×900**
```
┌────────────────────────── barra ─────────────────────────┐
│ POR QUÉ ELEGIRNOS (h2)                                    │ 48
│ ┌───────────┐┌───────────┐┌───────────┐┌───────────┐      │
│ │ (Lottie)  ││ (Lottie)  ││ (Lottie)  ││ (Lottie)  │      │ 210
│ │ Naturales ││ Confiables││ De calidad││Sostenibles│      │
│ │ 1 línea   ││ 1 línea   ││ 1 línea   ││ 1 línea   │      │
│ └───────────┘└───────────┘└───────────┘└───────────┘      │
│ ███████████████ banda bosque, a sangre en la retícula ████ │
│ █ ◆ Ubicación   █ ◆ Aves, cerdos,  █ ◆ Atención  █ ◆ Calidad █ 130
│ █   estratégica █   mascotas, til. █   cercana   █  que se siente│
│ ███████████████████████████████████████████████████████████ │
│ ANIMALES QUE ATENDEMOS (etiqueta)                         │
│  🐔    🐖    🐇    (cuy)  🐄    🐕    🐈    🐟             │ 150
│  Aves Cerdos Conejos Cuyes Vacas Perros Gatos Tilapias    │
└──────────────────────────────────────────────────────────┘
```

- Tres bandas con pesos distintos para que no se sienta ni vacía ni apretada: **pilares** (tarjetas blancas altas, lo más importante), **diferenciales** (banda `bosque` compacta que recuerda la barra inferior de los afiches) y **animales** (fila ligera sin tarjetas, solo icono + palabra).
- Pilares: 4 × 3 columnas. Icono Lottie 64 px que se anima **una vez** al entrar en la vista (≤ 900 ms; estático con reduced motion). Título `text-h3` 800 `bosque` + una línea `text-cuerpo` `tinta-suave`.
- Diferenciales: banda `bosque` (`.tema-oscuro`), 4 columnas separadas por filetes `hoja` al 40 %. Icono 32 px `maiz`, texto `text-cuerpo` blanco, máximo 2 líneas.
- Animales: rejilla propia de 8 columnas, icono 56 px de trazo `bosque` en círculo `hoja-claro`, palabra `text-etiqueta` `tinta` debajo, siempre visible.
- Alturas: 48 + 28 + 210 + 28 + 130 + 28 + 26 + 150 = **648 de 748 px**. Sin contadores ni cifras inventadas.

**360×640**: título 32 · pilares 2×2 (icono 40 + palabra, sin línea descriptiva; 2×64) · diferenciales 2×2 en banda `bosque` (texto 14 px, 2 líneas) · animales 4×2 (icono 36 + palabra 13 px). Total ≈ **494 de 524 px**: cabe sin scroll.

### 7.5 Visítanos

**1440×900**
```
┌──────────────────────────── barra ──────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░ MAPA A SANGRE (Leaflet) ░░░░░░░░░░░░░ [+][-] │
│░░ ┌────────────────────────────┐ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│░░ │ Comercial Hinojosa  (h2 28) │ ░░░░░░░ (pin) ░░░░░░░░░░░░░░░ │
│░░ │ Av. del Chofer y R. Lerson  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│░░ │ ( ✓ Abierto ahora )         │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│░░ │ Lun–Sáb 8:00–19:00 (PEND.)  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│░░ │ Cómo llegar: frente a …     │ ░░░░░░░░░░░░░░ ┌────────────┐ │
│░░ │ [ Cómo llegar ↗ ]  CTA oro  │ ░░░░░░░░░░░░░░ │ foto       │ │
│░░ │ [WhatsApp ↗] [Llamar]       │ ░░░░░░░░░░░░░░ │ fachada    │ │
│░░ │ Facebook ↗                  │ ░░░░░░░░░░░░░░ └────────────┘ │
│░░ └────────────────────────────┘ ░ © OSM ░░░░░░  Así se ve el local│
│ Comercial Hinojosa siempre a tu lado · © 2026 · Marcas registradas…│ pie 36 px
└─────────────────────────────────────────────────────────────────┘
```

- **Mapa** a sangre bajo la barra; el pie de 36 px es una franja `bosque-noche` **opaca** con texto `crema` `text-chico` (12.76).
- **Tarjeta flotante:** `max-w-tarjeta-mapa` (400 px), a 44 px del borde izquierdo, centrada en vertical. Fondo **`blanco` 100 % opaco** (nada de `backdrop-filter` ni transparencia: el contraste no puede depender de qué zona del mapa quede detrás), `rounded-tarjeta-grande`, `shadow-flotante`, borde 1 px `crema-oscuro`, padding 28 px.
  - Nombre `text-h2` limitado a 28 px, `bosque`. Dirección y ciudad `text-cuerpo` `tinta`.
  - **Estado:** pastilla con **icono + palabra**. Abierto: fondo `hoja-claro`, icono check en círculo, "Abierto ahora" en `bosque` 800 (8.63). Cerrado: fondo `crema-oscuro`, icono luna, "Cerrado · abre a las 8:00" en `tinta` (11.27). El color nunca va solo.
  - Horario completo (`text-chico` `tinta-suave`), referencias para llegar en lenguaje natural.
  - Botones: **CTA oro "Cómo llegar"** (el único oro de la vista, con borde `bosque` 2 px porque va sobre blanco), **primarios** "WhatsApp" y "Llamar", enlace de texto "Facebook". Los que abren pestaña llevan icono ↗ y "(abre en una pestaña nueva)" en el nombre accesible. Datos sin confirmar → `PENDIENTE_CONFIRMAR`, nunca inventados.
- **Recuadro de fachada:** 288×200, abajo a la derecha a 44 px del pie, marco `blanco` de 6 px, `rounded-tarjeta`, `shadow-elevada`, pie de foto "Así se ve el local" en una placa blanca. Si es video: silenciado, bucle, `poster` y pausa.
- Controles de zoom arriba a la derecha; atribución de OpenStreetMap abajo a la izquierda, por encima del pie (no se tapa). La tarjeta deja al menos 48 px libres por abajo.
- WCAG 2.4.11: ningún control enfocable del mapa queda bajo la tarjeta o el recuadro; si el pin queda detrás de la tarjeta, el mapa se centra desplazado a la derecha (`panBy` de +200 px).

**360×640** — **scroll interno de la tarjeta**
```
│ ░░░░ MAPA 200 px ░░░░ │
│ ░░░░░░ (pin) ░░░░░░░░ │
│╭─────────────────────╮│ ← hoja inferior, solapa 24 px al mapa
││ Comercial Hinojosa   ││
││ (✓ Abierto ahora)    ││
││ Dirección  [fachada] ││ fachada 96×72 junto a la dirección
││ Horario              ││
││ [ Cómo llegar ↗ ]    ││ 100 % de ancho
││ [WhatsApp] [Llamar]  ││ 2 columnas
││ Facebook ↗           ││
││ pie: siempre a tu lado…││ al final del scroll
│╰─────────────────────╯│
```
En móvil la tarjeta deja de flotar sobre el mapa: pasa a hoja inferior con fondo `blanco` opaco.

---

## 8. Componentes base (resumen)

- **Botones:** ver jerarquía en 3.4. Nunito 800, `rounded-boton`, mínimo 48 px de alto.
- **Tarjeta:** `blanco`, `rounded-tarjeta`, `shadow-tarjeta`, borde 1 px `crema-oscuro` (decorativo; las tarjetas no son interactivas).
- **Insignia:** óvalo o círculo, aro exterior `bosque` 6–10 px, aro interior `maiz` 3–4 px, interior `blanco` o `crema`. Firma visual del sitio.
- **Pastilla de estado:** `rounded-chip`, 32 px, icono 16 px + palabra.
- **Foco:** anillo 3 px `foco` + 3 px de separación; en `.tema-oscuro` (Inicio, bandas verdes) pasa a `maiz`. Nunca se quita.
- **Objetivos táctiles:** 44×44 px reales (`spacing-objetivo`).
- **Capas (`--z-*`):** vista 0 · Canela 10 · controles 20 · flotantes 30 · barra 50.

---

## 9. Logo

- **Solo el logo nuevo** (trébol con H blanca y mazorca, "COMERCIAL" en oro, "HINOJOSA" en verde degradado). **El logo "ANTES" del primer afiche está descartado**: no se usa ni como referencia de color.
- El PNG actual tiene fondo blanco: va sobre `blanco` o dentro de la insignia. Sobre `bosque` hace falta la versión blanca (pendiente del vectorial).
- Mínimos: logo completo 160 px de ancho; isotipo 32 px (barra: 40 px). Área de respeto: la altura de la "H".
- No se estira, recolorea, gira ni se le pone sombra o contorno.
- Alt: "Comercial Hinojosa: Nutrición que da vida".

## 10. Canela

- Activo vigente: `Nuevos Req/Mascota/Canela.png`, render estilo 3D de Canela **sentada, de frente**, con **gorra verde "Comercial Hinojosa"** y **collar verde con dije de trébol "H"** (y un dije de osito). **Este render no lleva pañuelo**, a diferencia del diseño de los afiches: **confirmar con la dueña** que el render es la versión oficial antes de publicar.
- Uso único en el sitio: el bucle de la franja inferior de Inicio (y su cuadro de reposo). No aparece en las demás vistas salvo, opcionalmente, el video en la tarjeta grande de Quiénes somos.
- No se le cambia el color del pelaje, no se le quitan los accesorios, no se espeja el logo de la gorra (el render es frontal: no hace falta espejarlo).
- Es decorativa: `aria-hidden="true"`.

## 11. Fotografía e imágenes de producto

- Fuente final preferida: **fotos propias del local**. Las imágenes de los afiches son referencia, no fuente final.
- Los renders de `CatalogoF/` se usan en el carrusel y en la lista. Varios parecen generados con IA y algunos envases tienen letra pequeña ilegible o inventada (p. ej. el saco de Nutri Cerdos o los iconos del saco de Pro-Can Adultos): **confirmar con la dueña los derechos y que acepta mostrarlos**.
- Tratamiento uniforme de producto (detalle en `storyboard-carrusel.md`): recorte con alfa, centrado y apoyado en la base de un lienzo 3:4; los que traen fondo van en **placa** con `object-fit: cover`.
- Iconos: trazo redondeado 2 px en `bosque`, dentro de círculo `hoja-claro`. Texturas (granos, hojas) en SVG ligero, nunca como imagen pesada de fondo.

## 12. Movimiento (resumen; detalle en los storyboards)

| Qué | Duración | Curva | Token |
|---|---|---|---|
| Transición entre vistas (desplazamiento horizontal corto) | 400 ms | `ease-vista` | `--duracion-vista`, `animate-vista-adelante/atras` |
| Indicador de vista activa | 300 ms | `ease-vista` | `--duracion-indicador` |
| Giro de un paso del carrusel | 450 ms | `ease-giro` (rebote ~2.5 %) | `--duracion-giro` |
| Cambio de categoría | 150 + 300 ms | `ease-salida` / `ease-vista` | `--duracion-categoria-*` |
| Saltito de Canela | 520 ms | `ease-subir` / `ease-caer` | `--canela-salto`, `animate-canela-*` |
| Hover de tarjetas | 200 ms | `ease-vista` | `--duracion-hover`, `--tilt-max` |
| Pulsación de botón | 90 ms | ease-out | `--duracion-presion` |

- Solo `transform` y `opacity`.
- Una región, un movimiento: nada se anima mientras la vista entra, salvo la propia entrada.
- `prefers-reduced-motion: reduce`: cambios de vista y giros instantáneos, Canela en cuadro de reposo, sin paralaje ni Lottie en bucle.
- Bucles de más de 5 s (Canela, video) con control de **pausa** visible (WCAG 2.2.2). El carrusel nunca gira solo.

## 13. Comprobación con las heurísticas de Nielsen

| # | Heurística | Cómo la cumple esta guía |
|---|---|---|
| 1 | Visibilidad del estado | Pastilla `bosque` en la vista activa; rótulo "4 de 12" y fila activa en Productos; "Abierto/Cerrado" con palabra |
| 4 | Consistencia | Una sola metáfora de movimiento (horizontal), una sola jerarquía de botones (oro › bosque › contorno), barra idéntica en las 5 vistas |
| 6 | Reconocer antes que recordar | Las 5 vistas siempre visibles (barra superior en escritorio, inferior en móvil); lista completa al lado del carrusel |
| 8 | Minimalista | Misión/Visión en 2 líneas, valores en una palabra, un acento manuscrito y un CTA oro por vista, sin contenido detrás de clics |
