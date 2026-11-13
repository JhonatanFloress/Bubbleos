// Windows-inspired web system tray. Indicators describe this web app/browser.
const tray = $('.footer-right');
tray.className = 'footer-right system-tray';
tray.innerHTML = `<button class="tray-button" data-tray="more" aria-label="Mostrar accesos del sistema"><svg viewBox="0 0 20 20"><path d="m5 12 5-5 5 5"/></svg></button><button class="tray-button" data-tray="network" aria-label="Estado de conexión"><svg viewBox="0 0 20 20"><path d="M2 7a12 12 0 0 1 16 0M5 10a8 8 0 0 1 10 0M8 13a3 3 0 0 1 4 0"/><circle cx="10" cy="16" r="1"/></svg></button><button class="tray-button" data-tray="volume" aria-label="Sonido de las apps"><svg viewBox="0 0 20 20"><path d="M3 8h3l5-4v12l-5-4H3ZM14 7q4 3 0 6M16 4q7 6 0 12"/></svg></button><button class="tray-button" data-tray="battery" aria-label="Estado de energía"><svg viewBox="0 0 20 20"><rect x="2" y="6" width="14" height="8" rx="1"/><path d="M18 8v4M5 8v4M8 8v4M11 8v4"/></svg></button><button class="tray-clock" data-tray="calendar" aria-label="Abrir fecha y calendario"><span id="clock"></span><small id="traydate"></small></button><button class="tray-peek" id="traydesktop" aria-label="Mostrar escritorio"></button>`;
const trayPanel = document.createElement('section');
trayPanel.id = 'tray-panel';
trayPanel.hidden = true;
trayPanel.setAttribute('aria-label', 'Panel del sistema');
document.body.append(trayPanel);
let trayActive = '';
function updateTrayClock() {
  const now = new Date();
  $('#clock').textContent = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  $('#traydate').textContent = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
updateTrayClock();
setInterval(updateTrayClock, 1000);
function closeTray() {
  trayPanel.hidden = true;
  trayActive = '';
  tray.querySelectorAll('[data-tray]').forEach((b) => b.classList.remove('tray-active'));
}
function showTray(kind) {
  if (trayActive === kind && !trayPanel.hidden) {
    closeTray();
    return;
  }
  trayActive = kind;
  trayPanel.hidden = false;
  tray
    .querySelectorAll('[data-tray]')
    .forEach((b) => b.classList.toggle('tray-active', b.dataset.tray === kind));
  if (kind === 'network') {
    trayPanel.innerHTML =
      '<div class="tray-panel-heading">Conexión del navegador<span class="tray-state-dot"></span></div><div class="tray-network-symbol">⌁</div><h3>' +
      (navigator.onLine ? 'Conectado' : 'Sin conexión') +
      '</h3><p>' +
      (navigator.onLine
        ? 'El navegador informa que hay una conexión disponible.'
        : 'Puedes seguir usando las apps ya cargadas.') +
      '</p><small>Estado del navegador; no mide velocidad ni controla tu Wi-Fi.</small><button class="tray-link" data-open="files">Abrir archivos locales ↗</button>';
  }
  if (kind === 'volume') {
    const player = opened.get('music'),
      slider = player?.querySelector('#volume');
    trayPanel.innerHTML =
      '<div class="tray-panel-heading">Sonido de BubbleOs</div><div class="tray-volume-icon">♫</div><p>Volumen del reproductor</p><label class="tray-volume-row"><span>◀</span><input id="trayvolume" aria-label="Volumen del reproductor" type="range" min="0" max="0.3" step="0.01" value="' +
      (slider?.value || read('papel-player-volume', '0.12')) +
      '"><output id="trayvolumevalue"></output></label><small>Controla Media Player dentro de este sitio.</small><button class="tray-link" data-open="music">Abrir Media Player ↗</button>';
    const range = trayPanel.querySelector('input'),
      out = trayPanel.querySelector('output');
    function volume() {
      out.textContent = Math.round((Number(range.value) / 0.3) * 100) + '%';
      save('papel-player-volume', range.value);
      const current = opened.get('music')?.querySelector('#volume');
      if (current) {
        current.value = range.value;
        current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    range.oninput = volume;
    out.textContent = Math.round((Number(range.value) / 0.3) * 100) + '%';
  }
  if (kind === 'battery') {
    trayPanel.innerHTML =
      '<div class="tray-panel-heading">Energía</div><div class="tray-battery-symbol">▰</div><h3>Escritorio web</h3><p>La lectura de batería no está disponible en este navegador.</p><small>Este icono no representa el nivel de batería de tu equipo.</small><button class="tray-link" data-open="settings">Opciones del escritorio ↗</button>';
    if (typeof navigator.getBattery === 'function')
      navigator
        .getBattery()
        .then((b) => {
          if (trayActive !== 'battery' || trayPanel.hidden) return;
          trayPanel.querySelector('h3').textContent =
            Math.round(b.level * 100) + '% · ' + (b.charging ? 'Cargando' : 'Con batería');
          trayPanel.querySelector('p').textContent = 'Nivel comunicado por el navegador.';
          trayPanel.querySelector('small').textContent =
            'La información depende del soporte del navegador.';
        })
        .catch(() => {});
  }
  if (kind === 'more') {
    trayPanel.innerHTML =
      '<div class="tray-panel-heading">Accesos del sistema</div><div class="tray-shortcuts">' +
      ['settings', 'manager', 'focus', 'backup']
        .map(
          (id) =>
            '<button data-open="' +
            id +
            '">' +
            svg(id) +
            '<span>' +
            apps[id][0] +
            '</span></button>',
        )
        .join('') +
      '</div>';
  }
  if (kind === 'calendar') {
    const now = new Date();
    trayPanel.innerHTML =
      '<div class="tray-panel-heading">' +
      now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) +
      '</div><div class="tray-big-time">' +
      now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      '</div><p>' +
      now.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) +
      '</p><button class="tray-link" data-open="calendar">Abrir calendario y notas ↗</button><button class="tray-link" data-open="clock">Reloj y temporizador ↗</button>';
  }
}
tray.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tray]');
  if (b) showTray(b.dataset.tray);
});
trayPanel.addEventListener('click', (e) => {
  if (e.target.closest('[data-open]')) closeTray();
});
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#tray-panel,.system-tray')) closeTray();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTray();
});
$('#traydesktop').onclick = () => $('#showdesktop').click();
addEventListener('online', () => {
  if (trayActive === 'network') {
    trayActive = '';
    showTray('network');
  }
});
addEventListener('offline', () => {
  if (trayActive === 'network') {
    trayActive = '';
    showTray('network');
  }
});
const traySetup = setup;
setup = function (id, w) {
  traySetup(id, w);
  if (id === 'music') {
    const range = w.querySelector('#volume');
    range.value = read('papel-player-volume', '0.12');
    range.addEventListener('input', () => save('papel-player-volume', range.value));
  }
};
