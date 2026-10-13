# Storyboard: Canela en Inicio y transición entre vistas

> Fase 1 (diseño), reescrito el 2026-10-12. Sustituye al storyboard anterior (hero 3D con Canela grande en insignia, granos con paralaje de scroll, entradas escalonadas por sección), que **ya no existe**: el sitio es ahora de 5 vistas sin scroll (`PLAN.md`, sección 3) y el único personaje animado es Canela cruzando la franja inferior de Inicio (sección 0 y vista 1).
> Tokens: `src/styles/tokens.css` (`--canela-*`, `--duracion-vista`, `--ease-*`, `animate-canela-*`, `animate-vista-*`). Guía: `docs/guia-estilo.md`.
> Criterio de movimiento: skill `motion-and-storytelling` (sutileza, ease-out para entrar, solo `transform`/`opacity`, un movimiento por región).

---

## 0. Activo y requisitos previos

**Activo:** `Nuevos Req/Mascota/Canela.png` — render estilo 3D, 2752×1536, Canela **sentada y de frente**, gorra verde y collar con dije de trébol "H". La figura ocupa solo el centro del lienzo (aprox. x 860–1930, y 85–1480 px del original): proporción del recorte **ancho/alto ≈ 0,76** (`--canela-proporcion`).

**Antes de animar, el agente de activos debe:**
1. **Verificar el canal alfa.** El PLAN lo da por recortado, pero en la vista previa se ve un **fondo de estudio gris con degradado y sombra de suelo**. Comprobar con `sharp(...).metadata()` (`hasAlpha`) y el alfa de un píxel de esquina. Si no hay alfa real, hay que recortarla (manual o con eliminación de fondo y repaso del pelo) antes de usarla: un rectángulo gris saltando sobre el verde de Inicio no es aceptable.
2. **Recortar al contenido** (`trim`) para que el lienzo no tenga 2/3 de aire: el tamaño en pantalla se calcula por el alto de la figura.
3. **Quitar la sombra de suelo horneada** si la trae: la sombra la dibuja el CSS (sección 2.4) para que se encoja durante el salto.
4. Exportar `public/img/canela/canela.webp` (+ `.avif`) a **160 y 320 px de alto** (1x/2x del tamaño máximo de 120 px), objetivo < 30 kB. `loading="eager"`, `fetchpriority="low"`, `decoding="async"`: el LCP es el logo, no Canela.

**Plan B mientras no haya recorte limpio:** Canela dentro de un **medallón** (círculo con interior `crema`, aro `maiz` 3 px y aro `bosque` 6 px, recorte del busto con `object-fit: cover`), que salta exactamente con el mismo storyboard. Es la insignia de la marca, así que no desentona.

**Sobre el video `Canela Jugando.mp4`:** si al revisarlo trae alfa o un fondo liso recortable, puede sustituir al salto (WebM VP9 con alfa + fallback). Este storyboard es el **bucle por defecto** que manda la sección 0 y no depende del video.

---

## 1. La idea en una frase

Canela cruza la franja inferior de Inicio **de derecha a izquierda a saltitos cortos**, como un cachorro que va contento hacia algún sitio; sale por la izquierda, desaparece un rato y vuelve a entrar por la derecha. Es un adorno de fondo: se nota sin llamar la atención y **nunca compite con el botón "Ver productos"** (staging: ella vive en su franja, el contenido en la suya).

Como el render es frontal y sentado, el desplazamiento se lee como "saltitos de conejo" de lado. La dirección la marca una **inclinación de 3° hacia la izquierda** en el aire (principio de arcos y anticipación), no un cambio de pose.

---

## 2. Especificación del bucle

### 2.1 Escala y posición

| Medida | 1440×900 | 768×1024 | 360×640 | Token |
|---|---|---|---|---|
| Alto de Canela | **112 px** (13 % de la vista útil de 836) | 120 px (tope) | **70 px** (13 % de 524) | `--canela-alto` |
| Ancho (×0,76) | 85 px | 91 px | 53 px | `--canela-proporcion` |
| Altura del salto (×0,16) | 18 px | 19 px | 11 px | `--canela-altura-salto` |
| Franja reservada | 140 px (16,7 %) | 149 px | 91 px (17 %) | `--franja-canela` |

- La franja es la **segunda fila del grid de Inicio** (`grid-template-rows: 1fr var(--franja-canela)`), no una capa absoluta encima del contenido. Por construcción Canela no puede tapar texto ni botón.
- Línea de suelo: 10 px por encima del borde inferior de la vista. Canela apoya las patas ahí (`transform-origin: 50% 100%`).
- `overflow: hidden` en la franja (no en la vista, para no recortar el anillo de foco del botón de pausa).

### 2.2 Ritmo

| Parámetro | Valor | Motivo |
|---|---|---|
| Un saltito completo | **520 ms** (`--canela-salto`) | Dentro de los 400–600 ms del PLAN; a 520 ms se lee "alegre" sin parecer nervioso |
| Ciclo completo escritorio | **11,5 s** = cruce 8,3 s (72 %) + pausa fuera 3,2 s (28 %) | ~184 px/s → unos 16 saltitos de ~95 px (0,85 × alto) por cruce |
| Ciclo tableta (< 1024 px) | 9 s = 6,5 s + 2,5 s | ~150 px/s |
| Ciclo móvil (< 768 px) | **6,5 s** = 4,7 s + 1,8 s | ~88 px/s → ~9 saltitos de ~46 px; en pantalla chica un cruce largo cansa |
| Velocidad horizontal | **constante** durante el cruce | Es desplazamiento, no un elemento de UI que llega: el "ease" vive en cada salto. Acelerar y frenar el cruce haría que pareciera arrastrada |
| Primera entrada | **1,2 s** después de mostrarse Inicio (`--canela-retraso`) | Primero se lee logo, lema y botón (scene setting); luego entra el adorno |
| Pausa fuera de pantalla | 28 % del ciclo | Deja respirar la vista; el ojo vuelve al contenido |

El número de saltos no tiene que ser entero por cruce: el salto es un bucle independiente y los bordes del cruce están fuera de pantalla, así que no se ve ningún corte.

### 2.3 Anatomía de un saltito (520 ms)

```
 tiempo:   0%        12%            50%             88%      100% = 0%
           ▁▁        ▏▏             ╱╲              ▏▏       ▁▁
          (aplasta) (estira, despega) (ápice, -3°)  (estira, cae) (aplasta)
 escala:  1.06×0.92  0.96×1.05      1×1             0.97×1.04  1.06×0.92
 subida:  0          -3 %·alto      -16 %·alto      -3 %·alto  0
 giro:    0°         -1°            -3°             -1°        0°
 curva:   ├ease-subir┤├─ease-subir──┤├──ease-caer───┤├ease-out┤
```

- **Squash & stretch leve**: máximo ±8 %, conservando aproximadamente el volumen (cuando ensancha, baja). Más se vería de goma.
- **Anticipación** en el aplastamiento de contacto; **arco** en la subida desacelerada y la caída acelerada (gravedad).
- El primer y el último cuadro son idénticos: **el bucle calza sin salto**.
- Implementado en `@keyframes canela-salto` (`tokens.css`). Se aplica a la imagen (`.canela-salto`), dentro del envoltorio que cruza.

### 2.4 Sombra en el suelo

- Elipse `div` hermana de la imagen, dentro del envoltorio que cruza: viaja en horizontal con Canela **pero no sube**.
- Tamaño: 70 % del ancho de Canela × 10 px; color `rgb(0 0 0 / 1)` con la opacidad de la animación, `filter: blur(4px)` estático (no animado).
- `@keyframes canela-sombra`, mismo período de 520 ms: en contacto escala 1 y opacidad 0,32; en el ápice escala 0,68 × 0,8 y opacidad 0,16. Así el salto se "ve" despegar del suelo.

### 2.5 Estructura y capas

```
.franja-canela (fila 2 del grid, overflow hidden, position relative)
├─ .canela-cruce   ← animate-canela-cruce   (envoltorio del tamaño de Canela, left:0, bottom:10px)
│  ├─ .canela-sombra ← animate-canela-sombra
│  └─ img.canela-salto ← animate-canela-salto (aria-hidden, alt="")
└─ button.pausa   (44×44, abajo a la derecha, z-control)
```

`@keyframes canela-cruce`: 0 % en `translateX(100vw)` (fuera por la derecha), 72 % en `translateX(-100%)` (fuera por la izquierda), 100 % igual (espera). Solo `transform`; nada de `left`.

### 2.6 Pausa (WCAG 2.2.2) y reposo

- **Botón de pausa** visible en la esquina inferior derecha de la franja: 44×44, círculo `crema` opaco, borde 2 px `bosque`, icono `bosque`; `aria-pressed`, nombre "Pausar animación" / "Reanudar animación". Canela pasa **por detrás** (z-control > z-canela).
- Al pausar, Canela **no se congela a media zancada ni queda invisible fuera de pantalla**: pasa al **cuadro de reposo** (abajo). Al reanudar, el ciclo reinicia desde la entrada por la derecha.
- La preferencia se guarda (`localStorage`) y se refleja en `html[data-movimiento="pausado"]`, el mismo gancho que ya usa `global.css`.

**Cuadro de reposo** (pausa y `prefers-reduced-motion: reduce`):
- Canela sentada, escala 1, giro 0, apoyada en el suelo con su sombra en estado de contacto (0,32).
- Posición: a la derecha de la franja, **a la izquierda del botón de pausa** — `right: calc(var(--spacing-vista) + 44px + 16px)`. Con reduced motion el botón de pausa se oculta (no hay nada que pausar) y Canela queda a `right: var(--spacing-vista)`.
- Es literalmente el render original: no hay que extraer ningún cuadro.
- Con reduced motion no se aplica ninguna de las tres animaciones (no basta con acortar duraciones: el `global.css` actual las reduce a 0,01 ms con 1 iteración, lo que dejaría a Canela en el 100 % del cruce, **fuera de pantalla**). La regla es explícita: `animation: none` en `.canela-cruce`, `.canela-salto` y `.canela-sombra`, más la posición de reposo.

### 2.7 Ciclo de vida

| Situación | Comportamiento |
|---|---|
| Carga directa en `#inicio` | Retraso de 1,2 s y empieza a cruzar |
| Se sale de Inicio | La vista pasa a `display: none`: las animaciones CSS se detienen solas (sin coste) |
| Se vuelve a Inicio | Se reinician desde el principio: entra por la derecha tras el retraso. No se "retoma" a media pantalla |
| Pestaña en segundo plano | El navegador ya pausa las animaciones; no hace falta JS |
| Táctil / gama baja | Mismo bucle (es CSS barato: 3 transforms y 1 opacidad). Si el perfil de rendimiento lo pide, el ciclo móvil puede alargar la pausa |

**Implementación recomendada: solo CSS** (los keyframes ya están en `tokens.css`). No hace falta GSAP en Inicio, lo que ayuda al presupuesto de < 1,5 MB de la vista.

---

## 3. Transición entre vistas

### 3.1 Decisión: **desplazamiento horizontal corto**, una sola metáfora para todo el sitio

Las 5 vistas están en fila en la barra (izquierda → derecha) y `←`/`→` las recorren: el movimiento horizontal **confirma ese modelo espacial** (ir "a la derecha" de la barra = la vista nueva llega desde la derecha). Un fundido puro no transmite orden; un deslizamiento de pantalla completa obligaría a mostrar dos vistas a la vez (choca con `display: none` + `inert`) y es demasiado recorrido para usuarios sensibles al movimiento.

| Parámetro | Valor |
|---|---|
| Qué se anima | **Solo la vista entrante.** La saliente pasa a `display: none` + `inert` al instante (un movimiento por región) |
| Recorrido | 48 px (`--desplazamiento-vista`), no la pantalla entera |
| Opacidad | 0 → 1 a la vez que el recorrido (acompaña al desplazamiento; no es un segundo efecto) |
| Duración | **400 ms** (`--duracion-vista`, dentro de 350–450) |
| Curva | `ease-vista` = `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out) |
| Dirección | Índice mayor (p. ej. Inicio → Productos): entra **desde la derecha** (`animate-vista-adelante`). Índice menor: **desde la izquierda** (`animate-vista-atras`). Botón "atrás" del navegador: según el índice resultante |
| Indicador de la barra | La pastilla `bosque` se desliza al nuevo ítem en 300 ms con la misma curva, empezando a la vez |
| Foco | Se mueve al `<h2>` de la vista nueva **al iniciar** la transición (no al terminar), para que el lector de pantalla anuncie ya |
| Carga directa por hash | Sin transición: la vista aparece en su sitio |
| Clics rápidos seguidos | La animación en curso se cancela y la nueva parte desde su estado inicial; nunca se encolan |
| `prefers-reduced-motion` | **Corte seco**: cambio instantáneo, indicador incluido |

Prohibido mezclar: ninguna vista entra con escala, desde abajo ni con fundido distinto. Dentro de una vista, nada más se anima mientras dura la entrada (el Lottie de los pilares empieza al terminar, a los 400 ms; Canela tiene su retraso de 1,2 s).

### 3.2 Línea de tiempo de un cambio Inicio → Productos

| t | Qué pasa |
|---|---|
| 0 ms | Clic en "Productos". Inicio → `display:none` + `inert`. Productos visible con `animate-vista-adelante`. Foco al `<h2>`. La pastilla de la barra empieza a deslizarse. Se pide la carga diferida del carrusel si no estaba |
| 300 ms | La pastilla llega a "Productos" |
| 400 ms | Productos en su sitio. El carrusel queda en reposo (no hace entrada propia) |

---

## 4. Otros movimientos de Inicio

- **Granos de maíz** (6 como máximo, SVG inline `maiz`/`canela`, 12–24 px): paralaje con el ratón de **8 px máximo** (`--paralaje-max`), solo con `(hover: hover) and (pointer: fine)`, suavizado lerp 0,08 en `requestAnimationFrame`. Sin bucles propios: en reposo están quietos. Desactivado con reduced motion y con la pausa.
- **Logo:** estático desde el primer cuadro (es el LCP; animar su opacidad empeora el LCP, como se midió en la fase 4 anterior).
- **Botón "Ver productos":** `:active` → `scale(0.96)` en 90 ms. Sin pulsos ni brillos en bucle.
- No hay secuencia de entrada: lema, subtítulo y botón están desde el primer pintado.

## 5. Checklist (motion-and-storytelling)

- [x] Solo `transform` y `opacity` (la sombra usa `filter` estático, no animado).
- [x] Ease-out al entrar (vista), arcos con gravedad en el salto, velocidad constante solo en el desplazamiento de Canela.
- [x] Duraciones: vista 400 ms, salto 520 ms, indicador 300 ms.
- [x] Un movimiento por región: la franja de Canela está separada del contenido; nada compite con la entrada de vista.
- [x] Bucle > 5 s con pausa visible; reduced motion con cuadro de reposo **dentro** de la pantalla.
- [x] Bucle que calza (primer cuadro = último).
