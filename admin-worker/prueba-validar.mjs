// node admin-worker/prueba-validar.mjs
// Comprueba que el catalogo real pasa la validacion y que los casos malos fallan.
import { readFileSync } from 'node:fs';
import { validarProductos } from './src/validar.js';

const ruta = new URL('../hinojosa-web/src/data/productos.json', import.meta.url);
const datos = JSON.parse(readFileSync(ruta, 'utf8'));
const ctx = { categorias: datos.categorias, actuales: datos.productos };
const copia = () => structuredClone(datos.productos);

let fallos = 0;
function esperar(nombre, errores, debeFallar) {
  const ok = debeFallar ? errores.length > 0 : errores.length === 0;
  if (!ok) fallos++;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${errores.length ? ' -> ' + errores[0] : ''}`);
}

esperar('catalogo real (37 productos)', validarProductos(datos.productos, ctx), false);

let l = copia(); l[0].precio = 29.5;
esperar('cambiar un precio', validarProductos(l, ctx), false);

l = copia(); l[0].precio = -3;
esperar('precio negativo', validarProductos(l, ctx), true);
l = copia(); l[0].precio = 12.345;
esperar('precio con 3 decimales', validarProductos(l, ctx), true);
l = copia(); l[0].precio = '28';
esperar('precio como texto', validarProductos(l, ctx), true);
l = copia(); l[0].descripcion = 'x'.repeat(111);
esperar('descripcion de 111 caracteres', validarProductos(l, ctx), true);
l = copia(); l[0].descripcion = '<script>alert(1)</script>';
esperar('descripcion con HTML', validarProductos(l, ctx), true);
l = copia(); l[1].id = l[0].id;
esperar('id repetido', validarProductos(l, ctx), true);
l = copia(); l[0].categoria = 'inventada';
esperar('categoria desconocida', validarProductos(l, ctx), true);
l = copia(); l[0].animales = ['dragon'];
esperar('animal desconocido', validarProductos(l, ctx), true);
l = copia(); l[0].imagen = '/img/../../etc/passwd';
esperar('imagen con ..', validarProductos(l, ctx), true);
l = copia(); l[0].extra = 1;
esperar('campo no permitido', validarProductos(l, ctx), true);
l = copia(); l = l.slice(0, 20);
esperar('quitar 17 de golpe', validarProductos(l, ctx), true);
l = copia(); l.push({ id: 'nuevo-producto', categoria: 'granja', animales: ['perro'], nombre: 'Producto nuevo', descripcion: null, marca: null, presentacion: null, precio: null, precioDesde: false, imagen: null, destacado: false });
esperar('agregar producto sin foto ni precio', validarProductos(l, ctx), false);
esperar('lista vacia', validarProductos([], ctx), true);

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasan');
process.exit(fallos ? 1 : 0);
