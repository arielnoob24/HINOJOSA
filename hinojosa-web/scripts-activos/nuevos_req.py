"""Activos web a partir de los originales del cliente en `Nuevos Req/` (2026-10-12).

Uso (desde cualquier carpeta):
    python hinojosa-web/scripts-activos/nuevos_req.py            # todo
    python hinojosa-web/scripts-activos/nuevos_req.py imagenes   # solo productos + Canela
    python hinojosa-web/scripts-activos/nuevos_req.py video      # solo el video
    python hinojosa-web/scripts-activos/nuevos_req.py animales   # solo los animales de Inicio
    python hinojosa-web/scripts-activos/nuevos_req.py producto sal-en-grano  # un producto

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
    video/canela-jugando-alfa.webm + -alfa-poster.webp  VP9 con canal alfa (fondo quitado),
        solo cuadros 1-69 en ida y vuelta (ver ALFA_ULTIMO_CUADRO)
    img/animales/<slug>[-240].webp|.avif   480 / 240 px de alto, escena de Inicio (2026-10-17)
    img/escena/cielo[-280], campo[-320]     fondo en dos capas (Animales/fondo.jpg; ya no se usa en el sitio)
    video/campo[-movil].webm|.mp4 + -poster  fondo de Inicio en video (Animales/videofondo.mp4)
    Uso: python nuevos_req.py [imagenes] [video | video-alfa] [animales] [fondo] [videofondo] [producto <slug>...]
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
from PIL import Image, ImageFilter

from comun import PUB, RAIZ, WEB, dilatar, flood_desde_bordes

ORIG = RAIZ / "Nuevos Req"
CATALOGO = ORIG / "CatalogoF"
MASCOTA = ORIG / "Mascota"
ANIMALES = ORIG / "Animales"  # 9 animales con alfa para la escena de Inicio (2026-10-17)
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
    # sal en grano.jpg (fondo texturizado) se sustituyo el 2026-10-17 por un PNG recortado
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


def maestros_animales(tmp: Path) -> list[dict]:
    """Animales de la escena de Inicio. El RGB bajo el alfa conserva el fondo azul
    del estudio: el recorte va siempre por alfa, nunca por color."""
    trabajos = []
    dest = PUB / "img" / "animales"
    for f in sorted(ANIMALES.glob("*.png")):
        s = slug(f.name)
        im = recortar_contenido(Image.open(f).convert("RGBA"), umbral=24)
        # pixeles casi transparentes: se vacian para que el azul no tina el borde
        px = np.asarray(im).copy()
        px[px[..., 3] < 24] = 0
        m = tmp / "animales" / f"{s}.png"
        m.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(px).save(m, compress_level=1)
        trabajos.append({"in": str(m), "out": str(dest / s), "alto": 480, "avif": True})
        trabajos.append({"in": str(m), "out": str(dest / f"{s}-240"), "alto": 240, "avif": True})
    return trabajos


FONDO = ANIMALES / "fondo.jpg"  # foto del campo al atardecer (2026-10-17)
CIELO_HASTA, CAMPO_DESDE = 780, 640  # filas del original (2752x1536); horizonte ~668-705


def maestros_fondo(tmp: Path) -> list[dict]:
    """Escena de Inicio en dos capas: el cielo (sin alfa) deriva lentamente detras
    del campo (con alfa desde el horizonte), asi las nubes de la foto se mueven."""
    im = Image.open(FONDO).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    r, g = a[..., 0], a[..., 1]
    lum = 0.299 * r + 0.587 * g + 0.114 * a[..., 2]
    tierra = (g > r * 0.92) | (lum < 95)  # verde o arboles oscuros
    y0 = int(h * 0.40)
    hor = np.full(w, h - 1)
    for x in range(w):
        run = np.convolve(tierra[y0:, x].astype(int), np.ones(6, int), "valid")
        idx = np.where(run == 6)[0]
        if len(idx):
            hor[x] = y0 + idx[0]
    hor = np.clip(hor, 668, 705)
    # junto al sol la neblina engana al detector: alli el horizonte va en las colinas
    xs = np.arange(w)
    hor = np.where((xs > w * 0.52) & (xs < w * 0.70), np.maximum(hor, 692), hor)
    k = 40
    hp = np.pad(hor, k, mode="edge")
    hor = np.array([np.median(hp[i:i + 2 * k + 1]) for i in range(w)]).astype(int)
    mascara = (np.arange(h)[:, None] >= hor[None, :]).astype(np.uint8) * 255
    campo = im.convert("RGBA")
    campo.putalpha(Image.fromarray(mascara).filter(ImageFilter.GaussianBlur(4)))

    dest = PUB / "img" / "escena"
    m_cielo, m_campo = tmp / "cielo.png", tmp / "campo.png"
    im.crop((0, 0, w, CIELO_HASTA)).save(m_cielo, compress_level=1)
    campo.crop((0, CAMPO_DESDE, w, h)).save(m_campo, compress_level=1)
    return [
        {"in": str(m_cielo), "out": str(dest / "cielo"), "alto": 560, "avif": True, "q": 72},
        {"in": str(m_cielo), "out": str(dest / "cielo-280"), "alto": 280, "avif": True, "q": 72},
        {"in": str(m_campo), "out": str(dest / "campo"), "alto": 640, "avif": True, "q": 74},
        {"in": str(m_campo), "out": str(dest / "campo-320"), "alto": 320, "avif": True, "q": 74},
    ]


def fondo() -> None:
    with tempfile.TemporaryDirectory(prefix="hino-fondo-") as t:
        tmp = Path(t)
        codificar(maestros_fondo(tmp), tmp)


VIDEO_FONDO = ANIMALES / "videofondo.mp4"  # time-lapse del campo, 1920x1080, 24 fps, 10 s
# El video no empalma consigo mismo: los ultimos 1,5 s se funden con los primeros
# 1,5 s (bucle de 8,5 s sin salto).
_BUCLE = ("[0:v]fps=24,split[a][b];"
          "[a]trim=1.5:10,setpts=PTS-STARTPTS,fps=24[cuerpo];"
          "[b]trim=0:1.5,setpts=PTS-STARTPTS,fps=24[ini];"
          "[cuerpo][ini]xfade=transition=fade:duration=1.5:offset=7[v]")


def videofondo() -> None:
    """Fondo de Inicio en video (2026-10-17): sustituye a la deriva del cielo de fondo.jpg.
    Escritorio 1280x720 y movil vertical 432x768 (recorte central), WebM VP9 + MP4 H.264,
    sin audio, y poster (primer cuadro del bucle) en AVIF/WebP."""
    d = PUB / "video"
    d.mkdir(parents=True, exist_ok=True)
    variantes = {"campo": "scale=1280:-2", "campo-movil": "crop=608:1080:656:0,scale=432:768"}
    with tempfile.TemporaryDirectory(prefix="hino-videofondo-") as t:
        tmp = Path(t)
        trabajos = []
        for nombre, esc in variantes.items():
            filtro = f"{_BUCLE};[v]{esc}[o]"
            ff("-i", str(VIDEO_FONDO), "-filter_complex", filtro, "-map", "[o]", "-an",
               "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "47", "-row-mt", "1",
               "-deadline", "good", "-cpu-used", "2", str(d / f"{nombre}.webm"))
            ff("-i", str(VIDEO_FONDO), "-filter_complex", filtro, "-map", "[o]", "-an",
               "-c:v", "libx264", "-crf", "32", "-preset", "slow", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", str(d / f"{nombre}.mp4"))
            png = tmp / f"{nombre}-poster.png"
            ff("-i", str(d / f"{nombre}.mp4"), "-frames:v", "1", str(png))
            alto = 720 if nombre == "campo" else 768
            trabajos.append({"in": str(png), "out": str(d / f"{nombre}-poster"), "alto": alto,
                             "avif": True, "q": 72})
        codificar(trabajos, tmp)
    for f in sorted(d.glob("campo*")):
        print(f"{f.stat().st_size / 1024:8.1f} KB  {f}")


def animales() -> None:
    with tempfile.TemporaryDirectory(prefix="hino-animales-") as t:
        tmp = Path(t)
        codificar(maestros_animales(tmp), tmp)


def un_producto(nombres: list[str]) -> None:
    """Regenera solo los productos cuyo slug esta en `nombres` (p. ej. sal-en-grano)."""
    with tempfile.TemporaryDirectory(prefix="hino-nuevos-req-") as t:
        tmp = Path(t)
        trabajos, _ = maestros(tmp)
        sel = [x for x in trabajos if "/productos/" in x["out"].replace("\\", "/")
               and any(Path(x["out"]).name.startswith(n) for n in nombres)]
        codificar(sel, tmp)


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

def _ffmpeg() -> str | None:
    """ffmpeg del PATH o, si no esta, el binario del paquete imageio-ffmpeg."""
    if shutil.which("ffmpeg"):
        return "ffmpeg"
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return None


FFMPEG = _ffmpeg()

# Video con alfa de Nosotros: solo el tramo en que Canela esta sentada
# (mira a los lados y saluda), en ida y vuelta. Desde el cuadro ~73 baja la
# pata y se levanta, y en el salto (cuadros 116-138) la gorra se sale por
# arriba del original: ese tramo no se puede usar. El tramo no empalma
# consigo mismo (el mejor cuadro difiere ~3 veces el paso medio), por eso
# se hace ida y vuelta: sin costura. El giro va en el cuadro 69, con la pata
# arriba y casi quieta (movimiento 2,2 frente a ~25 al bajarla): girar a
# mitad de un gesto rapido (cuadro 80) hacia que la pata bajara y volviera
# a subir de golpe.
ALFA_ULTIMO_CUADRO = 69


def ff(*args: str) -> None:
    subprocess.run([FFMPEG, "-v", "error", "-y", *args], check=True)


def _recortar_cuadro(ruta: str) -> None:
    rgb = np.asarray(Image.open(ruta).convert("RGB"))
    quitar_fondo_liso(rgb, 14, 34).save(ruta, compress_level=1)


def video(con_fondo: bool = True) -> None:
    if not FFMPEG:
        sys.exit("Falta FFmpeg (PATH o pip install imageio-ffmpeg).")
    out = PUB / "video"
    out.mkdir(parents=True, exist_ok=True)
    base = out / "canela-jugando"
    esc = "scale=1280:-2:flags=lanczos"
    if con_fondo:
        _video_con_fondo(base, esc)
    _video_alfa(base)
    for f in sorted(out.glob("canela-jugando*")):
        print(f"{f.name:34s} {f.stat().st_size / 1024:8.1f} KB")


def _video_con_fondo(base: Path, esc: str) -> None:
    # 1) Version con fondo, sin audio, 1280x720
    ff("-i", str(VIDEO), "-an", "-vf", esc, "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0",
       "-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-pix_fmt", "yuv420p",
       f"{base}.webm")
    ff("-i", str(VIDEO), "-an", "-vf", esc, "-c:v", "libx264", "-preset", "slow", "-crf", "27",
       "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", f"{base}.mp4")
    with tempfile.TemporaryDirectory(prefix="hino-video-") as t:
        tmp = Path(t)
        ff("-i", str(VIDEO), "-frames:v", "1", "-vf", esc, str(tmp / "poster.png"))
        Image.open(tmp / "poster.png").save(f"{base}-poster.webp", "WEBP", quality=78, method=6)


def _video_alfa(base: Path) -> None:
    # 2) Version con alfa: el fondo es blanco/gris liso y la camara casi fija,
    #    asi que se recorta cuadro a cuadro con el mismo metodo de las imagenes.
    with tempfile.TemporaryDirectory(prefix="hino-video-") as t:
        tmp = Path(t)
        cuadros = tmp / "cuadros"
        cuadros.mkdir()
        ff("-i", str(VIDEO), "-an", "-vf", "scale=1280:-2:flags=lanczos",
           "-frames:v", str(ALFA_ULTIMO_CUADRO), str(cuadros / "%04d.png"))
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
        # Ida y vuelta: 1..N y N-1..2 (el bucle del <video> vuelve al 1)
        idavuelta = tmp / "idavuelta"
        idavuelta.mkdir()
        for k, r in enumerate(rutas + rutas[-2:0:-1], start=1):
            shutil.copyfile(r, idavuelta / f"{k:04d}.png")
        ff("-framerate", "24", "-i", str(idavuelta / "%04d.png"),
           "-vf", f"crop={w}:{h}:{x0}:{y0},scale=-2:480:flags=lanczos",
           "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "34", "-b:v", "0",
           "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "1",
           f"{base}-alfa.webm")
        primero = Image.open(rutas[0]).crop((x0, y0, x0 + w, y0 + h))
        primero = primero.resize((round(w * 480 / h / 2) * 2, 480), Image.LANCZOS)  # = scale=-2:480
        primero.save(f"{base}-alfa-poster.webp", "WEBP", quality=82, alpha_quality=90, method=6)


if __name__ == "__main__":
    que = sys.argv[1:] or ["imagenes", "video", "animales", "fondo", "videofondo"]
    if "imagenes" in que:
        imagenes()
    if "video" in que:
        video()
    elif "video-alfa" in que:  # solo la version con alfa
        video(con_fondo=False)
    if "animales" in que:
        animales()
    if "fondo" in que:
        fondo()
    if "videofondo" in que:
        videofondo()
    if "producto" in que:  # python nuevos_req.py producto sal-en-grano
        un_producto(que[que.index("producto") + 1:])
