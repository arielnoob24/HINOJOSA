// Lienzos de la escena de Inicio (bloque 22, ajustes del 2026-10-17 tarde):
// el VIDEO de fondo (time-lapse del campo, public/video/campo*) y los
// ANIMALES de la foto de familia (public/img/animales).
//
// Por que <canvas>: el logo debe seguir siendo el LCP. Chrome cuenta como
// candidato a LCP un <video> (su poster o su primer cuadro) y cualquier <img>
// grande que se pinte despues del logo, aunque llegue tras `load` (medido:
// un video al 80 % de la ventana arrancado 800 ms despues de `load` pasa a
// ser el LCP; la vaca de la foto de familia mide ~4 veces el logo). Un
// <canvas> no es candidato. Este modulo se pide con import() despues de
// `load` y del primer LCP (VistaInicio.astro): nada compite con el logo en
// la red y el video NUNCA se descarga antes de `load`.
//
// Video:
//   - video[data-video-fondo] (1 px, transparente) es la fuente; cada cuadro
//     nuevo se copia al canvas[data-video-lienzo] con
//     requestVideoFrameCallback (24 fps; sin rVFC, requestAnimationFrame
//     solo mientras se reproduce). Encaje tipo object-fit: cover, centrado.
//   - Variante: vertical (orientation: portrait) -> campo-movil (432x768);
//     si no -> campo (1280x720). WebM VP9 si se puede; si no, MP4 H.264.
//   - Primero se pinta el poster (primer cuadro del bucle, AVIF o WebP),
//     solo cuando se ve Inicio.
//   - Se reproduce solo con #inicio activa, la pestana visible, movimiento
//     permitido (sin prefers-reduced-motion ni html[data-movimiento=
//     "pausado"]) y sin navigator.connection.saveData. Si no, pausado (con
//     reduced motion, pausa o saveData ni se descarga: queda el poster). Al
//     volver a Inicio se reanuda. Pausado no hay ningun bucle: 0 rAF.
//   - El lienzo mide como mucho la zona del video que se ve (no se amplia
//     en el lienzo: lo hace el CSS) para que copiar cada cuadro cueste poco.
//
// Animales: canvas[data-animal-lienzo][data-slug] dentro de cada
// [data-animal-cuerpo]. Se pintan una vez con la variante justa (-240 o 480,
// AVIF o WebP) y se repintan al cambiar de tamano; los ocultos (display:
// none en movil) no se piden hasta que se ven (ResizeObserver).
//
// Al pintar se pone data-lista (fundido CSS). Mientras tanto, y sin JS
// (<noscript>), se ve el degradado de respaldo o el poster.
import { alCambiarVista, vistaActual } from './router';
import { movimientoPermitido, mqReducido } from './animacion/movimiento';

const html = document.documentElement;
const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

// ---------------------------------------------------------------------
// Imagenes (AVIF con respaldo WebP), con cache
// ---------------------------------------------------------------------
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
let avifOk = true;
async function imagen(base: string): Promise<HTMLImageElement> {
  if (avifOk) {
    try {
      return await cargar(`${base}.avif`);
    } catch {
      avifOk = false;
    }
  }
  return cargar(`${base}.webp`);
}

/** Recorte tipo object-fit: cover (centrado) de una fuente sw x sh en dw x dh. */
function cubrir(sw: number, sh: number, dw: number, dh: number) {
  const s = Math.max(dw / sw, dh / sh);
  const w = dw / s;
  const h = dh / s;
  return { sx: (sw - w) / 2, sy: (sh - h) / 2, sw: w, sh: h };
}

// ---------------------------------------------------------------------
// Video de fondo
// ---------------------------------------------------------------------
const lienzo = document.querySelector<HTMLCanvasElement>('canvas[data-video-lienzo]');
const video = document.querySelector<HTMLVideoElement>('video[data-video-fondo]');
const seccion = document.getElementById('inicio');
const mqVertical = window.matchMedia('(orientation: portrait)');

type Variante = 'escritorio' | 'movil';
let variante: Variante = mqVertical.matches ? 'movil' : 'escritorio';
let poster: HTMLImageElement | null = null;
/** La fuente cargada en el <video> (variante), o null si aun no se pidio. */
let videoCargado: Variante | null = null;
let hayCuadro = false;
let cuadros = 0;
let bucle = 0;
const conRvfc = !!video && 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

const ahorroDatos = () =>
  !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function base(v: Variante) {
  if (!video) return '';
  return (v === 'movil' ? video.dataset.fuenteMovil : video.dataset.fuenteEscritorio) ?? '';
}

/** Ajusta la resolucion del lienzo a la fuente (sin ampliar) y la caja CSS. */
function medir(sw: number, sh: number): boolean {
  if (!lienzo) return false;
  const caja = lienzo.getBoundingClientRect();
  if (caja.width < 1 || caja.height < 1) return false; // Inicio oculta
  const c = cubrir(sw, sh, caja.width, caja.height);
  const w = Math.max(1, Math.round(Math.min(caja.width * dpr(), c.sw)));
  const h = Math.max(1, Math.round((w * caja.height) / caja.width));
  if (lienzo.width !== w || lienzo.height !== h) {
    lienzo.width = w;
    lienzo.height = h;
  }
  return true;
}

let ctx: CanvasRenderingContext2D | null = null;
function dibujar(fuente: CanvasImageSource, sw: number, sh: number) {
  if (!lienzo || !sw || !sh || !medir(sw, sh)) return;
  ctx ??= lienzo.getContext('2d', { alpha: false });
  if (!ctx) return;
  const c = cubrir(sw, sh, lienzo.width, lienzo.height);
  ctx.drawImage(fuente, c.sx, c.sy, c.sw, c.sh, 0, 0, lienzo.width, lienzo.height);
  if (!lienzo.hasAttribute('data-lista')) lienzo.setAttribute('data-lista', '');
}

/** Repinta lo ultimo que haya: el cuadro actual del video o el poster. */
function repintar() {
  if (video && hayCuadro && videoCargado === variante && video.readyState >= 2) {
    dibujar(video, video.videoWidth, video.videoHeight);
  } else if (poster) {
    dibujar(poster, poster.naturalWidth, poster.naturalHeight);
  }
}

function alCuadro() {
  bucle = 0;
  if (!video) return;
  hayCuadro = true;
  cuadros++;
  dibujar(video, video.videoWidth, video.videoHeight);
  programar();
}

function programar() {
  if (!video || bucle || video.paused) return;
  if (conRvfc) bucle = video.requestVideoFrameCallback(alCuadro);
  else bucle = requestAnimationFrame(alCuadro);
}

function cancelar() {
  if (!video || !bucle) return;
  if (conRvfc) video.cancelVideoFrameCallback(bucle);
  else cancelAnimationFrame(bucle);
  bucle = 0;
}

let posterPedido = false;
async function cargarPoster() {
  posterPedido = true;
  const v = variante;
  try {
    const img = await imagen(`${base(v)}-poster`);
    if (v !== variante) return;
    poster = img;
    if (!hayCuadro || videoCargado !== variante) dibujar(img, img.naturalWidth, img.naturalHeight);
  } catch {
    /* sin poster: queda el degradado */
  }
}

function cargarVideo() {
  if (!video) return;
  const webm = video.canPlayType('video/webm; codecs="vp9"') !== '';
  video.muted = true;
  video.src = `${base(variante)}.${webm ? 'webm' : 'mp4'}`;
  video.preload = 'auto';
  videoCargado = variante;
  hayCuadro = false;
}

const debeReproducir = () =>
  vistaActual() === 'inicio' && !document.hidden && movimientoPermitido() && !ahorroDatos();

let estado: 'sin-cargar' | 'reproduciendo' | 'pausado' = 'sin-cargar';

function sincronizar() {
  if (!video) return;
  // El poster solo hace falta si se ve Inicio (entrada por otra vista: nada)
  if (!posterPedido && vistaActual() === 'inicio') void cargarPoster();
  if (debeReproducir()) {
    if (videoCargado !== variante) cargarVideo();
    estado = 'reproduciendo';
    video
      .play()
      .then(programar)
      .catch(() => {
        /* autoplay bloqueado o formato no soportado: queda el poster */
        estado = 'pausado';
      });
  } else {
    if (!video.paused) video.pause();
    cancelar();
    if (videoCargado) estado = 'pausado';
  }
}

if (lienzo && video) {
  video.addEventListener('playing', programar);
  video.addEventListener('pause', cancelar);
  sincronizar();
  alCambiarVista(sincronizar);
  document.addEventListener('visibilitychange', sincronizar);
  window.addEventListener('hinojosa:movimiento', sincronizar);
  mqReducido.addEventListener('change', sincronizar);
  new MutationObserver(sincronizar).observe(html, { attributes: true, attributeFilter: ['data-movimiento'] });
  // Al mostrarse Inicio o cambiar el tamano: repinta lo que haya
  new ResizeObserver(repintar).observe(lienzo);
  // Giro del movil o ventana que pasa a vertical: otra variante
  mqVertical.addEventListener('change', () => {
    variante = mqVertical.matches ? 'movil' : 'escritorio';
    hayCuadro = false;
    poster = null;
    posterPedido = false;
    if (vistaActual() === 'inicio') void cargarPoster();
    if (videoCargado) {
      cancelar();
      videoCargado = null;
      sincronizar();
    }
  });
}

// ---------------------------------------------------------------------
// Animales
// ---------------------------------------------------------------------
const lienzosAnimales = Array.from(document.querySelectorAll<HTMLCanvasElement>('canvas[data-animal-lienzo]'));
const imagenesAnimal = new Map<HTMLCanvasElement, HTMLImageElement>();

async function pintarAnimal(c: HTMLCanvasElement) {
  const caja = c.getBoundingClientRect();
  if (caja.width < 1 || caja.height < 1) return; // oculto
  const alto = caja.height * dpr();
  const slug = c.dataset.slug ?? '';
  const nombre = alto <= 250 ? `${slug}-240` : slug;
  let img = imagenesAnimal.get(c);
  if (!img || !img.src.includes(`/${nombre}.`)) {
    try {
      img = await imagen(`/img/animales/${nombre}`);
    } catch {
      return;
    }
    imagenesAnimal.set(c, img);
  }
  const w = Math.max(1, Math.round(Math.min(caja.width * dpr(), img.naturalWidth)));
  const h = Math.max(1, Math.round((w * caja.height) / caja.width));
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if (!x) return;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.clearRect(0, 0, w, h);
  x.drawImage(img, 0, 0, w, h);
  c.setAttribute('data-lista', '');
}

if (lienzosAnimales.length) {
  const obs = new ResizeObserver((entradas) => {
    for (const e of entradas) void pintarAnimal(e.target as HTMLCanvasElement);
  });
  for (const c of lienzosAnimales) obs.observe(c);
}

// ---------------------------------------------------------------------
// Diagnostico (pruebas de vistas-hinojosa)
// ---------------------------------------------------------------------
declare global {
  interface Window {
    hinojosaVideoFondo?: {
      estado: () => string;
      variante: () => string;
      cuadros: () => number;
      fuente: () => string;
      /** Solo pruebas: pausa en el segundo `t` y pinta ese cuadro. */
      irA: (t: number) => Promise<void>;
    };
  }
}
window.hinojosaVideoFondo = {
  estado: () => (video?.paused === false ? 'reproduciendo' : estado === 'sin-cargar' ? 'sin-cargar' : 'pausado'),
  variante: () => variante,
  cuadros: () => cuadros,
  fuente: () => video?.currentSrc ?? '',
  irA: (t: number) =>
    new Promise<void>((ok) => {
      if (!video) return ok();
      if (videoCargado !== variante) cargarVideo();
      video.pause();
      cancelar();
      const listo = () => {
        hayCuadro = true;
        dibujar(video, video.videoWidth, video.videoHeight);
        requestAnimationFrame(() => requestAnimationFrame(() => ok()));
      };
      video.addEventListener('seeked', listo, { once: true });
      video.currentTime = t;
    }),
};

// Si el <video> se oculta junto con Inicio: seccion oculta = pausado
if (seccion) new MutationObserver(sincronizar).observe(seccion, { attributes: true, attributeFilter: ['hidden'] });

export {};
