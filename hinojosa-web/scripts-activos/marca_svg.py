"""SVG de marca para la fase 5-B (2026-10-14).

Uso:
    python hinojosa-web/scripts-activos/marca_svg.py

Salida:
    public/img/marca/trebol.svg            trebol de 4 hojas del isotipo, una sola forma,
                                           fill="currentColor" (se colorea por CSS), sin texto
    public/img/productos/costal-generico.svg  tarjeta de costal para productos sin imagen
                                           (sin texto: el nombre va en HTML sobre la etiqueta)

El trebol se traza desde public/img/marca/isotipo.png (no hay logo vectorial): se mide el
radio del contorno exterior en coordenadas polares alrededor del centro (fijado por las
cuatro muescas), se promedian los cuadrantes sin la mazorca (sup. izq., sup. der. e inf.
izq., espejados) para dejarlo simetrico, y se escribe como curva suave (puntos de control
cuadraticos con anclas en los puntos medios) en un viewBox de 100 x 100.
"""
from pathlib import Path

import numpy as np
from PIL import Image

from comun import PUB

ISOTIPO = PUB / "img" / "marca" / "isotipo.png"
N = 20            # muestras por cuadrante


def centro(m: np.ndarray) -> tuple[float, float]:
    ys, xs = np.nonzero(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    # muesca superior: columna central cuyo primer pixel opaco esta mas abajo
    cols = range(x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4)
    top = {x: np.nonzero(m[:, x])[0].min() for x in cols}
    prof = max(top.values())
    cx = np.mean([x for x, v in top.items() if v >= prof - 1])
    filas = range(y0 + (y1 - y0) // 4, y1 - (y1 - y0) // 4)
    izq = {y: np.nonzero(m[y])[0].min() for y in filas}
    prof = max(izq.values())
    cy = np.mean([y for y, v in izq.items() if v >= prof - 1])
    return float(cx), float(cy)


def radio(m: np.ndarray, cx: float, cy: float, ang: float) -> float:
    """Ultimo pixel opaco sobre el rayo (angulo en radianes, y hacia abajo)."""
    r_max = max(m.shape) * 1.5
    rs = np.arange(0, r_max, 0.25)
    xs = np.round(cx + rs * np.cos(ang)).astype(int)
    ys = np.round(cy + rs * np.sin(ang)).astype(int)
    ok = (xs >= 0) & (xs < m.shape[1]) & (ys >= 0) & (ys < m.shape[0])
    dentro = np.zeros_like(rs, bool)
    dentro[ok] = m[ys[ok], xs[ok]]
    idx = np.nonzero(dentro)[0]
    return float(rs[idx.max()]) if len(idx) else 0.0


def trebol() -> str:
    m = np.asarray(Image.open(ISOTIPO).getchannel("A")) > 128
    cx, cy = centro(m)
    # cuadrante de referencia: de la muesca superior (-90 grados) a la izquierda (-180)
    t = np.linspace(0, np.pi / 2, N + 1)
    sup_izq = [radio(m, cx, cy, -np.pi / 2 - a) for a in t]
    sup_der = [radio(m, cx, cy, -np.pi / 2 + a) for a in t]     # espejo horizontal
    inf_izq = [radio(m, cx, cy, np.pi / 2 + a) for a in t]      # espejo vertical
    r = np.mean([sup_izq, sup_der, inf_izq], axis=0)
    r[0] = r[-1] = (r[0] + r[-1]) / 2                            # muescas iguales
    # el rayo justo sobre el eje cae en el pixel de la muesca y deja un pico: el fondo de
    # la muesca es el minimo de sus vecinos; luego un suavizado [1 2 1] (con reflejo)
    r[0], r[-1] = min(r[0], r[1]), min(r[-1], r[-2])
    rr = np.r_[r[1], r, r[-2]]
    r = (rr[:-2] + 2 * rr[1:-1] + rr[2:]) / 4
    # contorno completo (en sentido horario desde arriba), con simetria de 4 ejes
    pts = []
    for q in range(4):
        rr = r if q % 2 == 0 else r[::-1]
        for k in range(N):
            a = -np.pi / 2 + q * np.pi / 2 + t[k]
            pts.append((rr[k] * np.cos(a), rr[k] * np.sin(a)))
    pts = np.array(pts)
    esc = 49 / np.abs(pts).max()
    pts = pts * esc + 50
    f = lambda v: f"{v:.1f}".rstrip("0").rstrip(".")
    medio = (pts + np.roll(pts, -1, 0)) / 2
    d = f"M{f(medio[-1][0])} {f(medio[-1][1])}"
    for p, mm in zip(pts, medio):
        d += f"Q{f(p[0])} {f(p[1])} {f(mm[0])} {f(mm[1])}"
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">'
            f'<path fill="currentColor" d="{d}Z"/></svg>\n')


def costal() -> str:
    """Costal de kraft con costuras canela-oscuro y una etiqueta crema vacia.
    La etiqueta ocupa x 23-77 %, y 40-70 % del viewBox (para colocar el nombre en HTML)."""
    k, c, cr = "#E3CFA6", "#8A5A1F", "#F6F1E4"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" aria-hidden="true">
<defs><radialGradient id="v" cx=".45" cy=".45" r=".7"><stop offset="0" stop-color="#EBDCBC"/><stop offset=".6" stop-color="{k}"/><stop offset="1" stop-color="#D2B783"/></radialGradient></defs>
<g stroke="{c}" stroke-linejoin="round">
<path fill="url(#v)" stroke-width="3" d="M32 40C26 92 16 168 21 226Q23 249 46 251H154Q177 249 179 226C184 168 174 92 168 40Z"/>
<path fill="#D9C08F" stroke-width="3" d="M22 30Q26 14 40 22Q100 30 160 22Q174 14 178 30L172 48Q100 56 28 48Z"/>
<path fill="none" stroke-width="2" stroke-dasharray="5 4" d="M30 37Q100 45 170 37M34 238H166"/>
<path fill="none" stroke-width="2" stroke-linecap="round" opacity=".35" d="M44 70Q56 150 40 220M160 72Q146 150 162 222M70 60Q100 66 132 58"/>
<rect x="46" y="104" width="108" height="78" rx="8" fill="{cr}" stroke-width="2"/>
</g></svg>
'''


def main() -> None:
    salidas = {
        PUB / "img" / "marca" / "trebol.svg": trebol(),
        PUB / "img" / "productos" / "costal-generico.svg": costal(),
    }
    for ruta, svg in salidas.items():
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(svg, encoding="utf-8", newline="\n")
        print(f"{len(svg.encode()):6d} B  {ruta}")


if __name__ == "__main__":
    main()
