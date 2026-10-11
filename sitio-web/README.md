# Sitio web de Comercial Hinojosa

Sitio estático, sin dependencias ni proceso de compilación.

## Abrir

Abre `index.html` directamente en un navegador. Para probarlo mediante un servidor local, desde esta carpeta ejecuta:

```powershell
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Publicación automática

El workflow de GitHub Actions publica esta carpeta en GitHub Pages cuando hay cambios en `main`:

`https://arielnoob24.github.io/HINOJOSA/`

La primera vez, abre **Settings → Pages** en el repositorio y selecciona **GitHub Actions** como fuente de publicación. Después, cada cambio confirmado y enviado a `main` inicia el despliegue. El enlace del repositorio sigue mostrando el código; el enlace de Pages muestra el sitio.

## Antes de publicar

- Confirma con la tienda las categorías, productos, descripciones, presentaciones y precios.
- Añade teléfono/WhatsApp, dirección exacta, horarios y enlaces oficiales cuando la dueña los apruebe.
- Sustituye las fotografías de referencia por imágenes autorizadas de la tienda y sus productos.
- Actualiza el contenido del catálogo en `index.html`; la navegación de categorías está en `app.js`.

Los datos no confirmados se señalan en la página y no se presentan como información final.