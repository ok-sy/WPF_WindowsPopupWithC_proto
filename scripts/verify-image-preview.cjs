// POL-04-01 : 공통 크기 입력
// POL-04-03 : 비율·상한
// POL-01-03 : 최소 크기
// ■ IMAGE 관리자 미리보기 크기 모드·콘텐츠 영역·창 최소 300 보정 검증.
// Windows headless Edge checks; run from repo root after web dependency installation.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/image23');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// PopupPreview가 Header 로고 경로에 쓰는 Next 전용 모듈을 하네스용으로 대체한다(verify-rich-text-49.cjs와 같은 방식).
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-image-preview-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/lib/urls$': path.join(output, 'urls-shim.js')}},
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
    // POL-04-03 : 비율·상한 — 두 축을 지정하면 비율 고정이어도 그 크기가 콘텐츠 영역이다(고정은 contain으로 영역 안에 맞춤).
    check(sizes.w === 900 && sizes.h === 300, 'Content area size survives maximum window (TODO58)');
    check(sizes.clip < sizes.w && sizes.overflow === 'hidden', 'Image viewport clips oversized bitmap');
    check(sizes.fit === (locked ? 'contain' : 'fill'), 'Unlocked image is stretched to explicit dimensions');
  }
  for (const locked of [true, false]) for (const width of [null, 120]) for (const height of [null, 90]) {
    await run(`window.scenario('FIT_TO_IMAGE', ${locked}, ${width}, ${height})`); await pause(70);
    const display = await run('window.imageState.display');
    check(width && height ? display.width === width && display.height === height
      : locked ? Math.abs(display.width / display.height - 2) < 1e-6 : display.width === (width ?? 800) && display.height === (height ?? 400),
      'Missing axes and original ratio are consistent; two axes are the content area (TODO58)');
  }
  for (const [naturalWidth, naturalHeight] of [[800, 400], [200, 600], [100, 100]]) for (const locked of [true, false]) {
    await run(`window.scenario('FIT_TO_IMAGE', ${locked}, 120, 90, '', 100, 600, false, ${naturalWidth}, ${naturalHeight})`); await pause(150);
    const rendered = await run("(()=>{const i=document.querySelector('img'),r=i.getBoundingClientRect();return {width:r.width,height:r.height,fit:getComputedStyle(i).objectFit};})()");
    check(Math.abs(rendered.width - 120) < 1 && Math.abs(rendered.height - 90) < 1 && rendered.fit === (locked ? 'contain' : 'fill'),
      'Landscape, portrait and square bitmaps use the 120x90 content area, contained with the original ratio or filled when unlocked (TODO58)');
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
  // WPF PopupWindow 크롬: 가로 28+28+24+24+0=104, 세로 24+24+24+24+0=96, HeaderRow 40, FooterRow 80, 이미지 테두리 1+1.
  // POL-01-03 : 최소 크기 — 크롬 합 298은 최종 창 최소 300 미만이라 300으로 올라간다(WPF RequestedMinimumHeight와 같다).
  check(await run('JSON.stringify(window.chromeLayout(false,false).window)') === JSON.stringify({width: 506, height: 300}), '[TODO68] FIT_TO_IMAGE without header/footer is raised to the 300 window floor');
  check(await run('JSON.stringify(window.chromeLayout(true,false).window)') === JSON.stringify({width: 506, height: 338}), 'FIT_TO_IMAGE header adds WPF HeaderRow 40');
  check(await run('JSON.stringify(window.chromeLayout(true,true).window)') === JSON.stringify({width: 506, height: 418}), 'FIT_TO_IMAGE header/footer add 40+80');
  check(await run('window.chromeLayout(false,false,2000,100).window.width') === 900, 'Recommended width is clamped to 90% work area');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'clipped-with-description.png'), Buffer.from(shot.data, 'base64'));
  for (const type of ['IMAGE', 'TEXT']) {
    await run(`window.renderChrome('${type}')`); await pause(150);
    const chrome = await run(`(()=>{const t=Array.from(document.querySelectorAll('p')).find(e=>e.textContent==='헤더');const h=t.parentElement.getBoundingClientRect();const paper=document.querySelector('.MuiPaper-root');const cs=getComputedStyle(paper);return {header:h.height, border:cs.borderTopWidth+'/'+cs.borderLeftWidth, dividers:document.querySelectorAll('hr').length};})()`);
    check(chrome.header === 40, type + ' header height matches WPF HeaderRow 40: ' + chrome.header);
    if (type === 'IMAGE') check(chrome.border === '0px/0px', 'IMAGE paper has no border like WPF PopupBodyBorder 0: ' + chrome.border);
  }
  console.log('PASS: ' + checks + ' IMAGE preview checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
