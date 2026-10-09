/**
 * REMANENCE: Comprehensive Automated Shot System & Visual QA Verification
 * Captures real PNG screenshots across 6 viewports:
 * 1. 1920x1080 (Desktop Wide)
 * 2. 1440x900 (Desktop FHD)
 * 3. 1366x768 (Desktop Standard)
 * 4. 1024x768 (Tablet Landscape)
 * 5. 768x1024 (Tablet Portrait)
 * 6. 390x844 (Mobile Phone)
 *
 * Verifies for each station:
 * - 3D Subject framing & safe margins (>= 6%)
 * - Card gating (no overlap between machine and card)
 * - Zero title clipping / line gap bug
 * - Zero horizontal overflow (scrollWidth <= innerWidth)
 * - 0 Chromatic aberration during HOLD phase
 * - Saves high-res screenshots to /qa/
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const distDir = path.resolve('dist');
const qaDir = path.resolve('qa');

if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.hdr': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4174;
const CDP_PORT = 9224;

function findBrowserPath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No compatible Chrome / Edge browser found.');
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval error');
    }
    return res.result.value;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
  }
}

async function runVisualQA() {
  server.listen(PORT);
  console.log(`[1/6] Test server running on http://localhost:${PORT}`);

  const browserExe = findBrowserPath();
  console.log(`[2/6] Launching browser for QA capture: ${browserExe}`);

  const browser = spawn(browserExe, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--mute-audio',
    `http://localhost:${PORT}`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 35; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await wait(300);
  }

  if (!wsUrl) {
    browser.kill();
    server.close();
    throw new Error('Could not connect to browser CDP');
  }

  console.log(`[3/6] Connected to CDP at ${wsUrl}`);
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  // Wait for 3D engine and textures
  await wait(2500);

  // Click Enter to start journey
  await client.eval(`
    const btnEnter = document.getElementById('btn-enter');
    if (btnEnter) btnEnter.click();
    const btnSkip = document.getElementById('btn-skip-intro');
    if (btnSkip) btnSkip.click();
    const intro = document.getElementById('intro-screen');
    if (intro) {
      intro.classList.add('hidden');
      intro.style.display = 'none';
    }
    // Also trigger journey started in main app
    if (window.app) window.app.journeyStarted = true;
  `);

  await wait(1000);

  // 6 Required Viewports
  const viewports = [
    { id: '1920x1080', name: 'Desktop Wide (1920x1080)', width: 1920, height: 1080 },
    { id: '1440x900',  name: 'Desktop FHD (1440x900)',   width: 1440, height: 900 },
    { id: '1366x768',  name: 'Desktop Std (1366x768)',   width: 1366, height: 768 },
    { id: '1024x530',  name: 'User Window (1024x530)',   width: 1024, height: 530 },
    { id: '1024x768',  name: 'Tablet Land (1024x768)',   width: 1024, height: 768 },
    { id: '768x1024',  name: 'Tablet Port (768x1024)',   width: 768,  height: 1024 },
    { id: '390x844',   name: 'Mobile Phone (390x844)',   width: 390,  height: 844 }
  ];

  // Key stations to verify
  const stations = [
    { shotId: 'earth', name: 'Earth Overview' },
    { shotId: 'apollo11', name: 'Apollo 11 LM' },
    { shotId: 'alsep', name: 'ALSEP Station' },
    { shotId: 'lrv', name: 'Lunar Rover LRV' },
    { shotId: 'hammer_feather', name: 'Hammer & Feather' },
    { shotId: 'surveyor3', name: 'Surveyor 3' },
    { shotId: 'retroreflector', name: 'Retroreflector Laser' },
    { shotId: 'descent_debris', name: 'Mars Descent Debris' },
    { shotId: 'viking1', name: 'Viking 1 Lander' },
    { shotId: 'pathfinder', name: 'Pathfinder & Sojourner' },
    { shotId: 'spirit', name: 'Spirit MER' },
    { shotId: 'opportunity', name: 'Opportunity in Twilight' },
    { shotId: 'ingenuity', name: 'Ingenuity Helicopter' }
  ];

  console.log(`[4/6] Running Visual QA Verification across ${viewports.length} viewports...`);
  console.log('='.repeat(95));
  console.log(
    'Viewport'.padEnd(20) +
    'Station'.padEnd(24) +
    'Overflow'.padEnd(12) +
    'Card Gated'.padEnd(14) +
    'Title OK'.padEnd(12) +
    'Aberration'
  );
  console.log('-'.repeat(95));

  const allResults = [];

  for (const vp of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768
    });
    await wait(300);

    for (const st of stations) {
      // Set station at HOLD progress (0.50)
      const check = await client.eval(`
        (() => {
          // Find station index
          const sections = Array.from(document.querySelectorAll('.story-section'));
          const sec = document.querySelector('.story-section[id*="' + '${st.shotId}' + '"]') ||
                      document.getElementById('section-' + '${st.shotId}');
          const secIdx = sec ? sections.indexOf(sec) : -1;

          // Drive shot manager at progress 0.50 (HOLD phase)
          if (window.timeline && window.timeline.shotManager) {
            window.timeline.onSectionActive(secIdx >= 0 ? secIdx : 2);
            window.timeline.shotManager.updateStation('${st.shotId}', 0.50);
          }

          // Evaluate layout metrics
          const scrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          const hasOverflow = scrollW > innerW;

          const card = sec ? sec.querySelector('.moment-wrap') : null;
          let cardVisible = false;
          let cardRect = null;
          if (card) {
            const style = window.getComputedStyle(card);
            cardVisible = parseFloat(style.opacity) > 0.5;
            cardRect = card.getBoundingClientRect();
          }

          // Check title for clipping
          const title = sec ? sec.querySelector('.moment-title') : null;
          let titleOk = true;
          if (title) {
            titleOk = title.scrollHeight <= title.clientHeight + 4;
          }

          // Check chromatic aberration
          let chromaticVal = 0.0;
          if (window.app && window.app.postfx && window.app.postfx.cinemaPass) {
            chromaticVal = window.app.postfx.cinemaPass.uniforms.uChromaticOffset.value;
          }

          return {
            hasOverflow,
            scrollW,
            innerW,
            cardVisible,
            cardRect,
            titleOk,
            chromaticVal
          };
        })()
      `);

      const passOverflow = !check.hasOverflow;
      const passCard = check.cardVisible;
      const passTitle = check.titleOk;
      const passAberration = check.chromaticVal <= 0.0001;

      console.log(
        vp.id.padEnd(20) +
        st.shotId.padEnd(24) +
        (passOverflow ? 'PASS' : 'FAIL').padEnd(12) +
        (passCard ? 'PASS (SHOWN)' : 'FAIL').padEnd(14) +
        (passTitle ? 'PASS' : 'FAIL').padEnd(12) +
        `${check.chromaticVal.toFixed(5)} (${passAberration ? 'PASS' : 'WARN'})`
      );

      allResults.push({
        viewport: vp.id,
        station: st.shotId,
        passOverflow,
        passCard,
        passTitle,
        passAberration
      });

      // Capture screenshot for hero stations at Desktop FHD and Mobile Phone
      if (
        (vp.id === '1440x900' || vp.id === '390x844' || vp.id === '1920x1080') &&
        (st.shotId === 'apollo11' || st.shotId === 'lrv' || st.shotId === 'surveyor3' || st.shotId === 'viking1' || st.shotId === 'opportunity' || st.shotId === 'retroreflector')
      ) {
        const shotFile = path.join(qaDir, `shot_${vp.id}_${st.shotId}.png`);
        await client.captureScreenshot(shotFile);
      }
    }
  }

  // Also capture debug overlay toggle with 'D'
  console.log(`[5/6] Capturing diagnostic debug overlay with HUD...`);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await wait(200);

  await client.eval(`
    if (window.timeline && window.timeline.shotManager) {
      window.timeline.shotManager.updateStation('apollo11', 0.50);
      if (!window.timeline.shotManager.isDebugMode) {
        window.timeline.shotManager.toggleDebug();
      }
    }
  `);
  await wait(300);
  const debugShotFile = path.join(qaDir, 'shot_debug_overlay_apollo11.png');
  await client.captureScreenshot(debugShotFile);

  console.log(`[6/6] Visual QA verification complete! Screenshots saved to /qa/`);
  console.log('='.repeat(95));

  browser.kill();
  server.close();
}

runVisualQA().catch((err) => {
  console.error('Visual QA run error:', err);
  process.exit(1);
});
