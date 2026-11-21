// Mapa de Visitanos (Leaflet + OpenStreetMap), con carga diferida: Leaflet
// y su CSS se descargan solo la primera vez que se entra en #visitanos, y
// solo si hay coordenadas confirmadas (data-lat / data-lng no vacios).
// Sin coordenadas se queda el marcador de posicion, que ya dice que la
// direccion en texto esta en la tarjeta (el mapa nunca es el unico camino).
//
// Animaciones (todas se omiten con prefers-reduced-motion):
//   - vuelo de entrada: de una vista amplia de Tena hasta la calle (flyTo)
//   - Canela (sprite de carrera) corre por la Av. del Chofer desde la 15 de
//     Noviembre hasta el local, dibujando la ruta, y se sienta con un globo
//   - el pin cae con rebote (global.css, entradas.ts) y emite un pulso
//   - la etiqueta con nombre y direccion sube cuando Canela llega
//   - boton "Volver al local": vuelo de regreso tras explorar el mapa
//
// Ganchos: [data-mapa] (data-lat, data-lng, data-zoom, data-nombre,
// data-direccion, data-texto-recentrar, data-texto-inicio, data-texto-saludo, data-texto-llegada),
// [data-mapa-estado]. El contenedor lleva data-captura-flechas: con el foco
// en el mapa, las flechas lo desplazan y el router no cambia de vista.
import { alEntrarEnVista } from './router';
import { ruta as urlRuta } from './ruta';
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
    const zoomFinal = Number(contenedor.dataset.zoom) || 19;
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

    // Encuadre: el mapa ya es un cuadro propio (la tarjeta no lo tapa), asi
    // que el local va al centro; se desplaza un poco para dejar sitio a la
    // etiqueta (izquierda) y a Canela con su globo (arriba a la derecha).
    const centroPara = (zoom: number): L.LatLng => mapa.unproject(mapa.project(pos, zoom).add([40, contenedor.clientWidth < 600 ? -55 : -30]), zoom);
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

    // Etiqueta con nombre y direccion, a la izquierda del pin (Canela se sienta a la derecha)
    const direccion = contenedor.dataset.direccion ?? '';
    // Cuadro estrecho (movil): sin etiqueta, la direccion esta en la tarjeta de abajo
    if (contenedor.clientWidth >= 600) {
      marcador.bindTooltip(
        `<strong>${escapar(contenedor.dataset.nombre ?? '')}</strong>${direccion ? `<span>${escapar(direccion)}</span>` : ''}`,
        { permanent: true, direction: 'left', offset: [-20, -30], className: 'mapa-etiqueta' },
      );
    }
    const mostrarEtiqueta = () => marcador.getTooltip()?.getElement()?.classList.add('mapa-etiqueta-visible');

    // ---- Ruta y guia: Canela corre desde la Av. 15 de Noviembre hasta el local ----
    // Puntos medidos sobre el mapa a zoom 19 (~0,3 m/px) respecto al pin.
    const PX = 2.68e-6; // grados por pixel a zoom 19 en Tena
    const desde = (dx: number, dy: number): [number, number] => [lat - dy * PX, lng + dx * PX];
    const recorrido: [number, number][] = [desde(122, -26), desde(80, -20), desde(46, -14)]; // inicio, medio, parada
    const inicio = recorrido[0];
    const parada = recorrido[recorrido.length - 1];

    L.marker(inicio, {
      icon: L.divIcon({ className: 'mapa-ref', html: '<span class="mapa-ref-punto"></span>', iconSize: [14, 14], iconAnchor: [7, 7] }),
      keyboard: false,
      interactive: false,
    })
      .addTo(mapa)
      .bindTooltip(contenedor.dataset.textoInicio ?? 'Av. 15 de Noviembre', {
        permanent: true,
        direction: 'bottom',
        offset: [0, 8],
        className: 'mapa-ref-etiqueta',
      });

    const linea = L.polyline([], {
      color: '#1b4d2b',
      weight: 5,
      opacity: 0.85,
      dashArray: '1 10',
      lineCap: 'round',
      className: 'mapa-ruta',
    }).addTo(mapa);

    const urlCorre = urlRuta('/img/canela/carrera-izq.webp');
    const urlSienta = urlRuta('/img/canela/canela-franja.webp');
    const guia = L.marker(inicio, {
      icon: L.divIcon({
        className: 'mapa-canela',
        html:
          `<span class="mapa-canela-corre" style="background-image:url(${urlCorre})"></span>` +
          `<img class="mapa-canela-sienta" src="${urlSienta}" width="60" height="78" alt="" decoding="async" />` +
          '<span class="mapa-canela-globo" aria-hidden="true"></span>',
        iconSize: [97, 80],
        iconAnchor: [48, 76],
      }),
      keyboard: false,
      interactive: false,
      zIndexOffset: 500,
    }).addTo(mapa);

    // Globo de Canela: breve y que se retira solo (no estorba el mapa)
    let temporizador = 0;
    const decir = (texto: string, ms: number) => {
      const globo = guia.getElement()?.querySelector<HTMLElement>('.mapa-canela-globo');
      if (!globo) return;
      globo.textContent = texto;
      globo.classList.add('mapa-canela-globo-visible');
      clearTimeout(temporizador);
      temporizador = window.setTimeout(() => globo.classList.remove('mapa-canela-globo-visible'), ms);
    };
    const el = () => guia.getElement();
    const textoSaludo = contenedor.dataset.textoSaludo ?? '';
    const textoLlegada = contenedor.dataset.textoLlegada ?? '';
    if (contenedor.clientWidth < 600) el()?.classList.add('mapa-canela-estrecho');

    const llegada = () => {
      el()?.classList.remove('mapa-canela-en-marcha');
      el()?.classList.add('mapa-canela-sentada');
      mostrarEtiqueta();
      decir(textoLlegada, 4200);
    };
    const correr = () => {
      el()?.classList.remove('mapa-canela-sentada');
      el()?.classList.add('mapa-canela-en-marcha');
      const duracion = 3400;
      const t0 = performance.now();
      const tramos = recorrido.slice(1).map((p, i) => ({ a: recorrido[i], b: p }));
      const paso = (ahora: number) => {
        const k = Math.min(1, (ahora - t0) / duracion);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease-in-out
        const f = e * tramos.length;
        const i = Math.min(tramos.length - 1, Math.floor(f));
        const u = f - i;
        const { a, b } = tramos[i];
        const actual: [number, number] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
        guia.setLatLng(actual);
        linea.setLatLngs([...recorrido.slice(0, i + 1), actual]);
        if (k < 1) requestAnimationFrame(paso);
        else llegada();
      };
      requestAnimationFrame(paso);
    };

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

    // Entrada: vista amplia de Tena, vuelo hasta la calle y Canela guia al local
    if (reducido) {
      guia.setLatLng(parada);
      linea.setLatLngs(recorrido);
      llegada();
    } else {
      const zInicial = 16;
      mapa.setView(centroPara(zInicial), zInicial, { animate: false });
      setTimeout(() => mapa.flyTo(centroPara(zoomFinal), zoomFinal, { duration: 2.2, easeLinearity: 0.2 }), 450);
      // Al terminar el vuelo Canela saluda (sentada, en la 15 de Noviembre) y despues corre
      const tSaludo = 450 + 2200 + 200;
      const msSaludo = 2800;
      setTimeout(() => {
        el()?.classList.add('mapa-canela-sentada');
        decir(textoSaludo, msSaludo);
      }, tSaludo);
      setTimeout(correr, tSaludo + msSaludo + 300);
    }

    contenedor.setAttribute('data-mapa-listo', '');
    contenedor.querySelector('[data-mapa-vacio]')?.setAttribute('hidden', '');
  } catch {
    if (estado) estado.hidden = false;
  }
}

if (contenedor) alEntrarEnVista('visitanos', () => void cargar(), { unaVez: true });
