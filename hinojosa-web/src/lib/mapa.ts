// Mapa de Visitanos (Leaflet + OpenStreetMap), con carga diferida: Leaflet
// y su CSS se descargan solo la primera vez que se entra en #visitanos, y
// solo si hay coordenadas confirmadas (data-lat / data-lng no vacios).
// Sin coordenadas se queda el marcador de posicion, que ya dice que la
// direccion en texto esta en la tarjeta (el mapa nunca es el unico camino).
//
// Ganchos: [data-mapa] (data-lat, data-lng, data-zoom), [data-mapa-estado].
// El contenedor lleva data-captura-flechas: con el foco en el mapa, las
// flechas lo desplazan y el router no cambia de vista.
import { alEntrarEnVista } from './router';
// ?url: Vite emite leaflet.css como archivo aparte (con inlineStylesheets
// 'always', un import() de CSS se quedaba sin archivo en dist/).
import urlCssLeaflet from 'leaflet/dist/leaflet.css?url';

function cargarCss(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('css'));
    document.head.append(link);
  });
}

const contenedor = document.querySelector<HTMLElement>('[data-mapa]');

async function cargar() {
  if (!contenedor) return;
  const lat = parseFloat(contenedor.dataset.lat ?? '');
  const lng = parseFloat(contenedor.dataset.lng ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const estado = document.querySelector<HTMLElement>('[data-mapa-estado]');
  try {
    const [{ default: L }] = await Promise.all([import('leaflet'), cargarCss(urlCssLeaflet)]);
    const lienzo = document.createElement('div');
    lienzo.className = 'mapa-lienzo';
    contenedor.append(lienzo);

    const mapa = L.map(lienzo, {
      center: [lat, lng],
      zoom: Number(contenedor.dataset.zoom) || 17,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false, // la rueda no debe "atrapar" la vista
    });
    L.control.zoom({ position: 'topright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(mapa);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(mapa);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);

    const pin = L.divIcon({
      className: 'mapa-pin',
      html: '<svg viewBox="0 0 64 84" width="44" height="58" aria-hidden="true"><path d="M32 80S6 52 6 31a26 26 0 0 1 52 0c0 21-26 49-26 49z" fill="#1b4d2b"/><circle cx="32" cy="31" r="17" fill="#fff" stroke="#f2b823" stroke-width="4"/><path d="M26 22v18M38 22v18M26 31h12" stroke="#1b4d2b" stroke-width="5" stroke-linecap="round"/></svg>',
      iconSize: [44, 58],
      iconAnchor: [22, 58],
    });
    L.marker([lat, lng], { icon: pin, keyboard: false, title: contenedor.dataset.nombre ?? '' }).addTo(mapa);

    // En escritorio la tarjeta tapa la mitad izquierda: el pin a la derecha
    if (window.matchMedia('(min-width: 48rem)').matches) mapa.panBy([-200, 0], { animate: false });

    contenedor.setAttribute('data-mapa-listo', '');
    contenedor.querySelector('[data-mapa-vacio]')?.setAttribute('hidden', '');
  } catch {
    if (estado) estado.hidden = false;
  }
}

if (contenedor) alEntrarEnVista('visitanos', () => void cargar(), { unaVez: true });
