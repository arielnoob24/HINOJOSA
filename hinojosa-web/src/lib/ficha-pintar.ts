// Pinta el modelo de ficha-modelo.ts dentro de un contenedor con el marcado
// de src/components/FichaContenido.astro. Lo comparten la ficha de escritorio
// (catalogo.ts) y la hoja de detalle movil (hoja-detalle.ts). Todo con
// textContent / setAttribute: ningun dato entra como HTML.
import { modeloFicha, type FichaConfig, type FichaModelo, type FichaProducto } from './ficha-modelo';

const q = <T extends HTMLElement = HTMLElement>(raiz: ParentNode, sel: string) => raiz.querySelector<T>(sel);

export function pintarModelo(raiz: HTMLElement, m: FichaModelo, p: FichaProducto, tablaId?: string) {
  // ---- Chips: especies (iconos ya en el marcado), categoria y etapa
  const claves = new Set(m.chips.filter((c) => c.tipo === 'animal').map((c) => c.clave));
  for (const li of raiz.querySelectorAll<HTMLElement>('[data-f-animal]')) li.hidden = !claves.has(li.dataset.fAnimal!);
  const cat = m.chips.find((c) => c.tipo === 'categoria');
  const etapa = m.chips.find((c) => c.tipo === 'etapa');
  const liCat = q(raiz, '[data-f-categoria]');
  if (liCat) {
    liCat.textContent = cat?.texto ?? '';
    liCat.hidden = !cat;
  }
  const liEtapa = q(raiz, '[data-f-etapa]');
  if (liEtapa) {
    liEtapa.textContent = etapa?.texto ?? '';
    liEtapa.hidden = !etapa;
  }
  const chips = q(raiz, '[data-f-chips]');
  if (chips) chips.hidden = m.chips.length === 0; // sin chips, sin margen

  // ---- Titulo y precio
  const titulo = q(raiz, '[data-f-titulo]');
  if (titulo) titulo.textContent = m.titulo;
  const precio = q(raiz, '[data-f-precio]');
  if (precio) {
    // "Desde $4,50": prefijo pequeno y regular, monto en negrita
    const mm = /^(\S+)\s+(\$.+)$/.exec(m.precio);
    if (mm && /^desde$/i.test(mm[1])) {
      const pre = document.createElement('span');
      pre.className = 'ficha-precio-desde';
      pre.textContent = mm[1];
      const monto = document.createElement('span');
      monto.className = 'ficha-precio-monto';
      monto.textContent = mm[2];
      precio.replaceChildren(pre, ' ', monto);
    } else {
      precio.textContent = m.precio;
    }
  }

  // ---- Descripcion
  const desc = q(raiz, '[data-f-descripcion]');
  if (desc) {
    desc.textContent = m.descripcion ?? '';
    desc.hidden = !m.descripcion;
  }

  // ---- Atributos (grilla de tarjetas)
  const lista = q(raiz, '[data-f-atributos]');
  if (lista) {
    // Rejilla de 2 columnas (etiqueta sobre valor): Marca y Medida primero
    const peso = (c: string) => (c === 'marca' ? 0 : c === 'medida' ? 1 : 2);
    const ordenados = [...m.atributos].sort((x, y) => peso(x.clave) - peso(y.clave));
    lista.replaceChildren(
      ...ordenados.map((a) => {
        const fila = document.createElement('div');
        fila.className = 'ficha-attr';
        fila.dataset.fAtributo = a.clave;
        const dt = document.createElement('dt');
        dt.textContent = a.etiqueta;
        const dd = document.createElement('dd');
        dd.textContent = a.valor;
        fila.append(dt, dd);
        return fila;
      }),
    );
    lista.dataset.n = String(m.atributos.length);
    lista.hidden = m.atributos.length === 0;
  }

  // ---- Proteina por etapa (solo el tilapero)
  const tabla = q(raiz, '[data-f-proteina]');
  if (tabla) tabla.hidden = !tablaId || p.id !== tablaId;

  // ---- Accion
  const cta = q<HTMLAnchorElement>(raiz, '[data-f-cta]');
  if (cta) {
    const a = m.accion;
    cta.hidden = !a;
    if (a) {
      cta.href = a.href;
      cta.setAttribute('aria-label', a.nombreAccesible);
      if (a.externo) {
        cta.target = '_blank';
        cta.rel = 'noopener noreferrer';
      } else {
        cta.removeAttribute('target');
        cta.removeAttribute('rel');
      }
      const texto = q(cta, '[data-f-cta-texto]');
      if (texto) texto.textContent = a.etiqueta;
      for (const ico of cta.querySelectorAll<HTMLElement>('[data-f-cta-icono]')) {
        ico.hidden = ico.dataset.fCtaIcono !== a.tipo;
      }
    }
  }
}

/** Calcula el modelo y lo pinta. Devuelve el modelo (pruebas, enganches). */
export function pintarFichaEn(raiz: HTMLElement, p: FichaProducto, cfg: FichaConfig, tablaId?: string): FichaModelo {
  const m = modeloFicha(p, cfg);
  pintarModelo(raiz, m, p, tablaId);
  return m;
}
