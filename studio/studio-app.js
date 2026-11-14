import { renderBroadcastFrame, resolveTimeline } from './broadcast-canvas.js';

const params = new URLSearchParams(window.location.search);
const episodeDate = params.get('episode') || '2026-11-14';
const initialFormat = params.get('format') === '9x16' ? '9x16' : '16x9';

// Empreinte SHA-256 de "pseudo:motdepasse" (aucun mot de passe en clair dans le code)
const EXPECTED_AUTH_SHA256 = '023bb274c32730b8630f72e794daba04dd57533598c91d669c3667bbac6f2738';
const AUTH_STORAGE_KEY = 'franc_nord_studio_token';

const authGateOverlay = document.getElementById('authGateOverlay');
const authForm = document.getElementById('authForm');
const authUser = document.getElementById('authUser');
const authPass = document.getElementById('authPass');
const authErrorMsg = document.getElementById('authErrorMsg');
const logoutBtn = document.getElementById('logoutBtn');

const canvas = document.getElementById('broadcastCanvas');
const ctx = canvas.getContext('2d');
const playPauseBtn = document.getElementById('playPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const format16x9Btn = document.getElementById('format16x9Btn');
const format9x16Btn = document.getElementById('format9x16Btn');
const scrubber = document.getElementById('scrubber');
const timecodeDisplay = document.getElementById('timecodeDisplay');
const scenePillsContainer = document.getElementById('scenePillsContainer');
const teleprompterList = document.getElementById('teleprompterList');
const activeSceneBadge = document.getElementById('activeSceneBadge');
const recordMicBtn = document.getElementById('recordMicBtn');
const voiceFileInput = document.getElementById('voiceFileInput');
const voiceAudioPlayer = document.getElementById('voiceAudioPlayer');
const voiceStatusText = document.getElementById('voiceStatusText');

let storyboard = null;
let customScenes = {};
let totalDuration = 65;
let globalTime = 0;
let isPlaying = true;
let currentFormat = initialFormat;
let lastFrameTs = performance.now();
let lastActiveSceneIdx = -1;

let mediaRecorder = null;
let recordedChunks = [];

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function checkAuthGate() {
  const isLocalRender =
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost';

  const savedHash = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedHash === EXPECTED_AUTH_SHA256 || (isLocalRender && savedHash !== 'LOCKED')) {
    authGateOverlay.classList.add('hidden');
    return true;
  }
  authGateOverlay.classList.remove('hidden');
  isPlaying = false;
  playPauseBtn.textContent = 'Lecture';
  return false;
}

authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = authUser.value.trim().toLowerCase();
  const pass = authPass.value;
  const candidateHash = await sha256Hex(`${user}:${pass}`);
  if (candidateHash === EXPECTED_AUTH_SHA256) {
    localStorage.setItem(AUTH_STORAGE_KEY, candidateHash);
    authErrorMsg.textContent = '';
    authGateOverlay.classList.add('hidden');
    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
  } else {
    authErrorMsg.textContent = 'Identifiant ou mot de passe invalide.';
  }
});

logoutBtn?.addEventListener('click', () => {
  localStorage.setItem(AUTH_STORAGE_KEY, 'LOCKED');
  authPass.value = '';
  checkAuthGate();
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}

function applyFormat(fmt) {
  currentFormat = fmt;
  if (fmt === '9x16') {
    canvas.width = 1080;
    canvas.height = 1920;
    format9x16Btn.classList.add('active-format');
    format16x9Btn.classList.remove('active-format');
  } else {
    canvas.width = 1920;
    canvas.height = 1080;
    format16x9Btn.classList.add('active-format');
    format9x16Btn.classList.remove('active-format');
  }
  drawCurrentFrame();
}

function drawCurrentFrame() {
  if (!storyboard) return;
  renderBroadcastFrame({
    ctx,
    width: canvas.width,
    height: canvas.height,
    storyboard,
    customScenes,
    globalTime
  });
}

window.__FRANC_NORD_RENDER_AT = (timeInSeconds, fmt) => {
  if (fmt && fmt !== currentFormat) {
    applyFormat(fmt);
  }
  isPlaying = false;
  globalTime = timeInSeconds;
  drawCurrentFrame();
  return true;
};

function buildUI() {
  const scenes = storyboard.scenes || [];
  totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 12), 0);
  scrubber.max = String(totalDuration);

  scenePillsContainer.innerHTML = '';
  teleprompterList.innerHTML = '';

  let startAcc = 0;
  scenes.forEach((sc, idx) => {
    const startSec = startAcc;
    const dur = sc.duration || 12;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'scene-pill';
    pill.textContent = `0${idx + 1} • ${sc.shortVisualTitle || sc.id} (${dur}s)`;
    pill.addEventListener('click', () => {
      seekTo(startSec);
    });
    scenePillsContainer.appendChild(pill);

    const card = document.createElement('div');
    card.className = 'script-card';
    card.dataset.sceneIdx = String(idx);
    card.innerHTML = `
      <div class="script-meta">
        <span>SCÈNE 0${idx + 1} • ${sc.locationBadge || ''}</span>
        <span>${formatTime(startSec)} → ${formatTime(startSec + dur)}</span>
      </div>
      <p class="script-text">« ${sc.narration} »</p>
    `;
    card.addEventListener('click', () => {
      seekTo(startSec);
    });
    teleprompterList.appendChild(card);

    startAcc += dur;
  });
}

function seekTo(sec) {
  globalTime = Math.max(0, Math.min(totalDuration, sec));
  scrubber.value = String(globalTime);
  if (voiceAudioPlayer.src && !voiceAudioPlayer.paused) {
    voiceAudioPlayer.currentTime = globalTime;
  }
  drawCurrentFrame();
  updateHudState();
}

function updateHudState() {
  scrubber.value = String(globalTime);
  timecodeDisplay.textContent = `${formatTime(globalTime)} / ${formatTime(totalDuration)}`;

  const tl = resolveTimeline(storyboard, globalTime);
  if (!tl) return;

  if (tl.sceneIndex !== lastActiveSceneIdx) {
    lastActiveSceneIdx = tl.sceneIndex;
    activeSceneBadge.textContent = `Scène ${tl.sceneIndex + 1} / ${storyboard.scenes.length}`;

    const pills = scenePillsContainer.querySelectorAll('.scene-pill');
    pills.forEach((p, i) => p.classList.toggle('current', i === tl.sceneIndex));

    const cards = teleprompterList.querySelectorAll('.script-card');
    cards.forEach((c, i) => {
      const isAct = i === tl.sceneIndex;
      c.classList.toggle('active', isAct);
      if (isAct) {
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
}

function tick(now) {
  const dt = (now - lastFrameTs) / 1000;
  lastFrameTs = now;

  if (isPlaying && storyboard) {
    if (voiceAudioPlayer.src && !voiceAudioPlayer.paused) {
      globalTime = voiceAudioPlayer.currentTime;
    } else {
      globalTime += dt;
    }

    if (globalTime >= totalDuration) {
      globalTime = 0;
      if (voiceAudioPlayer.src) {
        voiceAudioPlayer.currentTime = 0;
      }
    }
    drawCurrentFrame();
    updateHudState();
  }

  requestAnimationFrame(tick);
}

playPauseBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? 'Pause' : 'Lecture';
  if (voiceAudioPlayer.src) {
    if (isPlaying) voiceAudioPlayer.play().catch(() => {});
    else voiceAudioPlayer.pause();
  }
});

restartBtn.addEventListener('click', () => {
  seekTo(0);
});

format16x9Btn.addEventListener('click', () => applyFormat('16x9'));
format9x16Btn.addEventListener('click', () => applyFormat('9x16'));

scrubber.addEventListener('input', (e) => {
  seekTo(parseFloat(e.target.value) || 0);
});

voiceFileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  voiceAudioPlayer.src = url;
  voiceAudioPlayer.style.display = 'block';
  voiceStatusText.textContent = `✓ Piste voix chargée : ${file.name} (synchronisée avec l'aperçu)`;
  seekTo(0);
  isPlaying = true;
  playPauseBtn.textContent = 'Pause';
  voiceAudioPlayer.play().catch(() => {});
});

recordMicBtn.addEventListener('click', async () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    recordMicBtn.classList.remove('recording');
    recordMicBtn.textContent = '🔴 Enregistrer ma voix au micro';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) recordedChunks.push(ev.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      voiceAudioPlayer.src = url;
      voiceAudioPlayer.style.display = 'block';

      const a = document.createElement('a');
      a.href = url;
      a.download = `voix-${episodeDate}.webm`;
      a.textContent = '⬇️ Télécharger ma prise de voix (voix.webm)';
      a.style.color = '#38bdf8';
      a.style.fontWeight = '700';
      voiceStatusText.innerHTML = '✓ Voix enregistrée ! ';
      voiceStatusText.appendChild(a);
    };

    seekTo(0);
    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
    mediaRecorder.start();
    recordMicBtn.classList.add('recording');
    recordMicBtn.textContent = '⏹️ Arrêter l\'enregistrement';
    voiceStatusText.textContent = '🎙️ Enregistrement en cours... Lisez le téléprompteur ci-dessus !';
  } catch (err) {
    voiceStatusText.textContent = `⚠ Accès au micro refusé ou indisponible (${err.message}).`;
  }
});

async function init() {
  checkAuthGate();

  const sbRes = await fetch(`../episodes/${episodeDate}/storyboard.json`);
  storyboard = await sbRes.json();

  const scenesModule = await import(`../episodes/${episodeDate}/scenes-custom.js`);
  customScenes = scenesModule.CUSTOM_SCENES || {};

  buildUI();
  applyFormat(initialFormat);
  updateHudState();
  window.__FRANC_NORD_READY = true;
  requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error('Erreur chargement studio Franc Nord:', err);
});
