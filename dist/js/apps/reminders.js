// Browser-local reminders; no notification permission or external service required.
apps.reminders = ['Recordatorios', 490, 490];
icons.reminders = icons.clock;
let reminderItems;
try {
  reminderItems = JSON.parse(read('papel-reminders', '[]'));
} catch {
  reminderItems = [];
}
if (!Array.isArray(reminderItems)) reminderItems = [];
reminderItems = reminderItems.filter(
  (item) =>
    item &&
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    Number.isFinite(item.when),
);
function saveReminders() {
  save('papel-reminders', JSON.stringify(reminderItems));
}
const reminderBody = body;
body = function (id) {
  if (id !== 'reminders') return reminderBody(id);
  return `<div class="extra-pad reminder-app"><span class="reminder-eyebrow">PARA NO DEJARLO PASAR</span><h2>Una cosa menos que recordar.</h2><form class="reminder-form"><label>¿Qué quieres recordar?<input class="reminder-text" maxlength="180" placeholder="Tomar un descanso…" required></label><label>Fecha y hora<input class="reminder-date" type="datetime-local" required></label><button class="primary">＋ Guardar recordatorio</button><button type="button" class="reminder-cancel" hidden>Cancelar edición</button></form><div class="reminder-tabs"><button data-reminderfilter="pending" class="tool-active">Pendientes</button><button data-reminderfilter="done">Completados</button></div><div class="reminder-list"></div><small>Los avisos aparecen dentro del sitio. Mantén esta pestaña abierta; si vuelves más tarde, verás los recordatorios vencidos.</small></div>`;
};
const reminderSetup = setup;
setup = function (id, w) {
  reminderSetup(id, w);
  if (id !== 'reminders') return;
  const form = w.querySelector('.reminder-form');
  const text = w.querySelector('.reminder-text');
  const date = w.querySelector('.reminder-date');
  const cancel = w.querySelector('.reminder-cancel');
  let filter = 'pending';
  let editing = null;
  function localInput(time) {
    const d = new Date(time);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  date.value = localInput(Date.now() + 30 * 60000);
  function finishEdit() {
    editing = null;
    text.value = '';
    cancel.hidden = true;
    form.querySelector('.primary').textContent = '＋ Guardar recordatorio';
  }
  function render() {
    const list = w.querySelector('.reminder-list');
    list.replaceChildren();
    const items = reminderItems
      .filter((item) => (filter === 'done' ? item.done : !item.done))
      .sort((a, b) => a.when - b.when);
    if (!items.length) {
      const p = document.createElement('p');
      p.textContent =
        filter === 'done' ? 'Todavía no hay completados.' : 'No tienes recordatorios pendientes.';
      list.append(p);
    }
    for (const item of items) {
      const row = document.createElement('article');
      row.className = 'reminder-row';
      const title = document.createElement('strong');
      title.textContent = item.text;
      const when = document.createElement('small');
      when.textContent =
        new Date(item.when).toLocaleString('es-MX', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }) + (!item.done && item.when <= Date.now() ? ' · Vencido' : '');
      const actions = document.createElement('div');
      actions.className = 'reminder-actions';
      function button(label, action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.onclick = action;
        actions.append(b);
      }
      button(item.done ? 'Reactivar' : '✓ Completar', () => {
        item.done = !item.done;
        if (!item.done) item.notified = false;
        saveReminders();
        render();
        checkReminders();
      });
      if (!item.done) {
        button('+10 min', () => {
          item.when = Date.now() + 10 * 60000;
          item.notified = false;
          saveReminders();
          render();
          checkReminders();
          toast('Recordatorio pospuesto 10 minutos.');
        });
        button('Editar', () => {
          editing = item.id;
          text.value = item.text;
          date.value = localInput(item.when);
          cancel.hidden = false;
          form.querySelector('.primary').textContent = 'Guardar cambios';
          text.focus();
        });
      }
      row.append(title, when, actions);
      list.append(row);
    }
  }
  form.onsubmit = (event) => {
    event.preventDefault();
    const when = new Date(date.value).getTime();
    const value = text.value.trim();
    if (!value || !Number.isFinite(when)) return;
    if (when <= Date.now()) {
      toast('Elige una fecha y hora futura.');
      return;
    }
    const item = reminderItems.find((entry) => entry.id === editing);
    if (item) {
      item.text = value;
      item.when = when;
      item.notified = false;
    } else
      reminderItems.push({
        id: crypto.randomUUID(),
        text: value,
        when,
        done: false,
        notified: false,
      });
    saveReminders();
    finishEdit();
    render();
    checkReminders();
    toast('Recordatorio guardado.');
  };
  cancel.onclick = finishEdit;
  w.querySelectorAll('[data-reminderfilter]').forEach(
    (button) =>
      (button.onclick = () => {
        filter = button.dataset.reminderfilter;
        w.querySelectorAll('[data-reminderfilter]').forEach((b) =>
          b.classList.toggle('tool-active', b === button),
        );
        render();
      }),
  );
  const listener = () => render();
  document.addEventListener('papel-reminders-updated', listener);
  const previous = extraCleanup.get(w);
  extraCleanup.set(w, () => {
    document.removeEventListener('papel-reminders-updated', listener);
    previous?.();
  });
  render();
};
const reminderAlert = document.createElement('aside');
reminderAlert.id = 'reminder-alert';
reminderAlert.hidden = true;
reminderAlert.setAttribute('role', 'status');
reminderAlert.innerHTML =
  '<span class="reminder-alert-icon">' +
  svg('clock') +
  '</span><div><small>ES HORA DE RECORDAR</small><strong></strong><div><button data-open="reminders">Ver recordatorios</button><button class="reminder-alert-snooze">+10 min</button><button class="reminder-alert-done">Completar</button></div></div>';
document.body.append(reminderAlert);
let announcedReminder = null;
function checkReminders() {
  const due = reminderItems
    .filter((item) => !item.done && item.when <= Date.now())
    .sort((a, b) => a.when - b.when);
  const next = due[0];
  reminderAlert.hidden = !next;
  if (next) {
    reminderAlert.querySelector('strong').textContent = next.text;
    if (announcedReminder !== next.id) {
      announcedReminder = next.id;
      document.dispatchEvent(new Event('papel-reminders-updated'));
    }
  } else announcedReminder = null;
  const badge = document.querySelector('#reminder-shortcut');
  if (badge) {
    badge.classList.toggle('reminder-due', !!next);
    badge.setAttribute(
      'aria-label',
      due.length ? 'Recordatorios: ' + due.length + ' vencidos' : 'Abrir recordatorios',
    );
  }
}
reminderAlert.querySelector('.reminder-alert-snooze').onclick = () => {
  const item = reminderItems.find((entry) => entry.id === announcedReminder);
  if (item) {
    item.when = Date.now() + 600000;
    saveReminders();
    document.dispatchEvent(new Event('papel-reminders-updated'));
    checkReminders();
  }
};
reminderAlert.querySelector('.reminder-alert-done').onclick = () => {
  const item = reminderItems.find((entry) => entry.id === announcedReminder);
  if (item) {
    item.done = true;
    saveReminders();
    document.dispatchEvent(new Event('papel-reminders-updated'));
    checkReminders();
  }
};
const reminderMenu = document.createElement('button');
reminderMenu.dataset.open = 'reminders';
reminderMenu.innerHTML = '<span class="start-app-icon">' + svg('clock') + '</span>Recordatorios';
document.querySelector('#startapps').append(reminderMenu);
const reminderShortcut = document.createElement('button');
reminderShortcut.id = 'reminder-shortcut';
reminderShortcut.dataset.open = 'reminders';
reminderShortcut.title = 'Recordatorios';
reminderShortcut.textContent = '◷';
document.querySelector('#overviewbutton').after(reminderShortcut);
setInterval(checkReminders, 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkReminders();
});
checkReminders();
