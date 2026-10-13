# Paquete de recursos – Comercial Hinojosa

## imagenes/
- **marca/**: logo completo e isotipo "H" (recortes PNG de la hoja de logo). Se recomienda pedir el logo vectorial (SVG) al dueño.
- **mascota/**: Canela (insignia, recorte, pulgar arriba).
- **afiches/**: logo y significado, misión/visión, valores, "tu mejor aliado".
- **productos/**: 16 afiches de productos (.webp para web, .jpg de respaldo).

## videos/ (cada uno en .mp4 H.264 y .webm VP9, sin audio)
| Archivo | Formato | Dónde usarlo |
|---|---|---|
| 01-hero-marca-16x9 | 1920x1080, ~12 s | Fondo del hero (escritorio) |
| 02-conoce-a-canela-9x16 | 1080x1920, ~11 s | Sección Canela / hero móvil |
| 03-catalogo-productos-9x16 | 1080x1920, ~22 s | Sección catálogo |
| 04-nosotros-valores-16x9 | 1920x1080, ~11 s | Quiénes somos, misión/visión/valores |
| 05-mascotas-y-accesorios-9x16 | 1080x1920, ~14 s | Mascotas y accesorios |

## posters/
Primer fotograma de cada video (JPG) para usar como `poster` mientras carga.

## Uso en HTML
```html
<video autoplay muted loop playsinline poster="posters/01-hero-marca-16x9.jpg">
  <source src="videos/01-hero-marca-16x9.webm" type="video/webm">
  <source src="videos/01-hero-marca-16x9.mp4" type="video/mp4">
</video>
```

## Importante
- Las imágenes fuente miden ~650–1200 px; sirven para web pero se ven suaves a pantalla completa. Conviene reemplazarlas por fotos propias y el logo vectorial.
- Los videos son animaciones (zoom y fundidos) hechas con esos afiches; no son renders 3D. El 3D de Canela sigue pendiente (ver PLAN.md).
- Marcas de terceros: confirmar permiso de uso. Los precios de los afiches pueden estar desactualizados.
