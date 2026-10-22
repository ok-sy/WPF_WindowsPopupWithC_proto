// [TODO61] InlinePopupPreview·PopupPreviewDialog를 등록 화면 없이 최소 호스트에서 headless Edge로 확인한다.
// Windows headless Edge checks; run from repo root after web dependency installation.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/preview61');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// PopupPreview가 Header 로고 경로에 쓰는 Next 전용 모듈을 하네스용으로 대체한다(verify-image-preview.cjs와 같은 방식).
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-popup-preview-61-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? fs.readFileSync(path.join(output, 'bundle.js'))
      : '<!doctype html><script>window.__errors=[];addEventListener("error",e=>__errors.push(e.message));</script><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9361', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9361/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
  const clickAt = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', {type, x, y, button: 'left', clickCount: 1});
    await pause(350);
  };
  const escape = async () => {
    for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', {type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    await pause(350);
  };
  const dialogOpen = () => run("!!document.querySelector('.MuiDialog-paper')");
  const paper = () => run("(()=>{const r=document.querySelector('.MuiDialog-paper').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};})()");
  const openPreview = async () => {
    await run("Array.from(document.querySelectorAll('#root button')).find(b=>b.textContent.includes('실제 크기로 보기')).click()"); await pause(400);
    check(await dialogOpen(), 'Inline button opens the preview dialog');
  };
  const render = async (type, overrides = {}, content = {}, hint = true) => {
    await run(`window.renderHost(${JSON.stringify(type)}, ${JSON.stringify(overrides)}, ${JSON.stringify(content)}, ${hint})`); await pause(300);
  };
  const unchanged = async label => check(await run('JSON.stringify(window.currentPopup)===window.popupJson && Object.isFrozen(window.currentPopup.content)'), label + ': popup object unchanged');
  await send('Page.enable'); await viewport(1000, 900);
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run("!!document.querySelector('#root button')")) break; await pause(100);}

  // 1) 최소 호스트: API·등록 폼 없이 샘플 객체로 인라인 미리보기를 그린다.
  check(await run("document.querySelector('#root').textContent.includes('팝업 미리보기') && document.querySelector('#root').textContent.includes('본문')"), 'Inline preview renders a sample popup without the editor');
  check(!(await dialogOpen()), 'Dialog is closed until requested');
  // 2) FIXED·중앙·Overlay 사용: 크기·위치·배경, 배경 클릭 무시, Esc 종료.
  await openPreview();
  let rect = await paper();
  check(rect.width === 560 && rect.height === 420 && Math.abs(rect.left - 220) < 1 && Math.abs(rect.top - 240) < 1, 'FIXED dialog is 560x420 at the center: ' + JSON.stringify(rect));
  check(await run("getComputedStyle(document.querySelector('.MuiBackdrop-root')).backgroundColor") === 'rgba(0, 0, 0, 0.45)', 'Overlay uses backgroundOverlayOpacity');
  check(await run("Array.from(document.querySelectorAll('.MuiDialog-root button')).some(b=>b.getAttribute('aria-label')==='실제 크기 미리보기 종료')"), 'Dialog has its own exit button');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'text-dialog.png'), Buffer.from(shot.data, 'base64'));
  await clickAt(5, 5);
  check(await dialogOpen(), 'Backdrop click is ignored while overlay is enabled');
  await escape();
  check(!(await dialogOpen()), 'Esc closes the dialog');
  await unchanged('TEXT');
  // 3) 9개 위치·가장자리 여백(일반 24px, 영상 0px)·종료 버튼 위치.
  await render('TEXT', {}, {popupPosition: 'TOP_LEFT'}); await openPreview(); rect = await paper();
  check(rect.left === 24 && rect.top === 24, 'TOP_LEFT keeps the 24px WPF window margin: ' + JSON.stringify(rect));
  check(await run("Math.round(document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').getBoundingClientRect().bottom)") === 888, 'Exit button moves to the bottom for top-aligned popups');
  await escape();
  await render('VIDEO', {}, {popupPosition: 'BOTTOM_RIGHT'}); await openPreview(); rect = await paper();
  check(rect.right === 1000 && rect.bottom === 900, 'VIDEO window has no edge margin at BOTTOM_RIGHT: ' + JSON.stringify(rect));
  await escape();
  // 4) Overlay 꺼짐: 투명 배경, 배경 클릭으로 닫힘.
  await render('TEXT', {}, {useBackgroundOverlay: false}); await openPreview();
  check(await run("getComputedStyle(document.querySelector('.MuiBackdrop-root')).backgroundColor") === 'rgba(0, 0, 0, 0)', 'Overlay off keeps the backdrop transparent');
  await clickAt(5, 5);
  check(!(await dialogOpen()), 'Backdrop click closes when overlay is off');
  // 5) RATIO와 뷰포트 변경 재계산, FULLSCREEN.
  await render('TEXT', {sizeMode: 'RATIO'}); await openPreview(); rect = await paper();
  check(rect.width === 500 && rect.height === 450, 'RATIO uses 50% of the browser work area: ' + JSON.stringify(rect));
  await viewport(1200, 800); await pause(300); rect = await paper();
  check(rect.width === 600 && rect.height === 400, 'Dialog recalculates after viewport resize: ' + JSON.stringify(rect));
  await escape(); await viewport(1000, 900); await pause(200);
  await render('TEXT', {sizeMode: 'FULLSCREEN'}, {popupPosition: 'TOP_LEFT'}); await openPreview(); rect = await paper();
  check(rect.width === 1000 && rect.height === 900 && rect.left === 0 && rect.top === 0, 'FULLSCREEN ignores position and fills the viewport');
  await escape();
  // 6) IMAGE FIT_TO_IMAGE: 모달이 스스로 권장 창 크기를 계산하고, 인라인 계산값 전달(hint) 여부와 결과가 같다.
  for (const hint of [false, true]) {
    await render('IMAGE', {width: 300, height: 150}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true, imageTitle: '', description: ''}, hint);
    for (let i = 0; i < 30 && !(await run('!!window.hostState.recommended')); i++) await pause(100);
    const expected = await run("window.expectedSize({width:1000,height:900}, window.fitLayout({width:800,height:400},{width:1000,height:900}).window)");
    check(JSON.stringify(await run('window.hostState.recommended')) === JSON.stringify(await run("window.fitLayout({width:800,height:400},{width:1000,height:900}).window")), 'Inline reports the FIT_TO_IMAGE window size');
    await openPreview(); await pause(300); rect = await paper();
    check(rect.width === expected.width && rect.height === expected.height, `FIT_TO_IMAGE dialog size matches layout (hint=${hint}): ` + JSON.stringify([rect, expected]));
    await escape();
  }
  await unchanged('IMAGE');
  // 7) 설문 시연 상태 분리: 모달 응답이 인라인·편집 원본에 섞이지 않고, 다시 열면 초기화된다.
  await render('SURVEY'); await openPreview();
  await run("document.querySelector('.MuiDialog-root input[type=radio]').click()"); await pause(150);
  check(await run("document.querySelector('.MuiDialog-root input[type=radio]').checked"), 'Survey answer can be selected in the dialog');
  check(await run("!Array.from(document.querySelectorAll('#root input[type=radio]')).some(i=>i.checked)"), 'Dialog answer does not leak into the inline preview');
  const surveyShot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'survey-dialog.png'), Buffer.from(surveyShot.data, 'base64'));
  await run("document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').click()"); await pause(400);
  check(!(await dialogOpen()), 'Exit button closes the dialog');
  await openPreview();
  check(await run("!Array.from(document.querySelectorAll('.MuiDialog-root input[type=radio]')).some(i=>i.checked)"), 'Reopened dialog starts with a fresh demo state');
  await escape();
  await unchanged('SURVEY');
  // 8) VIDEO+QUIZ: 두 미리보기가 각자 영상 영역을 그리고, 닫으면 모달 쪽만 정리된다.
  await render('QUIZ', {}, {videoEnabled: true}); await openPreview();
  check(await run("document.querySelectorAll('[data-testid=aspect-video-area]').length") === 2, 'Inline and dialog both render AspectVideoArea');
  check(await run("document.querySelector('.MuiDialog-root').textContent.includes('기준 80% 이상 시청')"), 'Dialog keeps the VIDEO+QUIZ watch lock');
  await escape();
  check(await run("document.querySelectorAll('[data-testid=aspect-video-area]').length") === 1, 'Closing the dialog unmounts its video area');
  await unchanged('VIDEO+QUIZ');
  // [TODO68] 실제 크기 모달도 WPF와 같은 300 x 300 하한: 299/300/301 경계, 기존 최소 100, 최대 200 모순, RATIO, 작은 화면.
  const size = async (o, a = {width: 1600, height: 1000}) => run(`JSON.stringify(window.dialogSize(${JSON.stringify(o)}, ${JSON.stringify(a)}))`);
  for (const axis of [299, 300, 301]) {
    const expected = Math.max(300, axis);
    check(await size({width: axis, height: axis, minimumWidth: 300, minimumHeight: 300}) === JSON.stringify({width: expected, height: expected}), `[TODO68] FIXED ${axis} -> ${expected}`);
  }
  check(await size({width: 200, height: 200, minimumWidth: 100, minimumHeight: 100}) === JSON.stringify({width: 300, height: 300}), '[TODO68] stored minimum 100 is raised to 300');
  check(await size({width: 250, height: 250, minimumWidth: 100, minimumHeight: 100, maximumWidth: 200, maximumHeight: 200}) === JSON.stringify({width: 300, height: 300}),
    '[TODO68] stored maximum below 300 is raised to the floor');
  check(await size({sizeMode: 'RATIO', widthRatio: .1, heightRatio: .1, minimumWidth: 100, minimumHeight: 100}) === JSON.stringify({width: 300, height: 300}), '[TODO68] RATIO result below 300 uses the floor');
  check(await size({width: 640, height: 480}, {width: 280, height: 260}) === JSON.stringify({width: 269, height: 250}), '[TODO68] a viewport smaller than 300 keeps the modal on screen');
  check(await size({width: 640, height: 480}) === JSON.stringify({width: 640, height: 480}), '[TODO68] sizes above the floor are unchanged');
  check(await run('window.__errors.length') === 0, 'No runtime errors: ' + await run('JSON.stringify(window.__errors)'));
  console.log('PASS: ' + checks + ' TODO61 preview component checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
