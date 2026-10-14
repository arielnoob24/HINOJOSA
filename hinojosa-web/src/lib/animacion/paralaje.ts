// Paralaje con el raton de Inicio (storyboard-hero.md, 5; guia 7.1).
// - Capas: todo [data-paralaje] de la escena, con su data-profundidad
//   (hojas del trebol 0.2 = lejos, granos 0.5 = cerca, costales de la
//   vitrina 0.6). Desplazamiento = profundidad x --paralaje-max (<= 8 px).
//   La marca de agua no lleva [data-paralaje]: no se mueve.
// - Se mueve con la propiedad `translate`: no pisa el `rotate` de hojas y
//   costales ni el `transform` de la entrada en cascada (I9).
// - Solo con raton (hover + pointer fine), sin reduced motion, sin la pausa
//   del usuario y con Inicio activa. En tactil no se engancha nada.
// - Suavizado lerp 0.08 en requestAnimationFrame; el bucle se detiene solo
//   cuando las capas llegan a su sitio (no hay rAF en reposo).
import { alCambiarVista, vistaActual } from '../router';
import { alCambiarMovimiento, movimientoPermitido, mqPunteroFino, px, token } from './movimiento';

const escena = document.querySelector<HTMLElement>('[data-escena="inicio"]');
const capas = escena
  ? Array.from(escena.querySelectorAll<HTMLElement | SVGElement>('[data-paralaje]')).map((el) => ({
      el,
      profundidad: Math.min(1, Math.max(0, parseFloat(el.getAttribute('data-profundidad') ?? '0.5') || 0)),
    }))
  : [];

const LERP = 0.08;
let objetivoX = 0;
let objetivoY = 0;
let x = 0;
let y = 0;
let raf = 0;
let activo = false;
let maximo = 8;

function pintar() {
  for (const { el, profundidad } of capas) {
    const f = profundidad * maximo;
    el.style.translate = `${(x * f).toFixed(2)}px ${(y * f).toFixed(2)}px`;
  }
}

function paso() {
  x += (objetivoX - x) * LERP;
  y += (objetivoY - y) * LERP;
  pintar();
  if (Math.abs(objetivoX - x) > 0.001 || Math.abs(objetivoY - y) > 0.001) raf = requestAnimationFrame(paso);
  else raf = 0;
}

function alMover(ev: PointerEvent) {
  if (ev.pointerType !== 'mouse') return;
  // -1..1 respecto al centro de la ventana; las capas van al lado contrario
  objetivoX = -((ev.clientX / window.innerWidth) * 2 - 1);
  objetivoY = -((ev.clientY / window.innerHeight) * 2 - 1);
  if (!raf) raf = requestAnimationFrame(paso);
}

function actualizar() {
  const debe = capas.length > 0 && vistaActual() === 'inicio' && mqPunteroFino.matches && movimientoPermitido();
  if (debe === activo) return;
  activo = debe;
  if (debe) {
    maximo = Math.min(8, px(token('--paralaje-max'), 8));
    window.addEventListener('pointermove', alMover, { passive: true });
  } else {
    window.removeEventListener('pointermove', alMover);
    cancelAnimationFrame(raf);
    raf = 0;
    objetivoX = objetivoY = x = y = 0;
    for (const { el } of capas) el.style.translate = '';
  }
}

if (capas.length) {
  actualizar();
  alCambiarVista(actualizar);
  alCambiarMovimiento(actualizar);
  mqPunteroFino.addEventListener('change', actualizar);
}
