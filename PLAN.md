# Plan de trabajo: Comercial Hinojosa

## Objetivo
Crear un sitio informativo, adaptable a móvil y en español para que clientes consulten alimentos para animales, balanceados, información y precios, y encuentren cómo contactar o visitar el negocio.

No será una tienda en línea: no incluirá carrito, pagos, pedidos ni envíos.

## Alcance
- Implementar con HTML y CSS estáticos, priorizando móvil desde los estilos base y ampliando con breakpoints `min-width`; usar JavaScript solo para interacciones puntuales como filtrar categorías.
- Presentar el negocio y su trayectoria con una descripción aprobada por la dueña.
- Mostrar un catálogo organizado por categorías, con marca, presentación, descripción y precio cuando esos datos estén confirmados.
- Incluir contacto, redes sociales y ubicación. Priorizar WhatsApp y visita al local, sin publicar datos no verificados.
- Usar el logo y las fotos proporcionadas como identidad visual cuando estén disponibles como archivos del proyecto.
- Aplicar la paleta de referencia aproximadamente en proporción 60% blanco, 30% verde y 10% amarillo, manteniendo contraste legible.
- Mantener el catálogo inicial como datos del proyecto, sin panel de administración.

## Fases
1. **Diseño y accesibilidad:** aplicar las heurísticas de Nielsen y WCAG 2.2 AA; priorizar lenguaje claro, navegación predecible, foco visible, contraste, etiquetas semánticas y uso por teclado.
2. **Contenido:** confirmar con la dueña los productos, categorías, presentaciones, descripciones, precios vigentes, fotos autorizadas, teléfono/WhatsApp, dirección, horarios y redes sociales.
3. **Implementación:** crear una web estática en HTML/CSS, mobile-first; añadir portada, descripción del negocio, catálogo, contacto y redes; evitar funciones de compra o despacho.
4. **Revisión:** validar en escritorio y móvil, probar enlaces y navegación por teclado, ejecutar las pruebas/build disponibles y solicitar auditoría independiente.
5. **Publicación:** completar la información real antes de publicar; habilitar GitHub Pages una vez y desplegar automáticamente desde `main` con GitHub Actions.

## Skills solicitadas
Instalar y seguir las instrucciones completas de:
- `npx skills use "https://github.com/dembrandt/dembrandt-skills" --skill "nielsen-usability-heuristics"`
- `npx skills use "https://github.com/wshobson/agents" --skill "wcag-audit-patterns"`

Las rutas relativas de cada skill se resuelven desde el `supporting-files` que indique su instalación. Revisar las pautas manualmente además de cualquier prueba automatizada.

## Criterios de aceptación
- Se entiende qué vende el negocio y cómo consultar productos y precios.
- No se presentan precios, teléfonos, horarios, dirección ni enlaces inventados.
- Contacto y redes usan destinos reales confirmados y funcionan desde móvil.
- La interfaz se adapta a móvil y escritorio y puede recorrerse con teclado.
- Texto, controles, imágenes y estados tienen nombres accesibles, foco visible y contraste legible.
- No existe carrito, checkout, pago ni promesa de envío.
- Un push a `main` publica automáticamente `sitio-web/` en GitHub Pages después de habilitar Actions en Settings → Pages.
- Pruebas y verificaciones reportadas fueron ejecutadas realmente.

## Pendientes de la dueña
- Catálogo aprobado con nombres, categorías, marcas, presentaciones, descripciones y precios.
- Número de teléfono/WhatsApp, dirección exacta, horarios y enlaces oficiales de redes.
- Texto de descripción del negocio e imágenes originales listas para web.

## Flujo de codificación y auditoría
Usar el agente Codificador Claude para implementar y verificar los cambios. Después, usar el agente Auditor OpenCode en modo de solo lectura para revisar errores, regresiones, accesibilidad y pruebas ausentes; corregir los hallazgos confirmados y volver a validar.