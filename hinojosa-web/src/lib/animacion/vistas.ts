// Transicion entre vistas + pastilla de la barra.
// Contrato: skill `vistas-hinojosa` ("Transicion entre vistas", "Barra") y
// docs/storyboard-hero.md seccion 4.
//
// TRANSICION (bloque 26, rediseno 0-C): TIMELINE DE GSAP con capas
// solapadas. Una sola metafora: desplazamiento horizontal en el orden de la
// barra (dir = +1 avanza, -1 retrocede), con algo de profundidad.
//   t (s)   0 ...... 0.096 ...... 0.14 .. 0.24 ...... 0.60 ... 0.64
//   Saliente  se aparta -dir x 1,25 rem y baja a escala 0,98 (0-0,40,
//             power2.out) y se funde 1 -> 0 en 0-0,24 (power1.out). Por
//             DEBAJO. Las vistas no tienen fondo propio (salvo Inicio): si
//             la saliente aguantara opaca se leerian dos maquetas a la vez.
//   Entrante  desde dir x 3 rem a 0 (0,096-0,596, power3.out) y opacidad
//             0 -> 1 (0,096-0,416, power2.out). Por ENCIMA. Arranca
//             cuando la saliente lleva el 40 % de su fundido (solape 60 %).
//   Bloques   [data-entra] de la entrante (--orden N): desde dir x 1,5 rem
//             y opacidad 0, 400 ms power3.out, desde 0,14 + N x 0,05 s.
//   Promesa   se resuelve a ~0,24 s (saliente invisible y entrante > 0,64):
//             el router oculta entonces la saliente (prueba 13).
//   Total ~640 ms (medido: 570-620 ms hasta el ultimo cambio visible). El
//   timeline espera dos fotogramas antes de correr (ver transicionGsap).
//   Se animan las propiedades `translate`, `scale` y
//   `opacity` (no `transform`: no pisan los transform propios de cada
//   bloque) sobre un objeto de estado por elemento; mientras dura,
//   will-change las sube a su capa. Al terminar se limpian los estilos.
//
// INTERRUMPIBLE: un clic nuevo mata el timeline y arranca otro DESDE EL
// ESTADO EN QUE ESTABA cada elemento (sin saltos): si se vuelve a la vista
// que se iba, regresa desde donde estaba; si se va a una tercera, la que
// entraba pasa a salir y la que ya se iba (`previas` del router) sigue
// fundiendose por debajo hasta que esta termine.
//
// RESPALDO sin GSAP (los primeros instantes antes de que llegue tras
// `load`, o si falla su descarga): el fundido CSS en dos capas de antes
// (keyframes vista-sale / vista-entra / bloque-entra de tokens.css). No se
// espera a GSAP: el estado de partida tiene que pintarse en la misma tarea.
//
// El foco NO espera: el router ya lo movio al titulo antes de llamar a la
// transicion. Con prefers-reduced-motion o con la pausa del sitio el router
// no llama a la transicion y el corte es seco (la pastilla tambien salta);
// si la pausa llega a mitad, todo salta a su estado final.
import { registrarTransicion, alCambiarVista, vistaActual, type ContextoTransicion } from '../router';
import { alCambiarMovimiento, cubicBezier, movimientoPermitido, ms, token } from './movimiento';
import { cargarGsap, gsapListo, vigilarMovimiento, type Gsap } from './gsap-carga';

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

// =====================================================================
// Timeline de GSAP (motor principal)
// =====================================================================
interface Estado {
  /** translate X en px */
  x: number;
  /** scale */
  s: number;
  /** opacity */
  o: number;
}

/** Tiempos en segundos y desplazamientos en rem (ver cabecera). */
interface Parametros {
  saleMov: number; // la saliente se aparta (power2.out)
  saleEscala: number;
  saleFundido: number; // la saliente se funde 1 -> 0 (power1.out) desde 0
  entra: number; // arranque de la entrante: fija el SOLAPE con el fundido
  entraMov: number; // desplazamiento de la entrante (power3.out)
  entraFundido: number; // opacidad de la entrante 0 -> 1 (power2.out)
  bloquesDesde: number;
  escalon: number;
  bloqueDur: number;
  despSale: number;
  despEntra: number;
  despBloque: number;
}

// Elegida tras medir dos variantes (bloque 26, 2026-10-17): solape del 60 %
// (la entrante aparece cuando la saliente lleva el 40 % de su fundido)
// frente a solape del 40 %. Con el 40 % el fondo crema llegaba a verse al
// 82 % entre vistas (se lee como una vista en blanco) y los pasos por
// fotograma eran mayores (hasta 10 px y 0,24 de opacidad); con el 60 % la
// doble imagen se queda en 0,06 y el paso maximo en 6 px y 0,15.
const P: Parametros = {
  saleMov: 0.4,
  saleEscala: 0.98,
  saleFundido: 0.26,
  entra: 0.096,
  entraMov: 0.5,
  entraFundido: 0.32,
  bloquesDesde: 0.096,
  escalon: 0.06,
  bloqueDur: 0.42,
  despSale: 1.25,
  despEntra: 3,
  despBloque: 1.5,
};

/**
 * Opacidad de partida de la entrante y sus bloques: invisible, pero no 0.
 * Chrome no pinta lo que tiene opacidad 0, asi que con 0 el rasterizado de
 * toda la vista (en Inicio: video, lienzos de los animales, Canela) caia en
 * el primer fotograma en que asomaba, a mitad de la animacion (medido: un
 * fotograma de 130-170 ms a los ~150 ms). Con 0,002 se rasteriza durante
 * los dos fotogramas de espera, antes de que el timeline corra.
 */
const CASI_CERO = 0.002;

type Linea = ReturnType<Gsap['timeline']>;

/** Elementos (vistas y bloques) cuyo translate/scale/opacity lleva GSAP. */
const estados = new Map<HTMLElement, Estado>();
let linea: Linea | null = null;
let resolverPendiente: (() => void) | null = null;

function pintar(el: HTMLElement, e: Estado) {
  el.style.translate = `${e.x.toFixed(2)}px 0px`;
  el.style.scale = e.s.toFixed(4);
  el.style.opacity = e.o.toFixed(3);
}

function soltar(el: HTMLElement) {
  for (const p of ['translate', 'scale', 'opacity', 'z-index', 'will-change']) el.style.removeProperty(p);
  estados.delete(el);
}

function soltarTodo() {
  for (const el of [...estados.keys()]) soltar(el);
}

/** Estado actual de un elemento a mitad de transicion, o null si esta en reposo. */
function leerEstado(el: HTMLElement): Estado | null {
  const e = estados.get(el);
  if (e) return { ...e };
  // A mitad del respaldo CSS (GSAP acaba de llegar): el valor animado
  if (!el.matches('.vista[data-sale], .vista[data-entrando], .vista[data-entrando] [data-entra]')) return null;
  const cs = getComputedStyle(el);
  const t = (cs.translate || 'none').trim().split(/\s+/)[0];
  const sc = (cs.scale || 'none').trim().split(/\s+/)[0];
  return {
    x: t && t !== 'none' ? parseFloat(t) || 0 : 0,
    s: sc && sc !== 'none' ? parseFloat(sc) || 1 : 1,
    o: Math.min(1, Math.max(0, parseFloat(cs.opacity))),
  };
}

/**
 * Suavizado de tirones de GSAP mientras dura la transicion: un fotograma de
 * mas de 100 ms (rasterizado de la vista que entra, sobre todo Inicio con
 * sus lienzos) cuenta como uno de 16,7 ms. Sin esto GSAP avanzaba el tiempo
 * real perdido y la vista saltaba a media animacion (medido: de 0,87 a 0,07
 * de opacidad en un fotograma); asi se congela un instante y sigue. Al
 * terminar se restaura el valor por defecto de GSAP (500, 33).
 */
function suavizarTirones(g: Gsap | null, activo: boolean) {
  g?.ticker.lagSmoothing(activo ? 60 : 500, activo ? 1000 / 60 : 33);
}

/** Mata el timeline en curso y resuelve su promesa (su generacion ya no cierra nada). */
function cortarLinea() {
  linea?.kill();
  if (linea) suavizarTirones(gsapListo(), false);
  linea = null;
  const r = resolverPendiente;
  resolverPendiente = null;
  r?.();
}

function orden(el: HTMLElement): number {
  const n = parseInt(getComputedStyle(el).getPropertyValue('--orden'), 10);
  return Number.isFinite(n) ? n : 0;
}

function transicionGsap(g: Gsap, { saliente, entrante, direccion: dir, previas }: ContextoTransicion): Promise<void> {
  const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
  const bloquesEntrante = Array.from(entrante.querySelectorAll<HTMLElement>('[data-entra]'));
  const bloquesSaliente = Array.from(saliente.querySelectorAll<HTMLElement>('[data-entra]'));

  // 1. Fotografia del estado de cada elemento ANTES de tocar nada
  const foto = new Map<HTMLElement, Estado | null>();
  for (const el of [saliente, entrante, ...previas, ...bloquesEntrante, ...bloquesSaliente]) foto.set(el, leerEstado(el));

  // 2. Corta lo anterior: timeline de GSAP y restos del respaldo CSS
  cortarLinea();
  window.clearTimeout(temporizadorLimpieza);
  for (const v of document.querySelectorAll<HTMLElement>('.vista[data-sale], .vista[data-entrando]')) {
    v.removeAttribute('data-sale');
    v.removeAttribute('data-entrando');
  }
  // Lo que quedo en vistas ya ocultas vuelve a su estilo de reposo
  for (const el of [...estados.keys()]) {
    const vista = el.closest<HTMLElement>('.vista');
    if (!vista || vista.hidden) soltar(el);
  }

  const fijar = (el: HTMLElement, e: Estado, z?: number): Estado => {
    estados.set(el, e);
    el.style.willChange = 'translate, scale, opacity';
    if (z !== undefined) el.style.zIndex = String(z);
    pintar(el, e);
    return e;
  };

  // 3. Estados de partida (se pintan YA, en la misma tarea del clic: la
  //    entrante nunca llega a pintarse opaca antes de empezar)
  const salEnVuelo = foto.get(saliente) ?? null;
  const sal = fijar(saliente, salEnVuelo ?? { x: 0, s: 1, o: 1 }, 1);
  const enVuelo = foto.get(entrante) ?? null;
  const ent = fijar(entrante, enVuelo ?? { x: dir * P.despEntra * rem, s: 1, o: CASI_CERO }, 2);
  const prev = previas.map((p) => fijar(p, foto.get(p) ?? { x: 0, s: 1, o: 1 }, 0));
  // Bloques de la saliente a medio entrar: se quedan donde estan
  for (const b of bloquesSaliente) {
    const f = foto.get(b);
    if (f) fijar(b, f);
  }
  const bloques: Array<{ el: HTMLElement; e: Estado; n: number; enVuelo: boolean }> = [];
  for (const b of bloquesEntrante) {
    const f = foto.get(b) ?? null;
    // Si la entrante volvia de irse (ya habia entrado), sus bloques estan
    // en reposo: no se repite su entrada (seria un salto a opacidad 0)
    if (!f && enVuelo) continue;
    bloques.push({ el: b, e: fijar(b, f ?? { x: dir * P.despBloque * rem, s: 1, o: CASI_CERO }), n: orden(b), enVuelo: Boolean(f) });
  }

  // 4. Timeline, en pausa hasta que se haya pintado el primer fotograma
  //    con la entrante montada (ver 6)
  const tl = g.timeline({
    paused: true,
    onComplete: () => {
      if (linea !== tl) return;
      linea = null;
      suavizarTirones(g, false);
      // La saliente y las previas ya estan ocultas (o lo estaran en la
      // microtarea de la promesa, antes del siguiente pintado)
      soltarTodo();
    },
  });
  linea = tl;
  const pinta = (el: HTMLElement, e: Estado) => () => pintar(el, e);

  // Saliente: se aparta poco hacia -dir y se encoge un poco (profundidad);
  // se funde pronto para que no se lean dos maquetas a la vez
  tl.to(sal, { x: -dir * P.despSale * rem, s: P.saleEscala, duration: P.saleMov, ease: 'power2.out', onUpdate: pinta(saliente, sal) }, 0);
  // (si ya estaba a medio fundir, tarda en proporcion a lo que le queda)
  const fundido = P.saleFundido * Math.max(0.4, sal.o);
  tl.to(sal, { o: 0, duration: fundido, ease: 'power1.out', onUpdate: pinta(saliente, sal) }, 0);
  // Previas: terminan de fundirse por debajo
  previas.forEach((p, i) => {
    tl.to(prev[i], { o: 0, duration: 0.2, ease: 'power1.out', onUpdate: pinta(p, prev[i]) }, 0);
  });
  // Entrante: por encima, desde dir. Sin esperar si volvia de irse o si la
  // saliente ya estaba a medio camino (clics rapidos: no se ahonda el
  // hueco de fondo crema entre las dos)
  const t0 = enVuelo || salEnVuelo ? 0 : P.entra;
  tl.to(ent, { x: 0, s: 1, duration: P.entraMov, ease: 'power3.out', onUpdate: pinta(entrante, ent) }, t0);
  tl.to(ent, { o: 1, duration: P.entraFundido, ease: 'power2.out', onUpdate: pinta(entrante, ent) }, t0);
  // Bloques [data-entra], escalonados por --orden
  for (const b of bloques) {
    const inicio = b.enVuelo ? 0 : P.bloquesDesde + b.n * P.escalon;
    tl.to(b.e, { x: 0, s: 1, o: 1, duration: P.bloqueDur, ease: 'power3.out', onUpdate: pinta(b.el, b.e) }, inicio);
  }

  // 5. Promesa: el router oculta la saliente cuando ya es invisible Y la
  //    entrante pasa de 0,64 de opacidad (40 % de su fundido): prueba 13
  const fin = Math.max(fundido, t0 + 0.4 * P.entraFundido);
  const promesa = new Promise<void>((resolver) => {
    resolverPendiente = resolver;
    tl.call(
      () => {
        if (resolverPendiente === resolver) resolverPendiente = null;
        resolver();
      },
      [],
      fin,
    );
  });

  // 6. Arranque al TERCER fotograma. Montar la vista cuesta: estilo y
  //    maquetacion en la tarea del router, y el rasterizado de la vista que
  //    entra (con opacidad CASI_CERO ya se pinta) bloquea el envio del
  //    fotograma siguiente: medido en Inicio, ~170 ms con la CPU x1 sin
  //    aceleracion (mas en gama baja). Si el timeline corriera ya, ese
  //    tiron caeria con la saliente a medio irse; esperando tres
  //    fotogramas cae antes de que nada se mueva y la animacion sale
  //    entera. Cuesta ~3 fotogramas de latencia (~50 ms) cuando no hay tiron;
  //    el foco ya esta en el titulo desde el clic. Si la entrante ya estaba
  //    montada (se vuelve a la vista que se iba), no hay nada que rasterizar:
  //    arranca en el fotograma siguiente.
  let esperas = enVuelo ? 1 : 3;
  const arrancar = () => {
    if (linea !== tl) return;
    if (--esperas > 0) {
      window.requestAnimationFrame(arrancar);
      return;
    }
    suavizarTirones(g, true);
    tl.play();
  };
  window.requestAnimationFrame(arrancar);
  return promesa;
}

// =====================================================================
// Respaldo CSS (sin GSAP): fundido en dos capas (keyframes de tokens.css)
// =====================================================================
let temporizadorLimpieza = 0;

function transicionCss({ saliente, entrante, direccion }: ContextoTransicion): Promise<void> {
  // 1. Estado de partida de la saliente. Si estaba entrando (clic rapido),
  //    sale desde la opacidad y el desplazamiento que tenia en este instante.
  const cs = getComputedStyle(saliente);
  const opacidad = Math.min(1, Math.max(0, parseFloat(cs.opacity) || 0));
  const x = translateX(cs.translate || 'none');

  // 2. Limpia transiciones anteriores: una sola entrante. Las que aun se
  //    iban (`previas`) conservan data-sale y acaban su fundido por debajo.
  entrante.removeAttribute('data-sale');
  for (const v of document.querySelectorAll<HTMLElement>('.vista[data-entrando]')) {
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
}

registrarTransicion((ctx) => {
  const g = gsapListo();
  if (g) return transicionGsap(g, ctx);
  // GSAP aun no ha llegado (o fallo): respaldo CSS, y que llegue ya
  void cargarGsap().catch(() => undefined);
  return transicionCss(ctx);
});

// Cambio sin animar (pausa o reduced motion) con una transicion a medias:
// nada se queda a opacidad parcial ni desplazado.
alCambiarVista((d) => {
  if (d.inicial || movimientoPermitido()) return;
  cortarLinea();
  soltarTodo();
});
// La pausa (o reduced motion) llega a mitad: todo salta a su estado final
vigilarMovimiento((permitido) => {
  if (!permitido && linea) linea.progress(1);
});

declare global {
  interface Window {
    /** Diagnostico (pruebas de vistas-hinojosa): motor y restos de la transicion. */
    hinojosaTransicion?: {
      motor: () => 'gsap' | 'css';
      activa: () => boolean;
      estilos: () => number;
    };
  }
}
window.hinojosaTransicion = {
  motor: () => (gsapListo() ? 'gsap' : 'css'),
  activa: () => Boolean(linea?.isActive()),
  estilos: () => estados.size,
};

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
