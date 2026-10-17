// Hoja de detalle de producto en movil (P6). Ver HojaDetalle.astro.
//
// - Solo por debajo de 48rem: el boton "Ver detalle" del rotulo
//   ([data-ver-detalle], rediseno 2026-10-16) abre la hoja del producto al
//   frente del carrusel. En escritorio ese papel lo hace la ficha.
// - showModal(): fondo inerte y foco atrapado de forma nativa. El foco va al
//   titulo; `Esc`, "Cerrar" o tocar el telon la cierran y el foco vuelve al
//   boton. El dialogo lleva data-captura-flechas: el router no cambia de
//   vista con ←/→ mientras esta abierto.
// - El enlace "¿Donde comprarlo? Visitanos" cierra la hoja sin devolver el
//   foco (el router lo lleva al titulo de Visitanos).
// - Entrada 300 ms / salida 200 ms solo con movimiento permitido (CSS del
//   componente); si no, se abre y se cierra en el acto.
import { producto, estado, nombreCategoria, IMAGEN_GENERICA, type ProductoDatos } from './catalogo';
import { movimientoPermitido } from './animacion/movimiento';

const hoja = document.querySelector<HTMLDialogElement>('[data-hoja-detalle]');
const botonDetalle = document.querySelector<HTMLElement>('#productos [data-ver-detalle]');
const mqMovil = window.matchMedia('(max-width: 47.999rem)');

let filaOrigen: HTMLElement | null = null;
let devolverFoco = true;
let cerrando = 0;

function campo(sel: string) {
  return hoja?.querySelector<HTMLElement>(sel) ?? null;
}

function pintarImagen(p: ProductoDatos) {
  const caja = campo('[data-hoja-imagen]');
  if (!caja) return;
  caja.replaceChildren();
  if (!p.imagen) {
    const costal = document.createElement('div');
    costal.className = 'hoja-costal';
    const img = document.createElement('img');
    img.src = IMAGEN_GENERICA;
    img.alt = '';
    img.width = 200;
    img.height = 260;
    const nombre = document.createElement('span');
    nombre.setAttribute('aria-hidden', 'true');
    nombre.textContent = p.nombre;
    costal.append(img, nombre);
    caja.append(costal);
    return;
  }
  const picture = document.createElement('picture');
  if (p.conFondo) picture.className = 'hoja-placa';
  if (p.srcset?.avif || p.avif) {
    const fuente = document.createElement('source');
    fuente.type = 'image/avif';
    fuente.srcset = p.srcset?.avif ?? p.avif!;
    fuente.sizes = '11rem';
    picture.append(fuente);
  }
  const img = document.createElement('img');
  img.src = p.imagen;
  if (p.srcset?.webp) img.srcset = p.srcset.webp;
  img.sizes = '11rem';
  img.alt = ''; // el nombre es el titulo de la hoja
  img.width = 600;
  img.height = 800;
  img.decoding = 'async';
  picture.append(img);
  caja.append(picture);
}

function abrir(id: string, fila: HTMLElement) {
  const p = producto(id);
  if (!hoja || !p) return;
  window.clearTimeout(cerrando);
  hoja.removeAttribute('data-saliendo');
  filaOrigen = fila;
  devolverFoco = true;
  pintarImagen(p);
  const titulo = campo('[data-hoja-titulo]');
  if (titulo) titulo.textContent = p.nombre;
  const descripcion = campo('[data-hoja-descripcion]');
  if (descripcion) {
    descripcion.textContent = p.descripcion ?? '';
    descripcion.hidden = !p.descripcion;
  }
  const detalle = campo('[data-hoja-detalle-texto]');
  if (detalle) detalle.textContent = [p.marca, p.presentacion].filter(Boolean).join(' · ');
  const cat = campo('[data-hoja-categoria]');
  if (cat) cat.textContent = nombreCategoria(p.categoria);
  const precio = campo('[data-hoja-precio]');
  if (precio) precio.textContent = p.precioTexto;
  if (!hoja.open) hoja.showModal();
  hoja.scrollTop = 0;
  titulo?.focus();
}

function terminar() {
  window.clearTimeout(cerrando);
  if (!hoja) return;
  hoja.removeAttribute('data-saliendo');
  if (hoja.open) hoja.close();
}

/** Cierra con la salida de 200 ms si hay movimiento; si no, en el acto. */
function cerrar(conAnimacion = true) {
  if (!hoja?.open || hoja.hasAttribute('data-saliendo')) return;
  if (!conAnimacion || !movimientoPermitido()) return terminar();
  hoja.setAttribute('data-saliendo', '');
  const fin = (ev: AnimationEvent) => {
    if (ev.target !== hoja) return;
    hoja.removeEventListener('animationend', fin);
    terminar();
  };
  hoja.addEventListener('animationend', fin);
  cerrando = window.setTimeout(terminar, 260); // tope por si no llega el evento
}

function arrancar() {
  if (!hoja || !botonDetalle) return;

  mqMovil.addEventListener('change', () => {
    if (!mqMovil.matches) cerrar(false); // al pasar a escritorio no queda abierta
  });

  botonDetalle.addEventListener('click', () => {
    const id = estado().id;
    if (id) abrir(id, botonDetalle);
  });

  // Esc: el navegador dispara `cancel`; se cierra con la salida animada
  hoja.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    cerrar();
  });
  hoja.addEventListener('click', (ev) => {
    const el = ev.target as Element;
    if (el === hoja) return cerrar(); // telon (fuera del contenido)
    if (el.closest('[data-hoja-cerrar]')) return cerrar();
    if (el.closest('[data-hoja-cta]')) {
      // El ancla cambia el hash: el router lleva el foco a Visitanos
      devolverFoco = false;
      terminar();
    }
  });
  hoja.addEventListener('close', () => {
    if (devolverFoco && filaOrigen?.isConnected) filaOrigen.focus();
    filaOrigen = null;
  });

  // Si se sale de Productos con la hoja abierta (atras del navegador), se cierra
  window.addEventListener('hashchange', () => {
    if (hoja.open && location.hash !== '#productos') {
      devolverFoco = false;
      terminar();
    }
  });
}

arrancar();
