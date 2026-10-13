// Acceso a los datos del negocio con la regla de "dato confirmado":
// si un dato no esta confirmado (o es null) NO se publica ni se enlaza.
import negocio from '../data/negocio.json';
import catalogo from '../data/productos.json';
import textos from '../data/textos.json';
import alts from '../data/imagenes.json';

export { negocio, catalogo, textos };

type ClaveContacto = keyof typeof negocio.contacto;

export const PENDIENTE = negocio.marcadorPendiente;

/** Devuelve el valor solo si esta confirmado; si no, null. */
export function datoConfirmado(clave: ClaveContacto): string | null {
  const d = negocio.contacto[clave] as { valor: string | null; confirmado: boolean };
  return d.confirmado && d.valor ? d.valor : null;
}

/** Enlace wa.me con mensaje, o null si el WhatsApp no esta confirmado. */
export function enlaceWhatsapp(mensaje: string = textos.comunes.mensajeWhatsappGeneral): string | null {
  const numero = datoConfirmado('whatsapp');
  if (!numero) return null;
  const limpio = numero.replace(/\D/g, '');
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
}

export function enlaceTelefono(): string | null {
  const tel = datoConfirmado('telefono');
  return tel ? `tel:${tel.replace(/[^\d+]/g, '')}` : null;
}

/** Precio en USD con dos decimales, como en los afiches ("$28.00"). */
export function formatoPrecio(precio: number | null, desde: boolean): string {
  if (precio === null) return textos.catalogo.sinPrecio;
  const valor = `${negocio.moneda.simbolo}${precio.toFixed(2)}`;
  return desde ? `${textos.catalogo.prefijoDesde} ${valor}` : valor;
}

export function altDe(ruta: string): string {
  return (alts as Record<string, string>)[ruta] ?? '';
}

/** Contadores de "Por que elegirnos", calculados desde los datos. */
export function contadores() {
  const valores: Record<string, number> = {
    'negocio.json > animalesAtendidos (longitud)': negocio.animalesAtendidos.length,
    'productos.json > categorias (longitud)': catalogo.categorias.length,
    'productos.json > productos (longitud)': catalogo.productos.length,
    'productos.json > tablaProteinaTilapia.etapas (longitud)': catalogo.tablaProteinaTilapia.etapas.length,
  };
  return textos['por-que-elegirnos'].contadores
    .filter((c) => c.fuente in valores)
    .map((c) => ({ valor: valores[c.fuente], sufijo: c.sufijo, etiqueta: c.etiqueta }));
}
