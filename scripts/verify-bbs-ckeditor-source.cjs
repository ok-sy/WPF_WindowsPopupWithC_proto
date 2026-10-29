// POL-14-01 : 공통 프론트 경계
// ■ 게시판·자료실 편집기(BbsCKEditor) SourceEditing 검증: 소스 보기 전환·편집 영역 표시·소스 수정이 저장 값(onContentChange)에 반영되는지 headless Edge로 확인한다.
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-bbs-ckeditor-source.cjs (다른 Chromium은 BROWSER_PATH)
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/bbs-ckeditor-source');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
// BbsCKEditor가 @local/ui에서 쓰는 두 함수만 대체한다(패키지 전체를 번들하면 htmlparser2 의존 해석이 실패한다). 동작은 원본과 같다.
fs.writeFileSync(path.join(output, 'local-ui-shim.js'), `exports.requestSelector = (el, selector, callback) => { setTimeout(() => { const e = (el || document).querySelector(selector); if (e) callback(e); }, 0); };
exports.flatSx = (...items) => items.flatMap((item) => (Array.isArray(item) ? item : item ? [item] : []));`);
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-bbs-ckeditor-source-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/components/ckeditor$': path.join(root, 'zero-rule-web/main/src/components/ckeditor'), '@/components/CommonCKEditor$': path.join(root, 'zero-rule-web/main/src/components/CommonCKEditor'), '@local/ui$': path.join(output, 'local-ui-shim.js'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/},
      // CKEditor 공통 엔진(ckeditor5)의 CSS를 style 태그로 넣는다.
      {test: /\.css$/, use: path.join(__dirname, 'verify-css-loader.cjs')}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--remote-debugging-port=9373', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9373/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  if (!targets?.length) throw Error('Chromium did not start; set BROWSER_PATH');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map(); const errors = [];
  socket.on('message', raw => {const m = JSON.parse(raw);
    if (m.method === 'Runtime.exceptionThrown' && !m.params.exceptionDetails.url?.startsWith('chrome-extension://')) errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const until = async (expression, label) => { for (let i = 0; i < 100; i++) { if (await run(expression)) return; await pause(100); } throw Error('timeout: ' + label + ' ' + errors.join(' | ')); };
  const clickButton = async (text, scope = 'document') => { await run(`Array.from(${scope}.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`); await pause(250); };
  const editRow = async popupId => { await run(`Array.from(document.querySelectorAll('tbody tr')).find(r=>r.textContent.includes(${JSON.stringify(popupId)})).querySelector('button').click()`); await pause(400); };
  const setInput = async (selector, value) => { await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(200); };
  const preview = "document.querySelector('[data-testid=sample-inline-preview]')";
  const request = async () => JSON.parse(await run(`document.querySelector('[data-testid=sample-save-request]').textContent`));

  // 오류 수집(Runtime.exceptionThrown)은 Edge 기본 확장 프로그램(chrome-extension://) 콘텐츠 스크립트 오류를 제외한다.
  // CKEditor 49는 문서에 포커스가 있어야 편집 영역을 포커스 상태로 본다(headless 창은 포커스가 없어 선택 영역이 그려지지 않음).
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', {enabled: true}); await send('Emulation.setDeviceMetricsOverride', {width: 1400, height: 950, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  await until(`!!window.__editor`, 'editor');

  // 툴바가 넘치면(should group when full) 소스 버튼은 '더보기' 메뉴 안에 있다. 버튼이 안 보이면 더보기를 먼저 연다.
  const clickSource = async () => {
    await run(`(()=>{const b=document.querySelector('.ck-source-editing-button');if(b&&b.offsetParent)return;Array.from(document.querySelectorAll('.BbsCKEditor-toolbar button')).find(x=>(x.getAttribute('data-cke-tooltip-text')||'')==='더보기').click()})()`); await pause(300);
    await run(`document.querySelector('.ck-source-editing-button').click()`); await pause(500);
  };
  const content = () => run(`window.__content ?? document.querySelector('[data-testid=content]').textContent`);
  await clickSource();
  const area = await run(`(()=>{const t=document.querySelector('.CommonCKEditor-source');if(!t)return null;const r=t.getBoundingClientRect();return {w:r.width,h:r.height,value:t.value}})()`);
  console.log('source area', JSON.stringify(area));
  check(area && area.w > 50 && area.h > 50 && area.value.includes('원본 본문'), 'Source editing shows a visible textarea with the current HTML: ' + JSON.stringify(area));
  await run(`(()=>{const t=document.querySelector('.CommonCKEditor-source');t.value='<p>소스에서 고친 본문</p>';t.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(500);
  check(await run(`Array.from(document.querySelectorAll('.BbsCKEditor-toolbar button')).filter(b=>(b.getAttribute('data-cke-tooltip-text')||'').startsWith('굵게')).every(b=>b.classList.contains('ck-disabled'))`)
    && await run(`getComputedStyle(document.querySelector('.ck-editor__editable')).display`) === 'none', 'Source mode hides the editable and disables other editing commands');
  const whileSource = await content();
  console.log('content while in source mode:', whileSource);
  check(whileSource.includes('소스에서 고친 본문'), 'Editing in source mode updates the saved value before leaving source mode (save without toggling back keeps the edit): ' + whileSource);
  await clickSource();
  const after = await content();
  check(after.includes('소스에서 고친 본문') && await run(`document.querySelector('.ck-editor__editable').textContent.includes('소스에서 고친 본문')`), 'Leaving source mode keeps the edit in the editor and the saved value: ' + after);
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'bbs-source.png'), Buffer.from(shot.data, 'base64'));
  console.log('PASS: ' + checks + ' BbsCKEditor source editing checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
