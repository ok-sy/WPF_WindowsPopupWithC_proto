// POL-06-01 : 문항·서식 / POL-06-02 : 선택·제출
// ■ TODO73-36·38: QUIZ 선택지 UTF-8 300 Byte 입력 제한을 실제 관리자 편집기 빌드로 확인한다(Windows headless Edge, CDP 입력·IME 조합).
//   일반 입력칸·서식 편집기(richQuestionText) 두 경로, 경계값 300/301, 한글·영문·이모지, IME 조합 중/확정, 붙여넣기(insertText), 커서 위치,
//   삭제 후 재입력, 이전 초과 데이터, 저장 전 확인(validatePopupQuestions), 설문 선택지(2026-11-11부터 같은 300 Byte)·제한 대상 외(문항 제목 CLOB)를 본다.
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-quiz-option-byte-73.cjs
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/quiz-option-byte73');
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
    '--remote-debugging-port=9376', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9376/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
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


  const typeInto = (selector, value) => run(`(()=>{const i=document.querySelector(${JSON.stringify(selector)});
    const proto=i.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`).then(() => pause(150));
  const bytes = text => Buffer.byteLength(text, 'utf8');
  const hangul = n => '가'.repeat(n);
  const optionInput = (q, o) => `textarea[aria-label="${q}번 문항 선택지 ${o}"]`;
  const option = async (q, o) => (await questions())[q - 1].options[o - 1].text;
  const domValue = selector => run(`document.querySelector(${JSON.stringify(selector)}).value`);
  const caretOf = selector => run(`document.querySelector(${JSON.stringify(selector)}).selectionStart`);
  // 실제 키 입력·붙여넣기처럼 브라우저 편집 경로를 거치게 CDP Input.insertText를 쓴다(합성 input 이벤트가 아님).
  const focusAt = (selector, caret) => run(`(()=>{const i=document.querySelector(${JSON.stringify(selector)});i.focus();i.setSelectionRange(${caret},${caret});})()`);
  const insertText = async text => { await send('Input.insertText', {text}); await pause(200); };
  // 한글 IME: 조합 중 표시(imeSetComposition) 후 확정(insertText)
  const imeType = async (composing, committed) => { await send('Input.imeSetComposition', {text: composing, selectionStart: composing.length, selectionEnd: composing.length}); await pause(150);
    await send('Input.insertText', {text: committed}); await pause(250); };
  const helperText = selector => run(`(()=>{const i=document.querySelector(${JSON.stringify(selector)});const h=i.closest('.MuiFormControl-root').querySelector('.MuiFormHelperText-root');return h?h.textContent:'';})()`);
  const quizQuestion = (texts, extra = {}) => ({questionId: 1, title: '퀴즈', questionType: 'SINGLE_CHOICE', isRequired: true, isScored: true, questionScore: 1, sortOrder: 1,
    options: texts.map((text, i) => ({optionId: 100 + i, value: String(i + 1), text, sortOrder: i + 1, isCorrect: i === 0})), ...extra});
  const validate = (qs, quiz = true) => run(`window.validatePopupQuestions(${JSON.stringify(qs)}, ${quiz}, 0)`);

  // ── 1. 일반 입력칸(기본) ──
  await run(`window.mountEditor(${JSON.stringify([quizQuestion(['A', 'B'])])}, true)`); await pause(500);
  const o1 = optionInput(1, 1);
  await typeInto(o1, hangul(100));
  check(await option(1, 1) === hangul(100) && bytes(await option(1, 1)) === 300, '[73-36] 300-byte Hangul option is accepted');
  await typeInto(o1, hangul(100) + 'a');
  check(await option(1, 1) === hangul(100) && await domValue(o1) === hangul(100), '[73-36] 301-byte input is rejected and the previous value stays (state and DOM)');
  check((await helperText(o1)).includes('300 Byte'), '[73-36] Rejection shows the 300 Byte notice: ' + await helperText(o1));
  await focusAt(o1, 100); await insertText('b');
  check(await option(1, 1) === hangul(100), '[73-36] Typed 1 byte over the limit at the end is rejected');
  await focusAt(o1, 40); await insertText('나');
  check(await option(1, 1) === hangul(100) && await caretOf(o1) === 40, '[73-36] Over-limit typing in the middle keeps the value and caret position (' + await caretOf(o1) + ')');
  await focusAt(o1, 100); await insertText('붙여넣기'.repeat(20));
  check(await option(1, 1) === hangul(100), '[73-36] Over-limit paste (insertText) is rejected as a whole');
  await typeInto(o1, hangul(99));
  check(await option(1, 1) === hangul(99) && !(await helperText(o1)), '[73-39] Deleting after a rejection is accepted and the notice clears');
  await focusAt(o1, 99); await insertText('ab');
  check(await option(1, 1) === hangul(99) + 'ab' && bytes(await option(1, 1)) === 299, '[73-39] Re-typing within the limit works (299 bytes)');
  await focusAt(o1, 101); await insertText('c');
  check(bytes(await option(1, 1)) === 300, '[73-39] Typing up to exactly 300 bytes works');
  // 이모지(4 Byte)·영문 혼합 경계
  await typeInto(o1, 'a'.repeat(296)); await focusAt(o1, 296); await insertText('😀');
  check(await option(1, 1) === 'a'.repeat(296) + '😀', '[73-39] Emoji reaching exactly 300 bytes is accepted');
  await typeInto(o1, 'a'.repeat(297)); await focusAt(o1, 297); await insertText('😀');
  check(await option(1, 1) === 'a'.repeat(297), '[73-39] Emoji crossing 300 bytes is rejected without a broken surrogate');
  // IME 조합: 한도 안 확정은 반영, 넘는 확정은 조합 전 값으로 되돌림
  await typeInto(o1, hangul(99)); await focusAt(o1, 99);
  await imeType('ㄱ', '가');
  check(await option(1, 1) === hangul(100) && await domValue(o1) === hangul(100), '[73-39] IME composition committed within the limit is accepted');
  await focusAt(o1, 100); await imeType('ㄴ', '나');
  check(await option(1, 1) === hangul(100) && await domValue(o1) === hangul(100), '[73-39] IME composition crossing the limit is reverted on commit: ' + bytes(await domValue(o1)));
  await focusAt(o1, 100); await send('Input.imeSetComposition', {text: 'ㄷ', selectionStart: 1, selectionEnd: 1}); await pause(200);
  check(bytes(await domValue(o1)) > 300, '[73-39] During composition the browser composition is not broken (temporary value shown)');
  await send('Input.insertText', {text: '다'}); await pause(250);
  check(await option(1, 1) === hangul(100) && await domValue(o1) === hangul(100), '[73-39] ...and the composed syllable is dropped when composition ends');
  check(await validate(await questions()) === null, '[73-38] 300-byte quiz options pass the pre-save check');

  // ── 2. 이전 초과 데이터·저장 전 확인 ──
  const legacy = hangul(120) + 'x';
  await run(`window.mountEditor(${JSON.stringify([quizQuestion([legacy, 'B'])])}, true)`); await pause(500);
  check(await option(1, 1) === legacy && await domValue(o1) === legacy, '[73-38] Existing over-limit option is loaded as-is (not truncated)');
  check((await helperText(o1)).includes('361 Byte'), '[73-38] Existing over-limit option shows the current byte count: ' + await helperText(o1));
  const legacyError = await validate(await questions());
  check(legacyError?.includes('1번 선택지') && legacyError.includes('300 Byte') && legacyError.includes('361 Byte'), '[73-38] Pre-save check blocks the over-limit option: ' + legacyError);
  await focusAt(o1, 121); await insertText('y');
  check(await option(1, 1) === legacy, '[73-38] Growing an over-limit option is rejected');
  await typeInto(o1, hangul(120));
  check(await option(1, 1) === hangul(120), '[73-38] Shortening an over-limit option is accepted (user trims it)');
  await typeInto(o1, hangul(100));
  check(await validate(await questions()) === null && !(await helperText(o1)), '[73-38] Trimmed to 300 bytes passes the pre-save check');
  check((await validate([quizQuestion([hangul(100) + 'a', 'B'])]))?.includes('301 Byte'), '[73-38] validatePopupQuestions rejects 301 bytes');
  check(await validate([quizQuestion([hangul(100), 'B'])]) === null, '[73-38] validatePopupQuestions accepts 300 bytes');

  // ── 3. 설문 선택지(같은 OPTION_TEXT 컬럼, 2026-11-11부터 300 Byte)·제한 대상 외(문항 제목 CLOB) ──
  const surveyOf = texts => [{...quizQuestion(texts), isScored: false, questionScore: null, options: quizQuestion(texts).options.map(o => ({...o, isCorrect: false}))}];
  await run(`window.mountEditor(${JSON.stringify(surveyOf(['A', 'B']))}, false)`); await pause(500);
  await typeInto(o1, hangul(100));
  check(await option(1, 1) === hangul(100), '[73-36] Survey option accepts 300 bytes');
  await focusAt(o1, 100); await insertText('b');
  check(await option(1, 1) === hangul(100) && (await helperText(o1)).includes('300 Byte'), '[73-36] Survey option rejects typing past 300 bytes with the notice');
  await focusAt(o1, 100); await insertText('붙여넣기'.repeat(20));
  check(await option(1, 1) === hangul(100), '[73-36] Survey option rejects an over-limit paste');
  await focusAt(o1, 100); await imeType('ㄱ', '가');
  check(await option(1, 1) === hangul(100) && await domValue(o1) === hangul(100), '[73-36] Survey option reverts an IME syllable crossing the limit');
  check(await validate(await questions(), false) === null, '[73-38] Survey pre-save check accepts 300 bytes');
  check((await validate(surveyOf([hangul(100) + 'a', 'B']), false))?.includes('301 Byte'), '[73-38] Survey pre-save check rejects 301 bytes');
  check(await validate([quizQuestion(['A', 'B'], {title: hangul(200)})]) === null, '[73-36] Quiz title (CLOB) has no 300-byte rule');
  check(await validate([{...surveyOf(['A', 'B'])[0], title: hangul(200)}], false) === null, '[73-36] Survey title (CLOB) has no 300-byte rule');

  // ── 4. 서식 편집기 선택지(richQuestionText=true) ──
  await run(`window.mountEditor(${JSON.stringify([quizQuestion([hangul(99), 'B'])])}, true, {richQuestionText: true})`); await waitEditors(3);
  const editorText = i => run(`window.editors()[${i}].getData()`);
  const caretPath = i => run(`JSON.stringify(window.editors()[${i}].model.document.selection.getFirstPosition().path)`);
  const notice = () => run(`Array.from(document.querySelectorAll('[role=status]')).map(e=>e.textContent).join('|')`);
  await run(`window.select(1, 0, 99, 99)`); await insertText('a');
  check(bytes(await option(1, 1)) === 298, '[73-36] Rich option accepts typing within the limit: ' + bytes(await option(1, 1)));
  await run(`window.select(1, 0, 100, 100)`); await insertText('bc');
  check(bytes(await option(1, 1)) === 300, '[73-36] Rich option accepts exactly 300 bytes');
  const before = await editorText(1);
  await run(`window.select(1, 0, 50, 50)`); await insertText('d'); await pause(300);
  check(await option(1, 1) === hangul(99) + 'abc' && await editorText(1) === before, '[73-36] Rich option rejects 301 bytes and restores the previous content');
  check(await caretPath(1) === '[0,50]', '[73-36] Rich option restores the caret to the edit point: ' + await caretPath(1));
  check((await notice()).includes('300 Byte'), '[73-36] Rich option shows the 300 Byte notice: ' + await notice());
  await run(`window.select(1, 0, 102, 102)`); await insertText('붙여넣기'.repeat(20)); await pause(300);
  check(await option(1, 1) === hangul(99) + 'abc', '[73-36] Rich option rejects an over-limit paste as a whole');
  await run(`window.select(1, 0, 101, 102)`); await run(`window.editors()[1].execute('delete')`); await pause(300);
  check(bytes(await option(1, 1)) === 299, '[73-39] Rich option accepts deleting after a rejection: ' + bytes(await option(1, 1)));
  await run(`window.select(1, 0, 101, 101)`); await imeType('ㄱ', '가'); await pause(300);
  check(await option(1, 1) === hangul(99) + 'ab', '[73-39] Rich option reverts an IME syllable crossing the limit on commit: ' + bytes(await option(1, 1)));
  await run(`window.select(1, 0, 101, 101)`); await imeType('ㅇ', 'z'); await pause(300);
  check(bytes(await option(1, 1)) === 300, '[73-39] Rich option accepts an IME commit within the limit: ' + bytes(await option(1, 1)));
  // 이전 초과 서식 데이터: 그대로 표시·안내, 키우는 편집은 거부
  const legacyRich = [quizQuestion([legacy, 'B'])].map(q => ({...q, options: q.options.map((o, i) => i ? o : {...o, textBlocks: [{alignment: 'LEFT', runs: [{text: legacy}]}]})}));
  await run(`window.mountEditor(${JSON.stringify(legacyRich)}, true, {richQuestionText: true})`); await waitEditors(3);
  check((await notice()).includes('361 Byte'), '[73-38] Rich editor shows the byte count of existing over-limit data: ' + await notice());
  await run(`window.select(1, 0, 121, 121)`); await insertText('q'); await pause(300);
  check(!(await editorText(1)).includes('q') && await option(1, 1) === legacy, '[73-38] Rich editor rejects growing existing over-limit data');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' quiz option byte 73 checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
