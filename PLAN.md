# Plan del proyecto: Sitio web de Comercial Hinojosa

> Página publicitaria estática **manejada por vistas** (4 pantallas sin scroll de página desde 2026-10-16), con carrusel 3D de productos, imágenes animadas y video. **Rama de trabajo desde 2026-10-17: `HinoV2`.** Rediseño vigente: sección 0-C.
> Negocio: **Comercial Hinojosa** · Lema: **"Nutrición que da vida"** · Giro: venta de balanceados, alimentos y productos para animales.

**Orden de precedencia:** sección 0-B (decisiones de la auditoría, 2026-10-13) → sección 0 (activos del cliente, 2026-10-12) → resto del plan. Detalle de cada hallazgo en [`auditoria.md`](auditoria.md); los códigos (I1, N1, P1, C1…) remiten a ese archivo.

---

## 0. Activos recibidos del cliente (2026-10-12)

Carpeta `Nuevos Req/` (originales, **no se modifican**; la versión web se genera en `hinojosa-web/public/` con `hinojosa-web/scripts-activos/nuevos_req.py`):

| Archivo | Qué es | Uso decidido |
|---|---|---|
| `Mascota/Canela.png` | Render estilo 3D de Canela sentada, 2752×1536, PNG recortado con alfa | Pose inicial de Canela en Inicio, primer cuadro de los clips de Flow (`flow/canela-inicio-azul.png`) y fallback de `prefers-reduced-motion` |
| `Mascota/Canela Jugando.mp4` | Video de Canela jugando (3,3 MB), fondo gris de estudio | Vista Nosotros: la versión con alfa (`canela-jugando-alfa.webm`, solo el tramo sentada en ida y vuelta) sobre un círculo crema-oscuro, silenciada, sin botón de pausa, con póster |
| `CatalogoF/<categoría>/*.png` | 33 renders de producto, casi todos recortados con alfa (excepto `bebedero.png`, que trae un damero pintado — sustituido por `bebedero_quitado_disque.jpg`, ver P3 —, y `melaza.jpg`, `sal en grano.jpg`, `diferentes tipos de semillas.jpg`, con fondo) | Carrusel de Productos, miniaturas de la lista y vitrina de Inicio |
| `Animales/*.png`, `Animales/fondo.jpg`, `tarjeta/*.jpg`, `sal en grano.png` | **(2026-10-17)** 9 animales con alfa, maqueta de la tarjeta de producto y sal en grano recortada | Ver sección 0-C |

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
| **Quiénes somos** | "Visión" se sustituirá por **"Nuestra historia"** cuando la dueña dé el dato (año de apertura, familia). Desde 2026-10-16 la Visión ya no se muestra en Nosotros; "Nuestra historia" entrará en la columna de texto cuando exista | — |
| **Productos en móvil** | **Hoja de detalle** al tocar un producto de la lista (imagen, precio, "Preguntar") y buscador por encima del carrusel | Desplazar la pantalla hasta el carrusel |
| **Botones de pausa** (2026-10-15) | **Se quitan sin reemplazo** el botón de pausa de Canela corriendo (Inicio) y el del video de Canela jugando (Quiénes somos). Ambos siguen en bucle. Se mantiene `prefers-reduced-motion` (Canela sentada fija, video sin reproducir). ⚠️ **Incumple WCAG 2.2.2 (nivel A)**: decisión del usuario, registrada como riesgo 11 | Un solo control global "Pausar animaciones"; que el movimiento se detenga solo antes de 5 s |
| **Iconos en los botones de Inicio** (2026-10-15) | "Cómo llegar" lleva un **icono de ubicación/GPS** (`pin` de `Icono.astro`) y "Ver productos" el **icono de costal** (`costal`), ambos a la izquierda del texto y decorativos (`aria-hidden`). Los **accesos por categoría no llevan icono** (la fila de animales de debajo ya los tiene) | Iconos en los accesos por categoría |
| **Orden de la barra** (2026-10-15) | **Inicio · Productos · Quiénes somos · Por qué elegirnos · Visítanos** (Productos pasa antes que Quiénes somos). Cambia también el orden de las secciones en el HTML, la lista `VISTAS` del router, las flechas ←/→, la dirección de las transiciones y la barra móvil | Orden anterior (Quiénes somos antes que Productos) |
| **Vista Nosotros** (2026-10-16) | **Quiénes somos y Por qué elegirnos pasan a ser UNA vista, "Nosotros"**, con lo mejor de cada una (opción A "Canela presenta", ver vista 3). Barra: **Inicio · Productos · Nosotros · Visítanos** (4 vistas). `#por-que` deja de ser vista: es el bloque de razones dentro de `#nosotros` y los enlaces viejos siguen funcionando. **Fuera de pantalla:** Visión, los 6 valores, los 4 pilares y los 4 diferenciales (Visión y valores siguen en `negocio.json` para metadatos y JSON-LD) | Pegar las dos vistas tal cual; mosaico de tarjetas con video gris (primera prueba); "Historia en dos pisos"; "Los animales mandan" |
| **Video de Canela en Nosotros** (2026-10-16) | Versión con alfa sobre un círculo crema-oscuro, **solo el tramo sentada (cuadros 1–69) en ida y vuelta**: en el salto del original la gorra se sale del cuadro, y girar a mitad de bajar la pata se veía raro. Safari/iOS muestra el póster (no reproduce alfa VP9) | Usar el salto; girar en el cuadro 80 |
| **Productos: ficha del producto** (2026-10-16) | El panel derecho deja de ser la lista completa: **ficha del producto al frente** (precio, marca, presentación, categoría, "Para:" animales, tabla de la tilapia, "¿Dónde comprarlo?") + **buscador con sugerencias** + **"Ver todos los productos (37)"** que abre la lista en un `<dialog>`. Carrusel al 60 % (ver vista 2) | Escaparate a todo el ancho que filtra el anillo; lista aligerada a la derecha |
| **Barra: hover con trazo de pincel** (2026-10-16, bloque 18) | Al pasar el ratón sobre una opción **no activa** de la barra (escritorio), aparece debajo del rótulo el **mismo trazo de pincel maíz** que llevan los h2 (p. ej. bajo "Comercial Hinojosa" en Visítanos), dibujándose de izquierda a derecha. **Sustituye** al fondo `hoja-claro` del hover | Fondo hoja-claro (B4 original); subrayado recto |
| **Ficha de Productos en verde bosque** (2026-10-16, bloque 18) | La ficha del producto pasa de kraft a **verde bosque** (`.tema-oscuro`), con el mismo lenguaje que la tarjeta de Visítanos. Da a Productos su bloque verde (antes 74/26/0, sin banda bosque) | Kraft (primera versión de la ficha); verde claro `hoja-claro` |
| **Productos: compra en el pie y pestañas Detalle / Lista** (2026-10-16, bloque 19) | **1A:** el botón "¿Dónde comprarlo? Visítanos" sale de la ficha; queda una **línea de texto en el pie**: "Todos estos productos los encuentras en nuestro local · Cómo llegar →". La hoja de detalle móvil conserva su botón. Con WhatsApp, botón pequeño "Preguntar" junto al precio. **2A:** el botón "Ver todos los productos" y su ventana desaparecen; el panel derecho tiene **pestañas "Detalle" / "Lista (N)"**, y la lista muestra solo la categoría activa en el mismo sitio de la ficha | Enlace junto al precio; quitar la compra; quitar la lista; tira de miniaturas bajo el carrusel; ventana con los 37 (versión anterior) |
| **Barra: trazo de toda la palabra y más lento** (2026-10-16, bloque 19) | El trazo del hover cubre **todo el ancho del rótulo** (antes ~60 %) y se dibuja en **400 ms** (antes 220) y se recoge en **250 ms** (antes 150) | — |
| **Ficha compacta y transición Detalle ↔ Lista** (2026-10-16, bloque 20) | El cuadro de Detalle **nunca tiene scroll**: todo se ve con los 37 productos a 1440×900 y 1366×650. Ficha compacta: sin fila Categoría; Marca y Presentación lado a lado; "Para" en pastillas; la tabla del tilapero como 6 pastillas; el selector Detalle \| Lista dentro del cuadro, en una franja superior bosque; notas del pie en una línea. Cambio de pestaña con fundido y deslizamiento corto y pastilla que se desliza | Ficha mínima sin etiquetas; ficha en dos columnas; scroll interno (versión anterior) |
| **Datos de contacto** (2026-10-16) | Confirmados por el usuario: dirección **Av. del Chofer y Rubén Larson**, teléfonos **099 708 5015** y **098 928 1882**, correo **rubenhinojosa4@yahoo.es**, Facebook **@Comercial Hinojosa** (falta el enlace). Ver sección 1 | — |

**Cambios de criterio que se derivan** (aplican aunque contradigan secciones antiguas):
- **Contacto:** sigue sin botón flotante de WhatsApp, pero ya no vive *solo* en Visítanos. Se permiten dos accesos contextuales: el botón **"Cómo llegar"** de Inicio (ancla a `#visitanos`) y el botón **"Preguntar por este producto"** de Productos (abre `wa.me` con el nombre del producto cuando WhatsApp esté confirmado; mientras tanto, lleva a `#visitanos`).
- **Marcador `PENDIENTE_CONFIRMAR`:** vive **solo en los datos** (`negocio.json`) y en QA. **Nunca se muestra en pantalla.** En pantalla se usan `textos.comunes.datoPendiente` y `textos.visitanos.contactoPendiente`, y los canales pendientes se agrupan en una sola línea sin forma de botón.
- **Movimiento:** toda transición nueva respeta `prefers-reduced-motion` **y** la pausa del sitio (`html[data-movimiento="pausado"]`; desde el 2026-10-15 ya no hay botón visible que la active, pero el mecanismo se conserva), que hoy anula `animation` pero no `transition`.
- **Medición obligatoria** tras implementar: Lighthouse móvil en Inicio (hoy 99), `#productos` (≥ 93; hoy 97) y `#nosotros` (hoy 98), y las pruebas del router (`vistas-hinojosa`).

---

## 0-C. Rediseño de Inicio, Productos y Nosotros + GSAP y Blender MCP (2026-10-17)

Pedido del usuario el 2026-10-17, ya en la rama **`HinoV2`** (a partir de ahora se trabaja ahí; `Ariel` no se toca; `main` solo recibe `HinoV2` cuando el usuario lo pide — primera vez el 2026-10-17). **Manda sobre 0-B y sobre las especificaciones de la sección 4** en todo lo que contradiga. Se implementa por los bloques 21–26 (sección 11).

### Activos nuevos recibidos (2026-10-17)

| Archivo | Qué es | Uso decidido |
|---|---|---|
| `Nuevos Req/Animales/{aves,cerdo,conejos,cuyes,gato,pato,perro,tilapias,vaca}.png` | **9 animales** (cuyes añadidos el 2026-10-17), 2752×1536 con **alfa** (7–9 MB c/u; los pixeles bajo el alfa conservan el fondo azul del estudio, **recortar siempre por alfa**) | Escena de Inicio, con movimiento. **Reducidos el 2026-10-17** (`python nuevos_req.py animales`): `public/img/animales/<slug>.{avif,webp}` a 480 px de alto y `<slug>-240.*` a 240 px; juego AVIF ≈ 300 KB (480) y ≈ 115 KB (240); el más pesado, tilapias (66 KB AVIF). Recortes revisados sobre crema: sin halo azul. Ojo: `aves` trae gallo, gallina y pollitos con uno suelto a la derecha; **las tilapias son peces: van en un estanque o abrevadero de la escena, no sobre el césped** |
| `Nuevos Req/tarjeta/tarjeta nueva producto y lista de productos.jpg` | Maqueta de la **nueva tarjeta de producto** (ver Productos) | Referencia visual de la ficha |
| `Nuevos Req/CatalogoF/Alimento Animales de Granja/sal en grano.png` | Sal en grano **recortada con alfa** (sustituye a `sal en grano.jpg`, que el usuario borró) | Carrusel. ✅ 2026-10-17: `nuevos_req.py` ya no la trata como imagen con fondo, se regeneró sola (`python nuevos_req.py producto sal-en-grano`, 52 KB AVIF) y `productos.json` ya no lleva `conFondo` en `sal-en-grano` |

### Decisiones

| Tema | Decisión |
|---|---|
| **Inicio: escena de granja** | Se quitan los **4 costales** de la vitrina. El bloque de texto (logo, acento, subtítulo, 2 botones, accesos, fila de animales) pasa a una **columna a la izquierda**. El fondo deja de ser el verde oscuro liso: es una **granja de día**: cielo con **nubes que se mueven**, colinas y **césped** en primer plano. **Respeta la paleta** (ver "Paleta de la escena"). Canela sigue jugando/corriendo en la franja inferior |
| **Animales de Inicio** | Los 9 animales de `Nuevos Req/Animales/` ocupan **el espacio sobrante a la izquierda**, de pie sobre el césped y con **movimiento idle propio** (respirar, balanceo, cola, cabeceo), sin salirse de su sitio. Disposición, tamaños y orden los define `direccion-arte`; deben leerse como un conjunto, no como pegatinas. Cada animal puede enlazar a Productos con su filtro (`data-abrir-animal`) como los de Nosotros (decisión de `frontend`, si no estorba) |
| **Canela en Inicio** | Se queda en la franja inferior, pero **con mejor render**: ver "Blender MCP". Se mantiene la carrera de borde a borde y la franja a la altura del césped |
| **Botones de Inicio** | "Ver productos" y "Cómo llegar" y los accesos **se pintan o subrayan al pasar el cursor** (hover) y con el foco de teclado. Primario: relleno que cambia de color + elevación; secundarios y accesos: relleno de color o subrayado animado. Solo con `(hover: hover)`; el foco visible siempre |
| **Productos: carrusel grande y centrado** | El carrusel pasa a ser **el protagonista y va al centro**: escenario a todo el ancho de la vista, anillo mucho más grande (el frente en escritorio ≈ 30–34 dvh de alto, antes 24). Buscador y pestañas de categoría arriba; la tarjeta (ficha y lista) pasa a un lateral derecho más estrecho sin tapar el anillo. `direccion-arte` valida la retícula con capturas (1440×900 y 1366×650) antes de implementar |
| **Producto seleccionado** | Debe **sobresalir de verdad**: el frente **crece** (escala ≈ 1,25–1,35 sobre el actual), con más sombra y tarima; el **anterior y el siguiente se sombrean** (más pequeños, oscurecidos con la capa de tinta y desenfocados o con menos opacidad) para que solo destaque el seleccionado; el resto del anillo, aún más atenuado. Las transiciones C1–C8 se conservan |
| **Tarjeta de producto nueva** | Se cambia al diseño de `Nuevos Req/tarjeta/`: tarjeta **crema** (no bosque) de esquinas redondeadas con **hojas y huellas en marca de agua**, ligeras; **nombre grande en verde bosque** (Cormorant o Nunito 800, hasta 2 líneas); **chip de precio dorado** ("Desde $1.00"); **MARCA** y valor; **PARA** + pastilla del animal con su icono. **Contiene el detalle y la lista** (siguen las pestañas Detalle / Lista (N) con el patrón ARIA, el sin-scroll de la ficha y los 37 productos). Anula el bloque 18 (ficha bosque). La presentación va en la tarjeta si cabe (la maqueta no la muestra: decide `direccion-arte`) |
| **"Cómo llegar" en Productos** | El enlace del pie se vuelve **llamativo**: botón en forma de píldora (oro o bosque), icono de pin, flecha que se mueve al hover y subrayado animado. Cumple contraste 4.5:1 y objetivo ≥ 24 px (44 en móvil). Se aplica el mismo estilo al enlace "Cómo llegar" de la hoja de detalle |
| **Nosotros: banda inferior** | La banda bosque conserva **solo los iconos de los animales** (con su nombre y el enlace a Productos). **Se quitan los sellos/imágenes de costal** de Aves, Cerdos, Vacas y Cuyes |
| **Transición entre vistas** | Se sustituye el fundido cruzado CSS por una **transición con timeline de GSAP**, más fluida: capas **solapadas** (la entrante empieza antes de que termine la saliente), curva `power3.out`, desplazamiento y profundidad suaves, entrada escalonada de bloques con `stagger` y la escena de Inicio (nubes, césped) como **elemento compartido** que no se parpadea. Duración total objetivo 550–650 ms (hoy ≈ 440), **interrumpible** (un clic nuevo invierte o reemplaza el timeline sin saltos) y sin destello. **La metáfora sigue siendo una**: desplazamiento horizontal en el orden de las vistas. `animacion-interaccion` prueba dos variantes con fotogramas y deja la mejor; el contrato (promesa, foco antes de animar, `inert`, pausa y `prefers-reduced-motion`) no cambia |

### Ajustes del 2026-10-17 (tarde) — mandan sobre lo anterior de Inicio
| Tema | Decisión |
|---|---|
| **Fondo en video** | El usuario dejó `Nuevos Req/Animales/videofondo.mp4` (time-lapse del campo al atardecer, nubes que avanzan rápido): **así quiere el movimiento de las nubes**. Sustituye a la deriva del cielo de `fondo.jpg` (que queda como respaldo). Derivados con `python nuevos_req.py videofondo`: bucle de **8,5 s sin salto** (los últimos 1,5 s se funden con los primeros), sin audio; escritorio `public/video/campo.{webm,mp4}` 1280×720 (643/625 KB) y móvil vertical `campo-movil.*` 432×768 (266/244 KB), con póster del primer cuadro (`-poster.{avif,webp}`). `muted`, `playsinline`, `loop`, sin controles (decorativo, `aria-hidden`); póster fijo con `prefers-reduced-motion`, pausa del sitio o `saveData`; se para fuera de Inicio. **El logo debe seguir siendo el LCP** (medirlo: un video a pantalla completa es candidato). Peso de Inicio: hasta ~1,5 MB en escritorio con el video; vigilarlo |
| **Sin tarjeta verde** | Se **quita el panel bosque/vidrio**: logo, acento, subtítulo, botones y accesos van directamente sobre el video. El contraste se consigue con un **velo oscuro suave** (degradado `bosque-noche`/`bosque` desde la izquierda que se desvanece, no una tarjeta), sombra de texto y botones opacos; medir sobre varios cuadros del video (≥ 4.5:1 texto normal, ≥ 3:1 texto grande y bordes) |
| **Animales como foto familiar** | **Más grandes** y **agrupados como en una foto de familia**: juntos, de frente a la cámara, en filas (atrás los grandes —vaca, cerdo—; en medio perro y aves; delante los pequeños —conejos, cuyes, gato, pato, tilapias—), ocupando buena parte del lado derecho y apoyados en la hierba cercana. Se abandona la escala real estricta en favor de una composición de retrato; la vaca sigue siendo la más alta. Más grandes también en móvil |

### Ajustes de Productos del 2026-10-17 (noche) — mandan sobre los bloques 23–24

✅ **Hecho 2026-10-17 (bloque 23b):** retícula 68/32 (categorías en fila con hover verde, carrusel con frente ×1,4; buscador, tarjeta y "Cómo llegar" a la derecha), descripción en la ficha y la hoja móvil, desvanecido verde, sin texto legal, fondo de huellas y hojas inline. 37/37 sin scroll, axe 0, Lighthouse móvil 93–97 (mediana 94).
| Tema | Decisión |
|---|---|
| **Retícula** | El carrusel ocupa **la parte izquierda y el centro** (≈ 66–70 % del ancho); la columna derecha lleva el **buscador arriba** y debajo la tarjeta (Detalle / Lista). Las **pestañas de categoría van en fila encima del carrusel** y **se pintan al pasar el cursor** (relleno de color, foco visible igual) |
| **Frente del carrusel** | Un poco más grande que el ×1,3 del bloque 23 (sin romper M5 ni tapar flechas/rótulo) |
| **Descripción corta** | Cada producto lleva una **descripción de una o dos líneas** en el Detalle (campo `descripcion` en `productos.json`, ≤ 110 caracteres, tono de la marca, **sin inventar datos técnicos** —nada de % ni beneficios que no estén en los afiches—; en propuesta hasta que la apruebe el usuario o la dueña) |
| **Tarjeta** | Se le añade un **desvanecido verde** (degradado de `hoja-claro`/`hoja` hacia la base o desde una esquina) sin perder los contrastes |
| **Texto legal fuera** | Se quita de la vista "Precios referenciales — consulta disponibilidad · Marcas registradas de sus respectivos propietarios." (decisión del usuario). ⚠️ Riesgo 20: sin aviso de precios referenciales y de marcas de terceros |
| **Fondo de Productos** | Textura de **huellas de animales y hojas/plantas** muy sutil en el fondo crema (SVG ligero, decorativo) |

### Paleta de la escena de Inicio (sin colores nuevos)
- **Cielo:** degradado de `crema` (#F6F1E4) a `hoja-claro` (#EAF4DC) con un halo `maíz` al 15–25 % como sol; **no hay azul** en la paleta: si el usuario quiere cielo azul, es un color nuevo y **requiere aprobación** (calcular contrastes).
- **Nubes:** blanco y `crema`, bordes suaves, deriva lenta (80–140 s por cruce), 3 capas con profundidad.
- **Colinas y césped:** `hoja` (#7BBF3A) → `verde` (#2E8B2E) → `bosque` (#1B4D2B) en el primer plano; granos de maíz y hojas del trébol como textura (SVG inline, ligero).
- **Texto de la columna izquierda:** `bosque` sobre cielo claro (≥ 9:1) o crema sobre bosque, según donde caiga; el logo debe seguir siendo el LCP y **hay que comprobar el logo sobre fondo claro** (hoy luce sobre verde oscuro). Si no luce, el bloque de texto lleva un panel `bosque` translúcido u opaco detrás.
- Cumple el reparto 55/30/15 a su manera (cielo claro ≈ 45 %, verdes ≈ 40 %, oro y canela ≈ 15 % con Canela y los animales): medirlo sobre captura.

### Herramientas nuevas
- **GSAP 3.15 (ya instalado) pasa a ser el motor de todas las transiciones y animaciones JS:** transición entre vistas, entradas escalonadas, nubes e idle de los animales de Inicio, carrusel, pestañas y barra. **Antes solo se cargaba al entrar en Productos**; ahora se necesita en Inicio y en cada cambio de vista, así que `animacion-interaccion` define un **cargador común** (`gsap-carga.ts`, import dinámico tras `load`, con `gsap` core y, si hace falta, `Flip`/`CustomEase`; los plugins gratuitos de GSAP 3.13+ están incluidos en el paquete). Reglas: **el logo sigue siendo el LCP**, Inicio < 1,5 MB, CSS `@keyframes` como fallback sin GSAP, ticker dormido fuera de vistas que lo necesiten (el contador de `requestAnimationFrame` de las pruebas de `vistas-hinojosa` se actualiza: Inicio con escena animada sí tiene bucle, **pero 0 fuera de Inicio**), `gsap.matchMedia()` para `prefers-reduced-motion` y la pausa del sitio.
- **Blender MCP (imagen estática → modelo 3D):** servidor MCP que conecta Claude con Blender y permite generar un modelo 3D a partir de una imagen (importación y generación de modelos desde imagen con Hyper3D Rodin / Hunyuan3D, según lo que ofrezca la versión instalada), moverlo, iluminarlo y renderizar. **Uso decidido (propuesta, el usuario la confirma):** Blender es **herramienta de producción, no de ejecución**: el sitio sigue sirviendo **imágenes, sprites WebP y video**; los modelos `.glb`/`.blend` viven fuera de `public/` (carpeta `modelos3d/` en la raíz, ignorada o con el peso controlado) y de ellos se **renderizan**: (1) **Canela mejor renderizada** (iluminación, pelaje, gorra) y sus ciclos de carrera/sentada sin depender de Flow; (2) **vueltas/poses de los animales** de `Nuevos Req/Animales/` para el idle (cabeceo, giro de cabeza, cola); (3) opcionalmente costales. Esto **no reintroduce Three.js** en la página. Si algún día se quiere 3D interactivo en el navegador, es otra decisión (peso y gama media).
  - **Instalado y probado el 2026-10-17:** Blender **4.5.10 LTS** (`C:\Program Files\Blender Foundation\Blender 4.5\blender.exe`; se eligió la LTS 4.5 y no la 5.x por compatibilidad del complemento), `uv` 0.13.1 (winget; su carpeta se añadió al PATH del usuario), complemento **MCP for Blender** (protocolo 13, el que trae el paquete) instalado y activado en `%APPDATA%\Blender Foundation\Blender\4.5\scripts\addons\blender_mcp_addon.py`, con **arranque automático del servidor en `localhost:9876`** al abrir Blender, y el servidor registrado en **`.mcp.json`** de la raíz: `uvx mcp-for-blender==2.1.9` (el paquete `blender-mcp` se renombró a `mcp-for-blender`), con `DISABLE_TELEMETRY=true`. Probado de punta a punta: Blender respondió a `get_scene_info` y el servidor conectó.
  - **Cómo se usa:** (1) abrir Blender (el servidor del complemento arranca solo); (2) reiniciar Claude Code en la raíz del proyecto y aprobar el servidor `blender` de `.mcp.json` (`/mcp` muestra su estado); (3) las herramientas aparecen como `mcp__blender__*`: `get_scene_info`, `execute_blender_code`, `look`/`viewport_capture`, `search_assets`/`import_asset` y **`generate_3d`** (imagen o texto → modelo 3D).
  - **`generate_3d` necesita clave:** Hyper3D Rodin, fal.ai o Tencent Hunyuan3D (las pone el usuario en el panel del complemento, Barra lateral de la vista 3D → "MCP for Blender"), o la **prueba gratuita de Rodin** (limitada). **La imagen se sube a ese servicio externo:** confirmar con la dueña que se pueden subir Canela y los animales. Sin clave, Blender sirve igual para iluminar, posar y renderizar modelos hechos a mano o importados.
  - Las imágenes de entrada deben tener **un solo sujeto, fondo recortado (alfa) y vista de frente o 3/4**; los `.png` de `Nuevos Req/Animales/` y `Canela.png` ya cumplen.
  - Revisión obligatoria de cada render: gorra, collar y "H" de Canela correctos, sin extremidades fusionadas ni artefactos de malla; si falla, se descarta.
  - Derechos: los modelos derivan de imágenes que parecen generadas con IA: se suman al aviso de derechos de uso de la dueña.

### Qué cambia en el plan por esto
- Sección 4, vistas 1, 2 y 3: ver los avisos "Rediseño 0-C" al inicio de cada una.
- Sección 6: GSAP en toda la página y Blender MCP como herramienta de producción.
- Sección 11: bloques 21–26. Sección 12: riesgos 14–17. Sección 13: checklist.
- **Se mantiene** todo lo no mencionado aquí (router, 4 vistas, buscador, pestañas Detalle / Lista, hoja de detalle móvil, Visítanos, datos pendientes, sin botones de pausa).

---

## 1. Resumen del negocio (extraído del material recibido)

| Dato | Valor |
|---|---|
| Nombre | Comercial Hinojosa |
| Eslogan principal | Nutrición que da vida |
| Eslóganes secundarios | "Calidad que alimenta, amor que se siente" · "Comercial Hinojosa siempre a tu lado" · "Tu mejor aliado para tus animales" · "Somos parte de tu familia" · "Calidad, Confianza, Compromiso" |
| Subtítulo | Venta de balanceados · Alimentos y productos para animales |
| Mascota | **Canela**, perrita alegre y cariñosa con gorra verde y pañuelo con la "H" |
| Dirección | **Av. del Chofer y Rubén Larson** ✅ confirmada 2026-10-16 (los afiches decían "Lerson"). Falta la **ciudad** |
| País | Ecuador (teléfonos 09…) |
| Teléfonos | **099 708 5015** · **098 928 1882** ✅ 2026-10-16. En el sitio, un botón "Llamar" por número (`tel:+593…`). **Falta saber cuál tiene WhatsApp** |
| Correo | **rubenhinojosa4@yahoo.es** ✅ 2026-10-16 (enlace `mailto:` en Visítanos y `email` en el JSON-LD) |
| Red social | Facebook **@Comercial Hinojosa** ✅ nombre de la página. **Falta el enlace** (`https://www.facebook.com/…`): sin él no se publica el botón |
| Animales atendidos | Aves, cerdos, conejos, cuyes, vacas, perros, gatos, tilapias |
| Moneda de precios | USD ($) |

> **Pendiente de confirmar:** ciudad, cuál número tiene WhatsApp, horario, enlace de Facebook, enlace de Google Maps, coordenadas y referencias para llegar; **año de apertura / una línea de historia** y **foto del local, la fachada o el equipo**. No se inventan; se dejan como variables editables en `negocio.json`.

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
- **Icono en círculo con aro maíz:** reservado a una sola familia: las 3 razones de "Por qué elegirnos" en la vista Nosotros (antes, los pilares). Animales y demás iconos van sin círculo (G2).
- **Canela** aparece en Inicio y Nosotros; no en otras vistas.
- **Tamaño mínimo de texto:** 13 px, también en la barra ("COMERCIAL" sube de 11 a 12 px con más interletrado, G4).

### Reparto del color (revisión de paleta, 2026-10-14)

**Diagnóstico de dirección de arte:** la paleta del logo es buena y **no se cambia**; el problema es cómo se reparte. Fuera de Inicio el sitio usa en la práctica dos colores (crema + verde bosque) y tarjetas blancas con sombra sobre crema (blanco y crema casi no se distinguen, ~1,1:1), que es el gesto típico de plantilla. El oro casi desaparece y el canela no aparece.

| Vista | Verde | Blanco/crema | Oro | Canela |
|---|---|---|---|---|
| Inicio | ~85 % | ~8 % | ~5 % | ~1 % |
| Quiénes somos (antes de Nosotros) | ~22 % | ~72 % | ~3 % | ~3 % |
| Productos | ~6 % | ~70 % | ~1 % | 0 % (los costales aportan el color) |
| Por qué (antes de Nosotros) | ~13 % | ~85 % | ~1 % | 0 % |
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
1. **Una sola página** (`index.astro`) con **4 vistas** (5 hasta el 2026-10-16). Cada vista ocupa `100dvh` y solo una está visible a la vez.
2. **No hay scroll de página.** Las vistas inactivas se ocultan con `display: none` + `inert`.
3. **Se cambia de vista desde la barra superior**, siempre visible, y con `←`/`→`, `AvPág`/`RePág`. **Decisión 0-B: no se añade rueda, deslizamiento ni enlaces "Siguiente".**
4. **Scroll interno permitido solo** en la pestaña Lista del panel de Productos, en el cuerpo de la ficha de producto cuando no cabe y, en móvil, en la vista que no quepa.
5. **Cada vista tiene su hash**, en este orden (2026-10-16): `#inicio`, `#productos`, `#nosotros`, `#visitanos`. `#por-que` abre el bloque de razones dentro de `#nosotros` (es un `id` de ese bloque, no una vista).
6. **Transición entre vistas:** ver "Transición" más abajo. Una sola metáfora en todo el sitio.

### Sistema de títulos (propuesta, pendiente de aprobación)
| Vista | Antetítulo | h2 (frase) |
|---|---|---|
| Inicio | — (el `h1` es el logo con su texto alternativo) | — |
| Productos | PRODUCTOS | "Lo que tenemos para tus animales" (hoy sigue "Nuestros productos") |
| Nosotros | NOSOTROS | **"Somos parte de tu familia"** ✅ aplicado 2026-10-16 ("familia" en Caveat canela oscuro) |
| Visítanos | VISÍTANOS | Comercial Hinojosa (ya lo cumple) |

Las frases salen de los eslóganes reales del negocio. "Calidad, confianza y compromiso" y "Siempre a tu lado" quedan libres (eran de Quiénes somos y Por qué).

### Barra superior
- **Orden (2026-10-16):** Inicio · Productos · Nosotros · Visítanos. En móvil, 4 ítems con icono + palabra.
- Vista activa con `aria-current="page"` **y** pastilla de fondo que se desliza (no solo color, WCAG 1.4.1).
- En móvil, barra inferior de 4 ítems con icono + palabra; objetivos táctiles de 44×44 px.
- **Animación (decidida, B1–B4):**
  - **Ancho reservado en negrita:** cada rótulo reserva el ancho de su versión en 800 (pseudo-elemento invisible con `content: attr(data-texto)`) para que los vecinos no salten al activarse.
  - `.anima` no se retira hasta el `transitionend` de la pastilla.
  - **Estiramiento direccional** de la pastilla: el borde que va delante tarda 240 ms y el de atrás 300 ms.
  - **Texto bajo la pastilla:** versión básica, el color cambia con 150 ms de retraso; versión pulida, inversión exacta con `clip-path` (copia `aria-hidden` del menú).
  - **Hover en escritorio (2026-10-16, bloque 18):** en los rótulos **no activos**, el **trazo de pincel maíz** de los h2 (`--trazo-pincel`, color `maiz`, alto `round(clamp(0.375rem, 0.9dvh, 0.5rem), 1px)`, girado −1°) aparece bajo el texto, **a todo su ancho** (desde la primera hasta la última letra; bloque 19). Se **dibuja de izquierda a derecha** con `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` en **400 ms** (`--ease-vista`) y se recoge en **250 ms** (`--ease-salida`) al salir. Solo con `(hover: hover) and (pointer: fine)`; el ítem activo (pastilla bosque) no lo lleva. Con `prefers-reduced-motion` o la pausa del sitio aparece y desaparece sin animación. Es decorativo (feedback de hover, no estado): no necesita 3:1 contra el crema de la barra. **Sustituye** al fondo `hoja-claro`. Se mantienen la pulsación (`scale(0.96)` en 90 ms) y, en móvil, el fondo `hoja-claro` al tocar y el "pop" del icono activo (`scale(0.92)` → 1, 220 ms, `--ease-rebote`).
  - Con movimiento reducido o pausa: la pastilla salta, sin pop.
- En móvil, la barra superior baja a 44 px y el isotipo a 32 px (G5).

### Transición entre vistas (decidida, T1–T2)

> ⚠️ **Rediseño 0-C (2026-10-17):** la versión de abajo (dos capas en CSS, ≈ 440 ms) se **sustituye por un timeline de GSAP** más fluido (capas solapadas, ≈ 550–650 ms, interrumpible, escena de Inicio compartida). Detalle en 0-C y, cuando se implemente, en `vistas-hinojosa`. Hasta entonces rige lo siguiente.
Hoy la vista saliente se oculta antes del primer pintado y se ve un destello del fondo crema; además la curva llega al 87 % en 156 ms y se percibe como un corte.

- **Fundido cruzado direccional en dos capas:**
  - Saliente: opacidad 1 → 0 y `translateX(-dir · 1rem)`, **160 ms**, `--ease-salida`, `pointer-events: none`, por debajo de la entrante.
  - Entrante: `translateX(dir · 2.5rem)` → 0 y opacidad 0 → 1, **380 ms** con **60 ms** de retraso, `cubic-bezier(0.25, 1, 0.5, 1)`. Total ≈ 440 ms.
  - `src/lib/animacion/vistas.ts` devuelve una `Promise` que se resuelve con el `animationend` de la saliente (tope 200 ms); el router ya la espera y ya gestiona los clics rápidos.
- **Entrada escalonada (A+):** dentro de la vista entrante, 2–3 bloques marcados con `[data-entra]` (título, bloque principal, bloque secundario) entran desde `dir · 1.5rem` con opacidad, 300 ms, 50 ms entre bloques. En Productos el anillo cuenta como un bloque sin animación propia. Los iconos de las razones y los animales de Nosotros empiezan a los 400 ms.
- El **foco** va al título **antes** de cualquier animación.
- Con `prefers-reduced-motion` o pausa: cambio instantáneo.
- **Mejora futura:** View Transitions API como implementación de lo mismo, con respaldo.

### Navegación por teclado
- `Tab` recorre la barra; `Enter`/`Espacio` activa.
- `←`/`→` (o `AvPág`/`RePág`) cambian de vista fuera de campos de texto y fuera del carrusel (`[data-captura-flechas]`).
- Al cambiar de vista, el foco va al título (`tabindex="-1"`).
- El foco nunca queda oculto tras la barra ni tras paneles flotantes (WCAG 2.4.11).

### Las 4 vistas
| # | Vista | Qué contiene |
|---|---|---|
| 1 | **Inicio** | Logo, acento "Tu mejor aliado para tus animales", subtítulo, 2 botones, accesos por categoría, fila de animales, vitrina de 4 costales (escritorio) y Canela en la franja inferior |
| 2 | **Productos** | Pestañas de 4 categorías y carrusel 3D (60 %); buscador con sugerencias, pestañas Detalle / Lista con la ficha del producto al frente o la lista de la categoría (40 %); línea "Cómo llegar" en el pie; hoja de detalle en móvil |
| 3 | **Nosotros** | Canela jugando sobre un círculo, "Somos parte de tu familia", misión, 3 razones ("Por qué elegirnos") y banda de animales que enlaza a Productos |
| 4 | **Visítanos** | Dirección, teléfonos, correo, horario y mapa (cuando haya coordenadas) |

---

## 4. Especificación de cada vista

### Vista 1 — Inicio (decisión 0-B: vitrina lateral)

> ⚠️ **Estado real (2026-10-17, tarde):** fondo en **video** (time-lapse en canvas), **sin tarjeta verde**, animales **en foto de familia** y tilapias en pecera; ver la tabla "Ajustes del 2026-10-17 (tarde)" de 0-C, que manda sobre este aviso.
>
> ⚠️ **Rediseño 0-C (2026-10-17) manda sobre todo lo de esta vista:** sin vitrina de costales; texto en columna **izquierda**; escena de granja (cielo con nubes en movimiento, colinas y césped) en la paleta de marca; 9 animales de `Nuevos Req/Animales/` con movimiento en el espacio sobrante de la izquierda; Canela con mejor render en la franja inferior; botones y accesos que se pintan o subrayan al hover. Lo que sigue (logo LCP, acento, botones, accesos, fila de animales, carrera de Canela) se conserva salvo la vitrina y el fondo verde.

```
┌──────────────────────────────────────────────────────────┐
│ [logo]  Inicio · Productos · Nosotros · Visítanos        │
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

*Estado:* ✅ implementada el 2026-10-14 (`src/lib/animacion/canela-carrera.ts`, sprites en `public/img/canela/carrera*`, juegos de 320 y 160 px).

**Entrada (I9):** tras el LCP, acento, subtítulo y botones en cascada (`opacity` + `translateY(12px)`, 80 ms entre cada uno, 400 ms); los costales suben desde el horizonte en 600 ms. El logo no se anima.

---

### Vista 2 — Productos (rediseño 2026-10-16: ficha del producto)

> ⚠️ **Estado real (2026-10-17, noche, bloque 23b):** carrusel en la parte izquierda y el centro (68 %), categorías en fila encima con hover verde, buscador encima de la tarjeta, descripción corta en la ficha, desvanecido verde, sin texto legal y fondo de huellas y hojas; ver "Ajustes de Productos del 2026-10-17 (noche)" en 0-C.
>
> ⚠️ **Rediseño 0-C (2026-10-17) manda sobre lo siguiente:** carrusel **grande y centrado** (a todo el ancho; ya no el 60 % izquierdo); producto seleccionado más grande y anterior/siguiente sombreados; **tarjeta nueva** crema con hojas y huellas (maqueta en `Nuevos Req/tarjeta/`) que sigue conteniendo Detalle y Lista (la ficha bosque del bloque 18 queda anulada); enlace **"Cómo llegar"** vistoso; sal en grano con su PNG recortado. El buscador, las pestañas Detalle / Lista, la hoja de detalle móvil, C1–C8 y la regla M5 se conservan.

**Pantalla partida: carrusel 3D a la izquierda (60 %), buscador + ficha del producto al frente a la derecha (40 %).** La lista completa sigue existiendo, en una ventana.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]                                                  │
│  Nuestros productos               Buscar producto        │
│  [Granja][Mascotas][Com.][Granos] [🔍 perro…         ✕]  │
│                                   ┌ (bosque) [Det.|Lista]┐│
│     [img]   [IMG]   [img]         │ FICHA compacta     │ │
│  ◀     (anillo CSS 3D)    ▶       │ Camperito pollos   │ │
│          [ tarima ]               │ [$28.00]           │ │
│                                   │ Marca · Present. · │ │
│                                   │ Categoría · Para   │ │
│  Alimento Animales de Granja·1 de 9└────────────────────┘ │
│                    Los encuentras en nuestro local ·      │
│                    Cómo llegar →  · Precios referenciales │
└──────────────────────────────────────────────────────────┘
```

**Carrusel (izquierda, 60 %)**
- **4 pestañas de categoría** arriba; el anillo muestra los productos con imagen de la categoría activa (máx. 12 en escena), los de atrás más pequeños, oscuros y transparentes. En móvil van en **una fila sin el recuento**.
- Flechas ◀ ▶ (`<button>` con nombre accesible), arrastre y deslizamiento; giro de un paso 400–500 ms con rebote mínimo. **Nunca gira sola.**
- Bajo el anillo, el **rótulo**: en escritorio solo categoría y posición ("1 de 9"), porque nombre y precio están en la ficha; en móvil, nombre, categoría, posición, chip de precio y el botón **"Ver detalle"** (abre la hoja de detalle).
- Producto al frente más grande en escritorio: `--carrusel-ancho: clamp(11.25rem, 24dvh, 15rem)` en ≥ 64rem (P7).
- **Bebedero (P3): ✅ resuelto el 2026-10-14** (fondo quitado en Paint por el usuario + `quitar_fondo_blanco` en `nuevos_req.py`).
- **Productos sin imagen (P5):** costal genérico con el nombre al frente.
- **Inercia (P9):** un deslizamiento mueve 1–2 posiciones como máximo. En móvil, las flechas a los lados del rótulo.
- Transiciones C1–C8 (tabla de abajo), sin cambios.

**Buscador (derecha arriba, a la altura de las pestañas)**
- Etiqueta visible "Buscar producto"; campo con lupa. **Combobox (patrón ARIA 1.2)** con hasta **6 sugerencias** (miniatura, nombre, marca · categoría, precio) y, si hay más, la opción "Ver los N", que abre la pestaña **Lista** filtrada por la búsqueda (bloque 19).
- Flechas ↑/↓ para moverse, Enter elige, Esc cierra y un segundo Esc borra. **Elegir una sugerencia gira el carrusel** hasta ese producto (cambia de pestaña si hace falta). **Escribir no gira el carrusel solo.**
- Bajo el campo: "14 productos encontrados · Ver los 14" (o "Ver categorías" sin resultados).
- Busca en nombre, marca, presentación, categoría **y en el campo `animales`** (perro, gato, ave/pollo/gallina, cerdo, vaca, cuy, conejo, tilapia/pez), ignorando tildes, guiones y espacios ("procan" = "pro-can") y tolerando singular/plural (`src/lib/busqueda.ts`).

**Ficha del producto al frente (derecha, solo ≥ 48rem) — ficha compacta (bloque 20, 2026-10-16)**
- **Sin scroll nunca:** con cualquiera de los 37 productos, todo el contenido de Detalle se ve dentro del cuadro a 1440×900 y a 1366×650 (y en pantallas ≥ 48rem con alto ≥ 600 px). Los tamaños de letra y los huecos escalan con el alto (`dvh`) para lograrlo; si aun así no cabe, se reduce el tamaño del nombre antes que añadir scroll. Se verifica producto por producto.
- **Contenedor del panel** (mismo para Detalle y Lista, mismo alto: ocupa la fila de la rejilla; cambiar de pestaña no cambia su tamaño): esquinas redondeadas, **franja superior bosque** con el selector **Detalle \| Lista (N)** a la derecha (control segmentado: pastilla crema con texto bosque en la activa, texto crema en la inactiva, borde crema al 40 %; foco maíz). En Lista, la franja muestra a la izquierda el nombre de la categoría y su recuento ("Alimento Mascotas · 16") en maíz/crema y la lista va debajo sobre `hoja-claro`. En Detalle, el cuadro entero es bosque y la franja no lleva título (el nombre del producto va justo debajo).
- **Contenido de Detalle** (`.tema-oscuro`, en este orden):
  1. **Nombre** (Cormorant, blanco 9.80), hasta 2 líneas.
  2. **Chip de precio** oro con tinta (7.93). Con WhatsApp, el botón "Preguntar" va a su derecha (P2).
  3. **Marca** y **Presentación lado a lado** en dos columnas iguales: etiqueta pequeña maíz en mayúsculas (5.44) encima del valor crema (8.69). Si falta uno de los dos, el otro ocupa el ancho. **Sin fila Categoría** (la dicen la pestaña de categoría activa y el rótulo bajo el carrusel).
  4. **Para:** etiqueta maíz + pastillas `hoja-claro` con icono y nombre del animal en bosque (8.63), en una fila que puede partirse.
  5. **Solo en el tilapero:** "Proteína por etapa" (etiqueta maíz) + **6 pastillas** en 2 filas de 3: "Alevín 45 %", "Preinicial 42 %", "Inicial 38 %", "Crecimiento 32 %", "Desarrollo 28 %", "Engorde 24 %" (fondo crema al 12 %, texto crema; la cifra en 800). Para lectores de pantalla, como lista con nombre accesible (no hace falta `<table>`).
  - Separación por filetes crema al 20 % entre bloques 3-4-5, o solo por aire; lo que mejor quepa.
**Pestañas "Detalle" / "Lista (N)" (bloque 19, 2A; sustituyen a "Ver todos los productos" y su ventana)**
- **Desde el bloque 20 van dentro del cuadro** (franja superior bosque, ver arriba), no encima. Dos pestañas: **"Detalle"** (por defecto) y **"Lista (N)"**, donde N es el total de la categoría activa (Granja 9, Mascotas 16, Comederos 5, Granos 7). Patrón ARIA de pestañas (`role="tablist"`, `tab` con `aria-selected` y `aria-controls`, `tabpanel`), con ←/→ entre pestañas (el contenedor lleva `data-captura-flechas`: no cambian de vista) e Inicio/Fin.
- **Detalle:** la ficha verde.
- **Transición (bloque 20):** el panel que sale se funde y se desplaza 12 px hacia el lado contrario (140 ms, `--ease-salida`); el que entra llega desde 12 px en la dirección de la pestaña (Detalle → Lista: entra desde la derecha; Lista → Detalle: desde la izquierda) con opacidad 0 → 1 (260 ms, `--ease-vista`), sin cambiar el tamaño del cuadro. La pastilla del selector se desliza entre las dos opciones en 240 ms. Con `prefers-reduced-motion` o la pausa del sitio: instantáneo. Solo `transform` y `opacity`.
- **Lista:** en el mismo espacio de la ficha, sin ventana, **solo los productos de la categoría activa**, en filas de una línea: miniatura de 40 px, nombre (con "…" si no cabe) y precio a la derecha. Fondo crema-oscuro o hoja-claro (el que mida mejor `direccion-arte`), cabecera de grupo kraft. El producto al frente se marca con la barra bosque de 4 px a la izquierda (C4). Si no cabe, la lista se desplaza dentro del panel. La tabla de la tilapia no va en la lista (está en la ficha).
- **Tocar una fila:** ese producto gira al frente del carrusel y el panel vuelve a **Detalle** (foco a la pestaña Detalle).
- **Cambiar de categoría con la Lista abierta:** la lista pasa a la nueva categoría.
- **Búsqueda:** "Ver los N" del buscador abre la pestaña Lista con los resultados de todas las categorías ("Resultados para «perro» · Quitar filtro" arriba de la lista); al quitar el filtro vuelve a la categoría activa.
- **Desaparecen:** el botón "Ver todos los productos (37)" y el `<dialog>` de la lista.
- **Sin JS:** sin pestañas; la ficha no existe y se ven las listas de las 4 categorías en la columna derecha, como antes. **Siempre en el HTML servido** (SEO) y alternativa textual del carrusel.
- Notas fijas en el pie, bajo la línea de compra, **en una sola línea** desde el bloque 20: *"Precios referenciales — consulta disponibilidad · Marcas registradas de sus respectivos propietarios."* (en tamaño chico; puede partirse en pantallas estrechas).

**Móvil (P6)**
- Orden: título, buscador, pestañas de categoría en una fila, carrusel, rótulo + **"Ver detalle"**, pestañas Detalle / Lista (en móvil "Detalle" muestra solo un aviso corto o se omite y la Lista se ve directamente bajo el carrusel, dentro del scroll de la vista; decide `frontend` lo más simple que pase las pruebas), línea de compra y notas.
- "Ver detalle" abre la **hoja de detalle** desde abajo: imagen, nombre, presentación, precio y "¿Dónde comprarlo?". `<dialog>` modal: foco al título al abrir, `Esc` y "Cerrar", foco de vuelta al botón, fondo inerte. Entra con `translateY(100%)` → 0 en 300 ms; con movimiento reducido, sin desplazamiento.

**Transiciones del carrusel (decididas, C1–C8)** — que nada cambie de golpe:

| # | Elemento | Comportamiento |
|---|---|---|
| C1 | Imágenes al cambiar de categoría | **Caché de ítems por categoría** (se desmontan, no se destruyen; nunca más de 12 en escena). **Precarga** de la categoría nueva durante la salida, esperando `img.decode()` con tope de 250 ms. **Fundido de 200 ms** al aparecer cada imagen. ⚠️ No aplicar al primer montaje: la tarjeta provisional debe quedarse igual bajo el anillo hasta la primera interacción o 1,5 s (si no, Lighthouse móvil baja a 86) |
| C2 | Rótulo (categoría, posición; en móvil también nombre) | Sale en el sentido del giro (opacidad 0, −12 px, 110 ms), cambia el texto a mitad del giro, entra (+12 px → 0, 200 ms) |
| C3 | Chip de precio (móvil) | Ancho animado 200 ms + el mismo fundido. `min-height: 2lh` en el nombre en móvil |
| C4 | Fila resaltada de la lista completa | `aria-current` inmediato, resaltado visual al asentarse el anillo |
| C5 | Cambio de categoría | El anillo sale girando medio paso en el sentido del orden de las pestañas (160 ms) y el nuevo entra desde el lado opuesto (320 ms) |
| C6 | Pestañas | Color en 180 ms + pulsación `scale(0.97)` |
| C7 | Arrastre | El rótulo se atenúa a 0,5 mientras cambia el frente |
| C8 | Llegada | El frente sube 4 px y su sombra se intensifica al asentarse (180 ms). El chevron de la flecha se mueve 3 px al pulsar |

Con movimiento reducido o pausa: cambios instantáneos.

**Accesibilidad**
- La lista (pestaña Lista; sin JS, en la página) **es** la alternativa textual del carrusel. Producto activo anunciado con `aria-live="polite"`. El cuerpo de la ficha y la lista, si se desplazan, son enfocables (`tabindex="0"`).
- Sin JavaScript o sin GSAP: rejilla de imágenes y lista intactas.

---

### Vista 3 — Nosotros (2026-10-16: une Quiénes somos y Por qué elegirnos)

> ⚠️ **Rediseño 0-C (2026-10-17):** la banda bosque inferior queda **solo con los iconos de los animales** (con su nombre y enlace a Productos); **se quitan los sellos de costal**. Lo demás no cambia.

**Opción A "Canela presenta":** menos tarjetas, más jerarquía. Todo visible a la vez, sin clics.

```
┌──────────────────────────────────────────────────────────┐
│ [barra]  Inicio · Productos · Nosotros · Visítanos       │
│                          NOSOTROS                        │
│      ( círculo )         Somos parte de tu familia       │
│        🐕 Canela         ~~~~~~~~~~~~~~                  │
│      (video alfa)        Alimentos y productos de…       │
│                          POR QUÉ ELEGIRNOS               │
│                          (◎) Naturales y de calidad      │
│                          (◎) Atención cercana            │
│                          (◎) Ubicación estratégica →     │
│████ ANIMALES QUE ATENDEMOS  Aves · Cerdos · Cuyes … █████│
└──────────────────────────────────────────────────────────┘
```

- **Canela jugando** (`canela-jugando-alfa.webm`, VP9 con alfa, 640 KB) **grande y sin tarjeta**, sobre un círculo `crema-oscuro`, centrada en él (`--centro-canela: 65 %`, su centro en el video). Solo el tramo sentada (cuadros 1–69) en ida y vuelta: no salta (en el salto del original la gorra se corta) y el giro cae con la pata arriba y casi quieta. `preload="none"`, póster con alfa diferido; arranca con la vista activa; **Safari/iOS muestra el póster** (`data-alfa` en `video-vista.ts`). Sin botón de pausa (riesgo 11). Con reduced motion, el póster.
- **Cabecera:** antetítulo **NOSOTROS** (canela oscuro) + h2 **"Somos parte de tu familia"** ("familia" en Caveat canela oscuro, 5.22, ≥ 24 px) + trazo de pincel maíz.
- **Misión** como párrafo (`negocio.pantalla.mision`), sin tarjeta.
- **"Por qué elegirnos"**: 3 razones con icono en círculo con aro maíz (única familia con círculo). **Textos en propuesta, pendientes de aprobación** (bloque 10), sacados de los pilares y diferenciales sin datos nuevos:
  1. "Naturales y de calidad" — "Alimento natural para tus animales"
  2. "Atención cercana" — "Personalizada, como en familia"
  3. "Ubicación estratégica" — enlace "Ver cómo llegar →" a `#visitanos`
  El bloque lleva `id="por-que"`: los enlaces viejos a `#por-que` abren Nosotros con el foco ahí.
- **Banda bosque a sangre** al pie: "Animales que atendemos", cada animal es un enlace a `#productos` con el buscador lleno con ese animal (`data-abrir-animal`), con el sello de su costal real en Aves, Cerdos, Vacas y Cuyes.
- **Fuera de pantalla:** Visión ("Nuestra historia" la sustituirá cuando la dueña dé el dato), los 6 valores, los 4 pilares, los 4 diferenciales y la frase "Calidad que alimenta, amor que se siente". Visión y valores siguen en `negocio.json` (metadatos y JSON-LD).
- **Móvil:** cabecera, Canela, misión, razones y banda, en columna, con scroll interno.
- **Medido 2026-10-16:** cabe sin scroll a 1440×900 y 1366×650; axe 0; Lighthouse móvil 98.

---

### Vista 4 — Visítanos

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
- **Tarjeta flotante opaca:** nombre, dirección, ciudad, estado "Abierto ahora / Cerrado" (con palabra, no solo color), horario, **"Referencias"** para llegar (V4: el CTA se llama "Cómo llegar" y el dato "Referencias") y botones **Cómo llegar · WhatsApp · Llamar**, correo y Facebook.
- **"Referencias" (qué va ahí):** indicaciones para llegar con puntos conocidos de la zona, en lenguaje de calle, como se da una dirección en Ecuador: 1–3 frases cortas, p. ej. "Frente a la gasolinera …", "A dos cuadras del mercado …", "Junto a la escuela …". Las da la dueña; no se inventan. En `negocio.json` van en `contacto.referenciasLlegar.valor` como lista de frases.
- **Publicado desde 2026-10-16:** dirección "Av. del Chofer y Rubén Larson", **un botón "Llamar" por teléfono** (099 708 5015 y 098 928 1882, cada uno a lo ancho, `tel:+593…`) y el **correo** (`mailto:`). Siguen en la línea agrupada de pendientes: Cómo llegar (Maps), WhatsApp y Facebook (falta su enlace).
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
| Animación | **GSAP 3.15 como motor** de transiciones y animaciones JS (desde 2026-10-17: vistas, entradas, escena de Inicio, carrusel, pestañas); CSS (`@keyframes`) como fallback | Una sola librería, timelines interrumpibles, `gsap.matchMedia()` para movimiento reducido |
| 3D de producción | **Blender 4.5 LTS + MCP for Blender** (`.mcp.json`, `uvx mcp-for-blender==2.1.9`; imagen estática → modelo 3D → render a PNG/sprites/video) | Canela mejor renderizada y poses de los animales; **no se sirve 3D en la página** (ver 0-C). ✅ Instalado 2026-10-17; `generate_3d` necesita clave |
| Perrito | Video de **Google Flow** → sprite sheets WebP + `translateX` (`canela-carrera.ts`) | Carrera real, se congela en cualquier cuadro, funciona en Safari |
| Iconos | SVG inline (`Icono.astro`) con entrada CSS única | Sin Lottie |
| Mapa | **Leaflet 1.9.4 + OpenStreetMap** | Gratis, sin API key, carga diferida |
| Video | **FFmpeg** → WebM (VP9) + MP4 (H.264), con `poster` | Canela jugando; fachada cuando exista |
| Imágenes | Script Python (`scripts-activos/`) → AVIF/WebP con `srcset` | Peso mínimo |
| Contacto | `tel:` (2 números), `mailto:`, `wa.me` y Facebook cuando estén | Sin backend ni formulario |
| SEO local | JSON-LD `LocalBusiness` / `PetStore`, Open Graph, sitemap | Aparecer en Google |
| Calidad | **Lighthouse**, **Playwright**, **axe-core** | Rendimiento, pruebas, accesibilidad |
| Hosting | **GitHub Pages** (workflow por corregir) | Gratis, HTTPS |

Retirado respecto al plan original: Three.js, Lottie, Lenis y Spline, y los `.glb` **en el navegador**. Blender vuelve el 2026-10-17 solo como **herramienta de producción** (renders), no como parte del sitio.

### Reglas de rendimiento
- Presupuesto: **vista Inicio < 1,5 MB** (hoy 340 KiB en móvil, con los sprites de Canela tras `load`), LCP < 2,5 s en 4G. **El logo debe seguir siendo el LCP de Inicio.**
- **Carga por vista:** solo Inicio se descarga completa de entrada. Carrusel, mapa y video de Nosotros se cargan en el evento de cambio de vista. **GSAP** (desde 2026-10-17) se carga **después de `load`** con un cargador común, porque lo usan la escena de Inicio y la transición entre vistas.
- Fuera de `#productos` no hay tweens ni `requestAnimationFrame` del carrusel; fuera de `#inicio`, no hay los de la escena (nubes, idle de animales, Canela).
- Fallbacks obligatorios: sin JS/GSAP → rejilla de imágenes; `prefers-reduced-motion` y pausa → sin bucles, paralaje ni transiciones; falla el mapa → dirección en texto y enlace.

### Estructura de carpetas
```
hinojosa-web/
├─ public/
│  ├─ img/          # marca/, canela/, productos/<cat>/, animales/ (2026-10-17)
│  └─ video/        # canela-jugando*, fachada (pendiente)
├─ scripts-activos/ # generación de derivados desde Nuevos Req/ (`animales`, `producto <slug>` desde 2026-10-17)
├─ src/
│  ├─ components/   # Barra, BotonContacto, HojaDetalle, Icono, Vista, vistas/ (Inicio, Productos, Nosotros, Visitanos)
│  ├─ data/         # productos.json, negocio.json, textos.json
│  ├─ layouts/
│  ├─ lib/          # router.ts, catalogo.ts, busqueda.ts, hoja-detalle.ts, video-vista.ts, mapa.ts, horario.ts, seo.ts, animacion/
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
| Video de Canela corriendo, MP4 1080p en `flow/` | ✅ Recibido y revisado el 2026-10-14 (`flow/Puppy_running_in_place_1080p_20261013235908.mp4`) | Fuente de los sprites: de él se recortan las piezas arranque, ciclo de carrera y giro |
| Sprite sheets de Canela (arranque, carrera izq./der., giro) | ✅ 2026-10-14, 442 KB (320 px) y 175 KB (160 px) | Inicio, franja inferior |
| Canela jugando (video, con y sin alfa) | ✅ Generado; alfa regenerado 2026-10-16 (cuadros 1–69 en ida y vuelta, 640 KB, `nuevos_req.py video-alfa`) | Nosotros (versión con alfa) |
| 33 renders de producto (`-400`, `-thumb`, `-thumb-80`) | ✅ Generado | Carrusel, lista, sugerencias del buscador, vitrina de Inicio, sellos de Nosotros |
| Trébol del isotipo en SVG (hojas y marca de agua) | ✅ Inline en Inicio y Visítanos | Fondo de Inicio y de Visítanos sin mapa |
| Tarjeta genérica de costal para productos sin imagen | ✅ | Carrusel (P5) |
| Bebedero sin damero | ✅ 2026-10-14: fondo quitado en Paint por el usuario + recorte del blanco en `nuevos_req.py` | Carrusel y lista (P3) |
| Foto / video de la fachada | ❌ Pedir a la dueña | Visítanos |
| Foto del local o del equipo | ❌ Pedir a la dueña | Nosotros ("Nuestra historia") |
| Logo vectorial | ❌ Pedir a la dueña | Afinar paleta y nitidez |
| Fotos reales de producto | ❌ Opcional | Lista del catálogo |

---

## 8. Accesibilidad y usabilidad

Skills que gobiernan esta parte: `wcag-accessibility`, `wcag-audit-patterns` y `nielsen-usability-heuristics`.

### WCAG 2.2 AA — puntos críticos de este diseño
| Criterio | Qué exige aquí |
|---|---|
| 1.4.1 Uso del color | Vista activa en la barra, fila activa de la lista, sugerencia activa del buscador (barra de 4 px) y estado "Abierto/Cerrado": nunca solo color |
| 1.4.3 Contraste | 4.5:1 en texto; el dorado solo como fondo con texto oscuro. Tarjeta del mapa opaca |
| 1.4.11 Contraste no textual | Flechas del carrusel, pestañas y bordes de tarjeta a 3:1 |
| **2.2.2 Pausar, detener, ocultar** | ⚠️ **No se cumple por decisión del usuario (2026-10-15):** Canela (Inicio) y el video de Nosotros van en bucle sin botón de pausa (riesgo 11). El carrusel no autorrota. Con `prefers-reduced-motion` no hay movimiento |
| 2.3.3 Animación por interacción | Toda transición nueva respeta `prefers-reduced-motion` y la pausa del sitio |
| 2.1.1 Teclado | Carrusel, pestañas, flechas, buscador con sugerencias (↑/↓, Enter, Esc), lista completa, hoja de detalle, cambio de vista y mapa operables sin mouse |
| 2.4.3 Orden del foco | Vistas inactivas con `inert`; foco al título al cambiar; lista completa y hoja de detalle devuelven el foco al botón que las abrió |
| 2.4.11 Foco no oculto | La barra, la tarjeta del mapa y la hoja de detalle no tapan el elemento enfocado |
| 2.5.8 Tamaño del objetivo | Mínimo 24×24 px; objetivo real 44×44 px en móvil |
| 3.3.2 Etiquetas | Buscador con etiqueta visible |
| 4.1.2 Nombre, rol, valor | Barra con `aria-current`; producto activo anunciado con `aria-live`; buscador como `combobox` con `listbox`; Detalle / Lista como `tablist`; hoja de detalle como `<dialog>` con nombre |

### Heurísticas de Nielsen — cómo se aplican
1. **Visibilidad del estado:** pastilla de vista activa; el rótulo, la ficha y la fila resaltada siempre coinciden con el producto al frente (C4, C7).
2. **Correspondencia con el mundo real:** el buscador entiende "perro", "pollo", "tilapia" (P1); en pantalla nunca hay marcadores técnicos (V1).
3. **Control y libertad:** hash por vista, botón "atrás", la hoja de detalle se cierra con `Esc`.
4. **Consistencia:** una sola metáfora de transición, un solo sistema de títulos (G3), recuentos coherentes (P4).
5. **Prevención de errores:** precios referenciales; nada de contacto inventado; los botones pendientes no parecen botones.
6. **Reconocer antes que recordar:** las 4 vistas en la barra; sugerencias con foto y precio al buscar; la lista de la categoría a un clic (pestaña Lista); accesos por categoría en Inicio.
7. **Flexibilidad:** carrusel para explorar, buscador para quien sabe qué quiere, accesos directos desde Inicio.
8. **Diseño minimalista:** sin lema repetido; Nosotros con 3 razones en lugar de 4 pilares + 4 diferenciales + 6 valores; la lista completa no compite con el carrusel.
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
| **Blender MCP** (✅ 2026-10-17, servidor de proyecto en `.mcp.json`) | Control de Blender desde Claude: importar la imagen, generar el modelo 3D (`generate_3d`, con clave), iluminar y renderizar. Requiere tener **Blender abierto** (el complemento arranca su servidor en `localhost:9876`). Lo usa `activos-3d-video` |

---

## 10. Agentes

| # | Agente | Responsabilidad | Entregable |
|---|---|---|---|
| 1 | **contenido-estrategia** | Textos por vista, sistema de títulos, campo `animales`, `productos.json`, `negocio.json`, `textos.json` | Copy y datos |
| 2 | **direccion-arte** | Guía de estilo, retícula de cada vista, storyboards de transiciones, barra y carrusel | Guía + tokens + storyboards |
| 3 | **frontend** | Router, 4 vistas, escena de Inicio, buscador con sugerencias, tarjeta de producto (Detalle / Lista), hoja de detalle, accesibilidad | Sitio navegable |
| 4 | **activos-3d-video** | Derivados de `Nuevos Req/` (incluye `Animales/`), imágenes, video, SVG de la escena, **Blender MCP** (modelos 3D de producción y renders de Canela y animales), optimización | `public/` listo |
| 5 | **animacion-interaccion** | **GSAP** como motor: transición entre vistas (timeline), carrusel, barra, nubes y animales de Inicio, Canela, fallbacks | Movimiento integrado |
| 6 | **seo-negocio-local** | Metadatos, JSON-LD (dirección, teléfonos, correo ya confirmados), Open Graph, `alt` | Checklist SEO aplicada |
| 7 | **qa-rendimiento** | Lighthouse, Playwright, axe, teclado, móvil, regresión de movimiento | `docs/qa-informe.md` |
| 8 | **despliegue** | GitHub Pages, dominio, HTTPS | Sitio publicado |

---

## 11. Fases y entregables

| Fase | Trabajo | Estado |
|---|---|---|
| 0. Datos | ✅ 2026-10-16: dirección, 2 teléfonos, correo, nombre de Facebook. ⏳ Faltan: ciudad, WhatsApp, horario, enlace de Facebook, coordenadas/Maps, referencias, precios, historia; logo vectorial y fotos | ⏳ Parcial |
| 1. Diseño | Guía de estilo con contrastes, retícula de las 5 vistas, storyboards | ✅ |
| 2. Base | Astro, router con foco e `inert`, 5 vistas, catálogo desde JSON | ✅ |
| 3. Activos | Derivados de `Nuevos Req/` | ✅ (faltan los de la sección 7) |
| 4. Animación | Carrusel sincronizado, transiciones, Canela, fallbacks | ✅ versión 1 |
| 5. SEO y QA | Metadatos, Lighthouse > 90, axe 0, router 41/41 | ✅ |
| **5-B. Mejoras de la auditoría** | Implementar la sección 0-B por bloques (ver orden abajo) | ✅ 2026-10-14: bloques 1–9, 12, 13 y 4-B + cierre de QA (`docs/qa-informe.md`). ⏳ Bloques 10 y 11 bloqueados (textos y WhatsApp de la dueña) |
| **5-C. Rediseño 0-C** | Bloques 21–26 (Inicio granja, Productos centrado y tarjeta nueva, Nosotros, GSAP, Blender) | ⏳ 2026-10-17: 21–25 hechos (con los ajustes de la tarde y la noche); 26 a medias en la rama `wip/bloque26-transicion`; falta el cierre de QA |
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
| 10 | Sistema de títulos y textos de las 3 razones de Nosotros (en propuesta); franja de marcas (G3, Q2–Q7). Sellos y enlaces de animales ✅ | contenido-estrategia, direccion-arte, frontend | **Sí** (textos) |
| 11 | "Preguntar por este producto" en la ficha y la hoja de detalle, botón WhatsApp en Visítanos (P2, G1) | frontend | **Sí** (cuál número tiene WhatsApp) |
| 12 | Pulidos: G4, G5, V4 | frontend | No |
| 13 | **Reparto del color:** superficies `crema-oscuro`/`hoja-claro` en lugar de blanco, banda `bosque` en cada vista clara, proporción 55/30/15, trazo de pincel maíz bajo los h2, bandas canela oscuro y tono kraft `#E3CFA6` (todo aprobado) | direccion-arte, frontend | No |
| 14 | **Ajustes 2026-10-15:** quitar `BotonPausa` de Inicio y de Quiénes somos (y su espacio reservado); iconos en los botones de Inicio (costal en "Ver productos", pin en "Cómo llegar"); nuevo orden Inicio · Productos · Quiénes somos · Por qué · Visítanos (barra, barra móvil, orden de secciones en el HTML, `VISTAS` en `router.ts`, dirección de transiciones) | frontend, animacion-interaccion | ✅ Hecho 2026-10-15 |
| 15 | **Vista Nosotros (2026-10-16):** une Quiénes somos y Por qué elegirnos (opción A), 4 vistas, `#por-que` como bloque, video con alfa regenerado (cuadros 1–69 en ida y vuelta) | frontend, activos-3d-video | ✅ Hecho 2026-10-16 (commit `120eeae`) |
| 16 | **Productos: ficha del producto (2026-10-16):** carrusel 60 %, buscador con sugerencias, ficha, lista completa en `<dialog>`, "Ver detalle" en móvil | frontend, animacion-interaccion | ✅ Hecho 2026-10-16 (commit `39b18ad`) |
| 17 | **Datos de contacto (2026-10-16):** dirección, 2 teléfonos y correo en `negocio.json`, Visítanos y JSON-LD | contenido-estrategia, frontend, seo-negocio-local | ✅ Hecho 2026-10-16. Falta: ciudad, WhatsApp, horario, enlace de Facebook, coordenadas |
| 18 | **Ajustes 2026-10-16 (2):** hover de la barra con el trazo de pincel maíz que se dibuja (sustituye al fondo hoja-claro) y ficha de Productos en verde bosque | direccion-arte (guía), frontend, animacion-interaccion | ✅ Hecho 2026-10-16 (la guía de estilo aún no lo recoge) |
| 19 | **Ajustes 2026-10-16 (3):** Productos: compra como línea en el pie (1A) y pestañas Detalle / Lista por categoría en lugar de la ventana (2A); barra: trazo a todo el ancho del rótulo, 400 / 250 ms | frontend, animacion-interaccion | ✅ Hecho 2026-10-16 (Lighthouse móvil Productos 96–97, axe 0) |
| 20 | **Ajustes 2026-10-16 (4):** ficha compacta sin scroll (sin Categoría, Marca/Presentación lado a lado, tabla del tilapero en pastillas, selector Detalle \| Lista dentro del cuadro, notas en una línea) y transición suave entre pestañas | frontend, animacion-interaccion | ✅ Hecho 2026-10-16 (37/37 sin scroll a 1440×900 y 1366×650; Lighthouse móvil 96; axe 0) |
| 21 | **Base de herramientas (2026-10-17):** ✅ Blender 4.5 LTS + `uv` + MCP for Blender instalados, registrados y probados; ✅ derivados de los 9 animales (480 y 240 px) y de la sal en grano. ✅ cargador común de GSAP tras `load` (`gsap-carga.ts`), usado por la escena de Inicio y el carrusel. ⏳ Falta: la primera prueba de `generate_3d` con `Canela.png` (necesita clave) y la Canela mejor renderizada | animacion-interaccion, activos-3d-video | Clave de Hyper3D/fal/Tencent o prueba gratuita; permiso de la dueña para subir sus imágenes |
| 22 | ✅ **Hecho 2026-10-17**, con los ajustes de la tarde (video de fondo en canvas, sin tarjeta verde, animales en foto de familia, tilapias en pecera dibujada). Pendiente: el usuario dejó `Nuevos Req/Animales/pecera.jpg` (pecera de vidrio sobre azul, JPG sin alfa) para sustituir la pecera dibujada; decisiones pospuestas del velo en móvil y del color del agua; Canela con Blender pendiente de clave. **Inicio: escena de granja:** quitar vitrina, texto a la izquierda, fondo con cielo, nubes y césped en la paleta (con estanque para las tilapias), los 9 animales con idle, hover en botones y accesos, Canela con mejor render | direccion-arte (retícula y paleta), activos-3d-video, frontend, animacion-interaccion | No |
| 23 | ✅ **Hecho 2026-10-17**; sustituido esa noche por el 23b (retícula 68/32, categorías en fila encima del carrusel, frente ×1,4; vecinos oscurecidos por distancia al frente; en móvil el carrusel no se agranda por M5). **Productos: carrusel grande y centrado** con frente más grande y vecinos sombreados | direccion-arte, frontend, animacion-interaccion | No |
| 24 | ✅ **Hecho 2026-10-17** (tarjeta crema con hojas y huellas, Detalle/Lista dentro, 37/37 sin scroll; píldora "Cómo llegar"). **Productos: tarjeta nueva** (maqueta `Nuevos Req/tarjeta/`) con Detalle y Lista, enlace "Cómo llegar" vistoso, sal en grano en el carrusel | direccion-arte, frontend, activos-3d-video | No |
| 25 | ✅ **Hecho 2026-10-17.** **Nosotros:** banda inferior solo con iconos de animales | frontend | No |
| 26 | ⏳ **A medias (2026-10-17):** implementación en la rama `wip/bloque26-transicion` (commit `883426f`: `vistas.ts`, `router.ts`, `gsap-carga.ts`, `escena-lienzos.ts`); el agente se cortó por el límite de uso mientras comparaba Lighthouse con la versión base. Falta verificarla entera antes de llevarla a `HinoV2`. **Transición entre vistas con timeline de GSAP** (más fluida, interrumpible, escena de Inicio compartida), actualizar `vistas-hinojosa` y las pruebas 13–16 | animacion-interaccion, qa-rendimiento | No |
| Cierre | Lighthouse móvil (Inicio ≥ 99, Productos ≥ 93), pruebas del router de `vistas-hinojosa`, axe 0, capturas comparativas. Tras los bloques 15–17 y **21–26** hay que repetir el cierre completo (Inicio con GSAP y escena: el logo debe seguir siendo el LCP) | qa-rendimiento | ⏳ |

---

## 12. Riesgos y decisiones abiertas

1. **Datos faltantes:** ya hay dirección, teléfonos y correo (2026-10-16). Faltan ciudad, WhatsApp, horario, enlace de Facebook, coordenadas e historia. No se publica hasta confirmar al menos ciudad y horario.
2. **Navegación solo por barra:** decidido no añadir rueda ni deslizamiento. Riesgo: usuarios que intenten bajar con la rueda. Vigilar en las pruebas con usuarios; si aparece el problema, reconsiderar los enlaces "Siguiente →".
3. **LCP de Inicio con la vitrina:** si los costales superan al logo en área, cambia el LCP. Límite de 24dvh o inyección tras `load`.
4. **Clips de Canela generados con IA:** riesgo de que la gorra, el collar o la cara cambien durante el giro, o de que Canela avance por el cuadro. Se generan varias variantes y se revisa con la lista de `flow/PROMPTS.md`. Si el giro no sale bien, alternativa: frenar → sprite del ciclo espejado con un fundido muy corto. Peso de los sprites: si superan 450 kB, se reduce la altura o los cuadros por segundo (12 fps es suficiente).
5. **Regla M5 del carrusel:** la tarjeta provisional del primer montaje no se toca al añadir fundidos (C1). Lighthouse móvil baja a 86 si se rompe.
6. **SEO con una sola pantalla visible:** las 4 vistas completas en el HTML servido, incluidas las listas de productos de las 4 categorías (en el panel Lista; las ocultas están en el HTML aunque Google puede darles menos peso).
7. **Pausa global y transiciones:** hoy `data-movimiento="pausado"` no anula `transition`; todo lo nuevo debe condicionarse.
8. **Navegadores sin probar:** Safari iOS (alfa del video, cancelación de transiciones de la barra) y Firefox; lector de pantalla real.
9. **Precios cambiantes y derechos de imágenes:** JSON editable y confirmación con la dueña.
10. **Mantenimiento:** definir quién actualiza precios y catálogo.
11. **Sin botones de pausa (decisión del usuario, 2026-10-15):** Canela corriendo en Inicio y el video de Nosotros se mueven en bucle durante más de 5 s sin control para pausarlos. **Incumple WCAG 2.2.2 (nivel A)**: una auditoría de accesibilidad lo marcará como fallo, y puede molestar a personas con déficit de atención o sensibilidad al movimiento. Mitigación parcial: con `prefers-reduced-motion` no hay movimiento. Alternativas descartadas por ahora: un solo control global "Pausar animaciones", o que el movimiento se detenga solo antes de 5 s.
12. **Video con alfa en Safari/iOS:** no se reproduce; se ve el póster de Canela sentada. No probado en un Safari real.
13. **Ramas:** desde el 2026-10-17 se trabaja en `HinoV2`; `Ariel` ya no se usa; `main` recibe `HinoV2` solo cuando el usuario lo pide (primer envío el 2026-10-17). Cada push a `main` dispara el workflow de Pages, **que sigue roto** (sube `sitio-web/`): falla y Pages sigue con la versión vieja. El trabajo sin verificar va en ramas `wip/…`.
14. **Escena de Inicio vs. LCP y peso:** nubes, césped y 9 animales. Derivados ya hechos (AVIF ≈ 300 KB a 480 px, ≈ 115 KB a 240 px), cargados tras `load`; el logo sigue siendo el LCP; presupuesto de Inicio < 1,5 MB; medir Lighthouse móvil (hoy 99). En móvil, menos animales o ninguno si no caben.
15. **Logo sobre fondo claro:** el logo se diseñó para verde oscuro. Si el cielo claro lo apaga, la columna de texto lleva un panel bosque. Comprobar contraste y legibilidad.
16. **GSAP en toda la página:** más JS en Inicio y en cada cambio de vista; vigilar INP, el cargador diferido, la regla M5 de Productos y las pruebas de 0 `requestAnimationFrame` fuera de las vistas que lo usan. Con la pausa y `prefers-reduced-motion` no puede haber bucles.
17. **Blender MCP:** instalado y probado (2026-10-17), pero **solo funciona con Blender abierto** y `generate_3d` depende de servicios externos con clave o cuota, a los que **se suben las imágenes** (permiso de la dueña); la calidad (gorra, "H", pelaje) puede no alcanzar la de los renders del cliente. Plan B: Flow y los sprites actuales. Derechos de uso de lo generado por confirmar con la dueña.
18. **Cielo sin azul:** la paleta no tiene azul; el cielo va en crema y verde muy claro. Si el usuario lo quiere azul, es un color nuevo que requiere aprobación y recalcular contrastes.
19. ~~Cuyes sin imagen~~: ✅ añadidos el 2026-10-17 (`Animales/cuyes.png`).

20. **Sin aviso legal en Productos (decisión del usuario, 2026-10-17):** ya no se muestra "Precios referenciales — consulta disponibilidad" ni "Marcas registradas de sus respectivos propietarios". Los precios de los afiches pueden estar desactualizados y las marcas son de terceros; si se quiere cubrir, se puede mover a una línea del pie de Visítanos o al texto de la hoja de detalle (pendiente de decidir).
---

## 13. Checklist

- [x] Dirección, teléfonos y correo (2026-10-16)
- [ ] Confirmar el resto de datos del negocio (sección 1): ciudad, WhatsApp, horario, enlace de Facebook, coordenadas, referencias, una línea de historia
- [ ] Obtener logo en vectorial
- [ ] Fotos del local, la fachada y (opcional) el equipo
- [ ] Aprobar los textos del sistema de títulos (sección 3) y las 3 razones de Nosotros (en propuesta)
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
- [x] Vista Nosotros (bloque 15) y ficha de Productos (bloque 16), 2026-10-16
- [ ] Repetir el cierre de QA tras los bloques 15–17
- [ ] Corregir el workflow de despliegue (sin publicar desde `main` por ahora)
- [x] Plan, agentes y skills actualizados con el rediseño 0-C (2026-10-17)
- [x] Instalar Blender 4.5 LTS, `uv` y registrar Blender MCP en `.mcp.json` (2026-10-17, probado con `get_scene_info`)
- [x] Reducir los 9 animales y regenerar la sal en grano (2026-10-17)
- [ ] Clave para `generate_3d` (o prueba gratuita de Rodin) y permiso de la dueña para subir imágenes; primera prueba con `Canela.png`
- [x] Bloques 21–25 (2026-10-17): Inicio con video y animales, Productos (23b), tarjeta nueva con descripciones, Nosotros
- [ ] Bloque 26: terminar y verificar la transición de `wip/bloque26-transicion`
- [ ] Aprobar las 37 descripciones cortas de productos (en propuesta) y los casos dudosos
- [ ] Usar `Nuevos Req/Animales/pecera.jpg` en lugar de la pecera dibujada de Inicio
- [ ] Decidir dónde va el aviso de precios referenciales y marcas (riesgo 20)
- [ ] Confirmar con el usuario: Blender solo para renders (0-C). (Cielo sin azul: ya no aplica, el fondo es un video; cuyes ✅)
- [ ] Repetir el cierre de QA tras los bloques 21–26
- [ ] **Decidir al final (pospuesto por el usuario, 2026-10-17):** (1) en móvil, el velo que hace legible el texto de Inicio oscurece bastante el cielo del atardecer; para ver más cielo habría que bajar el bloque de texto o agrandar el acento. (2) El agua de la pecera de las tilapias es verdosa porque la paleta no tiene azul; agua azul = color nuevo con aprobación
