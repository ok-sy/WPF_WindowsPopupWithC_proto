// POL-06-01 : 문항·서식
// ■ 설문·퀴즈 문항·선택지 서식 편집(여러 CKEditor 분리)과 미리보기 서식 표시를 실제 관리자 편집기 빌드로 확인한다(Windows headless Edge).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-survey-rich-text-55.cjs
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/survey-rich55');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// next/dynamic은 Next 런타임 밖에서 React.lazy로 대신한다.
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
const bold = text => ({alignment: 'LEFT', runs: [{text, bold: true}]});
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-survey-rich-text-55-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9355', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9355/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map(), errors = [];
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const mouse = async (type, x, y, button = 'left') => send('Input.dispatchMouseEvent', {type, x, y, button, buttons: button === 'right' ? 2 : 1, clickCount: 1});
  const clickAt = async (x, y, button = 'left') => { await mouse('mousePressed', x, y, button); await mouse('mouseReleased', x, y, button); await pause(150); };
  const click = async selector => { const c = await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`); await clickAt(c.x, c.y); };
  const panelOpen = () => run(`!!document.querySelector('[role=dialog][aria-label="서식"]')`);
  const questions = () => run('window.questions');
  const waitEditors = async count => { for (let i = 0; i < 100; i++) { if (await run(`window.editors().filter(Boolean).length`) === count) return; await pause(100); }
    throw Error('editors not ready: ' + errors.join(' | ')); };

  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 1400, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mountEditor === "function"')) break; await pause(100);}

  // ── 1. 문항 1개: 제목(서식)·설명(일반)·선택지 3개(서식/일반/일반) → 편집기 5개, 툴바 숨김, 기존 값 표시 ──
  await run(`window.mountEditor(${JSON.stringify([{questionId: 11, title: '만족도', titleBlocks: [bold('만족도')], description: '설명 문장',
    questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: false, sortOrder: 1, options: [
      {optionId: 101, value: '1', text: '매우 그렇다', sortOrder: 1, isCorrect: false, textBlocks: [{alignment: 'LEFT', runs: [{text: '매우 '}, {text: '그렇다', color: '#DC2626'}]}]},
      {optionId: 102, value: '2', text: '보통', sortOrder: 2, isCorrect: false},
      {optionId: 103, value: '3', text: '아니다', sortOrder: 3, isCorrect: false}]}])})`);
  await waitEditors(5); await pause(200);
  const datas = await run('window.editors().map(e=>e.getData())');
  check(datas[0].includes('<strong>만족도</strong>') && datas[1] === '<p>설명 문장</p>' && datas[2].includes('color:#DC2626') && datas[3] === '<p>보통</p>',
    'Saved title/option formatting and legacy plain text load into separate editors: ' + JSON.stringify(datas));
  check(await run(`Array.from(document.querySelectorAll('.ck-toolbar')).every(t=>!t.offsetParent)`), 'Compact editors hide the toolbar (format via panel)');

  // ── 2. 한 선택지 편집이 다른 필드에 섞이지 않는다 ──
  await run(`window.editors()[3].setData('<p>보통<strong>이다</strong></p>')`); await pause(150);
  let q = (await questions())[0];
  check(q.options[1].text === '보통이다' && q.options[1].textBlocks[0].runs[1].bold === true, 'Option editor change updates only its option text and blocks');
  check(q.options[0].text === '매우 그렇다' && q.options[2].text === '아니다' && q.options[2].textBlocks == null && q.title === '만족도', 'Other fields stay unchanged');

  // ── 3. 펼침 서식 패널: 선택지 3의 선택 범위에만 색 적용, 제목 편집기 선택과 분리 ──
  await run('window.select(4, 0, 0, 2)');
  const r = await run(`(()=>{const p=document.querySelectorAll('.ck-editor__editable')[4].querySelector('p');const b=p.getBoundingClientRect();return {x:b.left+8,y:b.top+b.height/2};})()`);
  await clickAt(r.x, r.y, 'right'); await pause(150);
  check(await panelOpen(), 'Right click in an option editor opens the format panel');
  await run('window.select(4, 0, 0, 2)');
  await click('[data-color-cell][aria-label="글자 색 파랑"]');
  q = (await questions())[0];
  check(q.options[2].textBlocks?.[0].runs[0].color === '#2563EB' && q.options[2].text === '아니다', 'Panel color applies to the third option only: ' + JSON.stringify(q.options[2]));
  check(JSON.stringify(q.titleBlocks) === JSON.stringify([bold('만족도')]) && q.options[0].textBlocks[0].runs[1].color === '#DC2626', 'Title and other option formatting are unaffected');
  await run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await click('#outside'); await pause(100);

  // ── 4. 선택지 삭제 후에도 편집기가 ID로 남는다(순서 index로 섞이지 않음) ──
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')==='선택지 1 삭제').click()`); await pause(200);
  await waitEditors(4);
  const after = await run('window.editors().map(e=>e.getData())');
  check(after[2].includes('보통<strong>이다</strong>') && after[3].includes('color:#2563EB'), 'After deleting option 1 the remaining editors keep their own content: ' + JSON.stringify(after));
  await run(`window.editors()[2].setData('<p>수정</p>')`); await pause(150);
  q = (await questions())[0];
  check(q.options.length === 2 && q.options[0].optionId === 102 && q.options[0].text === '수정' && q.options[1].text === '아니다', 'Edits after deletion go to the right option by ID');

  // ── 5. 비우면 서식을 보내지 않고 일반 문자열도 빈 값(저장 전 검증이 막는다) ──
  await run(`window.editors()[1].setData('')`); await pause(150);
  q = (await questions())[0];
  check(q.description === '' && q.descriptionBlocks == null, 'Clearing the description sends no blocks');
  await run(`window.editors()[0].setData('')`); await pause(150);
  check(await run(`window.validatePopupQuestions(window.questions,false)`) === '1번 문항: 제목을 입력해 주세요.', 'Empty formatted title is rejected before save');
  await run(`window.editors()[0].setData('<p>${'가'.repeat(1001)}</p>')`); await pause(150);
  check(await run(`window.validatePopupQuestions(window.questions,false)`) === '1번 문항: 제목은 1000자 이하로 입력해 주세요.', 'Title length is checked like the server');
  await run(`window.editors()[0].setData('<p>첫 줄</p><p><i>둘째 줄</i></p>')`); await pause(150);
  q = (await questions())[0];
  check(q.title === '첫 줄\n둘째 줄' && q.titleBlocks.length === 2 && q.titleBlocks[1].runs[0].italic === true, 'Multiple paragraphs are kept (plain text joined by newline)');

  // ── 6. 새 문항·선택지 추가: 임시 ID가 겹치지 않아 편집기가 따로 생긴다 ──
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='선택지 추가').click()`); await pause(50);
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='선택지 추가').click()`); await pause(300);
  q = (await questions())[0];
  check(new Set(q.options.map(o => o.optionId)).size === 4, 'Rapidly added options get distinct temporary IDs');
  await waitEditors(6);

  // ── 7. 미리보기: 콘텐츠 제목·설명, 문항 제목(필수 * 마지막 문단 끝)·설명, 선택지 서식 표시와 접근성 이름 ──
  const popup = {popupId: 'S', popupType: 'SURVEY', title: 'S', sizeMode: 'FIXED', width: 720, height: 900, showHeader: false, showFooter: true,
    content: {surveyTitle: '교육 만족도', surveyTitleBlocks: [{alignment: 'LEFT', runs: [{text: '교육 '}, {text: '만족도', color: '#16A34A'}]}],
      description: '안내', descriptionBlocks: [{alignment: 'LEFT', runs: [{text: '안내', italic: true}]}]},
    questions: [{questionId: 1, title: '첫 줄\n둘째', titleBlocks: [{alignment: 'LEFT', runs: [{text: '첫 줄'}]}, {alignment: 'CENTER', indent: 1, runs: [{text: '둘째', underline: true}]}],
      description: '문항 설명', descriptionBlocks: [{alignment: 'LEFT', runs: [{text: '문항 설명', size: 18}]}],
      questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: false, sortOrder: 1,
      options: [{optionId: 5, value: '1', text: '매우 그렇다', sortOrder: 1, textBlocks: [{alignment: 'LEFT', runs: [{text: '매우 '}, {text: '그렇다', bold: true}]}]},
        {optionId: 6, value: '2', text: '아니다', sortOrder: 2}]},
      {questionId: 2, title: '일반 제목', questionType: 'TEXT', isRequired: false, isScored: false, sortOrder: 2, options: []}]};
  await run(`window.mountPreview(${JSON.stringify(popup)})`); await pause(400);
  const preview = await run(`(()=>{const root=document.querySelector('#preview');const h=root.querySelector('h5');
    const title=document.getElementById('preview-question-1')||root.querySelector('[id$="-question-1"]');
    const spans=s=>Array.from(s.querySelectorAll('span')).map(e=>({t:e.textContent,c:getComputedStyle(e).color,w:getComputedStyle(e).fontWeight,u:getComputedStyle(e).textDecorationLine,i:getComputedStyle(e).fontStyle}));
    const paragraphs=Array.from(title.querySelectorAll(':scope > span > span'));
    const input=root.querySelector('input[type=radio]');const optionSpans=spans(input.parentElement);
    return {h:h.textContent,hGreen:spans(h).some(s=>s.t==='만족도'&&s.c==='rgb(22, 163, 74)'),
      desc:spans(root).some(s=>s.t==='안내'&&s.i==='italic'),
      paragraphs:paragraphs.map(p=>({t:p.textContent,a:getComputedStyle(p).textAlign,pl:getComputedStyle(p).paddingLeft})),
      underline:spans(title).some(s=>s.t==='둘째'&&s.u==='underline'),
      qdesc:Array.from(root.querySelectorAll('span')).some(e=>e.textContent==='문항 설명'&&!e.children.length&&getComputedStyle(e).fontSize==='18px'),
      aria:input.getAttribute('aria-label'),optionBold:optionSpans.some(s=>s.t==='그렇다'&&Number(s.w)>=700),
      plainTitle:root.textContent.includes('일반 제목')};})()`);
  check(preview.h === '교육 만족도' && preview.hGreen, 'Preview shows the formatted content title: ' + JSON.stringify(preview));
  check(preview.desc, 'Preview shows the formatted content description');
  check(preview.paragraphs.length === 2 && preview.paragraphs[0].t === '첫 줄' && preview.paragraphs[1].t.startsWith('둘째 *') && preview.paragraphs[1].t.includes('하나 선택')
    && preview.paragraphs[1].a === 'center' && preview.paragraphs[1].pl === '40px',
    'Question title keeps paragraphs, alignment, indent; required * and hint follow the last paragraph: ' + JSON.stringify(preview.paragraphs));
  check(preview.underline && preview.qdesc, 'Question title/description run formatting is shown');
  check(preview.aria === '매우 그렇다' && preview.optionBold, 'Formatted option shows formatting and keeps the plain accessible name');
  check(preview.plainTitle, 'Questions without formatting show the plain title');

  // ── 8. VIDEO+QUIZ: 서식 설명은 영상 영역(일반 문자열)과 표시가 달라 퀴즈 머리말에서 숨기지 않는다(WPF와 같음) ──
  const videoQuiz = {...popup, popupType: 'QUIZ', passingScore: 0, content: {...popup.content, videoEnabled: true, videoUrl: 'http://127.0.0.1:1/none.mp4', showDescription: true}};
  await run(`window.mountPreview(${JSON.stringify(videoQuiz)})`); await pause(400);
  check(await run(`Array.from(document.querySelectorAll('#preview span')).some(e=>e.textContent==='안내'&&getComputedStyle(e).fontStyle==='italic')`),
    'VIDEO+QUIZ keeps the formatted quiz description');
  const plainVideoQuiz = {...videoQuiz, content: {...videoQuiz.content, descriptionBlocks: null}};
  await run(`window.mountPreview(${JSON.stringify(plainVideoQuiz)})`); await pause(400);
  check(await run(`(document.querySelector('#preview').textContent.match(/안내/g)||[]).length`) === 1, 'VIDEO+QUIZ still hides the same plain description');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'video-quiz-preview.png'), Buffer.from(shot.data, 'base64'));
  await run(`window.mountPreview(${JSON.stringify(popup)})`); await pause(400);
  const shot2 = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'survey-preview.png'), Buffer.from(shot2.data, 'base64'));
  check(!errors.length, 'No page exceptions: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' survey rich text 55 checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
