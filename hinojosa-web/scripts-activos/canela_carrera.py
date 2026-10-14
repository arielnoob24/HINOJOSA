"""Sprites de Canela corriendo para la franja inferior de Inicio (fase 5-B, bloque 4-B).

Fuente: flow/Puppy_running_in_place_1080p_20261013235908.mp4 (Google Flow, 1920x1080,
24 fps, 10 s). Canela corre EN EL SITIO y centrada sobre un azul medio (~#2B73AA) con
vineta y una sombra de suelo azul oscuro. El video no se modifica.

Uso (desde cualquier carpeta):
    python hinojosa-web/scripts-activos/canela_carrera.py
    python hinojosa-web/scripts-activos/canela_carrera.py --preview RUTA.png   # hoja de control

FFmpeg: usa la variable de entorno FFMPEG, si no `ffmpeg` del PATH y, si tampoco, el
binario del paquete de Python `imageio-ffmpeg`.

Salida en hinojosa-web/public/img/canela/:
    carrera-arranque.webp   sentada de frente -> se levanta -> corre a la izquierda
    carrera-izq.webp        un ciclo de zancada a la izquierda (bucle)
    carrera-giro.webp       corre a la izquierda -> frena y gira -> corre a la derecha
    carrera-der.webp        un ciclo de zancada a la derecha (bucle, nativo: sin espejar)
    carrera.json            medidas de los sprites (ver docs/activos.md)

Cada sprite es una tira horizontal de cuadros del mismo tamano, recortados con una caja
comun a todas las piezas (Canela no salta al cambiar de pieza) y a la misma escala.

Recorte del fondo (clave de croma por "azulidad" normalizada):
    q = (B - max(R, G)) / B
El fondo vale q ~ 0.32 en todo el cuadro, tambien en la vineta y en la sombra del suelo
(la sombra solo oscurece, no cambia el matiz), asi que la sombra cae con el fondo.
El pelaje, la gorra verde, la lengua y el blanco de la placa tienen q <= 0.05.
alpha = clip((Q0 - q) / (Q0 - Q1)). Los pixeles no conectados con el fondo (ojos,
blanco del logo) se fuerzan opacos. El color se "des-premultiplica" con una placa de
fondo (superficie cuadratica ajustada a los pixeles de fondo de cada cuadro) y se quita
el tinte azul restante limitando B <= max(R, G) donde q > 0 (despill).
"""
import argparse
import json
import multiprocessing as mp
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from comun import CREMA, PUB, RAIZ, VERDE_PROFUNDO, dilatar, flood_desde_bordes

VIDEO = RAIZ / "flow" / "Puppy_running_in_place_1080p_20261013235908.mp4"
OUT = PUB / "img" / "canela"
FPS_FUENTE = 24
PASO = 2                    # 24 fps -> 12 fps
ALTO = 320                  # alto del cuadro final (franja de Inicio x2)
Q0, Q1 = 0.25, 0.06         # azulidad: >= Q0 fondo, <= Q1 opaco
CALIDAD = 58                # WebP (color)
CALIDAD_ALFA = 60           # WebP (alfa): el alfa del pelaje es la mitad del peso

# Ventanas de busqueda (en cuadros de 24 fps), de la revision del video (PLAN.md vista 1)
# Medido: la carrera a la izquierda solo es periodica (galope) desde ~2.5 s, con periodo
# de 14 cuadros (0.58 s); la derecha, desde ~6 s, con periodo de 12 (0.5 s). Entre 5.4 y
# 6 s acelera y no se repite: ese tramo queda dentro del giro.
VENT_IZQ = (48, 115)        # 2.0-4.8 s carrera a la izquierda
PERIODOS = range(12, 21, 2) # 0.5-0.83 s; pares para muestrear a 12 fps sin romper el bucle
INICIO_IZQ = (60, 75)       # el ciclo izquierdo empieza en 2.5-3.1 s (el arranque desemboca en el)
ARRANQUE_DESDE = 11         # 0-0.45 s esta quieta, sentada: la pagina ya muestra canela-franja
PAUSA = (38, 46)            # 1.6-1.9 s quieta de pie (movimiento < 0.006): se salta
SALIDA_GIRO = (88, 100)     # el giro sale de la carrera izquierda en 3.7-4.2 s (ultimo ciclo entero)
VENT_DER = (130, 200)       # 5.4-8.3 s carrera a la derecha (a partir de ~8.3 s vuelve de frente)
INICIO_DER = (140, 156)     # el ciclo derecho empieza en 5.8-6.5 s
ENTRADA_DER = (128, 142)    # el giro termina en el cuadro mas parecido al inicio del ciclo derecho


def ffmpeg() -> str:
    exe = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not exe:
        try:
            import imageio_ffmpeg
            exe = imageio_ffmpeg.get_ffmpeg_exe()
        except ImportError:
            sys.exit("Falta FFmpeg: define FFMPEG, ponlo en el PATH o instala imageio-ffmpeg.")
    return exe


# ---------------------------------------------------------------- recorte

def placa_fondo(rgb: np.ndarray, es_fondo: np.ndarray, paso: int = 8) -> np.ndarray:
    """Superficie cuadratica por canal ajustada a los pixeles de fondo (submuestreados)."""
    h, w, _ = rgb.shape
    m = es_fondo[::paso, ::paso]
    ys, xs = np.nonzero(m)
    ys, xs = ys * paso, xs * paso

    def base(y, x):
        return np.stack([np.ones_like(x), x, y, x * x, y * y, x * y], -1)

    A = base(ys / h, xs / w)
    Y, X = np.mgrid[0:h, 0:w]
    B = base(Y / h, X / w)
    out = np.empty(rgb.shape, np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, rgb[ys, xs, c].astype(np.float32), rcond=None)
        out[..., c] = B @ coef
    return out


def recortar(ruta: str) -> None:
    """Sobrescribe el PNG del cuadro con su version RGBA sin fondo."""
    rgb = np.asarray(Image.open(ruta).convert("RGB")).astype(np.float32)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    q = (B - np.maximum(R, G)) / np.maximum(B, 1)
    alpha = np.clip((Q0 - q) / (Q0 - Q1), 0, 1)

    # Fondo conectado con los bordes (a 1/4 de resolucion, basta para la topologia).
    peq = Image.fromarray(((q > (Q0 + Q1) / 2) * 255).astype(np.uint8))
    peq = np.asarray(peq.resize((rgb.shape[1] // 4, rgb.shape[0] // 4), Image.BOX)) > 127
    # Semillas: los bordes y todo hueco de fondo de >= ~20 px de lado (el azul que se ve
    # entre las patas). Los brillos azulados de los ojos son mas pequenos y no siembran.
    semillas = ~dilatar(~peq, 2)
    semillas[0, :] = semillas[-1, :] = semillas[:, 0] = semillas[:, -1] = True
    conectado = flood_desde_bordes(peq, semillas)
    cerca = dilatar(conectado, 3)
    cerca = np.asarray(Image.fromarray(cerca.astype(np.uint8) * 255)
                       .resize((rgb.shape[1], rgb.shape[0]), Image.NEAREST)) > 127
    alpha[~cerca] = 1.0                     # ojos, blanco de la placa: nunca transparentes

    bg = placa_fondo(rgb, q > Q0 + 0.03)
    a3 = np.maximum(alpha, 1e-3)[..., None]
    col = np.where(alpha[..., None] > 0, (rgb - (1 - a3) * bg) / a3, 0)
    col = np.clip(col, 0, 255)
    # despill: sin tinte azul en el borde del pelaje ni en las patas desenfocadas
    tope = np.maximum(col[..., 0], col[..., 1])
    azul = (q > 0) & (alpha > 0)
    col[..., 2] = np.where(azul, np.minimum(col[..., 2], tope), col[..., 2])
    alpha[alpha < 0.04] = 0
    # motas sueltas del ruido de compresion lejos del cuerpo: fuera
    h, w = alpha.shape
    gruesa = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                        .resize((w // 8, h // 8), Image.BOX)) > 96
    cuerpo = dilatar(gruesa, 3)
    cuerpo = np.asarray(Image.fromarray(cuerpo.astype(np.uint8) * 255).resize((w, h), Image.NEAREST)) > 127
    alpha[~cuerpo] = 0
    out = np.dstack([col, alpha * 255]).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(ruta, compress_level=1)


# ---------------------------------------------------------------- seleccion de cuadros

def firmas(rutas: list[str]) -> np.ndarray:
    """Cuadro reducido (RGB premultiplicado + alfa) para comparar poses."""
    fs = []
    for r in rutas:
        im = Image.open(r).resize((240, 135), Image.BOX)
        a = np.asarray(im).astype(np.float32) / 255
        fs.append(np.dstack([a[..., :3] * a[..., 3:], a[..., 3:]]))
    return np.stack(fs)


def mejor_bucle(F: np.ndarray, inicio: tuple[int, int], fin: int) -> tuple[int, int, float]:
    """(cuadro inicial, periodo, error) del ciclo que mejor empalma."""
    mejor = None
    for p in PERIODOS:
        for s in range(inicio[0], inicio[1] + 1):
            if s + p > fin:
                continue
            e = float(np.abs(F[s] - F[s + p]).mean())
            if mejor is None or e < mejor[2]:
                mejor = (s, p, e)
    return mejor


def mas_parecido(F: np.ndarray, ref: int, ventana: tuple[int, int]) -> tuple[int, float]:
    es = [(i, float(np.abs(F[i] - F[ref]).mean())) for i in range(ventana[0], ventana[1] + 1)]
    return min(es, key=lambda t: t[1])


# ---------------------------------------------------------------- zancada

def zancada(rutas: list[str], s: int, p: int, escala: float) -> dict:
    """Desplazamiento del suelo por ciclo, en px a la escala final.

    Corriendo en el sitio, una pata apoyada se desliza hacia atras a la velocidad a la que
    avanzaria el cuerpo. Para cada par de cuadros consecutivos (24 fps) del ciclo se toma
    la franja de contacto (los BANDA px mas bajos sobre la linea de suelo del ciclo) y, si
    en los dos cuadros hay pata apoyada, se busca el corrimiento horizontal dx que mejor
    superpone el perfil de alfa de la franja (correlacion). Esa es la velocidad del suelo
    en ese paso. Se supone velocidad de crucero constante: zancada = mediana de los pasos con
    apoyo x cuadros del ciclo (la mediana descarta los pasos en que una pata se levanta y
    otra se apoya, que dan corrimientos falsos)."""
    BANDA, MIN_APOYO = 22, 400
    alfas = [np.asarray(Image.open(rutas[i]).getchannel("A")).astype(np.float32) / 255
             for i in range(s, s + p + 1)]
    suelo = max(np.nonzero((a > 0.5).any(1))[0].max() for a in alfas)
    perfiles = [a[suelo - BANDA:suelo + 1].sum(0) for a in alfas]
    pasos = []
    for k in range(p):
        a, b = perfiles[k], perfiles[k + 1]
        if a.sum() < MIN_APOYO or b.sum() < MIN_APOYO:
            pasos.append(None)
            continue
        dxs = range(-120, 121)
        err = [np.abs(np.roll(a, d) - b).sum() for d in dxs]
        pasos.append(float(dxs[int(np.argmin(err))]))
    medidos = [d for d in pasos if d is not None]
    total = (float(np.median(medidos)) if medidos else 0.0) * p
    return {
        "pxCuadroFuente": pasos,
        "zancadaFuente": round(abs(total), 1),
        "zancada": round(abs(total) * escala, 1),
        "pasosConApoyo": len(medidos),
        "sentidoSuelo": "derecha" if total > 0 else "izquierda",
    }


# ---------------------------------------------------------------- salida

def tira(rutas: list[str], caja, ancho: int, alto: int) -> Image.Image:
    x0, y0, x1, y1 = caja
    hoja = Image.new("RGBA", (ancho * len(rutas), alto), (0, 0, 0, 0))
    for k, r in enumerate(rutas):
        im = Image.open(r).crop((x0, y0, x1, y1))
        # redimensionar en premultiplicado para no oscurecer el borde
        a = np.asarray(im).astype(np.float32) / 255
        pm = np.dstack([a[..., :3] * a[..., 3:], a[..., 3:]])
        ch = [Image.fromarray(pm[..., c]).resize((ancho, alto), Image.LANCZOS) for c in range(4)]
        pm = np.clip(np.dstack([np.asarray(c) for c in ch]), 0, 1)
        al = pm[..., 3:]
        rgb = np.where(al > 1e-3, pm[..., :3] / np.maximum(al, 1e-3), 0)
        # alfa limpio: casi opaco -> opaco y casi transparente -> 0 (menos ruido que codificar)
        al = np.where(al > 0.94, 1.0, np.where(al < 0.05, 0.0, al))
        out = np.dstack([np.clip(rgb, 0, 1), al]) * 255
        hoja.paste(Image.fromarray(out.round().astype(np.uint8), "RGBA"), (k * ancho, 0))
    return hoja


def hoja_preview(sprites: dict, ancho: int, alto: int, ruta: Path) -> None:
    """Cada pieza sobre crema y sobre verde profundo, para buscar halo azul."""
    filas = []
    for nombre, im in sprites.items():
        n = im.width // ancho
        for fondo in (CREMA, VERDE_PROFUNDO):
            f = Image.new("RGBA", im.size, fondo + (255,))
            f.alpha_composite(im)
            filas.append((nombre, f.convert("RGB"), n))
    maxn = max(n for _, _, n in filas)
    esc = 0.5
    W = int(ancho * esc) * min(maxn, 12)
    bloques = []
    for nombre, f, n in filas:
        f = f.resize((int(f.width * esc), int(f.height * esc)), Image.LANCZOS)
        cw = int(ancho * esc)
        for k in range(0, n, 12):
            bloques.append(f.crop((k * cw, 0, min(n, k + 12) * cw, f.height)))
    H = sum(b.height for b in bloques)
    p = Image.new("RGB", (W, H), (255, 255, 255))
    y = 0
    for b in bloques:
        p.paste(b, (0, y))
        y += b.height
    # detalle 1:1 de un cuadro de cada fondo (el giro, de frente, tiene mas borde)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    p.save(ruta)


def main() -> None:
    global ALTO, CALIDAD, CALIDAD_ALFA
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", type=Path, help="PNG de control (piezas sobre crema y verde)")
    ap.add_argument("--cuadros", type=Path, help="carpeta para conservar (y reutilizar) los cuadros recortados")
    ap.add_argument("--alto", type=int, default=ALTO, help=f"alto del cuadro (por defecto {ALTO})")
    ap.add_argument("--q", type=int, default=CALIDAD, help=f"calidad WebP del color (por defecto {CALIDAD})")
    ap.add_argument("--qa", type=int, default=CALIDAD_ALFA, help=f"calidad WebP del alfa (por defecto {CALIDAD_ALFA})")
    args = ap.parse_args()
    ALTO, CALIDAD, CALIDAD_ALFA = args.alto, args.q, args.qa
    if not VIDEO.exists():
        sys.exit(f"No esta el video: {VIDEO}")

    with tempfile.TemporaryDirectory(prefix="hino-carrera-") as t:
        tmp = args.cuadros or Path(t)
        tmp.mkdir(parents=True, exist_ok=True)
        if not (tmp / "listo").exists():
            subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(VIDEO), "-an",
                            str(tmp / "%03d.png")], check=True)
            with mp.Pool() as pool:
                pool.map(recortar, sorted(str(p) for p in tmp.glob("*.png")), chunksize=4)
            (tmp / "listo").touch()
        rutas = sorted(str(p) for p in tmp.glob("*.png"))   # rutas[i] = cuadro i (0-based)

        F = firmas(rutas)
        s_izq, p_izq, e_izq = mejor_bucle(F, INICIO_IZQ, VENT_IZQ[1])
        g0, e_g0 = mas_parecido(F, s_izq, SALIDA_GIRO)
        s_der, p_der, e_der = mejor_bucle(F, INICIO_DER, VENT_DER[1])
        t_der, e_t = mas_parecido(F, s_der, ENTRADA_DER)
        mov = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3))   # movimiento medio entre cuadros

        piezas = {
            # el arranque termina justo antes del primer cuadro del ciclo izquierdo
            "arranque": [i for i in range(ARRANQUE_DESDE + (s_izq - ARRANQUE_DESDE) % PASO, s_izq, PASO)
                         if not PAUSA[0] < i < PAUSA[1]],
            "izq": list(range(s_izq, s_izq + p_izq, PASO)),
            # el giro sale de un cuadro equivalente al inicio del ciclo izquierdo (la pagina
            # termina un ciclo y sigue con el giro) y llega a uno equivalente al inicio del
            # ciclo derecho (t_der); despues se reproduce el ciclo derecho
            "giro": list(range(g0, t_der, PASO)),
            "der": list(range(s_der, s_der + p_der, PASO)),
        }

        # caja comun a todos los cuadros usados
        usados = sorted({i for v in piezas.values() for i in v})
        x0 = y0 = 10**9
        x1 = y1 = 0
        centros = {}
        for i in usados:
            a = np.asarray(Image.open(rutas[i]).getchannel("A")) > 12
            ys, xs = np.nonzero(a)
            x0, y0 = min(x0, xs.min()), min(y0, ys.min())
            x1, y1 = max(x1, xs.max() + 1), max(y1, ys.max() + 1)
            centros[i] = ((xs.min() + xs.max()) / 2, ys.max())
        m = 6
        x0, y0, x1, y1 = max(x0 - m, 0), max(y0 - m, 0), min(x1 + m, 1920), min(y1 + m, 1080)
        escala = ALTO / (y1 - y0)
        ancho = round((x1 - x0) * escala / 2) * 2
        x1 = x0 + round(ancho / escala)              # caja con la misma proporcion que el cuadro
        if x1 > 1920:
            x0, x1 = 1920 - (x1 - x0), 1920
        caja = (int(x0), int(y0), int(x1), int(y1))

        print("piezas:", {k: (v[0], v[-1], len(v)) for k, v in piezas.items()}, "caja:", caja, "cuadro:", ancho, ALTO)
        OUT.mkdir(parents=True, exist_ok=True)
        sprites, info = {}, {}
        total = 0
        for nombre, idx in piezas.items():
            hoja = tira([rutas[i] for i in idx], caja, ancho, ALTO)
            ruta = OUT / f"carrera-{nombre}.webp"
            hoja.save(ruta, "WEBP", quality=CALIDAD, alpha_quality=CALIDAD_ALFA, method=6, exact=False)
            sprites[nombre] = hoja
            kb = ruta.stat().st_size / 1024
            total += kb
            info[nombre] = {
                "src": f"/img/canela/{ruta.name}",
                "cuadros": len(idx),
                "fps": FPS_FUENTE // PASO,
                "duracion": round(len(idx) * PASO / FPS_FUENTE, 3),
                "bucle": nombre in ("izq", "der"),
                "cuadrosFuente": [idx[0], idx[-1]],
                "segundosFuente": [round(idx[0] / FPS_FUENTE, 3), round((idx[-1] + PASO) / FPS_FUENTE, 3)],
                "kB": round(kb, 1),
            }
            print(f"{kb:7.1f} KB  {ruta.name}  {len(idx)} cuadros  (fuente {idx[0]}-{idx[-1]})")
        print(f"{total:7.1f} KB  total sprites")

        z_izq = zancada(rutas, s_izq, p_izq, escala)
        z_der = zancada(rutas, s_der, p_der, escala)
        cx = [c[0] for c in centros.values()]
        datos = {
            "fuente": VIDEO.name,
            "cuadro": {"ancho": ancho, "alto": ALTO},
            "escala": round(escala, 5),
            "cajaComunFuente": {"x": caja[0], "y": caja[1], "ancho": caja[2] - caja[0], "alto": caja[3] - caja[1]},
            "suelo": round((max(c[1] for c in centros.values()) + 1 - caja[1]) * escala, 1),
            "piezas": info,
            "zancada": {
                "izq": z_izq["zancada"],
                "der": z_der["zancada"],
                "metodo": "mediana del corrimiento por cuadro de las patas apoyadas (franja de contacto sobre el suelo, correlacion del perfil de alfa) x cuadros de 24 fps del ciclo, en px a la escala del cuadro",
                "velocidad": {
                    "izq": round(z_izq["zancada"] / info["izq"]["duracion"], 1),
                    "der": round(z_der["zancada"] / info["der"]["duracion"], 1),
                    "unidad": "px de cuadro por segundo (multiplicar por altoMostrado/alto)",
                },
            },
            "empalmes": {
                "bucleIzq": round(e_izq, 4), "bucleDer": round(e_der, 4),
                "salidaGiro": round(e_g0, 4), "entradaDer": round(e_t, 4),
                "movimientoMedio": round(float(np.median(mov[48:200])), 4),
            },
            "derivaHorizontalFuente": round(float(max(cx) - min(cx)), 1),
            "kBTotal": round(total, 1),
        }
        (OUT / "carrera.json").write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({k: datos[k] for k in ("cuadro", "escala", "cajaComunFuente", "zancada", "empalmes")},
                         ensure_ascii=False))
        print("zancada izq por paso:", z_izq["pxCuadroFuente"], z_izq["sentidoSuelo"])
        print("zancada der por paso:", z_der["pxCuadroFuente"], z_der["sentidoSuelo"])
        if args.preview:
            hoja_preview(sprites, ancho, ALTO, args.preview)
            print("preview:", args.preview)


if __name__ == "__main__":
    main()
