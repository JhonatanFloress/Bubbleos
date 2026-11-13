// Additional browser-local applications.
Object.assign(apps, {
  editor: ['Editor de documentos', 590, 460],
  budget: ['Mi presupuesto', 490, 460],
  snake: ['Snake.exe', 420, 465],
});
icons.editor = icons.notes;
icons.budget = icons.calc;
icons.snake = icons.game;
const moreBody = body;
body = function (id) {
  if (id === 'editor')
    return '<div class="editor-bar"><button id="newdoc">＋ Documento</button><button id="savedoc">↓ Descargar .txt</button><button id="deldoc">Eliminar pestaña</button></div><div id="doctabs"></div><input id="docname" aria-label="Nombre del documento" maxlength="80"><textarea id="doccontent" aria-label="Contenido del documento" spellcheck="true"></textarea><div id="docstats"></div>';
  if (id === 'budget')
    return '<div class="extra-pad"><h2>Mi presupuesto</h2><div class="budget-totals"><span>Balance<strong id="balance"></strong></span><span>Ingresos<strong id="income"></strong></span><span>Gastos<strong id="expenses"></strong></span></div><form id="budgetform"><input id="budgetdesc" aria-label="Concepto" placeholder="Concepto" maxlength="90" required><input id="budgetamount" aria-label="Cantidad" placeholder="Cantidad" type="number" min="0.01" step="0.01" max="999999999" required><select id="budgettype" aria-label="Tipo"><option value="expense">Gasto</option><option value="income">Ingreso</option></select><button class="primary">Añadir</button></form><button id="exportbudget" class="export-budget">↓ Exportar CSV</button><div id="budgetlist"></div><small>Registro personal en este navegador · importes en MXN.</small></div>';
  if (id === 'snake')
    return '<div class="snake-app"><div class="snake-top"><strong>Snake.exe</strong><span id="snakescore">Puntos: 0</span></div><canvas id="snakecanvas" width="320" height="320" aria-label="Tablero Snake"></canvas><div class="snake-bottom"><button class="primary" id="snakestart">Iniciar partida</button><button class="primary" id="snakepause">Pausar</button></div><p id="snakestatus">Flechas o WASD · Espacio para pausar.</p><div class="snake-arrows"><button data-direction="up" aria-label="Arriba">▲</button><button data-direction="left" aria-label="Izquierda">◀</button><button data-direction="down" aria-label="Abajo">▼</button><button data-direction="right" aria-label="Derecha">▶</button></div></div>';
  return moreBody(id);
};
const moreSetup = setup;
setup = function (id, w) {
  moreSetup(id, w);
  if (id === 'editor') {
    let docs;
    try {
      docs = JSON.parse(read('papel-documents', 'null'));
    } catch {}
    if (!Array.isArray(docs) || !docs.length)
      docs = [{ id: crypto.randomUUID(), name: 'Sin título', text: '' }];
    let selected = docs[0].id;
    const name = w.querySelector('#docname'),
      text = w.querySelector('#doccontent'),
      tabs = w.querySelector('#doctabs');
    const current = () => docs.find((d) => d.id === selected);
    function persist() {
      save('papel-documents', JSON.stringify(docs));
    }
    function stats() {
      const val = text.value;
      w.querySelector('#docstats').textContent =
        (val.trim() ? val.trim().split(/\s+/).length : 0) +
        ' palabras · ' +
        val.length +
        ' caracteres · Guardado local';
    }
    function render() {
      tabs.replaceChildren();
      docs.forEach((doc) => {
        let b = document.createElement('button');
        b.textContent = doc.name || 'Sin título';
        b.className = doc.id === selected ? 'selected' : '';
        b.onclick = () => {
          selected = doc.id;
          render();
        };
        tabs.append(b);
      });
      name.value = current().name;
      text.value = current().text;
      stats();
    }
    name.oninput = () => {
      current().name = name.value;
      persist();
      const active = tabs.querySelector('.selected');
      if (active) active.textContent = name.value || 'Sin título';
    };
    text.oninput = () => {
      current().text = text.value;
      persist();
      stats();
    };
    w.querySelector('#newdoc').onclick = () => {
      const doc = { id: crypto.randomUUID(), name: 'Documento ' + (docs.length + 1), text: '' };
      docs.push(doc);
      selected = doc.id;
      persist();
      render();
      text.focus();
    };
    w.querySelector('#savedoc').onclick = () =>
      downloadBlob(
        new Blob([current().text], { type: 'text/plain;charset=utf-8' }),
        (current().name.replace(/[\\/:*?"<>|]/g, '_') || 'documento') + '.txt',
      );
    w.querySelector('#deldoc').onclick = () => {
      const removed = current();
      docs = docs.filter((d) => d.id !== selected);
      if (!docs.length) docs.push({ id: crypto.randomUUID(), name: 'Sin título', text: '' });
      selected = docs[0].id;
      persist();
      render();
      const undo = document.createElement('button');
      undo.className = 'doc-undo';
      undo.textContent = 'Restaurar «' + (removed.name || 'Sin título') + '»';
      undo.onclick = () => {
        docs.push(removed);
        selected = removed.id;
        persist();
        render();
        undo.remove();
      };
      w.querySelector('.editor-bar').append(undo);
    };
    render();
  }
  if (id === 'budget') {
    let entries;
    try {
      entries = JSON.parse(read('papel-budget', '[]'));
    } catch {
      entries = [];
    }
    const fmt = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    function render() {
      let income = 0,
        expenses = 0,
        list = w.querySelector('#budgetlist');
      list.replaceChildren();
      entries.forEach((item, index) => {
        if (item.type === 'income') income += item.amount;
        else expenses += item.amount;
        let row = document.createElement('div');
        row.className = 'budget-row';
        let label = document.createElement('span');
        label.textContent = item.description;
        let value = document.createElement('strong');
        value.textContent = (item.type === 'income' ? '+' : '−') + fmt(item.amount);
        value.className = item.type;
        let remove = document.createElement('button');
        remove.textContent = '×';
        remove.setAttribute('aria-label', 'Eliminar movimiento ' + item.description);
        remove.onclick = () => {
          entries.splice(index, 1);
          save('papel-budget', JSON.stringify(entries));
          render();
        };
        row.append(label, value, remove);
        list.append(row);
      });
      w.querySelector('#balance').textContent = fmt(income - expenses);
      w.querySelector('#income').textContent = fmt(income);
      w.querySelector('#expenses').textContent = fmt(expenses);
    }
    w.querySelector('#budgetform').onsubmit = (e) => {
      e.preventDefault();
      let description = w.querySelector('#budgetdesc'),
        amount = w.querySelector('#budgetamount'),
        type = w.querySelector('#budgettype');
      const value = Number(amount.value);
      if (!description.value.trim() || !Number.isFinite(value) || value <= 0 || value > 999999999)
        return;
      entries.unshift({
        description: description.value.trim(),
        amount: value,
        type: type.value,
        date: new Date().toISOString(),
      });
      save('papel-budget', JSON.stringify(entries));
      description.value = '';
      amount.value = '';
      render();
    };
    w.querySelector('#exportbudget').onclick = () => {
      const cell = (v) =>
        '"' +
        String(v)
          .replace(/^[=+@\-\t\r]/, "'$&")
          .replaceAll('"', '""') +
        '"';
      let csv =
        'Fecha,Concepto,Tipo,Cantidad\r\n' +
        entries
          .map((e) =>
            [e.date, e.description, e.type === 'income' ? 'Ingreso' : 'Gasto', e.amount]
              .map(cell)
              .join(','),
          )
          .join('\r\n');
      downloadBlob(
        new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }),
        'presupuesto.csv',
      );
    };
    render();
  }
  if (id === 'snake') {
    const c = w.querySelector('#snakecanvas'),
      ctx = c.getContext('2d'),
      status = w.querySelector('#snakestatus');
    let snake = [{ x: 9, y: 10 }],
      direction = { x: 1, y: 0 },
      queued = null,
      food = { x: 14, y: 10 },
      running = false,
      paused = false,
      score = 0;
    const dirs = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    function spawn() {
      let free = [];
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++)
          if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      if (!free.length) {
        running = false;
        status.textContent = '¡Tablero completo! Ganaste.';
        return;
      }
      food = free[Math.floor(Math.random() * free.length)];
    }
    function draw() {
      ctx.fillStyle = '#e5eed7';
      ctx.fillRect(0, 0, 320, 320);
      ctx.strokeStyle = '#d3dec8';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 16, 0);
        ctx.lineTo(i * 16, 320);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 16);
        ctx.lineTo(320, i * 16);
        ctx.stroke();
      }
      ctx.fillStyle = '#d66042';
      ctx.beginPath();
      ctx.arc(food.x * 16 + 8, food.y * 16 + 8, 6, 0, Math.PI * 2);
      ctx.fill();
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#245142' : '#4f8b5c';
        ctx.fillRect(s.x * 16 + 1, s.y * 16 + 1, 14, 14);
      });
      if (paused) {
        ctx.fillStyle = '#e5eed7cc';
        ctx.fillRect(0, 125, 320, 65);
        ctx.fillStyle = '#245142';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', 160, 165);
      }
    }
    function turn(dir) {
      if (!running || paused || queued) return;
      const d = dirs[dir];
      if (d.x !== -direction.x || d.y !== -direction.y) queued = d;
    }
    function start() {
      snake = [
        { x: 6, y: 10 },
        { x: 5, y: 10 },
        { x: 4, y: 10 },
      ];
      direction = { x: 1, y: 0 };
      queued = null;
      score = 0;
      running = true;
      paused = false;
      spawn();
      w.querySelector('#snakescore').textContent = 'Puntos: 0';
      w.querySelector('#snakepause').textContent = 'Pausar';
      status.textContent = '¡A comer píxeles!';
      draw();
    }
    function pause() {
      if (!running) return;
      paused = !paused;
      w.querySelector('#snakepause').textContent = paused ? 'Continuar' : 'Pausar';
      draw();
    }
    let interval = setInterval(() => {
      if (!running || paused || w.hidden || !w.classList.contains('active')) return;
      if (queued) {
        direction = queued;
        queued = null;
      }
      let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
      const eating = head.x === food.x && head.y === food.y;
      const body = eating ? snake : snake.slice(0, -1);
      if (
        head.x < 0 ||
        head.x >= 20 ||
        head.y < 0 ||
        head.y >= 20 ||
        body.some((s) => s.x === head.x && s.y === head.y)
      ) {
        running = false;
        status.textContent = 'Fin de partida · ' + score + ' puntos. ¡Inténtalo otra vez!';
        w.querySelector('#snakestart').textContent = 'Volver a jugar';
        return;
      }
      snake.unshift(head);
      if (eating) {
        score += 10;
        w.querySelector('#snakescore').textContent = 'Puntos: ' + score;
        spawn();
      } else snake.pop();
      draw();
    }, 130);
    function key(e) {
      if (w.hidden || !w.classList.contains('active') || e.target.matches('input,textarea')) return;
      let map = {
        ArrowUp: 'up',
        w: 'up',
        ArrowDown: 'down',
        s: 'down',
        ArrowLeft: 'left',
        a: 'left',
        ArrowRight: 'right',
        d: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        turn(map[e.key]);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        pause();
      }
    }
    document.addEventListener('keydown', key);
    extraCleanup.set(w, () => {
      clearInterval(interval);
      document.removeEventListener('keydown', key);
    });
    w.querySelectorAll('[data-direction]').forEach(
      (b) => (b.onclick = () => turn(b.dataset.direction)),
    );
    w.querySelector('#snakestart').onclick = start;
    w.querySelector('#snakepause').onclick = pause;
    draw();
  }
};
['editor', 'budget', 'snake'].forEach((id) => {
  const shortcut = document.createElement('button');
  shortcut.className = 'desktop-icon';
  shortcut.dataset.open = id;
  shortcut.innerHTML = svg(id) + `<span>${apps[id][0]}</span>`;
  $('#icons').append(shortcut);
  const item = document.createElement('button');
  item.dataset.open = id;
  item.textContent = '↗   ' + apps[id][0];
  $('#startapps').append(item);
});
