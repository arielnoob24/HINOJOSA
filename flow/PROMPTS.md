# Canela corriendo — guía para generar los clips en Google Flow

**Lo que queremos en el sitio (Inicio, franja inferior):**
Canela aparece **sentada como en `Canela.png`**, se levanta y **sale corriendo hacia la izquierda** hasta el borde de la pantalla, **frena y da la vuelta**, corre hasta el borde derecho, frena y da la vuelta… en bucle. Solo se sienta al principio. Igual en móvil y escritorio.

## Opción rápida: un solo video (la que usaste)

Imagen de referencia / primer cuadro: `flow/canela-inicio-azul.png`. Formato 16:9. **Exportar en 1080p** (no GIF ni 270p).

```
Use the reference image as the first frame. The character is a cute 3D animated puppy (Pixar style): light brown fur, big brown eyes, floppy ears, a green baseball cap with a white "H" clover logo and the text "COMERCIAL HINOJOSA", and a green collar with a green four-leaf-clover "H" tag and a small teddy-bear charm. Keep the character's design, colors, cap logo and collar exactly the same in every frame.

Action, in this order:
0–2 s: the puppy is sitting facing the camera exactly as in the reference image, then happily stands up and turns its body so it is in full side profile facing the LEFT edge of the frame.
2–4.5 s: it runs with an energetic, joyful gallop toward the left, ears bouncing, tail wagging, tongue out.
4.5–5.5 s: it playfully skids to a stop, then quickly turns around to face the RIGHT edge of the frame.
5.5–8 s: it runs with the same energetic gallop toward the right.

Important: the puppy runs IN PLACE, like on a treadmill. Its body stays horizontally centered in the frame the whole time and never travels across the frame or leaves it. Full body always visible.

Static locked-off camera: no camera movement, no pan, no zoom. Solid flat uniform blue background (#0047BB) for the entire video, with no floor, no ground shadow, no props and no text other than the cap logo. Soft, even studio lighting.
```

**No hace falta que el video haga el bucle ni que termine de una forma concreta**: de él se recortan tres piezas (arranque, un paso de carrera y el giro) y **la página las encadena**. La página sabe cuándo Canela llegó a un borde porque es ella quien la mueve por la pantalla.

---

## Opción detallada: tres clips

El recorrido real por la pantalla **lo hace el sitio** (CSS mueve a Canela de un lado a otro, porque cada pantalla tiene un ancho distinto). A Flow solo le pedimos los **movimientos del cuerpo**, con Canela **corriendo en el sitio** (como en una cinta, sin avanzar dentro del cuadro) y con la cámara fija:

| Clip | Qué hace Canela | Se usa |
|---|---|---|
| **1. Arranque** | Sentada de frente → se levanta → gira de perfil mirando a la izquierda → empieza a correr en el sitio | Una vez, al entrar en Inicio |
| **2. Carrera en bucle** | Corre de perfil hacia la izquierda, en el sitio, ciclo que empalma sin corte | Todo el tiempo que corre (espejado para correr a la derecha) |
| **3. Frenar y girar** | Corriendo hacia la izquierda → frena → se da la vuelta → corre hacia la derecha | En el borde izquierdo (espejado, en el borde derecho) |

## Reglas para todos los clips

- **Fondo azul plano** (como en `canela-inicio-azul.png`). Lo quitamos después para dejar a Canela sin fondo. **No uses fondo verde**: la gorra y el collar son verdes y desaparecerían.
- **Cámara fija**, Canela **centrada** y **de cuerpo entero** todo el clip, sin que se salga del cuadro.
- **Sin suelo, sin sombra, sin objetos, sin texto añadido.** La sombra la ponemos en el sitio.
- **Formato 16:9.** Sin audio (no importa si lo trae).
- Genera **2–4 variantes** de cada clip y quédate con la que mejor conserve a Canela (gorra "COMERCIAL HINOJOSA", collar verde con el trébol "H" y la plaquita de osito, cara y color iguales).
- Los prompts van en **inglés** porque el modelo los sigue mejor.

---

## Clip 1 — Arranque

**Modo:** *Frames to Video*.
**Primer cuadro:** `flow/canela-inicio-azul.png`. **Último cuadro:** vacío.

```
A cute 3D animated puppy (Pixar style) sits facing the camera, exactly as in the reference image: light brown fur, big brown eyes, floppy ears, green baseball cap with a white "H" clover logo and the text "COMERCIAL HINOJOSA", green collar with a green four-leaf-clover "H" tag and a small teddy-bear charm. The puppy happily stands up, turns its body to its right so it is in full side profile facing the LEFT edge of the frame, and starts running in place with an energetic gallop, ears bouncing and tongue out. The puppy stays in the center of the frame the whole time; it runs on the spot like on a treadmill and does not travel across the frame. Static locked-off camera, no camera movement, no zoom. Solid flat uniform blue background (#0047BB), no floor, no ground shadow, no props, no text other than the cap logo. Full body always visible. Soft even studio lighting. Character design, colors and cap logo stay exactly consistent.
```

> Si el modelo la hace avanzar por el cuadro, añade al final: `The puppy's body remains horizontally centered in every frame.`

---

## Clip 2 — Carrera en bucle

**Antes:** del clip 1 elegido, guarda un cuadro donde Canela ya corre de perfil hacia la izquierda, con las patas extendidas (en Flow: pausar en ese cuadro y guardarlo como imagen; o pásame el video y lo extraigo yo). Llámalo `canela-corre-izq.png`.

**Modo:** *Frames to Video*.
**Primer cuadro y último cuadro:** **el mismo** `canela-corre-izq.png` (así el bucle empalma).

```
The same 3D animated puppy (Pixar style) with the green "COMERCIAL HINOJOSA" cap and green clover "H" collar tag runs in place in full side profile facing the LEFT edge of the frame. A smooth, joyful, seamless looping run cycle: a light gallop with legs stretching and gathering rhythmically, ears flapping, tail wagging, tongue out, happy expression. The puppy stays exactly centered and does not move across the frame, like running on a treadmill. The first and last frames are identical so the animation loops perfectly. Static locked-off camera, no camera movement. Solid flat uniform blue background (#0047BB), no floor, no ground shadow, no props. Full body always visible. Consistent character design and colors.
```

> Lo ideal es que en los 8 s haya **varios ciclos de zancada iguales**; nosotros recortamos uno solo (unos 0,5–0,8 s) que empalme perfecto.

---

## Clip 3 — Frenar y girar

**Antes:** prepara el cuadro espejado de `canela-corre-izq.png` (Canela corriendo hacia la derecha). Llámalo `canela-corre-der.png`. Si quieres, lo genero yo.

**Modo:** *Frames to Video*.
**Primer cuadro:** `canela-corre-izq.png`. **Último cuadro:** `canela-corre-der.png`.

```
The same 3D animated puppy (Pixar style) with the green "COMERCIAL HINOJOSA" cap and green clover "H" collar tag is running in place in side profile facing the LEFT edge of the frame. It playfully skids to a stop, its paws bracing and ears flopping forward, then quickly and happily turns around to face the RIGHT edge of the frame and starts running in place again toward the right with the same energetic gallop. The puppy stays centered in the frame the whole time and does not travel across it. Static locked-off camera, no camera movement. Solid flat uniform blue background (#0047BB), no floor, no ground shadow, no props. Full body always visible. Consistent character design and colors.
```

> El giro debería durar 1–1,5 s. Si el clip sale muy lento, no importa: recortamos y aceleramos.

---

## Qué hacer con los clips

Descárgalos (MP4) a `flow/` con estos nombres y avísame:

- `clip1-arranque.mp4`
- `clip2-carrera.mp4`
- `clip3-giro.mp4`

Con eso yo:
1. Quito el fondo azul.
2. Recorto el tramo útil de cada clip y cierro el bucle de la carrera.
3. Lo convierto a **secuencias de cuadros (sprite sheets) en WebP**. Se ven igual en todos los navegadores (incluido Safari en iPhone, que no reproduce bien video con transparencia), se pueden pausar en cualquier cuadro y pesan poco.
4. Sincronizo la velocidad con la que el sitio mueve a Canela con la zancada, para que las patas no "patinen" sobre el suelo.

## Bebedero plástico para aves (imagen, no video)

> **✅ Resuelto el 2026-10-14:** se le quitó el fondo en Paint (`bebedero_quitado_disque.jpg`) y el script de activos recorta el blanco que quedó al guardarlo en JPG. Lo de abajo queda como referencia para otras imágenes con el mismo problema.

El render `Nuevos Req/CatalogoF/Comederos y Bebederos/bebedero.png` trae un **damero gris y blanco pintado**: la IA que lo generó "dibujó" la transparencia en vez de dejarla transparente. Como el bebedero es blanco, no se puede quitar bien por código. Dos caminos:

**A. Quitar el fondo con una herramienta de recorte (lo más rápido).** Sube `bebedero.png` a una herramienta de quitar fondo con IA, por ejemplo remove.bg, Adobe Express ("Quitar fondo", gratis), Canva ("Eliminar fondo") o Photoshop ("Quitar fondo"). Descarga en **PNG**. Revisa que no quede damero bajo los platos rojos ni se coman los bordes blancos del frasco.

**B. Regenerarla sobre un color plano** (Gemini / Nano Banana, ChatGPT u otra IA de imagen, subiendo `bebedero.png` como referencia). **No pidas "fondo transparente"**: casi todas las IAs de imagen vuelven a pintar el damero. Pide un color plano que no exista en el producto (verde croma), y yo lo quito:

```
Edit this image: keep the two poultry drinkers exactly as they are (same shape, same white plastic bottles, same red plastic bases, same lighting and angle). Replace the entire checkerboard background with a solid, flat, uniform chroma green background (#00B140). No checkerboard pattern, no gradient, no floor, no shadow on the background, no reflections, no text. Keep the full products visible with a small margin around them.
```

Guarda el resultado como `flow/bebedero-nuevo.png` y avísame: lo paso por el script de activos para generar todas sus versiones web.

---

## Revisa antes de mandármelos

- [ ] La gorra y el collar se mantienen iguales en todo el clip (sin letras deformadas en el momento del giro).
- [ ] Canela no se sale del cuadro ni avanza por él.
- [ ] El fondo es azul liso en todo el clip, sin sombras ni suelo.
- [ ] En el clip 2, el primer y el último cuadro son iguales (el bucle no salta).
