// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9345;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/probad-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result ? r.result.result.value : undefined;
  };
  await send('Page.enable', {});
  await send('Runtime.enable', {});
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('document.querySelectorAll(".card").length')) === 40, 10000);

  check('title contains Bangla Probad', (await ev('document.title')).includes('Bangla Probad'));
  check('40 cards render', (await ev('document.querySelectorAll(".card").length')) === 40);
  check('proverb of the day renders', (await ev('!!document.getElementById("ofDayBn").textContent.trim()')));
  check('lang toggle switches to Bengali tagline', await (async () => {
    await ev('document.getElementById("langBtn").click()');
    await wait(300);
    return (await ev('document.getElementById("tagline").textContent')).includes('৪০টি');
  })());
  check('lang toggle back to English', await (async () => {
    await ev('document.getElementById("langBtn").click()');
    await wait(300);
    return (await ev('document.getElementById("tagline").textContent')).includes('40 classic');
  })());
  check('search narrows cards', await (async () => {
    await ev('(()=>{const s=document.getElementById("search");s.focus();document.execCommand("selectAll",false,null);document.execCommand("insertText",false,"লোভ");s.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await wait(400);
    const n = await ev('document.querySelectorAll(".card").length');
    return n > 0 && n < 40;
  })());
  check('clearing search restores 40 cards', await (async () => {
    await ev('(()=>{const s=document.getElementById("search");s.value="";s.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await wait(400);
    return (await ev('document.querySelectorAll(".card").length')) === 40;
  })());
  check('caution chip shows 8 cards', await (async () => {
    await ev('[...document.querySelectorAll("#chips .chip")].find(b=>b.textContent.trim()==="Caution").click()');
    await wait(400);
    return (await ev('document.querySelectorAll(".card").length')) === 8;
  })());
  check('detail modal opens with meaning', await (async () => {
    await ev('document.querySelector(".card .detail-btn").click()');
    await wait(300);
    const vis = await ev('document.getElementById("modal").style.display');
    const hasEn = await ev('!!document.getElementById("dEn").textContent.trim()');
    return vis === 'flex' && hasEn;
  })());
  check('favourite from modal persists after reload', await (async () => {
    await ev('document.getElementById("dFav").click()');
    await wait(300);
    await send('Page.navigate', { url: FILE });
    await poll(async () => (await ev('document.querySelectorAll(".card").length')) === 40, 10000);
    const stored = await ev('localStorage.getItem("probad-favs")');
    return stored && stored !== '[]';
  })());
  check('favourites-only filter shows saved card', await (async () => {
    await ev('document.querySelector("#chips .chip").click()'); // back to All
    await ev('(()=>{const c=document.getElementById("favOnly");if(!c.checked)c.click();})()');
    await wait(400);
    return (await ev('document.querySelectorAll(".card").length')) >= 1;
  })());
  check('quiz flow: start, answer, feedback', await (async () => {
    await ev('(()=>{const c=document.getElementById("favOnly");if(c.checked)c.click();})()');
    await ev('document.getElementById("tabQuiz").click()');
    await wait(300);
    await ev('document.getElementById("startBtn").click()');
    await wait(400);
    const hasQ = await ev('!!document.querySelector(".quiz-bn")');
    await ev('document.querySelector(".opt").click()');
    await wait(300);
    const fb = await ev('document.getElementById("quizFeedback").textContent');
    return hasQ && !!fb.trim();
  })());
  check('390px mobile: no horizontal overflow', await (async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: FILE });
    await poll(async () => (await ev('document.querySelectorAll(".card").length')) === 40, 10000);
    return (await ev('document.documentElement.scrollWidth <= window.innerWidth'));
  })());
  check('zero console/page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 500));

  ws.close();
  chrome.kill();
  console.log(failures ? ('\n' + failures + ' smoke checks FAILED') : '\nAll smoke checks passed.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
