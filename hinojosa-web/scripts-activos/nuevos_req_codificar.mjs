// Codifica a WebP/AVIF los maestros PNG que prepara nuevos_req.py.
// Uso: node scripts-activos/nuevos_req_codificar.mjs <trabajos.json>
// Cada trabajo: { in, out (sin extension), alto, avif, q? (calidad WebP) }
import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

const trabajos = JSON.parse(await readFile(process.argv[2], "utf8"));
let total = 0;

for (const t of trabajos) {
  await mkdir(dirname(t.out), { recursive: true });
  const base = () =>
    sharp(t.in).resize({ height: t.alto, withoutEnlargement: true, kernel: "lanczos3" });
  const salidas = [`${t.out}.webp`];
  await base()
    .webp({ quality: t.q ?? (t.alto <= 200 ? 82 : 80), alphaQuality: 90, effort: 6, smartSubsample: true })
    .toFile(`${t.out}.webp`);
  if (t.avif) {
    await base().avif({ quality: 55, effort: 6 }).toFile(`${t.out}.avif`);
    salidas.push(`${t.out}.avif`);
  }
  for (const s of salidas) {
    const kb = (await stat(s)).size / 1024;
    total += kb;
    console.log(`${kb.toFixed(1).padStart(8)} KB  ${s}`);
  }
}
console.log(`Total imagenes: ${(total / 1024).toFixed(2)} MB`);
