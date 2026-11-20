/**
 * Globe 8K en perspective réelle (caméra orbitale, inclinaison 2.5D) avec
 * atmosphère Rayleigh calculée par shader. La même caméra sert à projeter
 * en JavaScript les arcs, repères, frontières et fleuves : tout reste
 * attaché à ses coordonnées pendant les travellings.
 */
import {C, D2R, TAU, clamp, lerp, light, rgba, trail, arcPts} from './moteur.js';
import {COUNTRIES} from './assets/countries.js';
import {beatNow, timeNow} from './mise-en-scene.js';
import {RIVERS} from './assets/hydrographie.js';

const boundary = await fetch(new URL('./assets/quebec.json', import.meta.url)).then(r => r.json());
const QUEBEC = boundary.coordinates.map(polygon => polygon[0]);

const texture = new Image();
texture.src = new URL('./assets/terre-8k.jpg', import.meta.url).href;
await texture.decode();
if (texture.naturalWidth !== 8192) throw new Error('Texture terrestre 8192 × 4096 requise.');

const surface = document.createElement('canvas');
const gl = surface.getContext('webgl2', {alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true});
if (!gl) throw new Error('WebGL2 indisponible pour le globe.');

const vertexSource = `#version 300 es
in vec2 position;
out vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}`;

const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D earth;
uniform vec2 size;
uniform vec2 center;
uniform float focal;
uniform vec3 eye;
uniform vec3 fwd;
uniform vec3 right;
uniform vec3 up;
uniform float warm;
uniform float night;
uniform vec3 sun;
in vec2 uv;
out vec4 pixel;

const float H = .045;

void main() {
  vec2 p = uv * size;
  vec3 dir = normalize(fwd + (p.x - center.x) / focal * right - (p.y - center.y) / focal * up);
  float b = dot(eye, dir);
  float c = dot(eye, eye) - 1.;
  float disc = b * b - c;
  vec3 skyA = mix(vec3(.30, .74, 1.), vec3(1., .66, .30), warm);
  vec3 skyB = mix(vec3(.05, .22, .70), vec3(.55, .25, .06), warm);
  if (disc < 0. || -b - sqrt(max(disc, 0.)) < 0.) {
    // Rayon qui manque la Terre : diffusion atmosphérique autour du limbe.
    float dmin = sqrt(max(c + 1. - b * b, 0.));
    float s = (dmin - 1.) / H;
    float shell = s < 0. ? 0. : exp(-s * 2.2) * smoothstep(-.05, .08, s);
    float halo = exp(-max(dmin - 1., 0.) * 7.5) * .20;
    vec3 col = mix(skyA, skyB, clamp(s * .55, 0., 1.));
    float sunSide = .55 + .45 * max(0., dot(normalize(eye + dir * -b), sun));
    float a = clamp((shell * .92 + halo) * sunSide * (1. - night * .55), 0., 1.);
    pixel = vec4(col, a);
    return;
  }
  float t = -b - sqrt(disc);
  vec3 n = normalize(eye + dir * t);
  float lat = asin(clamp(n.z, -1., 1.));
  float lon = atan(n.y, n.x);
  vec3 map = texture(earth, vec2(fract(.5 + lon / 6.2831853), .5 - lat / 3.1415927)).rgb;
  float lum = dot(map, vec3(.24, .60, .16));
  float water = smoothstep(-.09, .045, map.b * 1.40 - map.g - .034);
  float diffuse = max(0., dot(n, sun));
  float daylight = mix(.70 + .42 * diffuse, .26 + .22 * diffuse, night);
  vec3 relief = mix(vec3(.14, .25, .27), vec3(.80, .81, .70), pow(lum, .85));
  relief = mix(relief, map, .26);
  relief = mix(relief, relief * vec3(1.32, .98, .62) + vec3(.10, .04, 0.), warm);
  vec3 sea = vec3(.012, .071, .137) + lum * vec3(.025, .155, .245);
  sea = mix(sea, sea * vec3(1.25, .95, .7), warm * .6);
  vec3 col = mix(relief, sea, water) * daylight;
  // Diffusion de Rayleigh : voile bleuté proportionnel au trajet rasant.
  float mu = max(0., dot(n, -dir));
  float path = pow(1. - mu, 3.2);
  col = mix(col, skyA * (.65 + .35 * diffuse), path * .62);
  // Reflet spéculaire de l'océan.
  vec3 hv = normalize(sun - dir);
  col += water * pow(max(0., dot(n, hv)), 260.) * vec3(.55, .70, .85) * (1. - night) * .30;
  pixel = vec4(col, 1.);
}`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}
const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const position = gl.getAttribLocation(program, 'position');
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(position);
const map = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, map);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameterf(gl.TEXTURE_2D, 0x84FE, 8); // anisotropie si disponible
gl.generateMipmap(gl.TEXTURE_2D);
gl.getExtension('EXT_texture_filter_anisotropic');
const U = Object.fromEntries(['size','center','focal','eye','fwd','right','up','warm','night','sun']
  .map(name => [name, gl.getUniformLocation(program, name)]));

/* ── Lieux (longitude, latitude) ───────────────────────────────────── */
export const places = {
  warsaw:[21.01,52.23], lublin:[22.57,51.25], rzeszow:[22.0,50.04], kyiv:[30.52,50.45],
  moscow:[37.62,55.75], bryansk:[34.36,53.24], belarus:[27.56,53.9], riga:[24.11,56.95],
  adazi:[24.33,57.08], kaliningrad:[20.5,54.71], dnipro:[35.04,48.46],
  shenzhen:[114.06,22.55], beijing:[116.41,39.9], berlin:[13.40,52.52],
  antalya:[30.71,36.90], ankara:[32.86,39.93], washington:[-77.04,38.90], nyc:[-74.01,40.71],
  doha:[51.53,25.29], guyane:[-53.13,3.93], caraibes:[-61.5,16.2], reunion:[55.54,-21.12],
  montreal:[-73.57,45.50], quebec:[-71.21,46.81], levis:[-71.17,46.80], beauce:[-70.67,46.12],
  manic:[-68.73,50.64], lg2:[-77.44,53.79], lg4:[-73.55,53.85], ottawa:[-75.70,45.42],
  boston:[-71.06,42.36], albany:[-73.76,42.65], toronto:[-79.38,43.65], vermont:[-72.58,44.26],
  newyorkState:[-74.9,43.0], sanfrancisco:[-122.42,37.77], sacramento:[-121.49,38.58],
};

/* ── Caméra orbitale ───────────────────────────────────────────────── */
const vec = (lon, lat, r = 1) => {
  const a = lon * D2R, b = lat * D2R;
  return [r * Math.cos(b) * Math.cos(a), r * Math.cos(b) * Math.sin(a), r * Math.sin(b)];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const norm = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * view = { lon, lat, alt (altitude caméra en rayons terrestres), tilt (radians,
 * 0 = vue verticale), turn (cap en radians), x, y (fractions de l'écran) }
 */
export function makeCamera(view, w, h) {
  const {lon, lat, alt, tilt = 0, turn = 0, x = .5, y = .5} = view;
  const T = vec(lon, lat);
  const a = lon * D2R, b = lat * D2R;
  const east0 = [-Math.sin(a), Math.cos(a), 0];
  const north0 = [-Math.sin(b) * Math.cos(a), -Math.sin(b) * Math.sin(a), Math.cos(b)];
  const east = add(mul(east0, Math.cos(turn)), mul(north0, -Math.sin(turn)));
  const north = add(mul(north0, Math.cos(turn)), mul(east0, Math.sin(turn)));
  const offset = add(mul(T, Math.cos(tilt)), mul(north, -Math.sin(tilt)));
  const eye = add(T, mul(offset, alt));
  const fwd = norm(sub(T, eye));
  const right = norm(cross(fwd, cross(east, fwd)) ) ;
  const r2 = norm(sub(east, mul(fwd, dot(east, fwd))));
  const up = cross(r2, fwd);
  const focal = Math.max(w, h) * .92;
  const cx = w * x, cy = h * y;
  void right;
  const project = (lo, la, al = 0) => {
    const P = vec(lo, la, 1 + al);
    const q = sub(P, eye);
    const z = dot(q, fwd);
    if (z <= 1e-4) return {x: cx, y: cy, z: -1, vis: false};
    const px = cx + focal * dot(q, r2) / z;
    const py = cy - focal * dot(q, up) / z;
    // Occultation par la Terre
    const dist = Math.hypot(...q);
    const d = mul(q, 1 / dist);
    const bb = dot(eye, d);
    const cc = dot(eye, eye) - 1;
    const disc = bb * bb - cc;
    let vis = true;
    if (disc > 0) {
      const t0 = -bb - Math.sqrt(disc);
      if (t0 > 0 && t0 < dist - 1e-4) vis = false;
    }
    return {x: px, y: py, z: vis ? Math.max(.03, dot(norm(P), mul(d, -1))) : -1, vis};
  };
  // Rayon apparent du disque terrestre (pour les ombres et halos)
  const D = Math.hypot(...eye);
  const radius = focal / Math.sqrt(Math.max(1e-6, D * D - 1));
  const centre = project(0, 0);
  return {eye, fwd, right: r2, up, focal, cx, cy, project, radius, alt, view, centre};
}

const SUN = norm([-.35, .25, .9]);
function sunFor(view) {
  // Soleil placé au-dessus de l'épaule gauche de la caméra.
  const a = (view.lon - 38) * D2R, b = (view.lat + 22) * D2R;
  return [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
}
void SUN;

export function drawEarth(ctx, view0, w, h, {warm = 0, night = 0} = {}) {
  // Dérive orbitale continue : la caméra respire sans jamais se figer.
  const T = timeNow();
  const view = {...view0, lon: view0.lon + .9 * Math.sin(T * .5), lat: view0.lat + .35 * Math.sin(T * .37 + 1),
    alt: view0.alt * (1 + .035 * Math.sin(T * .41))};
  const k = Math.max(1, ctx.getTransform().a);
  const sw = Math.round(w * k), sh = Math.round(h * k);
  if (surface.width !== sw || surface.height !== sh) {
    surface.width = sw;
    surface.height = sh;
  }
  const cam = makeCamera(view, w, h);
  gl.viewport(0, 0, sw, sh);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(U.size, sw, sh);
  gl.uniform2f(U.center, cam.cx * k, cam.cy * k);
  gl.uniform1f(U.focal, cam.focal * k);
  gl.uniform3f(U.eye, ...cam.eye);
  gl.uniform3f(U.fwd, ...cam.fwd);
  gl.uniform3f(U.right, ...cam.right);
  gl.uniform3f(U.up, ...cam.up);
  gl.uniform1f(U.warm, warm);
  gl.uniform1f(U.night, night);
  gl.uniform3f(U.sun, ...sunFor(view));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  ctx.drawImage(surface, 0, 0, w, h);
  // Ping radar au point focal à chaque repère vocal
  const u = clamp(beatNow() / 1.1);
  if (u < 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(C.ice, .32 * (1 - u));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cam.cx, cam.cy, 30 + 150 * Math.sqrt(u), 0, TAU);
    ctx.stroke();
    for (let q = 0; q < 4; q++) {
      const a = q * Math.PI / 2 + u * .6;
      const r0 = 36 + 150 * Math.sqrt(u);
      ctx.beginPath();
      ctx.moveTo(cam.cx + Math.cos(a) * r0, cam.cy + Math.sin(a) * r0);
      ctx.lineTo(cam.cx + Math.cos(a) * (r0 + 14), cam.cy + Math.sin(a) * (r0 + 14));
      ctx.stroke();
    }
    ctx.restore();
  }
  return cam;
}

/** Interpolation de caméra : zoom exponentiel (altitude en log), cap le plus court. */
export function blendView(a, b, u) {
  let dl = b.lon - a.lon;
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  return {
    lon: a.lon + dl * u, lat: lerp(a.lat, b.lat, u),
    alt: Math.exp(lerp(Math.log(a.alt), Math.log(b.alt), u)),
    tilt: lerp(a.tilt || 0, b.tilt || 0, u), turn: lerp(a.turn || 0, b.turn || 0, u),
    x: lerp(a.x ?? .5, b.x ?? .5, u), y: lerp(a.y ?? .5, b.y ?? .5, u),
  };
}

/** Piste de caméra : [[temps, vue], …] avec easing Quart C2-continu. */
export function cameraPath(time, keys) {
  if (time <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, dur] = keys[i];
    const t0 = i === 1 ? keys[0][0] : Math.max(keys[i - 1][0], t1 - (dur ?? (t1 - keys[i - 1][0])));
    if (time <= t1) {
      const u = clamp((time - t0) / Math.max(1e-3, t1 - t0));
      const e = u < .5 ? 8 * u ** 4 : 1 - Math.pow(-2 * u + 2, 4) / 2;
      return blendView(keys[i - 1][1], v1, e);
    }
  }
  return keys[keys.length - 1][1];
}

/* ── Tracés géographiques ──────────────────────────────────────────── */
function strokeRing(ctx, cam, ring, step = 1) {
  let pen = false;
  for (let i = 0; i < ring.length; i += step) {
    const [lo, la] = ring[i];
    const p = cam.project(lo, la);
    if (!p.vis) { pen = false; continue; }
    if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
    pen = true;
  }
}

export function borders(ctx, cam, names, {color = C.ice, alpha = .32, width = 1.1, fill = null} = {}) {
  if (alpha < .01) return;
  ctx.save();
  ctx.lineJoin = 'round';
  for (const name of names) {
    const polys = COUNTRIES[name];
    if (!polys) continue;
    ctx.beginPath();
    for (const poly of polys) strokeRing(ctx, cam, Array.isArray(poly[0][0]) ? poly[0] : poly);
    if (fill) {
      ctx.globalAlpha = alpha * .5;
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.restore();
}

export function quebec(ctx, cam, {alpha = .55, fill = null} = {}) {
  ctx.save();
  ctx.beginPath();
  for (const ring of QUEBEC) strokeRing(ctx, cam, ring);
  if (fill) {
    ctx.globalAlpha = alpha * .28;
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.ice;
  ctx.lineWidth = 1.7;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.restore();
}

export function river(ctx, cam, name, {alpha = .7, color = C.ice, width = 2.6} = {}) {
  if (alpha < .01) return;
  ctx.save();
  ctx.lineWidth = width;
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineJoin = 'round';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  for (const strand of RIVERS[name] || []) strokeRing(ctx, cam, strand);
  ctx.stroke();
  ctx.restore();
}

/* ── Arcs balistiques à tête cométaire ─────────────────────────────── */
const arcCache = new Map();
function arcOf(a, b, height, n = 90) {
  const key = a + '>' + b + '@' + height;
  if (!arcCache.has(key)) arcCache.set(key, arcPts(places[a] || a, places[b] || b, n, height));
  return arcCache.get(key);
}

/**
 * Arc 3D élevé avec ombre portée au sol, tête incandescente et onde de choc.
 * p : progression 0→1 ; after : secondes écoulées depuis l'impact (onde).
 */
export function ballistic(ctx, cam, a, b, p, {color = C.amber, height = .12, after = -1, width = 3, alpha = 1, wave = true} = {}) {
  if (p <= 0 || alpha < .01) return null;
  const pts = arcOf(a, b, height);
  const air = pts.map(q => cam.project(q[0], q[1], q[2]));
  const ground = pts.map(q => cam.project(q[0], q[1], 0));
  trail(ctx, ground, p, {color: '#02060C', width: width * 2.6, alpha: .55 * alpha, head: false, glow: 0});
  trail(ctx, ground, p, {color, width: 1, alpha: .28 * alpha, head: false, glow: 0, dash: [4, 7]});
  const head = trail(ctx, air, p, {color, width, alpha, head: false, glow: 1.4});
  if (head && p < .999 && head.vis) {
    // Queue cométaire : gradient le long des derniers segments
    const n = air.length - 1, f = p * n;
    for (let j = 1; j <= 10; j++) {
      const g = Math.max(0, f - j * .55);
      const i = Math.floor(g), u = g - i;
      const q = air[Math.min(n, i)], r = air[Math.min(n, i + 1)];
      if (!q.vis) continue;
      light(ctx, lerp(q.x, r.x, u), lerp(q.y, r.y, u), width * (7 - j * .5), color, (1 - j / 11) * .55 * alpha);
    }
    light(ctx, head.x, head.y, width * 13, color, .95 * alpha);
    light(ctx, head.x, head.y, width * 3.4, C.white, alpha);
    // Ombre de la tête au sol
    const g = ground[Math.min(n, Math.round(f))];
    if (g?.vis) light(ctx, g.x, g.y, width * 4, '#000000', .0);
  }
  const end = cam.project(...(places[b] || b));
  if (p >= .999 && wave && after >= 0 && end.vis) shock(ctx, end.x, end.y, after, color, alpha);
  return head;
}

export function shock(ctx, x, y, after, color = C.amber, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const u = ((after * .62 + k / 3) % 1);
    if (after < k * .4) continue;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + u * 70, (6 + u * 70) * .62, 0, 0, TAU);
    ctx.strokeStyle = rgba(color, (1 - u) * .78 * alpha);
    ctx.lineWidth = 2.4 * (1 - u) + .6;
    ctx.stroke();
  }
  ctx.restore();
  const flash = Math.exp(-after * 3.2);
  light(ctx, x, y, 90 * flash + 22, color, (.35 + .6 * flash) * alpha);
  light(ctx, x, y, 14, C.white, .8 * alpha);
}

/** Repère ancré : point lumineux + anneau de portée qui respire. */
export function pin(ctx, cam, place, color = C.amber, {alpha = 1, t = 0, r = 6} = {}) {
  const p = cam.project(...(places[place] || place));
  if (!p.vis || alpha < .01) return null;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const pulse = (t * .8) % 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r + pulse * 26, 0, TAU);
  ctx.strokeStyle = rgba(color, (1 - pulse) * .6);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  light(ctx, p.x, p.y, r * 6, color, .55 * alpha);
  light(ctx, p.x, p.y, r * 1.6, C.white, .7 * alpha);
  return p;
}

/** Dôme radar posé sur le globe : anneaux géodésiques + faisceau tournant. */
export function dome(ctx, cam, place, radiusDeg, {color = C.cyan, alpha = 1, t = 0, breach = -1} = {}) {
  if (alpha < .01) return;
  const [lo, la] = places[place] || place;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const ringAt = (frac, h) => {
    const pts = [];
    for (let i = 0; i <= 72; i++) {
      const a = i / 72 * TAU;
      const rr = radiusDeg * frac;
      pts.push(cam.project(lo + Math.cos(a) * rr / Math.cos(la * D2R), la + Math.sin(a) * rr, h));
    }
    return pts;
  };
  const H = radiusDeg * D2R * .55;
  // Voile du dôme
  const base = ringAt(1, 0);
  ctx.beginPath();
  base.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = rgba(color, .07);
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  for (let j = 0; j < 6; j++) {
    const f = Math.cos(j / 6 * Math.PI / 2);
    const h = H * Math.sin(j / 6 * Math.PI / 2);
    const pts = ringAt(f, h);
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = rgba(color, j === 0 ? .65 : .26);
    ctx.lineWidth = j === 0 ? 2 : 1.1;
    ctx.stroke();
  }
  for (let m = 0; m < 12; m++) {
    const a = m / 12 * TAU;
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const s = j / 12 * Math.PI / 2;
      const rr = radiusDeg * Math.cos(s);
      const p = cam.project(lo + Math.cos(a) * rr / Math.cos(la * D2R), la + Math.sin(a) * rr, H * Math.sin(s));
      j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.strokeStyle = rgba(color, .16);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Faisceau radar tournant
  const sweep = t * 1.3;
  const c0 = cam.project(lo, la);
  ctx.beginPath();
  ctx.moveTo(c0.x, c0.y);
  for (let i = 0; i <= 16; i++) {
    const a = sweep - i * .045;
    const p = cam.project(lo + Math.cos(a) * radiusDeg / Math.cos(la * D2R), la + Math.sin(a) * radiusDeg, 0);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(color, .20);
  ctx.fill();
  if (breach >= 0) {
    const u = clamp(breach / .6);
    ctx.strokeStyle = rgba(C.coral, (1 - u) * .9);
    ctx.lineWidth = 4;
    ctx.beginPath();
    base.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }
  ctx.restore();
}

/** Flux de particules le long d'un arc projeté (pipeline Bézier sur le globe). */
export function stream(ctx, cam, a, b, time, {color = C.amber, height = .06, count = 26, speed = .22, alpha = 1, width = 2} = {}) {
  if (alpha < .01 || time <= 0) return 0;
  const pts = arcOf(a, b, height, 120).map(q => cam.project(q[0], q[1], q[2]));
  const n = pts.length - 1;
  let arrivals = 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= alpha;
  trail(ctx, pts, clamp(time * .9), {color, width: 1.2, alpha: .35, head: false, glow: .6});
  for (let i = 0; i < count; i++) {
    const launch = i / count / speed;
    const life = (time - launch) * speed;
    if (life < 0) continue;
    arrivals += Math.floor(life);
    const u = life % 1;
    const f = u * n, k = Math.floor(f), r = f - k;
    const p = pts[k], q = pts[Math.min(n, k + 1)];
    if (!p.vis || !q.vis) continue;
    const x = lerp(p.x, q.x, r), y = lerp(p.y, q.y, r);
    const back = pts[Math.max(0, k - 3)];
    ctx.strokeStyle = rgba(color, .8);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(back.x, back.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    light(ctx, x, y, 10 + width * 3, color, .7);
  }
  ctx.restore();
  return arrivals;
}
