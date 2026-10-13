// Estado "Abierto ahora / Cerrado" de Visitanos. Solo se calcula si hay
// horario Y zona horaria confirmados (el componente solo pinta el elemento
// [data-estado-horario] en ese caso). Se recalcula cada minuto y al volver
// a la vista. El estado lleva siempre palabra + icono, nunca solo color.
import { alEntrarEnVista } from './router';

interface Tramo {
  dias: number[];
  abre: string;
  cierra: string;
}

const el = document.querySelector<HTMLElement>('[data-estado-horario]');

function ahoraEn(zona: string): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
  const dias = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return { dia: dias.indexOf(get('weekday')) + 1, minutos: Number(get('hour')) * 60 + Number(get('minute')) };
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function pintar() {
  if (!el) return;
  const zona = el.dataset.zona;
  let tramos: Tramo[] = [];
  try {
    tramos = JSON.parse(el.dataset.tramos ?? '[]');
  } catch {
    return;
  }
  if (!zona || !tramos.length) return;
  let ahora: { dia: number; minutos: number };
  try {
    ahora = ahoraEn(zona);
  } catch {
    return; // zona horaria invalida: no se muestra un estado falso
  }
  const abierto = tramos.some(
    (t) => t.dias.includes(ahora.dia) && ahora.minutos >= aMinutos(t.abre) && ahora.minutos < aMinutos(t.cierra),
  );
  el.dataset.abierto = String(abierto);
  const texto = el.querySelector<HTMLElement>('[data-estado-texto]');
  if (texto) texto.textContent = abierto ? (el.dataset.textoAbierto ?? '') : (el.dataset.textoCerrado ?? '');
  el.querySelector<HTMLElement>('[data-icono-abierto]')!.hidden = !abierto;
  el.querySelector<HTMLElement>('[data-icono-cerrado]')!.hidden = abierto;
  el.hidden = false;
}

if (el) {
  pintar();
  window.setInterval(pintar, 60_000);
  alEntrarEnVista('visitanos', pintar);
}
