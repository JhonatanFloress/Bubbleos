// Local audio player. Songs use the same IndexedDB cabinet as Mis archivos.
apps.music[2] = 600;
const localMusicBody = body;
body = function (id) {
  if (id !== 'music') return localMusicBody(id);
  return `
    <div class="local-player">
      <div class="local-player-heading"><span>♫ BubbleOs MEDIA PLAYER</span><button class="audio-import">＋ Importar música</button></div>
      <div class="audio-art" aria-hidden="true"><div class="audio-record"><i></i></div><span>PERSONAL SOUND COLLECTION</span></div>
      <h2 class="audio-title">Tu música, aquí.</h2>
      <p class="audio-description">Importa archivos de audio desde tu equipo.</p>
      <div class="audio-progress"><input type="range" class="audio-seek" aria-label="Posición de la canción" min="0" max="100" value="0" step="0.1" disabled><div><span class="audio-elapsed">0:00</span><span class="audio-duration">0:00</span></div></div>
      <div class="audio-controls"><button class="audio-shuffle" aria-label="Reproducción aleatoria" aria-pressed="false">⤨</button><button class="audio-previous" aria-label="Canción anterior">◀◀</button><button class="audio-play" aria-label="Reproducir">▶</button><button class="audio-next" aria-label="Siguiente canción">▶▶</button><button class="audio-repeat" aria-label="Repetición desactivada">↻</button></div>
      <label class="audio-volume">Volumen <input id="volume" type="range" min="0" max="0.3" step="0.01" aria-label="Volumen de música"><output></output></label>
      <div class="audio-list-heading"><span>LISTA DE REPRODUCCIÓN</span><button class="audio-refresh" aria-label="Actualizar canciones">↻</button></div>
      <div class="audio-playlist"></div>
      <p class="audio-footnote">Archivos locales · máximo 10 MB por canción · sigue sonando al minimizar.</p>
      <input class="audio-picker" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" multiple hidden>
    </div>`;
};

const localMusicSetup = setup;
setup = function (id, w) {
  if (id !== 'music') {
    localMusicSetup(id, w);
    return;
  }
  const root = w.querySelector('.local-player');
  const audio = new Audio();
  audio.preload = 'metadata';
  let songs = [];
  let current = -1;
  let currentURL = null;
  let shuffle = false;
  let repeat = 'off';
  let disposed = false;
  let generation = 0;
  const playButton = root.querySelector('.audio-play');
  const seek = root.querySelector('.audio-seek');
  const list = root.querySelector('.audio-playlist');
  const volume = root.querySelector('#volume');
  const format = (seconds) =>
    Number.isFinite(seconds)
      ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0')
      : '0:00';
  volume.value = read('papel-player-volume', '0.12');
  function setVolume() {
    const value = Math.max(0, Math.min(0.3, Number(volume.value) || 0));
    audio.volume = value / 0.3;
    root.querySelector('.audio-volume output').textContent = Math.round(audio.volume * 100) + '%';
    save('papel-player-volume', String(value));
  }
  volume.oninput = setVolume;
  setVolume();
  function playingUI() {
    const playing = !audio.paused && !audio.ended;
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    root.classList.toggle('audio-playing', playing);
    list.querySelectorAll('button').forEach((button, i) => {
      button.classList.toggle('audio-current', i === current);
      button.setAttribute('aria-pressed', String(i === current));
    });
  }
  async function play() {
    try {
      await audio.play();
    } catch {
      if (!disposed) toast('No se pudo reproducir este audio. Prueba otro formato.');
    }
  }
  function select(index, autoplay = true) {
    if (!songs[index] || disposed) return;
    audio.pause();
    current = index;
    if (currentURL) URL.revokeObjectURL(currentURL);
    currentURL = URL.createObjectURL(songs[index].blob);
    audio.src = currentURL;
    root.querySelector('.audio-title').textContent = songs[index].name.replace(/\.[^.]+$/, '');
    root.querySelector('.audio-description').textContent =
      index + 1 + ' de ' + songs.length + ' canciones · guardada en este navegador';
    root.querySelector('.audio-elapsed').textContent = '0:00';
    root.querySelector('.audio-duration').textContent = '0:00';
    seek.value = 0;
    seek.disabled = true;
    playingUI();
    if (autoplay) play();
  }
  function next(automatic = false) {
    if (!songs.length) return;
    if (automatic && repeat === 'one') {
      audio.currentTime = 0;
      play();
      return;
    }
    if (shuffle && songs.length > 1) {
      const choices = songs.map((_, i) => i).filter((i) => i !== current);
      select(choices[Math.floor(Math.random() * choices.length)]);
      return;
    }
    if (automatic && current === songs.length - 1 && repeat === 'off') {
      playingUI();
      return;
    }
    select((current + 1) % songs.length);
  }
  async function refreshSongs() {
    const token = ++generation;
    try {
      const files = await cabinet('readonly', (store) => store.getAll());
      if (disposed || token !== generation) return;
      const currentID = songs[current]?.id;
      songs = files
        .filter(
          (file) =>
            !file.deleted &&
            file.kind !== 'folder' &&
            (file.blob.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)),
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      list.replaceChildren();
      songs.forEach((song, i) => {
        const button = document.createElement('button');
        const number = document.createElement('small');
        number.textContent = String(i + 1).padStart(2, '0');
        const title = document.createElement('span');
        title.textContent = song.name;
        const size = document.createElement('small');
        size.textContent = (song.blob.size / 1024 / 1024).toFixed(1) + ' MB';
        button.append(number, title, size);
        button.onclick = () => select(i);
        list.append(button);
      });
      current = songs.findIndex((song) => song.id === currentID);
      if (current < 0 && songs.length) select(0, false);
      if (!songs.length) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        if (currentURL) {
          URL.revokeObjectURL(currentURL);
          currentURL = null;
        }
        list.textContent = 'Tu lista está vacía. Importa tu primera canción.';
        root.querySelector('.audio-title').textContent = 'Tu música, aquí.';
        root.querySelector('.audio-description').textContent =
          'Importa archivos de audio desde tu equipo.';
        seek.disabled = true;
      }
      root
        .querySelectorAll('.audio-play,.audio-next,.audio-previous')
        .forEach((button) => (button.disabled = !songs.length));
      playingUI();
    } catch {
      toast('No se pudo cargar la música guardada.');
    }
  }
  playButton.onclick = () => {
    if (audio.paused) play();
    else audio.pause();
  };
  root.querySelector('.audio-next').onclick = () => next();
  root.querySelector('.audio-previous').onclick = () => {
    if (!songs.length) return;
    if (audio.currentTime > 3) audio.currentTime = 0;
    else select((current - 1 + songs.length) % songs.length);
  };
  root.querySelector('.audio-shuffle').onclick = (event) => {
    shuffle = !shuffle;
    event.currentTarget.setAttribute('aria-pressed', String(shuffle));
  };
  root.querySelector('.audio-repeat').onclick = (event) => {
    repeat = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    event.currentTarget.textContent = repeat === 'one' ? '↻¹' : '↻';
    event.currentTarget.setAttribute(
      'aria-label',
      repeat === 'off'
        ? 'Repetición desactivada'
        : repeat === 'all'
          ? 'Repetir lista'
          : 'Repetir canción',
    );
    event.currentTarget.classList.toggle('audio-option-active', repeat !== 'off');
  };
  audio.onplay = audio.onpause = playingUI;
  audio.onended = () => next(true);
  audio.onloadedmetadata = () => {
    seek.disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
    root.querySelector('.audio-duration').textContent = format(audio.duration);
  };
  audio.ontimeupdate = () => {
    root.querySelector('.audio-elapsed').textContent = format(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0)
      seek.value = (audio.currentTime / audio.duration) * 100;
  };
  seek.oninput = () => {
    if (Number.isFinite(audio.duration))
      audio.currentTime = (Number(seek.value) / 100) * audio.duration;
  };
  root.querySelector('.audio-refresh').onclick = refreshSongs;
  root.querySelector('.audio-import').onclick = () => root.querySelector('.audio-picker').click();
  root.querySelector('.audio-picker').onchange = async (event) => {
    let imported = 0;
    for (const file of event.target.files) {
      if (
        (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name)) ||
        file.size > 10 * 1024 * 1024
      ) {
        toast(file.name + ': usa un audio de hasta 10 MB.');
        continue;
      }
      try {
        await cabinet('readwrite', (store) =>
          store.put({ id: crypto.randomUUID(), name: file.name, blob: file }),
        );
        imported++;
      } catch {
        toast('No se pudo guardar ' + file.name);
      }
    }
    event.target.value = '';
    await refreshSongs();
    if (imported) toast(imported + ' canciones añadidas.');
  };
  extraCleanup.set(w, () => {
    disposed = true;
    audio.onplay =
      audio.onpause =
      audio.onended =
      audio.ontimeupdate =
      audio.onloadedmetadata =
        null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (currentURL) URL.revokeObjectURL(currentURL);
  });
  refreshSongs();
};
