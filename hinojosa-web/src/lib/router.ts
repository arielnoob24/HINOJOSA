// Router de vistas de Comercial Hinojosa (contrato: skill `vistas-hinojosa`).
//
// Una sola pagina con 4 <section class="vista"> en el HTML servido. Este
// modulo, al importarse por primera vez:
//   - marca <html data-router="activo"> (el CSS de Layout.astro aplica
//     entonces overflow:hidden y la capa fija; sin JS no pasa nada de esto),
//   - muestra solo la vista del hash y oculta las demas con `hidden` + `inert`,
//   - escucha `hashchange` (boton atras y enlaces directos),
//   - mueve el foco al titulo de la vista nueva (tabindex="-1"),
//   - marca la barra con aria-current="page",
//   - cambia de vista con flechas / AvPag / RePag fuera de campos de texto.
//
// PUNTOS DE ENGANCHE (para animacion-interaccion, mapa, carrusel...):
//   - Evento `hinojosa:vista` en window, detail: DetalleVista (ver tipo).
//   - alCambiarVista(cb), alEntrarEnVista(nombre, cb, { unaVez })
//   - registrarTransicion(fn): anima salida/entrada SIN retrasar el foco.
//   - window.hinojosaVistas: misma API para scripts sin bundler.

// 2026-10-16: "Por que elegirnos" deja de ser vista y pasa a ser un bloque
// de Quienes somos con id="por-que": resolver() abre #por-que dentro de
// #nosotros, asi que los enlaces viejos siguen funcionando.
export const VISTAS = ['inicio', 'productos', 'nosotros', 'visitanos'] as const;
export type Vista = (typeof VISTAS)[number];

export interface DetalleVista {
  /** Vista que queda activa. */
  vista: Vista;
  /** Vista anterior (null en el arranque). */
  anterior: Vista | null;
  /** Posicion 0..3 de la vista activa. */
  indice: number;
  /** +1 si se avanza en el orden de la barra, -1 si se retrocede, 0 en el arranque. */
  direccion: 1 | -1 | 0;
  /** true en la activacion inicial (sin transicion). */
  inicial: boolean;
}

export interface ContextoTransicion {
  saliente: HTMLElement;
  entrante: HTMLElement;
  direccion: 1 | -1;
  /**
   * Vistas que aun se estaban yendo por una transicion anterior (clics
   * rapidos): siguen visibles e inert, por debajo, hasta que esta termine.
   * Ocultarlas de golpe a mitad del fundido dejaba ver el fondo del body.
   */
  previas: HTMLElement[];
}
/**
 * Funcion de transicion. Se llama cuando el entrante YA es visible, ya no
 * es inert y ya tiene el foco; el saliente (y las `previas`) siguen visibles
 * pero inert. Al resolverse la promesa (o a los 1200 ms como tope) el router
 * los oculta con `hidden`, salvo que entretanto haya empezado otra
 * transicion (entonces los oculta esa). No se llama con
 * prefers-reduced-motion ni con las animaciones pausadas: el cambio es
 * instantaneo.
 */
export type Transicion = (ctx: ContextoTransicion) => Promise<unknown> | void;

const html = document.documentElement;
const TOPE_TRANSICION = 1200;
const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

const secciones = new Map<Vista, HTMLElement>();
for (const v of VISTAS) {
  const el = document.getElementById(v);
  if (el) secciones.set(v, el);
}

const enlacesBarra = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-nav-vista]'));
const tituloBase = document.title;

let actual: Vista | null = null;
let transicion: Transicion | null = null;
let generacion = 0; // invalida transiciones viejas si se cambia de vista rapido

function esVista(nombre: string): nombre is Vista {
  return (VISTAS as readonly string[]).includes(nombre);
}

function movimientoPermitido(): boolean {
  return !mqReducido.matches && html.getAttribute('data-movimiento') !== 'pausado';
}

function tituloDe(seccion: HTMLElement): HTMLElement | null {
  return seccion.querySelector<HTMLElement>('[data-titulo-vista]');
}

function ocultar(el: HTMLElement) {
  el.hidden = true;
  el.inert = true;
  el.removeAttribute('data-saliendo');
}

/**
 * Resuelve el hash a una vista. Un hash que no es de vista pero apunta a un
 * elemento dentro de una vista (p. ej. #catalogo-lista) abre esa vista y
 * devuelve el elemento para darle el foco.
 */
function resolver(hash: string): { vista: Vista; destino: HTMLElement | null } {
  const nombre = decodeURIComponent(hash.replace(/^#/, ''));
  if (esVista(nombre)) return { vista: nombre, destino: null };
  if (nombre) {
    const el = document.getElementById(nombre);
    const contenedora = el?.closest<HTMLElement>('.vista');
    if (el && contenedora && esVista(contenedora.id)) return { vista: contenedora.id, destino: el };
  }
  return { vista: 'inicio', destino: null };
}

function activar(destino: Vista, { inicial = false, foco = true, elemento = null as HTMLElement | null } = {}) {
  const entrante = secciones.get(destino);
  if (!entrante) return;
  const anterior = actual;

  if (anterior === destino && !inicial) {
    if (foco) (elemento ?? tituloDe(entrante))?.focus({ preventScroll: !elemento });
    return;
  }

  const gen = ++generacion;
  const saliente = anterior ? secciones.get(anterior) ?? null : null;
  const idxNuevo = VISTAS.indexOf(destino);
  const idxViejo = anterior ? VISTAS.indexOf(anterior) : idxNuevo;
  const direccion: 1 | -1 | 0 = inicial || !anterior ? 0 : idxNuevo > idxViejo ? 1 : -1;
  const animar = Boolean(transicion && saliente && direccion !== 0 && movimientoPermitido());

  // 1. Entrante visible y operable
  entrante.hidden = false;
  entrante.inert = false;
  entrante.removeAttribute('data-saliendo');
  entrante.setAttribute('data-activa', '');

  // 2. El resto, inert al instante; oculto ya salvo el saliente si se anima
  //    y las que aun se estan yendo de una transicion anterior (previas)
  const previas: HTMLElement[] = [];
  for (const [nombre, el] of secciones) {
    if (nombre === destino) continue;
    el.removeAttribute('data-activa');
    if (animar && el === saliente) {
      el.inert = true;
      el.setAttribute('data-saliendo', '');
    } else if (animar && !el.hidden && el.hasAttribute('data-saliendo')) {
      el.inert = true;
      previas.push(el);
    } else {
      ocultar(el);
    }
  }

  actual = destino;
  html.dataset.vista = destino;
  html.removeAttribute('data-vista-inicial');

  // 3. Barra
  for (const a of enlacesBarra) {
    if (a.dataset.navVista === destino) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }

  // 4. Titulo del documento (historial y lectores de pantalla)
  const nombreVista = entrante.dataset.nombreVista;
  document.title = destino === 'inicio' || !nombreVista ? tituloBase : `${nombreVista} | ${tituloBase.split(' | ')[0]}`;

  // 5. Scroll: el documento nunca se desplaza; la vista entra arriba
  window.scrollTo(0, 0);
  const cuerpo = entrante.querySelector<HTMLElement>('[data-vista-cuerpo]');
  if (cuerpo && !elemento) cuerpo.scrollTop = 0;

  // 6. Foco: SIEMPRE antes de cualquier animacion
  if (foco) {
    if (elemento) elemento.focus();
    else tituloDe(entrante)?.focus({ preventScroll: true });
  }

  // 7. Aviso (carga diferida, animaciones)
  const detalle: DetalleVista = { vista: destino, anterior, indice: idxNuevo, direccion, inicial };
  window.dispatchEvent(new CustomEvent<DetalleVista>('hinojosa:vista', { detail: detalle }));

  // 8. Transicion opcional; al terminar se oculta el saliente
  if (animar && saliente && transicion) {
    let terminado = false;
    const cerrar = () => {
      if (terminado) return;
      terminado = true;
      // Si entretanto empezo otra transicion, esa se queda con estas vistas
      // (las recibe como `previas`) y las oculta al terminar; si fue un
      // cambio sin animar, ya las oculto. Nunca se oculta la activa.
      if (gen !== generacion) return;
      for (const el of [saliente, ...previas]) if (el.id !== actual) ocultar(el);
    };
    window.setTimeout(cerrar, TOPE_TRANSICION);
    try {
      Promise.resolve(transicion({ saliente, entrante, direccion: direccion as 1 | -1, previas })).then(cerrar, cerrar);
    } catch {
      cerrar();
    }
  }
}

function desdeHash(inicial = false) {
  const { vista, destino } = resolver(location.hash);
  // En el arranque sin hash no se roba el foco: el lector empieza arriba.
  const foco = !inicial || location.hash.length > 1;
  activar(vista, { inicial, foco, elemento: destino });
}

/** Navega a una vista cambiando el hash (queda en el historial). */
export function ir(nombre: Vista) {
  if (!esVista(nombre)) return;
  if (location.hash === `#${nombre}`) activar(nombre);
  else location.hash = nombre;
}

function irRelativo(delta: 1 | -1) {
  const i = actual ? VISTAS.indexOf(actual) : 0;
  const j = Math.min(VISTAS.length - 1, Math.max(0, i + delta));
  if (j !== i) ir(VISTAS[j]);
}

export const siguiente = () => irRelativo(1);
export const anterior = () => irRelativo(-1);
export const vistaActual = (): Vista | null => actual;

export function registrarTransicion(fn: Transicion | null) {
  transicion = fn;
}

export function alCambiarVista(cb: (d: DetalleVista) => void): () => void {
  const oyente = (ev: Event) => cb((ev as CustomEvent<DetalleVista>).detail);
  window.addEventListener('hinojosa:vista', oyente);
  return () => window.removeEventListener('hinojosa:vista', oyente);
}

/**
 * Ejecuta cb cada vez que se entra en `nombre` (o solo la primera con
 * unaVez). Si la vista ya esta activa al registrarse, se ejecuta enseguida:
 * asi un modulo que carga tarde no se pierde la activacion inicial.
 */
export function alEntrarEnVista(nombre: Vista, cb: (d: DetalleVista | null) => void, { unaVez = false } = {}) {
  let hecho = false;
  const quitar = alCambiarVista((d) => {
    if (d.vista !== nombre || (unaVez && hecho)) return;
    hecho = true;
    if (unaVez) quitar();
    cb(d);
  });
  if (actual === nombre) {
    hecho = true;
    if (unaVez) quitar();
    queueMicrotask(() => cb(null));
  }
}

// ---------------------------------------------------------------------
// Teclado
// ---------------------------------------------------------------------
// Excluidos: campos de texto (rompian el buscador), selects, contenido
// editable, [data-captura-flechas] y zonas que declaren sus teclas:
//   data-teclas-propias          -> reserva flechas y AvPag/RePag
//   data-teclas-propias="pagina" -> reserva solo AvPag/RePag (lista con scroll)
function teclasReservadas(objetivo: EventTarget | null, esPagina: boolean): boolean {
  const el = objetivo instanceof Element ? objetivo : null;
  if (!el) return false;
  // Regla 7 de vistas-hinojosa: campos de texto y [data-captura-flechas]
  // (carrusel de Productos, mapa) gestionan sus propias flechas.
  if (el.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-captura-flechas]')) return true;
  const zona = el.closest<HTMLElement>('[data-teclas-propias]');
  if (!zona) return false;
  return zona.dataset.teclasPropias === 'pagina' ? esPagina : true;
}

function alTeclear(ev: KeyboardEvent) {
  if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
  const avanza = ev.key === 'ArrowRight' || ev.key === 'PageDown';
  const retrocede = ev.key === 'ArrowLeft' || ev.key === 'PageUp';
  if (!avanza && !retrocede) return;
  if (teclasReservadas(ev.target, ev.key === 'PageDown' || ev.key === 'PageUp')) return;
  ev.preventDefault();
  irRelativo(avanza ? 1 : -1);
}

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------
function arrancar() {
  if (!secciones.size) return;
  html.dataset.router = 'activo';
  desdeHash(true);

  window.addEventListener('hashchange', () => desdeHash());
  window.addEventListener('keydown', alTeclear);

  // Pulsar el enlace de la vista que ya esta activa no cambia el hash:
  // devolver el foco a su titulo para que no parezca que no hizo nada.
  document.addEventListener('click', (ev) => {
    const a = (ev.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    if (a.hasAttribute('data-saltar-contenido')) {
      ev.preventDefault();
      if (actual) tituloDe(secciones.get(actual)!)?.focus({ preventScroll: true });
      return;
    }
    const nombre = a.getAttribute('href')!.slice(1);
    if (esVista(nombre) && nombre === actual) {
      ev.preventDefault();
      activar(nombre);
    }
  });

  window.hinojosaVistas = { VISTAS, ir, siguiente, anterior, vistaActual, registrarTransicion, alCambiarVista, alEntrarEnVista };
}

declare global {
  interface Window {
    hinojosaVistas?: {
      VISTAS: typeof VISTAS;
      ir: typeof ir;
      siguiente: typeof siguiente;
      anterior: typeof anterior;
      vistaActual: typeof vistaActual;
      registrarTransicion: typeof registrarTransicion;
      alCambiarVista: typeof alCambiarVista;
      alEntrarEnVista: typeof alEntrarEnVista;
    };
  }
  interface WindowEventMap {
    'hinojosa:vista': CustomEvent<DetalleVista>;
  }
}

arrancar();
