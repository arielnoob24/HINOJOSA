// Canela corriendo de borde a borde en la franja inferior de Inicio
// (PLAN.md vista 1 "Canela: carrera de borde a borde"; storyboard-hero 2;
// prueba 18 de vistas-hinojosa). Sustituye al bucle CSS de la foto sentada.
//
// Activos (public/img/canela/carrera.json, generados del video de Flow):
//   arranque 27 cuadros (sentada -> de pie -> corre a la izquierda), una vez
//   izq       7 cuadros, ciclo de carrera nativo hacia la izquierda
//   giro     18 cuadros (corre a la izq -> frena -> de frente -> mira a la der)
//   der       6 cuadros, ciclo de carrera nativo hacia la derecha
// Cada sprite es una tira horizontal (cuadro k en x = k * 388), 12 fps.
// Hay un segundo juego a 160 px de alto (carrera-160.json, cuadros de 194):
// se usa cuando altoMostrado x devicePixelRatio <= 160 (movil, 70-88 px a
// 1x-2x). Los cuadros, piezas y empalmes son los mismos; solo cambia la
// escala, asi que la velocidad sigue atada a la zancada (velocidad del json
// elegido x altoMostrado / alto del juego). El juego se elige una vez, al
// cargar; si luego la franja crece, se sigue con el mismo (solo se reescala).
//
// Maquina de estados (una sola vez SENTADA por entrada en Inicio):
//   sentada (0,6 s) -> arranque -> corre(-1) -> giro(-1) -> corre(+1)
//                                     ^                        |
//                                     +------ giro(+1) <-------+
// - corre(dir): translateX a velocidad constante v = velocidad del json x
//   (alto mostrado / alto del juego): por cada ciclo de patas avanza exactamente una
//   zancada, asi las patas apoyadas no patinan.
// - El giro empieza en un cuadro del ciclo que empalma con el sprite de giro
//   y en el ultimo momento que permite frenar sin pasar del limite. La
//   frenada es lineal y se ajusta para parar EXACTAMENTE en el limite
//   (x = 0 o x = anchoFranja - anchoCaja): la nariz nunca sale. Desde el
//   bloque 14 no hay boton de pausa: el limite derecho es el borde de la franja.
// - Giro del borde derecho: el sprite de giro reproducido AL REVES desde el
//   cuadro 17 (mira a la derecha) hasta el 4 (perfil izquierdo, a media
//   zancada) y empalme con el ciclo izq en el cuadro 5. No se espeja nada:
//   la gorra "HINOJOSA" nunca sale invertida y los empalmes coinciden
//   (der -> giro 17 y giro 4 -> izq 5 son los mismos pares de cuadros que en
//   el video). Las patas solo "retroceden" en los cuadros 17-16 y 5-4, que
//   caen en la frenada y en el impulso.
//
// Ciclo de vida
// - Sprites pedidos solo DESPUES de `load` (el logo sigue siendo el LCP) y
//   solo si Inicio esta activa con movimiento permitido. Se decodifican
//   (img.decode) antes de mostrarse. Mientras tanto, o si algo falla, se ve
//   canela-franja sentada (<picture> del marcado).
// - Pausa del sitio: congela cuadro y posicion (se cancela el rAF); al
//   reanudar sigue desde ahi. Si se entra en Inicio con la pausa activa:
//   sentada fija y sin descargar nada; al reanudar empieza desde SENTADA.
// - prefers-reduced-motion: sentada fija, sin sprites (no se descargan).
// - Fuera de Inicio: rAF cancelado. Al volver empieza otra vez desde SENTADA.
// - ResizeObserver en la franja: recalcula tamano, velocidad y limites; si
//   Canela quedo fuera, se coloca en el limite y sigue en el mismo sentido.
// - El indice de cuadro sale del tiempo acumulado (no de contar rAF) y el
//   paso de tiempo se limita a 50 ms: sin saltos al volver de otra pestana.
//
// Ganchos de prueba (solo lectura): franja[data-canela="carrera"] cuando se
// ve el sprite; franja.dataset.canelaEstado = sentada|arranque|corre|giro;
// franja.dataset.canelaDir = -1|1.
import { alCambiarVista, vistaActual } from '../router';
import { alCambiarMovimiento, movimientoPermitido } from './movimiento';
import { ruta } from '../ruta';

type NombrePieza = 'arranque' | 'izq' | 'giro' | 'der';
type Estado = 'sentada' | 'arranque' | 'corre' | 'giro';
type Dir = -1 | 1;

interface DatosCarrera {
  cuadro: { ancho: number; alto: number };
  piezas: Record<NombrePieza, { src: string; cuadros: number; fps: number }>;
  zancada: { velocidad: { izq: number; der: number } };
}

interface Pieza {
  img: HTMLImageElement;
  cuadros: number;
  fps: number;
}

// --- Constantes de la coreografia (cuadros de los sprites) ---------------
const SENTADA_S = 0.6;
/** Ajuste fino de velocidad si se viera patinar (+-10 %). Medido: 1. */
const AJUSTE_VELOCIDAD = 1;
/** Arranque: la carrera empieza a desplazarse entre estos cuadros (ease-in-out). */
const ARRANQUE_MUEVE: [number, number] = [10, 18];
/** Arranque: la sombra pasa de 0,6 a 1 mientras se pone de perfil. */
const ARRANQUE_SOMBRA: [number, number] = [5, 12];
/** Giro hacia la derecha (borde izquierdo): cuadro de giro que sigue a cada cuadro izq. */
const ENTRADA_GIRO_IZQ: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 4, 5: 4, 6: 0 };
/** Cuadro del giro en el que ya esta parada (frenada completa). */
const PARADA_GIRO_IZQ = 7;
/** Secuencia del giro del borde derecho: al reves, 17 -> 4. */
const SECUENCIA_INVERSA = Array.from({ length: 14 }, (_, i) => 17 - i);
/** Giro del borde derecho: posicion en SECUENCIA_INVERSA que sigue a cada cuadro der. */
const ENTRADA_GIRO_DER: Record<number, number> = { 4: 0, 5: 0, 0: 0, 3: 1 };
/** Posicion en SECUENCIA_INVERSA en la que ya esta parada. */
const PARADA_GIRO_DER = 4;
/** En el cuadro 0 del arranque la perrita empieza a esta fraccion del ancho (88 de 388). */
const INICIO_SENTADA = 88 / 388;
/** Alto del juego pequeno de sprites: se usa si altoMostrado x dpr <= este valor. */
const ALTO_JUEGO_PEQUENO = 160;
/** Cuadros finales del giro en los que acelera hacia el nuevo sentido. */
const CUADROS_IMPULSO = 2;
/** Cuadro del ciclo con el que empalma la salida de cada giro. */
const SALIDA_GIRO_IZQ = 0; // giro 17 -> der 0
const SALIDA_GIRO_DER = 5; // giro 4 (inverso) -> izq 5
/** Sombra durante el giro (se estrecha de frente). */
const SOMBRA_GIRO = [1, 1, 1, 1, 0.85, 0.65, 0.55, 0.6, 0.75, 0.9, 1, 1, 1, 1, 1, 1, 1, 1];
const DT_MAX = 0.05;

// --- Elementos -------------------------------------------------------------
const franja = document.querySelector<HTMLElement>('[data-perrito-pista]');
const reposo = franja?.querySelector<HTMLElement>('[data-perrito]') ?? null;
const recorrido = franja?.querySelector<HTMLElement>('[data-canela-recorrido]') ?? null;
const caja = recorrido?.querySelector<HTMLElement>('[data-canela-caja]') ?? null;
const sombra = recorrido?.querySelector<HTMLElement>('[data-canela-sombra]') ?? null;

// --- Estado ------------------------------------------------------------------
let datos: DatosCarrera | null = null;
let piezas: Record<NombrePieza, Pieza> | null = null;
let carga: Promise<boolean> | null = null;
let raf = 0;
let ultimo: number | null = null;
let enInicio = false;
/** Hay una carrera en curso (aunque este pausada). */
let enCurso = false;

let estado: Estado = 'sentada';
let dir: Dir = -1;
let t = 0; // segundos en el estado actual
let x = 0; // borde izquierdo de la caja, px dentro de la franja
let fase = 0; // segundos acumulados del ciclo de carrera
let cuentaCuadros = 0;
// giro
let secuencia: number[] = [];
let velGiro = 0; // velocidad al empezar a frenar
let dFreno = 0;
let tFreno = 0;
let x0Giro = 0;
let tImpulso = 0;
let fasesSalida = 0;

// medidas
let alto = 0;
let ancho = 0; // ancho de la caja (un cuadro)
let escala = 0;
let xMin = 0;
let xMax = 0;
let anchoFranja = 0;

// lo pintado (para no tocar el DOM si no cambia)
let piezaVisible: NombrePieza | null = null;
let cuadroPintado = -1;
let sombraPintada = -1;

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suave = (p: number) => {
  const q = limitar(p, 0, 1);
  return q * q * (3 - 2 * q);
};

function velocidad(d: Dir): number {
  if (!datos) return 0;
  const base = d < 0 ? datos.zancada.velocidad.izq : datos.zancada.velocidad.der;
  return base * escala * AJUSTE_VELOCIDAD;
}

// --- Carga diferida -----------------------------------------------------------
function trasLoad(): Promise<void> {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((r) => window.addEventListener('load', () => r(), { once: true }));
}

function cargar(): Promise<boolean> {
  if (carga) return carga;
  carga = (async () => {
    await trasLoad();
    const dpr = window.devicePixelRatio || 1;
    const altoR = reposo?.offsetHeight ?? 0;
    const pequeno = altoR > 0 && altoR * dpr <= ALTO_JUEGO_PEQUENO;
    const resp = await fetch(ruta(pequeno ? '/img/canela/carrera-160.json' : '/img/canela/carrera.json'));
    if (!resp.ok) throw new Error('carrera.json');
    const d = (await resp.json()) as DatosCarrera;
    const nombres: NombrePieza[] = ['arranque', 'izq', 'giro', 'der'];
    const lista = await Promise.all(
      nombres.map(async (n) => {
        const p = d.piezas[n];
        const img = new Image();
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        img.src = ruta(p.src); // carrera.json guarda /img/canela/... sin base
        await img.decode();
        img.dataset.pieza = n;
        img.style.visibility = 'hidden';
        return [n, { img, cuadros: p.cuadros, fps: p.fps }] as const;
      }),
    );
    datos = d;
    piezas = Object.fromEntries(lista) as Record<NombrePieza, Pieza>;
    for (const n of nombres) caja!.appendChild(piezas[n].img);
    medir();
    return true;
  })().catch(() => {
    // Sin sprites: queda canela-franja sentada. No se reintenta.
    return false;
  });
  return carga;
}

// --- Medidas --------------------------------------------------------------------
function medir(): boolean {
  if (!franja || !reposo || !caja || !datos || !piezas) return false;
  const anchoF = franja.clientWidth;
  const altoReposo = reposo.offsetHeight;
  if (!anchoF || !altoReposo) return false; // vista oculta
  const cambiaAlto = altoReposo !== alto;
  anchoFranja = anchoF;
  alto = altoReposo;
  escala = alto / datos.cuadro.alto;
  ancho = Math.round((alto * datos.cuadro.ancho) / datos.cuadro.alto);
  xMin = 0;
  xMax = Math.max(0, anchoFranja - ancho);
  if (cambiaAlto) {
    caja.style.width = `${ancho}px`;
    caja.style.height = `${alto}px`;
    recorrido!.style.width = `${ancho}px`;
    recorrido!.style.height = `${alto}px`;
    for (const p of Object.values(piezas)) {
      p.img.style.width = `${ancho * p.cuadros}px`;
      p.img.style.height = `${alto}px`;
    }
    cuadroPintado = -1;
  }
  return true;
}

/** x de la caja para que la Canela del sprite coincida con la sentada del <picture>. */
function xSentada(): number {
  if (!reposo || !datos) return xMax;
  // En el cuadro 0 del arranque la perrita empieza 88 px (de 388) dentro del cuadro;
  // en canela-franja empieza en el borde de la caja. Mismo alto y misma base.
  return limitar(reposo.offsetLeft - INICIO_SENTADA * ancho, xMin, xMax);
}

// --- Pintado ---------------------------------------------------------------------
function pintar(nombre: NombrePieza, cuadro: number, escalaSombra: number) {
  if (!piezas || !recorrido || !sombra) return;
  if (piezaVisible !== nombre) {
    if (piezaVisible) piezas[piezaVisible].img.style.visibility = 'hidden';
    piezas[nombre].img.style.visibility = 'visible';
    piezaVisible = nombre;
    cuadroPintado = -1;
  }
  if (cuadro !== cuadroPintado) {
    piezas[nombre].img.style.transform = `translate3d(${-cuadro * ancho}px,0,0)`;
    cuadroPintado = cuadro;
  }
  recorrido.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  const s = Math.round(escalaSombra * 100) / 100;
  if (s !== sombraPintada) {
    sombra.style.transform = `scaleX(${s})`;
    sombraPintada = s;
  }
  franja!.dataset.canelaEstado = estado;
  franja!.dataset.canelaDir = String(dir);
}

// --- Maquina de estados -------------------------------------------------------
function irA(nuevo: Estado) {
  estado = nuevo;
  t = 0;
}

function empezarCarrera(d: Dir, cuadroInicial: number) {
  dir = d;
  irA('corre');
  const p = piezas![d < 0 ? 'izq' : 'der'];
  fase = cuadroInicial / p.fps;
  cuentaCuadros = cuadroInicial;
}

/** Distancia de frenada natural si se entra en el giro con esta entrada. */
function frenadaNatural(d: Dir, entrada: number, v: number, fps: number): number {
  const cuadrosHastaParar = d < 0 ? PARADA_GIRO_IZQ - entrada : PARADA_GIRO_DER - entrada;
  return (v * Math.max(1, cuadrosHastaParar)) / fps / 2;
}

/**
 * Se llama al pasar del cuadro `kPrev` al siguiente del ciclo. Devuelve la
 * entrada al giro si hay que girar YA (esperar un cuadro mas ya no permitiria
 * frenar antes del limite), o null para seguir corriendo.
 */
function decidirGiro(kPrev: number, n: number, v: number, fps: number): number | null {
  const tabla = dir < 0 ? ENTRADA_GIRO_IZQ : ENTRADA_GIRO_DER;
  const dist = dir < 0 ? x - xMin : xMax - x;
  for (let j = 1; j <= n; j++) {
    const e = tabla[(kPrev + j) % n];
    if (e === undefined) continue;
    if (dist - (v * j) / fps >= frenadaNatural(dir, e, v, fps)) return null; // aun se puede esperar
  }
  const ahora = tabla[kPrev];
  if (ahora !== undefined) return ahora;
  // Sin empalme posible (solo tras redimensionar): el mas cercano.
  for (let j = 1; j <= n; j++) {
    const e = tabla[(kPrev + j) % n];
    if (e !== undefined) return e;
  }
  return 0;
}

function empezarGiro(entrada: number, v: number) {
  const fps = piezas!.giro.fps;
  secuencia = dir < 0 ? Array.from({ length: 18 - entrada }, (_, i) => entrada + i) : SECUENCIA_INVERSA.slice(entrada);
  velGiro = v;
  x0Giro = x;
  dFreno = Math.max(0, dir < 0 ? x - xMin : xMax - x);
  tImpulso = (secuencia.length - CUADROS_IMPULSO) / fps;
  // frenada lineal que para justo en el limite: d = v * T / 2
  tFreno = v > 0 ? Math.min((2 * dFreno) / v, tImpulso) : 0;
  if (tFreno < (2 * dFreno) / Math.max(v, 1e-6)) dFreno = (v * tFreno) / 2;
  fasesSalida = dir < 0 ? SALIDA_GIRO_IZQ : SALIDA_GIRO_DER;
  irA('giro');
}

function avanzar(dt: number) {
  if (!piezas) return;
  t += dt;
  switch (estado) {
    case 'sentada': {
      pintar('arranque', 0, 0.6);
      if (t >= SENTADA_S) irA('arranque');
      return;
    }
    case 'arranque': {
      const p = piezas.arranque;
      const k = Math.floor(t * p.fps);
      if (k >= p.cuadros) {
        empezarCarrera(-1, 0); // arranque 26 ~ izq 6: sigue en izq 0
        avanzar(0);
        return;
      }
      const tA = ARRANQUE_MUEVE[0] / p.fps;
      const tB = ARRANQUE_MUEVE[1] / p.fps;
      x = limitar(x - velocidad(-1) * suave((t - tA) / (tB - tA)) * dt, xMin, xMax);
      const sA = ARRANQUE_SOMBRA[0] / p.fps;
      const sB = ARRANQUE_SOMBRA[1] / p.fps;
      pintar('arranque', k, 0.6 + 0.4 * suave((t - sA) / (sB - sA)));
      return;
    }
    case 'corre': {
      const nombre: NombrePieza = dir < 0 ? 'izq' : 'der';
      const p = piezas[nombre];
      const v = velocidad(dir);
      fase += dt;
      x = limitar(x + dir * v * dt, xMin, xMax);
      const cuenta = Math.floor(fase * p.fps + 1e-6);
      if (cuenta !== cuentaCuadros) {
        const kPrev = ((cuentaCuadros % p.cuadros) + p.cuadros) % p.cuadros;
        cuentaCuadros = cuenta;
        const entrada = decidirGiro(kPrev, p.cuadros, v, p.fps);
        if (entrada !== null) {
          empezarGiro(entrada, v);
          avanzar(0);
          return;
        }
      }
      pintar(nombre, cuentaCuadros % p.cuadros, 1);
      return;
    }
    case 'giro': {
      const p = piezas.giro;
      const i = Math.floor(t * p.fps + 1e-6);
      if (i >= secuencia.length) {
        empezarCarrera(dir < 0 ? 1 : -1, fasesSalida);
        avanzar(0);
        return;
      }
      // 1) frenada lineal hasta el limite, 2) quieta, 3) impulso al otro lado
      let desp: number;
      if (t < tFreno) desp = velGiro * t - (velGiro * velGiro * t * t) / (4 * Math.max(dFreno, 1e-6));
      else desp = dFreno;
      let pos = x0Giro + dir * desp;
      if (t > tImpulso) {
        const ta = CUADROS_IMPULSO / p.fps;
        const tau = Math.min(t - tImpulso, ta);
        const vSale = velocidad(dir < 0 ? 1 : -1);
        // aceleracion uniforme de 0 a vSale en `ta`
        pos += -dir * ((vSale * tau * tau) / (2 * ta));
      }
      x = limitar(pos, xMin, xMax);
      const cuadro = secuencia[i];
      pintar('giro', cuadro, SOMBRA_GIRO[cuadro] ?? 1);
      return;
    }
  }
}

// --- Bucle -----------------------------------------------------------------------
function paso(ahora: number) {
  raf = 0;
  const dt = ultimo === null ? 0 : Math.min(DT_MAX, Math.max(0, (ahora - ultimo) / 1000));
  ultimo = ahora;
  avanzar(dt);
  if (enInicio && enCurso && movimientoPermitido()) raf = requestAnimationFrame(paso);
}

function arrancarBucle() {
  if (raf || !enCurso) return;
  ultimo = null;
  raf = requestAnimationFrame(paso);
}

function pararBucle() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  ultimo = null;
}

/** Vuelve a la foto sentada del marcado (reposo, reducido o sin sprites). */
function aReposo() {
  pararBucle();
  enCurso = false;
  if (franja) {
    delete franja.dataset.canela;
    delete franja.dataset.canelaEstado;
  }
}

/** Empieza desde SENTADA (cargando los sprites si hace falta). */
async function empezar() {
  if (!franja || !caja || !recorrido || enCurso) return;
  const ok = await cargar();
  if (!ok || !enInicio || !movimientoPermitido() || enCurso) return;
  if (!medir()) return;
  estado = 'sentada';
  t = 0;
  dir = -1;
  x = xSentada();
  enCurso = true;
  avanzar(0);
  franja.dataset.canela = 'carrera';
  arrancarBucle();
}

function entrar() {
  enInicio = true;
  aReposo(); // al volver a Inicio siempre empieza desde sentada
  if (movimientoPermitido()) void empezar();
}

function salir() {
  enInicio = false;
  // Se congela donde esta durante la salida de la vista; al volver, aReposo.
  pararBucle();
}

if (franja && reposo && recorrido && caja && sombra) {
  alCambiarVista((d) => (d.vista === 'inicio' ? entrar() : salir()));
  if (vistaActual() === 'inicio') entrar();

  alCambiarMovimiento((permitido) => {
    if (!enInicio) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      aReposo();
      return;
    }
    if (!permitido) {
      pararBucle(); // pausa: congela cuadro y posicion
    } else if (enCurso) {
      arrancarBucle(); // reanuda desde ahi
    } else {
      void empezar(); // se entro con la pausa activa: desde SENTADA
    }
  });

  new ResizeObserver(() => {
    if (!enCurso || !medir()) return;
    if (estado === 'sentada') x = xSentada();
    x = limitar(x, xMin, xMax);
    if (estado === 'giro') x0Giro = limitar(x0Giro, xMin, xMax);
    if (!raf) avanzar(0); // pausada: repinta en el sitio nuevo sin avanzar
  }).observe(franja);
}
