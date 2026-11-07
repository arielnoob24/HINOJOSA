# Auditoría de fotos vs. catálogo

- **Fecha:** 2026-11-06
- **Fuente de fotos:** `hinojsa/` (55 imágenes JPEG de WhatsApp, 2026-10-26). La carpeta se llama `hinojsa`, sin la "o", y está sin versionar.
- **Catálogo comparado:** `hinojosa-web/src/data/productos.json` (36 productos).
- **Método:** revisión visual de las 55 fotos en hojas de contacto (6 por hoja). Los textos pequeños de algunos empaques pueden tener errores de lectura.
- **Estado:** solo informe. No se modificó ningún dato del sitio.

## 1. Productos faltantes

| # foto | Producto visible | Nota |
|---|---|---|
| 2 | Pro-can Minihuesos con Colágeno, 7 u., sabor carne | No existe en el catálogo. |
| 3 | Pro-can Huesos con Colágeno, hueso grande en funda | Se lee "628 g"; confirmar con el cliente. |
| 8, 9 | Pro-can Cachorros razas medianas y grandes, receta original, 4 kg | El catálogo solo tiene cachorros razas pequeñas. |
| 10, 11 | Pro-can Adultos razas pequeñas, pollo, carne y vegetales, 4 kg | Tampoco está. |
| 14, 15, 16, 17, 19 | Buen Can Cachorros razas medianas y grandes, pollo y yogurt, 4 kg | El catálogo solo tiene Buen Can adultos. |
| 20, 22 | Cani Premium Cachorros, razas pequeñas, 2 kg | El catálogo solo tiene "adultos y senior". |
| 20, 22, 23, 27 | Línea Canimentos (Bio Alimentar): adultos y cachorros, razas pequeñas y medianas/grandes, 2 kg | Línea distinta de Cani Premium. |
| 47 | Bebedero/comedero tolva amarillo con base roja | Modelo y color distintos de los del catálogo. |
| 49, 55 | Mascan Masticables sabor ahumado | Ver sección 2. |

## 2. Discrepancias de variantes

- **Pro-can adultos** (8, 9, 11, 12): el catálogo solo dice "medianas y grandes". Se ven dos recetas, Pollo y Carne, arroz y vegetales. Además existe la versión de razas pequeñas.
- **Pro-can rejos y palitos** (1, 4, 7, 46, 52–54): el catálogo tiene un solo producto. En las fotos son tres presentaciones: palitos con colágeno 6 u., rejos con colágeno 8 u. y rejos de colágeno 20 u. (pack grande, foto 7).
- **Pro-can con regalo** (9, 11): las bolsas traen un sobre de rejos "GRATIS". Es una promoción, no un producto.
- **Mascan** (49, 51, 55): masticables de tres sabores (pollo, ahumado y carne) y una bolsa de mini huesos prensados. Solo `mascan-huesos-prensados` menciona sabores, y no incluye ahumado.
- **Pro-Cat arena** (26, 29): aroma lavanda, 4 kg, con pala naranja gratis. El catálogo no da aroma ni peso.
- **NutraPro arena** (28, 33): 4 kg (8,8 lb), acción 5 en 1. El catálogo no indica peso.
- **Freemiau** (24, 25): variante con aroma a lavanda. El catálogo no menciona aroma.
- **Platos de mascotas** (42, 43, 48, 50): colores naranja, rojo, rosa en forma de pata y azul con huesito, más un plato doble translúcido. El catálogo los agrupa en dos productos sin colores ni modelos.
- **Bebederos y comederos de aves** (5, 6, 13, 30, 31, 34, 36, 37, 45): tolvas con tapa roja en dos tamaños, bebederos blancos tipo galón con base roja en dos tamaños y un bebedero grande con asas para colgar (unos 10 L). El catálogo solo tiene un bebedero y un comedero plástico.
- **Semillas** (35, 38–41, 44): las ocho variedades del catálogo aparecen y coinciden: tomate Floradade, sandía Jubilee, melón Edisto, pimiento Yolo Wonder, perejil, cebolla colorada, cebollín y pepino Tomore Cucumber.

Los productos del catálogo que no aparecen en ninguna foto (Nutri, Camperito, maíz, trigo, Dog Chow, Pro-Cat alimento y otros) no cuentan como faltantes; simplemente no hay foto para ellos.

## 3. Dudas o imágenes ambiguas

- **13:** bebedero blanco con mucho reflejo; parece tipo galón, pero no se distingue el modelo.
- **31:** tolva alta con asas, sin base visible; no está claro si es bebedero o comedero colgante.
- **50:** plato doble translúcido; podría ser el "comedero doble con dispensador" del catálogo, pero no se ve el dispensador.
- **27:** Canimentos adultos y cachorros medianas y grandes; el peso ("2 kg") se lee con dificultad.
- **10 y 11:** el código de color de las bolsas Pro-can adultos (naranja, verde) no deja claro qué receta es cada una.
- **Fotos repetidas:** 5 y 6; 8/9 y 10/11 (Pro-can); 14–17 y 19 (Buen Can); 24 y 25 (Freemiau); 28 y 33 (NutraPro); 34 y 36 (bebederos).
- **Afiches de marketing, no fotos de producto:** 37, 39, 40, 44, 48, 52, 54 y 55.

## 4. Qué se recomienda hacer

Ordenado por prioridad.

1. **Confirmar con el cliente antes de tocar datos.** Hay datos que solo él sabe: precios de los productos nuevos, pesos reales (el "628 g" del hueso Pro-can), si las variantes nuevas están realmente en stock, y si hay más recetas o sabores. No inventar precios; el catálogo ya tiene `avisoPrecios`.
2. **Añadir los productos de mayor visibilidad y claridad en foto** (prioridad alta):
   - Buen Can cachorros.
   - Cani Premium cachorros.
   - Línea Canimentos.
   - Pro-can cachorros razas medianas y grandes.
   - Pro-can minihuesos y huesos con colágeno.
3. **Ampliar los productos existentes en vez de duplicarlos** cuando la diferencia es solo presentación: rejos y palitos Pro-can (6, 8 y 20 u.), Mascan (sabores pollo, ahumado y carne), arenas (aroma lavanda, 4 kg) y platos de mascotas (colores). Usar el campo `presentacion`, que ya existe, o separar entradas si el cliente fija precio distinto por variante.
4. **Completar `presentacion` y `marca` donde están vacíos** (`null`): los comederos y bebederos no tienen marca, y varios productos de mascotas no tienen presentación. Es una mejora barata con los datos que ya muestran las fotos.
5. **Preparar las imágenes.** Elegir por producto la mejor foto (preferir las de fondo blanco o render: 8, 10, 12, 16, 17, 19, 28, 29, 53) frente a las tomadas en el local. Descartar duplicados y afiches. Generar los derivados web (`.webp`/`.avif` en 400 px y miniatura) con los scripts de `scripts-activos`, como los demás productos.
6. **Resolver las dudas con el cliente** (sección 3): modelo del bebedero 13, tolva 31, plato doble 50 y peso de Canimentos.
7. **No publicar a `main` desde aquí.** Los cambios al catálogo van por la rama de trabajo habitual (`Ariel`) y pasan por QA (`qa-rendimiento`) antes de cualquier despliegue.
8. **Decidir qué hacer con `hinojsa/`.** Pesa unos 12 MB y está sin versionar. Mover los originales útiles a `Nuevos Req/` o `activos-cliente/` con nombres descriptivos (los actuales son "WhatsApp Image …") y no subir la carpeta tal cual.
