---
name: marca-hinojosa
description: Paleta con contrastes ya verificados, tipografía, tono de voz y reglas de logo de Comercial Hinojosa. Úsala al elegir cualquier color, fuente o texto del sitio, al escribir tokens CSS y al revisar si una combinación cumple contraste.
---

# Marca Comercial Hinojosa

Fuente única de verdad para color, tipografía, tono y logo. Si algo aquí contradice a `PLAN.md`, manda `PLAN.md` y hay que actualizar esta skill.

**Negocio:** venta de balanceados, alimentos y productos para animales.
**Lema:** "Nutrición que da vida".
**Mascota:** Canela, perrita con gorra verde y pañuelo con la "H". Es parte de la marca (logo, insignia, gráficos), **no** una sección del sitio ni un personaje 3D.

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

Proporción aproximada: **60 % blanco/crema · 30 % verde · 10 % oro**.

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
5. Al poner texto sobre una **foto** (tarjeta grande de Quiénes somos, tarjeta del mapa), el contraste no se puede garantizar: usa un fondo sólido u opaco detrás del texto, no una capa translúcida.
6. Un color **nunca** es el único portador de información (WCAG 1.4.1): la vista activa de la barra y el estado "Abierto / Cerrado" llevan además forma o palabra.

---

## 3. Tipografía

| Rol | Familia | Nota |
|---|---|---|
| Títulos de marca | **Baloo 2** (o Nunito ExtraBold) | Sans redondeada y gruesa, como el logo |
| Títulos de producto | **Cormorant Garamond** | Serif que ya usan los afiches de producto |
| Acento manuscrito | **Caveat Brush** (o Pacifico) | Máximo una o dos frases por vista. **Nunca** texto corrido ni nada que haya que leer con detalle |
| Cuerpo | **Nunito** (o Inter) | |

- Ya están instaladas como paquetes `@fontsource` en `hinojosa-web/`: úsalas desde ahí, no desde un `<link>` a Google Fonts.
- `font-display: swap` siempre.
- Techo: **3 familias y 4 pesos** en total, por presupuesto de rendimiento.

---

## 4. Tono de voz

Cálido, familiar, confiable, cercano. El cliente es un ganadero, avicultor o dueño de mascota de la zona.

- Frases de **una o dos líneas**. El sitio se maneja por vistas sin scroll: el texto que no cabe se recorta, no se empuja hacia abajo.
- Español neutro de Ecuador, trato de "tú".
- Habla del animal, no del producto: "para que tus pollos crezcan sanos" antes que "balanceado de alta conversión".
- **Nada de:** jerga de marketing, superlativos vacíos ("el mejor del mercado"), urgencia falsa, emojis en el copy, promesas de envío o de compra en línea.
- Frases de marca disponibles: "Nutrición que da vida" (principal) · "Somos parte de tu familia" · "Tu mejor aliado para tus animales" · "Comercial Hinojosa siempre a tu lado" · "Calidad, Confianza, Compromiso".

### Datos que nunca se inventan
Teléfono, WhatsApp, dirección, ciudad, horario, referencias para llegar, enlaces de redes y precios. Si falta uno, se escribe `PENDIENTE_CONFIRMAR` y se reporta. Un dato falso de contacto o de precio hace daño real al negocio.

Los precios de los afiches van siempre acompañados de **"Precios referenciales — consulta disponibilidad"**.

---

## 5. Logo y marcas

- Se usa **solo el logo nuevo**: H blanca sobre trébol verde con maíz, "COMERCIAL" en dorado, "HINOJOSA" en verde degradado. El logo "ANTES" del primer afiche está **descartado**.
- Variantes: completo vertical, isotipo "H" suelto, versión blanca para fondos oscuros, favicon. Archivos en `hinojosa-web/public/img/marca/`.
- El logo no se deforma, no se recolorea y no se pone sobre fondos que le quiten contraste. Sobre fondo oscuro va la versión blanca.
- La optimización de imágenes **no** puede degradar el logo: se mantiene en SVG o PNG nítido, nunca en un WebP agresivo.
- **Marcas de terceros** (Pro-Can, Camperito, Nutritivos, Dog Chow, NutraPro, Bio Alimentar, Cani, Molinos Cordillera, Freemiau, Mascan…): se mencionan solo como productos que el local distribuye, con la nota al pie **"Marcas registradas de sus respectivos propietarios."** No se usan sus logos como si fueran de la marca propia.
- Las imágenes de los afiches son **referencia gráfica**, no fuente final. Varias parecen generadas con IA: antes de publicarlas hay que confirmar con la dueña los derechos de uso.

---

## 6. Al escribir tokens

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
