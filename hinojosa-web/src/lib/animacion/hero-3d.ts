// Hero 3D (fase 4): granos de maiz, pellets y hojas flotando detras de la
// insignia de Canela (que sigue siendo una imagen). Particulas instanciadas
// con geometria simple: 3 draw calls, sin texturas ni modelos .glb.
//
// - Se carga diferido (arranque.ts) y solo si hay WebGL, >= 768 px, no es
//   gama baja y el usuario acepta movimiento.
// - Render solo si: el hero es visible, la pestana esta visible y las
//   animaciones no estan pausadas (boton o prefers-reduced-motion).
// - devicePixelRatio limitado a 1.5.
// - Si se pierde el contexto WebGL, se quita el canvas y vuelven los granos CSS.
import {
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  HemisphereLight,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  WebGLRenderer,
  type BufferGeometry,
} from 'three';
import { alCambiarMovimiento, html, movimientoPermitido, mqPunteroFino } from './entorno';

const DPR_MAX = 1.5;
const FOV = 35;
const CAMARA_Z = 12;
const TAN_MITAD_FOV = Math.tan(((FOV / 2) * Math.PI) / 180);
const CAIDA = 1.2; // s que tarda cada grano en asentarse (storyboard: caen desde arriba)

// Paleta de marca (src/styles/global.css)
const C = {
  maiz: '#f2b823',
  maizOscuro: '#d99e0f',
  canela: '#c98a3a',
  canelaOscuro: '#8a5a1f',
  hoja: '#7bbf3a',
  marca: '#2e8b2e',
};

interface Particula {
  u: number; // posicion normalizada en pantalla (-1 a 1)
  v: number;
  z: number; // profundidad (unidades de mundo)
  fase: number;
  vel: number;
  rx: number;
  ry: number;
  rz: number;
  wx: number; // velocidad de giro
  wy: number;
  escala: number;
  retraso: number;
}

/** Aleatorio con semilla: la composicion es igual en cada visita. */
function azarConSemilla(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// El canvas mide 150 % x 135 % del hueco de Canela (ver .hero-3d-lienzo en
// global.css). Hueco central donde esta la insignia, en coordenadas -1..1:
const HUECO = { u: -0.13, v: -0.04, ru: 0.3, rv: 0.34 };

function crearParticulas(n: number, azar: () => number, escala: [number, number], z: [number, number]) {
  const lista: Particula[] = [];
  let intentos = 0;
  while (lista.length < n && intentos < n * 40) {
    intentos++;
    const u = azar() * 2 - 1;
    const v = azar() * 2 - 1;
    // No gastar particulas detras de la insignia (no se verian).
    if (((u - HUECO.u) / HUECO.ru) ** 2 + ((v - HUECO.v) / HUECO.rv) ** 2 < 1) continue;
    lista.push({
      u: u * 0.94,
      v: v * 0.92,
      z: z[0] + azar() * (z[1] - z[0]),
      fase: azar() * Math.PI * 2,
      vel: 0.35 + azar() * 0.45,
      rx: azar() * Math.PI * 2,
      ry: azar() * Math.PI * 2,
      rz: azar() * Math.PI * 2,
      wx: (azar() - 0.5) * 0.6,
      wy: (azar() - 0.5) * 0.8,
      escala: escala[0] + azar() * (escala[1] - escala[0]),
      retraso: 0.05 + lista.length * 0.03 + azar() * 0.25,
    });
  }
  return lista;
}

/** Grano de maiz: esfera achatada, mas ancha arriba que abajo. */
function geometriaGrano(): BufferGeometry {
  const g = new SphereGeometry(0.16, 12, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const ancho = 0.72 + 0.28 * ((y / 0.16 + 1) / 2);
    p.setXYZ(i, p.getX(i) * ancho * 0.9, y * 1.15, p.getZ(i) * ancho * 0.55);
  }
  g.computeVertexNormals();
  return g;
}

/** Hoja como la del logo: dos curvas. */
function geometriaHoja(): BufferGeometry {
  const s = new Shape();
  s.moveTo(0, -0.22);
  s.quadraticCurveTo(0.2, -0.02, 0, 0.26);
  s.quadraticCurveTo(-0.2, -0.02, 0, -0.22);
  return new ShapeGeometry(s, 6);
}

export function iniciarHero3D(hero: HTMLElement, hueco: HTMLElement): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-3d-lienzo';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.hero3d = '';

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return; // Sin WebGL real: se quedan los granos CSS.
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_MAX));
  renderer.setClearColor(0x000000, 0);

  // Detras de la insignia y delante del halo.
  const halo = hueco.firstElementChild;
  if (halo) halo.after(canvas);
  else hueco.prepend(canvas);

  const escena = new Scene();
  const camara = new PerspectiveCamera(FOV, 1, 0.1, 40);
  camara.position.set(0, 0, CAMARA_Z);

  escena.add(new HemisphereLight(0xfff8e6, 0xb88a4a, 1.9));
  const sol = new DirectionalLight(0xffffff, 1.6);
  sol.position.set(4, 6, 8);
  escena.add(sol);

  const azar = azarConSemilla(20250611);
  const grupos: { malla: InstancedMesh; datos: Particula[] }[] = [];

  const agregar = (
    geometria: BufferGeometry,
    datos: Particula[],
    colores: string[],
    dobleCara = false,
  ) => {
    const material = new MeshLambertMaterial({ color: 0xffffff, side: dobleCara ? DoubleSide : FrontSide });
    const malla = new InstancedMesh(geometria, material, datos.length);
    const color = new Color();
    datos.forEach((_, i) => malla.setColorAt(i, color.set(colores[Math.floor(azar() * colores.length)])));
    malla.frustumCulled = false;
    escena.add(malla);
    grupos.push({ malla, datos });
  };

  // Granos de maiz (oro, con algunos mas tostados), pellets y hojas.
  agregar(geometriaGrano(), crearParticulas(40, azar, [0.7, 1.25], [-4, 3]), [C.maiz, C.maiz, C.maiz, C.maizOscuro, C.canela]);
  agregar(new CylinderGeometry(0.075, 0.075, 0.22, 10), crearParticulas(18, azar, [0.7, 1.1], [-3, 2.5]), [C.canelaOscuro, C.canela]);
  agregar(geometriaHoja(), crearParticulas(7, azar, [0.8, 1.3], [-2, 2]), [C.hoja, C.marca], true);

  const muneco = new Object3D();
  const objetivo = { x: 0, y: 0 };
  let tiempo = 0;
  let ultimo = 0;
  let cuadros = 0;
  let corriendo = false;
  let visible = true;
  let mostrado = false;
  let perdido = false;

  const ajustarTamano = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };

  const dibujar = (dt: number) => {
    tiempo += dt;

    // Paralaje del puntero: la camara se desplaza y mira al centro, asi
    // los granos cercanos se mueven mas que los lejanos (lerp 0.06).
    camara.position.x += (objetivo.x * 0.8 - camara.position.x) * 0.06;
    camara.position.y += (-objetivo.y * 0.55 - camara.position.y) * 0.06;
    camara.lookAt(0, 0, 0);

    for (const { malla, datos } of grupos) {
      for (let i = 0; i < datos.length; i++) {
        const p = datos[i];
        const mitadAlto = (CAMARA_Z - p.z) * TAN_MITAD_FOV;
        const mitadAncho = mitadAlto * camara.aspect;
        // Entrada: cae desde arriba y se asienta (ease-out cubico).
        const k = Math.min(1, Math.max(0, (tiempo - p.retraso) / CAIDA));
        const e = 1 - (1 - k) ** 3;
        const flota = Math.sin(tiempo * p.vel + p.fase);
        muneco.position.set(
          p.u * mitadAncho + Math.sin(tiempo * p.vel * 0.6 + p.fase) * 0.06,
          p.v * mitadAlto + flota * 0.14 + (1 - e) * 2.6,
          p.z,
        );
        muneco.rotation.set(p.rx + tiempo * p.wx, p.ry + tiempo * p.wy, p.rz + flota * 0.12);
        muneco.scale.setScalar(p.escala * e);
        muneco.updateMatrix();
        malla.setMatrixAt(i, muneco.matrix);
      }
      malla.instanceMatrix.needsUpdate = true;
    }

    renderer.render(escena, camara);
    cuadros++;
    (canvas as HTMLCanvasElement & { cuadros?: number }).cuadros = cuadros;

    if (!mostrado) {
      mostrado = true;
      // Fundido del canvas y fuera los granos CSS (que duplicarian la escena).
      requestAnimationFrame(() => {
        canvas.classList.add('visible');
        html.classList.add('hero-3d');
      });
    }
  };

  const bucle = (ahora: number) => {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    dibujar(dt);
  };

  const actualizar = () => {
    const debe = !perdido && visible && !document.hidden && movimientoPermitido();
    if (debe && !corriendo) {
      corriendo = true;
      ultimo = performance.now();
      renderer.setAnimationLoop(bucle);
    } else if (!debe && corriendo) {
      corriendo = false;
      renderer.setAnimationLoop(null);
    }
  };

  ajustarTamano();
  new ResizeObserver(() => {
    ajustarTamano();
    if (!corriendo && mostrado) renderer.render(escena, camara);
  }).observe(canvas);

  new IntersectionObserver((entradas) => {
    visible = entradas.some((e) => e.isIntersecting);
    actualizar();
  }).observe(hero);

  document.addEventListener('visibilitychange', actualizar);
  alCambiarMovimiento(actualizar);

  if (mqPunteroFino.matches) {
    hero.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return;
      const r = hero.getBoundingClientRect();
      objetivo.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      objetivo.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => {
      objetivo.x = 0;
      objetivo.y = 0;
    });
  }

  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    renderer.setAnimationLoop(null);
    corriendo = false;
    perdido = true;
    html.classList.remove('hero-3d');
    canvas.remove();
  });

  actualizar();
}
