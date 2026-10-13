# Storyboard: carrusel 3D de Productos

> Fase 1 (diseño), 2026-10-12. Basado en `PLAN.md` sección 0 (manda) y vista 3.
> Sustituye a la "ruleta de 10 costales .glb con Three.js": no llegaron modelos 3D sino **renders PNG**, así que el carrusel es un **anillo CSS 3D** (`perspective` + `translate3d`) movido con GSAP, sin WebGL.
> Tokens: `src/styles/tokens.css` (`--carrusel-*`, `--duracion-giro*`, `--duracion-categoria-*`, `--ease-giro`, `--ease-salida`, `--ease-vista`). Retícula de la vista: `docs/guia-estilo.md` §7.3.

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
| Tarjeta (3:4) | **180 × 240 px** (`--carrusel-ancho`) | **116 × 155 px** |
| Hueco | 16 px | 10 px |
| Radio mínimo | 260 px | 170 px |
| `perspective` | **900 px** | **600 px** |
| `perspective-origin` | 50 % 25 % (cámara algo por encima: los de atrás suben) | igual |
| Alto del escenario | 440 px | 230 px |

Radios resultantes en escritorio: **N=12 → 366 px** · N=9 → 269 px · N=7 → 260 (mínimo) · N=5 → 260 (mínimo).
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
- Relleno `radial-gradient` de `crema-oscuro` (centro) a transparente (borde), más un filete de 1,5 px `hoja` al 35 % en el borde. Es decorativa (sin requisito de contraste).
- Cada producto proyecta una **sombra de contacto** propia: elipse de 70 % de su ancho × 12 px, `rgb(20 48 29)` con desenfoque estático de 6 px y opacidad según d.

### 4.3 Modo placa (imágenes con fondo)
Para las que no se puedan recortar (`bebedero`, `melaza`, `sal en grano`, `diferentes tipos de semillas` y las que resulten sin alfa):
- Misma huella 3:4 que los recortados, pero dibujada como **tarjeta**: `rounded-tarjeta`, `object-fit: cover`, borde 1 px `crema-oscuro`, `shadow-tarjeta`.
- Se ve intencional (una "foto de producto"), no un recorte fallido.
- En la lista, la miniatura de esas imágenes también usa `cover`.

---

## 5. Controles

### 5.1 Pestañas de categoría
- Pastillas de 44 px de alto (ver guía §7.3). Activa: `bosque` + blanco + 800. Inactiva: blanco, borde 1,5 px `tinta-suave`, texto `tinta` 400. La forma rellena es la señal no cromática.
- Semántica: botones con `aria-pressed` (las pestañas filtran el anillo **y** desplazan la lista al grupo; no son un `tablist` clásico con un único panel).
- En móvil: fila desplazable en horizontal con `scroll-snap`.

### 5.2 Flechas ◀ ▶
- `<button>` de **52 px**, círculo `blanco`, borde 2 px `bosque` (8.69 sobre crema), chevron 24 px `bosque`. Hover: fondo `bosque`, chevron blanco. `:active` `scale(0.94)` en 90 ms. Móvil: 44 px.
- Centradas en vertical respecto al producto del frente, a los bordes del escenario, `z-control`.
- Nombres accesibles: "Producto anterior" / "Producto siguiente". El anillo es cíclico: nunca se deshabilitan.

### 5.3 Otras entradas
- **Clic o toque en un producto lateral:** gira hasta él.
- **Arrastre / deslizamiento:** 1 paso cada 0,8 × ancho de tarjeta arrastrado; al soltar se asienta en el más cercano con el giro estándar. Un lanzamiento rápido avanza como máximo 3 pasos.
- **Teclado:** con el foco dentro del carrusel, `←`/`→` giran y **no** cambian de vista. ⚠ Conflicto con la regla del router (`←`/`→` cambian de vista "cuando el foco no está en un campo de texto"): el router debe ignorar las flechas cuando el foco está dentro de `[data-carrusel]`. Hay que añadirlo a la skill `vistas-hinojosa`.

### 5.4 Rótulo del producto al frente

```
        Pro-Can Adultos               ← Cormorant Garamond 700, text-producto (32 / 22 px), tinta
  Alimento Mascotas · 4 de 12  [ desde $2.25 ]   ← Nunito 400 text-cuerpo tinta-suave · chip maiz + tinta 800 (7.93)
```

- Centrado bajo la tarima, ancho máximo 28 ch, el nombre en una línea (`text-wrap: balance`; si no cabe, 2 líneas, nunca elipsis).
- Región `aria-live="polite"` aparte y discreta (visualmente oculta) que anuncia "Pro-Can Adultos. Producto 4 de 12, Alimento Mascotas", con un retardo de 250 ms para no saturar si se pulsa la flecha seguido.
- Al girar, el texto del rótulo **cambia cuando el giro llega al 50 %** (no al empezar ni al terminar), con un fundido de 120 ms: acompaña al producto que entra.

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
| t | Qué pasa |
|---|---|
| 0–150 ms | Los productos actuales salen: `opacity` → 0 y escala → 0,96, `ease-salida` (ease-in, lo que se va) |
| 150 ms | Se sustituye el contenido; θ = 0; se recalcula r para el nuevo N |
| 150–450 ms | Los nuevos entran: `opacity` 0 → valor según d, `translateY(12px)` → 0, `ease-vista`, 300 ms, **del frente hacia atrás** con 20 ms entre productos (desfase total ≤ 120 ms) |
| 150 ms | La lista se desplaza a la cabecera del grupo; el rótulo cambia al primer producto |

Las imágenes de la categoría se cargan al pulsar la pestaña (las de la primera, al entrar en la vista). Mientras llega una imagen, su hueco muestra la silueta 3:4 en `crema-oscuro` al 60 %, **sin shimmer animado**.

### 6.4 Sincronización con la lista
- **Anillo → lista:** al asentarse el giro, la fila correspondiente pasa a activa (fondo `hoja-claro` + barra `bosque` 4 px + nombre en 800) y la lista hace `scrollIntoView({ block: 'nearest' })` (suave, o instantáneo con reduced motion).
- **Lista → anillo:** clic en una fila → si es de otra categoría, primero el cambio de categoría (6.3) y luego el salto al producto; si es de la misma, salto largo (6.2).
- El buscador filtra la lista, no el anillo.

### 6.5 Entrada de la vista
El carrusel **no tiene animación de entrada propia**: llega con la transición de vista (400 ms, desplazamiento horizontal). Un movimiento por región.

---

## 7. Estados de respaldo

| Situación | Qué se ve |
|---|---|
| `prefers-reduced-motion: reduce` | El anillo se mantiene (es información espacial estática, con la profundidad de 3.3), pero **todo cambio es instantáneo**: giro, salto largo y cambio de categoría sin tween; el rótulo cambia sin fundido; sin arrastre con inercia (el arrastre da pasos discretos) |
| Sin JavaScript | En lugar del anillo, **rejilla estática de 4 tarjetas de categoría** (imagen representativa en modo placa + nombre + número de productos) que enlazan al grupo correspondiente de la lista (`#lista-granja`…). La lista completa funciona igual |
| Navegador sin `transform-style: preserve-3d` (`@supports not`) o imagen que no carga | Fila horizontal plana con `scroll-snap` de los productos de la categoría activa, mismas pestañas, flechas y rótulo. Producto sin imagen: icono de la categoría en placa `crema-oscuro` + nombre |
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
