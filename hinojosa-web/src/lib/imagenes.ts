// Utilidades de imagen en tiempo de build: lee las dimensiones reales de los
// WebP de public/ (para width/height explicitos y evitar CLS) y arma el srcset
// con la variante -480.webp cuando existe.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(process.cwd(), 'public');
const cache = new Map<string, { width: number; height: number }>();

export function dimensionesWebp(ruta: string): { width: number; height: number } {
  const previa = cache.get(ruta);
  if (previa) return previa;
  const buf = readFileSync(join(PUBLIC, ruta));
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`No es un WebP valido: ${ruta}`);
  }
  const chunk = buf.toString('ascii', 12, 16);
  let width: number;
  let height: number;
  if (chunk === 'VP8X') {
    width = 1 + buf.readUIntLE(24, 3);
    height = 1 + buf.readUIntLE(27, 3);
  } else if (chunk === 'VP8 ') {
    width = buf.readUInt16LE(26) & 0x3fff;
    height = buf.readUInt16LE(28) & 0x3fff;
  } else if (chunk === 'VP8L') {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    width = 1 + (((b1 & 0x3f) << 8) | b0);
    height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
  } else {
    throw new Error(`Formato WebP no reconocido (${chunk}): ${ruta}`);
  }
  const dims = { width, height };
  cache.set(ruta, dims);
  return dims;
}

export interface ImagenResponsiva {
  src: string;
  srcset?: string;
  width: number;
  height: number;
}

/** Imagen base (900 o nativa) + variante -480 si existe. */
export function imagenResponsiva(ruta: string): ImagenResponsiva {
  const { width, height } = dimensionesWebp(ruta);
  const ruta480 = ruta.replace(/\.webp$/, '-480.webp');
  if (ruta480 !== ruta && existsSync(join(PUBLIC, ruta480))) {
    const w480 = dimensionesWebp(ruta480).width;
    return { src: ruta, srcset: `${ruta480} ${w480}w, ${ruta} ${width}w`, width, height };
  }
  return { src: ruta, width, height };
}
