// Paralaje de los granos de maiz de Inicio (storyboard-hero.md, 4).
// - Maximo 8 px (--paralaje-max), cada grano con su profundidad (4-8 px).
// - Solo con raton (hover + pointer fine), sin reduced motion, sin la pausa
//   del usuario y con Inicio activa. En tactil no se engancha nada.
// - Suavizado lerp 0.08 en requestAnimationFrame; el bucle se detiene solo
//   cuando los granos llegan a su sitio (no hay rAF en reposo).
import { alCambiarVista, vistaActual } from '../router';
import { alCambiarMovimiento, movimientoPermitido, mqPunteroFino, px, token } from './movimiento';

const escena = document.querySelector<HTMLElement>('[data-escena="inicio"]');
const capa = escena?.querySelector<HTMLElement>('[data-capa="granos"]');
const granos = capa ? Array.from(capa.querySelectorAll<SVGElement>('svg')) : [];

const LERP = 0.08;
let objetivoX = 0;
let objetivoY = 0;
let x = 0;
let y = 0;
let raf = 0;
let activo = false;
let maximo = 8;
// Factor por grano (0.5-1): da sensacion de profundidad sin otra capa
const factores = granos.map((_, i) => 0.5 + 0.5 * (((i * 37) % 100) / 100));

function pintar() {
  granos.forEach((g, i) => {
    const f = factores[i] * maximo;
    g.style.translate = `${(x * f).toFixed(2)}px ${(y * f).toFixed(2)}px`;
  });
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
  // -1..1 respecto al centro de la ventana; los granos van al lado contrario
  objetivoX = -((ev.clientX / window.innerWidth) * 2 - 1);
  objetivoY = -((ev.clientY / window.innerHeight) * 2 - 1);
  if (!raf) raf = requestAnimationFrame(paso);
}

function actualizar() {
  const debe = granos.length > 0 && vistaActual() === 'inicio' && mqPunteroFino.matches && movimientoPermitido();
  if (debe === activo) return;
  activo = debe;
  if (debe) {
    maximo = px(token('--paralaje-max'), 8);
    window.addEventListener('pointermove', alMover, { passive: true });
  } else {
    window.removeEventListener('pointermove', alMover);
    cancelAnimationFrame(raf);
    raf = 0;
    objetivoX = objetivoY = x = y = 0;
    for (const g of granos) g.style.translate = '';
  }
}

if (granos.length) {
  actualizar();
  alCambiarVista(actualizar);
  alCambiarMovimiento(actualizar);
  mqPunteroFino.addEventListener('change', actualizar);
}
