// Carrusel CSS 3D de Productos (docs/storyboard-carrusel.md).
//
// Se carga con import() dinamico la primera vez que se entra en Productos
// (carrusel-carga.ts): ni este modulo ni GSAP estan en la carga inicial.
//
// Anillo de "carteles": cada producto se coloca en su punto del circulo con
// translate3d(x, y, z) dentro de un contenedor con `perspective`, y SIEMPRE
// mira al frente (no hay rotateY: los envases no se deforman ni se
// espejan). GSAP anima un solo numero, la posicion `p` del anillo (en
// pasos), y render() escribe transform / opacity / z-index / oscurecido.
//
// El estado (categoria y producto seleccionados) vive SOLO en catalogo.ts:
// aqui se escucha `hinojosa:producto` y se llama a seleccionar(). La lista,
// las pestanas, las flechas, el teclado y la region aria-live ya los
// gestiona catalogo.ts; este modulo solo pinta y gira.
//
// Nunca gira solo. Con reduced motion o con la pausa del usuario todo
// cambio es instantaneo (y el arrastre da pasos discretos, sin inercia).
// Sin soporte de 3D no se monta y se queda la rejilla de respaldo.
import { gsap } from 'gsap/gsap-core';
import { estado, seleccionar, mostrarEnLista, productosDelAnillo, sizesAnillo, type DetalleProducto, type ProductoDatos } from '../catalogo';
import { alCambiarVista } from '../router';
import { curvaDeToken, movimientoPermitido, ms, px, token } from './movimiento';

interface Item {
  p: ProductoDatos;
  el: HTMLElement;
  tarjeta: HTMLElement;
  oscuro: HTMLElement;
  sombra: HTMLElement;
  /** Aparicion 0..1 (entrada tras un cambio de categoria). */
  a: number;
  retraso: number;
  error: boolean;
  /** Asigna srcset/src (se difiere en los laterales del primer montaje). */
  cargar: () => void;
}

const raiz = document.getElementById('productos');
const carrusel = raiz?.querySelector<HTMLElement>('[data-carrusel]') ?? null;
const hueco = carrusel?.querySelector<HTMLElement>('[data-carrusel-escena]') ?? null;
const rotulo = raiz?.querySelector<HTMLElement>('[data-carrusel-rotulo]') ?? null;

const pos = { p: 0 };
const escenaAnim = { o: 1, s: 1 };
const entrada = { t: 0 };
let items: Item[] = [];
let categoria = '';
let radio = 260;
let giro: ReturnType<typeof gsap.to> | null = null;
let secuencia = 0;
let cambiando = false;

let anillo: HTMLElement;
let escena3d: HTMLElement;
let tarima: HTMLElement;
let avisoError: HTMLElement;

// Parametros (tokens.css; los de tamano cambian en movil)
const cfg = {
  ancho: 180,
  hueco: 16,
  radioMin: 260,
  opacidadMin: 0.4,
  oscuroMax: 0.45,
  giro: 450,
  giroExtra: 60,
  giroMax: 750,
  salida: 150,
  entrada: 300,
};
const curvaGiro = curvaDeToken('--ease-giro', [0.22, 1.3, 0.36, 1]);
const curvaVista = curvaDeToken('--ease-vista', [0.22, 1, 0.36, 1]);
const curvaSalida = curvaDeToken('--ease-salida', [0.4, 0, 1, 1]);

function leerConfig() {
  cfg.ancho = items[0]?.el.offsetWidth || px(token('--carrusel-ancho'), 180);
  cfg.hueco = px(token('--carrusel-hueco'), 16);
  cfg.radioMin = px(token('--carrusel-radio-min'), 260);
  cfg.opacidadMin = parseFloat(token('--carrusel-opacidad-min')) || 0.4;
  cfg.oscuroMax = parseFloat(token('--carrusel-oscuro-max')) || 0.45;
  cfg.giro = ms(token('--duracion-giro'), 450);
  cfg.giroExtra = ms(token('--duracion-giro-extra'), 60);
  cfg.giroMax = ms(token('--duracion-giro-max'), 750);
  cfg.salida = ms(token('--duracion-categoria-salida'), 150);
  cfg.entrada = ms(token('--duracion-categoria-entrada'), 300);
}

const modulo = (n: number, m: number) => ((n % m) + m) % m;

/** r = max(radio-min, (ancho + hueco) / (2 tan(pi/N))) */
function calcularRadio() {
  const n = items.length;
  radio = n < 3 ? cfg.radioMin : Math.max(cfg.radioMin, (cfg.ancho + cfg.hueco) / (2 * Math.tan(Math.PI / n)));
  const d = 2 * radio + cfg.ancho;
  tarima.style.width = tarima.style.height = `${d}px`;
  tarima.style.margin = `0 0 ${-d / 2}px ${-d / 2}px`;
  tarima.style.transform = `translate3d(0, 0, ${(-radio).toFixed(1)}px) rotateX(90deg)`;
}

// ---------------------------------------------------------------------
// Pintado
// ---------------------------------------------------------------------
function render() {
  const n = items.length;
  if (!n) return;
  const frente = modulo(Math.round(pos.p), n);
  for (let k = 0; k < n; k++) {
    const it = items[k];
    const phi = (2 * Math.PI * (k - pos.p)) / n; // 0 = al frente
    const c = Math.cos(phi);
    const x = radio * Math.sin(phi);
    const z = radio * (c - 1); // el frente queda en z = 0 (tamano 1:1)
    const d = (1 + c) / 2; // 1 al frente, 0 detras
    const y = 12 * (1 - it.a); // entrada: sube 12 px
    it.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px)`;
    it.el.style.opacity = ((cfg.opacidadMin + (1 - cfg.opacidadMin) * d) * it.a).toFixed(3);
    it.el.style.zIndex = String(Math.round(d * 100));
    it.oscuro.style.opacity = (cfg.oscuroMax * (1 - d)).toFixed(3);
    it.sombra.style.opacity = (0.1 + 0.25 * d).toFixed(3);
    it.el.toggleAttribute('data-frente', k === frente);
  }
}

function pintarEscena() {
  escena3d.style.opacity = escenaAnim.o.toFixed(3);
  escena3d.style.transform = escenaAnim.s === 1 ? '' : `scale(${escenaAnim.s.toFixed(4)})`;
}

// ---------------------------------------------------------------------
// Rotulo: catalogo.ts lo escribe al seleccionar; aqui solo se RETRASA el
// cambio visible hasta el 50 % del giro (fundido de 120 ms). No se guarda
// estado propio: se muestra lo que catalogo.ts ya escribio.
// ---------------------------------------------------------------------
const camposRotulo = rotulo
  ? (['nombre', 'categoria', 'posicion', 'precio'].map((c) => rotulo.querySelector<HTMLElement>(`[data-rotulo-${c}]`)) as (HTMLElement | null)[])
  : [];
const leerRotulo = () => camposRotulo.map((el) => el?.textContent ?? '');
const escribirRotulo = (v: string[]) =>
  camposRotulo.forEach((el, i) => {
    if (el && el.textContent !== v[i]) el.textContent = v[i];
  });
let rotuloVisible: string[] = leerRotulo();
let rotuloPendiente: string[] | null = null;

function retenerRotulo() {
  const nuevo = leerRotulo();
  if (nuevo.join('\u0000') === rotuloVisible.join('\u0000')) return;
  rotuloPendiente = nuevo;
  escribirRotulo(rotuloVisible);
}

function soltarRotulo(fundido: boolean) {
  if (!rotuloPendiente) return;
  escribirRotulo(rotuloPendiente);
  rotuloVisible = rotuloPendiente;
  rotuloPendiente = null;
  if (fundido && rotulo && movimientoPermitido()) {
    rotulo.classList.remove('rotulo-fundido');
    void rotulo.offsetWidth;
    rotulo.classList.add('rotulo-fundido');
  }
}

// ---------------------------------------------------------------------
// Construccion de una categoria
// ---------------------------------------------------------------------
function crearItem(p: ProductoDatos): Item {
  const el = document.createElement('div');
  el.className = 'anillo-item';
  el.dataset.id = p.id;

  const sombra = document.createElement('span');
  sombra.className = 'anillo-sombra';

  const tarjeta = document.createElement('span');
  tarjeta.className = p.conFondo ? 'anillo-tarjeta anillo-placa cargando' : 'anillo-tarjeta cargando';

  // 400/800 px segun el ancho de la tarjeta (movil 116 px, escritorio 180 px)
  const sizes = sizesAnillo();
  const picture = document.createElement('picture');
  const source = p.avif ? document.createElement('source') : null;
  if (source) {
    source.type = 'image/avif';
    if (sizes && p.srcset) source.sizes = sizes;
    picture.append(source);
  }
  const img = document.createElement('img');
  if (sizes && p.srcset) img.sizes = sizes;
  img.alt = ''; // el anillo es aria-hidden: el nombre esta en el rotulo y en la lista
  img.decoding = 'async';
  img.draggable = false;
  img.width = 600;
  img.height = 800;
  picture.append(img);
  let cargada = false;
  const cargar = () => {
    if (cargada) return;
    cargada = true;
    if (source) source.srcset = p.srcset?.avif ?? p.avif ?? '';
    if (sizes && p.srcset) img.srcset = p.srcset.webp;
    img.src = p.imagen ?? '';
  };

  const oscuro = document.createElement('span');
  oscuro.className = 'anillo-oscuro';

  tarjeta.append(picture, oscuro);
  el.append(sombra, tarjeta);

  const item: Item = { p, el, tarjeta, oscuro, sombra, a: 1, retraso: 0, error: false, cargar };
  img.addEventListener('load', () => {
    tarjeta.classList.remove('cargando');
    // La capa de oscurecido usa la silueta del recorte (misma imagen ya en cache)
    if (!p.conFondo) {
      const url = `url("${img.currentSrc || img.src}")`;
      oscuro.style.maskImage = url;
      oscuro.style.setProperty('-webkit-mask-image', url);
    }
    tarjeta.classList.add('listo');
  });
  img.addEventListener('error', () => {
    item.error = true;
    tarjeta.classList.remove('cargando');
    tarjeta.classList.add('sin-imagen');
    picture.remove();
    const nombre = document.createElement('span');
    nombre.textContent = p.nombre;
    tarjeta.prepend(nombre);
    if (items.length && items.every((i) => i.error)) avisoError.hidden = false;
  });
  return item;
}

/**
 * diferirLaterales (solo en el primer montaje): la imagen del frente se pide
 * ya y las de los laterales cuando el frente se ha pintado. Asi, al entrar
 * directo por #productos, las otras 8 no compiten con la imagen LCP (QA M5).
 */
function construir(cat: string, indice: number, diferirLaterales = false) {
  for (const it of items) it.el.remove();
  categoria = cat;
  items = productosDelAnillo(cat).map(crearItem);
  const frente = items[modulo(Math.max(0, indice), items.length || 1)];
  if (!diferirLaterales || !frente) {
    items.forEach((i) => i.cargar());
  } else {
    frente.cargar();
    const resto = () => requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((i) => i.cargar())));
    const img = frente.tarjeta.querySelector('img');
    if (!img || img.complete) resto();
    else {
      img.addEventListener('load', resto, { once: true });
      img.addEventListener('error', resto, { once: true });
      window.setTimeout(resto, 1500);
    }
  }
  escena3d.append(...items.map((i) => i.el));
  avisoError.hidden = true;
  pos.p = Math.max(0, indice);
  leerConfig();
  calcularRadio();
  render();
}

// ---------------------------------------------------------------------
// Movimiento
// ---------------------------------------------------------------------
function girarA(indice: number) {
  const n = items.length;
  if (!n || indice < 0) return;
  let delta = modulo(indice - pos.p, n);
  if (delta > n / 2) delta -= n; // camino mas corto
  const destino = pos.p + delta;
  giro?.kill();
  giro = null;

  if (!movimientoPermitido() || Math.abs(delta) < 1e-3) {
    pos.p = modulo(destino, n);
    render();
    soltarRotulo(false);
    asentar();
    return;
  }
  // 450 ms + 60 ms por paso extra, tope 750 ms. Se recalcula desde la
  // posicion actual: las pulsaciones seguidas no se encolan.
  const pasos = Math.max(1, Math.ceil(Math.abs(delta) - 1e-6));
  const duracion = Math.min(cfg.giroMax, cfg.giro + cfg.giroExtra * (pasos - 1));
  let soltado = false;
  giro = gsap.to(pos, {
    p: destino,
    duration: duracion / 1000,
    ease: curvaGiro,
    onUpdate() {
      render();
      if (!soltado && this.progress() >= 0.5) {
        soltado = true;
        soltarRotulo(true);
      }
    },
    onComplete() {
      pos.p = modulo(pos.p, n);
      render();
      if (!soltado) soltarRotulo(true);
      giro = null;
      asentar();
    },
  });
}

/** Al asentarse el giro, la fila activa entra en la lista (storyboard 6.4). */
function asentar() {
  const e = estado();
  if (e.categoria === categoria && e.id) mostrarEnLista(e.id);
}

/** 0-150 ms salen; 150 ms se sustituye; 150-450 ms entran del frente hacia atras. */
function cambiarCategoria() {
  const gen = ++secuencia;
  giro?.kill();
  giro = null;
  gsap.killTweensOf(escenaAnim);
  gsap.killTweensOf(entrada);

  if (!movimientoPermitido()) {
    const e = estado();
    escenaAnim.o = escenaAnim.s = 1;
    pintarEscena();
    construir(e.categoria, e.indice);
    cambiando = false;
    soltarRotulo(false);
    return;
  }

  cambiando = true;
  gsap.to(escenaAnim, {
    o: 0,
    s: 0.96,
    duration: cfg.salida / 1000,
    ease: curvaSalida,
    onUpdate: pintarEscena,
    onComplete() {
      if (gen !== secuencia) return;
      const e = estado();
      construir(e.categoria, 0);
      // Orden de entrada: del frente hacia atras, 20 ms entre productos (tope 120)
      const n = items.length;
      items.forEach((it, k) => {
        it.retraso = Math.min(120, Math.min(k, n - k) * 20);
        it.a = 0;
      });
      escenaAnim.o = escenaAnim.s = 1;
      pintarEscena();
      render();
      cambiando = false;
      // Si se eligio desde la lista un producto que no queda al frente, el
      // rotulo espera al salto (girarA lo suelta al 50 %): no se adelanta.
      if (estado().indice <= 0) soltarRotulo(true);

      const total = cfg.entrada + 120;
      entrada.t = 0;
      gsap.to(entrada, {
        t: total,
        duration: total / 1000,
        ease: 'none',
        onUpdate() {
          for (const it of items) it.a = curvaVista(Math.min(1, Math.max(0, (entrada.t - it.retraso) / cfg.entrada)));
          render();
        },
        onComplete() {
          for (const it of items) it.a = 1;
          render();
          // Si se eligio un producto concreto de otra categoria (lista), ahora el salto
          if (gen === secuencia && estado().categoria === categoria) girarA(estado().indice);
        },
      });
    },
  });
}

function alProducto(ev: CustomEvent<DetalleProducto>) {
  const d = ev.detail;
  retenerRotulo();
  if (d.categoria !== categoria) return cambiarCategoria();
  if (cambiando) return; // la construccion leera el estado mas reciente
  if (!d.enCarrusel) return soltarRotulo(false); // producto sin imagen: el anillo no se mueve
  girarA(d.indice);
}

// ---------------------------------------------------------------------
// Arrastre / deslizamiento / toque en un lateral
// ---------------------------------------------------------------------
interface Arrastre {
  id: number;
  x0: number;
  p0: number;
  movido: boolean;
  item: string | null;
  ultimoP: number;
  ultimoT: number;
  v: number; // pasos por ms
}
let arrastre: Arrastre | null = null;

function alPulsar(ev: PointerEvent) {
  if (ev.button !== 0 || cambiando || !items.length) return;
  giro?.kill();
  giro = null;
  const item = (ev.target as Element).closest<HTMLElement>('.anillo-item');
  arrastre = {
    id: ev.pointerId,
    x0: ev.clientX,
    p0: pos.p,
    movido: false,
    item: item?.dataset.id ?? null,
    ultimoP: pos.p,
    ultimoT: ev.timeStamp,
    v: 0,
  };
}

function alMover(ev: PointerEvent) {
  const a = arrastre;
  if (!a || ev.pointerId !== a.id) return;
  const dx = ev.clientX - a.x0;
  if (!a.movido) {
    if (Math.abs(dx) < 6) return;
    a.movido = true;
    anillo.setPointerCapture(a.id);
    anillo.classList.add('arrastrando');
  }
  // 1 paso cada 0,8 x ancho de tarjeta; arrastrar a la izquierda trae el siguiente
  let p = a.p0 - dx / (0.8 * cfg.ancho);
  if (!movimientoPermitido()) p = Math.round(p);
  const dt = ev.timeStamp - a.ultimoT;
  if (dt > 0) a.v = 0.7 * ((p - a.ultimoP) / dt) + 0.3 * a.v;
  a.ultimoP = p;
  a.ultimoT = ev.timeStamp;
  pos.p = p;
  render();
}

function alSoltar(ev: PointerEvent) {
  const a = arrastre;
  if (!a || ev.pointerId !== a.id) return;
  arrastre = null;
  anillo.classList.remove('arrastrando');
  if (anillo.hasPointerCapture(a.id)) anillo.releasePointerCapture(a.id);
  const n = items.length;
  const actual = estado();

  if (!a.movido) {
    // Toque: en un lateral gira hasta el; en el frente solo se asienta
    if (ev.type === 'pointerup' && a.item && a.item !== actual.id) seleccionar(a.item, { origen: 'carrusel' });
    else girarA(actual.indice);
    return;
  }
  // Inercia: un lanzamiento rapido suma como maximo 3 pasos
  const reciente = ev.timeStamp - a.ultimoT < 80;
  const extra = movimientoPermitido() && reciente ? Math.max(-3, Math.min(3, Math.round(a.v * 180))) : 0;
  const destino = modulo(Math.round(pos.p) + extra, n);
  const id = items[destino]?.p.id;
  if (!id || id === actual.id) girarA(destino);
  else seleccionar(id, { origen: 'carrusel' });
}

// ---------------------------------------------------------------------
// Montaje
// ---------------------------------------------------------------------
function soporta3d() {
  return typeof CSS !== 'undefined' && CSS.supports('perspective', '1px') && CSS.supports('transform-style', 'preserve-3d');
}

function montar() {
  if (!carrusel || !hueco || !soporta3d()) return; // se queda la rejilla

  anillo = document.createElement('div');
  anillo.className = 'anillo';
  anillo.setAttribute('aria-hidden', 'true');
  anillo.dataset.anillo = '';
  escena3d = document.createElement('div');
  escena3d.className = 'anillo-escena';
  tarima = document.createElement('div');
  tarima.className = 'anillo-tarima';
  escena3d.append(tarima);
  anillo.append(escena3d);

  // Error de carga (heuristica 9): fuera del aria-hidden para que se lea
  avisoError = document.createElement('div');
  avisoError.className = 'anillo-error';
  avisoError.setAttribute('role', 'status');
  avisoError.hidden = true;
  const texto = document.createElement('p');
  texto.textContent = 'No pudimos cargar las imágenes. La lista tiene todos los productos.';
  const reintentar = document.createElement('button');
  reintentar.type = 'button';
  reintentar.className = 'anillo-reintentar';
  reintentar.textContent = 'Reintentar';
  reintentar.addEventListener('click', () => construir(categoria, modulo(Math.round(pos.p), items.length || 1)));
  avisoError.append(texto, reintentar);

  hueco.append(anillo, avisoError);
  carrusel.dataset.modo = '3d';

  const e = estado();
  construir(e.categoria, e.indice, true);

  window.addEventListener('hinojosa:producto', alProducto);
  anillo.addEventListener('pointerdown', alPulsar);
  anillo.addEventListener('pointermove', alMover);
  anillo.addEventListener('pointerup', alSoltar);
  anillo.addEventListener('pointercancel', alSoltar);

  // Tamanos de movil/escritorio: se recalcula el radio sin animar
  new ResizeObserver(() => {
    leerConfig();
    calcularRadio();
    render();
  }).observe(carrusel);

  // Fuera de Productos no queda nada en marcha: se terminan los tweens y el
  // ticker de GSAP se duerme solo (autoSleep). No hay bucle de render.
  alCambiarVista((d) => {
    if (d.vista === 'productos') return;
    // En orden: cada fase puede lanzar la siguiente al completarse
    gsap.getTweensOf(escenaAnim).forEach((t) => t.progress(1));
    gsap.getTweensOf(entrada).forEach((t) => t.progress(1));
    if (giro) giro.progress(1);
  });

  window.hinojosaCarrusel = { modo: '3d', posicion: () => pos.p, girando: () => Boolean(giro?.isActive()) };
}

declare global {
  interface Window {
    hinojosaCarrusel?: { modo: string; posicion: () => number; girando: () => boolean };
  }
}

montar();
