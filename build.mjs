import { existsSync, mkdirSync, mkdtempSync, copyFileSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const repo = dirname(fileURLToPath(import.meta.url));
const assets = join(repo, 'assets');
const fonts = {
  'Anton-Regular.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf',
  'SpaceMono-Bold.ttf': 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacemono/SpaceMono-Bold.ttf',
};

mkdirSync(assets, { recursive: true });
for (const [name, url] of Object.entries(fonts)) {
  const dest = join(assets, name);
  if (!existsSync(dest)) {
    execFileSync('curl', ['-fsSL', '--retry', '3', '-o', dest, url], { stdio: 'inherit' });
  }
  assert(statSync(dest).size > 1000, `${name} missing or empty`);
}

const work = mkdtempSync(join(tmpdir(), 'makefun-excited-'));
for (const name of Object.keys(fonts)) copyFileSync(join(assets, name), join(work, name));

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url('Anton-Regular.ttf') format('truetype')}
@font-face{font-family:SpaceMono;src:url('SpaceMono-Bold.ttf') format('truetype')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1024px;height:1024px;overflow:hidden;background:#030309}
body{font-family:SpaceMono,monospace;position:relative}
.glow{position:absolute;inset:-240px;filter:blur(9px);background:radial-gradient(circle at 50% 46%,#fffdf2 0 5%,#ffc94d 12%,#ff5c1f 22%,#ff1f6b 33%,#7a24ff 46%,#150a2e 63%,#030309 80%)}
.burst{position:absolute;inset:-320px;mix-blend-mode:screen;opacity:.5;background:repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.62) 0deg .3deg,transparent .3deg 3.4deg);mask-image:radial-gradient(circle at 50% 46%,transparent 0 14%,#000 30%,transparent 64%);-webkit-mask-image:radial-gradient(circle at 50% 46%,transparent 0 14%,#000 30%,transparent 64%)}
.warp{position:absolute;inset:0;mix-blend-mode:screen;opacity:.12;background:repeating-linear-gradient(112deg,rgba(255,255,255,.5) 0 1px,transparent 1px 46px)}
.comet{position:absolute;left:-160px;top:596px;width:1400px;height:190px;transform:rotate(-12deg);filter:blur(9px);mix-blend-mode:screen;opacity:.85;background:radial-gradient(ellipse at 55% 50%,rgba(255,255,255,.55) 0 3%,rgba(255,214,140,.42) 14%,rgba(255,90,40,.18) 38%,transparent 62%)}
.ring,.ring2,.ring3{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);border-radius:50%}
.ring{width:648px;height:648px;border:3px solid rgba(255,255,255,.92);box-shadow:0 0 105px 26px rgba(255,140,40,.48),inset 0 0 140px 36px rgba(255,50,110,.28)}
.ring2{width:812px;height:812px;border:1px solid rgba(255,255,255,.24)}
.ring3{width:940px;height:940px;border:1px solid rgba(255,255,255,.09)}
.grain{position:absolute;inset:0;opacity:.14;mix-blend-mode:overlay;background:repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 1px,transparent 1px 3px)}
.top{position:absolute;top:54px;left:0;right:0;text-align:center;font-size:27px;letter-spacing:.26em;color:#fff3d6;white-space:nowrap;text-shadow:0 2px 18px rgba(0,0,0,.7)}
.hero{position:absolute;top:272px;left:0;right:0;text-align:center;font-family:Anton,sans-serif;color:#fff;line-height:.82;letter-spacing:-.015em}
.l1{font-size:262px;text-shadow:0 0 44px rgba(255,80,30,.8),0 0 150px rgba(255,0,80,.55)}
.l2{font-size:262px;color:#ffd400;text-shadow:0 0 58px rgba(255,200,0,.9),0 0 160px rgba(255,80,0,.75)}
.sub{position:absolute;top:838px;left:0;right:0;text-align:center;font-size:38px;color:#fff;white-space:nowrap;text-shadow:0 2px 22px rgba(0,0,0,.8)}
.foot{position:absolute;bottom:48px;left:0;right:0;text-align:center;font-size:25px;background:#ffd400;color:#08080f;padding:17px 0;letter-spacing:.14em;white-space:nowrap}
</style></head><body>
<div class="glow"></div>
<div class="burst"></div>
<div class="warp"></div>
<div class="comet"></div>
<div class="ring3"></div>
<div class="ring2"></div>
<div class="ring"></div>
<div class="grain"></div>
<div class="top">AI-EXCITED-01 · ONE IMAGE, ONE VERDICT</div>
<div class="hero"><div class="l1">THIS</div><div class="l2">ONE.</div></div>
<div class="sub">the one that excited you</div>
<div class="foot">VERDICT: THIS IMAGE · MARGIN 5 · NO TIE</div>
</body></html>
`;
writeFileSync(join(work, 'index.html'), html);

const out = join(repo, 'entry.png');
const chrome = process.env.MAKEFUN_CHROME ?? '/home/ubuntu/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--virtual-time-budget=2500',
  '--window-size=1024,1024', `--screenshot=${out}`,
  `file://${join(work, 'index.html')}`,
], { stdio: 'inherit' });

const bytes = readFileSync(out);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
assert(bytes.length >= 24 && bytes.subarray(0, 8).equals(png), 'not a PNG');
assert(bytes.toString('ascii', 12, 16) === 'IHDR', 'missing IHDR');
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
const size = statSync(out).size;

console.log(`entry.png size=${size} bytes width=${width} height=${height}`);
assert(width === 1024 && height === 1024, `bad dimensions ${width}x${height}`);
assert(size <= 1048576, `too large: ${size} bytes`);
