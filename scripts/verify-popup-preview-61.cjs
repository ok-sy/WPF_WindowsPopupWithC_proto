// POL-08-01 : 공통 렌더러
// POL-08-03 : Dialog 호환
// POL-01-03 : 최소 크기
// ■ InlinePopupPreview·PopupPreviewDialog를 등록 화면 없이 최소 호스트에서 headless Edge로 확인한다.
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
  // TODO73-25~27: 제목 오른쪽·버튼 왼쪽 작은 회색 안내. 좁으면 줄바꿈되고 겹치지 않으며 실제 크기 모달에는 없다.
  const NOTICE = '실제 팝업 크기와 다를 수 있습니다.';
  const header = () => run(`(()=>{const n=Array.from(document.querySelectorAll('#root span,#root p')).find(e=>e.textContent===${JSON.stringify(NOTICE)});
    const t=Array.from(document.querySelectorAll('#root h6')).find(e=>e.textContent==='팝업 미리보기');const b=Array.from(document.querySelectorAll('#root button')).find(e=>e.textContent.includes('실제 크기로 보기'));
    const r=e=>{const x=e.getBoundingClientRect();return {l:x.left,t:x.top,r:x.right,b:x.bottom}};const s=getComputedStyle(n);
    return {n:r(n),t:r(t),b:r(b),size:parseFloat(s.fontSize),color:s.color,count:document.body.textContent.split(${JSON.stringify(NOTICE)}).length-1}})()`);
  const apart = (a, b) => a.r <= b.l + 0.5 || b.r <= a.l + 0.5 || a.b <= b.t + 0.5 || b.b <= a.t + 0.5;
  let h = await header();
  check(h.count === 1 && h.t.r <= h.n.l && h.n.r <= h.b.l && h.size <= 12 && h.color !== 'rgb(0, 0, 0)', '[73-25] Size notice sits between title and button as small gray text: ' + JSON.stringify(h));
  await run(`document.querySelector('#root > div').style.width='240px'`); await pause(300);
  h = await header();
  check(apart(h.n, h.t) && apart(h.n, h.b) && apart(h.t, h.b) && h.n.r <= 240 + 1, '[73-26] Narrow width wraps the notice without overlapping title or button: ' + JSON.stringify(h));
  await run(`document.querySelector('#root > div').style.width='520px'`); await pause(300);
  // 2) FIXED·중앙·Overlay 사용: 크기·위치·배경, 배경 클릭 무시, Esc 종료.
  await openPreview();
  let rect = await paper();
  check(rect.width === 560 && rect.height === 420 && Math.abs(rect.left - 220) < 1 && Math.abs(rect.top - 240) < 1, 'FIXED dialog is 560x420 at the center: ' + JSON.stringify(rect));
  check(await run("getComputedStyle(document.querySelector('.MuiBackdrop-root')).backgroundColor") === 'rgba(0, 0, 0, 0.45)', 'Overlay uses backgroundOverlayOpacity');
  // POL-08-03 : Dialog 호환 — slotProps.paper로 옮긴 Paper 스타일(여백·최대 크기·overflow·테두리 둥글기)이 그대로 적용된다.
  const paperStyle = await run("(()=>{const s=getComputedStyle(document.querySelector('.MuiDialog-paper'));return {margin:s.margin,overflow:s.overflow,maxWidth:s.maxWidth,maxHeight:s.maxHeight,radius:s.borderRadius};})()");
  check(paperStyle.margin === '24px' && paperStyle.overflow === 'hidden' && paperStyle.maxWidth === '952px' && paperStyle.maxHeight === '852px' && paperStyle.radius === '6px',
    '[TODO67] Paper slot keeps margin/max size/overflow: ' + JSON.stringify(paperStyle));
  check(await run("Array.from(document.querySelectorAll('.MuiDialog-root button')).some(b=>b.getAttribute('aria-label')==='실제 크기 미리보기 종료')"), 'Dialog has its own exit button');
  check(!(await run(`document.querySelector('.MuiDialog-root').textContent.includes(${JSON.stringify(NOTICE)})`)), '[73-27] The actual size dialog does not show the size notice');
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
  check(await run("(()=>{const s=getComputedStyle(document.querySelector('.MuiDialog-paper'));return s.margin==='0px'&&s.overflowY!=='hidden'&&getComputedStyle(document.querySelector('.MuiBackdrop-root')).backgroundColor==='rgba(0, 0, 0, 0.45)';})()"),
    '[TODO67] FULLSCREEN leaves the Paper slot unset and keeps the backdrop slot');
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
  // [2026-11-13] 시청 비율 슬라이더·시청 잠금 시연을 삭제해 모달도 퀴즈 입력이 열린 상태로 그린다.
  check(await run("!document.querySelector('.MuiDialog-root input[type=range]') && !document.querySelector('.MuiDialog-root').textContent.includes('이상 시청')"), 'Dialog VIDEO+QUIZ has no watch slider or lock text');
  await escape();
  check(await run("document.querySelectorAll('[data-testid=aspect-video-area]').length") === 1, 'Closing the dialog unmounts its video area');
  await unchanged('VIDEO+QUIZ');
  // POL-01-03 : 최소 크기 — 실제 크기 모달도 WPF와 같은 300 x 300 하한: 299/300/301 경계, 기존 최소 100, 최대 200 모순, RATIO, 작은 화면.
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
  // 실제 크기 모달은 값이 없는 항목에 입력 안내 문구를 넣지 않는다. 인라인 미리보기는 안내를 유지한다.
  const PLACEHOLDERS = ['팝업 제목', '콘텐츠 제목', '팝업 설명이 여기에 표시됩니다.', '이미지 URL을 입력하면 여기에 표시됩니다.'];
  const shownIn = async (selector, words) => run(`(()=>{const t=document.querySelector(${JSON.stringify(selector)}).innerText;return ${JSON.stringify(words)}.filter(w=>t.includes(w));})()`);
  for (const [type, inlineWords, content] of [
    ['VIDEO', ['팝업 제목', '콘텐츠 제목', '팝업 설명이 여기에 표시됩니다.'], {videoTitle: null, description: null}],
    ['IMAGE', ['팝업 제목', '이미지 URL을 입력하면 여기에 표시됩니다.'], {imageUrl: '', description: null}],
    ['SURVEY', ['팝업 제목', '팝업 설명이 여기에 표시됩니다.'], {surveyTitle: null, description: null}],
    ['QUIZ', ['팝업 제목', '팝업 설명이 여기에 표시됩니다.'], {videoEnabled: true, videoTitle: null, surveyTitle: null, description: null}],
  ]) {
    await render(type, {title: null}, content);
    const inline = await shownIn('#root', PLACEHOLDERS);
    check(inlineWords.every(w => inline.includes(w)), `${type} inline preview keeps the input guide: ` + JSON.stringify(inline));
    await openPreview();
    const dialog = await shownIn('.MuiDialog-root', PLACEHOLDERS);
    check(dialog.length === 0, `${type} dialog hides placeholders for null values: ` + JSON.stringify(dialog));
    await run("document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').click()"); await pause(300);
  }
  await render('VIDEO', {title: '실제 제목'}, {videoTitle: '실제 영상 제목', description: '실제 설명'});
  await openPreview();
  const realValues = await run(`document.querySelector('.MuiDialog-root').innerText`);
  check(['실제 제목', '실제 영상 제목', '실제 설명'].every(w => realValues.includes(w)), 'Dialog still shows entered values');
  await run("document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').click()"); await pause(300);
  // [61-13·14] 폐쇄망 DevTools에서 확인된 규칙을 넣어도 창 둥글기를 유지하고, IMAGE 일반 창의 그림자는 안쪽 Paper 하나만 보인다.
  const frame = async () => {
    await openPreview();
    const value = await run(`(()=>{const d=document.querySelector('.MuiDialog-paper'),i=d.querySelector('.MuiPaper-root'),b=i.parentElement,r=e=>e.getBoundingClientRect();
      return {dialogShadow:getComputedStyle(d).boxShadow!=='none',innerShadow:getComputedStyle(i).boxShadow!=='none',innerRadius:getComputedStyle(i).borderTopLeftRadius,pad:getComputedStyle(b).paddingTop,
        dialog:[r(d).width,r(d).height],inner:[r(i).width,r(i).height]};})()`);
    await escape();
    return value;
  };
  const IMAGE_CASES = [
    ['ADAPTIVE', {}, {imageSizeMode: 'ADAPTIVE'}], ['FIT_TO_IMAGE', {}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true}], ['ORIGINAL', {}, {imageSizeMode: 'ORIGINAL'}],
    ['RATIO', {sizeMode: 'RATIO'}, {imageSizeMode: 'ADAPTIVE'}],
  ];
  for (const rule of [false, true]) {
    await run(`(()=>{document.getElementById('closed-net-rule')?.remove();${rule ? "const s=document.createElement('style');s.id='closed-net-rule';s.textContent='.MuiDialog-root .MuiPaper-root{border-radius:0}';document.head.appendChild(s);" : ''}})()`);
    const label = rule ? 'with the Dialog Paper radius rule' : 'without the rule';
    for (const [name, overrides, content] of IMAGE_CASES) {
      await render('IMAGE', overrides, content);
      const f = await frame();
      check(f.innerRadius === '6px', `[61-13] IMAGE ${name} keeps the 6px corner ${label}: ` + JSON.stringify(f));
      check(!f.dialogShadow && f.innerShadow, `[61-14] IMAGE ${name} has one shadow on the inner Paper ${label}: ` + JSON.stringify(f));
      check(f.pad === '24px' && f.inner[0] === f.dialog[0] - 48 && f.inner[1] === f.dialog[1] - 48, `[61-15] IMAGE ${name} keeps the 24px WPF shadow margin ${label}: ` + JSON.stringify(f));
    }
    await render('IMAGE', {sizeMode: 'FULLSCREEN'}, {imageSizeMode: 'ADAPTIVE'});
    const full = await frame();
    check(full.innerRadius === '0px' && full.pad === '0px', `[61-13] IMAGE FULLSCREEN keeps 0 corners ${label}: ` + JSON.stringify(full));
    for (const type of ['TEXT', 'VIDEO', 'SURVEY', 'QUIZ']) {
      await render(type);
      const f = await frame();
      check(f.dialogShadow && f.innerRadius === '6px' && f.inner[0] === f.dialog[0], `[61-16] ${type} keeps its Dialog shadow and size ${label}: ` + JSON.stringify(f));
    }
  }
  await run("document.getElementById('closed-net-rule')?.remove()");
  check(await run('window.__errors.length') === 0, 'No runtime errors: ' + await run('JSON.stringify(window.__errors)'));
  console.log('PASS: ' + checks + ' TODO61 preview component checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
