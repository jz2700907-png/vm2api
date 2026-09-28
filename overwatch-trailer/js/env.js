// Procedural environment painters. Most return pre-rendered canvases (layers) for the 2.5D camera.
'use strict';

const Env = {};

Env.sky = (w, h, stops) => {
  const c = mk(w, h);
  c.ctx.fillStyle = vgrad(c.ctx, 0, h, stops);
  c.ctx.fillRect(0, 0, w, h);
  return c;
};

Env.stars = (ctx, w, h, n, seed = 1, opts = {}) => {
  const { maxR = 1.6, tint = true, bright = 1 } = opts;
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, m = Math.pow(r(), 6);
    const rad = 0.4 + m * maxR * 2;
    const col = tint ? mix([255, 255, 255], r() < 0.5 ? [170, 200, 255] : [255, 215, 170], r() * 0.6) : [255, 255, 255];
    ctx.fillStyle = rgba(col, Math.min(1, (0.3 + m * 0.9 + r() * 0.3) * bright));
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
    if (m > 0.35) glow(ctx, x, y, rad * 9, col, 0.4 * bright);
  }
};

// Soft volumetric-looking clouds via fbm, shaded towards a light direction.
Env.clouds = (w, h, o = {}) => {
  const { seed = 1, scale = 0.0025, cover = 0.1, sharp = 2.2, lit = [255, 240, 220], shade = [90, 90, 110], light = [-0.6, -0.8],
    res = 0.5, alpha = 1, stretch = 2.2, top = 0, bottom = 1, fadeTop = 0.15, fadeBottom = 0.25, oct = 5 } = o;
  const cw = Math.ceil(w * res), ch = Math.ceil(h * res);
  const c = mk(cw, ch);
  const id = c.ctx.createImageData(cw, ch);
  const d = id.data;
  const sx = seed * 31.7, sy = seed * 17.3;
  const L = C(lit), S = C(shade);
  for (let y = 0; y < ch; y++) {
    const v = y / ch;
    const vf = ss(top, top + fadeTop, v) * (1 - ss(bottom - fadeBottom, bottom, v));
    if (vf <= 0) continue;
    for (let x = 0; x < cw; x++) {
      const nx = (x / res) * scale / stretch + sx, ny = (y / res) * scale + sy;
      const n = Noise.fbm(nx, ny, oct);
      let dens = clamp((n + cover) * sharp) * vf;
      if (dens <= 0.004) continue;
      const n2 = Noise.fbm(nx - light[0] * 0.05, ny - light[1] * 0.05, 3);
      const l = clamp(0.55 + (n - n2) * 6);
      const i = (y * cw + x) * 4;
      d[i] = lerp(S[0], L[0], l); d[i + 1] = lerp(S[1], L[1], l); d[i + 2] = lerp(S[2], L[2], l);
      d[i + 3] = dens * 255 * alpha;
    }
  }
  c.ctx.putImageData(id, 0, 0);
  const out = mk(w, h);
  out.ctx.imageSmoothingQuality = 'high';
  out.ctx.drawImage(c, 0, 0, w, h);
  return out;
};

// Mountain / hill ridge silhouette with vertical gradient and optional snow and rim light.
Env.ridge = (w, h, o = {}) => {
  const { seed = 1, base = 0.6, amp = 0.3, freq = 0.002, oct = 5, top = [60, 60, 80], bottom = [20, 20, 30], ridged = false,
    snow = null, snowLine = 0.3, rim = null, rimW = 2, peaks = null } = o;
  const c = mk(w, h);
  const ctx = c.ctx;
  const ys = new Float32Array(w + 1);
  for (let x = 0; x <= w; x++) {
    let n = Noise.fbm(x * freq + seed * 13.1, seed * 7.7, oct);
    if (ridged) n = 1 - Math.abs(n * 1.6);
    let y = h * base - n * h * amp;
    if (peaks) for (const p of peaks) { const dx = (x - p[0]) / p[2]; y = Math.min(y, p[1] + Math.abs(dx) * p[2] * (p[3] || 1) + Noise.n1(x * 0.02, p[0]) * 12); }
    ys[x] = y;
  }
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x++) ctx.lineTo(x, ys[x]);
  ctx.lineTo(w, h);
  ctx.closePath();
  const minY = Math.min(...ys);
  ctx.fillStyle = vgrad(ctx, minY, h, [[0, top], [1, bottom]]);
  ctx.fill();
  if (snow) {
    ctx.save();
    ctx.clip();
    const r = mulberry32(seed);
    for (let x = 0; x < w; x += 2) {
      const sl = minY + (h - minY) * snowLine * (0.6 + 0.8 * (0.5 + 0.5 * Noise.n1(x * 0.01, seed)));
      if (ys[x] < sl) {
        const g = ctx.createLinearGradient(0, ys[x], 0, sl);
        g.addColorStop(0, rgba(snow, 0.95));
        g.addColorStop(1, rgba(snow, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x, ys[x], 2, sl - ys[x]);
      }
    }
    // streaks down the slopes
    for (let i = 0; i < w / 6; i++) {
      const x = r() * w;
      const y0 = ys[Math.floor(x)];
      ctx.strokeStyle = rgba(snow, 0.25 * r());
      ctx.lineWidth = 1 + r() * 2;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (r() - 0.5) * 60, y0 + 40 + r() * 120); ctx.stroke();
    }
    ctx.restore();
  }
  if (rim) {
    ctx.strokeStyle = rgba(rim, 0.9);
    ctx.lineWidth = rimW;
    ctx.beginPath();
    for (let x = 0; x <= w; x++) x ? ctx.lineTo(x, ys[x] + 1) : ctx.moveTo(x, ys[x] + 1);
    ctx.stroke();
  }
  c.ys = ys;
  return c;
};

// Reflection of a region of `src` (screen canvas) below the horizon with animated ripples.
let _reflTmp = null;
Env.reflect = (ctx, src, horizon, yEnd, t, o = {}) => {
  const { amp = 6, freq = 0.05, speed = 2, alpha = 0.55, tint = null, step = 3 } = o;
  horizon = Math.floor(horizon);
  const hgt = Math.min(horizon, Math.ceil(yEnd - horizon));
  if (hgt <= 0) return;
  // one snapshot of the band above the horizon, flipped vertically
  if (!_reflTmp) _reflTmp = mk(W, H);
  const tc = _reflTmp.ctx;
  tc.clearRect(0, 0, W, hgt);
  tc.save(); tc.translate(0, hgt); tc.scale(1, -1);
  tc.drawImage(src, 0, horizon - hgt, W, hgt, 0, 0, W, hgt);
  tc.restore();
  for (let y = 0; y < hgt; y += step) {
    const off = Math.sin((y + horizon) * freq + t * speed) * amp * (0.3 + y / 200) + Noise.n1(y * 0.13 + t * 1.5, 3) * amp * 0.6;
    ctx.globalAlpha = alpha * (1 - (y / hgt) * 0.6);
    ctx.drawImage(_reflTmp, 0, y, W, step, off, horizon + y, W, step);
  }
  ctx.globalAlpha = 1;
  if (tint) { ctx.fillStyle = vgrad(ctx, horizon, yEnd, tint); ctx.fillRect(0, horizon, W, yEnd - horizon); }
};

// Windows grid on a building rect
Env.windows = (ctx, x, y, w, h, o = {}) => {
  const { cw = 8, chh = 10, gx = 6, gy = 8, lit = 0.35, col = [255, 200, 120], seed = 1, dim = [30, 30, 40] } = o;
  for (let yy = y + gy; yy < y + h - chh; yy += chh + gy) {
    for (let xx = x + gx; xx < x + w - cw; xx += cw + gx) {
      const r = h2(Math.floor(xx * 3.1 + seed * 101), Math.floor(yy * 1.7));
      if (r < lit) {
        ctx.fillStyle = rgba(mix(col, [255, 255, 255], r * 0.8), 0.65 + r);
        ctx.fillRect(xx, yy, cw, chh);
      } else if (dim) {
        ctx.fillStyle = rgba(dim, 0.5);
        ctx.fillRect(xx, yy, cw, chh);
      }
    }
  }
};

// Generic modern skyline layer
Env.skyline = (w, h, o = {}) => {
  const { seed = 1, base = h, minH = 80, maxH = 400, minW = 40, maxW = 140, col = [20, 22, 30], gap = 0, lit = 0.25,
    winCol = [255, 200, 130], towers = [], spires = 0.2, winSize = [6, 8], rimCol = null } = o;
  const c = mk(w, h);
  const ctx = c.ctx;
  const r = mulberry32(seed);
  let x = -20;
  const blds = [];
  while (x < w) {
    const bw = minW + r() * (maxW - minW);
    const bh = minH + Math.pow(r(), 1.6) * (maxH - minH);
    blds.push([x, base - bh, bw, bh, r()]);
    x += bw + gap + r() * 6;
  }
  towers.forEach((tw) => blds.push(tw));
  for (const [bx, by, bw, bh, k] of blds) {
    ctx.fillStyle = rgba(col);
    ctx.fillRect(bx, by, bw, bh + 2);
    if (k > 1 - spires) { ctx.fillRect(bx + bw / 2 - 2, by - bh * 0.15, 4, bh * 0.15); }
    if (k < 0.2) { ctx.fillRect(bx + bw * 0.15, by - 12, bw * 0.7, 12); }
    if (rimCol) { ctx.fillStyle = rgba(rimCol, 0.5); ctx.fillRect(bx + bw - 2, by, 2, bh); }
    Env.windows(ctx, bx, by, bw, bh, { cw: winSize[0], chh: winSize[1], gx: 5, gy: 7, lit, col: winCol, seed: Math.floor(k * 1000), dim: mix(col, [60, 60, 80], 0.3) });
  }
  c.blds = blds;
  return c;
};

// Curved east-asian roof (pagoda tier)
Env.roof = (ctx, cx, y, w, hgt, curl = 0.25) => {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - w * 0.08, y - hgt * curl);
  ctx.quadraticCurveTo(cx - w * 0.35, y + hgt * 0.1, cx - w * 0.22, y - hgt * 0.35);
  ctx.lineTo(cx - w * 0.12, y - hgt);
  ctx.lineTo(cx + w * 0.12, y - hgt);
  ctx.lineTo(cx + w * 0.22, y - hgt * 0.35);
  ctx.quadraticCurveTo(cx + w * 0.35, y + hgt * 0.1, cx + w / 2 + w * 0.08, y - hgt * curl);
  ctx.lineTo(cx + w / 2 - w * 0.05, y + hgt * 0.05);
  ctx.lineTo(cx - w / 2 + w * 0.05, y + hgt * 0.05);
  ctx.closePath();
  ctx.fill();
};

// Tree with blossom canopy (cherry) or generic foliage
Env.blossomTree = (ctx, x, y, s, seed, trunkCol, cols, lightCol) => {
  const r = mulberry32(seed);
  ctx.strokeStyle = rgba(trunkCol);
  ctx.lineCap = 'round';
  const tips = [];
  function branch(x0, y0, ang, len, w, depth) {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + Math.cos(ang + 0.3) * len * 0.5, y0 + Math.sin(ang + 0.3) * len * 0.5, x1, y1);
    ctx.stroke();
    if (depth <= 0) { tips.push([x1, y1]); return; }
    const n = 2 + (r() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) branch(x1, y1, ang + (r() - 0.5) * 1.3, len * (0.6 + r() * 0.2), w * 0.65, depth - 1);
  }
  branch(x, y, -Math.PI / 2 + (r() - 0.5) * 0.3, 90 * s, 16 * s, 4);
  for (const [tx, ty] of tips) {
    for (let k = 0; k < 7; k++) {
      const px = tx + (r() - 0.5) * 70 * s, py = ty + (r() - 0.5) * 45 * s;
      const rr = (14 + r() * 26) * s;
      const lit = clamp(0.5 - (py - (y - 300 * s)) / (600 * s) + (r() - 0.5) * 0.4);
      ctx.fillStyle = rgba(mix(cols[0], cols[1], lit), 0.55 + r() * 0.4);
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
    }
  }
  if (lightCol) for (const [tx, ty] of tips) { ctx.fillStyle = rgba(lightCol, 0.35); ctx.beginPath(); ctx.arc(tx + 10 * s, ty - 12 * s, 16 * s, 0, TAU); ctx.fill(); }
};

// A string of hanging lights / lanterns along a catenary
Env.catenary = (x0, y0, x1, y1, sag, n) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push([lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag]);
  }
  return pts;
};
