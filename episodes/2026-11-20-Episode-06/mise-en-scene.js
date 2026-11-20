import {clamp, lerp, rgba, eInOutQuart, textSprite, drawSprite, rrect, light} from './moteur.js';

export const color = {
  cyan:'#38BDF8', amber:'#F59E0B', gold:'#FFD698', emerald:'#57E0AF',
  rose:'#FF7990', coral:'#FB7185', red:'#F43F5E', violet:'#A78BFA', ice:'#BAE6FD', white:'#F8FAFC', slate:'#B7C6D6', ink:'#030509',
};
export {clamp, lerp, rgba, light};
export const TAU = Math.PI * 2;
export const ease = u => eInOutQuart(clamp(u));
export const reveal = (elapsed, duration = .65) => ease(elapsed / duration);
// Amortissement critique doux (zéro rebond nerveux ni dépassement brusque)
export const spring = t => {
  const u = clamp(t / 1.15);
  return 1 - Math.pow(1 - u, 3);
};

const fonts = [
  new FontFace('Montserrat', 'url(' + new URL('./assets/Montserrat.ttf', import.meta.url) + ')', {weight:'100 900'}),
  new FontFace('IBM Plex Mono', 'url(' + new URL('./assets/IBMPlexMono-Medium.ttf', import.meta.url) + ')', {weight:'500'}),
];
await Promise.all(fonts.map(async font => document.fonts.add(await font.load())));

const courses = new WeakMap();
export function score(scene, acts) {
  if (courses.has(scene)) return courses.get(scene);
  if (!scene.wordTimes?.length) throw new Error(scene.id + ' : repères de voix absents.');
  const markers = acts.map((act, index) => {
    if (index === 0) return {...act, time:0};
    const point = scene.narration.indexOf(act.at);
    if (point < 0) throw new Error(scene.id + ' : repère introuvable « ' + act.at + ' ».');
    const word = scene.wordTimes.find(([position]) => position >= point);
    return {...act, time:word[1]};
  });
  for (let i = 1; i < markers.length; i++) {
    if (markers[i].time <= markers[i - 1].time) throw new Error(scene.id + ' : conduite désordonnée.');
  }
  const length = scene.duration;
  const target = Math.min(28, Math.max(20, Math.ceil(length / 1.65)));
  const words = scene.wordTimes.map(([,time]) => time);
  const cues = new Set(markers.map(mark => mark.time));
  let silent = [];
  const interpolated = [];
  const boundaries = [...markers.map(mark => mark.time), length];
  for (let i=1;i<boundaries.length;i++) {
    let time=boundaries[i-1];
    const end=boundaries[i];
    while (end-time>1.999) {
      const next=words.findLast(t=>t>time+.38 && t<=time+1.999);
      if (next===undefined) {
        time+=1.85;
        silent.push(time);
      } else time=next;
      cues.add(time);
    }
  }
  // Les plans restent sur les mots du script. Si la grille dépasse 28 repères,
  // des impulsions secondaires sont placées entre les mots qui les encadrent.
  if (cues.size > 28) {
    cues.clear();
    silent = [];
    for (const mark of markers) cues.add(mark.time);
    for (let i=1;i<boundaries.length;i++) {
      const start=boundaries[i-1];
      const end=boundaries[i];
      const steps=Math.ceil((end-start)/1.999);
      let previous=start;
      for (let k=1;k<steps;k++) {
        const ideal=lerp(start,end,k/steps);
        const lower=Math.max(previous+.48,end-(steps-k)*1.999);
        const upper=Math.min(end-.48,previous+1.999);
        const targetTime=clamp(ideal,lower,upper);
        const candidates=words.filter(t=>t>=lower && t<=upper && Math.abs(t-targetTime)<.18);
        const word=candidates.reduce((best,t)=>best===undefined||Math.abs(t-targetTime)<Math.abs(best-targetTime)?t:best,undefined);
        const selected=word??targetTime;
        if (word===undefined) interpolated.push(+selected.toFixed(3));
        cues.add(selected);
        previous=selected;
      }
    }
  }
  while (cues.size < target) {
    const sorted = [...cues, length].sort((a,b) => a-b);
    let gap = -1;
    let candidate;
    for (let i = 1; i < sorted.length; i++) {
      const left = sorted[i - 1];
      const right = sorted[i];
      const middle = (left + right) / 2;
      const options = words.filter(t => t > left + .58 && t < right - .48);
      if (right - left <= gap || !options.length) continue;
      candidate = options.reduce((best,t) => Math.abs(t - middle) < Math.abs(best - middle) ? t : best);
      gap = right - left;
    }
    if (candidate === undefined) break;
    cues.add(candidate);
  }
  const timings = [...cues].sort((a,b)=>a-b);
  const maxGap = Math.max(...timings.slice(1).map((t,i)=>t-timings[i]), length-timings.at(-1));
  if (timings.length<20||timings.length>28||maxGap>2.001) {
    throw new Error(scene.id+' : cadence hors limites ('+timings.length+' repères, '+maxGap.toFixed(3)+' s).');
  }
  const result = {markers, timings, maxGap, silent, interpolated};
  courses.set(scene, result);
  return result;
}

export function shot(at, title, note, draw, tint = color.cyan, style = 'bottom', group = null) {
  return {at, title, note, draw, tint, style, group};
}

export function sceneRenderer(acts) {
  const render = args => {
    const {markers, timings} = score(args.scene, acts);
    const {ctx, stage, localTime:t, isVertical:vertical, labelsOff:bare} = args;
    const w = vertical ? 900 : 1600;
    const h = vertical ? 1600 : 900;
    const i = markers.findLastIndex(mark => mark.time <= t);
    const current = markers[i];
    const previous = markers[i - 1];
    const cue = timings.findLastIndex(time => time <= t);
    const beat = t - timings[cue];
    const age = t - current.time;
    const mix = previous ? reveal(age,.48) : 1;
    // Mouvement optique lent et continu sur la scène (aucun saut sur les cues)
    const optical={
      focus:Math.sin(t*.16)*.08,
      distance:1+.025*Math.cos(t*.14),
      travel:Math.sin(t*.12)*.07,
      beam:.5+.5*Math.sin(t*.35),
    };
    currentBeat = beat;
    currentTime = t;
    const d = {ctx,optical,w,h,t,vertical,bare,age,beat,cue,chapter:args.scene.chapterId,
      marks:markers.map(m=>m.time), timings,
      part:i, shotDuration:(markers[i+1]?.time??args.scene.duration)-current.time, beatIndex:cue - timings.indexOf(current.time), scene:args.scene,
      nextCue:timings[cue+1] ?? args.scene.duration, tint:current.tint};
    ctx.save();
    ctx.scale(stage.w / w, stage.h / h);
    const sameGroup = previous && current.group && previous.group === current.group;
    if (sameGroup) {
      current.draw(d);
    } else {
      current.draw(mix<.5?{...d,bare:true}:d);
      if (mix < .999 && previous) {
        ctx.save();
        ctx.globalAlpha *= 1 - mix;
        previous.draw({...d,age:t-previous.time,tint:previous.tint,part:i-1,
          shotDuration:current.time-previous.time,bare:bare||mix>=.5,beatIndex:cue-timings.indexOf(previous.time)});
        ctx.restore();
      }
    }
    if (!bare) {
      if (sameGroup && previous.title === current.title && previous.note === current.note) {
        heading(d,current,1);
      } else {
        const caption = mix < .5 ? previous : current;
        const opacity = previous ? (.35 + .65 * clamp(Math.abs(mix - .5) * 2)) : .35 + .65 * reveal(t,.4);
        heading(d,caption,opacity);
      }
    }
    ctx.restore();
  };
  render.conduite = scene => score(scene, acts);
  return render;
}

export function line(ctx, points, stroke, width = 1) {
  ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function face(ctx, points, fill, border, width = 1) {
  ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

export function label(ctx, text, x, y, {
  size=38, width=900, align='center', tint=color.white, weight=800, mono=false, alpha=1,
}={}) {
  if (!text || alpha < .006) return;
  const sprite = textSprite(text,{size,color:tint,weight:mono?500:weight,
    fam:mono?'IBM Plex Mono, monospace':'Montserrat, sans-serif',spacing:mono?1.6:-.6});
  drawSprite(ctx,sprite,x,y,{align,base:'middle',alpha,scale:Math.min(1,width/sprite.w)});
}

export function heading(d, shot, alpha) {
  if (!shot.title) return;
  const {ctx,w,h,vertical:v} = d;
  const x = v ? 67 : 100;
  const y = shot.style === 'top' ? (v ? 240 : 160) : (v ? 1179 : 747);
  const lines = shot.title.split('|');
  const size = v ? 65 : 76;
  const width = v ? 684 : 1380;
  const top = y - (lines.length-1) * size;
  const shade = ctx.createLinearGradient(0,top-125,0,y+121);
  shade.addColorStop(0,'#03050900');
  shade.addColorStop(.39,'#030509ba');
  shade.addColorStop(.78,'#030509ed');
  shade.addColorStop(1,'#03050900');
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle=shade;
  ctx.fillRect(0,top-125,w,y+121-(top-125));
  line(ctx,[[x,top-56],[x+53,top-56]],shot.tint,3);
  lines.forEach((s,i)=>label(ctx,s,x,top+i*size,{
    size,width,align:'left',tint:i===lines.length-1 && lines.length>1 ? shot.tint : color.white,
    weight:900,
  }));
  label(ctx,shot.note,x,y+(v?64:57),{size:v?21:20,width,mono:true,align:'left',tint:color.slate});
  ctx.restore();
}

export function floor(d, c = color.cyan, warm = false) {
  const {ctx,w,h,vertical:v,t} = d;
  const sky = ctx.createLinearGradient(0,0,w*.55,h);
  sky.addColorStop(0,warm?'#160D13':'#08182B');
  sky.addColorStop(.5,'#07101E');
  sky.addColorStop(1,'#02040A');
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,w,h);
  light(ctx,w*.51,h*.49,h*.51,c,.19);
  if(d.optical) {
    const drift=w*(.5+.26*d.optical.focus);
    const falloff=h*(v?.22:.39);
    light(ctx,drift,h*(v?.42:.45),falloff,c,.14+d.optical.beam*.25);
  }
  const vanX = w * .51 + Math.sin(t*.16)*w*.08;
  const vanY = h * (v?.49:.4);
  ctx.save();
  ctx.strokeStyle=rgba(c,.085);
  ctx.lineWidth=1;
  ctx.beginPath();
  for (let i=-14;i<15;i++) {
    ctx.moveTo(vanX,vanY);
    ctx.lineTo(vanX+i*w*.095,h);
  }
  for (let i=0;i<19;i++) {
    const y=vanY+(h-vanY)*Math.pow(i/18,2.6);
    ctx.moveTo(0,y);
    ctx.lineTo(w,y);
  }
  ctx.stroke();
  ctx.restore();
}

// Temps écoulé depuis le dernier repère vocal : chaque repère fait courir
// un reflet spéculaire sur les verres de saphir (une donnée « s'allume »).
let currentBeat = 9;
let currentTime = 0;
export const beatNow = () => currentBeat;
export const timeNow = () => currentTime;

export function glass(ctx,x,y,w,h,tint,time,draw,{sheen=true,radius}={}) {
  ctx.save();
  ctx.translate(x,y);
  const corner = radius ?? Math.min(19,h*.16);
  for (const offset of [15,8,3]) {
    rrect(ctx,-w/2+offset*.2,-h/2+offset,w,h,corner);
    ctx.fillStyle='#01030950';
    ctx.fill();
  }
  rrect(ctx,-w/2,-h/2,w,h,corner);
  const pane=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
  pane.addColorStop(0,rgba(tint,.28));
  pane.addColorStop(.4,'#102735ec');
  pane.addColorStop(.78,'#071320f5');
  pane.addColorStop(1,rgba(tint,.31));
  ctx.fillStyle=pane;
  ctx.fill();
  ctx.strokeStyle=rgba(tint,.55);
  ctx.lineWidth=1.45;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  const sweep = clamp(currentBeat/.95);
  const ambient = Math.sin(time*.6)*.5+.5;
  const shineX = sheen && sweep<1 ? lerp(-.75,.75,ease(sweep))*w : (ambient-.5)*w;
  const shineA = sheen && sweep<1 ? .42*Math.sin(Math.PI*sweep) : .14;
  const shine=ctx.createLinearGradient(shineX-w*.2,-h*.25,shineX+w*.2,h*.25);
  shine.addColorStop(0,'#FFFFFF00');
  shine.addColorStop(.52,rgba(tint,shineA+.06));
  shine.addColorStop(.56,'#FFFFFF'+Math.round(clamp(shineA)*90).toString(16).padStart(2,'0'));
  shine.addColorStop(1,'#FFFFFF00');
  ctx.fillStyle=shine;
  ctx.fillRect(-w/2,-h/2,w,h);
  ctx.beginPath();
  for (let gx=-w*.48;gx<w/2;gx+=21){ctx.moveTo(gx,-h/2);ctx.lineTo(gx,h/2);}
  for (let gy=-h*.48;gy<h/2;gy+=21){ctx.moveTo(-w/2,gy);ctx.lineTo(w/2,gy);}
  ctx.strokeStyle='#98CBFF17';
  ctx.lineWidth=.6;
  ctx.stroke();
  ctx.restore();
  line(ctx,[[-w*.44,-h/2+1],[w*.44,-h/2+1]],shine,3);
  draw?.();
  ctx.restore();
}

export function lens(ctx,cx,cy,r,draw,tint=color.cyan) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx+5,cy+8,r+7,0,TAU);
  ctx.fillStyle='#00000090';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,TAU);
  ctx.clip();
  ctx.translate(cx,cy);
  ctx.scale(1.45,1.45);
  ctx.translate(-cx,-cy);
  // La loupe redessine la page. Le contrôle des collisions de la page
  // utilise le texte hors de la loupe, dont le contenu est découpé au cercle.
  const priorQA=globalThis.__FN_QA_SKIP;
  globalThis.__FN_QA_SKIP=true;
  try {
    draw();
  } finally {
    globalThis.__FN_QA_SKIP=priorQA;
    ctx.restore();
  }
  ctx.save();
  const rim=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
  rim.addColorStop(0,'#F1FFFF');
  rim.addColorStop(.32,tint);
  rim.addColorStop(.64,'#1E526A');
  rim.addColorStop(.82,'#EFFCFF');
  rim.addColorStop(1,'#0F2637');
  ctx.beginPath();
  ctx.arc(cx,cy,r+2,0,TAU);
  ctx.lineWidth=10;
  ctx.strokeStyle=rim;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx,cy,r-6,3.7,5.1);
  ctx.lineWidth=2;
  ctx.strokeStyle='#DBFBFF95';
  ctx.stroke();
  ctx.restore();
}

export function colorWash(ctx,w,h,opacity=.68) {
  const shade=ctx.createLinearGradient(0,0,0,h);
  shade.addColorStop(0,'#030509aa');
  shade.addColorStop(.23,'#03050900');
  shade.addColorStop(.61,'#03050910');
  shade.addColorStop(1,rgba(color.ink,opacity));
  ctx.fillStyle=shade;
  ctx.fillRect(0,0,w,h);
}

export async function loadImage(name) {
  const image=new Image();
  image.src=new URL('./assets/'+name,import.meta.url);
  await image.decode();
  return image;
}

export function cover(ctx,image,w,h,{zoom=1,x=.5,y=.5}={}) {
  const scale=Math.max(w/image.width,h/image.height)*zoom;
  const iw=image.width*scale;
  const ih=image.height*scale;
  ctx.drawImage(image,(w-iw)*x,(h-ih)*y,iw,ih);
}
