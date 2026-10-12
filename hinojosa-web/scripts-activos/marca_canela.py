"""Logo, isotipo, favicons y recortes de Canela con fondo transparente.

Uso:  python hinojosa-web/scripts-activos/marca_canela.py
"""
import base64
import io

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from comun import (CREMA, DORADO, IMG, PUB, VERDE_PROFUNDO, dilatar, flood_desde_bordes,
                   guardar_png, guardar_webp, quitar_fondo, recortar_alpha, redimensionar_ancho)

BLANCO = (253, 253, 253)


def sin_fondo_blanco(ruta, caja_isotipo, tol=14.0, d_solido=175.0):
    """Quita el blanco conectado con los bordes y los huecos blancos de las letras,
    pero conserva el blanco interior de la H (dentro de `caja_isotipo`)."""
    rgb = np.asarray(Image.open(ruta).convert("RGB"))
    f = rgb.astype(np.float32)
    dist = np.abs(f - BLANCO).max(axis=2)
    casi_blanco = dist < tol
    # La sombra/halo del original es gris claro poco saturado: tambien es fondo
    # si esta conectado con el blanco exterior.
    gris_claro = (f.min(axis=2) > 180) & (f.max(axis=2) - f.min(axis=2) < 28)
    fondo = flood_desde_bordes(casi_blanco | gris_claro)
    # Huecos cerrados (O, A, R...) fuera del isotipo tambien son fondo.
    fuera = np.ones_like(casi_blanco)
    x0, y0, x1, y1 = caja_isotipo
    fuera[y0:y1, x0:x1] = False
    fondo |= casi_blanco & fuera
    return quitar_fondo(rgb, fondo, BLANCO, d_solido, banda=4, d_min=4)


def logo():
    im = sin_fondo_blanco(IMG / "marca" / "logo-completo-recorte.png", (335, 10, 590, 245))
    im = recortar_alpha(im, 6)
    guardar_png(im, PUB / "img" / "marca" / "logo.png")
    guardar_webp(im, PUB / "img" / "marca" / "logo.webp", q=88, alpha_quality=90)
    chico = redimensionar_ancho(im, 480)
    guardar_webp(chico, PUB / "img" / "marca" / "logo-480.webp", q=88, alpha_quality=90)
    return im


def isotipo():
    im = sin_fondo_blanco(IMG / "marca" / "isotipo-H-recorte.png", (60, 40, 260, 230))
    im = recortar_alpha(im, 4)
    guardar_png(im, PUB / "img" / "marca" / "isotipo.png")
    guardar_webp(im, PUB / "img" / "marca" / "isotipo.webp", q=88, alpha_quality=90)
    return im


def cuadrado(im, lado, fondo=None, relleno=0.0):
    """Centra `im` en un cuadrado de `lado` px, con margen `relleno` (fraccion)."""
    util = round(lado * (1 - 2 * relleno))
    s = min(util / im.width, util / im.height)
    r = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    lienzo = Image.new("RGBA", (lado, lado), (0, 0, 0, 0) if fondo is None else fondo + (255,))
    lienzo.alpha_composite(r, ((lado - r.width) // 2, (lado - r.height) // 2))
    return lienzo


def favicons(iso):
    guardar_png(cuadrado(iso, 32), PUB / "favicon.png")
    guardar_png(cuadrado(iso, 180, fondo=CREMA, relleno=0.1).convert("RGB"), PUB / "apple-touch-icon.png")
    grande = cuadrado(iso, 256)
    grande.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    buf = io.BytesIO()
    cuadrado(iso, 64).quantize(128, method=Image.Quantize.FASTOCTREE).save(buf, "PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
           'viewBox="0 0 64 64" width="64" height="64">'
           f'<image width="64" height="64" href="data:image/png;base64,{b64}" '
           f'xlink:href="data:image/png;base64,{b64}"/></svg>\n')
    (PUB / "favicon.svg").write_text(svg, encoding="utf-8")


def insignia():
    """Insignia (aro + placa) sin el fondo verde oscuro del afiche.

    Mascara GEOMETRICA, sin flood fill de color: el panuelo de Canela es del
    mismo verde oscuro que el fondo y un relleno por color se lo llevaba.
    Medidas sobre canela-insignia-fondo.png (880x892), ajustando los bordes
    del aro verde exterior (minimos cuadrados, error +-2 px):
      - aro: elipse centro (436.6, 427.2), semiejes 391.9 x 414.6
      - placa: rectangulo x 83..795, y 669..876; esquinas sup. r=30, inf. r=45
    Se dibuja a 4x y se reduce con LANCZOS (antialiasing). Todo lo interior queda opaco.
    """
    src = Image.open(IMG / "mascota" / "canela-insignia-fondo.png").convert("RGB")
    esc = 4
    W, H = src.size
    m = Image.new("L", (W * esc, H * esc), 0)
    d = ImageDraw.Draw(m)
    cx, cy, ra, rb = 436.6, 427.2, 391.9 + 0.5, 414.6 + 0.5
    d.ellipse(((cx - ra) * esc, (cy - rb) * esc, (cx + ra) * esc, (cy + rb) * esc), fill=255)
    x0, y0, x1, y1 = 83, 669, 796, 877
    # esquinas inferiores (r=45) en todo el rectangulo ...
    d.rounded_rectangle((x0 * esc, y0 * esc, x1 * esc, y1 * esc), 45 * esc, fill=255)
    # ... y esquinas superiores (r=30) solo en la mitad de arriba de la placa
    sup = Image.new("L", m.size, 0)
    ImageDraw.Draw(sup).rounded_rectangle((x0 * esc, y0 * esc, x1 * esc, y1 * esc), 30 * esc, fill=255)
    sup.paste(0, (0, 770 * esc, W * esc, H * esc))
    m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(sup)))
    m = m.resize((W, H), Image.LANCZOS)
    im = src.convert("RGBA")
    im.putalpha(m)
    im = recortar_alpha(im, 2)
    guardar_png(im, PUB / "img" / "canela" / "canela-insignia.png")
    guardar_webp(im, PUB / "img" / "canela" / "canela-insignia.webp", q=82, alpha_quality=90)
    guardar_webp(redimensionar_ancho(im, 480), PUB / "img" / "canela" / "canela-insignia-480.webp",
                 q=82, alpha_quality=90)
    return im


def pulgar():
    """Canela con el pulgar arriba (afiche 06). No se puede aislar sin restos
    (la tapan el perro, el gato, la gallina y el fondo del campo), asi que se
    recorta en circulo con aro dorado y fondo crema, como la insignia."""
    src = Image.open(IMG / "afiches" / "06-tu-mejor-aliado.webp").convert("RGB")
    cx, cy, r = 706, 406, 156          # centro en la cara/pulgar de Canela
    lado = 2 * r
    rec = src.crop((cx - r, cy - r, cx + r, cy + r))
    esc = 4
    m = Image.new("L", (lado * esc, lado * esc), 0)
    ImageDraw.Draw(m).ellipse((0, 0, lado * esc - 1, lado * esc - 1), fill=255)
    m = m.resize((lado, lado), Image.LANCZOS)
    aro = 10
    total = lado + 2 * aro
    out = Image.new("RGBA", (total, total), (0, 0, 0, 0))
    disco = Image.new("L", (total * esc, total * esc), 0)
    d = ImageDraw.Draw(disco)
    d.ellipse((0, 0, total * esc - 1, total * esc - 1), fill=255)
    disco = disco.resize((total, total), Image.LANCZOS)
    out.paste(Image.new("RGBA", (total, total), DORADO + (255,)), (0, 0), disco)
    interior = Image.new("L", (total * esc, total * esc), 0)
    ImageDraw.Draw(interior).ellipse((3 * esc, 3 * esc, (total - 3) * esc - 1, (total - 3) * esc - 1), fill=255)
    interior = interior.resize((total, total), Image.LANCZOS)
    out.paste(Image.new("RGBA", (total, total), CREMA + (255,)), (0, 0), interior)
    out.paste(rec, (aro, aro), m)
    guardar_png(out, PUB / "img" / "canela" / "canela-pulgar.png")
    guardar_webp(out, PUB / "img" / "canela" / "canela-pulgar.webp", q=82, alpha_quality=90)
    return out


def conoce():
    im = Image.open(IMG / "mascota" / "04-conoce-a-canela.webp").convert("RGB")
    guardar_webp(redimensionar_ancho(im, 900), PUB / "img" / "canela" / "conoce-a-canela.webp", q=80)
    guardar_webp(redimensionar_ancho(im, 480), PUB / "img" / "canela" / "conoce-a-canela-480.webp", q=80)


if __name__ == "__main__":
    logo()
    favicons(isotipo())
    insignia()
    pulgar()
    conoce()
    print("listo")
