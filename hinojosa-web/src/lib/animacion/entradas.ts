// Entradas UNICAS al entrar por primera vez en una vista (sin bucles):
//   - Quienes somos: iconos de los 6 valores.
//   - Por que elegirnos: iconos de los 4 pilares y de los 8 animales.
//   - Visitanos: el pin del mapa cae y asienta (ease-rebote).
//
// Sustituye a los Lottie del plan: los iconos ya son SVG de trazo, asi que
// se "dibujan" con stroke-dashoffset (pathLength=1) mientras el circulo de
// fondo aparece con una escala leve. Solo CSS; este modulo pone clases.
//
// Empiezan cuando termina la transicion de vista (400 ms): un movimiento
// por region (storyboard-hero.md, 3.1). Con reduced motion o pausa no se
// anima nada y los iconos estan en su estado final desde el principio.
import { alEntrarEnVista, type DetalleVista, type Vista } from '../router';
import { movimientoPermitido, ms, token } from './movimiento';

const ESCALONADO = 60; // ms entre iconos
const DURACION = 900; // pop (500) + dibujo (700) desfasados; margen para limpiar

const grupos: Partial<Record<Vista, string>> = {
  nosotros: '[data-icono-animado^="valor-"]',
  'por-que': '[data-icono-animado^="pilar-"], [data-icono-animado^="animal-"]',
};

function retrasoBase(d: DetalleVista | null): number {
  // Con transicion (cambio de vista animado) se espera a que termine
  return d && !d.inicial && d.direccion !== 0 ? ms(token('--duracion-vista'), 400) : 150;
}

function animarIconos(vista: Vista, d: DetalleVista | null) {
  if (!movimientoPermitido()) return;
  const sel = grupos[vista];
  const seccion = document.getElementById(vista);
  if (!sel || !seccion) return;
  const iconos = Array.from(seccion.querySelectorAll<HTMLElement>(sel)).filter((el) => el.offsetParent !== null);
  const base = retrasoBase(d);
  iconos.forEach((el, i) => {
    for (const forma of el.querySelectorAll('svg path, svg circle, svg ellipse, svg rect')) {
      forma.setAttribute('pathLength', '1');
    }
    el.style.setProperty('--retraso', `${base + i * ESCALONADO}ms`);
    el.classList.add('icono-entra');
  });
  // Limpieza: sin clase ni pathLength, el icono queda exactamente como antes
  window.setTimeout(() => {
    for (const el of iconos) {
      el.classList.remove('icono-entra');
      el.style.removeProperty('--retraso');
      for (const forma of el.querySelectorAll('[pathLength]')) forma.removeAttribute('pathLength');
    }
  }, base + iconos.length * ESCALONADO + DURACION + 200);
}

for (const vista of Object.keys(grupos) as Vista[]) {
  alEntrarEnVista(vista, (d) => animarIconos(vista, d), { unaVez: true });
}

// Pin del mapa: el de posicion (.vis-pin) o el de Leaflet (.mapa-pin), que
// puede insertarse mas tarde. Cada pin se anima una vez y queda marcado.
const mapa = document.querySelector<HTMLElement>('[data-mapa]');
if (mapa) {
  const marcar = (ev: AnimationEvent) => {
    const pin = (ev.target as Element).closest('.vis-pin, .mapa-pin svg');
    pin?.setAttribute('data-animado', '');
  };
  // animationcancel: se salio de la vista a medias; al volver no se repite
  mapa.addEventListener('animationend', marcar);
  mapa.addEventListener('animationcancel', marcar);
  alEntrarEnVista(
    'visitanos',
    (d) => {
      if (!movimientoPermitido()) return;
      mapa.style.setProperty('--retraso-pin', `${retrasoBase(d)}ms`);
      mapa.setAttribute('data-pin-entra', '');
    },
    { unaVez: true },
  );
}
