// Senal de "hay mas abajo" en las vistas con scroll interno (QA M8).
//
// En movil, Quienes somos, Productos, Por que y Visitanos pueden no caber y
// su .vista-cuerpo se desplaza (excepcion de scroll de vistas-hinojosa).
// Sin pista, el contenido bajo el pliegue pasaba desapercibido.
//
// Aqui solo se marca [data-mas-abajo] en la <section class="vista"> cuando
// su cuerpo tiene contenido por debajo del borde visible; el degradado lo
// pinta global.css (span.vista-sombra de Vista.astro): decorativo, aria-hidden, pointer-events none, solo
// por debajo de 48rem, y su fundido se anula con reduced motion.
import { alCambiarVista } from './router';

const UMBRAL = 8; // px: por debajo se considera "al final"

const cuerpos = Array.from(document.querySelectorAll<HTMLElement>('.vista [data-vista-cuerpo]'));

function actualizar(cuerpo: HTMLElement) {
  const vista = cuerpo.closest<HTMLElement>('.vista');
  if (!vista) return;
  const resto = cuerpo.scrollHeight - cuerpo.clientHeight - cuerpo.scrollTop;
  vista.toggleAttribute('data-mas-abajo', cuerpo.clientHeight > 0 && resto > UMBRAL);
}

if (cuerpos.length && document.documentElement.hasAttribute('data-router')) {
  let pendiente = 0;
  const todos = () => {
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(() => cuerpos.forEach(actualizar));
  };

  const ro = new ResizeObserver(todos);
  for (const c of cuerpos) {
    c.addEventListener('scroll', () => actualizar(c), { passive: true });
    ro.observe(c);
    // El alto del contenido cambia al filtrar la lista, cargar imagenes, etc.
    for (const hijo of Array.from(c.children)) ro.observe(hijo);
  }
  alCambiarVista(todos);
  todos();
}
