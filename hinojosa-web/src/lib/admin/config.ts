// Panel oculto de administracion (bloque 29, PLAN.md 0-E).
// Direccion publica del Worker (admin-worker/). No es un secreto: sin la
// contrasena, el Worker responde 401. Si se migra el Worker, cambiar solo esto.
export const API_PRODUCTOS = 'https://hinojosa.mjkpqnx.workers.dev/productos';

// Gesto que abre el panel: CLICS clics en el logo dentro de VENTANA_MS.
export const CLICS = 4;
export const VENTANA_MS = 2500;
