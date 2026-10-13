# Activos entregados por el cliente

Aquí van **tal cual, sin modificar**, los archivos que entrega el cliente. Los originales no se optimizan ni se sobrescriben: la versión lista para la web se genera aparte, en `hinojosa-web/public/`.

Esto importa porque la optimización es destructiva (redecimar una malla, rehornear texturas, reencodar un video) y el archivo original puede no volver a estar disponible.

## Dónde poner cada cosa

```
activos-cliente/
├─ perrito/        <- la animación del perrito caminando
├─ productos-3d/   <- los modelos 3D de los productos
└─ otros/          <- cualquier otro material (fotos del local, fachada, logo vectorial)
```

## Perrito caminando

Va en la franja inferior de la vista Inicio, cruzando en horizontal de derecha a izquierda, en bucle.

Cualquier formato sirve y se adapta: Lottie (`.json`, `.lottie`), sprite sheet o secuencia de PNG, GIF, video con o sin canal alfa, o un modelo 3D con ciclo de caminata. El orden de preferencia, de mejor a peor para la web, es: **Lottie › sprite sheet › video con alfa › GIF › video sin alfa**.

Dos cosas conviene revisar al entregarlo:
- Que el **bucle calce**: el último cuadro debe enlazar con el primero sin salto visible.
- Si camina de izquierda a derecha no es problema, se espeja.

## Productos en 3D

Van en la ruleta de la vista Productos. Cualquier formato sirve (`.glb`, `.gltf`, `.blend`, `.fbx`, `.obj`, `.usdz`) y se convierte a `.glb` comprimido.

Al entregarlos conviene indicar **a qué producto o categoría corresponde cada archivo**, con el nombre del archivo o una lista aparte. Las 10 categorías de la ruleta son: Aves · Cerdos · Vacas · Cuyes y conejos · Perros · Gatos · Tilapia · Granos · Accesorios · Semillas.

Si los modelos vienen de un programa de render (mallas de cientos de miles de polígonos, texturas de 4K, materiales procedurales), se pueden entregar igual: hay que adaptarlos, y eso se hace aquí. Lo que no se puede es usarlos tal cual en la web.

## Presupuesto que condiciona todo

La escena completa de la ruleta tiene que pesar **menos de 3 MB**, con un máximo de 10 objetos en pantalla. Si los modelos entregados no caben ni después de optimizarlos, la ruleta 3D se sustituye por una rejilla de imágenes y el catálogo sigue funcionando igual. Ver el riesgo 6 de `PLAN.md`.
