// Free desktop icon placement, persisted per browser and viewport size.
const desktopIcons = [...document.querySelectorAll('#icons .desktop-icon')];
const layoutKey = () => (innerWidth < 701 ? 'papel-layout-mobile' : 'papel-layout-desktop');
let savedLayout = {};
function readLayout() {
  try {
    savedLayout = JSON.parse(read(layoutKey(), '{}'));
    if (!savedLayout || typeof savedLayout !== 'object' || Array.isArray(savedLayout))
      savedLayout = {};
  } catch {
    savedLayout = {};
  }
}
readLayout();
const iconLayer = $('#icons');
iconLayer.classList.add('free-icons');
function bounds() {
  return { width: innerWidth, height: innerHeight - 82 };
}
function placeIcon(icon, x, y) {
  const b = bounds();
  x = Math.max(0, Math.min(Math.max(0, b.width - icon.offsetWidth), x));
  y = Math.max(0, Math.min(Math.max(0, b.height - icon.offsetHeight), y));
  icon.style.left = Math.round(x) + 'px';
  icon.style.top = Math.round(y) + 'px';
  return { x: Math.round(x), y: Math.round(y) };
}
function defaultPosition(i) {
  const small = innerWidth < 701;
  return {
    x: (small ? 8 : 22) + Math.floor(i / 6) * (small ? 66 : 95),
    y: (small ? 34 : 47) + (i % 6) * (small ? 72 : 82),
  };
}
function arrangeIcons(reset = false) {
  desktopIcons.forEach((icon, i) => {
    const stored = reset ? null : savedLayout[icon.dataset.open];
    const position =
      stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)
        ? stored
        : defaultPosition(i);
    placeIcon(icon, position.x, position.y);
  });
}
function persistLayout() {
  savedLayout = {};
  desktopIcons.forEach(
    (icon) =>
      (savedLayout[icon.dataset.open] = {
        x: parseFloat(icon.style.left) || 0,
        y: parseFloat(icon.style.top) || 0,
      }),
  );
  save(layoutKey(), JSON.stringify(savedLayout));
}
arrangeIcons();
let draggedClick = null,
  selectedIcon = null;
function selectIcon(icon) {
  desktopIcons.forEach((x) => x.classList.toggle('icon-selected', x === icon));
  selectedIcon = icon;
}
// Capture the click emitted after dragging before any application handlers receive it.
document.addEventListener(
  'click',
  (e) => {
    const icon = e.target.closest('#icons .desktop-icon');
    if (icon && draggedClick === icon) {
      e.preventDefault();
      e.stopImmediatePropagation();
      draggedClick = null;
    }
  },
  true,
);
desktopIcons.forEach((icon) => {
  icon.draggable = false;
  icon.addEventListener('dragstart', (e) => e.preventDefault());
  icon.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    selectIcon(icon);
    const startX = e.clientX,
      startY = e.clientY,
      left = icon.offsetLeft,
      top = icon.offsetTop;
    let moving = false;
    icon.setPointerCapture(e.pointerId);
    function move(p) {
      const dx = p.clientX - startX,
        dy = p.clientY - startY;
      if (!moving && Math.hypot(dx, dy) > 6) {
        moving = true;
        icon.classList.add('icon-dragging');
        document.body.classList.add('dragging-desktop-icon');
        iconLayer.classList.add('drag-active');
      }
      if (moving) {
        p.preventDefault();
        placeIcon(icon, left + dx, top + dy);
      }
    }
    function end(p) {
      icon.removeEventListener('pointermove', move);
      icon.removeEventListener('pointerup', end);
      icon.removeEventListener('pointercancel', cancel);
      if (icon.hasPointerCapture(p.pointerId)) icon.releasePointerCapture(p.pointerId);
      icon.classList.remove('icon-dragging');
      document.body.classList.remove('dragging-desktop-icon');
      iconLayer.classList.remove('drag-active');
      if (moving) {
        persistLayout();
        draggedClick = icon;
        setTimeout(() => {
          if (draggedClick === icon) draggedClick = null;
        }, 350);
      }
    }
    function cancel(p) {
      end(p);
    }
    icon.addEventListener('pointermove', move);
    icon.addEventListener('pointerup', end);
    icon.addEventListener('pointercancel', cancel);
  });
  icon.addEventListener(
    'keydown',
    (e) => {
      if (!e.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      let step = e.shiftKey ? 1 : 10;
      let dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
        dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
      placeIcon(icon, icon.offsetLeft + dx, icon.offsetTop + dy);
      persistLayout();
    },
    true,
  );
  icon.title =
    (icon.title ? icon.title + ' · ' : '') + 'Arrastra para mover · Alt + flechas para ajustar';
});
$('#desktop').addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.desktop-icon,.window,header,footer,#start,.desktop-widget,.sticky'))
    selectIcon(null);
});
function resetLayout() {
  savedLayout = {};
  arrangeIcons(true);
  persistLayout();
  toast('Iconos ordenados. Puedes volver a moverlos.');
}
const contextMenu = $('#desktop-context');
const tidy = document.createElement('button');
tidy.textContent = '▦ Ordenar iconos';
tidy.onclick = resetLayout;
contextMenu.append(tidy);
const designSetup = setup;
setup = function (id, w) {
  designSetup(id, w);
  if (id === 'settings') {
    let block = document.createElement('div');
    block.className = 'layout-settings';
    block.innerHTML =
      '<h3>Un escritorio a tu manera</h3><p>Arrastra los iconos por la pantalla. Sus posiciones se guardan en este navegador.</p><button class="primary" id="reset-icon-layout">▦ Ordenar iconos</button><small>Con teclado: enfoca un icono y usa Alt + flechas. Añade Shift para moverlo píxel a píxel.</small>';
    w.querySelector('.content').append(block);
    block.querySelector('button').onclick = resetLayout;
  }
};
let resizeLayoutTimer;
addEventListener('resize', () => {
  clearTimeout(resizeLayoutTimer);
  resizeLayoutTimer = setTimeout(() => {
    readLayout();
    arrangeIcons();
  }, 150);
});
// Desktop tips replace decorative copy with discoverable functionality.
const hintLabel = $('.desktop-hint');
if (hintLabel)
  hintLabel.innerHTML =
    '<span>✧</span> Todo en su lugar. O donde tú quieras.<small>ARRASTRA TUS ICONOS · HAZ TUYO EL ESCRITORIO</small>';
// Release drag styling even if capture is lost or focus leaves the page.
function clearIconDrag() {
  desktopIcons.forEach((icon) => icon.classList.remove('icon-dragging'));
  document.body.classList.remove('dragging-desktop-icon');
  iconLayer.classList.remove('drag-active');
}
desktopIcons.forEach((icon) => icon.addEventListener('lostpointercapture', clearIconDrag));
addEventListener('blur', clearIconDrag);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearIconDrag();
});
