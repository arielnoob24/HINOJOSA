// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Publicacion en GitHub Pages de proyecto (repo arielnoob24/HINOJOSA, sin
  // dominio propio): https://arielnoob24.github.io/HINOJOSA/
  //   - site: origen publico (con https:// y sin ruta). Con el, el <head>
  //     lleva canonical, og:url y og:image, el JSON-LD url, image y logo, y
  //     el build genera dist/sitemap.xml (src/pages/[mapa].xml.ts).
  //   - base: subruta del proyecto. Todas las rutas hacia public/ pasan por
  //     src/lib/ruta.ts (ruta(), rutaSrcset()), que antepone
  //     import.meta.env.BASE_URL; las URL absolutas de SEO tambien
  //     (seo.ts -> urlAbsoluta). Los chunks y CSS de Vite ya respetan base.
  // Si algun dia hay dominio propio: site: 'https://DOMINIO' y quitar base
  // (o base: '/'); no hay que tocar ninguna ruta. Ver docs/seo.md.
  site: 'https://arielnoob24.github.io',
  base: '/HINOJOSA',
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
