// Windows headless Edge checks; run from repo root after web dependency installation.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/image23');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-image-preview-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules']},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? fs.readFileSync(path.join(output, 'bundle.js')) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9338', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9338/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 900, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('!!document.querySelector("img")?.complete')) break; await pause(100);}
  for (const locked of [true, false]) {
    await run(`window.scenario('FIT_TO_IMAGE', ${locked}, 900, 300)`); await pause(250);
    const sizes = await run(`(()=>{const i=document.querySelector('img'), r=i.getBoundingClientRect(), p=i.closest('a')?.parentElement ?? i.parentElement, c=p.getBoundingClientRect();return {w:r.width,h:r.height,clip:c.width,fit:getComputedStyle(i).objectFit,overflow:getComputedStyle(p).overflow};})()`);
    check(sizes.w === 900 && sizes.h === (locked ? 450 : 300), 'Actual bitmap display size survives maximum window');
    check(sizes.clip < sizes.w && sizes.overflow === 'hidden', 'Image viewport clips oversized bitmap');
    check(sizes.fit === (locked ? 'contain' : 'fill'), 'Unlocked image is stretched to explicit dimensions');
  }
  for (const locked of [true, false]) for (const width of [null, 120]) for (const height of [null, 90]) {
    await run(`window.scenario('FIT_TO_IMAGE', ${locked}, ${width}, ${height})`); await pause(70);
    const display = await run('window.imageState.display');
    check(locked ? Math.abs(display.width / display.height - 2) < 1e-6 : display.width === (width ?? 800) && display.height === (height ?? 400), 'Missing axes and original ratio are consistent');
  }
  for (const [naturalWidth, naturalHeight] of [[800, 400], [200, 600], [100, 100]]) for (const locked of [true, false]) {
    await run(`window.scenario('FIT_TO_IMAGE', ${locked}, 120, 90, '', 100, 600, false, ${naturalWidth}, ${naturalHeight})`); await pause(150);
    const rendered = await run("(()=>{const r=document.querySelector('img').getBoundingClientRect();return {width:r.width,height:r.height};})()");
    check(Math.abs(rendered.width - 120) < 1 && Math.abs(rendered.height - (locked ? 120 * naturalHeight / naturalWidth : 90)) < 1,
      'Landscape, portrait and square bitmaps render using actual original ratio or explicit unlocked size');
  }
  await run("window.scenario('FIT_TO_IMAGE', false, 4000, 3000, '', 100, 400)"); await pause(150);
  check(await run('window.imageState.layout.window.width===900 && window.imageState.layout.window.height===810'),
    'Image window uses 90% of browser work area rather than fixed maximum pixels');
  check(await run('window.layoutForScreen(3840,2160).window.width===3456 && window.layoutForScreen(3840,2160).window.height===1944'),
    '4K image window is not constrained by legacy 1200x900 maximum');
  check(await run("(()=>{const r=document.querySelector('img').getBoundingClientRect();return r.width===4000 && r.height===3000;})()"),
    'Screen policy limits only the window and keeps requested bitmap dimensions');
  await run("window.scenario('FIT_TO_IMAGE', false, 4000, 3000, '', 5000, 400)"); await pause(100);
  check(await run('window.imageState.layout.window.width===900'), 'Effective minimum never exceeds screen maximum');
  await run("window.scenario('FIT_TO_IMAGE', true, 100, 50, '', 400, 600)"); await pause(100);
  check(await run("document.querySelector('img').getBoundingClientRect().width===100 && window.imageState.layout.window.width===400"), 'Minimum window adds whitespace without enlarging image');
  await run("window.scenario('ADAPTIVE', true, 400, 300)"); await pause(100);
  check(await run("(()=>{const i=document.querySelector('img'),r=i.getBoundingClientRect();return r.width<=344 && r.height<=250 && getComputedStyle(i).objectFit==='contain';})()"), 'Adaptive contains full image within fixed window');
  await run("window.scenario('FIT_TO_IMAGE', false, 900, 300, '긴 설명 '.repeat(300), 100, 400, true)"); await pause(150);
  check(await run("(()=>{const img=document.querySelector('img');const text=Array.from(document.querySelectorAll('p')).find(e=>e.textContent.startsWith('긴 설명'));let p=text;while(p && getComputedStyle(p).overflowY!=='auto')p=p.parentElement;return !!p && p.scrollHeight>p.clientHeight && p.getBoundingClientRect().top>img.parentElement.getBoundingClientRect().top && Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='닫기');})()"), 'Bottom description scrolls while footer stays available');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'clipped-with-description.png'), Buffer.from(shot.data, 'base64'));
  console.log('PASS: ' + checks + ' IMAGE preview checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
