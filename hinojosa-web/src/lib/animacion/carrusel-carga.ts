// Carga diferida del carrusel 3D: el disparador es el cambio de vista
// (no hay scroll ni IntersectionObserver). La primera vez que se entra en
// Productos se descargan carrusel.ts + GSAP (core, sin CSSPlugin). Si la
// descarga falla, se queda la rejilla de respaldo y la lista intacta.
// Con reduced motion tambien se monta: el anillo es informacion espacial
// estatica; solo sus cambios pasan a ser instantaneos.
//
// html[data-carrusel-pendiente] (lo pone el script inline de Layout.astro
// si hay CSS 3D) oculta la rejilla y muestra la tarjeta provisional del
// producto al frente mientras llega el carrusel, para que la imagen LCP no
// dependa de este JS ni compita con la rejilla (QA M5). Se quita:
//   - montado el anillo, en la primera interaccion con el catalogo (antes
//     de que nada gire) o a los ESPERA_RELEVO ms. Hasta entonces la
//     provisional queda debajo del frente del anillo, identica. Quitarla al
//     montar hacia que Chrome descartara su candidato LCP sin anunciarlo;
//   - si no hay 3D, si la carga falla o si tarda mas de ESPERA_MAX (la
//     rejilla vuelve a ser el respaldo visible).
import { alEntrarEnVista } from '../router';

const ESPERA_MAX = 5000;
const ESPERA_RELEVO = 1500;
const html = document.documentElement;
const quitarPendiente = () => html.removeAttribute('data-carrusel-pendiente');

/** Relevo provisional -> anillo: a la primera interaccion o por tiempo. */
function relevarAlInteractuar() {
  const carrusel = document.querySelector<HTMLElement>('[data-carrusel]');
  const fin = () => {
    window.clearTimeout(t);
    window.removeEventListener('hinojosa:producto', alProducto);
    carrusel?.removeEventListener('pointerdown', fin, true);
    quitarPendiente();
  };
  const alProducto = (ev: Event) => {
    if ((ev as CustomEvent<{ origen?: string }>).detail?.origen !== 'inicial') fin();
  };
  // Captura: se quita ANTES de que el anillo empiece a girar o arrastrar
  window.addEventListener('hinojosa:producto', alProducto);
  carrusel?.addEventListener('pointerdown', fin, true);
  const t = window.setTimeout(fin, ESPERA_RELEVO);
}

if (document.querySelector('[data-carrusel-escena]')) {
  alEntrarEnVista(
    'productos',
    () => {
      // La provisional es el primer producto de la primera categoria. Si se
      // llega con otro ya elegido (accesos por categoria de Inicio,
      // catalogo.abrirCategoria), no sirve: quedaria debajo de un frente
      // distinto y se veria por sus zonas transparentes.
      const marco = document.querySelector<HTMLElement>('[data-frente-provisional]');
      const activo = window.hinojosaCatalogo?.estado().id;
      if (marco && activo && marco.dataset.frenteProvisional !== activo) quitarPendiente();
      // Tarjeta provisional: si se llega desde otra vista aun no tiene src
      // (al entrar directo por #productos se lo puso el script inline)
      const provisional = marco?.querySelector<HTMLImageElement>('img');
      if (provisional && !provisional.getAttribute('src') && html.hasAttribute('data-carrusel-pendiente')) {
        provisional.src = provisional.dataset.src ?? '';
      }
      const vigia = window.setTimeout(quitarPendiente, ESPERA_MAX);
      import('./carrusel')
        .then(() => {
          window.clearTimeout(vigia);
          // Sin 3D no se monta el anillo: la rejilla queda como definitiva
          const montado = document.querySelector<HTMLElement>('[data-carrusel]')?.dataset.modo === '3d';
          if (montado) relevarAlInteractuar();
          else quitarPendiente();
        })
        .catch(() => {
          /* sin red o sin soporte: la rejilla sigue funcionando */
          window.clearTimeout(vigia);
          quitarPendiente();
        });
    },
    { unaVez: true },
  );
} else {
  quitarPendiente();
}
