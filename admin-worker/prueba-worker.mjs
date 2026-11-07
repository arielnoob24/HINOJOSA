// node admin-worker/prueba-worker.mjs
// Prueba el Worker entero con un GitHub simulado (sin red, sin token real):
// comprueba que fotos y catalogo salen en UN commit y que lo invalido se rechaza.
import { readFileSync } from 'node:fs';
import worker from './src/index.js';

const RUTA = 'hinojosa-web/src/data/productos.json';
const texto = readFileSync(new URL('../' + RUTA, import.meta.url), 'utf8');
const catalogo = JSON.parse(texto);
const env = {
  GITHUB_TOKEN: 't', ADMIN_PASSWORD: 'pw', GITHUB_REPO: 'o/r', GITHUB_BRANCH: 'main',
  ALLOWED_ORIGIN: 'https://ok.example',
};
const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const webp = () => b64(Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 '), Buffer.alloc(40, 7)]));
const png = () => b64(Buffer.concat([Buffer.from([0x89]), Buffer.from('PNG\r\n\x1a\n'), Buffer.alloc(40, 7)]));

let git;
function nuevoGit({ patch = 200 } = {}) {
  git = { blobs: [], arbol: null, commit: null, patch: null, contentsPut: null, llamadas: [] };
  globalThis.fetch = async (url, op = {}) => {
    const u = new URL(url);
    const ruta = u.pathname.replace('/repos/o/r', '');
    const cuerpo = op.body ? JSON.parse(op.body) : null;
    git.llamadas.push(`${op.method || 'GET'} ${ruta}`);
    const ok = (o, s = 200) => new Response(JSON.stringify(o), { status: s });
    if (ruta === `/contents/${RUTA}` && (op.method || 'GET') === 'GET') {
      return ok({ sha: 'sha-json', content: Buffer.from(texto).toString('base64') });
    }
    if (ruta === `/contents/${RUTA}` && op.method === 'PUT') {
      git.contentsPut = cuerpo;
      return ok({ content: { sha: 'sha-nuevo' } });
    }
    if (ruta === '/git/ref/heads/main' && !op.method) return ok({ object: { sha: 'c0' } });
    if (ruta === '/git/commits/c0') return ok({ tree: { sha: 't0' } });
    if (ruta === '/git/blobs') { git.blobs.push(cuerpo); return ok({ sha: 'blob' + git.blobs.length }, 201); }
    if (ruta === '/git/trees') { git.arbol = cuerpo; return ok({ sha: 't1' }, 201); }
    if (ruta === '/git/commits') { git.commit = cuerpo; return ok({ sha: 'c1' }, 201); }
    if (ruta === '/git/refs/heads/main') { git.patch = cuerpo; return ok({}, patch); }
    return ok({ message: 'no simulado: ' + ruta }, 404);
  };
}

async function put(cuerpo, clave = 'pw') {
  const r = await worker.fetch(
    new Request('https://w/productos', {
      method: 'PUT',
      headers: { 'X-Admin-Password': clave, 'Content-Type': 'application/json', Origin: 'https://ok.example' },
      body: JSON.stringify(cuerpo),
    }),
    env,
  );
  return { estado: r.status, datos: await r.json() };
}

let fallos = 0;
const ok = (nombre, cond, extra = '') => {
  if (!cond) fallos++;
  console.log(`${cond ? 'OK   ' : 'FALLA'} ${nombre}${cond ? '' : ' -> ' + extra}`);
};
const copia = () => structuredClone(catalogo.productos);
const nuevoProducto = (extra = {}) => ({
  id: 'harina-de-prueba', categoria: 'granja', animales: ['ave'], nombre: 'Harina de prueba',
  descripcion: null, marca: null, presentacion: null, precio: 5, precioDesde: false,
  imagen: '/img/productos/granja/harina-de-prueba.webp', destacado: false, ...extra,
});
const foto = (ext = 'webp', nombre = 'harina-de-prueba') => ({
  ruta: `hinojosa-web/imagenes-nuevas/granja/${nombre}.${ext}`, base64: ext === 'webp' ? webp() : png(),
});

// 1. producto nuevo con foto -> un commit con 2 archivos
nuevoGit();
let l = copia(); l.push(nuevoProducto());
let r = await put({ sha: 'sha-json', productos: l, imagenes: [foto()] });
ok('producto nuevo con foto: 200', r.estado === 200, JSON.stringify(r));
ok('un solo commit con los dos archivos', git.arbol?.tree.length === 2 && git.commit?.parents[0] === 'c0');
ok('foto en imagenes-nuevas/', git.arbol?.tree.some((e) => e.path === 'hinojosa-web/imagenes-nuevas/granja/harina-de-prueba.webp'));
ok('foto viaja tal cual (base64)', git.blobs[0]?.encoding === 'base64' && git.blobs[0].content === foto().base64);
const jsonSubido = JSON.parse(git.blobs.find((b) => b.encoding === 'utf-8').content);
ok('productos.json incluye el nuevo', jsonSubido.productos.at(-1).id === 'harina-de-prueba' && jsonSubido.productos.length === 38);
ok('ref movida sin forzar', git.patch?.sha === 'c1' && git.patch?.force === false);
ok('mensaje del commit', /^Panel: agrega harina-de-prueba; sube una foto$/.test(git.commit?.message), git.commit?.message);
ok('devuelve el sha de productos.json', r.datos.sha === 'blob' + git.blobs.length, r.datos.sha);

// 2. solo cambiar la foto de un producto existente -> el arbol lleva SOLO la foto
nuevoGit();
const p0 = catalogo.productos[0];
const rutaP0 = p0.imagen.replace('/img/productos/', '');
const [cat0, nom0] = [rutaP0.split('/')[0], rutaP0.split('/')[1].replace('.webp', '')];
r = await put({ sha: 'sha-json', productos: copia(), imagenes: [{ ruta: `hinojosa-web/imagenes-nuevas/${cat0}/${nom0}.png`, base64: png() }] });
ok('cambiar solo la foto: 200', r.estado === 200, JSON.stringify(r));
ok('el arbol lleva solo la foto', git.arbol?.tree.length === 1 && git.arbol.tree[0].path.endsWith('.png'));

// 3. rechazos
nuevoGit(); l = copia(); l.push(nuevoProducto());
r = await put({ sha: 'sha-json', productos: l, imagenes: [foto('webp', 'otro-nombre')] });
ok('foto sin producto -> 422', r.estado === 422 && !git.commit, JSON.stringify(r));
r = await put({ sha: 'sha-json', productos: l, imagenes: [{ ...foto(), base64: b64(Buffer.from('esto no es una imagen, es texto')) }] });
ok('archivo que no es imagen -> 422', r.estado === 422 && !git.commit, JSON.stringify(r));
r = await put({ sha: 'sha-json', productos: l, imagenes: [{ ...foto('png'), base64: webp() }] });
ok('extension que no coincide con el contenido -> 422', r.estado === 422);
r = await put({ sha: 'sha-json', productos: l, imagenes: [{ ruta: 'hinojosa-web/src/data/productos.json', base64: webp() }] });
ok('ruta fuera de imagenes-nuevas -> 422', r.estado === 422);
r = await put({ sha: 'sha-json', productos: l, imagenes: [{ ruta: 'hinojosa-web/imagenes-nuevas/../../.github/x.webp', base64: webp() }] });
ok('ruta con .. -> 422', r.estado === 422);
r = await put({ sha: 'sha-json', productos: l, imagenes: Array(5).fill(foto()) });
ok('5 fotos -> 422', r.estado === 422);
r = await put({ sha: 'sha-json', productos: l, imagenes: [{ ...foto(), base64: 'A'.repeat(1_300_000) }] });
ok('foto demasiado grande -> 422', r.estado === 422);
r = await put({ sha: 'sha-json', productos: l, imagenes: [foto()] }, 'mala');
ok('contraseña mala -> 401', r.estado === 401);
r = await put({ sha: 'otro', productos: l, imagenes: [foto()] });
ok('sha viejo -> 409', r.estado === 409);

// 4. conflicto al mover la referencia
nuevoGit({ patch: 422 }); l = copia(); l.push(nuevoProducto());
r = await put({ sha: 'sha-json', productos: l, imagenes: [foto()] });
ok('rama que avanzó -> 409', r.estado === 409, JSON.stringify(r));

// 5. sin fotos: camino simple (API de contents), sin Git Data
nuevoGit(); l = copia(); l[0].precio = 31.5;
r = await put({ sha: 'sha-json', productos: l });
ok('sin fotos usa el camino simple', r.estado === 200 && git.contentsPut && !git.llamadas.some((c) => c.includes('/git/')), git.llamadas.join(' | '));

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas del Worker pasan');
process.exit(fallos ? 1 : 0);
