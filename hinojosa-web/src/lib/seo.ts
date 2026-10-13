// SEO local (PLAN.md, seccion 5): datos estructurados y URLs absolutas.
// Regla: solo se publica lo confirmado en negocio.json (datoConfirmado).
// Sin dominio (Astro.site sin definir) no hay URL absoluta posible, asi que
// se omiten url, image y logo del JSON-LD (y canonical/og:url/og:image en el
// <head>). Al definir `site` en astro.config.mjs aparecen solos.
import { negocio, datoConfirmado } from './negocio';

export const IMAGEN_SOCIAL = {
  ruta: '/og-imagen.jpg',
  width: 1200,
  height: 630,
  alt: `Logo de ${negocio.nombre}: ${negocio.eslogan}`,
};

const LOGO = '/img/marca/logo.png';

/** URL absoluta a partir de `site`, o null si todavia no hay dominio. */
export function urlAbsoluta(ruta: string, site: URL | undefined): string | null {
  return site ? new URL(ruta, site).href : null;
}

/** "es_EC" solo si el pais confirmado es Ecuador; si no, "es". */
export function localeOg(): string {
  const pais = datoConfirmado('pais');
  return pais && /^ecuador$/i.test(pais.trim()) ? 'es_EC' : 'es';
}

// openingHours de schema.org: "Mo-Fr 08:00-18:00", "Sa 08:00-13:00"...
// El horario de negocio.json es texto para personas; solo se publica en el
// JSON-LD si ya viene en ese formato (separar tramos con ";" o ",").
const TRAMO_HORARIO = /^(Mo|Tu|We|Th|Fr|Sa|Su)([-,](Mo|Tu|We|Th|Fr|Sa|Su))* \d{2}:\d{2}-\d{2}:\d{2}$/;

function horarioSchema(): string[] | null {
  const horario = datoConfirmado('horario');
  if (!horario) return null;
  const tramos = horario.split(/\s*[;,]\s*(?=(?:Mo|Tu|We|Th|Fr|Sa|Su))/).map((s) => s.trim());
  return tramos.every((s) => TRAMO_HORARIO.test(s)) ? tramos : null;
}

/** Coordenadas sacadas del enlace confirmado de Google Maps (".../@lat,lng,..."). */
function coordenadas(): { latitude: number; longitude: number } | null {
  const mapa = datoConfirmado('googleMaps');
  const m = mapa?.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  return m ? { latitude: Number(m[1]), longitude: Number(m[2]) } : null;
}

/** Objeto JSON-LD del negocio (PetStore). */
export function datosEstructurados(site: URL | undefined, descripcion: string): Record<string, unknown> {
  const direccion = datoConfirmado('direccion');
  const ciudad = datoConfirmado('ciudad');
  const pais = datoConfirmado('pais');
  const telefono = datoConfirmado('telefono');
  const facebook = datoConfirmado('facebook');
  const mapa = datoConfirmado('googleMaps');
  const horario = horarioSchema();
  const geo = coordenadas();

  const url = urlAbsoluta('/', site);
  const imagen = urlAbsoluta(IMAGEN_SOCIAL.ruta, site);
  const logo = urlAbsoluta(LOGO, site);

  return {
    '@context': 'https://schema.org',
    '@type': 'PetStore',
    name: negocio.nombre,
    slogan: negocio.eslogan,
    description: descripcion,
    currenciesAccepted: negocio.moneda.codigo,
    ...(url ? { url, '@id': `${url}#negocio` } : {}),
    ...(imagen ? { image: imagen } : {}),
    ...(logo ? { logo } : {}),
    ...(direccion
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: direccion,
            ...(ciudad ? { addressLocality: ciudad } : {}),
            ...(pais ? { addressCountry: pais } : {}),
          },
        }
      : {}),
    ...(geo ? { geo: { '@type': 'GeoCoordinates', ...geo } } : {}),
    ...(mapa ? { hasMap: mapa } : {}),
    ...(telefono ? { telephone: telefono } : {}),
    ...(horario ? { openingHours: horario.length === 1 ? horario[0] : horario } : {}),
    ...(facebook ? { sameAs: [facebook] } : {}),
  };
}

/** JSON listo para incrustar en <script>: "<" escapado para no cerrar la etiqueta. */
export function jsonLd(datos: Record<string, unknown>): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
