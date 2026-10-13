# Plan del proyecto: Sitio web de Comercial Hinojosa

> Página publicitaria estática **manejada por vistas** (sin scroll de página), con animaciones 3D, imágenes animadas y video.
> Negocio: **Comercial Hinojosa** · Lema: **"Nutrición que da vida"** · Giro: venta de balanceados, alimentos y productos para animales.

---

## 0. Activos recibidos del cliente (2026-10-12) — manda sobre el resto del plan

Carpeta `Nuevos Req/` (originales, **no se modifican ni se suben tal cual**; la versión web se genera en `hinojosa-web/public/`):

| Archivo | Qué es | Uso decidido |
|---|---|---|
| `Mascota/Canela.png` | Render estilo 3D de Canela sentada, 2752×1536, **PNG recortado con alfa** | Perrito de la vista Inicio (ver vista 1) y fallback de `prefers-reduced-motion` |
| `Mascota/Canela Jugando.mp4` | Video de Canela jugando (3,3 MB). Falta confirmar si trae fondo | Si el fondo se puede quitar → bucle del perrito. Si no → recuadro de video en la tarjeta grande de "Quiénes somos" (pausable, silenciado, con `poster`) |
| `CatalogoF/<categoría>/*.png` | 33 imágenes de producto estilo render 3D, casi todas **recortadas con alfa** (excepto `bebedero.png`, `melaza.jpg`, `sal en grano.jpg`, `diferentes tipos de semillas.jpg`, que traen fondo) | Carrusel nuevo de Productos + miniaturas de la lista |

**Consecuencias sobre el plan:**
1. **Categorías: pasan de 10 a 4**, tal como las clasificó el cliente: **Alimento Animales de Granja** (9) · **Alimento Mascotas** (12) · **Comederos y Bebederos** (5) · **Granos y Semillas** (7). Esto sustituye la lista de 10 de la vista 3 y de la sección 5.
2. **La ruleta deja de ser de costales `.glb` y pasa a ser un carrusel 3D de imágenes.** No llegaron modelos 3D sino renders en PNG, así que el carrusel se hace con **CSS 3D (`perspective` + `rotateY`/`translateZ`) animado con GSAP**, sin Three.js. Pesa mucho menos y funciona igual en gama media. Three.js queda fuera del bundle salvo que llegue un `.glb` más adelante.
3. **No se modelan ni se producen costales genéricos**: cada categoría ya tiene imágenes.
4. Convención de rutas web: `public/img/productos/<cat>/<slug>.webp` (+ `.avif`) con `cat` ∈ `granja · mascotas · comederos · granos`, y `slug` = nombre de archivo en minúsculas, sin tildes, espacios → guiones (se corrige la errata `balaceado` → `balanceado`). Canela: `public/img/canela/canela.webp`. Tamaños: 800 px de alto para el carrusel y 160 px para miniaturas de la lista.

---

## 1. Resumen del negocio (extraído del material recibido)

| Dato | Valor |
|---|---|
| Nombre | Comercial Hinojosa |
| Eslogan principal | Nutrición que da vida |
| Eslóganes secundarios | "Calidad que alimenta, amor que se siente" · "Comercial Hinojosa siempre a tu lado" · "Tu mejor aliado para tus animales" · "Somos parte de tu familia" · "Calidad, Confianza, Compromiso" |
| Subtítulo | Venta de balanceados · Alimentos y productos para animales |
| Mascota | **Canela**, perrita alegre y cariñosa con gorra verde y pañuelo con la "H" |
| Ubicación (en los afiches) | Calle Av. del Chofer y Rubén Lerson *(la ortografía varía entre afiches; **confirmar con el dueño**, junto con ciudad)* |
| Red social | Facebook (enlace por confirmar) |
| Animales atendidos | Aves, cerdos, conejos, cuyes, vacas, perros, gatos, tilapias |
| Moneda de precios | USD ($) |

> **Pendiente de confirmar:** ciudad, teléfono/WhatsApp, horario, enlace de Facebook y enlace de Google Maps. No se inventan; se dejan como variables editables en `negocio.json`.

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
- Usar el **logo nuevo** (H blanca sobre trébol/hojas verdes con maíz, "COMERCIAL" en dorado, "HINOJOSA" en verde degradado). El "ANTES" del primer afiche queda **descartado**.
- Variantes necesarias (a exportar en SVG/PNG con fondo transparente): completo vertical, solo isotipo "H", versión blanca para fondos oscuros, favicon.

### Paleta (valores aproximados; afinar con el color picker sobre el logo vectorial)
| Rol | Color | Hex aprox. |
|---|---|---|
| Verde profundo (fondos, títulos) | verde bosque | `#1B4D2B` |
| Verde marca (botones, hojas) | verde vivo | `#2E8B2E` |
| Verde claro (acentos) | verde hoja | `#7BBF3A` |
| Dorado / maíz (CTA, detalles) | amarillo oro | `#F2B823` |
| Crema (fondos claros) | crema cálido | `#F6F1E4` |
| Canela (mascota, calidez) | marrón dorado | `#C98A3A` |
| Texto oscuro | verde casi negro | `#14301D` |

> **Regla de contraste (WCAG 1.4.3):** el dorado `#F2B823` **no** sirve como color de texto sobre crema ni como texto blanco encima. Úsalo solo como fondo de botón con texto `#14301D`, o como detalle gráfico. Verificar cada par de colores a 4.5:1 (texto normal) y 3:1 (texto grande y bordes de componentes) antes de cerrar la guía de estilo.

### Tipografía
- **Títulos de marca:** sans redondeada sólida y gruesa (similar al logo): *Baloo 2* o *Nunito ExtraBold*.
- **Títulos elegantes / productos:** serif tipo *Cormorant Garamond* (la usan los afiches de producto).
- **Acento manuscrito:** *Pacifico* o *Caveat Brush* — solo para 1 o 2 frases por vista, nunca para texto corrido.
- **Cuerpo:** *Inter* o *Nunito*.
- Todas desde Google Fonts, con `font-display: swap`. Máximo 3 familias y 4 pesos en total (presupuesto de rendimiento).

### Tono
Cálido, familiar, confiable, cercano. Textos **cortos**, en español, orientados a la acción. Como cada vista ocupa una sola pantalla, el texto es un recurso escaso: frases de una o dos líneas, nunca párrafos largos.

---

## 3. Arquitectura: navegación por vistas (sin scroll)

Esta es la decisión estructural del proyecto y condiciona todo lo demás.

### Reglas
1. **Una sola página** (`index.astro`) con **5 vistas**. Cada vista ocupa exactamente una pantalla (`100dvh`) y solo una está visible a la vez.
2. **No hay scroll de página.** `body { overflow: hidden }`. Las vistas inactivas se ocultan con `display: none` + `inert` para que el teclado y los lectores de pantalla no las alcancen.
3. **Se cambia de vista desde la barra superior**, que está siempre visible y es el único mecanismo de navegación global (recognition over recall: el menú no se esconde en desktop).
4. **Scroll interno permitido solo en paneles concretos** y declarados: la lista del catálogo y, en móvil, cualquier vista cuyo contenido no quepa. Nunca scroll de la página completa.
5. **Cada vista tiene su hash** (`#inicio`, `#nosotros`, `#productos`, `#por-que`, `#visitanos`) para que funcione el botón "atrás" del navegador y se pueda compartir un enlace directo.
6. **Transición entre vistas:** desplazamiento horizontal suave o fundido, 350–450 ms, con `ease-out`. Una sola metáfora de movimiento en todo el sitio.

### Barra superior
```
┌──────────────────────────────────────────────────────────────┐
│ [logo]  Inicio · Quiénes somos · Productos · Por qué         │
│         elegirnos · Visítanos                                │
└──────────────────────────────────────────────────────────────┘
          ▔▔▔▔▔▔  <- indicador de la vista activa
```
- La vista activa se marca con `aria-current="page"` **y** con una señal visual que no dependa solo del color (subrayado o pastilla de fondo) — WCAG 1.4.1.
- En móvil la barra pasa a un menú de 5 ítems a pie de pantalla o a un botón hamburguesa con panel completo; los objetivos táctiles miden al menos 24×24 px (WCAG 2.5.8), con 44×44 px como objetivo real.

### Navegación por teclado
- `Tab` recorre la barra; `Enter`/`Espacio` activa.
- `←` / `→` (o `AvPág` / `RePág`) cambian de vista cuando el foco no está dentro de un campo de texto.
- Al cambiar de vista, el foco se mueve al `<h1>`/`<h2>` de la vista nueva (`tabindex="-1"`), para que el lector de pantalla anuncie dónde está.
- El foco nunca queda oculto detrás de la barra superior ni de paneles flotantes (WCAG 2.4.11).

### Las 5 vistas
| # | Vista | Qué contiene |
|---|---|---|
| 1 | **Inicio** | Logo, lema, botón a Productos, perrito animado en bucle |
| 2 | **Quiénes somos** | Mosaico de tarjetas: frase de marca, misión, visión, valores |
| 3 | **Productos** | Ruleta 3D de categorías + catálogo completo con buscador |
| 4 | **Por qué elegirnos** | Pilares de esencia, diferenciales, animales que atendemos |
| 5 | **Visítanos** | Mapa, dirección, horario y todas las formas de contacto |

> Lo que **se eliminó** del plan anterior: la mascota grande del hero, la sección "Conoce a Canela" (no aportaba a la página), el botón flotante de WhatsApp, la sección separada de "Qué vendemos" (fusionada con el catálogo) y la sección separada de Contacto (fusionada en "Visítanos"). El pie de página deja de ser una sección y se reduce a una línea fina dentro de "Visítanos".

---

## 4. Especificación de cada vista

### Vista 1 — Inicio

```
┌────────────────────────────────────────────────────┐
│ [logo]  Inicio · Quiénes somos · Productos · ...   │
│         ▔▔▔▔▔▔                                     │
│                                                    │
│              [ LOGO COMERCIAL HINOJOSA ]           │
│                                                    │
│               Nutrición que da vida                │
│         Venta de balanceados y productos           │
│                para tus animales                   │
│                                                    │
│                [ Ver productos ]                   │
│                                                    │
│   🐕 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<    │
└────────────────────────────────────────────────────┘
          el perrito cruza de derecha a izquierda, en bucle
```

- **Centro:** logo, lema y un solo botón principal (**Ver productos**). Sin mascota grande.
- **Perrito animado:** cruza la **franja inferior** de la vista en **horizontal, de derecha a izquierda**, y el movimiento se **repite en bucle**. Entra por el borde derecho, sale por el izquierdo, pausa breve fuera de pantalla y vuelve a entrar.
  - Ocupa alrededor del 12–18 % de la altura de la vista; no tapa el botón ni el texto.
  - Es **decorativo**: `aria-hidden="true"` y sin texto alternativo. No lleva información que no esté en otra parte.
  - **Obligatorio por WCAG 2.2.2** (contenido en movimiento de más de 5 s): control visible de **pausa** en la esquina, más respeto automático de `prefers-reduced-motion`, que lo deja como imagen fija del perrito.
- **Fondo:** degradado verde de marca con granos de maíz en paralaje muy sutil al mover el mouse. El paralaje también se desactiva con `prefers-reduced-motion`.
- **Sin** botón flotante de WhatsApp. El contacto vive en la vista "Visítanos".

**Ya entregado (sección 0):** `Canela.png` recortada y `Canela Jugando.mp4`. Decisión por defecto: si el video trae fondo que no se puede quitar limpio, el bucle se hace con **`Canela.png` cruzando a saltitos** (CSS: `translateX` + rebote vertical y leve squash, pasos de 400–600 ms), con el mismo control de pausa. Si el video tiene alfa o fondo liso recortable, se reencoda a WebM VP9 con alfa + fallback y se usa ese.

**El cliente entrega los archivos del perrito.** No se produce desde cero: el trabajo es adaptarlos, optimizarlos e integrarlos. Según lo que llegue:

| Lo que entregue el cliente | Qué se hace |
|---|---|
| **Lottie** (`.json` / `.lottie`) | Lo ideal. Se integra directo; se pausa y reinicia por código |
| **Sprite sheet** o secuencia de PNG | Se arma la animación con `steps()` en CSS y se convierte a WebP |
| **GIF** | Se convierte a sprite sheet o a WebM con alfa: un GIF en bucle no se puede pausar bien ni pesa poco |
| **Video con canal alfa** | Se reencoda a WebM VP9 con alfa, más un fallback, porque el alfa en iOS es problemático |
| **Video sin alfa** | Hay que recortar el fondo, o replantear el perrito sobre una franja de color sólido |
| **Modelo 3D rigged** con ciclo de caminata | Se evalúa el peso: si no cabe en el presupuesto, se renderiza a sprite sheet y se usa en 2D |

En todos los casos hacen falta dos cosas: que el **bucle calce** (el último cuadro debe enlazar con el primero sin salto) y un **cuadro de reposo** para `prefers-reduced-motion`. Si el perrito camina de izquierda a derecha, se espeja; no es un problema.

---

### Vista 2 — Quiénes somos

**Decisión: mosaico de tarjetas, todo visible a la vez, sin clics.** El problema del plan anterior era exceso de texto y mala distribución, no falta de contenido; se resuelve recortando el texto y repartiéndolo en tarjetas de tamaños distintos.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│  QUIÉNES SOMOS                                           │
│  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │ "Somos parte de        │  │ MISIÓN                 │  │
│  │  tu familia"           │  │ 2 líneas               │  │
│  │                        │  ├────────────────────────┤  │
│  │   [foto del local]     │  │ VISIÓN                 │  │
│  │                        │  │ 2 líneas               │  │
│  └────────────────────────┘  └────────────────────────┘  │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                           │
│  │🤝│ │💚│ │🙂│ │✅│ │🤍│ │🎯│   6 valores, 1 palabra   │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘   cada uno               │
└──────────────────────────────────────────────────────────┘
```

- **Tarjeta grande (izquierda):** la frase de marca *"Somos parte de tu familia"* en tipografía grande, sobre una foto real del local. Es el ancla visual de la vista.
- **Dos tarjetas medianas (derecha):** Misión y Visión, **recortadas a dos líneas cada una**. Los textos oficiales completos de la sección 1 se guardan en `negocio.json` y se usan tal cual en los metadatos y el JSON-LD, pero en pantalla van resumidos:
  - *Misión:* "Alimentos y productos de calidad para tus animales, con una atención amable y cercana."
  - *Visión:* "Ser el referente en alimentos para animales por calidad, servicio y compromiso."
- **Fila inferior:** los 6 valores como tarjetas pequeñas de icono + **una sola palabra** (Buen trato · Calidez · Amabilidad · Responsabilidad · Honestidad · Compromiso).
- **Sin interacción obligatoria.** Nada se revela con clic. Las tarjetas pueden tener un `hover` muy leve (elevación o tilt de 2–3°) como adorno, nunca como forma de acceder a contenido oculto.
- Los iconos de valores son decorativos: el texto va en HTML real, no dentro del SVG.
- **Los 4 pilares de esencia se mueven a la vista 4** para no repetir ideas ni volver a cargar de texto esta vista.

---

### Vista 3 — Productos (fusión de "Qué vendemos" + "Catálogo")

> **Actualizado por la sección 0:** 4 categorías en lugar de 10, y carrusel 3D de imágenes de producto (CSS 3D + GSAP) en lugar de costales Three.js. Arriba del carrusel van **4 pestañas de categoría**; el anillo muestra los productos de la categoría activa (máx. 12 en escena), las flechas ◀ ▶ giran de producto en producto y bajo el anillo se rotula el **nombre del producto al frente** y su categoría. La sincronización con la lista se mantiene: elegir producto en la lista gira el anillo hasta él; girar el anillo resalta el producto en la lista. Todo lo demás de esta vista (accesibilidad, sin autorrotación, `aria-live`, fallback a rejilla) sigue igual. Donde abajo dice "costal" o "10 categorías", leer "imagen de producto" y "4 categorías".

**Decisión: pantalla partida permanente — ruleta 3D a la izquierda, catálogo completo a la derecha.** Nada queda oculto: la ruleta aporta el atractivo visual y la lista garantiza que se pueda ver y buscar todo el catálogo.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│  NUESTROS PRODUCTOS          │ [🔍 buscar producto...]   │
│                              │                           │
│        [costal]  [costal]    │ ▸ AVES (7)                │
│    [costal]          [costal]│   Camperito crecim. $28.00│
│  ◀      (giro 3D)         ▶  │   Camperito engorde $28.00│
│    [costal]          [costal]│   Nutritivos        $31.00│
│        [costal]  [costal]    │ ▸ CERDOS (5)              │
│                              │   Nutritivos cerdos $30.00│
│   Categoría: AVES            │ ▸ PERROS (12)             │
│   7 productos                │   Pro-Can adultos   $2.25 │
│                              │ ▸ GATOS (4)   ... ↕        │
└──────────────────────────────────────────────────────────┘
```

- **Ruleta 3D (izquierda, ~55 % del ancho):** 10 costales/bolsas en círculo, vistos de forma que **se perciba el círculo** (perspectiva, no una fila plana): los de atrás más pequeños, más oscuros y con menos opacidad.
  - Categorías: **Aves · Cerdos · Vacas · Cuyes y conejos · Perros · Gatos · Tilapia · Granos · Accesorios · Semillas**.
  - **Flechas ◀ ▶** a los lados para navegar, más arrastre con el mouse y deslizamiento táctil.
  - Giro de un paso: 400–500 ms con `ease-out` y un rebote mínimo al asentar.
  - Solo **10 objetos 3D** en escena: es lo que permite que funcione en un celular de gama media.
- **Catálogo completo (derecha, ~45 %):** la lista entera agrupada por categoría, con precio, y un **buscador** arriba que filtra mientras se escribe. Este panel **sí tiene scroll interno** (es la excepción declarada en la sección 3).
- **Están sincronizados en los dos sentidos:** al girar la ruleta, la lista salta a esa categoría y la resalta; al tocar una categoría o un producto en la lista, la ruleta gira hasta el costal correspondiente.
- Nota fija y visible: *"Precios referenciales — consulta disponibilidad"*, más *"Marcas registradas de sus respectivos propietarios."*
- **Accesibilidad y usabilidad de la ruleta:**
  - La lista de la derecha **es** la alternativa textual completa de la ruleta: ninguna información existe solo en 3D.
  - Las flechas son `<button>` reales con nombre accesible ("Categoría anterior" / "Categoría siguiente"), operables con teclado.
  - La categoría activa se anuncia con una región `aria-live="polite"` discreta.
  - **Nunca gira sola.** Sin autorrotación: así no hay movimiento que haya que pausar y se cumple 2.2.2 sin controles extra.
  - Con `prefers-reduced-motion` el giro se vuelve un cambio instantáneo; si no hay WebGL, la ruleta se sustituye por una rejilla de imágenes de categoría y la lista queda intacta.

---

### Vista 4 — Por qué elegirnos

- **4 pilares de esencia** (Naturales · Confiables · De calidad · Sostenibles) como tarjetas con icono Lottie que se anima una sola vez al entrar en la vista.
- **4 diferenciales** de la barra inferior de los afiches (ubicación estratégica, variedad por especie, atención cercana, calidad que se siente).
- **Animales que atendemos:** fila de iconos (aves, cerdos, conejos, cuyes, vacas, perros, gatos, tilapias) con la palabra visible debajo de cada uno.
- Sin contadores inventados: no se publican cifras de clientes ni de años sin que el dueño las confirme.

---

### Vista 5 — Visítanos (ubicación + contacto fusionados)

**Decisión: una sola vista llamada "Visítanos", con el mapa a pantalla completa y una tarjeta flotante encima.** El nombre cubre las dos ideas (dónde estamos y cómo escribirnos), y así la barra superior se queda en 5 ítems.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│ ░░░░░░░░░░░░░░ MAPA A PANTALLA COMPLETA ░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ [pin animado] ░░░░░░░░░░░░░░░░░░░░ │
│ ░░ ┌──────────────────────────┐ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Comercial Hinojosa       │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Av. del Chofer y R. L.   │ ░░░░ [foto fachada] ░░░ │
│ ░░ │ ● Abierto ahora          │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Lun–Sáb 8:00–19:00       │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ Cómo llegar: frente a …  │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ │ [Maps][WhatsApp][Llamar] │ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░ └──────────────────────────┘ ░░░░░░░░░░░░░░░░░░░░░░░ │
│ Comercial Hinojosa siempre a tu lado · © 2026 · Facebook │
└──────────────────────────────────────────────────────────┘
```

- **Mapa** (Leaflet + OpenStreetMap) ocupando la vista, con el pin de la tienda. Carga diferida: el mapa solo se inicializa al entrar en esta vista.
- **Tarjeta flotante** con fondo sólido o muy opaco (no cristal transparente: sobre un mapa el texto pierde contraste) que contiene:
  - Nombre, dirección y ciudad.
  - **Estado en vivo** "Abierto ahora / Cerrado" calculado desde el horario de `negocio.json`, con el horario completo debajo. El estado no se indica solo con un punto de color: lleva siempre la palabra.
  - **Referencias para llegar** en lenguaje natural ("frente a…", "a dos cuadras de…"), porque la dirección de los afiches es ambigua. Pendiente de confirmar con el dueño.
  - Botones: **Abrir en Maps · WhatsApp · Llamar**, más el enlace a Facebook. Son los únicos puntos de contacto del sitio; cada uno con nombre accesible explícito e indicación de que abre en una pestaña nueva.
- **Foto o video corto de la fachada** como recuadro secundario dentro de la vista, para que reconozcan el local al llegar. Si es video: silenciado, en bucle, con control de pausa y `poster`.
- **Pie de página** reducido a una línea fina al fondo de esta vista ("Comercial Hinojosa siempre a tu lado", copyright, nota de marcas registradas). Deja de ser una sección propia.
- El mapa incrustado nunca es el único camino: la dirección en texto y el enlace a Maps siempre están presentes.

---

## 5. Catálogo de productos (del material recibido)

> Los precios vienen de los afiches. **Pueden estar desactualizados**: se guardan en un solo archivo editable (`src/data/productos.json`) y la web muestra "precios referenciales, consulta disponibilidad".

> **Actualizado por la sección 0:** el catálogo en pantalla se organiza en las 4 categorías del cliente y cada producto con imagen entregada enlaza a ella. Los productos de esta sección que no tienen imagen se mantienen en la lista (sin miniatura o con icono de categoría) y se asignan a la categoría más cercana; Tilapia va en "Alimento Animales de Granja" (llegó `balaceado tilapiero.png` ahí). Gatos y accesorios de mascota van en "Alimento Mascotas" / "Comederos y Bebederos".

Cada producto del JSON lleva: `categoria` (una de las 4 del carrusel), `nombre`, `marca`, `presentacion`, `precio`, `imagen` y `destacado`. La ruleta lee las categorías; la lista lee los productos.

### Aves de corral
- Balanceados **Camperito** (pollos) crecimiento — $28.00
- Balanceados **Camperito** engorde — $28.00
- Balanceados **Nutritivos** (inicial, crecimiento y engorde) — desde $31.00
- Balanceados **Nutritivos cerdos** (inicial, crecimiento, engorde, gestantes, lactantes) — desde $30.00
- Balanceados **Nutri Vacas** (alta producción de leche) — $22.50
- Especies menores: **Nutri Cuyes** (cuyes y conejos, crecimiento y engorde) — $29.00
- Línea Nutritivos Premium: Nutri Pollos, Nutri Vacas (lecheras), Nutri Cerdos, Nutri Cuyes, Gallos de pelea (sacos de 30–40 kg)
- Bebederos plásticos y comederos (galvanizados y plásticos) para aves

### Granos y subproductos (marca propia Hinojosa)
- Maíz en grano
- Maíz molido natural
- Maíz molido vitaminizado
- Trigo natural
- Arrocillo
- Afrecho de trigo (Molinos Cordillera, saco 45 kg)
- Sal en grano
- Melaza

### Perros
- **Pro-Can** cachorros y adultos, razas medianas y grandes — desde $1.00
- **Pro-Can** cachorros y adultos — desde $2.25
- **Pro-Can** cachorros, adultos, razas pequeñas y miniaturas — desde $1.40
- **Buen Can**, **Cani** (premium adultos y senior)
- **NutraPro** cachorro y adulto (2 kg, 4 kg) — desde $8.00
- **Dog Chow** premium — desde $2.25
- Masticables: Mascan (huesos prensados sabor pollo, res/carne, mini huesos en funda), Mascan multisabor, Pro-Can palitos y rejos con colágeno, Bio Cani canelones

### Gatos
- **Pro Cat** alimento — desde $2.50
- Arena sanitaria **Pro-Cat** — $5.50
- Arena premium **NutraPro** — $6.00
- Arena absorbente **Freemiau** — $7.00

### Tilapia
- Balanceado tilapero **Bio Alimentar Premium** (40 kg y 20 kg)
- Tabla de proteína por etapa: alevín 45% · preinicial 42% · inicial 38% · crecimiento 32% · desarrollo 28% · engorde 24%

### Accesorios para mascotas
- Comederos plásticos, bebederos y comederos dobles / con dispensador

### Semillas de alta calidad (Agrícola Santo Domingo)
- Tomate, sandía, melón, pimiento, perejil, cebolla colorada, cebollín, pepino

### Avisos legales / derechos
- Las marcas de terceros (Pro-Can, Camperito, Nutritivos, Dog Chow, NutraPro, Bio Alimentar, Cani, Molinos Cordillera, etc.) pertenecen a sus dueños. Se mencionan como **productos que el local distribuye**. Nota al pie: *"Marcas registradas de sus respectivos propietarios."*
- Preferir **fotos propias del local** de cada producto. Las imágenes de los afiches son composiciones gráficas y sirven de referencia, no como fuente final.
- Varios afiches parecen generados con IA: confirmar con el dueño que puede usarlos y qué elementos desea conservar.

---

## 6. Stack tecnológico

| Capa | Herramienta | Motivo |
|---|---|---|
| Framework | **Astro** | HTML estático, muy rápido, JS solo donde hay 3D (islands) |
| Estilos | **Tailwind CSS** | Responsive y consistente con tokens de marca |
| Router de vistas | JS propio (~100 líneas) sobre `hashchange` | 5 vistas no justifican una librería; control total del foco y de `inert` |
| 3D tiempo real | **Three.js** | Ruleta de categorías del catálogo |
| Animación | **GSAP** | Transiciones entre vistas, giro de la ruleta, entrada de tarjetas |
| Perrito del hero | **Lottie (dotLottie)** o sprite sheet | Bucle horizontal ligero y pausable |
| Iconos animados | **Lottie** | Pilares y animales de la vista 4 |
| Efectos de hover | CSS `transform` (o **vanilla-tilt.js** si hace falta) | Tilt leve en las tarjetas |
| Scroll interno suave | **Lenis** *(opcional)* | Solo para la lista del catálogo; ya no hay scroll de página |
| Modelado | **Blender** → `.glb` | 10 costales de categoría |
| Alternativa rápida | **Spline** | Prototipo de la ruleta |
| Compresión 3D | **gltf-transform** (Draco / Meshopt / KTX2) | Escena completa < 3 MB |
| Video | **FFmpeg** → WebM (VP9/AV1) + MP4 (H.264) | Fachada del local, con `poster` |
| Imágenes | **Sharp / Astro Image** → AVIF/WebP, `srcset` | Peso mínimo |
| Mapa | **Leaflet + OpenStreetMap** | Gratis, sin API key, carga diferida |
| Contacto | Enlace `wa.me`, `tel:` y Facebook | Sin backend ni formulario |
| SEO local | JSON-LD `LocalBusiness` / `PetStore`, Open Graph, sitemap | Aparecer en Google |
| Calidad | **Lighthouse**, **Playwright**, **axe** | Rendimiento, pruebas, accesibilidad |
| Hosting | **GitHub Pages** (ya configurado) | Gratis, HTTPS |

### Reglas de rendimiento
- Presupuesto: **vista Inicio < 1,5 MB** (es lo primero que se descarga), escena 3D completa < 3 MB, LCP < 2,5 s en 4G.
- **Carga por vista:** solo la vista Inicio se descarga completa de entrada. La ruleta 3D, el mapa y los Lottie se cargan cuando el usuario entra en su vista (no con `IntersectionObserver`, que ya no aplica sin scroll, sino en el evento de cambio de vista).
- Three.js **pausa su bucle de render** cuando la vista de Productos no está activa.
- Fallbacks obligatorios: sin WebGL → rejilla de imágenes; `prefers-reduced-motion` → sin bucles ni paralaje; gama baja → imagen fija en lugar de video.

### Estructura de carpetas
```
hinojosa-web/
├─ public/
│  ├─ models/        # costal-aves.glb, costal-perros.glb, ...
│  ├─ video/         # fachada.webm, fachada.mp4, posters
│  ├─ img/           # logo.svg, fotos de producto y del local
│  └─ lottie/        # perrito-corriendo.json, iconos
├─ src/
│  ├─ components/    # Barra, VistaInicio, PerritoLoop, Ruleta3D,
│  │                 # ListaCatalogo, VistaNosotros, VistaVisitanos
│  ├─ data/          # productos.json, negocio.json
│  ├─ layouts/
│  ├─ pages/index.astro
│  ├─ scripts/       # router.ts, ruleta.ts, mapa.ts, a11y.ts
│  └─ styles/        # tokens de color y tipografía
├─ PLAN.md
└─ astro.config.mjs
```

---

## 7. Plan de activos 3D, animación y video

> **Dos activos los entrega el cliente** (pendientes de recibir): la animación del perrito caminando en horizontal y los modelos 3D de los productos. Para esos dos, el trabajo es **adaptar, optimizar e integrar**, no producir. No se modela ni se anima nada que el cliente ya tenga.

| Activo | Cómo se obtiene | Uso |
|---|---|---|
| **Perrito caminando (bucle lateral)** | **Lo entrega el cliente.** Se adapta según el formato (ver vista 1) | Franja inferior de la vista Inicio |
| Perrito en reposo (1 imagen) | Se extrae un cuadro del material entregado | Fallback de `prefers-reduced-motion` |
| **Productos en 3D** | **Los entrega el cliente.** Se convierten a `.glb`, se comprimen y se verifica que la escena quepa en el presupuesto | Ruleta 3D de Productos |
| Imágenes de categoría o producto | Render de cada modelo entregado | Fallback sin WebGL |
| Costales genéricos de categoría | Solo si falta un modelo para alguna de las 10 categorías | Rellenar huecos de la ruleta |
| Granos de maíz en paralaje | Sprites o partículas instanciadas | Fondo de la vista Inicio |
| Pin del mapa animado | Lottie o CSS | Vista Visítanos |
| Lotties de pilares y animales | LottieFiles | Vista Por qué elegirnos |
| Foto / video de la fachada | Grabación en el local con celular | Vista Visítanos |
| Fotos reales de producto | Sesión de fotos en el local | Lista del catálogo |

> **Ya no se necesita** un modelo 3D de Canela rigged con animaciones de saludo, cola y pulgar arriba: al quitar la mascota grande del hero y la sección "Conoce a Canela", el único personaje animado es el perrito del bucle lateral, que se resuelve en 2D. Esto baja mucho el costo y el peso del proyecto. Canela sigue existiendo como parte de la marca (logo, insignia, gráficos), solo que no como modelo 3D interactivo.

---

## 8. Accesibilidad y usabilidad

Dos skills instaladas gobiernan esta parte y deben consultarse antes de implementar cada vista: `wcag-accessibility` (y `wcag-audit-patterns` para auditar) y `nielsen-usability-heuristics`.

### WCAG 2.2 AA — puntos críticos de este diseño
| Criterio | Qué exige aquí |
|---|---|
| 1.4.1 Uso del color | Vista activa en la barra y estado "Abierto/Cerrado": nunca solo color |
| 1.4.3 Contraste | 4.5:1 en texto; el dorado solo como fondo con texto oscuro. Tarjeta del mapa opaca |
| 1.4.11 Contraste no textual | Flechas de la ruleta y bordes de tarjeta a 3:1 |
| **2.2.2 Pausar, detener, ocultar** | El perrito en bucle **necesita** control de pausa; la ruleta no autorrota |
| 2.1.1 Teclado | Ruleta, flechas, cambio de vista y mapa operables sin mouse |
| 2.4.3 Orden del foco | Vistas inactivas con `inert`; foco al título al cambiar de vista |
| 2.4.11 Foco no oculto | La barra fija y la tarjeta del mapa no pueden tapar el elemento enfocado |
| 2.5.8 Tamaño del objetivo | Mínimo 24×24 px; objetivo real 44×44 px en móvil |
| 3.3.2 Etiquetas | Buscador del catálogo con etiqueta visible, no solo `placeholder` |
| 4.1.2 Nombre, rol, valor | Barra con `aria-current`; cambio de categoría anunciado con `aria-live` |

### Heurísticas de Nielsen — cómo se aplican
1. **Visibilidad del estado:** indicador de vista activa siempre presente; la ruleta muestra en texto qué categoría está seleccionada.
2. **Correspondencia con el mundo real:** categorías por animal, no por marca ni por código interno.
3. **Control y libertad:** cada vista tiene hash propio, el botón "atrás" funciona, y ningún panel atrapa al usuario.
4. **Consistencia:** una sola metáfora de transición, una sola forma de navegar, botones siempre con la misma jerarquía.
5. **Prevención de errores:** precios rotulados como referenciales para no generar reclamos; nada de datos de contacto inventados.
6. **Reconocer antes que recordar:** las 5 vistas visibles en la barra; en Productos, la lista completa está a la vista junto a la ruleta.
7. **Flexibilidad:** ruleta para quien explora, buscador para quien ya sabe qué quiere.
8. **Diseño minimalista:** es la heurística que motivó rediseñar "Quiénes somos" — texto recortado y repartido en tarjetas.
9. **Errores:** si el mapa o el 3D no cargan, mensaje claro y alternativa útil, no una pantalla en blanco.
10. **Ayuda:** referencias para llegar en lenguaje natural dentro de "Visítanos".

---

## 9. Skills instaladas

En `.claude/skills/` del proyecto (verificadas el 2026-10-12):

| Skill | Para qué |
|---|---|
| **nielsen-usability-heuristics** | Las 10 heurísticas; auditar flujos y distribución de cada vista |
| **wcag-accessibility** | Cumplimiento WCAG 2.2 AA al diseñar y construir |
| **wcag-audit-patterns** | Auditoría con pruebas automáticas y verificación manual |
| **frontend-design** | Calidad visual, evitar estética genérica |
| **motion-and-storytelling** | Ritmo del bucle del perrito y de las transiciones entre vistas |
| **performance-and-web-vitals** | LCP, CLS e INP con 3D y video en escena |
| **tailwind-design-system** | Tokens y componentes con Tailwind |
| **webapp-testing** | Pruebas con Playwright en móvil y escritorio |

### Skills propias del proyecto
Escritas a medida, no instaladas de un marketplace:

| Skill | Para qué | Agentes que la usan |
|---|---|---|
| **marca-hinojosa** | Paleta con la **tabla de contrastes ya calculada**, tipografía, tono de voz y reglas de logo y de marcas de terceros | direccion-arte, contenido-estrategia, frontend, qa-rendimiento, seo-negocio-local |
| **vistas-hinojosa** | Contrato del router: las 8 reglas no negociables, esqueleto de referencia, carga diferida por vista, 12 pruebas y errores conocidos | frontend, animacion-interaccion, qa-rendimiento, seo-negocio-local |

> `vistas-hinojosa` existe porque tres agentes necesitaban las mismas reglas del router y estaban duplicadas en los tres archivos. Si cambia el comportamiento de la navegación, se cambia **ahí** y no en cada agente.

### Plugins instalados (alcance de usuario)
| Plugin | Qué aporta | Coste de contexto |
|---|---|---|
| **context7** | Documentación versionada desde el repo fuente. Necesario porque Astro 7, Tailwind 4 y Three.js 0.186 tienen APIs que cambiaron respecto a los ejemplos comunes | ~0 (esquemas resueltos en ejecución) |
| **typescript-lsp** | Diagnósticos reales de TypeScript sobre `router.ts`, `ruleta.ts` y `mapa.ts` | ~0 (fuera de proceso) |

Context7 funciona de forma anónima; si se topa con límites de uso, se puede definir `CONTEXT7_API_KEY`.

Pendientes de evaluar:
- Revisar los catálogos de `dembrandt/dembrandt-skills` y `wshobson/agents` por si tienen algo para los dos huecos sin cubrir: **SEO** y **activos/video**.
- **Herramientas locales:** Node.js y Git (instalados), Blender, FFmpeg, gltf-transform CLI.

---

## 10. Agentes

| # | Agente | Responsabilidad | Entregable |
|---|---|---|---|
| 1 | **contenido-estrategia** | Textos cortos por vista, llamadas a la acción, `productos.json`, `negocio.json` | Copy final en español |
| 2 | **direccion-arte** | Paleta verificada en contraste, tipografía, guía de estilo, storyboard del bucle del perrito | Guía de estilo + tokens |
| 3 | **frontend** | Astro + Tailwind, router de vistas, las 5 vistas, accesibilidad | Sitio navegable sin 3D |
| 4 | **activos-3d-video** | 10 costales, Lottie del perrito, video de fachada, optimización | `.glb`, `.json`, `.webm/.mp4` |
| 5 | **animacion-interaccion** | Ruleta Three.js, transiciones GSAP, Lottie, fallbacks | Escenas integradas |
| 6 | **seo-negocio-local** | Metadatos, JSON-LD, Open Graph, `alt` | Checklist SEO aplicada |
| 7 | **qa-rendimiento** | Lighthouse, Playwright, axe, teclado, móvil | Informe y correcciones |
| 8 | **despliegue** | GitHub Pages, dominio, HTTPS | Sitio publicado |

**Orden:** (1 + 2) → **3** (el router de vistas es el cimiento, va antes que los activos) → 4 → 5 → 6 → 7 → 8.

---

## 11. Fases y entregables

| Fase | Trabajo | Resultado |
|---|---|---|
| 0. Datos | Confirmar dirección, ciudad, teléfono/WhatsApp, horario, Facebook, referencias para llegar y precios vigentes; reunir logo vectorial y fotos propias | `negocio.json` completo |
| 1. Diseño | Guía de estilo con contrastes verificados, boceto de las 5 vistas, storyboard del perrito y de la ruleta | Aprobación del cliente |
| 2. Base | Astro, router de vistas con foco e `inert`, las 5 vistas estáticas, catálogo desde JSON | Web navegable sin 3D, ya accesible por teclado |
| 3. Activos | 10 costales, Lottie del perrito, video de fachada, imágenes optimizadas | Carpeta `public/` lista |
| 4. 3D y animación | Ruleta sincronizada con la lista, transiciones, Lottie, todos los fallbacks | Sitio completo animado |
| 5. SEO y QA | Metadatos, Lighthouse > 90, auditoría WCAG con `wcag-audit-patterns`, revisión con las heurísticas de Nielsen, pruebas multidispositivo | Informe de calidad |
| 6. Publicación | GitHub Pages, HTTPS, enlaces de WhatsApp y Maps verificados | Sitio en línea |

---

## 12. Riesgos y decisiones abiertas

1. **Datos faltantes:** ciudad, teléfono, horario, referencias para llegar y enlaces. No se publica hasta confirmarlos.
2. **Navegación sin scroll:** es un patrón poco común y hay que vigilarlo en móvil — si una vista no cabe en una pantalla pequeña, se permite scroll interno en esa vista antes que recortar contenido esencial. Probar con pantallas de 360×640.
3. **Descubribilidad del contenido:** sin scroll, lo que no está en la barra superior no existe para el usuario. Las 5 etiquetas tienen que ser claras a la primera.
4. **SEO con una sola pantalla visible:** el HTML debe contener las 5 vistas completas en el marcado (solo ocultas con CSS), nunca generadas por JS, para que Google las indexe.
5. **Peso de la ruleta 3D:** el riesgo técnico principal. Límite duro de 10 objetos en escena; si no baja de 3 MB, se pasa a la rejilla de imágenes y se conserva la lista.
6. **Formato de los activos del cliente:** el perrito y los modelos 3D de producto los entrega el cliente y todavía no se han visto. Un modelo pensado para render (cientos de miles de polígonos, texturas de 4K, materiales de Blender) no sirve tal cual en la web y hay que redecimarlo y rehornear texturas. Hasta revisar los archivos no se puede confirmar el presupuesto de la ruleta, así que la rejilla de imágenes se mantiene como plan B desde el primer día.
7. **Precios cambiantes:** se mantienen en JSON y rotulados como referenciales.
8. **Derechos de imágenes y marcas:** definir con el dueño qué material usar y pedir fotos propias de productos.
9. **Mantenimiento:** definir quién actualizará precios y catálogo (editar el JSON o añadir un CMS ligero como Decap CMS).

---

## 13. Checklist para empezar

- [ ] Confirmar datos del negocio (sección 1)
- [ ] Obtener logo en vectorial (SVG/AI/PDF)
- [ ] Reunir fotos reales del local, la fachada y los productos
- [ ] Verificar los contrastes de la paleta y corregir los pares que no pasen 4.5:1
- [x] **Recibir del cliente los archivos del perrito** → `Canela.png` + `Canela Jugando.mp4` (2026-10-12)
- [x] **Recibir del cliente las imágenes de producto** → 33 renders PNG en 4 categorías (2026-10-12); no son modelos 3D, el carrusel se hace con CSS 3D
- [ ] Instalar Blender, FFmpeg y gltf-transform CLI
- [ ] Construir el router de vistas y probarlo con teclado antes de añadir cualquier animación
- [x] Decidir qué muestra el carrusel → productos de la categoría activa, 4 categorías (sección 0)
