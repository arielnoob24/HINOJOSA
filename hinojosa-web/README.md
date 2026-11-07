# Comercial Hinojosa: sitio web

Sitio de una sola página en Astro + Tailwind CSS v4. El plan que rige es `../PLAN.md`.

```sh
npm install
npx astro dev --background   # servidor de desarrollo (astro dev stop / status / logs)
npm run build                # genera dist/
npm run preview
```

- Textos y datos: `src/data/` (`negocio.json`, `productos.json`, `textos.json`, `imagenes.json` con los `alt`).
  Un dato de contacto solo se publica y se enlaza si tiene `"confirmado": true` y un `valor`.
- Componentes: uno por sección en `src/components/`. Tokens y efectos en `src/styles/global.css`.
- Documentación de diseño y activos: `docs/`.

## Panel oculto de administración (bloque 29)

La dueña edita precios, descripciones, fotos y productos sin tocar código: **4 clics seguidos en el logo** abren un panel con contraseña.

- Código del sitio: `src/lib/admin/` (se descarga solo tras los clics). API: Cloudflare Worker en `../admin-worker/` (ver su `README.md`).
- Cada guardado hace un commit `Panel: …` en `main` y GitHub Pages republica (~1-2 minutos). **Antes de empujar a `main`, trae `origin/main`.**
- Las fotos nuevas se guardan en `imagenes-nuevas/` y el workflow genera sus versiones web (`npm run imagenes:nuevas` para hacerlo en local).
- Pruebas: `node ../admin-worker/prueba-validar.mjs`, `node ../admin-worker/prueba-worker.mjs` y `python -I ../admin-worker/prueba-panel-navegador.py`.
- Estado, operación y pendientes: `docs/handoff.md`.
