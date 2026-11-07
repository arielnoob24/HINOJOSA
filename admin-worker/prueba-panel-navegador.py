# Prueba del panel de administracion en un navegador real (Playwright para Python)
# con el Worker SIMULADO: no toca GitHub ni Cloudflare. Windows.
#
#   cd hinojosa-web && npm run build && npx astro preview --port 4321     (otra terminal)
#   python -I admin-worker/prueba-panel-navegador.py
#
# Cubre: los 4 clics, contrasena mala y buena, editar, agregar, quitar, fotos (con
# transparencia, con fondo, reemplazo, archivo que no es imagen), cierre con cambios,
# foco, axe en escritorio y movil. Las capturas quedan en %TEMP%\panel-prueba.
import tempfile, os
from pathlib import Path
import json, sys, copy
from playwright.sync_api import sync_playwright

RAIZ = str(Path(__file__).resolve().parent.parent / "hinojosa-web")
SC = os.path.join(tempfile.gettempdir(), "panel-prueba"); os.makedirs(SC, exist_ok=True)
URL = "http://localhost:4321/HINOJOSA/"
API = "https://hinojosa.mjkpqnx.workers.dev/productos"
datos = json.load(open(RAIZ + r"\src\data\productos.json", encoding="utf8"))

estado = {"sha": "sha-1", "puts": [], "gets": 0}
CORS = {"Access-Control-Allow-Origin": "http://localhost:4321",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS", "Content-Type": "application/json"}

def worker(route, request):
    if request.method == "OPTIONS":
        return route.fulfill(status=204, headers=CORS)
    if request.headers.get("x-admin-password") != "buena":
        return route.fulfill(status=401, headers=CORS, body=json.dumps({"error": "Contraseña incorrecta."}))
    if request.method == "GET":
        estado["gets"] += 1
        return route.fulfill(status=200, headers=CORS, body=json.dumps(
            {"sha": estado["sha"], "moneda": "USD", "categorias": datos["categorias"], "productos": datos["productos"]}))
    cuerpo = json.loads(request.post_data)
    estado["puts"].append(cuerpo)
    estado["sha"] = "sha-%d" % (len(estado["puts"]) + 1)
    return route.fulfill(status=200, headers=CORS, body=json.dumps({"ok": True, "sha": estado["sha"], "cambios": "x"}))

from PIL import Image, ImageDraw
import base64
im = Image.new("RGBA", (1500, 2000), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.rounded_rectangle((400, 500, 1100, 1700), 80, fill=(201, 138, 58, 255), outline=(27, 77, 43, 255), width=20)
d.rectangle((500, 900, 1000, 1200), fill=(255, 255, 255, 255))
im.save(SC + r"\\foto-alfa.png")
im2 = Image.new("RGB", (900, 1200), (235, 235, 235)); d2 = ImageDraw.Draw(im2)
d2.rectangle((200, 300, 700, 1000), fill=(40, 120, 60)); im2.save(SC + r"\\foto-fondo.png")
open(SC + r"\\no-es-imagen.png", "wb").write(b"esto no es una imagen")

fallos = []
def chequear(nombre, cond, extra=""):
    print(("OK    " if cond else "FALLA ") + nombre + (" " + str(extra) if extra and not cond else ""))
    if not cond: fallos.append(nombre)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    errores = []
    pg.on("pageerror", lambda e: errores.append(str(e)))
    pg.on("console", lambda m: errores.append(m.text) if m.type == "error" else None)
    pedidos = []
    pg.on("request", lambda r: pedidos.append(r.url))
    pg.route(API, worker)
    pg.goto(URL, wait_until="load")
    pg.wait_for_timeout(1500)

    chequear("el panel no se descarga con la página", not any("panel." in u for u in pedidos))
    for _ in range(3):
        pg.click(".barra-logo")
        pg.wait_for_timeout(120)
    pg.wait_for_timeout(400)
    chequear("3 clics NO abren el panel", pg.locator("dialog.adm").count() == 0)
    pg.wait_for_timeout(2700)  # vence la ventana
    for _ in range(4):
        pg.click(".barra-logo")
        pg.wait_for_timeout(120)
    pg.wait_for_selector("dialog.adm[open]", timeout=5000)
    chequear("4 clics abren el panel", True)
    chequear("el panel se descargó solo al abrir", any("panel." in u for u in pedidos))
    pg.screenshot(path=SC + r"\panel-1-entrada.png")

    # contraseña mala
    pg.fill("#adm-clave", "mala")
    pg.click("button:has-text(\"Entrar\")")
    pg.wait_for_selector("#adm-error-entrada")
    chequear("contraseña mala muestra aviso", "no es correcta" in pg.inner_text("#adm-error-entrada"))
    # buena
    pg.fill("#adm-clave", "buena")
    pg.click("button:has-text(\"Entrar\")")
    pg.wait_for_selector("#adm-lista")
    n = pg.locator("#adm-lista > li").count()
    chequear("lista con 37 productos", n == 37, n)
    chequear("botón guardar desactivado sin cambios", pg.locator("[data-guardar]").is_disabled())
    pg.screenshot(path=SC + r"\panel-2-lista.png")

    # editar precio del primero
    pg.fill("#adm-precio-1", "29,50")
    chequear("fila marcada como cambiada", pg.locator('li[data-clave="1"][data-cambiado]').count() == 1)
    chequear("pie cuenta 1 cambio", "1 producto con cambios" in pg.inner_text(".adm-pie-texto"))
    chequear("guardar activo", pg.locator("[data-guardar]").is_enabled())
    # descripción del segundo
    pg.click('li[data-clave="2"] button:has-text("Editar más")')
    pg.fill("#adm-descripcion-2", "Texto nuevo de prueba")
    pg.screenshot(path=SC + r"\panel-3-editando.png")
    pg.click("[data-guardar]")
    pg.wait_for_selector("#adm-aviso")
    chequear("mensaje de guardado", "1 minuto" in pg.inner_text("#adm-aviso"))
    put = estado["puts"][0]
    chequear("PUT lleva el sha leído", put["sha"] == "sha-1")
    chequear("PUT: precio nuevo 29.5", put["productos"][0]["precio"] == 29.5, put["productos"][0]["precio"])
    chequear("PUT: descripción nueva", put["productos"][1]["descripcion"] == "Texto nuevo de prueba")
    otros = [i for i in range(len(datos["productos"])) if i not in (0, 1) and put["productos"][i] != datos["productos"][i]]
    chequear("PUT: el resto idéntico", not otros, otros)
    for i in otros:
        a, b2 = datos["productos"][i], put["productos"][i]
        print("   DIF", a["id"], {k: (a.get(k), b2.get(k)) for k in set(a)|set(b2) if a.get(k) != b2.get(k)})
    chequear("PUT conserva imagen y orden de claves",
             list(put["productos"][0].keys()) == list(datos["productos"][0].keys()))
    chequear("tras guardar no quedan cambios", pg.locator("[data-guardar]").is_disabled())
    pg.screenshot(path=SC + r"\panel-4-guardado.png")

    # agregar
    pg.click("text=Agregar producto")
    pg.fill('input[data-campo="nombre"] >> nth=0', "Producto de prueba ñandú")
    pg.fill('li[data-nuevo] input[inputmode="decimal"]', "12")
    pg.click('li[data-nuevo] label:has-text("Perros") input')
    pg.set_input_files('li[data-nuevo] input[type=file]', SC + r"\\no-es-imagen.png")
    pg.wait_for_function("document.querySelector('li[data-nuevo] [role=status]').innerText.includes('No se pudo leer')")
    chequear("archivo que no es imagen: avisa", True)
    pg.set_input_files('li[data-nuevo] input[type=file]', SC + r"\\foto-alfa.png")
    pg.wait_for_function("document.querySelector('li[data-nuevo] [role=status]').innerText.includes('Foto lista')")
    chequear("foto con transparencia detectada", "transparente" in pg.inner_text('li[data-nuevo] [role=status]'), pg.inner_text('li[data-nuevo] [role=status]'))
    pg.screenshot(path=SC + r"\panel-6-foto.png")
    pg.click("[data-guardar]")
    pg.wait_for_selector("#adm-aviso")
    nuevo = [x for x in estado["puts"][1]["productos"] if x["nombre"].startswith("Producto de prueba")][0]
    chequear("producto nuevo: id sin tildes", nuevo["id"] == "producto-de-prueba-nandu", nuevo["id"])
    chequear("producto nuevo: perro y precio 12", nuevo["animales"] == ["perro"] and nuevo["precio"] == 12.0)
    chequear("catálogo ahora tiene 38", len(estado["puts"][1]["productos"]) == 38)
    im1 = estado["puts"][1].get("imagenes", [])
    chequear("PUT lleva 1 foto", len(im1) == 1, im1 and im1[0]["ruta"])
    chequear("ruta de la foto nueva", im1 and im1[0]["ruta"] == "hinojosa-web/imagenes-nuevas/granja/producto-de-prueba-nandu.webp", im1 and im1[0]["ruta"])
    raw = base64.b64decode(im1[0]["base64"]) if im1 else b""
    chequear("la foto es un WebP liviano", raw[:4] == b"RIFF" and raw[8:12] == b"WEBP" and len(raw) < 900000, len(raw))
    chequear("tamaño reducido (800 px de alto máx.)", Image.open(__import__("io").BytesIO(raw)).size[1] <= 800, Image.open(__import__("io").BytesIO(raw)).size)
    chequear("producto nuevo apunta a su foto y sin conFondo", nuevo["imagen"] == "/img/productos/granja/producto-de-prueba-nandu.webp" and "conFondo" not in nuevo, nuevo)

    # quitar
    pg.fill("#adm-buscar", "ñandú")
    pg.click('li:not([hidden]) button:has-text("Quitar este producto")')
    pg.click('li:not([hidden]) button:has-text("Sí, quitar")')
    chequear("quitar marca 1 cambio", "1 producto con cambios" in pg.inner_text(".adm-pie-texto"))
    pg.click("[data-guardar]")
    pg.wait_for_selector("#adm-aviso")
    chequear("catálogo vuelve a 37", len(estado["puts"][2]["productos"]) == 37)

    # foto nueva en un producto existente (sin transparencia -> conFondo)
    pg.fill("#adm-buscar", "")
    ex = datos["productos"][4]
    pg.click('li[data-clave="5"] button:has-text("Editar más")')
    pg.set_input_files('li[data-clave="5"] input[type=file]', SC + r"\\foto-fondo.png")
    pg.wait_for_function("document.querySelector('li[data-clave=\"5\"] [role=status]').innerText.includes('Foto lista')")
    chequear("foto con fondo detectada", "placa blanca" in pg.inner_text('li[data-clave="5"] [role=status]'))
    pg.click("[data-guardar]")
    pg.wait_for_selector("#adm-aviso")
    p3 = estado["puts"][3]
    base5 = (ex["imagen"] or "").replace("/img/productos/", "").replace(".webp", "")
    chequear("reemplazo: misma ruta que la foto actual", p3["imagenes"][0]["ruta"] == f"hinojosa-web/imagenes-nuevas/{base5}.webp", p3["imagenes"][0]["ruta"])
    chequear("reemplazo: imagen intacta y conFondo activado", p3["productos"][4]["imagen"] == ex["imagen"] and p3["productos"][4].get("conFondo") is True, p3["productos"][4])
    chequear("tras guardar la fila no queda marcada", pg.locator('li[data-clave="5"][data-cambiado]').count() == 0)

    # precio inválido
    pg.fill("#adm-buscar", "")
    pg.fill("#adm-precio-1", "abc")
    pg.click("[data-guardar]")
    pg.wait_for_selector("#adm-aviso")
    chequear("precio inválido bloquea el envío", len(estado["puts"]) == 4 and "precio" in pg.inner_text("#adm-aviso"))
    pg.fill("#adm-precio-1", "29.5")

    # cerrar con cambios
    pg.fill("#adm-precio-3", "99")
    pg.click(".adm-cerrar")
    chequear("cerrar con cambios pregunta", "se pierden" in pg.inner_text(".adm-pie-texto"))
    pg.click("text=Seguir editando")
    chequear("seguir editando conserva el panel", pg.locator("dialog.adm[open]").count() == 1)
    pg.keyboard.press("Escape")
    chequear("Esc también pregunta", "se pierden" in pg.inner_text(".adm-pie-texto"))
    pg.click("text=Cerrar sin guardar")
    chequear("cerrar sin guardar cierra", pg.locator("dialog.adm[open]").count() == 0)
    chequear("el foco vuelve al logo", pg.evaluate("document.activeElement.classList.contains('barra-logo')"))

    # reabrir: no pide contraseña, recarga
    for _ in range(4):
        pg.click(".barra-logo"); pg.wait_for_timeout(100)
    pg.wait_for_selector("#adm-lista")
    chequear("reabrir no pide contraseña y recarga", estado["gets"] >= 2)

    # axe
    pg.add_script_tag(path=RAIZ + r"\node_modules\axe-core\axe.min.js")
    res = pg.evaluate("axe.run(document.querySelector('dialog.adm'), {runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']})")
    graves = [(v["id"], v["impact"], len(v["nodes"])) for v in res["violations"]]
    chequear("axe: 0 violaciones en el panel (escritorio)", not graves, graves)

    # móvil
    ctx2 = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m = ctx2.new_page()
    m.route(API, worker)
    m.goto(URL, wait_until="load"); m.wait_for_timeout(1200)
    for _ in range(4):
        m.tap(".barra-logo"); m.wait_for_timeout(120)
    m.wait_for_selector("dialog.adm[open]")
    m.fill("#adm-clave", "buena"); m.click("button:has-text(\"Entrar\")")
    m.wait_for_selector("#adm-lista")
    m.click('li[data-clave="1"] button:has-text("Editar más")')
    m.screenshot(path=SC + r"\panel-5-movil.png")
    ancho = m.evaluate("[document.querySelector('dialog.adm').scrollWidth, document.querySelector('dialog.adm').clientWidth]")
    chequear("móvil: sin desborde horizontal", ancho[0] <= ancho[1], ancho)
    m.add_script_tag(path=RAIZ + r"\node_modules\axe-core\axe.min.js")
    res = m.evaluate("axe.run(document.querySelector('dialog.adm'), {runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']})")
    graves = [(v["id"], v["impact"], len(v["nodes"])) for v in res["violations"]]
    chequear("axe: 0 violaciones en el panel (móvil)", not graves, graves)

    chequear("sin errores de consola ni de página", not [e for e in errores if "Failed to load resource" not in e], errores[:3])
    b.close()

print("\nFALLAS:" if fallos else "\nTODO OK", fallos)
sys.exit(1 if fallos else 0)
