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
  // 2026-11-24: 팝업은 해상도 화면(preview-virtual-screen) 안에 그린다. 화면 기준 좌표와 창 크기(offset, 배율 확대 전 DIP)를 돌려준다.
  const paper = () => run(`(()=>{const w=document.querySelector('[data-testid=preview-popup-window]'),s=document.querySelector('[data-testid=preview-virtual-screen]').getBoundingClientRect(),r=w.getBoundingClientRect();
    return {left:Math.round(r.left-s.left),top:Math.round(r.top-s.top),right:Math.round(r.right-s.left),bottom:Math.round(r.bottom-s.top),width:w.offsetWidth,height:w.offsetHeight};})()`);
  const near = (a, b) => Math.abs(a - b) < 1;
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
  // 2) FIXED·중앙·Overlay: 기준 화면(뷰포트 1000×900은 프리셋과 맞지 않아 1920×1080 @100%, 작업 영역 1920×1040) 안에서 크기·위치·Overlay, Esc 종료.
  //    2026-11-24 '현재 모니터' 삭제: 팝업은 항상 해상도 화면(preview-virtual-screen) 안에 그린다. paper()는 화면 기준 좌표·창 크기(offset)다.
  await openPreview();
  let rect = await paper();
  check(rect.width === 560 && rect.height === 420 && near(rect.left, 680) && near(rect.top, 310), 'FIXED popup is 560x420 at the center of the 1920x1040 work area: ' + JSON.stringify(rect));
  check(await run("getComputedStyle(document.querySelector('[data-testid=preview-virtual-overlay]')).backgroundColor") === 'rgba(0, 0, 0, 0.45)', 'Overlay uses backgroundOverlayOpacity on the virtual desktop');
  const windowStyle = await run("(()=>{const s=getComputedStyle(document.querySelector('[data-testid=preview-popup-window]'));return {overflow:s.overflow,radius:s.borderRadius};})()");
  check(windowStyle.overflow === 'hidden' && windowStyle.radius === '0px', 'Popup window clips its content and the white panel draws the rounded corners: ' + JSON.stringify(windowStyle));
  check(await run("Array.from(document.querySelectorAll('.MuiDialog-root button')).some(b=>b.getAttribute('aria-label')==='실제 크기 미리보기 종료')"), 'Dialog has its own exit button');
  check(!(await run(`document.querySelector('.MuiDialog-root').textContent.includes(${JSON.stringify(NOTICE)})`)), '[73-27] The actual size dialog does not show the size notice');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'text-dialog.png'), Buffer.from(shot.data, 'base64'));
  await clickAt(5, 5);
  check(await dialogOpen(), 'Clicking outside the popup does not close the preview');
  await escape();
  check(!(await dialogOpen()), 'Esc closes the dialog');
  await unchanged('TEXT');
  // 3) 9개 위치·그림자 여백(일반 24px, 영상 0px)·종료 버튼 위치. WPF처럼 창은 작업 영역 가장자리에 붙고 흰 판이 창 안 24px에 그려진다.
  await render('TEXT', {}, {popupPosition: 'TOP_LEFT'}); await openPreview(); rect = await paper();
  const panel = await run(`(()=>{const s=document.querySelector('[data-testid=preview-virtual-screen]').getBoundingClientRect();
    const r=document.querySelector('[data-testid=preview-popup-window] .MuiPaper-root').getBoundingClientRect();return {left:r.left-s.left,top:r.top-s.top,width:r.width,height:r.height}})()`);
  check(rect.left === 0 && rect.top === 0 && panel.left === 24 && panel.top === 24 && panel.width === 512 && panel.height === 372,
    'TOP_LEFT window sits at the work area edge and the white panel keeps the 24px WPF shadow margin (560x420 → 512x372): ' + JSON.stringify({rect, panel}));
  // 위쪽 배치 팝업이면 도구 패널(기준 화면·배율·종료)은 아래 12px + 가로 스크롤바 높이로 옮긴다.
  check(await run(`(()=>{const t=document.querySelector('[data-testid=preview-dialog-tools]').getBoundingClientRect();const b=document.querySelector('[aria-label="실제 크기 미리보기 종료"]').getBoundingClientRect();
    const c=document.querySelector('[data-testid=preview-virtual-scroll]');return Math.abs(t.bottom-(innerHeight-12-(c.offsetHeight-c.clientHeight)))<1&&b.bottom<=t.bottom&&b.top>=t.top&&b.top>450;})()`),
    'Exit button moves to the bottom (above the horizontal scrollbar) for top-aligned popups');
  await escape();
  await render('VIDEO', {}, {popupPosition: 'BOTTOM_RIGHT'}); await openPreview(); rect = await paper();
  check(near(rect.right, 1920) && near(rect.bottom, 1040), 'VIDEO window has no edge margin at BOTTOM_RIGHT of the work area: ' + JSON.stringify(rect));
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
  // 4) Overlay 꺼짐: 가상 데스크톱 위 Overlay 층이 없고 흰 바탕이 그대로 보인다.
  await render('TEXT', {}, {useBackgroundOverlay: false}); await openPreview();
  check(await run(`!document.querySelector('[data-testid=preview-virtual-overlay]')&&getComputedStyle(document.querySelector('[data-testid=preview-virtual-screen]')).backgroundColor==='rgb(255, 255, 255)'`),
    'Overlay off shows the white virtual desktop');
  await escape();
  // 5) RATIO는 기준 화면 작업 영역 기준이라 브라우저 크기와 무관하다. FULLSCREEN은 표시 해상도 전체.
  await render('TEXT', {sizeMode: 'RATIO'}); await openPreview(); rect = await paper();
  check(rect.width === 960 && rect.height === 520, 'RATIO uses 50% of the 1920x1040 work area: ' + JSON.stringify(rect));
  await viewport(1200, 800); await pause(300); rect = await paper();
  check(rect.width === 960 && rect.height === 520, 'Browser resize does not change the popup size: ' + JSON.stringify(rect));
  await escape(); await viewport(1000, 900); await pause(200);
  await render('TEXT', {sizeMode: 'FULLSCREEN'}, {popupPosition: 'TOP_LEFT'}); await openPreview(); rect = await paper();
  check(rect.width === 1920 && rect.height === 1080 && rect.left === 0 && rect.top === 0, 'FULLSCREEN ignores position and covers the whole 1920x1080 display: ' + JSON.stringify(rect));
  await escape();
  // 6) IMAGE FIT_TO_IMAGE: 인라인은 현재 모니터 작업 영역(screen.avail = 1000×900)으로, 모달은 기준 화면 작업 영역(1920×1040)으로 권장 창 크기를 계산한다.
  for (const hint of [false, true]) {
    await render('IMAGE', {width: 300, height: 150}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true, imageTitle: '', description: ''}, hint);
    for (let i = 0; i < 30 && !(await run('!!window.hostState.recommended')); i++) await pause(100);
    check(JSON.stringify(await run('window.hostState.recommended')) === JSON.stringify(await run("window.fitLayout({width:800,height:400},{width:1000,height:900}).window")), 'Inline reports the FIT_TO_IMAGE window size');
    const expected = await run("window.fitLayout({width:800,height:400},{width:1920,height:1040}).window");
    await openPreview(); await pause(300); rect = await paper();
    check(rect.width === expected.width && rect.height === expected.height, `FIT_TO_IMAGE dialog size follows the reference work area (hint=${hint}): ` + JSON.stringify([rect, expected]));
    await escape();
  }
  await unchanged('IMAGE');
  // TODO61-23: 기준 화면(해상도 × 배율)으로 팝업 크기·위치를 계산하고, 해상도 화면을 실제 크기로 그려 브라우저보다 크면 스크롤한다.
  const tools = () => run(`(()=>{const t=document.querySelector('[data-testid=preview-dialog-tools]');return {text:t?t.innerText:'',select:!!t&&t.querySelectorAll('[role=combobox]').length===2};})()`);
  const outerScroll = () => run(`(()=>{const d=document.scrollingElement;return {page:d.scrollHeight>innerHeight+0.5||d.scrollWidth>innerWidth+0.5};})()`);
  const choose = async (index, value) => {
    await run(`(()=>{const c=document.querySelectorAll('[data-testid=preview-dialog-tools] [role=combobox]')[${index}];c.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));})()`); await pause(300);
    await run(`document.querySelector('li[data-value=${JSON.stringify(String(value))}]').click()`); await pause(400);
  };
  const chooseScreen = value => choose(0, value), chooseScale = value => choose(1, value);
  // ① 730×900 회귀: 브라우저 일반 모드(내부 높이 945)·F11(1080) 어느 쪽이든 기준 화면 1920×1080에서 730×900. 예전 브라우저 기준 계산은 945×0.9=851.
  for (const [label, view] of [['normal', [1920, 945]], ['F11', [1920, 1080]]]) {
    await viewport(view[0], view[1], 1920, 1040); await pause(200);
    await render('IMAGE', {width: 730, height: 900}, {imageSizeMode: 'ADAPTIVE', imageTitle: '', description: ''}); await openPreview(); await pause(300); rect = await paper();
    const bar = await tools();
    check(rect.width === 730 && rect.height === 900, `[61-23] IMAGE 730x900 keeps its size in ${label} mode: ` + JSON.stringify(rect));
    check(bar.select && bar.text.includes('기준 화면') && bar.text.includes('배율') && !bar.text.includes('현재 모니터') && !bar.text.includes('작업 영역'),
      `[61-23] ${label}: tools show the resolution and scale selects only: ` + JSON.stringify(bar));
    await escape();
  }
  // ② 작업 영역 90% 상한: 1040 → 936.
  await render('IMAGE', {width: 730, height: 1000}, {imageSizeMode: 'ADAPTIVE', imageTitle: '', description: ''}); await openPreview(); await pause(300); rect = await paper();
  check(rect.width === 730 && rect.height === 936, '[61-23] IMAGE height is capped by 90% of the work area (936): ' + JSON.stringify(rect));
  await escape();
  // ③ 해상도 전환: 해상도 화면을 실제 크기로 그리고 팝업을 WPF와 같은 크기로 놓는다. 브라우저보다 큰 축만 스크롤.
  const virtual = () => run(`(()=>{const s=document.querySelector('[data-testid=preview-virtual-screen]'),w=document.querySelector('[data-testid=preview-popup-window]');
    if(!s||!w)return null;const sr=s.getBoundingClientRect(),wr=w.getBoundingClientRect();
    const c=document.querySelector('[data-testid=preview-virtual-scroll]');
    const cs=getComputedStyle(c);
    return {scroll:{x:cs.overflowX!=='hidden'&&c.scrollWidth>c.clientWidth+0.5,y:cs.overflowY!=='hidden'&&c.scrollHeight>c.clientHeight+0.5,width:c.scrollWidth,height:c.scrollHeight,bar:c.offsetWidth-c.clientWidth},
      screen:{left:sr.left,top:sr.top,width:sr.width,height:sr.height},window:{width:w.offsetWidth,height:w.offsetHeight},
      shown:{left:wr.left-sr.left,top:wr.top-sr.top,width:wr.width,height:wr.height}};})()`);
  await viewport(1000, 900); await pause(200);
  await render('TEXT', {sizeMode: 'RATIO'}); await openPreview();
  let bar;
  // 뷰포트 1000×900: 세 해상도 모두 1000보다 넓어 가로 스크롤, 768 < 900이라 1366×768은 세로 스크롤 없음.
  for (const [key, display, popupSize, scrollY] of [['1920x1080', [1920, 1080], [960, 520], true], ['2560x1440', [2560, 1440], [1200, 700], true], ['1366x768', [1366, 768], [683, 364], false]]) {
    await chooseScreen(key); const v = await virtual(); bar = await tools();
    check(v && near(v.screen.width, display[0]) && near(v.screen.height, display[1]) && await run("Math.round(document.querySelector('[data-testid=preview-virtual-scroll]').getBoundingClientRect().top)") === 0,
      `[61-23] ${key} draws the resolution screen at actual size: ` + JSON.stringify(v));
    check(v.window.width === popupSize[0] && v.window.height === popupSize[1] && near(v.shown.width, popupSize[0]) && near(v.shown.height, popupSize[1]),
      `[61-23] ${key}: RATIO 50% popup is ${popupSize.join('x')} at actual size (설정 최대 1200 적용): ` + JSON.stringify(v));
    check(v.scroll.x && v.scroll.y === scrollY && v.scroll.width >= display[0] && v.scroll.height >= (scrollY ? display[1] : 0),
      `[61-23] ${key}: a screen larger than the browser scrolls instead of shrinking: ` + JSON.stringify(v.scroll));
    check(bar.text.includes(display.join('×')) && !bar.text.includes(display.join('×') + ' *') && bar.text.includes('100% *'), `[61-23] ${key}: no resolution mark on a 1000x900 screen, 100% scale marked: ` + JSON.stringify(bar));
    check(!(await outerScroll()).page, `[61-23] ${key}: the admin page itself does not scroll`);
    // 가상 데스크톱: 작업 영역 흰색, 작업 표시줄 검정 40, 바깥 검정 30%, 점선 테두리 없음, Overlay는 데스크톱 위.
    const desk = await run(`(()=>{const g=e=>e&&getComputedStyle(e);const s=g(document.querySelector('[data-testid=preview-virtual-screen]')),b=g(document.querySelector('.MuiBackdrop-root')),
      t=document.querySelector('[data-testid=preview-virtual-taskbar]'),o=g(document.querySelector('[data-testid=preview-virtual-overlay]'));
      return {screen:s.backgroundColor,outline:s.outlineStyle,outside:b.backgroundColor,taskbar:g(t).backgroundColor,taskbarH:t.getBoundingClientRect().height,overlay:o&&o.backgroundColor};})()`);
    check(desk.screen === 'rgb(255, 255, 255)' && desk.outside === 'rgba(0, 0, 0, 0.3)' && desk.outline === 'none' && desk.taskbar === 'rgb(0, 0, 0)'
      && Math.round(desk.taskbarH) === 40 && desk.overlay === 'rgba(0, 0, 0, 0.45)',
      `[61-23] ${key}: white desktop, black taskbar, translucent outside, no border, overlay on the desktop: ` + JSON.stringify(desk));
    // 도구 패널은 흰 바탕(라벨 가시성)이고 세로 스크롤바 폭만큼 안쪽(오른쪽 12 + 스크롤바)에 있다.
    const panelPos = await run(`(()=>{const t=document.querySelector('[data-testid=preview-dialog-tools]');const r=t.getBoundingClientRect();return {right:innerWidth-r.right,bg:getComputedStyle(t).backgroundColor};})()`);
    check(near(panelPos.right, 12 + v.scroll.bar) && panelPos.bg === 'rgb(255, 255, 255)', `[61-23] ${key}: tools panel is white and clears the vertical scrollbar: ` + JSON.stringify({panelPos, bar: v.scroll.bar}));
    check(await run("(()=>{const r=document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight&&r.top>=0;})()"),
      `[61-23] ${key}: exit button stays reachable over the scrolling screen`);
  }
  // 배율: 1920×1080 @125% → 화면 1536×864 DIP·작업 영역 1536×824, RATIO 50% = 768×412 DIP. 화면은 물리 크기(1920×1080)로 그리고 안쪽을 1.25배 확대한다.
  await chooseScreen('1920x1080'); await chooseScale(1.25);
  let v125 = await virtual();
  check(near(v125.screen.width, 1920) && near(v125.screen.height, 1080) && v125.window.width === 768 && v125.window.height === 412
    && near(v125.shown.width, 960) && near(v125.shown.height, 515),
    '[61-23] 125% keeps the screen size and enlarges the popup (768x412 DIP shown as 960x515): ' + JSON.stringify(v125));
  await chooseScale(1);
  // 브라우저와 같은 해상도는 스크롤이 없다(F11 2560×1440). 일반 모드(높이 1300)는 세로만 스크롤하고 세로 스크롤바 때문에 가로 스크롤이 생기지 않는다.
  await chooseScreen('2560x1440');
  for (const [label, height, scrollY] of [['F11', 1440, false], ['normal', 1300, true]]) {
    await viewport(2560, height, 2560, 1400); await pause(300);
    const s2560 = (await virtual()).scroll;
    check(!s2560.x && s2560.y === scrollY, `[61-23] 2560 browser (${label}) shows the 2560x1440 screen without a horizontal scroll: ` + JSON.stringify(s2560));
  }
  await viewport(1000, 900); await pause(300); await chooseScreen('1366x768');
  // 해상도를 바꾸면 처음 스크롤 위치가 팝업 가운데라 팝업이 보이고, 스크롤로 화면 오른쪽 아래 끝(작업 표시줄)까지 도달할 수 있다.
  await chooseScreen('2560x1440');
  check(await run(`(()=>{const c=document.querySelector('[data-testid=preview-virtual-scroll]').getBoundingClientRect(),w=document.querySelector('[data-testid=preview-popup-window]').getBoundingClientRect();
    return Math.abs((w.left+w.width/2)-(c.left+c.width/2))<2&&Math.abs((w.top+w.height/2)-(c.top+c.height/2))<2;})()`), '[61-23] switching to a larger screen scrolls to the popup center');
  check(await run(`(()=>{const c=document.querySelector('[data-testid=preview-virtual-scroll]');c.scrollLeft=c.scrollWidth;c.scrollTop=c.scrollHeight;
    const s=document.querySelector('[data-testid=preview-virtual-screen]').getBoundingClientRect(),r=c.getBoundingClientRect();return s.right<=r.right+0.5&&s.bottom<=r.bottom+0.5&&c.scrollLeft>0&&c.scrollTop>0;})()`),
    '[61-23] 2560x1440 can be scrolled to its bottom-right corner on a smaller browser');
  await escape();
  // 같은 FIXED 팝업이 해상도에 따라 화면 대비 크기가 달라지고, 작은 화면에서는 90% 상한으로 실제로 줄어든다.
  await render('TEXT', {width: 1300, height: 900, maximumWidth: 1600, maximumHeight: 1200}); await openPreview();
  const fixedOn = async key => { await chooseScreen(key); const v = await virtual();
    const image = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'virtual-' + key + '.png'), Buffer.from(image.data, 'base64'));
    return {window: v.window, ratio: v.shown.width / v.screen.width}; };
  const small = await fixedOn('1366x768'), mid = await fixedOn('1920x1080'), big = await fixedOn('2560x1440');
  check(small.window.width === 1229 && small.window.height === 655 && mid.window.width === 1300 && mid.window.height === 900 && big.window.width === 1300,
    '[61-23] FIXED 1300x900 shrinks to 90% (1229x655) on 1366x768 and keeps its size on larger screens: ' + JSON.stringify({small, mid, big}));
  check(small.ratio > mid.ratio && mid.ratio > big.ratio, '[61-23] the same popup takes a smaller share of larger screens: ' + JSON.stringify({small, mid, big}));
  await escape();
  await unchanged('TEXT');
  // FULLSCREEN: 작업 표시줄까지 덮는 표시 해상도 크기.
  await render('TEXT', {sizeMode: 'FULLSCREEN'}); await openPreview(); await chooseScreen('2560x1440');
  let vf = await virtual();
  check(vf.window.width === 2560 && vf.window.height === 1440 && near(vf.shown.left, 0) && near(vf.shown.top, 0), '[61-23] FULLSCREEN covers the whole display: ' + JSON.stringify(vf));
  await escape();
  // ④ FIT_TO_IMAGE 권장 크기도 선택한 작업 영역으로 다시 계산한다. 큰 지정값(2400×1800)으로 90% 상한이 드러나게 한다.
  await render('IMAGE', {width: 2400, height: 1800}, {imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: true, imageTitle: '', description: ''}); await openPreview(); await pause(400);
  for (const [key, workArea] of [['1366x768', {width: 1366, height: 728}], ['2560x1440', {width: 2560, height: 1400}]]) {
    await chooseScreen(key); vf = await virtual();
    const fit = await run(`window.fitLayout({width:800,height:400},${JSON.stringify(workArea)}).window`);
    check(vf.window.width === fit.width && vf.window.height === fit.height, `[61-23] FIT_TO_IMAGE follows the ${key} work area: ` + JSON.stringify([vf.window, fit]));
  }
  await escape();
  await unchanged('IMAGE');
  // 현재 모니터 표시(*): 내 모니터 해상도(screen × devicePixelRatio)·배율과 같은 항목에 *를 붙이고 처음 선택도 그 값이다.
  await viewport(1920, 1080, 1920, 1080); await pause(200);
  await render('TEXT'); await openPreview(); bar = await tools();
  check(bar.text.includes('1920×1080 *') && bar.text.includes('100% *'), '[61-23] the current monitor resolution and scale are selected first and marked with *: ' + JSON.stringify(bar));
  await escape(); await viewport(1000, 900); await pause(200);
  // ⑤ 화면 상한은 WPF ApplyWindowSize와 같다: FIXED·IMAGE 90%(2026-11-24 통일), RATIO 100%(비율 0.1~1.0 보정), 설정 최대값은 비IMAGE에만.
  const of = (type, o, a) => run(`JSON.stringify(window.dialogSizeOf(${JSON.stringify(type)}, ${JSON.stringify(o)}, ${JSON.stringify(a)}))`);
  const area = {width: 1000, height: 800};
  check(await of('TEXT', {width: 2000, height: 2000, maximumWidth: 5000, maximumHeight: 5000}, area) === JSON.stringify({width: 900, height: 720}), '[61-23] FIXED non-IMAGE is capped at 90% of the work area (same as IMAGE/AUTO)');
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
  check(await size({width: 640, height: 480}, {width: 280, height: 260}) === JSON.stringify({width: 252, height: 234}), '[TODO68] a work area smaller than 300 keeps the modal on screen (FIXED 90%, WPF ScreenSafeAreaRatio)');
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
  // 첨부 전후로 영상 영역 크기·위치가 같다(예시 표시 OFF, 자리 유지). 2026-11-24 영상 아래 컨트롤 모형 줄(▶ 00:00 / 00:00 · 1.0× · 전체화면)은 삭제되어 없어야 한다.
  const areaBox = () => run(`(()=>{const a=document.querySelector('#root [data-testid=aspect-video-area],#root [data-testid=fill-video-area]');if(!a)return null;const r=a.getBoundingClientRect();return [Math.round(r.top),Math.round(r.width),Math.round(r.height),document.querySelector('#root').innerText.includes('00:00')].join(',');})()`);
  for (const [type, content] of [['VIDEO', {}], ['QUIZ', {videoEnabled: true}]]) {
    await render(type, {}, {...content, videoUrl: ''});
    const empty = await areaBox();
    await render(type, {}, {...content, videoUrl: '/missing.mp4'});
    const attached = await areaBox();
    check(empty && empty === attached && empty.endsWith('false'), `${type} video area keeps the same box before and after attaching and has no control mock line: ` + JSON.stringify({empty, attached}));
  }
  await render('VIDEO', {title: '실제 제목'}, {videoTitle: '실제 영상 제목', description: '실제 설명'});
  await openPreview();
  const realValues = await run(`document.querySelector('.MuiDialog-root').innerText`);
  check(['실제 제목', '실제 영상 제목', '실제 설명'].every(w => realValues.includes(w)), 'Dialog still shows entered values');
  await run("document.querySelector('[aria-label=\"실제 크기 미리보기 종료\"]').click()"); await pause(300);
  // [61-13·14] 폐쇄망 DevTools에서 확인된 규칙을 넣어도 창 둥글기를 유지하고, IMAGE 일반 창의 그림자는 안쪽 Paper 하나만 보인다.
  const frame = async () => {
    await openPreview();
    const value = await run(`(()=>{const d=document.querySelector('[data-testid=preview-popup-window]'),i=d.querySelector('.MuiPaper-root'),b=i.parentElement,r=e=>e.getBoundingClientRect();
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
  // 2026-11-24 IMAGE ADAPTIVE 창 크기 맞춤: 원본 800×400, 헤더·푸터 표시, 제목·설명 없음. 가로 700 → 이미지 594×297 → 세로 297+2+96+40+64 = 499.
  //   가로가 원본 창 폭(800+106=906)보다 크면 좌우 띠를 피할 수 없어 원본 기준(906×602)으로 줄이고 limited=true. 가로 없음 = 원본 기준.
  const fitOf = (o, c, w) => run(`JSON.stringify(window.adaptiveFit(${JSON.stringify(o)}, ${JSON.stringify(c)}, {width:800,height:400}, ${JSON.stringify(w)}))`);
  const noText = {imageTitle: '', description: '', imageSizeMode: 'ADAPTIVE'};
  check(await fitOf({}, noText, 700) === JSON.stringify({window: {width: 700, height: 499}, image: {width: 594, height: 297}, limited: false}), '[IMAGE fit] width 700 gives a height without bands');
  check(await fitOf({}, noText, 1000) === JSON.stringify({window: {width: 906, height: 602}, image: {width: 800, height: 400}, limited: true}), '[IMAGE fit] a width beyond the original is limited to the original');
  check(await fitOf({}, noText, null) === JSON.stringify({window: {width: 906, height: 602}, image: {width: 800, height: 400}, limited: false}), '[IMAGE fit] no width uses the original size');
  check(await fitOf({showHeader: false, showFooter: false}, noText, 700) === JSON.stringify({window: {width: 700, height: 395}, image: {width: 594, height: 297}, limited: false}), '[IMAGE fit] hidden header/footer shorten the window');
  // 2026-11-24 동영상 고정 안내 문구: 미리보기·저장 값에 오른쪽 정렬 문단으로 붙고, 다시 붙여도 하나만, 불러올 때 떼면 사용자 설명만 남는다. 다른 유형은 그대로.
  const fixed = await run('window.fixedText');
  const applied = await run(`window.applyFixed('VIDEO', {description: '사용자 설명'})`);
  check(applied.content.descriptionBlocks.length === 2 && applied.content.descriptionBlocks[0].alignment === 'RIGHT' && applied.content.descriptionBlocks[0].runs[0].text === fixed
    && applied.content.descriptionBlocks[1].runs[0].text === '사용자 설명' && applied.content.description === fixed + String.fromCharCode(10) + '사용자 설명', '[fixed text] VIDEO gets the right-aligned fixed paragraph first');
  check(await run(`JSON.stringify(window.applyFixed('VIDEO', window.applyFixed('VIDEO', {description: '사용자 설명'}).content).content.descriptionBlocks)`) === JSON.stringify(applied.content.descriptionBlocks),
    '[fixed text] applying twice keeps one fixed paragraph');
  const stripped = await run(`window.stripFixed(window.applyFixed('VIDEO', {description: '사용자 설명'}))`);
  check(stripped.content.description === '사용자 설명' && stripped.content.descriptionBlocks.length === 1 && stripped.content.descriptionBlocks[0].runs[0].text === '사용자 설명',
    '[fixed text] loading strips the fixed paragraph so the editor shows only the user text');
  const quizOnly = await run(`window.applyFixed('QUIZ', {description: '퀴즈'})`), videoQuiz = await run(`window.applyFixed('QUIZ', {videoEnabled: true, description: ''})`);
  check(quizOnly.content.description === '퀴즈' && !quizOnly.content.descriptionBlocks && videoQuiz.content.description === fixed && videoQuiz.content.descriptionBlocks.length === 1,
    '[fixed text] plain QUIZ is unchanged, VIDEO+QUIZ without user text has only the fixed paragraph');
  // VIDEO 설명 서식(descriptionBlocks)은 미리보기에서 문단 정렬을 살려 그린다(고정 문구 문단은 오른쪽 정렬).
  await render('VIDEO', {}, {descriptionBlocks: applied.content.descriptionBlocks, description: applied.content.description});
  const aligns = await run(`(()=>{const ps=Array.from(document.querySelectorAll('#root *')).filter(p=>p.children.length===0&&(p.textContent===${JSON.stringify(fixed)}||p.textContent==='사용자 설명'));return ps.map(p=>p.textContent===${JSON.stringify(fixed)}?'F:'+getComputedStyle(p).textAlign:'U:'+getComputedStyle(p).textAlign);})()`);
  check(aligns.includes('F:right') && aligns.includes('U:left') && !(await run("document.querySelector('#root').innerText.includes('00:00')")),
    '[VIDEO description] rich description keeps the right-aligned fixed paragraph and the control mock line is gone: ' + JSON.stringify(aligns));
  check(await run('window.__errors.length') === 0, 'No runtime errors: ' + await run('JSON.stringify(window.__errors)'));
  console.log('PASS: ' + checks + ' TODO61 preview component checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
