---
name: vistas-hinojosa
description: Contrato del router de vistas del sitio de Comercial Hinojosa (5 pantallas sin scroll, inert, foco, hash, teclado y fallbacks). Úsala al construir, animar, auditar o modificar la navegación entre vistas, el buscador del catálogo o cualquier carga diferida por vista.
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

---

## Excepciones de scroll (las únicas)

- **La lista del catálogo** de la vista Productos tiene scroll interno. Es el único panel con scroll por diseño. Si se usa Lenis, se aplica **a este contenedor**, nunca al documento.
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

- Solo la vista **Inicio** se descarga completa de entrada. Presupuesto: **menos de 1,5 MB**.
- No hay Three.js. El carrusel no tiene bucle de render: GSAP solo anima mientras gira y su ticker se duerme solo; al salir de `#productos` se terminan los tweens en curso. Comprobado con un contador de `requestAnimationFrame` (0 por segundo fuera de Productos).
- Un recurso ya cargado no se vuelve a cargar al volver a entrar en su vista.

---

## Animación

- **Una sola metáfora de transición** en todo el sitio: desplazamiento horizontal suave o fundido, 350–450 ms, `ease-out`.
- Con `prefers-reduced-motion`, el cambio de vista es **instantáneo**, el perrito de Inicio queda como imagen fija, no hay paralaje y el giro de la ruleta es instantáneo.
- El perrito de Inicio es movimiento en bucle de más de 5 segundos: **necesita control de pausa visible y alcanzable con teclado** (WCAG 2.2.2). La ruleta, en cambio, **nunca gira sola**, y por eso no necesita control propio.

---

## Pruebas obligatorias

Las nueve primeras son los modos de fallo propios de este diseño. Si alguna falla, es **bloqueante**.

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

---

## Errores que ya costaron caro

- Poner `overflow: hidden` en el CSS base en vez de aplicarlo el router: rompe el sitio sin JavaScript.
- Confiar solo en `display: none` sin `inert` cuando la vista se anima con opacidad: el foco entra en una vista invisible.
- Escuchar `←` y `→` en `window` sin excluir campos de texto: rompe el buscador del catálogo.
- Mover el foco **después** de la animación de transición: el lector de pantalla anuncia tarde o no anuncia.
- Generar una vista por JavaScript "porque es más limpio": la vista deja de indexarse.
- Aplicar Lenis al documento: no hay scroll de documento que suavizar.
