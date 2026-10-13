// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio publico (fase de despliegue). Mientras este comentado, el <head>
  // omite canonical, og:url y og:image, y el JSON-LD omite url, image y logo,
  // porque todos exigen URL absoluta. Al descomentarlo con el dominio real
  // (con https:// y sin ruta) aparecen solos, y el build genera
  // dist/sitemap.xml (src/pages/[mapa].xml.ts). Ver docs/seo.md.
  // Sin dominio propio, GitHub Pages del repo arielnoob24/HINOJOSA seria
  // https://arielnoob24.github.io/HINOJOSA/ : eso exige ademas
  // base: '/HINOJOSA' y rutas de imagenes con BASE_URL (decision de despliegue).
  // site: 'https://DOMINIO-POR-CONFIRMAR',
  build: {
    // CSS incrustado en el HTML (~11 kB gzip): evita el viaje de red del
    // CSS bloqueante, que retrasaba FCP y LCP en movil 4G (QA, hallazgo A1).
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Ya no hay Three.js. Los chunks diferidos mas grandes son Leaflet
      // (~150 kB, al entrar en Visitanos) y carrusel + GSAP core (al entrar
      // en Productos). El limite por defecto (500 kB) basta.
    },
  },
});
