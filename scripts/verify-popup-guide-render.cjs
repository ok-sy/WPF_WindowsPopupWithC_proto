// POL-14-01 : 공통 프론트 경계
// ■ PopupcommonComponent 가이드 화면 렌더 스모크: 8개 탭 순서·전환, 범용/proto 구분, 실습 모드, 공지 링크 이동을 headless Edge로 확인한다(로그인·서버 없음).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-guide-render.cjs (다른 Chromium은 BROWSER_PATH)
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/guide-render');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-popup-guide-render-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/components/ckeditor$': path.join(root, 'zero-rule-web/main/src/components/ckeditor'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
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
    '--remote-debugging-port=9371', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9371/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
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
  await until(`document.querySelectorAll('[role=tab]').length >= 8`, 'guide tabs');

  const tabs = async () => run(`Array.from(document.querySelectorAll('[role=tablist]')[0].querySelectorAll('[role=tab]')).map(t=>t.textContent.trim())`);
  const openTab = async label => { await run(`Array.from(document.querySelectorAll('[role=tablist]')[0].querySelectorAll('[role=tab]')).find(t=>t.textContent.trim().startsWith(${JSON.stringify(label)})).click()`); await pause(700); };
  const text = () => run(`document.body.innerText`);
  const labels = await tabs();
  check(labels.length === 8 && labels[0] === '시작하기' && labels[7].startsWith('공지'), 'Guide has 8 tabs, starts with 시작하기 and ends with 공지: ' + labels.join('|'));
  check(await run(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`) === '시작하기', 'First entry is 시작하기');
  let body = await text();
  check(body.includes('withPreviewFallback(state)') && body.includes('pickPopupFields') && body.includes('공통 / 부모 화면 / 서버 경계'), 'Start tab shows minimal code and the WEB/parent/SERVER boundary');
  check(body.includes('proto 등록 화면(RgstPop) 경로'), 'Start tab separates the proto path');
  check(body.includes("useState<Partial<AdminPopupDetail>>({ popupType: 'TEXT' })") && !body.includes("title: '', content: {}, questions: []") && body.includes('[직접 구현]'),
    'Start tab minimal state starts with popupType only and marks myApi/toMyRequest as functions to implement');
  // 시작하기 → 실습 링크 이동, 실습은 독립 필드 추출이 기본
  await clickButton('직접 해 보기(실습) →'); await pause(1500);
  check(await run(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`) === '실습', 'Start tab link navigates to 실습');
  await until(`!!document.querySelector('.ck-editor__editable')`, 'live editor');
  body = await text();
  check(body.includes('화면 state') && body.includes('pickPopupFields 결과'), 'Live tab defaults to the independent extraction mode');
  const picked = JSON.parse(await run(`Array.from(document.querySelectorAll('pre')).map(p=>p.textContent).find(t=>t.trim().startsWith('{'))`));
  check(!('width' in picked) && !('displayStartAt' in picked) && picked.title === '가이드 실습', 'Independent live output has only entered values (no width/period): ' + JSON.stringify(picked));
  check(await run(`!!document.querySelector('[data-testid]') || document.body.innerText.includes('3. 미리보기')`), 'Live tab renders the preview');
  // 추출 항목 선택: 칩을 고르면 호출 코드와 결과가 바뀐다. state에 없는 키(width)는 골라도 결과에 없다.
  const liveCode = () => run(`document.querySelector('[data-testid=live-pick-code]').textContent`);
  const liveResult = async () => JSON.parse(await run(`document.querySelector('[data-testid=live-pick-result]').textContent`));
  const clickChip = async label => { await run(`Array.from(document.querySelectorAll('[data-testid=live-pick-keys] .MuiChip-root')).find(c=>c.textContent===${JSON.stringify(label)}||c.textContent.startsWith(${JSON.stringify(label + ' (')})).click()`); await pause(400); };
  check((await liveCode()).includes("topLevelKeys: ['popupType', 'title']") && (await liveCode()).includes("contentKeys: ['textBlocks', 'plainText']"), 'Live call code shows the default selected keys');
  await clickChip('width'); await clickChip('popupId');
  let code = await liveCode(); let result = await liveResult();
  check(code.includes("topLevelKeys: ['popupId', 'popupType', 'title', 'width']") && result.popupId === 'GUIDE-001' && !('width' in result),
    'Selecting keys updates the call code in choice order; a key missing from state (width) stays out of the result: ' + JSON.stringify(result));
  await clickChip('textBlocks'); await clickChip('plainText');
  code = await liveCode(); result = await liveResult();
  check(!code.includes('contentKeys') && !('content' in result), 'Deselecting every content key drops the contentKeys option and the content region');
  await clickChip('questionId');
  check((await liveCode()).includes("questionKeys: ['questionId']") && Array.isArray((await liveResult()).questions), 'Question keys add questionKeys and an (empty) questions array');
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('proto 저장 변환')).click()`); await pause(1500);
  body = await text();
  check(body.includes('저장 요청 (toSaveRequest)') && body.includes('처음 값으로 (createDefaultPopup)'), 'Live tab proto mode shows the toSaveRequest comparison');
  // 프로세스: 범용 먼저, proto 별도
  await openTab('프로세스'); body = await text();
  check(body.indexOf('범용 흐름') >= 0 && body.indexOf('proto(RgstPop) 전용 흐름') > body.indexOf('범용 흐름'), 'Process tab lists the common flow first and the proto flow separately');
  check(body.includes('P5 proto 저장') && body.includes('⑥ 선택 추출 → 화면별 저장 경계'), 'Process tab has proto save (P5) and common extraction (⑥)');
  // 컴포넌트·독립 재사용·예시·변환·유틸
  await openTab('컴포넌트'); await until(`document.body.innerText.includes('입력 props')`, 'component tab');
  check(await run(`document.body.innerText.includes('실행기')`), 'Component tab renders props and a runner');
  // 미리보기 실행기의 onRecommendedSize는 값이 바뀔 때만 호출된다(인라인 콜백 + 부모 state 갱신이 무한 반복되지 않음).
  await run(`Array.from(document.querySelectorAll('[role=tab]')).find(t=>t.textContent.trim()==='InlinePopupPreview').click()`); await pause(2500);
  const recommendedCount = async () => run(`(()=>{const row=Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0&&e.textContent.trim()==='onRecommendedSize').at(-1);let n=row;for(let i=0;i<4&&n;i++){const chip=n.parentElement?.querySelector('.MuiChip-label');if(chip&&/회$/.test(chip.textContent))return parseInt(chip.textContent,10);n=n.parentElement;}return -1})()`);
  const firstCount = await recommendedCount(); await pause(1500); const secondCount = await recommendedCount();
  check(firstCount >= 1 && firstCount <= 3 && secondCount === firstCount, `InlinePopupPreview runner reports onRecommendedSize only on change (count ${firstCount} → ${secondCount})`);
  await openTab('독립 재사용'); await until(`document.body.innerText.includes('pickPopupFields 실행기')`, 'saveParts tab');
  check((await text()).includes('다른 업무의 기본 사용법 아님'), 'saveParts runner labels the proto comparison as reference only');
  await openTab('예시'); await until(`!!document.querySelector('[data-testid=is063-left]')`, 'example tab');
  check((await text()).includes('기존 업무 화면에 붙이는 방법'), 'Example tab explains the connection steps');
  await openTab('변환·유틸'); body = await text();
  check(body.includes('범용 — 어느 업무 화면에서든') && body.includes('proto 전용 — RgstPop') && body.indexOf('createDefaultPopup') > body.indexOf('proto 전용 — RgstPop'),
    'Function tab groups functions by scope (createDefaultPopup under proto-only)');
  // 공지: 배지·영향 컴포넌트 링크 → 컴포넌트 탭 선택
  await openTab('공지'); body = await text();
  check(body.includes('CKEditor 5 공통 엔진 전환') && !body.includes('가이드 화면 정리') && !body.includes('가이드 컴포넌트 코드 실행기') && body.includes('최근 14일 안에 게시'),
    'Notice tab lists component/process changes only (no guide-screen notices) and explains NEW as recent posting');
  await run(`Array.from(document.querySelectorAll('.MuiChip-root')).find(c=>c.textContent==='PopupRichTextEditor').click()`); await pause(1200);
  check(await run(`document.querySelector('[role=tab][aria-selected=true]').textContent.trim()`) === '컴포넌트'
    && await run(`Array.from(document.querySelectorAll('[role=tab][aria-selected=true]')).some(t=>t.textContent.trim()==='PopupRichTextEditor')`), 'Notice component chip opens that component in the component tab');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'guide.png'), Buffer.from(shot.data, 'base64'));
  console.log('PASS: ' + checks + ' PopupcommonComponent guide render checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
