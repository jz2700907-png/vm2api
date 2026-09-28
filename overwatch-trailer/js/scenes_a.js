// Scenes: space prologue, Gibraltar recall, King's Row, Hanamura, Numbani.
'use strict';

// ============================================================ SPACE
Scenes.space = (() => {
  let stars, milky, earth, R = 1750, ECX = W / 2, ETOP = 760;
  function init() {
    stars = mk(2600, 1800);
    stars.ctx.fillStyle = '#02030a';
    stars.ctx.fillRect(0, 0, 2600, 1800);
    milky = Env.clouds(2600, 1800, { seed: 4, scale: 0.0016, cover: -0.05, sharp: 1.6, lit: [150, 130, 220], shade: [30, 40, 90], res: 0.25, alpha: 0.55, stretch: 3, fadeTop: 0.3, fadeBottom: 0.3 });
    stars.ctx.save();
    stars.ctx.translate(1300, 900); stars.ctx.rotate(-0.45); stars.ctx.translate(-1300, -900);
    stars.ctx.globalCompositeOperation = 'lighter';
    stars.ctx.drawImage(milky, 0, 300, 2600, 900);
    stars.ctx.restore();
    Env.stars(stars.ctx, 2600, 1800, 2600, 7, { maxR: 1.3 });
    // earth (top cap only)
    const ew = R * 2, eh = 900;
    earth = mk(ew, eh);
    const id = earth.ctx.createImageData(ew, eh);
    const d = id.data;
    for (let y = 0; y < eh; y++) {
      for (let x = 0; x < ew; x++) {
        const dx = (x - R) / R, dy = (y - R) / R;
        const q = dx * dx + dy * dy;
        if (q >= 1) continue;
        const z = Math.sqrt(1 - q);
        // tilt: rotate so we look at the northern hemisphere a bit
        const ty = dy * 0.8 - z * 0.6, tz = dy * 0.6 + z * 0.8;
        const lon = Math.atan2(dx, tz) + 0.6, lat = Math.asin(clamp(-ty, -1, 1));
        const u = lon * 2.2, v = lat * 2.2;
        const land = Noise.fbm(u + 3, v + 1, 6);
        const isLand = land > 0.04;
        const cloud = clamp(Noise.fbm(u * 1.6 + 11, v * 2.2 + 5, 5) * 1.6 + 0.1);
        let r = 4, g = 9, b = 22;
        if (isLand) { r = 10; g = 12; b = 16; }
        let lights = 0;
        if (isLand) {
          const cd = Noise.fbm(u * 5 + 7, v * 5 + 2, 3);
          const sparkle = h2(x >> 1, y >> 1);
          if (cd > 0.12 && sparkle > 0.86 - cd * 0.9) lights = (0.35 + cd * 2) * (0.5 + sparkle * 0.5);
          if (land < 0.07) lights *= 1.5; // coastal cities
        }
        const limb = Math.pow(z, 0.45);
        r = (r + cloud * 28) * limb + lights * 255 * (1 - cloud * 0.7);
        g = (g + cloud * 34) * limb + lights * 175 * (1 - cloud * 0.7);
        b = (b + cloud * 50) * limb + lights * 95 * (1 - cloud * 0.7);
        const i = (y * ew + x) * 4;
        d[i] = Math.min(255, r); d[i + 1] = Math.min(255, g); d[i + 2] = Math.min(255, b); d[i + 3] = 255;
      }
    }
    earth.ctx.putImageData(id, 0, 0);
  }
  function camAt(lt) {
    return {
      x: kf([[0, -120], [15, 60]], lt, Ease.inOutSine),
      y: kf([[0, -520], [6.5, 0], [11, 30], [15, 150]], lt, Ease.inOut),
      z: kf([[0, 0], [10.5, 60], [15, 520]], lt, Ease.in),
    };
  }
  function draw(ctx, t, lt) {
    const cam = camAt(lt);
    drawL(ctx, cam, stars, W / 2 - 1300, H / 2 - 900 - 200, 9000);
    // sun rising over the limb
    const sunY = kf([[0, 60], [5.5, 30], [9, -6], [15, -40]], lt);
    const sunX = W / 2 + 330;
    const [sx, sy, s] = proj(cam, sunX, ETOP + sunY, 1200);
    const rise = ss(5, 9.5, lt);
    glow(ctx, sx, sy, 900 * s, [255, 140, 60], 0.35 * rise);
    // earth
    drawL(ctx, cam, earth, ECX - R, ETOP, 1200);
    const [ex, ey, es] = proj(cam, ECX, ETOP + R, 1200);
    const er = R * es;
    // atmosphere rim
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [wd, al, col] of [[70, 0.05, [60, 130, 255]], [30, 0.12, [80, 150, 255]], [10, 0.35, [120, 190, 255]], [3, 0.6, [200, 230, 255]]]) {
      ctx.strokeStyle = rgba(col, al * (0.5 + 0.5 * rise));
      ctx.lineWidth = wd * es;
      ctx.beginPath(); ctx.arc(ex, ey, er + 4 * es, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
    // sunrise band along the limb
    const ang = Math.atan2(sy - ey, sx - ex);
    for (let k = 0; k < 3; k++) {
      const spread = [0.16, 0.08, 0.035][k];
      const col = [[255, 120, 40], [255, 180, 90], [255, 240, 210]][k];
      ctx.strokeStyle = rgba(col, [0.35, 0.5, 0.9][k] * rise);
      ctx.lineWidth = [26, 12, 4][k] * es;
      ctx.beginPath(); ctx.arc(ex, ey, er + 2 * es, ang - spread * 3, ang + spread * 3); ctx.stroke();
    }
    ctx.restore();
    // sun disc peeking + flare
    if (rise > 0) {
      glow(ctx, sx, sy - 6, 260 * s, [255, 200, 140], 0.9 * rise);
      glow(ctx, sx, sy - 4, 60 * s, [255, 255, 255], rise, 1);
      godRays(ctx, sx, sy - 4, [255, 220, 170], 0.3 * rise, 1500, 18, 3, Math.PI * 1.1, -Math.PI / 2, t);
      lensFlare(ctx, sx, sy - 4, 0.8 * rise * (1 - ss(12.5, 15, lt)), [255, 200, 150], 1.1);
    }
    // descent: atmosphere fills the frame
    const dive = ss(12, 15, lt);
    if (dive > 0) {
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, [255, 190, 130], 0], [0.6, [255, 170, 110], dive * 0.6], [1, [255, 220, 190], dive]]);
      ctx.fillRect(0, 0, W, H);
    }
    // the tiny glint of the Watchpoint beacon on the dark side
    const bl = ss(3, 4, lt) * (1 - ss(10, 12, lt));
    if (bl > 0) {
      const [bx, by] = proj(cam, W / 2 - 360, ETOP + 120, 1200);
      const blink = 0.6 + 0.4 * Math.sin(t * 5);
      glow(ctx, bx, by, 26, [255, 170, 60], bl * blink, 1);
      ring(ctx, bx, by, 30 + fract(t * 0.7) * 120, [255, 170, 60], 2, bl * (1 - fract(t * 0.7)) * 0.8, 0.5);
    }
  }
  return { init, draw, bloom: 0.9, vignette: 0.6 };
})();

// ============================================================ GIBRALTAR (recall)
Scenes.gibraltar = (() => {
  let sky, sea, rock, far, clouds, lab;
  const HOR = 640;
  function init() {
    sky = Env.sky(2600, 1300, [[0, [18, 26, 58]], [0.45, [60, 60, 110]], [0.7, [220, 120, 90]], [0.82, [255, 180, 110]], [1, [255, 200, 140]]]);
    clouds = Env.clouds(2600, 700, { seed: 9, scale: 0.0022, cover: -0.02, sharp: 2.2, lit: [255, 170, 120], shade: [60, 50, 90], light: [0.8, 0.6], res: 0.4, stretch: 3.5, fadeTop: 0.2 });
    far = Env.ridge(2600, 400, { seed: 3, base: 0.8, amp: 0.25, freq: 0.0015, top: [90, 70, 110], bottom: [120, 90, 120] });
    // the Rock with the watchpoint
    rock = mk(1500, 1100);
    const c = rock.ctx;
    c.fillStyle = vgrad(c, 0, 1100, [[0, [22, 20, 34]], [1, [8, 8, 14]]]);
    c.beginPath();
    c.moveTo(0, 1100); c.lineTo(0, 330);
    for (let x = 0; x <= 1500; x += 10) {
      const y = 330 + Math.pow(x / 1500, 2.5) * 600 + Noise.fbm(x * 0.004, 2.3, 4) * 70 - (x < 500 ? (500 - x) * 0.12 : 0);
      c.lineTo(x, y);
    }
    c.lineTo(1500, 1100); c.closePath(); c.fill();
    // base buildings on top
    c.fillStyle = '#0c0c16';
    c.fillRect(120, 250, 260, 90); c.fillRect(180, 210, 120, 50); c.fillRect(400, 280, 180, 70);
    // launch tower + rocket
    c.fillRect(640, 120, 18, 240); c.fillRect(700, 120, 18, 240);
    for (let y = 130; y < 360; y += 22) { c.fillRect(640, y, 78, 3); }
    c.beginPath(); c.moveTo(668, 60); c.quadraticCurveTo(690, 30, 712, 60); c.lineTo(712, 330); c.lineTo(668, 330); c.closePath(); c.fill();
    // windows
    Env.windows(c, 120, 255, 260, 80, { cw: 10, chh: 6, gx: 8, gy: 10, lit: 0.55, col: [255, 190, 110], seed: 4, dim: null });
    Env.windows(c, 400, 285, 180, 60, { cw: 10, chh: 6, gx: 8, gy: 10, lit: 0.5, col: [140, 200, 255], seed: 5, dim: null });
    // lab interior
    lab = mk(W, H);
    const l = lab.ctx;
    l.fillStyle = '#05070d'; l.fillRect(0, 0, W, H);
    l.fillStyle = vgrad(l, 0, H, [[0, [10, 16, 30]], [0.62, [16, 26, 46]], [0.63, [8, 10, 18]], [1, [4, 5, 9]]]);
    l.fillRect(0, 0, W, H);
    // window strip with the sea at night behind
    l.fillStyle = vgrad(l, 150, 420, [[0, [16, 24, 56]], [1, [60, 60, 110]]]);
    l.fillRect(120, 150, 1680, 250);
    Env.stars(l, W, 260, 200, 3, { maxR: 1 });
    l.fillStyle = '#05070d';
    for (let x = 120; x <= 1800; x += 280) l.fillRect(x - 6, 150, 12, 250);
    // desks / clutter silhouettes
    l.fillStyle = '#030408';
    l.fillRect(0, 760, W, 320);
    l.fillRect(200, 700, 300, 70); l.fillRect(1450, 690, 360, 80);
    // tyre + peanut butter jar
    l.beginPath(); l.arc(1650, 660, 44, 0, TAU); l.fill();
    l.fillRect(290, 660, 34, 44);
  }

  const screenCol = (lt) => mix([90, 190, 255], [255, 160, 60], ss(1.1, 1.4, lt));
  function drawLab(ctx, t, lt) {
    const cam = { x: kf([[0, 30], [5, -30]], lt), y: 0, z: kf([[0, 0], [5, 140]], lt) };
    drawL(ctx, cam, lab, 0, 0, 2000);
    const col = screenCol(lt);
    const act = ss(1.1, 1.4, lt);
    // monitor wall
    withPlane(ctx, cam, 1500, (c) => {
      const panels = [[380, 430, 330, 210], [730, 400, 460, 260], [1210, 430, 330, 210]];
      panels.forEach(([x, y, w, h], i) => {
        c.fillStyle = rgba(mix([6, 18, 36], col, 0.18));
        c.fillRect(x, y, w, h);
        c.strokeStyle = rgba(col, 0.9); c.lineWidth = 2; c.strokeRect(x, y, w, h);
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        if (i === 1) {
          // world map dots
          for (let gy = 0; gy < 30; gy++) for (let gx = 0; gx < 64; gx++) {
            const n = Noise.fbm(gx * 0.09 + 3, gy * 0.12 + 1, 4);
            if (n > 0.05) { c.fillStyle = rgba(col, 0.35 + n); c.fillRect(x + 20 + gx * 6.7, y + 20 + gy * 7.3, 3, 3); }
          }
          // pings spreading from Gibraltar
          const px = x + 20 + 28 * 6.7, py = y + 20 + 10 * 7.3;
          for (let k = 0; k < 4; k++) {
            const u = fract((lt - 1.2) * 0.6 + k * 0.25);
            if (lt > 1.2) { c.strokeStyle = rgba(col, (1 - u) * 0.9); c.lineWidth = 2; c.beginPath(); c.arc(px, py, u * 240, 0, TAU); c.stroke(); }
          }
          // big text
          c.fillStyle = rgba([255, 255, 255], 0.9);
          c.font = `italic 900 64px ${FONT_EN}`;
          c.textAlign = 'center';
          c.globalAlpha = act * (0.75 + 0.25 * Math.sin(t * 10));
          c.fillText('RECALL', x + w / 2, y + h - 40);
          c.globalAlpha = 1;
        } else {
          for (let k = 0; k < 11; k++) {
            const wv = 60 + h1(k * 7 + i) * (w - 90);
            c.fillStyle = rgba(col, 0.5);
            c.fillRect(x + 16, y + 16 + k * 17, wv * clamp((lt - k * 0.1) * 2), 5);
          }
          // radar sweep
          const rx = x + w - 70, ry = y + h - 60;
          c.strokeStyle = rgba(col, 0.7); c.beginPath(); c.arc(rx, ry, 40, 0, TAU); c.stroke();
          c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(t * 3) * 40, ry + Math.sin(t * 3) * 40); c.stroke();
        }
        c.restore();
      });
      glow(c, 960, 520, 900, col, 0.25 + act * 0.2);
    });
    // Winston from behind, silhouetted against the screens
    withPlane(ctx, cam, 1000, (c) => {
      drawHero(c, HERO.winston, 960, 1060, 2.5, { sL: -0.3, eL: 0.12, sR: kf([[0, 0.3], [0.85, 0.2], [1.1, 0.05], [1.6, 0.25]], lt), eR: kf([[0, -0.12], [0.85, -0.9], [1.1, -1.2], [1.6, -0.2]], lt), head: -0.05, hL: -0.4, kL: 0.35, hR: 0.4, kR: -0.35 }, t,
        { body: [4, 5, 9], rim: mix(col, [255, 255, 255], 0.35), rimOff: [0, 5], emit: 0, tesla: false });
    });
    // console glow in front of him when he hits the key
    glow(ctx, W / 2 + 120, 760, 300, col, 0.4 * pulse(lt, 1.1, 0.1, 0.8));
    motes(ctx, t, 50, 0.35, mix(col, [255, 255, 255], 0.5), 5, 1.8, 6);
  }

  function drawOutside(ctx, t, lt) {
    const u = lt - 5; // 0..7.5
    const cam = { x: kf([[0, -80], [7.5, 120]], u, Ease.inOutSine), y: kf([[0, 40], [7.5, -30]], u), z: kf([[0, 0], [7.5, 120]], u) };
    drawL(ctx, cam, sky, W / 2 - 1300, -150, 6000);
    const [sunx, suny] = proj(cam, 1350, HOR - 8, 6000);
    glow(ctx, sunx, suny, 700, [255, 150, 80], 0.6);
    glow(ctx, sunx, suny, 90, [255, 240, 220], 1, 1);
    drawL(ctx, cam, clouds, W / 2 - 1300, 60, 4500, 0.9);
    drawL(ctx, cam, far, W / 2 - 1300, HOR - 400 + 30, 3500);
    // sea
    const [, hy] = proj(cam, 0, HOR, 3500);
    ctx.fillStyle = vgrad(ctx, hy, H, [[0, [150, 90, 100]], [0.3, [50, 40, 70]], [1, [10, 12, 26]]]);
    ctx.fillRect(0, hy, W, H - hy);
    // sun glitter path
    for (let i = 0; i < 260; i++) {
      const yy = hy + Math.pow(h1(i * 3), 1.7) * (H - hy);
      const spread = 20 + (yy - hy) * 0.6;
      const xx = sunx + (h1(i * 7) - 0.5) * spread * 2 + Math.sin(t * 2 + i) * 6;
      const tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.7);
      ctx.fillStyle = rgba([255, 210, 150], 0.5 * tw);
      ctx.fillRect(xx, yy, 6 + (yy - hy) * 0.08, 1.5);
    }
    drawL(ctx, cam, rock, 60, HOR - 330, 1300);
    // dish on the rock
    const fire = 0.3;
    withPlane(ctx, cam, 1300, (c) => {
      const dx = 300, dy = HOR - 330 + 205;
      c.save(); c.translate(dx, dy); c.rotate(-0.5);
      c.fillStyle = '#0c0c16';
      c.beginPath(); c.ellipse(0, 0, 70, 22, 0, Math.PI, TAU); c.fill();
      c.fillRect(-4, 0, 8, 40);
      c.restore();
      const beam = ss(fire, fire + 0.2, u);
      if (beam > 0) {
        const bx = dx + 10, by = dy - 20;
        const g = c.createLinearGradient(bx, by, bx, by - 900);
        g.addColorStop(0, rgba([255, 200, 120], 0.9 * beam));
        g.addColorStop(1, rgba([255, 160, 60], 0));
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
        c.beginPath(); c.moveTo(bx - 6, by); c.lineTo(bx - 40, by - 900); c.lineTo(bx + 40, by - 900); c.lineTo(bx + 6, by); c.fill(); c.restore();
        glow(c, bx, by, 120, [255, 190, 110], beam);
        glow(c, bx, by, 30, [255, 255, 255], beam, 1);
      }
    });
    // signal rings sweeping across the sky
    const [bx, by] = proj(cam, 310, HOR - 330 + 185, 1300);
    for (let k = 0; k < 4; k++) {
      const tt = u - fire - k * 1.1;
      if (tt < 0) continue;
      const rr = Ease.out(clamp(tt / 3.5)) * 2600;
      ring(ctx, bx, by, rr, [255, 180, 90], 6, (1 - clamp(tt / 3.5)) * 0.9, 0.3);
    }
    // the bird takes off from the dish and flies out over the sea
    const bu = clamp((u - 1.2) / 6);
    if (u > 1.0) {
      const px = lerp(bx + 20, sunx - 40, Ease.inOut(bu)), py = lerp(by - 10, suny - 70, Ease.inOut(bu)) - Math.sin(bu * Math.PI) * 160;
      const sc = lerp(3.2, 0.6, Ease.out(bu));
      bird(ctx, px, py, sc, t, 1, 1, 0.8);
    }
    // foreground railing
    ctx.fillStyle = '#05050a';
    const [rx, ry, rs] = proj(cam, 0, 900, 700);
    ctx.fillRect(0, ry, W, 12 * rs);
    for (let x = -200; x < W + 200; x += 140) { const [px, py, ps] = proj(cam, x, 900, 700); ctx.fillRect(px, py, 8 * ps, H); }
    ctx.fillRect(0, proj(cam, 0, 980, 700)[1], W, H);
    motes(ctx, t, 40, 0.25, [255, 200, 150], 8, 2, 10);
  }

  function draw(ctx, t, lt) {
    if (lt < 5) drawLab(ctx, t, lt); else drawOutside(ctx, t, lt);
  }
  function post(ctx, t, lt) {
    if (lt < 0 || lt > 12.5) return;
    const f = pulse(lt, 5, 0.02, 0.25) + pulse(lt, 1.12, 0.05, 0.35) * 0.35;
    if (f > 0.01) { ctx.fillStyle = `rgba(255,236,210,${Math.min(1, f)})`; ctx.fillRect(0, 0, W, H); }
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 15 + 5.6, 4.5, '监测站：直布罗陀', 'WATCHPOINT: GIBRALTAR', 'OVERWATCH · 召回协议');
    heroTag(ctx, t, 15 + 1.6, 3.0, '温斯顿', 'WINSTON', [120, 190, 255], W - 140, 160, 'right');
  }
  return { init, draw, post, overlay, xfade: 0.8, texts: ['监测站：直布罗陀', 'WATCHPOINT: GIBRALTAR', 'OVERWATCH · 召回协议', '温斯顿', 'WINSTON', 'RECALL'] };
})();


// ============================================================ KING'S ROW (rain, London)
Scenes.kingsrow = (() => {
  let sky, clouds, far, row, street;
  const ST = 800; // street line (screen y at rest)
  function init() {
    sky = Env.sky(2600, 1300, [[0, [6, 9, 20]], [0.5, [22, 28, 46]], [0.8, [60, 52, 60]], [1, [110, 80, 60]]]);
    clouds = Env.clouds(2600, 800, { seed: 21, scale: 0.002, cover: 0.15, sharp: 1.6, lit: [120, 95, 85], shade: [20, 24, 38], light: [0, 1], res: 0.4, stretch: 2.5 });
    // distant rooftops + clock tower
    far = mk(2600, 1300);
    const f = far.ctx;
    f.translate(0, 300);
    const fc = [34, 38, 54];
    f.fillStyle = rgba(fc);
    const r = mulberry32(8);
    for (let x = 0; x < 2600; x += 60 + r() * 60) {
      const h = 120 + r() * 160, w = 60 + r() * 80;
      f.fillRect(x, 1000 - h - 200, w, h + 200);
      if (r() < 0.5) { f.beginPath(); f.moveTo(x, 800 - h); f.lineTo(x + w / 2, 800 - h - 40); f.lineTo(x + w, 800 - h); f.fill(); }
      for (let k = 0; k < 3; k++) f.fillRect(x + 8 + k * 14, 800 - h - 22, 7, 24);
      Env.windows(f, x, 800 - h, w, h, { cw: 5, chh: 8, gx: 7, gy: 10, lit: 0.18, col: [255, 180, 100], seed: x, dim: null });
    }
    // clock tower (Elizabeth-tower-like)
    const tx = 1250;
    f.fillStyle = vgrad(f, -200, 900, [[0, [30, 30, 44]], [0.5, [40, 36, 46]], [1, [70, 52, 48]]]);
    f.fillRect(tx - 60, 260, 120, 740);
    f.fillRect(tx - 72, 250, 144, 40);
    f.fillRect(tx - 70, 90, 140, 180);
    f.beginPath(); f.moveTo(tx - 70, 92); f.lineTo(tx, -140); f.lineTo(tx + 70, 92); f.fill();
    f.fillRect(tx - 4, -200, 8, 70);
    f.fillStyle = 'rgba(12,12,20,0.8)';
    for (let k = -2; k <= 2; k++) f.fillRect(tx + k * 22 - 3, 300, 6, 600);
    f.fillStyle = 'rgba(255,190,120,0.5)';
    for (let y = 320; y < 700; y += 40) f.fillRect(tx - 40, y, 10, 16), f.fillRect(tx + 30, y + 20, 10, 16);
    f.strokeStyle = 'rgba(120,110,120,0.6)'; f.lineWidth = 2; f.beginPath(); f.moveTo(tx + 70, 92); f.lineTo(tx, -140); f.stroke();
    // terrace row facade
    row = mk(3000, 900);
    const c = row.ctx;
    const base = [16, 17, 25];
    let x = 0;
    const r2 = mulberry32(12);
    while (x < 3000) {
      const w = 230 + r2() * 70, h = 400 + r2() * 70;
      const y0 = 900 - h;
      c.fillStyle = rgba(mix(base, [40, 34, 38], r2() * 0.4));
      c.fillRect(x, y0, w, h);
      // gable + chimney
      c.fillStyle = rgba(base);
      c.beginPath(); c.moveTo(x - 6, y0); c.lineTo(x + w * 0.5, y0 - 80 - r2() * 30); c.lineTo(x + w + 6, y0); c.fill();
      c.fillRect(x + w * 0.78, y0 - 100, 30, 72);
      for (let k = 0; k < 3; k++) c.fillRect(x + w * 0.78 + 2 + k * 10, y0 - 112, 6, 14);
      // bay windows: a few warm, most dark
      for (let fl = 0; fl < 3; fl++) {
        for (let k = 0; k < 2; k++) {
          const wx = x + 36 + k * (w * 0.5), wy = y0 + 56 + fl * 112, ww = w * 0.24, wh = 62;
          const on = h2(Math.floor(x) + k, fl) < 0.42;
          if (on) {
            const g = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 4, wx + ww / 2, wy + wh / 2, wh * 0.8);
            const warm = mix([240, 150, 70], [255, 200, 130], h2(k, fl + x));
            g.addColorStop(0, rgba(warm, 0.95)); g.addColorStop(1, rgba(mix(warm, [90, 50, 30], 0.5), 0.9));
            c.fillStyle = g;
          } else c.fillStyle = rgba([26, 28, 40]);
          c.fillRect(wx, wy, ww, wh);
          c.beginPath(); c.arc(wx + ww / 2, wy, ww / 2, Math.PI, TAU); c.fill();
          c.fillStyle = rgba(base);
          c.fillRect(wx + ww / 2 - 2, wy - 8, 4, wh + 8);
          c.fillRect(wx, wy + 28, ww, 3);
          if (on && h2(k + 5, fl) < 0.5) { c.fillStyle = 'rgba(20,14,14,0.7)'; c.fillRect(wx, wy - ww / 2, ww * 0.3, wh + ww / 2); }
        }
      }
      // door
      c.fillStyle = rgba([10, 10, 14]);
      c.fillRect(x + w * 0.42, 900 - 110, 44, 110);
      x += w + 4;
    }
  }
  function lampPost(ctx, x, y, s) {
    ctx.fillStyle = '#07080c';
    ctx.fillRect(x - 5 * s, y - 330 * s, 10 * s, 330 * s);
    ctx.fillRect(x - 12 * s, y - 30 * s, 24 * s, 30 * s);
    ctx.beginPath(); ctx.moveTo(x - 22 * s, y - 330 * s); ctx.lineTo(x + 22 * s, y - 330 * s); ctx.lineTo(x + 14 * s, y - 380 * s); ctx.lineTo(x - 14 * s, y - 380 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 26 * s, y - 380 * s); ctx.lineTo(x, y - 410 * s); ctx.lineTo(x + 26 * s, y - 380 * s); ctx.fill();
  }
  // Tracer's route (plane z = 1000)
  const TR = [[7.2, 330, 520], [7.7, 640, 700], [8.2, 930, 880], [8.7, 1340, 880]];
  function tracerAt(lt) {
    let p = TR[0], k = 0;
    for (let i = 0; i < TR.length; i++) if (lt >= TR[i][0]) { p = TR[i]; k = i; }
    return { x: p[1], y: p[2], k };
  }
  function draw(ctx, t, lt) {
    const cam = { x: kf([[0, -140], [12.5, 100]], lt, Ease.inOutSine), y: kf([[0, -20], [12.5, 10]], lt), z: kf([[0, 0], [12.5, 200]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -120, 8000);
    drawL(ctx, cam, clouds, W / 2 - 1300, -40, 6000, 0.95);
    drawL(ctx, cam, far, W / 2 - 1300, ST - 1150, 4000);
    // clock face glow
    const [cx, cy, cs] = proj(cam, W / 2 - 1300 + 1250, ST - 1150 + 480, 4000);
    ctx.fillStyle = rgba([255, 225, 160], 0.95);
    ctx.beginPath(); ctx.arc(cx, cy, 42 * cs, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,0.8)'; ctx.lineWidth = 3 * cs;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 26 * cs * Math.cos(-1.2), cy + 26 * cs * Math.sin(-1.2)); ctx.moveTo(cx, cy); ctx.lineTo(cx + 34 * cs * Math.cos(0.4), cy + 34 * cs * Math.sin(0.4)); ctx.stroke();
    glow(ctx, cx, cy, 180 * cs, [255, 200, 130], 0.5);
    // fog between
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, [40, 44, 60], 0], [0.55, [60, 60, 72], 0.35], [0.8, [60, 55, 60], 0.0]]);
    ctx.fillRect(0, 0, W, H);
    drawL(ctx, cam, row, W / 2 - 1500, ST - 900, 1800);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.2, [50, 56, 76], 0], [0.7, [50, 56, 76], 0.22], [0.75, [30, 30, 40], 0]]);
    ctx.fillRect(0, 0, W, H);
    // street + reflection
    const [, sy] = proj(cam, 0, ST, 1800);
    ctx.fillStyle = vgrad(ctx, sy, H, [[0, [22, 22, 30]], [1, [8, 8, 12]]]);
    ctx.fillRect(0, sy, W, H - sy);
    Env.reflect(ctx, ctx.canvas, sy, H, t, { amp: 5, alpha: 0.42, step: 3 });
    // cobble highlights
    ctx.fillStyle = 'rgba(160,170,200,0.05)';
    for (let i = 0; i < 160; i++) ctx.fillRect(h1(i) * W, sy + Math.pow(h1(i * 3), 2) * (H - sy), 30 + h1(i * 5) * 60, 1.5);
    // lamps
    const lamps = [220, 1060, 1900];
    lamps.forEach((lx) => {
      withPlane(ctx, cam, 1000, (c) => lampPost(c, lx, 900, 1));
      const [gx, gy, gs] = proj(cam, lx, 900 - 360, 1000);
      glow(ctx, gx, gy, 380 * gs, [255, 170, 90], 0.55);
      glow(ctx, gx, gy, 40 * gs, [255, 240, 200], 1, 1);
      // light pool + reflection streak
      const [px, py] = proj(cam, lx, 905, 1000);
      glow(ctx, px, py, 260 * gs, [255, 160, 80], 0.25);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, py, 0, H);
      g.addColorStop(0, 'rgba(255,170,90,0.35)'); g.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = g; ctx.fillRect(px - 18 * gs, py, 36 * gs, H - py); ctx.restore();
      // lit rain inside the lamp cone
      ctx.save();
      ctx.beginPath(); ctx.arc(gx, gy + 150 * gs, 260 * gs, 0, TAU); ctx.clip();
      rain(ctx, t, 90, 0.8, { col: [255, 210, 160], seed: lx, len: 30, speed: 2200 });
      ctx.restore();
    });
    // omnic walks in and shares the umbrella
    const walkU = clamp(lt / 3.4);
    const ox = lerp(1480, 1195, Ease.out(walkU));
    const walking = lt < 3.3;
    const opose = walking ? Rig.lerpPose(Pose.stand, Rig.run((lt * 0.9) % 1, 0.28), 1) : Rig.lerpPose(Pose.stand, { sR: 1.0, eR: -0.85, sL: 0.1, eL: 0.05, head: 0.25, lean: 0.06, hL: -0.07, hR: 0.07 }, 1);
    const umb = { sR: 1.0, eR: -0.85 };
    if (walking) Object.assign(opose, umb);
    const heroOpts = { body: [8, 9, 14], rim: [255, 190, 130], rimOff: [3, -1] };
    withPlane(ctx, cam, 1000, (c) => {
      drawHero(c, HERO.child, 1060, 905, 1.75, Rig.lerpPose(Pose.stand, Pose.lookUp, ss(3.2, 4.2, lt)), t, Object.assign({ coat: true }, heroOpts));
      drawHero(c, HERO.omnic, ox, 905, 1.65, opose, t, Object.assign({ umbrella: true, flip: -1 }, heroOpts));
    });
    // Tracer blinking in
    if (lt > 7.0 && lt < 11.6) {
      const T = tracerAt(lt);
      withPlane(ctx, cam, 1000, (c) => {
        for (let i = 1; i < TR.length; i++) {
          const age = lt - TR[i][0];
          if (age < 0 || age > 0.6) continue;
          const a = 1 - age / 0.6;
          glowLine(c, [[TR[i - 1][1], TR[i - 1][2] - 120], [TR[i][1], TR[i][2] - 120]], [90, 190, 255], 16, a);
          drawHero(c, HERO.tracer, TR[i - 1][1], TR[i - 1][2], 1.6, Rig.run(0.25, 1), t, { body: [60, 140, 255], alpha: a * 0.35, emit: a });
        }
        const pose = T.k < 3 ? Rig.run(0.3 + lt, 1) : Rig.lerpPose(Rig.run(0.3, 1), Pose.heroic, ss(8.7, 9.2, lt));
        drawHero(c, HERO.tracer, T.x, T.y, 1.6, pose, t, { body: [8, 9, 14], rim: [150, 210, 255], rimOff: [3, -1], flip: T.k < 3 ? 1 : -1 });
        if (lt - TR[T.k][0] < 0.25) glow(c, T.x, T.y - 120, 220, [120, 200, 255], 1 - (lt - TR[T.k][0]) / 0.25);
      });
    }
    // exit blink
    if (lt >= 11.6 && lt < 12.4) {
      withPlane(ctx, cam, 1000, (c) => glowLine(c, [[1340, 760], [2300, 600]], [90, 190, 255], 18, 1 - (lt - 11.6) / 0.8));
    }
    // bird passes through the rain towards the clock tower
    if (lt > 0.8 && lt < 5.5) {
      const u = (lt - 0.8) / 4.7;
      bird(ctx, lerp(-60, W * 0.8, u), lerp(420, 250, u) + Math.sin(u * 8) * 12, lerp(1.6, 0.8, u), t, 1, 1, 0.9);
    }
    // foreground railing
    withPlane(ctx, cam, 560, (c) => {
      c.fillStyle = '#030305';
      c.fillRect(-400, 1000, 2800, 10);
      c.fillRect(-400, 1060, 2800, 200);
      for (let x = -400; x < 2800; x += 46) { c.fillRect(x, 990, 6, 80); c.beginPath(); c.moveTo(x - 6, 992); c.lineTo(x + 3, 972); c.lineTo(x + 12, 992); c.fill(); }
    });
    rain(ctx, t, 520, 0.4, { col: [190, 205, 235], seed: 3 });
    rain(ctx, t, 40, 0.5, { col: [210, 220, 255], seed: 9, len: 90, speed: 3800 });
    // splashes
    for (let i = 0; i < 60; i++) {
      const ph = fract(t * 2.2 + h1(i * 5));
      const x = h1(i * 13 + Math.floor(t * 2.2 + h1(i * 5))) * W;
      const y = sy + 30 + h1(i * 7) * (H - sy - 30);
      ctx.strokeStyle = `rgba(200,210,235,${(1 - ph) * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, 10 * ph + 2, 3 * ph + 1, 0, 0, TAU); ctx.stroke();
    }
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 27.5 + 0.9, 4.2, '国王大道', "KING'S ROW", '英国 · 伦敦  ENGLAND · LONDON');
    heroTag(ctx, t, 27.5 + 9.0, 2.6, '猎空', 'TRACER', [255, 150, 40], W - 140, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.6, bloomThresh: 0.66, texts: ['国王大道', "KING'S ROW", '英国 · 伦敦  ENGLAND · LONDON', '猎空', 'TRACER'] };
})();

// ============================================================ HANAMURA (dragons)
Scenes.hanamura = (() => {
  let sky, clouds, fuji, hills, castle, town, trees, branch;
  const GY = 830;
  function init() {
    sky = Env.sky(2600, 1800, [[0, [22, 16, 52]], [0.35, [80, 40, 100]], [0.62, [210, 100, 130]], [0.78, [255, 160, 120]], [0.9, [255, 200, 150]], [1, [255, 210, 160]]]);
    clouds = Env.clouds(2600, 900, { seed: 31, scale: 0.0018, cover: -0.1, sharp: 2, lit: [255, 180, 160], shade: [110, 60, 110], light: [0.5, 1], res: 0.4, stretch: 4, fadeTop: 0.3 });
    fuji = Env.ridge(2600, 700, { seed: 5, base: 1.1, amp: 0.1, freq: 0.001, top: [150, 100, 150], bottom: [190, 130, 150], peaks: [[900, 150, 330, 0.55]], snow: [255, 225, 235], snowLine: 0.3 });
    hills = Env.ridge(2600, 500, { seed: 6, base: 0.6, amp: 0.3, freq: 0.0025, top: [105, 60, 105], bottom: [120, 70, 110] });
    // castle
    castle = mk(900, 900);
    const c = castle.ctx;
    const cc = [52, 30, 62];
    c.fillStyle = rgba(cc);
    c.beginPath(); c.moveTo(150, 900); c.lineTo(220, 640); c.lineTo(680, 640); c.lineTo(750, 900); c.fill();
    const tiers = [[640, 460, 70], [520, 380, 64], [410, 300, 58], [305, 220, 52]];
    tiers.forEach(([y, w, h], i) => {
      c.fillStyle = rgba(mix([230, 200, 210], cc, 0.55));
      c.fillRect(450 - w * 0.36, y - h * 1.6, w * 0.72, h * 1.6);
      Env.windows(c, 450 - w * 0.36, y - h * 1.5, w * 0.72, h * 1.2, { cw: 12, chh: 12, gx: 16, gy: 18, lit: 0.6, col: [255, 190, 120], seed: i + 3, dim: null });
      c.fillStyle = rgba(cc);
      Env.roof(c, 450, y - h * 1.5 + 6, w, h * 0.9, 0.35);
    });
    c.fillRect(440, 110, 20, 60);
    // town roofs
    town = mk(3000, 500);
    const tc = town.ctx;
    const r = mulberry32(44);
    for (let x = 0; x < 3000; x += 120 + r() * 80) {
      const w = 140 + r() * 120, y = 300 + r() * 90;
      tc.fillStyle = rgba([64, 36, 66]);
      tc.fillRect(x - w * 0.4, y, w * 0.8, 500 - y);
      Env.windows(tc, x - w * 0.4, y + 10, w * 0.8, 60, { cw: 14, chh: 18, gx: 10, gy: 12, lit: 0.5, col: [255, 180, 110], seed: Math.floor(x), dim: null });
      tc.fillStyle = rgba([48, 26, 52]);
      Env.roof(tc, x, y, w, 36, 0.3);
    }
    // cherry trees
    trees = mk(3000, 900);
    for (let i = 0; i < 9; i++) Env.blossomTree(trees.ctx, 150 + i * 340 + (h1(i) - 0.5) * 120, 900, 1.3 + h1(i * 3) * 0.5, 100 + i, [40, 22, 40], [[150, 60, 110], [255, 170, 205]], [255, 210, 225]);
    branch = mk(1100, 520);
    const b = branch.ctx;
    b.strokeStyle = '#140a14'; b.lineCap = 'round';
    b.lineWidth = 34; b.beginPath(); b.moveTo(-20, 40); b.quadraticCurveTo(400, 120, 900, 60); b.stroke();
    b.lineWidth = 16; b.beginPath(); b.moveTo(420, 100); b.quadraticCurveTo(560, 200, 720, 260); b.stroke();
    b.lineWidth = 10; b.beginPath(); b.moveTo(260, 80); b.quadraticCurveTo(300, 190, 360, 240); b.stroke();
    const rb = mulberry32(3);
    for (let i = 0; i < 260; i++) {
      const u = rb();
      const px = u < 0.5 ? rb() * 900 : 380 + rb() * 380, py = u < 0.5 ? 50 + rb() * 110 : 120 + rb() * 170;
      b.fillStyle = rgba(mix([90, 30, 70], [255, 180, 210], rb() * 0.8), 0.9);
      b.beginPath(); b.arc(px, py, 6 + rb() * 14, 0, TAU); b.fill();
    }
  }
  function torii(c, x, y, s) {
    c.fillStyle = '#4a1414';
    c.fillRect(x - 150 * s, y - 330 * s, 26 * s, 330 * s);
    c.fillRect(x + 124 * s, y - 330 * s, 26 * s, 330 * s);
    c.fillRect(x - 185 * s, y - 280 * s, 370 * s, 22 * s);
    c.beginPath();
    c.moveTo(x - 230 * s, y - 360 * s); c.quadraticCurveTo(x, y - 330 * s, x + 230 * s, y - 360 * s);
    c.lineTo(x + 215 * s, y - 330 * s); c.quadraticCurveTo(x, y - 305 * s, x - 215 * s, y - 330 * s); c.fill();
    c.fillRect(x - 10 * s, y - 330 * s, 20 * s, 50 * s);
  }
  const D0 = 6.4; // dragon launch (local time)
  function dragonPath(k, tau, cam) {
    const ph = k ? Math.PI : 0;
    return (u) => {
      const tt = Math.max(0, tau - (1 - u) * 2.2);
      const grow = Math.min(1, tt / 0.7);
      const ang = tt * 2.3 + ph;
      const R = 240 * grow;
      const x = 960 + Math.cos(ang) * R + (k ? 60 : -60) * (1 - grow);
      const y = 700 - tt * 330;
      const depth = Math.sin(ang);
      const [sx, sy, s] = proj(cam, x, y, 1000);
      return [sx, sy, (17 + 6 * depth) * s * (0.3 + 0.7 * Math.min(1, tt / 0.4)) * (u < 0.1 ? 0.3 + 0.7 * u / 0.1 : 1)];
    };
  }
  function draw(ctx, t, lt) {
    const tilt = ss(D0 + 0.5, 12.5, lt);
    const cam = { x: kf([[0, 60], [6, -30], [12.5, 0]], lt, Ease.inOutSine), y: lerp(20, -680, Ease.inOut(tilt)), z: kf([[0, 0], [6, 120], [12.5, 60]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -780, 8000);
    const [mx, my, ms] = proj(cam, 1420, 300, 7000);
    glow(ctx, mx, my, 520 * ms, [255, 200, 200], 0.35);
    ctx.fillStyle = 'rgba(255,238,235,0.92)'; ctx.beginPath(); ctx.arc(mx, my, 118 * ms, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,180,200,0.35)'; ctx.beginPath(); ctx.arc(mx - 30 * ms, my + 20 * ms, 30 * ms, 0, TAU); ctx.arc(mx + 40 * ms, my - 30 * ms, 18 * ms, 0, TAU); ctx.fill();
    drawL(ctx, cam, clouds, W / 2 - 1300, -300, 6000, 0.85);
    drawL(ctx, cam, fuji, W / 2 - 1300, GY - 700 - 20, 5000);
    drawL(ctx, cam, hills, W / 2 - 1300, GY - 430, 3500);
    drawL(ctx, cam, castle, 1160, GY - 900 + 60, 2200);
    drawL(ctx, cam, town, W / 2 - 1500, GY - 420, 1600);
    // lanterns in town
    for (let i = 0; i < 26; i++) {
      const [lx, ly, ls] = proj(cam, -300 + i * 110, GY - 60 + Math.sin(i * 1.7) * 30, 1600);
      glow(ctx, lx, ly, 26 * ls, [255, 140, 70], 0.8 + 0.2 * Math.sin(t * 3 + i), 1);
    }
    drawL(ctx, cam, trees, W / 2 - 1500, GY - 900 + 80, 1300);
    withPlane(ctx, cam, 1100, (c) => torii(c, 300, GY + 10, 1.25));
    // terrace
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = '#1a0e1c'; c.fillRect(-500, GY, 3000, 400);
      c.fillStyle = 'rgba(255,170,160,0.35)'; c.fillRect(-500, GY, 3000, 3);
      for (let x = -500; x < 2600; x += 90) { c.fillStyle = '#120912'; c.fillRect(x, GY - 60, 10, 60); }
      c.fillStyle = '#120912'; c.fillRect(-500, GY - 64, 3000, 8);
    });
    // brothers
    const draw1 = ss(5.6, 6.3, lt) * (1 - ss(D0 + 0.05, D0 + 0.2, lt));
    const opt = { body: [10, 6, 14], rim: [255, 190, 190], rimOff: [2, -1] };
    withPlane(ctx, cam, 1000, (c) => {
      const hp = lt < 5.4 ? Pose.stand : { lean: -0.05, sL: 1.5, eL: 0.05, sR: 1.45, eR: -1.9 - draw1 * 0.6, hL: -0.25, hR: 0.22, kR: -0.05 };
      drawHero(c, HERO.hanzo, 890, GY + 4, 1.55, Rig.lerpPose(Pose.stand, hp, ss(5.0, 5.6, lt)), t, Object.assign({ flip: -1, draw: draw1, arrow: draw1 }, opt));
      const gp = lt < 5.4 ? Pose.stand : { lean: 0.1, sL: -0.6, eL: 0.4, sR: 2.2, eR: 0.3, hL: -0.35, kL: 0.3, hR: 0.3, kR: -0.2 };
      const blade = lt > 5.5;
      drawHero(c, HERO.genji, 1040, GY + 4, 1.55, Rig.lerpPose(Pose.stand, gp, ss(5.0, 5.6, lt)), t, Object.assign({ flip: 1, blade, bladeAng: 2.4, bladeGlow: 0.4 + ss(5.8, 6.4, lt) * 1.5 }, opt));
    });
    // dragons
    if (lt > D0) {
      const tau = lt - D0;
      const a = ss(0, 0.3, tau);
      spiritDragon(ctx, dragonPath(0, tau, cam), [70, 150, 255], a, t, 1, 1.7);
      spiritDragon(ctx, dragonPath(1, tau - 0.15, cam), [90, 255, 110], a, t, 2, 1.7);
      const [fx, fy] = proj(cam, 960, 700, 1000);
      glow(ctx, fx, fy, 500, [180, 230, 255], pulse(tau, 0, 0.05, 0.5));
    }
    petals(ctx, t, 130, 0.9, { seed: 3, wind: 110 + ss(D0, D0 + 1, lt) * 250, fall: 70 });
    drawL(ctx, cam, branch, -140, -90, 420);
    petals(ctx, t + 3, 16, 0.9, { seed: 8, size: 16, wind: 180, fall: 90 });
  }
  function post(ctx, t, lt) {
    const f = pulse(lt, D0, 0.03, 0.4) * 0.6;
    if (f > 0.01) { ctx.fillStyle = `rgba(230,245,255,${f})`; ctx.fillRect(0, 0, W, H); }
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 40 + 0.7, 4.2, '花村', 'HANAMURA', '日本  JAPAN');
    heroTag(ctx, t, 40 + 3.6, 2.8, '半藏', 'HANZO', [90, 170, 255], 120, 150, 'left');
    heroTag(ctx, t, 40 + 4.1, 2.8, '源氏', 'GENJI', [120, 255, 90], W - 120, 150, 'right');
  }
  return { init, draw, post, overlay, xfade: 0.6, bloomThresh: 0.72, bloom: 0.6, texts: ['花村', 'HANAMURA', '日本  JAPAN', '半藏', 'HANZO', '源氏', 'GENJI'] };
})();

// ============================================================ NUMBANI (Efi & Orisa)
Scenes.numbani = (() => {
  let sky, far, mid, clouds;
  const GY = 850;
  function tower(c, x, base, w, h, col, rim, seed) {
    const r = mulberry32(seed * 7 + 1);
    const kind = seed % 4;
    c.fillStyle = rgba(col);
    c.beginPath();
    if (kind === 0) { // tapered spire with a halo ring
      c.moveTo(x - w / 2, base); c.lineTo(x - w * 0.2, base - h); c.lineTo(x, base - h - w * 0.9); c.lineTo(x + w * 0.2, base - h); c.lineTo(x + w / 2, base);
    } else if (kind === 1) { // capsule with crown
      c.moveTo(x - w / 2, base); c.lineTo(x - w / 2, base - h * 0.85); c.quadraticCurveTo(x - w / 2, base - h, x, base - h); c.quadraticCurveTo(x + w / 2, base - h, x + w / 2, base - h * 0.85); c.lineTo(x + w / 2, base);
    } else if (kind === 2) { // leaf-shaped tower that swells near the top
      c.moveTo(x - w * 0.3, base); c.bezierCurveTo(x - w * 0.2, base - h * 0.5, x - w * 0.7, base - h * 0.8, x, base - h - w * 0.3); c.bezierCurveTo(x + w * 0.7, base - h * 0.8, x + w * 0.2, base - h * 0.5, x + w * 0.3, base);
    } else { // stepped block with a disc
      c.rect(x - w / 2, base - h * 0.6, w, h * 0.6); c.rect(x - w * 0.35, base - h * 0.85, w * 0.7, h * 0.25); c.rect(x - w * 0.18, base - h, w * 0.36, h * 0.15);
    }
    c.closePath(); c.fill();
    if (kind === 0 || kind === 3) { c.beginPath(); c.ellipse(x, base - h * (kind ? 0.86 : 0.72), w * 0.9, w * 0.14, 0, 0, TAU); c.fill(); }
    if (rim) { c.save(); c.clip(); c.fillStyle = rgba(rim, 0.35); c.fillRect(x - w, base - h * 1.2, w * 0.55, h * 1.2); c.restore(); }
    // floor light bands
    c.fillStyle = rgba(mix(col, [255, 225, 160], 0.45), 0.6);
    for (let y = base - h * 0.75; y < base; y += 18 + (seed % 3) * 4) if (r() < 0.6) c.fillRect(x - w * 0.22, y, w * 0.44 * (0.4 + r() * 0.6), 2.5);
    // terrace gardens
    for (let k = 0; k < 3; k++) {
      const ty = base - h * (0.25 + k * 0.2);
      c.fillStyle = rgba(mix([50, 90, 50], col, 0.45));
      for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(x - w * 0.3 + r() * w * 0.6, ty, 5 + r() * 7, 0, TAU); c.fill(); }
    }
    // beacon
    c.fillStyle = 'rgba(255,240,200,0.9)'; c.fillRect(x - 2, base - h - (kind === 0 ? w * 0.9 : kind === 2 ? w * 0.3 : 0) - 14, 4, 14);
  }
  function init() {
    sky = Env.sky(2600, 1400, [[0, [60, 100, 170]], [0.4, [150, 150, 170]], [0.7, [255, 180, 110]], [0.86, [255, 210, 140]], [1, [255, 225, 170]]]);
    clouds = Env.clouds(2600, 700, { seed: 51, scale: 0.002, cover: -0.12, sharp: 2.2, lit: [255, 220, 170], shade: [170, 120, 120], light: [-1, 0.3], res: 0.4, stretch: 4 });
    far = mk(2800, 800);
    const f = far.ctx;
    const r = mulberry32(61);
    for (let i = 0; i < 26; i++) tower(f, 60 + i * 105 + r() * 40, 800, 40 + r() * 60, 150 + r() * 420, [205, 155, 125], null, i + 3);
    mid = mk(3000, 1000);
    const m = mid.ctx;
    const r2 = mulberry32(62);
    const col = [90, 62, 60];
    const pos = [];
    for (let i = 0; i < 11; i++) { const x = 100 + i * 270 + r2() * 60, w = 70 + r2() * 110, h = 300 + r2() * 560; pos.push([x, w, h]); tower(m, x, 1000, w, h, col, [255, 210, 140], i + 20); }
    // sky bridges
    m.strokeStyle = rgba(col); m.lineWidth = 10;
    for (let i = 0; i < pos.length - 1; i++) {
      const [x0, , h0] = pos[i], [x1, , h1_] = pos[i + 1];
      const y = 1000 - Math.min(h0, h1_) * 0.6;
      m.beginPath(); m.moveTo(x0, y); m.quadraticCurveTo((x0 + x1) / 2, y + 40, x1, y); m.stroke();
    }
    // the great arch
    m.lineWidth = 36; m.strokeStyle = rgba([70, 48, 48]);
    m.beginPath(); m.moveTo(1150, 1000); m.bezierCurveTo(1200, 420, 1800, 420, 1850, 1000); m.stroke();
    m.lineWidth = 4; m.strokeStyle = 'rgba(255,215,150,0.7)';
    m.beginPath(); m.moveTo(1136, 1000); m.bezierCurveTo(1186, 410, 1814, 410, 1864, 1000); m.stroke();
  }
  function banner(c, x, y, t, cols, seed) {
    c.fillStyle = '#1c120e'; c.fillRect(x - 3, y - 300, 6, 300);
    const wv = (k) => Math.sin(t * 3 + k * 0.08 + seed) * 10 * (k / 120);
    c.beginPath();
    c.moveTo(x, y - 295);
    for (let k = 0; k <= 120; k += 10) c.lineTo(x + k, y - 295 + wv(k));
    for (let k = 120; k >= 0; k -= 10) c.lineTo(x + k, y - 175 + wv(k));
    c.closePath();
    const g = c.createLinearGradient(x, 0, x + 120, 0);
    cols.forEach((cc, i) => g.addColorStop(i / (cols.length - 1), rgba(cc)));
    c.fillStyle = g; c.fill();
  }
  function draw(ctx, t, lt) {
    const cam = { x: kf([[0, -160], [10, 140]], lt, Ease.inOutSine), y: kf([[0, 0], [10, -40]], lt), z: kf([[0, 60], [10, 200]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -300, 9000);
    const [sx, sy] = proj(cam, 620, 560, 8000);
    glow(ctx, sx, sy, 900, [255, 170, 90], 0.55);
    glow(ctx, sx, sy, 110, [255, 245, 220], 1, 1);
    drawL(ctx, cam, clouds, W / 2 - 1300, 80, 7000, 0.8);
    drawL(ctx, cam, far, W / 2 - 1400, GY - 800 + 20, 4200, 0.85);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.3, [255, 200, 140], 0], [0.75, [255, 190, 130], 0.35]]);
    ctx.fillRect(0, 0, W, H);
    // hover train
    withPlane(ctx, cam, 2600, (c) => {
      c.fillStyle = 'rgba(80,58,56,0.9)'; c.fillRect(-800, 520, 3600, 8);
      const tx = -900 + ((lt * 520) % 4200);
      c.fillStyle = 'rgba(70,50,50,1)';
      c.beginPath(); c.moveTo(tx, 500); c.lineTo(tx + 520, 500); c.quadraticCurveTo(tx + 580, 505, tx + 560, 518); c.lineTo(tx, 518); c.fill();
      for (let k = 0; k < 12; k++) { c.fillStyle = 'rgba(255,220,160,0.9)'; c.fillRect(tx + 20 + k * 42, 505, 24, 6); }
    });
    drawL(ctx, cam, mid, W / 2 - 1500, GY - 1000 + 30, 2200);
    godRays(ctx, sx, sy, [255, 200, 130], 0.18, 2200, 16, 7, 1.6, 0.35, t);
    // plaza
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = vgrad(c, GY, GY + 300, [[0, [150, 100, 80]], [1, [60, 40, 36]]]);
      c.fillRect(-600, GY, 3200, 400);
      c.strokeStyle = 'rgba(255,210,150,0.25)'; c.lineWidth = 2;
      for (let x = -600; x < 2600; x += 120) { c.beginPath(); c.moveTo(x, GY); c.lineTo(x + (x - 960) * 0.8, GY + 300); c.stroke(); }
    });
    // crowd silhouettes
    withPlane(ctx, cam, 1300, (c) => {
      for (let i = 0; i < 16; i++) {
        const x = -200 + i * 150 + h1(i) * 60;
        const wave = { sL: -0.1, sR: 2.6 + Math.sin(t * 6 + i) * 0.3, eR: 0.2, hL: -0.07, hR: 0.07 };
        const kid = i % 3 === 2;
        const def = i % 4 === 1 ? HERO.omnic : kid ? HERO.child : HERO.civ;
        const sc = kid ? 1.25 : 0.95 + h1(i * 3) * 0.15;
        drawHero(c, def, x, GY + 20, sc, (i % 3 === 0 && lt > 5) ? wave : Pose.stand, t, { body: [70, 46, 44], rim: [255, 200, 140], rimOff: [3, 0], emit: 0.6, coat: true, hat: i % 5 === 0, flip: i % 2 ? 1 : -1 });
      }
    });
    // Orisa carries Efi across the plaza
    const walkU = clamp(lt / 5.6);
    const ox = lerp(250, 930, Ease.out(walkU));
    const walking = lt < 5.4;
    const ph = lt * 1.1;
    withPlane(ctx, cam, 1000, (c) => {
      const op = { lean: -0.05, sL: -0.2, eL: 0.3, sR: 0.35, eR: -0.3, ground: false, hy: walking ? Math.abs(Math.sin(ph * TAU)) * -4 : 0 };
      const o = { body: [20, 16, 18], rim: [255, 210, 150], rimOff: [3, 0], side: 0.7, walk: ph, walkAmt: walking ? 0.7 : 0, javelin: true };
      // Efi on her back
      const pointing = ss(6.0, 6.6, lt);
      drawHero(c, HERO.child, ox - 70, GY - 150 + op.hy, 1.15, { sL: -0.3, sR: lerp(0.4, 2.5, pointing), eR: 0.1, hL: -1.25, kL: 1.4, hR: 1.25, kR: -1.4, head: -0.3 * pointing, ground: false }, t, { body: [20, 16, 18], rim: [255, 210, 150], rimOff: [3, 0], scarf: true });
      drawHero(c, HERO.orisa, ox, GY - 110 + op.hy, 1.5, op, t, o);
    });
    // bird flies over
    if (lt > 5.2) {
      const u = clamp((lt - 5.2) / 4.8);
      bird(ctx, lerp(W * 0.25, W * 1.05, u), lerp(260, 140, u) + Math.sin(u * 9) * 10, 1.3, t, 1, 1, 1);
    }
    // foreground banners
    withPlane(ctx, cam, 520, (c) => {
      banner(c, -120, 1090, t, [[230, 120, 40], [250, 200, 60], [40, 150, 90]], 1);
      banner(c, 1980, 1090, t, [[40, 120, 200], [250, 200, 60], [210, 60, 50]], 2);
    });
    motes(ctx, t, 60, 0.4, [255, 220, 160], 31, 2.5, 12);
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 52.5 + 0.6, 4.0, '努巴尼', 'NUMBANI', '尼日利亚  NIGERIA');
    heroTag(ctx, t, 52.5 + 3.4, 3.0, '奥丽莎 & 艾菲', 'ORISA & EFI', [150, 255, 120], W - 120, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.6, bloomThresh: 0.68, texts: ['努巴尼', 'NUMBANI', '尼日利亚  NIGERIA', '奥丽莎 & 艾菲', 'ORISA & EFI'] };
})();
