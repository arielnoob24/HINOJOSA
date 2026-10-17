// Escena de granja de Inicio (rediseno 0-C, bloque 22): idle de los
// animales de la foto de familia con GSAP (cargador comun gsap-carga.ts).
// Las nubes y el cielo ya no se animan aqui: el fondo es un video
// (escena-lienzos.ts, ajustes del 2026-10-17 tarde), con su propio ciclo de
// vida (se pausa fuera de Inicio, con la pausa y con reduced motion).
//
// Marcado (VistaInicio.astro):
//   [data-escena="inicio"]          raiz
//   [data-animal="<slug>"]          contenedor con --fase (0..0,9)
//     [data-animal-cuerpo]          lo que se anima (origen abajo al centro)
//     [data-sombra]                 sombra: solo se encoge en los saltitos
//   html[data-escena-gsap]          GSAP tiene el control: el CSS apaga la
//                                   respiracion de respaldo (@keyframes
//                                   animal-respira / tilapia-flota)
//
// Animales: respiracion continua (scaleX/scaleY desde los pies, periodo y
// fase propios) y GESTOS ocasionales por especie (rotation, y, x; nunca
// escala: asi no pelean con la respiracion), separados por pausas
// aleatorias. Rotacion <= 2 grados. Solo transform.
//
// Ciclo de vida (el disparador es el cambio de vista, no hay scroll):
//   - Activa solo con #inicio visible, GSAP cargado y movimiento permitido
//     (sin prefers-reduced-motion ni html[data-movimiento="pausado"]).
//   - Al salir de Inicio se CONGELA (pausa: nada salta mientras la vista
//     sale) y en cuanto el router oculta #inicio (`hidden`) se DETIENE: se
//     matan todos los tweens y llamadas diferidas de la escena y se limpian
//     los transforms. El ticker de GSAP se duerme solo (autoSleep): 0
//     requestAnimationFrame fuera de Inicio (salvo el carrusel mientras gira).
//   - Con la pausa o reduced motion: detenida al instante, animales en
//     reposo (escena estatica) y sin respiracion CSS.
//   - Movil (< 64rem): solo los animales visibles ([data-movil], 5): se
//     filtra por getClientRects().
import { alCambiarVista, vistaActual } from '../router';
import { cargarGsap, vigilarMovimiento, type Gsap } from './gsap-carga';

type Anim = ReturnType<Gsap['to']> | ReturnType<Gsap['timeline']>;

const html = document.documentElement;
const seccion = document.getElementById('inicio');
const escena = document.querySelector<HTMLElement>('[data-escena="inicio"]');

const azar = (a: number, b: number) => a + Math.random() * (b - a);
const visible = (el: Element) => el.getClientRects().length > 0;

// ---------------------------------------------------------------------
// Gestos por especie
// ---------------------------------------------------------------------
interface Cuerpo {
  slug: string;
  fase: number;
  cuerpo: HTMLElement;
  sombra: HTMLElement | null;
}
type Gesto = (g: Gsap, a: Cuerpo) => Anim;

/** Cabeceo o balanceo: inclina `grados`, sostiene y vuelve. */
const inclinar =
  (grados: number, ida = 0.7, sostener = 0.6, vuelta = 0.9): Gesto =>
  (g, { cuerpo }) =>
    g
      .timeline()
      .to(cuerpo, { rotation: grados, duration: ida, ease: 'sine.inOut' })
      .to(cuerpo, { rotation: 0, duration: vuelta, ease: 'sine.inOut' }, `+=${sostener}`);

/** Picoteo: 2-3 inclinaciones rapidas hacia delante (aves). */
const picotear =
  (grados: number): Gesto =>
  (g, { cuerpo }) => {
    const tl = g.timeline();
    const veces = Math.random() < 0.5 ? 2 : 3;
    for (let i = 0; i < veces; i++) {
      tl.to(cuerpo, { rotation: grados, yPercent: 1.2, duration: 0.16, ease: 'power2.in' }).to(cuerpo, {
        rotation: grados * 0.25,
        yPercent: 0.2,
        duration: 0.2,
        ease: 'power2.out',
      });
    }
    return tl.to(cuerpo, { rotation: 0, yPercent: 0, duration: 0.35, ease: 'sine.out' });
  };

/** Saltito: sube `alto` % de su altura y cae; la sombra se encoge. */
const saltar =
  (alto: number, veces = 1): Gesto =>
  (g, { cuerpo, sombra }) => {
    const tl = g.timeline();
    for (let i = 0; i < veces; i++) {
      tl.to(cuerpo, { yPercent: -alto, duration: 0.17, ease: 'power2.out' }).to(cuerpo, {
        yPercent: 0,
        duration: 0.19,
        ease: 'power2.in',
      });
      if (sombra) {
        tl.to(sombra, { scale: 0.86, opacity: 0.7, duration: 0.17, ease: 'power2.out' }, '<-0.19').to(sombra, {
          scale: 1,
          opacity: 1,
          duration: 0.19,
          ease: 'power2.in',
        });
      }
      if (i < veces - 1) tl.to({}, { duration: 0.08 });
    }
    return tl;
  };

/** Paso corto de lado y vuelta (cuyes que se acomodan). */
const acomodar =
  (desplazamiento: number): Gesto =>
  (g, { cuerpo }) =>
    g
      .timeline()
      .to(cuerpo, { xPercent: desplazamiento, rotation: desplazamiento > 0 ? 0.8 : -0.8, duration: 0.5, ease: 'sine.inOut' })
      .to(cuerpo, { rotation: 0, duration: 0.3, ease: 'sine.out' })
      .to(cuerpo, { xPercent: 0, duration: 0.9, ease: 'sine.inOut' }, '+=1.4');

interface Especie {
  /** Periodo de la respiracion en s (0 = sin respiracion). */
  respira: number;
  /** Escala maxima [x, y] de la respiracion. */
  amp: [number, number];
  /** Pausa aleatoria entre gestos, en s. */
  pausa: [number, number];
  gestos: Gesto[];
  /** Bucles continuos propios (pato, tilapias). */
  continuo?: (g: Gsap, a: Cuerpo) => Anim[];
}

// Sentidos medidos sobre las imagenes: gallo, cerdo y vaca miran a la
// derecha (rotacion + inclina la cabeza hacia delante/abajo); pato a la
// izquierda; perro, gato y cuyes de frente.
const ESPECIES: Record<string, Especie> = {
  vaca: { respira: 5.2, amp: [1.006, 1.014], pausa: [4, 9], gestos: [inclinar(1.4, 0.9, 1.4, 1.1), inclinar(-0.6, 0.8, 0.4, 0.8)] },
  cerdo: { respira: 3.8, amp: [1.01, 1.016], pausa: [3, 7], gestos: [inclinar(1.1, 0.35, 0.25, 0.5), inclinar(-0.8, 0.5, 0.6, 0.7)] },
  aves: { respira: 2.8, amp: [1.004, 1.012], pausa: [1.8, 5], gestos: [picotear(2), picotear(1.6)] },
  conejos: { respira: 1.9, amp: [1.01, 1.02], pausa: [3.5, 8], gestos: [saltar(5), saltar(4, 2), inclinar(-1, 0.4, 0.5, 0.5)] },
  cuyes: { respira: 2.2, amp: [1.012, 1.02], pausa: [4, 9], gestos: [saltar(3.5), acomodar(2.5), acomodar(-2)] },
  perro: { respira: 1.5, amp: [1.006, 1.022], pausa: [3, 7], gestos: [inclinar(-1.6, 0.4, 1, 0.6), inclinar(1.2, 0.45, 0.8, 0.6)] },
  gato: { respira: 4.4, amp: [1.006, 1.012], pausa: [5, 10], gestos: [inclinar(1, 1.2, 0.8, 1.3), inclinar(-1, 1.2, 0.8, 1.3)] },
  pato: {
    respira: 3.2,
    amp: [1.004, 1.01],
    pausa: [3, 7],
    gestos: [],
    // Se mece de lado a lado sin parar (un tween, yoyo)
    continuo: (g, { cuerpo, fase }) => {
      g.set(cuerpo, { rotation: -1.4 });
      return [g.to(cuerpo, { rotation: 1.4, duration: 1.3 + fase * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress(fase)];
    },
  },
  tilapias: {
    respira: 0,
    amp: [1, 1],
    pausa: [6, 12],
    gestos: [],
    // Suben y bajan en el agua y derivan un poco de lado: periodos primos
    // entre si para que el conjunto no se repita a la vista
    continuo: (g, { cuerpo, fase }) => {
      g.set(cuerpo, { yPercent: -6, xPercent: -3, rotation: -1.2 });
      return [
        g.to(cuerpo, { yPercent: 7, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress(fase),
        g.to(cuerpo, { xPercent: 3, duration: 3.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress((fase + 0.4) % 1),
        g.to(cuerpo, { rotation: 1.2, duration: 2.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }).progress((fase + 0.7) % 1),
      ];
    },
  },
};

// ---------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------
let gsap: Gsap | null = null;
let estadoEscena: 'parada' | 'activa' | 'congelada' = 'parada';
let permitido = false;
/** Todo lo vivo de la escena: bucles, gestos y llamadas diferidas. */
const vivas = new Set<Anim>();
let limpiar: Element[] = [];

function registrar<T extends Anim>(a: T): T {
  vivas.add(a);
  return a;
}

function programarGesto(g: Gsap, a: Cuerpo, esp: Especie, primera = false) {
  if (!esp.gestos.length) return;
  const [min, max] = esp.pausa;
  // La primera espera se escala con --fase: no arrancan todos a la vez
  const espera = primera ? azar(0.6, max) * (0.4 + a.fase) : azar(min, max);
  const llamada = g.delayedCall(espera, () => {
    vivas.delete(llamada);
    if (estadoEscena !== 'activa') return;
    const gesto = esp.gestos[Math.floor(Math.random() * esp.gestos.length)](g, a);
    registrar(gesto);
    gesto.eventCallback('onComplete', () => {
      vivas.delete(gesto);
      if (estadoEscena === 'activa') programarGesto(g, a, esp);
    });
  });
  registrar(llamada);
}

function crearAnimales(g: Gsap) {
  if (!escena) return;
  for (const caja of escena.querySelectorAll<HTMLElement>('[data-animal]')) {
    if (!visible(caja)) continue;
    const cuerpo = caja.querySelector<HTMLElement>('[data-animal-cuerpo]');
    const esp = ESPECIES[caja.dataset.animal ?? ''];
    if (!cuerpo || !esp) continue;
    const a: Cuerpo = {
      slug: caja.dataset.animal!,
      fase: parseFloat(caja.style.getPropertyValue('--fase')) || 0,
      cuerpo,
      sombra: caja.querySelector<HTMLElement>('[data-sombra]'),
    };
    limpiar.push(cuerpo);
    if (a.sombra) limpiar.push(a.sombra);
    if (esp.respira > 0) {
      const periodo = esp.respira * (0.92 + 0.16 * a.fase);
      const t = g.to(cuerpo, {
        scaleX: esp.amp[0],
        scaleY: esp.amp[1],
        duration: periodo / 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      t.totalTime(a.fase * periodo);
      registrar(t);
    }
    for (const c of esp.continuo?.(g, a) ?? []) registrar(c);
    programarGesto(g, a, esp, true);
  }
}

function arrancar(g: Gsap) {
  limpiar = [];
  crearAnimales(g);
  estadoEscena = 'activa';
  html.setAttribute('data-escena-gsap', '');
}

function congelar() {
  for (const a of vivas) a.pause();
  estadoEscena = 'congelada';
}

function reanudar() {
  for (const a of vivas) a.resume();
  estadoEscena = 'activa';
}

function detener() {
  for (const a of vivas) a.kill();
  vivas.clear();
  if (gsap && limpiar.length) gsap.set(limpiar, { clearProps: 'transform,opacity' });
  limpiar = [];
  estadoEscena = 'parada';
  html.removeAttribute('data-escena-gsap');
}

function actualizar() {
  const g = gsap;
  if (!g || !seccion) return;
  const enInicio = vistaActual() === 'inicio';
  const seVe = !seccion.hidden;
  if (enInicio && permitido) {
    if (estadoEscena === 'congelada') reanudar();
    else if (estadoEscena === 'parada') arrancar(g);
    return;
  }
  if (estadoEscena === 'parada') return;
  // Saliendo de Inicio con la transicion en curso: congelar hasta `hidden`
  if (permitido && seVe) {
    if (estadoEscena === 'activa') congelar();
    return;
  }
  detener();
}

if (escena && seccion) {
  void cargarGsap()
    .then((g) => {
      gsap = g;
      vigilarMovimiento((p) => {
        permitido = p;
        actualizar();
      });
      alCambiarVista(actualizar);
      // El router oculta #inicio al terminar la transicion de salida
      new MutationObserver(actualizar).observe(seccion, { attributes: true, attributeFilter: ['hidden'] });
      // Cambio de disposicion (64rem: otros animales visibles): de cero
      window.matchMedia('(min-width: 64rem)').addEventListener('change', () => {
        if (estadoEscena === 'parada') return;
        const congelada = estadoEscena === 'congelada';
        detener();
        if (gsap) arrancar(gsap);
        if (congelada) congelar();
      });
    })
    .catch(() => {
      /* sin GSAP: se queda la respiracion CSS de respaldo */
    });
}

declare global {
  interface Window {
    /** Solo diagnostico (pruebas): estado y numero de animaciones vivas. */
    hinojosaEscena?: { estado: () => string; vivas: () => number; tweensGsap: () => number; tweensEscena: () => number };
  }
}
/** Tweens del timeline global de GSAP (todos / los que animan la escena). */
function contarTweens(soloEscena: boolean): number {
  if (!gsap) return 0;
  const hijos = gsap.globalTimeline.getChildren(true, true, false);
  if (!soloEscena) return hijos.length;
  return hijos.filter((t) =>
    t.targets().some((el: unknown) => el instanceof Element && escena?.contains(el)),
  ).length;
}
window.hinojosaEscena = {
  estado: () => estadoEscena,
  vivas: () => vivas.size,
  tweensGsap: () => contarTweens(false),
  tweensEscena: () => contarTweens(true),
};
