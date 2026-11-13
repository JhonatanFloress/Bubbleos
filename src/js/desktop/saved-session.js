// Save a window layout without changing the data inside each application.
apps.session = ['Mi sesión', 440, 400];
icons.session = icons.files;
function readWindowSession() {
  try {
    const value = JSON.parse(read('papel-window-session', 'null'));
    return value && Array.isArray(value.windows) ? value : null;
  } catch {
    return null;
  }
}
function saveWindowSession() {
  const windows = [...opened]
    .filter(([id]) => id !== 'session')
    .map(([id, w]) => ({
      id,
      x: w.offsetLeft,
      y: w.offsetTop,
      width: w.hidden ? parseFloat(w.style.width) : w.offsetWidth,
      height: w.hidden ? parseFloat(w.style.height) : w.offsetHeight,
      maximized: w.classList.contains('maximized'),
      hidden: w.hidden,
    }));
  save('papel-window-session', JSON.stringify({ date: new Date().toISOString(), windows }));
  return windows.length;
}
function restoreWindowSession() {
  const session = readWindowSession();
  if (!session) {
    toast('Primero guarda una distribución.');
    return;
  }
  for (const item of session.windows.slice(0, 30)) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !Object.hasOwn(apps, item.id) ||
      item.id === 'session'
    )
      continue;
    openApp(item.id);
    const w = opened.get(item.id);
    const width = Math.max(280, Math.min(innerWidth - 16, Number(item.width) || apps[item.id][1]));
    const height = Math.max(
      220,
      Math.min(innerHeight - 65, Number(item.height) || apps[item.id][2]),
    );
    w.classList.remove('snapped-window');
    w.classList.toggle('maximized', !!item.maximized);
    w.style.width = width + 'px';
    w.style.height = height + 'px';
    w.style.left = Math.max(8, Math.min(innerWidth - width - 8, Number(item.x) || 8)) + 'px';
    w.style.top = Math.max(8, Math.min(innerHeight - height - 54, Number(item.y) || 8)) + 'px';
    w.hidden = !!item.hidden;
  }
  tasks();
  toast('Distribución recuperada.');
}
const sessionBody = body;
body = function (id) {
  if (id !== 'session') return sessionBody(id);
  return `<div class="extra-pad session-app"><span class="appearance-kicker">VUELVE A DONDE TE QUEDASTE</span><h2>Tu mesa de trabajo.</h2><p>Guarda qué aplicaciones tienes abiertas, su tamaño y su posición.</p><div class="session-summary"></div><div class="session-buttons"><button class="primary session-save">Guardar distribución actual</button><button class="primary session-restore">Recuperar guardada</button></div><label class="appearance-switch"><input class="session-auto" type="checkbox"> Recuperar al iniciar</label><small>Se conserva la última distribución que guardaste. No sustituye el respaldo de archivos ni guarda dibujos sin descargar. Reproducir música requiere que pulses Play.</small></div>`;
};
const sessionSetup = setup;
setup = function (id, w) {
  sessionSetup(id, w);
  if (id !== 'session') return;
  function summary() {
    const saved = readWindowSession();
    w.querySelector('.session-summary').textContent = saved
      ? saved.windows.length + ' ventanas · ' + new Date(saved.date).toLocaleString('es-MX')
      : 'Todavía no hay una distribución guardada.';
    w.querySelector('.session-restore').disabled = !saved;
  }
  w.querySelector('.session-save').onclick = () => {
    const n = saveWindowSession();
    summary();
    toast(n + ' ventanas guardadas.');
  };
  w.querySelector('.session-restore').onclick = restoreWindowSession;
  const auto = w.querySelector('.session-auto');
  auto.checked = read('papel-session-auto', '0') === '1';
  auto.onchange = () => save('papel-session-auto', auto.checked ? '1' : '0');
  summary();
};
const sessionMenu = document.createElement('button');
sessionMenu.dataset.open = 'session';
sessionMenu.innerHTML = '<span class="start-app-icon">' + svg('session') + '</span>Mi sesión';
document.querySelector('#startapps').append(sessionMenu);
if (read('papel-session-auto', '0') === '1' && readWindowSession())
  setTimeout(restoreWindowSession, 1900);
