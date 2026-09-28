// Scenes: Busan, Ilios, Nepal, Lijiang Tower, Moon & Mars.
'use strict';

// ============================================================ BUSAN (D.Va)
Scenes.busan = (() => {
  let sky, hills, city, bridge;
  const HOR = 700, GY = 900;
  function init() {
    sky = Env.sky(2600, 1300, [[0, [6, 5, 22]], [0.5, [26, 14, 52]], [0.8, [80, 30, 90]], [1, [150, 60, 120]]]);
    Env.stars(sky.ctx, 2600, 700, 300, 17, { maxR: 0.9, bright: 0.7 });
    hills = Env.ridge(2600, 500, { seed: 71, base: 0.55, amp: 0.4, freq: 0.0018, top: [22, 16, 40], bottom: [30, 20, 50] });
    // temple lanterns on the hillside
    const r = mulberry32(72);
    for (let i = 0; i < 160; i++) {
      const x = 300 + r() * 700, y = hills.ys[Math.floor(x)] + 20 + r() * 160;
      hills.ctx.fillStyle = rgba(r() < 0.5 ? [255, 150, 80] : [255, 90, 110], 0.9);
      hills.ctx.fillRect(x, y, 3, 3);
    }
    city = Env.skyline(2800, 700, { seed: 73, base: 700, minH: 90, maxH: 520, minW: 50, maxW: 130, col: [16, 12, 34], lit: 0.28, winCol: [150, 200, 255], winSize: [5, 6], spires: 0.3 });
    const c = city.ctx;
    // neon signs
    const words = ['부산', '메카', '게임', '치킨', '노래방', 'D.VA', '파이팅', 'PC방'];
    const cols = [[255, 60, 180], [60, 220, 255], [255, 220, 60], [140, 90, 255], [255, 90, 90]];
    city.blds.forEach(([bx, by, bw, bh], i) => {
      if (h1(i * 5) < 0.45 && bh > 180) {
        const col = cols[i % cols.length];
        const word = words[i % words.length];
        const vertical = h1(i) < 0.5;
        c.save();
        c.shadowColor = rgba(col); c.shadowBlur = 14;
        c.fillStyle = rgba(mix(col, [255, 255, 255], 0.4));
        c.font = `700 ${vertical ? 22 : 26}px "Noto Sans SC", "WenQuanYi Zen Hei"`;
        c.textAlign = 'center';
        if (vertical) { [...word].forEach((ch, k) => c.fillText(ch, bx + bw / 2, by + 40 + k * 26)); }
        else c.fillText(word, bx + bw / 2, by + 36);
        c.restore();
      }
    });
    // bridge (Gwangan-like)
    bridge = mk(3200, 500);
    const b = bridge.ctx;
    b.fillStyle = '#0c0a1a';
    b.fillRect(0, 380, 3200, 16);
    [900, 2100].forEach((tx) => { b.fillRect(tx - 14, 60, 28, 440); b.fillRect(tx - 34, 150, 68, 10); });
    b.strokeStyle = '#0c0a1a'; b.lineWidth = 3;
    for (const [a, z] of [[0, 900], [900, 2100], [2100, 3200]]) {
      b.beginPath(); b.moveTo(a, a === 0 ? 300 : 70); b.quadraticCurveTo((a + z) / 2, 400, z, z === 3200 ? 300 : 70); b.stroke();
    }
    for (let x = 0; x < 3200; x += 40) b.fillRect(x, 330, 2, 50);
  }
  function bridgeLights(ctx, cam, t) {
    // LED strings along the cables cycling through the rainbow
    for (const [a, z] of [[0, 900], [900, 2100], [2100, 3200]]) {
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        const y0 = a === 0 ? 300 : 70, y1 = z === 3200 ? 300 : 70;
        const x = lerp(a, z, u);
        const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * 400 + u * u * y1;
        const hue = fract(u * 0.5 + t * 0.15 + a * 0.0003);
        const col = hsl(hue);
        const [sx, sy, s] = proj(cam, W / 2 - 1600 + x, HOR - 420 + y, 2600);
        glow(ctx, sx, sy, 10 * s, col, 0.9, 1);
      }
    }
    for (let x = 0; x < 3200; x += 60) {
      const [sx, sy, s] = proj(cam, W / 2 - 1600 + x, HOR - 420 + 384, 2600);
      glow(ctx, sx, sy, 7 * s, [255, 230, 190], 0.8, 1);
    }
  }
  function hsl(h) { const f = (n) => { const k = (n + h * 12) % 12; return 255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return [f(0), f(8), f(4)]; }
  const LAND = 1.0, DM = 4.2;
  function draw(ctx, t, lt) {
    const sh = shake(t, 14 * pulse(lt, LAND, 0.02, 0.35));
    const cam = { x: kf([[0, 80], [10, -120]], lt, Ease.inOutSine) + sh[0], y: kf([[0, -60], [1.2, 0], [10, 20]], lt) + sh[1], z: kf([[0, 0], [10, 180]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -250, 9000);
    drawL(ctx, cam, hills, W / 2 - 1300, HOR - 520, 5000);
    drawL(ctx, cam, city, W / 2 - 1400, HOR - 700 + 10, 3200);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.35, [120, 40, 110], 0], [0.62, [120, 40, 110], 0.25], [0.66, [0, 0, 0], 0]]);
    ctx.fillRect(0, 0, W, H);
    drawL(ctx, cam, bridge, W / 2 - 1600, HOR - 420, 2600);
    bridgeLights(ctx, cam, t);
    // sea + reflections
    const [, hy] = proj(cam, 0, HOR, 2600);
    ctx.fillStyle = vgrad(ctx, hy, H, [[0, [30, 14, 50]], [1, [6, 4, 14]]]);
    ctx.fillRect(0, hy, W, H - hy);
    Env.reflect(ctx, ctx.canvas, hy, H, t, { amp: 8, alpha: 0.5, step: 3, freq: 0.08 });
    // fireworks over the bridge
    const fw = [[6.6, 700, 170, [255, 80, 180]], [7.0, 1250, 120, [80, 220, 255]], [7.5, 980, 210, [255, 220, 80]], [8.0, 1500, 180, [255, 90, 120]], [8.4, 520, 140, [150, 120, 255]], [8.9, 1150, 150, [255, 255, 255]], [9.3, 820, 100, [80, 255, 160]]];
    fw.forEach(([t0, x, y, col], i) => {
      const [fx, fy, fs] = proj(cam, x, y, 2800);
      firework(ctx, fx, fy, lt, t0, col, 70, 230 * fs, i + 1);
    });
    // promenade
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = '#0a0812'; c.fillRect(-600, GY, 3200, 400);
      c.fillStyle = 'rgba(255,120,200,0.25)'; c.fillRect(-600, GY, 3200, 3);
      for (let x = -600; x < 2600; x += 70) c.fillRect(x, GY - 50, 5, 50);
      c.fillStyle = '#0a0812'; c.fillRect(-600, GY - 54, 3200, 6);
    });
    // civilians sheltering behind the mech
    withPlane(ctx, cam, 1050, (c) => {
      const o = { body: [10, 8, 16], rim: [255, 120, 210], rimOff: [3, -1] };
      drawHero(c, HERO.civ, 520, GY + 10, 1.4, Pose.crouch, t, Object.assign({ flip: 1 }, o));
      drawHero(c, HERO.child, 610, GY + 10, 1.5, Rig.lerpPose(Pose.stand, Pose.lookUp, ss(1.2, 2, lt)), t, Object.assign({ coat: true }, o));
      drawHero(c, HERO.civ, 400, GY + 10, 1.4, Pose.stand, t, Object.assign({ flip: 1, hat: true }, o));
    });
    // incoming missiles and the defense matrix
    const [mx, my, ms] = proj(cam, 980, GY, 1000);
    const dmOn = ss(DM, DM + 0.2, lt) * (1 - ss(6.6, 7.0, lt));
    const armX = mx + 120 * ms * 1.75, armY = my - 150 * ms * 1.75;
    if (dmOn > 0) {
      const cone = (c) => { c.beginPath(); c.moveTo(armX, armY); c.lineTo(armX + 1100 * ms, armY - 360 * ms); c.lineTo(armX + 1100 * ms, armY + 260 * ms); c.closePath(); };
      hexField(ctx, cone, [255, 90, 210], dmOn, t, 22 * ms, armX, armY - 400 * ms, armX + 1200 * ms, armY + 300 * ms);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(armX, armY, armX + 1100 * ms, armY);
      g.addColorStop(0, rgba([255, 120, 220], 0.5 * dmOn)); g.addColorStop(1, rgba([255, 120, 220], 0));
      ctx.fillStyle = g; cone(ctx); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 14; i++) {
      const t0 = DM - 0.4 + i * 0.16;
      const u = (lt - t0) / 0.9;
      if (u < 0 || u > 1.2) continue;
      const sx = W + 200, sy = 250 + h1(i * 3) * 300;
      const ex = armX + 700 * ms + h1(i) * 250, ey = armY - 150 * ms + h1(i * 5) * 260 * ms;
      const hit = lt > DM && u >= 1 ? 1 : 0;
      const k = Math.min(1, u);
      const px = lerp(sx, ex, k), py = lerp(sy, ey, k);
      if (!hit) {
        glowLine(ctx, [[px + 140, py - 30], [px, py]], [255, 70, 50], 6, 0.9);
        glow(ctx, px, py, 26, [255, 120, 80], 0.9, 1);
      } else glow(ctx, ex, ey, 90 * (1.2 - u) * 4, [255, 120, 230], (1.2 - u) * 4);
    }
    // the MEKA drops in
    const dropY = lt < LAND ? lerp(-900, 0, Ease.in(lt / LAND)) : 0;
    const boost = lt < LAND + 0.2 ? 1 : 0.25 + 0.2 * Math.sin(t * 20);
    DVA.draw(ctx, mx, my + dropY * ms, 1.75 * ms, t, { boost, rim: [255, 150, 225], rimOff: [-4, -3], flip: -1, body: [34, 20, 44] });
    if (lt >= LAND) {
      shockwave(ctx, mx, my, lt, LAND, [255, 150, 220], 900, 0.9, 0.18);
      glow(ctx, mx, my, 400, [255, 150, 220], pulse(lt, LAND, 0.02, 0.4));
    }
    motes(ctx, t, 40, 0.3, [255, 150, 230], 71, 2, 8);
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 62.5 + 0.7, 3.8, '釜山', 'BUSAN', '韩国  SOUTH KOREA', [255, 110, 200]);
    heroTag(ctx, t, 62.5 + 1.4, 3.0, 'D.Va 宋哈娜', 'D.VA · HANA SONG', [255, 110, 200], W - 120, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.5, bloomThresh: 0.62, texts: ['釜山', 'BUSAN', '韩国  SOUTH KOREA', 'D.Va 宋哈娜', 'D.VA · HANA SONG', '부산메카게임치킨노래방파이팅PC방'] };
})();

// ============================================================ ILIOS (Mercy)
Scenes.ilios = (() => {
  let sky, clouds, isles, town, ruins, ledge;
  const HOR = 560, GY = 880;
  function init() {
    sky = Env.sky(2600, 1300, [[0, [18, 60, 150]], [0.4, [60, 130, 210]], [0.72, [170, 205, 235]], [1, [225, 232, 240]]]);
    clouds = Env.clouds(2600, 700, { seed: 81, scale: 0.0022, cover: -0.15, sharp: 2.4, lit: [255, 255, 255], shade: [170, 190, 215], light: [-0.6, -0.8], res: 0.4, stretch: 2.8 });
    isles = Env.ridge(2600, 300, { seed: 82, base: 0.9, amp: 0.4, freq: 0.002, top: [140, 170, 200], bottom: [160, 185, 210] });
    // cliff town
    town = mk(1500, 900);
    const c = town.ctx;
    c.fillStyle = vgrad(c, 200, 900, [[0, [150, 120, 100]], [1, [90, 70, 60]]]);
    c.beginPath(); c.moveTo(0, 900); c.lineTo(80, 420);
    for (let x = 80; x <= 1500; x += 10) c.lineTo(x, 300 - Math.sin(x / 1500 * Math.PI) * 180 + Noise.fbm(x * 0.01, 3, 3) * 40 + Math.max(0, x - 1100) * 0.5);
    c.lineTo(1500, 900); c.fill();
    const r = mulberry32(83);
    const houses = [];
    for (let row = 0; row < 14; row++) {
      const y = 230 + row * 44;
      for (let x = 110 + (row % 2) * 30; x < 1450; x += 56 + r() * 30) {
        const top = 300 - Math.sin(x / 1500 * Math.PI) * 180 + Math.max(0, x - 1100) * 0.5;
        if (y < top + 14 || r() < 0.18) continue;
        houses.push([x, y + r() * 10, 46 + r() * 30, 30 + r() * 18]);
      }
    }
    houses.sort((a, b) => a[1] - b[1]);
    for (const [x, y, w, h] of houses) {
      c.fillStyle = 'rgba(60,40,30,0.25)'; c.fillRect(x + 5, y + h, w, 6); c.fillStyle = '#f4f1ea'; c.fillRect(x, y, w, h);
      c.fillStyle = '#c9cbd3'; c.fillRect(x + w * 0.7, y, w * 0.3, h);
      c.fillStyle = h2(x | 0, y | 0) < 0.5 ? '#1f5fae' : '#2b3a55';
      c.fillRect(x + w * 0.2, y + h * 0.4, w * 0.16, h * 0.4);
      c.fillRect(x + w * 0.5, y + h * 0.3, w * 0.12, h * 0.22);
      if (h2(y | 0, x | 0) < 0.12) { c.fillStyle = '#2366c4'; c.beginPath(); c.arc(x + w / 2, y, w * 0.38, Math.PI, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(x + w / 2 - 5, y - 6, w * 0.12, 0, TAU); c.fill(); }
    }
    for (let i = 0; i < 24; i++) { c.fillStyle = rgba(mix([40, 70, 40], [90, 120, 60], r())); c.beginPath(); c.arc(100 + r() * 1300, 420 + r() * 440, 8 + r() * 14, 0, TAU); c.fill(); }
    // ruins on the hill
    ruins = mk(700, 400);
    const q = ruins.ctx;
    q.fillStyle = '#e9e2d4';
    q.fillRect(80, 330, 540, 20); q.fillRect(100, 310, 500, 20);
    for (let i = 0; i < 8; i++) if (i !== 5) q.fillRect(120 + i * 62, 140 + (i === 6 ? 80 : 0), 26, 170 - (i === 6 ? 80 : 0));
    q.fillRect(100, 115, 330, 25);
    q.beginPath(); q.moveTo(100, 115); q.lineTo(265, 60); q.lineTo(430, 115); q.fill();
    q.fillStyle = 'rgba(150,140,130,0.5)'; for (let i = 0; i < 8; i++) if (i !== 5) q.fillRect(140 + i * 62, 140, 6, 170);
    ledge = mk(2600, 500);
    const l = ledge.ctx;
    l.fillStyle = vgrad(l, 0, 500, [[0, [200, 180, 150]], [1, [110, 90, 70]]]);
    l.fillRect(0, 60, 2600, 440);
    l.fillStyle = '#efe9dd'; l.fillRect(0, 40, 2600, 26);
    const r2 = mulberry32(88);
    for (let i = 0; i < 90; i++) { l.fillStyle = rgba(mix([200, 30, 140], [255, 110, 190], r2()), 0.9); l.beginPath(); l.arc(r2() * 700, 20 + r2() * 60, 8 + r2() * 14, 0, TAU); l.fill(); }
    for (let i = 0; i < 40; i++) { l.fillStyle = rgba([50, 90, 40], 0.9); l.beginPath(); l.arc(r2() * 700, 40 + r2() * 50, 10 + r2() * 12, 0, TAU); l.fill(); }
  }
  const RES = 4.6;
  function draw(ctx, t, lt) {
    const cam = { x: kf([[0, 100], [10, -60]], lt, Ease.inOutSine), y: kf([[0, -120], [4, 0], [10, 10]], lt, Ease.inOut), z: kf([[0, 0], [10, 150]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -300, 9000);
    const [sx, sy] = proj(cam, 420, 120, 8000);
    glow(ctx, sx, sy, 700, [255, 250, 230], 0.5);
    glow(ctx, sx, sy, 80, [255, 255, 255], 1, 1);
    drawL(ctx, cam, clouds, W / 2 - 1300, -60, 7000);
    drawL(ctx, cam, isles, W / 2 - 1300, HOR - 290, 5000);
    const [, hy] = proj(cam, 0, HOR, 5000);
    ctx.fillStyle = vgrad(ctx, hy, H, [[0, [70, 140, 200]], [0.25, [30, 100, 170]], [1, [10, 50, 110]]]);
    ctx.fillRect(0, hy, W, H - hy);
    for (let i = 0; i < 400; i++) {
      const yy = hy + Math.pow(h1(i * 3), 1.4) * (H - hy);
      const xx = h1(i * 7) * W + Math.sin(t + i) * 8;
      const tw = Math.max(0, Math.sin(t * 5 + i * 2.3));
      ctx.fillStyle = `rgba(255,255,255,${0.7 * tw})`;
      ctx.fillRect(xx, yy, 3 + (yy - hy) * 0.02, 1.5);
    }
    drawL(ctx, cam, ruins, 1350, HOR - 470, 2800);
    drawL(ctx, cam, town, 820, HOR - 360, 2200);
    drawL(ctx, cam, ledge, W / 2 - 1300, GY - 60, 1000);
    // Mercy descends, then resurrects the fallen hero
    const [mx0, my0, ms] = proj(cam, 640, GY - 420, 1000);
    const desc = Ease.out(clamp((lt - 0.2) / 3.2));
    const mY = lerp(my0 - 900 * ms, my0, desc) + Math.sin(t * 1.6) * 8;
    const [fx, fy] = proj(cam, 860, GY + 20, 1000);
    const rise = Ease.inOut(clamp((lt - RES - 0.3) / 1.6));
    // fallen hero (feet at fx,fy)
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(-(Math.PI / 2) * (1 - rise));
    drawHero(ctx, HERO.juno, 0, 0, 1.5 * ms, Rig.lerpPose({ sL: -1.2, eL: 0.4, sR: 0.3, eR: 0.2, hL: -0.1, hR: 0.15, head: 0.3 }, Pose.lookUp, rise), t, { body: [30, 28, 40], rim: [255, 240, 210], rimOff: [-2, 2], emit: 0.3 + rise * 0.7, flip: -1 });
    ctx.restore();
    // resurrection light
    const beam = ss(RES - 0.2, RES, lt) * (1 - ss(RES + 2.2, RES + 3.2, lt));
    if (beam > 0) {
      const g = ctx.createLinearGradient(fx, fy - 900, fx, fy);
      g.addColorStop(0, rgba([255, 230, 150], 0)); g.addColorStop(1, rgba([255, 230, 150], 0.4 * beam));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
      ctx.fillRect(fx - 60 * ms - 20, fy - 900, 120 * ms + 40, 900); ctx.restore();
      for (let k = 0; k < 3; k++) ring(ctx, fx, fy - 10, (60 + k * 50 + fract(t * 0.8 + k * 0.33) * 60) * ms, [255, 220, 130], 4, beam * 0.8, 0.28);
      glow(ctx, fx, fy - 100, 260 * ms, [255, 230, 160], beam * 0.45);
      glowLine(ctx, [[mx0 + 80 * ms, mY - 60 * ms], [fx, fy - 120 * ms]], [255, 220, 130], 6, beam);
    }
    drawHero(ctx, HERO.mercy, mx0, mY, 2.0 * ms, { sL: -0.7, eL: -0.3, sR: 1.2, eR: 0.3, hL: -0.05, kL: 0.2, hR: 0.1, kR: 0.4, ground: false, lean: 0.05 }, t, { body: [40, 36, 44], rim: [255, 250, 230], rimOff: [2, 2], wings: 0.6 + 0.4 * desc });
    glow(ctx, mx0, mY - 120 * ms, 260 * ms, [255, 230, 170], 0.3 + 0.3 * desc);
    // drifting light feathers
    for (let i = 0; i < 26; i++) {
      const ph = fract(lt * 0.12 + h1(i));
      const x = mx0 + (h1(i * 3) - 0.5) * 700 + Math.sin(t + i) * 30;
      const y = mY - 300 + ph * 700;
      glow(ctx, x, y, 12, [255, 220, 140], 0.7 * Math.sin(ph * Math.PI) * desc, 1);
    }
  }
  function post(ctx, t, lt) {
    const f = pulse(lt, RES, 0.08, 0.6) * 0.5;
    if (f > 0.01) { ctx.fillStyle = `rgba(255,245,215,${f})`; ctx.fillRect(0, 0, W, H); }
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 72.5 + 0.6, 3.8, '伊利奥斯', 'ILIOS', '希腊  GREECE', [70, 150, 240]);
    heroTag(ctx, t, 72.5 + 2.2, 3.2, '天使', 'MERCY', [255, 210, 110], W - 120, 150, 'right');
  }
  return { init, draw, post, overlay, xfade: 0.6, bloomThresh: 0.78, bloom: 0.5, vignette: 0.35, texts: ['伊利奥斯', 'ILIOS', '希腊  GREECE', '天使', 'MERCY'] };
})();

// ============================================================ NEPAL (Zenyatta)
Scenes.nepal = (() => {
  let sky, peaks, peaks2, cloudSea, cloudSea2, monastery;
  const GY = 860;
  function init() {
    sky = Env.sky(2600, 1400, [[0, [24, 34, 80]], [0.4, [90, 90, 160]], [0.7, [230, 150, 160]], [0.85, [255, 190, 160]], [1, [255, 215, 180]]]);
    peaks = Env.ridge(2800, 800, { seed: 91, base: 0.9, amp: 0.8, freq: 0.0016, ridged: true, top: [170, 130, 175], bottom: [120, 100, 150], snow: [255, 220, 230], snowLine: 0.45, rim: [255, 200, 210], rimW: 2 });
    peaks2 = Env.ridge(2800, 700, { seed: 92, base: 0.95, amp: 0.75, freq: 0.0022, ridged: true, top: [110, 90, 140], bottom: [80, 70, 120], snow: [250, 210, 230], snowLine: 0.35, rim: [255, 180, 190], rimW: 3 });
    cloudSea = Env.clouds(2800, 500, { seed: 93, scale: 0.003, cover: 0.2, sharp: 1.8, lit: [255, 225, 225], shade: [150, 130, 180], light: [0.8, -1], res: 0.35, stretch: 3.5, fadeTop: 0.35, fadeBottom: 0.05 });
    cloudSea2 = Env.clouds(2800, 500, { seed: 94, scale: 0.0026, cover: 0.3, sharp: 1.6, lit: [255, 235, 230], shade: [160, 140, 185], light: [0.8, -1], res: 0.35, stretch: 3.5, fadeTop: 0.4, fadeBottom: 0.02 });
    monastery = mk(900, 700);
    const m = monastery.ctx;
    m.fillStyle = '#2a2034';
    m.beginPath(); m.moveTo(0, 700); m.lineTo(60, 420); m.lineTo(200, 380); m.lineTo(560, 400); m.lineTo(700, 460); m.lineTo(900, 700); m.fill();
    m.fillStyle = '#e9dccb'; m.fillRect(170, 250, 380, 140); m.fillRect(260, 150, 200, 110);
    m.fillStyle = '#7a2a2a'; m.fillRect(170, 250, 380, 26); m.fillRect(260, 150, 200, 20);
    m.fillStyle = '#d9a441';
    Env.roof(m, 360, 250, 440, 70, 0.2);
    Env.roof(m, 360, 150, 250, 60, 0.2);
    m.fillRect(354, 50, 12, 50);
    m.beginPath(); m.arc(360, 48, 12, 0, TAU); m.fill();
    Env.windows(m, 180, 290, 360, 90, { cw: 16, chh: 22, gx: 22, gy: 20, lit: 0.55, col: [255, 180, 90], seed: 9, dim: [80, 50, 50] });
  }
  function flags(ctx, cam, t) {
    const cols = [[40, 90, 200], [245, 245, 245], [210, 40, 40], [40, 150, 80], [250, 200, 40]];
    for (const [z, x0, y0, x1, y1, sag] of [[800, -300, 170, 1300, 480, 120], [700, 700, 140, 2300, 380, 140]]) {
      withPlane(ctx, cam, z, (c) => {
        const pts = Env.catenary(x0, y0, x1, y1, sag, 28);
        c.strokeStyle = 'rgba(40,30,40,0.9)'; c.lineWidth = 2;
        c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        pts.forEach((p, i) => {
          if (i === pts.length - 1) return;
          const wv = Math.sin(t * 4 + i * 0.9) * 8;
          c.fillStyle = rgba(cols[i % 5], 0.92);
          c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 34, p[1] + 2); c.lineTo(p[0] + 36 + wv, p[1] + 44); c.lineTo(p[0] + 2 + wv, p[1] + 42); c.fill();
        });
      });
    }
  }
  const TR = 5.4;
  function draw(ctx, t, lt) {
    const cam = { x: kf([[0, -80], [10, 60]], lt, Ease.inOutSine), y: kf([[0, 30], [10, -30]], lt), z: kf([[0, 0], [10, 170]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -350, 9000);
    const [sx, sy] = proj(cam, 1500, 470, 8000);
    glow(ctx, sx, sy, 800, [255, 180, 140], 0.5);
    glow(ctx, sx, sy, 70, [255, 245, 225], 1, 1);
    drawL(ctx, cam, peaks, W / 2 - 1400, GY - 820, 6500);
    drawL(ctx, cam, cloudSea, W / 2 - 1400 - (t * 6) % 40, GY - 420, 5200, 0.95);
    drawL(ctx, cam, peaks2, W / 2 - 1400, GY - 600, 4200);
    drawL(ctx, cam, cloudSea2, W / 2 - 1400 + (t * 8) % 40, GY - 300, 3200, 0.95);
    godRays(ctx, sx, sy, [255, 200, 170], 0.14, 2200, 14, 11, 1.4, Math.PI * 0.85, t);
    drawL(ctx, cam, monastery, -160, GY - 700 + 120, 1800);
    // stone platform
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = '#231a2a';
      c.beginPath(); c.moveTo(600, GY + 400); c.lineTo(760, GY); c.lineTo(1500, GY - 10); c.lineTo(1700, GY + 400); c.fill();
      c.fillStyle = 'rgba(255,200,200,0.35)'; c.fillRect(760, GY - 4, 740, 4);
    });
    // meditating companions: human and omnic side by side
    const o = { body: [30, 22, 38], rim: [255, 200, 200], rimOff: [2, -1] };
    withPlane(ctx, cam, 1000, (c) => {
      const sit = { sL: -0.35, eL: 0.9, sR: 0.35, eR: -0.9, hL: -1.35, kL: 2.4, hR: 1.35, kR: -2.4, ground: false };
      drawHero(c, HERO.civ, 860, GY - 58, 1.05, sit, t, o);
      drawHero(c, HERO.omnic, 1400, GY - 64, 1.05, sit, t, o);
      drawHero(c, HERO.child, 1470, GY - 36, 1.1, sit, t, Object.assign({ coat: true }, o));
    });
    // Zenyatta
    const bob = Math.sin(t * 1.3) * 10;
    const tr = pulse(lt, TR, 0.4, 1.4);
    withPlane(ctx, cam, 1000, (c) => {
      drawHero(c, HERO.zenyatta, 1130, GY - 150 + bob, 1.7, { sL: -0.5, eL: 1.2, sR: 0.5, eR: -1.2, ground: false }, t, Object.assign({}, o, { transcend: tr }));
      for (let k = 0; k < 3; k++) ring(c, 1130, GY - 150 + bob - 80, (140 + ((lt - TR) * 260 + k * 160) % 520), [255, 210, 120], 4, tr * 0.6, 0.3);
    });
    flags(ctx, cam, t);
    snow(ctx, t, 160, 0.7, { speed: 50, wind: 25, size: 2.6, seed: 9 });
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 82.5 + 0.6, 3.8, '尼泊尔', 'NEPAL', '香巴里寺院  SHAMBALI MONASTERY', [255, 200, 90]);
    heroTag(ctx, t, 82.5 + 2.0, 3.2, '禅雅塔', 'ZENYATTA', [255, 205, 90], W - 120, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.6, bloomThresh: 0.82, bloom: 0.45, texts: ['尼泊尔', 'NEPAL', '香巴里寺院  SHAMBALI MONASTERY', '禅雅塔', 'ZENYATTA'] };
})();

// ============================================================ LIJIANG TOWER (lanterns)
Scenes.lijiang = (() => {
  let sky, far, mid, market, lanternSpr;
  const GY = 880;
  function init() {
    sky = Env.sky(2600, 1400, [[0, [5, 5, 20]], [0.5, [22, 12, 40]], [0.8, [70, 26, 48]], [1, [120, 50, 50]]]);
    Env.stars(sky.ctx, 2600, 800, 250, 5, { maxR: 0.9, bright: 0.6 });
    far = Env.skyline(2800, 800, { seed: 101, base: 800, minH: 120, maxH: 480, minW: 50, maxW: 120, col: [18, 12, 30], lit: 0.3, winCol: [255, 190, 120], winSize: [4, 6], spires: 0.2,
      towers: [[1320, 20, 120, 780, 0.9]] });
    const f = far.ctx;
    // Lijiang tower crown
    f.fillStyle = rgba([18, 12, 30]);
    f.beginPath(); f.moveTo(1300, 30); f.lineTo(1380, -40); f.lineTo(1460, 30); f.fill();
    f.save(); f.shadowColor = '#ffb050'; f.shadowBlur = 18; f.strokeStyle = '#ffd08a'; f.lineWidth = 5;
    f.beginPath(); f.arc(1380, 80, 32, 0, TAU); f.stroke(); f.restore();
    mid = mk(3000, 700);
    const m = mid.ctx;
    const r = mulberry32(102);
    for (let x = 0; x < 3000; x += 160 + r() * 80) {
      const w = 180 + r() * 120, y = 300 + r() * 200;
      m.fillStyle = '#240e16'; m.fillRect(x - w * 0.38, y, w * 0.76, 700 - y);
      Env.windows(m, x - w * 0.38, y + 14, w * 0.76, 70, { cw: 16, chh: 22, gx: 12, gy: 12, lit: 0.6, col: [255, 170, 90], seed: Math.floor(x), dim: null });
      m.fillStyle = '#1a0a10'; Env.roof(m, x, y, w, 44, 0.35);
      if (r() < 0.3) { m.fillRect(x - w * 0.25, y - 80, w * 0.5, 60); Env.roof(m, x, y - 70, w * 0.7, 36, 0.35); }
    }
    // pagoda
    m.fillStyle = '#1a0a10';
    for (let k = 0; k < 6; k++) { m.fillRect(620 - 50 + k * 6, 520 - k * 70, 100 - k * 12, 70); Env.roof(m, 620, 520 - k * 70, 190 - k * 20, 30, 0.4); }
    market = mk(3200, 400);
    const q = market.ctx;
    q.fillStyle = '#12070c'; q.fillRect(0, 200, 3200, 200);
    for (let x = 0; x < 3200; x += 170) {
      q.fillStyle = h1(x) < 0.5 ? '#6a1515' : '#5a2a10';
      q.beginPath(); q.moveTo(x, 200); q.lineTo(x + 20, 150); q.lineTo(x + 150, 150); q.lineTo(x + 170, 200); q.fill();
      q.fillStyle = 'rgba(255,190,110,0.85)'; q.fillRect(x + 20, 205, 130, 30);
    }
    lanternSpr = mk(64, 80);
    const l = lanternSpr.ctx;
    const g = l.createLinearGradient(0, 0, 0, 80);
    g.addColorStop(0, '#ffe2a0'); g.addColorStop(1, '#ff8a2a');
    l.fillStyle = g;
    l.beginPath(); l.moveTo(10, 8); l.quadraticCurveTo(32, -4, 54, 8); l.lineTo(48, 70); l.quadraticCurveTo(32, 76, 16, 70); l.closePath(); l.fill();
    l.fillStyle = 'rgba(255,255,220,0.9)'; l.beginPath(); l.ellipse(32, 66, 9, 5, 0, 0, TAU); l.fill();
  }
  function lantern(ctx, x, y, s, a) {
    glow(ctx, x, y, 44 * s, [255, 150, 60], 0.55 * a);
    ctx.globalAlpha = a;
    ctx.drawImage(lanternSpr, x - 16 * s, y - 20 * s, 32 * s, 40 * s);
    ctx.globalAlpha = 1;
  }
  function draw(ctx, t, lt) {
    const cam = { x: kf([[0, -60], [12.5, 90]], lt, Ease.inOutSine), y: kf([[0, 40], [7, -40], [12.5, -120]], lt, Ease.inOut), z: kf([[0, 0], [12.5, 160]], lt) };
    drawL(ctx, cam, sky, W / 2 - 1300, -400, 9000);
    // distant fireworks
    const fw = [[5.0, 500, 200, [255, 80, 80]], [5.6, 1500, 150, [255, 200, 80]], [6.4, 1000, 120, [255, 120, 60]], [7.2, 1300, 230, [255, 80, 140]], [8.0, 700, 160, [255, 220, 120]], [8.8, 1650, 190, [255, 90, 90]], [9.6, 1100, 110, [255, 170, 80]], [10.5, 850, 170, [255, 230, 150]], [11.3, 1400, 140, [255, 110, 110]]];
    fw.forEach(([t0, x, y, col], i) => { const [fx, fy, fs] = proj(cam, x, y, 5000); firework(ctx, fx, fy, lt, t0, col, 64, 210 * fs, 30 + i); });
    drawL(ctx, cam, far, W / 2 - 1400, GY - 800 - 60, 3800);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.4, [120, 40, 40], 0], [0.75, [150, 60, 50], 0.35]]);
    ctx.fillRect(0, 0, W, H);
    // sky lanterns (far layers)
    const drawLanterns = (n, zFar, seed, sMin, sMax) => {
      for (let i = 0; i < n; i++) {
        const d = h1(i * 3 + seed);
        const z = lerp(zFar, 1400, d);
        const speed = lerp(18, 45, d);
        const start = h1(i * 5 + seed) * 16 - 6;
        const age = lt - start;
        if (age < 0) continue;
        const x = -400 + h1(i * 7 + seed) * 2700 + Math.sin(t * 0.3 + i) * 30 + age * 8;
        const y = 900 - age * speed;
        const [px, py, ps] = proj(cam, x, y, z);
        if (py < -60 || px < -80 || px > W + 80) continue;
        lantern(ctx, px, py, lerp(sMin, sMax, d) * ps, clamp(age / 1.5) * (0.6 + 0.4 * Math.sin(t * 3 + i)));
      }
    };
    drawLanterns(230, 5000, 1, 0.35, 0.9);
    drawL(ctx, cam, mid, W / 2 - 1500, GY - 700 + 30, 2000);
    drawL(ctx, cam, market, W / 2 - 1600, GY - 400 + 30, 1300);
    // lantern strings over the street
    withPlane(ctx, cam, 1150, (c) => {
      for (const [x0, y0, x1, y1] of [[-400, 380, 900, 420], [900, 420, 2300, 360]]) {
        const pts = Env.catenary(x0, y0, x1, y1, 90, 16);
        c.strokeStyle = 'rgba(20,6,10,0.9)'; c.lineWidth = 2;
        c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        pts.forEach((p, i) => {
          if (i === 0 || i === pts.length - 1) return;
          const sw = Math.sin(t * 2 + i) * 3;
          glow(c, p[0] + sw, p[1] + 26, 60, [255, 90, 40], 0.5);
          c.fillStyle = '#d42a1a'; c.beginPath(); c.ellipse(p[0] + sw, p[1] + 26, 16, 20, 0, 0, TAU); c.fill();
          c.fillStyle = '#ffd070'; c.fillRect(p[0] + sw - 8, p[1] + 5, 16, 4); c.fillRect(p[0] + sw - 8, p[1] + 44, 16, 4);
          glow(c, p[0] + sw, p[1] + 26, 18, [255, 200, 120], 0.8, 1);
        });
      }
    });
    // bridge railing
    withPlane(ctx, cam, 1000, (c) => {
      c.fillStyle = '#16080c'; c.fillRect(-600, GY, 3200, 400);
      c.fillStyle = '#5a1810'; c.fillRect(-600, GY - 70, 3200, 10);
      for (let x = -600; x < 2600; x += 80) c.fillRect(x, GY - 70, 9, 70);
    });
    // Mei and a child release their lantern
    const rel = ss(2.4, 3.6, lt);
    const o = { body: [22, 10, 16], rim: [255, 190, 120], rimOff: [3, -3] };
    withPlane(ctx, cam, 1000, (c) => {
      const up = lt < 4.2 ? Rig.lerpPose(Pose.stand, Pose.reachUp, rel) : Rig.lerpPose(Pose.reachUp, Pose.lookUp, ss(4.2, 5.2, lt));
      drawHero(c, HERO.mei, 880, GY + 90, 2.4, up, t, Object.assign({ flip: 1 }, o));
      drawHero(c, HERO.child, 1060, GY + 90, 2.5, Rig.lerpPose(Pose.lookUp, Pose.reachUp, rel * (1 - ss(4.2, 5.2, lt))), t, Object.assign({ flip: -1, coat: true }, o));
      // their lantern
      const ly = lt < 3.6 ? GY - 300 : GY - 300 - Math.pow(lt - 3.6, 1.35) * 70;
      const lx = 975 + (lt > 3.6 ? Math.sin((lt - 3.6) * 0.8) * 40 : 0);
      lantern(c, lx, ly, 2.2, ss(0.8, 1.6, lt));
    });
    drawLanterns(26, 1300, 7, 1.2, 1.8);
    // the bird among the lanterns
    if (lt > 6) {
      const u = clamp((lt - 6) / 6.5);
      bird(ctx, lerp(W * 0.1, W * 0.95, u), lerp(700, 180, u) + Math.sin(u * 10) * 16, lerp(1.6, 0.9, u), t, 1, 1, 1);
    }
    embers(ctx, t, 50, 0.6, { seed: 101, col: [255, 170, 80], rise: 60, size: 2 });
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 92.5 + 0.7, 4.0, '漓江塔', 'LIJIANG TOWER', '中国  CHINA', [255, 90, 60]);
    heroTag(ctx, t, 92.5 + 2.0, 3.2, '小美', 'MEI', [120, 200, 255], W - 120, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.6, bloomThresh: 0.6, texts: ['漓江塔', 'LIJIANG TOWER', '中国  CHINA', '小美', 'MEI'] };
})();

// ============================================================ MOON & MARS (Winston & Juno)
Scenes.cosmos = (() => {
  let stars, earthDay, moonGround, domes, marsSky, mars1, mars2, mars3, bufA, bufB;
  const SW = 5.0;
  function planet(R, fn) {
    const c = mk(R * 2, R * 2);
    const id = c.ctx.createImageData(R * 2, R * 2);
    for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) {
      const dx = (x - R) / R, dy = (y - R) / R, q = dx * dx + dy * dy;
      if (q >= 1) continue;
      const z = Math.sqrt(1 - q);
      const col = fn(dx, dy, z);
      const i = (y * R * 2 + x) * 4;
      id.data[i] = col[0]; id.data[i + 1] = col[1]; id.data[i + 2] = col[2]; id.data[i + 3] = 255;
    }
    c.ctx.putImageData(id, 0, 0);
    return c;
  }
  function init() {
    stars = mk(2600, 1400);
    stars.ctx.fillStyle = '#010208'; stars.ctx.fillRect(0, 0, 2600, 1400);
    Env.stars(stars.ctx, 2600, 1400, 1800, 23, { maxR: 1.2 });
    const L = [0.75, -0.35, 0.55];
    earthDay = planet(300, (dx, dy, z) => {
      const lon = Math.atan2(dx, z), lat = Math.asin(-dy);
      const land = Noise.fbm(lon * 2 + 5, lat * 2.4 + 2, 6) > 0.05;
      const cloud = clamp(Noise.fbm(lon * 3 + 9, lat * 5, 5) * 2 + 0.05);
      let c = land ? mix([60, 110, 50], [170, 150, 100], clamp(Noise.fbm(lon * 6, lat * 6, 3) + 0.5)) : [20, 60, 150];
      c = mix(c, [245, 248, 255], cloud * 0.9);
      const lit = clamp((dx * L[0] + dy * L[1] + z * L[2]) * 1.4 + 0.1);
      return c.map((v) => v * (0.03 + 0.97 * lit));
    });
    moonGround = mk(3000, 600);
    const m = moonGround.ctx;
    m.fillStyle = vgrad(m, 0, 600, [[0, [120, 120, 130]], [1, [30, 30, 36]]]);
    m.beginPath(); m.moveTo(0, 600); m.lineTo(0, 120);
    for (let x = 0; x <= 3000; x += 10) m.lineTo(x, 120 + Math.pow((x - 1500) / 1500, 2) * 80 + Noise.fbm(x * 0.003, 1, 4) * 60);
    m.lineTo(3000, 600); m.fill();
    const r = mulberry32(111);
    for (let i = 0; i < 70; i++) {
      const x = r() * 3000, y = 200 + r() * 400, w = 20 + r() * 110 * (y / 600);
      m.fillStyle = 'rgba(20,20,26,0.5)'; m.beginPath(); m.ellipse(x, y, w, w * 0.22, 0, 0, TAU); m.fill();
      m.strokeStyle = 'rgba(200,200,215,0.35)'; m.lineWidth = 2; m.beginPath(); m.ellipse(x, y, w, w * 0.22, 0, 0.1, Math.PI - 0.1); m.stroke();
    }
    domes = mk(1000, 400);
    const d = domes.ctx;
    [[200, 300, 150], [470, 320, 100], [700, 310, 130]].forEach(([x, y, rr]) => {
      d.fillStyle = 'rgba(70,80,100,0.95)'; d.beginPath(); d.arc(x, y, rr, Math.PI, TAU); d.fill();
      d.strokeStyle = 'rgba(160,190,230,0.6)'; d.lineWidth = 2;
      for (let k = 1; k < 5; k++) { d.beginPath(); d.arc(x, y, rr * k / 5, Math.PI, TAU); d.stroke(); }
      d.beginPath(); d.moveTo(x - rr, y); d.lineTo(x + rr, y); d.stroke();
      Env.windows(d, x - rr * 0.6, y - rr * 0.35, rr * 1.2, rr * 0.3, { cw: 8, chh: 6, gx: 8, gy: 8, lit: 0.7, col: [255, 220, 150], seed: x, dim: null });
    });
    d.fillStyle = 'rgba(60,66,80,1)'; d.fillRect(880, 120, 8, 200); d.beginPath(); d.ellipse(884, 120, 50, 16, -0.3, Math.PI, TAU); d.fill();
    marsSky = Env.sky(2600, 1400, [[0, [60, 40, 50]], [0.45, [170, 110, 80]], [0.75, [220, 160, 120]], [1, [235, 190, 150]]]);
    mars1 = Env.ridge(2800, 600, { seed: 121, base: 0.75, amp: 0.5, freq: 0.0015, ridged: true, top: [190, 120, 90], bottom: [200, 140, 110] });
    mars2 = Env.ridge(2800, 700, { seed: 122, base: 0.75, amp: 0.7, ridged: true, freq: 0.002, top: [140, 70, 50], bottom: [120, 60, 45], rim: [255, 190, 150] });
    mars3 = Env.ridge(3000, 600, { seed: 123, base: 0.45, amp: 0.28, freq: 0.0012, top: [70, 32, 28], bottom: [40, 20, 20], rim: [255, 170, 130], rimW: 3 });
    bufA = mk(W, H); bufB = mk(W, H);
  }
  function drawMoon(ctx, t, lt) {
    const cam = { x: kf([[0, 60], [5.5, -80]], lt), y: kf([[0, 80], [5.5, -30]], lt, Ease.inOut), z: kf([[0, 0], [5.5, 120]], lt) };
    drawL(ctx, cam, stars, W / 2 - 1300, -160, 9000);
    const ey = lerp(560, 430, lt / 5.5);
    const [ex, eyy, es] = proj(cam, 1250, ey, 6000);
    glow(ctx, ex, eyy, 520 * es, [90, 160, 255], 0.5);
    ctx.drawImage(earthDay, ex - 300 * es, eyy - 300 * es, 600 * es, 600 * es);
    ring(ctx, ex, eyy, 302 * es, [120, 180, 255], 5 * es, 0.6);
    drawL(ctx, cam, domes, 100, 560 - 320, 2200);
    for (const [x, y] of [[220, 300], [490, 320], [720, 310]]) { const [px, py] = proj(cam, 100 + x, 240 + y - 20, 2200); glow(ctx, px, py, 60, [255, 210, 150], 0.35); }
    drawL(ctx, cam, moonGround, W / 2 - 1500, 700, 1200);
    const [wx, wy, ws] = proj(cam, 1480, 820, 1000);
    drawHero(ctx, HERO.winston, wx, wy, 1.1 * ws, { head: -0.4, sL: -0.3, eL: 0.2, sR: 0.28, eR: -0.1, hL: -0.35, kL: 0.3, hR: 0.35, kR: -0.3 }, t, { body: [16, 18, 26], rim: [140, 190, 255], rimOff: [-3, 2], tesla: false });
  }
  function drawMars(ctx, t, lt) {
    const u = lt - SW;
    const cam = { x: kf([[0, -60], [5, 60]], u), y: kf([[0, 40], [5, -20]], u), z: kf([[0, 0], [5, 150]], u) };
    drawL(ctx, cam, marsSky, W / 2 - 1300, -300, 9000);
    const [sx, sy] = proj(cam, 520, 520, 8000);
    glow(ctx, sx, sy, 380, [120, 170, 255], 0.55);
    glow(ctx, sx, sy, 40, [240, 245, 255], 1, 1);
    // earth: a tiny blue star
    const [ex, ey] = proj(cam, 1300, 240, 8000);
    glow(ctx, ex, ey, 60, [100, 170, 255], 0.8 + 0.2 * Math.sin(t * 3));
    glow(ctx, ex, ey, 8, [220, 240, 255], 1, 1);
    drawL(ctx, cam, mars1, W / 2 - 1400, 820 - 600 + 40, 5000);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0.3, [230, 170, 130], 0], [0.7, [230, 170, 130], 0.3]]);
    ctx.fillRect(0, 0, W, H);
    drawL(ctx, cam, mars2, W / 2 - 1400, 820 - 600 + 130, 3000);
    // colony lights
    for (let i = 0; i < 14; i++) { const [px, py, ps] = proj(cam, 260 + h1(i) * 420, 640 + h1(i * 3) * 60, 3000); glow(ctx, px, py, 9 * ps, [255, 220, 170], 0.8, 1); }
    drawL(ctx, cam, mars3, W / 2 - 1500, 820 - 330, 1200);
    const [jx, jy, js] = proj(cam, 1180, 820 - 330 + 272 - 20 + Math.sin(t * 2) * 4, 1200);
    const reach = ss(1.2, 2.4, u);
    drawHero(ctx, HERO.juno, jx, jy, 1.6 * js, Rig.lerpPose(Pose.lookUp, Pose.reachUp, reach), t, { body: [40, 20, 24], rim: [255, 200, 170], rimOff: [2, -2], flip: 1 });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const x = (h1(i) * W + t * 60) % W, y = h1(i * 3) * H; ctx.fillStyle = 'rgba(255,200,150,0.1)'; ctx.fillRect(x, y, 30, 1); }
    ctx.restore();
  }
  function draw(ctx, t, lt) {
    const tr0 = SW - 0.35, tr1 = SW + 0.35;
    if (lt < tr0) return drawMoon(ctx, t, lt);
    if (lt > tr1) return drawMars(ctx, t, lt);
    // whip pan with streak smear
    const u = (lt - tr0) / (tr1 - tr0);
    bufA.ctx.fillStyle = '#000'; bufA.ctx.fillRect(0, 0, W, H); drawMoon(bufA.ctx, t, lt);
    bufB.ctx.fillStyle = '#000'; bufB.ctx.fillRect(0, 0, W, H); drawMars(bufB.ctx, t, lt);
    const e = Ease.inOut(u);
    for (let k = 0; k < 8; k++) {
      const off = (k / 8) * 260 * Math.sin(u * Math.PI);
      ctx.globalAlpha = 0.18;
      ctx.drawImage(bufA, -e * W - off, 0);
      ctx.drawImage(bufB, (1 - e) * W - off, 0);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(bufA, -e * W, 0);
    ctx.drawImage(bufB, (1 - e) * W, 0);
    glow(ctx, W / 2, H / 2, 900, [200, 220, 255], Math.sin(u * Math.PI) * 0.5);
  }
  function overlay(ctx, t, lt) {
    locationCard(ctx, t, 105 + 0.5, 3.6, '地平线月球基地', 'HORIZON LUNAR COLONY', '月球  THE MOON', [140, 190, 255]);
    heroTag(ctx, t, 105 + 1.3, 3.0, '温斯顿', 'WINSTON', [140, 190, 255], W - 120, 150, 'right');
    locationCard(ctx, t, 105 + SW + 0.5, 3.6, '火星', 'MARS', '人类殖民地  COLONY', [255, 130, 200]);
    heroTag(ctx, t, 105 + SW + 1.2, 3.0, '朱诺', 'JUNO', [255, 110, 210], W - 120, 150, 'right');
  }
  return { init, draw, overlay, xfade: 0.6, bloomThresh: 0.7, texts: ['地平线月球基地', 'HORIZON LUNAR COLONY', '月球  THE MOON', '温斯顿', 'WINSTON', '火星', 'MARS', '人类殖民地  COLONY', '朱诺', 'JUNO'] };
})();
