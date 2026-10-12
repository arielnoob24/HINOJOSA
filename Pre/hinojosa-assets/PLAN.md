# Plan del proyecto: Sitio web de Comercial Hinojosa

> Página publicitaria estática con animaciones 3D, imágenes animadas y video.
> Negocio: **Comercial Hinojosa** · Lema: **"Nutrición que da vida"** · Giro: venta de balanceados, alimentos y productos para animales.

---

## 1. Resumen del negocio (extraído del material recibido)

| Dato | Valor |
|---|---|
| Nombre | Comercial Hinojosa |
| Eslogan principal | Nutrición que da vida |
| Eslóganes secundarios | "Calidad que alimenta, amor que se siente" · "Comercial Hinojosa siempre a tu lado" · "Tu mejor aliado para tus animales" · "Somos parte de tu familia" · "Calidad, Confianza, Compromiso" |
| Subtítulo | Venta de balanceados · Alimentos y productos para animales |
| Mascota | **Canela**, perrita alegre y cariñosa con gorra verde y pañuelo con la "H" |
| Ubicación (en los afiches) | Calle Av. del Chofer y Rubén Lerson *(la ortografía varía entre afiches; **confirmar con el dueño**, junto con ciudad)* |
| Red social | Facebook (enlace por confirmar) |
| Animales atendidos | Aves, cerdos, conejos, cuyes, vacas, perros, gatos, tilapias |
| Moneda de precios | USD ($) |

> **Pendiente de confirmar:** ciudad, teléfono/WhatsApp, horario, enlace de Facebook y enlace de Google Maps. No se inventan; se dejan como variables editables.

### Misión
Brindar alimentos y productos de calidad para animales, ofreciendo una atención amable, responsable y cercana que satisfaga las necesidades de nuestros clientes.

### Visión
Ser una empresa líder y reconocida en la comercialización de alimentos y productos para animales, destacándonos por nuestra calidad, buen servicio y compromiso con nuestros clientes.

### Valores
Buen trato · Calidez · Amabilidad · Responsabilidad · Honestidad · Compromiso con el cliente

### Esencia (pilares)
Naturales · Confiables · De calidad · Sostenibles

### Diferenciales (barra inferior de los afiches)
Ubicación estratégica · Productos para aves, cerdos, mascotas y tilapias · Atención cercana y personalizada · Calidad que se siente

---

## 2. Identidad visual

### Logo
- Usar el **logo nuevo** (H blanca sobre trébol/hojas verdes con maíz, "COMERCIAL" en dorado, "HINOJOSA" en verde degradado). El "ANTES" del primer afiche queda **descartado**.
- Variantes necesarias (a exportar en SVG/PNG con fondo transparente): completo vertical, solo isotipo "H", versión blanca para fondos oscuros, favicon.
- Insignia de Canela: círculo con borde dorado + placa "Comercial Hinojosa – Venta de balanceados".

### Paleta (valores aproximados; afinar con el color picker sobre el logo vectorial)
| Rol | Color | Hex aprox. |
|---|---|---|
| Verde profundo (fondos, títulos) | verde bosque | `#1B4D2B` |
| Verde marca (botones, hojas) | verde vivo | `#2E8B2E` |
| Verde claro (acentos) | verde hoja | `#7BBF3A` |
| Dorado / maíz (CTA, detalles) | amarillo oro | `#F2B823` |
| Crema (fondos claros) | crema cálido | `#F6F1E4` |
| Canela (mascota, calidez) | marrón dorado | `#C98A3A` |
| Texto oscuro | verde casi negro | `#14301D` |

### Tipografía
- **Títulos de marca:** sans redondeada sólida y gruesa (similar al logo): *Baloo 2* o *Nunito ExtraBold*.
- **Títulos elegantes / productos:** serif tipo *Cormorant Garamond* (la usan los afiches de producto).
- **Acento manuscrito (Canela, "aliado"):** *Pacifico* o *Caveat Brush*.
- **Cuerpo:** *Inter* o *Nunito*.
- Todas desde Google Fonts, con `font-display: swap`.

### Tono
Cálido, familiar, confiable, cercano. Textos cortos, en español, orientados a la acción ("Escríbenos por WhatsApp").

---

## 3. Estructura de la página (una sola página con anclas + sección de catálogo)

| # | Sección | Contenido | Efecto 3D / animación |
|---|---|---|---|
| 1 | **Hero** | Logo, "Nutrición que da vida", botones *WhatsApp* y *Ver productos* | Escena 3D: Canela animada (modelo `.glb` o video loop) con costales y granos flotando; paralaje al mover el mouse |
| 2 | **Quiénes somos** | Historia breve, misión y visión en tarjetas | Tarjetas con tilt 3D al pasar el cursor; hojas cayendo |
| 3 | **Conoce a Canela** | Presentación de la mascota ("Soy alegre, cariñosa y siempre estoy lista para jugar") | Canela 3D rotable/interactiva; guiña, mueve la cola, saluda |
| 4 | **Qué vendemos (categorías)** | Aves, cerdos, vacas, cuyes y conejos, perros, gatos, tilapia, granos, accesorios, semillas | Carrusel 3D de costales que rotan con el scroll |
| 5 | **Catálogo con precios** | Ver sección 4 | Tarjetas de producto con giro 3D (visor `model-viewer` de costales) |
| 6 | **Valores y esencia** | 6 valores + 4 pilares | Iconos animados (Lottie) que aparecen al hacer scroll |
| 7 | **Por qué elegirnos** | Calidad, nutrición balanceada, atención cercana, ubicación | Contadores y barras animadas |
| 8 | **Ubicación** | Mapa, dirección, horario, cómo llegar | Pin 3D animado sobre el mapa (Leaflet/OSM) |
| 9 | **Contacto / redes** | WhatsApp, Facebook, teléfono | Botón flotante de WhatsApp con pulso |
| 10 | **Footer** | Logo, lema "Comercial Hinojosa siempre a tu lado", copyright | Hojas con paralaje |

---

## 4. Catálogo de productos (del material recibido)

> Los precios vienen de los afiches. **Pueden estar desactualizados**: se guardan en un solo archivo editable (`src/data/productos.json`) y la web muestra "precios referenciales, consulta disponibilidad".

### Aves de corral
- Balanceados **Camperito** (pollos) crecimiento — $28.00
- Balanceados **Camperito** engorde — $28.00
- Balanceados **Nutritivos** (inicial, crecimiento y engorde) — desde $31.00
- Balanceados **Nutritivos cerdos** (inicial, crecimiento, engorde, gestantes, lactantes) — desde $30.00
- Balanceados **Nutri Vacas** (alta producción de leche) — $22.50
- Especies menores: **Nutri Cuyes** (cuyes y conejos, crecimiento y engorde) — $29.00
- Línea Nutritivos Premium: Nutri Pollos, Nutri Vacas (lecheras), Nutri Cerdos, Nutri Cuyes, Gallos de pelea (sacos de 30–40 kg)
- Bebederos plásticos y comederos (galvanizados y plásticos) para aves

### Granos y subproductos (marca propia Hinojosa)
- Maíz en grano
- Maíz molido natural
- Maíz molido vitaminizado
- Trigo natural
- Arrocillo
- Afrecho de trigo (Molinos Cordillera, saco 45 kg)
- Sal en grano
- Melaza

### Perros
- **Pro-Can** cachorros y adultos, razas medianas y grandes — desde $1.00
- **Pro-Can** cachorros y adultos — desde $2.25
- **Pro-Can** cachorros, adultos, razas pequeñas y miniaturas — desde $1.40
- **Buen Can**, **Cani** (premium adultos y senior)
- **NutraPro** cachorro y adulto (2 kg, 4 kg) — desde $8.00
- **Dog Chow** premium — desde $2.25
- Masticables: Mascan (huesos prensados sabor pollo, res/carne, mini huesos en funda), Mascan multisabor, Pro-Can palitos y rejos con colágeno, Bio Cani canelones

### Gatos
- **Pro Cat** alimento — desde $2.50
- Arena sanitaria **Pro-Cat** — $5.50
- Arena premium **NutraPro** — $6.00
- Arena absorbente **Freemiau** — $7.00

### Tilapia
- Balanceado tilapero **Bio Alimentar Premium** (40 kg y 20 kg)
- Tabla de proteína por etapa: alevín 45% · preinicial 42% · inicial 38% · crecimiento 32% · desarrollo 28% · engorde 24%

### Accesorios para mascotas
- Comederos plásticos, bebederos y comederos dobles / con dispensador

### Semillas de alta calidad (Agrícola Santo Domingo)
- Tomate, sandía, melón, pimiento, perejil, cebolla colorada, cebollín, pepino

### Avisos legales / derechos
- Las marcas de terceros (Pro-Can, Camperito, Nutritivos, Dog Chow, NutraPro, Bio Alimentar, Cani, Molinos Cordillera, etc.) pertenecen a sus dueños. Se mencionan como **productos que el local distribuye**. Agregar nota al pie: *"Marcas registradas de sus respectivos propietarios."*
- Preferir **fotos propias del local** de cada producto. Las imágenes de los afiches son composiciones gráficas y sirven de referencia, no como fuente final.
- Varios afiches parecen generados con IA (mascota, animales): confirmar con el dueño que puede usarlos y qué elementos desea conservar.

---

## 5. Stack tecnológico

| Capa | Herramienta | Motivo |
|---|---|---|
| Framework | **Astro** | HTML estático, muy rápido, JS solo donde hay 3D (islands) |
| Estilos | **Tailwind CSS** | Responsive y consistente con tokens de marca |
| 3D tiempo real | **Three.js** (+ `@react-three/fiber` solo si se usa React) | Hero y escenas personalizadas |
| 3D en tarjetas | **`<model-viewer>`** (Google) | Visor `.glb` ligero con rotación y AR, sin escribir shaders |
| Animación scroll | **GSAP + ScrollTrigger** | Secuencias atadas al scroll |
| Scroll suave | **Lenis** | Sensación premium |
| Iconos animados | **Lottie (dotLottie)** | Valores, pilares, iconos de animales |
| Efectos de hover | **vanilla-tilt.js** | Tilt 3D en tarjetas |
| Modelado / rig | **Blender** → `.glb` | Canela 3D, costales, comederos |
| Alternativa rápida | **Spline** | Prototipo de escena interactiva |
| Compresión 3D | **gltf-transform** (Draco / Meshopt / KTX2) | Modelos < 3 MB |
| Video | **FFmpeg** → WebM (VP9/AV1) + MP4 (H.264) | Loops de fondo, con `poster` |
| Imágenes | **Sharp / Astro Image** → AVIF/WebP, `srcset` | Peso mínimo |
| Mapa | **Leaflet + OpenStreetMap** (o Google Maps embed) | Gratis y estático |
| Contacto | Enlace `wa.me` de WhatsApp + **Web3Forms/Formspree** (opcional) | Sin backend |
| SEO local | JSON-LD `LocalBusiness` / `PetStore`, Open Graph, sitemap | Aparecer en Google |
| Calidad | **Lighthouse CI**, **Playwright**, **axe** | Rendimiento, pruebas, accesibilidad |
| Hosting | **Cloudflare Pages / Netlify / Vercel** + dominio | Gratis, CDN, HTTPS |

### Reglas de rendimiento
- Presupuesto: página inicial < 2 MB sin 3D, cada modelo `.glb` < 3 MB, LCP < 2.5 s en 4G.
- El 3D carga diferido (`IntersectionObserver`) y se reemplaza por **video/imagen poster** en móviles de gama baja o con `prefers-reduced-motion`.
- Pausar render de Three.js cuando la escena no es visible.
- Fallback si WebGL no está disponible.

### Estructura de carpetas propuesta
```
hinojosa-web/
├─ public/
│  ├─ models/        # canela.glb, costal-maiz.glb, ...
│  ├─ video/         # hero.webm, hero.mp4, posters
│  ├─ img/           # logo.svg, fotos de producto
│  └─ lottie/
├─ src/
│  ├─ components/    # Hero, Canela3D, ProductCard, Mapa, ...
│  ├─ data/          # productos.json, negocio.json (dirección, teléfono, redes)
│  ├─ layouts/
│  ├─ pages/index.astro
│  ├─ scripts/       # three-scene.ts, scroll.ts
│  └─ styles/        # tokens de color y tipografía
├─ PLAN.md
└─ astro.config.mjs
```

---

## 6. Plan de contenido 3D / video

| Activo | Cómo se obtiene | Uso |
|---|---|---|
| **Canela 3D** (modelo rigged, gorra, pañuelo H) | Modelar en Blender a partir del arte de la mascota, o generar con herramienta imagen→3D y limpiar | Hero, sección Canela |
| Animaciones de Canela (saludo, mover cola, pulgar arriba) | Blender (acciones) exportadas en `.glb` | Interacción al hacer clic |
| Costales con logo Hinojosa (maíz, trigo, arrocillo) | Modelo simple de costal + textura con el logo | Carrusel 3D, tarjetas |
| Granos flotando (maíz, pellet) | Partículas instanciadas en Three.js | Fondo del hero |
| Hojas del logo | Sprites/planos con paralaje | Transiciones entre secciones |
| Video hero (10–15 s en loop) | Render de Blender o video con la mascota y el local | Fondo en móvil / fallback |
| Video "el local" (opcional) | Grabación en el local con celular | Sección Ubicación |
| Lotties de iconos | Armar con LottieFiles o After Effects | Valores y pilares |

> Para empezar rápido: si no hay modelo 3D de Canela, se usa **video loop o imagen con efecto parallax en capas** y se reemplaza luego por el modelo real.

---

## 7. Skills, herramientas y MCP a instalar

Skills instaladas en el proyecto (`.claude/skills/`, copiadas con `skills add --copy`):
- **frontend-design** (`anthropics/skills`): calidad visual, evita estética genérica.
- **webapp-testing** (`anthropics/skills`): pruebas con Playwright en móvil y escritorio.
- **tailwind-design-system** (`wshobson/agents`): tokens y componentes con Tailwind.
- **wcag-accessibility** (`dembrandt/dembrandt-skills`): accesibilidad WCAG 2.2 AA.
- **performance-and-web-vitals** (`dembrandt/dembrandt-skills`): LCP, CLS e INP.
- **motion-and-storytelling** (`dembrandt/dembrandt-skills`): ritmo de animaciones y narrativa del hero.

Pendientes de evaluar:
- **Context7 MCP**: documentación actual de Astro, Three.js, GSAP.
- **skill-creator**: crear una skill propia "marca-hinojosa" con paleta, tipografía, tono y reglas de logo.
- **Blender MCP** (opcional): generar o ajustar modelos 3D desde Claude.
- **Herramientas locales:** Node.js LTS, Git, Blender, FFmpeg, gltf-transform CLI.

---

## 8. Agentes

| # | Agente | Responsabilidad | Entregable |
|---|---|---|---|
| 1 | **Contenido y estrategia** | Textos, estructura, llamadas a la acción, catálogo (`productos.json`, `negocio.json`) | Copy final en español |
| 2 | **Dirección de arte** | Paleta, tipografía, guion de animación y *storyboard* del hero | Guía de estilo + tokens |
| 3 | **Activos 3D y video** | Canela 3D, costales, loops de video, optimización | `.glb`, `.webm/.mp4`, posters |
| 4 | **Frontend** | Proyecto Astro + Tailwind, secciones responsive, accesibilidad | Sitio funcional sin 3D |
| 5 | **Animación e interacción** | Three.js, model-viewer, GSAP, Lenis, Lottie, fallbacks | Escenas integradas |
| 6 | **SEO y negocio local** | Metadatos, JSON-LD, Google Business, Open Graph, `alt` | Checklist SEO aplicada |
| 7 | **QA y rendimiento** | Lighthouse, Playwright, pruebas móviles y conexiones lentas | Informe y correcciones |
| 8 | **Despliegue** | Hosting, dominio, HTTPS, analítica, redirecciones | Sitio publicado |

**Orden:** (1 + 2) → (3 + 4 en paralelo) → 5 → 6 → 7 → 8.

---

## 9. Fases y entregables

| Fase | Trabajo | Resultado |
|---|---|---|
| 0. Datos | Confirmar dirección, ciudad, teléfono/WhatsApp, horario, Facebook, precios vigentes; reunir logo vectorial y fotos propias | `negocio.json` completo |
| 1. Diseño | Guía de estilo, wireframes, storyboard 3D | Aprobación del cliente |
| 2. Base | Proyecto Astro, layout, secciones estáticas, catálogo desde JSON | Web navegable sin 3D |
| 3. Activos | Canela 3D, costales, videos, imágenes optimizadas | Carpeta `public/` lista |
| 4. 3D y animación | Hero 3D, carrusel, tilt, Lottie, scroll | Sitio completo animado |
| 5. SEO y QA | Metadatos, Lighthouse > 90, pruebas multi-dispositivo | Informe de calidad |
| 6. Publicación | Dominio, HTTPS, analítica, WhatsApp, Google Maps | Sitio en línea |

---

## 10. Riesgos y decisiones abiertas

1. **Derechos de imágenes y marcas:** definir con el dueño qué material usar y pedir fotos propias de productos.
2. **Precios cambiantes:** mantenerlos en JSON y rotularlos como referenciales.
3. **Modelo 3D de Canela:** decidir entre modelado propio, generación asistida o video/parallax como primera versión.
4. **Rendimiento en móviles:** el público local probablemente navega desde celular; priorizar fallback ligero.
5. **Datos faltantes:** ciudad, teléfono, horario y enlaces; no publicar hasta confirmarlos.
6. **Mantenimiento:** definir quién actualizará precios y catálogo (editar el JSON o añadir un CMS ligero como Decap CMS).

---

## 11. Checklist para empezar

- [ ] Confirmar datos del negocio (sección 1)
- [ ] Obtener logo en vectorial (SVG/AI/PDF)
- [ ] Reunir fotos reales del local y productos
- [ ] Decidir enfoque 3D de Canela
- [ ] Instalar Node.js, Git, Blender, FFmpeg
- [ ] Instalar skills/MCP (sección 7)
- [ ] Crear proyecto Astro (`npm create astro@latest`)
