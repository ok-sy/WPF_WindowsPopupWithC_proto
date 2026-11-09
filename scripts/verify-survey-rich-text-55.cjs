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
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/components/ckeditor$': path.join(root, 'zero-rule-web/main/src/components/ckeditor'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/},
      // CKEditor 공통 엔진(ckeditor5)의 CSS를 style 태그로 넣는다.
      {test: /\.css$/, use: path.join(__dirname, 'verify-css-loader.cjs')}]},
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
    if (m.method === 'Runtime.exceptionThrown' && !m.params.exceptionDetails.url?.startsWith('chrome-extension://')) errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const mouse = async (type, x, y, button = 'left') => send('Input.dispatchMouseEvent', {type, x, y, button, buttons: button === 'right' ? 2 : 1, clickCount: 1});
  const clickAt = async (x, y, button = 'left') => { await mouse('mousePressed', x, y, button); await mouse('mouseReleased', x, y, button); await pause(150); };
  const click = async selector => { const c = await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`); await clickAt(c.x, c.y); };
  const panelOpen = () => run(`!!document.querySelector('[role=dialog][aria-label="서식"]')`);
  const questions = () => run('window.questions');
  const waitEditors = async count => { for (let i = 0; i < 100; i++) { if (await run(`window.editors().filter(Boolean).length`) === count) return; await pause(100); }
    throw Error('editors not ready: ' + errors.join(' | ')); };

  // 오류 수집(Runtime.exceptionThrown)은 Edge 기본 확장 프로그램(chrome-extension://) 콘텐츠 스크립트 오류를 제외한다.
  // CKEditor 49는 문서에 포커스가 있어야 편집 영역을 포커스 상태로 본다(headless 창은 포커스가 없어 선택 영역이 그려지지 않음).
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', {enabled: true}); await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 1400, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mountEditor === "function"')) break; await pause(100);}

  // TODO73-28~30: OX 외 문항 제목·선택지는 일반 텍스트 입력(TextField multiline). 퀴즈 OX 문항 제목만 서식 편집기를 유지한다.
  const typeInto = (selector, value) => run(`(()=>{const i=document.querySelector(${JSON.stringify(selector)});
    const proto=i.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`).then(() => pause(150));
  const titleInput = n => `textarea[aria-label="${n}번 문항 제목"]`;
  const optionInput = (n, oi) => `textarea[aria-label="${n}번 문항 선택지 ${oi}"]`;
  const inputValues = () => run(`Array.from(document.querySelectorAll('textarea[aria-label]')).map(t=>t.getAttribute('aria-label')+'='+t.value)`);

  // ── 1. 기존 서식 문항 열기: 일반 문자열 우선 표시, 문자열이 없으면 서식 글자로 복원, 열기만 하면 서식 보존 ──
  const surveyQuestions = [{questionId: 11, title: '만족도', titleBlocks: [bold('만족도')], description: '설명 문장',
    questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: false, sortOrder: 1, options: [
      {optionId: 101, value: '1', text: '매우 그렇다', sortOrder: 1, isCorrect: false, textBlocks: [{alignment: 'LEFT', runs: [{text: '매우 '}, {text: '그렇다', color: '#DC2626'}]}]},
      {optionId: 102, value: '2', text: '보통', sortOrder: 2, isCorrect: false},
      {optionId: 103, value: '3', text: '', sortOrder: 3, isCorrect: false, textBlocks: [bold('첫'), bold('둘')]}]}];
  await run(`window.mountEditor(${JSON.stringify(surveyQuestions)})`); await pause(400);
  check(await run(`document.querySelectorAll('.ck-editor__editable').length`) === 0, '[73-28] Survey title and options use plain inputs, no rich editors');
  let values = await inputValues();
  check(values.join('|') === '1번 문항 제목=만족도|1번 문항 선택지 1=매우 그렇다|1번 문항 선택지 2=보통|1번 문항 선택지 3=첫\n둘', '[73-29] Inputs show plain text first and restore empty text from blocks: ' + JSON.stringify(values));
  let q = (await questions())[0];
  check(JSON.stringify(q) === JSON.stringify(surveyQuestions[0]), '[73-29] Opening only keeps the saved data and formatting untouched');

  // ── 2. 한 선택지 수정: 그 선택지 text만 바뀌고 서식은 비운다. 다른 필드·서식은 유지 ──
  await typeInto(optionInput(1, 1), '매우 그렇다!');
  q = (await questions())[0];
  check(q.options[0].text === '매우 그렇다!' && q.options[0].textBlocks === null, '[73-29] Editing an option sets plain text and clears its blocks: ' + JSON.stringify(q.options[0]));
  check(q.options[1].text === '보통' && q.options[2].textBlocks?.length === 2 && JSON.stringify(q.titleBlocks) === JSON.stringify([bold('만족도')]), 'Other options and the title keep their values and formatting');

  // ── 3. 제목 수정·줄바꿈: titleBlocks를 비우고 줄바꿈을 그대로 저장 ──
  await typeInto(titleInput(1), '첫 줄\n둘째 줄');
  q = (await questions())[0];
  check(q.title === '첫 줄\n둘째 줄' && q.titleBlocks === null, '[73-29] Title keeps the newline and clears titleBlocks: ' + JSON.stringify({title: q.title, blocks: q.titleBlocks}));

  // ── 4. 선택지 삭제 후에도 입력칸이 ID로 남는다(순서 index로 섞이지 않음) ──
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')==='선택지 1 삭제').click()`); await pause(200);
  values = await inputValues();
  check(values.slice(1).join('|') === '1번 문항 선택지 1=보통|1번 문항 선택지 2=첫\n둘', 'After deleting option 1 the remaining inputs keep their own content: ' + JSON.stringify(values));
  await typeInto(optionInput(1, 1), '수정');
  q = (await questions())[0];
  check(q.options.length === 2 && q.options[0].optionId === 102 && q.options[0].text === '수정' && q.options[1].textBlocks?.length === 2, 'Edits after deletion go to the right option by ID');

  // ── 5. 설명 보존, 빈 제목·글자 수 상한은 저장 전 검증이 막는다 ──
  check(q.description === '설명 문장' && !(await run(`document.body.textContent.includes('문항 설명')`)), 'The question description input is gone and the stored description is kept (TODO73)');
  await typeInto(titleInput(1), '');
  check(await run(`window.validatePopupQuestions(window.questions,false)`) === '1번 문항: 제목을 입력해 주세요.', 'Empty title is rejected before save');
  await typeInto(titleInput(1), '가'.repeat(1001));
  check(await run(`window.validatePopupQuestions(window.questions,false)`) === '1번 문항: 제목은 1000자 이하로 입력해 주세요.', 'Title length is checked like the server');

  // ── 6. 새 선택지 추가: 임시 ID가 겹치지 않아 입력칸이 따로 생긴다 ──
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='선택지 추가').click()`); await pause(50);
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='선택지 추가').click()`); await pause(300);
  q = (await questions())[0];
  check(new Set(q.options.map(o => o.optionId)).size === 4 && (await inputValues()).length === 5, 'Rapidly added options get distinct temporary IDs and their own inputs');
  // 주관식은 제목만 일반 입력(73-28)
  await run(`window.mountEditor(${JSON.stringify([{questionId: 12, title: '', titleBlocks: [bold('의견')], questionType: 'TEXT', isRequired: false, isScored: false, sortOrder: 1, options: []}])})`); await pause(300);
  check((await inputValues()).join('|') === '1번 문항 제목=의견' && await run(`document.querySelectorAll('.ck-editor__editable').length`) === 0, '[73-28] Survey text question uses a plain title input restored from blocks');

  // ── 6-1. 최대 30문항(TODO73-22·23): N/30 표시, 30개면 추가 비활성, 삭제하면 다시 활성, 31개 유입은 자르지 않고 안내·저장 차단 ──
  const many = n => Array.from({length: n}, (_, i) => ({questionId: 1000 + i, title: '문항' + (i + 1), questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: false, isScored: false, sortOrder: i + 1,
    options: [{optionId: 5000 + i * 2, value: '1', text: '예', sortOrder: 1, isCorrect: false}, {optionId: 5001 + i * 2, value: '2', text: '아니오', sortOrder: 2, isCorrect: false}]}));
  const addButton = `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='문항 추가')`;
  await run(`window.mountEditor(${JSON.stringify(many(29))})`); await pause(800);
  check(await run(`document.body.textContent.includes('설문 문항 29/30') && !${addButton}.disabled`), '[73-23] 29 questions show 29/30 and allow adding');
  await run(`${addButton}.click()`); await pause(500);
  check((await questions()).length === 30 && await run(`document.body.textContent.includes('설문 문항 30/30') && ${addButton}.disabled`), '[73-23] The 30th question disables the add button');
  check(await run(`document.body.textContent.includes('최대 30개까지 추가할 수 있습니다.')`), '[73-23] The reason is shown next to the disabled button');
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.getAttribute('aria-label')==='30번 문항 삭제').click()`); await pause(300);
  check((await questions()).length === 29 && await run(`!${addButton}.disabled`), '[73-23] Deleting back to 29 enables the add button again');
  await run(`window.mountEditor(${JSON.stringify(many(31))}, true)`); await pause(1000);
  q = await questions();
  const overflow = '문항은 최대 30개까지 등록할 수 있습니다. 현재 31개이므로 1개를 삭제한 후 저장해 주세요.';
  check(q.length === 31 && await run(`document.querySelector('[role=alert]')?.textContent`) === overflow && await run(`${addButton}.disabled`), '[73-22·23] 31 loaded questions are kept, explained and adding stays disabled');
  check(await run(`window.validatePopupQuestions(window.questions,true,0)`) === overflow, '[73-22] Saving 31 questions is blocked with the reason');
  check(await run(`document.body.textContent.includes('퀴즈 문항 31/30')`), '[73-23] Quiz header shows the count over the limit');

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
  // POL-06-02 : 선택·제출 — 퀴즈 답안 유형(0089): OX형은 O·X 단일 선택, 선다형은 선택지 편집. 기존 복수 선택·주관식은 값 유지.
  const clickButton = label => run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
  const pick = async (aria, label) => {
    await run(`document.querySelector('[aria-label=${JSON.stringify(aria)}]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
    await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent===${JSON.stringify(label)}).click()`); await pause(500);
  };
  await run(`window.mountEditor([], true)`); await pause(400);
  check(await run(`!Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('OX 문항'))`), 'The OX question button is replaced by the answer type select');
  await clickButton('문항 추가'); await pause(800);
  q = (await questions())[0];
  check(q.questionType === 'SINGLE_CHOICE' && q.options.every(o => o.text === ''), 'A new quiz question starts as a multiple choice with empty options');
  await pick('1번 문항 답안 유형', 'OX형');
  q = (await questions())[0];
  check(q.questionType === 'SINGLE_CHOICE' && q.optionLayout === 'HORIZONTAL' && q.options.map(o => o.text).join() === 'O,X' && q.options.every(o => !o.isCorrect), 'OX type becomes a horizontal single choice with O and X and no answer: ' + JSON.stringify(q.options));
  check(await run(`window.validatePopupQuestions([{...window.questions[0],title:'문항'}],true,0)`) === '1번 문항: 정답 선택지를 확인해 주세요.', 'OX type requires an answer');
  check(await run(`document.body.textContent.includes('정답을 선택해 주세요.')`), 'OX type asks for an answer until one is chosen');
  await run(`document.querySelector('button[aria-label="1번 문항 2번 선택지 정답"]').click()`); await pause(200);
  q = (await questions())[0];
  check(q.options.map(o => Boolean(o.isCorrect)).join() === 'false,true' && await run(`window.validatePopupQuestions([{...window.questions[0],title:'문항'}],true,0)`) === null, 'Choosing X sets one answer and passes validation');
  check(await run(`document.querySelectorAll('.ck-editor__editable').length`) === 1, 'OX options use answer buttons instead of option editors');
  check(await run(`document.querySelector('button[aria-label="1번 문항 2번 선택지 정답"]').getAttribute('aria-checked')==='true' && document.querySelector('button[aria-label="1번 문항 1번 선택지 정답"]').getAttribute('aria-checked')==='false' && !document.body.textContent.includes('정답을 선택해 주세요.')`), 'The chosen OX answer button is marked as checked');
  fs.writeFileSync(path.join(output, 'ox-editor.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
  // TODO73-10~15 OX 정답 칸: 같은 크기 2칸·가운데 글자만·칸 전체 클릭·단일 정답·키보드·좁은 너비·저장값
  const oxCells = () => run(`(()=>{const g=document.querySelector('[role=radiogroup][aria-label="1번 문항 정답"]');const c=Array.from(g.querySelectorAll('[role=radio]'));const box=g.getBoundingClientRect();
    return {label:g.firstElementChild.textContent,count:c.length,text:c.map(e=>e.textContent),rects:c.map(e=>{const r=e.getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),right:r.right}}),boxRight:box.right,
      extras:c.reduce((n,e)=>n+e.querySelectorAll('svg,input,img').length,0),checked:c.map(e=>e.getAttribute('aria-checked')),bg:c.map(e=>getComputedStyle(e).backgroundColor),border:c.map(e=>getComputedStyle(e).borderTopColor),align:c.map(e=>getComputedStyle(e).justifyContent),tab:c.map(e=>e.tabIndex),focus:c.indexOf(document.activeElement)};})()`);
  let ox = await oxCells();
  check(ox.label === '정답 선택 *' && ox.count === 2 && ox.text.join() === 'O,X' && ox.extras === 0, '[73-11] OX cells show only one letter under the required label: ' + JSON.stringify(ox));
  check(ox.rects[0].w === ox.rects[1].w && ox.rects[0].h === ox.rects[1].h && ox.rects[0].h === 44 && ox.rects[0].w > 200 && ox.rects[0].top === ox.rects[1].top && ox.align[0] === 'center', '[73-16] Editor OX cells keep height 44 and split the width: ' + JSON.stringify(ox.rects));
  check(ox.checked.join() === 'false,true' && ox.bg[0] !== ox.bg[1] && ox.border[0] !== ox.border[1] && ox.tab.join() === '-1,0', '[73-12] Only the chosen cell differs and takes the tab stop: ' + JSON.stringify(ox));
  const cellCenter = await run(`(()=>{const r=document.querySelector('button[aria-label="1번 문항 1번 선택지 정답"]').getBoundingClientRect();return {x:r.left+12,y:r.top+10};})()`);
  await clickAt(cellCenter.x, cellCenter.y); await pause(200);
  q = (await questions())[0];
  check(q.options.map(o => Boolean(o.isCorrect)).join() === 'true,false', '[73-11] Clicking a cell corner chooses that answer: ' + JSON.stringify(q.options));
  await send('Input.dispatchKeyEvent', {type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39}); await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39}); await pause(200);
  q = (await questions())[0]; ox = await oxCells();
  check(q.options.map(o => Boolean(o.isCorrect)).join() === 'false,true' && ox.focus === 1 && ox.tab.join() === '-1,0', '[73-15] Arrow key moves the single answer and focus: ' + JSON.stringify(ox));
  await send('Input.dispatchKeyEvent', {type: 'rawKeyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37}); await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37}); await pause(200);
  q = (await questions())[0];
  check(q.options.map(o => Boolean(o.isCorrect)).join() === 'true,false' && (await oxCells()).focus === 0, '[73-15] Arrow key also moves back to O');
  check(q.questionType === 'SINGLE_CHOICE' && q.optionLayout === 'HORIZONTAL' && q.options.length === 2 && Object.keys(q).every(k => !/ox/i.test(k)), '[73-13] OX stays a plain single choice with no new field: ' + JSON.stringify(Object.keys(q)));
  await run(`document.querySelector('#root div[style*="760"]').style.width='300px'`); await pause(200);
  ox = await oxCells();
  check(ox.rects[0].w === ox.rects[1].w && ox.rects[1].right <= ox.boxRight + 1 && ox.rects[0].top === ox.rects[1].top, '[73-15] Narrow editor keeps two equal cells inside the box: ' + JSON.stringify(ox.rects));
  const oxSaved = await run(`JSON.stringify(window.questions)`);
  await run('window.mountEditor(' + oxSaved + ', true)'); await pause(500);
  ox = await oxCells();
  check(ox.checked.join() === 'true,false' && ox.tab.join() === '0,-1' && !(await run(`document.body.textContent.includes('정답을 선택해 주세요.')`)), '[73-15] Reloading saved OX restores the answer in the cells');
  // 편집기 정답과 미리보기 응답은 서로 영향을 주지 않는다.
  const oxAnswerX = JSON.parse(oxSaved); oxAnswerX[0].title = '문항'; oxAnswerX[0].options = oxAnswerX[0].options.map(o => ({...o, isCorrect: o.text === 'X'}));
  await run(`window.mountPreview(${JSON.stringify({...popup, popupType: 'QUIZ', sizeMode: 'FIXED', passingScore: 0})})`); await pause(100);
  await run(`window.mountPreview(${JSON.stringify({...popup, popupType: 'QUIZ', sizeMode: 'FIXED', passingScore: 0, questions: oxAnswerX})})`); await pause(400);
  check(await run(`document.querySelectorAll('#preview input:checked').length`) === 0, '[73-14] Preview does not preselect the editor answer');
  await run(`document.querySelectorAll('#preview input')[0].click()`); await pause(200);
  const previewChecked = await run(`Array.from(document.querySelectorAll('#preview input')).map(i=>i.checked).join()`);
  check(previewChecked === 'true,false', '[73-14] Preview answer O stays independent of the editor answer X: ' + previewChecked);
  await run(`window.mountEditor(${JSON.stringify(JSON.parse(oxSaved))}, true)`); await pause(500);
  await pick('1번 문항 답안 유형', '선다형');
  q = (await questions())[0];
  check(q.options.length === 2 && q.options.every(o => o.text === '' && !o.isCorrect) && q.optionLayout === 'VERTICAL', 'Choice type replaces O and X with empty options');
  const legacy = [{questionId: 21, title: '복수', questionType: 'MULTIPLE_CHOICE', isRequired: true, sortOrder: 1, options: [{optionId: 1, value: '1', text: '가', sortOrder: 1, isCorrect: true}, {optionId: 2, value: '2', text: '나', sortOrder: 2, isCorrect: true}]},
    {questionId: 22, title: '주관', questionType: 'TEXT', isRequired: true, sortOrder: 2, options: [], correctAnswer: '답', answerMatchMode: 'EXACT'},
    {questionId: 23, title: '오엑스', description: '기존 설명', questionType: 'SINGLE_CHOICE', isRequired: true, sortOrder: 3, options: [{optionId: 3, value: '1', text: 'O', sortOrder: 1, isCorrect: true}, {optionId: 4, value: '2', text: 'X', sortOrder: 2, isCorrect: false}]}];
  await run(`window.mountEditor(${JSON.stringify(legacy)}, true)`); await pause(800);
  check(await run(`document.body.textContent.includes('기존 유형: 복수 선택') && document.body.textContent.includes('기존 유형: 주관식') && document.body.textContent.includes('OX형')`), 'Legacy multiple and text questions stay visible, O and X reload as the OX type');
  q = await questions();
  check(q[0].options.length === 2 && q[1].correctAnswer === '답' && q[2].description === '기존 설명', 'Loading keeps legacy values untouched');
  // 설문: 응답 유형·레이아웃·응답 수(복수 N개 → maxSelections).
  await run(`window.mountEditor([], false)`); await pause(400);
  await clickButton('문항 추가'); await pause(800);
  await pick('1번 문항 응답 수', '복수 선택');
  check((await questions())[0].questionType === 'MULTIPLE_CHOICE', 'Survey response count selects multiple choice');
  await run(`(()=>{const i=document.querySelector('input[aria-label="1번 문항 선택 개수"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'2');i.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(200);
  check((await questions())[0].maxSelections === 2, 'Survey N selections saves maxSelections');
  await pick('1번 문항 응답 유형', '주관식');
  q = (await questions())[0];
  check(q.questionType === 'TEXT' && q.options.length === 0 && q.maxSelections == null, 'Survey text type removes options and the selection count');
  await pick('1번 문항 응답 유형', '객관식');
  q = (await questions())[0];
  check(q.questionType === 'SINGLE_CHOICE' && q.options.length === 2, 'Survey choice type restores two empty options');
  // 미리보기: OX 문항은 크게 표시하고, 문항 번호는 줄바꿈하지 않으며, 바깥 틀 색이 모서리로 비치지 않는다.
  const oxPopup = {...popup, popupType: 'QUIZ', sizeMode: 'FIXED', passingScore: 0, questions: [{questionId: 31, title: '가'.repeat(120), questionType: 'SINGLE_CHOICE', optionLayout: 'HORIZONTAL', isRequired: true, isScored: true, questionScore: 1, sortOrder: 1,
    options: [{optionId: 1, value: '1', text: 'O', sortOrder: 1, isCorrect: true}, {optionId: 2, value: '2', text: 'X', sortOrder: 2, isCorrect: false}]}]};
  await run(`window.mountPreview(${JSON.stringify(oxPopup)})`); await pause(500);
  const oxLook = await run(`(()=>{const opts=Array.from(document.querySelectorAll('#preview .survey-option'));const opt=opts[0];const r=opt.getBoundingClientRect();const r2=opts[1].getBoundingClientRect();const box=opt.parentElement.parentElement.getBoundingClientRect();const num=Array.from(document.querySelectorAll('#preview span')).find(e=>e.textContent==='01');const paper=document.querySelector('#preview .MuiPaper-root');const frame=paper.parentElement;
    return {w:r.width,w2:r2.width,h:r.height,sameRow:r.top===r2.top,gap:r2.left-r.right,fill:r2.right-box.left,boxW:box.width,align:getComputedStyle(opt.firstElementChild).textAlign,font:getComputedStyle(opt.firstElementChild).fontSize,weight:getComputedStyle(opt.querySelector('span')).fontWeight,numH:num.getBoundingClientRect().height,paperR:getComputedStyle(paper).borderRadius,frameBg:getComputedStyle(frame).backgroundColor}})()`);
  check(oxLook.w === oxLook.w2 && oxLook.w > 96 && oxLook.h >= 88 && oxLook.sameRow && oxLook.gap === 8 && Math.abs(oxLook.fill - oxLook.boxW) < 1 && oxLook.align === 'center' && oxLook.font === '36px' && oxLook.weight === '700', '[73-10] Preview shows OX as two large equal cells filling the width: ' + JSON.stringify(oxLook));
  check(oxLook.numH < 24, 'The question number stays on one line next to a long title: ' + JSON.stringify(oxLook));
  check(oxLook.paperR === '6px' && oxLook.frameBg === 'rgba(0, 0, 0, 0)', 'The preview frame does not show through the rounded corners: ' + JSON.stringify(oxLook));
  fs.writeFileSync(path.join(output, 'ox-preview.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
  await run(`window.mountDialog(${JSON.stringify(oxPopup)})`); await pause(700);
  fs.writeFileSync(path.join(output, 'ox-dialog.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png'})).data, 'base64'));
  const dialogLook = await run(`(()=>{const d=getComputedStyle(document.querySelector('[role=dialog]'));return {bg:d.backgroundColor,r:d.borderRadius}})()`);
  check(dialogLook.bg === 'rgba(0, 0, 0, 0)' && dialogLook.r === '6px', 'The preview dialog paper does not show white corners: ' + JSON.stringify(dialogLook));
  await run(`window.mountPreview(${JSON.stringify(popup)})`); await pause(400);
  const shot2 = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'survey-preview.png'), Buffer.from(shot2.data, 'base64'));
  check(!errors.length, 'No page exceptions: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' survey rich text 55 checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
