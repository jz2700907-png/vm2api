// Scenes: the darkness, the battle, dawn, title and end card.
'use strict';

// ---------- shared pieces ----------
function mothership(ctx, x, y, s, t, a = 1, crack = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#07040a';
  ctx.beginPath();
  ctx.moveTo(-900, 40); ctx.lineTo(-520, -90); ctx.lineTo(-160, -150); ctx.lineTo(160, -150); ctx.lineTo(520, -90); ctx.lineTo(900, 40);
  ctx.lineTo(600, 90); ctx.lineTo(200, 170); ctx.lineTo(0, 260); ctx.lineTo(-200, 170); ctx.lineTo(-600, 90); ctx.closePath();
  ctx.fill();
  ctx.fillRect(-700, 40, 60, 200); ctx.fillRect(640, 40, 60, 200);
  ctx.restore();
  const pul = 0.75 + 0.25 * Math.sin(t * 4);
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(255,40,40,${0.7 * a * pul})`; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-820, 40); ctx.lineTo(-200, 150); ctx.lineTo(0, 230); ctx.lineTo(200, 150); ctx.lineTo(820, 40); ctx.stroke();
  for (let i = -6; i <= 6; i++) { ctx.fillStyle = `rgba(255,60,50,${0.8 * a})`; ctx.fillRect(i * 110 - 10, -60 + Math.abs(i) * 14, 20, 6); }
  if (crack > 0) {
    ctx.strokeStyle = `rgba(255,240,200,${crack * a})`; ctx.lineWidth = 6;
    const r = mulberry32(5);
    for (let k = 0; k < 7; k++) { let px = (r() - 0.5) * 900, py = (r() - 0.3) * 200; ctx.beginPath(); ctx.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (r() - 0.5) * 260 * crack; py += (r() - 0.5) * 120 * crack; ctx.lineTo(px, py); } ctx.stroke(); }
  }
  ctx.restore();
  glow(ctx, x, y + 150 * s, 380 * s, [255, 40, 40], 0.6 * a * pul);
  glow(ctx, x, y + 150 * s, 60 * s, [255, 220, 200], a, 1);
}

function titan(ctx, x, y, s, t, o = {}) {
  const { eye = 1, fire = 0, rim = [255, 80, 60] } = o;
  const def = {
    b: build({}),
    sil(c) {
      ell(c, 0, -300, 150, 120);
      poly(c, [[-200, -380], [200, -380], [150, -180], [-150, -180]]);
      ell(c, -210, -360, 80, 70); ell(c, 210, -360, 80, 70);
      circ(c, [0, -440], 55);
      taper(c, [-230, -330], [-280, -140], 60, 50); taper(c, [-280, -140], [-240, 20], 50, 70);
      taper(c, [230, -330], [300, -170], 60, 50); c.fillRect(260, -180, 90, 160);
      taper(c, [-80, -180], [-120, 120], 70, 60); taper(c, [80, -180], [120, 120], 70, 60);
      poly(c, [[-170, 100], [-60, 100], [-50, 140], [-190, 140]]); poly(c, [[60, 100], [170, 100], [190, 140], [50, 140]]);
    },
    emit(c) {
      glow(c, 0, -445, 80, [255, 50, 40], eye);
      glow(c, 0, -445, 20, [255, 220, 200], eye, 1);
      glow(c, 305, -20, 60 + 100 * fire, [255, 60, 40], 0.4 + fire);
      for (let i = 0; i < 5; i++) glow(c, -120 + i * 60, -300, 10, [255, 60, 40], 0.7, 1);
    },
    bbox: [-380, -520, 380, 160],
  };
  drawHero(ctx, def, x, y, s, { ground: false }, t, { body: [10, 6, 8], rim, rimOff: [3, -3] });
}

function drone(ctx, x, y, s, t, seed) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3 + seed) * 0.2);
  ctx.fillStyle = '#0a0508';
  ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(0, -16); ctx.lineTo(26, -6); ctx.lineTo(14, 12); ctx.lineTo(-14, 12); ctx.closePath(); ctx.fill();
  ctx.fillRect(-40, -4, 80, 4);
  ctx.restore();
  glow(ctx, x, y, 22 * s, [255, 50, 40], 0.9, 1);
}

const ROSTER = [
  ['winston', 250, 1.05, {}], ['kiriko', 400, 1.0, {}], ['tracer', 520, 1.0, {}], ['genji', 640, 1.0, { blade: false }],
  ['reinhardt', 820, 1.12, {}], ['mercy', 1000, 1.0, { wings: 0.35 }], ['juno', 1120, 1.0, {}], ['dva', 1280, 0.62, {}],
  ['hanzo', 1440, 1.0, {}], ['mei', 1545, 1.0, {}], ['lucio', 1650, 1.0, {}], ['soldier', 1760, 1.0, {}],
];
// hero line-up on a ridge. appear(i) -> 0..1 visibility per hero
function lineup(ctx, t, gy, s, o = {}) {
  const { rim = [255, 200, 150], body = [10, 8, 12], appear = () => 1, emit = 1, rimOff = [2, -2], x0 = 0 } = o;
  ROSTER.forEach(([k, x, sc, extra], i) => {
    const a = appear(i);
    if (a <= 0) return;
    const X = x0 + (x - 960) * s + 960, S = s * sc * 1.3;
    const opts = Object.assign({ body, rim, rimOff, alpha: a, emit: emit * a }, extra);
    if (k === 'dva') DVA.draw(ctx, X, gy, S, t, Object.assign({ boost: 0 }, opts, { body, rim }));
    else drawHero(ctx, HERO[k], X, gy, S, k === 'mercy' ? Object.assign({}, Pose.stand, { sR: 0.25 }) : k === 'reinhardt' ? Object.assign({}, Pose.heroic, { sR: 0.15, eR: 0 }) : Pose.heroic, t, opts);
    if (a < 1) glow(ctx, X, gy - 120 * S, 200 * S, extra.col || [255, 220, 180], (1 - a) * a * 3);
  });
}

// ============================================================ THE DARKNESS
Scenes.darkness = (() => {
  let sky, storm, city, cityLit, roof;
  const GY = 900;
  function eiffel(c, x, base, h) {
    c.beginPath();
    c.moveTo(x - h * 0.28, base); c.quadraticCurveTo(x - h * 0.1, base - h * 0.45, x - h * 0.02, base - h * 0.92);
    c.lineTo(x, base - h); c.lineTo(x + h * 0.02, base - h * 0.92);
    c.quadraticCurveTo(x + h * 0.1, base - h * 0.45, x + h * 0.28, base);
    c.lineTo(x + h * 0.17, base); c.quadraticCurveTo(x, base - h * 0.22, x - h * 0.17, base); c.closePath(); c.fill();
    c.fillRect(x - h * 0.16, base - h * 0.28, h * 0.32, h * 0.025);
    c.fillRect(x - h * 0.08, base - h * 0.55, h * 0.16, h * 0.02);
  }
  function init() {
    sky = Env.sky(2600, 1400, [[0, [30, 20, 50]], [0.5, [120, 60, 80]], [0.8, [230, 120, 80]], [1, [255, 170, 110]]]);
    storm = Env.clouds(3200, 900, { seed: 131, scale: 0.0016, cover: 0.25, sharp: 1.8, lit: [140, 40, 50], shade: [12, 6, 14], light: [0, 1], res: 0.35, stretch: 2.5, fadeBottom: 0.4 });
    city = mk(2800, 700);
    cityLit = mk(2800, 700);
    const c = city.ctx, l = cityLit.ctx;
    const r = mulberry32(132);
    c.fillStyle = '#140a14';
    eiffel(c, 1500, 700, 560);
    for (let x = 0; x < 2800; x += 70 + r() * 70) {
      const w = 80 + r() * 90, h = 110 + r() * 170;
      c.fillStyle = '#140a14'; c.fillRect(x, 700 - h, w, h);
      c.beginPath(); c.moveTo(x - 4, 700 - h); c.lineTo(x + w / 2, 700 - h - 26); c.lineTo(x + w + 4, 700 - h); c.fill();
      Env.windows(l, x, 700 - h + 10, w, h - 10, { cw: 6, chh: 9, gx: 7, gy: 10, lit: 0.4, col: [255, 190, 110], seed: Math.floor(x), dim: null });
    }
    roof = mk(3000, 400);
    const q = roof.ctx;
    q.fillStyle = '#050305';
    q.fillRect(0, 60, 3000, 340);
    for (let x = 0; x < 3000; x += 260) { q.fillRect(x + 40, 0, 60, 70); q.fillRect(x + 200, 30, 20, 40); }
  }
  function draw(ctx, t, lt) {
    const dark = ss(1.2, 4.2, lt);
    const cam = { x: kf([[0, -40], [10, 40]], lt), y: kf([[0, 0], [5, -30], [8.7, 20]], lt), z: kf([[0, 0], [5, 60], [8.7, 220]], lt, Ease.inOut) };
    drawL(ctx, cam, sky, W / 2 - 1300, -350, 9000);
    ctx.fillStyle = `rgba(20,4,8,${dark * 0.85})`; ctx.fillRect(0, 0, W, H);
    // red horizon glow as the fleet arrives
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.3, [255, 40, 30], 0], [0.75, [200, 30, 30], 0.45 * dark]]);
    ctx.fillRect(0, 0, W, H);
    // mothership descending out of the clouds
    const [mx, my, ms] = proj(cam, 960, lerp(-500, 120, Ease.out(ss(1.2, 6, lt))), 5000);
    mothership(ctx, mx, my, 0.9 * ms, t, ss(1.2, 2.4, lt));
    const sx = (t * 25) % 400;
    drawL(ctx, cam, storm, W / 2 - 1600 - sx, -200, 4500, 0.35 + dark * 0.65);
    // red lightning
    for (const [lt0, x0, x1] of [[2.0, 500, 700], [3.3, 1500, 1300], [4.6, 900, 1100], [6.8, 300, 450]]) {
      const a = pulse(lt, lt0, 0.02, 0.25);
      if (a > 0.02) { lightning(ctx, x0, 60, x1, 620, Math.floor(lt0 * 10), [255, 60, 60], 4, a); glow(ctx, x1, 200, 700, [255, 60, 60], a * 0.4); }
    }
    // scanning beams
    for (let k = 0; k < 3; k++) {
      const ang = Math.PI / 2 + Math.sin(t * 0.8 + k * 2) * 0.5;
      const a = ss(2.0, 3.0, lt) * 0.35;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(mx, my, mx + Math.cos(ang) * 1200, my + Math.sin(ang) * 1200);
      g.addColorStop(0, `rgba(255,60,50,${a})`); g.addColorStop(1, 'rgba(255,60,50,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(mx, my + 100 * ms);
      ctx.lineTo(mx + Math.cos(ang - 0.06) * 1400, my + Math.sin(ang - 0.06) * 1400); ctx.lineTo(mx + Math.cos(ang + 0.06) * 1400, my + Math.sin(ang + 0.06) * 1400); ctx.fill(); ctx.restore();
    }
    // city: lights go out in a sweeping wave
    drawL(ctx, cam, city, W / 2 - 1400, GY - 700 - 60, 2600);
    const [cx0, cy0, cs] = proj(cam, W / 2 - 1400, GY - 760, 2600);
    const wave = ss(1.6, 4.8, lt);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx0 + 2800 * cs * wave, 0, W * 2, H); ctx.clip();
    ctx.drawImage(cityLit, cx0, cy0, 2800 * cs, 700 * cs);
    ctx.restore();
    // drones
    for (let i = 0; i < 40; i++) {
      const u = fract(h1(i) + lt * 0.05);
      const [dx, dy, ds] = proj(cam, -300 + h1(i * 3) * 2400 + Math.sin(t + i) * 60, 150 + h1(i * 5) * 400 + Math.cos(t * 0.7 + i) * 30, 3500);
      if (lt > 2 + h1(i * 7) * 2) glow(ctx, dx, dy, 8 * ds, [255, 50, 40], 0.9, 1);
    }
    // rooftop and the heroes answering the call
    drawL(ctx, cam, roof, W / 2 - 1500, GY - 60, 1000);
    const [lx, ly, lsc] = proj(cam, 960, GY, 1000);
    lineup(ctx, t, ly, lsc * 1.25, { rim: [255, 90, 70], rimOff: [2, -3], body: [8, 4, 6], x0: lx - 960, appear: (i) => ss(5.0 + [7, 5, 2, 3, 0, 4, 1, 6, 8, 9, 10, 11][i] * 0.28, 5.25 + [7, 5, 2, 3, 0, 4, 1, 6, 8, 9, 10, 11][i] * 0.28, lt) });
    embers(ctx, t, 60, 0.7 * dark, { seed: 131, col: [255, 90, 50], rise: 80, size: 2.5 });
    // cut to black before the drop
    const blk = ss(8.6, 8.9, lt);
    if (blk > 0) { ctx.fillStyle = `rgba(0,0,0,${blk})`; ctx.fillRect(0, 0, W, H); }
    if (lt > 9.3) { const g = pulse(lt, 9.4, 0.3, 0.4); glow(ctx, W / 2, H / 2, 300, [120, 190, 255], g); ring(ctx, W / 2, H / 2, 40 + (lt - 9.3) * 300, [120, 190, 255], 3, g, 0.4); }
  }
  return { init, draw, xfade: 0.4, vignette: 0.65 };
})();

// ============================================================ THE BATTLE
Scenes.battle = (() => {
  let sky, smoke, ruins, ruins2, ground, bufS;
  const GY = 900;
  function init() {
    sky = Env.sky(2800, 1500, [[0, [10, 4, 10]], [0.5, [60, 12, 18]], [0.85, [150, 40, 30]], [1, [200, 70, 40]]]);
    smoke = Env.clouds(3200, 900, { seed: 141, scale: 0.0018, cover: 0.2, sharp: 1.6, lit: [170, 60, 40], shade: [18, 8, 12], light: [0, 1], res: 0.35, stretch: 2.2 });
    const mkRuins = (seed, col, hmin, hmax) => {
      const c = mk(3400, 800);
      const q = c.ctx;
      const r = mulberry32(seed);
      q.fillStyle = rgba(col);
      for (let x = 0; x < 3400; x += 90 + r() * 120) {
        const w = 110 + r() * 160, h = hmin + r() * (hmax - hmin);
        q.beginPath(); q.moveTo(x, 800); q.lineTo(x, 800 - h);
        for (let k = 1; k <= 5; k++) q.lineTo(x + (w * k) / 5, 800 - h + (r() - 0.3) * 80);
        q.lineTo(x + w, 800); q.fill();
        for (let k = 0; k < 6; k++) { q.fillStyle = r() < 0.3 ? 'rgba(255,120,50,0.8)' : rgba(mix(col, [0, 0, 0], 0.4)); q.fillRect(x + 10 + r() * (w - 30), 800 - h + 40 + r() * (h - 60), 10, 14); q.fillStyle = rgba(col); }
      }
      return c;
    };
    ruins = mkRuins(142, [30, 12, 16], 250, 560);
    ruins2 = mkRuins(143, [14, 6, 8], 150, 360);
    ground = mk(3400, 400);
    const g = ground.ctx;
    g.fillStyle = vgrad(g, 0, 400, [[0, [30, 12, 12]], [1, [8, 4, 6]]]);
    g.fillRect(0, 30, 3400, 370);
    const r = mulberry32(144);
    for (let i = 0; i < 90; i++) { g.fillStyle = '#0c0608'; const x = r() * 3400, w = 20 + r() * 90; g.beginPath(); g.moveTo(x, 40); g.lineTo(x + w * 0.3, 40 - r() * 50); g.lineTo(x + w, 40); g.fill(); }
    bufS = mk(W, H);
  }
  function bg(ctx, cam, t, o = {}) {
    drawL(ctx, cam, sky, W / 2 - 1400, -420, 9000);
    const [mx, my, ms] = proj(cam, 1000, o.shipY || 40, 6000);
    mothership(ctx, mx, my, 0.8 * ms, t, 1, o.crack || 0);
    drawL(ctx, cam, smoke, W / 2 - 1600 - (t * 30) % 300, -150, 4500, 0.9);
    drawL(ctx, cam, ruins, W / 2 - 1700, GY - 800 + 40, 3000);
    for (let i = 0; i < 9; i++) { const [fx, fy, fs] = proj(cam, -400 + i * 380, GY - 40 - h1(i) * 200, 3000); glow(ctx, fx, fy, (140 + 40 * Math.sin(t * 5 + i)) * fs, [255, 110, 40], 0.5); }
    drawL(ctx, cam, ruins2, W / 2 - 1700, GY - 800 + 60, 1800);
    drawL(ctx, cam, ground, W / 2 - 1700, GY - 30, 1000);
    return [mx, my, ms];
  }
  // local-time cue list (every 2.5 s is one shot)
  const S = (lt) => Math.min(11, Math.floor(lt / 2.5));
  function barrier(c, x, y, h, t, a, cracks = 0) {
    const clip = (cc) => { cc.beginPath(); cc.moveTo(x, y - h); cc.quadraticCurveTo(x + 70, y - h / 2, x, y); cc.lineTo(x + 18, y); cc.quadraticCurveTo(x + 88, y - h / 2, x + 18, y - h); cc.closePath(); };
    const clipWide = (cc) => { cc.beginPath(); cc.ellipse(x + 30, y - h / 2, 70, h / 2, 0, 0, TAU); };
    hexField(c, clipWide, [110, 190, 255], a, t, 16, x - 60, y - h, x + 120, y, cracks, 3);
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba([180, 225, 255], 0.9 * a); c.lineWidth = 3;
    c.beginPath(); c.ellipse(x + 30, y - h / 2, 70, h / 2, 0, -Math.PI / 2, Math.PI / 2); c.stroke(); c.restore();
  }
  function shot1(ctx, t, lt) { // Reinhardt holds the line
    const u = lt;
    const hits = [0.3, 0.7, 1.0, 1.4, 1.7, 2.1, 2.4, 2.9, 3.2, 3.6, 3.9, 4.3, 4.6];
    let sh = 0; hits.forEach((h) => (sh += pulse(u, h, 0.01, 0.12)));
    const s0 = shake(t, 10 * Math.min(1.5, sh) + 30 * pulse(u, 0, 0.01, 0.3));
    const cam = { x: kf([[0, -80], [5, 40]], u) + s0[0], y: s0[1], z: kf([[0, 0], [5, 260]], u, Ease.out) };
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => {
      const o = { body: [8, 5, 8], rim: [120, 190, 255], rimOff: [3, -2] };
      drawHero(c, HERO.mercy, 430, GY - 170 + Math.sin(t * 2) * 8, 1.7, Object.assign({}, Pose.float, { sR: 1.2, eR: 0.1 }), t, Object.assign({ wings: 0.8 }, o));
      glowLine(c, [[530, GY - 400], [760, GY - 280]], [255, 220, 120], 4, 0.7);
      drawHero(c, HERO.juno, 560, GY, 1.7, Pose.heroic, t, o);
      drawHero(c, HERO.reinhardt, 790, GY, 2.1, { lean: 0.12, sL: 1.2, eL: 0.35, sR: 0.25, eR: 0.1, hL: -0.35, kL: 0.2, hR: 0.4, kR: -0.3 }, t, Object.assign({ hammerAng: 0.2 }, o));
      barrier(c, 900, GY + 10, 470, t, 1, 0);
    });
    // enemy fire from the right
    for (let i = 0; i < 16; i++) {
      const t0 = i * 0.3 + 0.1, v = (u - t0) / 0.25;
      if (v < 0 || v > 1.4) continue;
      const [ex, ey] = proj(cam, 930, GY - 120 - h1(i) * 320, 1000);
      const sx = W + 100, sy = 200 + h1(i * 3) * 500;
      if (v < 1) glowLine(ctx, [[lerp(sx, ex, v) + 120, lerp(sy, ey, v)], [lerp(sx, ex, v), lerp(sy, ey, v)]], [255, 60, 40], 7, 1);
      else { glow(ctx, ex, ey, 160 * (1.4 - v), [150, 210, 255], (1.4 - v) * 2.4); glow(ctx, ex, ey, 40, [255, 255, 255], (1.4 - v) * 2.5, 1); }
    }
    for (let i = 0; i < 12; i++) { const [dx, dy, ds] = proj(cam, 1500 + h1(i) * 600, 250 + h1(i * 3) * 400 + Math.sin(t * 2 + i) * 30, 2200); drone(ctx, dx, dy, 1.3 * ds, t, i); }
    shockwave(ctx, W / 2, GY - 40, u, 0, [150, 210, 255], 1600, 1.0, 0.25);
  }
  function shot2(ctx, t, lt) { // Tracer's pulse bomb
    const u = lt - 5;
    const cam = { x: kf([[0, -60], [2.5, 80]], u), y: 0, z: 120 };
    const boom = 1.55;
    const s0 = shake(t, 34 * pulse(u, boom, 0.01, 0.4)); cam.x += s0[0]; cam.y += s0[1];
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => titan(c, 1500, GY + 40, 1.3, t));
    const P = [[0.0, 200, GY], [0.3, 520, GY - 60], [0.6, 820, GY], [0.9, 1080, GY - 30]];
    let k = 0; P.forEach((p, i) => { if (u >= p[0]) k = i; });
    withPlane(ctx, cam, 1000, (c) => {
      for (let i = 1; i <= k; i++) { const age = u - P[i][0]; if (age < 0.5) glowLine(c, [[P[i - 1][1], P[i - 1][2] - 110], [P[i][1], P[i][2] - 110]], [90, 190, 255], 18, 1 - age / 0.5); }
      const throwP = ss(0.95, 1.15, u);
      drawHero(c, HERO.tracer, P[k][1], P[k][2], 1.8, k < 3 ? Rig.run(u * 2, 1) : { lean: 0.15, sL: -0.5, sR: lerp(-0.5, 2.2, throwP), eR: 0.2, hL: -0.4, kL: 0.3, hR: 0.5, kR: -0.2 }, t, { body: [8, 6, 10], rim: [140, 210, 255], rimOff: [-3, -2] });
      // bomb flight + stick
      if (u > 1.1 && u < boom) {
        const v = clamp((u - 1.1) / 0.25);
        const bx = lerp(1110, 1480, v), by = lerp(GY - 220, GY - 380, v) - Math.sin(v * Math.PI) * 60;
        glow(c, bx, by, 60, [90, 200, 255], 0.9 + 0.1 * Math.sin(t * 40));
        glow(c, bx, by, 14, [255, 255, 255], 1, 1);
      }
    });
    const [bx, by] = proj(cam, 1480, GY - 380, 1000);
    explosion(ctx, bx, by, u, boom, [90, 190, 255], 360, 1.3);
    shockwave(ctx, bx, by, u, boom, [150, 220, 255], 1800, 0.8, 0.5);
  }
  function shot3(ctx, t, lt) { // Ana nano-boosts Genji -> dragonblade
    const u = lt - 7.5;
    const cam = { x: kf([[0, 60], [2.5, -60]], u), y: -20, z: kf([[0, 60], [2.5, 200]], u) };
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = '#0a0406'; c.fillRect(-300, 620, 620, 600);
      drawHero(c, HERO.ana, 230, 620, 1.6, Pose.aimR, t, { body: [8, 5, 8], rim: [255, 200, 120], rimOff: [3, -2] });
      const nano = ss(0.55, 0.8, u);
      const G = [120, 255, 90];
      if (u > 0.3 && u < 0.6) { const v = (u - 0.3) / 0.3; glowLine(c, [[420, 560], [lerp(420, 1180, v), lerp(560, GY - 150, v)]], [255, 220, 90], 8, 1); }
      const slash = u > 1.0;
      drawHero(c, HERO.genji, 1200, GY, 2.0, slash ? { lean: 0.35, sL: -1.2, eL: 0.4, sR: lerp(-1.5, 2.6, clamp((u - 1.0) * 3 % 1)), eR: 0.2, hL: -0.6, kL: 0.8, hR: 0.6, kR: -0.3 } : Pose.heroic, t,
        { body: [8, 5, 8], rim: mix([255, 200, 120], G, nano), rimOff: [-3, -2], blade: u > 0.8, bladeAng: 2.2, bladeGlow: 2 });
      if (nano > 0) { glow(c, 1200, GY - 150, 260, [180, 120, 255], nano * 0.5); glow(c, 1200, GY - 150, 120, [255, 220, 90], nano * 0.6 * pulse(u, 0.6, 0.05, 0.5)); }
      // slash arcs
      for (let k = 0; k < 3; k++) {
        const t0 = 1.05 + k * 0.38, v = (u - t0) / 0.35;
        if (v < 0 || v > 1) continue;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = rgba(G, (1 - v) * 0.9); c.lineWidth = 26 * (1 - v) + 4;
        c.beginPath(); c.arc(1200 + k * 60, GY - 200 - k * 30, 260 + v * 80, -1.2 + k * 0.7, -1.2 + k * 0.7 + 2.3 * Ease.out(v)); c.stroke();
        c.strokeStyle = rgba([240, 255, 240], (1 - v)); c.lineWidth = 5;
        c.stroke(); c.restore();
      }
    });
    for (let i = 0; i < 8; i++) {
      const [dx, dy, ds] = proj(cam, 1450 + h1(i) * 500, 300 + h1(i * 3) * 350, 1500);
      const dead = u > 1.1 + i * 0.12;
      if (!dead) drone(ctx, dx, dy, 1.4 * ds, t, i); else explosion(ctx, dx, dy, u, 1.1 + i * 0.12, [255, 140, 60], 90, 0.8);
    }
  }
  function shot4(ctx, t, lt) { // Hanzo's dragonstrike
    const u = lt - 10;
    const cam = { x: kf([[0, -40], [2.5, 60]], u), y: 10, z: 80 };
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => drawHero(c, HERO.hanzo, 240, GY, 1.9, { lean: -0.05, sL: 1.5, eL: 0.05, sR: 1.45, eR: -1.9, hL: -0.25, hR: 0.22 }, t, { body: [8, 5, 8], rim: [120, 180, 255], rimOff: [3, -2], draw: 1 - ss(0.1, 0.2, u), arrow: 1 - ss(0.1, 0.4, u) }));
    if (u > 0.15) {
      const tau = u - 0.15;
      for (const k of [0, 1]) {
        const path = (v) => {
          const tt = Math.max(0, tau - (1 - v) * 0.9);
          const x = 330 + tt * 1300;
          const ang = tt * 7 + k * Math.PI;
          const [sx, sy, s] = proj(cam, x, GY - 330 + Math.sin(ang) * 110, 1000);
          return [sx, sy, (30 + 10 * Math.cos(ang)) * s * Math.min(1, tt * 4 + 0.2)];
        };
        spiritDragon(ctx, path, k ? [90, 150, 255] : [120, 200, 255], 1, t, k + 3, 1.6);
      }
    }
    for (let i = 0; i < 10; i++) {
      const [dx, dy, ds] = proj(cam, 800 + i * 120, GY - 300 + Math.sin(i * 2) * 120, 1000);
      const hitT = 0.15 + (800 + i * 120 - 330) / 1300 + 0.15;
      if (u < hitT) drone(ctx, dx, dy, 1.4 * ds, t, i); else explosion(ctx, dx, dy, u, hitT, [120, 190, 255], 120, 0.9);
    }
  }
  function shot5(ctx, t, lt) { // D.Va self-destruct
    const u = lt - 12.5;
    const boom = 1.75;
    const s0 = shake(t, 50 * pulse(u, boom, 0.01, 0.6));
    const cam = { x: s0[0], y: s0[1] + kf([[0, 40], [2.5, -40]], u), z: kf([[0, 0], [2.5, 120]], u) };
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => titan(c, 1450, GY + 60, 1.2, t));
    const v = clamp(u / 1.2);
    const [mx, my, ms] = proj(cam, lerp(500, 1250, Ease.inOut(v)), lerp(GY, GY - 380, Math.sin(v * Math.PI * 0.7)), 1000);
    if (u < boom) {
      DVA.draw(ctx, mx, my, 1.4 * ms, t, { boost: u < 1.2 ? 1 : 0.2, rim: [255, 140, 220], body: [30, 12, 30], flip: 1 });
      const beep = u > 1.0 ? (Math.sin(u * 40) > 0 ? 1 : 0.3) : 0;
      glow(ctx, mx, my - 120 * ms, (100 + 400 * ss(1.0, boom, u)) * ms, [255, 100, 200], 0.4 + beep * 0.5);
      // pilot ejects
      if (u > 1.05) { const e = (u - 1.05) / 0.7; glow(ctx, mx - e * 500, my - 200 * ms - Math.sin(e * Math.PI) * 200, 26, [255, 150, 220], 1 - e * 0.5, 1); }
    }
    explosion(ctx, mx, my - 100 * ms, u, boom, [255, 90, 200], 620, 1.6);
    shockwave(ctx, mx, my - 100 * ms, u, boom, [255, 150, 230], 2400, 0.9, 0.35);
  }
  function shot6(ctx, t, lt) { // shield breaks
    const u = lt - 15;
    const brk = 0.9;
    const s0 = shake(t, 8 + 40 * pulse(u, brk, 0.01, 0.5));
    const cam = { x: kf([[0, 120], [2.5, 60]], u) + s0[0], y: s0[1], z: kf([[0, 220], [2.5, 330]], u) };
    bg(ctx, cam, t);
    const beam = ss(0, 0.2, u);
    withPlane(ctx, cam, 1000, (c) => {
      const o = { body: [8, 5, 8], rim: [255, 120, 90], rimOff: [3, -2] };
      const kneel = ss(brk, brk + 0.4, u);
      drawHero(c, HERO.reinhardt, 820, GY, 2.2, Rig.lerpPose({ lean: 0.2, sL: 1.2, eL: 0.35, sR: 0.25, eR: 0.1, hL: -0.35, kL: 0.2, hR: 0.4, kR: -0.3 }, Pose.kneel, kneel), t, Object.assign({ hammerAng: lerp(0.2, 0.9, kneel) }, o));
      if (u < brk) barrier(c, 930, GY + 10, 480, t, 1, clamp(u / brk) * 0.6);
      // beam from the titan
      const bx = 940 + (u < brk ? 0 : 0);
      if (beam > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(2400, 0, bx, 0);
        g.addColorStop(0, 'rgba(255,50,40,0.2)'); g.addColorStop(1, `rgba(255,90,60,${0.9 * beam})`);
        c.fillStyle = g; c.fillRect(bx, GY - 330 - 40, 1600, 80);
        c.fillStyle = `rgba(255,230,210,${beam})`; c.fillRect(bx, GY - 330 - 10, 1600, 20);
        c.restore();
        glow(c, bx, GY - 330, 280, [255, 120, 80], beam);
      }
    });
    // shards
    if (u > brk) {
      const v = u - brk;
      for (let i = 0; i < 70; i++) {
        const ang = Math.PI + (h1(i) - 0.5) * 2.6, sp = 400 + h1(i * 3) * 900;
        const [x0, y0] = proj(cam, 960, GY - 250 + (h1(i * 5) - 0.5) * 420, 1000);
        const x = x0 + Math.cos(ang) * sp * v * (h1(i * 7) > 0.5 ? -1 : 1) * 0.6, y = y0 + Math.sin(ang) * sp * v * 0.4 + 500 * v * v;
        ctx.save(); ctx.translate(x, y); ctx.rotate(v * 8 + i);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(150,210,255,${Math.max(0, 0.9 - v * 0.6)})`;
        ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.fill();
        ctx.restore();
      }
      glow(ctx, W / 2, H / 2, 900, [150, 210, 255], pulse(u, brk, 0.01, 0.3));
    }
  }
  function shot7(ctx, t, lt) { // Juno's orbital ray + Kiriko's suzu
    const u = lt - 17.5;
    const cam = { x: kf([[0, 0], [2.5, 40]], u), y: kf([[0, 60], [2.5, -60]], u), z: 100 };
    bg(ctx, cam, t);
    const ringA = ss(0.3, 0.6, u);
    const [rx, ry, rs] = proj(cam, 960, 260, 2000);
    ring(ctx, rx, ry, 700 * rs * ringA, [255, 90, 210], 10, ringA, 0.22);
    ring(ctx, rx, ry, 500 * rs * ringA, [255, 160, 230], 5, ringA * 0.8, 0.22);
    const beamA = ss(0.6, 0.9, u);
    if (beamA > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, ry, 0, H);
      g.addColorStop(0, `rgba(255,110,220,${0.15 * beamA})`); g.addColorStop(1, `rgba(255,140,230,${0.45 * beamA})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(rx - 600 * rs, ry); ctx.lineTo(rx + 600 * rs, ry); ctx.lineTo(rx + 900, H); ctx.lineTo(rx - 900, H); ctx.fill(); ctx.restore();
      for (let i = 0; i < 60; i++) { const ph = fract(h1(i) + u * 0.6); glow(ctx, rx - 700 + h1(i * 3) * 1400, H - ph * (H - ry), 10, [255, 170, 235], beamA * (1 - ph), 1); }
    }
    withPlane(ctx, cam, 1000, (c) => {
      const o = { body: [10, 5, 10], rim: [255, 150, 230], rimOff: [2, -3] };
      const up = ss(1.2, 2.0, u);
      drawHero(c, HERO.reinhardt, 700, GY, 2.1, Rig.lerpPose(Pose.kneel, Pose.heroic, up), t, Object.assign({ hammerAng: lerp(0.9, 0.1, up) }, o));
      const jy = GY - 80 - Ease.out(clamp(u / 0.5)) * 140 + Math.sin(t * 3) * 6;
      drawHero(c, HERO.juno, lerp(300, 1000, Ease.out(clamp(u / 0.5))), jy, 1.8, { lean: -0.05, sL: -0.3, sR: 2.9, eR: 0, hL: -0.1, kL: 0.2, hR: 0.1, kR: -0.3, ground: false }, t, o);
      drawHero(c, HERO.kiriko, 420, GY, 1.7, { sL: -0.4, sR: 1.6, eR: 0.1, hL: -0.2, hR: 0.2 }, t, o);
      const suz = pulse(u, 0.9, 0.05, 0.5);
      if (suz > 0.02) { glow(c, 700, GY - 200, 300, [220, 255, 170], suz); ring(c, 700, GY - 200, 100 + (u - 0.9) * 400, [230, 255, 160], 5, suz, 0.6); }
      if (u > 0.85 && u < 1.0) glowLine(c, [[450, GY - 170], [lerp(450, 700, (u - 0.85) / 0.15), lerp(GY - 170, GY - 200, (u - 0.85) / 0.15)]], [255, 240, 150], 5, 1);
    });
  }
  function shot8(ctx, t, lt) { // Kiriko's Kitsune Rush
    const u = lt - 20;
    const cam = { x: kf([[0, -120], [2.5, 160]], u), y: 0, z: kf([[0, 0], [2.5, 150]], u) };
    bg(ctx, cam, t);
    withPlane(ctx, cam, 1000, (c) => {
      for (let k = 0; k < 7; k++) {
        const a = ss(0.1 + k * 0.12, 0.3 + k * 0.12, u);
        if (a <= 0) continue;
        const x = 250 + k * 280, s = 0.9;
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
        c.fillStyle = 'rgba(255,120,70,0.5)'; c.strokeStyle = 'rgba(255,220,160,0.95)'; c.lineWidth = 4;
        c.fillRect(x - 130 * s, GY - 330 * s, 18 * s, 330 * s); c.fillRect(x + 112 * s, GY - 330 * s, 18 * s, 330 * s);
        c.beginPath(); c.moveTo(x - 180 * s, GY - 360 * s); c.quadraticCurveTo(x, GY - 330 * s, x + 180 * s, GY - 360 * s); c.lineTo(x + 170 * s, GY - 335 * s); c.quadraticCurveTo(x, GY - 310 * s, x - 170 * s, GY - 335 * s); c.fill(); c.stroke();
        c.fillRect(x - 150 * s, GY - 290 * s, 300 * s, 12 * s);
        c.restore();
        glow(c, x, GY - 200, 200, [255, 140, 80], a * 0.25);
      }
      const fx = lerp(-100, 2100, Ease.inOut(clamp(u / 2.3)));
      spiritFox(c, fx, GY - 20, 2.6, t, 1, 1);
      const o = { body: [8, 5, 8], rim: [255, 190, 140], rimOff: [-3, -2] };
      ['kiriko', 'tracer', 'genji', 'lucio'].forEach((k, i) => drawHero(c, HERO[k], fx - 380 - i * 170, GY, 1.6, Rig.run(u * 2.2 + i * 0.25, 1), t, o));
    });
    motes(ctx, t, 60, 0.6, [255, 220, 150], 145, 3, 40);
  }
  function shot9(ctx, t, lt) { // together: the charge
    const u = lt - 22.5;
    const s0 = shake(t, 6);
    const cam = { x: s0[0], y: s0[1] - 20, z: kf([[0, 0], [2.5, 180]], u) };
    bg(ctx, cam, t);
    const adv = u * 150;
    withPlane(ctx, cam, 1000, (c) => {
      const o = { body: [8, 5, 8], rim: [255, 170, 120], rimOff: [2, -3] };
      drawHero(c, HERO.mercy, 960, GY - 460 + Math.sin(t * 2) * 10, 1.7, Pose.float, t, Object.assign({ wings: 1 }, o));
      const lu = (u * 1.3) % 1;
      for (let k = 0; k < 3; k++) ring(c, 1500, GY - 120, (fract(u * 1.4 + k / 3)) * 600, [120, 255, 110], 6, (1 - fract(u * 1.4 + k / 3)) * 0.8, 0.3);
      const row = [['winston', 250, 1.9], ['soldier', 520, 1.8], ['reinhardt', 800, 2.2], ['juno', 1100, 1.8], ['lucio', 1500, 1.8], ['kiriko', 1720, 1.8]];
      row.forEach(([k, x, s], i) => {
        const pose = k === 'winston' ? { lean: 0.5, sL: -0.9, eL: 0.2, sR: 0.9, eR: -0.2, hL: -0.6, kL: 0.5, hR: 0.6, kR: -0.5 } : Rig.run(u * 2 + i * 0.3, 0.8);
        const pp = k === 'reinhardt' ? Object.assign(pose, { sR: 2.6, eR: 0.2 }) : pose;
        drawHero(c, HERO[k], x + (x - 960) * u * 0.05, GY + 20 + i % 2 * 20, s * (1 + u * 0.08), pp, t, Object.assign({ hammerAng: 3.0, tesla: k === 'winston' }, o));
      });
      if (u > 0.3) lightning(c, 330, GY - 260, 80 + Math.sin(t * 9) * 40, GY - 520, Math.floor(t * 12), [140, 200, 255], 4, 0.9);
    });
  }
  function shot10(ctx, t, lt) { // convergence
    const u = lt - 25;
    const hit = 0.9;
    const s0 = shake(t, 10 + 60 * pulse(u, hit, 0.01, 0.8));
    const cam = { x: s0[0], y: s0[1] + kf([[0, 80], [2.5, -40]], u), z: kf([[0, 0], [2.5, 140]], u) };
    const [mx, my, ms] = bg(ctx, cam, t, { crack: ss(hit, hit + 0.8, u), shipY: 40 + ss(hit + 0.3, 2.5, u) * 200 });
    const cols = [[90, 190, 255], [120, 255, 90], [255, 210, 110], [255, 90, 210], [110, 255, 230], [255, 160, 60], [140, 200, 255]];
    const conv = ss(0, hit, u);
    cols.forEach((col, i) => {
      const x0 = 150 + i * 270;
      const pts = [];
      for (let k = 0; k <= 16; k++) { const v = (k / 16) * conv; pts.push([lerp(x0, mx, v) + Math.sin(v * 6 + i) * 60 * (1 - v), lerp(H - 120, my + 150 * ms, v)]); }
      if (u < hit + 0.4) glowLine(ctx, pts, col, 12, 1 - ss(hit, hit + 0.4, u));
    });
    explosion(ctx, mx, my + 120 * ms, u, hit, [255, 240, 220], 700, 1.8);
    shockwave(ctx, mx, my + 120 * ms, u, hit, [255, 230, 200], 2600, 1.2, 0.6);
    // falling burning debris
    if (u > hit + 0.3) for (let i = 0; i < 14; i++) { const v = u - hit - 0.3; glow(ctx, mx + (h1(i) - 0.5) * 900 * ms + (h1(i * 3) - 0.5) * v * 200, my + 100 * ms + v * v * 300 * (0.5 + h1(i * 5)), 30, [255, 150, 60], 0.9, 1); }
  }
  function shot11(ctx, t, lt) { // aftermath: dawn breaks through
    const u = lt - 27.5;
    const cam = { x: 0, y: kf([[0, 0], [2.5, -60]], u), z: kf([[0, 0], [2.5, 80]], u) };
    bg(ctx, cam, t, { shipY: -900 });
    const warm = ss(0, 2.5, u);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, [255, 190, 120], 0.35 * warm], [0.6, [255, 160, 100], 0.2 * warm], [1, [60, 30, 20], 0]]);
    ctx.fillRect(0, 0, W, H);
    godRays(ctx, W * 0.62, 120, [255, 220, 170], 0.45 * warm, 1600, 18, 9, 1.4, Math.PI / 2 + 0.2, t);
    withPlane(ctx, cam, 1000, (c) => {
      const o = { body: [10, 6, 8], rim: [255, 210, 160], rimOff: [2, -3] };
      drawHero(c, HERO.reinhardt, 760, GY, 2.0, Pose.lookUp, t, Object.assign({ hammerAng: 0 }, o));
      drawHero(c, HERO.juno, 1000, GY, 1.7, Pose.lookUp, t, o);
      drawHero(c, HERO.tracer, 1170, GY, 1.6, Pose.lookUp, t, Object.assign({ flip: -1 }, o));
    });
    embers(ctx, t, 90, 0.7, { seed: 150, col: [255, 170, 90], rise: 30, size: 3 });
  }
  const SHOTS = [shot1, shot1, shot2, shot3, shot4, shot5, shot6, shot7, shot8, shot9, shot10, shot11];
  function draw(ctx, t, lt) {
    const k = S(lt);
    SHOTS[k](ctx, t, lt);
  }
  function post(ctx, t, lt) {
    if (lt < -0.5 || lt > 31) return;
    // hard white hits on the cuts and big moments
    const f = pulse(lt, 0, 0.01, 0.45) * 0.9 + [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5].reduce((a, c) => a + pulse(lt, c, 0.01, 0.12) * 0.35, 0)
      + pulse(lt, 6.55, 0.01, 0.2) * 0.4 + pulse(lt, 14.25, 0.01, 0.5) * 0.8 + pulse(lt, 15.9, 0.01, 0.25) * 0.5 + pulse(lt, 25.9, 0.02, 1.0) * 1.0;
    if (f > 0.01) { ctx.fillStyle = `rgba(255,248,240,${Math.min(1, f)})`; ctx.fillRect(0, 0, W, H); }
  }
  function overlay(ctx, t, lt) {
    heroTag(ctx, t, 125 + 0.5, 3.0, '莱因哈特', 'REINHARDT', [120, 190, 255], W - 120, 150, 'right');
    heroTag(ctx, t, 125 + 7.7, 2.0, '安娜', 'ANA', [255, 210, 120], 120, 150, 'left');
    heroTag(ctx, t, 125 + 20.2, 2.0, '雾子', 'KIRIKO', [120, 255, 230], W - 120, 150, 'right');
  }
  return { init, draw, post, overlay, xfade: 0, bloom: 0.85, bloomThresh: 0.58, vignette: 0.6, texts: ['莱因哈特', 'REINHARDT', '安娜', 'ANA', '雾子', 'KIRIKO'] };
})();

// ============================================================ DAWN (line-up, hands, the bird)
Scenes.dawn = (() => {
  let sky, clouds, sea, cliff;
  const GY = 760;
  function init() {
    sky = Env.sky(2600, 1500, [[0, [40, 50, 110]], [0.35, [150, 110, 150]], [0.6, [255, 170, 120]], [0.75, [255, 210, 150]], [1, [255, 230, 190]]]);
    clouds = Env.clouds(2600, 800, { seed: 161, scale: 0.002, cover: -0.05, sharp: 2, lit: [255, 210, 170], shade: [150, 100, 130], light: [0, 1], res: 0.4, stretch: 3.5 });
    cliff = mk(3000, 700);
    const c = cliff.ctx;
    c.fillStyle = '#120a10';
    c.beginPath(); c.moveTo(0, 700); c.lineTo(0, 160);
    for (let x = 0; x <= 3000; x += 10) c.lineTo(x, 160 + Noise.fbm(x * 0.004, 5, 3) * 30 + (x > 2300 ? (x - 2300) * 0.8 : 0));
    c.lineTo(3000, 700); c.fill();
  }
  // a hand pointing along +x from the wrist at the origin. grip 0 = open reach, 1 = clasped
  function hand(c, sc, grip, armored) {
    c.save(); c.scale(sc, sc);
    const fw = armored ? 17 : 12;
    // forearm
    c.beginPath(); c.moveTo(-900, -(armored ? 52 : 34)); c.lineTo(10, armored ? -34 : -24); c.lineTo(10, armored ? 34 : 24); c.lineTo(-900, armored ? 58 : 38); c.fill();
    // palm
    c.beginPath(); c.roundRect(-6, armored ? -36 : -26, armored ? 86 : 64, armored ? 72 : 52, 14); c.fill();
    // fingers: two segments each, curling with grip
    const lens = armored ? [46, 52, 48, 38] : [34, 40, 37, 29];
    for (let i = 0; i < 4; i++) {
      const y0 = (armored ? -27 : -19) + i * (armored ? 18 : 13);
      const x0 = armored ? 76 : 56;
      const a1 = lerp(-0.05 + i * 0.06, 0.9, grip), a2 = a1 + lerp(0.1, 1.2, grip);
      const L = lens[i];
      const p1 = [x0 + Math.cos(a1) * L * 0.55, y0 + Math.sin(a1) * L * 0.55];
      const p2 = [p1[0] + Math.cos(a2) * L * 0.5, p1[1] + Math.sin(a2) * L * 0.5];
      taper(c, [x0, y0], p1, fw, fw * 0.9); taper(c, p1, p2, fw * 0.9, fw * 0.75);
    }
    // thumb
    const ta = lerp(-0.9, -0.2, grip);
    const t0 = [armored ? 20 : 14, armored ? -30 : -22];
    const t1 = [t0[0] + Math.cos(ta) * (armored ? 44 : 32), t0[1] + Math.sin(ta) * (armored ? 44 : 32)];
    taper(c, t0, t1, fw * 1.1, fw * 0.85);
    if (armored) { c.fillRect(-120, -60, 26, 124); c.fillRect(-300, -58, 20, 120); }
    c.restore();
  }
  function hands(ctx, t, u) {
    const cx = W / 2 + 10, cy = H / 2 + 110;
    const reach = Ease.inOut(clamp(u / 0.6));
    const grip = ss(0.62, 0.95, u);
    const draw = (col, dx, dy) => {
      ctx.fillStyle = col;
      // armoured gauntlet reaching down-left from the upper right
      ctx.save(); ctx.translate(cx + lerp(520, 44, reach) + dx, cy - lerp(170, 8, reach) + dy); ctx.rotate(Math.PI + 0.3); hand(ctx, 1.25, grip, true); ctx.restore();
      // smaller glove reaching up-right from the lower left
      ctx.save(); ctx.translate(cx - lerp(520, 58, reach) + dx, cy + lerp(190, 26, reach) + dy); ctx.rotate(-0.3); ctx.scale(1, -1); hand(ctx, 1.25, grip, false); ctx.restore();
    };
    draw('rgba(255,215,160,0.95)', 0, 0);   // rim
    draw('#0d0709', -4, 4);                  // body
    // spark in the gap before they meet
    const gap = (1 - grip) * ss(0.25, 0.55, u);
    glow(ctx, cx, cy + 10, 120, [255, 240, 210], gap);
  }
  function draw(ctx, t, lt) {
    const sunUp = ss(0, 11, lt);
    if (lt < 6 || lt >= 11) {
      const cam = lt < 6 ? { x: kf([[0, -60], [6, 40]], lt), y: kf([[0, 60], [6, 0]], lt), z: kf([[0, 0], [6, 140]], lt) }
        : { x: 0, y: kf([[11, 0], [15, -380]], lt, Ease.in), z: kf([[11, 100], [15, 300]], lt, Ease.in) };
      drawL(ctx, cam, sky, W / 2 - 1300, -600, 9000);
      const [sx, sy] = proj(cam, 1060, lerp(620, 470, sunUp), 8000);
      glow(ctx, sx, sy, 1000, [255, 170, 100], 0.6);
      glow(ctx, sx, sy, 150, [255, 245, 220], 1, 1);
      godRays(ctx, sx, sy, [255, 220, 170], 0.3, 2400, 20, 13, TAU, 0, t);
      drawL(ctx, cam, clouds, W / 2 - 1300, -200, 7000, 0.85);
      const [, hy] = proj(cam, 0, 640, 6000);
      ctx.fillStyle = vgrad(ctx, hy, H, [[0, [255, 190, 140]], [0.2, [150, 90, 110]], [1, [30, 20, 40]]]);
      ctx.fillRect(0, hy, W, H - hy);
      for (let i = 0; i < 300; i++) {
        const yy = hy + Math.pow(h1(i * 3), 1.6) * (H - hy);
        const xx = sx + (h1(i * 7) - 0.5) * (40 + (yy - hy) * 1.2);
        ctx.fillStyle = `rgba(255,220,170,${0.6 * Math.max(0, Math.sin(t * 5 + i))})`;
        ctx.fillRect(xx, yy, 8 + (yy - hy) * 0.05, 1.5);
      }
      drawL(ctx, cam, cliff, W / 2 - 1500, GY - 160, 1000);
      const [lx, ly, ls] = proj(cam, 960, GY + 6, 1000);
      lineup(ctx, t, ly, ls * 1.1, { rim: [255, 215, 160], rimOff: [2, 2], body: [16, 10, 14], x0: lx - 960 });
      // the bird: lands, then flies up into the sun
      if (lt < 6) {
        const v = clamp((lt - 1) / 3.2);
        const bx = lerp(W + 60, lx + (1120 - 960) * ls * 1.1 + 20, Ease.out(v)), by = lerp(260, ly - 250 * ls, Ease.out(v)) + Math.sin(v * 6) * 20 * (1 - v);
        if (lt > 1) bird(ctx, bx, by, 1.4, v < 1 ? t : 0.4, 1, -1, 1);
      } else {
        const v = clamp((lt - 11.3) / 3.2);
        bird(ctx, lerp(lx + 180 * ls, sx, Ease.in(v)), lerp(ly - 250 * ls, sy, Ease.inOut(v)), lerp(1.4, 0.4, v), t, 1, -1, 1);
      }
      if (lt >= 11) { const wf = ss(13.8, 15, lt); ctx.fillStyle = `rgba(255,250,240,${wf})`; ctx.fillRect(0, 0, W, H); }
    } else {
      // close-up: two hands meet in front of the sun
      const u = (lt - 6) / 5;
      ctx.fillStyle = vgrad(ctx, 0, H, [[0, [120, 90, 140]], [0.5, [255, 180, 120]], [1, [120, 70, 80]]]);
      ctx.fillRect(0, 0, W, H);
      const [sx, sy] = [W / 2 + 10, H / 2 - 150];
      glow(ctx, sx, sy, 800, [255, 160, 90], 0.5);
      glow(ctx, sx, sy, 120, [255, 250, 235], 1, 1);
      godRays(ctx, sx, sy, [255, 230, 190], 0.3, 2000, 24, 21, TAU, 0, t);
      hands(ctx, t, clamp((u - 0.05) / 0.35));
      const clasp = pulse(lt, 7.9, 0.05, 1.2);
      lensFlare(ctx, sx, sy, 0.35 + clasp * 0.5, [255, 210, 160], 1.0);
      glow(ctx, W / 2 + 10, H / 2 + 110, 380, [255, 220, 170], clasp * 0.5);
      motes(ctx, t, 70, 0.6, [255, 230, 180], 170, 3, 14);
    }
  }
  return { init, draw, xfade: 1.0, bloomThresh: 0.7, bloom: 0.7, vignette: 0.45 };
})();

// ============================================================ TITLE
Scenes.title = (() => {
  let bgc;
  function init() {
    bgc = mk(W, H);
    const c = bgc.ctx;
    c.fillStyle = vgrad(c, 0, H, [[0, [6, 8, 18]], [0.6, [14, 16, 34]], [1, [30, 22, 30]]]);
    c.fillRect(0, 0, W, H);
    Env.stars(c, W, H * 0.7, 400, 191, { maxR: 0.9, bright: 0.5 });
  }
  function draw(ctx, t, lt) {
    ctx.drawImage(bgc, 0, 0);
    glow(ctx, W / 2, H * 0.44, 1100, [255, 170, 90], 0.25 + 0.1 * Math.sin(t));
    godRays(ctx, W / 2, H * 0.44, [255, 200, 150], 0.12, 1600, 16, 17, TAU, 0, t);
    // faint line-up at the bottom
    lineup(ctx, t, H - 90, 0.9, { rim: [255, 170, 110], body: [4, 4, 8], emit: 0.8 });
    const a1 = 1 - ss(8.0, 8.6, lt);
    const k = Ease.outBack(clamp(lt / 0.7));
    const sc = lerp(1.35, 1, k);
    ctx.save();
    ctx.translate(W / 2, H * 0.4);
    ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(lt / 0.25) * a1;
    ctx.font = `italic 900 200px ${FONT_EN}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.letterSpacing = '14px';
    const g = ctx.createLinearGradient(0, -90, 0, 90);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#e8ecf4'); g.addColorStop(0.56, '#b9c2d4'); g.addColorStop(1, '#f2f4f8');
    ctx.shadowColor = 'rgba(255,170,80,0.55)'; ctx.shadowBlur = 40;
    ctx.fillStyle = g;
    ctx.fillText('OVERWATCH', 7, 0);
    ctx.shadowBlur = 0;
    // light sweep
    const sw = lerp(-900, 900, clamp((lt - 0.4) / 1.4));
    ctx.globalCompositeOperation = 'source-atop';
    const g2 = ctx.createLinearGradient(sw - 120, 0, sw + 120, 0);
    g2.addColorStop(0, 'rgba(255,220,160,0)'); g2.addColorStop(0.5, 'rgba(255,240,210,0.9)'); g2.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = g2; ctx.fillText('OVERWATCH', 7, 0);
    ctx.restore();
    ctx.letterSpacing = '0px';
    // underline + Chinese title
    const a2 = ss(0.6, 1.2, lt) * a1;
    ctx.fillStyle = rgba(OW_ORANGE, a2);
    const lw = 760 * Ease.out(ss(0.6, 1.4, lt));
    ctx.fillRect(W / 2 - lw / 2, H * 0.4 + 112, lw, 5);
    bigText(ctx, '守望先锋', W / 2, H * 0.4 + 190, 92, a2, { spacing: 34, col: '#ffffff', glowCol: [255, 150, 60] });
    bigText(ctx, 'THE WORLD COULD ALWAYS USE MORE HEROES', W / 2, H * 0.4 + 280, 34, ss(3.0, 3.8, lt) * a1, { font: FONT_EN, weight: 600, spacing: 10, col: 'rgba(255,225,190,0.95)' });
    // "now it's your turn"
    const a3 = ss(8.4, 9.2, lt) * (1 - ss(11.6, 12.4, lt));
    const zoom = lerp(1.08, 1, Ease.out(ss(8.4, 10, lt)));
    ctx.save(); ctx.translate(W / 2, H * 0.44); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.44);
    bigText(ctx, '现在，轮到你了。', W / 2, H * 0.44, 110, a3, { font: FONT_SERIF, spacing: 18, glowCol: [255, 170, 90] });
    bigText(ctx, "NOW, IT'S YOUR TURN.", W / 2, H * 0.44 + 110, 40, a3, { font: FONT_EN, weight: 600, spacing: 14, col: 'rgba(255,215,170,0.95)' });
    ctx.restore();
    motes(ctx, t, 90, 0.5, [255, 210, 160], 190, 2.5, 20);
  }
  function post(ctx, t, lt) {
    const f = pulse(lt, 0, 0.01, 0.6);
    if (f > 0.01 && lt < 3) { ctx.fillStyle = `rgba(255,250,240,${f})`; ctx.fillRect(0, 0, W, H); }
  }
  return { init, draw, post, xfade: 0, bloom: 0.7, bloomThresh: 0.72, texts: ['OVERWATCH', '守望先锋', 'THE WORLD COULD ALWAYS USE MORE HEROES', '现在，轮到你了。', "NOW, IT'S YOUR TURN."] };
})();

// ============================================================ END CARD
Scenes.endcard = (() => {
  function draw(ctx, t, lt) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const a = ss(0.4, 1.4, lt);
    bigText(ctx, '非官方粉丝致敬作品 · UNOFFICIAL FAN TRIBUTE', W / 2, H / 2 - 70, 34, a, { font: FONT_ZH, weight: 700, spacing: 6, col: 'rgba(255,255,255,0.92)' });
    bigText(ctx, '守望先锋®（Overwatch®）是暴雪娱乐的商标。本片与暴雪娱乐无关，亦未获其认可。', W / 2, H / 2 - 5, 24, a * 0.85, { font: FONT_ZH, weight: 500, spacing: 2, col: 'rgba(220,220,220,0.85)' });
    bigText(ctx, 'Overwatch is a trademark of Blizzard Entertainment, Inc. This video is not affiliated with or endorsed by Blizzard.', W / 2, H / 2 + 35, 22, a * 0.8, { font: FONT_EN, weight: 500, spacing: 1, col: 'rgba(200,200,200,0.8)' });
    bigText(ctx, '画面、配乐与旁白均由代码程序化生成  ·  VISUALS, MUSIC & NARRATION GENERATED PROCEDURALLY', W / 2, H / 2 + 100, 20, ss(1.0, 2.0, lt) * 0.8, { font: FONT_ZH, weight: 500, spacing: 3, col: 'rgba(249,158,26,0.9)' });
    const v = clamp((lt - 1.5) / 5);
    if (lt > 1.5 && lt < 7) bird(ctx, lerp(-40, W + 40, v), H / 2 + 200 - Math.sin(v * Math.PI) * 60, 0.9, t, 0.9, 1, 1);
  }
  return { draw, xfade: 0.5, bloom: 0.4, texts: ['非官方粉丝致敬作品 · UNOFFICIAL FAN TRIBUTE', '守望先锋®（Overwatch®）是暴雪娱乐的商标。本片与暴雪娱乐无关，亦未获其认可。', 'Overwatch is a trademark of Blizzard Entertainment, Inc. This video is not affiliated with or endorsed by Blizzard.', '画面、配乐与旁白均由代码程序化生成  ·  VISUALS, MUSIC & NARRATION GENERATED PROCEDURALLY'] };
})();
