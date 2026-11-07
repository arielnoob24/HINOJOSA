// Panel de administracion de productos (bloque 29c y 29d, PLAN.md 0-E).
// Se carga con import() desde disparador.ts tras 4 clics en el logo.
//
// - Un <dialog> modal creado al vuelo (el resto de la pagina queda inert).
// - Habla con el Worker (config.ts): GET para leer, PUT para guardar. El
//   Worker comprueba la contrasena y valida todo; aqui solo hay avisos
//   amables antes de enviar. El guardado hace un commit y Pages republica
//   (~1 minuto).
// - Todo el texto del usuario se inserta con textContent (nunca innerHTML).
import css from './panel.css?inline';
import { API_PRODUCTOS } from './config';
import { ruta } from '../ruta';

type Producto = {
  id: string;
  categoria: string;
  animales: string[];
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  presentacion: string | null;
  precio: number | null;
  precioDesde: boolean;
  imagen: string | null;
  destacado: boolean;
  conFondo?: boolean;
};
type Categoria = { id: string; nombre: string; nombreCorto: string; orden: number };
/** Foto elegida en el panel, ya reducida (800 px de alto como maximo). */
type FotoNueva = {
  base64: string;
  ext: 'webp' | 'png'; // WebP si el navegador sabe codificarlo; si no, PNG
  vista: string; // URL temporal para la vista previa
  alfa: boolean; // false = trae fondo (se muestra sobre una placa blanca)
  kb: number;
};
type Fila = {
  clave: number;
  base: Producto | null; // como esta publicado (null = producto nuevo)
  foto: FotoNueva | null; // foto elegida y aun sin guardar
  vistaTemporal: string | null; // vista previa de la ultima foto guardada, mientras el sitio la publica
  nombre: string;
  descripcion: string;
  marca: string;
  presentacion: string;
  precioTxt: string;
  precioDesde: boolean;
  categoria: string;
  animales: string[];
  destacado: boolean;
  abierta: boolean;
};
type Respuesta = { estado: number; datos: any };

const ANIMALES: [string, string][] = [
  ['ave', 'Aves'],
  ['cerdo', 'Cerdos'],
  ['conejo', 'Conejos'],
  ['cuy', 'Cuyes'],
  ['gato', 'Gatos'],
  ['perro', 'Perros'],
  ['tilapia', 'Tilapias'],
  ['vaca', 'Vacas'],
];
const MAX_DESCRIPCION = 110;
const FOTO_ALTO_MAX = 800; // lo mismo que la version grande del sitio
const FOTO_ANCHO_MAX = 1200;
const FOTO_BYTES_MAX = 900_000; // el Worker rechaza mas que esto
const FOTOS_POR_GUARDADO = 4;

// ---------- decoracion: mismo fondo y marcas de agua que Productos ----------
// Copia de FondoHuellas.astro (mosaico de 240 px a escala 1,2) y de las hojas y
// huellas de HojaDetalle.astro, con los colores de la paleta fijos porque van
// como imagen de fondo (data URI). Decorativas: no entran al arbol de accesibilidad.
const PISADAS = `<g id="p"><ellipse cy="7" rx="11" ry="9"/><ellipse cx="-12" cy="-7" rx="4" ry="5.5"/><ellipse cx="-4.5" cy="-14" rx="4" ry="5.5"/><ellipse cx="4.5" cy="-14" rx="4" ry="5.5"/><ellipse cx="12" cy="-7" rx="4" ry="5.5"/></g><g id="g"><path d="M-8 9c-3-6 3-13 8-13s11 7 8 13c-2 4-5 1-8 1s-6 3-8-1z"/><circle cx="-9" cy="-6" r="3"/><circle cx="-3.5" cy="-11" r="3"/><circle cx="3.5" cy="-11" r="3"/><circle cx="9" cy="-6" r="3"/></g><g id="v"><path d="M-1.5-13C-9-13-12-2-11 5c1 6 6 8 9.5 7z"/><path d="M1.5-13C9-13 12-2 11 5c-1 6-6 8-9.5 7z"/></g><path id="a" d="M0 4V-16M0 4-12-8M0 4 12-8M0 4v8" fill="none" stroke="#f6f1e4" stroke-width="3.2" stroke-linecap="round"/><path id="h" d="M0 0C2-11 11-18 22-18 21-7 12 0 0 0z"/>`;
const TESELA =
  `<svg xmlns="http://www.w3.org/2000/svg" width="288" height="288" viewBox="0 0 240 240"><defs>${PISADAS}</defs>` +
  `<g fill="#f6f1e4" opacity=".55"><use href="#p" transform="translate(34 66) rotate(-24) scale(.85)"/><use href="#p" transform="translate(62 34) rotate(-14) scale(.85)"/><use href="#g" transform="translate(176 156) rotate(28)"/><use href="#g" transform="translate(204 130) rotate(18) scale(.9)"/><use href="#v" transform="translate(160 36) rotate(16)"/><use href="#v" transform="translate(112 214) rotate(-32) scale(.9)"/><use href="#a" transform="translate(104 118) rotate(12)"/><use href="#a" transform="translate(124 92) rotate(4) scale(.85)"/><use href="#a" transform="translate(222 214) rotate(-38) scale(.9)"/><use href="#p" transform="translate(30 196) rotate(36) scale(.7)"/></g>` +
  `<g fill="#7bbf3a" opacity=".34"><path d="M196 92c4-14 14-26 30-34M40 150c10-8 16-20 16-34" fill="none" stroke="#7bbf3a" stroke-width="2.2" stroke-linecap="round"/><use href="#h" transform="translate(204 76) rotate(-30)"/><use href="#h" transform="translate(212 70) rotate(150) scale(.8)"/><use href="#h" transform="translate(52 128) rotate(-75) scale(.9)"/><use href="#h" transform="translate(48 138) rotate(160) scale(.75)"/><use href="#h" transform="translate(92 176) rotate(-10) scale(.7)"/><use href="#h" transform="translate(6 18) rotate(40) scale(.8)"/><use href="#h" transform="translate(150 196) rotate(200) scale(.6)"/></g></svg>`;
const HOJAS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><g fill="none" stroke="#7bbf3a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M118 2C92 30 70 70 58 148"/><path d="M100 22c-20-4-38 6-46 24 20 6 40-4 46-24zM100 22L54 46"/><path d="M92 44c20-8 30-26 26-44-18 6-28 24-26 44zM92 44l26-44"/><path d="M78 70c-22-2-40 10-46 30 22 4 42-8 46-30zM78 70l-46 30"/><path d="M74 80c22-6 36-24 34-46-20 6-34 24-34 46zM74 80l34-46"/><path d="M64 114c-18-2-34 8-40 26 18 4 36-6 40-26zM64 114l-40 26"/></g></svg>`;
const HUELLAS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 80"><g fill="#e3cfa6"><g transform="translate(26 50) rotate(-14)"><ellipse cx="0" cy="8" rx="13" ry="11"/><ellipse cx="-14" cy="-9" rx="5" ry="6.5"/><ellipse cx="-5" cy="-17" rx="5" ry="6.5"/><ellipse cx="6" cy="-17" rx="5" ry="6.5"/><ellipse cx="15" cy="-8" rx="5" ry="6.5"/></g><g transform="translate(84 34) rotate(12) scale(0.9)"><ellipse cx="0" cy="8" rx="13" ry="11"/><ellipse cx="-14" cy="-9" rx="5" ry="6.5"/><ellipse cx="-5" cy="-17" rx="5" ry="6.5"/><ellipse cx="6" cy="-17" rx="5" ry="6.5"/><ellipse cx="15" cy="-8" rx="5" ry="6.5"/></g></g></svg>`;
const aUri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

let dialogo: HTMLDialogElement | null = null;
let cuerpo: HTMLElement;
let pie: HTMLElement;
let titulo: HTMLElement;
let devolverFoco: HTMLElement | null = null;

let clave = ''; // contrasena: solo en memoria, se pierde al recargar la pagina
let sha = '';
let categorias: Categoria[] = [];
let filas: Fila[] = [];
let quitados: Fila[] = [];
let siguienteClave = 1;
let busqueda = '';
let mensajeGuardado: { tipo: 'ok' | 'error'; titulo: string; lista?: string[] } | null = null;

// ---------- utilidades ----------
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...hijos: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? '' : v);
  }
  for (const hijo of hijos) if (hijo != null) el.append(hijo);
  return el;
}

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function slug(t: string): string {
  return normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

function nombreCategoria(id: string): string {
  return categorias.find((c) => c.id === id)?.nombreCorto ?? id;
}

/** "28", "28.5", "28,50" -> numero; "" -> null; otra cosa -> 'mal'. */
function leerPrecio(txt: string): number | null | 'mal' {
  const t = txt.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'mal';
  const n = Number(t);
  return n > 0 && n <= 9999.99 ? n : 'mal';
}

function nulo(t: string): string | null {
  const v = t.trim();
  return v === '' ? null : v;
}

function aFila(p: Producto): Fila {
  return {
    clave: siguienteClave++,
    base: p,
    foto: null,
    vistaTemporal: null,
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    marca: p.marca ?? '',
    presentacion: p.presentacion ?? '',
    precioTxt: p.precio === null ? '' : String(p.precio),
    precioDesde: p.precioDesde,
    categoria: p.categoria,
    animales: [...p.animales],
    destacado: p.destacado,
    abierta: false,
  };
}

/** Producto tal como quedaria al guardar (conserva imagen, conFondo y el orden de claves). */
function aProducto(f: Fila, id: string): Producto {
  const precio = leerPrecio(f.precioTxt);
  const num = precio === 'mal' ? null : precio;
  // Los animales que ya tenia conservan su orden (si no, un producto sin tocar
  // saldria "Cambiado" por una lista reordenada); los nuevos van al final.
  const previos = f.base ? f.base.animales : [];
  const editable = {
    categoria: f.categoria,
    animales: [
      ...previos.filter((a) => f.animales.includes(a)),
      ...ANIMALES.map(([a]) => a).filter((a) => f.animales.includes(a) && !previos.includes(a)),
    ],
    nombre: f.nombre.trim(),
    descripcion: nulo(f.descripcion),
    marca: nulo(f.marca),
    presentacion: nulo(f.presentacion),
    precio: num,
    precioDesde: num === null ? false : f.precioDesde,
    destacado: f.destacado,
  };
  let p: Producto;
  if (f.base) {
    p = { ...f.base, ...editable };
  } else {
    p = {
      id,
      categoria: editable.categoria,
      animales: editable.animales,
      nombre: editable.nombre,
      descripcion: editable.descripcion,
      marca: editable.marca,
      presentacion: editable.presentacion,
      precio: editable.precio,
      precioDesde: editable.precioDesde,
      imagen: null,
      destacado: editable.destacado,
    };
  }
  if (f.foto) {
    p.imagen = rutaImagen(f, id);
    // Foto con fondo de estudio: el sitio la muestra sobre una placa blanca
    if (f.foto.alfa) delete p.conFondo;
    else p.conFondo = true;
  }
  return p;
}

/** Donde queda la foto en el sitio. Si el producto ya tenia una .webp, se reemplaza esa. */
function rutaImagen(f: Fila, id: string): string {
  const actual = f.base?.imagen;
  return actual && actual.endsWith('.webp') ? actual : `/img/productos/${f.categoria}/${id}.webp`;
}

/** Donde guarda el Worker el original que subimos (lo procesa el despliegue). */
function rutaSubida(f: Fila, id: string): string {
  const relativa = rutaImagen(f, id).replace('/img/productos/', '').replace(/\.webp$/, '');
  return `hinojosa-web/imagenes-nuevas/${relativa}.${f.foto!.ext}`;
}

function cambiada(f: Fila): boolean {
  if (!f.base) return true;
  if (f.foto) return true;
  return JSON.stringify(aProducto(f, f.base.id)) !== JSON.stringify(f.base);
}

function hayCambios(): boolean {
  return quitados.length > 0 || filas.some(cambiada);
}

function contarCambios(): number {
  return filas.filter(cambiada).length + quitados.length;
}

function idNuevo(f: Fila, usados: Set<string>): string {
  const baseId = slug(f.nombre) || 'producto';
  let id = baseId;
  for (let n = 2; usados.has(id); n++) id = `${baseId}-${n}`;
  return id;
}

// ---------- red ----------
async function api(metodo: 'GET' | 'PUT', datos?: unknown): Promise<Respuesta> {
  try {
    const r = await fetch(API_PRODUCTOS, {
      method: metodo,
      headers: {
        'X-Admin-Password': clave,
        ...(datos ? { 'Content-Type': 'application/json' } : {}),
      },
      body: datos ? JSON.stringify(datos) : undefined,
    });
    let cuerpoJson: any = null;
    try {
      cuerpoJson = await r.json();
    } catch {
      /* respuesta sin JSON */
    }
    return { estado: r.status, datos: cuerpoJson };
  } catch {
    return { estado: 0, datos: null };
  }
}

function textoError(r: Respuesta): string {
  switch (r.estado) {
    case 0:
      return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
    case 401:
      return 'La contraseña no es correcta.';
    case 429:
      return 'Demasiados intentos. Espera unos minutos antes de volver a probar.';
    case 500:
      return 'El servidor no está listo. Avisa a quien administra el sitio.';
    default:
      return r.datos?.error ?? 'Algo salió mal. Inténtalo de nuevo.';
  }
}

// ---------- estructura del dialogo ----------
function crearDialogo(): HTMLDialogElement {
  const estilo = h('style');
  estilo.textContent = css;
  document.head.append(estilo);

  titulo = h('h2', { class: 'adm-titulo', id: 'adm-titulo', tabindex: '-1' }, 'Panel de administración');
  const cerrar = h('button', { type: 'button', class: 'adm-boton adm-cerrar' }, 'Cerrar');
  cerrar.addEventListener('click', pedirCierre);
  cuerpo = h('div', { class: 'adm-cuerpo' });
  pie = h('div', { class: 'adm-pie', hidden: true });

  const d = h(
    'dialog',
    { class: 'adm', 'aria-labelledby': 'adm-titulo', 'data-captura-flechas': true },
    h('div', { class: 'adm-cabecera' }, titulo, cerrar),
    cuerpo,
    pie,
  );
  d.style.setProperty('--adm-fondo', aUri(TESELA));
  d.style.setProperty('--adm-hojas', aUri(HOJAS));
  d.style.setProperty('--adm-huellas', aUri(HUELLAS));
  // Esc: pasa por pedirCierre para no perder cambios sin avisar
  d.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    pedirCierre();
  });
  d.addEventListener('close', () => devolverFoco?.focus?.());
  document.body.append(d);
  return d;
}

function cerrarYa() {
  if (dialogo?.open) dialogo.close();
}

function pedirCierre() {
  if (!hayCambios()) return cerrarYa();
  pie.hidden = false;
  pie.replaceChildren(
    h('p', { class: 'adm-pie-texto', role: 'alert' }, 'Tienes cambios sin guardar. Si cierras ahora, se pierden.'),
    h('div', { class: 'adm-pie-acciones' }, boton('Seguir editando', () => pintarPie()), boton('Cerrar sin guardar', cerrarYa)),
  );
  (pie.querySelector('button') as HTMLElement | null)?.focus();
}

function boton(texto: string, alClic: () => void, primario = false): HTMLButtonElement {
  const b = h('button', { type: 'button', class: primario ? 'adm-boton adm-boton-primario' : 'adm-boton' }, texto);
  b.addEventListener('click', alClic);
  return b;
}

// ---------- pantalla 1: contrasena ----------
function pintarEntrada(error = '') {
  titulo.textContent = 'Panel de administración';
  pie.hidden = true;
  const input = h('input', {
    type: 'password',
    id: 'adm-clave',
    autocomplete: 'current-password',
    required: true,
    'aria-describedby': error ? 'adm-error-entrada' : undefined,
  });
  const enviar = h('button', { type: 'submit', class: 'adm-boton adm-boton-primario' }, 'Entrar');
  const form = h(
    'form',
    { class: 'adm-entrada', novalidate: true },
    h('p', {}, 'Escribe la contraseña de administrador para editar los productos.'),
    error ? h('p', { class: 'adm-aviso', role: 'alert', id: 'adm-error-entrada' }, h('strong', {}, 'No se pudo entrar. '), error) : null,
    h('label', { class: 'adm-campo', for: 'adm-clave' }, h('span', {}, 'Contraseña'), input),
    enviar,
  );
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!input.value) return input.focus();
    enviar.disabled = true;
    enviar.textContent = 'Entrando…';
    clave = input.value;
    const r = await api('GET');
    if (r.estado === 200 && r.datos?.productos) return cargarDatos(r.datos);
    clave = '';
    pintarEntrada(textoError(r));
  });
  cuerpo.replaceChildren(form);
  input.focus();
}

function cargarDatos(datos: { sha: string; categorias: Categoria[]; productos: Producto[] }) {
  sha = datos.sha;
  categorias = datos.categorias.slice().sort((a, b) => a.orden - b.orden);
  filas = datos.productos.map(aFila);
  quitados = [];
  busqueda = '';
  pintarLista();
}

// ---------- pantalla 2: lista ----------
function pintarLista() {
  titulo.textContent = 'Productos';
  const buscador = h('input', { type: 'search', id: 'adm-buscar', placeholder: 'Nombre o marca', autocomplete: 'off' });
  buscador.value = busqueda;
  buscador.addEventListener('input', () => {
    busqueda = buscador.value;
    filtrar();
  });
  const agregar = boton('Agregar producto', () => {
    const f: Fila = {
      clave: siguienteClave++,
      base: null,
      foto: null,
      vistaTemporal: null,
      nombre: '',
      descripcion: '',
      marca: '',
      presentacion: '',
      precioTxt: '',
      precioDesde: false,
      categoria: categorias[0]?.id ?? '',
      animales: [],
      destacado: false,
      abierta: true,
    };
    filas.unshift(f);
    busqueda = '';
    pintarLista();
    (cuerpo.querySelector(`[data-clave="${f.clave}"] input[data-campo="nombre"]`) as HTMLElement | null)?.focus();
  });

  const lista = h('ul', { class: 'adm-lista', id: 'adm-lista' });
  for (const f of filas) lista.append(filaDOM(f));
  const vacio = h('p', { class: 'adm-vacio', id: 'adm-vacio', hidden: true, role: 'status' }, 'Ningún producto coincide con la búsqueda.');

  cuerpo.replaceChildren(
    ...(mensajeGuardado ? [avisoGuardado()] : []),
    h(
      'div',
      { class: 'adm-herramientas' },
      h('label', { class: 'adm-campo', for: 'adm-buscar' }, h('span', {}, 'Buscar un producto'), buscador),
      agregar,
    ),
    lista,
    vacio,
  );
  filtrar();
  pintarPie();
}

function avisoGuardado(): Node {
  const m = mensajeGuardado!;
  const caja = h(
    'div',
    { class: m.tipo === 'ok' ? 'adm-aviso adm-ok' : 'adm-aviso', role: m.tipo === 'ok' ? 'status' : 'alert', id: 'adm-aviso' },
    h('strong', {}, m.titulo),
  );
  if (m.lista?.length) {
    const ul = h('ul');
    for (const e of m.lista) ul.append(h('li', {}, e));
    caja.append(ul);
  }
  return caja;
}

function filtrar() {
  const q = normalizar(busqueda.trim());
  let visibles = 0;
  for (const f of filas) {
    const li = cuerpo.querySelector<HTMLElement>(`[data-clave="${f.clave}"]`);
    if (!li) continue;
    const texto = normalizar(`${f.nombre} ${f.marca} ${f.base?.nombre ?? ''}`);
    const ok = !q || texto.includes(q) || !f.base;
    li.hidden = !ok;
    if (ok) visibles++;
  }
  const vacio = cuerpo.querySelector<HTMLElement>('#adm-vacio');
  if (vacio) vacio.hidden = visibles > 0;
}

function campoTexto(f: Fila, etiqueta: string, campo: keyof Fila, opciones: { max?: number; ancho?: boolean; area?: boolean } = {}): HTMLElement {
  const id = `adm-${campo}-${f.clave}`;
  const control = opciones.area
    ? h('textarea', { id, 'data-campo': String(campo), rows: '2', maxlength: opciones.max ? String(opciones.max) : undefined })
    : h('input', { type: 'text', id, 'data-campo': String(campo), maxlength: opciones.max ? String(opciones.max) : undefined });
  control.value = String(f[campo] ?? '');
  const contador = opciones.max ? h('small', { class: 'adm-contador', 'aria-hidden': 'true' }) : null;
  const pintarContador = () => {
    if (contador) contador.textContent = ` ${control.value.length}/${opciones.max}`;
  };
  pintarContador();
  control.addEventListener('input', () => {
    (f[campo] as string) = control.value;
    pintarContador();
    refrescarFila(f);
  });
  return h(
    'label',
    { class: opciones.ancho ? 'adm-campo adm-ancho' : 'adm-campo', for: id },
    h('span', {}, etiqueta, contador),
    control,
  );
}

function filaDOM(f: Fila): HTMLElement {
  const li = h('li', { class: 'adm-fila', 'data-clave': String(f.clave) });

  // Cabecera: miniatura, nombre, precio (chip dorado) y "Editar mas"
  const precio = h('input', { type: 'text', inputmode: 'decimal', id: `adm-precio-${f.clave}`, autocomplete: 'off', placeholder: 'Sin precio' });
  precio.value = f.precioTxt;
  precio.addEventListener('input', () => {
    f.precioTxt = precio.value;
    refrescarFila(f);
  });
  const mas = h('button', { type: 'button', class: 'adm-boton adm-mas', 'aria-expanded': String(f.abierta), 'aria-controls': `adm-mas-${f.clave}` });
  const detalle = h('div', { class: 'adm-fila-mas', id: `adm-mas-${f.clave}`, hidden: !f.abierta });
  const rotuloMas = () => {
    mas.textContent = f.abierta ? 'Ocultar' : 'Editar más';
    mas.setAttribute('aria-expanded', String(f.abierta));
    detalle.hidden = !f.abierta;
  };
  rotuloMas();
  mas.addEventListener('click', () => {
    f.abierta = !f.abierta;
    rotuloMas();
  });

  li.append(
    h(
      'div',
      { class: 'adm-fila-cabecera' },
      h('div', { class: 'adm-miniatura', 'data-miniatura': '', 'aria-hidden': 'true' }),
      h('div', { class: 'adm-fila-nombre' }, h('strong', { 'data-rotulo': '' }), h('span', { class: 'adm-fila-cat', 'data-cat': '' })),
      h(
        'label',
        { class: 'adm-campo adm-precio', for: `adm-precio-${f.clave}` },
        h('span', {}, 'Precio (USD)'),
        h('span', { class: 'adm-chip-precio' }, '$', precio),
      ),
      mas,
    ),
    detalle,
  );

  // Detalle
  detalle.append(
    bloqueFoto(f),
    campoTexto(f, 'Nombre', 'nombre', { max: 80, ancho: true }),
    campoTexto(f, 'Descripción (la que sale en la tarjeta)', 'descripcion', { max: MAX_DESCRIPCION, ancho: true, area: true }),
    campoTexto(f, 'Marca', 'marca', { max: 40 }),
    campoTexto(f, 'Presentación', 'presentacion', { max: 80 }),
  );
  const sel = h('select', { id: `adm-cat-${f.clave}` });
  for (const c of categorias) sel.append(h('option', { value: c.id }, c.nombre));
  sel.value = f.categoria;
  sel.addEventListener('change', () => {
    f.categoria = sel.value;
    refrescarFila(f);
  });
  detalle.append(h('label', { class: 'adm-campo', for: `adm-cat-${f.clave}` }, h('span', {}, 'Categoría'), sel));

  const desde = marca(f.precioDesde, 'El precio es «desde» (varía según el tamaño)', (v) => {
    f.precioDesde = v;
    refrescarFila(f);
  });
  const destacado = marca(f.destacado, 'Producto destacado', (v) => {
    f.destacado = v;
    refrescarFila(f);
  });
  detalle.append(h('div', {}, desde, destacado));

  const grupo = h('fieldset', { class: 'adm-grupo adm-ancho' }, h('legend', {}, 'Para qué animales es'));
  const opciones = h('div', { class: 'adm-grupo-opciones' });
  for (const [valor, etiqueta] of ANIMALES) {
    opciones.append(
      pastilla(f.animales.includes(valor), etiqueta, (v) => {
        f.animales = v ? [...f.animales, valor] : f.animales.filter((a) => a !== valor);
        refrescarFila(f);
      }),
    );
  }
  grupo.append(opciones);
  detalle.append(grupo);

  // Quitar, con confirmacion dentro del panel (sin ventanas del navegador)
  const zonaQuitar = h('div', { class: 'adm-ancho' });
  const pintarQuitar = (confirmando: boolean) => {
    zonaQuitar.replaceChildren();
    if (!confirmando) {
      zonaQuitar.append(boton('Quitar este producto', () => pintarQuitar(true)));
      return;
    }
    zonaQuitar.append(
      h('p', { class: 'adm-aviso', role: 'alert' }, h('strong', {}, '¿Quitar «'), f.nombre.trim() || 'producto nuevo', h('strong', {}, '» de la tienda? '), 'Se publica al guardar.'),
      boton('Sí, quitar', () => quitar(f), true),
      document.createTextNode(' '),
      boton('No, dejarlo', () => pintarQuitar(false)),
    );
    (zonaQuitar.querySelector('button') as HTMLElement | null)?.focus();
  };
  pintarQuitar(false);
  detalle.append(zonaQuitar);

  refrescarFila(f, li);
  return li;
}

/** Casilla en forma de pastilla (animales): se pinta de bosque al marcarla. */
function pastilla(valor: boolean, texto: string, alCambiar: (v: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox' });
  input.checked = valor;
  input.addEventListener('change', () => alCambiar(input.checked));
  return h('label', { class: 'adm-pastilla' }, input, h('span', {}, texto));
}

// ---------- foto del producto ----------
function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).split(',')[1] ?? '');
    lector.onerror = () => rechazar(new Error('No se pudo leer la foto.'));
    lector.readAsDataURL(blob);
  });
}

/**
 * Reduce la foto en el navegador (800 px de alto como maximo, igual que la
 * version grande del sitio) y la codifica en WebP. Asi sube liviana: 30-150 KB
 * en vez de varios MB. Las 6 versiones finales las genera el despliegue.
 */
async function prepararFoto(archivo: File): Promise<FotoNueva> {
  if (archivo.size > 25 * 1024 * 1024) throw new Error('La foto pesa demasiado (máximo 25 MB).');
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(archivo);
  } catch {
    throw new Error('No se pudo leer esa imagen. Usa un archivo PNG, WebP o JPG.');
  }
  const escala = Math.min(1, FOTO_ALTO_MAX / bmp.height, FOTO_ANCHO_MAX / bmp.width);
  const ancho = Math.max(1, Math.round(bmp.width * escala));
  const alto = Math.max(1, Math.round(bmp.height * escala));
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Tu navegador no puede preparar la foto.');
  ctx.drawImage(bmp, 0, 0, ancho, alto);
  bmp.close?.();

  // ¿Tiene transparencia? (se revisa un pixel de cada cuatro)
  const px = ctx.getImageData(0, 0, ancho, alto).data;
  let alfa = false;
  for (let i = 3; i < px.length; i += 16) {
    if (px[i] < 250) {
      alfa = true;
      break;
    }
  }

  let blob: Blob | null = null;
  for (const calidad of [0.92, 0.85, 0.75, 0.6]) {
    blob = await new Promise<Blob | null>((res) => lienzo.toBlob(res, 'image/webp', calidad));
    // Si el navegador no sabe WebP, devuelve PNG: se sube como PNG, sin reintentar
    if (!blob || blob.type !== 'image/webp' || blob.size <= FOTO_BYTES_MAX) break;
  }
  if (!blob) throw new Error('No se pudo preparar la foto. Prueba con otra imagen.');
  if (blob.size > FOTO_BYTES_MAX) {
    throw new Error('La foto sigue pesando demasiado. Prueba con una imagen más pequeña o con menos detalle.');
  }
  return {
    base64: await blobABase64(blob),
    ext: blob.type === 'image/webp' ? 'webp' : 'png',
    vista: URL.createObjectURL(blob),
    alfa,
    kb: Math.max(1, Math.round(blob.size / 1024)),
  };
}

const COSTAL = () => ruta('/img/productos/costal-generico.svg');

/** Pinta una imagen con respaldo al costal generico (la foto recien guardada tarda ~1 min en publicarse). */
function imagenConRespaldo(src: string, ancho: number, alto: number): HTMLImageElement {
  const img = h('img', { src, alt: '', width: String(ancho), height: String(alto), decoding: 'async' });
  img.addEventListener(
    'error',
    () => {
      if (!img.src.endsWith('costal-generico.svg')) img.src = COSTAL();
    },
    { once: true },
  );
  return img;
}

function pintarMiniatura(f: Fila, caja: HTMLElement) {
  let src = COSTAL();
  let placa = false;
  if (f.foto) {
    src = f.foto.vista;
    placa = !f.foto.alfa;
  } else if (f.vistaTemporal) {
    src = f.vistaTemporal;
    placa = !!f.base?.conFondo;
  } else if (f.base?.imagen) {
    src = ruta(f.base.imagen.replace(/\.webp$/, '-thumb.webp'));
    placa = !!f.base.conFondo;
  }
  caja.toggleAttribute('data-placa', placa);
  caja.replaceChildren(imagenConRespaldo(src, 64, 80));
}

function bloqueFoto(f: Fila): HTMLElement {
  const vista = h('div', { class: 'adm-foto-vista', 'aria-hidden': 'true' });
  const estado = h('p', { role: 'status' });
  const archivo = h('input', {
    type: 'file',
    accept: 'image/png,image/webp,image/jpeg',
    hidden: true,
    id: `adm-foto-${f.clave}`,
    'aria-label': 'Elegir la foto del producto',
  });
  const elegir = boton('', () => archivo.click());
  const quitarFoto = boton('Quitar la foto nueva', () => {
    if (f.foto) URL.revokeObjectURL(f.foto.vista);
    f.foto = null;
    pintar();
    refrescarFila(f);
  });

  const pintar = () => {
    const nueva = f.foto;
    vista.toggleAttribute('data-placa', nueva ? !nueva.alfa : !!f.base?.conFondo);
    let src = COSTAL();
    if (nueva) src = nueva.vista;
    else if (f.vistaTemporal) src = f.vistaTemporal;
    else if (f.base?.imagen) src = ruta(f.base.imagen.replace(/\.webp$/, '-thumb.webp'));
    vista.replaceChildren(imagenConRespaldo(src, 112, 144));
    elegir.textContent = nueva ? 'Elegir otra foto' : f.base?.imagen ? 'Cambiar la foto' : 'Elegir una foto';
    quitarFoto.hidden = !nueva;
    if (!nueva) {
      estado.textContent = f.base?.imagen
        ? 'Esta es la foto actual. Si eliges otra, la reemplaza al guardar.'
        : 'Este producto no tiene foto: se ve con un costal genérico.';
    } else if (nueva.alfa) {
      estado.textContent = `Foto lista (${nueva.kb} KB), con fondo transparente. Se sube al guardar.`;
    } else {
      estado.textContent = `Foto lista (${nueva.kb} KB). Tiene fondo, así que se mostrará sobre una placa blanca. Se ve mejor con un PNG de fondo transparente.`;
    }
  };

  archivo.addEventListener('change', async () => {
    const elegido = archivo.files?.[0];
    archivo.value = '';
    if (!elegido) return;
    estado.textContent = 'Preparando la foto…';
    elegir.disabled = true;
    try {
      const nueva = await prepararFoto(elegido);
      if (f.foto) URL.revokeObjectURL(f.foto.vista);
      f.foto = nueva;
      pintar();
      refrescarFila(f);
    } catch (e) {
      pintar();
      estado.textContent = (e as Error).message;
    } finally {
      elegir.disabled = false;
    }
  });

  pintar();
  return h(
    'div',
    { class: 'adm-ancho' },
    h('p', { class: 'adm-foto-titulo' }, 'Foto del producto'),
    h(
      'div',
      { class: 'adm-foto' },
      vista,
      h(
        'div',
        { class: 'adm-foto-info' },
        estado,
        h('p', { class: 'adm-foto-nota' }, 'Lo ideal: un PNG con el fondo transparente y el producto de frente.'),
        h('div', { class: 'adm-foto-acciones' }, elegir, quitarFoto),
        archivo,
      ),
    ),
  );
}

function marca(valor: boolean, texto: string, alCambiar: (v: boolean) => void): HTMLElement {
  const input = h('input', { type: 'checkbox' });
  input.checked = valor;
  input.addEventListener('change', () => alCambiar(input.checked));
  return h('label', { class: 'adm-marca' }, input, h('span', {}, texto));
}

function refrescarFila(f: Fila, li?: HTMLElement) {
  const el = li ?? cuerpo.querySelector<HTMLElement>(`[data-clave="${f.clave}"]`);
  if (!el) return;
  const cambio = cambiada(f);
  el.toggleAttribute('data-cambiado', cambio && !!f.base);
  el.toggleAttribute('data-nuevo', !f.base);
  const rotulo = el.querySelector<HTMLElement>('[data-rotulo]');
  if (rotulo) {
    rotulo.textContent = f.nombre.trim() || 'Producto nuevo';
    rotulo.querySelector('.adm-insignia')?.remove();
    if (!f.base) rotulo.append(h('span', { class: 'adm-insignia' }, 'Nuevo'));
    else if (cambio) rotulo.append(h('span', { class: 'adm-insignia' }, 'Cambiado'));
  }
  const cat = el.querySelector<HTMLElement>('[data-cat]');
  if (cat) cat.textContent = nombreCategoria(f.categoria);
  // La miniatura solo se vuelve a pintar si cambio la foto (no en cada tecla)
  const mini = el.querySelector<HTMLElement>('[data-miniatura]');
  const marcaFoto = f.foto?.vista ?? 'base';
  if (mini && mini.dataset.foto !== marcaFoto) {
    mini.dataset.foto = marcaFoto;
    pintarMiniatura(f, mini);
  }
  pintarPie(true);
}

function quitar(f: Fila) {
  filas = filas.filter((x) => x !== f);
  if (f.base) quitados.push(f);
  mensajeGuardado = null;
  pintarLista();
}

// ---------- guardar ----------
function revisar(): string[] {
  const errores: string[] = [];
  for (const f of filas) {
    const nombre = f.nombre.trim() || 'Producto nuevo';
    if (!f.nombre.trim()) errores.push(`«${nombre}»: falta el nombre.`);
    if (leerPrecio(f.precioTxt) === 'mal') {
      errores.push(`«${nombre}»: el precio debe ser un número mayor que 0, con hasta 2 decimales (por ejemplo 28 o 28.50), o dejarlo vacío.`);
    }
    if (f.descripcion.length > MAX_DESCRIPCION) errores.push(`«${nombre}»: la descripción es demasiado larga.`);
  }
  const conFoto = filas.filter((f) => f.foto).length;
  if (conFoto > FOTOS_POR_GUARDADO) {
    errores.push(`Hay ${conFoto} fotos nuevas y solo caben ${FOTOS_POR_GUARDADO} por guardado. Guarda y sigue con las demás.`);
  }
  return errores;
}

async function guardar() {
  const errores = revisar();
  if (errores.length) {
    mensajeGuardado = { tipo: 'error', titulo: 'Corrige esto antes de guardar:', lista: errores };
    return pintarLista();
  }
  const usados = new Set<string>(filas.filter((f) => f.base).map((f) => f.base!.id));
  const imagenes: { ruta: string; base64: string }[] = [];
  const productos = filas.map((f) => {
    let id: string;
    if (f.base) id = f.base.id;
    else {
      id = idNuevo(f, usados);
      usados.add(id);
    }
    if (f.foto) imagenes.push({ ruta: rutaSubida(f, id), base64: f.foto.base64 });
    return aProducto(f, id);
  });

  pie.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
  const texto = pie.querySelector('.adm-pie-texto');
  if (texto) texto.textContent = imagenes.length ? 'Guardando y subiendo las fotos…' : 'Guardando…';

  const r = await api('PUT', { sha, productos, ...(imagenes.length ? { imagenes } : {}) });
  if (r.estado === 200 && r.datos?.ok) {
    sha = r.datos.sha ?? sha;
    // Lo guardado pasa a ser la nueva base. La vista previa de la foto recien
    // subida se conserva hasta que el sitio termine de publicarla.
    filas = filas.map((f, i) => ({
      ...aFila(productos[i]),
      clave: f.clave,
      abierta: f.abierta,
      vistaTemporal: f.foto?.vista ?? f.vistaTemporal,
    }));
    quitados = [];
    mensajeGuardado = r.datos.sinCambios
      ? { tipo: 'ok', titulo: 'No había nada nuevo que guardar.' }
      : {
          tipo: 'ok',
          titulo: imagenes.length
            ? 'Guardado. Los cambios y las fotos nuevas se verán en el sitio en aproximadamente 2 minutos.'
            : 'Guardado. Los cambios se verán en el sitio en aproximadamente 1 minuto.',
        };
    return pintarLista();
  }
  if (r.estado === 401) {
    clave = '';
    return pintarEntrada('La contraseña ya no es válida. Vuelve a escribirla; tus cambios siguen aquí.');
  }
  mensajeGuardado = {
    tipo: 'error',
    titulo: r.estado === 409 ? 'No se guardó: ' + textoError(r) : 'No se guardó. ' + textoError(r),
    lista: Array.isArray(r.datos?.errores) ? r.datos.errores : undefined,
  };
  pintarLista();
}

function pintarPie(soloTexto = false) {
  const n = contarCambios();
  if (pie.hidden === false && soloTexto) {
    const t = pie.querySelector('.adm-pie-texto');
    const g = pie.querySelector<HTMLButtonElement>('[data-guardar]');
    // Si estaba la pregunta de cierre, no se toca hasta que la respondan
    if (t && g) {
      t.textContent = n ? `${n} ${n === 1 ? 'producto con cambios' : 'productos con cambios'} sin guardar.` : 'Sin cambios por guardar.';
      g.disabled = n === 0;
    }
    return;
  }
  pie.hidden = false;
  const guardarBtn = boton('Guardar y publicar', guardar, true);
  guardarBtn.setAttribute('data-guardar', '');
  guardarBtn.disabled = n === 0;
  pie.replaceChildren(
    h('p', { class: 'adm-pie-texto', role: 'status' }, n ? `${n} ${n === 1 ? 'producto con cambios' : 'productos con cambios'} sin guardar.` : 'Sin cambios por guardar.'),
    h('div', { class: 'adm-pie-acciones' }, guardarBtn),
  );
}

// ---------- entrada publica ----------
export function abrirPanel(origen?: HTMLElement | null) {
  devolverFoco = origen ?? null;
  if (!dialogo) dialogo = crearDialogo();
  if (dialogo.open) return;
  mensajeGuardado = null;
  dialogo.showModal();
  if (!clave) {
    pintarEntrada();
    return;
  }
  // Ya hay contrasena en memoria: se recargan los datos para no editar sobre algo viejo
  cuerpo.replaceChildren(h('p', { class: 'adm-vacio', role: 'status' }, 'Cargando productos…'));
  pie.hidden = true;
  api('GET').then((r) => {
    if (r.estado === 200 && r.datos?.productos) return cargarDatos(r.datos);
    clave = '';
    pintarEntrada(textoError(r));
  });
}
