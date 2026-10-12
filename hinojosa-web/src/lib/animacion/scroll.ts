// Animaciones ligadas al scroll (fase 4): GSAP + ScrollTrigger, y Lenis en
// escritorio. Se carga diferido y SOLO sin reduced motion (arranque.ts).
//
// Regla de oro: el contenido es visible sin JS. Solo se oculta (opacity 0)
// lo que esta por debajo del pliegue, y solo despues de que GSAP este
// cargado (clase .gsap-listo en <html>). Si se pausan las animaciones, todo
// salta a su estado final y se quitan los estilos en linea.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import {
  alCambiarMovimiento,
  html,
  movimientoPermitido,
  mqEscritorio,
  mqPunteroFino,
  mqReducido,
} from './entorno';

gsap.registerPlugin(ScrollTrigger);

// Curvas de global.css: --ease-suave ~ power3.out, --ease-rebote ~ back.out.
const SUAVE = 'power3.out';
const REBOTE = 'back.out(1.7)';
const PROPS = 'opacity,visibility,transform,translate,rotate,scale';

/** Elementos ocultados por GSAP que aun no se han revelado. */
const pendientes = new Set<Element>();
/** Funciones que dejan cada efecto en su estado final (pausa). */
const finales: Array<() => void> = [];

const bajoElPliegue = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.height > 0 && r.top > window.innerHeight * 0.92;
};

// ---------------------------------------------------------------------------
// 1. Apariciones por seccion (storyboard, seccion 5): sube 20 px + opacidad,
//    600 ms, desfase de 80-120 ms entre hermanos, una sola vez.
// ---------------------------------------------------------------------------
function revelar(
  objetivos: Element[],
  desde: gsap.TweenVars,
  opciones: { desfase?: number; duracion?: number; ease?: string; lote?: number; inicio?: string } = {},
) {
  const els = objetivos.filter(bajoElPliegue);
  if (!els.length) return;
  gsap.set(els, { opacity: 0, ...desde });
  els.forEach((el) => pendientes.add(el));

  ScrollTrigger.batch(els, {
    start: opciones.inicio ?? 'top 88%',
    once: true,
    interval: 0.1,
    batchMax: opciones.lote,
    onEnter: (lote) =>
      gsap.to(lote, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: opciones.duracion ?? 0.6,
        ease: opciones.ease ?? SUAVE,
        stagger: opciones.desfase ?? 0.1,
        overwrite: true,
        clearProps: PROPS,
        onComplete: () => lote.forEach((el) => pendientes.delete(el)),
      }),
  });
}

function apariciones() {
  const $ = (sel: string) => gsap.utils.toArray<Element>(sel);

  // Bloques genericos y los hijos de [data-revelar-hijos].
  revelar($('[data-revelar]:not([data-revelar="insignia"]), [data-revelar-hijos] > *'), { y: 20 }, { desfase: 0.1 });
  // Visual de Canela: entrar-insignia (sube 24 px y escala de 0.9 a 1).
  revelar($('[data-revelar="insignia"]'), { y: 24, scale: 0.9 }, { duracion: 0.7, ease: REBOTE });
  // Catalogo: tarjetas en lotes de 4 con 80 ms de desfase.
  revelar($('[data-producto]'), { y: 20 }, { desfase: 0.08, lote: 4, inicio: 'top 92%' });

  finales.push(() => {
    gsap.killTweensOf([...pendientes]);
    gsap.set([...pendientes], { clearProps: PROPS });
    pendientes.clear();
  });
}

// ---------------------------------------------------------------------------
// 2. Contadores ([data-contador] + data-valor): de 0 al valor en 1.2 s.
//    El lector de pantalla siempre recibe el numero final.
// ---------------------------------------------------------------------------
function contadores() {
  gsap.utils.toArray<HTMLElement>('[data-contador]').forEach((el) => {
    const valor = Number(el.dataset.valor);
    const texto = (el.textContent ?? '').trim();
    if (!Number.isFinite(valor) || !bajoElPliegue(el)) return;
    const sufijo = texto.startsWith(String(valor)) ? texto.slice(String(valor).length) : '';

    const visible = document.createElement('span');
    visible.setAttribute('aria-hidden', 'true');
    visible.style.display = 'inline-block';
    visible.style.minWidth = `${texto.length}ch`; // sin saltos de ancho
    visible.textContent = `0${sufijo}`;
    const lector = document.createElement('span');
    lector.className = 'sr-only';
    lector.textContent = texto;
    el.replaceChildren(visible, lector);

    const estado = { n: 0 };
    const tween = gsap.to(estado, {
      n: valor,
      duration: 1.2,
      ease: 'power2.out',
      paused: true,
      onUpdate: () => (visible.textContent = `${Math.round(estado.n)}${sufijo}`),
    });
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tween.play() });
    finales.push(() => tween.progress(1).kill());
  });
}

// ---------------------------------------------------------------------------
// 3. Iconos de valores y pilares ([data-icono-animado]), en lugar de Lottie:
//    la insignia aparece con rebote y el trazo del icono se dibuja (600 ms).
// ---------------------------------------------------------------------------
function iconos() {
  const insignias = gsap.utils.toArray<HTMLElement>('[data-icono-animado]').filter(bajoElPliegue);
  if (!insignias.length) return;

  insignias.forEach((ins) => {
    const trazos = ins.querySelectorAll<SVGGeometryElement>('svg path, svg circle, svg rect');
    trazos.forEach((t) => t.setAttribute('pathLength', '1'));
    gsap.set(trazos, { strokeDasharray: 1, strokeDashoffset: 1 });
    pendientes.add(ins);
  });
  gsap.set(insignias, { opacity: 0, scale: 0.6 });

  const terminar = (ins: Element) => {
    const trazos = ins.querySelectorAll('svg path, svg circle, svg rect');
    gsap.set(trazos, { clearProps: 'strokeDasharray,strokeDashoffset' });
    trazos.forEach((t) => t.removeAttribute('pathLength'));
    gsap.set(ins, { clearProps: PROPS });
    pendientes.delete(ins);
  };

  ScrollTrigger.batch(insignias, {
    start: 'top 88%',
    once: true,
    interval: 0.1,
    onEnter: (lote) => {
      lote.forEach((ins, i) => {
        const trazos = ins.querySelectorAll('svg path, svg circle, svg rect');
        gsap
          .timeline({ delay: i * 0.08, onComplete: () => terminar(ins) })
          .to(ins, { opacity: 1, scale: 1, duration: 0.45, ease: REBOTE })
          .to(trazos, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.08 }, '-=0.2');
      });
    },
  });

  finales.push(() => {
    insignias.forEach((ins) => {
      gsap.killTweensOf([ins, ...ins.querySelectorAll('svg *')]);
      terminar(ins);
    });
  });
}

// ---------------------------------------------------------------------------
// 4. Pin de Ubicacion: cae 24 px con rebote y deja la sombra (700 ms).
// ---------------------------------------------------------------------------
function pinUbicacion() {
  const pin = document.querySelector<SVGSVGElement>('[data-pin]');
  if (!pin || !bajoElPliegue(pin)) return;
  const cuerpo = pin.querySelectorAll(':scope > :not(ellipse)');
  const sombra = pin.querySelector(':scope > ellipse');

  const tl = gsap.timeline({ paused: true, onComplete: () => gsap.set([...cuerpo, sombra], { clearProps: PROPS }) });
  tl.from(cuerpo, { y: -24, opacity: 0, duration: 0.7, ease: 'back.out(2.2)' }).from(
    sombra,
    { scale: 0.3, opacity: 0, svgOrigin: '32 80', duration: 0.5, ease: SUAVE },
    0.25,
  );
  ScrollTrigger.create({ trigger: pin, start: 'top 85%', once: true, onEnter: () => tl.play() });
  finales.push(() => tl.progress(1).kill());
}

// ---------------------------------------------------------------------------
// 5. Efectos ligados al scroll (scrub). Se crean y se destruyen con la pausa.
//    - Footer: hojas con paralaje (profundidad 0.2).
//    - Categorias: giro tipo costal si el navegador no soporta
//      animation-timeline: view() (en Chrome ya lo hace el CSS).
// ---------------------------------------------------------------------------
let continuos: gsap.core.Tween[] = [];

function crearContinuos() {
  if (continuos.length || !movimientoPermitido()) return;

  const capa = document.querySelector<HTMLElement>('[data-capa="hojas-footer"]');
  const footer = capa?.closest('footer');
  if (capa && footer) {
    const p = Number(capa.dataset.profundidad) || 0.2;
    capa.querySelectorAll('svg').forEach((hoja, i) => {
      continuos.push(
        gsap.fromTo(
          hoja,
          { y: 120 * p * (i % 2 ? 1 : 1.5) },
          {
            y: -120 * p * (i % 2 ? 1 : 1.5),
            ease: 'none',
            scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: true },
          },
        ),
      );
    });
  }

  // Respaldo GSAP solo si el giro CSS (animation-timeline: view()) NO se
  // esta aplicando de verdad: se mira el estilo calculado, no CSS.supports,
  // para que la deteccion coincida con lo que el navegador ejecuta.
  const tarjetas = gsap.utils.toArray<HTMLElement>('.tarjeta-categoria');
  const giroCss = tarjetas[0] && getComputedStyle(tarjetas[0]).animationName === 'girar-costal';
  if (!giroCss && mqEscritorio.matches) {
    tarjetas.forEach((tarjeta, i) => {
      continuos.push(
        gsap.fromTo(
          tarjeta,
          { rotationY: i % 2 ? 14 : -14, y: 24, transformPerspective: 900 },
          {
            rotationY: 0,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: tarjeta, start: 'top bottom', end: 'top 65%', scrub: 0.6 },
          },
        ),
      );
    });
  }
}

function destruirContinuos() {
  continuos.forEach((t) => {
    t.scrollTrigger?.kill();
    t.kill();
    gsap.set(t.targets(), { clearProps: PROPS });
  });
  continuos = [];
}

// ---------------------------------------------------------------------------
// 6. Lenis (scroll suave): solo escritorio, puntero fino y sin reduced
//    motion. Las anclas las gestiona este modulo para que el foco llegue al
//    destino (incluido "Saltar al contenido") y se respete scroll-margin-top.
// ---------------------------------------------------------------------------
let lenis: Lenis | null = null;
let cargandoLenis = false;
const tic = (t: number) => lenis?.raf(t * 1000);

async function activarLenis() {
  if (lenis || cargandoLenis) return;
  if (!movimientoPermitido() || !mqPunteroFino.matches || !mqEscritorio.matches) return;
  cargandoLenis = true;
  try {
    const { default: LenisClase } = await import('lenis');
    if (!movimientoPermitido()) return; // se pauso mientras cargaba
    lenis = new LenisClase({ lerp: 0.12, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tic);
  } catch {
    lenis = null; // sin Lenis: scroll nativo
  } finally {
    cargandoLenis = false;
  }
}

function quitarClasesLenis() {
  if (lenis) return;
  Array.from(html.classList)
    .filter((c) => c === 'lenis' || c.startsWith('lenis-'))
    .forEach((c) => html.classList.remove(c));
}

function desactivarLenis() {
  if (!lenis) return;
  gsap.ticker.remove(tic);
  lenis.destroy();
  lenis = null;
  // Lenis deja un temporizador tras un scroll nativo que, aun destruido,
  // vuelve a poner sus clases en <html>: limpiarlas cuando ya ha vencido.
  window.setTimeout(quitarClasesLenis, 600);
}

/** Enfoca el destino de un ancla como lo haria el navegador. */
function enfocar(destino: HTMLElement) {
  const enfocable = destino.matches('a[href], button, input, select, textarea, [tabindex]');
  if (!enfocable) {
    destino.setAttribute('tabindex', '-1');
    destino.classList.add('foco-ancla');
    destino.addEventListener(
      'blur',
      () => {
        destino.removeAttribute('tabindex');
        destino.classList.remove('foco-ancla');
      },
      { once: true },
    );
  }
  destino.focus({ preventScroll: true });
}

function alPulsarAncla(ev: MouseEvent) {
  if (!lenis || ev.defaultPrevented || ev.button !== 0) return;
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const enlace = (ev.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!enlace || enlace.target) return;
  const id = decodeURIComponent(enlace.hash.slice(1));
  const destino = id ? document.getElementById(id) : null;
  if (!destino) return;

  ev.preventDefault();
  // "Ver productos" de una categoria filtra el catalogo antes de llegar
  // aqui (su listener va en el propio enlace): la pagina cambio de alto,
  // asi que se recalculan Lenis y ScrollTrigger ANTES de desplazar.
  if (enlace.hasAttribute('data-ver-categoria')) {
    ScrollTrigger.refresh();
    lenis.resize();
  }
  // Lenis lee scroll-margin-top del destino (compensa el header fijo).
  enfocar(destino);
  lenis.scrollTo(destino, { duration: 1, easing: (t) => 1 - (1 - t) ** 4 });
  if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
}

// Recalculo diferido tras filtrar el catalogo (INP): fuera del fotograma de
// la interaccion, con debounce (varios clics seguidos = un solo refresh) y en
// idle. Mientras tanto, las tarjetas recien mostradas siguen visibles o se
// revelan en cuanto el refresh dispara sus triggers.
let temporizadorRefresco = 0;
function refrescarDiferido() {
  window.clearTimeout(temporizadorRefresco);
  temporizadorRefresco = window.setTimeout(() => {
    const hacer = () => {
      ScrollTrigger.refresh();
      lenis?.resize();
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(hacer, { timeout: 600 });
    else hacer();
  }, 150);
}

// ---------------------------------------------------------------------------
export function iniciarScroll(): void {
  if (!movimientoPermitido()) return;
  html.classList.add('gsap-listo');

  try {
    apariciones();
    contadores();
    iconos();
    pinUbicacion();
    crearContinuos();
  } catch (error) {
    // Ante cualquier fallo, todo queda visible.
    finales.forEach((f) => f());
    destruirContinuos();
    html.classList.remove('gsap-listo');
    throw error;
  }

  activarLenis();
  document.addEventListener('click', alPulsarAncla);

  // El filtro del catalogo muestra u oculta grupos: recalcular posiciones
  // en diferido (refrescarDiferido). (Con Lenis, los enlaces de categoria ya se recalculan en alPulsarAncla;
  // repetirlo a mitad del desplazamiento lo cortaria.)
  // Sin Lenis, el enlace de categoria usa el ancla nativa: se recalcula de
  // forma sincrona, antes de que el navegador empiece a desplazar (un
  // refresh a mitad del scroll suave nativo lo interrumpe).
  document.addEventListener('click', (ev) => {
    const el = (ev.target as Element | null)?.closest('[data-filtro], [data-ver-categoria]');
    if (!el) return;
    if (el.hasAttribute('data-ver-categoria')) {
      if (!lenis) ScrollTrigger.refresh();
      return;
    }
    refrescarDiferido();
  });

  // content-visibility:auto en los grupos del catalogo cambia la altura real
  // de la pagina mientras se recorre (el alto estimado pasa a ser el real):
  // sin recalcular, los triggers de las secciones de debajo quedan desfasados
  // y su contenido no llega a revelarse. Solo cambios de alto, en diferido.
  const principal = document.querySelector('main');
  if (principal && 'ResizeObserver' in window) {
    let altoPrevio = principal.offsetHeight;
    new ResizeObserver(() => {
      const alto = principal.offsetHeight;
      if (Math.abs(alto - altoPrevio) < 2) return;
      altoPrevio = alto;
      refrescarDiferido();
    }).observe(principal);
  }

  const alCambiarTamano = () => {
    if (mqEscritorio.matches && mqPunteroFino.matches) activarLenis();
    else desactivarLenis();
  };
  mqEscritorio.addEventListener('change', alCambiarTamano);
  mqPunteroFino.addEventListener('change', alCambiarTamano);

  alCambiarMovimiento((permitido) => {
    if (permitido) {
      crearContinuos();
      activarLenis();
      ScrollTrigger.refresh();
    } else {
      // Pausa o reduced motion: todo a su estado final, sin scroll suave.
      finales.splice(0).forEach((f) => f());
      destruirContinuos();
      desactivarLenis();
      if (mqReducido.matches) html.classList.remove('gsap-listo');
    }
  });
}
