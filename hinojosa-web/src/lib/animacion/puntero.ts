// Interacciones con raton/trackpad (fase 4). Se carga solo con
// (hover: hover) and (pointer: fine) y sin reduced motion.
//
// 1. Tilt 3D en [data-tilt]: implementacion propia (~1 kB, sin vanilla-tilt).
//    Maximo 6 grados y un brillo oro suave; escribe variables CSS que usa
//    global.css (.tilt-js), solo transform.
// 2. Paralaje de las capas del hero ([data-capa][data-profundidad]) con el
//    puntero (tope --paralaje-max: 12 px) y con el scroll, en >= 768 px.
//    Usa la propiedad `translate`, que no choca con las animaciones CSS
//    de entrada que usan `transform`.
// Todo se detiene con el boton de pausa o con reduced motion.
import { alCambiarMovimiento, html, movimientoPermitido, mqTableta } from './entorno';

const TILT_MAX = 6; // grados

function iniciarTilt() {
  const tarjetas = document.querySelectorAll<HTMLElement>('[data-tilt]');
  if (!tarjetas.length) return;
  html.classList.add('tilt-js');

  tarjetas.forEach((el) => {
    let rect: DOMRect | null = null;
    let cuadro = 0;
    let ultimo: PointerEvent | null = null;

    const pintar = () => {
      cuadro = 0;
      if (!ultimo || !rect) return;
      const x = (ultimo.clientX - rect.left) / rect.width; // 0..1
      const y = (ultimo.clientY - rect.top) / rect.height;
      el.style.setProperty('--tilt-y', `${((x - 0.5) * 2 * TILT_MAX).toFixed(2)}deg`);
      el.style.setProperty('--tilt-x', `${((0.5 - y) * 2 * TILT_MAX).toFixed(2)}deg`);
      el.style.setProperty('--brillo-x', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--brillo-y', `${(y * 100).toFixed(1)}%`);
    };

    el.addEventListener('pointerenter', (ev) => {
      if (ev.pointerType === 'touch' || !movimientoPermitido()) return;
      rect = el.getBoundingClientRect();
      el.classList.add('tilt-activo');
    });
    el.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch' || !rect || !movimientoPermitido()) return;
      ultimo = ev;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    });
    el.addEventListener('pointerleave', () => {
      rect = null;
      ultimo = null;
      el.classList.remove('tilt-activo');
      ['--tilt-x', '--tilt-y', '--brillo-x', '--brillo-y'].forEach((v) => el.style.removeProperty(v));
    });
  });

  alCambiarMovimiento((permitido) => {
    if (permitido) return;
    tarjetas.forEach((el) => {
      el.classList.remove('tilt-activo');
      ['--tilt-x', '--tilt-y', '--brillo-x', '--brillo-y'].forEach((v) => el.style.removeProperty(v));
    });
  });
}

function iniciarParalajeHero() {
  const hero = document.querySelector<HTMLElement>('[data-escena="hero"]');
  if (!hero) return;
  const capas = Array.from(hero.querySelectorAll<HTMLElement>('[data-capa][data-profundidad]')).map((el) => ({
    el,
    p: Number(el.dataset.profundidad) || 0,
  }));
  if (!capas.length) return;

  const maxPx = parseFloat(getComputedStyle(html).getPropertyValue('--paralaje-max')) || 12;
  const pMax = Math.max(...capas.map((c) => c.p));
  const objetivo = { x: 0, y: 0 };
  const actual = { x: 0, y: 0 };
  let scrollPintado = -1;
  let visible = true;
  let cuadro = 0;

  const activo = () => visible && movimientoPermitido() && mqTableta.matches;

  const limpiar = () => {
    capas.forEach(({ el }) => (el.style.translate = ''));
    actual.x = actual.y = 0;
    scrollPintado = -1;
  };

  const paso = () => {
    cuadro = 0;
    if (!activo()) return;
    actual.x += (objetivo.x - actual.x) * 0.08;
    actual.y += (objetivo.y - actual.y) * 0.08;
    const sy = Math.min(window.scrollY, hero.offsetHeight);
    capas.forEach(({ el, p }) => {
      const k = (p / pMax) * maxPx;
      // Scroll: la capa se queda atras un poco (mitad de su profundidad).
      el.style.translate = `${(actual.x * k).toFixed(2)}px ${(actual.y * k + sy * p * 0.5).toFixed(2)}px`;
    });
    scrollPintado = sy;
    const quieto =
      Math.abs(objetivo.x - actual.x) < 0.002 && Math.abs(objetivo.y - actual.y) < 0.002;
    if (!quieto) cuadro = requestAnimationFrame(paso);
  };

  const pedir = () => {
    if (!cuadro && activo()) cuadro = requestAnimationFrame(paso);
  };

  hero.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    objetivo.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    objetivo.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    pedir();
  });
  hero.addEventListener('pointerleave', () => {
    objetivo.x = objetivo.y = 0;
    pedir();
  });
  window.addEventListener(
    'scroll',
    () => {
      if (Math.min(window.scrollY, hero.offsetHeight) !== scrollPintado) pedir();
    },
    { passive: true },
  );

  new IntersectionObserver((entradas) => {
    visible = entradas.some((e) => e.isIntersecting);
    pedir();
  }).observe(hero);

  alCambiarMovimiento((permitido) => (permitido ? pedir() : limpiar()));
  mqTableta.addEventListener('change', () => (mqTableta.matches ? pedir() : limpiar()));
}

export function iniciarPuntero(): void {
  iniciarTilt();
  iniciarParalajeHero();
}
