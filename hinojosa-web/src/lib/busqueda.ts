// Buscador del catalogo (P1, fase 5-B bloque 5). Modulo puro: lo usan el
// build (VistaProductos.astro, para data-busqueda) y el navegador
// (catalogo.ts, para comparar). Sin DOM ni dependencias.
//
// Como compara:
//   1. Texto normalizado: minusculas, sin tildes, y "compacto" (sin
//      espacios, guiones, puntos ni barras) para que "procan" = "pro-can" =
//      "pro can".
//   2. Cada palabra de la consulta se prueba tal cual y en singular basico
//      (perros -> perro, cuyes -> cuy, aves -> ave).
//   3. Si la palabra (o su singular) es un animal o un sinonimo de animal
//      (pollo, gallina, pez, chancho, cachorro...), se compara SOLO con el
//      campo `animales` del producto: "pollo" no devuelve un hueso para
//      perro "sabor pollo".
//   4. Las demas palabras buscan dentro del texto compacto del producto
//      (nombre, marca, presentacion, categoria y animales).
//   5. Con varias palabras: si la consulta entera compactada aparece en
//      algun producto ("pro can" -> "procan"), manda esa coincidencia;
//      si no, cada palabra debe coincidir (Y logico).

export const ANIMALES = ['perro', 'gato', 'ave', 'cerdo', 'vaca', 'cuy', 'conejo', 'tilapia'] as const;
export type Animal = (typeof ANIMALES)[number];

/** Sinonimos (ya normalizados y en singular) -> animal del catalogo. */
const SINONIMOS: Record<string, Animal> = {
  pollo: 'ave',
  pollito: 'ave',
  gallina: 'ave',
  gallo: 'ave',
  pato: 'ave',
  pez: 'tilapia',
  peces: 'tilapia',
  pescado: 'tilapia',
  perrito: 'perro',
  cachorro: 'perro',
  gatito: 'gato',
  chancho: 'cerdo',
  puerco: 'cerdo',
  ganado: 'vaca',
  res: 'vaca',
  cuye: 'cuy',
};

/** Palabras vacias que no filtran (si queda alguna otra palabra). */
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y', 'con', 'en', 'a', 'un', 'una', 'por']);

/** Minusculas y sin tildes (la ñ pasa a n: "pequeñas" = "pequenas"). */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Normalizado y sin separadores: "Pro-Can adultos" -> "procanadultos". */
export function compactar(s: string): string {
  return normalizar(s).replace(/[\s\-_.,·/()'"]+/g, '');
}

/** La palabra y sus singulares posibles (perros, cuyes -> cuy, aves -> ave). */
function formas(palabra: string): string[] {
  const f = [palabra];
  if (palabra.length > 4 && palabra.endsWith('es')) f.push(palabra.slice(0, -2));
  if (palabra.length > 3 && palabra.endsWith('s')) f.push(palabra.slice(0, -1));
  return f;
}

/** Animal al que se refiere una palabra normalizada, o null. */
export function animalDe(palabra: string): Animal | null {
  for (const f of formas(palabra)) {
    if ((ANIMALES as readonly string[]).includes(f)) return f as Animal;
    if (f in SINONIMOS) return SINONIMOS[f];
  }
  return null;
}

/** Texto para data-busqueda (normalizado, legible). */
export function textoBusqueda(campos: (string | null | undefined)[], animales: readonly string[] = []): string {
  return normalizar([...campos, ...animales].filter(Boolean).join(' '));
}

export interface Indexado {
  /** Texto compacto (sin espacios ni guiones). */
  compacto: string;
  animales: readonly string[];
}

export function indexar(texto: string, animales: readonly string[]): Indexado {
  return { compacto: compactar(texto), animales };
}

export interface Consulta {
  /** Consulta entera compactada (para "pro can" = "procan"). */
  entera: string;
  palabras: { animal: Animal | null; formas: string[] }[];
}

export function prepararConsulta(texto: string): Consulta | null {
  const norm = normalizar(texto);
  let crudas = norm.split(/[\s\-_/]+/).map(compactar).filter(Boolean);
  const llenas = crudas.filter((w) => !VACIAS.has(w));
  if (llenas.length) crudas = llenas;
  if (!crudas.length) return null;
  return {
    entera: compactar(norm),
    palabras: crudas.map((w) => ({ animal: animalDe(w), formas: formas(w) })),
  };
}

function coincidePalabra(p: Consulta['palabras'][number], ix: Indexado): boolean {
  if (p.animal) return ix.animales.includes(p.animal);
  return p.formas.some((f) => ix.compacto.includes(f));
}

/**
 * Filtra una lista de productos indexados. Devuelve un Set con los indices
 * que coinciden (todos si la consulta esta vacia).
 */
export function buscar(consulta: Consulta | null, items: readonly Indexado[]): Set<number> {
  const todos = new Set(items.map((_, i) => i));
  if (!consulta) return todos;
  if (consulta.palabras.length > 1 && consulta.entera.length >= 3) {
    const enteras = new Set<number>();
    items.forEach((ix, i) => {
      if (ix.compacto.includes(consulta.entera)) enteras.add(i);
    });
    if (enteras.size) return enteras;
  }
  const r = new Set<number>();
  items.forEach((ix, i) => {
    if (consulta.palabras.every((p) => coincidePalabra(p, ix))) r.add(i);
  });
  return r;
}
