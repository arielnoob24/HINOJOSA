// Menu de vistas en movil (bloque 28a, PLAN.md §0-D). Solo < 48rem y con
// el router activo: en escritorio el boton no se ve y nada de esto actua.
//
// Patron disclosure (no modal): <button aria-expanded aria-controls> que
// muestra u oculta el <nav id="menu-vistas"> (atributo [data-abierto]; el
// CSS de Barra.astro lo pinta como tarjeta crema bajo el encabezado). Los
// enlaces siguen siendo a[data-nav-vista]: router, historial y sin JS
// intactos.
//
// Se cierra:
//   - al elegir una vista (en el clic, antes de que el router reciba el
//     hashchange; el foco lo lleva el router al titulo, como siempre);
//   - con Escape (el foco vuelve al boton);
//   - al tocar fuera del menu y del boton;
//   - al salir del menu con Tab;
//   - al pasar la ventana a >= 48rem;
//   - si la vista cambia por otro camino (flechas, atras).
// El movimiento (200 ms al abrir, 150 ms al cerrar, nada con reduced motion
// o la pausa) es CSS puro.
import { alCambiarVista } from './router';

const html = document.documentElement;
const boton = document.querySelector<HTMLButtonElement>('[data-menu-boton]');
const menu = document.querySelector<HTMLElement>('[data-menu-vistas]');
const mqMovil = window.matchMedia('(max-width: 47.999rem)');

function abierto(): boolean {
  return boton?.getAttribute('aria-expanded') === 'true';
}

function activo(): boolean {
  return mqMovil.matches && !!html.dataset.router;
}

function abrir() {
  if (!boton || !menu || !activo()) return;
  boton.setAttribute('aria-expanded', 'true');
  menu.setAttribute('data-abierto', '');
}

function cerrar(devolverFoco = false) {
  if (!boton || !menu || !abierto()) return;
  boton.setAttribute('aria-expanded', 'false');
  menu.removeAttribute('data-abierto');
  if (devolverFoco) boton.focus();
}

if (boton && menu) {
  boton.addEventListener('click', () => (abierto() ? cerrar() : abrir()));

  // Elegir una vista: cerrar antes de que el router cambie de vista
  menu.addEventListener('click', (ev) => {
    if ((ev.target as Element | null)?.closest('a[data-nav-vista]')) cerrar();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || !abierto()) return;
    ev.preventDefault();
    cerrar(true);
  });

  // Tocar fuera (sin impedir el toque: el elemento tocado lo recibe igual)
  document.addEventListener('pointerdown', (ev) => {
    if (!abierto()) return;
    const t = ev.target as Node | null;
    if (t && (menu.contains(t) || boton.contains(t))) return;
    cerrar();
  });

  // Salir con Tab (o con cualquier movimiento de foco fuera del menu)
  menu.addEventListener('focusout', (ev) => {
    const destino = ev.relatedTarget as Node | null;
    if (!destino || menu.contains(destino) || boton.contains(destino)) return;
    cerrar();
  });

  mqMovil.addEventListener('change', () => {
    if (!mqMovil.matches) cerrar();
  });

  alCambiarVista(() => cerrar());
}
