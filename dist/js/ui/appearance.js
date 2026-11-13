// A live design panel built on existing wallpaper and glass preferences.
apps.appearance = ['Centro de personalización', 560, 560];
icons.appearance = icons.draw;
const appearanceThemes = {
  ocean: { name: 'Océano', wall: 'classic', glass: 'blue', color: '#a1d8f1' },
  garden: { name: 'Jardín', wall: 'classic', glass: 'sage', color: '#b1d2b5' },
  sunset: { name: 'Atardecer', wall: 'sunset', glass: 'rose', color: '#dfbdce' },
  night: { name: 'Noche', wall: 'night', glass: 'slate', color: '#7d95ba' },
};
function applyAppearanceOptions() {
  document
    .querySelector('#desktop')
    .classList.toggle('solid-chrome', read('papel-solid-chrome', '0') === '1');
  document.querySelector('.desktop-widget').hidden = read('papel-hide-widget', '0') === '1';
  document.querySelector('.desktop-hint').hidden = read('papel-hide-hint', '0') === '1';
}
applyAppearanceOptions();
const appearanceBody = body;
body = function (id) {
  if (id !== 'appearance') return appearanceBody(id);
  return `<div class="appearance-app"><span class="appearance-kicker">UN ESCRITORIO CON TU PERSONALIDAD</span><h2>Elige tu ambiente.</h2><p>Los cambios se aplican al momento y se guardan aquí.</p><div class="appearance-themes">${Object.entries(
    appearanceThemes,
  )
    .map(
      ([id, t]) =>
        `<button data-preset="${id}" style="--preview-color:${t.color}"><span class="theme-preview theme-${id}"><i class="theme-window"></i><i class="theme-bar"></i></span><strong>${t.name}</strong><small>${t.glass === 'slate' ? 'Cielo nocturno' : 'Paisaje y cristal'}</small></button>`,
    )
    .join(
      '',
    )}</div><div class="appearance-options"><label class="appearance-switch"><input data-pref="papel-solid-chrome" type="checkbox"> Ventanas opacas <small>Más contraste, menos transparencias.</small></label><label class="appearance-switch"><input data-pref="papel-hide-widget" type="checkbox"> Ocultar reloj y calendario del escritorio</label><label class="appearance-switch"><input data-pref="papel-hide-hint" type="checkbox"> Ocultar frase del escritorio</label></div><div class="appearance-footer"><button class="primary" data-open="settings">Fondos propios y más ajustes ↗</button><button class="primary" data-open="session">Guardar mi distribución ↗</button></div><small class="appearance-note">Elegir un tema restaura su paisaje. Tu imagen de fondo permanece en la galería.</small></div>`;
};
const appearanceSetup = setup;
setup = function (id, w) {
  appearanceSetup(id, w);
  if (id === 'settings') {
    const shortcut = document.createElement('button');
    shortcut.className = 'primary appearance-shortcut';
    shortcut.dataset.open = 'appearance';
    shortcut.textContent = '✧ Abrir centro de personalización';
    w.querySelector('.content').prepend(shortcut);
  }
  if (id !== 'appearance') return;
  const chosen = read('papel-theme-preset', '');
  w.querySelectorAll('[data-preset]').forEach((button) => {
    button.classList.toggle('preset-selected', button.dataset.preset === chosen);
    button.setAttribute('aria-pressed', String(button.dataset.preset === chosen));
    button.onclick = () => {
      const theme = appearanceThemes[button.dataset.preset];
      save('papel-wallpaper-id', '');
      applyWallpaper('');
      setWall(theme.wall);
      save('papel-wall', theme.wall);
      setGlassTone(theme.glass);
      save('papel-theme-preset', button.dataset.preset);
      w.querySelectorAll('[data-preset]').forEach((b) => {
        b.classList.toggle('preset-selected', b === button);
        b.setAttribute('aria-pressed', String(b === button));
      });
      toast('Tema ' + theme.name + ' aplicado.');
    };
  });
  w.querySelectorAll('[data-pref]').forEach((input) => {
    input.checked = read(input.dataset.pref, '0') === '1';
    input.onchange = () => {
      save(input.dataset.pref, input.checked ? '1' : '0');
      applyAppearanceOptions();
    };
  });
};
const appearanceMenu = document.createElement('button');
appearanceMenu.dataset.open = 'appearance';
appearanceMenu.innerHTML =
  '<span class="start-app-icon">' + svg('appearance') + '</span>Centro de personalización';
document.querySelector('#startapps').append(appearanceMenu);
