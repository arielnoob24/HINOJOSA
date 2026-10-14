---
name: vistas-hinojosa
description: Contrato del router de vistas del sitio de Comercial Hinojosa (5 pantallas sin scroll, inert, foco, hash, teclado, fallbacks) con la especificación de la transición entre vistas y de la animación de la barra. Úsala al construir, animar, auditar o modificar la navegación entre vistas, la barra, el buscador del catálogo, la hoja de detalle móvil o cualquier carga diferida por vista.
---

# Router de vistas — Comercial Hinojosa

El sitio es **una sola página con 5 vistas**. Cada vista ocupa una pantalla completa y solo una está visible. **No hay scroll de página.** Se cambia de vista desde la barra superior.

Esto no es un detalle de estilo: cambia cómo se construye, cómo se anima, cómo se audita y cómo se indexa el sitio. Tres agentes dependen de este contrato (`frontend`, `animacion-interaccion`, `qa-rendimiento`), así que vive aquí y no duplicado en cada uno.

## Las 5 vistas

| Orden | Hash | Etiqueta en la barra |
|---|---|---|
| 1 | `#inicio` | Inicio |
| 2 | `#nosotros` | Quiénes somos |
| 3 | `#productos` | Productos |
| 4 | `#por-que` | Por qué elegirnos |
| 5 | `#visitanos` | Visítanos |

---

## Las 8 reglas no negociables

1. **Las 5 vistas están en el HTML servido**, cada una de `100dvh`. Solo una visible. Nunca se generan por JavaScript: si no están en el HTML, Google no las indexa.
2. `body { overflow: hidden }`. **Sin scroll de página.**
3. Las vistas inactivas se ocultan con `display: none` **y** el atributo `inert`. Las dos cosas: `display: none` las saca del foco en navegadores modernos, pero `inert` es la garantía explícita y además cubre el caso de una vista que se anime con opacidad durante la transición.
4. **Un hash por vista.** El router escucha `hashchange`, así funciona el botón "atrás" del navegador y se puede compartir un enlace directo a una vista.
5. **Al cambiar de vista, el foco va al título de la vista nueva** (`tabindex="-1"` en el `<h1>`/`<h2>`), para que el lector de pantalla anuncie dónde está. La animación de transición no puede retrasar esto: la accesibilidad va primero y el movimiento acompaña.
6. La barra marca la vista activa con `aria-current="page"` **y** con una señal visual que no sea solo color — subrayado o pastilla de fondo (WCAG 1.4.1).
7. `←` / `→` y `AvPág` / `RePág` cambian de vista, **pero solo cuando el foco no está dentro de un campo de texto.** Si te olvidas de esto, las flechas dejan de mover el cursor en el buscador del catálogo y lo rompes. **Segunda excepción:** con el foco dentro del carrusel de Productos (contenedor con `data-captura-flechas`), `←`/`→` giran el carrusel y no cambian de vista. El router ignora el evento si `e.target.closest('input, textarea, select, [contenteditable], [data-captura-flechas]')`.
8. **Sin JavaScript, las 5 vistas quedan visibles una debajo de otra.** Degradación honesta, nunca una pantalla en blanco. Esto implica que el `overflow: hidden` y el `display: none` los aplica el router al arrancar, no el CSS base.

**Mecanismos de navegación (decisión 2026-10-13, `PLAN.md` §0-B):** solo la barra y el teclado (`←`/`→`, `AvPág`/`RePág`). **No** se añade cambio de vista con rueda del ratón ni con deslizamiento, ni enlaces "Siguiente →" al pie de las vistas. Sí se permiten anclas contextuales dentro del contenido (botón "Cómo llegar" y accesos por categoría de Inicio, animales enlazados a Productos): son anclas reales a un hash, con parámetro de categoría o animal cuando haga falta, y pasan por el router como cualquier otra.

---

## Excepciones de scroll (las únicas)

- **La lista del catálogo** de la vista Productos tiene scroll interno. Es el único panel con scroll por diseño. (Lenis se retiró del proyecto.)
- **La hoja de detalle de producto en móvil** (`<dialog>` modal) puede tener scroll propio si su contenido no cabe.
- **En móvil**, si una vista no cabe en la pantalla, se permite scroll interno en esa vista. Es preferible a recortar contenido esencial. Probar a 360×640.

---

## Esqueleto de referencia

```html
<nav aria-label="Vistas del sitio">
  <a href="#inicio"    aria-current="page">Inicio</a>
  <a href="#nosotros">Quiénes somos</a>
  <a href="#productos">Productos</a>
  <a href="#por-que">Por qué elegirnos</a>
  <a href="#visitanos">Visítanos</a>
</nav>

<main>
  <section id="inicio"    class="vista" data-vista="inicio">
    <h1 tabindex="-1">Nutrición que da vida</h1>
    ...
  </section>
  <section id="nosotros"  class="vista" data-vista="nosotros" inert hidden>
    <h2 tabindex="-1">Quiénes somos</h2>
    ...
  </section>
  ...
</main>
```

La navegación son **anclas reales** (`<a href="#...">`), no botones con `onclick`: así funcionan sin JavaScript, se pueden abrir en pestaña nueva y el navegador gestiona el historial por ti.

```ts
// src/lib/router.ts  (esquema, no código final)
const VISTAS = ['inicio', 'nosotros', 'productos', 'por-que', 'visitanos'] as const;

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
  const dentroDeCampo = (e.target as HTMLElement)?.closest('input, textarea, [contenteditable]');
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
| Entrada única de iconos de pilares y animales (CSS sobre los SVG; sin Lottie) | `#por-que` |
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
- Canela es movimiento en bucle de más de 5 segundos: **necesita control de pausa visible y alcanzable con teclado** (WCAG 2.2.2). El carrusel, en cambio, **nunca gira solo**, y por eso no necesita control propio.

### Transición entre vistas (decidida 2026-10-13)

`dir` = +1 si la vista destino va después en el orden de la barra, −1 si va antes.

| Capa | Propiedades | Duración | Curva |
|---|---|---|---|
| Saliente | opacidad 1 → 0, `translateX(-dir · 1rem)`, `pointer-events: none`, por **debajo** de la entrante | 160 ms | `--ease-salida` |
| Entrante | opacidad 0 → 1, `translateX(dir · 2.5rem)` → 0 | 380 ms, 60 ms de retraso | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Bloques `[data-entra]` de la entrante (2–3: título, bloque principal, secundario) | opacidad 0 → 1, `translateX(dir · 1.5rem)` → 0 | 300 ms, 50 ms entre bloques | `--ease-vista` |

- `src/lib/animacion/vistas.ts` **devuelve una `Promise`** que se resuelve con el `animationend` de la saliente (tope de 200 ms). El router oculta la saliente cuando se resuelve; nunca antes del primer pintado, o se ve el fondo del `body` entre las dos vistas.
- En Productos, el anillo del carrusel es un bloque sin animación propia de entrada.
- Los iconos de "Por qué elegirnos" siguen empezando a los 400 ms.
- El **foco** se mueve al título antes de que empiece cualquier animación.
- Solo `transform` y `opacity`.

### Barra (decidida 2026-10-13)

- La pastilla de la vista activa se **desliza** (300 ms, `--ease-vista`) con **estiramiento direccional**: el borde que va delante tarda 240 ms y el de atrás 300 ms.
- Cada rótulo **reserva el ancho de su versión en negrita** (pseudo-elemento invisible con `content: attr(data-texto)`), para que activar un enlace no desplace a los vecinos.
- La clase `.anima` no se retira hasta el `transitionend` de la pastilla: quitar `transition-property` a mitad cancela la transición en Safari y Firefox.
- El texto del ítem activo se vuelve blanco cuando la pastilla ya está debajo (retraso de 150 ms, o inversión exacta con `clip-path` sobre una copia `aria-hidden`).
- Hover (escritorio): fondo `hoja-claro` 150 ms. Pulsación: `scale(0.96)` 90 ms. Móvil: "pop" del icono activo `scale(0.92)` → 1 en 220 ms con `--ease-rebote`.

### Regla de las transiciones CSS

La pausa del sitio hoy anula `animation` pero **no** `transition` (`global.css`). Toda `transition` nueva se condiciona con `html:not([data-movimiento="pausado"])` o con una clase que el script solo pone si `movimientoPermitido()`, además de `prefers-reduced-motion`.

---

## Pruebas obligatorias

Las nueve primeras son los modos de fallo propios de este diseño. Si alguna falla, es **bloqueante**. De la 13 a la 18 se añadieron tras la auditoría de 2026-10-13.

1. Se llega a las 5 vistas y se recorren solo con teclado (`Tab`, `Enter`, `←`, `→`).
2. **Con una vista activa, `Tab` no alcanza ningún elemento de las otras cuatro.** Es el fallo más probable.
3. El foco aterriza en el título de la vista nueva al cambiar.
4. Con el foco dentro del buscador del catálogo, `←` y `→` mueven el cursor y **no** cambian de vista.
5. Entrar por `#productos` abre esa vista; el botón "atrás" vuelve a la anterior.
6. Sin JavaScript, las 5 vistas se ven una debajo de otra.
7. El elemento enfocado nunca queda tapado por la barra fija ni por la tarjeta flotante del mapa (WCAG 2.4.11).
8. `body` no desborda en ninguna vista; el único scroll interno es la lista del catálogo.
9. A 360×640 ninguna vista desborda en horizontal ni corta contenido esencial.
10. En el HTML de `dist/` (no en el DOM ya ejecutado) están las 5 vistas completas.
11. Con `prefers-reduced-motion` activado no hay bucles, paralaje ni transiciones animadas.
12. El control de pausa del perrito existe, se alcanza con teclado y **detiene de verdad** el bucle.
13. **Sin destello entre vistas:** muestreando fotogramas con `requestAnimationFrame` durante un cambio de vista, en ningún fotograma la vista saliente está oculta mientras la entrante tiene opacidad < 0,5. Probar sobre todo al salir de Inicio (fondo oscuro).
14. **La barra no salta:** al cambiar de vista, la posición `x` de los enlaces no activos no cambia (tolerancia 0,5 px).
15. **Con la pausa del sitio activada**, ni la pastilla de la barra ni ninguna transición nueva se anima.
16. **Clics rápidos:** pulsar tres vistas seguidas en menos de 300 ms termina en la última, con una sola vista visible y el foco en su título.
17. **Hoja de detalle (móvil):** abre como `<dialog>` modal con el foco en su título, se cierra con `Esc` y con "Cerrar", y el foco vuelve a la fila que la abrió. Con la hoja abierta, `←`/`→` no cambian de vista.
18. **Canela corriendo:** nunca sale de la pantalla; gira en cada borde a 1440, 1366 y 360 px de ancho y tras redimensionar la ventana; la pausa congela cuadro y posición y al reanudar sigue desde ahí; con movimiento reducido o pausa global queda sentada y fija; fuera de Inicio no hay `requestAnimationFrame` suyo.

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
