// Core helpers: math, deterministic randomness, noise, colour, canvases, 2.5D camera.
'use strict';
const W = 1920, H = 1080;
const BAR = 2.5, BEAT = 0.625;
const TAU = Math.PI * 2;
const F = 1000; // focal reference depth for the 2.5D camera
const LB = 104; // letterbox bar height (top and bottom)
const Scenes = {};

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const ss = (a, b, x) => smooth(inv(a, b, x));
const fract = (x) => x - Math.floor(x);
const Ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
// pulse that rises over `a` seconds then decays over `d` seconds after time t0
const pulse = (t, t0, a, d) => (t < t0 ? 0 : t < t0 + a ? (t - t0) / a : Math.exp(-(t - t0 - a) / d));
// keyframe interpolation: keys = [[t, v], ...] with smoothstep between
function kf(keys, t, ease = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      const u = ease((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((v, j) => lerp(v, v1[j], u));
      return lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// stateless hash -> [0,1)
function h1(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
const h2 = (a, b) => h1(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));

const Noise = (() => {
  const perm = new Uint8Array(512);
  const r = mulberry32(90210);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = [1, -1, 1, -1, 1, -1, 0, 0], gy = [1, 1, -1, -1, 0, 0, 1, -1];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  function n2(x, y) {
    const X = Math.floor(x), Y = Math.floor(y);
    const xf = x - X, yf = y - Y;
    const xi = X & 255, yi = Y & 255;
    const aa = perm[perm[xi] + yi] & 7, ab = perm[perm[xi] + yi + 1] & 7;
    const ba = perm[perm[xi + 1] + yi] & 7, bb = perm[perm[xi + 1] + yi + 1] & 7;
    const u = fade(xf), v = fade(yf);
    const x1 = lerp(gx[aa] * xf + gy[aa] * yf, gx[ba] * (xf - 1) + gy[ba] * yf, u);
    const x2 = lerp(gx[ab] * xf + gy[ab] * (yf - 1), gx[bb] * (xf - 1) + gy[bb] * (yf - 1), u);
    return lerp(x1, x2, v) * 0.7071; // ~[-1,1]
  }
  function fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
    let s = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { s += a * n2(x * f, y * f); n += a; a *= gain; f *= lac; }
    return s / n;
  }
  const n1 = (x, seed = 0) => n2(x, seed * 17.13 + 0.5);
  return { n2, fbm, n1 };
})();

// ---------- colour ----------
function hex(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const C = (c) => (typeof c === 'string' ? hex(c) : c);
function rgba(c, a = 1) { c = C(c); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function mix(a, b, t) { a = C(a); b = C(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function mixS(a, b, t, al = 1) { return rgba(mix(a, b, t), al); }

// ---------- canvases ----------
function mk(w, h, opts) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  c.ctx = c.getContext('2d', opts);
  return c;
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c, a]) => g.addColorStop(o, rgba(c, a === undefined ? 1 : a)));
  return g;
}
function rgrad(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c, a]) => g.addColorStop(o, rgba(c, a === undefined ? 1 : a)));
  return g;
}

// ---------- 2.5D camera ----------
// A layer point authored at screen position (x,y) for a camera at rest, placed at depth z.
// cam = {x, y, z, roll, zoom}; cam.x/cam.y are pixel shifts at the focal plane (z = F).
function proj(cam, x, y, z) {
  const s = (z / (z - cam.z)) * (cam.zoom || 1);
  return [W / 2 + (x - W / 2 - (cam.x * F) / z) * s, H / 2 + (y - H / 2 - (cam.y * F) / z) * s, s];
}
function drawL(ctx, cam, img, x, y, z, alpha = 1) {
  const [sx, sy, s] = proj(cam, x, y, z);
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, img.width * s, img.height * s);
  ctx.globalAlpha = 1;
}
// Draw something in the local coordinates of a depth plane.
function withPlane(ctx, cam, z, fn) {
  const [sx, sy, s] = proj(cam, 0, 0, z);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(s, s);
  fn(ctx, s);
  ctx.restore();
}
function shake(t, amt, freq = 23) {
  return [Noise.n1(t * freq, 1) * amt, Noise.n1(t * freq, 7) * amt];
}
