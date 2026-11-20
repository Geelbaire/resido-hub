import { renderBroadcastFrame, resolveTimeline } from './broadcast-canvas.js';

const params = new URLSearchParams(window.location.search);
const episodeFolder = '2026-11-20-Episode-06';
const requestedEpisode = params.get('episode');
const episodeDate = !requestedEpisode || requestedEpisode === '2026-11-20' ? episodeFolder : requestedEpisode;
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
const copyGeminiPromptBtn = document.getElementById('copyGeminiPromptBtn');
const motionAgentSelect = document.getElementById('motionAgentSelect');
const copyMotionPromptBtn = document.getElementById('copyMotionPromptBtn');
const pipelineSubtitle = document.getElementById('pipelineSubtitle');
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
let publication = null;
let customScenes = {};
let totalDuration = 65;
let globalTime = 0;
let isPlaying = true;
let currentFormat = initialFormat;
let lastFrameTs = performance.now();
let lastActiveSceneIdx = -1;

let mediaRecorder = null;
let recordedChunks = [];

// SHA-256 pur JS (fonctionne aussi sur http://resido.ca où crypto.subtle est désactivé par Safari)
function sha256Hex(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
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

const AGENT_STORAGE_KEY = 'franc_nord_motion_agent';
const savedAgent = localStorage.getItem(AGENT_STORAGE_KEY);
if (savedAgent === 'codex' || savedAgent === 'opus') {
  motionAgentSelect.value = savedAgent;
}

function updateAgentLabel() {
  const isCodex = motionAgentSelect?.value === 'codex';
  if (pipelineSubtitle) {
    pipelineSubtitle.textContent = isCodex
      ? 'Plein Écran Cinématique • Gemini Hydrogen (Amont) → Codex Sol 6.1 (Motion Design)'
      : 'Plein Écran Cinématique • Gemini Hydrogen (Amont) → Claude Opus 5.5 (Motion Design)';
  }
}
updateAgentLabel();

motionAgentSelect?.addEventListener('change', () => {
  localStorage.setItem(AGENT_STORAGE_KEY, motionAgentSelect.value);
  updateAgentLabel();
});

function copyTextReliable(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

copyGeminiPromptBtn?.addEventListener('click', async () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const promptText = `Prépare le bulletin FRANC NORD d'aujourd'hui (${todayStr}) en suivant "/Volumes/Projets/FRANC NORD/1-amont-gemini-hydrogen/PROMPT_GEMINI_HYDROGEN.md" (format 8m30s / 13 scènes dans episodes/${todayStr}/storyboard.json et teleprompteur.md).`;
  await copyTextReliable(promptText);
  voiceStatusText.textContent = `✓ Copié dans le presse-papiers : ${promptText}`;
  const orig = copyGeminiPromptBtn.textContent;
  copyGeminiPromptBtn.textContent = '✓ Prompt Gemini copié !';
  setTimeout(() => {
    copyGeminiPromptBtn.textContent = orig;
  }, 2200);
});

copyMotionPromptBtn?.addEventListener('click', async () => {
  const isCodex = motionAgentSelect?.value === 'codex';
  const todayStr = new Date().toISOString().slice(0, 10);
  const refs = `"/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Special-Reportage-Epicerie/scenes-custom.js" (et son guide reference/outils-production/BRIEF.md : 15-26 cues par scène sur wordTimes, compteurs odometer, cartes verre dépoli, graphiques vivants, corridor F/(Z-camZ), micro-mouvements permanents), "/Volumes/Projets/FRANC NORD/episodes/2026-11-14-Episode-01/reference-episode-1/scenes-custom.js" (esthétique glassmorphique translucide et grilles radiales), et "/Volumes/Projets/FRANC NORD/episodes/2026-11-15-Episode-04/REPRISE-DIRECTION-ARTISTIQUE.md" (avec earth.js, atlas.js et canaries-approved.js : globe texturé 8K 3D, géographie reconnaissable sans étiquettes)`;
  const basePrompt = isCodex
    ? `Examine les images haute résolution de notre charte dans "/Volumes/Projets/FRANC NORD/identite-visuelle/", étudie attentivement nos trois références approuvées ${refs}, et lis "/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_OPUS_5_5.md", "/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_CODEX_SOL_6_1.md" et "/Volumes/Projets/FRANC NORD/episodes/${todayStr}/storyboard.json". Code ensuite 13 scènes artisanales sur mesure (~200-450 lignes lisibles par scène, zéro code compacté) dans "/Volumes/Projets/FRANC NORD/episodes/${todayStr}/scenes-custom.js", synchronise au mot près avec voix.mp3 (14 à 26 cues par scène), valide d'abord une séquence pilote complète avec sa voix en 16:9 et 9:16 (plus la passe géographique sans étiquettes et l'audit visuel anti-temps-morts des planches), puis exporte les 2 vidéos complètes (16x9 et 9x16) ET découpe automatiquement les 3 Shorts/Reels verticaux (Short-1-*.mp4, Short-2-*.mp4, Short-3-*.mp4 pour les chapitres ch1, ch2, ch3).`
    : `Examine les images haute résolution de notre charte dans "/Volumes/Projets/FRANC NORD/identite-visuelle/", inspecte nos trois références approuvées ${refs}, puis lis "/Volumes/Projets/FRANC NORD/2-aval-opus-motion/PROMPT_OPUS_5_5.md" et "/Volumes/Projets/FRANC NORD/episodes/${todayStr}/storyboard.json". Code ensuite 13 scènes artisanales sur mesure (~200-450 lignes lisibles par scène) dans "/Volumes/Projets/FRANC NORD/episodes/${todayStr}/scenes-custom.js", synchronise au mot près avec voix.mp3 (14 à 26 cues par scène), valide d'abord une séquence pilote complète avec sa voix en 16:9 et 9:16 (plus la passe géographique sans étiquettes et l'audit visuel anti-temps-morts des planches), puis exporte les 2 vidéos complètes (16x9 et 9x16) ET découpe automatiquement les 3 Shorts/Reels verticaux (Short-1-*.mp4, Short-2-*.mp4, Short-3-*.mp4 pour les chapitres ch1, ch2, ch3).`;
  const appleStandard = `EXIGENCE ABSOLUE — STANDARD « ULTRA-PRESTIGE 2.0 » (APPLE KEYNOTE 2026 × JOHNNY HARRIS × BUCK STUDIO × BLOOMBERG ORIGINALS) : RÈGLE DES 1,5–2 SECONDES obligatoire (18 à 28 cues par scène sur wordTimes, jamais plus de 2 s sans évolution visuelle franche). Déploie obligatoirement nos 10 EFFETS SIGNATURES : 1) Scanner Rayon-X Architectural en double passe (ctx.clip() progressif avec lame laser révélant les câbles financiers ou la mécanique sous une façade), 2) Caméra virtuelle 2.5D dynamique (cam = { x, y, z, zoom, tilt } avec spring(), travellings F/(Z-camZ) et bascules sous le sol), 3) Optique Verre de Saphir & Anodisation Apple Pro (bordures biseautées à reflet spéculaire mobile, lueurs 'lighter', micro-grilles HUD), 4) Champs de particules financières sur courbes de Bézier (Bezier Flow Fields avec motion trails incrémentant les compteurs à chaque impact), 5) Globe 8K niveau NASA / Johnny Harris (halo atmosphérique Rayleigh, arcs 3D à tête cométaire et ombre portée, ondes de choc, Québec contextualisé par Canada/Grands Lacs/Saint-Laurent, test sans étiquettes), 6) Météo & atmosphère volumétrique temps réel (neige en parallaxe, givre, scan thermique, faisceaux lumineux), 7) Banc-titre d'inspection optique avec loupe grossissante (ctx.clip() circulaire zoom 1.45x sur contrats, factures et écrans REQ avec surligneur fluorescent), 8) Split-screen coulissant à géométrie variable (70/30 ⇄ 30/70 ⇄ 50/50 synchronisé sur Camp A et Camp B), 9) Instruments horlogers & compteurs odometer() monumentaux à graduations micrométriques, 10) Transitions morphing inter-scènes. INTERDIT de sculpter humains (« pions de Monopoly »), navires, mines, trains, barrages ou bâtiments avec de simples box()/cylinder()/ellipsoid() opaques dans un vide noir #030509 nu. Zéro jitter, zéro titre tronqué en fondu, zéro musique (uniquement voix.mp3).`;
  const deliveryPrompt = `${basePrompt} ${appleStandard} NOTE AUDIO IMPORTANTE : si l'audio a été généré en 2 parties dans ElevenLabs (limite de 10 000 caractères : Partie 1 + Partie 2 déposées dans le dossier de l'épisode), fusionne d'abord proprement les 2 fichiers MP3 dans l'ordre avec FFmpeg (avec 0,55 s de respiration naturelle entre les deux parties, sans altérer le tempo) pour créer voix.mp3 avant de lancer align-voix-mots.mjs. LIVRAISON OBLIGATOIRE : place les 2 MP4 complets (16x9 et 9x16), les 3 MP4 Shorts/Reels verticaux (ch1, ch2, ch3), tous les fichiers de l'épisode ET le fichier KIT-PUBLICATION-EPISODE-NN.md (repris depuis episodes/${todayStr}/ en mettant uniquement à jour les horodatages exacts des chapitres selon voix.mp3) dans un dossier daté créé directement sous /Volumes/Projets/FRANC NORD/episodes/ (exemple : ${todayStr}-Episode-05), sans dossier livraisons/. Prépare aussi la mise à jour dans le Studio sur https://resido.ca et demande-moi explicitement si je veux la publier.`;
  await copyTextReliable(deliveryPrompt);
  voiceStatusText.textContent = `✓ Copié dans le presse-papiers : ${deliveryPrompt}`;
  const orig = copyMotionPromptBtn.textContent;
  copyMotionPromptBtn.textContent = isCodex ? '✓ Prompt Codex Sol 6.1 copié !' : '✓ Prompt Claude Opus 5.5 copié !';
  setTimeout(() => {
    copyMotionPromptBtn.textContent = orig;
  }, 2200);
});

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
  if (!sbRes.ok) throw new Error(`Storyboard introuvable pour ${episodeDate}`);
  storyboard = await sbRes.json();

  try {
    const scenesModule = await import(`../episodes/${episodeDate}/scenes-custom.js`);
    customScenes = scenesModule.CUSTOM_SCENES || {};
  } catch (error) {
    console.warn(`Scènes sur mesure indisponibles pour ${episodeDate}`, error);
    customScenes = {};
  }

  buildUI();
  await configureDelivery();
  if (String(storyboard.productionStatus?.voice || '').startsWith('word-aligned')) {
    voiceAudioPlayer.src = `../episodes/${episodeDate}/voix.mp3`;
    voiceAudioPlayer.style.display = 'block';
    const secs = Math.round(storyboard.productionStatus.audioDurationSeconds || totalDuration);
    voiceStatusText.textContent = `Voix de l’épisode ${storyboard.episodeNumber || ''} chargée · ${Math.floor(secs / 60)} min ${String(secs % 60).padStart(2, '0')} s`;
    isPlaying = false;
    playPauseBtn.textContent = 'Lecture';
  }
  applyFormat(initialFormat);
  updateHudState();
  window.__FRANC_NORD_READY = true;
  requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error('Erreur chargement studio Franc Nord:', err);
});


// Sources locales pour la prévisualisation. Pages et Releases après déploiement.
const finalVideo = document.getElementById('finalVideo');
const finalPanel = document.getElementById('finalVideoPanel');
const animationPanel = document.querySelector('.canvas-viewport');
const showFinalVideo = document.getElementById('showFinalVideo');
const deliveryError = document.getElementById('finalVideoError');
const localDelivery = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
const previousEpisode = {
  title: 'Spécial reportage épicerie',
  episode: 4,
  releaseTag: 'episode-04-2026-11-14',
  folder: '2026-11-14-Special-Reportage-Epicerie',
  files: [{kind: 'complete', format: '16x9', file: 'Franc-Nord-Episode-04-16x9.mp4', duration: 449}],
};

function deliveryUrl(file) {
  const folder = publication.folder || episodeDate;
  if (localDelivery) return `../episodes/${folder}/${file.file}`;
  if (file.kind === 'complete' && file.format === '16x9' && folder === episodeFolder) {
    return `../videos/${folder}/${file.file}`;
  }
  return `https://github.com/Geelbaire/resido-hub/releases/download/${publication.releaseTag}/${file.file}`;
}

function addDownload(container, title, href, filename = '') {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.textContent = title;
  container.append(link);
}

async function configureDelivery() {
  try {
    const response = await fetch(`../episodes/${episodeDate}/publication-metadata.json`);
    publication = response.ok ? await response.json() : previousEpisode;
    const completed = publication.files.find(file => file.kind === 'complete');
    if (!completed) throw new Error('Vidéo complète absente du manifeste');

    const links = document.getElementById('episodeDownloads');
    links.replaceChildren();
    for (const file of publication.files) {
      const title = file.kind === 'complete' ? `MP4 ${file.format.replace('x', ':')}` :
        `Short ${file.chapterId.slice(2)}`;
      addDownload(links, title, deliveryUrl(file), file.file);
    }
    if (publication !== previousEpisode) {
      const kitFilename = `KIT-PUBLICATION-EPISODE-${String(publication.episode).padStart(2, '0')}.md`;
      addDownload(links, 'Kit de publication', `../episodes/${episodeDate}/${kitFilename}`, kitFilename);
    }
    showFinalVideo.textContent = `▶ Épisode ${publication.episode} · ${publication.title || storyboard.title}`;
    finalVideo.setAttribute('aria-label', `Épisode ${publication.episode} complet avec narration`);
    const duration = Math.round(completed.duration);
    document.getElementById('deliveryDuration').textContent =
      `${Math.floor(duration / 60)} min ${String(duration % 60).padStart(2, '0')} s · Voix originale · Sans musique`;
    showFinalVideo.disabled = false;
  } catch (error) {
    console.warn('Informations de livraison indisponibles', error);
  }
}

function selectDeliveredVideo() {
  if (!publication) return;
  const complete = publication.files.filter(file => file.kind === 'complete');
  const file = complete.find(file => file.format === currentFormat) || complete[0];
  if (!file) return;
  const url = new URL(deliveryUrl(file), location.href).href;
  if (finalVideo.src === url) return;

  const previousTime = finalVideo.currentTime;
  const wasPlaying = !finalVideo.paused && !finalVideo.ended;
  deliveryError.hidden = true;
  finalVideo.src = url;
  finalVideo.addEventListener('loadedmetadata', () => {
    finalVideo.currentTime = Math.min(previousTime, finalVideo.duration);
    if (wasPlaying) finalVideo.play().catch(() => {});
  }, {once: true});
}

showFinalVideo.addEventListener('click', () => {
  isPlaying = false;
  voiceAudioPlayer.pause();
  playPauseBtn.textContent = 'Lecture';
  finalPanel.hidden = false;
  animationPanel.hidden = true;
  selectDeliveredVideo();
});
document.getElementById('showAnimation').addEventListener('click', () => {
  finalVideo.pause();
  finalPanel.hidden = true;
  animationPanel.hidden = false;
});
for (const button of [format16x9Btn, format9x16Btn]) {
  button.addEventListener('click', () => {
    if (!finalPanel.hidden) selectDeliveredVideo();
  });
}
finalVideo.addEventListener('error', () => { deliveryError.hidden = false; });
finalVideo.addEventListener('loadeddata', () => { deliveryError.hidden = true; });
