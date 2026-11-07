// Modelo del panel "Detalle" (PLAN.md 0-F): UNA funcion pura, sin DOM ni JSON
// importados, que dado un producto devuelve lo que hay que pintar. La usan
// la ficha de escritorio (catalogo.ts, pintarFicha) y la hoja de detalle
// movil (hoja-detalle.ts) mediante pintarFichaEn (ficha-pintar.ts), asi las
// dos muestran siempre lo mismo. Al ser pura se prueba sola.
//
// Reglas (todo opcional, nada se inventa):
//   chips        especie(s) + categoria + etapa, solo los que existan
//   titulo/precio  siempre
//   descripcion  solo si existe y no repite el titulo (sin tildes ni
//                mayusculas; igual, o el titulo contenido literal)
//   atributos    Marca, Sabor / receta, Medida, Presentacion con valor;
//                nunca "Para" (ya esta en los chips)
//   accion       "Consultar disponibilidad": wa.me si hay WhatsApp
//                confirmado; si no, tel: al primer telefono ("Llamar y
//                consultar"); si tampoco hay telefono, null.

export interface FichaProducto {
  id: string;
  nombre: string;
  categoria: string;
  precioTexto: string;
  marca?: string | null;
  presentacion?: string | null;
  sabor?: string | null;
  medida?: string | null;
  etapa?: string | null;
  animales?: string[];
  descripcion?: string | null;
}

export interface FichaConfig {
  /** categoria (id) -> nombre corto para el chip */
  categorias: Record<string, string>;
  /** clave de animal -> nombre ("perro" -> "Perros") */
  animales: Record<string, string>;
  textos: {
    marca: string;
    sabor: string;
    medida: string;
    presentacion: string;
    etapa: string;
    ctaConsulta: string;
    ctaLlamar: string;
    /** Con {producto} */
    ctaMensaje: string;
    /** Nombres accesibles, con {producto}; empiezan con el texto visible */
    ctaConsultaNombre: string;
    ctaLlamarNombre: string;
  };
  /** Numero de WhatsApp confirmado (solo digitos o con +), o null */
  whatsapp: string | null;
  /** Primer telefono en formato internacional (+593...), o null */
  telefono: string | null;
}

export const TEXTOS_FICHA_POR_DEFECTO: FichaConfig['textos'] = {
  marca: 'Marca',
  sabor: 'Sabor / receta',
  medida: 'Medida',
  presentacion: 'Detalle',
  etapa: 'Etapa',
  ctaConsulta: 'Consultar disponibilidad',
  ctaLlamar: 'Llamar y consultar',
  ctaMensaje: 'Hola, quisiera consultar la disponibilidad de {producto}.',
  ctaConsultaNombre: 'Consultar disponibilidad de {producto}',
  ctaLlamarNombre: 'Llamar y consultar sobre {producto}',
};

export interface FichaChip {
  tipo: 'animal' | 'categoria' | 'etapa';
  /** Clave del animal (tipo 'animal') o id de categoria */
  clave: string;
  texto: string;
}

export interface FichaAtributo {
  clave: 'marca' | 'sabor' | 'medida' | 'presentacion';
  etiqueta: string;
  valor: string;
}

export interface FichaAccion {
  tipo: 'whatsapp' | 'llamar';
  href: string;
  /** Texto visible */
  etiqueta: string;
  /** Nombre accesible: empieza por el texto visible (2.5.3) y nombra el producto */
  nombreAccesible: string;
  /** wa.me se abre en otra pestana */
  externo: boolean;
}

export interface FichaModelo {
  chips: FichaChip[];
  titulo: string;
  precio: string;
  descripcion: string | null;
  atributos: FichaAtributo[];
  accion: FichaAccion | null;
}

/** Minusculas, sin tildes, solo letras y numeros separados por un espacio. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

const limpio = (v: string | null | undefined): string | null => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t ? t : null;
};

/** La descripcion no aporta si repite el titulo (igual o con el titulo dentro). */
export function descripcionUtil(descripcion: string | null | undefined, titulo: string): string | null {
  const d = limpio(descripcion);
  if (!d) return null;
  const nd = normalizar(d);
  const nt = normalizar(titulo);
  if (!nd) return null;
  if (nt && (nd === nt || nd.includes(nt))) return null;
  return d;
}

function accionDe(p: FichaProducto, cfg: FichaConfig): FichaAccion | null {
  const t = { ...TEXTOS_FICHA_POR_DEFECTO, ...cfg.textos };
  const numero = cfg.whatsapp?.replace(/\D/g, '') ?? '';
  if (numero) {
    const mensaje = t.ctaMensaje.replace('{producto}', p.nombre);
    return {
      tipo: 'whatsapp',
      href: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
      etiqueta: t.ctaConsulta,
      nombreAccesible: t.ctaConsultaNombre.replace('{producto}', p.nombre),
      externo: true,
    };
  }
  const tel = cfg.telefono?.replace(/[^\d+]/g, '') ?? '';
  if (tel) {
    return {
      tipo: 'llamar',
      href: `tel:${tel}`,
      etiqueta: t.ctaLlamar,
      nombreAccesible: t.ctaLlamarNombre.replace('{producto}', p.nombre),
      externo: false,
    };
  }
  return null;
}

/** Sabores con comas naturales (sin punto y coma). */
const sabor = (v: string | null | undefined) => (typeof v === 'string' ? v.replace(/\s*;\s*/g, ', ') : v);

export function modeloFicha(p: FichaProducto, cfg: FichaConfig): FichaModelo {
  const t = { ...TEXTOS_FICHA_POR_DEFECTO, ...cfg.textos };

  const chips: FichaChip[] = [];
  for (const a of p.animales ?? []) {
    chips.push({ tipo: 'animal', clave: a, texto: cfg.animales[a] ?? a });
  }
  const cat = limpio(cfg.categorias[p.categoria]);
  if (cat) chips.push({ tipo: 'categoria', clave: p.categoria, texto: cat });
  const etapa = limpio(p.etapa);
  if (etapa) chips.push({ tipo: 'etapa', clave: 'etapa', texto: etapa });

  const candidatos: [FichaAtributo['clave'], string, string | null][] = [
    ['marca', t.marca, limpio(p.marca)],
    ['medida', t.medida, limpio(p.medida)],
    ['sabor', t.sabor, limpio(sabor(p.sabor))],
    ['presentacion', t.presentacion, limpio(p.presentacion)],
  ];
  const vistos = new Set<string>();
  const atributos: FichaAtributo[] = [];
  for (const [clave, etiqueta, valor] of candidatos) {
    if (!valor) continue;
    const n = normalizar(valor);
    if (vistos.has(n)) continue; // dos campos con el mismo texto: uno solo
    vistos.add(n);
    atributos.push({ clave, etiqueta, valor });
  }

  return {
    chips,
    titulo: p.nombre,
    precio: p.precioTexto,
    descripcion: descripcionUtil(p.descripcion, p.nombre),
    atributos,
    accion: accionDe(p, cfg),
  };
}
