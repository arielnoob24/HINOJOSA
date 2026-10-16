// sitemap.xml con UNA sola URL: la portada. Las 4 vistas (#inicio,
// #productos...) son la misma pagina y no se listan por separado.
//
// Ruta dinamica a proposito: sin `site` en astro.config.mjs no hay URL
// absoluta posible, getStaticPaths devuelve [] y no se genera ningun
// archivo (un sitemap con URLs relativas es invalido). Al definir `site`,
// el build produce dist/sitemap.xml solo. Ver docs/seo.md.
import type { APIRoute, GetStaticPaths } from 'astro';
import { urlCanonica } from '../lib/seo';

export const getStaticPaths: GetStaticPaths = () => (import.meta.env.SITE ? [{ params: { mapa: 'sitemap' } }] : []);

export const GET: APIRoute = ({ site }) => {
  const url = urlCanonica(site);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
