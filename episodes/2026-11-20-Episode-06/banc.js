/**
 * Banc-titre d'inspection optique : documents en perspective 2.5D inclinée,
 * loupe circulaire ctx.clip() × 1,45, ratures en direct et tampons.
 */
import {light, mono, kZoom, textSprite} from './moteur.js';
import {color, clamp, ease, lerp, rgba, line, face, label, lens, floor, colorWash, TAU} from './mise-en-scene.js';

function paper(ctx, x, y, w, h, angle, skew, dark) {
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.transform(1, 0, skew, 1, 0, 0);
  for (let j = 8; j >= 1; j--) {
    ctx.fillStyle = 'rgba(0,0,0,.10)';
    ctx.fillRect(-w / 2 + j * 1.5, -h / 2 + j * 3, w, h);
  }
  const body = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  body.addColorStop(0, dark ? '#1F3B52' : '#FBF7EA');
  body.addColorStop(.4, dark ? '#132A3E' : '#EEE9D8');
  body.addColorStop(1, dark ? '#0B1C2F' : '#D2D3C2');
  ctx.fillStyle = body;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = dark ? '#5CBAD5' : '#FFFBEA';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
}

/**
 * Document officiel avec ligne ciblée.
 * rows : textes ; target : index de la ligne ; words : mots raturés en direct ;
 * strike : 0→1 ; stamp : secondes depuis le tampon (< 0 = absent).
 */
export function draft(d, {
  heading, kind, rows, target = 2, words = [], strike = 0, stamp = -1, stampText = '', stampTint = color.red,
  lensT = 0, tint = color.emerald, dark = false, layout = 'center', seal = '',
}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  floor(d, tint, !dark);
  const pw = v ? 640 : 700, ph = v ? 760 : 500;
  const px = v ? w * .5 : (layout === 'left' ? w * .4 : w * .5), py = v ? h * .41 : h * .405;
  const angle = -.045, skew = .07;
  const ink = dark ? '#E2F6F9' : '#13263A', minor = dark ? '#A5BCC6' : '#4A5F72';
  const margin = pw * .09;
  const rowH = ph * (v ? .085 : .1);
  const first = -ph / 2 + ph * (v ? .3 : .33);
  const draw = () => {
    ctx.save();
    paper(ctx, px, py, pw, ph, angle, skew, dark);
    ctx.fillStyle = dark ? '#3D7989' : '#C9D3C4';
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph * .12);
    if (!bare) {
      label(ctx, kind, -pw / 2 + margin, -ph / 2 + ph * .06, {size: v ? 18 : 17, mono: true, align: 'left', width: pw * .8, tint: ink});
      label(ctx, heading, -pw / 2 + margin, -ph / 2 + ph * (v ? .19 : .21), {size: v ? 38 : 36, align: 'left', width: pw * .82, tint: ink, weight: 900});
    }
    line(ctx, [[-pw / 2 + margin, -ph / 2 + ph * .25], [pw / 2 - margin, -ph / 2 + ph * .25]], minor, 1.6);
    rows.forEach((text, i) => {
      const yy = first + i * rowH + (words.length && i > target ? rowH * .75 : 0);
      if (i === target) {
        ctx.fillStyle = rgba(tint, .22);
        ctx.fillRect(-pw / 2 + margin - 8, yy - rowH * .62, (pw - 2 * margin + 16) * ease(clamp(lensT * 1.5)), rowH * (words.length ? 1.6 : .76));
      }
      if (bare) return;
      if (i === target && words.length) {
        // Article énergétique : mots raturés un à un, en direct
        label(ctx, text, -pw / 2 + margin, yy - rowH * .3, {size: v ? 22 : 21, align: 'left', width: pw * .8, tint: ink, weight: 700});
        let x = -pw / 2 + margin;
        const size = v ? 30 : 28;
        words.forEach((word, k) => {
          const S = textSprite(word, {size, weight: 900}).w + 8;
          const local = clamp(strike * words.length - k);
          const fade = 1 - .65 * ease(clamp(local * 1.4 - .3));
          label(ctx, word, x, yy + rowH * .55, {size, align: 'left', width: S, tint: ink, weight: 900, alpha: fade});
          if (local > 0) {
            line(ctx, [[x - 4, yy + rowH * .55], [x - 4 + (S - 8) * ease(local), yy + rowH * .55]], color.red, 4);
            if (local < 1) {
              ctx.fillStyle = color.red;
              ctx.fillRect(x - 4 + (S - 8) * ease(local), yy + rowH * .55 - size * .55, 3, size * 1.1);
            }
          }
          x += S + size * .3;
        });
      } else {
        label(ctx, text, -pw / 2 + margin, yy, {size: v ? 22 : 21, align: 'left', width: pw * .82, tint: i === target ? ink : minor, weight: i === target ? 800 : 600});
      }
      line(ctx, [[-pw / 2 + margin, yy + rowH * .46], [pw / 2 - margin, yy + rowH * .46]], rgba(minor, .25), .8);
    });
    // Code-barres et pagination
    ctx.fillStyle = minor;
    for (let i = 0; i < 60; i++) if ((i * i + 7 * i) % 13 < 6) ctx.fillRect(pw * .2 + i * pw * .0034, ph * .4, i % 3 ? 1 : 2, ph * .05);
    ctx.restore();
  };
  draw();
  // Tampon officiel
  if (stamp >= 0 && !bare) {
    const k = clamp(stamp / .28);
    const s = lerp(2.2, 1, ease(k));
    ctx.save();
    ctx.translate(px + (v ? 60 : 170), py + ph * (v ? .3 : .31));
    ctx.rotate(-.16);
    ctx.scale(s, s);
    ctx.globalAlpha *= clamp(k * 2) * .92;
    const tw = Math.min(pw * .8, stampText.length * 17 + 60);
    ctx.strokeStyle = stampTint;
    ctx.lineWidth = 4;
    ctx.strokeRect(-tw / 2, -32, tw, 64);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-tw / 2 + 7, -25, tw - 14, 50);
    label(ctx, stampText, 0, 0, {size: 28, tint: stampTint, weight: 900, width: tw - 30});
    ctx.restore();
    if (stamp < .6) light(ctx, px, py, 260 * (1 - stamp / .6), stampTint, .3 * (1 - stamp / .6));
  }
  // Loupe optique : glisse le long de l'article ciblé
  if (lensT > 0) {
    const r = v ? 118 : 112;
    const u = ease(clamp(lensT));
    const roam = lensT > 1 ? Math.sin((lensT - 1) * 1.6) * pw * .14 : 0;
    const local = [lerp(-pw * .32, pw * .08, u) + roam + Math.sin(t * .7) * 8, first + target * rowH + (words.length ? rowH * .4 : 8)];
    // Coordonnées écran du point local (rotation + cisaillement)
    const lx = local[0] + skew * local[1], ly = local[1];
    const sx = px + lx * Math.cos(angle) - ly * Math.sin(angle);
    const sy = py + lx * Math.sin(angle) + ly * Math.cos(angle);
    const cy = sy + (1 - u) * 60;
    ctx.save();
    ctx.globalAlpha *= clamp(lensT * 3);
    lens(ctx, sx, cy, r, draw, tint);
    line(ctx, [[sx + r * .74, cy + r * .68], [sx + r * 1.25, cy + r * 1.15]], '#BDDCE59A', 10);
    line(ctx, [[sx + r * .77, cy + r * .67], [sx + r * 1.25, cy + r * 1.1]], rgba(tint, .7), 2.4);
    ctx.restore();
  }
  if (seal && !bare) mono(ctx, seal, v ? w * .5 : px, v ? h * .41 + ph / 2 + 70 : py + ph / 2 + 52, {size: 16, color: color.slate, spacing: 3, cursor: false});
  colorWash(ctx, w, h, .9);
}

/**
 * Trois dossiers confidentiels en éventail ; la loupe inspecte le dossier
 * focus (0, 1, 2 — fractionnaire pendant les déplacements).
 */
export function files(d, {names, details = [], focus = 0, open = 1, tint = color.cyan, source = ''}) {
  const {ctx, w, h, t, vertical: v, bare} = d;
  floor(d, tint);
  const fw = v ? 560 : 400, fh = v ? 270 : 330;
  const layout = names.map((_, i) => v ?
    {x: w * .5 + (i - 1) * 26, y: h * (.17 + i * .17), a: (i - 1) * .02} :
    {x: w * (.24 + i * .26), y: h * .38 + Math.abs(i - 1) * 16, a: (i - 1) * .07});
  const draw = () => {
    names.forEach((name, i) => {
      const L = layout[i];
      const rise = ease(clamp(open * 3 - i));
      ctx.save();
      ctx.translate(L.x, L.y + (1 - rise) * 80);
      ctx.rotate(L.a);
      ctx.transform(1, 0, -.06, 1, 0, 0);
      ctx.globalAlpha *= rise;
      // Onglet + chemise cartonnée
      face(ctx, [[-fw / 2, -fh / 2 - 26], [-fw / 2 + 150, -fh / 2 - 26], [-fw / 2 + 172, -fh / 2], [-fw / 2, -fh / 2]], '#C9A36A');
      ctx.fillStyle = '#E4C389';
      ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.fillStyle = '#F7F2E3';
      ctx.fillRect(-fw / 2 + 18, -fh / 2 + 16, fw - 36, fh - 32);
      ctx.strokeStyle = '#8A6B3A';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);
      if (!bare) {
        label(ctx, 'DOSSIER ' + (i + 1), -fw / 2 + 12, -fh / 2 - 12, {size: 15, mono: true, align: 'left', width: 140, tint: '#3B2A12'});
        label(ctx, name, -fw / 2 + 36, -fh / 2 + 52, {size: v ? 30 : 27, align: 'left', width: fw - 72, tint: '#13263A', weight: 900});
        (details[i] || []).forEach((line2, k) => label(ctx, line2, -fw / 2 + 36, -fh / 2 + 100 + k * 34,
          {size: v ? 20 : 19, align: 'left', width: fw - 72, tint: '#4A5F72', weight: 600}));
      }
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = 'rgba(74,95,114,.25)';
        ctx.fillRect(-fw / 2 + 36, fh / 2 - 90 + k * 16, (fw - 90) * (.5 + ((k * 37 + i * 13) % 40) / 100), 5);
      }
      ctx.restore();
    });
  };
  draw();
  const k = clamp(focus, 0, names.length - 1);
  const i0 = Math.floor(k), i1 = Math.min(names.length - 1, i0 + 1), u = ease(k - i0);
  const fx = lerp(layout[i0].x, layout[i1].x, u), fy = lerp(layout[i0].y, layout[i1].y, u);
  if (open > .4) {
    const r = v ? 130 : 120;
    const lx = fx + Math.sin(t * .8) * 10, ly = fy - fh * .14 + Math.cos(t * .6) * 6;
    lens(ctx, lx, ly, r, draw, tint);
    line(ctx, [[lx + r * .74, ly + r * .68], [lx + r * 1.25, ly + r * 1.15]], '#BDDCE59A', 10);
  }
  if (source && !bare) mono(ctx, source, v ? w * .5 : w * .5, v ? h * .635 : h * .66 - 20, {size: 16, color: tint, spacing: 3, cursor: false});
  colorWash(ctx, w, h, .9);
}

/** Tampon flottant hors document (« REJETÉ PAR MOSCOU »…). */
export function slam(ctx, text, x, y, age, tint = color.red, size = 44) {
  if (age < 0) return;
  kZoom(ctx, text, x, y, {t: clamp(age / .35), from: 2.2, size, weight: 900, color: tint, align: 'center', base: 'middle'});
}
