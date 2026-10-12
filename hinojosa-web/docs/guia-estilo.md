# Guía de estilo: Comercial Hinojosa

> Fase 1 (diseño). Fuente: `Pre/PLAN.md`, secciones 2 y 3. Tokens en `src/styles/global.css`.
> Estado: **propuesta pendiente de aprobación de la dueña**. Los colores se afinaron a ojo sobre el logo en PNG; hay que confirmarlos con el logo vectorial cuando llegue.

## 1. Idea visual

"Del campo a tu casa": crema cálido y luz de tarde, verde del trébol del logo y oro del maíz. Se siente como una tienda de barrio de confianza, no como una cadena: formas redondeadas, ilustración amable (Canela), granos y hojas como textura. Lo que lo distingue es la **insignia ovalada** (borde oro + aro verde bosque) que ya usan los afiches. La repetimos como marco de Canela, de los iconos de valores y del pin del mapa.

Lo que evitamos: degradados morados, fondos negros, sombras grises duras, tipografía genérica y amontonar textos como en los afiches impresos.

## 2. Paleta

| Token (utilidad Tailwind) | Hex | Rol |
|---|---|---|
| `bosque` | `#1B4D2B` | Fondos oscuros, títulos, anillo de foco sobre claro |
| `bosque-noche` | `#10301B` | Footer, degradados profundos |
| `marca` | `#2E8B2E` | Verde del logo: iconos, ilustración, texto grande (24 px o más) |
| `marca-fuerte` | `#267A2C` | Botón principal con texto blanco, enlaces sobre claro |
| `hoja` | `#7BBF3A` | Acentos, hojas, subrayados, detalles (no se usa como color de texto sobre claro) |
| `hoja-claro` | `#EAF4DC` | Superficies tintadas (chips, bloques destacados) |
| `maiz` | `#F2B823` | Oro: CTA secundario, chips de precio, estrellas, detalles |
| `maiz-oscuro` | `#D99E0F` | Hover del botón oro |
| `crema` | `#F6F1E4` | Fondo claro principal |
| `crema-oscuro` | `#EDE4CC` | Tarjetas alternas, bordes suaves |
| `canela` | `#C98A3A` | Canela, granos, calidez (solo decorativo) |
| `canela-oscuro` | `#8A5A1F` | Texto canela legible sobre claro |
| `tinta` | `#14301D` | Texto principal |
| `tinta-suave` | `#3D5A45` | Texto secundario, notas, "precios referenciales" |
| `blanco` | `#FFFFFF` | Fondo del logo, tarjetas de producto |

Cambios respecto al plan: los siete colores base se mantienen tal cual. Se añadieron `marca-fuerte`, `canela-oscuro` y `tinta-suave` porque `marca` y `canela` no llegan a 4.5:1 en texto normal (ver sección 3).

### Proporción 60 / 30 / 10

- **60 % claro:** `crema` y `blanco` (fondos de casi todas las secciones, tarjetas).
- **30 % verde:** `bosque`/`marca` (franja ondulada inferior del hero, una sección completa en `bosque` (Valores), footer, botones, títulos).
- **10 % oro:** `maiz` (un solo CTA secundario por pantalla, chips de precio, bordes de insignia, granos). Si el oro aparece en más de 2 o 3 sitios en la misma pantalla, sobra.
- `canela` y `hoja` son condimento, por debajo del 5 %.

Ritmo de fondos sugerido: Hero crema/blanco → Quiénes somos crema → Canela blanco → Categorías crema → Catálogo blanco → Valores **bosque** (`.tema-oscuro`) → Por qué elegirnos crema → Ubicación blanco → Contacto crema → Footer **bosque-noche**.

## 3. Parejas de contraste aprobadas (WCAG 2.2 AA)

Calculadas con la fórmula de luminancia relativa de WCAG: (L1 + 0.05) / (L2 + 0.05). Umbrales: 4.5:1 texto normal, 3:1 texto grande (24 px, o 18.66 px en negrita) e indicadores o componentes.

| Texto / elemento | Fondo | Razón | Uso permitido |
|---|---|---|---|
| `tinta` | `crema` | **12.67:1** | Todo texto |
| `tinta` | `blanco` | **14.29:1** | Todo texto |
| `tinta` | `crema-oscuro` | **11.27:1** | Todo texto |
| `tinta` | `hoja-claro` | **12.57:1** | Todo texto |
| `tinta-suave` | `crema` | **6.78:1** | Texto secundario |
| `tinta-suave` | `blanco` | **7.64:1** | Texto secundario |
| `bosque` | `crema` | **8.69:1** | Títulos, enlaces, foco |
| `bosque` | `blanco` | **9.80:1** | Títulos, enlaces |
| `bosque` | `crema-oscuro` | **7.73:1** | Enlaces sobre tarjeta alterna |
| `marca-fuerte` | `blanco` | **5.38:1** | Enlaces, texto verde |
| `marca-fuerte` | `crema` | **4.77:1** | Enlaces, texto verde |
| `marca-fuerte` | `hoja-claro` | **4.73:1** | Texto verde en chips |
| `blanco` | `marca-fuerte` | **5.38:1** | **Botón principal (WhatsApp)** |
| `blanco` | `bosque` | **9.80:1** | Texto en secciones oscuras |
| `crema` | `bosque` | **8.69:1** | Texto en secciones oscuras |
| `blanco` | `bosque-noche` | **14.38:1** | Footer |
| `tinta` | `maiz` | **7.93:1** | **Botón oro / chip de precio** |
| `bosque` | `maiz` | **5.44:1** | Texto en botón oro |
| `maiz` | `bosque` | **5.44:1** | Texto oro, foco en secciones oscuras |
| `maiz` | `bosque-noche` | **7.98:1** | Texto oro en footer |
| `tinta` | `maiz-oscuro` | **6.02:1** | Hover del botón oro |
| `tinta` | `hoja` | **6.36:1** | Etiqueta sobre verde hoja |
| `hoja` | `bosque-noche` | **6.41:1** | Enlaces o acentos en footer |
| `tinta` | `canela` | **4.99:1** | Texto sobre bloque canela |
| `canela-oscuro` | `crema` | **5.22:1** | Texto canela |
| `blanco` | `canela-oscuro` | **5.89:1** | Placa o etiqueta canela |

**Solo texto grande o componentes (3:1 o más, menos de 4.5:1):**

| Texto / elemento | Fondo | Razón | Uso |
|---|---|---|---|
| `marca` | `crema` | 3.84:1 | Títulos de 24 px o más, iconos |
| `marca` | `blanco` | 4.33:1 | Títulos de 24 px o más, iconos |
| `blanco` | `marca` | 4.33:1 | Solo texto grande (no botones de texto normal) |
| `hoja` | `bosque` | 4.36:1 | Texto grande, iconos y bordes en sección oscura |

**Prohibido como texto (menos de 3:1):**

| Texto | Fondo | Razón |
|---|---|---|
| `blanco` | `maiz` | 1.80:1. **Nunca texto blanco sobre oro.** Sobre oro va `tinta` o `bosque`. |
| `maiz` | `crema` / `blanco` | 1.60 / 1.80:1. El oro sobre claro solo es decorativo (bordes, granos, subrayado) |
| `blanco` | `hoja` | 2.24:1 |
| `blanco` | `canela` | 2.86:1 |
| `canela` | `crema` | 2.54:1. Para texto usar `canela-oscuro` |

El logo es la excepción: "COMERCIAL" en oro sobre blanco está exento por ser logotipo (WCAG 1.4.3), pero el texto alternativo del logo debe decir el nombre completo.

## 4. Tipografía

| Rol | Familia | Pesos | Utilidad | Uso |
|---|---|---|---|---|
| Marca / títulos | **Baloo 2** | 700, 800 | `font-display` | H1–H3, cifras, botones grandes. Redondeada y gruesa como el logo |
| Producto | **Cormorant Garamond** | 600, 700, 600 itálica | `font-serif` | Nombre de producto en tarjetas y cintas de catálogo (como en los afiches de maíz) |
| Acento | **Caveat Brush** | 400 | `font-script` | Una o dos palabras por sección: "aliado", "Canela", "¡Somos parte de tu familia!" |
| Cuerpo | **Nunito** | 400, 600, 700 | `font-sans` | Párrafos, listas, precios, formularios, botones |

Se eligió Caveat Brush antes que Pacifico porque se parece más al pincel de "Canela" y "aliado" de los afiches y se lee mejor. Nunito antes que Inter porque acompaña la redondez de Baloo 2.

URL de Google Fonts (con `display=swap`, solo pesos usados):

```
https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Caveat+Brush&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Nunito:wght@400;600;700&display=swap
```

Escala (fluida con `clamp()`, de 360 px a 1440 px): `text-display` 44–88 px · `text-h1` 36–64 · `text-h2` 28–44 · `text-h3` 20–26 · `text-producto` 22–30 · `text-acento` 24–40 · `text-lead` 18–22 · `text-cuerpo` 16–18 · `text-chico` 14–15.

Reglas:
- Cormorant solo desde 22 px; por debajo es demasiado fina.
- Caveat Brush nunca en párrafos ni en botones, y siempre a 24 px o más. Color: `marca-fuerte`, `canela-oscuro` o `maiz` sobre `bosque`.
- Precios en Nunito 700 con `tabular-nums`. Debajo, la nota "Precios referenciales, consulta disponibilidad" en `tinta-suave`.
- Línea de lectura máxima: `max-w-texto` (40rem).

## 5. Componentes base

- **Botón principal (WhatsApp):** fondo `marca-fuerte`, texto `blanco`, Nunito 700, `rounded-boton`, alto mínimo 48 px. Hover: `bosque`.
- **Botón secundario (Ver productos):** fondo `maiz`, texto `tinta`, `shadow-boton-oro`. Hover: `maiz-oscuro`.
- **Botón terciario:** borde 2 px `bosque`, texto `bosque`, fondo transparente.
- **Tarjeta:** `blanco` sobre fondo crema, `rounded-tarjeta`, `shadow-tarjeta`, borde 1 px `crema-oscuro`.
- **Insignia:** círculo u óvalo con aro exterior `bosque` de 6–10 px y aro interior `maiz` de 3–4 px, interior `crema`. Es la firma visual del sitio.
- **Cinta de producto:** banda `bosque` con el nombre en `font-serif` `crema` (como en los afiches de maíz).
- **Onda:** separador SVG con curva suave en `bosque`, como la franja inferior de los afiches.
- **Foco:** anillo de 3 px `bosque` con separación de 3 px; en `.tema-oscuro` pasa a `maiz`. No se quita nunca.
- Objetivos táctiles de al menos 44 × 44 px (mejor 48).

## 6. Logo

- Usar **solo el logo nuevo**: trébol de cuatro hojas con H blanca y mazorca, "COMERCIAL" en oro, "HINOJOSA" en verde degradado y "NUTRICIÓN QUE DA VIDA".
- **El logo "ANTES" del afiche `01-logo-nuevo-significado` está descartado.** No se recorta, no se usa ni como referencia de color.
- Versión principal: sobre fondo **blanco o crema**. El PNG actual (`marca/logo-completo-recorte.png`) **no es transparente** (tiene fondo blanco). Mientras no llegue el vectorial: colocarlo sobre `blanco`, o sobre `crema` con `mix-blend-mode: multiply` para que el blanco desaparezca.
- Sobre `bosque` hace falta la versión blanca (pendiente del vectorial). Mientras tanto, el logo no va sobre fondos verdes ni sobre fotos.
- Tamaño mínimo: logo completo de **160 px de ancho** en pantalla (120 px en el header móvil, donde se lee el nombre); isotipo "H" de **32 px** (favicon de 16 a 32 px solo con el isotipo).
- Área de respeto: alrededor del logo, al menos la altura de la "H" del isotipo.
- No se puede: estirar, recolorear, girar, poner sombra, poner contorno ni ponerlo sobre fondos con mucho detalle.
- Texto alternativo: `Comercial Hinojosa: Nutrición que da vida`.

## 7. Canela

- Personalidad: alegre, cariñosa, servicial. Habla en primera persona y con frases cortas ("¡Hola! Soy Canela").
- Siempre con **gorra verde con la H** y **pañuelo verde con la H**. No se le cambia el color del pelaje (`canela`), no se le quitan los accesorios y no se le ponen otros logos.
- Formatos disponibles hoy:
  - `mascota/canela-recorte.png`: busto con las patas apoyadas. **No es un recorte transparente**: trae el fondo crema y parte del aro verde de la insignia. Se usa **dentro del marco de insignia** (óvalo con `overflow: hidden`), que encaja con el aro original.
  - `mascota/canela-pulgar-arriba-recorte.png`: tiene fondo de foto (granja, animales). Úsala solo como imagen completa con marco, no como figura suelta.
  - Pendiente (agente de activos): Canela en PNG o WebP **con transparencia real**, para poder animarla en capas.
- Aparece como protagonista **una vez por sección como máximo** (hero, "Conoce a Canela", y como mucho un guiño en contacto). No la uses como icono genérico ni la repitas en las tarjetas.
- Es una ilustración (probablemente generada con IA): **confirmar con la dueña** que puede usarse antes de publicar.
- Las imágenes de los afiches son **referencia**, no fuente final. Nada de recortar textos de los afiches para usarlos como imagen.

## 8. Tono visual y fotografía

- Luz cálida de tarde, verdes naturales, sacos y granos en primer plano.
- Mejor fotos propias del local y de los productos (en el plan son la fuente final). Se tratan con un ligero calentado y sin filtros fuertes.
- Iconos de trazo redondeado de 2 px en `marca`/`bosque`, dentro de un círculo `hoja-claro` o como insignia.
- Texturas: granos de maíz (`maiz`, `canela`) y hojas (`hoja`, `marca`) como SVG ligeros. Nunca como imagen pesada de fondo.
- Textos cortos y orientados a la acción: "Escríbenos por WhatsApp", "Ver productos".

## 9. Movimiento (resumen; detalle en `storyboard-hero.md`)

- Curvas: `ease-suave` para entradas y `ease-rebote` solo para Canela y el pin.
- Entradas de 600 ms con desfase de 80–120 ms; nada que dure más de 1.6 s antes de poder usar la página.
- Los bucles decorativos (granos, hojas, balanceo) se pueden **pausar** con el botón del hero (`html[data-movimiento="pausado"]`), como pide WCAG 2.2.2.
- Con `prefers-reduced-motion: reduce` no hay animaciones, transiciones, paralaje ni autoplay de video; todo aparece en su posición final.
