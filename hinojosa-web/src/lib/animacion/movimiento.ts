// Utilidades de movimiento compartidas (fase 4). Va en el JS inicial: no
// importa ninguna libreria. GSAP se carga con import() dinamico desde el
// cargador comun gsap-carga.ts (tras `load`, o bajo demanda).
//
// Regla comun: con prefers-reduced-motion o con la pausa del usuario
// (html[data-movimiento="pausado"], evento hinojosa:movimiento) no hay
// movimiento decorativo: los cambios son instantaneos.

const html = document.documentElement;

export const mqReducido = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Raton o trackpad: el paralaje no se activa en tactil. */
export const mqPunteroFino = window.matchMedia('(hover: hover) and (pointer: fine)');

export const pausado = () => html.getAttribute('data-movimiento') === 'pausado';

/** Ni reduced motion ni pausa del usuario. */
export const movimientoPermitido = () => !mqReducido.matches && !pausado();

/** Avisa cuando cambia la pausa del usuario o la preferencia del sistema. */
export function alCambiarMovimiento(cb: (permitido: boolean) => void): void {
  const avisar = () => cb(movimientoPermitido());
  window.addEventListener('hinojosa:movimiento', avisar);
  mqReducido.addEventListener('change', avisar);
}

/** Lee una variable de tokens.css (en :root). */
export function token(nombre: string): string {
  return getComputedStyle(html).getPropertyValue(nombre).trim();
}

/** "450ms" | "0.45s" -> milisegundos. */
export function ms(valor: string, porDefecto: number): number {
  const n = parseFloat(valor);
  if (!Number.isFinite(n)) return porDefecto;
  return valor.endsWith('ms') ? n : valor.endsWith('s') ? n * 1000 : n;
}

/** "11.25rem" | "260px" -> pixeles. */
export function px(valor: string, porDefecto: number): number {
  const n = parseFloat(valor);
  if (!Number.isFinite(n)) return porDefecto;
  if (valor.endsWith('rem') || valor.endsWith('em')) return n * parseFloat(getComputedStyle(html).fontSize || '16');
  return n;
}

/**
 * Curva cubic-bezier como funcion p -> valor, para pasarla a GSAP como
 * `ease`. Admite y > 1 (rebote de --ease-giro). Resuelve x(t) = p por
 * Newton con respaldo de biseccion.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const err = x(t) - p;
      if (Math.abs(err) < 1e-5) return y(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = p;
    for (let i = 0; i < 24; i++) {
      const v = x(t);
      if (Math.abs(v - p) < 1e-5) break;
      if (v < p) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return y(t);
  };
}

/** "cubic-bezier(0.22, 1.3, 0.36, 1)" -> funcion; si no se puede leer, el respaldo. */
export function curvaDeToken(nombre: string, respaldo: [number, number, number, number]): (p: number) => number {
  const m = token(nombre).match(/cubic-bezier\(([^)]+)\)/);
  const v = m ? m[1].split(',').map((s) => parseFloat(s)) : [];
  const [a, b, c, d] = v.length === 4 && v.every(Number.isFinite) ? v : respaldo;
  return cubicBezier(a, b, c, d);
}
