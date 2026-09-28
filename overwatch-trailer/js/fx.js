// Visual effects: glows, light rays, flares, particles, energy effects, post-processing, typography.
'use strict';

// ---------- glow sprites ----------
const _glowCache = new Map();
function glowSprite(col, hard = 0) {
  const key = String(C(col)) + '|' + hard;
  let s = _glowCache.get(key);
  if (s) return s;
  s = mk(256, 256);
  const c = C(col);
  const g = s.ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  if (hard) {
    g.addColorStop(0, rgba([255, 255, 255], 1));
    g.addColorStop(0.12, rgba(c, 1));
    g.addColorStop(0.35, rgba(c, 0.35));
    g.addColorStop(1, rgba(c, 0));
  } else {
    g.addColorStop(0, rgba(c, 1));
    g.addColorStop(0.2, rgba(c, 0.55));
    g.addColorStop(0.5, rgba(c, 0.15));
    g.addColorStop(1, rgba(c, 0));
  }
  s.ctx.fillStyle = g;
  s.ctx.fillRect(0, 0, 256, 256);
  _glowCache.set(key, s);
  return s;
}
function glow(ctx, x, y, r, col, a = 1, hard = 0) {
  if (a <= 0.003 || r <= 0.5) return;
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glowSprite(col, hard), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = op;
}
// stroke a polyline with a glowing look (wide faint + mid + hot core)
function glowLine(ctx, pts, col, w, a = 1, core = [255, 255, 255]) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
  [[w * 4, 0.08], [w * 2, 0.18], [w, 0.5]].forEach(([lw, al]) => { path(); ctx.strokeStyle = rgba(col, al * a); ctx.lineWidth = lw; ctx.stroke(); });
  path(); ctx.strokeStyle = rgba(core, 0.85 * a); ctx.lineWidth = Math.max(1, w * 0.35); ctx.stroke();
  ctx.restore();
}

// ---------- light ----------
function godRays(ctx, x, y, col, a, len = 1800, n = 14, seed = 1, spread = Math.PI * 2, dir = Math.PI / 2, t = 0) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const ang = dir - spread / 2 + spread * r() + Noise.n1(t * 0.1 + i, 3) * 0.05;
    const wdt = 0.02 + r() * 0.07;
    const al = a * (0.25 + 0.75 * r()) * (0.6 + 0.4 * Noise.n1(t * 0.4 + i * 3.1, 5));
    const L = len * (0.6 + 0.5 * r());
    const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
    g.addColorStop(0, rgba(col, al * 0.5));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang - wdt) * L, y + Math.sin(ang - wdt) * L);
    ctx.lineTo(x + Math.cos(ang + wdt) * L, y + Math.sin(ang + wdt) * L);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function lensFlare(ctx, x, y, a, col = [255, 200, 140], scale = 1) {
  if (a <= 0) return;
  glow(ctx, x, y, 420 * scale, col, 0.5 * a);
  glow(ctx, x, y, 140 * scale, [255, 255, 255], 0.9 * a, 1);
  // anamorphic streak
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x - 1100 * scale, 0, x + 1100 * scale, 0);
  g.addColorStop(0, rgba([80, 140, 255], 0));
  g.addColorStop(0.5, rgba([170, 210, 255], 0.55 * a));
  g.addColorStop(1, rgba([80, 140, 255], 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 1100 * scale, y - 3 * scale, 2200 * scale, 6 * scale);
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x - 700 * scale, y - 12 * scale, 1400 * scale, 24 * scale);
  ctx.restore();
  // ghosts along the axis through the centre
  const dx = W / 2 - x, dy = H / 2 - y;
  [[0.5, 40, [120, 255, 180]], [0.8, 22, [255, 160, 90]], [1.25, 70, [110, 150, 255]], [1.6, 30, [255, 120, 200]]].forEach(([k, r, c]) => {
    glow(ctx, x + dx * k * 2, y + dy * k * 2, r * scale, c, 0.22 * a);
  });
}

// ---------- particles (stateless: position is a pure function of time) ----------
function rain(ctx, t, n, a, opts = {}) {
  const { speed = 2600, len = 38, angle = 0.18, col = [200, 215, 255], seed = 11, x0 = -200, x1 = W + 200 } = opts;
  ctx.save();
  ctx.strokeStyle = rgba(col, a);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const depth = 0.35 + h1(i * 7 + seed) * 0.65;
    const sp = speed * depth;
    const x = x0 + h1(i * 13 + seed) * (x1 - x0);
    const y = ((h1(i * 3 + seed) * (H + 300) + t * sp) % (H + 300)) - 150;
    const xx = x + y * angle;
    ctx.globalAlpha = 0.25 + depth * 0.6;
    ctx.lineWidth = 0.6 + depth * 1.4;
    ctx.beginPath();
    ctx.moveTo(xx, y);
    ctx.lineTo(xx - len * depth * angle, y - len * depth);
    ctx.stroke();
  }
  ctx.restore();
}
function snow(ctx, t, n, a, opts = {}) {
  const { speed = 70, col = [255, 255, 255], seed = 5, size = 3.2, wind = 30 } = opts;
  ctx.save();
  ctx.fillStyle = rgba(col, 1);
  for (let i = 0; i < n; i++) {
    const d = 0.3 + h1(i * 5 + seed) * 0.7;
    const y = ((h1(i * 9 + seed) * (H + 100) + t * speed * d * 1.3) % (H + 100)) - 50;
    const x = (((h1(i * 11 + seed) * (W + 200) + t * wind * d + Math.sin(t * 0.8 + i) * 25 * d) % (W + 200)) + W + 200) % (W + 200) - 100;
    ctx.globalAlpha = a * (0.3 + 0.7 * d);
    ctx.beginPath();
    ctx.arc(x, y, size * d, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
function petals(ctx, t, n, a, opts = {}) {
  const { seed = 3, cols = [[255, 183, 210], [255, 214, 230], [250, 150, 190]], wind = 140, fall = 60, size = 7 } = opts;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const d = 0.35 + h1(i * 5 + seed) * 0.9;
    const x = ((h1(i * 11 + seed) * (W + 400) + t * wind * d + Math.sin(t * 1.2 + i) * 40) % (W + 400)) - 200;
    const y = ((h1(i * 17 + seed) * (H + 200) + t * fall * d + Math.cos(t * 0.9 + i * 2) * 30) % (H + 200)) - 100;
    const rot = t * (1 + h1(i) * 3) + i;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(t * 2.3 + i)));
    ctx.globalAlpha = a * (0.5 + 0.5 * Math.min(1, d));
    ctx.fillStyle = rgba(cols[i % cols.length]);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * d, size * 0.6 * d, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function motes(ctx, t, n, a, col = [255, 220, 170], seed = 21, size = 2.5, rise = 18) {
  for (let i = 0; i < n; i++) {
    const d = 0.3 + h1(i * 3 + seed) * 0.7;
    const x = (h1(i * 7 + seed) * W + Math.sin(t * 0.3 + i) * 40 + t * 8 * d) % W;
    const y = (((h1(i * 13 + seed) * H - t * rise * d) % H) + H) % H;
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + h1(i) * 3) + i);
    glow(ctx, x, y, size * 5 * d, col, a * tw * d);
  }
}
function embers(ctx, t, n, a, opts = {}) {
  const { seed = 31, col = [255, 140, 60], rise = 120, spread = W, y0 = H, x0 = 0, size = 3 } = opts;
  for (let i = 0; i < n; i++) {
    const life = 3 + h1(i * 5 + seed) * 4;
    const ph = fract(t / life + h1(i * 7 + seed));
    const x = x0 + h1(i * 11 + seed) * spread + Math.sin(t * 1.3 + i) * 30 + ph * 80 * (h1(i) - 0.5);
    const y = y0 - ph * rise * life;
    const al = a * Math.sin(ph * Math.PI) * (0.5 + 0.5 * Math.sin(t * 9 + i));
    glow(ctx, x, y, size * 4, col, al, 1);
  }
}

// ---------- energy effects ----------
function lightning(ctx, x0, y0, x1, y1, seed, col, w = 3, a = 1, jag = 0.18, branches = 3) {
  const r = mulberry32(seed);
  function bolt(xa, ya, xb, yb, depth) {
    let pts = [[xa, ya], [xb, yb]];
    const len = Math.hypot(xb - xa, yb - ya);
    for (let it = 0; it < 6; it++) {
      const np = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const nx = -(by - ay), ny = bx - ax;
        const nl = Math.hypot(nx, ny) || 1;
        const off = (r() - 0.5) * jag * len / Math.pow(1.8, it);
        np.push([mx + (nx / nl) * off, my + (ny / nl) * off], [bx, by]);
      }
      pts = np;
    }
    glowLine(ctx, pts, col, w / (depth + 1), a);
    if (depth < 2) {
      for (let b = 0; b < branches; b++) {
        const k = Math.floor(r() * (pts.length - 2)) + 1;
        const [bx, by] = pts[k];
        const ang = Math.atan2(yb - ya, xb - xa) + (r() - 0.5) * 1.6;
        const bl = len * (0.15 + r() * 0.25);
        bolt(bx, by, bx + Math.cos(ang) * bl, by + Math.sin(ang) * bl, depth + 1);
      }
    }
  }
  bolt(x0, y0, x1, y1, 0);
}
function ring(ctx, x, y, r, col, w, a, sy = 1) {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  ctx.scale(1, sy);
  [[w * 5, 0.07], [w * 2.2, 0.2], [w, 0.6], [w * 0.35, 0.9]].forEach(([lw, al], i) => {
    ctx.strokeStyle = i === 3 ? rgba([255, 255, 255], al * a) : rgba(col, al * a);
    ctx.lineWidth = lw / Math.max(0.2, sy);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  });
  ctx.restore();
}
// hexagonal energy barrier inside a clipping shape
function hexField(ctx, clipFn, col, a, t, size = 26, x0 = 0, y0 = 0, x1 = W, y1 = H, cracks = 0, seed = 1) {
  if (a <= 0) return;
  ctx.save();
  clipFn(ctx);
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(col, 0.16 * a);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const hw = size * Math.sqrt(3);
  ctx.lineWidth = 1.6;
  for (let row = 0, y = y0; y < y1 + size; row++, y += size * 1.5) {
    for (let x = x0 - (row % 2 ? hw / 2 : 0); x < x1 + hw; x += hw) {
      const n = Noise.n2(x * 0.004 + t * 0.6, y * 0.004 - t * 0.3);
      const al = a * (0.18 + 0.35 * Math.max(0, n) + (cracks && h2(Math.round(x), Math.round(y) + seed) < cracks ? 0.5 : 0));
      ctx.strokeStyle = rgba(col, al);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = Math.PI / 6 + (k * Math.PI) / 3;
        const px = x + Math.cos(ang) * size * 0.94, py = y + Math.sin(ang) * size * 0.94;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}
function shockwave(ctx, x, y, t, t0, col, maxR = 1400, dur = 0.9, sy = 0.35) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return;
  const r = Ease.out(u) * maxR;
  ring(ctx, x, y, r, col, 10 * (1 - u) + 2, (1 - u), sy);
}
function explosion(ctx, x, y, t, t0, col, size = 400, dur = 1.6) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1.2) return;
  const k = Ease.outExpo(Math.min(1, u * 1.5));
  const fade = 1 - clamp(u);
  glow(ctx, x, y, size * (0.4 + 1.6 * k), col, fade);
  glow(ctx, x, y, size * (0.2 + 0.6 * k), [255, 255, 255], fade * fade, 1);
  ring(ctx, x, y, size * 1.9 * k, col, 8, fade * 0.8);
  for (let i = 0; i < 40; i++) {
    const ang = h1(i * 3 + 7) * TAU, sp = 0.4 + h1(i * 5) * 0.9;
    const d = size * 2.3 * k * sp;
    glow(ctx, x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.8, 14 * fade + 3, col, fade * 0.9, 1);
  }
}

// ---------- post processing ----------
const Post = (() => {
  let a, b, c, grain = [];
  function init() {
    a = mk(480, 270, { willReadFrequently: true });
    b = mk(480, 270);
    c = mk(160, 90);
    const r = mulberry32(4242);
    for (let k = 0; k < 6; k++) {
      const g = mk(512, 512);
      const id = g.ctx.createImageData(512, 512);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = 128 + (r() + r() + r() - 1.5) * 90;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      g.ctx.putImageData(id, 0, 0);
      grain.push(g);
    }
  }
  function bloom(src, dctx, strength = 0.8, thresh = 0.62) {
    a.ctx.clearRect(0, 0, 480, 270);
    a.ctx.drawImage(src, 0, 0, 480, 270);
    const id = a.ctx.getImageData(0, 0, 480, 270);
    const d = id.data, th = thresh * 255, k0 = 1 / (255 - th);
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const k = l > th ? (l - th) * k0 : 0;
      d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
    }
    a.ctx.putImageData(id, 0, 0);
    b.ctx.clearRect(0, 0, 480, 270);
    b.ctx.filter = 'blur(5px)';
    b.ctx.drawImage(a, 0, 0);
    b.ctx.filter = 'none';
    c.ctx.clearRect(0, 0, 160, 90);
    c.ctx.filter = 'blur(6px)';
    c.ctx.drawImage(a, 0, 0, 160, 90);
    c.ctx.filter = 'none';
    dctx.save();
    dctx.globalCompositeOperation = 'lighter';
    dctx.globalAlpha = strength;
    dctx.drawImage(b, 0, 0, W, H);
    dctx.globalAlpha = strength * 0.9;
    dctx.drawImage(c, 0, 0, W, H);
    dctx.restore();
  }
  function vignette(ctx, amt = 0.55) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${amt})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  function film(ctx, frame, amt = 0.07) {
    const g = grain[frame % grain.length];
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amt;
    const ox = (frame * 97) % 512, oy = (frame * 57) % 512;
    for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(g, x, y);
    ctx.restore();
  }
  function letterbox(ctx, h = LB) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, h);
    ctx.fillRect(0, H - h, W, h);
  }
  return { init, bloom, vignette, film, letterbox };
})();

// ---------- typography ----------
const FONT_ZH = '"Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';
const FONT_SERIF = '"Noto Serif SC", "Noto Sans SC", serif';
const FONT_EN = '"Barlow Condensed", "Noto Sans SC", sans-serif';
const OW_ORANGE = [249, 158, 26];

function spacedText(ctx, text, x, y, spacing, align = 'center') {
  // canvas letterSpacing is supported in Chromium; fall back to plain fill.
  ctx.letterSpacing = spacing + 'px';
  ctx.textAlign = align;
  ctx.fillText(text, x + (align === 'center' ? spacing / 2 : 0), y);
  ctx.letterSpacing = '0px';
}

function subtitles(ctx, t, lines) {
  for (const l of lines) {
    if (l.id === 'L20') continue; // shown as the big title text instead
    const t0 = l.t - 0.12, t1 = l.t + l.dur + 0.45;
    if (t < t0 - 0.3 || t > t1 + 0.3) continue;
    const a = ss(t0 - 0.25, t0 + 0.1, t) * (1 - ss(t1 - 0.1, t1 + 0.3, t));
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = `600 40px ${FONT_SERIF}`;
    const y = H - LB + 50;
    ctx.fillStyle = '#f4efe6';
    spacedText(ctx, l.zh, W / 2, y, 3);
    ctx.font = `500 23px ${FONT_EN}`;
    ctx.fillStyle = 'rgba(210,205,195,0.85)';
    spacedText(ctx, l.en, W / 2, y + 34, 1.5);
    ctx.restore();
  }
}

// Map location card (lower-left), Overwatch-style slanted slab with orange accent.
function locationCard(ctx, t, t0, dur, zh, en, sub, accent = OW_ORANGE) {
  const u = t - t0;
  if (u < 0 || u > dur + 0.8) return;
  const ain = Ease.out(clamp(u / 0.6));
  const aout = 1 - ss(dur, dur + 0.6, u);
  const a = ain * aout;
  const x = 110, y = H - LB - 150;
  ctx.save();
  ctx.globalAlpha = a;
  // accent bar grows
  const bw = 6, bh = 118 * Ease.out(clamp(u / 0.45));
  ctx.fillStyle = rgba(accent);
  ctx.beginPath();
  ctx.moveTo(x, y + 118); ctx.lineTo(x + bw, y + 118); ctx.lineTo(x + bw + 10, y + 118 - bh); ctx.lineTo(x + 10, y + 118 - bh);
  ctx.fill();
  const slide = (1 - ain) * -40;
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 18;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 64px ${FONT_ZH}`;
  spacedText(ctx, zh, x + 36 + slide, y + 62, 6, 'left');
  ctx.font = `italic 700 34px ${FONT_EN}`;
  ctx.fillStyle = rgba(accent);
  spacedText(ctx, en, x + 38 + slide * 1.4, y + 102, 7, 'left');
  if (sub) {
    ctx.font = `500 22px ${FONT_EN}`;
    ctx.fillStyle = 'rgba(235,235,235,0.85)';
    spacedText(ctx, sub, x + 40 + slide * 1.8, y + 132, 4, 'left');
  }
  ctx.restore();
}

// Hero name tag: slanted plate that slides in.
function heroTag(ctx, t, t0, dur, zh, en, col, x, y, align = 'left') {
  const u = t - t0;
  if (u < 0 || u > dur + 0.6) return;
  const ain = Ease.outBack(clamp(u / 0.5));
  const a = clamp(u / 0.25) * (1 - ss(dur, dur + 0.5, u));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.font = `900 46px ${FONT_ZH}`;
  const wzh = ctx.measureText(zh).width + zh.length * 4;
  ctx.font = `italic 900 30px ${FONT_EN}`;
  ctx.letterSpacing = '5px';
  const wen = ctx.measureText(en).width;
  ctx.letterSpacing = '0px';
  const w = Math.max(wzh, wen) + 70;
  const sx = align === 'right' ? -w : 0;
  ctx.translate(sx + (1 - ain) * (align === 'right' ? 60 : -60), 0);
  // plate
  ctx.fillStyle = 'rgba(10,12,20,0.55)';
  ctx.beginPath();
  ctx.moveTo(16, 0); ctx.lineTo(w, 0); ctx.lineTo(w - 16, 96); ctx.lineTo(0, 96); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(col);
  ctx.beginPath();
  ctx.moveTo(16, 0); ctx.lineTo(26, 0); ctx.lineTo(10, 96); ctx.lineTo(0, 96); ctx.closePath();
  ctx.fill();
  ctx.fillRect(30, 90, (w - 60) * clamp(u / 0.6), 3);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = `900 46px ${FONT_ZH}`;
  spacedText(ctx, zh, 40, 50, 4, 'left');
  ctx.font = `italic 900 26px ${FONT_EN}`;
  ctx.fillStyle = rgba(col);
  spacedText(ctx, en, 42, 80, 5, 'left');
  ctx.restore();
}

// Large centred caption (for intertitles)
function bigText(ctx, text, x, y, size, a, opts = {}) {
  if (a <= 0) return;
  const { font = FONT_ZH, weight = 900, col = '#ffffff', spacing = 8, italic = false, glowCol = null } = opts;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`;
  ctx.textBaseline = 'middle';
  if (glowCol) { ctx.shadowColor = rgba(glowCol, 0.9); ctx.shadowBlur = size * 0.5; }
  ctx.fillStyle = col;
  spacedText(ctx, text, x, y, spacing);
  ctx.restore();
}

// Firework burst (stateless). Draws particles for a burst launched at t0.
function firework(ctx, x, y, t, t0, col, n = 60, size = 260, seed = 1, life = 2.2) {
  const u = t - t0;
  if (u < 0 || u > life) return;
  const k = u / life;
  const fade = Math.pow(1 - k, 1.6);
  if (u < 0.12) glow(ctx, x, y, size * 0.8, col, (1 - u / 0.12));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + h1(i * 3 + seed) * 0.2;
    const sp = size * (0.75 + h1(i * 7 + seed) * 0.35);
    const d = sp * (1 - Math.exp(-u * 2.8));
    const g = 60 * u * u;
    const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d + g;
    const d0 = sp * (1 - Math.exp(-Math.max(0, u - 0.12) * 2.8));
    const qx = x + Math.cos(ang) * d0, qy = y + Math.sin(ang) * d0 + 60 * Math.max(0, u - 0.12) ** 2;
    ctx.strokeStyle = rgba(col, 0.6 * fade);
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
    const tw = h1(i + Math.floor(u * 20)) > 0.3 ? 1 : 0.3;
    ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.5), fade * tw);
    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
  }
  ctx.restore();
  glow(ctx, x, y + 20 * u, size * 1.4, col, 0.18 * fade);
}
