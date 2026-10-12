"""Utilidades compartidas para preparar activos web de Comercial Hinojosa.

No modifica nada dentro de Pre/: solo lee de alli y escribe en hinojosa-web/public.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parents[2]          # .../HINOJOSA
SRC = RAIZ / "Pre" / "hinojosa-assets"
IMG = SRC / "imagenes"
WEB = RAIZ / "hinojosa-web"
PUB = WEB / "public"

CREMA = (0xF6, 0xF1, 0xE4)
VERDE_PROFUNDO = (0x1B, 0x4D, 0x2B)
VERDE_MARCA = (0x2E, 0x8B, 0x2E)
DORADO = (0xF2, 0xB8, 0x23)


def flood_desde_bordes(mask: np.ndarray, semillas: np.ndarray | None = None) -> np.ndarray:
    """Region de `mask` conectada (4-vecinos) con los bordes de la imagen o con `semillas`."""
    if semillas is None:
        semillas = np.zeros_like(mask)
        semillas[0, :] = semillas[-1, :] = True
        semillas[:, 0] = semillas[:, -1] = True
    reg = semillas & mask
    while True:
        n = reg.copy()
        n[1:, :] |= reg[:-1, :]
        n[:-1, :] |= reg[1:, :]
        n[:, 1:] |= reg[:, :-1]
        n[:, :-1] |= reg[:, 1:]
        n &= mask
        if (n == reg).all():
            return reg
        # acelerar: varios pasos por iteracion
        for _ in range(8):
            m = n.copy()
            m[1:, :] |= n[:-1, :]
            m[:-1, :] |= n[1:, :]
            m[:, 1:] |= n[:, :-1]
            m[:, :-1] |= n[:, 1:]
            n = m & mask
        reg = n


def dilatar(mask: np.ndarray, r: int) -> np.ndarray:
    im = Image.fromarray(mask.astype(np.uint8) * 255)
    im = im.filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 127


def quitar_fondo(rgb: np.ndarray, fondo: np.ndarray, color_fondo, d_solido: float,
                 banda: int = 2, d_min: float = 0.0) -> Image.Image:
    """Devuelve RGBA. `fondo` es la mascara de fondo (alpha 0). En una banda de
    `banda` px alrededor del fondo, el alpha se estima por la diferencia maxima
    por canal respecto al color de fondo ("color a alfa", bordes suavizados) y
    el color se des-premultiplica para que no quede halo."""
    rgb = rgb.astype(np.float32)
    cf = np.array(color_fondo, np.float32)
    dist = np.abs(rgb - cf).max(axis=2)
    alpha = np.ones(rgb.shape[:2], np.float32)
    borde = dilatar(fondo, banda) & ~fondo
    a_b = np.clip((dist - d_min) / (d_solido - d_min), 0, 1)
    alpha[borde] = a_b[borde]
    alpha[fondo] = 0
    a3 = np.maximum(alpha, 1e-3)[..., None]
    col = (rgb - (1 - a3) * cf) / a3
    col = np.where(alpha[..., None] > 0, col, 0)
    out = np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def recortar_alpha(im: Image.Image, margen: int = 4) -> Image.Image:
    a = np.asarray(im.getchannel("A")) > 8
    ys, xs = np.where(a)
    x0, x1 = max(xs.min() - margen, 0), min(xs.max() + margen + 1, im.width)
    y0, y1 = max(ys.min() - margen, 0), min(ys.max() + margen + 1, im.height)
    return im.crop((x0, y0, x1, y1))


def redimensionar_ancho(im: Image.Image, ancho: int) -> Image.Image:
    if im.width <= ancho:
        return im.copy()
    alto = round(im.height * ancho / im.width)
    return im.resize((ancho, alto), Image.LANCZOS)


def guardar_webp(im: Image.Image, ruta: Path, q: int = 80, **kw) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    im.save(ruta, "WEBP", quality=q, method=6, **kw)
    return ruta


def guardar_png(im: Image.Image, ruta: Path) -> Path:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    im.save(ruta, "PNG", optimize=True)
    return ruta


def mascara_redondeada(size, radio, escala=4) -> Image.Image:
    w, h = size
    m = Image.new("L", (w * escala, h * escala), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * escala - 1, h * escala - 1), radio * escala, fill=255)
    return m.resize((w, h), Image.LANCZOS)
