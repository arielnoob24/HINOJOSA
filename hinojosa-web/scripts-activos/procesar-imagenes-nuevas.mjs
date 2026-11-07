// Fabrica las versiones web de las fotos que sube el panel de administracion.
//
//   imagenes-nuevas/<categoria>/<nombre>.webp|png      (lo que guarda el Worker)
//     -> public/img/productos/<categoria>/<nombre>.webp|.avif       800 px de alto
//                                         <nombre>-400.webp|.avif   400 px
//                                         <nombre>-thumb.webp       160 px
//                                         <nombre>-thumb-80.webp     80 px
//
// Mismas alturas y calidades que scripts-activos/nuevos_req_codificar.mjs, que es
// como se hicieron las demas fotos del catalogo. El workflow de Pages lo ejecuta
// antes de `npm run build`; en local: `npm run imagenes:nuevas`.
//
// - Si la foto tiene transparencia, se recorta el margen transparente (las demas
//   fotos van "recortadas al contenido"). Si no la tiene (fondo de estudio), NO se
//   recorta: el recorte se llevaria parte de la placa.
// - Una foto defectuosa no tumba el despliegue: se avisa y se sigue (el producto
//   se ve con su costal generico hasta que se suba otra).
//
// Uso: node scripts-activos/procesar-imagenes-nuevas.mjs [origen] [destino]
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const origen = process.argv[2] ?? join(process.cwd(), 'imagenes-nuevas');
const destino = process.argv[3] ?? join(process.cwd(), 'public', 'img', 'productos');

const VERSIONES = [
  { sufijo: '', alto: 800, webp: 80, avif: true },
  { sufijo: '-400', alto: 400, webp: 80, avif: true },
  { sufijo: '-thumb', alto: 160, webp: 82, avif: false },
  { sufijo: '-thumb-80', alto: 80, webp: 82, avif: false },
];

async function existe(ruta) {
  try {
    return (await stat(ruta)).isDirectory();
  } catch {
    return false;
  }
}

async function procesar(archivo, carpetaSalida, nombre) {
  // stats() no inventa canal alfa: solo se mira si la imagen lo trae (el alfa es el ultimo canal)
  const { hasAlpha } = await sharp(archivo).metadata();
  const conTransparencia = hasAlpha ? (await sharp(archivo).stats()).channels.at(-1).min < 250 : false;
  const partida = () => {
    const s = sharp(archivo).ensureAlpha();
    return conTransparencia ? s.trim({ threshold: 10 }) : s;
  };
  // Se materializa el recorte una vez; las 4 alturas salen de ese buffer
  const maestro = await partida().png().toBuffer();
  await mkdir(carpetaSalida, { recursive: true });
  for (const v of VERSIONES) {
    const redim = () => sharp(maestro).resize({ height: v.alto, withoutEnlargement: true, kernel: 'lanczos3' });
    await redim()
      .webp({ quality: v.webp, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toFile(join(carpetaSalida, `${nombre}${v.sufijo}.webp`));
    if (v.avif) await redim().avif({ quality: 55, effort: 6 }).toFile(join(carpetaSalida, `${nombre}${v.sufijo}.avif`));
  }
  return conTransparencia;
}

if (!(await existe(origen))) {
  console.log(`Sin ${origen}: no hay fotos nuevas que procesar.`);
  process.exit(0);
}

let hechas = 0;
let falladas = 0;
for (const categoria of await readdir(origen)) {
  const carpeta = join(origen, categoria);
  if (!(await existe(carpeta))) continue;
  for (const archivo of (await readdir(carpeta)).sort()) {
    const ext = extname(archivo).toLowerCase();
    if (ext !== '.webp' && ext !== '.png') continue;
    const nombre = basename(archivo, ext);
    try {
      const alfa = await procesar(join(carpeta, archivo), join(destino, categoria), nombre);
      hechas++;
      console.log(`OK  ${categoria}/${nombre}  (${alfa ? 'con transparencia, recortada' : 'con fondo, sin recortar'})`);
    } catch (e) {
      falladas++;
      console.log(`::warning::No se pudo procesar ${categoria}/${archivo}: ${e.message}`);
    }
  }
}
console.log(`Fotos procesadas: ${hechas}${falladas ? `, con problemas: ${falladas}` : ''}.`);
