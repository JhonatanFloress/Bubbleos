// A simple terminal: startup cat, output and one command line.
const simpleBody = body;
body = function (id) {
  if (id !== 'terminal') return simpleBody(id);
  return '<div class="simple-terminal"><pre class="simple-cat"></pre><div class="simple-output" role="log" aria-label="Salida de terminal"></div><form><label><span>papel:~ $</span><input aria-label="Comando de terminal" autocomplete="off" autocapitalize="off" spellcheck="false"></label></form></div>';
};
const simpleSetup = setup;
setup = function (id, w) {
  if (id !== 'terminal') {
    simpleSetup(id, w);
    return;
  }
  const shell = w.querySelector('.simple-terminal'),
    out = w.querySelector('.simple-output'),
    input = w.querySelector('input');
  w.querySelector('.simple-cat').textContent = [
    ' /' + String.fromCharCode(92) + '_/' + String.fromCharCode(92),
    '( o.o )',
    ' > ^ <',
    '',
  ].join('\n');
  let history = [],
    index = 0;
  function line(s) {
    let p = document.createElement('pre');
    p.textContent = s;
    out.append(p);
    shell.scrollTop = shell.scrollHeight;
  }
  w.querySelector('form').onsubmit = (e) => {
    e.preventDefault();
    let value = input.value.trim();
    if (!value) return;
    input.value = '';
    history.push(value);
    index = history.length;
    let [cmd, ...parts] = value.split(/\s+/),
      args = parts.join(' ');
    line('papel:~ $ ' + value);
    switch (cmd.toLowerCase()) {
      case 'help':
        line(
          'help       comandos\nclear      limpiar\ndate       fecha y hora\necho TEXTO mostrar texto\napps       aplicaciones\nopen APP   abrir aplicación\nnotes      abrir notas\nfiles      abrir archivos',
        );
        break;
      case 'clear':
        out.replaceChildren();
        w.querySelector('.simple-cat').hidden = true;
        break;
      case 'date':
        line(new Date().toLocaleString('es-MX'));
        break;
      case 'echo':
        line(args);
        break;
      case 'apps':
        line(
          Object.entries(apps)
            .map(([id, a]) => id + ' — ' + a[0])
            .join('\n'),
        );
        break;
      case 'open':
        if (apps[args]) openApp(args);
        else line('Aplicación no encontrada. Escribe apps.');
        break;
      case 'notes':
        openApp('notes');
        break;
      case 'files':
        openApp('files');
        break;
      default:
        line('Comando no encontrado. Escribe help.');
    }
    shell.scrollTop = shell.scrollHeight;
  };
  input.onkeydown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = Math.max(0, index - 1);
      input.value = history[index] || '';
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = Math.min(history.length, index + 1);
      input.value = history[index] || '';
    }
  };
};
