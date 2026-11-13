// Aero visual finish: a Windows-inspired Start composition.
const startSurface = document.querySelector('#start');
const startMain = document.createElement('div');
startMain.className = 'start-main-column';
const startSide = document.createElement('aside');
startSide.className = 'start-side-column';
startSide.setAttribute('aria-label', 'Accesos personales');
startSide.innerHTML =
  '<div class="start-user-tile" aria-hidden="true"><svg viewBox="0 0 48 48"><defs><linearGradient id="usergloss" x2="0" y2="1"><stop stop-color="#bdeaff"/><stop offset="1" stop-color="#3d86b4"/></linearGradient></defs><rect x="2" y="2" width="44" height="44" rx="8" fill="url(#usergloss)"/><circle cx="24" cy="18" r="8" fill="#effaff"/><path d="M10 42c0-16 28-16 28 0" fill="#e7f8ff"/><path d="M5 6h38v12Q20 10 5 25Z" fill="#fff" opacity=".25"/></svg></div><div class="start-user-name">Mi escritorio<small>Un lugar para tus ideas</small></div>';
for (const [id, label] of [
  ['files', 'Archivos'],
  ['editor', 'Documentos'],
  ['gallery', 'Imágenes'],
  ['music', 'Música'],
  ['settings', 'Personalizar'],
  ['backup', 'Respaldos'],
]) {
  const b = document.createElement('button');
  b.dataset.open = id;
  b.innerHTML = svg(id);
  const span = document.createElement('span');
  span.textContent = label;
  b.append(span);
  startSide.append(b);
}
const startFoot = document.createElement('div');
startFoot.className = 'start-side-foot';
startFoot.textContent = 'PAPEL OS · AERO EDITION';
startSide.append(startFoot);
const startBody = document.createElement('div');
startBody.className = 'start-body-grid';
for (const node of [...startSurface.children])
  if (!node.classList.contains('menu-head') && node.id !== 'reboot') startMain.append(node);
startBody.append(startMain, startSide);
startSurface.insertBefore(startBody, document.querySelector('#reboot'));
const rebootButton = document.querySelector('#reboot');
rebootButton.innerHTML =
  '<span class="reboot-dot">⏻</span> Reiniciar escritorio <span class="reboot-chevron">›</span>';
const heading = startSurface.querySelector('.menu-head');
heading.innerHTML =
  '<span class="start-brand-mark">' +
  svg('welcome') +
  '</span><div>PAPEL OS<small>Tu escritorio personal</small></div><span class="start-edition">AERO</span>';
// Pointer-positioned illumination stays within the taskbar buttons.
for (const node of [
  document.querySelector('#startbutton'),
  document.querySelector('#overviewbutton'),
]) {
  if (!node) continue;
  node.addEventListener('pointermove', (e) => {
    const r = node.getBoundingClientRect();
    node.style.setProperty('--hover-x', ((e.clientX - r.left) / r.width) * 100 + '%');
  });
}
