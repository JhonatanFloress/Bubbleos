// Local file cabinet and clock utilities. Files never leave this browser.
apps.clock = ['Reloj y temporizador', 430, 410];
icons.clock =
  aeroDefs +
  '<circle cx="24" cy="24" r="20" fill="url(#aero-white)" stroke="#5584a3"/><circle cx="24" cy="24" r="16" fill="white" stroke="#adc8dc"/><path d="M24 12v13l8 5" fill="none" stroke="#386780" stroke-width="3"/><circle cx="24" cy="24" r="2" fill="#e17048"/>';
let cabinetDB;
function db() {
  if (!cabinetDB)
    cabinetDB = new Promise((resolve, reject) => {
      const r = indexedDB.open('papel-cabinet', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'id' });
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  return cabinetDB;
}
async function cabinet(mode, fn) {
  let d = await db();
  return new Promise((resolve, reject) => {
    let t = d.transaction('files', mode),
      request = fn(t.objectStore('files'));
    let result;
    request.onsuccess = () => (result = request.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
function downloadBlob(blob, name) {
  let url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
const baseProductBody = body;
body = function (id) {
  if (id === 'clock')
    return '<div class="extra-pad clock-app"><div class="utility-tabs"><button data-clocktab="stopwatch" class="chosen">Cronómetro</button><button data-clocktab="timer">Temporizador</button></div><div id="stopwatchpane"><output id="stopwatchdisplay">00:00.00</output><div class="timer-buttons"><button class="primary" id="swstart">Iniciar</button><button class="primary" id="swlap">Vuelta</button><button class="primary" id="swreset">Reiniciar</button></div><div id="laps"></div></div><div id="timerpane" hidden><label>Minutos <input id="timerminutes" type="number" min="0" max="999" value="5"></label><label>Segundos <input id="timerseconds" type="number" min="0" max="59" value="0"></label><output id="timerdisplay">05:00</output><div class="timer-buttons"><button class="primary" id="timerstart">Iniciar</button><button class="primary" id="timerreset">Reiniciar</button></div><p id="timerstatus">El aviso funciona mientras el sitio está abierto.</p></div></div>';
  let html = baseProductBody(id);
  if (id === 'files')
    html =
      '<div class="utility-tabs"><button class="chosen" data-filetab="apps">Aplicaciones</button><button data-filetab="personal">Mis archivos</button></div><div id="appfiles">' +
      html +
      '</div><div id="personalfiles" hidden><div class="cabinet-bar"><button class="primary" id="importfiles">＋ Importar archivos</button><input type="file" id="filepicker" multiple hidden><small>Solo en este navegador · máximo 10 MB por archivo</small></div><div id="cabinetlist"></div><div id="filepreview"><p>Importa una imagen, texto, audio o PDF para previsualizarlo.</p></div></div>';
  return html;
};
const productSetup = setup;
setup = function (id, w) {
  productSetup(id, w);
  if (id === 'files') {
    const list = w.querySelector('#cabinetlist'),
      preview = w.querySelector('#filepreview');
    let currentFolder = null;
    let viewingTrash = false;
    let renderVersion = 0;
    const controls = document.createElement('div');
    controls.className = 'file-organizer';
    controls.innerHTML = `
      <div class="file-organizer-path">
        <button class="folder-up" aria-label="Subir carpeta">↑</button>
        <span class="folder-path">Mis archivos</span>
        <button class="file-trash-toggle">Papelera</button>
      </div>
      <input class="file-search" aria-label="Buscar archivos" placeholder="Buscar en esta carpeta…">
      <form class="new-folder-form">
        <input aria-label="Nombre de nueva carpeta" placeholder="Nombre de carpeta" maxlength="80" required>
        <button class="primary">＋ Crear carpeta</button>
      </form>
      <small class="file-organizer-count"></small>
    `;
    list.before(controls);
    controls.querySelector('.file-search').oninput = () => render();
    controls.querySelector('.file-trash-toggle').onclick = () => {
      viewingTrash = !viewingTrash;
      controls.querySelector('.file-search').value = '';
      cleanup();
      preview.replaceChildren();
      render();
    };
    controls.querySelector('.folder-up').onclick = async () => {
      if (viewingTrash) viewingTrash = false;
      else if (currentFolder) {
        const folder = await cabinet('readonly', (store) => store.get(currentFolder));
        currentFolder = folder?.parent || null;
      }
      controls.querySelector('.file-search').value = '';
      render();
    };
    controls.querySelector('form').onsubmit = async (event) => {
      event.preventDefault();
      const input = controls.querySelector('form input');
      const name = input.value.trim();
      if (!name) return;
      try {
        const files = await cabinet('readonly', (store) => store.getAll());
        if (
          files.some(
            (file) =>
              !file.deleted &&
              (file.parent || null) === currentFolder &&
              file.name.toLowerCase() === name.toLowerCase(),
          )
        ) {
          toast('Ya existe un archivo o carpeta con ese nombre.');
          return;
        }
        await cabinet('readwrite', (store) =>
          store.put({
            id: crypto.randomUUID(),
            name,
            kind: 'folder',
            parent: currentFolder,
            blob: new Blob([], { type: 'application/x-papel-folder' }),
          }),
        );
        input.value = '';
        await render();
        toast('Carpeta creada.');
      } catch {
        toast('No se pudo crear la carpeta.');
      }
    };
    let objectURL = null;
    const cleanup = () => {
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
        objectURL = null;
      }
    };
    extraCleanup.set(w, cleanup);
    w.querySelectorAll('[data-filetab]').forEach(
      (b) =>
        (b.onclick = () => {
          w.querySelector('#appfiles').hidden = b.dataset.filetab !== 'apps';
          w.querySelector('#personalfiles').hidden = b.dataset.filetab !== 'personal';
          w.querySelectorAll('[data-filetab]').forEach((x) =>
            x.classList.toggle('chosen', x === b),
          );
        }),
    );
    async function render() {
      try {
        const version = ++renderVersion;
        const allFiles = await cabinet('readonly', (s) => s.getAll());
        if (version !== renderVersion || !w.isConnected) return;
        if (currentFolder && !allFiles.some((file) => file.id === currentFolder && !file.deleted))
          currentFolder = null;
        const folder = allFiles.find((file) => file.id === currentFolder);
        controls.querySelector('.folder-path').textContent = viewingTrash
          ? 'Papelera de archivos'
          : folder
            ? 'Mis archivos / ' + folder.name
            : 'Mis archivos';
        controls.querySelector('.file-trash-toggle').textContent = viewingTrash
          ? 'Volver a archivos'
          : 'Papelera';
        controls.querySelector('.new-folder-form').hidden = viewingTrash;
        w.querySelector('#importfiles').disabled = viewingTrash;
        const query = controls.querySelector('.file-search').value.trim().toLowerCase();
        const files = allFiles
          .filter(
            (file) =>
              (viewingTrash
                ? file.deleted
                : !file.deleted && (file.parent || null) === currentFolder) &&
              file.name.toLowerCase().includes(query),
          )
          .sort(
            (a, b) =>
              (b.kind === 'folder') - (a.kind === 'folder') || a.name.localeCompare(b.name, 'es'),
          );
        controls.querySelector('.file-organizer-count').textContent =
          files.length + ' elementos' + (viewingTrash ? ' · recuperables' : '');
        list.replaceChildren();
        if (!files.length) {
          list.textContent = query
            ? 'No hay coincidencias.'
            : viewingTrash
              ? 'La papelera está vacía.'
              : 'Esta carpeta está vacía.';
          return;
        }
        files.forEach((file) => {
          const row = document.createElement('div');
          row.className = 'cabinet-row';
          const name = document.createElement('button');
          name.className = 'cabinet-name';
          name.textContent = file.name;
          name.title = file.name;
          const size = document.createElement('small');
          size.textContent =
            file.kind === 'folder' ? 'Carpeta' : (file.blob.size / 1024).toFixed(1) + ' KB';
          if (file.kind === 'folder') name.textContent = '▣ ' + file.name;
          const dl = document.createElement('button');
          dl.textContent = '↓';
          dl.setAttribute('aria-label', 'Descargar ' + file.name);
          dl.onclick = () => downloadBlob(file.blob, file.name);
          dl.hidden = file.kind === 'folder';
          const remove = document.createElement('button');
          remove.textContent = '×';
          remove.setAttribute(
            'aria-label',
            (viewingTrash ? 'Restaurar ' : 'Mover a papelera ') + file.name,
          );
          remove.textContent = viewingTrash ? '↶' : '×';
          remove.onclick = async () => {
            try {
              if (
                !viewingTrash &&
                file.kind === 'folder' &&
                allFiles.some((item) => !item.deleted && item.parent === file.id)
              ) {
                toast('Mueve primero los archivos de esta carpeta.');
                return;
              }
              const restoredParent = allFiles.some(
                (item) => item.id === file.parent && !item.deleted,
              )
                ? file.parent
                : null;
              let restoredName = file.name;
              let suffix = 1;
              while (
                viewingTrash &&
                allFiles.some(
                  (item) =>
                    item.id !== file.id &&
                    !item.deleted &&
                    (item.parent || null) === restoredParent &&
                    item.name.toLowerCase() === restoredName.toLowerCase(),
                )
              ) {
                restoredName = file.name + ' (recuperado ' + suffix++ + ')';
              }
              await cabinet('readwrite', (s) =>
                s.put({
                  ...file,
                  name: restoredName,
                  deleted: !viewingTrash,
                  parent: viewingTrash ? restoredParent : file.parent || null,
                }),
              );
              cleanup();
              preview.replaceChildren();
              render();
              toast(viewingTrash ? 'Elemento restaurado.' : 'Elemento movido a la papelera.');
            } catch {
              toast('No se pudo eliminar.');
            }
          };
          name.onclick = async () => {
            if (file.kind === 'folder') {
              if (viewingTrash) {
                toast('Restaura la carpeta para abrirla.');
                return;
              }
              currentFolder = file.id;
              controls.querySelector('.file-search').value = '';
              cleanup();
              preview.replaceChildren();
              render();
              return;
            }
            cleanup();
            preview.replaceChildren();
            const title = document.createElement('strong');
            title.textContent = file.name;
            preview.append(title);
            let type = file.blob.type;
            if (type.startsWith('image/') && !type.includes('svg')) {
              const img = document.createElement('img');
              objectURL = URL.createObjectURL(file.blob);
              img.src = objectURL;
              img.alt = file.name;
              preview.append(img);
            } else if (type.startsWith('audio/') || type.startsWith('video/')) {
              let media = document.createElement(type.startsWith('audio/') ? 'audio' : 'video');
              media.controls = true;
              objectURL = URL.createObjectURL(file.blob);
              media.src = objectURL;
              preview.append(media);
            } else if (type === 'application/pdf') {
              let frame = document.createElement('iframe');
              frame.title = 'Vista previa de ' + file.name;
              objectURL = URL.createObjectURL(file.blob);
              frame.src = objectURL;
              preview.append(frame);
            } else if (
              type.startsWith('text/') ||
              /\.(txt|md|csv|json|log|css|js)$/i.test(file.name)
            ) {
              let pre = document.createElement('pre');
              pre.textContent = (await file.blob.text()).slice(0, 150000);
              preview.append(pre);
            } else {
              const p = document.createElement('p');
              p.textContent = 'Vista previa no disponible. Puedes descargar este archivo.';
              preview.append(p);
            }
          };
          const actions = document.createElement('details');
          actions.className = 'cabinet-actions';
          const summary = document.createElement('summary');
          summary.textContent = '⋯';
          summary.setAttribute('aria-label', 'Opciones de ' + file.name);
          const form = document.createElement('form');
          const rename = document.createElement('input');
          rename.value = file.name;
          rename.required = true;
          rename.maxLength = 120;
          rename.setAttribute('aria-label', 'Nuevo nombre de ' + file.name);
          const submit = document.createElement('button');
          submit.textContent = 'Renombrar';
          form.append(rename, submit);
          form.onsubmit = async (event) => {
            event.preventDefault();
            const nextName = rename.value.trim();
            if (!nextName) return;
            if (
              allFiles.some(
                (other) =>
                  other.id !== file.id &&
                  !other.deleted &&
                  (other.parent || null) === (file.parent || null) &&
                  other.name.toLowerCase() === nextName.toLowerCase(),
              )
            ) {
              toast('Ya existe un elemento con ese nombre.');
              return;
            }
            try {
              await cabinet('readwrite', (store) => store.put({ ...file, name: nextName }));
              render();
              toast('Nombre actualizado.');
            } catch {
              toast('No se pudo renombrar.');
            }
          };
          actions.append(summary, form);
          if (file.kind !== 'folder') {
            const select = document.createElement('select');
            select.setAttribute('aria-label', 'Mover ' + file.name + ' a carpeta');
            const root = document.createElement('option');
            root.value = '';
            root.textContent = 'Mis archivos';
            select.append(root);
            allFiles
              .filter((item) => item.kind === 'folder' && !item.deleted)
              .forEach((folder) => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = folder.name;
                select.append(option);
              });
            select.value = file.parent || '';
            const move = document.createElement('button');
            move.type = 'button';
            move.textContent = 'Mover';
            move.onclick = async () => {
              const parent = select.value || null;
              if (
                allFiles.some(
                  (other) =>
                    other.id !== file.id &&
                    !other.deleted &&
                    (other.parent || null) === parent &&
                    other.name.toLowerCase() === file.name.toLowerCase(),
                )
              ) {
                toast('La carpeta destino ya tiene un archivo con ese nombre.');
                return;
              }
              try {
                await cabinet('readwrite', (store) => store.put({ ...file, parent }));
                render();
                toast('Archivo movido.');
              } catch {
                toast('No se pudo mover.');
              }
            };
            const moveRow = document.createElement('div');
            moveRow.append(select, move);
            actions.append(moveRow);
          }
          actions.hidden = viewingTrash;
          row.append(name, size, dl, actions, remove);
          list.append(row);
        });
      } catch {
        list.textContent = 'El almacenamiento de archivos no está disponible en este navegador.';
      }
    }
    w.querySelector('#importfiles').onclick = () => w.querySelector('#filepicker').click();
    w.querySelector('#filepicker').onchange = async (e) => {
      let count = 0;
      for (const file of e.target.files) {
        if (file.size > 10 * 1024 * 1024) {
          toast(file.name + ': supera 10 MB');
          continue;
        }
        try {
          await cabinet('readwrite', (s) =>
            s.put({ id: crypto.randomUUID(), name: file.name, blob: file, parent: currentFolder }),
          );
          count++;
        } catch {
          toast('No se pudo guardar ' + file.name + '; revisa el espacio disponible.');
        }
      }
      e.target.value = '';
      await render();
      if (count) toast(count + ' archivos importados.');
    };
    render();
  }
  if (id === 'clock') {
    let running = false,
      started = 0,
      elapsed = 0,
      lap = 0,
      timerRunning = false,
      remaining = 300000,
      deadline = 0;
    const display = w.querySelector('#stopwatchdisplay'),
      timerDisplay = w.querySelector('#timerdisplay');
    const format = (ms) => {
      ms = Math.max(0, ms);
      return (
        String(Math.floor(ms / 60000)).padStart(2, '0') +
        ':' +
        String(Math.floor(ms / 1000) % 60).padStart(2, '0')
      );
    };
    const value = () => elapsed + (running ? performance.now() - started : 0);
    function draw() {
      let ms = value();
      display.textContent = format(ms) + '.' + String(Math.floor(ms / 10) % 100).padStart(2, '0');
      let left = timerRunning ? Math.max(0, deadline - Date.now()) : remaining;
      timerDisplay.textContent = format(Math.ceil(left / 1000) * 1000);
      if (timerRunning && left <= 0) {
        timerRunning = false;
        remaining = 0;
        w.querySelector('#timerstart').textContent = 'Iniciar';
        w.querySelector('#timerstatus').textContent = '¡Tiempo cumplido!';
        toast('⏰ Tu temporizador terminó.');
        w.hidden = false;
        focus(w);
        try {
          let ctx = new AudioContext(),
            osc = ctx.createOscillator(),
            gain = ctx.createGain();
          osc.frequency.value = 880;
          gain.gain.value = 0.1;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.stop(ctx.currentTime + 0.9);
          osc.onended = () => ctx.close();
        } catch {}
      }
    }
    let interval = setInterval(draw, 35);
    extraCleanup.set(w, () => clearInterval(interval));
    w.querySelector('#swstart').onclick = () => {
      if (running) {
        elapsed = value();
        running = false;
      } else {
        started = performance.now();
        running = true;
      }
      w.querySelector('#swstart').textContent = running ? 'Pausar' : 'Continuar';
    };
    w.querySelector('#swreset').onclick = () => {
      running = false;
      elapsed = 0;
      lap = 0;
      w.querySelector('#laps').replaceChildren();
      w.querySelector('#swstart').textContent = 'Iniciar';
      draw();
    };
    w.querySelector('#swlap').onclick = () => {
      let p = document.createElement('p');
      p.textContent = 'Vuelta ' + ++lap + ' — ' + display.textContent;
      w.querySelector('#laps').prepend(p);
    };
    function fromInputs() {
      let m = Math.max(0, Math.min(999, Number(w.querySelector('#timerminutes').value) || 0)),
        s = Math.max(0, Math.min(59, Number(w.querySelector('#timerseconds').value) || 0));
      return (m * 60 + s) * 1000;
    }
    w.querySelector('#timerstart').onclick = () => {
      if (timerRunning) {
        remaining = Math.max(0, deadline - Date.now());
        timerRunning = false;
        w.querySelector('#timerstart').textContent = 'Continuar';
      } else {
        if (remaining <= 0) remaining = fromInputs();
        if (remaining <= 0) {
          toast('Elige una duración mayor a cero.');
          return;
        }
        deadline = Date.now() + remaining;
        timerRunning = true;
        w.querySelector('#timerstart').textContent = 'Pausar';
        w.querySelector('#timerstatus').textContent = 'Temporizador en marcha.';
      }
    };
    w.querySelector('#timerreset').onclick = () => {
      timerRunning = false;
      remaining = fromInputs();
      w.querySelector('#timerstart').textContent = 'Iniciar';
      w.querySelector('#timerstatus').textContent =
        'El aviso funciona mientras el sitio está abierto.';
      draw();
    };
    ['#timerminutes', '#timerseconds'].forEach(
      (s) =>
        (w.querySelector(s).oninput = () => {
          if (!timerRunning) {
            remaining = fromInputs();
            draw();
          }
        }),
    );
    w.querySelectorAll('[data-clocktab]').forEach(
      (b) =>
        (b.onclick = () => {
          w.querySelector('#stopwatchpane').hidden = b.dataset.clocktab !== 'stopwatch';
          w.querySelector('#timerpane').hidden = b.dataset.clocktab !== 'timer';
          w.querySelectorAll('[data-clocktab]').forEach((x) =>
            x.classList.toggle('chosen', x === b),
          );
        }),
    );
    draw();
  }
};
const clockShortcut = document.createElement('button');
clockShortcut.className = 'desktop-icon';
clockShortcut.dataset.open = 'clock';
clockShortcut.innerHTML = svg('clock') + '<span>Reloj</span>';
$('#icons').append(clockShortcut);
const clockMenu = document.createElement('button');
clockMenu.dataset.open = 'clock';
clockMenu.textContent = '↗   Reloj y temporizador';
$('#startapps').append(clockMenu);
