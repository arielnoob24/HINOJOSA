# Storyboard: Inicio (Canela corriendo, entrada) y transición entre vistas

> Reescrito el 2026-10-14 con las decisiones de `PLAN.md` §0-B y vista 1 ("Canela: carrera de borde a borde", sustituye a I8) y §3 ("Transición entre vistas", T1–T2 + A+).
> **Sustituye** al storyboard anterior, en el que Canela era la foto sentada cruzando la franja a saltitos (se veía falso: una foto deslizándose) y la transición solo animaba la vista entrante (destello del fondo crema, duración percibida ~150 ms).
> Contrato del router, de la transición y de la barra: skill `vistas-hinojosa` (manda sobre este documento si difieren). Guía: `docs/guia-estilo.md` §7.1 y §12. Criterio: skill `motion-and-storytelling`.

---

## 1. La idea en una frase

Canela, la perrita de la marca, **está sentada** en la franja inferior de Inicio cuando llegas; se levanta y **sale corriendo de verdad** hasta el borde izquierdo, **frena y da la vuelta**, corre hasta el borde derecho, frena y da la vuelta, y así sigue. Un cachorro que juega en la puerta de la tienda: se nota, alegra, y **nunca compite con los botones** (vive en su propia fila del grid).

Solo se sienta al principio. Nunca sale de la pantalla ni vuelve a entrar por un borde. Nunca gira de golpe.

---

## 2. Canela: carrera de borde a borde

### 2.1 Activos

**Fuente:** `flow/Puppy_running_in_place_1080p_20261013235908.mp4` (1920×1080, 24 fps, 10 s; corre en el sitio, centrada, cámara fija). Tramos medidos en `PLAN.md` vista 1:

| Tramo del video | Contenido | Sprite (12 fps) | Cuadros aprox. |
|---|---|---|---|
| 0,6–1,9 s | Sentada de frente → se levanta → gira a la izquierda | `canela-arranque` | 16 |
| dentro de 2,0–4,8 s | Ciclo de carrera hacia la izquierda, bucle cerrado de 0,5–0,8 s | `canela-carrera-izq` | 6–10 |
| ~4,8–5,5 s | Frena, gira pasando de frente, sale hacia la derecha | `canela-giro` | 8–9 |
| dentro de 5,5–10 s | Ciclo de carrera **nativo** hacia la derecha, bucle cerrado | `canela-carrera-der` | 6–10 |

- **No se espeja la carrera:** el texto "HINOJOSA" de la gorra saldría al revés. Se usa el tramo nativo hacia la derecha.
- **Giro del borde derecho** (derecha → izquierda): no existe en el video. Opción A, `canela-giro` espejado con `scaleX(-1)` (el logo de la gorra se ve invertido ~0,3 s; a 112 px apenas se nota). Opción B, `canela-giro` reproducido al revés (las patas retroceden durante la frenada). Se decide al verlo en la página; la recomendación de dirección de arte es **A**, porque el movimiento físico manda sobre un detalle de 0,3 s.
- Procesado (`activos-3d-video`, `nuevos_req.py`): fondo quitado con `modelo_fondo` + limpieza del tinte azul en el borde del pelaje; **sombra del video descartada**; sin audio; cada sprite a **2× la altura de la franja** (240 px de alto por cuadro), WebP en una tira horizontal. Presupuesto **≤ 450 kB los cuatro**; si se pasa, menos alto o menos cuadros (12 fps basta).
- `Canela.png` / `canela-franja`: pose sentada para **la espera mientras cargan los sprites, el reposo y el movimiento reducido**.

### 2.2 Escala y posición

| Medida | 1440×900 | 1366×650 | 360×640 | Token |
|---|---|---|---|---|
| Alto de Canela | **112 px** (13 %) | 81 px | **70 px** (13 %) | `--canela-alto` (sin cambios) |
| Caja del cuadro de carrera (ancho) | ≈ 1,35 × alto = 151 px | 109 px | 95 px | medir en el sprite |
| Recorrido útil (franja − caja) | ≈ 1 200 px | ≈ 1 170 px | ≈ 265 px | se recalcula al redimensionar |

- La franja es la **fila 2 del grid de Inicio** (`grid-template-rows: 1fr var(--franja-canela)`): por construcción Canela no tapa texto ni botones. `overflow: hidden` en la franja.
- Línea de suelo a 10 px del borde inferior. `transform-origin: 50% 100%`.
- **Igual en móvil** (decisión 0-B): mismo comportamiento, recorrido corto.
- Límites del recorrido: `xMin = 8 px` y `xMax = anchoFranja − anchoCaja − 8 px`, medidos sobre la **nariz** (borde delantero de la caja en el sentido de la carrera). La nariz nunca pasa del límite.
- Canela pasa **por detrás** del botón de pausa (`--z-control` > `--z-canela`).

### 2.3 Secuencia (máquina de estados)

```
           una sola vez por entrada en Inicio
 ┌─────────┐ 0,6 s ┌──────────┐ ~1,3 s ┌──────────────┐  nariz en xMin  ┌──────────────┐
 │ SENTADA ├──────►│ ARRANQUE ├───────►│ CARRERA ←    ├────────────────►│ GIRO (izq)   │
 └─────────┘       └──────────┘        └──────▲───────┘                 └──────┬───────┘
                                              │                                │ ~0,7 s
                                       ┌──────┴───────┐  nariz en xMax  ┌──────▼───────┐
                                       │ GIRO (der,   │◄────────────────┤ CARRERA →    │
                                       │ espejado)    │                 └──────────────┘
                                       └──────────────┘
```

| Estado | Sprite | Desplazamiento (`translateX` del envoltorio) | Sombra |
|---|---|---|---|
| **SENTADA** | Cuadro 0 de `canela-arranque`, quieto **0,6 s** | Ninguno. Posición inicial: lado derecho de la franja, a la izquierda del botón de pausa (`right: calc(var(--spacing-vista) + 44px + 16px)`) | `scaleX(0.6)`, opacidad 0,32 |
| **ARRANQUE** | `canela-arranque` completo, una vez (~1,3 s) | Ninguno hasta el último cuarto; en el último 0,25 s acelera de 0 a `v` hacia la izquierda (ease-in) | `scaleX` 0,6 → 1 sincronizado con el cuadro en que se pone de perfil |
| **CARRERA ←** | `canela-carrera-izq` en bucle | Velocidad constante `v` hacia la izquierda | `scaleX(1)`, opacidad 0,3, quieta (no rebota con cada zancada: sería ruido) |
| **GIRO (izq)** | `canela-giro`, una vez | **Frena**: de `v` a 0 en los primeros `tFreno` ≈ 0,25 s (ease-out); quieta durante el giro; sale de 0 a `v` hacia la derecha en los últimos 0,2 s | `scaleX` 1 → **0,55** (cuadro en que está de frente) → 1 |
| **CARRERA →** | `canela-carrera-der` en bucle | `v` constante hacia la derecha | `scaleX(1)` |
| **GIRO (der)** | `canela-giro` espejado (opción A) | Igual que el giro izquierdo, en espejo | Igual |

**Cuándo empieza el giro:** cuando a la nariz le queda la distancia de frenada, `dFreno = v · tFreno / 2`, hasta el límite. Así se detiene **exactamente** en `xMin`/`xMax`: frena dentro de la pantalla, nunca se sale.

**Velocidad sincronizada con la zancada (que las patas no patinen):** `v = longitudZancada / duraciónCiclo`. La longitud de zancada se mide en el video: desplazamiento horizontal de una pata **apoyada** durante el contacto (px de video por segundo), multiplicado por `alto en pantalla / alto de Canela en el video`. Orientativo hasta medirlo: **≈ 2 × alto por segundo** → ~220 px/s a 1440×900 (≈ 5,5 s por tramo) y ~140 px/s a 360×640 (≈ 1,9 s por tramo). Se recalcula cuando cambia `--canela-alto` (redimensionar, girar el móvil).

**Cuadros:** el índice sale del tiempo transcurrido, `floor(t · 12) mod n`, nunca de contar fotogramas de `requestAnimationFrame` (a 120 Hz iría el doble de rápido). El sprite se mueve con `transform` dentro de una caja con `overflow: hidden` (más barato que `background-position`).

**Línea de tiempo a 1440×900 (aprox.)**

| t | Qué se ve |
|---|---|
| 0 | Inicio visible. Canela sentada a la derecha (si los sprites aún no han cargado, `canela-franja` sentada en el mismo sitio) |
| 0,6 s | Se levanta y gira de perfil hacia la izquierda |
| 1,9 s | Ya corre hacia la izquierda |
| ≈ 7,0 s | Frena junto al borde izquierdo y da la vuelta |
| ≈ 7,7 s | Corre hacia la derecha |
| ≈ 13,2 s | Frena junto al borde derecho y da la vuelta (espejado) |
| ≈ 13,9 s | Corre hacia la izquierda… y así sigue |

### 2.4 Sombra propia

- Elipse hermana del sprite dentro del envoltorio que se desplaza: viaja con Canela **pero no sube ni baja**.
- 70 % del ancho de la caja × 10 px, color `tinta` (nunca negro), `filter: blur(4px)` **estático**. Solo se animan `transform: scaleX()` y `opacity`.
- Valores por estado en la tabla 2.3. **Se estrecha en el giro** porque Canela pasa de frente (el cuerpo visto de frente ocupa menos suelo).

### 2.5 Pausa, movimiento reducido y ciclo de vida

| Situación | Comportamiento |
|---|---|
| Se pulsa **Pausar** durante la animación | **Congela el cuadro actual y la posición** (WCAG 2.2.2). Al reanudar sigue desde ahí, en el mismo estado y sentido |
| Se entra en Inicio con la pausa ya activa (preferencia guardada, `html[data-movimiento="pausado"]`) | **Sentada y fija** (`Canela.png`) en la posición de reposo. Al reanudar, empieza la secuencia desde SENTADA |
| `prefers-reduced-motion: reduce` | **Sentada y fija** (`Canela.png`) en reposo, sin sprites (**no se descargan**) y sin botón de pausa (no hay nada que pausar); Canela a `right: var(--spacing-vista)` |
| Carga directa en `#inicio` | Sprites pedidos **después del evento `load`** (el logo sigue siendo el LCP). Mientras tanto `canela-franja` sentada. Cuando llegan, la secuencia arranca desde SENTADA (sin fundido: es la misma pose) |
| Se sale de Inicio | Se cancela el `requestAnimationFrame` (0 rAF fuera de Inicio) |
| Se vuelve a Inicio | Empieza otra vez **desde SENTADA**. No se retoma a media pantalla |
| Redimensionar | Se recalculan límites, `v` y `dFreno`; si Canela queda fuera del nuevo recorrido, se coloca en el límite y sigue en el mismo sentido |
| Pestaña en segundo plano | El navegador para el rAF; al volver se toma un nuevo `t0` (sin saltos) |
| Mientras no estén los sprites procesados | Se mantiene la animación actual (`animate-canela-*` en `tokens.css`). **No se fabrica una carrera con la foto fija** |

- Decorativa: `aria-hidden="true"`, sin `alt`.
- Botón de pausa: 44×44, abajo a la derecha de la franja, círculo `crema` opaco, borde 2 px `bosque`, icono `bosque`; `aria-pressed`, "Pausar animación" / "Reanudar animación".

### 2.6 Estructura

```
.franja-canela (fila 2 del grid, overflow hidden, position relative)
├─ .canela-recorrido   ← translateX(x) (JS, rAF)          aria-hidden
│  ├─ .canela-sombra   ← scaleX / opacity
│  └─ .canela-caja     (overflow hidden, tamaño de un cuadro; scaleX(-1) solo en GIRO der)
│     └─ img.canela-tira  ← translateX(-cuadro · ancho)
└─ button.pausa (z-control)
```

Implementación: un módulo propio (`src/lib/animacion/canela.ts`, de `animacion-interaccion`) con la máquina de estados. GSAP no hace falta en Inicio. Los keyframes `canela-cruce`, `canela-salto` y `canela-sombra` de `tokens.css` quedan como versión anterior hasta que los sprites estén integrados.

---

## 3. Entrada de Inicio (I9)

### 3.1 Carga directa (primera visita o recarga en `#inicio`)

Tras el LCP (primer pintado del logo), cascada **una sola vez**:

| Orden | Elemento | Retraso | Movimiento | Duración | Curva |
|---|---|---|---|---|---|
| — | **Logo** | — | **Ninguno** (es el LCP) | — | — |
| 1 | Acento "Tu mejor aliado para tus animales" | 0 ms | `opacity` 0 → 1, `translateY(12px)` → 0 | 400 ms | `ease-vista` |
| 2 | Subtítulo | 80 ms | igual | 400 ms | `ease-vista` |
| 3 | Botones ("Ver productos", "Cómo llegar") | 160 ms | igual | 400 ms | `ease-vista` |
| 4 | Accesos por categoría | 240 ms | igual | 400 ms | `ease-vista` |
| 5 | Fila de animales | 320 ms | igual | 400 ms | `ease-vista` |
| 6 | Costales de frente (≥ 64rem) | 200 ms | **suben desde el horizonte**: `translateY(24px)` → 0 + `opacity` | 600 ms | `ease-vista` |
| 7 | Costales de atrás | 280 ms | igual | 600 ms | `ease-vista` |

- Fin de la cascada: ≈ 880 ms. Canela ya está sentada desde el primer cuadro (no tiene entrada propia; arranca a los 0,6 s, que coincide con la cascada sin competir: está en otra fila).
- Granos, hojas y marca de agua: presentes desde el primer pintado, sin entrada.
- **Sin JavaScript, o si el script falla, todo está visible:** el estado inicial oculto solo se aplica bajo `html[data-router="activo"]` y con movimiento permitido, y la animación usa `animation-fill-mode: both` (no se deja nada a `opacity: 0` por CSS base).
- Con movimiento reducido o pausa: todo aparece en su sitio, sin cascada.

### 3.2 Llegada a Inicio desde otra vista

**No** se repite la cascada I9: entra con la transición de vista (sección 4) y sus bloques `[data-entra]` (tabla 4.3). Un solo sistema de entrada por cambio de vista.

---

## 4. Transición entre vistas

### 4.1 Decisión: fundido cruzado direccional en dos capas + entrada escalonada

La metáfora sigue siendo **una sola**: desplazamiento horizontal en el orden de las vistas (la barra va de izquierda a derecha; `→` va a la siguiente). Lo que cambia es que ahora **las dos vistas conviven ~160 ms**, así nunca se ve el fondo del `body` entre ellas (T1), y la entrada dura de verdad lo que dice (T2).

`dir` = +1 si la vista destino va después en el orden de la barra, −1 si va antes (también con "atrás" del navegador, según el índice resultante).

| Capa | Propiedades | Duración | Retraso | Curva |
|---|---|---|---|---|
| **Saliente** | `opacity` 1 → 0, `translateX(0)` → `translateX(-dir · 1rem)`; `pointer-events: none`; **por debajo** de la entrante; `inert` desde t = 0 | **160 ms** | 0 | `--ease-salida` |
| **Entrante** | `opacity` 0 → 1, `translateX(dir · 2.5rem)` → 0 | **380 ms** | **60 ms** | `cubic-bezier(0.25, 1, 0.5, 1)` |
| **Bloques `[data-entra]`** de la entrante (2–3) | `opacity` 0 → 1, `translateX(dir · 1.5rem)` → 0 | **300 ms** | 60 ms + 50 ms × índice | `--ease-vista` |

- Durante la transición las dos vistas ocupan la **misma celda** (la saliente con `position: absolute; inset: 0`), para que no se apilen en vertical.
- `src/lib/animacion/vistas.ts` **devuelve una `Promise`** que se resuelve con el `animationend` de la saliente (tope de 200 ms). El router oculta la saliente (`hidden` + `inert`) cuando se resuelve, **nunca antes**.
- El **foco** va al h2 (o al h1 en Inicio) de la entrante **en t = 0**, antes de cualquier animación.
- Los nombres de keyframes y las variables (`--dir`, duraciones) los añade `animacion-interaccion` en `tokens.css`; sugerencia: `vista-sale`, `vista-entra`, `bloque-entra`. Los tokens actuales `--duracion-vista` (400 ms), `--desplazamiento-vista` (3rem) y `animate-vista-*` son de la versión 1.
- Prohibido mezclar: ninguna vista entra con escala, desde abajo o con cortina. View Transitions API queda como mejora futura (misma coreografía).

### 4.2 Línea de tiempo: Inicio → Productos (`dir` = +1)

| t | Qué pasa |
|---|---|
| 0 ms | Clic en "Productos". Productos visible (sin `inert`, opacidad 0). Foco a su h2. Inicio pasa a `inert`, empieza a salir hacia la izquierda. La pastilla de la barra empieza a estirarse hacia la derecha. Se pide la carga diferida del carrusel. Se cancela el rAF de Canela |
| 60 ms | Productos empieza a entrar desde 2,5rem a la derecha; bloque 1 (cabecera + pestañas) desde 1,5rem más |
| 110 ms | Bloque 2 (anillo: ocupa su turno pero **no anima**, ver 4.3) |
| 150 ms | El texto "Productos" de la barra pasa a blanco (la pastilla ya está debajo) |
| 160 ms | Inicio en opacidad 0 → `animationend` → la promesa se resuelve → Inicio `hidden` |
| 160 ms | Bloque 3 (panel de la lista) |
| 240 ms | El borde delantero de la pastilla llega a "Productos" |
| 300 ms | Llega el borde trasero: la pastilla está asentada |
| 440 ms | Productos en su sitio |
| 460 ms | Último bloque asentado. Fin |

En pantalla nunca hay un fotograma con la saliente oculta y la entrante por debajo de 0,5 de opacidad (prueba 13 de `vistas-hinojosa`).

### 4.3 Bloques `[data-entra]` por vista

| Vista | Bloque 1 | Bloque 2 | Bloque 3 | Notas |
|---|---|---|---|---|
| Inicio | Acento + subtítulo + botones | Accesos + fila de animales | Vitrina (≥ 64rem) | El logo viaja con la capa de la vista, sin bloque propio. Canela empieza desde SENTADA |
| Quiénes somos | Cabecera | Tarjeta grande | Misión + Visión + banda de valores | `play()` del video a los 400 ms |
| Productos | Cabecera + pestañas | Anillo del carrusel (**sin animación propia**) | Panel de la lista | Regla M5 intacta (storyboard-carrusel) |
| Por qué | Cabecera | Pilares | Diferenciales + animales | Los iconos de los pilares empiezan a los 400 ms |
| Visítanos | Tarjeta de datos | Pin + aviso del mapa (o el mapa) | — | El pin conserva su rebote al llegar; el pie no anima |

### 4.4 Casos

| Situación | Comportamiento |
|---|---|
| Carga directa por hash | Sin transición: la vista aparece en su sitio (en Inicio, cascada I9) |
| Clics rápidos | La animación en curso se cancela: la saliente anterior se oculta al instante y la nueva transición parte del estado actual. Nunca se encolan; termina en la última vista con una sola visible y el foco en su título |
| `prefers-reduced-motion` o pausa del sitio | **Corte seco**: cambio instantáneo, pastilla incluida, sin bloques escalonados. Las `transition` nuevas se condicionan con `html:not([data-movimiento="pausado"])` |
| Hoja de detalle abierta (móvil) | `←`/`→` no cambian de vista |

### 4.5 Barra durante la transición

Resumen (detalle en `vistas-hinojosa` y guía §6): pastilla con **estiramiento direccional** (borde delantero 240 ms, trasero 300 ms, `ease-vista`), ancho de los rótulos reservado en 800, texto blanco con 150 ms de retraso (o inversión con `clip-path`), `.anima` hasta `transitionend`; en móvil, "pop" del icono activo `scale(0.92)` → 1 en 220 ms con `--ease-rebote`.

---

## 5. Otros movimientos de Inicio

- **Paralaje con el ratón** (≤ 8 px, `--paralaje-max`; lerp 0,08 en rAF): granos `data-profundidad 0.5`, costales `0.6`, hojas del trébol `0.2`; la marca de agua no se mueve. Solo `(hover: hover) and (pointer: fine)`; nada en táctil, con movimiento reducido o con la pausa.
- **Logo:** estático desde el primer cuadro.
- **Botones y chips:** `:active` → `scale(0.96)` en 90 ms. Sin pulsos ni brillos en bucle.

## 6. Checklist (motion-and-storytelling)

- [x] Solo `transform` y `opacity` (sombras con `filter` estático).
- [x] Canela: anticipación (sentada → se levanta), frenada antes del giro, velocidad sincronizada con la zancada, arcos en el giro; nunca sale de la pantalla.
- [x] Ease-out al entrar, ease-in al salir; la saliente dura menos que la entrante.
- [x] Una metáfora (horizontal) en todo el sitio; la dirección coincide con el orden de la barra.
- [x] Un movimiento por región: la franja de Canela es una fila propia; los bloques escalonados no se solapan con la entrada de los iconos ni del video (400 ms).
- [x] Bucle de más de 5 s con pausa que congela; movimiento reducido o pausa global = Canela sentada y fija, sin sprites descargados.
- [x] El foco se mueve antes de cualquier animación; sin JavaScript todo visible.
- [x] El logo no se anima y sigue siendo el LCP; los sprites se piden tras `load`.
