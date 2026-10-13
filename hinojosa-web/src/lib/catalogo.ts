// Vista Productos: estado de seleccion, pestanas de categoria, flechas,
// rejilla de respaldo, rotulo, region aria-live, buscador y sincronizacion
// en los dos sentidos con la lista.
//
// PUNTOS DE ENGANCHE (carrusel CSS 3D de animacion-interaccion):
//   - Datos: <script type="application/json" id="datos-catalogo"> con
//     { categorias: [...], productos: [...] } (ver VistaProductos.astro).
//   - Evento `hinojosa:producto` en window, detail: DetalleProducto.
//   - API: import { seleccionar, seleccionarCategoria, siguiente, anterior,
//     estado } from '../lib/catalogo'  (o window.hinojosaCatalogo).
//   - El carrusel se monta dentro de [data-carrusel-escena] y pone
//     data-modo="3d" en [data-carrusel] para ocultar la rejilla de respaldo
//     (CSS en VistaProductos). Al quitarlo, la rejilla vuelve.
//   - Arrastre / clic en un lateral del anillo: llamar seleccionar(id,
//     { origen: 'carrusel' }). Las flechas ya llaman siguiente()/anterior().
//   - Teclado: [data-carrusel] lleva data-captura-flechas; aqui ←/→ giran
//     y Inicio/Fin van al primero/ultimo. El router no cambia de vista.
import { alEntrarEnVista } from './router';

export interface ProductoDatos {
  id: string;
  categoria: string;
  nombre: string;
  marca: string | null;
  presentacion: string | null;
  precioTexto: string;
  imagen: string | null;
  avif: string | null;
  miniatura: string | null;
  /** srcset 400/800 px (WebP y AVIF), generado en el build (src/lib/srcset-producto.ts). */
  srcset: { webp: string; avif: string } | null;
  conFondo: boolean;
}
export interface CategoriaDatos {
  id: string;
  nombre: string;
  nombreCorto: string;
}
export type Origen = 'inicial' | 'pestana' | 'flechas' | 'teclado' | 'rejilla' | 'lista' | 'carrusel' | 'api';
export interface DetalleProducto {
  id: string;
  categoria: string;
  /** Posicion 0-based dentro del anillo (productos con imagen) o -1 si no esta en el. */
  indice: number;
  /** Productos del anillo en esa categoria. */
  total: number;
  enCarrusel: boolean;
  cambioCategoria: boolean;
  /** Pasos con signo por el camino mas corto (0 si cambia de categoria o no esta en el anillo). */
  pasos: number;
  origen: Origen;
}

const raiz = document.getElementById('productos');
const datosEl = document.getElementById('datos-catalogo');
const datos = datosEl
  ? (JSON.parse(datosEl.textContent || '{}') as {
      categorias: CategoriaDatos[];
      productos: ProductoDatos[];
      sizesAnillo?: string;
      textos: Record<string, string>;
    })
  : null;

const porId = new Map<string, ProductoDatos>();
const anillo = new Map<string, ProductoDatos[]>(); // categoria -> productos con imagen
let categoria = '';
let actualId = '';
let temporizadorAnuncio = 0;

const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

function q<T extends Element = HTMLElement>(sel: string, base: ParentNode | null = raiz): T | null {
  return base ? base.querySelector<T>(sel) : null;
}
function qa<T extends Element = HTMLElement>(sel: string, base: ParentNode | null = raiz): T[] {
  return base ? Array.from(base.querySelectorAll<T>(sel)) : [];
}

function plantilla(texto: string, v: Record<string, string | number>) {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));
}

export function estado() {
  const p = porId.get(actualId);
  const lista = anillo.get(categoria) ?? [];
  return { categoria, id: actualId, indice: p ? lista.indexOf(p) : -1, total: lista.length };
}

/** Atributo `sizes` de las tarjetas del anillo (VistaProductos.astro). */
export const sizesAnillo = (): string | undefined => datos?.sizesAnillo;

/** Productos del anillo de una categoria (con imagen, tope de 12), en orden. Solo lectura. */
export function productosDelAnillo(cat: string): readonly ProductoDatos[] {
  return anillo.get(cat) ?? [];
}

function nombreCategoria(id: string) {
  return datos?.categorias.find((c) => c.id === id)?.nombre ?? id;
}

// ---------------------------------------------------------------------
// Pintado
// ---------------------------------------------------------------------
function pintarPestanas() {
  for (const b of qa<HTMLButtonElement>('[data-categoria-boton]')) {
    b.setAttribute('aria-pressed', String(b.dataset.categoriaBoton === categoria));
  }
  const carrusel = q('[data-carrusel]');
  if (carrusel) {
    carrusel.dataset.categoriaActiva = categoria;
    carrusel.setAttribute('aria-label', `${datos?.textos.etiquetaCarrusel ?? 'Productos'}: ${nombreCategoria(categoria)}`);
  }
  for (const ul of qa('[data-rejilla-categoria]')) ul.hidden = ul.dataset.rejillaCategoria !== categoria;
}

function pintarSeleccion() {
  for (const b of qa('[data-rejilla-producto]')) {
    if (b.dataset.rejillaProducto === actualId) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  }
  for (const b of qa('[data-seleccionar-producto]')) {
    if (b.dataset.seleccionarProducto === actualId) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  }
  const p = porId.get(actualId);
  if (!p) return;
  const { indice, total } = estado();
  const nombre = q('[data-rotulo-nombre]');
  const cat = q('[data-rotulo-categoria]');
  const pos = q('[data-rotulo-posicion]');
  const precio = q('[data-rotulo-precio]');
  if (nombre) nombre.textContent = p.nombre;
  if (cat) cat.textContent = nombreCategoria(p.categoria);
  if (pos) pos.textContent = indice >= 0 ? plantilla(datos?.textos.posicion ?? '{i} de {n}', { i: indice + 1, n: total }) : '';
  if (precio) precio.textContent = p.precioTexto;
}

function anunciar(p: ProductoDatos) {
  const region = q('[data-carrusel-anuncio]');
  if (!region) return;
  const { indice, total } = estado();
  const posicion = indice >= 0 ? `. ${plantilla(datos?.textos.posicionLarga ?? 'Producto {i} de {n}', { i: indice + 1, n: total })}` : '';
  const texto = `${p.nombre}${posicion}, ${nombreCategoria(p.categoria)}`;
  window.clearTimeout(temporizadorAnuncio);
  temporizadorAnuncio = window.setTimeout(() => {
    region.textContent = texto;
  }, 250);
}

/** Desplaza la lista (y solo la lista) para que la fila quede a la vista. */
export function mostrarEnLista(id: string, alGrupo = false) {
  const lista = q('[data-lista-catalogo]');
  const fila = alGrupo ? q(`#lista-${porId.get(id)?.categoria}`) : q(`[data-producto-fila="${id}"]`);
  if (!lista || !fila || (fila as HTMLElement).hidden) return;
  // En movil la lista no tiene scroll propio (se desplaza la vista entera):
  // no se mueve nada, para no sacar el carrusel de la pantalla al girarlo.
  if (lista.scrollHeight <= lista.clientHeight + 1) return;
  const contenedor = lista;
  const rc = contenedor.getBoundingClientRect();
  const rf = fila.getBoundingClientRect();
  const cabecera = alGrupo ? 0 : 52; // cabecera de grupo pegajosa
  const comportamiento: ScrollBehavior = mqReducido.matches ? 'auto' : 'smooth';
  if (alGrupo) {
    contenedor.scrollBy({ top: rf.top - rc.top - cabecera, behavior: comportamiento });
  } else if (rf.top < rc.top + cabecera) {
    contenedor.scrollBy({ top: rf.top - rc.top - cabecera, behavior: comportamiento });
  } else if (rf.bottom > rc.bottom) {
    contenedor.scrollBy({ top: rf.bottom - rc.bottom, behavior: comportamiento });
  }
}

// ---------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------
export function seleccionar(id: string, { origen = 'api' as Origen, anunciarCambio = true } = {}) {
  const p = porId.get(id);
  if (!p) return;
  const cambioCategoria = p.categoria !== categoria;
  const lista = anillo.get(p.categoria) ?? [];
  const nuevo = lista.indexOf(p);
  const viejo = cambioCategoria ? -1 : lista.findIndex((x) => x.id === actualId);
  let pasos = 0;
  if (!cambioCategoria && nuevo >= 0 && viejo >= 0) {
    const n = lista.length;
    pasos = (((nuevo - viejo) % n) + n) % n;
    if (pasos > n / 2) pasos -= n;
  }
  categoria = p.categoria;
  actualId = id;
  if (cambioCategoria) pintarPestanas();
  pintarSeleccion();
  // Con el anillo 3D montado, un giro (flechas, teclado, arrastre, celda)
  // desplaza la lista al ASENTARSE, no al empezar (storyboard-carrusel 6.4):
  // lo hace carrusel.ts al terminar el giro. Las pestanas, al grupo, ya.
  const esperaGiro = window.hinojosaCarrusel?.modo === '3d' && origen !== 'pestana' && origen !== 'api';
  if (origen !== 'lista' && origen !== 'inicial' && !esperaGiro) mostrarEnLista(id, origen === 'pestana');
  if (anunciarCambio && origen !== 'inicial') anunciar(p);

  const detalle: DetalleProducto = {
    id,
    categoria,
    indice: nuevo,
    total: lista.length,
    enCarrusel: nuevo >= 0,
    cambioCategoria,
    pasos,
    origen,
  };
  window.dispatchEvent(new CustomEvent<DetalleProducto>('hinojosa:producto', { detail: detalle }));
}

export function seleccionarCategoria(cat: string, { origen = 'api' as Origen } = {}) {
  const primero = anillo.get(cat)?.[0] ?? datos?.productos.find((p) => p.categoria === cat);
  if (primero) seleccionar(primero.id, { origen });
}

function paso(delta: 1 | -1, origen: Origen) {
  const lista = anillo.get(categoria) ?? [];
  if (!lista.length) return;
  const i = lista.findIndex((x) => x.id === actualId);
  const j = i < 0 ? 0 : (i + delta + lista.length) % lista.length;
  seleccionar(lista[j].id, { origen });
}
export const siguiente = (origen: Origen = 'api') => paso(1, origen);
export const anterior = (origen: Origen = 'api') => paso(-1, origen);

// ---------------------------------------------------------------------
// Buscador
// ---------------------------------------------------------------------
const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

let temporizadorBusqueda = 0;
function filtrar(texto: string) {
  const t = normalizar(texto);
  const palabras = t.split(/\s+/).filter(Boolean);
  let visibles = 0;
  for (const fila of qa('[data-producto-fila]')) {
    const ok = !palabras.length || palabras.every((w) => (fila.dataset.busqueda ?? '').includes(w));
    fila.hidden = !ok;
    if (ok) visibles++;
  }
  for (const g of qa('[data-grupo]')) {
    g.hidden = !qa('[data-producto-fila]', g).some((f) => !f.hidden);
  }
  const vacio = q('[data-sin-resultados]');
  const termino = q('[data-termino-buscado]');
  if (vacio) vacio.hidden = visibles > 0;
  if (termino) termino.textContent = texto.trim();
  const borrar = q<HTMLButtonElement>('[data-borrar-busqueda]');
  if (borrar) borrar.hidden = texto.length === 0;

  // Aviso del resultado, con retardo para no hablar en cada tecla
  window.clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = window.setTimeout(() => {
    const region = q('[data-resultado-busqueda]');
    if (!region) return;
    region.textContent = !palabras.length
      ? ''
      : visibles === 0
        ? datos?.textos.sinResultados ?? ''
        : plantilla(datos?.textos.conteo ?? '{n} productos', { n: visibles });
  }, 450);
}

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------
function arrancar() {
  if (!raiz || !datos) return;
  for (const p of datos.productos) {
    porId.set(p.id, p);
    if (p.imagen) {
      const l = anillo.get(p.categoria) ?? [];
      if (l.length < 12) l.push(p); // tope duro de 12 en escena
      anillo.set(p.categoria, l);
    }
  }

  // Pestanas
  raiz.addEventListener('click', (ev) => {
    const el = ev.target as Element;
    const pestana = el.closest<HTMLButtonElement>('[data-categoria-boton]');
    if (pestana) {
      const cat = pestana.dataset.categoriaBoton!;
      if (cat !== categoria) seleccionarCategoria(cat, { origen: 'pestana' });
      else mostrarEnLista(actualId, true);
      return;
    }
    if (el.closest('[data-carrusel-anterior]')) return anterior('flechas');
    if (el.closest('[data-carrusel-siguiente]')) return siguiente('flechas');
    const celda = el.closest<HTMLElement>('[data-rejilla-producto]');
    if (celda) return seleccionar(celda.dataset.rejillaProducto!, { origen: 'rejilla' });
    const fila = el.closest<HTMLElement>('[data-seleccionar-producto]');
    if (fila) return seleccionar(fila.dataset.seleccionarProducto!, { origen: 'lista' });
    if (el.closest('[data-borrar-busqueda]')) {
      const input = q<HTMLInputElement>('[data-buscador]');
      if (input) {
        input.value = '';
        filtrar('');
        input.focus();
      }
    }
  });

  // Teclado dentro del carrusel (el router ignora las flechas aqui)
  q('[data-carrusel]')?.addEventListener('keydown', (ev) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const lista = anillo.get(categoria) ?? [];
    if (ev.key === 'ArrowRight') siguiente('teclado');
    else if (ev.key === 'ArrowLeft') anterior('teclado');
    else if (ev.key === 'Home' && lista[0]) seleccionar(lista[0].id, { origen: 'teclado' });
    else if (ev.key === 'End' && lista.length) seleccionar(lista[lista.length - 1].id, { origen: 'teclado' });
    else return;
    ev.preventDefault();
    // Si el foco estaba en una celda de la rejilla, que siga a la seleccion
    if ((ev.target as Element).closest('[data-rejilla-producto]')) {
      q<HTMLElement>(`[data-rejilla-producto="${actualId}"]`)?.focus();
    }
  });

  // Buscador
  const input = q<HTMLInputElement>('[data-buscador]');
  input?.addEventListener('input', () => filtrar(input.value));
  input?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && input.value) {
      ev.preventDefault();
      input.value = '';
      filtrar('');
    }
  });
  if (input?.value) filtrar(input.value); // valor restaurado por el navegador

  // Seleccion inicial: primer producto de la primera categoria
  const primera = datos.categorias[0]?.id;
  if (primera) {
    const p = anillo.get(primera)?.[0];
    if (p) seleccionar(p.id, { origen: 'inicial' });
  }

  window.hinojosaCatalogo = { seleccionar, seleccionarCategoria, siguiente, anterior, estado };
}

declare global {
  interface Window {
    hinojosaCatalogo?: {
      seleccionar: typeof seleccionar;
      seleccionarCategoria: typeof seleccionarCategoria;
      siguiente: typeof siguiente;
      anterior: typeof anterior;
      estado: typeof estado;
    };
  }
  interface WindowEventMap {
    'hinojosa:producto': CustomEvent<DetalleProducto>;
  }
}

arrancar();

// Las imagenes de la rejilla son loading="lazy" dentro de una vista oculta:
// no se descargan hasta entrar en Productos. Nada mas que diferir aqui.
alEntrarEnVista('productos', () => raiz?.setAttribute('data-catalogo-listo', ''), { unaVez: true });
