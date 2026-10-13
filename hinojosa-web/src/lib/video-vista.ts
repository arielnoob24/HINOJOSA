// Videos decorativos ligados a una vista (video[data-video-vista="<vista>"]).
// - preload="none": no se descarga nada hasta entrar en su vista.
// - El poster tampoco: va en data-poster y se asigna a `poster` al entrar en
//   la vista, o justo antes (puntero encima o foco en un enlace a esa vista).
//   Con `poster` en el HTML el navegador lo bajaba en la carga de Inicio
//   aunque la vista estuviera oculta (QA M4, 22,5 kB). Sin JS el poster se
//   pinta como fondo CSS del contenedor (html:not(.js), ver la vista).
// - Se reproduce solo con la vista activa, sin prefers-reduced-motion y sin
//   la pausa del usuario (html[data-movimiento="pausado"], evento
//   hinojosa:movimiento). Al salir de la vista se pausa.
// - Con reduced motion queda el poster (sin autoplay).
import { alCambiarVista, vistaActual } from './router';

const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-video-vista]'));
const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
const pausadoPorUsuario = () => document.documentElement.getAttribute('data-movimiento') === 'pausado';

/** Asigna el poster diferido de los videos de una vista (una sola vez). */
function prepararPoster(vista: string | null | undefined) {
  if (!vista) return;
  for (const v of videos) {
    if (v.dataset.videoVista === vista && v.dataset.poster && !v.getAttribute('poster')) {
      v.poster = v.dataset.poster;
    }
  }
}

function sincronizar() {
  const activa = vistaActual();
  prepararPoster(activa);
  for (const v of videos) {
    const debe = v.dataset.videoVista === activa && !mqReducido.matches && !pausadoPorUsuario();
    if (debe) {
      v.play().catch(() => {
        /* autoplay bloqueado o formato no soportado: queda el poster */
      });
    } else if (!v.paused) {
      v.pause();
    }
  }
}

if (videos.length) {
  alCambiarVista(sincronizar);
  window.addEventListener('hinojosa:movimiento', sincronizar);
  mqReducido.addEventListener('change', sincronizar);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((v) => v.pause());
    else sincronizar();
  });

  // "Justo antes": intencion de ir a la vista desde cualquier enlace a ella
  const vistasConVideo = new Set(videos.map((v) => v.dataset.videoVista));
  const anticipar = (e: Event) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    const destino = a?.getAttribute('href')?.slice(1);
    if (destino && vistasConVideo.has(destino)) prepararPoster(destino);
  };
  document.addEventListener('pointerover', anticipar, { passive: true });
  document.addEventListener('focusin', anticipar);
  document.addEventListener('touchstart', anticipar, { passive: true });

  sincronizar();
}
