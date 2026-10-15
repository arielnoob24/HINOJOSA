# Plan del proyecto: Sitio web de Comercial Hinojosa

> Página publicitaria estática **manejada por vistas** (sin scroll de página), con carrusel 3D de productos, imágenes animadas y video.
> Negocio: **Comercial Hinojosa** · Lema: **"Nutrición que da vida"** · Giro: venta de balanceados, alimentos y productos para animales.

**Orden de precedencia:** sección 0-B (decisiones de la auditoría, 2026-10-13) → sección 0 (activos del cliente, 2026-10-12) → resto del plan. Detalle de cada hallazgo en [`auditoria.md`](auditoria.md); los códigos (I1, N1, P1, C1…) remiten a ese archivo.

---

## 0. Activos recibidos del cliente (2026-10-12)

Carpeta `Nuevos Req/` (originales, **no se modifican**; la versión web se genera en `hinojosa-web/public/` con `hinojosa-web/scripts-activos/nuevos_req.py`):

| Archivo | Qué es | Uso decidido |
|---|---|---|
| `Mascota/Canela.png` | Render estilo 3D de Canela sentada, 2752×1536, PNG recortado con alfa | Pose inicial de Canela en Inicio, primer cuadro de los clips de Flow (`flow/canela-inicio-azul.png`) y fallback de `prefers-reduced-motion` |
| `Mascota/Canela Jugando.mp4` | Video de Canela jugando (3,3 MB), fondo gris de estudio | Recuadro de video en la tarjeta grande de "Quiénes somos" (sin botón de pausa desde 2026-10-15, silenciado, con `poster`). Existe además una versión con alfa (`canela-jugando-alfa.webm`) |
| `CatalogoF/<categoría>/*.png` | 33 renders de producto, casi todos recortados con alfa (excepto `bebedero.png`, que trae un damero pintado — sustituido por `bebedero_quitado_disque.jpg`, ver P3 —, y `melaza.jpg`, `sal en grano.jpg`, `diferentes tipos de semillas.jpg`, con fondo) | Carrusel de Productos, miniaturas de la lista y vitrina de Inicio |

**Consecuencias sobre el plan:**
1. **4 categorías**, tal como las clasificó el cliente: **Alimento Animales de Granja** (`granja`) · **Alimento Mascotas** (`mascotas`) · **Comederos y Bebederos** (`comederos`) · **Granos y Semillas** (`granos`).
2. **El carrusel es de imágenes en CSS 3D** (`perspective` + `rotateY`/`translateZ`) animado con GSAP. **No hay Three.js ni modelos `.glb`.**
3. No se modelan ni se producen costales genéricos: cada categoría ya tiene imágenes.
4. Rutas web: `public/img/productos/<cat>/<slug>{,-400}.{webp,avif}` y `-thumb{,-80}.webp`; `slug` en minúsculas, sin tildes, espacios → guiones (`balaceado` → `balanceado`). Canela: `public/img/canela/`.

---

## 0-B. Decisiones tras la auditoría de UI/UX/movimiento (2026-10-13)

La auditoría completa está en [`auditoria.md`](auditoria.md). Estas son las decisiones tomadas con el usuario; mandan sobre el resto del plan.

| Tema | Decisión | Descartado |
|---|---|---|
| **Inicio** | **Vitrina lateral:** se mantiene el bloque centrado (logo + acento + subtítulo) y Canela en la franja inferior; se añaden 2 costales reales a cada lado, botón secundario "Cómo llegar", accesos por categoría y fila de animales (ver vista 1) | Hero partido con Canela grande |
| **Canela en Inicio** (2026-10-13) | **Animación real de carrera**, no la foto deslizándose: aparece sentada como en `Canela.png`, se levanta y corre hacia la izquierda hasta el borde, **frena y da la vuelta**, corre hasta el borde derecho, frena y da la vuelta, en bucle. Solo se sienta al principio. Mismo tamaño que hoy (franja inferior, 12–18 % de la altura) e **igual en móvil**. Los clips se generan en **Google Flow** (guía y prompts en [`flow/PROMPTS.md`](flow/PROMPTS.md)) | La foto fija moviéndose a saltitos (estado actual); sentarse a mitad del cruce (I8 original); salir y volver a entrar por el borde; volteo instantáneo |
| **Lema duplicado** | La línea manuscrita bajo el logo pasa a **"Tu mejor aliado para tus animales"** (el lema ya está dentro del logo). Regenerar el subconjunto de Caveat Brush | Mantener el lema dos veces |
| **Transición entre vistas** | **Fundido cruzado direccional en dos capas + entrada escalonada** de 2–3 bloques por vista (sección 3) | Fundido + escala sin dirección; cortina de color; View Transitions API (queda como mejora futura) |
| **Navegación** | **Solo la barra** (más `←`/`→`, `AvPág`/`RePág`). **No** se añaden enlaces "Siguiente →" ni cambio de vista con rueda o deslizamiento | Enlaces "Siguiente"; rueda/deslizar |
| **Títulos de vista** | **Sistema único: antetítulo + h2.** Textos propuestos en la sección 3, **pendientes de aprobación** | Títulos heterogéneos actuales |
| **Quiénes somos** | "Visión" se sustituirá por **"Nuestra historia"** cuando la dueña dé el dato (año de apertura, familia). Hasta entonces sigue Visión | — |
| **Productos en móvil** | **Hoja de detalle** al tocar un producto de la lista (imagen, precio, "Preguntar") y buscador por encima del carrusel | Desplazar la pantalla hasta el carrusel |
| **Botones de pausa** (2026-10-15) | **Se quitan sin reemplazo** el botón de pausa de Canela corriendo (Inicio) y el del video de Canela jugando (Quiénes somos). Ambos siguen en bucle. Se mantiene `prefers-reduced-motion` (Canela sentada fija, video sin reproducir). ⚠️ **Incumple WCAG 2.2.2 (nivel A)**: decisión del usuario, registrada como riesgo 11 | Un solo control global "Pausar animaciones"; que el movimiento se detenga solo antes de 5 s |
| **Iconos en los botones de Inicio** (2026-10-15) | "Cómo llegar" lleva un **icono de ubicación/GPS** (`pin` de `Icono.astro`) y "Ver productos" el **icono de costal** (`costal`), ambos a la izquierda del texto y decorativos (`aria-hidden`). Los **accesos por categoría no llevan icono** (la fila de animales de debajo ya los tiene) | Iconos en los accesos por categoría |
| **Orden de la barra** (2026-10-15) | **Inicio · Productos · Quiénes somos · Por qué elegirnos · Visítanos** (Productos pasa antes que Quiénes somos). Cambia también el orden de las secciones en el HTML, la lista `VISTAS` del router, las flechas ←/→, la dirección de las transiciones y la barra móvil | Orden anterior (Quiénes somos antes que Productos) |

**Cambios de criterio que se derivan** (aplican aunque contradigan secciones antiguas):
- **Contacto:** sigue sin botón flotante de WhatsApp, pero ya no vive *solo* en Visítanos. Se permiten dos accesos contextuales: el botón **"Cómo llegar"** de Inicio (ancla a `#visitanos`) y el botón **"Preguntar por este producto"** de Productos (abre `wa.me` con el nombre del producto cuando WhatsApp esté confirmado; mientras tanto, lleva a `#visitanos`).
- **Marcador `PENDIENTE_CONFIRMAR`:** vive **solo en los datos** (`negocio.json`) y en QA. **Nunca se muestra en pantalla.** En pantalla se usan `textos.comunes.datoPendiente` y `textos.visitanos.contactoPendiente`, y los canales pendientes se agrupan en una sola línea sin forma de botón.
- **Movimiento:** toda transición nueva respeta `prefers-reduced-motion` **y** la pausa del sitio (`html[data-movimiento="pausado"]`; desde el 2026-10-15 ya no hay botón visible que la active, pero el mecanismo se conserva), que hoy anula `animation` pero no `transition`.
- **Medición obligatoria** tras implementar: Lighthouse móvil en Inicio (hoy 99) y `#productos` (≥ 93), y las 41 comprobaciones del router.

---

## 1. Resumen del negocio (extraído del material recibido)

| Dato | Valor |
|---|---|
| Nombre | Comercial Hinojosa |
| Eslogan principal | Nutrición que da vida |
| Eslóganes secundarios | "Calidad que alimenta, amor que se siente" · "Comercial Hinojosa siempre a tu lado" · "Tu mejor aliado para tus animales" · "Somos parte de tu familia" · "Calidad, Confianza, Compromiso" |
| Subtítulo | Venta de balanceados · Alimentos y productos para animales |
| Mascota | **Canela**, perrita alegre y cariñosa con gorra verde y pañuelo con la "H" |
| Ubicación (en los afiches) | Calle Av. del Chofer y Rubén Lerson *(la ortografía varía entre afiches; **confirmar con la dueña**, junto con ciudad)* |
| Red social | Facebook (enlace por confirmar) |
| Animales atendidos | Aves, cerdos, conejos, cuyes, vacas, perros, gatos, tilapias |
| Moneda de precios | USD ($) |

> **Pendiente de confirmar:** ciudad, teléfono/WhatsApp, horario, enlace de Facebook, enlace de Google Maps, coordenadas y referencias para llegar. Nuevo tras la auditoría: **año de apertura / una línea de historia** y **foto del local, la fachada o el equipo**. No se inventan; se dejan como variables editables en `negocio.json`.

### Misión
Brindar alimentos y productos de calidad para animales, ofreciendo una atención amable, responsable y cercana que satisfaga las necesidades de nuestros clientes.

### Visión
Ser una empresa líder y reconocida en la comercialización de alimentos y productos para animales, destacándonos por nuestra calidad, buen servicio y compromiso con nuestros clientes.

### Valores
Buen trato · Calidez · Amabilidad · Responsabilidad · Honestidad · Compromiso con el cliente

### Esencia (pilares)
Naturales · Confiables · De calidad · Sostenibles

### Diferenciales (barra inferior de los afiches)
Ubicación estratégica · Productos para aves, cerdos, mascotas y tilapias · Atención cercana y personalizada · Calidad que se siente

---

## 2. Identidad visual

### Logo
- Usar el **logo nuevo** (H blanca sobre trébol/hojas verdes con maíz, "COMERCIAL" en dorado, "HINOJOSA" en verde degradado, "NUTRICIÓN QUE DA VIDA" incluido). El "ANTES" del primer afiche queda **descartado**.
- Variantes necesarias: completo vertical, solo isotipo "H", versión blanca para fondos oscuros, favicon. Falta el logo vectorial.

### Paleta
Tabla completa con contrastes verificados en la skill `marca-hinojosa` y en `hinojosa-web/docs/guia-estilo.md`.

| Rol | Color | Hex aprox. |
|---|---|---|
| Verde profundo (fondos, títulos) | verde bosque | `#1B4D2B` |
| Verde marca (botones, hojas) | verde vivo | `#2E8B2E` |
| Verde claro (acentos) | verde hoja | `#7BBF3A` |
| Dorado / maíz (CTA, detalles) | amarillo oro | `#F2B823` |
| Crema (fondos claros) | crema cálido | `#F6F1E4` |
| Canela (mascota, calidez) | marrón dorado | `#C98A3A` |
| Texto oscuro | verde casi negro | `#14301D` |

> **Regla de contraste (WCAG 1.4.3):** el dorado no es color de texto sobre claro; blanco sobre verde vivo no cumple. Ver la skill.

### Tipografía (selección vigente)
- **Nunito 400 y 800** (cuerpo y títulos de marca) · **Cormorant Garamond 700** (nombres de producto) · **Caveat Brush 400** (acento, 1–2 frases por vista, subconjunto recortado).
- Máximo 3 familias y 4 pesos. Paquetes `@fontsource`, `font-display: swap`.

### Reglas de sistema añadidas por la auditoría
- **Títulos de vista:** antetítulo (Nunito 800, mayúsculas, `text-etiqueta`, `canela-oscuro`) + h2 con una frase corta (G3).
- **Icono en círculo con aro maíz:** reservado a una sola familia (los pilares de "Por qué elegirnos"). Valores y animales van sin círculo, para no repetir el mismo patrón 18 veces (G2, N5).
- **Canela** aparece en Inicio y Quiénes somos; no en otras vistas.
- **Tamaño mínimo de texto:** 13 px, también en la barra ("COMERCIAL" sube de 11 a 12 px con más interletrado, G4).

### Reparto del color (revisión de paleta, 2026-10-14)

**Diagnóstico de dirección de arte:** la paleta del logo es buena y **no se cambia**; el problema es cómo se reparte. Fuera de Inicio el sitio usa en la práctica dos colores (crema + verde bosque) y tarjetas blancas con sombra sobre crema (blanco y crema casi no se distinguen, ~1,1:1), que es el gesto típico de plantilla. El oro casi desaparece y el canela no aparece.

| Vista | Verde | Blanco/crema | Oro | Canela |
|---|---|---|---|---|
| Inicio | ~85 % | ~8 % | ~5 % | ~1 % |
| Quiénes somos | ~22 % | ~72 % | ~3 % | ~3 % |
| Productos | ~6 % | ~70 % | ~1 % | 0 % (los costales aportan el color) |
| Por qué | ~13 % | ~85 % | ~1 % | 0 % |
| Visítanos | ~4 % | ~90 % | 0 % | 0 % |

**Decidido (cabe en la guía actual, sin colores nuevos):**
1. **Repartir mejor los colores existentes:** la mitad de las superficies blancas pasan a `crema-oscuro` (#EDE4CC) o `hoja-claro` (#EAF4DC), y **cada vista clara lleva al menos una banda `bosque`** (ya existen Visión, la banda de diferenciales y el pie). Peso añadido: 0 kB.
2. **Visítanos sin mapa:** crema con textura de hojas y granos al 8 % y marca de agua del trébol (ya estaba en la vista 5).

**Aprobado por el usuario el 2026-10-14** (tocan la identidad de la marca; quedan incorporados a `marca-hinojosa`):
3. **Proporción objetivo por vista clara 55 / 30 / 15** (crema / verde / oro + canela), en lugar de la regla 60/30/10 de la marca.
4. **Más oro como detalle, nunca como texto sobre claro:** trazo de pincel maíz bajo los h2 en lugar del subrayado verde (hoy parece un enlace), puntos separadores entre valores, aro de los pilares, pin y marca de agua de Visítanos.
5. **Canela oscuro `#8A5A1F` como fondo de banda** (p. ej. detrás de los valores o de la fila de animales): admite texto blanco (5.88) y crema (5.22). No es un color nuevo.
6. **Tono de apoyo nuevo "kraft / costal" `#E3CFA6`** para bandas, sellos y la tarima del carrusel. Une los costales reales con la marca. Contrastes (fórmula WCAG): tinta `#14301D` 9.35 ✅, bosque `#1B4D2B` 6.41 ✅, tinta suave `#3D5A45` 5.00 ✅, canela oscuro 3.85 (solo texto grande), oro solo decorativo. Token: `--color-kraft`.

**Lo que no se toca:** los 7 hex base, el verde bosque como botón primario, el CTA oro con texto oscuro, Inicio en verde oscuro (es donde mejor luce el logo y sostiene el LCP), el crema detrás de los productos (los costales son muy saturados y sobre verde oscuro chocarían), y nunca blanco sobre verde vivo `#2E8B2E`.

> **¿Hay un límite de colores?** No hay una regla fija; la pauta habitual es **60-30-10** (fondo neutro / color de marca / acento) con **3–5 colores con papel definido** más neutros. Los tonos de un mismo color no cuentan como colores nuevos. La marca tiene unas 4 familias (verdes, crema/blanco, oro, canela) más el texto: está dentro de lo normal. El tono kraft sería un neutro más, no un acento nuevo.

### Tono
Cálido, familiar, confiable, cercano. Textos **cortos**, en español, orientados a la acción. Como cada vista ocupa una sola pantalla, el texto es un recurso escaso.

---

## 3. Arquitectura: navegación por vistas (sin scroll)

### Reglas
1. **Una sola página** (`index.astro`) con **5 vistas**. Cada vista ocupa `100dvh` y solo una está visible a la vez.
2. **No hay scroll de página.** Las vistas inactivas se ocultan con `display: none` + `inert`.
3. **Se cambia de vista desde la barra superior**, siempre visible, y con `←`/`→`, `AvPág`/`RePág`. **Decisión 0-B: no se añade rueda, deslizamiento ni enlaces "Siguiente".**
4. **Scroll interno permitido solo** en la lista del catálogo y, en móvil, en la vista que no quepa.
5. **Cada vista tiene su hash**, en este orden (2026-10-15): `#inicio`, `#productos`, `#nosotros`, `#por-que`, `#visitanos`.
6. **Transición entre vistas:** ver "Transición" más abajo. Una sola metáfora en todo el sitio.

### Sistema de títulos (propuesta, pendiente de aprobación)
| Vista | Antetítulo | h2 (frase) |
|---|---|---|
| Inicio | — (el `h1` es el logo con su texto alternativo) | — |
| Productos | PRODUCTOS | "Lo que tenemos para tus animales" |
| Quiénes somos | QUIÉNES SOMOS | "Calidad, confianza y compromiso" |
| Por qué elegirnos | POR QUÉ ELEGIRNOS | "Siempre a tu lado" |
| Visítanos | VISÍTANOS | Comercial Hinojosa (ya lo cumple) |

Las frases salen de los eslóganes reales del negocio; "Somos parte de tu familia" sigue siendo la frase de la tarjeta grande de Quiénes somos para no repetirla.

### Barra superior
- **Orden (2026-10-15):** Inicio · Productos · Quiénes somos · Por qué elegirnos · Visítanos.
- Vista activa con `aria-current="page"` **y** pastilla de fondo que se desliza (no solo color, WCAG 1.4.1).
- En móvil, barra inferior de 5 ítems con icono + palabra; objetivos táctiles de 44×44 px.
- **Animación (decidida, B1–B4):**
  - **Ancho reservado en negrita:** cada rótulo reserva el ancho de su versión en 800 (pseudo-elemento invisible con `content: attr(data-texto)`) para que los vecinos no salten al activarse.
  - `.anima` no se retira hasta el `transitionend` de la pastilla.
  - **Estiramiento direccional** de la pastilla: el borde que va delante tarda 240 ms y el de atrás 300 ms.
  - **Texto bajo la pastilla:** versión básica, el color cambia con 150 ms de retraso; versión pulida, inversión exacta con `clip-path` (copia `aria-hidden` del menú).
  - Hover en escritorio: fondo `hoja-claro` en 150 ms. Pulsación: `scale(0.96)` en 90 ms. Móvil: fondo `hoja-claro` al tocar y "pop" del icono activo (`scale(0.92)` → 1, 220 ms, `--ease-rebote`).
  - Con movimiento reducido o pausa: la pastilla salta, sin pop.
- En móvil, la barra superior baja a 44 px y el isotipo a 32 px (G5). La etiqueta corta "Por qué" lleva nombre accesible completo.

### Transición entre vistas (decidida, T1–T2)
Hoy la vista saliente se oculta antes del primer pintado y se ve un destello del fondo crema; además la curva llega al 87 % en 156 ms y se percibe como un corte.

- **Fundido cruzado direccional en dos capas:**
  - Saliente: opacidad 1 → 0 y `translateX(-dir · 1rem)`, **160 ms**, `--ease-salida`, `pointer-events: none`, por debajo de la entrante.
  - Entrante: `translateX(dir · 2.5rem)` → 0 y opacidad 0 → 1, **380 ms** con **60 ms** de retraso, `cubic-bezier(0.25, 1, 0.5, 1)`. Total ≈ 440 ms.
  - `src/lib/animacion/vistas.ts` devuelve una `Promise` que se resuelve con el `animationend` de la saliente (tope 200 ms); el router ya la espera y ya gestiona los clics rápidos.
- **Entrada escalonada (A+):** dentro de la vista entrante, 2–3 bloques marcados con `[data-entra]` (título, bloque principal, bloque secundario) entran desde `dir · 1.5rem` con opacidad, 300 ms, 50 ms entre bloques. En Productos el anillo cuenta como un bloque sin animación propia. Los iconos de la vista 4 siguen empezando a los 400 ms.
- El **foco** va al título **antes** de cualquier animación.
- Con `prefers-reduced-motion` o pausa: cambio instantáneo.
- **Mejora futura:** View Transitions API como implementación de lo mismo, con respaldo.

### Navegación por teclado
- `Tab` recorre la barra; `Enter`/`Espacio` activa.
- `←`/`→` (o `AvPág`/`RePág`) cambian de vista fuera de campos de texto y fuera del carrusel (`[data-captura-flechas]`).
- Al cambiar de vista, el foco va al título (`tabindex="-1"`).
- El foco nunca queda oculto tras la barra ni tras paneles flotantes (WCAG 2.4.11).

### Las 5 vistas
| # | Vista | Qué contiene |
|---|---|---|
| 1 | **Inicio** | Logo, acento "Tu mejor aliado para tus animales", subtítulo, 2 botones, accesos por categoría, fila de animales, vitrina de 4 costales (escritorio) y Canela en la franja inferior |
| 2 | **Productos** | Pestañas de 4 categorías, carrusel 3D de productos + catálogo completo con buscador; hoja de detalle en móvil |
| 3 | **Quiénes somos** | Tarjeta grande con frase de marca y video de Canela, Misión, Visión (→ Nuestra historia), banda de valores |
| 4 | **Por qué elegirnos** | Pilares, diferenciales, animales que atendemos |
| 5 | **Visítanos** | Mapa, dirección, horario y formas de contacto |

---

## 4. Especificación de cada vista

### Vista 1 — Inicio (decisión 0-B: vitrina lateral)

```
┌──────────────────────────────────────────────────────────┐
│ [logo]  Inicio · Productos · Quiénes somos · ...         │
│                                                          │
│  🛍                  [ LOGO ]                   🛍        │
│     🛍      Tu mejor aliado para tus animales      🛍     │
│        Venta de balanceados y productos para tus         │
│                       animales                           │
│        [ 🛍 Ver productos ]  [ 📍 Cómo llegar ]          │
│        Granja · Mascotas · Comederos · Granos            │
│        🐔 Aves · 🐖 Cerdos · 🐕 Mascotas · 🐟 Tilapias     │
│ ───────────────────────── 🐕 <<<<<<<<<<<<<<<<<<<<<<<<<<< │
└──────────────────────────────────────────────────────────┘
```

**Contenido**
- **Logo** centrado (LCP, sin animación).
- **Acento manuscrito:** "Tu mejor aliado para tus animales" (sustituye al lema repetido, I4). Hay que regenerar el subconjunto de Caveat Brush (comando comentado en `global.css`).
- **Subtítulo:** "Venta de balanceados y productos para tus animales".
- **Botones (I3):** "Ver productos" (CTA oro, principal) y **"Cómo llegar"** (secundario, ancla a `#visitanos`), con iconos a la izquierda del texto (decidido 2026-10-15; `aria-hidden`, el nombre accesible sigue siendo el texto): **costal** en "Ver productos" y **pin de ubicación** en "Cómo llegar". Los accesos por categoría van sin icono.
- **Accesos por categoría (I3):** 4 enlaces (Granja · Mascotas · Comederos · Granos) que abren `#productos` con esa pestaña ya elegida.
- **Fila de animales (I5):** iconos de `Icono.astro` + palabra: "Aves · Cerdos · Mascotas · Tilapias". Informativa, no son botones. En móvil ocupa el espacio que hoy queda vacío entre el CTA y la franja.

**Vitrina lateral (I1, I2)** — solo en ≥ 64rem
- 2 costales a cada lado del bloque central, apoyados en el borde superior de la franja: izquierda `granja/pollos` + `mascotas/procan-adultos`; derecha `granos/maiz-en-grano` + `granja/cerdos`.
- Versiones `-400.avif` (~16 kB c/u, ~64 kB en total), `aria-hidden="true"`, `alt=""`, `decoding="async"`, `fetchpriority="low"`.
- Rotación ±4–6°; el de atrás más pequeño y con la capa de tinta al 25 % (misma regla de profundidad que el carrusel); `data-profundidad="0.6"` para entrar en el paralaje.
- **Cada costal ≤ 24dvh de alto** o inyectado tras `load`, para que **el logo siga siendo el LCP**. Repetir Lighthouse móvil.

**Fondo (I6, I7)**
- Degradado verde de marca.
- Aro de la insignia visible: `0 0 0 4px maíz, 0 0 0 10px bosque-noche, 0 0 0 12px horizonte-fuerte`.
- Textura: 3 granos de 24–36 px (cerca, `data-profundidad 0.5`) + 4–5 hojas del trébol del logo (lejos, `hoja` al 20–30 %) + marca de agua del trébol del isotipo a ~70dvh y opacidad 0,05 detrás de la insignia. SVG inline, < 3 kB.
- Paralaje sutil con el mouse; se desactiva con `prefers-reduced-motion` y en táctil.

**Canela: carrera de borde a borde (decisión 2026-10-13, sustituye a I8)**

Hoy Canela es la misma foto sentada deslizándose a saltitos; se ve falso. Pasa a ser una **animación real de carrera**.

*Secuencia*
1. Al entrar en Inicio aparece **sentada como en `Canela.png`**, en el lado derecho de la franja (donde hoy queda en reposo), ~0,6 s.
2. **Arranque:** se levanta, gira de perfil y sale corriendo hacia la **izquierda**.
3. **Carrera** hasta el borde izquierdo de la pantalla.
4. **Frena y da la vuelta** (animación de giro, ~1–1,5 s).
5. Corre hasta el borde **derecho**, frena y da la vuelta (el mismo giro espejado).
6. Vuelve al paso 3, en bucle. **Solo se sienta al principio**; al volver a Inicio se reinicia desde sentada.

*Tamaño y lugar:* franja inferior, 12–18 % de la altura, sin tapar texto ni botones. **Igual en móvil** (recorrido de ~360 px).

*Activos (los genera el usuario en Google Flow, guía en [`flow/PROMPTS.md`](flow/PROMPTS.md))*
| Clip | Contenido | Uso |
|---|---|---|
| `clip1-arranque.mp4` | Sentada → de pie → perfil izquierda → corriendo en el sitio | Una vez por entrada en Inicio |
| `clip2-carrera.mp4` | Ciclo de carrera en el sitio, perfil izquierda, empalme perfecto | Carrera en ambos sentidos (espejado con `scaleX(-1)` hacia la derecha) |
| `clip3-giro.mp4` | Corriendo a la izquierda → frena → gira → corriendo a la derecha | Borde izquierdo; espejado en el borde derecho |

Vale también **un solo video** que contenga todo (sentada → corre a la izquierda → frena y gira → corre a la derecha); da igual cómo termine, porque solo se recortan esas piezas. **El video no tiene que hacer el bucle: lo hace la página**, que encadena las piezas y sabe cuándo Canela llega a un borde porque es ella quien la mueve (compara su posición con `0` y con `ancho de pantalla − ancho de Canela` en cada cuadro). Exportar en **MP4 1080p** (no GIF ni 270p: el borde del pelaje se pierde al quitar el fondo).

Los clips se piden con Canela **corriendo en el sitio, cámara fija y fondo azul plano** (`#0047BB`; no verde, porque la gorra y el collar son verdes). **El desplazamiento por la pantalla lo hace el sitio**, no el video, porque el ancho cambia en cada dispositivo.

*Revisión del video recibido (2026-10-14, `flow/Puppy_running_in_place_1080p_20261013235908.mp4`, 1920×1080, 24 fps, 10 s)*
- ✅ Corre **en el sitio y centrada** todo el video; buena calidad de pelaje y consistencia de gorra y collar a tamaño de franja.
- Tramos: **0–0,8 s** sentada de frente · **1,0–1,9 s** se levanta y gira a la izquierda · **2,0–4,8 s** carrera a la izquierda (de aquí sale el ciclo) · **~4,9–5,4 s** frena y gira (pasa de frente, con un gesto de ojos cerrados) · **5,5–10 s** carrera a la derecha.
- **Trae carrera nativa hacia la derecha:** se usa ese tramo en lugar de espejar el ciclo, porque al espejar el texto "HINOJOSA" de la gorra saldría al revés.
- **Giro en el borde derecho (derecha → izquierda):** no existe en el video. Opciones: espejar el giro (el logo de la gorra se ve invertido ~0,3 s, a tamaño de franja apenas se nota) o reproducir el giro al revés. Se decide al verlo en la página.
- ⚠️ **El fondo no es el azul plano pedido:** es un azul medio (~`#2B73AA`) con viñeta (más claro al centro) y una sombra suave de suelo bajo Canela. Se recorta con el modelo de fondo con degradado que ya tiene `scripts-activos/nuevos_req.py` (`modelo_fondo`), más eliminación del tinte azul en el borde del pelaje y en las patas con desenfoque de movimiento. La sombra del video se descarta y se usa la sombra propia del sitio.
- El video trae audio; se descarta.
- Herramienta: ffmpeg vía el paquete de Python `imageio-ffmpeg` (instalado el 2026-10-14; `python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`).

*Procesado (`activos-3d-video`)*
- Quitar el fondo azul, recortar el tramo útil, cerrar el bucle del ciclo de carrera (0,5–0,8 s).
- Exportar como **sprite sheets WebP** (una tira por clip) a la altura de la franja ×2 para pantallas retina. Se descarta el video con alfa: Safari en iOS no reproduce alfa VP9 y un video no se congela bien en un cuadro concreto al pausar.
- Presupuesto orientativo: ≤ 450 kB los tres sprites juntos. Se cargan **después del evento `load`** (el logo sigue siendo el LCP); mientras tanto se ve `canela-franja` sentada.

*Animación (`animacion-interaccion`)*
- Sprite con `steps()` (o GSAP si ya está cargado) para los cuadros, y `translateX` para el recorrido.
- **La velocidad del `translateX` se sincroniza con la zancada** (px avanzados por ciclo = longitud de la zancada a esa escala), para que las patas no patinen.
- El giro empieza cuando la nariz llega al borde (sin salir de la pantalla) y el recorrido se recalcula al cambiar el tamaño de la ventana.
- Sombra elíptica propia bajo Canela, que la acompaña y se estrecha en el giro.
- Fuera de Inicio la animación se detiene (0 `requestAnimationFrame`).

*Accesibilidad (obligatorio)*
- Decorativa: `aria-hidden="true"`, sin `alt`.
- **Sin botón de pausa (decisión 2026-10-15):** se retira `BotonPausa` de Inicio; Canela corre en bucle sin control visible. ⚠️ Incumple WCAG 2.2.2 (riesgo 11). La pausa global del sitio (`data-movimiento="pausado"`) se conserva en el código, sin botón.
- `prefers-reduced-motion` o pausa global: Canela **sentada y fija** (`Canela.png`), sin carrera.

*Mientras no lleguen los clips:* se mantiene la animación actual. No se fabrica una carrera con la foto fija.

**Entrada (I9):** tras el LCP, acento, subtítulo y botones en cascada (`opacity` + `translateY(12px)`, 80 ms entre cada uno, 400 ms); los costales suben desde el horizonte en 600 ms. El logo no se anima.

---

### Vista 2 — Quiénes somos

**Mosaico de tarjetas, todo visible a la vez, sin clics.**

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│  QUIÉNES SOMOS                                           │
│  Calidad, confianza y compromiso                         │
│  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │ "Somos parte de        │  │ MISIÓN                 │  │
│  │  tu familia"           │  │ 2 líneas               │  │
│  │  [video de Canela]     │  ├────────────────────────┤  │
│  │                        │  │ VISIÓN → NUESTRA HIST. │  │
│  └────────────────────────┘  └────────────────────────┘  │
│  [ 🤝 Buen trato · 💚 Calidez · 🙂 Amabilidad · ... ]     │
└──────────────────────────────────────────────────────────┘
```

- **Tarjeta grande:** frase *"Somos parte de tu familia"* sobre banda opaca + video de Canela (silenciado, en bucle, con `poster`; **sin botón de pausa** desde 2026-10-15, ver riesgo 11).
  - **Encuadre del video (N1, N2):** hoy `object-fit: cover` corta la gorra. Pasar a `object-fit: contain; object-position: 50% 100%` con el fondo de la caja del mismo gris del video. Ideal: `canela-jugando-alfa.webm` sobre `crema-oscuro` con un "suelo" `hoja-claro`, y el póster con alfa en Safari.
  - El `play()` arranca a los 400 ms, cuando termina la transición de vista.
  - Cuando haya foto real del local, puede sustituir o acompañar al video.
- **Misión** y **Visión** recortadas a dos líneas; texto en Nunito 400 a `text-lead`, antetítulo en 800 (N6).
  - **Decisión 0-B:** "Visión" pasa a **"Nuestra historia"** (año de apertura, familia) cuando la dueña dé el dato. La visión completa sigue en `negocio.json` para metadatos y JSON-LD.
- **Valores (N5):** **una sola banda** `crema-oscuro` con los 6 como "icono 28 px + palabra" en línea, separados por un punto maíz de 6 px (no 6 tarjetas iguales). El espacio recuperado (~60 px) va al video.
- **Hover (N7):** tilt de hasta 3° (`--tilt-max`) solo en la tarjeta grande y la banda de valores; Misión/Visión solo se elevan. Nunca revela contenido.
- **Reparto de discurso con la vista 4:** Quiénes somos = identidad (historia, valores); Por qué = pruebas concretas. Evitar repetir "calidad".
- Móvil: el video sube a `aspect-ratio: 16/8` con el espacio liberado (N8).

---

### Vista 3 — Productos

**Pantalla partida: carrusel 3D a la izquierda, catálogo completo a la derecha.** Nada queda oculto.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│  PRODUCTOS                   │ [🔍 buscar producto...]   │
│  Lo que tenemos para tus     │                           │
│  animales                    │ ▸ GRANJA (9)              │
│  [Granja][Mascotas][Com.][Gr]│   Camperito pollos  $28.00│
│     [img]   [img]   [img]    │   Nutri Pollos      $31.00│
│  ◀     (anillo CSS 3D)    ▶  │ ▸ MASCOTAS (16)           │
│          [ tarima ]          │   Pro-Can adultos   $2.25 │
│  Camperito pollos · $28.00   │   ...               ↕     │
│  Granja · 1 de 9             │                           │
│  [ Preguntar por este producto ]                         │
└──────────────────────────────────────────────────────────┘
```

**Carrusel (izquierda, ~55 %)**
- **4 pestañas de categoría** arriba; el anillo muestra los productos con imagen de la categoría activa (máx. 12 en escena), los de atrás más pequeños, oscuros y transparentes.
- Flechas ◀ ▶ (`<button>` con nombre accesible), arrastre y deslizamiento; giro de un paso 400–500 ms con rebote mínimo. **Nunca gira sola.**
- Bajo el anillo, el **rótulo**: nombre del producto al frente (Cormorant), categoría, posición y chip de precio.
- **Nuevo (P2):** botón **"Preguntar por este producto"** junto al rótulo: `wa.me` con el nombre del producto cuando WhatsApp esté confirmado; mientras tanto "¿Dónde comprarlo? → Visítanos".
- Producto al frente más grande en escritorio: `--carrusel-ancho: clamp(11.25rem, 24dvh, 15rem)` en ≥ 64rem (P7).
- **Bebedero (P3): ✅ resuelto el 2026-10-14.** El render original traía un damero pintado que no se podía quitar por código. El usuario le quitó el fondo en Paint (`Nuevos Req/CatalogoF/Comederos y Bebederos/bebedero_quitado_disque.jpg`); como lo guardó en JPG llegó sobre blanco puro, y `nuevos_req.py` lo recorta con `quitar_fondo_blanco` (tabla `REEMPLAZOS`: se publica con el slug `bebedero` y el JPG no crea un producto aparte). Las versiones web ya son transparentes y se quitó `conFondo` del producto en `productos.json`. Comprobado en `#productos` a 1440×900.
- **Productos sin imagen (P5):** tarjeta genérica (costal con el nombre) al frente al elegirlos en la lista; sin "·" colgando cuando no hay posición.
- **Inercia (P9):** un deslizamiento mueve 1–2 posiciones como máximo. En móvil, las flechas fuera del escenario o junto al rótulo.

**Transiciones del carrusel (decididas, C1–C8)** — que nada cambie de golpe:

| # | Elemento | Comportamiento |
|---|---|---|
| C1 | Imágenes al cambiar de categoría | **Caché de ítems por categoría** (se desmontan, no se destruyen; nunca más de 12 en escena). **Precarga** de la categoría nueva durante la salida, esperando `img.decode()` con tope de 250 ms. **Fundido de 200 ms** al aparecer cada imagen. ⚠️ No aplicar al primer montaje: la tarjeta provisional debe quedarse igual bajo el anillo hasta la primera interacción o 1,5 s (si no, Lighthouse móvil baja a 86) |
| C2 | Rótulo (nombre, categoría, posición) | Sale en el sentido del giro (opacidad 0, −12 px, 110 ms, `--ease-salida`), cambia el texto a mitad del giro, entra (+12 px → 0, 200 ms, `--ease-vista`); la meta 40 ms después del nombre. Sustituye al parpadeo 1 → 0,15 → 1 actual |
| C3 | Chip de precio | Ancho animado 200 ms + el mismo fundido. `min-height: 2lh` en el nombre en móvil |
| C4 | Fila resaltada de la lista | `aria-current` inmediato (accesibilidad), pero el **resaltado visual** se aplica al asentarse el anillo: fondo/borde en 200 ms y barra de 4 px que crece con `scaleY` en 250 ms. Si el clic viene de la propia lista, inmediato |
| C5 | Cambio de categoría | El anillo sale girando medio paso en el sentido del orden de las pestañas (160 ms) y el nuevo entra desde el lado opuesto (320 ms, `--ease-giro`). La tarima se funde con los productos y el radio se interpola |
| C6 | Pestañas | Color en 180 ms + pulsación `scale(0.97)`. Opcional: pastilla deslizante cuando están en 4 columnas |
| C7 | Arrastre | El rótulo se atenúa a 0,5 mientras cambia el frente; al soltar, el cambio normal de C2 |
| C8 | Llegada | El frente sube 4 px y su sombra se intensifica al asentarse (180 ms). El chevron de la flecha se mueve 3 px al pulsar |

Con movimiento reducido o pausa: cambios instantáneos.

**Catálogo (derecha, ~45 %)**
- Lista agrupada por categoría, con precio y miniatura de 48 px en ≥ 48rem (P10). **Único panel con scroll interno.**
- **Buscador (P1):** etiqueta visible; filtra mientras se escribe. Busca en nombre, marca, presentación, categoría **y en el nuevo campo `animales`** de cada producto (perro, gato, ave/pollo/gallina, cerdo, vaca, cuy, conejo, tilapia/pez). Compara ignorando tildes, guiones y espacios ("procan" = "pro-can") y tolera singular/plural. Sin resultados: ofrece las 4 categorías como atajos.
- **Recuentos coherentes (P4):** "3 de 7" en el grupo al filtrar; el rótulo aclara cuántos tienen foto o la pestaña cuenta lo mismo que el carrusel; singular/plural correcto ("1 producto").
- **El carrusel sigue a la búsqueda (P8):** el primer resultado pasa al frente.
- Sincronización en los dos sentidos con el carrusel (ver C4).
- Notas fijas: *"Precios referenciales — consulta disponibilidad"* y *"Marcas registradas de sus respectivos propietarios."*

**Móvil (decisión 0-B, P6)**
- El **buscador sube por encima del carrusel** (o un acceso "Buscar en la lista" bajo las pestañas).
- Tocar una fila abre una **hoja de detalle** desde abajo: imagen, nombre, presentación, precio, botón "Preguntar". Es un `<dialog>` modal: foco al título al abrir, `Esc` y botón "Cerrar" para salir, foco de vuelta a la fila al cerrar, fondo inerte. Entra con `translateY(100%)` → 0 en 300 ms; con movimiento reducido, aparece sin desplazamiento.

**Accesibilidad**
- La lista **es** la alternativa textual completa del carrusel.
- Producto activo anunciado con `aria-live="polite"`.
- Sin JavaScript o sin GSAP: rejilla de imágenes y lista intactas.

---

### Vista 4 — Por qué elegirnos

- **4 pilares de esencia** (Naturales · Confiables · De calidad · Sostenibles), con icono en círculo con aro maíz (única familia que conserva ese patrón) y entrada única al entrar en la vista.
  - 🔒 Sus descripciones son relleno ("Productos en los que confías") y se ocultan en móvil (Q7): proponer frases concretas a la dueña y mostrarlas también en móvil, o quitarlas y subir el icono a 72 px.
- **4 diferenciales.**
  - 🔒 Sustituir "Para aves, cerdos, mascotas y tilapias" (repite la fila de animales) por "Granja, mascotas, comederos y granos" (Q3).
  - 🔒 Cambiar 1–2 por pruebas concretas: una **franja de marcas que distribuye** el local (Pro-Can, Nutritivos, Bio Alimentar, Mascan…, ya en el catálogo; con la nota de marcas registradas) y "Ubicación" enlazada a `#visitanos` (Q2).
- **Animales que atendemos:** icono suelto (sin círculo) + palabra. Junto a Aves, Cerdos, Vacas y Cuyes, el costal real de esa especie (`-thumb-80`, ~4 kB) como sello de 40 px (Q1).
  - Cuando exista el campo `animales` del catálogo, cada animal pasa a ser un **enlace** a `#productos` filtrado por ese animal (Q4).
- Título siempre arriba, como en las demás vistas; solo el grupo de bandas se centra con `margin-block: auto` (Q6).
- Sin contadores inventados.

---

### Vista 5 — Visítanos

Mapa a pantalla completa con una tarjeta flotante opaca encima.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│ ░░░░░░░░░░░░░░ MAPA A PANTALLA COMPLETA ░░░░░░░░░░░░░░░ │
│ ░░ ┌──────────────────────────┐ ░░░░░ [pin] ░░░░░░░░░░░ │
│ ░░ │ VISÍTANOS                │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Comercial Hinojosa       │ ░░░░ [foto fachada] ░░░ │
│ ░░ │ Av. del Chofer y R. L.   │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ ● Abierto ahora          │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Referencias: frente a …  │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ [Cómo llegar][WhatsApp][Llamar] ░░░░░░░░░░░░░░░░░░ │
│ ░░ └──────────────────────────┘ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ Comercial Hinojosa siempre a tu lado · © 2026 · Facebook │
└──────────────────────────────────────────────────────────┘
```

- **Mapa** (Leaflet + OpenStreetMap), carga diferida al entrar en la vista, solo con coordenadas confirmadas.
- **Tarjeta flotante opaca:** nombre, dirección, ciudad, estado "Abierto ahora / Cerrado" (con palabra, no solo color), horario, **"Referencias"** para llegar (V4: el CTA se llama "Cómo llegar" y el dato "Referencias") y botones **Cómo llegar · WhatsApp · Llamar**, más Facebook.
- **Mientras falten datos (V1, V2):**
  - Nunca se muestra `PENDIENTE_CONFIRMAR`. Cada dato pendiente muestra `textos.comunes.datoPendiente`.
  - Los 4 canales pendientes se agrupan en **una sola línea** con sus iconos en gris ("Muy pronto publicaremos nuestros datos de contacto."), sin forma de botón.
  - El texto del mapa dice "El mapa aparecerá cuando confirmemos la ubicación" (no "La dirección está en la tarjeta").
  - El fondo sin mapa (V3) pasa de papel cuadriculado a `crema` con la textura de hojas/granos de Inicio al 8 %, pin de 4–5 rem y una tarjeta "Muy pronto, el mapa" con el isotipo. **No** se dibujan calles falsas.
- **Foto o video de la fachada** como recuadro secundario (288×200, marco blanco de 6 px) cuando exista; hasta entonces no se reserva el hueco.
- **Pie** reducido a una línea fina al fondo de esta vista.
- El mapa nunca es el único camino: dirección en texto y enlace a Maps siempre presentes.

---

## 5. Catálogo de productos

> Los precios vienen de los afiches y **pueden estar desactualizados**: se guardan en `src/data/productos.json` y la web muestra "precios referenciales, consulta disponibilidad".

Estado actual: **4 categorías, 37 productos, 16 con precio.** Cada producto lleva `id`, `categoria` (`granja` · `mascotas` · `comederos` · `granos`), `nombre`, `marca`, `presentacion`, `precio`, `precioDesde`, `imagen`, `destacado` y, en los que traen fondo, `conFondo`.

**Campo nuevo (P1):** `animales` — lista de especies a las que sirve cada producto (`perro`, `gato`, `ave`, `cerdo`, `vaca`, `cuy`, `conejo`, `tilapia`), más sinónimos que el buscador normaliza (pollo/gallina → ave, pez → tilapia). Lo rellena `contenido-estrategia` a partir del nombre y la categoría; los casos dudosos se consultan con la dueña.

Contenido de referencia de los afiches (agrupado por categoría del cliente):

### Alimento Animales de Granja
- Balanceados **Camperito** (pollos) crecimiento y engorde — $28.00
- Balanceados **Nutritivos** (inicial, crecimiento y engorde) — desde $31.00
- **Nutritivos cerdos** (inicial, crecimiento, engorde, gestantes, lactantes) — desde $30.00
- **Nutri Vacas** (alta producción de leche) — $22.50
- **Nutri Cuyes** (cuyes y conejos) — $29.00
- Línea Nutritivos Premium: Nutri Pollos, Nutri Vacas, Nutri Cerdos, Nutri Cuyes, Gallos de pelea (sacos de 30–40 kg)
- Balanceado tilapero **Bio Alimentar Premium** (40 kg y 20 kg); proteína por etapa: alevín 45% · preinicial 42% · inicial 38% · crecimiento 32% · desarrollo 28% · engorde 24%

### Alimento Mascotas
- **Pro-Can** (cachorros, adultos, razas pequeñas, medianas y grandes) — desde $1.00 / $1.40 / $2.25
- **Buen Can**, **Cani**, **NutraPro** (desde $8.00), **Dog Chow** (desde $2.25)
- Masticables: Mascan, Pro-Can palitos y rejos, Bio Cani canelones
- **Pro Cat** — desde $2.50; arenas **Pro-Cat** ($5.50), **NutraPro** ($6.00), **Freemiau** ($7.00)

### Comederos y Bebederos
- Bebederos plásticos, comederos galvanizados y plásticos para aves; comederos y bebederos para perro y gato (dobles / con dispensador)

### Granos y Semillas
- Maíz en grano, maíz molido natural y vitaminizado, trigo, arrocillo, afrecho de trigo (Molinos Cordillera, 45 kg), sal en grano, melaza
- Semillas (Agrícola Santo Domingo): tomate, sandía, melón, pimiento, perejil, cebolla colorada, cebollín, pepino

### Avisos legales / derechos
- Las marcas de terceros pertenecen a sus dueños; se mencionan como productos que el local distribuye. Nota: *"Marcas registradas de sus respectivos propietarios."*
- Los renders parecen generados con IA y llevan marcas de terceros: confirmar con la dueña los derechos de uso.

---

## 6. Stack tecnológico

| Capa | Herramienta | Motivo |
|---|---|---|
| Framework | **Astro 7** | HTML estático, JS solo donde hace falta |
| Estilos | **Tailwind CSS 4** (`@theme` en CSS) | Tokens de marca en `src/styles/tokens.css` |
| Router de vistas | JS propio (`src/lib/router.ts`) sobre `hashchange` | Control total del foco y de `inert` |
| Carrusel | **CSS 3D + GSAP 3.15** (import dinámico al entrar en Productos) | Sin Three.js: ligero en gama media |
| Animación | CSS (`@keyframes`, transiciones) + GSAP donde haga falta | Transiciones entre vistas, barra, entradas |
| Perrito | Clips generados en **Google Flow** → sprite sheets WebP (`steps()`) + `translateX` | Carrera real, pausable en cualquier cuadro, funciona en Safari |
| Iconos | SVG inline (`Icono.astro`) con entrada CSS única | Sin Lottie |
| Mapa | **Leaflet 1.9.4 + OpenStreetMap** | Gratis, sin API key, carga diferida |
| Video | **FFmpeg** → WebM (VP9) + MP4 (H.264), con `poster` | Canela jugando; fachada cuando exista |
| Imágenes | Script Python (`scripts-activos/`) → AVIF/WebP con `srcset` | Peso mínimo |
| Contacto | `wa.me`, `tel:` y Facebook | Sin backend ni formulario |
| SEO local | JSON-LD `LocalBusiness` / `PetStore`, Open Graph, sitemap | Aparecer en Google |
| Calidad | **Lighthouse**, **Playwright**, **axe-core** | Rendimiento, pruebas, accesibilidad |
| Hosting | **GitHub Pages** (workflow por corregir) | Gratis, HTTPS |

Retirado respecto al plan original: Three.js, `.glb`/Blender/gltf-transform, Lottie, Lenis y Spline.

### Reglas de rendimiento
- Presupuesto: **vista Inicio < 1,5 MB** (hoy 142 kB; con la vitrina ≈ 210 kB), LCP < 2,5 s en 4G. **El logo debe seguir siendo el LCP de Inicio.**
- **Carga por vista:** solo Inicio se descarga completa de entrada. Carrusel, GSAP, mapa y video se cargan en el evento de cambio de vista.
- Fuera de `#productos` no hay tweens ni `requestAnimationFrame` del carrusel.
- Fallbacks obligatorios: sin JS/GSAP → rejilla de imágenes; `prefers-reduced-motion` y pausa → sin bucles, paralaje ni transiciones; falla el mapa → dirección en texto y enlace.

### Estructura de carpetas
```
hinojosa-web/
├─ public/
│  ├─ img/          # marca/, canela/, productos/<cat>/
│  └─ video/        # canela-jugando*, fachada (pendiente)
├─ scripts-activos/ # generación de derivados desde Nuevos Req/
├─ src/
│  ├─ components/   # Barra, BotonContacto, BotonPausa, Icono, Vista, vistas/
│  ├─ data/         # productos.json, negocio.json, textos.json
│  ├─ layouts/
│  ├─ lib/          # router.ts, catalogo.ts, mapa.ts, horario.ts, seo.ts, animacion/
│  ├─ pages/        # index.astro, [mapa].xml.ts
│  └─ styles/       # tokens.css, global.css
├─ docs/            # guia-estilo, storyboards, activos, seo, qa-informe, handoff
└─ capturas/        # capturas de QA y de la auditoría
```

---

## 7. Activos

| Activo | Estado | Uso |
|---|---|---|
| Canela sentada (`canela.*`, `canela-franja.*`) | ✅ Generado | Pose inicial, reposo y espera mientras cargan los sprites |
| Primer cuadro para Flow (`flow/canela-inicio-azul.png`, 1920×1080, fondo `#0047BB`) | ✅ Generado | Clip 1 de Flow |
| Video de Canela corriendo (un solo video con arranque, carrera, giro y carrera de vuelta, o los 3 clips por separado), MP4 1080p en `flow/` | ✅ Recibido el 2026-10-14 (`flow/Puppy_running_in_place_1080p_20261013235908.mp4`), pendiente de revisión | Fuente de los sprites: de él se recortan las piezas arranque, ciclo de carrera y giro |
| Sprite sheets de Canela (arranque, carrera, giro) | ⏳ Tras recibir los clips | Inicio, franja inferior |
| Canela jugando (video, con y sin alfa) | ✅ Generado | Quiénes somos |
| 33 renders de producto (`-400`, `-thumb`, `-thumb-80`) | ✅ Generado | Carrusel, lista, vitrina de Inicio, sellos de la vista 4 |
| Trébol del isotipo en SVG (hojas y marca de agua) | ⏳ Por crear (< 3 kB) | Fondo de Inicio y de Visítanos sin mapa |
| Tarjeta genérica de costal para productos sin imagen | ⏳ Por crear | Carrusel (P5) |
| Bebedero sin damero | ✅ 2026-10-14: fondo quitado en Paint por el usuario + recorte del blanco en `nuevos_req.py` | Carrusel y lista (P3) |
| Foto / video de la fachada | ❌ Pedir a la dueña | Visítanos |
| Foto del local o del equipo | ❌ Pedir a la dueña | Quiénes somos ("Nuestra historia") |
| Logo vectorial | ❌ Pedir a la dueña | Afinar paleta y nitidez |
| Fotos reales de producto | ❌ Opcional | Lista del catálogo |

---

## 8. Accesibilidad y usabilidad

Skills que gobiernan esta parte: `wcag-accessibility`, `wcag-audit-patterns` y `nielsen-usability-heuristics`.

### WCAG 2.2 AA — puntos críticos de este diseño
| Criterio | Qué exige aquí |
|---|---|
| 1.4.1 Uso del color | Vista activa en la barra, fila activa de la lista y estado "Abierto/Cerrado": nunca solo color |
| 1.4.3 Contraste | 4.5:1 en texto; el dorado solo como fondo con texto oscuro. Tarjeta del mapa opaca |
| 1.4.11 Contraste no textual | Flechas del carrusel, pestañas y bordes de tarjeta a 3:1 |
| **2.2.2 Pausar, detener, ocultar** | ⚠️ **No se cumple por decisión del usuario (2026-10-15):** Canela y el video de Quiénes somos van en bucle sin botón de pausa (riesgo 11). El carrusel no autorrota. Con `prefers-reduced-motion` no hay movimiento |
| 2.3.3 Animación por interacción | Toda transición nueva respeta `prefers-reduced-motion` y la pausa del sitio |
| 2.1.1 Teclado | Carrusel, pestañas, flechas, hoja de detalle, cambio de vista y mapa operables sin mouse |
| 2.4.3 Orden del foco | Vistas inactivas con `inert`; foco al título al cambiar; hoja de detalle devuelve el foco a la fila |
| 2.4.11 Foco no oculto | La barra, la tarjeta del mapa y la hoja de detalle no tapan el elemento enfocado |
| 2.5.8 Tamaño del objetivo | Mínimo 24×24 px; objetivo real 44×44 px en móvil |
| 3.3.2 Etiquetas | Buscador con etiqueta visible |
| 4.1.2 Nombre, rol, valor | Barra con `aria-current`; producto activo anunciado con `aria-live`; hoja de detalle como `<dialog>` con nombre |

### Heurísticas de Nielsen — cómo se aplican
1. **Visibilidad del estado:** pastilla de vista activa; el rótulo del carrusel y la fila resaltada siempre coinciden (C4, C7).
2. **Correspondencia con el mundo real:** el buscador entiende "perro", "pollo", "tilapia" (P1); en pantalla nunca hay marcadores técnicos (V1).
3. **Control y libertad:** hash por vista, botón "atrás", la hoja de detalle se cierra con `Esc`.
4. **Consistencia:** una sola metáfora de transición, un solo sistema de títulos (G3), recuentos coherentes (P4).
5. **Prevención de errores:** precios referenciales; nada de contacto inventado; los botones pendientes no parecen botones.
6. **Reconocer antes que recordar:** las 5 vistas en la barra; lista completa junto al carrusel; accesos por categoría en Inicio.
7. **Flexibilidad:** carrusel para explorar, buscador para quien sabe qué quiere, accesos directos desde Inicio.
8. **Diseño minimalista:** sin lema repetido, valores en una banda, sin diferenciales redundantes.
9. **Errores:** búsqueda sin resultados ofrece las categorías; si el mapa falla, dirección en texto.
10. **Ayuda:** referencias para llegar en lenguaje natural.

---

## 9. Skills

En `.claude/skills/` del proyecto:

| Skill | Para qué |
|---|---|
| **nielsen-usability-heuristics** | Las 10 heurísticas; auditar flujos y distribución de cada vista |
| **wcag-accessibility** | Cumplimiento WCAG 2.2 AA al diseñar y construir |
| **wcag-audit-patterns** | Auditoría con pruebas automáticas y verificación manual |
| **frontend-design** | Calidad visual, evitar estética genérica |
| **motion-and-storytelling** | Ritmo de Canela, del carrusel y de las transiciones entre vistas |
| **performance-and-web-vitals** | LCP, CLS e INP |
| **tailwind-design-system** | Tokens y componentes con Tailwind |
| **webapp-testing** | Pruebas con Playwright en móvil y escritorio |

### Skills propias del proyecto
| Skill | Para qué | Agentes que la usan |
|---|---|---|
| **marca-hinojosa** | Paleta con contrastes calculados, tipografía, tono, reglas de logo, **sistema de títulos, regla de datos pendientes en pantalla** y marcas de terceros | direccion-arte, contenido-estrategia, frontend, qa-rendimiento, seo-negocio-local |
| **vistas-hinojosa** | Contrato del router: reglas no negociables, **especificación de la transición entre vistas y de la barra**, carga diferida, pruebas y errores conocidos | frontend, animacion-interaccion, qa-rendimiento, seo-negocio-local |

> Si cambia el comportamiento de la navegación o de las transiciones, se cambia en `vistas-hinojosa` y no en cada agente.

### Plugins (alcance de usuario)
| Plugin | Qué aporta |
|---|---|
| **context7** | Documentación versionada (Astro 7, Tailwind 4, GSAP 3.15, Leaflet). Requiere autorización en `/mcp` |
| **typescript-lsp** | Diagnósticos de TypeScript |

---

## 10. Agentes

| # | Agente | Responsabilidad | Entregable |
|---|---|---|---|
| 1 | **contenido-estrategia** | Textos por vista, sistema de títulos, campo `animales`, `productos.json`, `negocio.json`, `textos.json` | Copy y datos |
| 2 | **direccion-arte** | Guía de estilo, retícula de cada vista, storyboards de transiciones, barra y carrusel | Guía + tokens + storyboards |
| 3 | **frontend** | Router, 5 vistas, buscador, hoja de detalle, accesibilidad | Sitio navegable |
| 4 | **activos-3d-video** | Derivados de `Nuevos Req/`, imágenes, video, SVG decorativos, optimización | `public/` listo |
| 5 | **animacion-interaccion** | Carrusel CSS 3D, transiciones entre vistas, barra, Canela, fallbacks | Movimiento integrado |
| 6 | **seo-negocio-local** | Metadatos, JSON-LD, Open Graph, `alt` | Checklist SEO aplicada |
| 7 | **qa-rendimiento** | Lighthouse, Playwright, axe, teclado, móvil, regresión de movimiento | `docs/qa-informe.md` |
| 8 | **despliegue** | GitHub Pages, dominio, HTTPS | Sitio publicado |

---

## 11. Fases y entregables

| Fase | Trabajo | Estado |
|---|---|---|
| 0. Datos | Confirmar dirección, ciudad, teléfono/WhatsApp, horario, Facebook, coordenadas, referencias, precios, historia; logo vectorial y fotos | ⏳ Pendiente de la dueña |
| 1. Diseño | Guía de estilo con contrastes, retícula de las 5 vistas, storyboards | ✅ |
| 2. Base | Astro, router con foco e `inert`, 5 vistas, catálogo desde JSON | ✅ |
| 3. Activos | Derivados de `Nuevos Req/` | ✅ (faltan los de la sección 7) |
| 4. Animación | Carrusel sincronizado, transiciones, Canela, fallbacks | ✅ versión 1 |
| 5. SEO y QA | Metadatos, Lighthouse > 90, axe 0, router 41/41 | ✅ |
| **5-B. Mejoras de la auditoría** | Implementar la sección 0-B por bloques (ver orden abajo) | ✅ 2026-10-14: bloques 1–9, 12, 13 y 4-B + cierre de QA (`docs/qa-informe.md`). ⏳ Bloques 10 y 11 bloqueados (textos y WhatsApp de la dueña) |
| 6. Publicación | Corregir workflow, `site`/`base`, GitHub Pages, enlaces verificados | ⏳ Bloqueada por datos |

### Orden de implementación de la fase 5-B
| Bloque | Contenido | Agentes | ¿Necesita a la dueña? |
|---|---|---|---|
| 1 | Datos pendientes con texto humano en Visítanos, texto del mapa, fondo sin mapa (V1–V3) | frontend, contenido-estrategia | No |
| 2 | Transición entre vistas en dos capas + entrada escalonada (T1, T2, A+) | animacion-interaccion | No |
| 3 | Carrusel: caché/precarga/fundido de imágenes, rótulo direccional, chip de precio, fila sincronizada (C1–C4) | animacion-interaccion | No |
| 4 | Inicio: vitrina, acento nuevo, "Cómo llegar", accesos por categoría, fila de animales, aro, fondo, entrada (I1–I7, I9) | direccion-arte, activos-3d-video, frontend, animacion-interaccion | No (ya decidido) |
| 4-B | **Canela corriendo de borde a borde:** procesar los clips de Flow a sprites, secuencia sentada → arranque → carrera → giro, pausa y movimiento reducido | activos-3d-video, animacion-interaccion | No (video recibido; hace falta ffmpeg en el equipo para procesarlo) |
| 5 | Buscador con `animales` y normalización, recuentos, productos sin imagen, carrusel sigue a la búsqueda (P1, P4, P5, P8) | contenido-estrategia, frontend | Casos dudosos de `animales` |
| 6 | Barra: ancho reservado, estiramiento, hover, pulsación, pop móvil, inversión de texto (B1–B4) | animacion-interaccion | No |
| 7 | Quiénes somos: encuadre del video, banda de valores, tipografía de Misión/Visión, hover (N1, N2, N5–N8) | frontend, direccion-arte | No |
| 8 | Productos en móvil: buscador arriba y hoja de detalle; inercia; flechas (P6, P9) | frontend, animacion-interaccion | No |
| 9 | Carrusel: cambio de categoría direccional, pestañas, arrastre, llegada (C5–C8); producto al frente más grande; miniaturas (P7, P10). Bebedero (P3) ya resuelto | animacion-interaccion, frontend | No |
| 10 | Sistema de títulos, diferenciales, marcas, pilares, sellos y enlaces de animales (G3, Q1–Q7) | contenido-estrategia, direccion-arte, frontend | **Sí** (textos) |
| 11 | "Preguntar por este producto", accesos de contacto en la barra (P2, G1) | frontend | **Sí** (WhatsApp) |
| 12 | Pulidos: G4, G5, V4 | frontend | No |
| 13 | **Reparto del color:** superficies `crema-oscuro`/`hoja-claro` en lugar de blanco, banda `bosque` en cada vista clara, proporción 55/30/15, trazo de pincel maíz bajo los h2, bandas canela oscuro y tono kraft `#E3CFA6` (todo aprobado) | direccion-arte, frontend | No |
| 14 | **Ajustes 2026-10-15:** quitar `BotonPausa` de Inicio y de Quiénes somos (y su espacio reservado); iconos en los botones de Inicio (costal en "Ver productos", pin en "Cómo llegar"); nuevo orden Inicio · Productos · Quiénes somos · Por qué · Visítanos (barra, barra móvil, orden de secciones en el HTML, `VISTAS` en `router.ts`, dirección de transiciones) | frontend, animacion-interaccion | ✅ Hecho 2026-10-15 |
| Cierre | Lighthouse móvil (Inicio ≥ 99, Productos ≥ 93), router 41/41, axe 0, capturas comparativas | qa-rendimiento | — |

---

## 12. Riesgos y decisiones abiertas

1. **Datos faltantes:** contacto, ubicación, horario, historia. No se publica hasta confirmarlos.
2. **Navegación solo por barra:** decidido no añadir rueda ni deslizamiento. Riesgo: usuarios que intenten bajar con la rueda. Vigilar en las pruebas con usuarios; si aparece el problema, reconsiderar los enlaces "Siguiente →".
3. **LCP de Inicio con la vitrina:** si los costales superan al logo en área, cambia el LCP. Límite de 24dvh o inyección tras `load`.
4. **Clips de Canela generados con IA:** riesgo de que la gorra, el collar o la cara cambien durante el giro, o de que Canela avance por el cuadro. Se generan varias variantes y se revisa con la lista de `flow/PROMPTS.md`. Si el giro no sale bien, alternativa: frenar → sprite del ciclo espejado con un fundido muy corto. Peso de los sprites: si superan 450 kB, se reduce la altura o los cuadros por segundo (12 fps es suficiente).
5. **Regla M5 del carrusel:** la tarjeta provisional del primer montaje no se toca al añadir fundidos (C1). Lighthouse móvil baja a 86 si se rompe.
6. **SEO con una sola pantalla visible:** las 5 vistas completas en el HTML servido.
7. **Pausa global y transiciones:** hoy `data-movimiento="pausado"` no anula `transition`; todo lo nuevo debe condicionarse.
8. **Navegadores sin probar:** Safari iOS (alfa del video, cancelación de transiciones de la barra) y Firefox; lector de pantalla real.
9. **Precios cambiantes y derechos de imágenes:** JSON editable y confirmación con la dueña.
10. **Mantenimiento:** definir quién actualiza precios y catálogo.
11. **Sin botones de pausa (decisión del usuario, 2026-10-15):** Canela corriendo en Inicio y el video de Quiénes somos se mueven en bucle durante más de 5 s sin control para pausarlos. **Incumple WCAG 2.2.2 (nivel A)**: una auditoría de accesibilidad lo marcará como fallo, y puede molestar a personas con déficit de atención o sensibilidad al movimiento. Mitigación parcial: con `prefers-reduced-motion` no hay movimiento. Alternativas descartadas por ahora: un solo control global "Pausar animaciones", o que el movimiento se detenga solo antes de 5 s.

---

## 13. Checklist

- [ ] Confirmar datos del negocio (sección 1), incluida una línea de historia
- [ ] Obtener logo en vectorial
- [ ] Fotos del local, la fachada y (opcional) el equipo
- [ ] Aprobar los textos del sistema de títulos (sección 3) y los de la vista 4 marcados con 🔒
- [x] Recibir los archivos del perrito y las imágenes de producto (2026-10-12)
- [x] Router de vistas probado con teclado
- [x] Auditoría de UI/UX/movimiento (2026-10-13, `auditoria.md`)
- [x] Decisiones de la auditoría tomadas (sección 0-B)
- [x] Bebedero sin damero (2026-10-14)
- [x] Decidir las propuestas de color (sección 2, "Reparto del color"): aprobadas el 2026-10-14
- [x] Video de Canela corriendo generado en Flow (`flow/Puppy_running_in_place_1080p_20261013235908.mp4`)
- [x] Fase 5-B: bloques 1–9, 12, 13 y 4-B + cierre de QA (2026-10-14; Lighthouse móvil Inicio 99, Productos 96, escritorio 100; router 18/18; axe 0)
- [ ] Fase 5-B: bloque 10 (textos de títulos, pilares, diferenciales) y bloque 11 (WhatsApp)
- [x] Bloque 14: quitar botones de pausa, iconos en "Ver productos" y "Cómo llegar", y nuevo orden de la barra (2026-10-15)
- [ ] Corregir el workflow de despliegue
