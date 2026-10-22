// [설계 49·62] 문단·글자 서식과 우클릭 패널을 실제 관리자 편집기 빌드로 확인한다.
// 기본 Windows Edge. 다른 Chromium은 BROWSER_PATH로 지정한다(예: Linux headless Chromium).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-rich-text-49.cjs
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/rich49');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// next/dynamic은 Next 런타임 밖에서 React.lazy로 대신한다.
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
// 미리보기의 Next 라우터 의존(@/lib/urls)은 경로를 그대로 돌려주는 대역으로 바꾼다.
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-rich-text-49-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  // 편집기는 동적 import라 bundle.js 외 청크도 내려준다.
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--remote-debugging-port=9339', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let browserError; browser.on('error', error => { browserError = error; });
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9339/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  if (!targets?.length) throw browserError || Error('Chromium did not start; set BROWSER_PATH to its executable');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const mouse = async (type, x, y, button = 'left', modifiers = 0) => send('Input.dispatchMouseEvent', {type, x, y, button, buttons: button === 'right' ? 2 : 1, clickCount: 1, modifiers});
  const clickAt = async (x, y, button = 'left', modifiers = 0) => { await mouse('mousePressed', x, y, button, modifiers); await mouse('mouseReleased', x, y, button, modifiers); await pause(120); };
  const center = async selector => run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  const click = async selector => { const c = await center(selector); await clickAt(c.x, c.y); };
  const key = async (keyName, code = keyName, keyCode = 0) => {
    // Enter는 text가 있어야 버튼 활성화(click)까지 이어진다.
    await send('Input.dispatchKeyEvent', keyName === 'Enter' ? {type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, text: '\r'}
      : {type: 'rawKeyDown', key: keyName, code, windowsVirtualKeyCode: keyCode});
    await send('Input.dispatchKeyEvent', {type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode}); await pause(80);
  };
  const panelOpen = () => run(`!!document.querySelector('[role=dialog][aria-label="서식"]')`);
  const data = () => run('window.editor().getData()');
  const blocks = () => run('window.lastChange && window.lastChange.blocks');
  /* 편집기 안 첫 문단 글자 위 좌표에서 우클릭(contextmenu). */
  const rightClickParagraph = async (index, modifiers = 0) => {
    const c = await run(`(()=>{const p=document.querySelectorAll('.ck-editor__editable > p')[${index}];const r=p.getBoundingClientRect();return {x:r.left+${'Math.min(30, r.width/2)'}+parseFloat(getComputedStyle(p).marginLeft||0)*0,y:r.top+r.height/2};})()`);
    await clickAt(c.x, c.y, 'right', modifiers); await pause(150);
  };
  const waitEditor = async () => { for (let i = 0; i < 100; i++) { if (await run('!!window.editor()')) return; await pause(100); } throw Error('editor not ready: ' + errors.join(' | ') + ' / ' + await run('document.body.innerHTML.slice(0, 600)')); };

  const errors = [];
  socket.on('message', raw => { const m = JSON.parse(raw); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 900, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mount === "function"')) break; await pause(100);}

  // ── 1. 변환: 문단 속성 indent ↔ margin-left, plainText 무영향, 계약 밖 값 정리 ──
  check(await run(`(()=>{const b=[{alignment:'LEFT',indent:1,runs:[{text:'하나'}]},{alignment:'CENTER',indent:5,runs:[{text:'다섯',bold:true}]},{alignment:'RIGHT',runs:[]},{alignment:'LEFT',runs:[{text:'일반'}]}];
    const html=blocksToHtml(b);return html.includes('<p style="margin-left:40px;">')&&html.includes('text-align:center;margin-left:200px;')&&JSON.stringify(htmlToBlocks(html))===JSON.stringify(b)
      &&blocksToPlainText(b)==='하나\\n다섯\\n\\n일반';})()`), 'blocks ↔ HTML round trip keeps indent; plainText has no indent spaces');
  check(await run(`[indentFromCss('40px'),indentFromCss('80px'),indentFromCss('60px'),indentFromCss('400px'),indentFromCss('440px'),indentFromCss('2em'),indentFromCss('-40px'),indentFromCss(''),indentFromCss(undefined),indentFromCss('99999999999999999999px')].join()==='1,2,2,10,11,0,0,0,0,0'`),
    '[63] margin-left px maps to level without a level limit (rounded); other units and out-of-range numbers are 0');
  check(await run(`JSON.stringify(readTextBlocks([{alignment:'LEFT',indent:2,runs:[]},{alignment:'LEFT',indent:6,runs:[]},{alignment:'LEFT',indent:11,runs:[]},{alignment:'LEFT',indent:1.5,runs:[]},{alignment:'LEFT',indent:'1',runs:[]},{alignment:'LEFT',indent:0,runs:[]},{alignment:'LEFT',indent:-1,runs:[]},{alignment:'LEFT',indent:Infinity,runs:[]},{alignment:'LEFT',indent:2147483648,runs:[]}]).map(b=>b.indent??0))==='[2,6,11,0,0,0,0,0,0]'`),
    '[63] readTextBlocks keeps levels above 5 and drops non-integer, negative, non-finite and out-of-range values');
  check(await run(`JSON.stringify(htmlToBlocks('<ul><li style="margin-left:40px">목록</li></ul><p style="margin-left:80px; text-indent:20px">문단</p>').map(b=>b.indent??0))==='[0,2]'`),
    'List item margin is not paragraph indent; text-indent is not read');

  // ── 2. 실제 편집기: 기존 데이터 재편집·들여쓰기 명령(단계 수 제한 없음, TODO63)·내어쓰기·서식 지우기·실행 취소 ──
  await run(`window.mount([{alignment:'LEFT',runs:[{text:'첫 문단 글자',bold:true}]},{alignment:'LEFT',indent:2,runs:[{text:'둘째'}]},{alignment:'CENTER',runs:[{text:'셋째'}]}])`);
  await waitEditor(); await pause(200);
  check((await data()).includes('<p style="margin-left:80px;">둘째</p>'), 'Saved indent reloads into editor as margin-left 80px');
  const toolbarLabels = await run(`Array.from(window.editor().ui.view.toolbar.items).map(i=>i.label||'')`);
  check(toolbarLabels.some(l => /^(Increase indent|들여쓰기 늘리기)$/i.test(l)) && toolbarLabels.some(l => /^(Decrease indent|들여쓰기 줄이기)$/i.test(l)),
    'Toolbar shows indent/outdent buttons: ' + toolbarLabels.join('|'));
  await run('window.select(0, 0)'); await run(`window.editor().execute('indent')`); await pause(100);
  check((await data()).startsWith('<p style="margin-left:40px;">'), 'First indent writes margin-left 40px on the paragraph');
  check(JSON.stringify((await blocks()).map(b => b.indent ?? 0)) === '[1,2,0]' && (await run('window.lastChange.plainText')) === '첫 문단 글자\n둘째\n셋째',
    'Editor change emits paragraph indent and unchanged plainText');
  for (let i = 0; i < 6; i++) await run(`window.editor().execute('indent')`);
  check((await blocks())[0].indent === 7 && (await data()).startsWith('<p style="margin-left:280px;">'), '[63] Repeated indent continues past level 5 (7 = 280px)');
  check(await run(`window.editor().commands.get('indent').isEnabled && window.editor().commands.get('indentBlock').isEnabled && window.editor().commands.get('outdent').isEnabled`),
    '[63] Indent command stays enabled above level 5, outdent stays enabled');
  for (let i = 0; i < 4; i++) await run(`window.editor().execute('indent')`);
  check((await blocks())[0].indent === 11 && (await data()).startsWith('<p style="margin-left:440px;">'), '[63] Level 10 → 11 (440px) keeps 40px steps without clamp');
  await run('window.select(0, 0)'); await run(`window.editor().execute('outdent')`); await pause(50);
  check((await blocks())[0].indent === 10, 'Outdent decreases one level');
  check(!toolbarLabels.some(l => /^(Remove Format|서식 지우기|서식 제거)$/i.test(l)), '[66] Toolbar has no bulk remove-format button');
  check(await run(`(()=>{const sep=Array.from(window.editor().ui.view.toolbar.items).map(i=>i.element.classList.contains('ck-toolbar__separator'));
    return !sep[0]&&!sep[sep.length-1]&&sep.every((v,i)=>!(v&&sep[i+1]));})()`), '[66] Toolbar has no leading/trailing/consecutive separators');
  await run(`window.editor().execute('undo')`); await pause(50);
  check((await blocks())[0].indent === 11, 'Undo restores previous indent');
  await run(`window.editor().setData('<p style="margin-left:300px">붙여넣음</p><p style="margin-left:2em">em</p><p style="margin-left:60px">육십</p><p style="margin-left:99999999999999999999px">과대</p>')`); await pause(100);
  check(JSON.stringify((await blocks()).map(b => b.indent ?? 0)) === '[8,0,2,0]' && (await data()).includes('margin-left:320px'),
    '[63] Loaded/pasted margins are normalized in the model (40px steps, no level limit, non-px and out-of-range removed)');

  // ── 3. 우클릭 펼침 서식 패널 ──
  await run(`window.mount([{alignment:'LEFT',runs:[{text:'가나다라마바사'},{text:'굵은글자',bold:true}]},{alignment:'LEFT',indent:1,runs:[{text:'둘째 문단'}]}])`);
  await waitEditor(); await pause(200);
  await run('window.editor().editing.view.focus()'); await run('window.select(0, 0, 3)');
  await rightClickParagraph(0);
  check(await panelOpen(), 'Right click opens the format panel');
  const layout = await run(`(()=>{const p=document.querySelector('[role=dialog][aria-label="서식"]');const cells=p.querySelectorAll('[data-color-cell]');
    const rows=new Set(Array.from(cells).map(c=>Math.round(c.getBoundingClientRect().top)));
    return {cells:cells.length,rows:rows.size,font:!!p.querySelector('select[aria-label^="글꼴"]'),size:!!p.querySelector('select[aria-label^="크기"]'),
      b:!!p.querySelector('[aria-label^="굵게"]'),i:!!p.querySelector('[aria-label^="기울임"]'),u:!!p.querySelector('[aria-label^="밑줄"]'),
      reset:Array.from(p.querySelectorAll('button')).some(b=>b.textContent.includes('색 초기화')),clear:Array.from(p.querySelectorAll('button')).some(b=>b.textContent.includes('서식 초기화')),
      focus:document.activeElement?.hasAttribute('data-color-cell'),labels:Array.from(cells).every(c=>c.getAttribute('aria-label').startsWith('글자 색 '))};})()`);
  check(layout.cells === 40 && layout.rows === 5 && layout.font && layout.size && layout.b && layout.i && layout.u && !layout.reset && !layout.clear && layout.labels,
    '[66] Panel shows the expanded 8x5 color grid with font, size, B/I/U and no color reset / format clear: ' + JSON.stringify(layout));
  check(layout.focus, 'Opening the panel focuses the color grid');
  check(await run(`['#111827','#6B7280','#DC2626','#EA580C','#CA8A04','#16A34A','#2563EB','#7C3AED'].every(c=>RICH_COLORS.some(x=>x.color===c))`), 'Existing 8 colors stay in the palette');
  await click('[data-color-cell][aria-label="글자 색 빨강"]');
  check(await panelOpen(), 'Panel stays open after applying a color');
  check((await blocks())[0].runs[0].text === '가나다' && (await blocks())[0].runs[0].color === '#DC2626' && (await blocks())[0].runs[1].color === undefined,
    'Color applies only to the selected range');
  check(await run(`window.selectionText()==='가나다'`), 'Selection is preserved after panel interaction');
  check(await run(`document.querySelector('[data-color-cell][aria-label="글자 색 빨강"]').getAttribute('aria-pressed')==='true'`), 'Panel shows current color as selected');
  await click('[aria-label^="굵게"]');
  check((await blocks())[0].runs[0].bold === true && (await blocks())[0].runs[0].color === '#DC2626' && await panelOpen(), 'Bold applies to same selection, panel stays open');
  await run(`(()=>{const s=document.querySelector('select[aria-label^="크기"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'24');s.dispatchEvent(new Event('change',{bubbles:true}));})()`); await pause(100);
  await run(`(()=>{const s=document.querySelector('select[aria-label^="글꼴"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'BATANG');s.dispatchEvent(new Event('change',{bubbles:true}));})()`); await pause(100);
  let first = (await blocks())[0].runs[0];
  check(first.text === '가나다' && first.size === 24 && first.font === 'BATANG' && await panelOpen(), 'Size and font selects apply to selection: ' + JSON.stringify(first));
  await click('[aria-label^="기울임"]'); await click('[aria-label^="밑줄"]');
  first = (await blocks())[0].runs[0];
  check(first.italic === true && first.underline === true, 'Italic and underline toggle from the panel');
  // [66] 초기화 버튼 대신 기능별 버튼·기본값 선택으로 되돌린다.
  await click('[aria-label^="굵게"]'); await click('[aria-label^="기울임"]'); await click('[aria-label^="밑줄"]');
  await run(`(()=>{for(const l of ['크기','글꼴']){const s=document.querySelector('select[aria-label^="'+l+'"]');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'');s.dispatchEvent(new Event('change',{bubbles:true}));}})()`); await pause(100);
  check(JSON.stringify((await blocks())[0].runs) === JSON.stringify([{text: '가나다', color: '#DC2626'}, {text: '라마바사'}, {text: '굵은글자', bold: true}]) && await panelOpen(),
    '[66] Individual toggles and default font/size selection revert formats without a clear button: ' + JSON.stringify((await blocks())[0].runs));
  await run(`window.editor().execute('undo')`); await pause(50);
  check((await blocks())[0].runs[0].font === 'BATANG', '[66] Undo restores the last individual format change');
  await run(`window.editor().execute('redo')`); await pause(50);
  // 키보드: 방향키 이동·Enter 적용·Esc 닫기 후 편집기 포커스 복귀
  await run(`document.querySelector('[data-color-cell]').focus()`);
  await key('ArrowRight', 'ArrowRight', 39); await key('ArrowDown', 'ArrowDown', 40);
  check(await run(`document.activeElement===document.querySelectorAll('[data-color-cell]')[9]`), 'Arrow keys move inside the color grid');
  await key('Enter', 'Enter', 13);
  check((await blocks())[0].runs[0].color === (await run('RICH_COLORS[9].color')) && await panelOpen(), 'Enter applies the focused color and keeps the panel');
  await key('Escape', 'Escape', 27);
  check(!(await panelOpen()) && await run(`document.activeElement?.classList.contains('ck-editor__editable')`) && await run(`window.selectionText()==='가나다'`),
    'Escape closes the panel and returns focus to the editor selection');
  // 혼합 서식 표시
  await run('window.select(0, 5, 9)'); await rightClickParagraph(0);
  check(await run(`document.querySelector('[aria-label^="굵게"]').getAttribute('aria-pressed')==='mixed' && document.querySelector('[aria-label="굵게 (혼합)"]')!==null`),
    'Mixed bold selection is shown as mixed');
  // 바깥 클릭 닫기
  await click('#outside');
  check(!(await panelOpen()), 'Outside click closes the panel');
  // 커서만 있을 때: 이후 입력 서식으로 적용
  await run('window.editor().editing.view.focus()'); await run('window.select(1, 2)'); await rightClickParagraph(1);
  await click('[data-color-cell][aria-label="글자 색 파랑"]');
  check(await run(`window.editor().model.document.selection.getAttribute('fontColor')==='#2563EB' && window.editor().model.document.selection.isCollapsed`),
    'Collapsed cursor keeps CKEditor meaning (format for next typing)');
  await key('Escape', 'Escape', 27);
  // '서식' 버튼 진입
  await run('window.select(0, 0, 2)');
  await click('button[aria-haspopup="dialog"]');
  check(await panelOpen() && await run(`document.activeElement?.hasAttribute('data-color-cell')`), "'서식' button opens the same panel with keyboard focus");
  await key('Escape', 'Escape', 27);
  // 키보드 진입(Shift+F10 = contextmenu 이벤트, 좌표 0)
  await run(`window.editor().editing.view.focus()`); await run('window.select(0, 0, 2)');
  await run(`document.querySelector('.ck-editor__editable').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:0,clientX:0,clientY:0}))`); await pause(150);
  check(await panelOpen(), 'Keyboard context menu opens the panel near the caret');
  await key('Escape', 'Escape', 27);
  // Shift+우클릭은 브라우저 기본 메뉴(이벤트를 막지 않음)
  check(await run(`(()=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:50,clientY:50,shiftKey:true});document.querySelector('.ck-editor__editable').dispatchEvent(e);return !e.defaultPrevented;})()`)
    && !(await panelOpen()), 'Shift+right click keeps the browser menu');
  // 화면 가장자리에서도 패널이 화면 안에 있다
  await run(`document.querySelector('.ck-editor__editable').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:995,clientY:895}))`); await pause(200);
  const edge = await run(`(()=>{const r=document.querySelector('[role=dialog][aria-label="서식"]').getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom};})()`);
  check(edge.l >= 0 && edge.t >= 0 && edge.r <= 1000 && edge.b <= 900, 'Panel stays inside the viewport at the screen edge: ' + JSON.stringify(edge));
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'panel-edge.png'), Buffer.from(shot.data, 'base64'));
  await key('Escape', 'Escape', 27);
  // 읽기 전용: 우클릭·버튼으로 열리지 않음
  await run(`window.mount([{alignment:'LEFT',runs:[{text:'읽기 전용'}]}], true)`); await waitEditor(); await pause(200);
  await run(`document.querySelector('.ck-editor__editable').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:100,clientY:100}))`); await pause(150);
  check(!(await panelOpen()) && await run(`document.querySelector('button[aria-haspopup="dialog"]').disabled && window.editor().isReadOnly`), 'Read-only editor does not open the panel');

  // ── 4. 미리보기: 문단 전체 왼쪽 여백(줄바꿈 줄 포함) ──
  const long = '가나다라마 '.repeat(30);
  await run(`window.mount([], false, [{alignment:'LEFT',indent:1,runs:[{text:${JSON.stringify(long)}}]},{alignment:'LEFT',runs:[{text:'일반'}]},{alignment:'CENTER',indent:11,runs:[{text:'가운데'}]}])`); await pause(300);
  const preview = await run(`(()=>{const ps=Array.from(document.querySelectorAll('#preview .MuiTypography-root')).filter(e=>e.querySelector('span'));
    const span=ps[0].querySelector('span');const rects=Array.from(span.getClientRects());const base=ps[0].getBoundingClientRect().left, lines=new Map();for(const r of rects){const top=Math.round(r.top);lines.set(top,Math.min(lines.get(top)??Infinity,Math.round(r.left-base)));}return {pad:ps.map(p=>getComputedStyle(p).paddingLeft),lines:lines.size,lefts:[...new Set(lines.values())]};})()`);
  check(preview.pad.join() === '40px,0px,440px' && preview.lines >= 3 && preview.lefts.length === 1 && preview.lefts[0] === 40,
    'Preview indents the whole paragraph including wrapped lines: ' + JSON.stringify(preview));
  // ── 5. TODO62: 취소선 왕복·문단 메뉴(서식 초기화는 TODO66에서 삭제) ──
  check(await run(`(()=>{const b=htmlToBlocks('<p><s>취소</s><del>삭제</del><strike>구형</strike>일반</p>');
    return b[0].runs.length===2&&b[0].runs[0].text==='취소삭제구형'&&b[0].runs[0].strikethrough===true&&!b[0].runs[1].strikethrough;})()`),
    '[62] s/del/strike become strikethrough and adjacent runs with different styles stay separate');
  check(await run(`(()=>{const b=[{alignment:'RIGHT',indent:1,runs:[{text:'<기존> & 새 값',underline:true,strikethrough:true}]}];
    const restored=htmlToBlocks(blocksToHtml(b));return blocksToHtml(restored)===blocksToHtml(b)
      &&restored[0].runs[0].underline&&restored[0].runs[0].strikethrough&&blocksToPlainText(restored)==='<기존> & 새 값';})()`),
    '[62] combined underline/strikethrough round trip escapes text and preserves paragraph properties/plainText');
  check(await run(`(()=>{const b=readTextBlocks([{runs:[{text:'a',strikethrough:true},{text:'b',strikethrough:false},{text:'c',strikethrough:'true'},{text:'d'}]}]);
    return b[0].runs[0].strikethrough===true&&b[0].runs.slice(1).every(r=>r.strikethrough===undefined);})()`),
    '[62] stored run reader keeps only true boolean and supports older data');

  await run(`window.mount([{alignment:'LEFT',runs:[{text:'가나다라마바사'}]},{alignment:'RIGHT',indent:1,runs:[{text:'둘째 문단'}]}])`);
  await waitEditor(); await pause(200);
  check(await run(`!!window.editor().commands.get('strikethrough')&&Array.from(window.editor().ui.view.toolbar.items).some(i=>/Strikethrough|취소선/i.test(i.label??''))`),
    '[62] existing editor build supports strikethrough and the toolbar exposes it');
  await run('window.editor().editing.view.focus();window.select(0,0,3)');
  await click('button[aria-haspopup="dialog"]');
  check(await run(`(()=>{const p=document.querySelector('[role=dialog][aria-label="서식"]');
    const texts=Array.from(p.querySelectorAll('button')).map(b=>b.textContent);
    return p.querySelector('[aria-label="취소선"]')&&['내어쓰기','들여쓰기','왼쪽 정렬','가운데 정렬','오른쪽 정렬'].every(l=>p.querySelector('[aria-label="'+l+'"]'))
      &&!texts.some(t=>t.includes('초기화'))&&p.querySelectorAll('.MuiDivider-root').length===2;})()`),
    '[62·66] menu contains paragraph controls, no reset buttons and no leftover divider');
  await click('[aria-label="취소선"]');
  check((await blocks())[0].runs[0].strikethrough===true && (await blocks())[0].runs[0].text==='가나다'
    && !(await blocks())[0].runs[1].strikethrough && await run(`window.selectionText()==='가나다'`),
    '[62] strikethrough applies only to selection without losing it');
  await click('[aria-label="밑줄"]');
  check((await blocks())[0].runs[0].underline===true && (await blocks())[0].runs[0].strikethrough===true,
    '[62] panel can combine underline and strikethrough');
  await click('[aria-label="가운데 정렬"]'); await click('[aria-label="들여쓰기"]');
  check((await blocks())[0].alignment==='CENTER' && (await blocks())[0].indent===1
    && (await blocks())[1].alignment==='RIGHT' && await panelOpen(), '[62] paragraph actions affect selected paragraph only and keep panel open');
  await click('[aria-label="취소선"]'); await click('[aria-label="밑줄"]');
  check((await blocks())[0].alignment==='CENTER' && (await blocks())[0].indent===1
    && JSON.stringify((await blocks())[0].runs)===JSON.stringify([{text:'가나다라마바사'}]),
    '[66] individual toggles remove character formatting while keeping alignment and indent');
  await click('[aria-label="내어쓰기"]');
  check(!(await blocks())[0].indent && await run(`document.querySelector('[aria-label="내어쓰기"]').disabled`),
    '[62] outdent reaches zero and becomes disabled: '+JSON.stringify({blocks:await blocks(),disabled:await run(`document.querySelector('[aria-label="내어쓰기"]').disabled`),command:await run(`window.editor().commands.get('outdent').isEnabled`)}));
  for(let i=0;i<6;i++) await click('[aria-label="들여쓰기"]');
  check((await blocks())[0].indent===6 && (await data()).includes('margin-left:240px') && !(await run(`document.querySelector('[aria-label="들여쓰기"]').disabled`))
    && await run(`document.querySelector('[aria-label="문단 서식"]').previousElementSibling.textContent.includes('6단계')&&!document.querySelector('[aria-label="문단 서식"]').previousElementSibling.textContent.includes('/')`),
    '[63] menu indent passes five (6 = 240px), stays enabled and shows the level without a maximum');
  await key('Escape', 'Escape', 27);
  await run(`window.select(0,0,2,1)`); await click('button[aria-haspopup="dialog"]');
  check(await run(`['왼쪽 정렬','가운데 정렬','오른쪽 정렬'].every(l=>document.querySelector('[aria-label="'+l+'"]').getAttribute('aria-pressed')==='mixed')
    &&document.querySelector('[aria-label="문단 서식"]').previousElementSibling.textContent.includes('혼합')`),
    '[62] multi-paragraph mixed alignment and indent are represented as mixed');
  await click('[aria-label="오른쪽 정렬"]'); await click('[aria-label="내어쓰기"]');
  check(JSON.stringify((await blocks()).map(b=>[b.alignment,b.indent??0]))==='[["RIGHT",5],["RIGHT",0]]',
    '[62] paragraph actions apply to every selected paragraph and preserve independent indent levels');
  await key('Escape', 'Escape', 27);
  await run(`window.editor().execute('undo')`); await pause(80);
  check(JSON.stringify((await blocks()).map(b=>b.indent??0))==='[6,1]', '[62] undo restores multi-paragraph indent');
  await run(`window.editor().execute('redo')`); await pause(80);
  check(JSON.stringify((await blocks()).map(b=>b.indent??0))==='[5,0]', '[62] redo reapplies multi-paragraph indent');
  await run(`window.select(1,0)`); await click('button[aria-haspopup="dialog"]'); await click('[aria-label="취소선"]');
  check(await run(`window.editor().model.document.selection.isCollapsed&&window.editor().model.document.selection.getAttribute('strikethrough')===true`),
    '[62] collapsed cursor toggles strikethrough for the next typing');
  await key('Escape', 'Escape', 27);
  await run(`window.editor().model.change(w=>w.insertText('새',{strikethrough:true},window.editor().model.document.selection.getFirstPosition()))`); await pause(80);
  const saved = await blocks();
  await run(`window.mount(${JSON.stringify(saved)}, false, ${JSON.stringify(saved)})`); await waitEditor(); await pause(250);
  check(await run(`htmlToBlocks(window.editor().getData())[1].runs.some(r=>r.text==='새'&&r.strikethrough===true)`),
    '[62] saved strikethrough reloads into the editor');
  const decorated = [{alignment:'RIGHT',indent:1,runs:[{text:'밑줄 취소선',underline:true,strikethrough:true}]}];
  await run(`window.mount([],false,${JSON.stringify(decorated)})`); await waitEditor(); await pause(250);
  check(await run(`['#preview','#rich-blocks-preview'].every(s=>{const e=Array.from(document.querySelectorAll(s+' span')).find(e=>e.children.length===0&&e.textContent==='밑줄 취소선');
    const d=getComputedStyle(e).textDecorationLine;return d.includes('underline')&&d.includes('line-through');})`),
    '[62] TEXT and shared survey/quiz preview display both decorations together');
  check(errors.length===0,'[62] no browser runtime errors: '+errors.join(' | '));
  const finalShot = await send('Page.captureScreenshot', {format:'png'});
  fs.writeFileSync(path.join(output,'preview-62.png'),Buffer.from(finalShot.data,'base64'));
  console.log('PASS: ' + checks + ' rich text 49/62 checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
