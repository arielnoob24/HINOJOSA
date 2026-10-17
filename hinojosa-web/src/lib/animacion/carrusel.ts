// Carrusel CSS 3D de Productos (docs/storyboard-carrusel.md).
//
// Se carga con import() dinamico la primera vez que se entra en Productos
// (carrusel-carga.ts): ni este modulo ni GSAP estan en la carga inicial.
// GSAP es la instancia comun de gsap-carga.ts (mismo modulo `gsap`).
//
// Anillo de "carteles": cada producto se coloca en su punto del circulo con
// translate3d(x, y, z) dentro de un contenedor con `perspective`, y SIEMPRE
// mira al frente (no hay rotateY: los envases no se deforman ni se
// espejan). GSAP anima unos pocos numeros (posicion `p` del anillo en
// pasos, aparicion y radio de la escena, llegada del frente, tarjeta
// generica, rotulo) y render() escribe transform / opacity / z-index.
//
// El estado (categoria y producto seleccionados) vive SOLO en catalogo.ts:
// aqui se escucha `hinojosa:producto`. La lista, las pestanas, las flechas,
// el teclado y la region aria-live ya los gestiona catalogo.ts; este modulo
// pinta, gira y decide CUANDO se ve cada cambio (C1-C8, PLAN.md vista 3):
//   C1 cache de items por categoria (se desmontan, no se destruyen; nunca
//      mas de 12 en escena), precarga con img.decode() (tope 250 ms desde
//      el clic) y fundido de 200 ms de cada imagen que llega tarde. NUNCA en
//      el primer montaje (regla M5, ver carrusel-carga.ts).
//   C2 rotulo con salida y entrada en el sentido del giro.
//   C3 ancho del chip de precio animado.
//   C4 resaltado visual de la fila al asentarse (catalogo.resaltarFila).
//   C5 cambio de categoria con medio giro direccional, tarima fundida y
//      radio interpolado.
//   C7 rotulo atenuado mientras se arrastra. C8 llegada del frente.
//   P5 tarjeta generica (costal) al frente para productos sin foto.
//   P9 un lanzamiento mueve como mucho 2 posiciones.
//
// Nunca gira solo. Con reduced motion o con la pausa del usuario todo
// cambio es instantaneo (y el arrastre da pasos discretos, sin inercia).
// Sin soporte de 3D no se monta y se queda la rejilla de respaldo.
import { gsap } from 'gsap';
import {
  estado,
  seleccionar,
  mostrarEnLista,
  resaltarFila,
  productosDelAnillo,
  sizesAnillo,
  IMAGEN_GENERICA,
  type DetalleProducto,
  type ProductoDatos,
} from '../catalogo';
import { alCambiarVista } from '../router';
import { curvaDeToken, movimientoPermitido, ms, px, token } from './movimiento';

interface Item {
  p: ProductoDatos;
  el: HTMLElement;
  tarjeta: HTMLElement;
  oscuro: HTMLElement;
  sombra: HTMLElement;
  img: HTMLImageElement;
  error: boolean;
  /** Asigna srcset/src (se difiere en los laterales del primer montaje). */
  cargar: () => void;
}

type Animacion = ReturnType<typeof gsap.to> | ReturnType<typeof gsap.timeline>;
type Linea = ReturnType<typeof gsap.timeline>;

const raiz = document.getElementById('productos');
const carrusel = raiz?.querySelector<HTMLElement>('[data-carrusel]') ?? null;
const hueco = carrusel?.querySelector<HTMLElement>('[data-carrusel-escena]') ?? null;
const rotulo = raiz?.querySelector<HTMLElement>('[data-carrusel-rotulo]') ?? null;
const mqMovil = window.matchMedia('(max-width: 47.999rem)');

// Numeros que anima GSAP (render() los traduce a estilos)
const pos = { p: 0 };
/** a: aparicion de la escena (productos + tarima), r: radio pintado (C5). */
const fase = { a: 1, r: 260 };
/** Llegada del frente (C8): 0 en reposo de giro, 1 asentado. */
const llegada = { l: 0 };
/** Tarjeta generica (P5): 0 oculta, 1 tapando el producto de la posicion costalK. */
const costal = { v: 0 };

let items: Item[] = [];
const cache = new Map<string, Item[]>();
let categoria = '';
let radioDestino = 260;
let llegadaK = -1;
let costalK = -1;
let destinoGiro = 0;

let giro: Animacion | null = null;
let animFase: Animacion | null = null;
let animLlegada: Animacion | null = null;
let animCostal: Animacion | null = null;
let animRotulo: Animacion | null = null;
let animChip: Animation | null = null;

let secuencia = 0;
let cambiando = false;
let destinoCambio = '';
let vistaActiva = true;
/** Primer montaje (regla M5): sin fundidos ni llegada animada. */
let primerMontaje = true;

let anillo: HTMLElement;
let escena3d: HTMLElement;
let tarima: HTMLElement;
let avisoError: HTMLElement;
let costalEl: HTMLElement;
let costalSombra: HTMLElement;
let costalNombre: HTMLElement;
/** Sin src hasta que se use: oculto no debe pedirse ni competir por el LCP (M5). */
let costalImg: HTMLImageElement;

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
};
// Tiempos de C1-C8 (PLAN.md vista 3; storyboard-carrusel 6.6). Locales: no
// hay tokens para ellos en tokens.css.
const T = {
  categoriaSalida: 160,
  categoriaEntrada: 320,
  precargaTope: 250,
  rotuloSalida: 110,
  rotuloSalidaMin: 50,
  rotuloEntrada: 200,
  rotuloMeta: 40,
  rotuloArrastre: 120,
  chip: 200,
  llegada: 180,
  llegadaVuelta: 100,
  costal: 200,
};
const curvaGiro = curvaDeToken('--ease-giro', [0.22, 1.3, 0.36, 1]);
const curvaVista = curvaDeToken('--ease-vista', [0.22, 1, 0.36, 1]);
const curvaSalida = curvaDeToken('--ease-salida', [0.4, 0, 1, 1]);

/** Movimiento permitido y vista visible: si no, todo cambio es instantaneo. */
const animar = () => vistaActiva && movimientoPermitido();

function leerConfig() {
  cfg.ancho = items[0]?.el.offsetWidth || px(token('--carrusel-ancho'), 180);
  cfg.hueco = px(token('--carrusel-hueco'), 16);
  cfg.radioMin = px(token('--carrusel-radio-min'), 260);
  cfg.opacidadMin = parseFloat(token('--carrusel-opacidad-min')) || 0.4;
  cfg.oscuroMax = parseFloat(token('--carrusel-oscuro-max')) || 0.45;
  cfg.giro = ms(token('--duracion-giro'), 450);
  cfg.giroExtra = ms(token('--duracion-giro-extra'), 60);
  cfg.giroMax = ms(token('--duracion-giro-max'), 750);
}

const modulo = (n: number, m: number) => ((n % m) + m) % m;

/** r = max(radio-min, (ancho + hueco) / (2 tan(pi/N))). La tarima se dimensiona al radio destino; el interpolado lo pone su scale. */
function calcularRadio() {
  const n = items.length;
  radioDestino = n < 3 ? cfg.radioMin : Math.max(cfg.radioMin, (cfg.ancho + cfg.hueco) / (2 * Math.tan(Math.PI / n)));
  const d = 2 * radioDestino + cfg.ancho;
  tarima.style.width = tarima.style.height = `${d}px`;
  tarima.style.margin = `0 0 ${-d / 2}px ${-d / 2}px`;
}

// ---------------------------------------------------------------------
// Pintado
// ---------------------------------------------------------------------
function render() {
  const n = items.length;
  if (!n) return;
  const r = fase.r;
  const frente = modulo(Math.round(pos.p), n);
  for (let k = 0; k < n; k++) {
    const it = items[k];
    const phi = (2 * Math.PI * (k - pos.p)) / n; // 0 = al frente
    const c = Math.cos(phi);
    const x = r * Math.sin(phi);
    const z = r * (c - 1); // el frente queda en z = 0 (tamano 1:1)
    const d = (1 + c) / 2; // 1 al frente, 0 detras
    const l = k === llegadaK ? llegada.l : 0;
    const base = (cfg.opacidadMin + (1 - cfg.opacidadMin) * d) * fase.a;
    const transform = `translate3d(${x.toFixed(2)}px, ${(-4 * l).toFixed(2)}px, ${z.toFixed(2)}px)`;
    const zIndex = String(Math.round(d * 100));
    it.el.style.transform = transform;
    it.el.style.opacity = (k === costalK ? base * (1 - costal.v) : base).toFixed(3);
    it.el.style.zIndex = zIndex;
    it.oscuro.style.opacity = (cfg.oscuroMax * (1 - d)).toFixed(3);
    pintarSombra(it.sombra, d, l);
    it.el.toggleAttribute('data-frente', k === frente);
    if (k === costalK && costal.v > 0) {
      costalEl.style.transform = transform;
      costalEl.style.opacity = (base * costal.v).toFixed(3);
      costalEl.style.zIndex = zIndex;
      pintarSombra(costalSombra, d, l);
    }
  }
  const conCostal = costal.v > 0 && costalK >= 0;
  if (conCostal && !costalImg.src) costalImg.src = IMAGEN_GENERICA;
  costalEl.style.display = conCostal ? '' : 'none';
  // Tarima: se funde con los productos y sigue al radio interpolado (C5)
  const escala = (2 * r + cfg.ancho) / (2 * radioDestino + cfg.ancho);
  tarima.style.opacity = fase.a.toFixed(3);
  tarima.style.transform = `translate3d(0, 0, ${(-r).toFixed(1)}px) rotateX(90deg) scale(${escala.toFixed(4)})`;
}

/** Sombra de contacto: mas intensa y ancha en la llegada (C8: 0,35 -> 0,5, scaleX 1,06). */
function pintarSombra(s: HTMLElement, d: number, l: number) {
  s.style.opacity = (0.1 + 0.25 * d + 0.15 * l).toFixed(3);
  s.style.transform = l > 0 ? `scaleX(${(1 + 0.06 * l).toFixed(4)})` : '';
}

// ---------------------------------------------------------------------
// Rotulo (C2, C3, C7). catalogo.ts lo escribe al seleccionar; aqui se
// RETIENE el texto visible y se cambia cuando el producto nuevo llega al
// frente, con salida y entrada en el sentido del giro.
// ---------------------------------------------------------------------
const camposRotulo = rotulo
  ? (['nombre', 'categoria', 'posicion', 'precio'].map((c) => rotulo.querySelector<HTMLElement>(`[data-rotulo-${c}]`)) as (HTMLElement | null)[])
  : [];
const rNombre = rotulo?.querySelector<HTMLElement>('[data-rotulo-nombre]') ?? null;
const rMeta = rotulo?.querySelector<HTMLElement>('[data-rotulo-meta]') ?? null;
const rChip = rotulo?.querySelector<HTMLElement>('[data-rotulo-precio]') ?? null;
const leerRotulo = () => camposRotulo.map((el) => el?.textContent ?? '');
const escribirRotulo = (v: string[]) =>
  camposRotulo.forEach((el, i) => {
    if (el && el.textContent !== v[i]) el.textContent = v[i];
  });
let rotuloVisible: string[] = leerRotulo();
let rotuloPendiente: string[] | null = null;
/** Opacidad y desplazamiento del nombre (n) y de la linea de categoria/precio (m). */
const rs = { no: 1, nx: 0, mo: 1, mx: 0 };

function pintarRotulo() {
  if (rNombre) {
    rNombre.style.opacity = rs.no >= 1 ? '' : rs.no.toFixed(3);
    rNombre.style.transform = rs.nx ? `translateX(${rs.nx.toFixed(2)}px)` : '';
  }
  if (rMeta) {
    rMeta.style.opacity = rs.mo >= 1 ? '' : rs.mo.toFixed(3);
    rMeta.style.transform = rs.mx ? `translateX(${rs.mx.toFixed(2)}px)` : '';
  }
}

function retenerRotulo() {
  const nuevo = leerRotulo();
  if (nuevo.join('\u0000') === rotuloVisible.join('\u0000')) {
    rotuloPendiente = null;
    return;
  }
  rotuloPendiente = nuevo;
  escribirRotulo(rotuloVisible);
}

/** Escribe el texto pendiente; con movimiento, el chip anima su ancho (C3). */
function cambiarTexto() {
  if (!rotuloPendiente) return;
  animChip?.cancel();
  animChip = null;
  const w0 = rChip?.getBoundingClientRect().width ?? 0;
  escribirRotulo(rotuloPendiente);
  rotuloVisible = rotuloPendiente;
  rotuloPendiente = null;
  if (!rChip || !w0 || !animar()) return;
  const w1 = rChip.getBoundingClientRect().width;
  if (Math.abs(w1 - w0) < 0.5) return;
  animChip = rChip.animate([{ width: `${w0}px` }, { width: `${w1}px` }], {
    duration: T.chip,
    easing: token('--ease-vista') || 'ease-out',
  });
  animChip.onfinish = () => (animChip = null);
}

/** Cambio sin animacion (movimiento reducido, pausa, sincronizacion por detras). */
function rotuloYa() {
  animRotulo?.kill();
  animRotulo = null;
  if (rotuloPendiente) cambiarTexto();
  rs.no = rs.mo = 1;
  rs.nx = rs.mx = 0;
  pintarRotulo();
}

/** Vuelve al reposo (tras atenuarlo al arrastrar sin cambiar de producto). */
function rotuloAlReposo() {
  if (rs.no >= 1 && rs.mo >= 1 && !rs.nx && !rs.mx) return;
  animRotulo?.kill();
  animRotulo = gsap.to(rs, { no: 1, mo: 1, nx: 0, mx: 0, duration: T.rotuloEntrada / 1000, ease: curvaVista, onUpdate: pintarRotulo });
}

/** Entrada desde el lado contrario (+12 px -> 0); la meta 40 ms despues. */
function anadirEntrada(tl: Linea, dir: number, t: number) {
  tl.call(
    () => {
      cambiarTexto();
      rs.no = rs.mo = 0;
      rs.nx = rs.mx = 12 * dir;
      pintarRotulo();
    },
    undefined,
    t / 1000,
  );
  const dur = T.rotuloEntrada / 1000;
  tl.fromTo(rs, { no: 0, nx: 12 * dir }, { no: 1, nx: 0, duration: dur, ease: curvaVista, immediateRender: false }, t / 1000);
  tl.fromTo(rs, { mo: 0, mx: 12 * dir }, { mo: 1, mx: 0, duration: dur, ease: curvaVista, immediateRender: false }, (t + T.rotuloMeta) / 1000);
}

/**
 * C2: sale en el sentido del giro (dir +1 = los productos van a la
 * izquierda, el texto sale a -12 px) y el texto cambia en `tCambio` ms,
 * cuando el producto destino ocupa el frente. La salida (110 ms, 60 como
 * minimo si el giro es muy rapido) termina antes de que el frente deje de
 * ser el producto de partida (`tSale`): en un salto largo, los productos
 * intermedios pasan con el rotulo ya fuera. tCambio null: solo la salida
 * (el cambio lo hace entrarRotulo al empezar la entrada de una categoria).
 *
 * Nota: con --ease-giro el anillo recorre medio paso en ~12 % del tiempo,
 * asi que anclar el cambio al 50 % del TIEMPO (storyboard 6.6) dejaba el
 * nombre viejo bajo el producto nuevo ~170 ms. Se ancla al cruce real.
 */
function programarRotulo(dir: number, tCambio: number | null, tSale = tCambio ?? 0) {
  if (!rotuloPendiente) return rotuloAlReposo();
  if (!animar()) return rotuloYa();
  animRotulo?.kill();
  const limite = Math.min(tSale, tCambio ?? Infinity);
  const salida = tCambio === null ? T.rotuloSalida : Math.min(T.rotuloSalida, Math.max(T.rotuloSalidaMin, limite));
  const inicio = tCambio === null ? 0 : Math.max(0, limite - salida);
  const tl = gsap.timeline({ onUpdate: pintarRotulo });
  // Salida acortada (giro muy rapido): lineal, para que se vaya de verdad a tiempo
  const curva = salida < T.rotuloSalida ? 'none' : curvaSalida;
  tl.to(rs, { no: 0, mo: 0, nx: -12 * dir, mx: -12 * dir, duration: salida / 1000, ease: curva }, inicio / 1000);
  if (tCambio !== null) anadirEntrada(tl, dir, Math.max(tCambio, inicio + salida));
  animRotulo = tl;
}

function entrarRotulo(dir: number) {
  if (!rotuloPendiente) return rotuloAlReposo();
  if (!animar()) return rotuloYa();
  animRotulo?.kill();
  const tl = gsap.timeline({ onUpdate: pintarRotulo });
  // Si la salida no termino (entrada muy rapida), se acaba en 50 ms
  let t = 0;
  if (rs.no > 0.01 || rs.mo > 0.01) {
    tl.to(rs, { no: 0, mo: 0, nx: -12 * dir, mx: -12 * dir, duration: T.rotuloSalidaMin / 1000, ease: curvaSalida }, 0);
    t = T.rotuloSalidaMin;
  }
  anadirEntrada(tl, dir, t);
  animRotulo = tl;
}

/** C7: mientras se arrastra, el rotulo se atenua a 0,5 (no cambia el texto). */
function atenuarRotulo() {
  animRotulo?.kill();
  if (!animar()) {
    rs.no = rs.mo = 0.5;
    rs.nx = rs.mx = 0;
    pintarRotulo();
    animRotulo = null;
    return;
  }
  animRotulo = gsap.to(rs, { no: 0.5, mo: 0.5, nx: 0, mx: 0, duration: T.rotuloArrastre / 1000, ease: curvaVista, onUpdate: pintarRotulo });
}

/**
 * Fraccion de la duracion en que el anillo ha recorrido `recorrido` pasos de
 * `pasos`: (pasos - 0,5) da cuando el destino ocupa el frente; 0,5 cuando
 * el de partida deja de ocuparlo.
 */
function fraccionCruce(pasos: number, recorrido = pasos - 0.5) {
  const f = recorrido / pasos;
  if (f <= 0) return 0;
  for (let i = 1; i <= 200; i++) if (curvaGiro(i / 200) >= f) return i / 200;
  return 1;
}

// ---------------------------------------------------------------------
// Llegada del frente (C8) y tarjeta generica (P5)
// ---------------------------------------------------------------------
function llegar(k: number) {
  animLlegada?.kill();
  llegadaK = k;
  if (!animar()) {
    llegada.l = 1;
    animLlegada = null;
    return render();
  }
  llegada.l = 0;
  animLlegada = gsap.to(llegada, { l: 1, duration: T.llegada / 1000, ease: curvaVista, onUpdate: render });
}

/** Al empezar otro giro, el frente vuelve a su sitio (100 ms). */
function bajarLlegada() {
  animLlegada?.kill();
  animLlegada = null;
  if (llegada.l <= 0) return;
  if (!animar()) {
    llegada.l = 0;
    return;
  }
  animLlegada = gsap.to(llegada, { l: 0, duration: T.llegadaVuelta / 1000, ease: curvaSalida, onUpdate: render });
}

function mostrarCostal(p: ProductoDatos) {
  const n = items.length;
  if (!n) return;
  animCostal?.kill();
  // Tapa la posicion que queda (o quedara) al frente
  const k = modulo(Math.round(giro ? destinoGiro : pos.p), n);
  const fin = () => {
    animCostal = null;
    const e = estado();
    if (e.id === p.id) {
      mostrarEnLista(e.id);
      resaltarFila(e.id);
    }
  };
  const poner = () => {
    costalNombre.textContent = p.nombre;
    costalK = k;
    render();
  };
  programarRotulo(1, 0);
  if (!animar()) {
    poner();
    costal.v = 1;
    render();
    return fin();
  }
  // El costal aparece cuando el rotulo ya salio (50 ms): nunca el nombre
  // viejo bajo el costal nuevo. Si ya habia uno (otro producto sin foto),
  // se apaga en esos 50 ms y vuelve con el nombre nuevo.
  const tl = gsap.timeline({ onUpdate: render, onComplete: fin });
  if (costal.v > 0) tl.to(costal, { v: 0, duration: T.rotuloSalidaMin / 1000, ease: 'none' });
  else tl.to({}, { duration: T.rotuloSalidaMin / 1000 });
  tl.call(poner);
  tl.to(costal, { v: 1, duration: T.costal / 1000, ease: curvaVista });
  animCostal = tl;
}

function ocultarCostal() {
  animCostal?.kill();
  animCostal = null;
  if (costal.v <= 0) {
    costalK = -1;
    return;
  }
  if (!animar()) {
    costal.v = 0;
    costalK = -1;
    return render();
  }
  animCostal = gsap.to(costal, {
    v: 0,
    delay: T.rotuloSalidaMin / 1000, // tras la salida del rotulo (50 ms)
    duration: T.costal / 1000,
    ease: curvaVista,
    onUpdate: render,
    onComplete() {
      costalK = -1;
      animCostal = null;
      render();
    },
  });
}

// ---------------------------------------------------------------------
// Items y cache por categoria (C1)
// ---------------------------------------------------------------------
function crearItem(p: ProductoDatos, fundir: boolean): Item {
  const el = document.createElement('div');
  el.className = 'anillo-item';
  el.dataset.id = p.id;

  const sombra = document.createElement('span');
  sombra.className = 'anillo-sombra';

  const tarjeta = document.createElement('span');
  tarjeta.className = 'anillo-tarjeta cargando';
  if (p.conFondo) tarjeta.classList.add('anillo-placa');
  // C1: fundido de 200 ms al llegar la imagen. Nunca en el primer montaje (M5).
  if (fundir) tarjeta.classList.add('fundir');

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

  const item: Item = { p, el, tarjeta, oscuro, sombra, img, error: false, cargar };
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
    if (items.includes(item) && items.every((i) => i.error)) avisoError.hidden = false;
  });
  return item;
}

/** Items de una categoria: de la cache o recien creados (sin pedir aun la imagen). */
function itemsDe(cat: string): Item[] {
  let lista = cache.get(cat);
  if (!lista) {
    lista = productosDelAnillo(cat).map((p) => crearItem(p, !primerMontaje));
    cache.set(cat, lista);
  }
  return lista;
}

/** Desmonta los items de la escena (quedan en la cache) y monta los de `cat`. */
function montarCategoria(cat: string) {
  for (const it of items) it.el.remove();
  categoria = cat;
  items = itemsDe(cat);
  items.forEach((i) => i.cargar());
  escena3d.append(...items.map((i) => i.el));
  avisoError.hidden = !(items.length && items.every((i) => i.error));
  leerConfig();
  calcularRadio();
}

/** C1: espera a que las imagenes esten decodificadas, con tope. */
function precargar(lista: Item[], tope: number): Promise<void> {
  const todas = Promise.all(lista.map((i) => (i.img.complete && i.img.naturalWidth ? null : i.img.decode().catch(() => undefined)))).then(
    () => undefined,
  );
  return Promise.race([todas, new Promise<void>((res) => window.setTimeout(res, Math.max(0, tope)))]);
}

/**
 * Primer montaje (regla M5): la imagen del frente se pide ya y las de los
 * laterales cuando el frente se ha pintado, para que no compitan con la
 * imagen LCP al entrar directo por #productos. Sin fundidos: el frente queda
 * identico a la tarjeta provisional (que esta debajo) hasta que esta se
 * retira en la primera interaccion o a los 1,5 s (carrusel-carga.ts).
 */
function construirInicial(cat: string, indice: number) {
  categoria = cat;
  items = itemsDe(cat);
  const frente = items[modulo(Math.max(0, indice), items.length || 1)];
  if (frente) {
    frente.cargar();
    const resto = () => requestAnimationFrame(() => requestAnimationFrame(() => items.forEach((i) => i.cargar())));
    if (frente.img.complete) resto();
    else {
      let hecho = false;
      const una = () => {
        if (hecho) return;
        hecho = true;
        resto();
      };
      frente.img.addEventListener('load', una, { once: true });
      frente.img.addEventListener('error', una, { once: true });
      window.setTimeout(una, 1500);
    }
  }
  escena3d.append(...items.map((i) => i.el));
  avisoError.hidden = true;
  pos.p = Math.max(0, indice);
  leerConfig();
  calcularRadio();
  fase.r = radioDestino;
  // El frente arranca ya "llegado" (C8): la provisional lleva el mismo -4 px
  llegadaK = modulo(Math.round(pos.p), items.length || 1);
  llegada.l = 1;
  render();
  primerMontaje = false;
}

// ---------------------------------------------------------------------
// Movimiento
// ---------------------------------------------------------------------
function matarTodo() {
  for (const a of [giro, animFase, animLlegada, animCostal, animRotulo]) a?.kill();
  giro = animFase = animLlegada = animCostal = animRotulo = null;
  animChip?.finish();
  animChip = null;
}

/**
 * Estado final sin animar: movimiento reducido o pausa, fila tocada en
 * movil (la hoja de detalle tapa el anillo) y salida de la vista.
 */
function sincronizarYa() {
  secuencia++;
  cambiando = false;
  destinoCambio = '';
  matarTodo();
  const e = estado();
  if (e.categoria && (e.categoria !== categoria || !items.length)) montarCategoria(e.categoria);
  const n = items.length;
  fase.a = 1;
  fase.r = radioDestino;
  if (n) pos.p = modulo(e.frente, n);
  if (e.sinImagen && e.producto && n) {
    costalNombre.textContent = e.producto.nombre;
    costalK = modulo(e.frente, n);
    costal.v = 1;
  } else {
    costalK = -1;
    costal.v = 0;
  }
  llegadaK = n ? modulo(Math.round(pos.p), n) : -1;
  llegada.l = 1;
  rotuloYa();
  render();
  if (e.id) resaltarFila(e.id);
}

function girarA(indice: number) {
  const n = items.length;
  if (!n || indice < 0) return;
  let delta = modulo(indice - pos.p, n);
  if (delta > n / 2) delta -= n; // camino mas corto
  const destino = pos.p + delta;
  giro?.kill();
  giro = null;

  if (!animar()) {
    pos.p = modulo(destino, n);
    llegada.l = 0;
    render();
    rotuloYa();
    asentar();
    return;
  }
  if (Math.abs(delta) < 1e-3) {
    // Ya esta al frente (p. ej. se deja la tarjeta generica): solo el rotulo
    programarRotulo(1, 0);
    if (llegadaK !== modulo(Math.round(pos.p), n) || llegada.l < 1) asentar();
    else mostrarFila();
    return;
  }
  bajarLlegada();
  // 450 ms + 60 ms por paso extra, tope 750 ms. Se recalcula desde la
  // posicion actual: las pulsaciones seguidas no se encolan.
  const pasos = Math.max(1, Math.ceil(Math.abs(delta) - 1e-6));
  const duracion = Math.min(cfg.giroMax, cfg.giro + cfg.giroExtra * (pasos - 1));
  // Cuando llega el destino al frente y cuando se va el de partida
  const abs = Math.abs(delta);
  const s = Math.sign(delta);
  const hastaSalir = Math.min(abs, Math.max(0, 0.5 + (Math.round(pos.p) - pos.p) * s));
  programarRotulo(s, fraccionCruce(abs) * duracion, fraccionCruce(abs, hastaSalir) * duracion);
  destinoGiro = destino;
  giro = gsap.to(pos, {
    p: destino,
    duration: duracion / 1000,
    ease: curvaGiro,
    onUpdate: render,
    onComplete() {
      giro = null;
      pos.p = modulo(pos.p, n);
      if (costalK >= 0 && costal.v <= 0) costalK = -1;
      render();
      asentar();
    },
  });
}

function mostrarFila() {
  const e = estado();
  if (e.categoria === categoria && e.id) {
    mostrarEnLista(e.id);
    resaltarFila(e.id);
  }
}

/** Al asentarse el giro: la fila entra en la lista y se resalta (C4) y llega el frente (C8). */
function asentar() {
  mostrarFila();
  if (items.length) llegar(modulo(Math.round(pos.p), items.length));
}

/** Orden de las pestanas (sentido del medio giro de C5). */
function ordenCategoria(cat: string) {
  const botones = Array.from(raiz?.querySelectorAll<HTMLElement>('[data-categoria-boton]') ?? []);
  return botones.findIndex((b) => b.dataset.categoriaBoton === cat);
}

/**
 * C5 + C1. Sale: medio paso en el sentido de las pestanas y fundido de
 * productos y tarima (160 ms). Mientras, se piden y decodifican las imagenes
 * de la categoria nueva (tope 250 ms desde el clic). Entra: desde el lado
 * opuesto, ya en el producto elegido, con el radio interpolado (320 ms).
 */
function cambiarCategoria(cat: string) {
  const gen = ++secuencia;
  const desde = cambiando ? destinoCambio : categoria;
  const dir = Math.sign(ordenCategoria(cat) - ordenCategoria(desde)) || 1;
  cambiando = true;
  destinoCambio = cat;
  giro?.kill();
  animFase?.kill();
  animCostal?.kill();
  giro = animFase = animCostal = null;
  bajarLlegada();

  const nuevos = itemsDe(cat);
  nuevos.forEach((i) => i.cargar());
  const listas = precargar(nuevos, T.precargaTope);

  programarRotulo(dir, null);
  const salida = new Promise<void>((res) => {
    if (fase.a <= 0.001) return res();
    const dur = (T.categoriaSalida / 1000) * Math.max(0.4, fase.a);
    animFase = gsap.to(fase, { a: 0, duration: dur, ease: curvaSalida, onUpdate: render, onComplete: res });
    giro = gsap.to(pos, { p: pos.p + 0.5 * dir, duration: dur, ease: curvaSalida });
  });

  void Promise.all([salida, listas]).then(() => {
    if (gen !== secuencia) return;
    entrarCategoria(dir);
  });
}

function entrarCategoria(dir: number) {
  const e = estado();
  const rViejo = fase.r;
  giro?.kill();
  animFase?.kill();
  montarCategoria(e.categoria);
  cambiando = false;
  destinoCambio = '';
  const n = items.length;
  if (!n) return sincronizarYa();
  const idx = modulo(e.frente, n);
  if (e.sinImagen && e.producto) {
    costalNombre.textContent = e.producto.nombre;
    costalK = idx;
    costal.v = 1;
  } else {
    costalK = -1;
    costal.v = 0;
  }
  animLlegada?.kill();
  animLlegada = null;
  llegadaK = -1;
  llegada.l = 0;
  pos.p = idx - 0.5 * dir;
  fase.a = 0;
  fase.r = rViejo;
  render();
  entrarRotulo(dir);
  const dur = T.categoriaEntrada / 1000;
  animFase = gsap.to(fase, {
    a: 1,
    r: radioDestino,
    duration: dur,
    ease: curvaVista,
    onUpdate: render,
    onComplete() {
      animFase = null;
      fase.r = radioDestino;
    },
  });
  destinoGiro = idx;
  giro = gsap.to(pos, {
    p: idx,
    duration: dur,
    ease: curvaGiro,
    onUpdate: render,
    onComplete() {
      giro = null;
      render();
      asentar();
    },
  });
}

function alProducto(ev: CustomEvent<DetalleProducto>) {
  const d = ev.detail;
  retenerRotulo();
  // Movil: la fila abre la hoja de detalle, que tapa el anillo; se
  // sincroniza por detras sin animar (storyboard 6.7)
  if (!animar() || (d.origen === 'lista' && mqMovil.matches)) return sincronizarYa();
  if (cambiando) {
    // La entrada leera el estado mas reciente; solo otra categoria reinicia
    if (d.categoria !== destinoCambio) cambiarCategoria(d.categoria);
    return;
  }
  if (d.categoria !== categoria) return cambiarCategoria(d.categoria);
  if (!d.enCarrusel) return mostrarCostal(d.producto);
  ocultarCostal();
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
    bajarLlegada();
    atenuarRotulo();
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
    else girarA(actual.frente);
    return;
  }
  // Inercia (P9): un lanzamiento rapido suma como maximo 2 pasos, y el
  // gesto entero no pasa de 2 posiciones salvo que el dedo ya las recorriera
  const reciente = ev.timeStamp - a.ultimoT < 80;
  const soltado = Math.round(pos.p);
  let extra = movimientoPermitido() && reciente ? Math.max(-2, Math.min(2, Math.round(a.v * 180))) : 0;
  const recorrido = soltado - Math.round(a.p0);
  const tope = Math.max(2, Math.abs(recorrido));
  extra = Math.max(-tope - recorrido, Math.min(tope - recorrido, extra));
  const destino = modulo(soltado + extra, n);
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

/** P5: costal generico con el nombre en HTML encima (zona x 23-77 %, y 40-70 % del dibujo). */
function crearCostal() {
  costalEl = document.createElement('div');
  costalEl.className = 'anillo-item anillo-item-costal';
  costalEl.style.display = 'none';
  costalSombra = document.createElement('span');
  costalSombra.className = 'anillo-sombra';
  const tarjeta = document.createElement('span');
  tarjeta.className = 'anillo-tarjeta anillo-costal';
  const img = document.createElement('img');
  img.alt = '';
  img.width = 200;
  img.height = 260;
  img.draggable = false;
  costalImg = img;
  costalNombre = document.createElement('span');
  costalNombre.className = 'anillo-costal-nombre';
  tarjeta.append(img, costalNombre);
  costalEl.append(costalSombra, tarjeta);
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
  crearCostal();
  escena3d.append(tarima, costalEl);
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
  reintentar.addEventListener('click', () => {
    for (const it of items) it.el.remove();
    cache.delete(categoria);
    items = [];
    sincronizarYa();
  });
  avisoError.append(texto, reintentar);

  hueco.append(anillo, avisoError);
  carrusel.dataset.modo = '3d';

  const e = estado();
  construirInicial(e.categoria, e.frente);

  window.addEventListener('hinojosa:producto', alProducto);
  anillo.addEventListener('pointerdown', alPulsar);
  anillo.addEventListener('pointermove', alMover);
  anillo.addEventListener('pointerup', alSoltar);
  anillo.addEventListener('pointercancel', alSoltar);

  // Tamanos de movil/escritorio: se recalcula el radio sin animar
  new ResizeObserver(() => {
    leerConfig();
    calcularRadio();
    if (!animFase) fase.r = radioDestino;
    render();
  }).observe(carrusel);

  // Fuera de Productos no queda nada en marcha: todo pasa a su estado final
  // y el ticker de GSAP se duerme en el acto (sin esperar a su autoSleep de
  // 120 fotogramas). No hay bucle de render.
  alCambiarVista((d) => {
    vistaActiva = d.vista === 'productos';
    if (vistaActiva) return;
    sincronizarYa();
    gsap.ticker.sleep();
  });

  window.hinojosaCarrusel = {
    modo: '3d',
    posicion: () => pos.p,
    girando: () => Boolean(giro?.isActive()),
    diagnostico: () => ({
      p: pos.p,
      a: fase.a,
      r: fase.r,
      radio: radioDestino,
      llegadaK,
      llegada: llegada.l,
      costalK,
      costal: costal.v,
      rotulo: { ...rs },
      categoria,
      enEscena: escena3d.querySelectorAll('.anillo-item:not(.anillo-item-costal)').length,
      cache: Array.from(cache.keys()),
      cambiando,
    }),
  };
}

declare global {
  interface Window {
    hinojosaCarrusel?: {
      modo: string;
      posicion: () => number;
      girando: () => boolean;
      diagnostico?: () => Record<string, unknown>;
    };
  }
}

montar();
