// Arranque de la fase 4 (animacion e interaccion). Es lo unico que va en el
// JS inicial: no importa librerias. Cada efecto se descarga con import()
// cuando la pagina ya cargo (idle), asi nunca compite con el LCP (el logo).
//
//  - scroll.ts  (GSAP + ScrollTrigger; Lenis dentro): sin reduced motion.
//  - puntero.ts (tilt + paralaje del hero): solo con raton/trackpad.
//  - hero-3d.ts (Three.js): >= 768 px, WebGL, sin gama baja, hero visible.
// Con reduced motion o con las animaciones pausadas no se descarga nada;
// si el usuario reanuda despues, se cargan en ese momento.
import {
  alCambiarMovimiento,
  enReposo,
  gamaBaja,
  hayWebGL,
  movimientoPermitido,
  mqPunteroFino,
  mqTableta,
} from './entorno';

let scrollCargado = false;
let punteroCargado = false;
let heroCargado = false;
let listo = false;

function cargarScroll() {
  if (scrollCargado || !movimientoPermitido()) return;
  scrollCargado = true;
  import('./scroll')
    .then((m) => m.iniciarScroll())
    .catch(() => {
      // Sin red o error: el contenido ya es visible porque nada se oculta
      // antes de que GSAP este cargado.
      scrollCargado = false;
    });
}

function cargarPuntero() {
  if (punteroCargado || !movimientoPermitido() || !mqPunteroFino.matches) return;
  punteroCargado = true;
  import('./puntero')
    .then((m) => m.iniciarPuntero())
    .catch(() => {
      punteroCargado = false;
    });
}

// Hero 3D: condiciones fijas (se evaluan una vez) + visibilidad del hero.
let hero3DPosible: boolean | null = null;
let heroVisible = false;

function puedeHero3D(): boolean {
  if (hero3DPosible === null) {
    hero3DPosible = mqTableta.matches && !gamaBaja() && hayWebGL();
  }
  return hero3DPosible;
}

function cargarHero3D() {
  if (heroCargado || !heroVisible || !movimientoPermitido() || !puedeHero3D()) return;
  const hero = document.querySelector<HTMLElement>('[data-escena="hero"]');
  const hueco = hero?.querySelector<HTMLElement>('[data-canela-hero]');
  if (!hero || !hueco) return;
  heroCargado = true;
  import('./hero-3d')
    .then((m) => m.iniciarHero3D(hero, hueco))
    .catch(() => {
      // Se queda la version CSS (granos SVG).
    });
}

function observarHero() {
  const hero = document.querySelector('[data-escena="hero"]');
  if (!hero || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entradas) => {
      heroVisible = entradas.some((e) => e.isIntersecting);
      if (heroVisible && listo) cargarHero3D();
    },
    { rootMargin: '100px' },
  );
  io.observe(hero);
}

observarHero();

enReposo(() => {
  listo = true;
  cargarScroll();
  cargarPuntero();
  cargarHero3D();
});

// Si el usuario reanuda las animaciones (o cambia su preferencia del
// sistema), cargar lo que aun no se cargo. Cada modulo gestiona su pausa.
alCambiarMovimiento((permitido) => {
  if (!permitido || !listo) return;
  cargarScroll();
  cargarPuntero();
  cargarHero3D();
});

// La ventana pasa a ser lo bastante ancha (girar una tableta): reintentar.
mqTableta.addEventListener('change', () => {
  if (mqTableta.matches && listo) {
    hero3DPosible = null;
    cargarHero3D();
  }
});
