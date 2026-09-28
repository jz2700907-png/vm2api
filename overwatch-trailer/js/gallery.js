// Debug gallery of hero silhouettes (not part of the film). Rendered via: node tools/render.js --gallery
'use strict';
function drawGallery(ctx, t = 1.3) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, [255, 170, 110]], [1, [90, 60, 100]]]);
  ctx.fillRect(0, 0, W, H);
  const rim = [255, 230, 190], body = [14, 14, 22];
  const row1 = 470, row2 = 980;
  const list1 = [
    ['tracer', Pose.heroic], ['reinhardt', Pose.heroic], ['genji', Pose.heroic], ['hanzo', Pose.stand], ['mercy', Pose.float], ['winston', { sL: -0.28, eL: 0.12, sR: 0.28, eR: -0.12, hL: -0.4, kL: 0.35, hR: 0.4, kR: -0.35 }],
  ];
  const list2 = [['mei', Pose.stand], ['juno', Pose.heroic], ['kiriko', Pose.heroic], ['ana', Pose.aimR], ['lucio', Pose.heroic], ['soldier', Pose.aimR], ['zenyatta', { ground: false }], ['omnic', Pose.stand], ['child', Pose.lookUp]];
  list1.forEach(([k, p], i) => drawHero(ctx, HERO[k], 170 + i * 310, row1, 1.6, p, t, { rim, body, side: 0.2, umbrella: true }));
  list2.forEach(([k, p], i) => drawHero(ctx, HERO[k], 120 + i * 210, row2, 1.4, p, t, { rim, body, umbrella: k === 'omnic' }));
  drawHero(ctx, HERO.orisa, 1760, 400, 1.2, { sL: -0.3, sR: 0.5, eR: -0.8, ground: false }, t, { rim, body, walkAmt: 0.5, walk: 0.2, side: 0.6, javelin: true }); drawHero(ctx, HERO.child, 1700, 330, 0.9, { sL: -0.3, sR: 0.3, hL: -1.2, kL: 1.3, hR: 1.2, kR: -1.3, ground: false }, t, { rim, body, scarf: true });
  DVA.draw(ctx, 1700, 760, 1.2, t, { boost: 0.5 });
  bird(ctx, 1500, 150, 2.5, t);
}
