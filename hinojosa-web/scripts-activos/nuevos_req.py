"""Activos web a partir de los originales del cliente en `Nuevos Req/` (2026-10-12).

Uso (desde cualquier carpeta):
    python hinojosa-web/scripts-activos/nuevos_req.py            # todo
    python hinojosa-web/scripts-activos/nuevos_req.py imagenes   # solo productos + Canela
    python hinojosa-web/scripts-activos/nuevos_req.py video      # solo el video

Requisitos: Python 3.13 + Pillow + numpy; Node con `sharp` (en hinojosa-web/node_modules)
para codificar WebP/AVIF; FFmpeg en el PATH (`scoop install ffmpeg`) para el video.

Nunca escribe en `Nuevos Req/`: lee de alli, prepara "maestros" PNG en una carpeta
temporal y deja la version web en `hinojosa-web/public/`:

    img/productos/<cat>/<slug>.webp|.avif   800 px de alto, recortado al contenido
    img/productos/<cat>/<slug>-400.webp|.avif  400 px de alto (srcset movil)
    img/productos/<cat>/<slug>-thumb.webp   160 px de alto
    img/productos/<cat>/<slug>-thumb-80.webp  80 px de alto (lista del catalogo)
    img/marca/isotipo-96.webp               96 px de alto (barra), desde img/marca/isotipo.png
    img/canela/canela.webp|.avif            600 px de alto
    img/canela/canela-franja[@2x].webp|.avif  200 / 400 px de alto
    video/canela-jugando.webm|.mp4 + -poster.webp       video con fondo, sin audio
    video/canela-jugando-alfa.webm + -alfa-poster.webp  VP9 con canal alfa (fondo quitado)
"""
import json
import multiprocessing as mp
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

import numpy as np
from PIL import Image

from comun import PUB, RAIZ, WEB, dilatar, flood_desde_bordes

ORIG = RAIZ / "Nuevos Req"
CATALOGO = ORIG / "CatalogoF"
MASCOTA = ORIG / "Mascota"
VIDEO = MASCOTA / "Canela Jugando.mp4"
CODIFICADOR = Path(__file__).with_name("nuevos_req_codificar.mjs")

CATEGORIAS = {
    "Alimento Animales de Granja": "granja",
    "Alimento Mascotas": "mascotas",
    "Comederos y Bebederos": "comederos",
    "Granos y Semillas": "granos",
}
ERRATAS = {"balaceado": "balanceado"}

# Imagenes que llegaron con fondo. Valor: parametros de recorte, o None si el
# recorte no queda limpio y se publica con su fondo.
CON_FONDO = {
    "melaza.jpg": (18, 40),                     # fondo gris liso de estudio: se recorta
    "sal en grano.jpg": None,                   # foto con fondo texturizado: se deja
    "diferentes tipos de semillas.jpg": None,   # bordes blancos de los sobres se confunden con el fondo
}

# Originales que se sustituyen por una version corregida que dejo el usuario en la
# misma carpeta (se publica con el slug del original y la version corregida no
# genera un producto propio).
# bebedero.png traia un damero "falso transparente" pintado; el usuario le quito el
# fondo en Paint, pero lo guardo en JPG, asi que llega sobre blanco puro.
REEMPLAZOS = {
    "bebedero.png": "bebedero_quitado_disque.jpg",
}


def slug(nombre: str) -> str:
    s = unicodedata.normalize("NFKD", Path(nombre).stem).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    for mal, bien in ERRATAS.items():
        s = re.sub(rf"\b{mal}\b", bien, s)
    return s


# ---------------------------------------------------------------- recorte de fondo

def modelo_fondo(rgb: np.ndarray, borde: int = 6) -> np.ndarray:
    """Superficie cuadratica por canal ajustada a los pixeles del borde (fondo con degradado)."""
    h, w, _ = rgb.shape
    m = np.zeros((h, w), bool)
    m[:borde] = m[-borde:] = True
    m[:, :borde] = m[:, -borde:] = True
    ys, xs = np.nonzero(m)

    def base(y, x):
        return np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], -1)

    A = base(ys / h, xs / w)
    Y, X = np.mgrid[0:h, 0:w]
    B = base(Y / h, X / w)
    out = np.empty(rgb.shape, np.float32)
    for c in range(3):
        v = rgb[ys, xs, c].astype(np.float32)
        coef, *_ = np.linalg.lstsq(A, v, rcond=None)
        r = np.abs(A @ coef - v)
        k = r < np.percentile(r, 90) + 1          # una pasada robusta
        coef, *_ = np.linalg.lstsq(A[k], v[k], rcond=None)
        out[..., c] = B @ coef
    return out


def quitar_fondo_liso(rgb: np.ndarray, t_fondo: float, t_solido: float) -> Image.Image:
    """RGBA sin el fondo liso conectado con los bordes. Las sombras neutras sobre el
    fondo se conservan como sombra negra semitransparente (se ven bien sobre crema)."""
    rgbf = rgb.astype(np.float32)
    bg = modelo_fondo(rgb)
    dist = np.abs(rgbf - bg).max(2)
    fondo = flood_desde_bordes(dist < t_fondo)
    banda = dilatar(fondo, 2) & ~fondo
    alpha = np.ones(dist.shape, np.float32)
    a = np.clip((dist - t_fondo) / (t_solido - t_fondo), 0, 1)
    alpha[banda] = a[banda]
    alpha[fondo] = 0
    ratio = rgbf / np.maximum(bg, 1)
    rm = ratio.mean(2)
    neutro = (np.abs(ratio - rm[..., None]).max(2) < 0.035) & (rm > 0.35) & (rm < 1.0)
    sombra = flood_desde_bordes(fondo | neutro, fondo) & ~fondo
    alpha[sombra] = np.clip((1 - rm - 0.02) / 0.98, 0, 1)[sombra]
    rgbf[sombra] = 0
    bg[sombra] = 0
    a3 = np.maximum(alpha, 1e-3)[..., None]
    col = np.where(alpha[..., None] > 0, (rgbf - (1 - a3) * bg) / a3, 0)
    return Image.fromarray(np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")


def quitar_fondo_blanco(rgb: np.ndarray, umbral: float = 2, d_solido: float = 18) -> Image.Image:
    """RGBA sin el blanco puro conectado con los bordes. Para productos blancos sobre
    blanco: `quitar_fondo_liso` toma su sombreado neutro por sombra y lo vacia."""
    rgbf = rgb.astype(np.float32)
    dist = (255 - rgbf).max(2)
    fondo = flood_desde_bordes(dist <= umbral)
    banda = dilatar(fondo, 2) & ~fondo
    alpha = np.ones(dist.shape, np.float32)
    alpha[banda] = np.clip(dist / d_solido, 0, 1)[banda]
    alpha[fondo] = 0
    a3 = np.maximum(alpha, 1e-3)[..., None]
    col = np.where(alpha[..., None] > 0, (rgbf - (1 - a3) * 255) / a3, 0)
    return Image.fromarray(np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")


def recortar_contenido(im: Image.Image, margen: int = 6, umbral: int = 8) -> Image.Image:
    if im.mode != "RGBA":
        return im
    a = np.asarray(im.getchannel("A")) > umbral
    ys, xs = np.where(a)
    x0, x1 = max(xs.min() - margen, 0), min(xs.max() + margen + 1, im.width)
    y0, y1 = max(ys.min() - margen, 0), min(ys.max() + margen + 1, im.height)
    return im.crop((x0, y0, x1, y1))


# ---------------------------------------------------------------- imagenes

def maestros(tmp: Path) -> tuple[list[dict], list[str]]:
    trabajos, con_fondo = [], []
    for carpeta, cat in CATEGORIAS.items():
        for f in sorted((CATALOGO / carpeta).iterdir()):
            if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
                continue
            if f.name in REEMPLAZOS.values():
                continue
            s = slug(f.name)
            im = Image.open(f)
            if f.name in REEMPLAZOS:
                im = quitar_fondo_blanco(np.asarray(Image.open(f.with_name(REEMPLAZOS[f.name])).convert("RGB")))
            elif f.name in CON_FONDO:
                params = CON_FONDO[f.name]
                if params:
                    im = quitar_fondo_liso(np.asarray(im.convert("RGB")), *params)
                else:
                    im = im.convert("RGB")
                    con_fondo.append(f"{cat}/{s}")
            else:
                im = im.convert("RGBA")
            im = recortar_contenido(im)
            m = tmp / cat / f"{s}.png"
            m.parent.mkdir(parents=True, exist_ok=True)
            im.save(m, compress_level=1)
            dest = PUB / "img" / "productos" / cat
            trabajos.append({"in": str(m), "out": str(dest / s), "alto": 800, "avif": True})
            # variante para el carrusel en movil (tarjeta de ~116 px de ancho)
            trabajos.append({"in": str(m), "out": str(dest / f"{s}-400"), "alto": 400, "avif": True})
            trabajos.append({"in": str(m), "out": str(dest / f"{s}-thumb"), "alto": 160, "avif": False})
            # lista del catalogo: hueco de 40 px -> 80 px cubre pantallas 2x (QA M6)
            trabajos.append({"in": str(m), "out": str(dest / f"{s}-thumb-80"), "alto": 80, "avif": False})

    canela = recortar_contenido(Image.open(MASCOTA / "Canela.png").convert("RGBA"))
    m = tmp / "canela.png"
    canela.save(m, compress_level=1)
    d = PUB / "img" / "canela"
    trabajos += [
        {"in": str(m), "out": str(d / "canela"), "alto": 600, "avif": True},
        {"in": str(m), "out": str(d / "canela-franja"), "alto": 200, "avif": True},
        {"in": str(m), "out": str(d / "canela-franja@2x"), "alto": 400, "avif": True},
    ]
    # Isotipo pequeno para la barra (se pinta a 36-40 px; QA M7). Parte del
    # isotipo.png que genera marca_canela.py; no sobrescribe isotipo.webp.
    marca = PUB / "img" / "marca"
    trabajos.append({"in": str(marca / "isotipo.png"), "out": str(marca / "isotipo-96"),
                     "alto": 96, "avif": False, "q": 90})
    return trabajos, con_fondo


def codificar(trabajos: list[dict], tmp: Path) -> None:
    manifiesto = tmp / "trabajos.json"
    manifiesto.write_text(json.dumps(trabajos), encoding="utf-8")
    subprocess.run(["node", str(CODIFICADOR), str(manifiesto)], check=True, cwd=WEB)


def imagenes() -> None:
    with tempfile.TemporaryDirectory(prefix="hino-nuevos-req-") as t:
        tmp = Path(t)
        trabajos, con_fondo = maestros(tmp)
        codificar(trabajos, tmp)
    print("Publicadas con su fondo original:", ", ".join(con_fondo) or "ninguna")


# ---------------------------------------------------------------- video

def ff(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def _recortar_cuadro(ruta: str) -> None:
    rgb = np.asarray(Image.open(ruta).convert("RGB"))
    quitar_fondo_liso(rgb, 14, 34).save(ruta, compress_level=1)


def video() -> None:
    if not shutil.which("ffmpeg"):
        sys.exit("Falta FFmpeg en el PATH (scoop install ffmpeg).")
    out = PUB / "video"
    out.mkdir(parents=True, exist_ok=True)
    base = out / "canela-jugando"

    # 1) Version con fondo, sin audio, 1280x720
    esc = "scale=1280:-2:flags=lanczos"
    ff("-i", str(VIDEO), "-an", "-vf", esc, "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0",
       "-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-pix_fmt", "yuv420p",
       f"{base}.webm")
    ff("-i", str(VIDEO), "-an", "-vf", esc, "-c:v", "libx264", "-preset", "slow", "-crf", "27",
       "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", f"{base}.mp4")
    with tempfile.TemporaryDirectory(prefix="hino-video-") as t:
        tmp = Path(t)
        ff("-i", str(VIDEO), "-frames:v", "1", "-vf", esc, str(tmp / "poster.png"))
        Image.open(tmp / "poster.png").save(f"{base}-poster.webp", "WEBP", quality=78, method=6)

        # 2) Version con alfa: el fondo es blanco/gris liso y la camara casi fija,
        #    asi que se recorta cuadro a cuadro con el mismo metodo de las imagenes.
        cuadros = tmp / "cuadros"
        cuadros.mkdir()
        ff("-i", str(VIDEO), "-an", "-vf", "scale=1280:-2:flags=lanczos", str(cuadros / "%04d.png"))
        rutas = sorted(str(p) for p in cuadros.glob("*.png"))
        with mp.Pool() as pool:
            pool.map(_recortar_cuadro, rutas, chunksize=4)
        # caja comun a todos los cuadros para que Canela no "salte"
        x0 = y0 = 10**9
        x1 = y1 = 0
        for r in rutas:
            a = np.asarray(Image.open(r).getchannel("A")) > 12
            ys, xs = np.where(a)
            x0, y0 = min(x0, xs.min()), min(y0, ys.min())
            x1, y1 = max(x1, xs.max()), max(y1, ys.max())
        m = 8
        x0, y0, x1, y1 = max(x0 - m, 0), max(y0 - m, 0), min(x1 + m, 1279), min(y1 + m, 719)
        w, h = (x1 - x0 + 1) // 2 * 2, (y1 - y0 + 1) // 2 * 2
        print(f"Caja de recorte del video con alfa: {w}x{h} en ({x0},{y0})")
        ff("-framerate", "24", "-i", str(cuadros / "%04d.png"),
           "-vf", f"crop={w}:{h}:{x0}:{y0},scale=-2:480:flags=lanczos",
           "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "34", "-b:v", "0",
           "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "1",
           f"{base}-alfa.webm")
        primero = Image.open(rutas[0]).crop((x0, y0, x0 + w, y0 + h))
        primero = primero.resize((round(w * 480 / h / 2) * 2, 480), Image.LANCZOS)  # = scale=-2:480
        primero.save(f"{base}-alfa-poster.webp", "WEBP", quality=82, alpha_quality=90, method=6)

    for f in sorted(out.glob("canela-jugando*")):
        print(f"{f.name:34s} {f.stat().st_size / 1024:8.1f} KB")


if __name__ == "__main__":
    que = sys.argv[1:] or ["imagenes", "video"]
    if "imagenes" in que:
        imagenes()
    if "video" in que:
        video()
