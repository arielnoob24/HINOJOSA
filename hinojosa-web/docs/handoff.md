# Handoff: sitio web de Comercial Hinojosa

Fecha: 2026-10-12. Rama: `HinoV2` (sin commits nuevos; todo el trabajo está en el árbol de trabajo).

> **Actualización 2026-10-12 (tarde):** las correcciones de QA están completas y revalidadas. Ver la sección "Revalidación tras las correcciones" en `docs/qa-informe.md`.
>
> - **Lighthouse:** Accessibility 100 en móvil y escritorio. Performance de 88-91 en móvil y de 97-100 en escritorio.
> - **INP del filtro:** 124 ms en escritorio y 56 ms en móvil.
> - **Fallo nuevo corregido:** contenido invisible al final de la página en móvil (`ResizeObserver` en `scroll.ts`).
> - **Cambios hechos en la revalidación:** CSS incrustado (`astro.config.mjs`) y `scroll-margin-top` en los controles enfocables (`global.css`).
> - **Único pendiente de QA:** el LCP en móvil con el perfil "4G lenta" de Lighthouse, que sigue en 3,2-3,6 s.
> - **Siguiente:** hosting (al final, por decisión del usuario) y datos de la dueña.
>
> Las tablas de abajo describen el estado previo a esta actualización.

Los dos últimos agentes (frontend y animación) se cortaron por el límite de sesión de la API mientras corregían los hallazgos de QA. El estado de las correcciones de frontend **no está verificado**: hay que revisarlo antes de seguir (ver "Siguiente paso").

## Contexto

- **Plan que rige:** `PLAN.md` en la raíz (Astro + Tailwind, 3D y animación), movido desde `Pre/` junto con `LEEME.md`. El resto de `Pre/` (imágenes, posters, videos, el zip de recursos y `tools/`) se eliminó; los derivados que usa el sitio están en `hinojosa-web/public/` y los originales se recuperan del historial de git (`git checkout <commit> -- Pre`).
- **Proyecto:** `hinojosa-web/` (Astro 7.3.8, Tailwind v4, `three@0.186.1`, `gsap@3.15.0`, `lenis@1.3.26`).
- **Agentes:** `.claude/agents/` (contenido-estrategia, direccion-arte, activos-3d-video, frontend, animacion-interaccion, seo-negocio-local, qa-rendimiento, despliegue).
- **Skills instaladas:** `.claude/skills/` (frontend-design, webapp-testing, tailwind-design-system, wcag-accessibility, performance-and-web-vitals, motion-and-storytelling).
- **Orden pedido:** frontend, animación, SEO, QA. Hosting al final.
- **Regla del proyecto:** no inventar datos de contacto, precios ni enlaces. Mientras un dato no esté confirmado en `src/data/negocio.json`, se muestra "Por confirmar" y no se genera enlace.

## Fases terminadas

| Fase | Agente | Resultado | Documentación |
|---|---|---|---|
| 1. Contenido | contenido-estrategia | `src/data/negocio.json`, `productos.json` (10 categorías, 48 productos, 15 con precio) y `textos.json`. Validados como JSON. | Pendientes de la dueña en `negocio.json` (`pendientes`) |
| 1. Diseño | direccion-arte | Tokens `@theme` en `src/styles/global.css`, contrastes WCAG calculados | `docs/guia-estilo.md`, `docs/storyboard-hero.md` |
| 3. Activos | activos-3d-video | Logo e isotipo transparentes, favicons, insignia de Canela con máscara geométrica (corregida y revisada), afiches y productos en WebP (900 y 480 px), 5 videos regenerados sin bordes grises | `docs/activos.md`, scripts en `scripts-activos/` |
| 2. Frontend | frontend | Layout, 11 secciones y componentes auxiliares, catálogo con filtros accesibles, menú móvil, botón de pausa | `README.md` |
| 4. Animación | animacion-interaccion | Hero con Three.js (granos instanciados, diferido, con fallback), GSAP + ScrollTrigger, Lenis en escritorio, tilt propio, contadores, Canela interactiva (`<button>` con globo `aria-live`) | código en `src/lib/animacion/` |
| 5. SEO | seo-negocio-local | Metadatos, Open Graph, Twitter, JSON-LD `PetStore` sin datos inventados, `robots.txt`, `public/og-imagen.jpg` | `docs/seo.md` |
| 5. QA | qa-rendimiento | Auditoría completa | `docs/qa-informe.md` |

## Resultado de QA (antes de las correcciones)

- Lighthouse móvil: Performance 77-78, Accessibility 93, Best Practices 100, SEO 100, LCP 4,1-4,3 s.
- Lighthouse escritorio: Performance 88-97, Accessibility 93, LCP 1,0-1,1 s.
- Peso inicial: 754 KiB móvil y 846 KiB escritorio (presupuesto: 2 MB).
- Pasan: teclado, movimiento reducido, pausa, enlaces, contenido, precios, metadatos y ausencia de scroll horizontal.
- Objetivos del plan que fallan: Performance > 90 y LCP < 2,5 s en móvil; Accessibility.

## Correcciones de QA

### Animación: terminadas y verificadas por el agente

| Hallazgo | Corrección | Medición |
|---|---|---|
| A2 (escritorio): INP del filtro | `refrescarDiferido()` en `src/lib/animacion/scroll.ts`: `ScrollTrigger.refresh()` fuera del fotograma, con debounce de 150 ms y `requestIdleCallback` | Mediana 352 a 188 ms (1280 px) y 208 a 120 ms (375 px) |
| M1: el giro de categorías no corría en producción | `global.css` con propiedades `animation-*` sueltas; el respaldo GSAP comprueba el estilo calculado | El `transform` cambia con el scroll en `dist/` |
| B1: warning de Three.js | `side: dobleCara ? DoubleSide : FrontSide` en `hero-3d.ts` | Sin warnings a 1280 px |

Nota: un build intermedio falló de forma transitoria porque ambos agentes editaban a la vez; el agente reporta que el último build (22:17) estaba limpio.

### Frontend: interrumpido, estado sin verificar

El agente solo alcanzó a confirmar que **las fuentes ya se sirven desde el propio dominio, sin referencias a Google**, y estaba midiendo Lighthouse móvil sin `preload` de fuentes. Del resto no hay confirmación:

| Hallazgo | Qué hay que hacer | Archivo | Estado |
|---|---|---|---|
| A1a | Fuentes autoalojadas | `Layout.astro`, `global.css`, `package.json` | Hecho según el agente; falta verificar |
| A1b | `fetchpriority="high"` en la insignia de Canela (elemento LCP) | `Hero.astro:~107` | Desconocido |
| A1c | Que las imágenes lazy de Categorías no compitan en la carga inicial móvil | `Categorias.astro` | Desconocido |
| A2 (móvil) | `content-visibility: auto` y `contain-intrinsic-size` en `[data-grupo]` | catálogo / `global.css` | Desconocido |
| M2 | `dl` mal anidado (axe `definition-list`, `dlitem`) | `Ubicacion.astro:28-42` | Desconocido |
| M3 | Nombre accesible del enlace del logo distinto del texto visible | `Header.astro:9-23` | Desconocido |
| M4 | Texto de "Nuestra esencia" desbordado a 320-375 px | `Valores.astro:39-46` | Desconocido |
| B2 | "Saltar al contenido" sin padding al enfocar | `Layout.astro:~93` | Desconocido |
| B3 | Botón flotante de WhatsApp tapa contenido a 375 px | `WhatsappFlotante.astro:28` | Desconocido |
| B4 | No descargar el video de Canela en móvil ni con ahorro de datos | `Canela.astro:56-70` | Desconocido |
| B5 | `sizes` de las imágenes de Categorías en densidad 2 | `Categorias.astro` | Desconocido |
| B6 | `target-size` contextual con el header fijo | — | Bajo, opcional |

## Siguiente paso

1. Comprobar el estado: `npm run build` en `hinojosa-web/`, revisar `git status` y el diff de los archivos de la tabla anterior, y buscar `fontsource`/`@font-face`, `fetchpriority`, `content-visibility`.
2. Terminar las correcciones de frontend que falten (tabla anterior).
3. Volver a ejecutar QA: Lighthouse móvil (3 corridas), axe a 375 y 1280 px y capturas a 320 px. Los scripts del QA están en el scratchpad de la sesión (`.../scratchpad/qa/`), que es temporal y puede no existir en otra sesión; en ese caso el agente `qa-rendimiento` puede regenerarlos.
4. Actualizar `docs/qa-informe.md` con los resultados nuevos.
5. Hacer commit en `HinoV2` cuando el usuario lo pida.

## Pendiente del proyecto (fuera de QA)

- **Hosting (al final, por decisión del usuario):** `.github/workflows/deploy-pages.yml` sigue subiendo `sitio-web/`, que ya no existe. Hay que añadir `npm ci && npm run build` en `hinojosa-web/` y subir `hinojosa-web/dist`. Al tener dominio: descomentar `site` en `astro.config.mjs`, `npx astro add sitemap` y la línea `Sitemap:` de `robots.txt` (ver `docs/seo.md`). No hacer push a `main` sin confirmación.
- **Datos de la dueña:** dirección exacta y ortografía, ciudad, país, teléfono/WhatsApp, horario, Facebook, Google Maps con coordenadas, precios vigentes, presentaciones, historia del negocio y permisos de uso del arte de Canela, de los afiches y de las marcas de terceros.
- **Activos que faltan:** logo vectorial y versión blanca, modelos `.glb` (Canela y costales), archivos Lottie y fotos reales. Leaflet espera coordenadas.
- **Limpieza opcional:** `.github/agents/*.agent.md` (agentes de Copilot del plan anterior).
- **Videos:** `catalogo` pesa 2,28 MB (cerca del límite de 2,5 MB). No hay AVIF porque el Pillow instalado no lo soporta.
