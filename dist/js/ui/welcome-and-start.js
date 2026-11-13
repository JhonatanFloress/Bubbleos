// Desktop composition and visual navigation.
const designBody = body;
body = function (id) {
  if (id === 'welcome')
    return `<div class="welcome-dashboard"><div class="welcome-brand"><span class="brand-orb"><i></i><i></i><i></i><i></i></span><div>PAPEL<span>personal operating space</span></div><small>GLASS EDITION / 03</small></div><div class="welcome-hero"><span class="welcome-kicker">UN ESCRITORIO CON POSIBILIDADES.</span><h1>Un pequeño mundo.<br><em>Muy tuyo.</em></h1><p>Ideas, música y un poco de tiempo para jugar.<br>Todo encuentra su lugar aquí.</p></div><div class="welcome-tiles"><button data-open="files">${svg('files')}<span>Explorar<small>Tus archivos, a mano</small></span><b>↗</b></button><button data-open="editor">${svg('editor')}<span>Crear algo<small>Una página en blanco</small></span><b>↗</b></button><button data-open="music">${svg('music')}<span>Darle play<small>Un momento para ti</small></span><b>↗</b></button></div><div class="welcome-signoff"><span class="tiny-dot"></span> TU ESPACIO ESTÁ LISTO <span>Hazlo tuyo. ✧</span></div></div>`;
  return designBody(id);
};
apps.welcome[1] = 530;
apps.welcome[2] = 590;
const widget = document.createElement('section');
widget.className = 'desktop-widget';
widget.setAttribute('aria-label', 'Reloj y calendario del escritorio');
widget.innerHTML =
  '<div class="widget-top"><span class="widget-orb">✧</span><span>PAPEL / DESKTOP</span><button data-open="settings" aria-label="Personalizar escritorio">⚙</button></div><button class="widget-time" data-open="clock" aria-label="Abrir reloj"></button><button class="widget-date" data-open="calendar" aria-label="Abrir calendario"></button><div class="widget-divider"></div><div class="widget-month-head"><span></span><button data-open="calendar">VER CALENDARIO ↗</button></div><div class="widget-days"></div><div class="widget-bottom"><span class="tiny-dot"></span> Una cosa a la vez.</div>';
$('#desktop').append(widget);
function updateWidget() {
  const date = new Date();
  widget.querySelector('.widget-time').textContent = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  widget.querySelector('.widget-date').textContent = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  widget.querySelector('.widget-month-head span').textContent = date.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
  const grid = widget.querySelector('.widget-days');
  grid.replaceChildren();
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((label) => {
    let b = document.createElement('b');
    b.textContent = label;
    grid.append(b);
  });
  let offset = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) grid.append(document.createElement('span'));
  let count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= count; i++) {
    let span = document.createElement('span');
    span.textContent = i;
    if (i === date.getDate()) span.className = 'widget-today';
    grid.append(span);
  }
}
updateWidget();
setInterval(updateWidget, 30000);
const startTiles = document.createElement('div');
startTiles.className = 'start-favorites';
startTiles.innerHTML = ['files', 'editor', 'music', 'settings']
  .map(
    (id) =>
      `<button data-open="${id}">${svg(id)}<span>${{ files: 'Archivos', editor: 'Documentos', music: 'Música', settings: 'Ajustes' }[id]}</span></button>`,
  )
  .join('');
$('#appsearch').before(startTiles);
$('#startapps')
  .querySelectorAll('[data-open]')
  .forEach((button) => {
    const icon = document.createElement('span');
    icon.className = 'start-app-icon';
    icon.innerHTML = svg(button.dataset.open);
    button.prepend(icon);
  });
const labels = {
  files: 'Archivos',
  notes: 'Bloc de notas',
  draw: 'Dibujo',
  terminal: 'Terminal',
  settings: 'Configuración',
  trash: 'Papelera',
  music: 'Media Player',
  calendar: 'Calendario',
  game: 'Memorama',
  todos: 'Pendientes',
  clock: 'Reloj',
  editor: 'Documentos',
  budget: 'Presupuesto',
  snake: 'Snake',
  converter: 'Convertidor',
  backup: 'Respaldos',
};
document.querySelectorAll('#icons [data-open]').forEach((button) => {
  const label = button.querySelector('span');
  if (label) label.textContent = labels[button.dataset.open] || label.textContent;
});
const groupLabel = document.createElement('div');
groupLabel.className = 'desktop-group-label';
groupLabel.textContent = 'TU ESCRITORIO';
$('#icons').before(groupLabel);
