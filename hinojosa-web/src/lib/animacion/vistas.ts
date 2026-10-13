// Transicion entre vistas + pastilla de la barra (storyboard-hero.md, 3).
//
// Una sola metafora en todo el sitio: la vista ENTRANTE se desplaza 48 px
// y aparece con un fundido (400 ms, ease-vista), desde la derecha si se
// avanza en el orden de la barra y desde la izquierda si se retrocede. La
// saliente se oculta al instante (un movimiento por region).
//
// El foco NO espera: el router ya lo movio al titulo antes de llamar a la
// transicion. Con prefers-reduced-motion o con la pausa del usuario el
// router no llama a la transicion y el corte es seco (la pastilla tambien).
//
// Solo CSS (keyframes vista-adelante / vista-atras de tokens.css): sin
// GSAP, para que Inicio no cargue ninguna libreria de animacion.
import { registrarTransicion, alCambiarVista, vistaActual } from '../router';
import { movimientoPermitido } from './movimiento';

const html = document.documentElement;

// ---------------------------------------------------------------------
// Transicion
// ---------------------------------------------------------------------
registrarTransicion(({ entrante, direccion }) => {
  for (const v of document.querySelectorAll<HTMLElement>('.vista[data-entrando]')) {
    if (v !== entrante) v.removeAttribute('data-entrando');
  }
  // Reinicia la animacion si la misma vista vuelve a entrar enseguida
  entrante.removeAttribute('data-entrando');
  void entrante.offsetWidth;
  entrante.setAttribute('data-entrando', direccion > 0 ? 'adelante' : 'atras');

  const fin = (ev: AnimationEvent) => {
    if (ev.target !== entrante) return; // animaciones de hijos (iconos...)
    entrante.removeAttribute('data-entrando');
    entrante.removeEventListener('animationend', fin);
    entrante.removeEventListener('animationcancel', fin);
  };
  entrante.addEventListener('animationend', fin);
  entrante.addEventListener('animationcancel', fin);
  // Se devuelve sin promesa: el router oculta la saliente en el acto.
});

// ---------------------------------------------------------------------
// Pastilla de la vista activa (300 ms, misma curva, empieza a la vez)
// ---------------------------------------------------------------------
const nav = document.querySelector<HTMLElement>('[data-barra] nav');
const pastilla = nav?.querySelector<HTMLElement>('[data-pastilla]') ?? null;
const mqMovil = window.matchMedia('(max-width: 47.999rem)');

function colocar(animar: boolean) {
  if (!nav || !pastilla) return;
  const activo = nav.querySelector<HTMLElement>('a[data-nav-vista][aria-current="page"]');
  if (!activo) return;
  // Con el router en movil, la pastilla rodea el icono; si no, todo el enlace
  const objetivo =
    html.dataset.router && mqMovil.matches ? activo.querySelector<HTMLElement>('.barra-icono') ?? activo : activo;
  const rn = nav.getBoundingClientRect();
  const ro = objetivo.getBoundingClientRect();
  if (!ro.width) return;
  pastilla.classList.toggle('anima', animar && movimientoPermitido());
  pastilla.style.setProperty('--pastilla-x', `${ro.left - rn.left}px`);
  pastilla.style.setProperty('--pastilla-y', `${ro.top - rn.top}px`);
  pastilla.style.setProperty('--pastilla-w', `${ro.width}px`);
  pastilla.style.setProperty('--pastilla-h', `${ro.height}px`);
  html.classList.add('pastilla-lista');
}

if (nav && pastilla) {
  colocar(false);
  alCambiarVista((d) => colocar(!d.inicial));
  // Cambios de ancho (fuentes, etiquetas cortas/largas, giro del movil):
  // se recoloca sin animar.
  const ro = new ResizeObserver(() => colocar(false));
  ro.observe(nav);
  for (const a of nav.querySelectorAll('a[data-nav-vista]')) ro.observe(a);
  mqMovil.addEventListener('change', () => colocar(false));
  document.fonts?.ready.then(() => colocar(false));
  if (!vistaActual()) html.classList.remove('pastilla-lista');
}
