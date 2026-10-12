// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio publico (fase de despliegue). Mientras este comentado, el <head>
  // omite canonical, og:url y og:image, y el JSON-LD omite url, image y logo,
  // porque todos exigen URL absoluta. Al descomentarlo con el dominio real
  // (con https:// y sin ruta) aparecen solos. Ver docs/seo.md.
  // site: 'https://DOMINIO-POR-CONFIRMAR',
  build: {
    // CSS incrustado en el HTML (~11 kB gzip): evita el viaje de red del
    // CSS bloqueante, que retrasaba FCP y LCP en movil 4G (QA, hallazgo A1).
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // El chunk de Three.js (hero-3d, ~550 kB sin comprimir, ~136 kB gzip)
      // se descarga en diferido y solo en escritorio con WebGL; no forma
      // parte de la carga inicial. Ver src/lib/animacion/arranque.ts.
      chunkSizeWarningLimit: 600,
    },
  },
});
