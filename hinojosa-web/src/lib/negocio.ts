// Acceso a los datos del negocio con la regla de "dato confirmado":
// si un dato no esta confirmado (o es null) NO se publica ni se enlaza.
import negocio from '../data/negocio.json';
import catalogoDatos from '../data/productos.json';
import textos from '../data/textos.json';
import alts from '../data/imagenes.json';
import { ruta, sinBase } from './ruta';

/**
 * Catalogo con las imagenes ya resueltas contra `base` (src/lib/ruta.ts):
 * productos.json guarda "/img/productos/..." desde la raiz de public/ y aqui
 * pasa a "/HINOJOSA/img/productos/..." en GitHub Pages. Todo lo que deriva
 * de `imagen` (avif, miniatura, srcset, precarga) hereda la base.
 */
const catalogo = {
  ...catalogoDatos,
  productos: catalogoDatos.productos.map((p) => ({ ...p, imagen: ruta(p.imagen) })),
};

export { negocio, catalogo, textos };

type ClaveContacto = keyof typeof negocio.contacto;

export const PENDIENTE = negocio.marcadorPendiente;

/** Devuelve el valor (texto) solo si esta confirmado; si no, null. */
export function datoConfirmado(clave: ClaveContacto): string | null {
  const d = negocio.contacto[clave] as { valor?: unknown; confirmado: boolean };
  return d.confirmado && typeof d.valor === 'string' && d.valor.trim() ? d.valor : null;
}

/** Referencias para llegar (lista de frases), solo si estan confirmadas. */
export function referenciasConfirmadas(): string[] | null {
  const d = negocio.contacto.referenciasLlegar as { valor: unknown; confirmado: boolean };
  if (!d.confirmado || !d.valor) return null;
  const lista = Array.isArray(d.valor) ? d.valor : [d.valor];
  const limpias = lista.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  return limpias.length ? limpias : null;
}

export interface TramoHorario {
  /** 1 = lunes ... 7 = domingo */
  dias: number[];
  abre: string;
  cierra: string;
}

/**
 * Horario confirmado: tramos (para calcular "Abierto ahora / Cerrado"),
 * texto para personas y zona horaria. Null si falta cualquiera de las
 * partes imprescindibles para no mostrar un estado falso.
 */
export function horarioConfirmado(): { tramos: TramoHorario[]; texto: string | null; zona: string | null } | null {
  const h = negocio.contacto.horario as { valor: unknown; confirmado: boolean; texto?: unknown };
  if (!h.confirmado || !Array.isArray(h.valor) || h.valor.length === 0) return null;
  const tramos = (h.valor as TramoHorario[]).filter(
    (t) => Array.isArray(t?.dias) && /^\d{2}:\d{2}$/.test(t?.abre) && /^\d{2}:\d{2}$/.test(t?.cierra),
  );
  if (!tramos.length) return null;
  return {
    tramos,
    texto: typeof h.texto === 'string' && h.texto.trim() ? h.texto : null,
    zona: datoConfirmado('zonaHoraria'),
  };
}

/** Coordenadas del pin del mapa, solo si estan confirmadas. */
export function coordenadasConfirmadas(): { lat: number; lng: number } | null {
  const c = negocio.contacto.coordenadas as { lat: number | null; lng: number | null; confirmado: boolean };
  return c.confirmado && typeof c.lat === 'number' && typeof c.lng === 'number' ? { lat: c.lat, lng: c.lng } : null;
}

/** Enlace wa.me con mensaje, o null si el WhatsApp no esta confirmado. */
export function enlaceWhatsapp(mensaje: string = textos.visitanos.mensajeWhatsapp): string | null {
  const numero = datoConfirmado('whatsapp');
  if (!numero) return null;
  const limpio = numero.replace(/\D/g, '');
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

/** Telefono en formato internacional de Ecuador: "099 708 5015" -> "+593997085015". */
export function telefonoInternacional(tel: string): string {
  const digitos = tel.replace(/[^\d+]/g, '');
  if (digitos.startsWith('+')) return digitos;
  return digitos.startsWith('0') ? `+593${digitos.slice(1)}` : digitos;
}

/** Telefonos confirmados: texto tal como se muestra y enlace tel:. */
export function telefonosConfirmados(): { texto: string; href: string; internacional: string }[] {
  const d = negocio.contacto.telefonos as { valor: unknown; confirmado: boolean };
  if (!d.confirmado || !Array.isArray(d.valor)) return [];
  return d.valor
    .filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    .map((texto) => {
      const internacional = telefonoInternacional(texto);
      return { texto, href: `tel:${internacional}`, internacional };
    });
}

/** Enlace mailto: del correo, o null si no esta confirmado. */
export function enlaceCorreo(): string | null {
  const correo = datoConfirmado('correo');
  return correo ? `mailto:${correo}` : null;
}

/** Precio en USD con dos decimales, como en los afiches ("$28.00"). */
export function formatoPrecio(precio: number | null, desde: boolean): string {
  if (precio === null) return textos.productos.sinPrecio;
  const valor = `${negocio.moneda.simbolo}${precio.toFixed(2)}`;
  return desde ? `${textos.productos.prefijoDesde} ${valor}` : valor;
}

/** Miniatura de 160 px de alto derivada de la imagen del carrusel. */
export function miniaturaDe(imagen: string | null): string | null {
  return imagen ? imagen.replace(/\.webp$/, '-thumb.webp') : null;
}

/** Variante AVIF de una imagen del carrusel (misma ruta, otra extension). */
export function avifDe(imagen: string | null): string | null {
  return imagen ? imagen.replace(/\.webp$/, '.avif') : null;
}

export function altDe(rutaImagen: string): string {
  return (alts as Record<string, string>)[sinBase(rutaImagen)] ?? '';
}

/** Sustituye {clave} en una plantilla de textos.json. */
export function plantilla(texto: string, valores: Record<string, string | number>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? `{${k}}`));
}
