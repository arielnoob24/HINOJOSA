// Rutas a public/ respetando `base` de astro.config.mjs.
//
// En GitHub Pages de proyecto el sitio vive en /HINOJOSA/, no en la raiz:
// una ruta "/img/x.webp" pediria arielnoob24.github.io/img/x.webp (404).
// Toda ruta hacia public/ que llegue al HTML o al navegador pasa por aqui:
//   - ruta('/img/x.webp')        -> '/HINOJOSA/img/x.webp'
//   - rutaSrcset('/a.webp 1x, /b.webp 2x') -> cada candidato con la base
//   - sinBase('/HINOJOSA/img/x') -> '/img/x' (para leer public/ en el build
//     o construir URL absolutas sin duplicar la base)
// ruta() es idempotente: una ruta que ya lleva la base no se toca. Las URL
// absolutas (https:, data:, //host), los hashes (#productos) y las rutas
// relativas se devuelven tal cual. Funciona en el build y en el cliente
// (Vite sustituye import.meta.env.BASE_URL en los dos).
//
// Los JSON de datos (productos.json, carrera.json de Canela) siguen con
// rutas "/img/..." desde la raiz de public/: la base se pone al leerlos
// (negocio.ts para el catalogo, canela-carrera.ts para los sprites).

/** Base sin barra final: '' en la raiz, '/HINOJOSA' en GitHub Pages. */
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function ruta(p: string): string;
export function ruta(p: string | null): string | null;
export function ruta(p: string | null): string | null {
  if (!p || !p.startsWith('/') || p.startsWith('//')) return p;
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) return p;
  return BASE + p;
}

/** Aplica ruta() a cada candidato de un srcset ("url 1x, url 2x" o "url 400w, ..."). */
export function rutaSrcset(s: string): string;
export function rutaSrcset(s: string | null | undefined): string | null | undefined;
export function rutaSrcset(s: string | null | undefined): string | null | undefined {
  if (!s) return s;
  return s
    .split(',')
    .map((c) => {
      const [url, ...desc] = c.trim().split(/\s+/);
      return [ruta(url), ...desc].join(' ');
    })
    .join(', ');
}

/** Quita la base si la lleva: ruta dentro de public/ desde su raiz. */
export function sinBase(p: string): string {
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) return p.slice(BASE.length) || '/';
  return p;
}
