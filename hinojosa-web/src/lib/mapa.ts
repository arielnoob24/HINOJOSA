// Mapa de Visitanos (Leaflet + OpenStreetMap), con carga diferida: Leaflet
// y su CSS se descargan solo la primera vez que se entra en #visitanos, y
// solo si hay coordenadas confirmadas (data-lat / data-lng no vacios).
// Sin coordenadas se queda el marcador de posicion, que ya dice que la
// direccion en texto esta en la tarjeta (el mapa nunca es el unico camino).
//
// Animaciones (todas se omiten con prefers-reduced-motion):
//   - vuelo de entrada: de una vista amplia de Tena hasta la calle (flyTo)
//   - el pin cae con rebote (global.css, entradas.ts) y emite un pulso
//   - la etiqueta con nombre y direccion sube al terminar el vuelo
//   - boton "Volver al local": vuelo de regreso tras explorar el mapa
//
// Ganchos: [data-mapa] (data-lat, data-lng, data-zoom, data-nombre,
// data-direccion, data-texto-recentrar, data-texto-terminal),
// [data-mapa-estado]. El contenedor lleva data-captura-flechas: con el foco
// en el mapa, las flechas lo desplazan y el router no cambia de vista.
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

function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
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

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const zoomFinal = Number(contenedor.dataset.zoom) || 18;
    const escritorio = () => window.matchMedia('(min-width: 48rem)').matches;
    const pos: [number, number] = [lat, lng];

    const mapa = L.map(lienzo, {
      center: pos,
      zoom: zoomFinal,
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

    // Centro del encuadre: en escritorio la tarjeta tapa la mitad izquierda,
    // asi que el local se coloca a la derecha (el centro se corre a la izquierda).
    const centroPara = (zoom: number): L.LatLng => {
      const p = mapa.project(pos, zoom);
      return mapa.unproject(escritorio() ? p.subtract([200, 0]) : p, zoom);
    };
    mapa.setView(centroPara(zoomFinal), zoomFinal, { animate: false });

    const pin = L.divIcon({
      className: 'mapa-pin',
      html:
        '<span class="mapa-pulso" aria-hidden="true"></span><span class="mapa-pulso mapa-pulso-2" aria-hidden="true"></span>' +
        '<svg class="mapa-pin-svg" viewBox="0 0 64 84" width="44" height="58" aria-hidden="true"><path d="M32 80S6 52 6 31a26 26 0 0 1 52 0c0 21-26 49-26 49z" fill="#1b4d2b"/><circle cx="32" cy="31" r="17" fill="#fff" stroke="#f2b823" stroke-width="4"/><path d="M26 22v18M38 22v18M26 31h12" stroke="#1b4d2b" stroke-width="5" stroke-linecap="round"/></svg>',
      iconSize: [44, 58],
      iconAnchor: [22, 58],
    });
    const marcador = L.marker(pos, { icon: pin, keyboard: false, title: contenedor.dataset.nombre ?? '' }).addTo(mapa);

    // Etiqueta con nombre y direccion: aparece al terminar el vuelo
    const direccion = contenedor.dataset.direccion ?? '';
    marcador.bindTooltip(
      `<strong>${escapar(contenedor.dataset.nombre ?? '')}</strong>${direccion ? `<span>${escapar(direccion)}</span>` : ''}`,
      { permanent: true, direction: 'top', offset: [0, -54], className: 'mapa-etiqueta' },
    );
    const mostrarEtiqueta = () => marcador.getTooltip()?.getElement()?.classList.add('mapa-etiqueta-visible');

    // Punto de referencia: Terminal Terrestre de Tena (coordenadas de OpenStreetMap)
    L.marker([-0.99912, -77.81241], {
      icon: L.divIcon({ className: 'mapa-ref', html: '<span class="mapa-ref-punto"></span>', iconSize: [14, 14], iconAnchor: [7, 7] }),
      keyboard: false,
      interactive: false,
    })
      .addTo(mapa)
      .bindTooltip(contenedor.dataset.textoTerminal ?? 'Terminal Terrestre', {
        permanent: true,
        direction: 'right',
        offset: [8, 0],
        className: 'mapa-ref-etiqueta',
      });

    // Boton "Volver al local": vuelo suave de regreso
    const Recentrar = L.Control.extend({
      onAdd() {
        const boton = L.DomUtil.create('button', 'mapa-recentrar') as HTMLButtonElement;
        boton.type = 'button';
        boton.textContent = contenedor.dataset.textoRecentrar ?? 'Volver al local';
        L.DomEvent.disableClickPropagation(boton);
        L.DomEvent.on(boton, 'click', () => {
          if (reducido) mapa.setView(centroPara(zoomFinal), zoomFinal, { animate: false });
          else mapa.flyTo(centroPara(zoomFinal), zoomFinal, { duration: 1.4 });
        });
        return boton;
      },
    });
    new Recentrar({ position: 'bottomright' }).addTo(mapa);

    // Entrada: vista amplia de Tena y vuelo hasta la calle
    if (reducido) {
      mostrarEtiqueta();
    } else {
      const zInicial = 15;
      mapa.setView(centroPara(zInicial), zInicial, { animate: false });
      setTimeout(mostrarEtiqueta, 450 + 2400 + 100); // fin del vuelo
      setTimeout(() => mapa.flyTo(centroPara(zoomFinal), zoomFinal, { duration: 2.4, easeLinearity: 0.2 }), 450);
    }

    contenedor.setAttribute('data-mapa-listo', '');
    contenedor.querySelector('[data-mapa-vacio]')?.setAttribute('hidden', '');
  } catch {
    if (estado) estado.hidden = false;
  }
}

if (contenedor) alEntrarEnVista('visitanos', () => void cargar(), { unaVez: true });
