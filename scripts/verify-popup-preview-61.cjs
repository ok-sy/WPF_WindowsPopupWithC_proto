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
  // TODO61-23: 화면(screen.avail*)도 함께 지정한다. 기본은 화면 = 뷰포트(작업 영역 기준 계산이 예전 브라우저 기준과 같은 조건), 다르게 줄 때만 screen 인자를 쓴다.
  const viewport = (width, height, screenWidth = width, screenHeight = height) => send('Emulation.setDeviceMetricsOverride', {width, height, screenWidth, screenHeight, deviceScaleFactor: 1, mobile: false});
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
  // placeholders: 예시 표시(showPlaceholders). 기본 OFF(등록 화면 기본, 2026-11-18). 빈 영상 자리 배치를 재는 검사만 켠다.
  const render = async (type, overrides = {}, content = {}, hint = true, placeholders = false) => {
    await run(`window.renderHost(${JSON.stringify(type)}, ${JSON.stringify(overrides)}, ${JSON.stringify(content)}, ${hint}, ${placeholders})`); await pause(300);
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
  // TODO61-23(2026-11-24): 96vw/96vh 이중 제한을 없애 Paper 최대 크기는 뷰포트 100%(1000x900)다.
  // 2026-11-17: Paper = WPF 창 크기(여백 0, 투명), 그림자 여백 24·둥근 모서리·그림자는 안쪽 흰 판(PopupPreview)이 그린다.
  check(paperStyle.margin === '0px' && paperStyle.overflow === 'hidden' && paperStyle.maxWidth === '1000px' && paperStyle.maxHeight === '900px' && paperStyle.radius === '0px',
    '[TODO67] Paper slot keeps margin/max size/overflow: ' + JSON.stringify(paperStyle));
  check(await run("Array.from(document.querySelectorAll('.MuiDialog-root button')).some(b=>b.getAttribute('aria-label')==='실제 크기 미리보기 종료')"), 'Dialog has its own exit button');
  check(!(await run(`document.querySelector('.MuiDialog-root').textContent.includes(${JSON.stringify(NOTICE)})`)), '[73-27] The actual size dialog does not show the size notice');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'text-dialog.png'), Buffer.from(shot.data, 'base64'));
  await clickAt(5, 5);
  check(await dialogOpen(), 'Backdrop click is ignored while overlay is enabled');
  await escape();
  check(!(await dialogOpen()), 'Esc closes the dialog');
  await unchanged('TEXT');
  // 3) 9개 위치·그림자 여백(일반 24px, 영상 0px)·종료 버튼 위치. 2026-11-17: WPF처럼 창(Paper)은 작업 영역 가장자리에 붙고 흰 판이 창 안 24px에 그려진다.
  await render('TEXT', {}, {popupPosition: 'TOP_LEFT'}); await openPreview(); rect = await paper();
  const panel = await run(`(()=>{const r=document.querySelector('.MuiDialog-paper .MuiPaper-root').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height}})()`);
  check(rect.left === 0 && rect.top === 0 && panel.left === 24 && panel.top === 24 && panel.width === 512 && panel.height === 372,
    'TOP_LEFT window sits at the edge and the white panel keeps the 24px WPF shadow margin (560x420 → 512x372): ' + JSON.stringify({rect, panel}));
  // TODO61-23: 종료 버튼은 기준 화면 선택과 함께 도구 묶음(preview-dialog-tools) 안에 있다. 묶음이 아래 12px로 옮겨 가고 버튼은 그 안에 있다.
  check(await run("(()=>{const t=document.querySelector('[data-testid=preview-dialog-tools]').getBoundingClientRect();const b=document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').getBoundingClientRect();return Math.round(t.bottom)===888&&b.bottom<=t.bottom&&b.top>=t.top&&b.top>450;})()"), 'Exit button moves to the bottom for top-aligned popups');
  await escape();
  await render('VIDEO', {}, {popupPosition: 'BOTTOM_RIGHT'}); await openPreview(); rect = await paper();
  check(rect.right === 1000 && rect.bottom === 900, 'VIDEO window has no edge margin at BOTTOM_RIGHT: ' + JSON.stringify(rect));
  await escape();
  // 61-17: VIDEO 실제 크기 미리보기를 WPF와 같은 배치로 — 영상이 남은 높이를 채우고, 설명은 영상 아래, 공통 헤더 17/600·푸터 80·본문 여백 28/24.
  await render('VIDEO', {height: 760}, {description: '영상 설명'}, true, true); await openPreview();
  const v = JSON.parse(await run(`JSON.stringify((()=>{const p=document.querySelector('.MuiDialog-paper');
    const cap=Array.from(p.querySelectorAll('span,p')).find(e=>e.textContent==='영상 재생 영역'); const box=cap.parentElement.parentElement;
    const b=box.getBoundingClientRect(), bs=getComputedStyle(box);
    const desc=Array.from(p.querySelectorAll('p')).find(e=>e.textContent==='영상 설명'); const ds=getComputedStyle(desc);
    const btn=Array.from(p.querySelectorAll('button')).find(e=>e.textContent==='확인'); const f=btn.parentElement.parentElement.getBoundingClientRect();
    const title=Array.from(p.querySelectorAll('h5')).find(e=>e.textContent==='영상'); const ts=getComputedStyle(title), body=getComputedStyle(title.parentElement);
    const head=getComputedStyle(Array.from(p.querySelectorAll('p')).find(e=>e.textContent==='미리보기 컴포넌트'));
    return {boxH:b.height, boxBottom:b.bottom, descTop:desc.getBoundingClientRect().top, descSize:ds.fontSize, descColor:ds.color, footerTop:f.top, footerH:f.height,
      btnH:btn.getBoundingClientRect().height, btnW:btn.getBoundingClientRect().width, border:bs.borderTopWidth+' '+bs.borderTopColor, radius:bs.borderTopLeftRadius, bg:bs.backgroundColor,
      blackLayers:Array.from(box.querySelectorAll('*')).filter(e=>['rgb(0, 0, 0)'].includes(getComputedStyle(e).backgroundColor)).length,
      titleSize:ts.fontSize, titleWeight:ts.fontWeight, headSize:head.fontSize, headWeight:head.fontWeight, pad:body.paddingLeft+' '+body.paddingTop, caption:p.textContent.includes('완료 기준'),
      divider:!!p.querySelector('hr')};})())`));
  check(v.boxH > 400 && v.descTop > v.boxBottom && v.descTop < v.footerTop, '[61-17] VIDEO area fills the remaining height and the description sits below it: ' + JSON.stringify(v));
  check(v.border === '1px rgb(209, 213, 219)' && v.radius === '8px' && v.bg === 'rgba(0, 0, 0, 0)' && v.blackLayers === 1 && v.descSize === '14px' && v.descColor === 'rgb(75, 85, 99)' && !v.caption,
    '[61-17] VIDEO area/description styles match WPF (black painted by one inner layer only, so rounded corners do not bleed) and the preview-only caption is gone: ' + JSON.stringify(v));
  check(v.titleSize === '22px' && v.titleWeight === '600' && v.headSize === '17px' && v.headWeight === '600' && v.pad === '28px 24px',
    '[61-17] content title 22/600, header 17/600, body padding 28/24: ' + JSON.stringify(v));
  check(Math.abs(v.footerH - 64) < 0.6 && Math.abs(v.btnH - 34) < 0.6 && v.btnW >= 118 && !v.divider, '[61-17] footer is 80 high with a 44px button and no divider: ' + JSON.stringify(v));
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
  // TODO61-23: 실제 크기 미리보기 작업 영역. 팝업 크기는 화면 작업 영역(screen.avail*) 또는 기준 화면 프리셋, 배경·배치는 브라우저 표시 영역.
  const tools = () => run(`(()=>{const t=document.querySelector('[data-testid=preview-dialog-tools]');return {text:t?t.innerText:'',select:!!t&&!!t.querySelector('[role=combobox]')};})()`);
  const outerScroll = () => run(`(()=>{const d=document.scrollingElement,c=document.querySelector('.MuiDialog-container');
    return {page:d.scrollHeight>innerHeight+0.5||d.scrollWidth>innerWidth+0.5,wrapper:!!c&&(c.scrollHeight>c.clientHeight+0.5||c.scrollWidth>c.clientWidth+0.5),
      backdrop:(()=>{const b=document.querySelector('.MuiBackdrop-root').getBoundingClientRect();return Math.round(b.width)===innerWidth&&Math.round(b.height)===innerHeight;})()};})()`);
  const chooseScreen = async value => {
    await run(`(()=>{const c=document.querySelector('[data-testid=preview-dialog-tools] [role=combobox]');c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));})()`); await pause(300);
    await run(`document.querySelector('li[data-value=${JSON.stringify(value)}]').click()`); await pause(400);
  };
  // ① 730×900 회귀: 브라우저 일반 모드(내부 높이 945)·작업 영역 1920×1040 → 1:1 730×900. F11(내부 1080, 작업 영역 1080)도 730×900. 예전 계산은 945×0.9=851.
  for (const [label, view, screen] of [['normal', [1920, 945], [1920, 1040]], ['F11', [1920, 1080], [1920, 1080]]]) {
    await viewport(view[0], view[1], screen[0], screen[1]); await pause(200);
    await render('IMAGE', {width: 730, height: 900}, {imageSizeMode: 'ADAPTIVE', imageTitle: '', description: ''}); await openPreview(); await pause(300); rect = await paper();
    const scroll = await outerScroll(), bar = await tools();
    check(rect.width === 730 && rect.height === 900 && !bar.text.includes('1:1'), `[61-23] IMAGE 730x900 is 1:1 in ${label} mode: ` + JSON.stringify({rect, bar}));
    check(!scroll.page && !scroll.wrapper && scroll.backdrop, `[61-23] ${label}: backdrop covers the viewport without page or wrapper scroll: ` + JSON.stringify(scroll));
    check(bar.select && bar.text.includes('기준 화면'), `[61-23] ${label}: dialog tools show the reference screen select: ` + JSON.stringify(bar));
    await escape();
  }
  // ② 작업 영역 90% 상한이 실제 가용 높이에 들어가면 그대로: 작업 영역 1040 → 상한 936. 1000 요청은 936이고 내부 945에 들어간다.
  await viewport(1920, 945, 1920, 1040); await pause(200);
  await render('IMAGE', {width: 730, height: 1000}, {imageSizeMode: 'ADAPTIVE', imageTitle: '', description: ''}); await openPreview(); await pause(300); rect = await paper();
  check(rect.width === 730 && rect.height === 936, '[61-23] IMAGE height is capped by 90% of the work area (936), not the browser: ' + JSON.stringify(rect));
  await escape();
  // ③ 기준 화면 프리셋 전환: 뷰포트 1000×900(화면 동일)에서 TEXT RATIO 50% → 현재 500×450, 1920×1080(작업 1920×1040) → 960×520,
  //    2560×1440(작업 2560×1400) → 목표 1280×700을 샘플 설정 최대 너비 1200으로 줄인 1200×700이 폭 1000을 넘어 1000×700으로 줄이고 1:1 아님을 안내. 현재 모니터로 돌아오면 원래 크기.
  await viewport(1000, 900); await pause(200);
  await render('TEXT', {sizeMode: 'RATIO'}); await openPreview(); rect = await paper();
  let bar = await tools();
  check(rect.width === 500 && rect.height === 450 && bar.text.includes('현재 모니터') && bar.text.includes('1000×900'), '[61-23] CURRENT uses the screen work area and shows it: ' + JSON.stringify({rect, bar}));
  await chooseScreen('1920x1080'); rect = await paper(); bar = await tools();
  check(rect.width === 960 && rect.height === 520 && bar.text.includes('1920×1080') && !bar.text.includes('1:1'), '[61-23] 1920x1080 preset sizes RATIO against 1920x1040: ' + JSON.stringify({rect, bar}));
  await chooseScreen('2560x1440'); rect = await paper(); bar = await tools();
  let scroll = await outerScroll();
  check(rect.width === 1000 && rect.height === 700 && bar.text.includes('1:1') && bar.text.includes('1200×700'), '[61-23] a preset larger than the browser is limited to the viewport and says it is not 1:1: ' + JSON.stringify({rect, bar}));
  check(!scroll.page && !scroll.wrapper && scroll.backdrop, '[61-23] limited preset still has no outer scroll: ' + JSON.stringify(scroll));
  check(await run("(()=>{const r=document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight&&r.top>=0;})()"), '[61-23] exit button stays reachable when the popup is limited');
  await chooseScreen('CURRENT'); rect = await paper();
  check(rect.width === 500 && rect.height === 450, '[61-23] switching back to CURRENT restores the size: ' + JSON.stringify(rect));
  await escape();
  await unchanged('TEXT');
  // ④ FIT_TO_IMAGE 권장 크기도 선택한 작업 영역으로 다시 계산한다(모달 크기와 같은 기준). 큰 지정값(2400×1800)으로 90% 상한이 드러나게 한다.
  await render('IMAGE', {width: 2400, height: 1800}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true, imageTitle: '', description: ''}); await openPreview(); await pause(400);
  for (const [key, workArea] of [['1920x1080', {width: 1920, height: 1040}], ['CURRENT', {width: 1000, height: 900}]]) {
    await chooseScreen(key); rect = await paper();
    const fit = await run(`window.fitLayout({width:800,height:400},${JSON.stringify(workArea)}).window`);
    const expected = {width: Math.min(fit.width, 1000), height: Math.min(fit.height, 900)};
    check(rect.width === expected.width && rect.height === expected.height, `[61-23] FIT_TO_IMAGE follows the ${key} work area (${JSON.stringify(fit)}): ` + JSON.stringify(rect));
  }
  await escape();
  await unchanged('IMAGE');
  // ⑤ 화면 상한은 WPF ApplyWindowSize와 같다: 비IMAGE FIXED 95%, RATIO 100%(비율 0.1~1.0 보정), IMAGE 90%, 설정 최대값은 비IMAGE에만.
  const of = (type, o, a) => run(`JSON.stringify(window.dialogSizeOf(${JSON.stringify(type)}, ${JSON.stringify(o)}, ${JSON.stringify(a)}))`);
  const area = {width: 1000, height: 800};
  check(await of('TEXT', {width: 2000, height: 2000, maximumWidth: 5000, maximumHeight: 5000}, area) === JSON.stringify({width: 950, height: 760}), '[61-23] FIXED non-IMAGE is capped at 95% of the work area');
  check(await of('TEXT', {width: 2000, height: 2000, maximumWidth: 700, maximumHeight: 600}, area) === JSON.stringify({width: 700, height: 600}), '[61-23] FIXED non-IMAGE keeps the configured maximum');
  check(await of('TEXT', {sizeMode: 'RATIO', widthRatio: 1.5, heightRatio: 1, maximumWidth: 5000, maximumHeight: 5000}, area) === JSON.stringify({width: 1000, height: 800}), '[61-23] RATIO non-IMAGE clamps the ratio to 1.0 and allows 100%');
  check(await of('TEXT', {sizeMode: 'RATIO', widthRatio: 0.01, heightRatio: 0.01, minimumWidth: 100, minimumHeight: 100}, area) === JSON.stringify({width: 300, height: 300}), '[61-23] RATIO below 0.1 is raised to 0.1, then to the 300 floor');
  check(await of('IMAGE', {width: 2000, height: 2000, maximumWidth: 400, maximumHeight: 400}, area) === JSON.stringify({width: 900, height: 720}), '[61-23] IMAGE ignores the configured maximum and uses 90% of the work area');
  check(await of('IMAGE', {sizeMode: 'RATIO', widthRatio: 1.2, heightRatio: 1.2}, area) === JSON.stringify({width: 900, height: 720}), '[61-23] IMAGE RATIO is clamped to 1.0 then to 90%');
  // ⑥ 화면 정보 대체값: screen.availWidth가 0이면 브라우저 표시 영역을 쓴다(비정상 0 크기 방지).
  check(await run(`(()=>{const s=window.screen;Object.defineProperty(s,'availWidth',{configurable:true,get:()=>0});const r=window.readScreenWorkArea();delete s.availWidth;
    const v=window.readBrowserViewport();return r.width===v.width&&r.height===v.height&&r.width>0&&window.readScreenWorkArea().width===screen.availWidth;})()`), '[61-23] a zero screen work area falls back to the browser viewport');
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
  await render('QUIZ', {}, {videoEnabled: true}, true, true); await openPreview();
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
  check(await size({width: 640, height: 480}, {width: 280, height: 260}) === JSON.stringify({width: 266, height: 247}), '[TODO68] a work area smaller than 300 keeps the modal on screen (FIXED 95%, WPF FixedSizeSafeAreaRatio)');
  check(await size({width: 640, height: 480}) === JSON.stringify({width: 640, height: 480}), '[TODO68] sizes above the floor are unchanged');
  // [20261110 후속 6] 예시 표시 기본 OFF: 인라인·실제 크기 모달 모두 값이 없는 항목에 입력 안내 문구를 넣지 않는다.
  // 영상 미첨부여도 영상 영역(검정 + 재생 아이콘)과 컨트롤 줄은 자리를 유지하고 '영상 재생 영역' 문구만 숨긴다. showPlaceholders를 켠 호출부만 문구를 그린다.
  const PLACEHOLDERS = ['팝업 제목', '콘텐츠 제목', '팝업 설명이 여기에 표시됩니다.', '이미지 URL을 입력하면 여기에 표시됩니다.', '영상 재생 영역'];
  const shownIn = async (selector, words) => run(`(()=>{const t=document.querySelector(${JSON.stringify(selector)}).innerText;return ${JSON.stringify(words)}.filter(w=>t.includes(w));})()`);
  const videoAreas = selector => run(`document.querySelector(${JSON.stringify(selector)}).querySelectorAll('[data-testid=aspect-video-area],[data-testid=fill-video-area]').length`);
  for (const [type, onWords, content, video] of [
    ['VIDEO', ['팝업 제목', '콘텐츠 제목', '팝업 설명이 여기에 표시됩니다.', '영상 재생 영역'], {videoTitle: null, description: null}, true],
    ['IMAGE', ['팝업 제목', '이미지 URL을 입력하면 여기에 표시됩니다.'], {imageUrl: '', description: null}, false],
    ['SURVEY', ['팝업 제목', '팝업 설명이 여기에 표시됩니다.'], {surveyTitle: null, description: null}, false],
    ['QUIZ', ['팝업 제목', '팝업 설명이 여기에 표시됩니다.', '영상 재생 영역'], {videoEnabled: true, videoTitle: null, surveyTitle: null, description: null}, true],
  ]) {
    for (const placeholders of [false, true]) {
      await render(type, {title: null}, content, true, placeholders);
      const inline = await shownIn('#root', PLACEHOLDERS);
      check(placeholders ? onWords.every(w => inline.includes(w)) : inline.length === 0,
        `${type} inline preview placeholders ${placeholders ? 'ON shows' : 'OFF hides'} the input guide: ` + JSON.stringify(inline));
      if (video) check(await videoAreas('#root') === 1 && await run(`!!document.querySelector('#root [data-testid=PlayCircleOutlineIcon]')`), `${type} inline keeps the video area with the play icon without an attachment`);
      await openPreview();
      const dialog = await shownIn('.MuiDialog-root', PLACEHOLDERS);
      check(placeholders ? onWords.every(w => dialog.includes(w)) : dialog.length === 0,
        `${type} dialog placeholders ${placeholders ? 'ON shows' : 'OFF hides'} the input guide: ` + JSON.stringify(dialog));
      if (video) check(await videoAreas('.MuiDialog-root') === 1, `${type} dialog video area matches the inline preview`);
      await run("document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').click()"); await pause(300);
    }
  }
  // 첨부 전후로 영상 영역 크기·위치와 컨트롤 줄이 같다(예시 표시 OFF, 자리 유지).
  const areaBox = () => run(`(()=>{const a=document.querySelector('#root [data-testid=aspect-video-area],#root [data-testid=fill-video-area]');if(!a)return null;const r=a.getBoundingClientRect();return [Math.round(r.top),Math.round(r.width),Math.round(r.height),document.querySelector('#root').innerText.includes('00:00')].join(',');})()`);
  for (const [type, content] of [['VIDEO', {}], ['QUIZ', {videoEnabled: true}]]) {
    await render(type, {}, {...content, videoUrl: ''});
    const empty = await areaBox();
    await render(type, {}, {...content, videoUrl: '/missing.mp4'});
    const attached = await areaBox();
    check(empty && empty === attached && empty.endsWith('true'), `${type} video area keeps the same box and controls before and after attaching: ` + JSON.stringify({empty, attached}));
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
    ['ADAPTIVE', {}, {imageSizeMode: 'ADAPTIVE'}], ['FIT_TO_IMAGE', {}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true}],
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
    // 2026-11-17: TEXT·SURVEY·QUIZ도 IMAGE와 같이 WPF 그림자 여백 24·안쪽 흰 판 그림자. VIDEO는 WPF 영상 창처럼 여백·그림자 없음.
    for (const type of ['TEXT', 'SURVEY', 'QUIZ']) {
      await render(type);
      const f = await frame();
      check(!f.dialogShadow && f.innerShadow && f.innerRadius === '6px' && f.pad === '24px' && f.inner[0] === f.dialog[0] - 48 && f.inner[1] === f.dialog[1] - 48,
        `[61-16] ${type} keeps the 24px WPF shadow margin with one inner shadow ${label}: ` + JSON.stringify(f));
    }
    await render('VIDEO');
    const video = await frame();
    check(!video.dialogShadow && !video.innerShadow && video.pad === '0px' && video.inner[0] === video.dialog[0], `[61-16] VIDEO has no shadow margin or shadow like the WPF video window ${label}: ` + JSON.stringify(video));
  }
  await run("document.getElementById('closed-net-rule')?.remove()");
  // [TODO61-18] '나중에 보기'는 WPF SecondaryActionButtonStyle 모양(최소 너비 118), 푸터 버튼 높이는 '확인'·'제출'과 같은 34, 푸터 64(2026-11-18). 왼쪽 끝, '확인'·'제출'과 세로 중앙 정렬, 푸터 요소 겹침·잘림 없음.
  const footerLayout = scope => run(`(()=>{const root=${scope};const paper=root.querySelector('.MuiPaper-root');const p=paper.getBoundingClientRect();
    const btn=t=>Array.from(root.querySelectorAll('button')).find(b=>b.textContent.trim()===t);const later=btn('나중에 보기');const main=btn('확인')||btn('바로가기')||btn('제출');
    if(!later||!main)return {missing:!later?'later':'main'};const r=e=>e.getBoundingClientRect();const L=r(later),M=r(main);const s=getComputedStyle(later);
    const parts=[later,main,...Array.from(root.querySelectorAll('.MuiFormControlLabel-root,[role=status]')).filter(e=>e.textContent.trim()&&r(e).width>0)].map(r);
    let overlap=false;for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const a=parts[i],b=parts[j];if(a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5)overlap=true;}
    const footerLeft=Math.min(...parts.map(x=>x.left));
    return {w:Math.round(L.width*10)/10,h:Math.round(L.height),mainH:Math.round(M.height),bg:s.backgroundColor,border:s.borderTopColor,radius:s.borderTopLeftRadius,weight:s.fontWeight,
      leftmost:L.left<=footerLeft+0.5,leftOfMain:L.right<=M.left,centerDiff:Math.round(Math.abs((L.top+L.bottom)/2-(M.top+M.bottom)/2)*10)/10,overlap,
      clipped:parts.some(x=>x.left<p.left-0.5||x.right>p.right+0.5||x.bottom>p.bottom+0.5)};})()`);
  const laterOk = f => f && !f.missing && f.w >= 118 && f.h === 34 && f.mainH === 34 && f.bg === 'rgb(243, 244, 246)' && f.border === 'rgb(209, 213, 219)' && f.radius === '9px' && f.weight === '600'
    && f.leftmost && f.leftOfMain && f.centerDiff <= 1 && !f.overlap && !f.clipped;
  const laterTypes = [['TEXT', {}], ['IMAGE', {}], ['VIDEO', {videoUrl: '/missing.mp4'}], ['SURVEY', {}], ['QUIZ', {}], ['QUIZ', {videoEnabled: true, videoUrl: '/missing.mp4'}]];
  for (const [type, content] of laterTypes) {
    const label = type + (content.videoEnabled ? '(VIDEO+QUIZ)' : '');
    await render(type, {showLater: true, showDoNotShowAgain: true}, content);
    let f = await footerLayout("document.querySelector('#root')");
    check(laterOk(f), `[TODO61-18] ${label} inline later button matches WPF secondary style at height 34 and aligns: ` + JSON.stringify(f));
    await openPreview();
    f = await footerLayout("document.querySelector('.MuiDialog-root')");
    check(laterOk(f), `[TODO61-18] ${label} dialog later button matches WPF secondary style at height 34 and aligns: ` + JSON.stringify(f));
    await escape();
  }
  // 확대 배율(브라우저 150%와 같은 CSS 폭) Dialog와 큰 푸터 글자에서도 겹침·잘림이 없다.
  await viewport(667, 600);
  for (const [type, content] of laterTypes) {
    await render(type, {showLater: true, showDoNotShowAgain: true}, {...content, footerFontSize: 18});
    let f = await footerLayout("document.querySelector('#root')");
    // IMAGE 푸터도 최소 높이 64라(TODO61-18) 좁은 폭 + 글자 18에서 줄이 바뀌어도 잘리지 않는다.
    check(f && !f.missing && f.h === 34 && f.mainH === 34 && f.w >= 118 && !f.overlap && !f.clipped, `[TODO61-18] ${type} narrow inline with footer 18 has no overlap or clipping: ` + JSON.stringify(f));
    await openPreview();
    f = await footerLayout("document.querySelector('.MuiDialog-root')");
    check(f && !f.missing && f.h === 34 && f.mainH === 34 && f.w >= 118 && !f.overlap && !f.clipped, `[TODO61-18] ${type} zoomed dialog with footer 18 has no overlap or clipping: ` + JSON.stringify(f));
    await escape();
  }
  await viewport(1000, 900);
  // showFooter·showLater 조합: 둘 다 true일 때만 표시.
  for (const [showFooter, showLater] of [[true, false], [false, true], [false, false]]) for (const [type, content] of [['TEXT', {}], ['SURVEY', {}]]) {
    await render(type, {showFooter, showLater}, content);
    check(!(await run(`Array.from(document.querySelectorAll('#root button')).some(b=>b.textContent.trim()==='나중에 보기')`)), `[TODO61-18] ${type} showFooter=${showFooter} showLater=${showLater} hides the later button`);
  }
  // 누르면 기존 핸들러대로 실제 크기 모달을 닫는다.
  await render('VIDEO', {showLater: true}, {videoUrl: '/missing.mp4'}); await openPreview();
  await run(`Array.from(document.querySelectorAll('.MuiDialog-root button')).find(b=>b.textContent.trim()==='나중에 보기').click()`); await pause(400);
  check(!(await dialogOpen()), '[TODO61-18] Later button keeps its handler and closes the dialog');
  // 2026-11-18 폐쇄망: VIDEO+QUIZ 우측 미리보기 넘침 경계 높이에서 스크롤바가 매 프레임 생겼다 없어지던 진동을 막는다(WPF와 같은 너비 이력 규칙).
  const scrollFlips = ms => run(`new Promise(resolve=>{const s=Array.from(document.querySelectorAll('#root *')).find(e=>getComputedStyle(e).overflowY==='auto'&&e.querySelector('[data-testid=aspect-video-area]'));
    let last='',flips=-1;const t0=performance.now();const tick=()=>{const v=(s.scrollHeight>s.clientHeight)+':'+s.clientWidth;if(v!==last){flips++;last=v;}
    if(performance.now()-t0<${ms})requestAnimationFrame(tick);else resolve(flips);};requestAnimationFrame(tick);})`);
  const overflowing = () => run(`(()=>{const s=Array.from(document.querySelectorAll('#root *')).find(e=>getComputedStyle(e).overflowY==='auto'&&e.querySelector('[data-testid=aspect-video-area]'));return s.scrollHeight>s.clientHeight+1;})()`);
  const renderSized = async (width, height) => { await run(`window.hostSize=${JSON.stringify({width, height})}`); await render('QUIZ', {}, {videoEnabled: true, videoUrl: ''}); await pause(60); };
  for (const width of [460, 640]) {
    let lo = 300, hi = 1400;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; await renderSized(width, mid); if (await overflowing()) lo = mid; else hi = mid; }
    const unstable = [];
    for (let height = hi - 8; height <= hi + 3; height++) { await renderSized(width, height); const flips = await scrollFlips(500); if (flips > 2) unstable.push(height + ':' + flips); }
    check(unstable.length === 0, `[2026-11-18] VIDEO+QUIZ inline preview width ${width} keeps the scrollbar stable around the overflow boundary ${hi}: ` + unstable.join(' '));
  }
  // 스크롤바 폭보다 큰 너비 변화(창 크기 조절)는 다시 계산한다.
  await renderSized(640, 900);
  const videoBox = () => run(`(()=>{const r=document.querySelector('#root [data-testid=aspect-video-area]').getBoundingClientRect();return {w:r.width,h:r.height};})()`);
  const wide = await videoBox();
  await run(`window.hostSize={width:480,height:900}`); await run(`document.querySelector('#root > div').style.width='480px'`); await pause(300);
  const narrow = await videoBox();
  check(narrow.w < wide.w - 100 && Math.abs(narrow.h - Math.max(180, (narrow.w - 2) * 9 / 16 + 2)) < 1.5,
    '[2026-11-18] A real width change larger than the scrollbar still recalculates the video height: ' + JSON.stringify({wide, narrow}));
  await run('window.hostSize=undefined');
  // TODO61-19: 폐쇄망 전역 body1 12px 규칙을 켠 테마에서도 공통 헤더 제목은 기본 17px·명시값을 유지한다(인라인·실제 크기 모달).
  await run('window.body1Rule=true');
  const HEAD = '미리보기 컴포넌트';
  const headSizes = selector => run(`Array.from(document.querySelectorAll(${JSON.stringify(selector + ' p')})).filter(e=>e.textContent===${JSON.stringify(HEAD)}).map(e=>getComputedStyle(e).fontSize)`);
  for (const type of ['TEXT', 'IMAGE', 'VIDEO', 'SURVEY', 'QUIZ', 'VIDEO+QUIZ']) {
    const [popupType, extra] = type === 'VIDEO+QUIZ' ? ['QUIZ', {videoEnabled: true}] : [type, {}];
    for (const [size, expected] of [[undefined, '17px'], [14, '14px'], [22, '22px']]) {
      await render(popupType, {}, {...extra, ...(size ? {headerFontSize: size} : {})}); await openPreview();
      const inline = await headSizes('#root'), dialog = await headSizes('.MuiDialog-root');
      check(inline.length === 1 && dialog.length === 1 && inline[0] === expected && dialog[0] === expected,
        `[61-19] ${type} header ${expected} wins over the global body1 12px rule: ` + JSON.stringify({inline, dialog}));
      await escape();
    }
  }
  // 전역 규칙이 실제로 적용되는 환경인지(본문 body1은 12px) 함께 확인해 검사가 공회전하지 않게 한다.
  await render('TEXT', {}, {plainText: '본문 규칙 확인'});
  check(await run(`Array.from(document.querySelectorAll('#root p.MuiTypography-body1')).some(e=>getComputedStyle(e).fontSize==='12px')`), '[61-19] the global body1 12px rule is active in this theme');
  await render('TEXT', {showHeader: false}); await openPreview();
  check((await headSizes('#root')).length === 0 && (await headSizes('.MuiDialog-root')).length === 0, '[61-19] showHeader=false hides the header in both previews');
  await escape();
  await run('window.body1Rule=false');
  check(await run('window.__errors.length') === 0, 'No runtime errors: ' + await run('JSON.stringify(window.__errors)'));
  console.log('PASS: ' + checks + ' TODO61 preview component checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
