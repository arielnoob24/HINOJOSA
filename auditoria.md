# Auditoría de UI, UX y movimiento — Comercial Hinojosa

> Fecha: 2026-10-13 · Rama `Ariel` (al día con `main`) · Sitio probado en `http://localhost:4321`
> Hecha con tres agentes: **direccion-arte** (diseño visual), **qa-rendimiento** (experiencia de usuario, con Playwright y capturas reales) y **animacion-interaccion** (transiciones, medidas fotograma a fotograma con Chrome).
> No se modificó código. Las capturas están en [hinojosa-web/capturas/auditoria/](hinojosa-web/capturas/auditoria/).

> **Decisiones tomadas sobre esta auditoría:** ver `PLAN.md` §0-B. En resumen: Inicio con **vitrina lateral** (no hero partido), acento "Tu mejor aliado para tus animales", transición **A + entrada escalonada**, navegación **solo por barra** (se descartan G2 "Siguiente →", N3 y Q5), sistema de títulos aprobado en principio (textos pendientes), "Nuestra historia" cuando haya datos y **hoja de detalle** en móvil. **I8 queda sustituido:** Canela pasa a ser una carrera real de borde a borde, con clips generados en Google Flow (`flow/PROMPTS.md`).

**Cómo leerla:** cada hallazgo lleva un código (I = Inicio, N = Nosotros, P = Productos, Q = Por qué, V = Visítanos, G = Global, T = Transiciones, B = Barra, C = Carrusel), una **severidad** (alta / media / baja), el tipo (**UI** visual, **UX** experiencia, **MOV** movimiento) y debajo **→ Recomendación**. Lo marcado con 🔒 cambia textos o la guía de estilo y necesita el visto bueno de la dueña.

---

## Resumen ejecutivo

1. **Inicio se siente simple porque no usa los activos que ya tenemos.** Muestra logo + el lema repetido + 6 granos diminutos + una Canela de 112 px. Los 33 renders de producto y la Canela grande no aparecen, y la pantalla no dice qué se vende, para qué animales ni cuál es el siguiente paso. Hay margen de peso de sobra (142 kB de 1,5 MB).
2. **No hay ningún camino de contacto en todo el sitio.** Productos dice "Consulta precio" 21 veces sin dónde consultar, y Visítanos enseña el marcador técnico `PENDIENTE_CONFIRMAR` siete veces con botones que parecen rotos.
3. **Las transiciones existen pero se perciben como un corte.** Al cambiar de vista la saliente desaparece en seco y se ve un destello de fondo crema (muy visible al salir de Inicio, que es verde). La curva llega al 87 % en 156 ms, así que los 400 ms se sienten como 150.
4. **El carrusel "cambia de golpe" por causas concretas y medidas:** el rótulo parpadea a mitad de giro, la fila de la lista se resalta 240 ms *antes* de que gire el anillo, y al cambiar de categoría las imágenes se destruyen y recrean (aparece una silueta crema y luego la imagen de golpe).
5. **El buscador no entiende cómo busca la gente:** "perro" encuentra solo un comedero; "tilapia", "pez", "gallina" y "procan" dan 0 resultados.

---

## 1. Inicio

Capturas: [escritorio](hinojosa-web/capturas/auditoria/inicio-1440x900.png) · [móvil](hinojosa-web/capturas/auditoria/inicio-360x640.png) · [1366×650](hinojosa-web/capturas/auditoria/inicio-1366x650.png)

**Lo que funciona:** la retícula de dos filas impide que Canela tape el texto; un solo CTA dorado con buen contraste; el logo es el LCP (Lighthouse 99); pausa y movimiento reducido bien resueltos (Canela queda sentada, no congelada fuera de pantalla).

**I1 · Alta · UI/UX — No hay nada que mirar ni que aprender aparte del logo.**
La composición es un bloque centrado sobre un degradado liso. La insignia ocupa ~35 % del alto, el logo ya está en la barra, y el único texto informativo es "Venta de balanceados y productos para tus animales". No se ve qué productos hay ni para qué animales.
→ **Recomendación (dos caminos):**
- **A. "Vitrina lateral" (sin cambiar la estructura):** en escritorio (≥ 64rem), 2 costales reales a cada lado del bloque central, apoyados en el horizonte de la franja: izquierda `granja/pollos` + `mascotas/procan-adultos`, derecha `granos/maiz-en-grano` + `granja/cerdos`. Versiones `-400.avif` (~16 kB c/u, ~64 kB total), `aria-hidden`, `fetchpriority="low"`, rotación ±4–6°, el de atrás más pequeño y tintado (misma regla de profundidad que el carrusel) y con `data-profundidad` para que entren en el paralaje. Anticipa el carrusel y da motivo para pulsar "Ver productos".
- **B. Hero partido 🔒 (más ambicioso):** izquierda, un `h1` de texto que diga lo que se ofrece ("Balanceados y alimento para tus animales de granja y mascotas"), el lema una sola vez como antetítulo y los CTA; derecha, Canela grande (`canela.avif` 460×600, 24 kB) sentada sobre la tarima del carrusel con 3 costales en abanico detrás. La franja inferior pierde entonces a Canela cruzando (si no, sale dos veces). ~90 kB.

**I2 · Alta · UI (rendimiento) — Si los costales salen más grandes que el logo, pasan a ser el LCP.**
→ Limitar cada costal a ≤ 24dvh de alto o inyectarlos tras `load` (como ya hace `carrusel-carga.ts`). Repetir Lighthouse móvil (hoy 99).

**I3 · Alta · UX — Un solo siguiente paso.** Solo existe "Ver productos". Lo que más busca quien visita una tienda local es dónde está, a qué hora abre y cómo contactar.
→ CTA secundario "Cómo llegar" → `#visitanos` (o WhatsApp cuando esté confirmado). Añadir 4 accesos por categoría (Granja · Mascotas · Comederos · Granos) que abran Productos con esa pestaña ya elegida.

**I4 · Media · UI/UX — El lema está duplicado.** El logo ya dice "NUTRICIÓN QUE DA VIDA" y debajo se repite en manuscrita ([VistaInicio.astro:64](hinojosa-web/src/components/vistas/VistaInicio.astro#L64)).
→ 🔒 Sustituirlo por un eslogan secundario real de `negocio.json`: **"Tu mejor aliado para tus animales"**. Hay que regenerar el subconjunto de Caveat Brush (comando comentado en `global.css:17-24`).

**I5 · Media · UX — No se ve para qué animales es.** Los 8 animales solo aparecen en la vista 4.
→ Debajo del CTA, una fila informativa de iconos (ya existen en `Icono.astro`): "Aves · Cerdos · Mascotas · Tilapias". En móvil ocupa justo los ~87 px de aire muerto que hoy quedan entre el CTA y la franja.

**I6 · Media · UI — El aro exterior de la insignia no se ve.** El `box-shadow` de 12 px en `bosque` ([VistaInicio.astro:125](hinojosa-web/src/components/vistas/VistaInicio.astro#L125)) cae sobre un fondo también `bosque`.
→ `0 0 0 4px var(--color-maiz), 0 0 0 10px var(--color-bosque-noche), 0 0 0 12px var(--color-horizonte-fuerte)`.

**I7 · Media · UI — Los granos del fondo no suman.** Son 6 SVG de 12–20 px: a 1440 px son motas imperceptibles.
→ 3 granos de 24–36 px (cerca) + 4–5 hojas del trébol del logo (lejos, `hoja` al 20–30 %) + una marca de agua del trébol del isotipo a ~70dvh y opacidad 0,05 detrás de la insignia. SVG inline, < 3 kB en total.

**I8 · Media · UI/MOV — Canela está sentada en el render pero cruza de lado "deslizándose".** No hay animación de caminata; la franja de ~140 px pasa casi siempre vacía y Canela mide 86×113 px.
→ Que el bucle respete la pose: entra a saltitos, **se sienta 1,5–2 s** en el centro-izquierda (con un "respiro" `scale(1, 1.02)`) y sigue. Coste casi nulo. Y bajar el retraso inicial de 1,2 s a 0,6 s solo en la primera visita, para que se vea antes.

**I9 · Baja · MOV — Nada se mueve al entrar.**
→ Tras el LCP: lema, subtítulo y CTA en cascada (`opacity` + `translateY(12px)`, 80 ms entre cada uno, 400 ms); los costales suben desde el horizonte en 600 ms. El logo no se anima. Nada con movimiento reducido.

> **Nota:** el video con alfa de Canela (1,15 MB) **no** se recomienda en Inicio: deja el peso al límite y Safari no reproduce alfa VP9.

---

## 2. Quiénes somos

Capturas: [escritorio](hinojosa-web/capturas/auditoria/nosotros-1440x900.png) · [móvil](hinojosa-web/capturas/auditoria/nosotros-360x640.png) · [móvil final](hinojosa-web/capturas/auditoria/nosotros-360x640-final.png)

**Lo que funciona:** mosaico que se entiende de un vistazo, todo visible sin clics; alternancia Misión blanca / Visión verde; la frase sobre banda opaca; video con botón de pausa; cabe sin scroll en escritorio.

**N1 · Alta · UI — El video corta la gorra de Canela.** `object-fit: cover` en una caja ancha y baja recorta ~60 px arriba y abajo a 1440×900 ([VistaNosotros.astro:123-129](hinojosa-web/src/components/vistas/VistaNosotros.astro#L123-L129)).
→ Mínimo: `object-position: 50% 20%`. Mejor: `object-fit: contain; object-position: 50% 100%` y fondo de la caja del mismo gris del video (medirlo en el póster) para que no se note el marco.

**N2 · Media · UI — El fondo gris de estudio del video parece un rectángulo de stock pegado** y rompe la paleta cálida.
→ Ideal: usar `canela-jugando-alfa.webm` sobre `crema-oscuro` con un "suelo" `hoja-claro` (con respaldo de póster en Safari). Si se queda con fondo, al menos 12 px de padding crema para que se vea enmarcado.

**N3 · Media · UX — La vista termina sin salida.**
→ Enlace al pie de la tarjeta grande: "Mira lo que ofrecemos →" hacia `#productos`.

**N4 · Media · UX 🔒 — Contenido corporativo y poco local.** Misión y visión son genéricas; un cliente de barrio valora más quién atiende y desde cuándo.
→ Con datos de la dueña, cambiar "Visión" por "Nuestra historia" (año de apertura, familia) y, cuando haya, una foto real del local o del equipo.

**N5 · Media · UI/UX — Los 6 valores son tarjetas idénticas en rejilla,** y además se solapan con "Por qué elegirnos": "calidad" sale en 4 sitios entre las dos vistas, y el patrón "icono en círculo verde claro" se repite 18 veces en dos vistas seguidas.
→ Pasar los valores a **una sola banda** (`crema-oscuro`, 6 × "icono 28 px + palabra" separados por un punto dorado). Recupera ~60 px que pueden ir al video (alivia N1). Repartir el discurso: Nosotros = identidad (historia, valores); Por qué = pruebas concretas.

**N6 · Baja · UI — Misión y Visión enteras en Nunito ExtraBold** pesan demasiado y compiten con la frase de marca.
→ Texto en Nunito 400 a `text-lead`; mantener el antetítulo en 800.

**N7 · Baja · UI — El hover gira −1° en todas las tarjetas,** lo que sugiere que Misión y Visión son pulsables.
→ Tilt (hasta los 3° del token `--tilt-max`) solo en la tarjeta grande y la banda de valores; en Misión/Visión solo elevación `translateY(-4px)` + sombra.

**N8 · Baja · UI (móvil) — El video ocupa ~143 px y Canela sale diminuta;** los valores quedan bajo el pliegue (686 / 524 px).
→ Con N5 se liberan ~40 px; dárselos al video (`aspect-ratio: 16/8`).

---

## 3. Productos

Capturas: [escritorio](hinojosa-web/capturas/auditoria/productos-1440x900.png) · [móvil](hinojosa-web/capturas/auditoria/productos-360x640.png) · [buscar "maiz"](hinojosa-web/capturas/auditoria/flujo-buscar-maiz-1440.png) · [sin resultados](hinojosa-web/capturas/auditoria/flujo-buscar-vacio-1440.png) · [producto sin imagen](hinojosa-web/capturas/auditoria/flujo-producto-sin-imagen-1440.png) · [toque en fila, móvil](hinojosa-web/capturas/auditoria/flujo-movil-tap-fila-360.png)

**Lo que funciona:** pantalla partida 55/45; pestañas con recuento; rótulo con precio y posición; fila activa con barra de 4 px; buscador con etiqueta visible, botón de borrar y estado vacío; cabeceras pegajosas; flechas, arrastre y clic en laterales responden bien.

> Las transiciones del carrusel están en la sección 7.

**P1 · Alta · UX — El buscador no entiende cómo busca la gente.** "perro" → solo el comedero; "tilapia", "pez", "gallina", "procan" → 0. Solo compara nombre, marca, presentación y categoría ([catalogo.ts:240-245](hinojosa-web/src/lib/catalogo.ts#L240-L245)). Y la vista 4 promete "Para aves, cerdos, mascotas y tilapias".
→ Añadir a cada producto en `productos.json` un campo `animales`/`etiquetas` (perro, gato, ave/pollo/gallina, cerdo, vaca, cuy, conejo, tilapia/pez) e incluirlo en `data-busqueda`. Comparar ignorando guiones y espacios ("procan" = "pro-can") y tolerar singular/plural. Si no hay resultados, ofrecer las 4 categorías como atajos.

**P2 · Alta · UX — Ningún producto lleva a un siguiente paso.** 21 de 37 dicen "Consulta precio" y no hay dónde.
→ Botón **"Preguntar por este producto"** junto al rótulo. Con WhatsApp confirmado, abre `wa.me` con el nombre del producto en el mensaje; mientras tanto, "¿Dónde comprarlo? → Visítanos".

**P3 · Alta · UI — Al bebedero se le ve el damero "transparente" pintado** en el carrusel y en la miniatura. Parece un error.
→ Hasta que llegue el PNG con alfa real: mostrarlo en placa con un recorte que deje fuera el damero, o como tarjeta `sin-imagen`.

**P4 · Media · UX — Los recuentos no coinciden.** Con "maiz" el grupo sigue diciendo "7 productos" aunque se ven 3; la pestaña dice "Mascotas (16)" y el carrusel "x de 12" (los 4 sin imagen no entran).
→ "3 de 7" al filtrar; en el rótulo aclarar "12 con foto" o igualar la cifra de la pestaña. Corregir también "1 productos" (singular/plural en `textos.json` → `productos.conteo`).

**P5 · Media · UX — Elegir un producto sin imagen deja una imagen equivocada al frente** y un separador colgando ("Alimento Mascotas ·") ([catalogo.ts:131-135](hinojosa-web/src/lib/catalogo.ts#L131-L135)).
→ Tarjeta genérica (costal con el nombre) al frente para esos 4 productos, y ocultar el "·" sin posición.

**P6 · Media · UX (móvil) — El buscador queda bajo el pliegue y tocar una fila no da señal:** el carrusel gira ~2000 px más arriba, fuera de la vista.
→ Buscador encima del carrusel (o acceso "Buscar en la lista" bajo las pestañas). Al tocar una fila en móvil, abrir una **hoja de detalle** (imagen, precio, "Preguntar") en vez de girar un carrusel invisible.

**P7 · Media · UI — El producto al frente se ve pequeño en escritorio:** tarjeta de 240 px en un escenario de ~540 px.
→ En ≥ 64rem: `--carrusel-ancho: clamp(11.25rem, 24dvh, 15rem)`. Comprobar que el anillo de 12 de Mascotas no se recorte.

**P8 · Baja · UX — El carrusel no sigue a la búsqueda** (con "maiz" sigue en Camperito).
→ Llevar al frente el primer resultado.

**P9 · Baja · UX — En móvil un deslizamiento corto salta 5 productos** y las flechas tapan los renders.
→ Limitar la inercia a 1–2 posiciones por gesto; sacar las flechas fuera del escenario o bajarlas junto al rótulo.

**P10 · Baja · UI — Miniaturas de 40 px** (los costales con texto son manchas) y el recuento "(9)" de la pestaña pesa igual que el nombre.
→ 48 px en ≥ 48rem (ya existen `-thumb.webp` de 160 px); recuento con `opacity: .75` en pestañas inactivas.

---

## 4. Por qué elegirnos

Capturas: [escritorio](hinojosa-web/capturas/auditoria/por-que-1440x900.png) · [móvil](hinojosa-web/capturas/auditoria/por-que-360x640.png) · [móvil final](hinojosa-web/capturas/auditoria/por-que-360x640-final.png)

**Lo que funciona:** orden claro en tres bandas de peso distinto (pilares, diferenciales, animales); iconos dorados sobre verde con buen contraste; animales con icono + palabra; sin cifras inventadas.

**Q1 · Media · UI — Es la única vista sin ninguna imagen;** solo iconos de línea, la que más parece plantilla.
→ Junto a Aves, Cerdos, Vacas y Cuyes, el costal real de esa especie (`-thumb-80`, ~4 kB c/u) como sello de 40 px. 🔒 Alternativa: Canela asomando por el borde de la banda verde (la guía hoy la limita a Inicio y Nosotros).

**Q2 · Media · UX — Promete sin demostrar.** "Ubicación estratégica" no dice dónde; "Naturales" y "Sostenibles" no tienen respaldo.
→ 🔒 Cambiar 1–2 diferenciales por pruebas: una **franja de marcas que distribuyen** (Pro-Can, Nutritivos, Bio Alimentar, Mascan… ya están en el catálogo) y "Ubicación" enlazada a `#visitanos`.

**Q3 · Media · UI/UX 🔒 — Diferencial redundante:** "Para aves, cerdos, mascotas y tilapias" repite justo la fila de animales.
→ Sustituirlo por "Granja, mascotas, comederos y granos" (las 4 categorías reales).

**Q4 · Media · UX — Los animales parecen enlaces y no lo son.** El usuario espera que "Perros" lo lleve a productos de perros.
→ Convertirlos en enlaces a `#productos` filtrado por animal (depende de las etiquetas de P1).

**Q5 · Media · UX — La vista termina sin salida.**
→ CTA final: "Ver productos" o "Cómo llegar".

**Q6 · Baja · UI — El título salta de posición:** `justify-content: center` lo hace flotar a media altura, mientras en las otras vistas va arriba.
→ Título siempre arriba y centrar solo el grupo de bandas con `margin-block: auto`.

**Q7 · Baja · UX 🔒 — En móvil se ocultan las descripciones de los pilares;** quedan 4 palabras sueltas. Y en escritorio esas descripciones son relleno ("Productos en los que confías").
→ Frases concretas validadas con la dueña y visibles también en móvil (una línea), o quitarlas en ambos y subir el icono a 72 px.

---

## 5. Visítanos

Capturas: [escritorio](hinojosa-web/capturas/auditoria/visitanos-1440x900.png) · [móvil](hinojosa-web/capturas/auditoria/visitanos-360x640.png) · [móvil final](hinojosa-web/capturas/auditoria/visitanos-360x640-final.png)

**Lo que funciona:** mapa a sangre + tarjeta 100 % opaca; pastilla de estado con icono + palabra; jerarquía de botones correcta; no hay enlaces rotos ni datos inventados; estado abierto/cerrado listo para cuando haya horario.

**V1 · Alta · UI/UX — Se ve el marcador técnico `PENDIENTE_CONFIRMAR` siete veces** ([BotonContacto.astro:39](hinojosa-web/src/components/BotonContacto.astro#L39), [VistaVisitanos.astro:87-105](hinojosa-web/src/components/vistas/VistaVisitanos.astro#L87-L105)), con 4 pastillas de borde discontinuo que parecen botones y no hacen nada. Es la vista que más parece rota.
→ Dejar el marcador solo en los datos. En pantalla usar el texto que ya existe, `textos.comunes.datoPendiente` ("Muy pronto publicaremos este dato."), y agrupar los 4 canales pendientes en **una sola línea** ("Pronto publicaremos WhatsApp, teléfono y Facebook") con sus iconos en gris, sin forma de botón.

**V2 · Alta · UX — El mapa y la tarjeta se contradicen:** el mapa dice "La dirección está en la tarjeta" y la tarjeta dice "Dirección: PENDIENTE_CONFIRMAR".
→ Cambiar el texto del mapa por "El mapa aparecerá cuando confirmemos la ubicación" y pedir la dirección a la dueña como primera prioridad (los afiches ya traen "Av. del Chofer y Rubén Lerson", sin confirmar).

**V3 · Media · UI — Sin coordenadas, el mapa es un papel cuadriculado frío** que ocupa el 70 % de la pantalla.
→ Fondo `crema` con la textura de hojas/granos de Inicio al 8 %, pin más grande (4–5 rem) y una tarjeta "Muy pronto, el mapa" con el isotipo. **No** dibujar calles falsas (podrían leerse como ubicación real). Cuando llegue la foto de la fachada, puede ocupar ese espacio.

**V4 · Baja · UX — Etiquetas en conflicto:** "Cómo llegar" es el nombre del CTA en la guía y a la vez el título de las referencias; el código dice "Abrir en Maps".
→ CTA = "Cómo llegar"; el dato = "Referencias".

---

## 6. Global (barra y sistema)

**Lo que funciona:** una sola metáfora de transición; la pastilla deslizante de la barra ya existe y cumple "no solo color"; radios y sombras coherentes; proporción 60/30/10 respetada; Inicio oscuro como portada y el resto crema es coherente.

**G1 · Alta (bloqueado por datos) · UX — No hay forma de contactar en todo el sitio.**
→ Cuando estén confirmados: acceso fijo a WhatsApp / "Cómo llegar" a la derecha de la barra en escritorio y en la barra superior móvil (que hoy solo muestra el logo).

**G2 · Media-alta · UX — Solo se puede navegar con la barra.** La rueda del ratón y el deslizamiento no hacen nada (comprobado) y ninguna vista indica cuál sigue. Quien viene de webs normales gira la rueda y "no pasa nada".
→ Al pie de cada vista, un enlace discreto **"Siguiente: Quiénes somos →"** (ancla real al hash siguiente). Opcional: rueda/deslizamiento para cambiar de vista solo en vistas sin scroll interno, con umbral, sin interferir con el carrusel ni la lista.

**G3 · Media · UI 🔒 — Los títulos de vista no siguen un patrón** (unos repiten el nombre de la barra, otros son frases, uno con signos y manuscrita…).
→ Sistema único: **antetítulo** con el nombre de la barra (mayúsculas, 800, `canela-oscuro`) + **h2** como frase corta. Ej.: "QUIÉNES SOMOS / Somos parte de tu familia", "PRODUCTOS / Lo que tenemos para tus animales". Visítanos ya lo cumple.

**G4 · Baja · UI — "COMERCIAL" en la barra va a 11 px** ([Barra.astro:39](hinojosa-web/src/components/Barra.astro#L39)), por debajo del mínimo de 13 px de la propia escala.
→ 0.75rem con `tracking-[0.16em]`.

**G5 · Baja · UI/UX (móvil) — Las dos barras suman 116 de 640 px (18 %),** y "Por qué" suelto es ambiguo.
→ Barra superior a 44 px e isotipo a 32 px en < 48rem. Etiqueta "Ventajas", o mantener "Por qué" con nombre accesible completo.

---

## 7. Movimiento y transiciones (lo que pediste)

Reglas para todo lo nuevo: animar solo `transform` y `opacity` (salvo anchos pequeños y aislados); respetar **`prefers-reduced-motion` y la pausa del sitio** (`html[data-movimiento="pausado"]`, que hoy anula `animation` pero **no** `transition` → [global.css:120-124](hinojosa-web/src/styles/global.css#L120-L124)); el foco sigue moviéndose antes de cualquier animación.

### 7.1 Transiciones entre vistas

**Qué pasa hoy (medido):** [vistas.ts:22-40](hinojosa-web/src/lib/animacion/vistas.ts#L22-L40) anima solo la vista entrante (`translate ±3rem` + opacidad, 400 ms) y **no devuelve promesa**, así que el router oculta la saliente antes del primer pintado. Resultado:

**T1 · Alta · MOV — Corte a fondo vacío.** La saliente desaparece en seco y la entrante parte de opacidad 0: durante unos fotogramas solo se ve el crema del `body`. Muy visible al salir de Inicio (verde → crema de golpe).

**T2 · Media · MOV — La duración percibida es ~150 ms, no 400.** Opacidad de la entrante: 0,34 a 56 ms, 0,87 a 156 ms. Los 48 px de desplazamiento casi no se perciben: se lee como "cambio de golpe con parpadeo".

→ **Opciones evaluadas:**

| Opción | Qué es | Veredicto |
|---|---|---|
| **A. Fundido cruzado direccional en dos capas** | Saliente: opacidad 1→0 y se aparta 1rem en sentido contrario, 160 ms, `ease-salida`. Entrante: entra desde 2,5rem en la dirección del cambio, 380 ms con 60 ms de retraso, `cubic-bezier(0.25,1,0.5,1)`. Total 440 ms. | ✅ **Recomendada.** Mantiene la metáfora izquierda↔derecha de la barra y elimina el destello. Solo CSS + devolver una `Promise` en `vistas.ts` (el router ya sabe esperarla). Complejidad baja. |
| **A+. Entrada escalonada** (complemento de A) | Título, bloque principal y secundario entran desde 1,5rem en la misma dirección, 300 ms, 50 ms entre bloques. | ✅ Si quieres más "vida". Hay que marcar bloques en las 5 vistas. Complejidad media. |
| B. Fundido + escala 0,98→1 | Sin dirección. | ❌ Pierde el modelo espacial que enseñan la barra y las flechas ←/→. |
| C. Cortina de color de marca | Panel verde barre la pantalla. | ❌ Vistosa pero cansa en un sitio donde se cambia de vista a menudo, retrasa el contenido 200 ms y es riesgo vestibular (WCAG 2.3.3). Como mucho, solo en la primera entrada. |
| D. View Transitions API | Implementación nativa de A con capturas. | ⏳ Mejora futura: el foco llega un fotograma tarde y los clics rápidos se pierden ~400 ms. |

Con movimiento reducido o pausa: corte seco, como hoy.

### 7.2 Botones de la barra

**Qué hay hoy:** ya existe una **pastilla que se desliza** entre ítems (300 ms) y en móvil rodea el icono. Medí que sí se desliza, pero:

**B1 · Media · MOV — Los rótulos saltan.** Al activarse, el enlace pasa a negrita 800 y cambia de ancho (Inicio 68→65 px, Visítanos 94→99 px): los vecinos se mueven ~5 px en seco.
→ Reservar el ancho en negrita con un pseudo-elemento invisible (`content: attr(data-texto)`, `height: 0`, `visibility: hidden`) dentro de cada rótulo.

**B2 · Media · MOV — La clase `.anima` se quita a mitad de la animación** porque el `ResizeObserver` detecta el cambio de ancho ([vistas.ts:72-74](hinojosa-web/src/lib/animacion/vistas.ts#L72-L74)). En Chrome no se nota, pero en Safari/Firefox la pastilla podría saltar.
→ Se arregla con B1; como red de seguridad, no quitar `.anima` hasta el `transitionend`.

**B3 · Media · MOV — Texto "fantasma":** el texto del ítem nuevo se vuelve blanco antes de que llegue la pastilla (blanco sobre crema), y en saltos largos (Inicio↔Visítanos) hay un destello.
→ Versión pulida: **inversión exacta del texto** como el control segmentado de iOS (copia `aria-hidden` del menú en blanco, recortada con `clip-path` usando las mismas variables de la pastilla). Versión barata: retrasar el cambio de color 150 ms (`transition: color 0s linear 150ms`).

**B4 · Media · MOV — No hay respuesta al pulsar** (en móvil, sin hover, el toque no da ningún retorno hasta que llega la vista).
→ Recomendación de animación de la barra:
- **Estiramiento direccional** de la pastilla: el borde que va delante llega antes (240 ms) que el de atrás (300 ms). Da sensación de "estirarse" hacia el destino. `vistas.ts` ya conoce la dirección.
- **Hover (escritorio):** fondo `hoja-claro` en 150 ms además del subrayado.
- **Pulsación:** `scale(0.96)` en 90 ms, como `.boton`.
- **Móvil:** fondo `hoja-claro` en el icono al tocar (90 ms); al llegar, el icono activo hace un "pop" de `scale(0.92)` a 1 en 220 ms con `--ease-rebote`.
- Con movimiento reducido: la pastilla salta (ya es así) y no hay pop.

### 7.3 Carrusel de productos — qué cambia de golpe y cómo suavizarlo

| # | Elemento | Qué pasa hoy (medido) | → Recomendación |
|---|---|---|---|
| **C1** | **Imágenes al cambiar de categoría** · Alta | El DOM de los productos se destruye y recrea: aparece una silueta crema y la imagen de golpe a los ~312 ms **en local** (en 4G, bastante más). [carrusel.ts:240-264](hinojosa-web/src/lib/animacion/carrusel.ts#L240-L264) | **Caché de productos por categoría** (se desmontan, no se destruyen: volver a una categoría es instantáneo). **Precarga** de la categoría nueva durante la salida de 150 ms, esperando `img.decode()` con tope de 250 ms. **Fundido de 200 ms** al aparecer cada imagen. ⚠️ No aplicarlo al primer montaje (regla del handoff: la tarjeta provisional debe quedarse igual o Lighthouse móvil baja a 86). Complejidad media. **El arreglo de mayor impacto.** |
| **C2** | **Rótulo** (nombre, categoría, posición) · Alta | Cambia al 50 % del giro con un **parpadeo** de opacidad 1→0,15→1. Sin salida. [carrusel.ts:146-163](hinojosa-web/src/lib/animacion/carrusel.ts#L146-L163) | **Fundido con desplazamiento en el sentido del giro:** sale (opacidad 0 y −12 px) en 110 ms, cambia el texto, entra (+12 px → 0) en 200 ms; la línea de categoría 40 ms después del nombre. Con GSAP (ya cargado) o `el.animate`. |
| **C3** | **Chip de precio** · Media | El ancho cambia en seco ("$2.25" ↔ "Consulta precio") y desplaza la línea. | Animar el ancho del chip 200 ms + el mismo fundido del rótulo. Reservar `min-height: 2lh` en el nombre en móvil para que no salte al ocupar dos líneas. |
| **C4** | **Fila resaltada en la lista** · Media | Se resalta **240 ms antes** de que el anillo gire, sin transición de color. Contradice el storyboard. [catalogo.ts:192](hinojosa-web/src/lib/catalogo.ts#L192) | Mantener `aria-current` inmediato (accesibilidad), pero el resaltado **visual** se aplica al asentarse el anillo: fondo/borde en 200 ms y la barra de 4 px crece con `scaleY` 0→1 en 250 ms. Si el clic viene de la propia lista, resaltar de inmediato. |
| **C5** | **Cambio de categoría** · Media | Toda la escena se funde y escala a 0,96 sin dirección; la tarima vuelve a opacidad 1 en seco y el radio del anillo salta (366→260 px). | **Medio giro direccional:** el anillo sale girando medio paso en el sentido de las pestañas (160 ms) y el nuevo entra desde el lado opuesto (320 ms con el rebote mínimo de `--ease-giro`). La tarima se funde con los productos y el radio se interpola. |
| **C6** | **Pestañas** · Baja | El fondo pasa de blanco a verde sin transición. | Color en 180 ms + pulsación `scale(0.97)`. Opcional: pastilla deslizante como la de la barra cuando están en 4 columnas. |
| **C7** | **Arrastre** · Baja | Mientras arrastras, cambia el producto del frente pero el rótulo no: el texto no coincide con la imagen. | Atenuar el rótulo a 0,5 en 120 ms mientras el frente cambia; al soltar, el cambio normal de C2. |
| **C8** | **"Llegada" del producto** · Baja (pulido) | El giro termina sin acento. | Al asentarse, la tarjeta del frente sube 4 px y su sombra se intensifica (180 ms); vuelve al iniciar el siguiente giro. Las flechas: el chevron se mueve 3 px en su dirección al pulsar. |
| — | Producto sin imagen elegido en la lista | El anillo no se mueve y el rótulo cambia en seco. | Ver P5 (tarjeta genérica al frente). |

Con movimiento reducido o pausa: todos los cambios son instantáneos, como hoy.

### 7.4 Otros movimientos

- **Tarjetas de Nosotros y Por qué:** el token `--tilt-max` (3°) existe pero no se usa. Hover `translateY(-2px)` + sombra elevada, 200 ms, solo con `(hover: hover)`.
- **Video de Canela en Nosotros:** arrancar el `play()` a los 400 ms, cuando termina la transición, para no tener dos movimientos a la vez.
- **Paralaje, iconos de la vista 4, pin del mapa e indicador "hay más abajo":** están bien; no tocar.

---

## 8. Hoja de ruta priorizada

| # | Mejora | Códigos | Impacto | Esfuerzo | ¿Necesita a la dueña? |
|---|---|---|---|---|---|
| 1 | Quitar `PENDIENTE_CONFIRMAR` de la pantalla, agrupar contactos pendientes y corregir el texto del mapa | V1, V2 | Muy alto | Bajo | No (los datos reales sí) |
| 2 | Transición entre vistas A (fundido cruzado direccional) | T1, T2 | Alto | Bajo | No |
| 3 | Carrusel: caché + precarga + fundido de imágenes al cambiar de categoría | C1 | Alto | Medio | No |
| 4 | Carrusel: rótulo con fundido direccional, chip de precio animado, fila sincronizada | C2, C3, C4 | Alto | Bajo | No |
| 5 | Inicio enriquecido: vitrina de costales, fila de animales, CTA secundario y accesos por categoría | I1, I2, I3, I5 | **Alto** (responde a "muy simple") | Medio | No (el hero partido, sí) |
| 6 | Buscador con etiquetas de animales y búsqueda tolerante | P1 | Alto | Bajo | No |
| 7 | Barra: ancho reservado en negrita, pulsación, hover y estiramiento direccional | B1–B4 | Medio | Bajo | No |
| 8 | Reencuadrar el video de Nosotros | N1, N2 | Alto | Muy bajo | No |
| 9 | Bebedero sin damero | P3 | Medio | Muy bajo | No |
| 10 | Enlaces "Siguiente →" y CTA al final de Nosotros y Por qué | G2, N3, Q5 | Medio | Bajo | No |
| 11 | Pulidos de Inicio: aro de la insignia, granos/hojas/marca de agua, Canela que se sienta, entrada en cascada | I6–I9 | Medio | Bajo | No |
| 12 | Recuentos coherentes, tarjeta para productos sin foto, singular/plural, carrusel sigue a la búsqueda | P4, P5, P8 | Medio | Bajo | No |
| 13 | Botón "Preguntar por este producto" | P2 | Alto | Bajo | Sí (WhatsApp) |
| 14 | Productos en móvil: buscador arriba y hoja de detalle | P6, P9 | Medio | Medio | No |
| 15 | Cambio de categoría con medio giro direccional, pestañas animadas | C5, C6, C7, C8 | Medio | Bajo–medio | No |
| 16 | Sistema de títulos antetítulo + h2 | G3 | Medio | Bajo | Sí (textos) |
| 17 | Valores en una banda; Por qué con marcas e imágenes; animales enlazados | N5, Q1–Q4 | Medio | Medio | En parte |
| 18 | Entrada escalonada por vista (A+), inversión del texto de la barra | T (A+), B3 | Medio | Medio | No |
| 19 | Pulidos menores | I4, N6–N8, P7, P10, Q6, Q7, V3, V4, G4, G5 | Bajo | Muy bajo | Algunos |

**Para pedir a la dueña en una sola conversación:** dirección exacta, ciudad, teléfono/WhatsApp, horario, Facebook, coordenadas; año de apertura o una línea de historia; foto del local, de la fachada o del equipo; si aprueba cambiar el lema duplicado de Inicio por "Tu mejor aliado para tus animales"; los textos nuevos de títulos, diferenciales y pilares; y el PNG del bebedero con transparencia real.

**Después de implementar:** repetir Lighthouse móvil en Inicio (hoy 99) y en `#productos` (objetivo ≥ 93), y las pruebas del router (41/41).

---

### No cubierto en esta auditoría
Lector de pantalla real (NVDA/VoiceOver), Safari iOS y Firefox: no hay esas herramientas en este entorno. En las capturas de desarrollo aparece la barra de herramientas de Astro sobre la barra móvil; no existe en el sitio publicado.
