import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const distDir = path.resolve('dist');
const qaDir = path.resolve('qa');
if (!fs.existsSync(qaDir)) fs.mkdirSync(qaDir, { recursive: true });

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
  '.hdr': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const fp = path.join(distDir, p);
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  } else { res.writeHead(404); res.end(); }
});

const PORT = 4195;
const CDP_PORT = 9245;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

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
      console.error('Exception details:', JSON.stringify(res.exceptionDetails, null, 2));
      throw new Error(res.exceptionDetails.text || 'eval error');
    }
    return res.result.value;
  }
  async capture(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }
}

async function main() {
  server.listen(PORT);
  const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--no-sandbox',
    '--window-size=1024,530',
    `http://localhost:${PORT}`
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await listRes.json();
      const pageTarget = list.find(t => t.type === 'page' && t.url.includes(PORT.toString()));
      if (pageTarget) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await wait(300);
  }

  if (!wsUrl) throw new Error('No page target found');
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 530,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for 3D universe loading
  console.log('Waiting for loading sequence to be ready...');
  await client.eval(`
    new Promise((resolve) => {
      const check = () => {
        if (window.app && window.flightController && window.timeline) resolve(true);
        else setTimeout(check, 100);
      };
      check();
    })
  `);
  console.log('3D engine ready. Starting journey...');

  // Start journey
  await client.eval(`
    (() => {
      const btnEnter = document.getElementById('btn-enter');
      if (btnEnter) btnEnter.click();
      const btnSkip = document.getElementById('btn-skip-intro');
      if (btnSkip) btnSkip.click();
      const intro = document.getElementById('intro-screen');
      if (intro) {
        intro.classList.add('hidden');
        intro.style.display = 'none';
      }
      if (window.app) window.app.journeyStarted = true;
    })()
  `);
  await wait(1200);

  const stations = [
    { name: '01_earth', s: 0.055, id: 'earth' },
    { name: '02_apollo11', s: 0.205, id: 'apollo11' },
    { name: '03_alsep', s: 0.275, id: 'alsep' },
    { name: '04_lrv', s: 0.345, id: 'lrv' },
    { name: '05_hammer_feather', s: 0.415, id: 'hammer_feather' },
    { name: '06_descent_debris', s: 0.745, id: 'descent_debris' },
    { name: '07_opportunity', s: 0.915, id: 'opportunity' }
  ];

  for (const st of stations) {
    console.log(`Framing station ${st.name} (s=${st.s})...`);
    await client.eval(`
      (() => {
        if (window.flightController) {
          window.flightController.seekToProgress(${st.s});
        }
        if (window.timeline) {
          window.timeline.updatePlanetaryLighting(${st.s});
          const stationObj = window.flightController ? window.flightController.findStationAtProgress(${st.s}) : null;
          if (stationObj) {
            const secIdx = window.timeline.getSectionIndexForStation ? window.timeline.getSectionIndexForStation(stationObj.id) : -1;
            if (secIdx >= 0) window.timeline.onSectionActive(secIdx);
            if (window.timeline.shotManager) {
              window.timeline.shotManager.updateStation(stationObj.id, 0.50);
            }
          }
        }
      })()
    `);
    await wait(800);
    const outPath = path.join(qaDir, `shot_${st.name}.png`);
    await client.capture(outPath);
  }

  browser.kill();
  server.close();
  console.log('All shots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
