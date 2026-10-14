// Transicion entre vistas + pastilla de la barra.
// Contrato: skill `vistas-hinojosa` ("Transicion entre vistas", "Barra") y
// docs/storyboard-hero.md seccion 4.
//
// TRANSICION (T1, T2, A+): fundido cruzado direccional en DOS capas.
//   - Saliente: se aparta 1 rem hacia -dir y se funde (160 ms, ease-salida),
//     por debajo de la entrante. La funcion devuelve una Promise que se
//     resuelve con su animationend (tope 200 ms); el router la oculta
//     entonces y nunca antes: asi no se ve el fondo del body entre vistas.
//   - Entrante: llega desde dir x 2,5 rem (380 ms, 60 ms de retraso).
//   - Bloques [data-entra] de la entrante (style="--orden: N"): desde
//     dir x 1,5 rem, 300 ms, 60 ms + N x 50 ms.
//   Solo CSS (keyframes vista-sale / vista-entra / bloque-entra de
//   tokens.css); este modulo pone atributos y variables. Sin GSAP.
//
// El foco NO espera: el router ya lo movio al titulo antes de llamar a la
// transicion. Con prefers-reduced-motion o con la pausa del sitio el router
// no llama a la transicion y el corte es seco (la pastilla tambien salta).
// Clics rapidos: la saliente nueva parte del estado en que estaba (opacidad
// y desplazamiento leidos en el momento), nunca de golpe a 1.
import { registrarTransicion, alCambiarVista, vistaActual } from '../router';
import { alCambiarMovimiento, cubicBezier, movimientoPermitido, ms, token } from './movimiento';

const html = document.documentElement;

/** Tope de la promesa: la saliente dura 160 ms; si su animationend no llega
 *  (pestana en segundo plano, animacion anulada), se cierra igual. */
const TOPE_SALIDA = 200;

let tiempos: { limpieza: number } | null = null;
function leerTiempos() {
  if (tiempos) return tiempos;
  const retraso = ms(token('--retraso-vista-entra'), 60);
  const entra = ms(token('--duracion-vista-entra'), 380);
  const bloque = ms(token('--duracion-bloque'), 300);
  const escalon = ms(token('--escalon-bloque'), 50);
  // Hasta el ultimo bloque (--orden 2) y un margen de un par de fotogramas
  tiempos = { limpieza: retraso + Math.max(entra, 2 * escalon + bloque) + 40 };
  return tiempos;
}

/** Primer valor de `translate` calculado ("24px", "24px 0px", "none"). */
function translateX(valor: string): string {
  const primero = valor.trim().split(/\s+/)[0];
  return !primero || primero === 'none' ? '0px' : primero;
}

let temporizadorLimpieza = 0;

registrarTransicion(({ saliente, entrante, direccion }) => {
  // 1. Estado de partida de la saliente. Si estaba entrando (clic rapido),
  //    sale desde la opacidad y el desplazamiento que tenia en este instante.
  const cs = getComputedStyle(saliente);
  const opacidad = Math.min(1, Math.max(0, parseFloat(cs.opacity) || 0));
  const x = translateX(cs.translate || 'none');

  // 2. Limpia transiciones anteriores: solo una entrante y una saliente.
  for (const v of document.querySelectorAll<HTMLElement>('.vista[data-sale], .vista[data-entrando]')) {
    v.removeAttribute('data-sale');
    if (v !== entrante) v.removeAttribute('data-entrando');
  }
  window.clearTimeout(temporizadorLimpieza);

  // 3. Saliente: por debajo, se aparta hacia -dir y se funde
  saliente.style.setProperty('--dir', String(direccion));
  saliente.style.setProperty('--sale-opacidad', String(opacidad));
  saliente.style.setProperty('--sale-x', x);
  saliente.setAttribute('data-sale', '');

  // 4. Entrante (y sus bloques [data-entra]): por encima, desde dir
  entrante.style.setProperty('--dir', String(direccion));
  if (entrante.hasAttribute('data-entrando')) {
    entrante.removeAttribute('data-entrando');
    void entrante.offsetWidth; // reinicia la animacion
  }
  entrante.setAttribute('data-entrando', '');
  temporizadorLimpieza = window.setTimeout(() => {
    entrante.removeAttribute('data-entrando');
  }, leerTiempos().limpieza);

  // 5. Promesa: animationend de la saliente (o cancelacion, o tope)
  return new Promise<void>((resolver) => {
    let hecho = false;
    const fin = (ev?: Event) => {
      if (ev && (ev.target !== saliente || (ev as AnimationEvent).animationName !== 'vista-sale')) return;
      if (hecho) return;
      hecho = true;
      window.clearTimeout(tope);
      saliente.removeEventListener('animationend', fin);
      saliente.removeEventListener('animationcancel', fin);
      resolver();
    };
    saliente.addEventListener('animationend', fin);
    saliente.addEventListener('animationcancel', fin);
    const tope = window.setTimeout(fin, TOPE_SALIDA);
  });
});

// ---------------------------------------------------------------------
// Pastilla de la vista activa (B2-B4)
// ---------------------------------------------------------------------
// Se desliza 300 ms con ESTIRAMIENTO DIRECCIONAL: el borde que va delante
// llega en 240 ms y el de atras en 300 ms (misma curva ease-vista). Las dos
// aristas siguen curvas distintas, cosa que una transition de CSS sobre
// translate + width no puede expresar (el ancho crece y vuelve a encoger),
// asi que se anima con Web Animations: se muestrean ambas aristas y se
// interpolan linealmente entre muestras. Solo transform y width.
//
// `.anima` marca la pastilla mientras se desliza y no se retira hasta que
// la animacion termina (finish/cancel): el ResizeObserver solo actualiza el
// destino, nunca corta el movimiento. Con movimiento reducido o pausa salta.
const nav = document.querySelector<HTMLElement>('[data-barra] nav');
const pastilla = nav?.querySelector<HTMLElement>('[data-pastilla]') ?? null;
const mqMovil = window.matchMedia('(max-width: 47.999rem)');

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
}

let animacion: Animation | null = null;
let curva: ((p: number) => number) | null = null;
const MUESTRAS = 22;

function medir(): Caja | null {
  if (!nav) return null;
  const activo = nav.querySelector<HTMLElement>('a[data-nav-vista][aria-current="page"]');
  if (!activo) return null;
  // Con el router en movil, la pastilla rodea el icono; si no, todo el enlace
  const objetivo =
    html.dataset.router && mqMovil.matches ? activo.querySelector<HTMLElement>('.barra-icono') ?? activo : activo;
  const rn = nav.getBoundingClientRect();
  const ro = objetivo.getBoundingClientRect();
  if (!ro.width) return null;
  // El transform:scale de la pulsacion (:active) altera el rectangulo; se
  // corrige con el tamano de diseno (offsetWidth/Height no lo incluyen).
  const w = objetivo.offsetWidth || ro.width;
  const h = objetivo.offsetHeight || ro.height;
  return {
    x: ro.left + ro.width / 2 - w / 2 - rn.left,
    y: ro.top + ro.height / 2 - h / 2 - rn.top,
    w,
    h,
  };
}

/** Donde esta la pastilla AHORA (en mitad de una animacion, el valor animado). */
function estadoActual(): Caja | null {
  if (!pastilla) return null;
  const cs = getComputedStyle(pastilla);
  const w = parseFloat(cs.width);
  const h = parseFloat(cs.height);
  if (!Number.isFinite(w) || !w) return null;
  let x = 0;
  let y = 0;
  if (cs.transform && cs.transform !== 'none') {
    const m = new DOMMatrixReadOnly(cs.transform);
    x = m.e;
    y = m.f;
  }
  return { x, y, w, h };
}

function fijarVariables(c: Caja) {
  if (!pastilla) return;
  pastilla.style.setProperty('--pastilla-x', `${c.x}px`);
  pastilla.style.setProperty('--pastilla-y', `${c.y}px`);
  pastilla.style.setProperty('--pastilla-w', `${c.w}px`);
  pastilla.style.setProperty('--pastilla-h', `${c.h}px`);
}

function deslizar(desde: Caja, hasta: Caja) {
  if (!pastilla) return;
  const total = ms(token('--duracion-indicador'), 300);
  const delantero = Math.min(total, ms(token('--duracion-indicador-delantero'), 240));
  curva ??= cubicBezier(0.22, 1, 0.36, 1); // --ease-vista
  const E = curva;
  const haciaDerecha = hasta.x + hasta.w / 2 >= desde.x + desde.w / 2;
  const L0 = desde.x;
  const R0 = desde.x + desde.w;
  const L1 = hasta.x;
  const R1 = hasta.x + hasta.w;
  const fotogramas: Keyframe[] = [];
  for (let i = 0; i <= MUESTRAS; i++) {
    // Muestras mas densas al principio, donde la curva ease-out es mas rapida
    const s = Math.pow(i / MUESTRAS, 1.6);
    const pAtras = E(s);
    const pDelante = E(Math.min(1, (s * total) / delantero));
    const pL = haciaDerecha ? pAtras : pDelante;
    const pR = haciaDerecha ? pDelante : pAtras;
    const L = L0 + (L1 - L0) * pL;
    const R = R0 + (R1 - R0) * pR;
    const y = desde.y + (hasta.y - desde.y) * pAtras;
    const h = desde.h + (hasta.h - desde.h) * pAtras;
    fotogramas.push({
      offset: s,
      transform: `translate3d(${L}px, ${y}px, 0)`,
      width: `${Math.max(0, R - L)}px`,
      height: `${h}px`,
    });
  }
  pastilla.classList.add('anima');
  const a = pastilla.animate(fotogramas, { duration: total, easing: 'linear' });
  animacion = a;
  const terminar = () => {
    if (animacion !== a) return; // ya la sustituyo otra mas nueva
    animacion = null;
    pastilla.classList.remove('anima');
  };
  a.addEventListener('finish', terminar);
  a.addEventListener('cancel', terminar);
}

function colocar(animar: boolean) {
  if (!nav || !pastilla) return;
  const destino = medir();
  if (!destino) return;
  if (animar && movimientoPermitido()) {
    const desde = estadoActual(); // antes de tocar nada: incluye la animacion en curso
    animacion?.cancel();
    fijarVariables(destino);
    html.classList.add('pastilla-lista');
    if (desde && (Math.abs(desde.x - destino.x) > 0.5 || Math.abs(desde.w - destino.w) > 0.5 || Math.abs(desde.y - destino.y) > 0.5)) {
      deslizar(desde, destino);
    }
    return;
  }
  // Sin animar (arranque, cambios de tamano, movimiento reducido o pausa).
  // Si hay un deslizamiento en curso y el movimiento sigue permitido, solo
  // se actualiza el destino: la animacion acaba y la pastilla queda donde
  // dicen las variables. Si no, se corta y salta.
  if (animacion && !movimientoPermitido()) animacion.cancel();
  fijarVariables(destino);
  html.classList.add('pastilla-lista');
}

// Movil: "pop" del icono activo al llegar la pastilla (CSS, icono-pop)
function pop(vista: string) {
  if (!nav || !mqMovil.matches || !html.dataset.router || !movimientoPermitido()) return;
  for (const a of nav.querySelectorAll<HTMLElement>('a[data-pop]')) a.removeAttribute('data-pop');
  const a = nav.querySelector<HTMLElement>(`a[data-nav-vista="${vista}"]`);
  if (!a) return;
  void a.offsetWidth;
  a.setAttribute('data-pop', '');
  const fin = (ev: AnimationEvent) => {
    if (ev.animationName !== 'icono-pop') return;
    a.removeAttribute('data-pop');
    a.removeEventListener('animationend', fin);
    a.removeEventListener('animationcancel', fin);
  };
  a.addEventListener('animationend', fin);
  a.addEventListener('animationcancel', fin);
}

if (nav && pastilla) {
  colocar(false);
  alCambiarVista((d) => {
    colocar(!d.inicial);
    if (!d.inicial) pop(d.vista);
  });
  // Cambios de ancho (fuentes, etiquetas cortas/largas, giro del movil):
  // se recoloca sin animar. Con el ancho en negrita reservado (B1), activar
  // un enlace ya no cambia ningun ancho, asi que esto no salta al navegar.
  const ro = new ResizeObserver(() => colocar(false));
  ro.observe(nav);
  for (const a of nav.querySelectorAll('a[data-nav-vista]')) ro.observe(a);
  mqMovil.addEventListener('change', () => colocar(false));
  // Al pausar a mitad de un deslizamiento, la pastilla salta a su sitio
  alCambiarMovimiento(() => colocar(false));
  document.fonts?.ready.then(() => colocar(false));
  if (!vistaActual()) html.classList.remove('pastilla-lista');
}
