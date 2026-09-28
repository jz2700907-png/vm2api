// Headless renderer: drives index.html frame by frame and encodes H.264 segments with ffmpeg.
// Usage:
//   node tools/render.js --stills 12.5,40,80 [--out build/stills]
//   node tools/render.js --video [--from 0 --to 190] [--workers 4] [--out build/video.mp4]
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const story = JSON.parse(fs.readFileSync(path.join(ROOT, 'story.json'), 'utf8'));
const FPS = story.fps;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?render=1`);
  await page.waitForFunction('window.APP_READY === true', null, { timeout: 180000 });
  return page;
}

async function renderRange(browser, port, f0, f1, outFile, label) {
  const page = await openPage(browser, port);
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-threads', '2', '-g', String(FPS * 2), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const url = await page.evaluate((fr) => App.frameJPEG(fr, 0.94), f);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) {
      const el = (Date.now() - t0) / 1000, done = f - f0 + 1;
      console.log(`[${label}] frame ${f}/${f1} (${(done / el).toFixed(2)} fps, eta ${(((f1 - f) * el) / done / 60).toFixed(1)} min)`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  try {
    if (opt('stills')) {
      const outDir = path.join(ROOT, opt('out', 'build/stills'));
      fs.mkdirSync(outDir, { recursive: true });
      const page = await openPage(browser, port);
      for (const s of String(opt('stills')).split(',')) {
        const t = parseFloat(s);
        const t0 = Date.now();
        const url = await page.evaluate((fr) => App.frameJPEG(fr, 0.9), Math.round(t * FPS));
        fs.writeFileSync(path.join(outDir, `t${t.toFixed(2).padStart(7, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
        console.log('still', t, (Date.now() - t0) + 'ms');
      }
    }
    if (opt('gallery')) {
      const page = await openPage(browser, port);
      const url = await page.evaluate(() => { const c = document.getElementById('out'); drawGallery(c.getContext('2d')); return c.toDataURL('image/jpeg', 0.9); });
      fs.writeFileSync(path.join(ROOT, 'build', 'gallery.jpg'), Buffer.from(url.split(',')[1], 'base64'));
      console.log('gallery -> build/gallery.jpg');
    }
    if (opt('video')) {
      const from = parseFloat(opt('from', 0)), to = parseFloat(opt('to', story.duration));
      const workers = parseInt(opt('workers', 4));
      const outFile = path.join(ROOT, opt('out', 'build/video.mp4'));
      const segDir = path.join(ROOT, 'build', 'segments');
      fs.mkdirSync(segDir, { recursive: true });
      const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
      const per = Math.ceil((F1 - F0) / workers);
      const jobs = [], segs = [];
      for (let w = 0; w < workers; w++) {
        const a = F0 + w * per, b = Math.min(F1, a + per);
        if (a >= b) break;
        const seg = path.join(segDir, `seg_${String(w).padStart(2, '0')}.mp4`);
        segs.push(seg);
        jobs.push(renderRange(browser, port, a, b, seg, 'w' + w));
      }
      await Promise.all(jobs);
      const list = path.join(segDir, 'list.txt');
      fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
      await new Promise((r) => spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', outFile], { stdio: 'inherit' }).on('close', r));
      console.log('video ->', outFile);
    }
  } finally {
    await browser.close();
    srv.close();
  }
})();
