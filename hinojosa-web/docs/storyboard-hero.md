# Storyboard: hero y animaciones por sección

> Fase 1 (diseño). Basado en `PLAN.md`, secciones 3 y 6. Tokens en `src/styles/global.css`.
> **Versión 1 sin 3D:** no hay modelo `.glb` de Canela. Como permite la sección 6 del plan, el hero se hace con **imágenes en capas con paralaje + SVG animados con CSS**. El 3D (Three.js / model-viewer) entra en la fase 4 y reemplaza capas concretas sin rediseñar.

## 0. Decisiones previas

1. **El video `01-hero-marca-16x9` no se usa como fondo.** Es el logo sobre blanco con un marco gris alrededor; a pantalla completa se ve como una diapositiva. Además repite el logo que ya está en el hero. Queda descartado para el hero.
2. Los videos 9:16 (`02-conoce-a-canela`, `03-catalogo`, `05-mascotas`) son el afiche cuadrado sobre una versión desenfocada de sí mismo. Si se usan, va en un contenedor cuadrado con `object-fit: cover` y una escala de unos 1.1 para cortar el borde desenfocado. Llevan texto incrustado que duplica el de la página: son opcionales y siempre llevan `poster`.
3. El **logo es la imagen LCP** del hero: se muestra desde el primer fotograma, **sin fundido de opacidad** (animar la opacidad del elemento LCP empeora el LCP).
4. Accesibilidad de movimiento: los bucles infinitos duran más de 5 s, así que el hero lleva un botón **"Pausar animaciones"** (WCAG 2.2.2) que pone `data-movimiento="pausado"` en `<html>` y lo guarda en `localStorage`.

## 1. Hero: composición

```
ESCRITORIO (>= 1024 px), alto: min(100svh, 860px)
+--------------------------------------------------------------------+
| [header: logo 160px]   Nosotros  Canela  Productos  Ubicación  [WA]|
|                                                                    |
|   .  (grano)                                 o  (grano)  ~ (hoja)  |
|  +------------------------+          .-""""""""-.                  |
|  |  LOGO COMPLETO (h1)    |        /  aro bosque  \    o           |
|  |  max 460px, fondo blanco|      |  aro maiz       |               |
|  +------------------------+       |   CANELA        |   ~          |
|  Alimentos, balanceados y         |  (canela-recorte)|              |
|  productos para tus animales      \                 /              |
|  (lead, Nunito 600, tinta-suave)   '-.__________.-'               |
|  "Calidad que alimenta,          [placa bosque: VENTA DE          |
|   amor que se siente" (script)     BALANCEADOS en crema]           |
|  [ Escríbenos por WhatsApp ] [ Ver productos ]     o   .           |
|~~~~~~~~~~~~~~~~~~~~ onda bosque ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
|  Ubicación estratégica | Aves, cerdos, mascotas y tilapias | ...   |
|  (franja bosque, 4 diferenciales con iconos maiz)    [|| pausar]   |
+--------------------------------------------------------------------+
```

- Rejilla de 12 columnas: texto en las columnas 1–6 y la insignia de Canela en las 7–12.
- Fondo: degradado vertical de `blanco` (arriba, donde está el logo) a `crema` (abajo), y un halo radial `hoja-claro` detrás de Canela (60 % de opacidad).
- Franja inferior: onda SVG `bosque` con los 4 diferenciales del afiche en `crema`, iconos en `maiz`. Aporta el 30 % verde del hero.
- Semántica: `<h1>` envuelve la imagen del logo (`alt="Comercial Hinojosa: Nutrición que da vida"`) para no repetir el lema como texto. El lead es un `<p>`.
- CTA: principal "Escríbenos por WhatsApp" (`marca-fuerte` + blanco) y secundario "Ver productos" (`maiz` + `tinta`, ancla a `#productos`).

### Capas (de atrás hacia delante) y paralaje

| Capa | Contenido | Formato | Paralaje con el ratón (máx.) | Paralaje con el scroll |
|---|---|---|---|---|
| 0 | Degradado + halo `hoja-claro` | CSS | 0 | 0 |
| 1 | 3 hojas grandes desenfocadas (`hoja`, 30 % de opacidad) en las esquinas | SVG inline | 4 px | 0.1 |
| 2 | Insignia de Canela: aros `bosque`/`maiz` + `canela-recorte.png` dentro de un óvalo con `overflow:hidden` | CSS + AVIF/WebP | 8 px | 0.15 |
| 3 | 7–9 granos de maíz (elipses `maiz` con brillo `canela`) y 2 pellets (`canela-oscuro`) | SVG inline, cada uno de 12–28 px | 12 px (el más cercano) | 0.3 |
| 4 | 2 hojas pequeñas nítidas (`marca`/`hoja`) | SVG inline | 12 px | 0.35 |
| 5 | Texto, logo y CTA | HTML | 0 (el texto nunca se mueve) | 0 |

- Paralaje con el ratón: solo con `(hover: hover) and (pointer: fine)`. Se lee `pointermove` en el hero, se normaliza de -1 a 1 y se aplica con `requestAnimationFrame` y suavizado (lerp 0.08), moviendo solo `transform`. Tope global `--paralaje-max: 12px`.
- Paralaje con el scroll: solo mientras el hero está visible (`IntersectionObserver`), con `translate3d` y sin tocar el layout.
- Peso total de la decoración: menos de 15 kB (SVG inline). La única imagen pesada es Canela (menos de 120 kB en AVIF, con `fetchpriority="low"`; el logo lleva `fetchpriority="high"`).

## 2. Hero: línea de tiempo de entrada

Total: **1.6 s**. La página se puede usar desde el instante 0 (los CTA se ven desde los 450 ms y aceptan clics desde el primer pintado).

| Tiempo | Elemento | Animación | Duración / curva |
|---|---|---|---|
| 0 ms | Fondo, onda, franja de diferenciales, **logo** | Ya pintados, estáticos | – |
| 150 ms | Insignia de Canela | `entrar-insignia`: sube 24 px y pasa de escala 0.9 a 1, **sin opacidad** (fase 4: la insignia resultó ser el elemento LCP; el fundido lo retrasaba de 1.9 s a 3.9 s) | 700 ms, `ease-rebote` |
| 300 ms | Lead | `entrar` (sube 20 px, opacidad) | 600 ms, `ease-suave` |
| 400 ms | Frase script "Calidad que alimenta, amor que se siente" | `entrar` + subrayado `hoja` que se dibuja de izquierda a derecha | 600 ms + 400 ms |
| 450 / 530 ms | CTA WhatsApp / CTA Ver productos | `entrar` con 80 ms de desfase | 600 ms, `ease-suave` |
| 600–1300 ms | Granos | Caen 40–80 px desde arriba con rotación aleatoria de ±40° y se asientan; desfase de 70 ms entre granos | 700 ms, `ease-suave` |
| 800 ms | Hojas pequeñas | Aparecen y giran 15° | 600 ms |
| 1 600 ms en adelante | **Bucles ambientales** | Ver abajo | – |

Bucles ambientales (pausables):
- Granos: `animate-flotar` (7 s, ±8 px y ±6°), cada uno con `animation-delay` negativo distinto (-0.5 s a -6 s) para que no vayan sincronizados.
- Canela: `animate-balanceo` (4.5 s, ±1.5° y escala de 1.015, "respira"). El punto de giro (`transform-origin`) va en la base de la placa.
- Hojas grandes: deriva lenta de ±10 px en 12 s.
- Interacción con Canela (opcional en la v1): al pasar el cursor o enfocar la insignia, gira 4° y aparece un bocadillo `font-script` con "¡Hola! Soy Canela" durante 2 s. Al hacer clic, salta 8 px con `ease-rebote`. Es decoración: no se necesita para usar la página.

Botón de pausa: esquina inferior derecha de la franja verde, de 44 × 44 px, icono de pausa/play en `crema`, con `aria-pressed` y la etiqueta "Pausar animaciones" / "Reanudar animaciones".

## 3. Hero en móvil (< 768 px)

```
+---------------------------+
| [logo 120px]     [menú]   |
|                           |
|   LOGO COMPLETO (h1)      |
|   ancho: min(80vw, 300px) |
|   Lead (2 líneas)         |
|   [Escríbenos por WA]     |  <- CTA a ancho completo, 52 px de alto
|   [Ver productos]         |
|      .-""""""-.           |
|     | CANELA   |  o  .    |  <- insignia de 240 px de ancho, 4 granos
|      '-.____.-'           |
|~~~~~~ onda bosque ~~~~~~~~|
|  diferenciales en 2x2     |
+---------------------------+
```

- Orden: logo → lead → CTA → Canela. **Los dos CTA deben verse sin hacer scroll** en un teléfono de 360 × 640.
- La frase script se oculta en menos de 400 px (está repetida en el footer).
- Sin paralaje de ratón ni de scroll. Solo la entrada (más corta: 1.0 s en total) y `animate-flotar` en 4 granos.
- No se carga video ni 3D en móvil en la v1.
- Alto del hero: `auto` (no se fuerza a 100svh para no esconder los CTA detrás de la barra del navegador).

## 4. Hero estático (`prefers-reduced-motion: reduce` o animaciones pausadas)

- Todo aparece en su **posición final** desde el primer pintado: logo, lead, frase, CTA, insignia y granos ya asentados.
- Sin paralaje (no se registran los listeners de `pointermove` ni de scroll), sin bucles y sin el salto de Canela. El bocadillo "¡Hola! Soy Canela" puede mostrarse estático, sin transición.
- Los videos no hacen autoplay: se muestra solo el `poster`, y quien quiera puede reproducirlo con controles.
- En JS se comprueba `matchMedia('(prefers-reduced-motion: reduce)')` **antes** de inicializar GSAP o Lenis. Si es `reduce`, no se cargan esas librerías.
- El CSS global ya fuerza duraciones de 0.01 ms, así que una animación olvidada no se llega a ver.

## 5. Animaciones por sección (versión 1 sin 3D)

Reglas comunes: entrada al 25 % de visibilidad (`IntersectionObserver`, una sola vez), `animate-entrar` con desfase de 80–120 ms entre hermanos, solo `transform` y `opacity`, y nada de animación hasta que la sección es visible.

| # | Sección | Plan (3D) | Versión 1 (sin 3D) | Duración / detalle | Reduced motion / móvil |
|---|---|---|---|---|---|
| 1 | Hero | Canela 3D + costales y granos + paralaje | Capas: insignia de Canela + granos y hojas en SVG + paralaje (arriba) | Entrada de 1.6 s y bucles pausables | Estático / sin paralaje |
| 2 | Quiénes somos | Tarjetas con tilt 3D; hojas cayendo | Historia + 2 tarjetas (Misión, Visión) con tilt (vanilla-tilt, máx. 6°, brillo 0.1) y 3 hojas `animate-caer-hoja` en el fondo, a 40 % de opacidad | Tarjetas con `entrar` y 120 ms de desfase; hojas de 14 s con desfases de 0 / -5 / -9 s | Sin tilt ni hojas / sin tilt en táctil |
| 3 | Conoce a Canela | Canela 3D rotable: guiña, cola, saluda | Insignia grande + 3 rasgos ("alegre", "le encantan los animales", "acompaña a Hinojosa") en tarjetas con icono en círculo. Al pulsar Canela: salto con `ease-rebote` y bocadillo que va rotando las 3 frases. Video `02-conoce-a-canela` opcional en un recuadro cuadrado | Entrada de la insignia con `entrar-insignia`; salto de 500 ms | Sin salto; frases visibles en lista |
| 4 | Qué vendemos | Carrusel 3D de costales que rotan con el scroll | Fila con `scroll-snap` de 10 tarjetas de categoría (icono o foto + nombre). En escritorio, cada tarjeta gira con `rotateY` de -12° a 12° según su posición (`animation-timeline: view()` como mejora progresiva) | Gira mientras se hace scroll; sin JS si se usa la línea de tiempo de scroll | Rejilla estática 2×N |
| 5 | Catálogo | Tarjetas con giro 3D (`model-viewer`) | Tarjetas `blanco` con cinta `bosque` y nombre en `font-serif`; hover: sube 4 px y pasa a `shadow-elevada` (200 ms). Precio en un chip `maiz`. `model-viewer` llega cuando existan los `.glb` de costales | Entrada en lotes de 4, con 80 ms de desfase | Sin elevación; foco visible |
| 6 | Valores y esencia | Lotties que aparecen con el scroll | Sección `.tema-oscuro` (fondo `bosque`). 6 valores + 4 pilares con icono SVG cuyo trazo se dibuja (`stroke-dashoffset`, 600 ms) dentro de una insignia con aro `maiz`. Lottie más adelante | Desfase de 80 ms | Iconos completos |
| 7 | Por qué elegirnos | Contadores y barras animadas | 4 tarjetas (Calidad, Nutrición balanceada, Atención cercana, Ubicación). **Contadores solo con cifras confirmadas por la dueña** (años, clientes, marcas). Sin datos reales no se inventan: se dejan las tarjetas con icono | Contador de 1.2 s con `ease-suave` si hay datos | Número final directo |
| 8 | Ubicación | Pin 3D animado en el mapa | Mapa Leaflet cargado de forma diferida. Pin SVG con forma de insignia (aro `maiz`, isotipo H) que cae 24 px con `ease-rebote` y deja una sombra elíptica | 700 ms, una vez | Pin fijo |
| 9 | Contacto / redes | Botón flotante de WhatsApp con pulso | Botón flotante `marca-fuerte` de 56 px abajo a la derecha. `animate-pulso` (3 pulsos y se detiene, menos de 5 s) a los 4 s de cargar; se repite 1 vez si el usuario llega a Contacto | 1.6 s × 3 | Sin pulso |
| 10 | Footer | Hojas con paralaje | Fondo `bosque-noche`, logo pendiente de la versión blanca (mientras tanto, isotipo sobre una placa `blanco` redonda), lema "Comercial Hinojosa siempre a tu lado" en `font-script` `maiz`. 2 hojas SVG con paralaje de scroll de 0.2 | Ligado al scroll | Estático |

## 6. Ruta hacia el 3D (fase 4)

- Capa 2 (insignia de Canela) → `<canvas>` Three.js con `canela.glb`, en el mismo hueco y con el mismo marco; la imagen actual queda como `poster`/fallback.
- Capa 3 (granos SVG) → partículas instanciadas en Three.js solo en escritorio con WebGL; en móvil siguen los SVG.
- Sección 4 → costales `.glb` en `model-viewer` cuando pesen menos de 3 MB.
- Para cualquier paso al 3D, antes hace falta: Canela con transparencia real o modelo, y la aprobación de la dueña sobre el uso de la ilustración.
