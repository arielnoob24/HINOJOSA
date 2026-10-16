// SEO local (PLAN.md, secciones 6 y 12 riesgo 4): metadatos, URL canonica
// unica y datos estructurados (JSON-LD). Documentado en docs/seo.md.
//
// Reglas:
//   - Una sola URL canonica: la portada. Los hashes (#productos...) son
//     vistas de la misma pagina, no paginas: nunca llevan canonical propio
//     ni entran en el sitemap.
//   - Solo se publica lo confirmado en negocio.json (datoConfirmado y
//     companeros). Direccion, telefono, horario, geo, mapa y redes aparecen
//     SOLOS en el JSON-LD el dia que se marquen confirmado:true.
//   - Sin dominio (Astro.site sin definir) no hay URL absoluta posible: se
//     omiten canonical, og:url, og:image y en el JSON-LD url, @id, image,
//     logo y las imagenes de producto. Al definir `site` aparecen solos.
import {
  negocio,
  catalogo,
  datoConfirmado,
  telefonosConfirmados,
  horarioConfirmado,
  coordenadasConfirmadas,
  formatoPrecio,
} from './negocio';

export const IMAGEN_SOCIAL = {
  ruta: '/og-imagen.jpg',
  width: 1200,
  height: 630,
  alt: `Logo de ${negocio.nombre}: ${negocio.eslogan}`,
};

const LOGO = '/img/marca/logo.png';

const animales = negocio.animalesAtendidos.map((a) => a.toLowerCase());
const listaAnimales = `${animales.slice(0, -1).join(', ')} y ${animales.at(-1)}`;

/** <title> del negocio completo (no de la vista Inicio). El router usa la
 *  parte antes de " | " para titular las demas vistas. */
export const TITULO = `${negocio.nombre} | Balanceados y alimentos para animales`;

/** Meta description (140-160 caracteres; revisar si cambia la lista de animales). */
export const DESCRIPCION = `${negocio.nombre}: venta de balanceados, alimentos y productos para ${listaAnimales}. ${negocio.eslogan}.`;

/**
 * URL absoluta dentro del sitio, respetando `base` (por si se publica en
 * una subruta, p. ej. GitHub Pages de proyecto). Null si no hay `site`.
 */
export function urlAbsoluta(ruta: string, site: URL | undefined): string | null {
  if (!site) return null;
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return new URL(base + ruta.replace(/^\//, ''), site).href;
}

/** Canonical: siempre la portada, sea cual sea el hash o la ruta. */
export function urlCanonica(site: URL | undefined): string | null {
  return urlAbsoluta('/', site);
}

/** "es_EC" solo si el pais confirmado es Ecuador; si no, "es". */
export function localeOg(): string {
  const pais = datoConfirmado('pais');
  return pais && /^ecuador$/i.test(pais.trim()) ? 'es_EC' : 'es';
}

/** Texto alternativo de una imagen de producto: nombre + marca (si no esta ya en el nombre). */
export function altProducto(p: { nombre: string; marca: string | null }): string {
  const marca = p.marca?.trim();
  return marca && !p.nombre.toLowerCase().includes(marca.toLowerCase()) ? `${p.nombre}, de ${marca}` : p.nombre;
}

// ---------------------------------------------------------------------------
// Piezas del JSON-LD que dependen de datos confirmados
// ---------------------------------------------------------------------------

const DIAS_SCHEMA = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** openingHoursSpecification desde los tramos confirmados (1 = lunes ... 7 = domingo). */
function horarioSchema(): Record<string, unknown>[] | null {
  const h = horarioConfirmado();
  if (!h) return null;
  const tramos = h.tramos
    .map((t) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: t.dias.filter((d) => d >= 1 && d <= 7).map((d) => `https://schema.org/${DIAS_SCHEMA[d - 1]}`),
      opens: t.abre,
      closes: t.cierra,
    }))
    .filter((t) => t.dayOfWeek.length > 0);
  return tramos.length ? tramos : null;
}

/** addressCountry: codigo ISO si el pais confirmado es conocido; si no, el texto tal cual. */
function codigoPais(pais: string): string {
  return /^ecuador$/i.test(pais.trim()) ? 'EC' : pais;
}

function direccionSchema(): Record<string, unknown> | null {
  const calle = datoConfirmado('direccion');
  if (!calle) return null;
  const ciudad = datoConfirmado('ciudad');
  const pais = datoConfirmado('pais');
  return {
    '@type': 'PostalAddress',
    streetAddress: calle,
    ...(ciudad ? { addressLocality: ciudad } : {}),
    ...(pais ? { addressCountry: codigoPais(pais) } : {}),
  };
}

/**
 * Catalogo: un OfferCatalog por cada una de las 4 categorias, con sus
 * productos. Precio solo si existe en productos.json, siempre rotulado como
 * referencial; "desde" se publica como precio minimo. Sin disponibilidad,
 * sin valoraciones: no estan confirmadas.
 */
function catalogoSchema(site: URL | undefined): Record<string, unknown> {
  const categorias = catalogo.categorias.slice().sort((a, b) => a.orden - b.orden);
  const moneda = negocio.moneda.codigo;
  return {
    '@type': 'OfferCatalog',
    name: `Catálogo de ${negocio.nombre}`,
    description: catalogo.avisoPrecios,
    itemListElement: categorias.map((c) => ({
      '@type': 'OfferCatalog',
      name: c.nombre,
      itemListElement: catalogo.productos
        .filter((p) => p.categoria === c.id)
        .map((p) => {
          const imagen = p.imagen ? urlAbsoluta(p.imagen, site) : null;
          const producto = {
            '@type': 'Product',
            name: p.nombre,
            category: c.nombre,
            ...(p.marca ? { brand: { '@type': 'Brand', name: p.marca } } : {}),
            ...(p.presentacion ? { description: p.presentacion } : {}),
            ...(imagen ? { image: imagen } : {}),
          };
          const precio =
            typeof p.precio === 'number'
              ? {
                  description: `${formatoPrecio(p.precio, p.precioDesde)}. ${catalogo.avisoPrecios}`,
                  priceSpecification: {
                    '@type': 'PriceSpecification',
                    priceCurrency: moneda,
                    ...(p.precioDesde ? { minPrice: p.precio } : { price: p.precio }),
                  },
                }
              : {};
          return { '@type': 'Offer', itemOffered: producto, ...precio };
        }),
    })),
  };
}

/** Objeto JSON-LD (@graph): el negocio (PetStore) y, con dominio, el WebSite. */
export function datosEstructurados(site: URL | undefined): Record<string, unknown> {
  const telefonos = telefonosConfirmados();
  const correo = datoConfirmado('correo');
  const facebook = datoConfirmado('facebook');
  const mapa = datoConfirmado('googleMaps');
  const direccion = direccionSchema();
  const horario = horarioSchema();
  const geo = coordenadasConfirmadas();

  const url = urlCanonica(site);
  const imagen = urlAbsoluta(IMAGEN_SOCIAL.ruta, site);
  const logo = urlAbsoluta(LOGO, site);

  const tienda = {
    '@type': 'PetStore',
    ...(url ? { '@id': `${url}#negocio`, url } : {}),
    name: negocio.nombre,
    slogan: negocio.eslogan,
    // Textos oficiales completos (no las versiones recortadas de pantalla)
    description: `${negocio.mision} ${negocio.vision}`,
    disambiguatingDescription: `Venta de balanceados, alimentos y productos para ${listaAnimales}.`,
    currenciesAccepted: negocio.moneda.codigo,
    ...(imagen ? { image: imagen } : {}),
    ...(logo ? { logo } : {}),
    ...(direccion ? { address: direccion } : {}),
    ...(geo ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } } : {}),
    ...(mapa ? { hasMap: mapa } : {}),
    ...(telefonos.length ? { telephone: telefonos[0].internacional } : {}),
    ...(telefonos.length > 1
      ? {
          contactPoint: telefonos.map((tel) => ({
            '@type': 'ContactPoint',
            telephone: tel.internacional,
            contactType: 'customer service',
            areaServed: 'EC',
            availableLanguage: 'es',
          })),
        }
      : {}),
    ...(correo ? { email: correo } : {}),
    ...(horario ? { openingHoursSpecification: horario } : {}),
    ...(facebook ? { sameAs: [facebook] } : {}),
    hasOfferCatalog: catalogoSchema(site),
  };

  const sitio = url
    ? {
        '@type': 'WebSite',
        '@id': `${url}#sitio`,
        url,
        name: negocio.nombre,
        inLanguage: 'es',
        publisher: { '@id': `${url}#negocio` },
      }
    : null;

  return {
    '@context': 'https://schema.org',
    '@graph': sitio ? [tienda, sitio] : [tienda],
  };
}

/** JSON listo para incrustar en <script>: "<" escapado para no cerrar la etiqueta. */
export function jsonLd(datos: Record<string, unknown>): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
