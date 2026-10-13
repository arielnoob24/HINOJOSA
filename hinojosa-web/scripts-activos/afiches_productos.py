"""Afiches de productos y de marca optimizados para web (WebP 900 px y 480 px).

Mantiene los nombres de origen (el catalogo los referencia asi).
Uso:  python hinojosa-web/scripts-activos/afiches_productos.py
"""
from PIL import Image

from comun import IMG, PUB, guardar_webp, redimensionar_ancho


def procesar(carpeta: str):
    for src in sorted((IMG / carpeta).glob("*.webp")):
        im = Image.open(src).convert("RGB")
        guardar_webp(redimensionar_ancho(im, 900), PUB / "img" / carpeta / src.name, q=80)
        guardar_webp(redimensionar_ancho(im, 480), PUB / "img" / carpeta / f"{src.stem}-480.webp", q=78)
        print(carpeta, src.name, im.size)


if __name__ == "__main__":
    procesar("productos")
    procesar("afiches")
