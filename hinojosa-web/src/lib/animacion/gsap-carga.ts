// Cargador comun de GSAP (rediseno 0-C, bloque 21; PLAN.md 0-C
// "Herramientas nuevas"). Este modulo es diminuto y NO importa GSAP de forma
// estatica: va en el JS inicial y solo programa la descarga.
//
//   - cargarGsap(): import() dinamico de `gsap` (core + CSSPlugin). Una sola
//     promesa compartida: todos los modulos (escena de Inicio, carrusel,
//     transicion entre vistas...) reciben la MISMA instancia. Bajo demanda:
//     si alguien la pide antes de `load` (entrada directa por #productos),
//     se descarga en ese momento.
//   - Sin peticion previa, se descarga sola DESPUES de `load` y en un hueco
//     libre (requestIdleCallback, con 200 ms de respaldo): el logo sigue
//     siendo el LCP de Inicio y GSAP nunca compite con el.
//   - vigilarMovimiento(cb): equivalente a gsap.matchMedia() para la regla
//     comun del sitio: avisa con `true` solo si no hay prefers-reduced-motion
//     NI la pausa del sitio (html[data-movimiento="pausado"]). La pausa se
//     observa con MutationObserver (el atributo puede ponerse por codigo sin
//     el evento hinojosa:movimiento) y con el evento.
//
// Si la descarga falla, la promesa se rechaza y cada modulo se queda con su
// respaldo CSS (escena estatica o con la respiracion CSS; rejilla del
// carrusel). Un fallo no se cachea: el siguiente cargarGsap() lo reintenta.
import { movimientoPermitido, mqReducido } from './movimiento';

export type Gsap = typeof import('gsap').gsap;

let promesa: Promise<Gsap> | null = null;

/** GSAP (una sola instancia). Se descarga la primera vez que se pide. */
export function cargarGsap(): Promise<Gsap> {
  if (!promesa) {
    promesa = import('gsap').then(
      (m) => m.gsap,
      (err: unknown) => {
        promesa = null;
        throw err;
      },
    );
  }
  return promesa;
}

/** Resuelve tras `load` y un hueco libre del hilo principal. */
export function trasLoadEnReposo(tope = 1500): Promise<void> {
  return new Promise((r) => {
    const enReposo = () => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => r(), { timeout: tope });
      else window.setTimeout(r, 200);
    };
    if (document.readyState === 'complete') enReposo();
    else window.addEventListener('load', enReposo, { once: true });
  });
}

// Precarga: nunca antes de `load`
void trasLoadEnReposo().then(() => cargarGsap().catch(() => undefined));

const html = document.documentElement;

/**
 * Llama a cb(permitido) ahora y cada vez que cambie el permiso de movimiento
 * (reduced motion o la pausa del sitio). Solo avisa en los cambios reales.
 * Devuelve una funcion para dejar de vigilar.
 */
export function vigilarMovimiento(cb: (permitido: boolean) => void): () => void {
  let ultimo = movimientoPermitido();
  const revisar = () => {
    const ahora = movimientoPermitido();
    if (ahora === ultimo) return;
    ultimo = ahora;
    cb(ahora);
  };
  const obs = new MutationObserver(revisar);
  obs.observe(html, { attributes: true, attributeFilter: ['data-movimiento'] });
  window.addEventListener('hinojosa:movimiento', revisar);
  mqReducido.addEventListener('change', revisar);
  cb(ultimo);
  return () => {
    obs.disconnect();
    window.removeEventListener('hinojosa:movimiento', revisar);
    mqReducido.removeEventListener('change', revisar);
  };
}
