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

const PORT = 4196;
const CDP_PORT = 9246;

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
    '--window-size=1280,720',
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

  if (!wsUrl) throw new Error('Could not find page target');

  const client = new CDPClient(wsUrl);
  await client.connect();

  console.log('Connected to CDP. Waiting for engine to initialize...');
  for (let i = 0; i < 40; i++) {
    const ready = await client.eval(`
      typeof window.app !== 'undefined' &&
      window.app.moonScene !== null &&
      window.app.marsScene !== null
    `);
    if (ready) break;
    await wait(500);
  }

  // Start journey
  await client.eval(`
    const btn = document.getElementById('btn-skip-intro') || document.getElementById('btn-enter');
    if (btn) btn.click();
  `);
  await wait(1200);

  // 1. Test Apollo 11 360 Inspection
  console.log('Testing Apollo 11 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.205);
    window.app.inspection.open360View('apollo11');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_01_apollo11_360.png'));

  // Test rotating Apollo 11 180 degrees to view the back side
  console.log('Rotating Apollo 11 to rear view...');
  await client.eval(`
    window.app.inspection.targetTheta += Math.PI;
    window.app.inspection.targetPhi = 0.25;
  `);
  await wait(800);
  await client.capture(path.join(qaDir, 'inspect_02_apollo11_rear_360.png'));

  // Close 360 view
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  // 2. Test Viking 1 Lander 360 Inspection on Mars
  console.log('Testing Viking 1 Lander 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.795);
    window.app.inspection.open360View('viking1');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_03_viking1_360.png'));
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  // 3. Test Opportunity Rover 360 Inspection in Twilight
  console.log('Testing Opportunity Rover 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.915);
    window.app.inspection.open360View('opportunity');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_04_opportunity_360.png'));
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  // 4. Test Ingenuity Helicopter 360 Inspection
  console.log('Testing Ingenuity Helicopter 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.945);
    window.app.inspection.open360View('ingenuity');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_05_ingenuity_360.png'));
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  // 5. Test Lunar Roving Vehicle 360 Inspection
  console.log('Testing LRV 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.345);
    window.app.inspection.open360View('lrv');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_06_lrv_360.png'));
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  // 6. Test Hammer & Feather 360 Inspection
  console.log('Testing Hammer & Feather 360 Inspection...');
  await client.eval(`
    window.app.flightController.seekToProgress(0.415);
    window.app.inspection.open360View('hammer_feather');
  `);
  await wait(1000);
  await client.capture(path.join(qaDir, 'inspect_07_hammer_feather_360.png'));
  await client.eval(`window.app.inspection.close360View();`);
  await wait(500);

  console.log('All 360 inspect tests passed successfully!');

  browser.kill();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
