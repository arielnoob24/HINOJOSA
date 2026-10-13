# SEO local: Comercial Hinojosa

Fase 5 de `PLAN.md` (sección 6, fila "SEO local", y sección 12, riesgo 4). Regla de siempre: solo se publica lo que está confirmado en `src/data/negocio.json` (`confirmado: true` y valor no nulo). No se inventan dirección, teléfono, horario, coordenadas, reseñas ni dominio. Nada de esta lista garantiza una posición en Google: ayuda a que Google entienda el negocio y lo muestre bien.

## El riesgo de este sitio: una página, 5 vistas

El sitio es **una sola página** (`src/pages/index.astro`) con 5 vistas (`#inicio #nosotros #productos #por-que #visitanos`). El router (`src/lib/router.ts`) oculta en el navegador las vistas inactivas con `hidden` + `inert`, pero **el HTML servido trae las 5 completas**. Consecuencias:

- **Una sola URL canónica**: la portada. Los hashes no son páginas: no llevan canonical propio, no van en el sitemap y no posicionan por separado.
- El `<title>` y la meta description describen **el negocio completo**, no la vista Inicio. El router cambia `document.title` por vista en el cliente ("Productos | Comercial Hinojosa"); eso es para el usuario y el historial, no para Google.
- Lo esencial para encontrar el negocio (nombre, lema, qué vende, para qué animales) está en el `<head>` (title, description, JSON-LD) y en la vista Inicio (logo con alt "Comercial Hinojosa: Nutrición que da vida", lema y subtítulo).
- **No convertir las vistas en páginas separadas** sin consultarlo: cambia toda la arquitectura.

## Dónde está cada cosa

| Qué | Archivo |
|---|---|
| `TITULO`, `DESCRIPCION`, canonical, URLs absolutas, `og:locale`, imagen social, `altProducto`, JSON-LD | `src/lib/seo.ts` |
| `<head>` (metadatos y `<script type="application/ld+json">`) | `src/layouts/Layout.astro` |
| Regla de "dato confirmado" | `src/lib/negocio.ts` (`datoConfirmado`, `horarioConfirmado`, `coordenadasConfirmadas`) |
| Textos `alt` de marca | `src/data/imagenes.json` (se leen con `altDe`); productos con `altProducto` |
| Dominio (`site`) | `astro.config.mjs` (línea comentada) |
| Sitemap | `src/pages/[mapa].xml.ts` (genera `/sitemap.xml` solo cuando hay `site`) |
| Robots | `public/robots.txt` |
| Imagen para redes | `public/og-imagen.jpg` (1200×630, logo sobre crema) |

## Checklist aplicado

### `<head>`
- [x] `<html lang="es">`.
- [x] `<title>`: "Comercial Hinojosa | Balanceados y alimentos para animales" (58 caracteres). Mantener el formato "Nombre | ...": el router usa la parte antes de ` | `.
- [x] Meta description desde `negocio.json`: "Comercial Hinojosa: venta de balanceados, alimentos y productos para aves, cerdos, conejos, cuyes, vacas, perros, gatos y tilapias. Nutrición que da vida." (154 caracteres; revisar si cambia `animalesAtendidos`).
- [x] `theme-color` `#1b4d2b` (verde bosque).
- [x] Open Graph: `og:type`, `og:locale` (`es`; pasa a `es_EC` solo con país confirmado "Ecuador"), `og:site_name`, `og:title`, `og:description`. Twitter `summary_large_image` con título y descripción.
- [x] Canonical (siempre la portada, nunca la ruta o el hash), `og:url`, `og:image` (+ `type`, `width`, `height`, `alt`), `twitter:image` y `<link rel="sitemap">`: se generan solos cuando `site` está definido. Hoy se omiten: Open Graph y canonical exigen URL absoluta.
- [x] Las URLs absolutas respetan `base` (`import.meta.env.BASE_URL`), por si se publica en una subruta.
- [x] Imagen social revisada: `og-imagen.jpg` (logo completo con lema sobre crema, 1200×630) sigue siendo válida y coherente con la marca. Hay una variante opcional con Canela (ver pendientes).

### JSON-LD (`@graph`)
- [x] `PetStore` con `name`, `slogan`, `description` (misión y visión **oficiales completas**, no las de pantalla), `disambiguatingDescription` (qué vende y para qué animales), `currenciesAccepted` USD.
- [x] `hasOfferCatalog`: un `OfferCatalog` por cada una de las 4 categorías (Alimento Animales de Granja, Alimento Mascotas, Comederos y Bebederos, Granos y Semillas) con los 37 productos como `Offer` → `Product` (`name`, `category`, `brand` si hay marca, `description` = presentación si existe).
- [x] Precios: solo los 14 productos que tienen precio en `productos.json`, como `PriceSpecification` (`price`, o `minPrice` cuando es "desde"), con `description` "… Precios referenciales — consulta disponibilidad". Sin `availability`, `aggregateRating`, reseñas ni `priceRange`.
- [x] Con `site`: `@id`, `url`, `image`, `logo`, imagen de cada producto y un nodo `WebSite` (`inLanguage: es`, `publisher` → el negocio).
- [x] **Fuera mientras no estén confirmados** (y aparecen solos al confirmarse):
  - `address` (`PostalAddress`): con `direccion` confirmada; `addressLocality` y `addressCountry` (ISO "EC" si es Ecuador) si ciudad y país también lo están.
  - `telephone`: con `telefono` confirmado.
  - `openingHoursSpecification`: con `horario.valor` confirmado en tramos `{ dias, abre, cierra }` (1 = lunes … 7 = domingo); se traduce a `dayOfWeek`/`opens`/`closes`.
  - `geo` (`GeoCoordinates`): con `coordenadas` confirmadas.
  - `hasMap`: con `googleMaps` confirmado.
  - `sameAs`: con `facebook` confirmado.
- [x] El `<` va escapado (`<`) para no cerrar la etiqueta `<script>`.

### Indexación de las 5 vistas
- [x] Las 5 `<section class="vista">` (`inicio`, `nosotros`, `productos`, `por-que`, `visitanos`) están en `dist/index.html`, sin atributo `hidden` ni `inert` en el HTML servido (los pone `router.ts` en el cliente).
- [x] La lista completa del catálogo está en el HTML: 4 grupos (`#lista-granja` 9, `#lista-mascotas` 16, `#lista-comederos` 5, `#lista-granos` 7) = 37 filas `data-producto-fila`, con nombre, marca, presentación y precio en texto. La tabla de proteína de la tilapia también.
- [x] Encabezados: un único `<h1>` (logo de Inicio). Cada vista tiene su `<h2>` (Quiénes somos, Nuestros productos, ¿Por qué elegirnos?, Comercial Hinojosa en Visítanos) y dentro solo `<h3>` (Misión, Visión, Valores; los 4 grupos del catálogo; pilares, diferenciales, animales). Sin `h4`–`h6`, sin saltos de nivel.

### Imágenes
- [x] Producto (rejilla del carrusel): `alt` = nombre + marca si no va ya en el nombre (`altProducto`), p. ej. "Nutri Pollos, de Nutritivos", "Maíz en grano, de Hinojosa", "Pro-Can cachorros razas pequeñas". El `<span class="sr-only">` con el nombre pasó a `aria-hidden="true"` para que el lector no lo repita: el nombre accesible del botón sale del `alt`.
- [x] Miniaturas de la lista y tarjetas sin JS: `alt=""` (el nombre está en texto al lado; la miniatura de la lista va además dentro de un `aria-hidden`).
- [x] Logo (h1): "Comercial Hinojosa: Nutrición que da vida".
- [x] Decorativas: Canela de la franja (`alt=""` dentro de `.canela-cruce[aria-hidden="true"]`), granos de maíz (SVG en contenedor `aria-hidden`), video de Canela en Quiénes somos (`aria-hidden`), isotipo de la barra (`alt=""`, el enlace tiene texto `sr-only`), iconos (`Icono.astro`, siempre `aria-hidden`).

### Rastreo
- [x] `robots.txt`: permite todo; la línea `Sitemap:` queda comentada hasta tener dominio.
- [x] Sitemap con **una sola URL** (la portada) generado por `src/pages/[mapa].xml.ts`. Sin `site`, `getStaticPaths` devuelve `[]` y no se genera (un sitemap con URLs relativas es inválido). No se usa `@astrojs/sitemap`: para una página no aporta nada y es una dependencia más.

## Pendientes

1. **Dominio (`site`).** Hoy no hay. Suposición documentada: sin dominio propio, el sitio iría en GitHub Pages del repo `arielnoob24/HINOJOSA`, es decir `https://arielnoob24.github.io/HINOJOSA/`. **No se activó** porque:
   - Una subruta exige `base: '/HINOJOSA'` y que todas las rutas fijas (`/img/...`, `/video/...`, `/favicon...`) usen `import.meta.env.BASE_URL`; hoy no lo hacen y el sitio se vería roto. El código SEO ya respeta `base`.
   - El workflow `.github/workflows/deploy-pages.yml` publica la carpeta `sitio-web` (el sitio viejo), no `hinojosa-web/dist`. Un canonical apuntando a una URL que sirve otro sitio es peor que ninguno.
   - En una subruta, `robots.txt` no sirve: los buscadores solo leen el de la raíz del host (`arielnoob24.github.io/robots.txt`).
   **Recomendación:** dominio propio (con `CNAME` en Pages), que evita `base` y deja `robots.txt` en la raíz. Al decidirlo: `site: 'https://<dominio>'` en `astro.config.mjs` (y `base` si es subruta), `npm run build`, comprobar `dist/sitemap.xml` y el canonical, y descomentar `Sitemap: https://<dominio>/sitemap.xml` en `public/robots.txt`.
2. **Datos de contacto** (en `negocio.json`, `confirmado: true`): dirección exacta y su ortografía ("Av. del Chofer y Rubén Lerson" sale de los afiches y varía), ciudad, país, teléfono, horario en tramos, coordenadas, enlace de Google Maps y de Facebook. WhatsApp no entra en el JSON-LD (se usa en la página); si es el mismo número que el teléfono, conviene confirmarlo también como `telefono`.
3. **País y `og:locale`.** USD y la dirección sugieren Ecuador, sin confirmar. Al confirmar `pais: "Ecuador"` pasan solos `og:locale es_EC` y `addressCountry EC`.
4. **Imagen social con Canela (opcional).** La actual es válida. Si la dueña prefiere una con Canela, hay un script `sharp` (logo a la izquierda, Canela a la derecha, sobre crema, 1200×630) que sobrescribe `public/og-imagen.jpg`; al usarlo, cambiar `IMAGEN_SOCIAL.alt` en `src/lib/seo.ts` a algo como "Logo de Comercial Hinojosa junto a Canela, su perrita mascota". Debe pesar menos de 300 KB.
5. **Validar** tras publicar con dominio: [Prueba de resultados enriquecidos](https://search.google.com/test/rich-results), [Validador de schema.org](https://validator.schema.org/), [Depurador de Facebook](https://developers.facebook.com/tools/debug/) y Google Search Console (propiedad del dominio, enviar `sitemap.xml`, inspeccionar la URL y revisar que el HTML renderizado contenga las 5 vistas).
6. **Precios.** Son de los afiches; al actualizarlos en `productos.json` se actualiza solo el JSON-LD.

## Guía para la dueña: Perfil de Empresa de Google

El Perfil de Empresa (antes "Google Mi Negocio") hace que Comercial Hinojosa aparezca en Google Maps y en el recuadro de la derecha cuando alguien busca la tienda. Es gratis.

1. **Crear el perfil.** Entre a <https://www.google.com/business/> con una cuenta de Gmail del negocio (no una personal que pueda perderse) y toque "Gestionar ahora".
2. **Nombre.** Escriba "Comercial Hinojosa", tal como está en el letrero. No agregue palabras como "barato" o "el mejor": Google lo prohíbe y puede suspender el perfil.
3. **Categoría principal.** Elija "Tienda de alimentos para animales". Si no aparece, use la más parecida ("Tienda de piensos" o "Tienda de suministros agrícolas"). Como secundarias puede agregar "Tienda de mascotas" y "Tienda de artículos para mascotas".
4. **Ubicación.** Marque que tiene un local donde atiende a clientes, escriba la dirección exacta y mueva el pin del mapa hasta la puerta de la tienda.
5. **Contacto.** Agregue el teléfono o WhatsApp del negocio y, cuando exista, la dirección de la página web.
6. **Verificación.** Google pide confirmar que el negocio es suyo: por video (grabando el letrero, el local y algo que pruebe que es la dueña, como las llaves o la caja), por llamada, SMS, correo o carta postal. Puede tardar unos días.
7. **Horario.** Ponga el horario real, incluidos los feriados cuando cambie.
8. **Fotos reales.** La fachada con el letrero (para que la reconozcan al llegar), el interior, los sacos y productos, y el logo. Evite fotos de internet o de las marcas que vende. Suba fotos nuevas de vez en cuando.
9. **Descripción.** Use el mismo texto de la página, por ejemplo: "Venta de balanceados, alimentos y productos para aves, cerdos, vacas, cuyes, conejos, perros, gatos y tilapia. Atención cercana y personalizada."
10. **Que todo coincida (NAP).** Nombre, dirección y teléfono escritos exactamente igual en Google, Facebook, los afiches y la página web. Si Google ve datos distintos, confía menos en el negocio.
11. **Reseñas.** Pida a clientes de confianza que dejen su opinión y respóndalas con amabilidad, también las negativas. No las compre ni las escriba usted: va contra las reglas de Google.
12. **Después.** Copie el enlace "Compartir" del perfil y páselo al equipo web: se usa como "Abrir en Maps" en Visítanos y como `hasMap` en los datos para Google. Pase también la dirección, el horario y las coordenadas tal como quedaron en el perfil, para que la página diga lo mismo.
