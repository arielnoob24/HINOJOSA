# Handoff: sitio web de Comercial Hinojosa

Fecha: 2026-10-13. Rama de trabajo: `HinoV2`, fusionada en `main`.

## Estado en una línea

El sitio por vistas está **terminado y verificado**; no se puede publicar hasta tener los datos de contacto confirmados y decidir el dominio (ver "Bloqueantes").

## Contexto

- **Plan que rige:** `PLAN.md` en la raíz. La **sección 0** (activos recibidos el 2026-10-12) manda sobre el resto: 4 categorías, carrusel CSS 3D de imágenes (sin Three.js) y Canela en PNG + video.
- **Proyecto:** `hinojosa-web/` (Astro 7.3.8, Tailwind 4, GSAP 3.15 cargado en diferido, Leaflet 1.9.4 solo con coordenadas).
- **Originales del cliente:** `Nuevos Req/` en la raíz, **fuera de git** (`.gitignore`, unos 200 MB). Se regeneran los derivados con `scripts-activos/nuevos_req.py` (requiere `ffmpeg` en el PATH; se instaló con `scoop install ffmpeg`).
- **Agentes:** `.claude/agents/`. **Skills del proyecto:** `marca-hinojosa` (paleta y contrastes) y `vistas-hinojosa` (contrato del router; incluye la excepción de flechas `[data-captura-flechas]`).
- **Regla del proyecto:** no inventar datos de contacto, precios ni enlaces. Lo no confirmado en `src/data/negocio.json` (`confirmado: false`) se muestra como pendiente y no genera enlace ni JSON-LD.

## Qué hay

| Área | Dónde | Notas |
|---|---|---|
| 5 vistas sin scroll + router | `src/pages/index.astro`, `src/components/vistas/`, `src/lib/router.ts` | `inert`, foco al título, hash por vista, ←/→ fuera de campos y del carrusel |
| Datos | `src/data/productos.json` (4 categorías, 37 productos, 16 con precio), `negocio.json`, `textos.json` | `conFondo: true` en 3 productos que se muestran en placa |
| Carrusel 3D | `src/lib/animacion/carrusel.ts`, `carrusel-carga.ts`, `src/lib/catalogo.ts` | Estado único en `catalogo.ts`; evento `hinojosa:producto` |
| Animación | `src/lib/animacion/` (vistas, paralaje, entradas, movimiento) | Pausa global `hinojosa:movimiento`; reduced motion = `animation: none` |
| Estilos | `src/styles/tokens.css`, `global.css` | Fuente script recortada en `src/assets/fonts/caveat-brush-acento.woff2` (regenerar si cambian las frases manuscritas; comando comentado en `global.css`) |
| Activos web | `public/img/productos/<cat>/<slug>{,-400}.{webp,avif}`, `-thumb{,-80}.webp`; `public/img/canela/`; `public/video/canela-jugando*` | Convención de slugs en la sección 0 del PLAN |
| SEO | `src/lib/seo.ts`, `<head>` de `Layout.astro`, `src/pages/[mapa].xml.ts` | Canonical, og:image y sitemap solo aparecen cuando hay `site` |
| Documentación | `docs/guia-estilo.md`, `storyboard-hero.md`, `storyboard-carrusel.md`, `activos.md`, `seo.md`, `qa-informe.md` | |

## Calidad (detalle en `docs/qa-informe.md`)

- `npm run build` y `npx astro check`: 0 errores, 0 avisos.
- Router: 41/41 comprobaciones en 1440×900, 1366×650, 360×640 y 390×844.
- axe-core 4.14: 0 violaciones en las 5 vistas, a 1440 y 360 px.
- Lighthouse móvil: Inicio 99, `#productos` 93–97; escritorio 100. Inicio descarga 142 kB (límite 1,5 MB).
- **Cuidado al refactorizar:** la tarjeta provisional del carrusel en `#productos` (M5) debe quedarse invisible bajo el anillo hasta la primera interacción o 1,5 s; si se oculta antes, Lighthouse móvil baja a 86.

## Bloqueantes para publicar

1. **Datos de la dueña:** dirección exacta y ortografía, ciudad, país, referencias para llegar, teléfono/WhatsApp, horario con zona horaria, Facebook, enlace de Maps y coordenadas. Se cargan en `negocio.json` con `confirmado: true` y aparecen solos en Visítanos, en el mapa y en el JSON-LD.
2. **Dominio y despliegue:** `.github/workflows/deploy-pages.yml` sigue subiendo `sitio-web/`, **que ya no existe**, así que el deploy desde `main` falla y GitHub Pages conserva la versión vieja. Hay que:
   - añadir `actions/setup-node` + `npm ci && npm run build` en `hinojosa-web/` y subir `hinojosa-web/dist`;
   - definir `site` en `astro.config.mjs` (y `base: '/HINOJOSA'` + rutas con `BASE_URL` si se publica en `arielnoob24.github.io/HINOJOSA/`; se recomienda dominio propio, ver `docs/seo.md`);
   - descomentar la línea `Sitemap:` de `public/robots.txt`.
   Le corresponde al agente `despliegue`.

## Pendiente (no bloquea)

- **Confirmar con la dueña:** 21 precios sin dato, precios asignados a variantes de Pro-Can, si melaza y sal son marca propia, derechos de uso de los renders (parecen generados con IA y llevan marcas de terceros), Canela sin pañuelo en el render.
- **Activos:** PNG del bebedero con alfa real (el actual trae un damero pintado); si se quiere a Canela caminando, hace falta una animación de caminata (el video actual juega en el sitio); foto o video de la fachada; fotos reales de producto; logo vectorial.
- **Pruebas manuales:** lector de pantalla real (NVDA/VoiceOver), Safari iOS y Firefox.
- **Medición:** repetir las métricas de 4G lenta + CPU ×4 con el equipo en reposo (la última corrida salió afectada por carga del equipo).

## Cómo arrancar

```
cd hinojosa-web
npm install
npm run dev        # http://localhost:4321
npm run build && npx astro check
```
