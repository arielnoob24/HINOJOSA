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
type Fila = {
  clave: number;
  base: Producto | null; // como esta publicado (null = producto nuevo)
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
  if (f.base) return { ...f.base, ...editable };
  return {
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

function cambiada(f: Fila): boolean {
  if (!f.base) return true;
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

  // Cabecera: nombre, precio y "Editar mas"
  const precio = h('input', { type: 'text', inputmode: 'decimal', id: `adm-precio-${f.clave}`, autocomplete: 'off', placeholder: 'Sin precio' });
  precio.value = f.precioTxt;
  precio.addEventListener('input', () => {
    f.precioTxt = precio.value;
    refrescarFila(f);
  });
  const mas = h('button', { type: 'button', class: 'adm-boton', 'aria-expanded': String(f.abierta), 'aria-controls': `adm-mas-${f.clave}` });
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
      h('div', { class: 'adm-fila-nombre' }, h('strong', { 'data-rotulo': '' }), h('span', { class: 'adm-fila-cat', 'data-cat': '' })),
      h('label', { class: 'adm-campo adm-precio', for: `adm-precio-${f.clave}` }, h('span', {}, 'Precio (USD)'), precio),
      mas,
    ),
    detalle,
  );

  // Detalle
  detalle.append(
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
      marca(f.animales.includes(valor), etiqueta, (v) => {
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
  return errores;
}

async function guardar() {
  const errores = revisar();
  if (errores.length) {
    mensajeGuardado = { tipo: 'error', titulo: 'Corrige esto antes de guardar:', lista: errores };
    return pintarLista();
  }
  const usados = new Set<string>(filas.filter((f) => f.base).map((f) => f.base!.id));
  const productos = filas.map((f) => {
    if (f.base) return aProducto(f, f.base.id);
    const id = idNuevo(f, usados);
    usados.add(id);
    return aProducto(f, id);
  });

  pie.querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
  const texto = pie.querySelector('.adm-pie-texto');
  if (texto) texto.textContent = 'Guardando…';

  const r = await api('PUT', { sha, productos });
  if (r.estado === 200 && r.datos?.ok) {
    sha = r.datos.sha ?? sha;
    // Lo guardado pasa a ser la nueva base
    filas = filas.map((f, i) => ({ ...aFila(productos[i]), clave: f.clave, abierta: f.abierta }));
    quitados = [];
    mensajeGuardado = r.datos.sinCambios
      ? { tipo: 'ok', titulo: 'No había nada nuevo que guardar.' }
      : { tipo: 'ok', titulo: 'Guardado. Los cambios se verán en el sitio en aproximadamente 1 minuto.' };
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
