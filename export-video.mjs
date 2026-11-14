#!/usr/bin/env node
/**
 * FRANC NORD — Exporteur Vidéo .MP4 100 % Code (Zéro dépendance npm)
 * Rend chaque image du Canevas Broadcast + Scènes Motion Design via Chrome Headless
 * et encode en MP4 1080p matériel (Apple VideoToolbox / H.264) via FFmpeg,
 * en fusionnant automatiquement votre fichier voix s'il est présent.
 *
 * Exemples d'utilisation :
 *   /opt/homebrew/bin/node export-video.mjs --episode 2026-11-14 --format 16x9
 *   /opt/homebrew/bin/node export-video.mjs --episode 2026-11-14 --format 9x16
 *   /opt/homebrew/bin/node export-video.mjs --episode 2026-11-14 --format 16x9 --duration 10
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startStudioServer } from './server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG_BIN = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    episode: get('--episode', '2026-11-14'),
    format: get('--format', '16x9'),
    fps: Number(get('--fps', '30')),
    durationOverride: get('--duration', null) ? Number(get('--duration', null)) : null,
    silent: args.includes('--silent'),
    gpu: args.includes('--gpu'),
    reel: args.includes('--reel'),
    output: get('--output', null),
    serverPort: Number(get('--server-port', '4399')),
    debugPort: Number(get('--debug-port', '9299'))
  };
}

function findVoiceFile(episodeDir) {
  const candidates = ['voix.m4a', 'voix.wav', 'voix.mp3', 'voix.webm'];
  for (const name of candidates) {
    const p = path.join(episodeDir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const { episode, format, fps, durationOverride, silent, gpu, reel, output, serverPort, debugPort } = parseArgs();
  const episodeDir = path.join(__dirname, 'episodes', episode);
  const storyboardPath = path.join(episodeDir, 'storyboard.json');

  if (!fs.existsSync(storyboardPath)) {
    throw new Error(`Storyboard introuvable : ${storyboardPath}`);
  }

  const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
  const fullDuration = (storyboard.scenes || []).reduce((acc, s) => acc + (s.duration || 12), 0);
  const clips = [];
  let sceneStart = 0;
  if (reel) for (const sc of storyboard.scenes) {
    for (const fraction of [.22, .68]) clips.push({ start: sceneStart + sc.duration * fraction, duration: 2 });
    sceneStart += sc.duration;
  }
  const duration = reel ? clips.reduce((n, c) => n + c.duration, 0) : durationOverride || fullDuration;
  if (reel && !silent) throw new Error('--reel exige --silent : aperçu discontinu.');
  if (!silent && storyboard.productionStatus?.voice === 'pending-replacement') {
    throw new Error('Nouvelle voix attendue : le MP3 actuel appartient au pilote pétrole/taux/hydro. Synchroniser la voix correspondante avant export final.');
  }
  const totalFrames = Math.ceil(duration * fps);
  const voiceFile = silent ? null : findVoiceFile(episodeDir);

  const outFile = output ? path.resolve(output) : path.join(episodeDir, `franc-nord-${episode}-${format}.mp4`);

  console.log(`🎬 FRANC NORD — Export MP4 (${format}) • Épisode ${episode}`);
  console.log(`   • Durée à rendre : ${duration}s (${totalFrames} images @ ${fps} FPS)`);
  console.log(`   • Piste voix     : ${voiceFile ? path.basename(voiceFile) : 'Aucune (vidéo muette prête à doubler)'}`);

  const server = await startStudioServer(serverPort);

  const userDataDir = `/tmp/franc-nord-chrome-${Date.now()}`;
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    ...(gpu ? ['--enable-gpu', '--use-angle=metal'] : ['--disable-gpu']),
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1920,1920',
    `http://127.0.0.1:${serverPort}/studio/index.html?episode=${episode}&format=${format}`
  ]);

  try {
    // Attendre que le port CDP de Chrome soit prêt
    let wsUrl = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page' && t.url.includes('/studio/index.html'));
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {
        // retry
      }
    }

    if (!wsUrl) {
      throw new Error('Impossible de connecter Chrome Headless pour le rendu Canvas.');
    }

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let msgId = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(String(ev.data));
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    });

    const cdpEval = (expression) =>
      new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, { resolve, reject });
        ws.send(
          JSON.stringify({
            id,
            method: 'Runtime.evaluate',
            params: { expression, returnByValue: true, awaitPromise: true }
          })
        );
      });

    // Attendre que le studio ait chargé storyboard.json et scenes-custom.js
    for (let i = 0; i < 40; i++) {
      const ready = await cdpEval('Boolean(window.__FRANC_NORD_READY)');
      if (ready?.result?.value === true) break;
      await new Promise((r) => setTimeout(r, 150));
    }

    const verifiedReady = await cdpEval('Boolean(window.__FRANC_NORD_READY)');
    if (!verifiedReady?.result?.value) throw new Error('Studio non chargé : export annulé.');
    const registry = await cdpEval(`import('/episodes/${episode}/scenes-custom.js').then(m=>Object.keys(m.CUSTOM_SCENES))`);
    const missing = storyboard.scenes.filter(s => !registry?.result?.value?.includes(s.id));
    if (missing.length) throw new Error('Scènes manquantes : ' + missing.map(s=>s.id).join(', '));
    await cdpEval('document.fonts.ready');

    // Lancement du pipeline FFmpeg
    const ffArgs = [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', String(fps),
      '-i', '-'
    ];

    if (voiceFile) {
      ffArgs.push('-i', voiceFile, '-af', 'apad', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    }

    ffArgs.push(
      '-c:v', 'h264_videotoolbox',
      '-b:v', '8M',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      outFile
    );

    const ffmpeg = spawn(FFMPEG_BIN, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
    let ffErr = '';
    ffmpeg.stderr.on('data', (chunk) => {
      ffErr += chunk.toString();
    });

    for (let f = 0; f < totalFrames; f++) {
      let t = f / fps;
      if (reel) {
        const clipIndex = Math.min(clips.length - 1, Math.floor(t / 2));
        t = clips[clipIndex].start + t - clipIndex * 2;
      }
      const evalRes = await cdpEval(`
        (() => {
          window.__FRANC_NORD_RENDER_AT(${t.toFixed(4)}, "${format}");
          const c = document.getElementById('broadcastCanvas');
          return c.toDataURL('image/jpeg', 0.92);
        })()
      `);

      if (evalRes?.exceptionDetails) throw new Error('Erreur de scène : ' + JSON.stringify(evalRes.exceptionDetails));
      const dataUrl = evalRes?.result?.value;
      if (!dataUrl || !dataUrl.startsWith('data:image/jpeg;base64,')) {
        throw new Error(`Erreur d'extraction de la frame ${f}`);
      }

      const buf = Buffer.from(dataUrl.slice('data:image/jpeg;base64,'.length), 'base64');
      const canContinue = ffmpeg.stdin.write(buf);
      if (!canContinue) {
        await new Promise((r) => ffmpeg.stdin.once('drain', r));
      }

      if (f % fps === 0 || f === totalFrames - 1) {
        process.stdout.write(`\r   ⏳ Rendu : ${Math.round(((f + 1) / totalFrames) * 100)}% (${f + 1}/${totalFrames} frames)`);
      }
    }

    ffmpeg.stdin.end();
    const exitCode = await new Promise((resolve) => ffmpeg.on('close', resolve));
    if (exitCode !== 0) {
      throw new Error(`FFmpeg a échoué (code ${exitCode}):\n${ffErr}`);
    }

    console.log(`\n✅ Vidéo MP4 générée avec succès : ${outFile}`);
    ws.close();
  } finally {
    chrome.kill('SIGTERM');
    server.close();
  }
}

main().catch((err) => {
  console.error('\n❌ Erreur:', err.message);
  process.exit(1);
});
