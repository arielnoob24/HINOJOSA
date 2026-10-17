// srcset de las imagenes de producto (solo en el build: usa node:fs).
//
// Cada imagen existe en dos alturas: <slug>.webp|.avif (800 px de alto) y
// <slug>-400.webp|.avif (400 px). El ancho varia por producto. La tarjeta
// del carrusel y la celda de la rejilla son 3:4 con object-fit: contain, asi
// que la densidad real depende de que lado limita:
//   - imagen estrecha (ancho < 3/4 del alto): limita el alto -> la imagen se
//     comporta como una de 0,75 x alto de ancho;
//   - imagen ancha: limita el ancho real.
// Por eso el descriptor w declarado es max(ancho, 0,75 x alto): asi la
// eleccion del navegador con `sizes` = ancho de la tarjeta es correcta.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// El build de Astro se ejecuta desde la raiz del proyecto (import.meta.url
// apunta al chunk empaquetado, no a src/lib, asi que no sirve aqui).
const PUBLIC = join(process.cwd(), 'public') + '/';

/** Ancho y alto de un WebP leyendo su cabecera (VP8X, VP8 o VP8L). */
function medidasWebp(ruta: string): { w: number; h: number } | null {
  const archivo = PUBLIC + ruta.replace(/^\//, '');
  if (!existsSync(archivo)) return null;
  const b = readFileSync(archivo);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const trozo = b.toString('ascii', 12, 16);
  if (trozo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (trozo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (trozo === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

/**
 * Medidas reales de una imagen WebP de public/ (p. ej. las miniaturas
 * -thumb.webp, 160 px de alto y ancho variable). Sirve para que width/height
 * del <img> tengan la proporcion real (Lighthouse image-aspect-ratio y sin
 * deformar la tarjeta sin JS, que usa width:auto).
 */
export function medidasImagen(ruta: string | null, respaldo = { w: 120, h: 160 }): { w: number; h: number } {
  return (ruta && medidasWebp(ruta)) || respaldo;
}

const declarado = (m: { w: number; h: number }) => Math.round(Math.max(m.w, 0.75 * m.h));

export interface SrcsetProducto {
  webp: string;
  avif: string;
}

/**
 * srcset WebP y AVIF (400 + 800) para la imagen base `/img/productos/<cat>/<slug>.webp`.
 * Si falta la variante de 400 px, devuelve solo la de 800 (sin descriptor).
 */
export function srcsetProducto(imagen: string | null): SrcsetProducto | null {
  if (!imagen) return null;
  const avif = imagen.replace(/\.webp$/, '.avif');
  const chica = imagen.replace(/\.webp$/, '-400.webp');
  const chicaAvif = imagen.replace(/\.webp$/, '-400.avif');
  const mGrande = medidasWebp(imagen);
  const mChica = medidasWebp(chica);
  if (!mGrande || !mChica || !existsSync(PUBLIC + chicaAvif.replace(/^\//, ''))) return { webp: imagen, avif };
  const wG = declarado(mGrande);
  const wC = declarado(mChica);
  return {
    webp: `${chica} ${wC}w, ${imagen} ${wG}w`,
    avif: `${chicaAvif} ${wC}w, ${avif} ${wG}w`,
  };
}

/**
 * Miniatura de la lista (hueco de 40x40 px, object-fit: contain).
 * <slug>-thumb-80.webp (80 px de alto) ya es 2x para el hueco: se usa hasta
 * DPR 2; la de 160 px (-thumb.webp) solo en pantallas mas densas (QA M6).
 * Descriptores x porque el ancho de cada miniatura varia. Si no existe la
 * de 80 px, queda la de 160 sin srcset.
 */
export function miniaturaLista(mini: string | null): { src: string; srcset?: string; w: number; h: number } | null {
  if (!mini) return null;
  const chica = mini.replace(/-thumb\.webp$/, '-thumb-80.webp');
  const mChica = chica !== mini ? medidasWebp(chica) : null;
  if (!mChica) return { src: mini, ...medidasImagen(mini) };
  return { src: chica, srcset: `${chica} 2x, ${mini} 4x`, w: mChica.w, h: mChica.h };
}

/**
 * Tarjeta del anillo: --carrusel-ancho. 116 px en movil (no crece: ver
 * VistaProductos, regla M5), 180 px entre 48 y 64rem y, en >= 64rem,
 * clamp(11.25rem, min(27dvh, 17vw), 18rem) (bloque 23; antes 24dvh y
 * 15rem): se declara el tope de 18rem
 * (288 px) para que el frente grande no se pida corto. A 1x sigue saliendo
 * la variante de 400 px de alto (la de la precarga de M5).
 * El realce del frente (--escala-frente, 1,3 / movil 1,15) NO se suma aqui
 * a proposito: con `sizes` escalado el anillo pediria la de 800 px a DPR 1
 * y dejaria de coincidir con la provisional de M5 (y en movil el LCP
 * pasaria al anillo). A 1440x900 el frente se ve a ~421 px de alto con la
 * de 400 px (ampliacion ~5 %).
 */
export const SIZES_ANILLO = '(max-width: 47.999rem) 7.25rem, (min-width: 64rem) 18rem, 11.25rem';
/**
 * Celda de la rejilla de respaldo (3:4, ~60-145 px). Se usa el MISMO `sizes`
 * que el anillo a proposito: la rejilla se pinta un instante al entrar en
 * Productos (hasta que llega carrusel.ts) y sus imagenes lazy empiezan a
 * bajar; con el mismo `sizes` eligen la misma variante que el anillo y la
 * cache las comparte. Con un `sizes` mas fino, a 2x se bajaban dos variantes
 * de cada producto (QA fase 5).
 */
export const SIZES_REJILLA = SIZES_ANILLO;
