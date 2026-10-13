// Entorno de animacion (fase 4). Este modulo va en el JS inicial: debe ser
// pequeno y no importar ninguna libreria. Decide QUE se puede animar; las
// librerias (GSAP, Lenis, Three.js) se cargan despues con import() dinamico.

export const html = document.documentElement;

const mq = (consulta: string) => window.matchMedia(consulta);

/** Preferencia del sistema: movimiento reducido. */
export const mqReducido = mq('(prefers-reduced-motion: reduce)');
/** Raton o trackpad (no tactil): tilt, paralaje del puntero y Lenis. */
export const mqPunteroFino = mq('(hover: hover) and (pointer: fine)');
/** >= 768 px: escena 3D del hero (en movil siguen los granos SVG). */
export const mqTableta = mq('(min-width: 48rem)');
/** >= 1024 px: Lenis y giro de categorias. */
export const mqEscritorio = mq('(min-width: 64rem)');

/** Boton "Pausar animaciones" (data-movimiento="pausado" en <html>). */
export const pausado = () => html.getAttribute('data-movimiento') === 'pausado';

/** Se puede mover algo: ni reduced motion ni pausa del usuario. */
export const movimientoPermitido = () => !mqReducido.matches && !pausado();

type NavegadorExtendido = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Gama baja o ahorro de datos: se queda la version CSS. */
export function gamaBaja(): boolean {
  const n = navigator as NavegadorExtendido;
  return (
    (n.hardwareConcurrency ?? 8) <= 4 ||
    (n.deviceMemory ?? 8) <= 2 ||
    n.connection?.saveData === true
  );
}

/** Comprueba WebGL creando un contexto minimo y liberandolo. */
export function hayWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Avisa cuando cambia el boton de pausa o la preferencia del sistema. */
export function alCambiarMovimiento(cb: (permitido: boolean) => void): void {
  const avisar = () => cb(movimientoPermitido());
  window.addEventListener('hinojosa:movimiento', avisar);
  mqReducido.addEventListener('change', avisar);
}

/** Ejecuta cb cuando la pagina ya cargo y el hilo principal esta libre. */
export function enReposo(cb: () => void, espera = 2500): void {
  const programar = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(cb, { timeout: espera });
    else setTimeout(cb, 300);
  };
  if (document.readyState === 'complete') programar();
  else window.addEventListener('load', programar, { once: true });
}
