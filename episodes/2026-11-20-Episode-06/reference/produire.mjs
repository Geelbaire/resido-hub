#!/usr/bin/env node
import fs from 'node:fs/promises';
import {createWriteStream,createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {spawn, execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {pipeline} from 'node:stream/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const episode = fileURLToPath(new URL('../',import.meta.url));
const root = path.resolve(episode,'../..');
const urlBase = '/episodes/' + path.basename(episode);
const story = JSON.parse(await fs.readFile(path.join(episode,'storyboard.json'),'utf8'));
const alignment = JSON.parse(await fs.readFile(path.join(episode,'alignment-report.json'),'utf8'));
const mode = process.argv[2] || 'pilot';
const format = process.argv[3] || '16x9';
const pilot = alignment.scenes[0];
const fps = 30;
const type = new Map([['.html','text/html'],['.js','text/javascript'],['.json','application/json'],
  ['.jpg','image/jpeg'],['.ttf','font/ttf'],['.mp4','video/mp4'],['.mp3','audio/mpeg']]);
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ffmpeg = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';

const temporary = await fs.mkdtemp(path.join(tmpdir(),'fn06-rendu-'));
const rawPath = path.join(temporary,'flux.h264');
const raw = ['boards','inspect','playback','texte','frames'].includes(mode) ? null : createWriteStream(rawPath);
let batches = 0;
const server = createServer(async (req,res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (urlPath === '/__frames' && req.method === 'POST' && raw) {
      for await (const chunk of req) {
        if (!raw.write(chunk)) await once(raw,'drain');
      }
      if (++batches % 5 === 0) console.log(`${format} · ${batches} s rendues`);
      res.writeHead(204).end();
      return;
    }
    const local = path.resolve(root,'.'+urlPath);
    if (!local.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const stat = await fs.stat(local);
    const headers = {'Content-Type':type.get(path.extname(local)) || 'application/octet-stream',
      'Content-Length':stat.size, 'Accept-Ranges':'bytes'};
    if (req.method === 'HEAD') {
      res.writeHead(200,headers).end();
      return;
    }
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]),stat.size-1) : stat.size-1;
      if (start > end) {
        res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();
        return;
      }
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      headers['Content-Length'] = end-start+1;
      res.writeHead(206,headers);
      await pipeline(createReadStream(local,{start,end}),res);
    } else {
      res.writeHead(200,headers);
      await pipeline(createReadStream(local),res);
    }
  } catch {
    if (!res.headersSent) res.writeHead(404).end();
    else res.destroy();
  }
});

server.listen(0,'127.0.0.1');
await once(server,'listening');
const base = 'http://127.0.0.1:' + server.address().port;
const profile = path.join(temporary,'profil');
const targetUrl = base + urlBase + '/reference/rendu.html?format=' + format;
const chrome = spawn(chromePath,[
  '--headless=new','--no-first-run','--disable-extensions','--enable-gpu','--use-angle=metal',
  '--autoplay-policy=no-user-gesture-required','--mute-audio',
  '--remote-debugging-port=0',`--user-data-dir=${profile}`,
  targetUrl,
],{stdio:'ignore'});
let socket;

async function connect() {
  for (let i=0;i<120;i++) {
    await new Promise(resolve => setTimeout(resolve,180));
    try {
      const [port] = (await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n');
      const tabs = await fetch('http://127.0.0.1:' + port + '/json/list').then(r => r.json());
      const address = tabs.find(tab => tab.type === 'page' && tab.url.startsWith(base))?.webSocketDebuggerUrl;
      if (!address) continue;
      socket = new WebSocket(address);
      await once(socket,'open');
      break;
    } catch {}
  }
  if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('Chrome inaccessible');
  let request = 0;
  const pending = new Map();
  socket.onmessage = ({data}) => {
    const message = JSON.parse(data);
    const promise = pending.get(message.id);
    if (!promise) return;
    pending.delete(message.id);
    if (message.error || message.result.exceptionDetails) {
      const detail = message.result?.exceptionDetails;
      promise.reject(new Error(detail?.exception?.description || detail?.text || message.error?.message));
    } else {
      promise.resolve(message.result.result.value);
    }
  };
  socket.onclose = () => {
    for (const promise of pending.values()) promise.reject(new Error('Chrome fermé pendant le rendu'));
  };
  return expression => new Promise((resolve,reject) => {
    const id = ++request;
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method:'Runtime.evaluate',
      params:{expression,awaitPromise:true,returnByValue:true}}));
  });
}

function ff(args) {
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});
}

async function makeBoards(evaluate) {
  const out = path.join(episode,'controle',format);
  await fs.mkdir(out,{recursive:true});
  const courses = await evaluate('window.conduites()');
  const choice = process.argv[4];
  const selected = choice === 'pilot' ? [pilot] : choice ?
    alignment.scenes.filter(scene => scene.id === choice) : alignment.scenes;
  for (const sc of selected) {
    const dir = path.join(out,sc.id);
    await fs.mkdir(dir,{recursive:true});
    const frames = 12;
    const course = courses.find(item=>item.id===sc.id);
    const points = course.plans.map((mark,i)=> {
      const end = course.plans[i+1]?.time ?? course.duration;
      return mark.time + Math.min(1.7,(end-mark.time)*.63);
    });
    while (points.length<frames) {
      const edges=[0,...points,course.duration];
      const distances=edges.slice(1).map((end,i)=>(end-edges[i]));
      const largest=distances.indexOf(Math.max(...distances));
      points.splice(largest,0,(edges[largest]+edges[largest+1])/2);
    }
    for (let i=0;i<frames;i++) {
      const t = sc.start + points[i];
      const data = await evaluate(`window.renderAt(${t}); document.querySelector('canvas').toDataURL('image/jpeg',.87)`);
      await fs.writeFile(path.join(dir,`vue-${String(i).padStart(2,'0')}.jpg`),Buffer.from(data.split(',')[1],'base64'));
    }
    const strip = path.join(out,`${sc.id}_${format}_PLANCHE.jpg`);
    const filter = format === '16x9' ? 'scale=416:-1,tile=3x4:padding=5:margin=5:color=0x0a1220'
      : 'scale=230:-1,tile=6x2:padding=5:margin=5:color=0x0a1220';
    ff(['-i',path.join(dir,'vue-%02d.jpg'),'-vf',filter,'-frames:v','1','-q:v','2',strip]);
    if ([0,1,2,4,5,6,8,10,12].includes(alignment.scenes.indexOf(sc))) {
      const geo = path.join(dir,'sans-etiquettes');
      await fs.mkdir(geo,{recursive:true});
      for (let i=0;i<frames;i++) {
        const t=sc.start+points[i];
        const data = await evaluate(`window.renderAt(${t},true); document.querySelector('canvas').toDataURL('image/jpeg',.85)`);
        await fs.writeFile(path.join(geo,`vue-${String(i).padStart(2,'0')}.jpg`),Buffer.from(data.split(',')[1],'base64'));
      }
      ff(['-i',path.join(geo,'vue-%02d.jpg'),'-vf',filter,'-frames:v','1','-q:v','2',
        path.join(out,`${sc.id}_${format}_SANS-ETIQUETTES.jpg`)]);
    }
    console.log(`Planche ${format} · ${sc.id}`);
  }
}

async function makeVideo(evaluate) {
  const slice = mode === 'slice';
  const excerpt = mode === 'excerpt';
  const restricted = slice || excerpt;
  const start = restricted ? Number(process.argv[4]) : mode === 'pilot' ? pilot.start : 0;
  const duration = restricted ? Number(process.argv[5]) - start :
    mode === 'pilot' ? pilot.end-pilot.start : story.totalDurationSeconds;
  if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0 || start < 0 ||
      (restricted && !process.argv[6])) throw new Error('Plage de rendu invalide');
  const count = Math.ceil(duration * fps - 1e-5);
  const result = await evaluate(`window.encode(${JSON.stringify({
    start,count,fps,bitrate:12_000_000,url:'/__frames',
  })})`);
  raw.end();
  await once(raw,'finish');
  const framesOut = result;
  console.log(`${framesOut} images ${format} en H.264`);
  const output = mode === 'pilot' ? `controle/Pilote-Ouverture-${format}.mp4` : `Franc-Nord-Episode-06-${format}.mp4`;
  const staging = path.join(temporary,'sortie.mp4');
  if (slice) {
    ff(['-fflags','+genpts','-r',String(fps),'-f','h264','-i',rawPath,
      '-map','0:v:0','-an','-c:v','copy','-movflags','+faststart',staging]);
    await fs.copyFile(staging,path.resolve(process.argv[6]));
    console.log(`Segment rendu · ${start}–${start+duration} s`);
    return;
  }
  const chapters = mode === 'full' ? ['-i',path.join(episode,'chapitres.ffmeta'),'-map_chapters','2'] : [];
  ff(['-fflags','+genpts','-r',String(fps),'-f','h264','-i',rawPath,
    '-ss',start.toFixed(3),'-i',path.join(episode,'voix.mp3'),
    ...chapters,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k',
    '-af','apad','-t',(count/fps).toFixed(6),'-movflags','+faststart',staging]);
  const destination = excerpt ? path.resolve(process.argv[6]) : path.join(episode,output);
  const pending = destination + '.part';
  try {
    await fs.copyFile(staging,pending);
    await fs.rename(pending,destination);
  } finally {
    await fs.rm(pending,{force:true});
  }
  console.log(`Livré · ${destination}`);
}

try {
  const evaluate = await connect();
  let ready = false;
  for (let i=0;i<80;i++) {
    ready = await evaluate('window.renderFailure || typeof window.renderAt === "function"');
    if (typeof ready === 'string') throw new Error(ready);
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve,150));
  }
  if (!ready) throw new Error('Chargement du plateau impossible');
  const missing = await evaluate('window.conduites(); [...(globalThis.__FN_MISSING_CUES||[])]');
  if (missing.length) console.log('REPÈRES INTROUVABLES :\n  ' + missing.join('\n  '));
  if (mode === 'frames') {
    // Vues ponctuelles : node produire.mjs frames 16x9 t1,t2,… [dossier]
    const out = path.resolve(process.argv[5] || path.join(episode,'controle','vues'));
    await fs.mkdir(out,{recursive:true});
    for (const t of process.argv[4].split(',').map(Number)) {
      const t0 = Date.now();
      const data = await evaluate(`window.renderAt(${t}); document.querySelector('canvas').toDataURL('image/jpeg',.88)`);
      const file = path.join(out,`${format}-${t.toFixed(2)}.jpg`);
      await fs.writeFile(file,Buffer.from(data.split(',')[1],'base64'));
      console.log(file, (Date.now()-t0)+' ms');
    }
  } else if (mode === 'inspect') {
    const courses = await evaluate('window.conduites()');
    for (const course of courses) console.log(course.id, course.timings.length, course.maxGap, course.silent);
    await fs.mkdir(path.join(episode,'controle'),{recursive:true});
    await fs.writeFile(path.join(episode,'controle','conduites.json'),JSON.stringify(courses,null,2)+'\n');
  } else if (mode === 'texte') {
    const records = await evaluate('window.controleTexte()');
    const out=path.join(episode,'controle','texte-'+format+'.json');
    await fs.writeFile(out,JSON.stringify(records)+'\n');
    console.log(records.reduce((n,r)=>n+r.samples.length,0)+' contrôles typographiques · '+format);
  } else if (mode === 'playback') {
    const result = await evaluate(`(async () => {
      const video = document.createElement('video');
      video.muted = true;
      video.src = '../controle/Pilote-Ouverture-${format}.mp4';
      video.playsInline = true;
      video.controls = true;
      video.style.maxHeight = '98vh';
      document.body.replaceChildren(video);
      const ended = new Promise((resolve, reject) => {
        video.addEventListener('ended', resolve, {once:true});
        video.addEventListener('error', () => reject(new Error(video.error.message)), {once:true});
        setTimeout(() => reject(new Error('Lecture pilote suspendue')), 55000);
      });
      await video.play();
      await ended;
      const quality = video.getVideoPlaybackQuality();
      return {duration:video.duration, time:video.currentTime, width:video.videoWidth,
        height:video.videoHeight, ended:video.ended, played:video.played.end(0),
        displayedFrames:quality.totalVideoFrames-quality.droppedVideoFrames,
        droppedFrames:quality.droppedVideoFrames};
    })()`);
    if (!result.ended || result.displayedFrames < 1000) throw new Error(JSON.stringify(result));
    console.log(JSON.stringify(result));
  } else if (mode === 'boards') await makeBoards(evaluate);
  else await makeVideo(evaluate);
} finally {
  socket?.close();
  chrome.kill();
  raw?.destroy();
  server.closeAllConnections();
  server.close();
  await new Promise(resolve => setTimeout(resolve,300));
  await fs.rm(temporary,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
