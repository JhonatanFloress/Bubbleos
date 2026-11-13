Object.assign(apps, {
  manager: ['Administrador de ventanas', 490, 420],
  focus: ['Concentración', 420, 420],
});
icons.manager = icons.terminal;
icons.focus = icons.clock;
const workspaceBody = body;
body = function (id) {
  if (id === 'manager')
    return '<div class="extra-pad"><h2>Tu espacio en marcha</h2><p class="manager-summary"></p><div class="manager-actions"><button class="primary" id="minimizeall">Minimizar todo</button><button class="primary" id="restoreall">Restaurar todo</button></div><div id="runningapps"></div><small>Gestiona las ventanas de este escritorio web.</small></div>';
  if (id === 'focus')
    return '<div class="extra-pad focus-app"><span class="focus-kicker">UNA COSA A LA VEZ</span><h2>Encuentra tu ritmo.</h2><div class="utility-tabs"><button data-focusmode="work" class="chosen">Trabajo</button><button data-focusmode="break">Descanso</button></div><output id="focustime">25:00</output><p id="focusstatus">Un espacio para empezar.</p><div class="timer-buttons"><button class="primary" id="focusstart">Comenzar</button><button class="primary" id="focusreset">Reiniciar</button></div><div class="focus-config"><label>Trabajo (min)<input id="workminutes" type="number" min="1" max="180" value="25"></label><label>Descanso (min)<input id="breakminutes" type="number" min="1" max="60" value="5"></label></div><p id="focuscount"></p><small>La cuenta continúa al minimizar. Mantén abierta esta ventana y el sitio.</small></div>';
  return workspaceBody(id);
};
const workspaceSetup = setup;
setup = function (id, w) {
  workspaceSetup(id, w);
  if (id === 'manager') {
    function render() {
      const list = w.querySelector('#runningapps');
      list.replaceChildren();
      w.querySelector('.manager-summary').textContent =
        opened.size +
        ' apps abiertas · ' +
        [...opened.values()].filter((x) => !x.hidden).length +
        ' visibles';
      for (const [app, win] of opened) {
        let row = document.createElement('div');
        row.className = 'running-row';
        let icon = document.createElement('span');
        icon.innerHTML = svg(app);
        let label = document.createElement('span');
        label.textContent = apps[app][0];
        let state = document.createElement('small');
        state.textContent = win.hidden ? 'Minimizada' : 'Abierta';
        let show = document.createElement('button');
        show.textContent = 'Ver';
        show.onclick = () => openApp(app);
        let close = document.createElement('button');
        close.textContent = 'Cerrar';
        close.disabled = app === 'manager';
        close.onclick = () => {
          win.querySelector('[data-action="close"]').click();
        };
        row.append(icon, label, state, show, close);
        list.append(row);
      }
    }
    w.querySelector('#minimizeall').onclick = () => {
      opened.forEach((win, app) => {
        if (app !== 'manager') win.hidden = true;
      });
      tasks();
      render();
    };
    w.querySelector('#restoreall').onclick = () => {
      opened.forEach((win) => (win.hidden = false));
      tasks();
      render();
    };
    let observer = new MutationObserver((records) => {
      if (
        records.some(
          (r) => r.target === document.querySelector('#windows') || r.type === 'attributes',
        )
      )
        render();
    });
    observer.observe($('#windows'), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden'],
    });
    extraCleanup.set(w, () => observer.disconnect());
    render();
  }
  if (id === 'focus') {
    let mode = 'work',
      remaining = 25 * 60000,
      running = false,
      deadline = 0,
      completed = Number(read('papel-focus-sessions', '0')) || 0;
    const out = w.querySelector('#focustime'),
      status = w.querySelector('#focusstatus');
    function duration() {
      const input = w.querySelector(mode === 'work' ? '#workminutes' : '#breakminutes');
      return Math.max(1, Math.min(mode === 'work' ? 180 : 60, Number(input.value) || 1)) * 60000;
    }
    function count() {
      w.querySelector('#focuscount').textContent = completed + ' sesiones de trabajo completadas';
    }
    function draw() {
      let ms = running ? Math.max(0, deadline - Date.now()) : remaining;
      let seconds = Math.ceil(ms / 1000);
      out.textContent =
        String(Math.floor(seconds / 60)).padStart(2, '0') +
        ':' +
        String(seconds % 60).padStart(2, '0');
      if (running && ms <= 0) {
        running = false;
        remaining = 0;
        w.querySelector('#focusstart').textContent = 'Comenzar';
        if (mode === 'work') {
          completed++;
          save('papel-focus-sessions', String(completed));
          count();
        }
        status.textContent =
          mode === 'work'
            ? 'Sesión completa. Te mereces un descanso.'
            : 'Descanso completo. ¿Una nueva sesión?';
        toast(status.textContent);
        w.hidden = false;
        focus(w);
        if (mode === 'work') confetti();
      }
    }
    function reset() {
      running = false;
      remaining = duration();
      w.querySelector('#focusstart').textContent = 'Comenzar';
      status.textContent =
        mode === 'work' ? 'Un espacio para empezar.' : 'Respira. Suelta los hombros.';
      draw();
    }
    w.querySelectorAll('[data-focusmode]').forEach(
      (b) =>
        (b.onclick = () => {
          mode = b.dataset.focusmode;
          w.querySelectorAll('[data-focusmode]').forEach((x) =>
            x.classList.toggle('chosen', x === b),
          );
          reset();
        }),
    );
    w.querySelector('#focusstart').onclick = () => {
      if (running) {
        remaining = Math.max(0, deadline - Date.now());
        running = false;
        w.querySelector('#focusstart').textContent = 'Continuar';
        status.textContent = 'En pausa. A tu ritmo.';
      } else {
        if (remaining <= 0) remaining = duration();
        deadline = Date.now() + remaining;
        running = true;
        w.querySelector('#focusstart').textContent = 'Pausar';
        status.textContent =
          mode === 'work' ? 'Ahora, solo lo que importa.' : 'Un pequeño descanso también cuenta.';
      }
    };
    w.querySelector('#focusreset').onclick = reset;
    w.querySelectorAll('.focus-config input').forEach(
      (el) =>
        (el.onchange = () => {
          if (!running) reset();
        }),
    );
    let timer = setInterval(draw, 250);
    extraCleanup.set(w, () => clearInterval(timer));
    count();
    draw();
  }
};
['manager', 'focus'].forEach((id) => {
  const item = document.createElement('button');
  item.dataset.open = id;
  item.innerHTML = `<span class="start-app-icon">${svg(id)}</span>${apps[id][0]}`;
  $('#startapps').append(item);
});
const palette = document.createElement('div');
palette.id = 'command-palette';
palette.hidden = true;
palette.innerHTML =
  '<div class="command-panel" role="dialog" aria-modal="true" aria-label="Buscador rápido"><div class="command-search">⌕ <input id="commandinput" placeholder="¿Qué quieres abrir?" aria-label="Buscar app"><button id="closecommand" aria-label="Cerrar buscador">Esc</button></div><div id="commandresults"></div><div class="command-footer">↑ ↓ para elegir &nbsp; ↵ para abrir <span>CTRL / ⌘ + K</span></div></div>';
document.body.append(palette);
let commandIndex = 0,
  previousFocus = null;
const commandInput = palette.querySelector('input'),
  results = palette.querySelector('#commandresults');
function commandRender() {
  const query = commandInput.value.trim().toLocaleLowerCase('es');
  const matches = Object.keys(apps).filter((id) =>
    apps[id][0].toLocaleLowerCase('es').includes(query),
  );
  commandIndex = Math.max(0, Math.min(commandIndex, matches.length - 1));
  results.replaceChildren();
  if (!matches.length) {
    let p = document.createElement('p');
    p.textContent = 'No hay apps con ese nombre.';
    results.append(p);
  }
  matches.forEach((id, i) => {
    let b = document.createElement('button');
    b.dataset.command = id;
    b.className = i === commandIndex ? 'command-selected' : '';
    b.innerHTML = svg(id);
    let label = document.createElement('span');
    label.textContent = apps[id][0];
    b.append(label);
    b.onclick = () => {
      closeCommand();
      openApp(id);
    };
    results.append(b);
  });
  results.querySelector('.command-selected')?.scrollIntoView({ block: 'nearest' });
}
function closeCommand() {
  palette.hidden = true;
  previousFocus?.focus?.();
}
function showCommand() {
  previousFocus = document.activeElement;
  palette.hidden = false;
  commandInput.value = '';
  commandIndex = 0;
  commandRender();
  commandInput.focus();
}
commandInput.oninput = () => {
  commandIndex = 0;
  commandRender();
};
palette.querySelector('#closecommand').onclick = closeCommand;
palette.onclick = (e) => {
  if (e.target === palette) closeCommand();
};
document.addEventListener(
  'keydown',
  (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? showCommand() : closeCommand();
      return;
    }
    if (palette.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCommand();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      commandIndex += e.key === 'ArrowDown' ? 1 : -1;
      commandRender();
    }
    if (e.key === 'Enter' && e.target === commandInput) {
      e.preventDefault();
      results.querySelector('.command-selected')?.click();
    }
    if (e.key === 'Tab') {
      const targets = [
        commandInput,
        palette.querySelector('#closecommand'),
        ...results.querySelectorAll('button'),
      ];
      let index = targets.indexOf(document.activeElement);
      e.preventDefault();
      targets[(index + (e.shiftKey ? -1 : 1) + targets.length) % targets.length]?.focus();
    }
  },
  true,
);
const searchButton = document.createElement('button');
searchButton.id = 'quickcommand';
searchButton.textContent = '⌕ Buscar';
searchButton.title = 'Abrir buscador rápido · Ctrl + K';
searchButton.onclick = showCommand;
$('#showdesktop').before(searchButton);
