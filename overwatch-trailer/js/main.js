// Timeline, scene compositing, post-processing and frame export.
'use strict';


const App = (() => {
  const out = document.getElementById('out');
  const octx = out.getContext('2d');
  const sceneA = mk(W, H), sceneB = mk(W, H);
  let ready = false;
  const story = window.STORY, vo = window.VO || [];

  function sceneAt(t) {
    for (let i = story.scenes.length - 1; i >= 0; i--) if (t >= story.scenes[i].start) return i;
    return 0;
  }

  function drawScene(ctx, i, t) {
    const sc = story.scenes[i];
    const impl = Scenes[sc.id];
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (impl) impl.draw(ctx, t, t - sc.start, sc.end - sc.start);
    ctx.restore();
  }

  function render(t, frame = Math.round(t * story.fps)) {
    const i = sceneAt(t);
    const sc = story.scenes[i];
    const impl = Scenes[sc.id] || {};
    drawScene(sceneA.ctx, i, t);
    // cross-dissolve from the previous scene
    const xf = impl.xfade || 0;
    if (xf > 0 && i > 0 && t < sc.start + xf) {
      drawScene(sceneB.ctx, i - 1, t);
      const u = smooth((t - sc.start) / xf);
      sceneB.ctx.globalAlpha = u;
      sceneB.ctx.drawImage(sceneA, 0, 0);
      sceneB.ctx.globalAlpha = 1;
      octx.drawImage(sceneB, 0, 0);
    } else {
      octx.drawImage(sceneA, 0, 0);
    }
    Post.bloom(out, octx, impl.bloom !== undefined ? impl.bloom : 0.75, impl.bloomThresh || 0.6);
    // screen-space overlays that sit above bloom (flashes etc.)
    for (const s of story.scenes) {
      const im = Scenes[s.id];
      if (im && im.post && t >= s.start - 1 && t < s.end + 1) im.post(octx, t, t - s.start, s.end - s.start);
    }
    Post.vignette(octx, impl.vignette !== undefined ? impl.vignette : 0.5);
    Post.letterbox(octx);
    for (const s of story.scenes) {
      const im = Scenes[s.id];
      if (im && im.overlay && t >= s.start - 0.5 && t < s.end + 1.5) im.overlay(octx, t, t - s.start, s.end - s.start);
    }
    subtitles(octx, t, vo);
    Post.film(octx, frame, 0.06);
    // global fade in / out
    const fin = 1 - ss(0, 1.2, t), fout = ss(story.duration - 2.5, story.duration - 0.2, t);
    const blk = Math.max(fin, fout);
    if (blk > 0) { octx.fillStyle = `rgba(0,0,0,${blk})`; octx.fillRect(0, 0, W, H); }
  }

  async function init() {
    Post.init();
    // make sure every glyph we need is loaded before rendering
    const texts = [];
    vo.forEach((l) => texts.push(l.zh, l.en));
    Object.values(Scenes).forEach((s) => s.texts && texts.push(...s.texts));
    const all = texts.join('') + '0123456789·:：-—ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const faces = ['500 40px "Noto Sans SC"', '700 40px "Noto Sans SC"', '900 40px "Noto Sans SC"', '600 40px "Noto Serif SC"', '900 40px "Noto Serif SC"',
      '500 40px "Barlow Condensed"', '600 40px "Barlow Condensed"', '800 40px "Barlow Condensed"', 'italic 700 40px "Barlow Condensed"', 'italic 900 40px "Barlow Condensed"'];
    await Promise.all(faces.map((f) => document.fonts.load(f, all).catch(() => null)));
    await document.fonts.ready;
    for (const s of Object.values(Scenes)) if (s.init) await s.init();
    ready = true;
  }

  function frameJPEG(f, q = 0.93) {
    render(f / story.fps, f);
    return out.toDataURL('image/jpeg', q);
  }

  // live preview (not used for the final render)
  let playing = false, t0 = 0, tStart = 0;
  function loop() {
    if (!playing) return;
    const t = tStart + (performance.now() - t0) / 1000;
    render(t);
    document.title = t.toFixed(2);
    requestAnimationFrame(loop);
  }
  function play(from = 0) { tStart = from; t0 = performance.now(); playing = true; loop(); }
  function stop() { playing = false; }

  return { init, render, frameJPEG, play, stop, get ready() { return ready; }, story };
})();

window.addEventListener('load', async () => {
  await App.init();
  const q = new URLSearchParams(location.search);
  if (!q.has('render')) {
    const t = parseFloat(q.get('t') || '0');
    App.render(t);
    window.addEventListener('keydown', (e) => { if (e.key === ' ') App.play(t); if (e.key === 'Escape') App.stop(); });
  }
  window.APP_READY = true;
});
