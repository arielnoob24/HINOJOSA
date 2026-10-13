# SEO local: Comercial Hinojosa

Fase 5 de `PLAN.md` (sección 5, fila "SEO local"). Regla de siempre: solo se publica lo que está confirmado en `src/data/negocio.json` (`confirmado: true` y valor no nulo). No se inventan dirección, teléfono, horario, coordenadas, reseñas ni dominio. Ningún cambio de esta lista garantiza una posición en Google: ayuda a que Google entienda el negocio y lo muestre bien.

## Dónde está cada cosa

| Qué | Archivo |
|---|---|
| `<title>`, description, canonical, Open Graph, Twitter, JSON-LD | `src/layouts/Layout.astro` |
| Armado del JSON-LD, URLs absolutas, `og:locale`, imagen social | `src/lib/seo.ts` |
| Regla de "dato confirmado" | `src/lib/negocio.ts` (`datoConfirmado`) |
| Textos `alt` | `src/data/imagenes.json` (se leen con `altDe`) |
| Dominio (`site`) | `astro.config.mjs` (línea comentada) |
| Robots | `public/robots.txt` |
| Imagen para redes | `public/og-imagen.jpg` (1200×630, logo sobre crema) |

## Checklist aplicado

- [x] `<html lang="es">`.
- [x] `<title>`: "Comercial Hinojosa | Balanceados y alimentos para animales" (58 caracteres; dice qué vende, sin relleno).
- [x] Meta description generada desde `negocio.json` (nombre, `animalesAtendidos`, eslogan): "Comercial Hinojosa: venta de balanceados, alimentos y productos para aves, cerdos, conejos, cuyes, vacas, perros, gatos y tilapias. Nutrición que da vida." (154 caracteres; si cambia la lista de animales, revisar que siga entre 140 y 160).
- [x] `theme-color` `#1b4d2b` (verde `bosque` de la guía de estilo).
- [x] Open Graph: `og:type` website, `og:locale`, `og:site_name`, `og:title`, `og:description`. `twitter:card` `summary_large_image` con título y descripción.
- [x] `og:locale`: es `es_EC` solo si `contacto.pais` está confirmado como "Ecuador"; hoy el país no está confirmado, así que sale `es`.
- [x] Canonical, `og:url`, `og:image` (con `type`, `width`, `height`, `alt`) y `twitter:image`: se generan solos cuando `site` está definido. Hoy se omiten porque Open Graph exige URL absoluta y no hay dominio (una ruta relativa no la leen Facebook ni WhatsApp).
- [x] JSON-LD `PetStore` generado en el build: `name`, `slogan`, `description`, `currenciesAccepted` (USD). Sin `aggregateRating`, reseñas ni `priceRange`. El `<` va escapado (`<`).
- [x] El JSON-LD agrega solo, cuando el dato se confirme:
  - `url`, `@id`, `image` y `logo` cuando haya `site`.
  - `address` (`PostalAddress`) cuando la dirección esté confirmada. `addressLocality` y `addressCountry` se agregan si ciudad y país también lo están.
  - `telephone` cuando el teléfono esté confirmado.
  - `sameAs` con el enlace de Facebook confirmado.
  - `hasMap` con el enlace de Google Maps confirmado, y `geo` (`GeoCoordinates`) si ese enlace trae las coordenadas (`.../@lat,lng,...`).
  - `openingHours` solo si el horario confirmado ya viene en formato schema.org (por ejemplo `Mo-Fr 08:00-18:00; Sa 08:00-13:00`). Si viene como texto para personas ("Lunes a viernes de 8 a 18"), se muestra en la página pero no entra en el JSON-LD (ver pendientes).
- [x] `robots.txt`: permite todo. La línea `Sitemap:` está comentada hasta que haya dominio.
- [x] Un solo `h1` (el logo del hero, con alt "Comercial Hinojosa: Nutrición que da vida"). Cada sección tiene su `h2`, tarjetas y grupos usan `h3`, y los productos del catálogo `h4` dentro de su grupo. No hay saltos de nivel.
- [x] Enlaces descriptivos: "Ver productos: <categoría>", "Pedir por WhatsApp: <producto>" y "(se abre en una pestaña nueva)" en `sr-only`. No hay "clic aquí".
- [x] Imágenes revisadas:
  - Informativas con `alt` en español sin "imagen de": logo (h1), insignia de Canela, Canela con el pulgar arriba y las tarjetas de categorías.
  - Decorativas con `alt=""`: isotipo del header (el enlace ya tiene `aria-label`) e isotipo del footer, que se cambió a decorativo porque el nombre del negocio va justo al lado y el lector lo repetía.
  - SVG de iconos, hojas, granos y ondas con `aria-hidden="true"`. Videos decorativos con `aria-hidden="true"` y su contenido en texto.
- [x] Imágenes con `width`/`height` y `loading="lazy"` fuera del hero (evita CLS, que también cuenta para SEO).

## Pendientes

1. **Dominio.** Cuando se decida el hosting, descomentar `site` en `astro.config.mjs` con el dominio real (por ejemplo `site: 'https://www.ejemplo.com'`, sin barra final ni ruta). Con eso aparecen canonical, `og:url`, `og:image` y `url`/`image`/`logo` en el JSON-LD.
2. **Sitemap.** No se instaló porque es una sola página y sin dominio no hay URLs absolutas. Cuando exista `site`:
   1. `npx astro add sitemap` (instala `@astrojs/sitemap` y lo agrega a `integrations` en `astro.config.mjs`). Equivale a `npm i @astrojs/sitemap` más `import sitemap from '@astrojs/sitemap';` y `integrations: [sitemap()]`.
   2. `npm run build` y comprobar que existan `dist/sitemap-index.xml` y `dist/sitemap-0.xml` con la URL del dominio.
   3. En `public/robots.txt`, descomentar `Sitemap:` con el dominio real: `Sitemap: https://<dominio>/sitemap-index.xml`.
   4. Opcional: agregar en `Layout.astro` `<link rel="sitemap" href="/sitemap-index.xml" />`.
   5. Enviar el sitemap en Google Search Console (propiedad del dominio, verificada por DNS).
3. **Datos de contacto confirmados** (en `negocio.json`, `confirmado: true`): dirección exacta y su ortografía ("Av. del Chofer y Rubén Lerson" sale de los afiches y varía entre ellos), ciudad, país, teléfono, WhatsApp, enlace de Facebook y enlace de Google Maps.
4. **País y `og:locale`.** La moneda USD y la dirección hacen pensar en Ecuador, pero no está confirmado. Al confirmar `pais: "Ecuador"` el sitio pasa solo a `es_EC`.
5. **Horario en formato schema.org.** Para que el horario entre en el JSON-LD tiene que venir como `Mo-Sa 08:00-18:00`. Hay dos opciones: guardarlo así en `negocio.json` (pero se vería en inglés en la página) o agregar un campo aparte, por ejemplo `horario.schema`, y leerlo en `src/lib/seo.ts`. Hay que decidirlo junto con el equipo de contenido.
6. **Coordenadas.** Se toman del enlace de Google Maps confirmado si lleva `@lat,lng`. Los enlaces cortos (`maps.app.goo.gl/...`) no las traen: en ese caso hay que abrir el enlace, copiar la URL larga o anotar las coordenadas aparte. Lo mismo vale para el mapa Leaflet (`data-lat`/`data-lng` en `Ubicacion.astro`).
7. **Google Business Profile:** ver la guía de abajo. Cuando exista, agregar su enlace público como Google Maps confirmado.
8. **Validar** con la [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results) y el [Validador de schema.org](https://validator.schema.org/), y probar la vista previa para redes con el [Depurador de Facebook](https://developers.facebook.com/tools/debug/) una vez publicado con dominio.
9. **Imagen social.** `og-imagen.jpg` es solo el logo. Si la dueña lo aprueba, se puede cambiar por una con Canela y productos (1200×630, menos de 300 KB) sin tocar código.

## Guía para la dueña: Perfil de Empresa de Google

El Perfil de Empresa (antes "Google Mi Negocio") hace que Comercial Hinojosa aparezca en Google Maps y en el recuadro de la derecha cuando alguien busca la tienda. Es gratis.

1. **Crear el perfil.** Entre a <https://www.google.com/business/> con una cuenta de Gmail del negocio (no una personal que pueda perderse) y toque "Gestionar ahora".
2. **Nombre.** Escriba "Comercial Hinojosa", tal como está en el letrero. No agregue palabras como "barato" o "el mejor": Google lo prohíbe y puede suspender el perfil.
3. **Categoría principal.** Elija "Tienda de alimentos para animales". Si no aparece, use la más parecida ("Tienda de piensos" o "Tienda de suministros agrícolas"). Como categorías secundarias puede agregar "Tienda de mascotas" y "Tienda de artículos para mascotas".
4. **Ubicación.** Marque que tiene un local donde atiende a clientes, escriba la dirección exacta y mueva el pin del mapa hasta la puerta de la tienda.
5. **Contacto.** Agregue el teléfono o WhatsApp del negocio y, cuando exista, la dirección de la página web.
6. **Verificación.** Google pide confirmar que el negocio es suyo, por video (grabando el letrero, el local y algo que pruebe que es la dueña, como las llaves o la caja), por llamada, SMS o correo, o por carta postal. Siga los pasos que le muestre. Puede tardar unos días.
7. **Horario.** Ponga el horario real, incluidos los días feriados cuando cambie.
8. **Fotos reales.** Suba fotos propias: la fachada con el letrero (para que la reconozcan al llegar), el interior, los sacos y productos, y el logo. Evite fotos de internet o de las marcas que vende. Conviene subir fotos nuevas de vez en cuando.
9. **Descripción.** Use el mismo texto de la página, por ejemplo: "Venta de balanceados, alimentos y productos para aves, cerdos, vacas, cuyes, conejos, perros, gatos y tilapia. Atención cercana y personalizada."
10. **Que todo coincida (NAP).** Nombre, dirección y teléfono deben escribirse exactamente igual en Google, Facebook, los afiches y la página web: la misma ortografía de la calle y el mismo número. Si Google ve datos distintos, confía menos en el negocio.
11. **Reseñas.** Pida a sus clientes de confianza que dejen su opinión y respóndalas con amabilidad, también las negativas. No las compre ni las escriba usted: va contra las reglas de Google.
12. **Después.** Copie el enlace "Compartir" del perfil y páselo al equipo web para ponerlo como "Cómo llegar" en la página. Así también se completan el mapa y los datos para Google.
