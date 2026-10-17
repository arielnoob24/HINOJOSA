// Foto de fondo de Inicio (bloque 22, 2026-10-17): cielo y campo de
// Nuevos Req/Animales/fondo.jpg en dos capas (public/img/escena).
//
// Se PINTAN EN <canvas>, no en <img> ni background-image: una foto a
// pantalla completa pintada despues del logo seria el nuevo candidato a LCP
// (Chrome sigue emitiendo LCP hasta la primera interaccion). Un <canvas> no
// es candidato a LCP. Este modulo se pide con import() despues de `load` y
// del primer LCP (VistaInicio.astro), asi que tampoco compite en la red.
//
// Marcado: canvas[data-foto-capa="cielo|campo"] dentro de .inicio-foto. El
// tamano en CSS lo da la maqueta (misma escala para las dos capas); aqui
// solo se ajusta la resolucion del lienzo (CSS px x devicePixelRatio, sin
// pasar de la resolucion de la imagen) y se repinta al cambiar el tamano.
// Variante por ancho: >= 48rem cielo.* / campo.*, por debajo cielo-280.* /
// campo-320.*. AVIF si el navegador lo decodifica; si no, WebP.
// Al pintar se pone data-lista en el canvas (aparece con un fundido CSS);
// mientras tanto (y sin JS, con <noscript>) se ve el degradado de respaldo.

const lienzos = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas[data-foto-capa]'));
const mqAmplio = window.matchMedia('(min-width: 48rem)');

const VARIANTE_MOVIL: Record<string, string> = { cielo: 'cielo-280', campo: 'campo-320' };

const cache = new Map<string, Promise<HTMLImageElement>>();

function cargar(url: string): Promise<HTMLImageElement> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((ok, mal) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        img
          .decode()
          .catch(() => undefined)
          .then(() => ok(img));
      };
      img.onerror = () => mal(new Error(url));
      img.src = url;
    });
    cache.set(url, p);
  }
  return p;
}

async function imagenDe(capa: string): Promise<HTMLImageElement> {
  const nombre = mqAmplio.matches ? capa : (VARIANTE_MOVIL[capa] ?? capa);
  try {
    return await cargar(`/img/escena/${nombre}.avif`);
  } catch {
    return cargar(`/img/escena/${nombre}.webp`);
  }
}

const imagenes = new Map<HTMLCanvasElement, HTMLImageElement>();

function pintar(lienzo: HTMLCanvasElement) {
  const img = imagenes.get(lienzo);
  if (!img) return;
  const caja = lienzo.getBoundingClientRect();
  if (caja.width < 1 || caja.height < 1) return; // Inicio oculta: se pinta al verse
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(Math.min(caja.width * dpr, img.naturalWidth)));
  const h = Math.max(1, Math.round((w * caja.height) / caja.width));
  if (lienzo.width !== w || lienzo.height !== h) {
    lienzo.width = w;
    lienzo.height = h;
  }
  const ctx = lienzo.getContext('2d', { alpha: lienzo.dataset.fotoCapa !== 'cielo' });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  lienzo.setAttribute('data-lista', '');
}

async function preparar() {
  await Promise.all(
    lienzos.map(async (lienzo) => {
      const capa = lienzo.dataset.fotoCapa ?? '';
      try {
        imagenes.set(lienzo, await imagenDe(capa));
        pintar(lienzo);
      } catch {
        /* sin foto: se queda el degradado de respaldo */
      }
    }),
  );
}

if (lienzos.length) {
  void preparar();
  // Repinta al cambiar el tamano (o al mostrarse Inicio si estaba oculta)
  const obs = new ResizeObserver((entradas) => {
    for (const e of entradas) pintar(e.target as HTMLCanvasElement);
  });
  for (const l of lienzos) obs.observe(l);
  // Cruce de 48rem: otra variante
  mqAmplio.addEventListener('change', () => void preparar());
}

export {};
