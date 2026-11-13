// Explorer composition and taskbar previews, built on the existing apps.
const explorerDesignSetup = setup;
setup = function (id, w) {
  explorerDesignSetup(id, w);
  if (id !== 'files') return;
  const content = w.querySelector('.content');
  const shell = document.createElement('div');
  shell.className = 'explorer-shell';
  const sidebar = document.createElement('aside');
  sidebar.className = 'explorer-sidebar';
  sidebar.setAttribute('aria-label', 'Lugares del explorador');
  sidebar.innerHTML = '<div class="explorer-side-title">LUGARES FAVORITOS</div>';
  for (const [app, label] of [
    ['files', 'Escritorio'],
    ['editor', 'Documentos'],
    ['gallery', 'Imágenes'],
    ['music', 'Música'],
  ]) {
    let b = document.createElement('button');
    b.dataset.open = app;
    b.innerHTML = svg(app);
    const text = document.createElement('span');
    text.textContent = label;
    b.append(text);
    if (app === 'files') b.className = 'explorer-current';
    sidebar.append(b);
  }
  const divider = document.createElement('div');
  divider.className = 'explorer-side-title';
  divider.textContent = 'HERRAMIENTAS';
  sidebar.append(divider);
  for (const [app, label] of [
    ['notes', 'Notas'],
    ['todos', 'Pendientes'],
    ['backup', 'Respaldos'],
    ['settings', 'Personalizar'],
  ]) {
    let b = document.createElement('button');
    b.dataset.open = app;
    b.innerHTML = svg(app);
    let text = document.createElement('span');
    text.textContent = label;
    b.append(text);
    sidebar.append(b);
  }
  const sidebarFoot = document.createElement('div');
  sidebarFoot.className = 'explorer-side-foot';
  sidebarFoot.innerHTML =
    '<span class="explorer-disk-icon">' +
    svg('files') +
    '</span><strong>Este escritorio<small>Tu espacio personal</small></strong>';
  sidebar.append(sidebarFoot);
  const main = document.createElement('div');
  main.className = 'explorer-main';
  while (content.firstChild) main.append(content.firstChild);
  shell.append(sidebar, main);
  content.append(shell);
  const toolbar = main.querySelector('.file-toolbar');
  if (toolbar) {
    toolbar.innerHTML =
      '<button class="explorer-back" data-open="welcome" aria-label="Abrir bienvenida">‹</button><div class="explorer-breadcrumb">' +
      svg('files') +
      '<span>BubbleOs</span><b>›</b><strong>Escritorio</strong></div><span class="explorer-view-label">ICONOS</span>';
  }
  const cards = main.querySelectorAll('.file-item');
  cards.forEach((b) => {
    const icon = b.querySelector('svg');
    if (icon) {
      const wrapper = document.createElement('span');
      wrapper.className = 'explorer-file-icon';
      icon.before(wrapper);
      wrapper.append(icon);
    }
  });
  if (!w.dataset.explorerSized) {
    w.dataset.explorerSized = '1';
    w.style.width = '760px';
    w.style.height = '475px';
    w.style.left =
      Math.max(8, Math.min(w.offsetLeft, innerWidth - Math.min(760, innerWidth - 16) - 16)) + 'px';
  }
};
const preview = document.createElement('section');
preview.id = 'task-preview';
preview.hidden = true;
preview.setAttribute('aria-label', 'Vista rápida de aplicación');
document.body.append(preview);
let previewID = null,
  previewTimer = null;
function hideTaskPreview() {
  preview.hidden = true;
  previewID = null;
}
function taskPreview(button) {
  const id = button.dataset.task,
    w = opened.get(id);
  if (!w) return;
  previewID = id;
  const rect = button.getBoundingClientRect();
  preview.style.left =
    Math.max(8, Math.min(innerWidth - 230, rect.left + rect.width / 2 - 110)) + 'px';
  preview.innerHTML =
    '<div class="task-preview-title"><span></span><button aria-label="Cerrar aplicación">×</button></div><button class="task-preview-open"><div class="task-preview-screen">' +
    svg(id) +
    '<i></i></div><span></span></button><div class="task-preview-state"></div>';
  preview.querySelector('.task-preview-title>span').textContent = apps[id][0];
  preview.querySelector('.task-preview-open>span').textContent = 'Volver a ' + apps[id][0];
  preview.querySelector('.task-preview-state').textContent = w.hidden
    ? 'VENTANA MINIMIZADA'
    : 'VENTANA ABIERTA';
  preview.querySelector('.task-preview-title>button').onclick = () => {
    w.querySelector('[data-action="close"]').click();
    hideTaskPreview();
  };
  preview.querySelector('.task-preview-open').onclick = () => {
    hideTaskPreview();
    openApp(id);
  };
  preview.hidden = false;
}
const taskList = document.querySelector('#tasks');
taskList.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const button = e.target.closest('[data-task]');
  if (!button || button.contains(e.relatedTarget)) return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => taskPreview(button), 380);
});
taskList.addEventListener('pointerout', (e) => {
  const button = e.target.closest('[data-task]');
  if (button && button.contains(e.relatedTarget)) return;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(hideTaskPreview, 200);
});
preview.addEventListener('pointerenter', () => clearTimeout(previewTimer));
preview.addEventListener('pointerleave', () => {
  previewTimer = setTimeout(hideTaskPreview, 200);
});
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#task-preview,#tasks')) hideTaskPreview();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideTaskPreview();
});
