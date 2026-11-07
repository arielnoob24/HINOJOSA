// Worker del panel de administracion (bloque 29a).
//
//   GET /productos  -> { sha, moneda, categorias, productos }   (lee de GitHub)
//   PUT /productos  -> hace el commit de productos.json en GitHub; Pages republica
//
// La contrasena se comprueba AQUI, en el servidor; el token de GitHub nunca sale de
// Cloudflare. Variables: secretos GITHUB_TOKEN y ADMIN_PASSWORD; texto GITHUB_REPO,
// GITHUB_BRANCH y ALLOWED_ORIGIN (uno o varios origenes separados por coma).

import { validarProductos, validarImagenes } from './validar.js';

const RUTA_ARCHIVO = 'hinojosa-web/src/data/productos.json';
const API = 'https://api.github.com';
// El catalogo real pesa ~25 KB; el resto es para hasta 4 fotos de ≤ 900 KB en base64.
const MAX_CUERPO = 5_000_000;

class Conflicto extends Error {}

// Freno a la fuerza bruta: por IP y por instancia del Worker (mejor esfuerzo, no
// compartido entre instancias). La proteccion de fondo es una contrasena larga.
const intentos = new Map();
const MAX_FALLOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

function origenesPermitidos(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function cabeceras(env, origin) {
  const permitidos = origenesPermitidos(env);
  const h = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && permitidos.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Password';
    h['Access-Control-Allow-Methods'] = 'GET, PUT, OPTIONS';
    h['Access-Control-Max-Age'] = '600';
  }
  return h;
}

const json = (env, origin, estado, cuerpo) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: cabeceras(env, origin) });

async function resumen(texto) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
}

async function contrasenaCorrecta(recibida, esperada) {
  if (!esperada) return false;
  const [a, b] = await Promise.all([resumen(recibida), resumen(esperada)]);
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a[i] ^ b[i];
  return dif === 0;
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function base64AUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function utf8ABase64(texto) {
  let bin = '';
  for (const b of new TextEncoder().encode(texto)) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Mismo estilo que el archivo actual: sangria de 2 y listas cortas en una linea.
function serializar(datos) {
  const texto = JSON.stringify(datos, null, 2);
  const simple = '(?:"[^"\\n]*"|-?\\d+(?:\\.\\d+)?|true|false|null)';
  const re = new RegExp(`\\[\\n\\s+(${simple}(?:,\\n\\s+${simple})*)\\n\\s*\\]`, 'g');
  const conListas = texto.replace(re, (_, interior) => `[${interior.replace(/,\n\s+/g, ', ')}]`);
  // Objetos planos cortos (las categorias) en una sola linea, como en el archivo original.
  const reObjeto = new RegExp(`\\{\\n((?:\\s+"[^"\\n]+": ${simple},?\\n)+)\\s*\\}`, 'g');
  return (
    conListas.replace(reObjeto, (completo, cuerpo) => {
      const enLinea = `{ ${cuerpo.trim().replace(/,\n\s+/g, ', ')} }`;
      return enLinea.length <= 110 ? enLinea : completo;
    }) + '\n'
  );
}

export { serializar };

async function github(env, ruta, opciones = {}) {
  return fetch(`${API}/repos/${env.GITHUB_REPO}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'hinojosa-admin-worker',
      ...(opciones.headers || {}),
    },
  });
}

async function leerCatalogo(env) {
  const r = await github(env, `/contents/${RUTA_ARCHIVO}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`);
  if (!r.ok) throw new Error(`GitHub respondió ${r.status} al leer el catálogo.`);
  const meta = await r.json();
  return { sha: meta.sha, datos: JSON.parse(base64AUtf8(meta.content)) };
}

async function jsonOk(r, estadoEsperado = 200) {
  if (r.status !== estadoEsperado) throw new Error(`GitHub respondió ${r.status}.`);
  return r.json();
}

const aJson = (cuerpo) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });

/**
 * Un solo commit con varios archivos (Git Data API): productos.json y las fotos
 * nuevas se publican juntos. Si la rama avanzo mientras tanto, el ultimo paso
 * (mover la referencia sin forzar) falla y se avisa como conflicto.
 * @param {{ruta: string, contenido: string, codificacion: 'utf-8'|'base64'}[]} archivos
 * @returns {Promise<Record<string, string>>} sha del blob de cada ruta
 */
async function commitVarios(env, mensaje, archivos) {
  const ref = await jsonOk(await github(env, `/git/ref/heads/${encodeURIComponent(env.GITHUB_BRANCH)}`));
  const base = ref.object.sha;
  const commit = await jsonOk(await github(env, `/git/commits/${base}`));
  const shas = {};
  const entradas = [];
  for (const a of archivos) {
    const blob = await jsonOk(await github(env, '/git/blobs', aJson({ content: a.contenido, encoding: a.codificacion })), 201);
    shas[a.ruta] = blob.sha;
    entradas.push({ path: a.ruta, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const arbol = await jsonOk(await github(env, '/git/trees', aJson({ base_tree: commit.tree.sha, tree: entradas })), 201);
  const nuevo = await jsonOk(await github(env, '/git/commits', aJson({ message: mensaje, tree: arbol.sha, parents: [base] })), 201);
  const mover = await github(env, `/git/refs/heads/${encodeURIComponent(env.GITHUB_BRANCH)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: nuevo.sha, force: false }),
  });
  if (mover.status === 409 || mover.status === 422) throw new Conflicto();
  if (!mover.ok) throw new Error(`GitHub respondió ${mover.status} al publicar.`);
  return shas;
}

function describirCambios(antes, despues) {
  const porId = new Map(antes.map((p) => [p.id, p]));
  const nuevos = new Set(despues.map((p) => p.id));
  const partes = [];
  const editados = despues.filter((p) => porId.has(p.id) && JSON.stringify(porId.get(p.id)) !== JSON.stringify(p));
  const agregados = despues.filter((p) => !porId.has(p.id));
  const quitados = antes.filter((p) => !nuevos.has(p.id));
  if (editados.length) partes.push(`edita ${editados.slice(0, 4).map((p) => p.id).join(', ')}${editados.length > 4 ? ` y ${editados.length - 4} más` : ''}`);
  if (agregados.length) partes.push(`agrega ${agregados.map((p) => p.id).slice(0, 3).join(', ')}`);
  if (quitados.length) partes.push(`quita ${quitados.map((p) => p.id).slice(0, 3).join(', ')}`);
  const orden = JSON.stringify(antes.map((p) => p.id)) !== JSON.stringify(despues.filter((p) => porId.has(p.id)).map((p) => p.id));
  if (!partes.length && orden) partes.push('cambia el orden');
  return partes.join('; ');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cabeceras(env, origin) });
    }
    if (origin && !origenesPermitidos(env).includes(origin)) {
      return json(env, origin, 403, { error: 'Origen no permitido.' });
    }
    if (url.pathname !== '/productos') return json(env, origin, 404, { error: 'No existe.' });
    if (request.method !== 'GET' && request.method !== 'PUT') {
      return json(env, origin, 405, { error: 'Método no permitido.' });
    }
    const faltan = ['GITHUB_TOKEN', 'ADMIN_PASSWORD', 'GITHUB_REPO', 'GITHUB_BRANCH'].filter((k) => !env[k]);
    if (faltan.length) {
      // Solo los NOMBRES de lo que falta, nunca valores.
      return json(env, origin, 500, { error: 'El servidor no está configurado del todo.', faltan });
    }

    // Autenticacion con freno de intentos
    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    const ahora = Date.now();
    const estadoIp = intentos.get(ip);
    if (estadoIp && estadoIp.hasta > ahora) {
      return json(env, origin, 429, { error: 'Demasiados intentos. Espera unos minutos.' });
    }
    const clave = request.headers.get('X-Admin-Password') || '';
    if (!(await contrasenaCorrecta(clave, env.ADMIN_PASSWORD))) {
      const n = (estadoIp && estadoIp.hasta <= ahora ? 0 : estadoIp?.n || 0) + 1;
      intentos.set(ip, { n, hasta: n >= MAX_FALLOS ? ahora + BLOQUEO_MS : 0 });
      await esperar(700);
      return json(env, origin, 401, { error: 'Contraseña incorrecta.' });
    }
    intentos.delete(ip);

    try {
      if (request.method === 'GET') {
        const { sha, datos } = await leerCatalogo(env);
        return json(env, origin, 200, {
          sha,
          moneda: datos.moneda,
          categorias: datos.categorias,
          productos: datos.productos,
        });
      }

      // PUT
      const largo = Number(request.headers.get('Content-Length') || 0);
      if (largo > MAX_CUERPO) return json(env, origin, 413, { error: 'Envío demasiado grande.' });
      const texto = await request.text();
      if (texto.length > MAX_CUERPO) return json(env, origin, 413, { error: 'Envío demasiado grande.' });
      let cuerpo;
      try {
        cuerpo = JSON.parse(texto);
      } catch {
        return json(env, origin, 400, { error: 'El envío no es válido.' });
      }
      if (!cuerpo || typeof cuerpo.sha !== 'string') {
        return json(env, origin, 400, { error: 'Falta la versión de los datos. Recarga el panel.' });
      }

      const { sha, datos } = await leerCatalogo(env);
      if (sha !== cuerpo.sha) {
        return json(env, origin, 409, {
          error: 'Alguien más cambió los datos mientras editabas. Recarga el panel y vuelve a intentarlo.',
        });
      }

      const errores = validarProductos(cuerpo.productos, {
        categorias: datos.categorias,
        actuales: datos.productos,
      });
      if (errores.length) return json(env, origin, 422, { error: 'Hay datos por corregir.', errores: errores.slice(0, 20) });

      const erroresFotos = validarImagenes(cuerpo.imagenes, cuerpo.productos, datos.categorias);
      if (erroresFotos.length) {
        return json(env, origin, 422, { error: 'Hay fotos por corregir.', errores: erroresFotos.slice(0, 20) });
      }
      const fotos = cuerpo.imagenes || [];

      const cambiosJson = describirCambios(datos.productos, cuerpo.productos);
      const cambios = [cambiosJson, fotos.length ? `sube ${fotos.length === 1 ? 'una foto' : `${fotos.length} fotos`}` : '']
        .filter(Boolean)
        .join('; ');
      if (!cambios) return json(env, origin, 200, { ok: true, sinCambios: true, sha });

      const nuevo = { ...datos, productos: cuerpo.productos };

      // Con fotos: un solo commit con todo. Sin fotos: el camino simple de siempre.
      if (fotos.length) {
        const archivos = fotos.map((f) => ({ ruta: f.ruta, contenido: f.base64, codificacion: 'base64' }));
        if (cambiosJson) archivos.push({ ruta: RUTA_ARCHIVO, contenido: serializar(nuevo), codificacion: 'utf-8' });
        const shas = await commitVarios(env, `Panel: ${cambios}`.slice(0, 200), archivos);
        return json(env, origin, 200, { ok: true, sha: shas[RUTA_ARCHIVO] ?? sha, cambios });
      }

      const r = await github(env, `/contents/${RUTA_ARCHIVO}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Panel: ${cambios}`.slice(0, 200),
          content: utf8ABase64(serializar(nuevo)),
          sha,
          branch: env.GITHUB_BRANCH,
        }),
      });
      if (r.status === 409 || r.status === 422) {
        return json(env, origin, 409, { error: 'Los datos cambiaron mientras guardabas. Recarga el panel.' });
      }
      if (!r.ok) return json(env, origin, 502, { error: `GitHub rechazó el guardado (${r.status}).` });
      const res = await r.json();
      return json(env, origin, 200, { ok: true, sha: res.content.sha, cambios });
    } catch (e) {
      if (e instanceof Conflicto) {
        return json(env, origin, 409, { error: 'Los datos cambiaron mientras guardabas. Recarga el panel.' });
      }
      return json(env, origin, 502, { error: 'No se pudo hablar con GitHub. Intenta de nuevo.' });
    }
  },
};
