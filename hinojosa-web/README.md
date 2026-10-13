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
