// Disparador del panel de administracion (bloque 29c).
// Cuesta unos 300 bytes: solo cuenta clics en el logo. El panel (HTML, CSS y
// logica) se descarga con import() unicamente cuando se completa el gesto, asi
// que para el resto de visitantes no hay peso extra ni cambia el LCP.
// Los dos logos cuentan: el de la barra (siempre visible) y el de Inicio.
import { CLICS, VENTANA_MS } from './config';

const LOGOS = '.barra-logo, [data-logo-inicio]';
let marcas: number[] = [];

document.addEventListener('click', (ev) => {
  const origen = (ev.target as Element | null)?.closest?.(LOGOS) as HTMLElement | null;
  if (!origen) return;
  const ahora = performance.now();
  marcas = marcas.filter((m) => ahora - m < VENTANA_MS);
  marcas.push(ahora);
  if (marcas.length < CLICS) return;
  marcas = [];
  import('./panel').then((m) => m.abrirPanel(origen)).catch(() => {});
});
