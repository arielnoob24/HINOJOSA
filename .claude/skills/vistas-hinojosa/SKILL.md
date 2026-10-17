---
name: vistas-hinojosa
description: Contrato del router de vistas del sitio de Comercial Hinojosa (4 pantallas sin scroll, inert, foco, hash, teclado, fallbacks) con la especificación de la transición entre vistas y de la animación de la barra. Úsala al construir, animar, auditar o modificar la navegación entre vistas, la barra, el buscador con sugerencias, las pestañas Detalle / Lista de Productos, la hoja de detalle móvil o cualquier carga diferida por vista.
---

# Router de vistas — Comercial Hinojosa

El sitio es **una sola página con 4 vistas** (5 hasta el 2026-10-16). Cada vista ocupa una pantalla completa y solo una está visible. **No hay scroll de página.** Se cambia de vista desde la barra superior.

Esto no es un detalle de estilo: cambia cómo se construye, cómo se anima, cómo se audita y cómo se indexa el sitio. Tres agentes dependen de este contrato (`frontend`, `animacion-interaccion`, `qa-rendimiento`), así que vive aquí y no duplicado en cada uno.

## Las 4 vistas

Orden vigente desde el 2026-10-16 (Quiénes somos y Por qué elegirnos se unieron en **Nosotros**). Este orden manda en la barra, la barra móvil, las secciones del HTML, `VISTAS` del router, las flechas ←/→ y la dirección de las transiciones.

| Orden | Hash | Etiqueta en la barra |
|---|---|---|
| 1 | `#inicio` | Inicio |
| 2 | `#productos` | Productos |
| 3 | `#nosotros` | Nosotros |
| 4 | `#visitanos` | Visítanos |

**`#por-que` ya no es una vista:** es el `id` del bloque de razones ("Por qué elegirnos") dentro de `#nosotros`. `resolver()` de `router.ts` abre la vista que contiene un `id` que no es de vista y le da el foco, así que los enlaces viejos siguen funcionando; el script de arranque de `Layout.astro` traduce `#por-que` a `nosotros` para la primera pintura.

---

## Las 8 reglas no negociables

1. **Las 4 vistas están en el HTML servido**, cada una de `100dvh`. Solo una visible. Nunca se generan por JavaScript: si no están en el HTML, Google no las indexa.
2. `body { overflow: hidden }`. **Sin scroll de página.**
3. Las vistas inactivas se ocultan con `display: none` **y** el atributo `inert`. Las dos cosas: `display: none` las saca del foco en navegadores modernos, pero `inert` es la garantía explícita y además cubre el caso de una vista que se anime con opacidad durante la transición.
4. **Un hash por vista.** El router escucha `hashchange`, así funciona el botón "atrás" del navegador y se puede compartir un enlace directo a una vista.
5. **Al cambiar de vista, el foco va al título de la vista nueva** (`tabindex="-1"` en el `<h1>`/`<h2>`), para que el lector de pantalla anuncie dónde está. La animación de transición no puede retrasar esto: la accesibilidad va primero y el movimiento acompaña.
6. La barra marca la vista activa con `aria-current="page"` **y** con una señal visual que no sea solo color — subrayado o pastilla de fondo (WCAG 1.4.1).
7. `←` / `→` y `AvPág` / `RePág` cambian de vista, **pero solo cuando el foco no está dentro de un campo de texto.** Si te olvidas de esto, las flechas dejan de mover el cursor en el buscador del catálogo y lo rompes. **Segunda excepción:** con el foco dentro de un contenedor con `data-captura-flechas` (carrusel de Productos, pestañas Detalle / Lista, hoja de detalle) las flechas no cambian de vista; en el carrusel, `←`/`→` lo giran. En el buscador, `↑`/`↓` mueven la sugerencia activa. El router ignora el evento si `e.target.closest('input, textarea, select, [contenteditable], [data-captura-flechas]')`.
8. **Sin JavaScript, las 4 vistas quedan visibles una debajo de otra** (sin pestañas: las listas de productos de las 4 categorías se pintan en la columna derecha). Degradación honesta, nunca una pantalla en blanco. Esto implica que el `overflow: hidden` y el `display: none` los aplica el router al arrancar, no el CSS base.

**Mecanismos de navegación (decisión 2026-10-13, `PLAN.md` §0-B):** solo la barra y el teclado (`←`/`→`, `AvPág`/`RePág`). **No** se añade cambio de vista con rueda del ratón ni con deslizamiento, ni enlaces "Siguiente →" al pie de las vistas. Sí se permiten anclas contextuales dentro del contenido (botón "Cómo llegar" y accesos por categoría de Inicio, animales enlazados a Productos): son anclas reales a un hash y pasan por el router como cualquier otra.

**Esquema de anclas con categoría o animal (implementado 2026-10-14):** el hash es solo el de la vista; el dato va en un atributo.
```html
<a href="#productos" data-abrir-categoria="granja">Granja</a>
<a href="#productos" data-abrir-animal="perro">Perros</a>   <!-- banda de animales de Nosotros -->
```
Un oyente en fase de captura en `src/lib/catalogo.ts` (`abrirCategoria()`) prepara el catálogo antes del `hashchange`: elige el primer producto de la categoría (origen `'pestana'`), vacía el buscador y, si Productos ya está visible, lleva la lista al grupo. Para animales, el oyente equivalente (`abrirAnimal()`) rellena el buscador con el animal y pone al frente el primer resultado (es el único caso en que el carrusel gira sin que se elija una sugerencia). Clics con modificadores o con el botón central navegan normal. Sin JS, el enlace lleva a `#productos`. **Nunca** `#productos?cat=…`: rompe el hash de la vista.

---

## Excepciones de scroll (las únicas)

- **La pestaña Lista** del panel derecho de Productos (solo la categoría activa, o los resultados de una búsqueda) tiene scroll interno; es enfocable (`tabindex="0"`). (Lenis se retiró del proyecto.)
- ~~El cuerpo de la ficha de producto~~: **desde el bloque 20 la ficha (Detalle) no tiene scroll nunca**; todo cabe con los 37 productos a 1440×900 y 1366×650.
- **Las sugerencias del buscador** (`listbox`) se desplazan si no caben.
- **La hoja de detalle de producto en móvil** (`<dialog>` modal) puede tener scroll propio si su contenido no cabe.
- **En móvil**, si una vista no cabe en la pantalla, se permite scroll interno en esa vista. Es preferible a recortar contenido esencial. Probar a 360×640.

---

## Esqueleto de referencia

```html
<nav aria-label="Vistas del sitio">
  <a href="#inicio"    aria-current="page">Inicio</a>
  <a href="#productos">Productos</a>
  <a href="#nosotros">Nosotros</a>
  <a href="#visitanos">Visítanos</a>
</nav>

<main>
  <section id="inicio"    class="vista" data-vista="inicio">
    <h1 tabindex="-1">…</h1>          <!-- el logo con su texto alternativo -->
    ...
  </section>
  <section id="productos" class="vista" data-vista="productos" inert hidden>
    <h2 tabindex="-1">Productos</h2>
    ...
  </section>
  ...
</main>
```

La navegación son **anclas reales** (`<a href="#...">`), no botones con `onclick`: así funcionan sin JavaScript, se pueden abrir en pestaña nueva y el navegador gestiona el historial por ti.

```ts
// src/lib/router.ts  (esquema, no código final)
const VISTAS = ['inicio', 'productos', 'nosotros', 'visitanos'] as const;

function activar(nombre: string, { animar = true } = {}) {
  const destino = VISTAS.includes(nombre as any) ? nombre : 'inicio';

  for (const v of VISTAS) {
    const el = document.getElementById(v)!;
    const activa = v === destino;
    el.hidden = !activa;              // display: none
    el.inert  = !activa;              // fuera del foco y del árbol de accesibilidad
  }

  // marca la barra
  for (const a of document.querySelectorAll('nav a')) {
    const esActiva = a.getAttribute('href') === '#' + destino;
    esActiva ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  }

  // el foco va al titulo, SIEMPRE, y sin esperar a la animacion
  document.querySelector<HTMLElement>(`#${destino} [tabindex="-1"]`)?.focus();

  avisarCambioDeVista(destino);        // dispara carga diferida y animaciones
}

// arranque: aqui se activan overflow:hidden y el ocultado, para que sin JS no pase nada
document.documentElement.dataset.router = 'activo';
activar(location.hash.slice(1) || 'inicio', { animar: false });
window.addEventListener('hashchange', () => activar(location.hash.slice(1)));

// teclado: ojo con los campos de texto
window.addEventListener('keydown', (e) => {
  const dentroDeCampo = (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable], [data-captura-flechas]');
  if (dentroDeCampo) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') irA(+1);
  if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   irA(-1);
});
```

---

## Carga diferida: el disparador es el cambio de vista

Sin scroll **no hay `IntersectionObserver` ni ScrollTrigger**. El evento de cambio de vista es el único disparador:

| Recurso | Se carga al entrar en |
|---|---|
| Carrusel CSS 3D (`src/lib/animacion/carrusel.ts` + GSAP core, import dinámico desde `carrusel-carga.ts`) e imágenes de la categoría activa | `#productos` |
| Mapa (Leaflet) | `#visitanos` |
| Entrada única de iconos de las razones y de los animales (CSS sobre los SVG; sin Lottie) | `#nosotros` |
| Video de Canela jugando con alfa (`video-vista.ts`; en Safari/iOS no se reproduce, queda el póster) | `#nosotros` |
| Video de la fachada | `#visitanos` |
| Sprites de Canela corriendo (arranque, carrera, giro) | `#inicio`, pero **después del evento `load`** (el logo sigue siendo el LCP; mientras tanto se ve `canela-franja` sentada) |
| Costales de la vitrina de Inicio | `#inicio`, con `fetchpriority="low"` o tras `load` |

- Solo la vista **Inicio** se descarga completa de entrada. Presupuesto: **menos de 1,5 MB**.
- Fuera de Inicio, la carrera de Canela se detiene (0 `requestAnimationFrame`); al volver, empieza otra vez desde sentada.
- No hay Three.js. El carrusel no tiene bucle de render: GSAP solo anima mientras gira y su ticker se duerme solo; al salir de `#productos` se terminan los tweens en curso. Comprobado con un contador de `requestAnimationFrame` (0 por segundo fuera de Productos).
- Un recurso ya cargado no se vuelve a cargar al volver a entrar en su vista.

---

## Animación

- **Una sola metáfora de transición** en todo el sitio: desplazamiento horizontal en la dirección del orden de las vistas, con fundido.
- Con `prefers-reduced-motion` **o con la pausa del sitio** (`html[data-movimiento="pausado"]`), el cambio de vista es **instantáneo**, Canela queda sentada y fija, no hay paralaje y el giro del carrusel es instantáneo.
- **Sin botones de pausa (decisión del usuario, 2026-10-15):** Canela corriendo y el video de Quiénes somos van en bucle sin control visible. Esto **incumple WCAG 2.2.2** y está registrado como riesgo 11 en `PLAN.md`; no lo "corrijas" añadiendo un botón sin que el usuario lo pida. La pausa global (`html[data-movimiento="pausado"]`) se conserva en el código. El carrusel, en cambio, **nunca gira solo**, y por eso no necesita control propio.

### Transición entre vistas (decidida 2026-10-13)

> ⚠️ **Rediseño 0-C (2026-10-17, bloque 26, pendiente de implementar):** esta versión en dos capas CSS (≈ 440 ms) se sustituye por un **timeline de GSAP**: capas solapadas, `power3.out`, desplazamiento horizontal con algo de profundidad, `stagger` en `[data-entra]`, escena de Inicio compartida, total 550–650 ms e **interrumpible** (un clic nuevo invierte o reemplaza el timeline sin saltos). No cambia el contrato: `vistas.ts` devuelve una `Promise`, foco al título antes de animar, `inert` y `display`, pausa y `prefers-reduced-motion` instantáneos, sin destello (prueba 13). GSAP lo carga un cargador común tras `load` (`gsap-carga.ts`); con la pausa o sin GSAP, cambio instantáneo. Al implementarlo, `animacion-interaccion` reescribe esta sección y las pruebas 13–16 y 18 (Inicio ya tiene bucle propio —nubes, animales, Canela—; fuera de Inicio, 0 `requestAnimationFrame`).

`dir` = +1 si la vista destino va después en el orden de la barra, −1 si va antes.

| Capa | Propiedades | Duración | Curva |
|---|---|---|---|
| Saliente | opacidad 1 → 0, `translateX(-dir · 1rem)`, `pointer-events: none`, por **debajo** de la entrante | 160 ms | `--ease-salida` |
| Entrante | opacidad 0 → 1, `translateX(dir · 2.5rem)` → 0 | 380 ms, 60 ms de retraso | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Bloques `[data-entra]` de la entrante (2–3: título, bloque principal, secundario) | opacidad 0 → 1, `translateX(dir · 1.5rem)` → 0 | 300 ms, 50 ms entre bloques | `--ease-vista` |

- `src/lib/animacion/vistas.ts` **devuelve una `Promise`** que se resuelve con el `animationend` de la saliente (tope de 200 ms). El router oculta la saliente cuando se resuelve; nunca antes del primer pintado, o se ve el fondo del `body` entre las dos vistas.
- En Productos, el anillo del carrusel es un bloque sin animación propia de entrada.
- Los iconos de las razones y los animales de Nosotros empiezan a los 400 ms.
- El **foco** se mueve al título antes de que empiece cualquier animación.
- Solo `transform` y `opacity`.

### Barra (decidida 2026-10-13)

- La pastilla de la vista activa se **desliza** (300 ms, `--ease-vista`) con **estiramiento direccional**: el borde que va delante tarda 240 ms y el de atrás 300 ms.
- Cada rótulo **reserva el ancho de su versión en negrita** (pseudo-elemento invisible con `content: attr(data-texto)`), para que activar un enlace no desplace a los vecinos.
- La clase `.anima` no se retira hasta el `transitionend` de la pastilla: quitar `transition-property` a mitad cancela la transición en Safari y Firefox.
- El texto del ítem activo se vuelve blanco cuando la pastilla ya está debajo (retraso de 150 ms, o inversión exacta con `clip-path` sobre una copia `aria-hidden`).
- **Hover de la barra (escritorio, bloque 18, 2026-10-16):** en los rótulos no activos aparece bajo el texto el **trazo de pincel maíz** de los h2 (`--trazo-pincel` de `global.css`, color `maiz`, alto `round(clamp(0.375rem, 0.9dvh, 0.5rem), 1px)`, −1°, a **todo el ancho del texto**, de la primera a la última letra; bloque 19). Se dibuja de izquierda a derecha con `clip-path: inset(0 100% 0 0)` → `inset(0)` en **400 ms** (`--ease-vista`) y se recoge en **250 ms** (`--ease-salida`). Solo `(hover: hover) and (pointer: fine)`; nunca en el activo (pastilla). Con reduced motion o la pausa, sin animación. Sustituye al fondo `hoja-claro`. Debe convivir con el ancho reservado en negrita (B1): el trazo va en un pseudo-elemento que no cambie el ancho del enlace (no usar el `::after` de `data-texto`).
- Pulsación: `scale(0.96)` 90 ms. Móvil: fondo `hoja-claro` al tocar y "pop" del icono activo `scale(0.92)` → 1 en 220 ms con `--ease-rebote`.

### Regla de las transiciones CSS

La pausa del sitio hoy anula `animation` pero **no** `transition` (`global.css`). Toda `transition` nueva se condiciona con `html:not([data-movimiento="pausado"])` o con una clase que el script solo pone si `movimientoPermitido()`, además de `prefers-reduced-motion`.

---

## Pruebas obligatorias

Las nueve primeras son los modos de fallo propios de este diseño. Si alguna falla, es **bloqueante**. De la 13 a la 18 se añadieron tras la auditoría de 2026-10-13; de la 19 a la 21, con la vista Nosotros y la ficha de Productos (2026-10-16).

1. Se llega a las 4 vistas y se recorren solo con teclado (`Tab`, `Enter`, `←`, `→`).
2. **Con una vista activa, `Tab` no alcanza ningún elemento de las otras tres.** Es el fallo más probable.
3. El foco aterriza en el título de la vista nueva al cambiar.
4. Con el foco dentro del buscador del catálogo, `←` y `→` mueven el cursor y **no** cambian de vista.
5. Entrar por `#productos` abre esa vista; el botón "atrás" vuelve a la anterior.
6. Sin JavaScript, las 4 vistas se ven una debajo de otra, con la lista completa de productos en la página.
7. El elemento enfocado nunca queda tapado por la barra fija ni por la tarjeta flotante del mapa (WCAG 2.4.11).
8. `body` no desborda en ninguna vista; en escritorio los únicos scrolls internos son los de "Excepciones de scroll".
9. A 360×640 ninguna vista desborda en horizontal ni corta contenido esencial.
10. En el HTML de `dist/` (no en el DOM ya ejecutado) están las 4 vistas completas, con la lista completa de productos.
11. Con `prefers-reduced-motion` activado no hay bucles, paralaje ni transiciones animadas.
12. ~~Control de pausa del perrito~~: **retirada el 2026-10-15** por decisión del usuario (riesgo 11 del plan). En su lugar: con `prefers-reduced-motion` Canela queda sentada fija y el video no se reproduce.
13. **Sin destello entre vistas:** muestreando fotogramas con `requestAnimationFrame` durante un cambio de vista, en ningún fotograma la vista saliente está oculta mientras la entrante tiene opacidad < 0,5. Probar sobre todo al salir de Inicio (fondo oscuro).
14. **La barra no salta:** al cambiar de vista, la posición `x` de los enlaces no activos no cambia (tolerancia 0,5 px).
15. **Con la pausa del sitio activada**, ni la pastilla de la barra ni ninguna transición nueva se anima.
16. **Clics rápidos:** pulsar tres vistas seguidas en menos de 300 ms termina en la última, con una sola vista visible y el foco en su título.
17. **Hoja de detalle (móvil):** "Ver detalle" la abre como `<dialog>` modal con el foco en su título, se cierra con `Esc` y con "Cerrar", y el foco vuelve al botón. Con la hoja abierta, `←`/`→` no cambian de vista.
18. **Canela corriendo:** nunca sale de la pantalla; gira en cada borde a 1440, 1366 y 360 px de ancho y tras redimensionar la ventana; la pausa global (`data-movimiento="pausado"`, sin botón desde 2026-10-15) congela cuadro y posición; con movimiento reducido queda sentada y fija; al quitar el botón de pausa, el límite derecho vuelve a ser el borde de la franja (ya no se detiene antes del botón); fuera de Inicio no hay `requestAnimationFrame` suyo.
19. **Buscador con sugerencias (2026-10-16):** al escribir "perro" se abre el `listbox` (≤ 6 opciones + "Ver los N"), `aria-expanded="true"`; `↓`/`↑` mueven `aria-activedescendant`; Enter pone ese producto al frente del carrusel y en la ficha; Esc cierra y un segundo Esc borra. Escribir **no** gira el carrusel.
20. **Pestañas Detalle / Lista (bloque 19):** `←`/`→` cambian de pestaña y **no** de vista; la Lista muestra solo la categoría activa (N = su total) y cambia con la pestaña de categoría; elegir una fila pone el producto al frente y vuelve a Detalle con el foco en esa pestaña; "Ver los N" del buscador abre la Lista con los resultados y "Quitar filtro" vuelve a la categoría. Ya no existe la ventana `<dialog>` de la lista.
21. **`#por-que` (2026-10-16):** abre `#nosotros` con el foco en el bloque de razones.
22. **Hover de la barra (2026-10-16):** con el ratón sobre un rótulo no activo, el trazo de pincel maíz se dibuja bajo el texto y la posición `x` de los demás enlaces no cambia (prueba 14); sobre el activo no aparece; con `prefers-reduced-motion` o la pausa aparece sin transición; en táctil no aparece.
23. **Ficha sin scroll (bloque 20):** para cada uno de los 37 productos (`window.hinojosaCatalogo.seleccionar(id)`), a 1440×900 y 1366×650, el panel Detalle cumple `scrollHeight <= clientHeight` y ningún hijo queda fuera del cuadro (rectángulos medidos).
24. **Transición Detalle ↔ Lista (bloque 20):** al cambiar de pestaña, muestreando fotogramas, el cuadro no cambia de tamaño (tolerancia 1 px), el saliente se va en ~140 ms y el entrante llega en ~260 ms desde el lado de la pestaña, y la pastilla del selector se desliza ~240 ms; con reduced motion o la pausa, instantáneo. El foco sigue en la pestaña elegida.

---

## Errores que ya costaron caro

- Poner `overflow: hidden` en el CSS base en vez de aplicarlo el router: rompe el sitio sin JavaScript.
- Confiar solo en `display: none` sin `inert` cuando la vista se anima con opacidad: el foco entra en una vista invisible.
- Escuchar `←` y `→` en `window` sin excluir campos de texto: rompe el buscador del catálogo.
- Mover el foco **después** de la animación de transición: el lector de pantalla anuncia tarde o no anuncia.
- Generar una vista por JavaScript "porque es más limpio": la vista deja de indexarse.
- Aplicar Lenis al documento: no hay scroll de documento que suavizar.
- Que la función de transición no devuelva promesa: el router oculta la saliente en la microtarea siguiente y se ve el fondo crema entre vistas (medido el 2026-10-13).
- Poner la negrita del enlace activo sin reservar su ancho: los vecinos saltan ~5 px y el `ResizeObserver` de la pastilla le quita `.anima` a mitad del deslizamiento.
- Mostrar el marcador `PENDIENTE_CONFIRMAR` en pantalla: es para los datos, no para el visitante.
