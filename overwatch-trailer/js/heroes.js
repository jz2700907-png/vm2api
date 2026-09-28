// Stylised hero silhouettes: a small 2D skeleton rig + per-hero silhouette shapes and emissive details.
// Local units: a regular human is ~180 units tall, origin at the hip, +y is down.
'use strict';

const Rig = (() => {
  function solve(p, b) {
    const J = {};
    const side = b.side || 0;
    const lean = p.lean || 0;
    J.hip = [p.hx || 0, p.hy || 0];
    const up = [Math.sin(lean), -Math.cos(lean)];
    const rt = [Math.cos(lean), Math.sin(lean)];
    J.neck = [J.hip[0] + up[0] * b.torso, J.hip[1] + up[1] * b.torso];
    const ha = lean + (p.head || 0);
    J.head = [J.neck[0] + Math.sin(ha) * (b.neck + b.headR), J.neck[1] - Math.cos(ha) * (b.neck + b.headR)];
    const shC = [J.hip[0] + up[0] * b.torso * 0.9, J.hip[1] + up[1] * b.torso * 0.9];
    const sw = (b.shoulder / 2) * (1 - side * 0.85);
    J.shL = [shC[0] - rt[0] * sw, shC[1] - rt[1] * sw];
    J.shR = [shC[0] + rt[0] * sw, shC[1] + rt[1] * sw];
    const hw = (b.hipW / 2) * (1 - side * 0.8);
    J.hpL = [J.hip[0] - rt[0] * hw, J.hip[1] - rt[1] * hw];
    J.hpR = [J.hip[0] + rt[0] * hw, J.hip[1] + rt[1] * hw];
    const limb = (o, a, l) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l];
    J.elL = limb(J.shL, p.sL || 0, b.upper); J.haL = limb(J.elL, (p.sL || 0) + (p.eL || 0), b.fore);
    J.elR = limb(J.shR, p.sR || 0, b.upper); J.haR = limb(J.elR, (p.sR || 0) + (p.eR || 0), b.fore);
    J.knL = limb(J.hpL, p.hL || 0, b.thigh); J.ftL = limb(J.knL, (p.hL || 0) + (p.kL || 0), b.shin);
    J.knR = limb(J.hpR, p.hR || 0, b.thigh); J.ftR = limb(J.knR, (p.hR || 0) + (p.kR || 0), b.shin);
    J.aL = (p.sL || 0) + (p.eL || 0); J.aR = (p.sR || 0) + (p.eR || 0);
    J.lean = lean; J.up = up; J.rt = rt;
    if (p.ground !== false) {
      const dy = -Math.max(J.ftL[1], J.ftR[1]) - b.foot;
      for (const k in J) if (Array.isArray(J[k]) && k !== 'up' && k !== 'rt') J[k] = [J[k][0], J[k][1] + dy];
    }
    return J;
  }
  const lerpPose = (a, b, u) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const va = a[k] ?? 0, vb = b[k] ?? 0; o[k] = typeof va === 'number' ? lerp(va, vb, u) : (u < 0.5 ? va : vb); } return o; };
  function run(ph, amt = 1) {
    const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
    return { lean: 0.25 * amt, head: -0.15 * amt, sL: -0.9 * s * amt, eL: 1.4 * amt, sR: 0.9 * s * amt, eR: 1.4 * amt,
      hL: 0.8 * s * amt, kL: -(0.6 + 0.6 * Math.max(0, -c)) * amt, hR: -0.8 * s * amt, kR: -(0.6 + 0.6 * Math.max(0, c)) * amt, hy: -Math.abs(c) * 6 * amt };
  }
  return { solve, lerpPose, run };
})();

const Pose = {
  stand: { sL: -0.12, eL: 0.06, sR: 0.12, eR: -0.06, hL: -0.07, hR: 0.07 },
  heroic: { lean: -0.03, sL: -0.32, eL: 0.12, sR: 0.3, eR: -0.1, hL: -0.2, kL: 0.04, hR: 0.17, kR: -0.03 },
  float: { sL: -0.55, eL: -0.2, sR: 0.55, eR: 0.2, hL: -0.08, kL: 0.1, hR: 0.1, kR: -0.12, ground: false },
  aimR: { lean: 0.04, sL: 0.9, eL: 0.6, sR: 1.45, eR: 0.08, hL: -0.24, kL: 0.05, hR: 0.2, kR: -0.05 },
  lookUp: { lean: -0.06, head: -0.35, sL: -0.1, eL: 0.05, sR: 0.1, eR: -0.05, hL: -0.07, hR: 0.07 },
  reachUp: { lean: -0.05, head: -0.3, sL: -0.2, eL: 0.1, sR: 2.75, eR: 0.15, hL: -0.1, hR: 0.08 },
  crouch: { lean: 0.35, sL: -0.2, eL: -0.6, sR: 0.5, eR: 0.3, hL: -0.9, kL: 1.6, hR: 0.9, kR: -1.2 },
  kneel: { lean: 0.15, sL: 0.1, eL: -0.5, sR: 0.7, eR: 0.2, hL: -1.35, kL: 1.45, hR: 0.25, kR: 0.05 },
};

// ---- silhouette primitives ----
function taper(c, a, b, w1, w2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l, ny = dx / l;
  c.beginPath();
  c.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2);
  c.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  c.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2);
  c.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(a[0], a[1], w1 / 2, 0, TAU); c.fill();
  c.beginPath(); c.arc(b[0], b[1], w2 / 2, 0, TAU); c.fill();
}
function circ(c, p, r) { c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); }
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); }
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); }
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const mid = (a, b, u = 0.5) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

function humanoid(c, J, b) {
  // legs
  taper(c, J.hpL, J.knL, b.thighW, b.kneeW); taper(c, J.knL, J.ftL, b.kneeW, b.ankleW);
  taper(c, J.hpR, J.knR, b.thighW, b.kneeW); taper(c, J.knR, J.ftR, b.kneeW, b.ankleW);
  ell(c, J.ftL[0] + 5, J.ftL[1] + b.foot * 0.4, b.foot * 1.1, b.foot * 0.6);
  ell(c, J.ftR[0] + 5, J.ftR[1] + b.foot * 0.4, b.foot * 1.1, b.foot * 0.6);
  // torso
  const rt = J.rt, up = J.up;
  const cw = b.chestW / 2, ww = b.waistW / 2;
  const chest = add(J.hip, up, b.torso * 0.72);
  const waist = add(J.hip, up, b.torso * 0.25);
  c.beginPath();
  const sL = add(J.shL, up, 2), sR = add(J.shR, up, 2);
  c.moveTo(sL[0] - rt[0] * 4, sL[1] - rt[1] * 4);
  c.quadraticCurveTo(chest[0] - rt[0] * cw, chest[1] - rt[1] * cw, waist[0] - rt[0] * ww, waist[1] - rt[1] * ww);
  c.lineTo(J.hpL[0] - rt[0] * b.thighW * 0.55, J.hpL[1] - rt[1] * b.thighW * 0.55);
  c.lineTo(J.hpR[0] + rt[0] * b.thighW * 0.55, J.hpR[1] + rt[1] * b.thighW * 0.55);
  c.lineTo(waist[0] + rt[0] * ww, waist[1] + rt[1] * ww);
  c.quadraticCurveTo(chest[0] + rt[0] * cw, chest[1] + rt[1] * cw, sR[0] + rt[0] * 4, sR[1] + rt[1] * 4);
  c.closePath(); c.fill();
  // neck + head
  taper(c, J.neck, mid(J.neck, J.head, 0.6), b.neckW, b.neckW * 0.9);
  ell(c, J.head[0], J.head[1], b.headR * 0.92, b.headR, J.lean);
  // shoulders
  circ(c, J.shL, b.armW * 0.72); circ(c, J.shR, b.armW * 0.72);
  poly(c, [add(J.neck, J.rt, -b.neckW * 0.5), add(J.shL, J.up, b.armW * 0.3), add(J.shR, J.up, b.armW * 0.3), add(J.neck, J.rt, b.neckW * 0.5)]);
  // arms
  taper(c, J.shL, J.elL, b.armW, b.elbowW); taper(c, J.elL, J.haL, b.elbowW, b.wristW); circ(c, J.haL, b.wristW * 0.75);
  taper(c, J.shR, J.elR, b.armW, b.elbowW); taper(c, J.elR, J.haR, b.elbowW, b.wristW); circ(c, J.haR, b.wristW * 0.75);
}

const baseBuild = {
  torso: 52, neck: 5, headR: 10.5, shoulder: 34, hipW: 17, upper: 30, fore: 28, thigh: 44, shin: 42, foot: 6,
  thighW: 17, kneeW: 11, ankleW: 7, chestW: 34, waistW: 24, neckW: 8, armW: 9.5, elbowW: 7.5, wristW: 5.5, side: 0,
};
const build = (o) => Object.assign({}, baseBuild, o);

// pool of temp canvases for rim lighting
const _tmpPool = [];
function tmpCanvas(w, h) {
  for (const c of _tmpPool) if (c.width >= w && c.height >= h && !c.busy) { c.busy = true; return c; }
  const c = mk(Math.max(w, 256), Math.max(h, 256));
  c.busy = true;
  _tmpPool.push(c);
  return c;
}

// Draw a hero. def = {b, sil(c,J,t,o), emit(c,J,t,o), bbox}
function drawHero(ctx, def, x, y, s, pose, t, o = {}) {
  const { flip = 1, body = [10, 12, 18], rim = null, rimOff = [-3, -2], alpha = 1, emit = 1 } = o;
  const b = Object.assign({}, def.b, o.side !== undefined ? { side: o.side } : {});
  const J = Rig.solve(pose, b);
  const bb = def.bbox || [-160, -300, 160, 40];
  const bx0 = flip > 0 ? bb[0] : -bb[2], bx1 = flip > 0 ? bb[2] : -bb[0];
  const pad = 8;
  const tw = Math.ceil((bx1 - bx0) * s + pad * 2), th = Math.ceil((bb[3] - bb[1]) * s + pad * 2);
  if (alpha > 0) {
    const tmp = tmpCanvas(tw, th);
    const tc = tmp.ctx;
    tc.clearRect(0, 0, tw, th);
    const paint = (col, dx, dy) => {
      tc.save();
      tc.translate(-bx0 * s + pad + dx, -bb[1] * s + pad + dy);
      tc.scale(s * flip, s);
      tc.fillStyle = rgba(col); tc.strokeStyle = rgba(col);
      tc.lineCap = 'round'; tc.lineJoin = 'round';
      def.sil(tc, J, t, o, b);
      tc.restore();
    };
    if (rim) {
      paint(rim, 0, 0);
      tc.globalCompositeOperation = 'source-atop';
      paint(body, rimOff[0], rimOff[1]);
      tc.globalCompositeOperation = 'source-over';
    } else paint(body, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(tmp, 0, 0, tw, th, x + bx0 * s - pad, y + bb[1] * s - pad, tw, th);
    ctx.globalAlpha = 1;
    tmp.busy = false;
  }
  if (def.emit && emit > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * flip, s);
    def.emit(ctx, J, t, o, emit, b);
    ctx.restore();
  }
  return J;
}
// convert a joint to screen coordinates for a drawn hero
const jointXY = (J, name, x, y, s, flip = 1) => [x + J[name][0] * s * flip, y + J[name][1] * s];

// ---------------- hero definitions ----------------
const HERO = {};

HERO.tracer = {
  b: build({ torso: 47, headR: 10, shoulder: 30, chestW: 30, waistW: 21, thighW: 15, kneeW: 10, armW: 7.5, elbowW: 6, wristW: 5, hipW: 15, thigh: 43, shin: 42 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    // spiky hair
    const h = J.head, r = b.headR;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.95 + i * 0.3 + J.lean;
      const L = r * (1.55 + 0.35 * Math.sin(i * 2.1));
      poly(c, [[h[0] + Math.cos(a - 0.25) * r * 0.9, h[1] + Math.sin(a - 0.25) * r * 0.9], [h[0] + Math.cos(a) * L - 3, h[1] + Math.sin(a) * L], [h[0] + Math.cos(a + 0.25) * r * 0.9, h[1] + Math.sin(a + 0.25) * r * 0.9]]);
    }
    // chronal accelerator harness
    const ch = add(J.hip, J.up, b.torso * 0.68);
    circ(c, ch, 9);
    // pistols
    [[J.haL, J.aL], [J.haR, J.aR]].forEach(([p, a]) => { c.save(); c.translate(p[0], p[1]); c.rotate(-a); c.fillRect(-3, -2, 7, 14); c.fillRect(-3, 4, 13, 5); c.restore(); });
  },
  emit(c, J, t, o, e, b) {
    const ch = add(J.hip, J.up, b.torso * 0.68);
    const p = 0.85 + 0.15 * Math.sin(t * 6);
    glow(c, ch[0], ch[1], 38, [90, 200, 255], 0.9 * e * p);
    glow(c, ch[0], ch[1], 10, [220, 250, 255], e, 1);
    // goggles
    const h = J.head;
    glow(c, h[0] + b.headR * 0.55, h[1] - 1, 9, [255, 150, 40], 0.9 * e, 1);
  },
  bbox: [-90, -210, 90, 20],
};

HERO.reinhardt = {
  b: build({ torso: 64, headR: 12.5, shoulder: 62, chestW: 66, waistW: 48, thighW: 27, kneeW: 21, ankleW: 16, armW: 21, elbowW: 17, wristW: 13, hipW: 34, upper: 34, fore: 32, thigh: 46, shin: 44, foot: 11, neckW: 20, neck: 2 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    // layered pauldrons
    [[J.shL, -1], [J.shR, 1]].forEach(([p, sd]) => {
      ell(c, p[0] + sd * 5, p[1] - 3, 19, 13, sd * 0.35);
      ell(c, p[0] + sd * 9, p[1] + 8, 15, 9, sd * 0.5);
    });
    // helmet crest + jaw guard
    const h = J.head;
    poly(c, [[h[0] - 3, h[1] - 14], [h[0] + 3, h[1] - 21], [h[0] + 8, h[1] - 12]]);
    ell(c, h[0], h[1] + 4, 14, 12);
    // gauntlets and greaves
    circ(c, J.haL, 11); circ(c, J.haR, 11);
    // armoured skirt plates
    poly(c, [add(J.hpL, [-15, -6]), add(J.hpR, [15, -6]), add(J.hpR, [19, 24]), add(J.hip, [0, 30]), add(J.hpL, [-19, 24])]);
    if (o.hammer !== false) {
      const a = o.hammerAng !== undefined ? o.hammerAng : J.aR;
      const d = [Math.sin(a), Math.cos(a)];
      const p = J.haR, end = add(p, d, -22), headP = add(p, d, 96);
      c.lineWidth = 6; c.beginPath(); c.moveTo(end[0], end[1]); c.lineTo(headP[0], headP[1]); c.stroke();
      c.save(); c.translate(headP[0], headP[1]); c.rotate(-a);
      c.fillRect(-30, -6, 60, 30); c.fillRect(-36, 0, 72, 18); c.fillRect(30, 2, 12, 14);
      c.restore();
    }
  },
  emit(c, J, t, o, e, b) {
    const h = J.head;
    glow(c, h[0], h[1] + 1, 9, [130, 200, 255], 0.5 * e, 1);
    if (o.hammer !== false) {
      const a = o.hammerAng !== undefined ? o.hammerAng : J.aR;
      const headP = add(J.haR, [Math.sin(a), Math.cos(a)], 106);
      glow(c, headP[0], headP[1], 26, [255, 150, 60], 0.45 * e * (o.fire || 1));
    }
  },
  bbox: [-170, -290, 170, 60],
};

HERO.genji = {
  b: build({ torso: 50, headR: 10, shoulder: 34, chestW: 33, waistW: 21, thighW: 16, kneeW: 10.5, armW: 8.5, hipW: 16 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    poly(c, [[h[0] - 6, h[1] - 9], [h[0] - 18, h[1] - 3], [h[0] - 7, h[1] + 3]]);
    // shoulder plates
    [J.shL, J.shR].forEach((p) => ell(c, p[0], p[1] - 1, 10, 7));
    // sword on back / in hand
    if (o.blade) {
      const a = o.bladeAng !== undefined ? o.bladeAng : J.aR;
      const p = J.haR, d = [Math.sin(a), Math.cos(a)];
      c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + d[0] * 95, p[1] + d[1] * 95); c.stroke();
    } else {
      const s0 = add(J.shL, [-6, 8]), s1 = add(J.hpR, [10, -50]);
      c.lineWidth = 3; c.beginPath(); c.moveTo(s0[0] - 20, s0[1] - 22); c.lineTo(s1[0] + 20, s1[1] + 22); c.stroke();
    }
  },
  emit(c, J, t, o, e, b) {
    const G = [120, 255, 90];
    const h = J.head;
    glow(c, h[0] + 6, h[1] - 1, 8, G, 0.9 * e, 1);
    [J.shL, J.shR, J.knL, J.knR, J.elL, J.elR].forEach((p) => glow(c, p[0], p[1], 5, G, 0.7 * e, 1));
    const ch = add(J.hip, J.up, b.torso * 0.6);
    glow(c, ch[0], ch[1], 6, G, 0.6 * e, 1);
    if (o.blade) {
      const a = o.bladeAng !== undefined ? o.bladeAng : J.aR;
      const p = J.haR, d = [Math.sin(a), Math.cos(a)];
      glowLine(c, [p, [p[0] + d[0] * 95, p[1] + d[1] * 95]], G, 5, e * (o.bladeGlow || 1));
    }
  },
  bbox: [-120, -220, 120, 20],
};

HERO.hanzo = {
  b: build({ torso: 52, headR: 10.5, shoulder: 38, chestW: 38, waistW: 26, thighW: 16, kneeW: 14, ankleW: 13, armW: 10, hipW: 20 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    // hakama flare
    poly(c, [add(J.hpL, [-6, -4]), add(J.hpR, [6, -4]), add(J.ftR, [20, -2]), add(J.ftL, [-20, -2])]);
    // hair tie
    const h = J.head;
    circ(c, [h[0] - 5, h[1] - 10], 5);
    taper(c, [h[0] - 6, h[1] - 10], [h[0] - 20 + Math.sin(t * 2) * 2, h[1] + 12], 5, 2);
    // bow in left hand
    const p = J.haL, a = J.aL;
    c.save(); c.translate(p[0], p[1]); c.rotate(-a + Math.PI / 2);
    c.lineWidth = 4; c.beginPath(); c.arc(-26, 0, 50, -0.95, 0.95); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(-26 + 50 * Math.cos(0.95), -50 * Math.sin(0.95)); c.lineTo(o.draw ? -12 - 30 * o.draw : -26 + 50 * Math.cos(0.95), 0); c.lineTo(-26 + 50 * Math.cos(0.95), 50 * Math.sin(0.95)); c.stroke();
    c.restore();
  },
  emit(c, J, t, o, e) {
    const B = [90, 170, 255];
    glow(c, J.elL[0], J.elL[1], 10, B, 0.4 * e);
    if (o.arrow) glow(c, J.haL[0], J.haL[1], 26, B, o.arrow * e, 1);
  },
  bbox: [-130, -220, 130, 20],
};

HERO.mercy = {
  b: build({ torso: 49, headR: 10, shoulder: 30, chestW: 30, waistW: 20, thighW: 15, kneeW: 10, armW: 7.5, hipW: 16 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    // ponytail
    taper(c, [h[0] - 4, h[1] - 9], [h[0] - 13, h[1] - 18], 7, 4);
    // coat tails
    const w = add(J.hip, J.up, 6);
    poly(c, [add(w, [-12, 0]), add(w, [12, 0]), add(J.knR, [10, 16 + Math.sin(t * 3) * 3]), add(J.knL, [-16, 22 + Math.sin(t * 3 + 1) * 4])]);
    // wing frame
    const back = add(J.hip, J.up, b.torso * 0.8);
    c.lineWidth = 5;
    [-1, 1].forEach((sd) => { c.beginPath(); c.moveTo(back[0], back[1]); c.lineTo(back[0] + sd * 26, back[1] - 18); c.stroke(); });
    // staff
    if (o.staff !== false) {
      const p = J.haR, a = J.aR + 0.1, d = [Math.sin(a), Math.cos(a)];
      c.lineWidth = 3; c.beginPath(); c.moveTo(p[0] - d[0] * 40, p[1] - d[1] * 40); c.lineTo(p[0] + d[0] * 55, p[1] + d[1] * 55); c.stroke();
    }
  },
  emit(c, J, t, o, e, b) {
    const Gd = [255, 214, 120];
    const h = J.head;
    ring(c, h[0], h[1] - 20, 11, Gd, 2.2, 0.9 * e, 0.35);
    const back = add(J.hip, J.up, b.torso * 0.8);
    const open = o.wings === undefined ? 1 : o.wings;
    const flap = Math.sin(t * 2.2) * 0.06;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const ang = -Math.PI / 2 + sd * (0.55 + i * 0.42 * open + flap) ;
        const L = (95 - i * 12) * (0.4 + 0.6 * open);
        const base = [back[0] + sd * 22, back[1] - 14];
        const tip = [base[0] + Math.cos(ang) * L * (sd), base[1] + Math.sin(ang) * L];
        const tipx = base[0] + sd * Math.abs(Math.cos(ang)) * L, tipy = base[1] + Math.sin(ang) * L * 0.9 + i * 22;
        const gr = c.createLinearGradient(base[0], base[1], tipx, tipy);
        gr.addColorStop(0, rgba([255, 240, 200], 0.9 * e));
        gr.addColorStop(1, rgba(Gd, 0.15 * e));
        c.fillStyle = gr;
        c.beginPath();
        c.moveTo(base[0], base[1]);
        c.quadraticCurveTo(lerp(base[0], tipx, 0.5) + sd * 6, lerp(base[1], tipy, 0.5) - 10, tipx, tipy);
        c.quadraticCurveTo(lerp(base[0], tipx, 0.5), lerp(base[1], tipy, 0.5) + 8, base[0], base[1] + 4);
        c.fill();
        glow(c, tipx, tipy, 14, Gd, 0.5 * e);
      }
    }
    c.restore();
    glow(c, back[0], back[1] - 10, 60, Gd, 0.35 * e);
    if (o.staff !== false) {
      const p = J.haR, a = J.aR + 0.1, d = [Math.sin(a), Math.cos(a)];
      glow(c, p[0] - d[0] * 42, p[1] - d[1] * 42, 20, o.beam === 'blue' ? [120, 200, 255] : Gd, 0.9 * e, 1);
    }
  },
  bbox: [-150, -240, 150, 20],
};

HERO.winston = {
  b: build({ torso: 58, headR: 12, shoulder: 76, chestW: 84, waistW: 58, thighW: 26, kneeW: 20, ankleW: 15, armW: 26, elbowW: 21, wristW: 17, hipW: 40, upper: 46, fore: 50, thigh: 28, shin: 26, foot: 10, neckW: 26, neck: -6 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    // trapezius hump
    ell(c, J.neck[0], J.neck[1] + 4, 36, 22, J.lean);
    // fists
    circ(c, J.haL, 15); circ(c, J.haR, 15);
    // tesla cannon on the right forearm
    if (o.tesla !== false) { c.save(); c.translate(J.elR[0], J.elR[1]); c.rotate(-J.aR); c.fillRect(-12, 6, 24, 34); c.restore(); }
  },
  emit(c, J, t, o, e) {
    const h = J.head;
    if (o.glasses !== false) { glow(c, h[0] - 5, h[1] + 1, 6, [220, 240, 255], 0.9 * e, 1); glow(c, h[0] + 5, h[1] + 1, 6, [220, 240, 255], 0.9 * e, 1); }
    if (o.tesla) glow(c, J.haR[0], J.haR[1], 34, [130, 200, 255], 0.9 * e);
  },
  bbox: [-170, -250, 170, 30],
};

HERO.mei = {
  b: build({ torso: 44, headR: 11, shoulder: 34, chestW: 42, waistW: 36, thighW: 15, kneeW: 12, ankleW: 10, armW: 11, elbowW: 10, wristW: 7, hipW: 20, thigh: 36, shin: 34, foot: 7 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    circ(c, [h[0] - 3, h[1] - 11], 7.5); // bun
    c.lineWidth = 2.2; c.beginPath(); c.moveTo(h[0] - 10, h[1] - 18); c.lineTo(h[0] + 5, h[1] - 7); c.stroke();
    // parka fur collar
    ell(c, J.neck[0], J.neck[1] + 3, 15, 7);
    // blaster in right hand
    const p = J.haR;
    c.save(); c.translate(p[0], p[1]); c.rotate(-J.aR + Math.PI / 2); c.fillRect(-6, -7, 30, 14); c.restore();
  },
  emit(c, J, t, o, e) {
    const p = J.haR;
    glow(c, p[0], p[1], 14, [120, 210, 255], 0.6 * e, 1);
    const h = J.head;
    glow(c, h[0] + 7, h[1], 5, [230, 245, 255], 0.5 * e, 1);
    // snowball drone
    const d = [J.head[0] + 32, J.head[1] - 20 + Math.sin(t * 2) * 5];
    c.save(); c.fillStyle = rgba([230, 240, 255], e); c.beginPath(); c.arc(d[0], d[1], 7, 0, TAU); c.fill(); c.restore();
    glow(c, d[0], d[1], 18, [120, 210, 255], 0.8 * e);
  },
  bbox: [-100, -190, 110, 20],
};

HERO.juno = {
  b: build({ torso: 47, headR: 12.5, shoulder: 30, chestW: 30, waistW: 20, thighW: 15, kneeW: 10, armW: 7.5, hipW: 15 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const back = add(J.hip, J.up, b.torso * 0.7);
    ell(c, back[0] - 11, back[1], 9, 15, J.lean);
    // boots
    [J.ftL, J.ftR].forEach((p) => ell(c, p[0] + 3, p[1], 9, 7));
  },
  emit(c, J, t, o, e, b) {
    const P = [255, 90, 200];
    const h = J.head;
    glow(c, h[0] + 5, h[1], 11, P, 0.8 * e, 1);
    [J.ftL, J.ftR].forEach((p) => { glow(c, p[0], p[1] + 10, 22, [255, 120, 220], 0.7 * e); });
    const back = add(J.hip, J.up, b.torso * 0.7);
    glow(c, back[0] - 11, back[1], 9, [120, 220, 255], 0.6 * e, 1);
  },
  bbox: [-90, -200, 90, 30],
};

HERO.kiriko = {
  b: build({ torso: 47, headR: 10, shoulder: 30, chestW: 30, waistW: 20, thighW: 15, kneeW: 10, armW: 7.5, hipW: 16 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    // high ponytail
    circ(c, [h[0] - 5, h[1] - 11], 5);
    taper(c, [h[0] - 5, h[1] - 12], [h[0] - 24 + Math.sin(t * 3) * 3, h[1] + 16], 7, 3);
    // fox mask on side
    poly(c, [[h[0] - 2, h[1] - 12], [h[0] + 4, h[1] - 22], [h[0] + 9, h[1] - 9]]);
    // skirt
    const w = add(J.hip, J.up, 4);
    poly(c, [add(w, [-13, 0]), add(w, [13, 0]), add(w, [20, 26]), add(w, [-20, 26])]);
  },
  emit(c, J, t, o, e) {
    glow(c, J.haR[0], J.haR[1], 14, [255, 230, 120], 0.8 * e, 1);
    glow(c, J.haL[0], J.haL[1], 10, [120, 255, 230], 0.6 * e, 1);
  },
  bbox: [-100, -200, 100, 20],
};

HERO.ana = {
  b: build({ torso: 50, headR: 10, shoulder: 32, chestW: 32, waistW: 24, thighW: 16, kneeW: 10.5, armW: 8.5, hipW: 17 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    // hood / cloak
    poly(c, [[h[0] - 12, h[1] - 6], [h[0] + 6, h[1] - 14], [h[0] + 13, h[1] + 2], add(J.hip, [22, 12]), add(J.hip, [-30, 30 + Math.sin(t * 2) * 4])]);
    // rifle
    const p = J.haR, a = J.aR - Math.PI / 2 + 0.1;
    c.save(); c.translate(p[0], p[1]); c.rotate(-J.aR + Math.PI / 2);
    c.fillRect(-30, -4, 110, 7); c.fillRect(0, -10, 26, 8); c.fillRect(-36, -3, 12, 14);
    c.restore();
  },
  emit(c, J, t, o, e) {
    const p = J.haR;
    const d = [Math.sin(J.aR), Math.cos(J.aR)];
    glow(c, p[0] + d[0] * 75, p[1] + d[1] * 75, 10, [255, 220, 130], 0.8 * e, 1);
  },
  bbox: [-130, -210, 170, 20],
};

HERO.lucio = {
  b: build({ torso: 47, headR: 10, shoulder: 32, chestW: 32, waistW: 22, thighW: 16, kneeW: 10.5, armW: 8.5, hipW: 16 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.8 + i * 0.26 + J.lean;
      const bx = h[0] + Math.cos(a) * 8, by = h[1] + Math.sin(a) * 8;
      taper(c, [bx, by], [bx - 14 - i * 1.5 + Math.sin(t * 5 + i) * 2, by + 18 + i * 2], 5, 3.5);
    }
    [J.ftL, J.ftR].forEach((p) => { c.fillRect(p[0] - 10, p[1] + 4, 24, 5); });
  },
  emit(c, J, t, o, e) {
    const Gn = [120, 255, 110];
    [J.ftL, J.ftR].forEach((p) => { glow(c, p[0] - 7, p[1] + 10, 6, Gn, e, 1); glow(c, p[0] + 11, p[1] + 10, 6, Gn, e, 1); });
    glow(c, J.haR[0], J.haR[1], 16, Gn, 0.8 * e, 1);
  },
  bbox: [-110, -200, 110, 30],
};

HERO.soldier = {
  b: build({ torso: 53, headR: 10.5, shoulder: 38, chestW: 40, waistW: 28, thighW: 15, kneeW: 11, armW: 10, hipW: 19 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    // jacket collar + rifle
    ell(c, J.neck[0], J.neck[1] + 2, 13, 8);
    const p = J.haR;
    c.save(); c.translate(p[0], p[1]); c.rotate(-J.aR + Math.PI / 2); c.fillRect(-20, -6, 70, 11); c.fillRect(-8, 4, 8, 14); c.restore();
    // spiky hair
    const h = J.head;
    poly(c, [[h[0] - 9, h[1] - 6], [h[0] - 4, h[1] - 16], [h[0] + 1, h[1] - 10], [h[0] + 6, h[1] - 15], [h[0] + 8, h[1] - 6]]);
  },
  emit(c, J, t, o, e) {
    const h = J.head;
    glow(c, h[0] + 6, h[1] - 1, 9, [255, 60, 60], 0.9 * e, 1);
  },
  bbox: [-110, -220, 150, 20],
};

HERO.zenyatta = {
  b: build({ torso: 50, headR: 11, shoulder: 30, chestW: 27, waistW: 18, thighW: 12, kneeW: 10, armW: 6.5, elbowW: 5.5, wristW: 5, hipW: 18 }),
  sil(c, J, t, o, b) {
    // lotus pose: crossed legs as a wide cloth base
    const hp = J.hip;
    ell(c, hp[0], hp[1] + 8, 40, 13);
    poly(c, [[hp[0] - 14, hp[1] - 4], [hp[0] + 14, hp[1] - 4], [hp[0] + 44, hp[1] + 14], [hp[0] - 44, hp[1] + 14]]);
    const J2 = Object.assign({}, J, { knL: add(hp, [-30, 8]), ftL: add(hp, [20, 12]), knR: add(hp, [30, 8]), ftR: add(hp, [-20, 12]) });
    const b2 = Object.assign({}, b, { thighW: 0.1, kneeW: 0.1, ankleW: 0.1, foot: 0.1 });
    humanoid(c, J2, b2);
    // beads
    for (let i = 0; i < 9; i++) { const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7; circ(c, [J.neck[0] + Math.cos(a) * 14, J.neck[1] + 2 + Math.sin(a) * 14], 3.3); }
  },
  emit(c, J, t, o, e) {
    const h = J.head;
    for (let i = 0; i < 5; i++) glow(c, h[0] - 6 + i * 3, h[1] - 3 - Math.abs(i - 2) * 1.2, 3.5, [120, 220, 255], 0.8 * e, 1);
    const n = o.orbs === undefined ? 8 : o.orbs;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + t * 0.7;
      const x = J.hip[0] + Math.cos(a) * 62, y = J.hip[1] - 50 + Math.sin(a) * 18;
      c.save(); c.fillStyle = rgba([255, 205, 90], e); c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); c.restore();
      glow(c, x, y, 22, [255, 190, 80], 0.8 * e);
    }
    if (o.transcend) glow(c, J.hip[0], J.hip[1] - 50, 170, [255, 230, 150], o.transcend * e);
  },
  bbox: [-120, -200, 120, 40],
};

HERO.omnic = {
  b: build({ torso: 54, headR: 12, shoulder: 34, chestW: 30, waistW: 16, thighW: 9, kneeW: 7, ankleW: 6, armW: 7, elbowW: 6, wristW: 5, hipW: 16, thigh: 46, shin: 46 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    if (o.umbrella) {
      const p = J.haR;
      const top = [p[0] - 6, p[1] - 88];
      c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(top[0], top[1]); c.stroke();
      c.beginPath(); c.moveTo(top[0] - 88, top[1] + 30);
      c.quadraticCurveTo(top[0], top[1] - 40, top[0] + 88, top[1] + 30);
      for (let i = 0; i < 4; i++) c.quadraticCurveTo(top[0] + 88 - (i + 0.5) * 44, top[1] + 18, top[0] + 88 - (i + 1) * 44, top[1] + 30);
      c.closePath(); c.fill();
    }
  },
  emit(c, J, t, o, e) {
    const h = J.head;
    for (let i = 0; i < 3; i++) glow(c, h[0] - 4 + i * 5, h[1] - 1, 4, [120, 200, 255], 0.9 * e, 1);
  },
  bbox: [-120, -250, 120, 20],
};

HERO.child = {
  b: build({ torso: 30, headR: 11, shoulder: 20, chestW: 20, waistW: 17, thighW: 9, kneeW: 7, ankleW: 6, armW: 6, elbowW: 5, wristW: 4, hipW: 11, upper: 18, fore: 17, thigh: 24, shin: 23, foot: 5, neck: 3, neckW: 6 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const h = J.head;
    if (o.scarf) poly(c, [[h[0] - 12, h[1] - 6], [h[0] + 10, h[1] - 11], [h[0] + 12, h[1] + 6], [h[0] - 14, h[1] + 12]]);
    if (o.coat) poly(c, [add(J.hip, [-12, -24]), add(J.hip, [12, -24]), add(J.hip, [15, 12]), add(J.hip, [-15, 12])]);
  },
  bbox: [-70, -120, 70, 20],
};

HERO.civ = {
  b: build({ torso: 50, headR: 10.5, shoulder: 34, chestW: 38, waistW: 34, thighW: 18, kneeW: 13, ankleW: 9, armW: 11, elbowW: 9, wristW: 6.5, hipW: 20 }),
  sil(c, J, t, o, b) {
    humanoid(c, J, b);
    const w = add(J.hip, J.up, b.torso * 0.6);
    poly(c, [add(w, [-19, 0]), add(w, [19, 0]), add(J.knR, [14, 12]), add(J.knL, [-14, 12])]);
    if (o.hat) ell(c, J.head[0], J.head[1] - 8, 16, 5);
  },
  bbox: [-90, -210, 90, 20],
};

HERO.orisa = {
  b: build({ torso: 40, headR: 11, shoulder: 44, chestW: 44, waistW: 30, armW: 13, elbowW: 11, wristW: 9, upper: 30, fore: 28, neck: 4, neckW: 13 }),
  sil(c, J, t, o, b) {
    // quadruped body sits behind/below the humanoid upper torso (facing +x)
    const hp = J.hip;
    const walk = o.walk || 0, wa = o.walkAmt || 0;
    const bodyC = [hp[0] - 44, hp[1] + 14];
    ell(c, bodyC[0], bodyC[1], 66, 24, -0.05);
    ell(c, hp[0] - 6, hp[1] + 6, 30, 26);
    [[-92, 0], [-70, 0.5], [-12, 0.25], [8, 0.75]].forEach(([dx, ph]) => {
      const sw = Math.sin((walk + ph) * TAU) * wa;
      const top = [hp[0] + dx, hp[1] + 26];
      const knee = [top[0] + 6 + sw * 16, top[1] + 40];
      const foot = [knee[0] - 8 + sw * 12, knee[1] + 40 - Math.max(0, sw) * 10];
      taper(c, top, knee, 20, 13); taper(c, knee, foot, 13, 10); ell(c, foot[0] + 4, foot[1] + 3, 12, 6);
    });
    const b2 = Object.assign({}, b, { thighW: 0.1, kneeW: 0.1, ankleW: 0.1, foot: 0.1 });
    humanoid(c, J, b2);
    [J.shL, J.shR].forEach((p) => ell(c, p[0], p[1] - 2, 14, 11));
    // head fins
    const h = J.head;
    poly(c, [[h[0] - 6, h[1] - 6], [h[0] - 22, h[1] - 20], [h[0] - 2, h[1] - 10]]);
    poly(c, [[h[0] + 6, h[1] - 6], [h[0] + 18, h[1] - 22], [h[0] + 2, h[1] - 10]]);
    // javelin
    if (o.javelin) { c.lineWidth = 4; c.beginPath(); c.moveTo(J.haR[0] - 10, J.haR[1] + 50); c.lineTo(J.haR[0] + 16, J.haR[1] - 90); c.stroke(); }
  },
  emit(c, J, t, o, e) {
    const h = J.head;
    glow(c, h[0] + 3, h[1], 12, [150, 255, 120], 0.9 * e, 1);
    glow(c, J.hip[0] + 2, J.hip[1] - 22, 9, [255, 220, 80], 0.6 * e, 1);
  },
  bbox: [-190, -170, 110, 130],
};

// D.Va's MEKA is a separate shape
const DVA = {
  draw(ctx, x, y, s, t, o = {}) {
    const { body = [12, 12, 20], rim = [255, 140, 220], flip = 1, boost = 0, legs = 1 } = o;
    const def = {
      b: build({}),
      sil(c) {
        // body shell
        ell(c, 0, -120, 70, 58);
        poly(c, [[-60, -150], [60, -150], [52, -178], [-52, -178]]);
        // arms + cannons
        [-1, 1].forEach((sd) => {
          ell(c, sd * 72, -128, 22, 26);
          c.save(); c.translate(sd * 80, -110); c.rotate(sd * -0.1);
          c.fillRect(-12, 0, 24, 58); c.fillRect(-15, 40, 30, 22);
          c.restore();
        });
        // boosters
        [-1, 1].forEach((sd) => { c.save(); c.translate(sd * 40, -178); c.rotate(sd * 0.25); c.fillRect(-12, -40, 24, 44); c.restore(); });
        if (legs) {
          [-1, 1].forEach((sd) => {
            const hip = [sd * 38, -80], knee = [sd * 52, -44], ankle = [sd * 40, -8];
            taper(c, hip, knee, 26, 18); taper(c, knee, ankle, 18, 12); ell(c, ankle[0], ankle[1] + 2, 22, 8);
          });
        }
      },
      emit(c, J, tt, oo, e) {
        const P = [255, 110, 200];
        c.globalAlpha = 1;
        glow(c, 0, -118, 12, P, 0.9 * e, 1);
        [-1, 1].forEach((sd) => { glow(c, sd * 30, -100, 7, P, 0.8, 1); glow(c, sd * 82, -52, 16, [255, 170, 120], 0.4, 1); });
        if (boost > 0) {
          [-1, 1].forEach((sd) => {
            const bx = sd * 40 + sd * 12, by = -226;
            for (let i = 0; i < 6; i++) glow(c, bx + sd * i * 3, by - i * 16 - Math.random() * 0, (26 - i * 3) * boost, [255, 170, 90], 0.7 * boost, 1);
            glow(c, bx, by, 60 * boost, [120, 180, 255], 0.6 * boost);
          });
        }
      },
      bbox: [-120, -240, 120, 20],
    };
    return drawHero(ctx, def, x, y, s, { ground: false }, t, { body, rim, flip, rimOff: o.rimOff || [-3, -2], alpha: o.alpha === undefined ? 1 : o.alpha, emit: o.emit === undefined ? 1 : o.emit });
  },
};

// The little yellow robot bird that carries the signal.
function bird(ctx, x, y, s, t, a = 1, dir = 1, lit = 1) {
  const flap = Math.sin(t * 16);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.globalAlpha = a;
  const body = [40, 34, 20], Y = [255, 210, 80];
  ctx.fillStyle = rgba(mix(body, Y, 0.35 * lit));
  // far wing
  ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-8, -18 * flap - 4, -20, -26 * flap); ctx.lineTo(4, -2); ctx.fill();
  ell(ctx, 0, 0, 12, 7, -0.1);
  circ(ctx, [10, -5], 6);
  poly(ctx, [[15, -6], [22, -4], [15, -2]]);
  poly(ctx, [[-10, -1], [-22, -6], [-20, 3]]);
  ctx.fillStyle = rgba(mix(body, Y, 0.6 * lit));
  ctx.beginPath(); ctx.moveTo(-4, -3); ctx.quadraticCurveTo(-2, -22 * flap - 6, -14, -32 * flap); ctx.lineTo(6, -3); ctx.fill();
  ctx.restore();
  glow(ctx, x + 10 * s * dir, y - 5 * s, 9 * s, [255, 230, 150], 0.9 * a * lit, 1);
  glow(ctx, x, y, 40 * s, [255, 200, 100], 0.35 * a * lit);
}

// Serpentine spirit dragon along a parametric path fn(u) -> [x, y, width], u in [0,1] (u=1 is the head)
function spiritDragon(ctx, path, col, a, t, seed = 1, headScale = 1) {
  if (a <= 0) return;
  const N = 90;
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(path(i / N));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  // body glow layers
  for (const [k, al, cc] of [[2.6, 0.06, col], [1.5, 0.13, col], [0.8, 0.32, col], [0.25, 0.5, mix(col, [255, 255, 255], 0.55)]]) {
    for (let i = 1; i <= N; i++) {
      const w = pts[i][2] * k;
      ctx.strokeStyle = rgba(cc, al * a * (0.3 + 0.7 * (i / N)));
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
  }
  // scale chevrons + spine
  ctx.strokeStyle = rgba([255, 255, 255], 0.55 * a);
  ctx.lineWidth = 2;
  for (let i = 3; i < N - 2; i += 3) {
    const [x0, y0, w] = pts[i], [x1, y1] = pts[i + 1];
    const d = Math.atan2(y1 - y0, x1 - x0);
    const nx = Math.cos(d + Math.PI / 2) * w * 0.45, ny = Math.sin(d + Math.PI / 2) * w * 0.45;
    ctx.beginPath();
    ctx.moveTo(x0 + nx, y0 + ny);
    ctx.lineTo(x0 + Math.cos(d) * w * 0.35, y0 + Math.sin(d) * w * 0.35);
    ctx.lineTo(x0 - nx, y0 - ny);
    ctx.stroke();
  }
  // whisker streamers / fins along body
  for (let i = 10; i < N - 5; i += 14) {
    const [x0, y0, w] = pts[i], [x1, y1] = pts[i + 1];
    const d = Math.atan2(y1 - y0, x1 - x0);
    for (const sd of [-1, 1]) {
      const fx = x0 + Math.cos(d + sd * 2.2) * w * 1.3, fy = y0 + Math.sin(d + sd * 2.2) * w * 1.3;
      ctx.strokeStyle = rgba(col, 0.5 * a); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(d + sd * 1.6) * w, y0 + Math.sin(d + sd * 1.6) * w, fx, fy); ctx.stroke();
    }
  }
  // head
  const [hx, hy, hw] = pts[N], [px, py] = pts[N - 3];
  const d = Math.atan2(hy - py, hx - px);
  ctx.translate(hx, hy);
  ctx.rotate(d);
  const S = hw * 0.055 * headScale;
  ctx.scale(S, S);
  ctx.fillStyle = rgba(col, 0.6 * a);
  ctx.beginPath();
  ctx.moveTo(-10, -18); ctx.lineTo(30, -14); ctx.lineTo(52, -4); ctx.lineTo(56, 2); ctx.lineTo(34, 6); ctx.lineTo(48, 16); ctx.lineTo(20, 14); ctx.lineTo(-10, 18); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba([255, 255, 255], 0.8 * a); ctx.lineWidth = 2.5;
  ctx.stroke();
  // horns + whiskers
  ctx.strokeStyle = rgba(col, 0.9 * a); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(4, -16); ctx.quadraticCurveTo(-20, -40, -46, -42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -14); ctx.quadraticCurveTo(-8, -34, -30, -52); ctx.stroke();
  const wv = Math.sin(t * 4 + seed);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(44, 8); ctx.bezierCurveTo(30, 40, 0, 30 + wv * 10, -40, 50 + wv * 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(44, -6); ctx.bezierCurveTo(30, -30, 0, -26 - wv * 10, -44, -36 - wv * 16); ctx.stroke();
  ctx.restore();
  glow(ctx, hx + Math.cos(d) * hw * 1.4, hy + Math.sin(d) * hw * 1.4, hw * 2.4, col, 0.55 * a);
  glow(ctx, hx + Math.cos(d) * hw * 1.2 - Math.sin(d) * hw * 0.3, hy + Math.sin(d) * hw * 1.2 + Math.cos(d) * hw * 0.3 - 4, hw * 0.4, [255, 255, 255], a, 1);
}

// Kiriko's fox spirit: running fox made of light
function spiritFox(ctx, x, y, s, t, a, dir = 1) {
  if (a <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.globalCompositeOperation = 'lighter';
  const run = t * 9;
  const T = [110, 255, 230], Y = [255, 230, 120];
  ctx.fillStyle = rgba(T, 0.35 * a);
  ctx.strokeStyle = rgba([230, 255, 250], 0.8 * a);
  ctx.lineWidth = 3;
  ctx.beginPath();
  // body
  ctx.moveTo(-60, -40); ctx.quadraticCurveTo(-10, -62, 40, -48); ctx.lineTo(62, -64); ctx.lineTo(70, -84); ctx.lineTo(78, -66); ctx.lineTo(96, -60); ctx.lineTo(80, -50); ctx.lineTo(62, -30); ctx.quadraticCurveTo(10, -22, -50, -26);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // legs
  for (let i = 0; i < 4; i++) {
    const bx = [-44, -30, 30, 44][i], ph = Math.sin(run + i * 1.6);
    ctx.beginPath(); ctx.moveTo(bx, -30); ctx.lineTo(bx + ph * 18, -2); ctx.stroke();
  }
  // tails
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.moveTo(-56, -36);
    ctx.bezierCurveTo(-100, -70 - k * 10 + Math.sin(run * 0.5 + k) * 8, -140, -30 + k * 14, -170 - k * 10, -66 + k * 22 + Math.sin(run * 0.7 + k) * 10);
    ctx.lineWidth = 10 - k * 2; ctx.strokeStyle = rgba(T, 0.5 * a); ctx.stroke();
  }
  ctx.restore();
  glow(ctx, x + 60 * s * dir, y - 55 * s, 110 * s, T, 0.5 * a);
  glow(ctx, x + 80 * s * dir, y - 62 * s, 10 * s, Y, a, 1);
}
