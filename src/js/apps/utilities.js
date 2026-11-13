// PAPEL OS 2 — apps y controles adicionales, sin dependencias.
Object.assign(apps, {
  calendar: ['Calendario', 410, 420],
  music: ['Media Player', 420, 370],
  todos: ['Mis pendientes', 420, 400],
  game: ['Memorama', 440, 450],
});
Object.assign(icons, {
  calendar:
    '<rect x="5" y="8" width="38" height="35"/><path d="M5 18h38M15 3v10M33 3v10M13 25h5M23 25h5M33 25h4M13 33h5M23 33h5"/>',
  music:
    '<path d="M18 35V10l23-6v26M18 17l23-6"/><ellipse cx="11" cy="36" rx="7" ry="5"/><ellipse cx="34" cy="31" rx="7" ry="5"/>',
  todos: icons.notes,
  game: '<rect x="5" y="8" width="38" height="32" rx="8"/><path d="M11 24h12M17 18v12M31 20h3M35 28h3"/>',
});
let extraCleanup = new Map();
const oldBody = body;
body = function (id) {
  if (id === 'calendar')
    return '<div class="extra-pad"><div class="calendar-head"><button id="prevmonth">◀</button><h2 id="monthlabel"></h2><button id="nextmonth">▶</button></div><div id="calendargrid"></div><p id="selectedday">Selecciona un día.</p><textarea id="daynote" placeholder="Una nota para este día…" aria-label="Nota del día"></textarea><small>Se guarda automáticamente en este navegador.</small></div>';
  if (id === 'todos')
    return '<div class="extra-pad"><h2>Una cosa a la vez.</h2><form id="todoform"><input id="todoinput" placeholder="¿Qué quieres hacer?" aria-label="Nuevo pendiente" maxlength="180" required><button class="primary">Añadir</button></form><div id="todolist"></div><p id="todocount"></p></div>';
  if (id === 'music')
    return (
      '<div class="player"><div class="album"><span>♫</span><small>PAPEL / SOUND LAB</small></div><h2 id="trackname">Cielo azul</h2><p>Melodías sintetizadas · Sin archivos externos</p><div class="visualizer">' +
      Array.from({ length: 18 }, (_, i) => `<i style="--delay:${i * 0.08}s"></i>`).join('') +
      '</div><div class="player-controls"><button id="prevtrack" aria-label="Pista anterior">◀◀</button><button id="playtrack">▶ Reproducir</button><button id="nexttrack" aria-label="Siguiente pista">▶▶</button></div><label>Volumen <input id="volume" type="range" min="0" max="0.3" step="0.01" value="0.12"></label></div>'
    );
  if (id === 'game')
    return '<div class="extra-pad"><div class="gamehead"><h2>Memorama.exe</h2><button class="primary" id="newgame">Reiniciar</button></div><p id="gamescore">Encuentra las ocho parejas.</p><div id="cards"></div></div>';
  return oldBody(id);
};
const oldSetup = setup;
setup = function (id, w) {
  oldSetup(id, w);
  if (id === 'todos') {
    let items;
    try {
      items = JSON.parse(read('papel-todos', '[]'));
    } catch {
      items = [];
    }
    const list = w.querySelector('#todolist');
    function render() {
      list.replaceChildren();
      items.forEach((item, i) => {
        let row = document.createElement('div');
        row.className = 'todo-row';
        let check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = item.done;
        check.setAttribute('aria-label', 'Completar ' + item.text);
        let text = document.createElement('span');
        text.textContent = item.text;
        text.className = item.done ? 'complete' : '';
        let remove = document.createElement('button');
        remove.textContent = '×';
        remove.setAttribute('aria-label', 'Eliminar ' + item.text);
        check.onchange = () => {
          item.done = check.checked;
          persist();
        };
        remove.onclick = () => {
          items.splice(i, 1);
          persist();
        };
        row.append(check, text, remove);
        list.append(row);
      });
      w.querySelector('#todocount').textContent =
        items.filter((x) => !x.done).length + ' pendientes · Todo a tu ritmo.';
    }
    function persist() {
      save('papel-todos', JSON.stringify(items));
      render();
    }
    w.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      let input = w.querySelector('#todoinput');
      if (input.value.trim()) {
        items.push({ text: input.value.trim(), done: false });
        input.value = '';
        persist();
      }
    };
    render();
  }
  if (id === 'calendar') {
    let current = new Date(),
      selected = new Date();
    const key = () =>
      `papel-day-${selected.getFullYear()}-${selected.getMonth() + 1}-${selected.getDate()}`;
    const note = w.querySelector('#daynote');
    function select() {
      w.querySelector('#selectedday').textContent = selected.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      note.value = read(key(), '');
    }
    function render() {
      w.querySelector('#monthlabel').textContent = current.toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric',
      });
      let grid = w.querySelector('#calendargrid');
      grid.replaceChildren();
      ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((s) => {
        let el = document.createElement('b');
        el.textContent = s;
        grid.append(el);
      });
      let start = (new Date(current.getFullYear(), current.getMonth(), 1).getDay() + 6) % 7;
      for (let i = 0; i < start; i++) grid.append(document.createElement('span'));
      let end = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= end; day++) {
        let b = document.createElement('button');
        b.textContent = day;
        let d = new Date(current.getFullYear(), current.getMonth(), day);
        if (d.toDateString() === new Date().toDateString()) b.classList.add('today');
        if (d.toDateString() === selected.toDateString()) b.classList.add('selected');
        b.onclick = () => {
          selected = d;
          select();
          render();
        };
        grid.append(b);
      }
    }
    w.querySelector('#prevmonth').onclick = () => {
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      render();
    };
    w.querySelector('#nextmonth').onclick = () => {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      render();
    };
    note.oninput = () => save(key(), note.value);
    select();
    render();
  }
  if (id === 'game') {
    let symbols = ['☀', '☁', '★', '♥', '♫', '✿', '☂', '☾'],
      first = null,
      locked = false,
      moves = 0,
      matched = 0,
      round = 0;
    const cards = w.querySelector('#cards');
    function start() {
      round++;
      cards.replaceChildren();
      first = null;
      locked = false;
      moves = matched = 0;
      w.querySelector('#gamescore').textContent = 'Encuentra las ocho parejas.';
      const deck = [...symbols, ...symbols];
      for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      deck.forEach((symbol) => {
        let b = document.createElement('button');
        b.className = 'card';
        b.textContent = '?';
        b.setAttribute('aria-label', 'Carta oculta');
        b.onclick = () => {
          if (locked || b.dataset.open) return;
          b.dataset.open = '1';
          b.textContent = symbol;
          b.setAttribute('aria-label', 'Carta ' + symbol);
          if (!first) {
            first = { b, symbol };
            return;
          }
          moves++;
          let a = first;
          first = null;
          if (a.symbol === symbol) {
            matched++;
            b.classList.add('matched');
            a.b.classList.add('matched');
            w.querySelector('#gamescore').textContent =
              matched === 8
                ? `¡Lo lograste! ${moves} movimientos. ✨`
                : `${matched}/8 parejas · ${moves} movimientos`;
            if (matched === 8) confetti();
          } else {
            locked = true;
            let r = round;
            setTimeout(() => {
              if (r !== round) return;
              [a.b, b].forEach((x) => {
                delete x.dataset.open;
                x.textContent = '?';
                x.setAttribute('aria-label', 'Carta oculta');
              });
              locked = false;
            }, 750);
          }
        };
        cards.append(b);
      });
    }
    w.querySelector('#newgame').onclick = start;
    start();
  }
  if (id === 'music') {
    let ctx = null,
      timer = null,
      playing = false,
      index = 0,
      step = 0,
      gain = null;
    const tracks = [
      { name: 'Cielo azul', notes: [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66] },
      {
        name: 'Paseo por píxeles',
        notes: [293.66, 369.99, 440, 587.33, 493.88, 440, 369.99, 329.63],
      },
      {
        name: 'Después de la lluvia',
        notes: [220, 261.63, 329.63, 440, 392, 329.63, 261.63, 246.94],
      },
    ];
    function stop() {
      playing = false;
      clearInterval(timer);
      w.querySelector('#playtrack').textContent = '▶ Reproducir';
      w.querySelector('.player').classList.remove('playing');
      if (ctx) {
        ctx.close();
        ctx = null;
      }
    }
    function play() {
      if (playing) {
        stop();
        return;
      }
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        gain = ctx.createGain();
        gain.gain.value = Number(w.querySelector('#volume').value);
        gain.connect(ctx.destination);
        ctx.resume();
        playing = true;
        w.querySelector('#playtrack').textContent = 'Ⅱ Pausar';
        w.querySelector('.player').classList.add('playing');
        function note() {
          if (!ctx || !playing) return;
          let osc = ctx.createOscillator(),
            envelope = ctx.createGain(),
            t = ctx.currentTime;
          osc.type = 'sine';
          osc.frequency.value = tracks[index].notes[step++ % 8];
          envelope.gain.setValueAtTime(0, t);
          envelope.gain.linearRampToValueAtTime(0.5, t + 0.03);
          envelope.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          osc.connect(envelope);
          envelope.connect(gain);
          osc.start(t);
          osc.stop(t + 0.75);
        }
        note();
        timer = setInterval(note, 400);
      } catch {
        toast('Este navegador no permite reproducir audio.');
      }
    }
    w.querySelector('#playtrack').onclick = play;
    function change(dir) {
      const was = playing;
      stop();
      index = (index + dir + 3) % 3;
      step = 0;
      w.querySelector('#trackname').textContent = tracks[index].name;
      if (was) play();
    }
    w.querySelector('#prevtrack').onclick = () => change(-1);
    w.querySelector('#nexttrack').onclick = () => change(1);
    w.querySelector('#volume').oninput = (e) => {
      if (gain) gain.gain.value = Number(e.target.value);
    };
    extraCleanup.set(w, stop);
  }
  if (id === 'settings') {
    const box = document.createElement('div');
    box.className = 'extra-pad';
    box.innerHTML =
      '<h3>Ambiente del escritorio</h3><div class="wall-choices"><button data-wall="classic">☀ Pradera</button><button data-wall="night">☾ Noche</button><button data-wall="sunset">◒ Atardecer</button></div><p>Atajos: Alt + N notas · Alt + F archivos · Alt + Espacio buscar</p>';
    w.querySelector('.content').append(box);
  }
};
const originalOpen = openApp;
openApp = function (id) {
  originalOpen(id);
  const w = opened.get(id);
  if (!w.dataset.enhanced) {
    w.dataset.enhanced = '1';
    let handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.title = 'Cambiar tamaño';
    w.append(handle);
    handle.onpointerdown = (e) => {
      e.preventDefault();
      if (w.classList.contains('maximized')) return;
      let x = e.clientX,
        y = e.clientY,
        width = w.offsetWidth,
        height = w.offsetHeight;
      handle.setPointerCapture(e.pointerId);
      handle.onpointermove = (p) => {
        w.style.width =
          Math.max(285, Math.min(innerWidth - w.offsetLeft - 8, width + p.clientX - x)) + 'px';
        w.style.height =
          Math.max(220, Math.min(innerHeight - w.offsetTop - 100, height + p.clientY - y)) + 'px';
      };
      handle.onpointerup = () => (handle.onpointermove = null);
    };
  }
};
const menu = $('#startapps');
menu.innerHTML = Object.keys(apps)
  .map((id) => `<button data-open="${id}">↗ &nbsp; ${apps[id][0]}</button>`)
  .join('');
const search = document.createElement('input');
search.id = 'appsearch';
search.placeholder = 'Buscar una aplicación…';
search.setAttribute('aria-label', 'Buscar aplicaciones');
menu.before(search);
search.oninput = () =>
  menu
    .querySelectorAll('button')
    .forEach((b) => (b.hidden = !b.textContent.toLowerCase().includes(search.value.toLowerCase())));
['music', 'calendar', 'game', 'todos'].forEach((id) => {
  let b = document.createElement('button');
  b.className = 'desktop-icon';
  b.dataset.open = id;
  b.innerHTML = svg(id) + `<span>${apps[id][0]}</span>`;
  $('#icons').append(b);
});
const oldRefresh = refresh;
refresh = function (id) {
  oldRefresh(id);
};
const observer = new MutationObserver((records) => {
  for (const record of records)
    for (const node of record.removedNodes)
      if (extraCleanup.has(node)) {
        extraCleanup.get(node)();
        extraCleanup.delete(node);
      }
});
observer.observe($('#windows'), { childList: true });
let context = document.createElement('div');
context.id = 'desktop-context';
context.hidden = true;
context.innerHTML =
  '<button data-open="files">▣ Abrir explorador</button><button data-open="notes">▤ Nueva nota</button><button data-open="settings">⚙ Personalizar escritorio</button><button id="orbit-context">✧ Activar modo orbital</button><button id="refresh-desktop">↻ Actualizar escritorio</button>';
document.body.append(context);
$('#desktop').addEventListener('contextmenu', (e) => {
  if (e.target.closest('.window,header,footer,#start')) return;
  e.preventDefault();
  context.hidden = false;
  context.style.left = Math.min(e.clientX, innerWidth - 240) + 'px';
  context.style.top = Math.min(e.clientY, innerHeight - 200) + 'px';
});
document.addEventListener('click', (e) => {
  if (e.target.id === 'orbit-context') {
    document.body.classList.toggle('chaos');
    toast('Modo orbital alternado ✧');
  }
  if (e.target.id === 'refresh-desktop') {
    document.querySelectorAll('.desktop-icon').forEach((x) => {
      x.animate(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 500 },
      );
    });
    toast('Escritorio actualizado.');
  }
  const wall = e.target.closest('[data-wall]');
  if (wall) {
    setWall(wall.dataset.wall);
    save('papel-wall', wall.dataset.wall);
  }
  if (!e.target.closest('#desktop-context') || e.target.closest('button')) context.hidden = true;
});
function setWall(name) {
  $('#desktop').dataset.wall = name;
}
setWall(read('papel-wall', 'classic'));
document.addEventListener('keydown', (e) => {
  if (e.altKey && ['n', 'f', ' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
    if (e.key === ' ') {
      $('#start').hidden = false;
      search.focus();
    } else openApp(e.key.toLowerCase() === 'n' ? 'notes' : 'files');
  }
  if (e.key === 'Escape') context.hidden = true;
});
function confetti() {
  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('reduced')
  )
    return;
  for (let i = 0; i < 50; i++) {
    let p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = ['#78c4ff', '#ffcd63', '#f598bb', '#adf58c'][i % 4];
    p.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.append(p);
    setTimeout(() => p.remove(), 2400);
  }
}
const oldFilesBody = body;
body = function (id) {
  let content = oldFilesBody(id);
  if (id === 'files') {
    content = content.replace('</div><div class="file-grid">', '</div><div class="file-grid">');
    content = content.replace('</div>', '</div>');
    const extra = ['music', 'calendar', 'game', 'todos']
      .map(
        (a) =>
          `<button class="file-item" data-open="${a}">${svg(a)}<span>${apps[a][0]}</span><small>APLICACIÓN</small></button>`,
      )
      .join('');
    let pos = content.lastIndexOf('</div>');
    content = content.slice(0, pos) + extra + content.slice(pos);
  }
  return content;
};
