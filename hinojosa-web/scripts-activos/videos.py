"""Regenera los videos web desde los afiches, con fondo limpio (crema o verde de
marca, nunca gris), zoom lento (Ken Burns) y fundidos, en bucle sin corte.

Los videos originales de Pre/hinojosa-assets/videos usaban como margen el mismo
afiche desenfocado y oscurecido, lo que dejaba bordes grises/marrones. Aqui se
mantiene el mismo contenido y orden de afiches, solo cambia el fondo.

Salidas: public/video/<nombre>.mp4 (H.264, faststart), .webm (VP9), sin audio,
y public/video/posters/<nombre>.webp (primer fotograma).

Uso:  python hinojosa-web/scripts-activos/videos.py [nombre ...]
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageFilter

from comun import CREMA, IMG, PUB, VERDE_PROFUNDO, guardar_webp, mascara_redondeada

FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 25
ZOOM = 0.06            # 6 % de acercamiento/alejamiento por diapositiva
TMP = Path(os.environ.get("HINO_TMP", tempfile.gettempdir())) / "hino-video"


def afiche(rel):
    return Image.open(IMG / rel).convert("RGB")


def png(rel):
    return Image.open(PUB / rel).convert("RGBA")


class Diapo:
    """Una diapositiva: imagen (RGB o RGBA), color de fondo y tamano relativo."""

    def __init__(self, im, fondo=CREMA, alto=0.88, ancho=0.88, redondeo=True, sombra=True):
        self.im, self.fondo, self.alto, self.ancho = im, fondo, alto, ancho
        self.redondeo, self.sombra = redondeo, sombra

    def preparar(self, W, H):
        im = self.im
        s = min(W * self.ancho / im.width, H * self.alto / im.height) * (1 + ZOOM)
        w, h = round(im.width * s), round(im.height * s)
        im = im.resize((w, h), Image.LANCZOS)
        if im.mode != "RGBA":
            im = im.convert("RGBA")
            if self.redondeo:
                im.putalpha(mascara_redondeada((w, h), max(8, round(min(w, h) * 0.025))))
        pad = round(max(w, h) * 0.06)
        card = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
        if self.sombra:
            a = Image.new("L", card.size, 0)
            a.paste(im.getchannel("A"), (pad, pad + round(pad * 0.25)))
            a = a.filter(ImageFilter.GaussianBlur(pad * 0.35)).point(lambda v: int(v * 0.32))
            sombra = Image.new("RGBA", card.size, VERDE_PROFUNDO + (0,))
            sombra.putalpha(a)
            card.alpha_composite(sombra)
        card.alpha_composite(im, (pad, pad))
        self.card = card.convert("RGBa")       # premultiplicado: sin halos al transformar
        self.base = 1 + ZOOM
        self.bg = Image.new("RGB", (W, H), self.fondo)

    def cuadro(self, W, H, z):
        """z en [1, 1+ZOOM]: escala relativa. Transformacion afin con subpixel."""
        s = z / self.base
        cw, ch = self.card.size
        ox, oy = (W - cw * s) / 2, (H - ch * s) / 2
        t = self.card.transform((W, H), Image.AFFINE, (1 / s, 0, -ox / s, 0, 1 / s, -oy / s),
                                resample=Image.BICUBIC).convert("RGBA")
        out = self.bg.copy()
        out.paste(t, (0, 0), t)
        return out


def suave(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def render(nombre, diapos, W, H, paso, fundido=0.8, crf_mp4=27, crf_webm=41):
    for d in diapos:
        d.preparar(W, H)
    n = len(diapos)
    total = n * paso
    frames = round(total * FPS)
    TMP.mkdir(parents=True, exist_ok=True)
    inter = TMP / f"{nombre}-lossless.mkv"
    cmd = [FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "ultrafast", "-qp", "0",
           "-pix_fmt", "yuv444p", str(inter)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    ventana = paso + fundido
    primero = None

    def zoom_de(i, T):
        # ventana de la diapo i: [i*paso - fundido, (i+1)*paso]; con envoltura para el bucle
        t0 = i * paso - fundido
        u = ((T - t0) % total) / ventana
        e = suave(u)
        return 1 + ZOOM * (e if i % 2 == 0 else 1 - e)

    for k in range(frames):
        T = k / FPS
        i = int(T // paso) % n
        fin = (i + 1) * paso
        img = diapos[i].cuadro(W, H, zoom_de(i, T))
        if T > fin - fundido:                       # fundido hacia la siguiente
            j = (i + 1) % n
            a = suave((T - (fin - fundido)) / fundido)
            img = Image.blend(img, diapos[j].cuadro(W, H, zoom_de(j, T)), a)
        if k == 0:
            primero = img.copy()
        p.stdin.write(img.tobytes())
    p.stdin.close()
    p.wait()

    out = PUB / "video"
    (out / "posters").mkdir(parents=True, exist_ok=True)
    guardar_webp(primero, out / "posters" / f"{nombre}.webp", q=78)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(inter), "-an", "-c:v", "libx264",
                    "-preset", "slow", "-crf", str(crf_mp4), "-profile:v", "high", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", str(out / f"{nombre}.mp4")], check=True)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(inter), "-an", "-c:v", "libvpx-vp9",
                    "-b:v", "0", "-crf", str(crf_webm), "-row-mt", "1", "-deadline", "good",
                    "-cpu-used", "2", "-pix_fmt", "yuv420p", str(out / f"{nombre}.webm")], check=True)
    inter.unlink(missing_ok=True)
    kb = lambda f: round((out / f).stat().st_size / 1024)
    print(f"{nombre}: {W}x{H} {total:.1f}s  mp4 {kb(nombre + '.mp4')} KB  webm {kb(nombre + '.webm')} KB")


def p(n):
    return afiche(f"productos/{n}.webp")


VIDEOS = {
    "hero": lambda: render("hero", [
        Diapo(png("img/marca/logo.png"), alto=0.62, ancho=0.62, sombra=False),
        Diapo(png("img/canela/canela-insignia.png"), fondo=VERDE_PROFUNDO, alto=0.86, sombra=False),
        Diapo(afiche("afiches/06-tu-mejor-aliado.webp")),
        Diapo(afiche("afiches/05-valores-esencia.webp")),
    ], 1280, 720, paso=3.0),
    "canela": lambda: render("canela", [
        Diapo(afiche("mascota/04-conoce-a-canela.webp")),
        Diapo(png("img/canela/canela-insignia.png"), fondo=VERDE_PROFUNDO, ancho=0.86, sombra=False),
        Diapo(png("img/canela/canela-pulgar.png"), ancho=0.82),
        Diapo(afiche("afiches/06-tu-mejor-aliado.webp")),
    ], 720, 1280, paso=2.9),
    "catalogo": lambda: render("catalogo", [Diapo(p(n), ancho=0.9, alto=0.9) for n in [
            "07-nutritivos-linea-premium", "21-nutritivos-cerdos-vacas-cuyes", "14-balanceados-camperito",
            "09-maiz", "08-afrecho-trigo-arrocillo", "12-procan-perros", "18-nutrapro-dogchow-procat",
            "11-arena-gatos", "17-tilapia", "20-semillas"]], 720, 1280, paso=2.2),
    "nosotros": lambda: render("nosotros", [
        Diapo(afiche("afiches/03-mision-vision.webp")),
        Diapo(afiche("afiches/05-valores-esencia.webp")),
        Diapo(afiche("afiches/06-tu-mejor-aliado.webp")),
    ], 1280, 720, paso=3.7),
    "mascotas": lambda: render("mascotas", [Diapo(p(n), ancho=0.9, alto=0.9) for n in [
        "15-procan-perros-2", "16-masticables", "22-masticables-mascan", "19-bebederos-mascotas",
        "10-bebederos-comederos-aves", "13-sal-melaza"]], 720, 1280, paso=2.3),
}

if __name__ == "__main__":
    for nombre in sys.argv[1:] or list(VIDEOS):
        VIDEOS[nombre]()
