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
//   - Productos sin imagen (P5): el estado guarda el producto activo aunque
//     no este en el anillo (estado().producto, estado().sinImagen) y el
//     evento trae `imagenFrente` (su imagen o IMAGEN_GENERICA, el costal
//     generico). El carrusel decide como ponerlo al frente.
//   - Buscador (P1, P4; rediseno 2026-10-16): src/lib/busqueda.ts compara;
//     aqui se pinta. Combobox con hasta 6 sugerencias (elegir una gira el
//     carrusel, origen 'busqueda') y, por debajo, la lista completa filtrada
//     ("N de TOTAL" por grupo, atajos sin resultados) dentro del <dialog>
//     [data-dialogo-lista]. Escribir ya no gira el carrusel solo: solo al
//     elegir (o al llegar desde un animal de Nosotros, abrirAnimal()).
//   - Ficha del producto al frente (>= 48rem): pintarFicha(), con cada
//     seleccion.
//
// RECUENTOS (P4, decidido 2026-10-14): la pestana y la cabecera de grupo
// cuentan TODOS los productos de la categoria (lo mismo que la lista). El
// anillo solo tiene los que tienen foto, asi que cuando faltan fotos en la
// categoria el rotulo lo aclara: "4 de 12 con foto" (Mascotas: 16 en la
// pestana, 12 en el anillo). Si todos tienen foto: "4 de 9".
import { alCambiarVista, alEntrarEnVista } from './router';
import { indexar, prepararConsulta, buscar, type Indexado } from './busqueda';
import { movimientoPermitido } from './animacion/movimiento';

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
  /** Especies a las que sirve (perro, gato, ave, cerdo, vaca, cuy, conejo, tilapia). */
  animales: string[];
}

/** Costal generico para productos sin imagen (guia-estilo 7.3, P5). */
export const IMAGEN_GENERICA = '/img/productos/costal-generico.svg';
export interface CategoriaDatos {
  id: string;
  nombre: string;
  nombreCorto: string;
}
export type Origen = 'inicial' | 'pestana' | 'flechas' | 'teclado' | 'rejilla' | 'lista' | 'carrusel' | 'busqueda' | 'api';
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
  /** Producto activo completo (tambien si no tiene imagen). */
  producto: ProductoDatos;
  /** Imagen a mostrar al frente: la del producto o IMAGEN_GENERICA. */
  imagenFrente: string;
}

const raiz = document.getElementById('productos');
const datosEl = document.getElementById('datos-catalogo');
const datos = datosEl
  ? (JSON.parse(datosEl.textContent || '{}') as {
      categorias: CategoriaDatos[];
      productos: ProductoDatos[];
      sizesAnillo?: string;
      textos: Record<string, string>;
      tablaTilapia?: string;
    })
  : null;

const porId = new Map<string, ProductoDatos>();
const anillo = new Map<string, ProductoDatos[]>(); // categoria -> productos con imagen
const totalPorCategoria = new Map<string, number>(); // todos, con y sin imagen
let categoria = '';
let actualId = '';
/** Posicion del anillo que ocupa el frente (se conserva al elegir un producto sin foto, P5). */
let frenteAnillo = 0;
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
  return {
    categoria,
    id: actualId,
    /** Posicion 0-based en el anillo, o -1 (sin imagen). */
    indice: p ? lista.indexOf(p) : -1,
    /** Posicion del anillo al frente: el indice o, sin imagen, la que la tarjeta generica tapa (P5). */
    frente: frenteAnillo,
    /** Productos del anillo (con foto) de la categoria activa. */
    total: lista.length,
    /** Todos los productos de la categoria (lo que cuentan pestana y lista). */
    totalCategoria: totalPorCategoria.get(categoria) ?? lista.length,
    producto: p ?? null,
    sinImagen: p ? !p.imagen : false,
  };
}

/** Datos de un producto por id (hoja de detalle, carrusel). */
export const producto = (id: string): ProductoDatos | undefined => porId.get(id);

/** Si en la categoria hay productos fuera del anillo, la posicion dice "con foto". */
function textoPosicion(larga: boolean, indice: number, total: number, cat: string) {
  const conFoto = (totalPorCategoria.get(cat) ?? total) > total;
  const clave = larga ? (conFoto ? 'posicionLargaConFoto' : 'posicionLarga') : conFoto ? 'posicionConFoto' : 'posicion';
  const respaldo = larga ? 'Producto {i} de {n}' : '{i} de {n}';
  return plantilla(datos?.textos[clave] ?? respaldo, { i: indice + 1, n: total });
}

/** Atributo `sizes` de las tarjetas del anillo (VistaProductos.astro). */
export const sizesAnillo = (): string | undefined => datos?.sizesAnillo;

/** Productos del anillo de una categoria (con imagen, tope de 12), en orden. Solo lectura. */
export function productosDelAnillo(cat: string): readonly ProductoDatos[] {
  return anillo.get(cat) ?? [];
}

export function nombreCategoria(id: string) {
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
  // aria-current inmediato (accesibilidad). El resaltado VISUAL
  // (data-resaltada) lo pone resaltarFila(), al asentarse el anillo (C4).
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
  const sep = q('[data-rotulo-separador]');
  const precio = q('[data-rotulo-precio]');
  if (nombre) nombre.textContent = p.nombre;
  if (cat) cat.textContent = nombreCategoria(p.categoria);
  // Sin posicion (producto sin imagen): ni texto ni separador colgando (P5)
  if (pos) pos.textContent = indice >= 0 ? textoPosicion(false, indice, total, p.categoria) : '';
  if (sep) sep.hidden = indice < 0;
  if (precio) precio.textContent = p.precioTexto;
}

/** Ficha del producto al frente (>= 48rem). `dir` orienta el fundido. */
function pintarFicha(p: ProductoDatos, dir: number, animar: boolean) {
  const ficha = q('[data-ficha]');
  if (!ficha) return;
  const poner = (sel: string, texto: string) => {
    const el = q(sel, ficha);
    if (el) el.textContent = texto;
  };
  poner('[data-ficha-nombre]', p.nombre);
  poner('[data-ficha-precio]', p.precioTexto);
  poner('[data-ficha-marca]', p.marca ?? '');
  poner('[data-ficha-presentacion]', p.presentacion ?? '');
  poner('[data-ficha-categoria]', nombreCategoria(p.categoria));
  for (const fila of qa('[data-ficha-fila="marca"], [data-ficha-fila="presentacion"]', ficha)) {
    fila.hidden = !q('dd', fila)?.textContent;
  }
  for (const li of qa('[data-ficha-animal]', ficha)) li.hidden = !p.animales.includes(li.dataset.fichaAnimal!);
  const para = q('[data-ficha-para]', ficha);
  if (para) para.hidden = p.animales.length === 0;
  const tabla = q('[data-ficha-tabla]', ficha);
  if (tabla) tabla.hidden = p.id !== datos?.tablaTilapia;
  const cuerpo = q('[data-ficha-cuerpo]', ficha);
  if (cuerpo) cuerpo.scrollTop = 0;
  // Mismo gesto que el rotulo (C2), mas corto: entra desde el sentido del giro
  if (animar && movimientoPermitido() && ficha.offsetParent !== null) {
    const contenido = Array.from(ficha.children) as HTMLElement[];
    contenido.forEach((el, i) =>
      el.animate(
        [
          { opacity: 0, transform: `translateX(${dir * 12}px)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 220, delay: Math.min(i, 4) * 25, easing: 'cubic-bezier(0.25, 1, 0.5, 1)', fill: 'backwards' },
      ),
    );
  }
}

function anunciar(p: ProductoDatos) {
  const region = q('[data-carrusel-anuncio]');
  if (!region) return;
  const { indice, total } = estado();
  const posicion = indice >= 0 ? `. ${textoPosicion(true, indice, total, p.categoria)}` : '';
  const texto = `${p.nombre}${posicion}, ${nombreCategoria(p.categoria)}`;
  window.clearTimeout(temporizadorAnuncio);
  temporizadorAnuncio = window.setTimeout(() => {
    region.textContent = texto;
  }, 250);
}

/**
 * Resaltado visual de la fila (C4): fondo y barra de 4 px. Sin anillo 3D o
 * si el clic viene de la propia lista, en el acto; con el anillo, lo llama
 * carrusel.ts al asentarse el giro. La fila anterior lo pierde a la vez.
 */
export function resaltarFila(id: string = actualId) {
  for (const b of qa('[data-seleccionar-producto]')) {
    b.toggleAttribute('data-resaltada', b.dataset.seleccionarProducto === id);
  }
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
  if (nuevo >= 0) frenteAnillo = nuevo;
  else if (cambioCategoria) frenteAnillo = 0; // la tarjeta generica tapa el primero
  if (cambioCategoria) pintarPestanas();
  pintarSeleccion();
  // Con el anillo 3D montado, un giro (flechas, teclado, arrastre, celda)
  // desplaza la lista al ASENTARSE, no al empezar (storyboard-carrusel 6.4):
  // lo hace carrusel.ts al terminar el giro. Las pestanas, al grupo, ya.
  const esperaGiro = window.hinojosaCarrusel?.modo === '3d' && origen !== 'pestana' && origen !== 'api';
  if (origen !== 'lista' && origen !== 'inicial' && !esperaGiro) mostrarEnLista(id, origen === 'pestana');
  // C4: con el anillo 3D, el resaltado visual espera a que se asiente
  // (carrusel.ts); desde la lista o sin anillo, inmediato.
  if (window.hinojosaCarrusel?.modo !== '3d' || origen === 'lista' || origen === 'inicial') resaltarFila(id);
  if (anunciarCambio && origen !== 'inicial') anunciar(p);
  pintarFicha(p, pasos < 0 ? -1 : 1, origen !== 'inicial');

  const detalle: DetalleProducto = {
    id,
    categoria,
    indice: nuevo,
    total: lista.length,
    enCarrusel: nuevo >= 0,
    cambioCategoria,
    pasos,
    origen,
    producto: p,
    imagenFrente: p.imagen ?? IMAGEN_GENERICA,
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
  // Producto sin foto al frente (P5): se cuenta desde la posicion que tapa
  const i = lista.findIndex((x) => x.id === actualId);
  const base = i < 0 ? Math.min(frenteAnillo, lista.length - 1) : i;
  const j = (base + delta + lista.length) % lista.length;
  seleccionar(lista[j].id, { origen });
}
export const siguiente = (origen: Origen = 'api') => paso(1, origen);
export const anterior = (origen: Origen = 'api') => paso(-1, origen);

// ---------------------------------------------------------------------
// Buscador (P1, P4, P8)
// ---------------------------------------------------------------------
interface FilaIndexada extends Indexado {
  fila: HTMLElement;
  id: string;
}
let filas: FilaIndexada[] = [];
let temporizadorBusqueda = 0;

function indexarFilas() {
  filas = qa('[data-producto-fila]').map((fila) => {
    const id = fila.dataset.productoFila!;
    return { fila, id, ...indexar(fila.dataset.busqueda ?? '', porId.get(id)?.animales ?? []) };
  });
}

function textoConteo(n: number) {
  return n === 1 ? (datos?.textos.conteoUno ?? '1 producto') : plantilla(datos?.textos.conteo ?? '{n} productos', { n });
}
function textoResultados(n: number) {
  return n === 1
    ? (datos?.textos.resultadosUno ?? '1 producto encontrado')
    : plantilla(datos?.textos.resultados ?? '{n} productos encontrados', { n });
}

/** Ids de los resultados de la ultima busqueda, en el orden de la lista. */
let resultados: string[] = [];

function filtrar(texto: string) {
  const consulta = prepararConsulta(texto);
  const ok = buscar(consulta, filas);
  resultados = [];
  filas.forEach((f, i) => {
    const ve = ok.has(i);
    f.fila.hidden = !ve;
    if (ve) resultados.push(f.id);
  });
  const visibles = resultados.length;
  // Grupos: se ocultan si quedan vacios; la cabecera dice "N de TOTAL" al filtrar
  for (const g of qa('[data-grupo]')) {
    const enGrupo = qa('[data-producto-fila]', g);
    const n = enGrupo.filter((f) => !f.hidden).length;
    const total = enGrupo.length;
    g.hidden = n === 0;
    const conteo = q('[data-grupo-conteo]', g);
    if (conteo) {
      conteo.textContent =
        consulta && n < total ? plantilla(datos?.textos.conteoFiltrado ?? '{n} de {total}', { n, total }) : textoConteo(total);
    }
  }
  const vacio = q('[data-sin-resultados]');
  const termino = q('[data-termino-buscado]');
  if (vacio) vacio.hidden = visibles > 0;
  if (termino) termino.textContent = texto.trim();
  const borrar = q<HTMLButtonElement>('[data-borrar-busqueda]');
  if (borrar) borrar.hidden = texto.length === 0;

  // Cabecera de la lista completa: "Filtrado por «perro»" + Quitar filtro
  const filtro = q('[data-filtro-lista]');
  if (filtro) filtro.hidden = !consulta;
  const filtroTermino = q('[data-filtro-termino]');
  if (filtroTermino) filtroTermino.textContent = plantilla(datos?.textos.filtradoPor ?? '«{termino}»', { termino: texto.trim() });

  // "Ver los N" (o "Ver categorias" sin resultados): abre la lista filtrada
  const ver = q<HTMLButtonElement>('[data-ver-resultados]');
  if (ver) {
    ver.hidden = !consulta;
    ver.textContent =
      visibles === 0
        ? (datos?.textos.verCategorias ?? 'Ver categorías')
        : plantilla(datos?.textos.verResultados ?? 'Ver los {n}', { n: visibles });
  }

  pintarSugerencias(consulta ? resultados.slice(0, MAX_SUGERENCIAS) : [], visibles);

  // Aviso del resultado, con retardo para no hablar en cada tecla
  window.clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = window.setTimeout(() => {
    const region = q('[data-resultado-busqueda]');
    if (region) {
      region.textContent = !consulta ? '' : visibles === 0 ? (datos?.textos.sinResultados ?? '') : textoResultados(visibles);
    }
  }, 450);
}

// ---------------------------------------------------------------------
// Sugerencias (combobox, patron ARIA 1.2 con aria-activedescendant)
// ---------------------------------------------------------------------
const MAX_SUGERENCIAS = 6;
let activa = -1;

function opcionesSugerencia() {
  return qa('[data-sugerencias] [role="option"]');
}

function abrirSugerencias(abrir: boolean) {
  const lista = q('[data-sugerencias]');
  const input = q<HTMLInputElement>('[data-buscador]');
  const hay = opcionesSugerencia().length > 0;
  const abierta = abrir && hay;
  if (lista) lista.hidden = !abierta;
  input?.setAttribute('aria-expanded', String(abierta));
  if (!abierta) marcarActiva(-1);
}

function marcarActiva(i: number) {
  const ops = opcionesSugerencia();
  const input = q<HTMLInputElement>('[data-buscador]');
  activa = ops.length ? Math.max(-1, Math.min(i, ops.length - 1)) : -1;
  ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === activa)));
  if (activa >= 0) {
    input?.setAttribute('aria-activedescendant', ops[activa].id);
    ops[activa].scrollIntoView({ block: 'nearest' });
  } else {
    input?.removeAttribute('aria-activedescendant');
  }
}

function pintarSugerencias(ids: string[], total: number) {
  const lista = q('[data-sugerencias]');
  if (!lista) return;
  const items: HTMLElement[] = ids.map((id) => {
    const p = porId.get(id)!;
    const li = document.createElement('li');
    li.id = `sug-${id}`;
    li.className = 'prod-sug';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.sugId = id;
    const mini = document.createElement('span');
    mini.className = 'prod-sug-mini';
    mini.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = p.miniatura ?? IMAGEN_GENERICA;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    mini.append(img);
    const nombre = document.createElement('span');
    nombre.className = 'prod-sug-nombre';
    nombre.textContent = p.nombre;
    const meta = document.createElement('small');
    meta.textContent = [p.marca, nombreCategoria(p.categoria)].filter(Boolean).join(' · ');
    nombre.append(meta);
    const precio = document.createElement('span');
    precio.className = 'prod-sug-precio';
    precio.textContent = p.precioTexto;
    li.append(mini, nombre, precio);
    return li;
  });
  // Si hay mas de los que caben, ultima opcion: la lista completa filtrada
  if (total > ids.length && ids.length) {
    const li = document.createElement('li');
    li.id = 'sug-todos';
    li.className = 'prod-sug prod-sug-todos';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.sugTodos = '';
    li.textContent = plantilla(datos?.textos.verResultados ?? 'Ver los {n}', { n: total });
    items.push(li);
  }
  lista.replaceChildren(...items);
  const input = q<HTMLInputElement>('[data-buscador]');
  abrirSugerencias(document.activeElement === input && items.length > 0);
}

function elegirSugerencia(op: HTMLElement) {
  const input = q<HTMLInputElement>('[data-buscador]');
  abrirSugerencias(false);
  if (op.dataset.sugTodos !== undefined) return abrirLista(input);
  const id = op.dataset.sugId;
  if (id) seleccionar(id, { origen: 'busqueda' });
  input?.focus();
}

// ---------------------------------------------------------------------
// Lista completa en un <dialog> (data-dialogo-lista)
// ---------------------------------------------------------------------
let origenLista: HTMLElement | null = null;

export function abrirLista(desde: HTMLElement | null = null) {
  const d = q<HTMLDialogElement>('[data-dialogo-lista]');
  if (!d || d.open) return;
  origenLista = desde;
  d.showModal();
  q<HTMLElement>('#titulo-lista')?.focus();
  // Al abrir, la fila del producto al frente (o el primer resultado) a la vista
  requestAnimationFrame(() => {
    const lista = q('[data-lista-catalogo]');
    if (lista) lista.scrollTop = 0;
    mostrarEnLista(actualId);
  });
}

function cerrarLista(devolverFoco = true) {
  const d = q<HTMLDialogElement>('[data-dialogo-lista]');
  if (!d?.open) return;
  if (!devolverFoco) origenLista = null;
  d.close();
}

/** Vacia el buscador y muestra la lista completa. */
export function limpiarBusqueda() {
  const input = q<HTMLInputElement>('[data-buscador]');
  if (input) input.value = '';
  filtrar('');
}

// ---------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------
function arrancar() {
  if (!raiz || !datos) return;
  for (const p of datos.productos) {
    porId.set(p.id, p);
    totalPorCategoria.set(p.categoria, (totalPorCategoria.get(p.categoria) ?? 0) + 1);
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
    if (fila) {
      // Desde la lista completa: el producto pasa al frente y se cierra
      seleccionar(fila.dataset.seleccionarProducto!, { origen: 'lista' });
      return cerrarLista();
    }
    const abrir = el.closest<HTMLElement>('[data-abrir-lista], [data-ver-resultados]');
    if (abrir) return abrirLista(abrir);
    if (el.closest('[data-cerrar-lista]')) return cerrarLista();
    if (el.closest('[data-quitar-filtro]')) {
      limpiarBusqueda();
      q<HTMLElement>('#titulo-lista')?.focus();
      return;
    }
    const sug = el.closest<HTMLElement>('[data-sugerencias] [role="option"]');
    if (sug) return elegirSugerencia(sug);
    if (el.closest('[data-borrar-busqueda]')) {
      limpiarBusqueda();
      q<HTMLInputElement>('[data-buscador]')?.focus();
      return;
    }
    // Sin resultados: atajo a una categoria (limpia la busqueda, activa la
    // pestana y lleva el foco a la cabecera de ese grupo en la lista)
    const atajo = el.closest<HTMLElement>('[data-atajo-categoria]');
    if (atajo) {
      const cat = atajo.dataset.atajoCategoria!;
      limpiarBusqueda();
      if (cat !== categoria) seleccionarCategoria(cat, { origen: 'pestana' });
      else mostrarEnLista(actualId, true);
      q<HTMLElement>(`#grupo-${cat}`)?.focus();
      return;
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
  indexarFilas();
  const input = q<HTMLInputElement>('[data-buscador]');
  input?.addEventListener('input', () => filtrar(input.value));
  input?.addEventListener('keydown', (ev) => {
    const lista = q('[data-sugerencias]');
    const abierta = Boolean(lista && !lista.hidden);
    const n = opcionesSugerencia().length;
    if (ev.key === 'ArrowDown' && n) {
      ev.preventDefault();
      if (!abierta) abrirSugerencias(true);
      marcarActiva(activa + 1 >= n ? 0 : activa + 1);
    } else if (ev.key === 'ArrowUp' && n) {
      ev.preventDefault();
      if (!abierta) abrirSugerencias(true);
      marcarActiva(activa <= 0 ? n - 1 : activa - 1);
    } else if (ev.key === 'Enter') {
      const op = opcionesSugerencia()[activa] ?? (abierta ? opcionesSugerencia()[0] : undefined);
      if (op) {
        ev.preventDefault();
        elegirSugerencia(op);
      }
    } else if (ev.key === 'Escape') {
      // Primero cierra las sugerencias; un segundo Esc borra la busqueda
      if (abierta) {
        ev.preventDefault();
        abrirSugerencias(false);
      } else if (input.value) {
        ev.preventDefault();
        limpiarBusqueda();
      }
    }
  });
  input?.addEventListener('focus', () => {
    if (input.value) abrirSugerencias(true);
  });
  input?.addEventListener('blur', () => abrirSugerencias(false));
  // Pulsar una sugerencia no debe quitar el foco del campo antes del clic
  q('[data-sugerencias]')?.addEventListener('pointerdown', (ev) => ev.preventDefault());

  // Lista completa: al cerrarse (Esc, "Cerrar", fila elegida) el foco vuelve
  // a quien la abrio; el dialogo lleva data-captura-flechas
  const dialogo = q<HTMLDialogElement>('[data-dialogo-lista]');
  dialogo?.addEventListener('close', () => {
    if (origenLista?.isConnected) origenLista.focus();
    origenLista = null;
  });
  dialogo?.addEventListener('click', (ev) => {
    if (ev.target === dialogo) cerrarLista(); // telon
  });
  // Si se sale de Productos con la lista abierta (atras del navegador)
  window.addEventListener('hashchange', () => {
    if (dialogo?.open && location.hash !== '#productos') cerrarLista(false);
  });
  if (input?.value) filtrar(input.value); // valor restaurado por el navegador

  // Seleccion inicial: primer producto de la primera categoria
  const primera = datos.categorias[0]?.id;
  if (primera) {
    const p = anillo.get(primera)?.[0];
    if (p) seleccionar(p.id, { origen: 'inicial' });
  }

  window.hinojosaCatalogo = { seleccionar, seleccionarCategoria, siguiente, anterior, estado, producto, abrirLista };
}

declare global {
  interface Window {
    hinojosaCatalogo?: {
      seleccionar: typeof seleccionar;
      seleccionarCategoria: typeof seleccionarCategoria;
      siguiente: typeof siguiente;
      anterior: typeof anterior;
      estado: typeof estado;
      producto: typeof producto;
      abrirLista: typeof abrirLista;
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

// ---------------------------------------------------------------------
// Anclas que abren Productos con una categoria elegida (I3; decidido
// 2026-10-14). ESQUEMA, reutilizable desde cualquier vista:
//
//   <a href="#productos" data-abrir-categoria="granja">Granja</a>
//
// - El hash es SOLO el de la vista (#productos): el router no cambia, el
//   historial y "atras" funcionan igual y sin JS el enlace lleva a
//   Productos (con la primera categoria). No se usan "#productos?cat=...".
// - Con JS, este oyente (fase de captura, antes que el del router) elige
//   la pestana en catalogo.ts ANTES de que cambie el hash, asi Productos ya
//   entra con esa categoria; despues, con la vista visible, lleva la lista
//   al grupo. Si habia una busqueda escrita, se vacia (si no, podria
//   ocultar justo la categoria pedida).
// - Clic con modificadores o boton central: navegacion normal (pestana
//   nueva = Productos con la categoria por defecto).
// - Animales (vista Por que, Q4; 2026-10-14): el mismo patron con
//   <a href="#productos" data-abrir-animal="ave|cerdo|vaca|cuy|conejo|
//   perro|gato|tilapia">Aves</a> -> abrirAnimal(), mas abajo: rellena el
//   buscador con la palabra del enlace en lugar de elegir pestana.
// ---------------------------------------------------------------------
/** Deja elegida la categoria `cat` para cuando se entre en Productos. */
export function abrirCategoria(cat: string) {
  if (!datos?.categorias.some((c) => c.id === cat)) return false;
  if (q<HTMLInputElement>('[data-buscador]')?.value) limpiarBusqueda();
  const primero = anillo.get(cat)?.[0] ?? datos.productos.find((p) => p.categoria === cat);
  // Sin anuncio en la region viva: el router ya lleva el foco al h2 y el
  // lector lo anuncia; el producto se leeria encima.
  if (primero && cat !== categoria) seleccionar(primero.id, { origen: 'pestana', anunciarCambio: false });
  const quitar = alCambiarVista((d) => {
    quitar();
    if (d.vista === 'productos') requestAnimationFrame(() => mostrarEnLista(actualId, true));
  });
  return true;
}

/**
 * Deja Productos filtrado por un animal (Q4, vista Por que). Mismo patron
 * que abrirCategoria: corre ANTES del hashchange. Escribe en el buscador la
 * palabra visible del enlace ("Aves", "Tilapias"; el buscador ya entiende
 * plurales y la compara solo con el campo `animales`), filtra en el acto y
 * pone al frente el primer resultado, asi la vista entra ya filtrada y con
 * el carrusel en un producto de ese animal. La busqueda queda escrita y
 * con su boton de borrar: el visitante ve por que la lista es mas corta.
 */
export function abrirAnimal(clave: string, palabra = clave) {
  const input = q<HTMLInputElement>('[data-buscador]');
  if (!datos || !input || !datos.productos.some((p) => p.animales.includes(clave))) return false;
  input.value = palabra;
  filtrar(palabra);
  const primero = resultados[0];
  if (primero && primero !== actualId) seleccionar(primero, { origen: 'busqueda', anunciarCambio: false });
  const quitar = alCambiarVista((d) => {
    quitar();
    if (d.vista !== 'productos') return;
    requestAnimationFrame(() => {
      const lista = q('[data-lista-catalogo]');
      if (lista) lista.scrollTop = 0;
    });
  });
  return true;
}

document.addEventListener(
  'click',
  (ev) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    const objetivo = ev.target as Element | null;
    const a = objetivo?.closest?.<HTMLAnchorElement>('a[data-abrir-categoria]');
    if (a) return void abrirCategoria(a.dataset.abrirCategoria!);
    const an = objetivo?.closest?.<HTMLAnchorElement>('a[data-abrir-animal]');
    if (an) abrirAnimal(an.dataset.abrirAnimal!, an.textContent?.trim() || an.dataset.abrirAnimal!);
  },
  { capture: true },
);
