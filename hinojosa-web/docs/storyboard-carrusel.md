# Storyboard: carrusel 3D de Productos

> Fase 1 (diseño), 2026-10-12. Basado en `PLAN.md` sección 0 (manda) y vista 3.
> Sustituye a la "ruleta de 10 costales .glb con Three.js": no llegaron modelos 3D sino **renders PNG**, así que el carrusel es un **anillo CSS 3D** (`perspective` + `translate3d`) movido con GSAP, sin WebGL.
> Tokens: `src/styles/tokens.css` (`--carrusel-*`, `--duracion-giro*`, `--duracion-categoria-*`, `--ease-giro`, `--ease-salida`, `--ease-vista`, `--color-kraft`, `--color-filete-canela`). Retícula y colores de la vista: `docs/guia-estilo.md` §2.2 y §7.3.
> **Revisión 2026-10-14** (`PLAN.md` §0-B y vista 3, `auditoria.md` §3 y §7.3): transiciones **C1–C8** (sección 6.6, sustituyen a lo que decía antes la 6.3 sobre el cambio de categoría y la 5.4 sobre el rótulo), **regla M5**, producto al frente más grande (P7), tarima kraft, tarjeta genérica de costal (P5), inercia limitada (P9), miniaturas de 48 px (P10) y hoja de detalle en móvil (P6).

---

## 1. Qué muestra

- **4 pestañas** de categoría encima del anillo: Granja (9) · Mascotas (12) · Comederos (5) · Granos (7). Nombres completos ("Alimento Animales de Granja", etc.) en el rótulo y en la lista.
- El anillo contiene **solo los productos de la categoría activa**: de 5 a 12 objetos en escena (tope duro 12).
- **Flechas ◀ ▶** a los lados: giran de producto en producto.
- **Rótulo bajo el anillo** con el producto al frente: nombre, categoría, posición "4 de 12" y chip de precio.
- La lista de la derecha es la alternativa textual completa y está sincronizada en los dos sentidos.
- **Nunca gira solo.** No hay autorrotación (cumple 2.2.2 sin controles extra).

---

## 2. Calibración con los activos de `CatalogoF/`

Revisadas `procan adultos.png`, `maiz en grano.png`, `cerdos.png` y `Comedero galvanizado.png`. Hallazgos que condicionan el diseño:

| Hallazgo | Ejemplo | Consecuencia |
|---|---|---|
| Tres formatos de lienzo | verticales 1792×2400, horizontales 2752×1536, cuadrados 2048×2048 | **No** se puede usar el lienzo tal cual: hay que normalizar |
| En los horizontales el producto ocupa ~30 % del ancho | `cerdos.png` (saco centrado con mucho aire) | Sin recorte al contenido, esos productos saldrían diminutos al lado de los verticales |
| **Varios no parecen tener alfa** aunque el PLAN los dé por recortados: se ve fondo de estudio gris o fondo pintado | `cerdos.png`, `Comedero galvanizado.png` (gris), `maiz en grano.png` (fondo marrón con suelo) | Además de los 4 JPG ya conocidos. **Verificar `hasAlpha` y el alfa de las esquinas en los 33** antes de exportar |
| Los que sí tienen alfa se ven limpios sobre claro | `procan adultos.png` | Se presentan "libres" sobre la tarima |
| Colores de envase muy saturados (rojo, naranja, verde) | Pro-Can, Nutri Cerdos | El fondo del escenario debe ser neutro y cálido (crema), nunca un color de marca saturado detrás de los productos |

### Normalización (encargo para el agente de activos)

1. `trim` al contenido (con alfa) o recorte de fondo (sin alfa).
2. Lienzo **3:4** con fondo transparente: 600×800 para el carrusel y 120×160 para la miniatura de la lista (los 800 y 160 px de alto que fija la sección 0).
3. Producto **centrado en horizontal y apoyado en la base**: ocupa como máximo el 88 % del alto y el 92 % del ancho, con un 4 % de margen inferior. Así todas las sombras de contacto caen en la misma línea.
4. Sin sombra horneada (la pone el CSS).
5. Lo que no se pueda recortar limpio va en **modo placa** (sección 4.3), no se fuerza.

---

## 3. Geometría del anillo

### 3.1 Decisión: anillo de "carteles" que siempre miran al frente

Los renders son imágenes planas. Si cada una gira con `rotateY` sobre el anillo, a 60° se ven aplastadas y por detrás aparecen espejadas. Se usa en cambio un **anillo de carteles (billboard)**: cada producto se coloca en su punto del círculo con `translate3d(x, 0, z)` y **siempre mira a la cámara**. La perspectiva hace el resto: los de atrás se ven más pequeños y más altos, y el círculo se percibe sin deformar ningún envase.

Para el producto *i* de *N*, con el ángulo del anillo θ (lo que anima GSAP):

```
φᵢ = 2π·i/N − θ                       (0 = al frente)
x  = r · sin φᵢ
z  = r · (cos φᵢ − 1)                  (el frente queda en z = 0, tamaño 1:1)
d  = (1 + cos φᵢ) / 2                  (1 al frente, 0 detrás)
```

GSAP anima **un solo número** (θ) y en `onUpdate` escribe en cada producto: `transform`, `z-index` (por d), `opacity` y la opacidad de su capa de oscurecido. Son 12 elementos como máximo: barato en gama media.

### 3.2 Radio y perspectiva

```
r = max( --carrusel-radio-min , (ancho + hueco) / (2 · tan(π/N)) )
```

| | Escritorio (1440) | Móvil (360) |
|---|---|---|
| Tarjeta (3:4) | **180 × 240 px** (`--carrusel-ancho`); en ≥ 64rem **`clamp(11.25rem, 24dvh, 15rem)`** → 216 × 288 px a 1440×900 (P7) | **116 × 155 px** |
| Hueco | 16 px | 10 px |
| Radio mínimo | 260 px | 170 px |
| `perspective` | **900 px** | **600 px** |
| `perspective-origin` | 50 % 25 % (cámara algo por encima: los de atrás suben) | igual |
| Alto del escenario | 440 px | 230 px |

Radios resultantes en escritorio: **N=12 → 366 px** · N=9 → 269 px · N=7 → 260 (mínimo) · N=5 → 260 (mínimo).
Con la tarjeta de 216 px (P7): **N=12 → 433 px** · N=9 → 319 px. **Comprobar a 1440×900 y 1366×650 que el anillo de 12 de Mascotas no se recorta** dentro del 55 %: si se recorta, el radio mínimo del cálculo se limita al ancho útil (`r ≤ (anchoEscenario − ancho) / 2`) y la perspectiva sube a 1000 px.
Con N=12 y perspectiva 900: escala percibida 1 al frente, **0,71 a los lados** y **0,55 detrás**; el anillo ocupa ~690 px de ancho, dentro de los ~730 px útiles del 55 %.
En móvil los productos de los lados quedan parcialmente fuera: el escenario recorta con `overflow: hidden` y una máscara que desvanece el 8 % de cada borde; que asomen a medias **invita a girar**.

### 3.3 Profundidad percibida (los de atrás: más pequeños, más oscuros, menos opacos)

| Propiedad | Frente (d=1) | Lados (d=0,5) | Atrás (d=0) | Cómo |
|---|---|---|---|---|
| Tamaño | 1 | ~0,71 | ~0,55 | Solo la perspectiva (no escalar a mano) |
| Oscurecido | 0 | 0,22 | **0,45** | Capa `::after` color `tinta` con `opacity = 0.45·(1−d)` (`--carrusel-oscuro-max`). Animar opacidad es barato; **no** usar `filter: brightness()` animado sobre imágenes de 800 px |
| Opacidad | 1 | 0,7 | **0,4** | `0.4 + 0.6·d` (`--carrusel-opacidad-min`) |
| Orden | encima | | debajo | `z-index` = round(d·100), explícito (Safari no siempre ordena bien en 3D) |
| Sombra de contacto | 0,35 | 0,2 | 0,1 | Elipse bajo cada producto, `opacity` ∝ d |

La capa de oscurecido usa la silueta del producto (`mask-image` con la misma imagen) para no pintar un rectángulo oscuro alrededor de los recortados; en modo placa basta con el rectángulo redondeado.

---

## 4. Escenario: hacer lucir los renders recortados

### 4.1 Fondo
- Panel izquierdo en `crema`. Detrás del producto del frente, un **foco de estudio**: `radial-gradient` elíptico `blanco` al 85 % → transparente, 60 % del ancho del escenario, centrado a la altura del producto frontal. Los envases saturados destacan sobre el blanco cálido sin que el fondo compita.
- Nada de verdes de marca ni oro detrás de los productos.

### 4.2 Tarima
- Elipse "en el suelo" del anillo: un `div` dentro del contexto 3D con `rotateX(90deg)`, diámetro 2r + ancho de tarjeta, así la perspectiva la convierte en óvalo exacto bajo los productos.
- Relleno `radial-gradient` de **`kraft`** (centro) a transparente (borde), más un filete de 1,5 px **`filete-canela`** (canela oscuro al 35 %) en el borde (reparto del color, 2026-10-14: el tono costal une los renders con la marca). Sustituye al `crema-oscuro` + filete `hoja`. Es decorativa (sin requisito de contraste).
- La tarima se funde con los productos al cambiar de categoría y su diámetro sigue al radio interpolado (C5); nunca vuelve a opacidad 1 de golpe.
- Cada producto proyecta una **sombra de contacto** propia: elipse de 70 % de su ancho × 12 px, `rgb(20 48 29)` con desenfoque estático de 6 px y opacidad según d.

### 4.3 Modo placa (imágenes con fondo)
Para las que no se puedan recortar (`melaza`, `sal en grano`, `diferentes tipos de semillas` y las que resulten sin alfa). **El bebedero ya no va en placa**: desde el 2026-10-14 se publica recortado (P3 resuelto).
- Misma huella 3:4 que los recortados, pero dibujada como **tarjeta**: `rounded-tarjeta`, `object-fit: cover`, borde 1 px `crema-oscuro`, `shadow-tarjeta`.
- Se ve intencional (una "foto de producto"), no un recorte fallido.
- En la lista, la miniatura de esas imágenes también usa `cover`.

### 4.4 Tarjeta genérica de costal (productos sin imagen, P5)

Los productos sin render (hoy 4 de Mascotas) no entran en el anillo, pero se pueden elegir en la lista. Antes dejaban al frente la imagen equivocada y un "·" colgando en el rótulo.

- Al elegirlos, **la tarjeta genérica ocupa el frente** del anillo (sustituye temporalmente al producto del frente; al girar o elegir otro producto, desaparece con el fundido de C1).
- Dibujo (guía §7.3): costal `kraft` con boca cosida (línea discontinua `canela-oscuro`), trébol `bosque` al 12 %, **nombre del producto** en Cormorant 700 `bosque` (6.41) y categoría en `tinta-suave` (5.00). Sin texto nuevo. CSS/SVG inline, < 1 kB, sin petición.
- Misma huella 3:4, misma sombra de contacto y misma llegada (C8) que un render.
- Rótulo: nombre, categoría y precio; **sin posición** ("x de N") y **sin el separador "·"** cuando no hay posición.
- En la lista y en la hoja de detalle móvil, la miniatura es el cuerpo kraft con el trébol.

---

## 5. Controles

### 5.1 Pestañas de categoría
- Pastillas de 44 px de alto (ver guía §7.3). Activa: `bosque` + blanco + 800. Inactiva: **`crema-oscuro`**, borde 1,5 px `tinta-suave`, texto `tinta` 400, recuento al 75 % de opacidad (P10). La forma rellena es la señal no cromática.
- Cambio de estado animado (C6): color de fondo y texto en 180 ms; pulsación `scale(0.97)` en 90 ms.
- Semántica: botones con `aria-pressed` (las pestañas filtran el anillo **y** desplazan la lista al grupo; no son un `tablist` clásico con un único panel).
- En móvil: fila desplazable en horizontal con `scroll-snap`.

### 5.2 Flechas ◀ ▶
- `<button>` de **52 px**, círculo `blanco`, borde 2 px `bosque` (8.69 sobre crema), chevron 24 px `bosque`. Hover: fondo `bosque`, chevron blanco. `:active` `scale(0.94)` en 90 ms. Móvil: 44 px.
- Escritorio: centradas en vertical respecto al producto del frente, a los bordes del escenario, `z-control`.
- **Móvil (P9):** fuera del escenario, **a los lados del rótulo** (línea de categoría y posición), para no tapar los renders.
- Al pulsar, el chevron se desplaza 3 px en su dirección y vuelve (90 ms + 150 ms) (C8).
- Nombres accesibles: "Producto anterior" / "Producto siguiente". El anillo es cíclico: nunca se deshabilitan.

### 5.3 Otras entradas
- **Clic o toque en un producto lateral:** gira hasta él.
- **Arrastre / deslizamiento:** 1 paso cada 0,8 × ancho de tarjeta arrastrado; al soltar se asienta en el más cercano con el giro estándar. **Un lanzamiento rápido avanza como máximo 2 pasos** (P9: antes un deslizamiento corto en móvil saltaba 5). Mientras se arrastra, el rótulo se atenúa (C7).
- **Teclado:** con el foco dentro del carrusel, `←`/`→` giran y **no** cambian de vista. ⚠ Conflicto con la regla del router (`←`/`→` cambian de vista "cuando el foco no está en un campo de texto"): el router debe ignorar las flechas cuando el foco está dentro de `[data-carrusel]`. Hay que añadirlo a la skill `vistas-hinojosa`.

### 5.4 Rótulo del producto al frente

```
        Pro-Can Adultos               ← Cormorant Garamond 700, text-producto (32 / 22 px), tinta
  Alimento Mascotas · 4 de 12  [ desde $2.25 ]   ← Nunito 400 text-cuerpo tinta-suave · chip maiz + tinta 800 (7.93)
```

- Centrado bajo la tarima, ancho máximo 28 ch, el nombre en una línea (`text-wrap: balance`; si no cabe, 2 líneas, nunca elipsis).
- Región `aria-live="polite"` aparte y discreta (visualmente oculta) que anuncia "Pro-Can Adultos. Producto 4 de 12, Alimento Mascotas", con un retardo de 250 ms para no saturar si se pulsa la flecha seguido.
- Al girar, el texto del rótulo **cambia cuando el giro llega al 50 %**, con salida y entrada **en el sentido del giro** (C2, sección 6.6). Sustituye al parpadeo 1 → 0,15 → 1 de la versión 1.
- El chip de precio anima su ancho al cambiar ("$2.25" ↔ "Consulta precio") (C3). En móvil el nombre reserva `min-height: 2lh` para que el rótulo no salte al ocupar dos líneas.
- Si el producto no tiene posición en el anillo (sin imagen, 4.4), no se muestra "x de N" ni el separador "·".
- Debajo del rótulo, el CTA oro **"Preguntar por este producto"** (P2, guía §7.3). No anima al girar: su texto no depende del producto.

---

## 6. Movimiento

### 6.1 Giro de un paso
| | Valor |
|---|---|
| Duración | **450 ms** (`--duracion-giro`, rango 400–500) |
| Curva | `--ease-giro` = `cubic-bezier(0.22, 1.3, 0.36, 1)`: ease-out con un **rebote mínimo** (sobrepasa ~2,5 % del paso: ~0,75° con N=12, ~1,8° con N=5) y asienta. En GSAP: la misma curva con `CustomEase`, o `back.out(0.8)` como aproximación |
| Qué anima | Solo θ; cada producto actualiza `transform`, `opacity`, `z-index` y su capa de oscurecido |

### 6.2 Saltos largos (clic en la lista o en un lateral lejano)
- Siempre por el **camino más corto** (como mucho N/2 pasos).
- Duración `450 ms + 60 ms × (pasos − 1)`, con tope **750 ms** (`--duracion-giro-extra`, `--duracion-giro-max`). Misma curva.
- Pulsaciones repetidas durante un giro: se recalcula el destino desde la posición actual (sin encolar ni saltar).

### 6.3 Cambio de categoría
**Sustituido por C5 + C1** (sección 6.6). La versión 1 (toda la escena se funde y escala a 0,96 sin dirección, la tarima vuelve a opacidad 1 de golpe, el radio salta de 366 a 260 px y las imágenes se destruyen y recrean) queda descartada.

### 6.4 Sincronización con la lista
- **Anillo → lista:** `aria-current` en la fila **inmediato**; el resaltado visual llega **al asentarse el giro** (C4). La lista hace `scrollIntoView({ block: 'nearest' })` (suave, o instantáneo con movimiento reducido).
- **Lista → anillo:** clic en una fila → resaltado visual **inmediato** (el usuario ya sabe qué ha pulsado); si es de otra categoría, primero el cambio de categoría (C5) y luego el salto al producto; si es de la misma, salto largo (6.2). Si no tiene imagen, tarjeta genérica (4.4).
- **El carrusel sigue a la búsqueda (P8):** al filtrar, el primer resultado con imagen pasa al frente (salto largo; cambio de categoría si hace falta). Se aplica cuando el usuario deja de escribir 300 ms, para no girar en cada tecla.
- Fila activa sobre el panel `hoja-claro`: fondo `fila-activa-panel` (blanco) + barra izquierda `bosque` 4 px + nombre en 800 (guía §2.2).

### 6.5 Entrada de la vista
El carrusel **no tiene animación de entrada propia**. En la entrada escalonada de la vista (storyboard-hero §4.3) el anillo es el **bloque 2 sin animación**: ocupa su turno de 50 ms pero solo se mueve con la capa de la vista. Un movimiento por región.

### 6.6 Transiciones C1–C8: que nada cambie de golpe

Decididas en `PLAN.md` vista 3 a partir de las medidas de `auditoria.md` §7.3. Reglas comunes: solo `transform` y `opacity` (excepción acotada: el ancho del chip, C3); **con `prefers-reduced-motion` o la pausa del sitio (`html[data-movimiento="pausado"]`) todos los cambios son instantáneos**, y toda `transition` nueva se condiciona con `html:not([data-movimiento="pausado"])` porque la pausa solo anula `animation`.

> **Regla M5 (bloqueante):** en `#productos`, la **tarjeta provisional del primer montaje** se queda **igual e invisible bajo el anillo** hasta la primera interacción o 1,5 s. Los fundidos de C1 **no se aplican al primer montaje**: la primera imagen aparece como hoy. Si se rompe, Lighthouse móvil de `#productos` baja de 93–97 a 86. Comprobar con Lighthouse móvil tras cada cambio en esta sección.

| # | Elemento | Comportamiento | Tiempos |
|---|---|---|---|
| **C1** | Imágenes al cambiar de categoría | **Caché de ítems por categoría:** al salir de una categoría, sus nodos se **desmontan, no se destruyen** (volver a ella es instantáneo); nunca más de 12 en escena. **Precarga** de la categoría nueva durante la salida de C5, esperando `img.decode()` con **tope de 250 ms** desde el clic. Cada imagen que aparece lo hace con un **fundido de 200 ms**; si una no ha llegado al tope, su hueco muestra la silueta 3:4 (`--color-silueta-carga`, sin shimmer) y se funde cuando llega. **Nunca en el primer montaje (M5)** | Fundido 200 ms, `ease-vista`. Tope de espera 250 ms |
| **C2** | Rótulo (nombre, categoría, posición) | Sale **en el sentido del giro** (con ▶ los productos van hacia la izquierda: el texto sale a −12 px; con ◀, a +12 px), cambia el texto **a mitad del giro** y entra desde el lado contrario hasta 0. La línea de categoría y posición va **40 ms después** del nombre. Anclado a la mitad del giro: salida de 110 ms que **termina** en el 50 % | Giro de 450 ms: salida 115–225 ms (`ease-salida`), cambio en 225 ms, entrada 225–425 ms (`ease-vista`); meta 265–465 ms. Saltos largos: mismo esquema alrededor de su mitad |
| **C3** | Chip de precio | Su **ancho** se anima de la medida anterior a la nueva (se mide antes y después del cambio de texto; `overflow: hidden`, `white-space: nowrap`), y su texto hace el mismo fundido que la meta de C2. En móvil, `min-height: 2lh` en el nombre | Ancho 200 ms `ease-vista` desde el cambio de texto |
| **C4** | Fila resaltada de la lista | `aria-current` **inmediato** (accesibilidad). El **resaltado visual** se aplica **al asentarse el anillo**: fondo en 200 ms y la barra de 4 px crece con `scaleY` 0 → 1 (`transform-origin: center`) en 250 ms. La fila anterior pierde el resaltado a la vez (fondo 200 ms, barra `scaleY` 1 → 0 en 150 ms). **Si el clic viene de la propia lista, el resaltado es inmediato** | 200 / 250 ms, `ease-vista` |
| **C5** | Cambio de categoría | **Medio giro direccional:** el anillo actual sale girando **medio paso en el sentido del orden de las pestañas** (a una pestaña de la derecha, θ avanza como con ▶; a la izquierda, como con ◀) mientras sus productos y la tarima se funden; el anillo nuevo entra **desde el lado opuesto** (θ parte de −½ paso y llega a 0) con el rebote mínimo, mientras sus productos y la tarima aparecen. El **radio se interpola** del valor viejo al nuevo durante la entrada (nunca salta). La lista se desplaza a la cabecera del grupo y el rótulo pasa al primer producto (con C2) al empezar la entrada | Salida 160 ms (`ease-salida`) → espera de C1 (hasta 250 ms desde el clic) → entrada 320 ms (`--ease-giro`). Total típico 480 ms; máximo 570 ms |
| **C6** | Pestañas | Color (fondo, texto, borde) en 180 ms; pulsación `scale(0.97)` en 90 ms. Opcional: pastilla deslizante como la de la barra cuando están en 4 columnas (escritorio) | 180 / 90 ms |
| **C7** | Arrastre | Mientras se arrastra y cambia el producto del frente, el rótulo **se atenúa a 0,5** (no cambia el texto: no hay que leerlo a medias). Al soltar, el anillo se asienta y el rótulo hace el cambio normal de C2 desde 0,5 | Atenuado 120 ms |
| **C8** | Llegada | Al asentarse el giro, el producto del frente **sube 4 px** y su **sombra de contacto se intensifica** (opacidad 0,35 → 0,5, `scaleX` 1 → 1,06). Vuelve a su sitio al empezar el siguiente giro (100 ms). Al pulsar una flecha, su chevron se mueve 3 px en su dirección y vuelve | Llegada 180 ms `ease-vista`; chevron 90 + 150 ms |

**Línea de tiempo de un cambio Granja → Mascotas (escritorio, imágenes en caché o decodificadas a tiempo)**

| t | Qué pasa |
|---|---|
| 0 ms | Clic en "Mascotas". Pestaña: color en 180 ms (C6). Empieza la salida del anillo de Granja: medio paso hacia la izquierda + fundido de productos y tarima (C5). Se piden y decodifican las imágenes de Mascotas (C1) |
| 160 ms | Anillo de Granja desmontado (a la caché). Las imágenes de Mascotas ya están decodificadas → entra el anillo de Mascotas desde la derecha, radio 269 → 366 px (con P7: 319 → 433) |
| 160 ms | La lista se desplaza a "MASCOTAS"; el rótulo empieza su cambio (C2) al primer producto |
| 480 ms | Anillo asentado con el rebote mínimo. Llegada del frente (C8). Resaltado visual de la fila (C4) |
| 660 ms | Fin de la llegada |

### 6.7 Móvil: buscador arriba y hoja de detalle (P6)

- El **buscador sube por encima del carrusel** (bajo la cabecera de la vista), dentro de la franja `bosque` de la guía §7.3.
- **Tocar una fila abre la hoja de detalle** (`<dialog>` modal desde abajo: imagen, nombre, presentación, precio, "Preguntar", "Cerrar"; guía §7.3) **en lugar de** girar un carrusel que queda fuera de la pantalla. El anillo se sincroniza por detrás sin animación (el usuario no lo ve).
- Entrada `translateY(100%)` → 0 en 300 ms `ease-vista`; salida 200 ms `ease-salida`; telón `velo-franja` con fundido de 200 ms. Con movimiento reducido o pausa: aparece y desaparece sin desplazamiento.
- Foco al título de la hoja al abrir; `Esc` y "Cerrar" la cierran; el foco vuelve a la fila; fondo inerte; `←`/`→` no cambian de vista mientras está abierta.

---

## 7. Estados de respaldo

| Situación | Qué se ve |
|---|---|
| `prefers-reduced-motion: reduce` **o pausa del sitio** | El anillo se mantiene (es información espacial estática, con la profundidad de 3.3), pero **todo cambio es instantáneo**: giro, salto largo y cambio de categoría sin tween; rótulo, chip, fila y pestañas cambian sin transición (C1–C8 desactivados); sin arrastre con inercia (el arrastre da pasos discretos); la hoja de detalle aparece sin desplazamiento |
| Sin JavaScript | En lugar del anillo, **rejilla estática de 4 tarjetas de categoría** (imagen representativa en modo placa + nombre + número de productos) que enlazan al grupo correspondiente de la lista (`#lista-granja`…). La lista completa funciona igual |
| Navegador sin `transform-style: preserve-3d` (`@supports not`) o imagen que no carga | Fila horizontal plana con `scroll-snap` de los productos de la categoría activa, mismas pestañas, flechas y rótulo. Producto sin imagen: tarjeta genérica de costal (4.4) |
| Error al cargar la categoría | Mensaje en el escenario: "No pudimos cargar las imágenes. La lista de la derecha tiene todos los productos." + botón secundario "Reintentar" (heurística 9) |
| WebGL | **No se necesita.** Es CSS 3D: no hay escena Three.js ni presupuesto de 3 MB que vigilar. Three.js queda fuera del bundle |

---

## 8. Cómo se ve, cuadro a cuadro (escritorio, N=12, categoría Mascotas)

```
Cuadro A — reposo                     Cuadro B — 225 ms tras ▶ (mitad del giro)
                                      
   ▫▫  ▫▫  ▫▫  ▫▫    (atrás 0,55,          ▫▫  ▫▫  ▫▫  ▫▫
 ▫▫              ▫▫   40 %, oscuras)     ▫▫              ▫▫
◀  ▫▫  ┌──────┐  ▫▫ ▶                    ◀  ▫▫ ┌────┐┌────┐ ▫▫ ▶   ← dos productos
       │PRO-CAN│                                │PRO-││DOG │       compartiendo
       │ADULTOS│                                │CAN ││CHOW│       el frente
       └──────┘                                └────┘└────┘
  ═══════ tarima ═══════                  ═══════ tarima ═══════
     Pro-Can Adultos                          Dog Chow           ← el rótulo
 Alimento Mascotas · 4 de 12               Alimento Mascotas · 5 de 12   cambia al 50 %

Cuadro C — 450 ms: Dog Chow sobrepasa ~0,75° y asienta. La fila "Dog Chow" de la lista se activa.
```

## 9. Checklist

- [x] Percepción de círculo: perspectiva 900 px + origen al 25 %, atrás 0,55 de escala, 45 % de oscurecido y 40 % de opacidad.
- [x] Sin autorrotación; giro solo por flechas, clic, arrastre, teclado o lista.
- [x] 450 ms ease-out con rebote mínimo; saltos largos ≤ 750 ms.
- [x] Solo `transform` y `opacity` animados (oscurecido por capa, no por filtro).
- [x] Flechas como `<button>` con nombre, 52/44 px, borde 8.69:1.
- [x] Producto al frente rotulado en texto y anunciado con `aria-live`.
- [x] Lista = alternativa textual completa; ningún dato existe solo en el anillo.
- [x] Reduced motion, sin JS y sin 3D tienen respaldo definido.
- [ ] C1–C8 implementados; con movimiento reducido **o pausa del sitio**, todo instantáneo (también las `transition`).
- [ ] **Regla M5:** primer montaje sin fundidos; Lighthouse móvil de `#productos` ≥ 93 tras cada cambio.
- [ ] Anillo de 12 con la tarjeta de P7 sin recortarse a 1440×900 y 1366×650.
- [ ] Inercia: un lanzamiento mueve como máximo 2 posiciones.
- [ ] Productos sin imagen: tarjeta de costal al frente, sin "·" colgando.
- [ ] Móvil: tocar una fila abre la hoja de detalle; foco, `Esc` y retorno del foco correctos.
