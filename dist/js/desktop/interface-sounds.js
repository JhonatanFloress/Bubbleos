// Short synthesized UI feedback, enabled only after a user interaction.
let interfaceAudio = null;
let interfaceSoundEnabled = read('papel-ui-sound', '1') !== '0';
let interfaceSoundVolume = Number(read('papel-ui-volume', '0.25'));
if (!Number.isFinite(interfaceSoundVolume)) interfaceSoundVolume = 0.25;
interfaceSoundVolume = Math.max(0, Math.min(1, interfaceSoundVolume));
let lastInterfaceClick = 0;

function playInterfaceClick() {
  if (!interfaceSoundEnabled || interfaceSoundVolume === 0) return;
  const now = performance.now();
  if (now - lastInterfaceClick < 35) return;
  lastInterfaceClick = now;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    interfaceAudio ||= new Audio();
    const context = interfaceAudio;
    if (context.state === 'suspended') context.resume().catch(() => {});
    if (context.state === 'closed') {
      interfaceAudio = null;
      return;
    }
    const tone = context.createOscillator();
    const envelope = context.createGain();
    const time = context.currentTime;
    tone.type = 'sine';
    tone.frequency.setValueAtTime(1250, time);
    tone.frequency.exponentialRampToValueAtTime(420, time + 0.025);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(interfaceSoundVolume * 0.16, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    tone.connect(envelope);
    envelope.connect(context.destination);
    tone.start(time);
    tone.stop(time + 0.04);
    tone.onended = () => {
      tone.disconnect();
      envelope.disconnect();
    };
  } catch {
    /* Audio is optional; blocked audio must never interrupt an action. */
  }
}

document.addEventListener('click', (event) => {
  if (!event.isTrusted) return;
  const target = event.target.closest('button, summary, input[type="checkbox"]');
  if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
  // A drag is not an activation, even if the browser emits a trailing click.
  if (target.closest('#icons') && typeof draggedClick !== 'undefined' && draggedClick === target)
    return;
  playInterfaceClick();
});

const soundSetup = setup;
setup = function (id, w) {
  soundSetup(id, w);
  if (id !== 'settings') return;
  const panel = document.createElement('section');
  panel.className = 'interface-sound-settings';
  panel.innerHTML = `
    <h3>Sonidos de la interfaz</h3>
    <label class="interface-sound-toggle"><input type="checkbox" aria-label="Activar clics de la interfaz"> Clic al pulsar botones y abrir apps</label>
    <label class="interface-sound-volume">Volumen <input type="range" min="0" max="100" step="1" aria-label="Volumen de clics"><output></output></label>
    <button type="button" class="primary interface-sound-test">Probar clic</button>
    <small>Se guarda en este navegador. Es independiente del volumen de Media Player.</small>
  `;
  const toggle = panel.querySelector('input[type="checkbox"]');
  const range = panel.querySelector('input[type="range"]');
  const output = panel.querySelector('output');
  toggle.checked = interfaceSoundEnabled;
  range.value = Math.round(interfaceSoundVolume * 100);
  const updateOutput = () => {
    output.textContent = range.value + '%';
  };
  updateOutput();
  toggle.onchange = () => {
    interfaceSoundEnabled = toggle.checked;
    save('papel-ui-sound', interfaceSoundEnabled ? '1' : '0');
  };
  range.oninput = () => {
    interfaceSoundVolume = Number(range.value) / 100;
    save('papel-ui-volume', String(interfaceSoundVolume));
    updateOutput();
  };
  panel.querySelector('button').onclick = () => {
    if (!interfaceSoundEnabled) toast('Activa los clics para probar el sonido.');
    // The delegated click listener produces one sound for this button.
  };
  w.querySelector('.content').prepend(panel);
};
