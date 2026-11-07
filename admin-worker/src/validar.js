// Reglas de validacion del catalogo (bloque 29b). Las usa el Worker antes de
// hacer el commit y las puede reutilizar el panel para avisar antes de enviar.
// Sin dependencias: corre igual en Cloudflare Workers, Node y el navegador.

export const ANIMALES = ['ave', 'cerdo', 'conejo', 'cuy', 'gato', 'perro', 'tilapia', 'vaca'];

const CLAVES_OBLIGATORIAS = ['id', 'categoria', 'animales', 'nombre', 'precio', 'precioDesde', 'destacado'];
const CLAVES_PERMITIDAS = new Set([
  ...CLAVES_OBLIGATORIAS,
  'descripcion',
  'marca',
  'presentacion',
  'imagen',
  'conFondo',
]);

const RE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RE_IMAGEN = /^\/img\/productos\/[a-z0-9_-]+(\/[a-z0-9_-]+)*\.(webp|avif|jpg|png)$/;
// Caracteres de control y marcas de HTML: el contenido se escapa al pintarse,
// pero no hay motivo para aceptarlos en nombres o descripciones.
const RE_PROHIBIDO = /[\u0000-\u001f\u007f<>]/;

export const LIMITES = {
  productos: 200,
  nombre: 80,
  descripcion: 110,
  marca: 40,
  presentacion: 80,
  precioMax: 9999.99,
  maxEliminados: 10,
};

function textoOpcional(valor, campo, max, errores, ref) {
  if (valor === null || valor === undefined) return;
  if (typeof valor !== 'string') return errores.push(`${ref}: «${campo}» debe ser texto o estar vacío.`);
  if (valor !== valor.trim()) errores.push(`${ref}: «${campo}» tiene espacios al principio o al final.`);
  if (valor.length === 0) errores.push(`${ref}: «${campo}» está vacío (déjalo sin valor, no en blanco).`);
  if (valor.length > max) errores.push(`${ref}: «${campo}» pasa de ${max} caracteres (tiene ${valor.length}).`);
  if (RE_PROHIBIDO.test(valor)) errores.push(`${ref}: «${campo}» tiene caracteres no permitidos (< > o de control).`);
}

/**
 * @param {unknown} lista        productos que propone el panel
 * @param {{categorias: {id: string}[], actuales?: {id: string}[]}} contexto
 * @returns {string[]} lista de errores en español; vacía si todo es válido
 */
export function validarProductos(lista, contexto) {
  const errores = [];
  if (!Array.isArray(lista)) return ['La lista de productos no es válida.'];
  if (lista.length === 0) return ['No puede quedar el catálogo vacío.'];
  if (lista.length > LIMITES.productos) return [`Máximo ${LIMITES.productos} productos.`];

  const categorias = new Set(contexto.categorias.map((c) => c.id));
  const vistos = new Set();

  lista.forEach((p, i) => {
    const ref = `Producto ${i + 1}${p && typeof p.nombre === 'string' ? ` («${p.nombre.slice(0, 30)}»)` : ''}`;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return errores.push(`${ref}: formato no válido.`);

    for (const k of Object.keys(p)) {
      if (!CLAVES_PERMITIDAS.has(k)) errores.push(`${ref}: campo no permitido «${k}».`);
    }
    for (const k of CLAVES_OBLIGATORIAS) {
      if (!(k in p)) errores.push(`${ref}: falta el campo «${k}».`);
    }

    if (typeof p.id !== 'string' || !RE_ID.test(p.id) || p.id.length > 60) {
      errores.push(`${ref}: «id» solo admite minúsculas, números y guiones (máx. 60).`);
    } else if (vistos.has(p.id)) {
      errores.push(`${ref}: el id «${p.id}» está repetido.`);
    } else vistos.add(p.id);

    if (typeof p.categoria !== 'string' || !categorias.has(p.categoria)) {
      errores.push(`${ref}: categoría desconocida.`);
    }

    // Lista vacia permitida: hay productos que no son para un animal concreto
    // (p. ej. semillas de hortalizas).
    if (!Array.isArray(p.animales) || p.animales.length > ANIMALES.length) {
      errores.push(`${ref}: la lista de animales no es válida.`);
    } else {
      if (new Set(p.animales).size !== p.animales.length) errores.push(`${ref}: animales repetidos.`);
      for (const a of p.animales) {
        if (!ANIMALES.includes(a)) errores.push(`${ref}: animal desconocido «${String(a).slice(0, 20)}».`);
      }
    }

    if (typeof p.nombre !== 'string' || p.nombre.trim() === '') {
      errores.push(`${ref}: el nombre es obligatorio.`);
    } else textoOpcional(p.nombre, 'nombre', LIMITES.nombre, errores, ref);

    textoOpcional(p.descripcion, 'descripcion', LIMITES.descripcion, errores, ref);
    textoOpcional(p.marca, 'marca', LIMITES.marca, errores, ref);
    textoOpcional(p.presentacion, 'presentacion', LIMITES.presentacion, errores, ref);

    if (p.precio !== null) {
      const ok =
        typeof p.precio === 'number' &&
        Number.isFinite(p.precio) &&
        p.precio > 0 &&
        p.precio <= LIMITES.precioMax &&
        Math.abs(p.precio * 100 - Math.round(p.precio * 100)) < 1e-6;
      if (!ok) errores.push(`${ref}: el precio debe ser mayor que 0, con hasta 2 decimales (o vacío si no hay dato).`);
    }
    if (typeof p.precioDesde !== 'boolean') errores.push(`${ref}: «precioDesde» debe ser sí o no.`);
    if (p.precio === null && p.precioDesde === true) errores.push(`${ref}: no puede ser «desde» sin precio.`);
    if (typeof p.destacado !== 'boolean') errores.push(`${ref}: «destacado» debe ser sí o no.`);
    if ('conFondo' in p && typeof p.conFondo !== 'boolean') errores.push(`${ref}: «conFondo» no es válido.`);

    if (p.imagen !== null && p.imagen !== undefined) {
      if (typeof p.imagen !== 'string' || !RE_IMAGEN.test(p.imagen)) {
        errores.push(`${ref}: la ruta de la imagen no es válida.`);
      }
    }
  });

  if (contexto.actuales) {
    const ids = new Set(lista.map((p) => p && p.id));
    const quitados = contexto.actuales.filter((a) => !ids.has(a.id)).length;
    if (quitados > LIMITES.maxEliminados) {
      errores.push(`Se quitarían ${quitados} productos de golpe (máximo ${LIMITES.maxEliminados} por vez).`);
    }
  }
  return errores;
}
