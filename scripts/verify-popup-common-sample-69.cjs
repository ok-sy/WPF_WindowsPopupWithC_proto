// POL-14-01 : 공통 프론트 경계
// ■ PopupcommonComponent 목록 기반 샘플: 목록 → 수정 → 편집(공통 에디터) → 우측/모달 미리보기 → 저장 요청 객체를 headless Edge로 확인한다.
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-common-sample-69.cjs (다른 Chromium은 BROWSER_PATH)
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/common-sample69');
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
    entry: path.join(__dirname, 'verify-popup-common-sample-69-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--remote-debugging-port=9369', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9369/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  if (!targets?.length) throw Error('Chromium did not start; set BROWSER_PATH');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map(); const errors = [];
  socket.on('message', raw => {const m = JSON.parse(raw);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const until = async (expression, label) => { for (let i = 0; i < 100; i++) { if (await run(expression)) return; await pause(100); } throw Error('timeout: ' + label + ' ' + errors.join(' | ')); };
  const clickButton = async (text, scope = 'document') => { await run(`Array.from(${scope}.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`); await pause(250); };
  const editRow = async popupId => { await run(`Array.from(document.querySelectorAll('tbody tr')).find(r=>r.textContent.includes(${JSON.stringify(popupId)})).querySelector('button').click()`); await pause(400); };
  const setInput = async (selector, value) => { await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(200); };
  const preview = "document.querySelector('[data-testid=sample-inline-preview]')";
  const request = async () => JSON.parse(await run(`document.querySelector('[data-testid=sample-save-request]').textContent`));

  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1400, height: 950, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  await until(`document.querySelectorAll('tbody tr').length > 0`, 'list');

  // 1) 서버 없이 목록 표시(6종 대표 샘플).
  check(await run(`document.querySelectorAll('tbody tr').length`) === 6, 'Sample list shows six representative popups without a server');
  check(await run(`['텍스트','이미지','영상','설문','퀴즈','영상 + 퀴즈'].every(t=>Array.from(document.querySelectorAll('tbody tr td:nth-child(2)')).some(td=>td.textContent===t))`),
    'List covers TEXT/IMAGE/VIDEO/SURVEY/QUIZ/VIDEO+QUIZ');
  // 2) 수정 → 같은 공통 에디터·우측 미리보기. 제목 입력이 바로 미리보기에 반영.
  await editRow('SAMPLE-TEXT');
  await until(`!!document.querySelector('.ck-editor__editable')`, 'editor');
  check(await run(`${preview}.textContent.includes('시스템 점검 안내') && ${preview}.textContent.includes('서비스 점검 안내')`), 'Inline preview shows the loaded header and body');
  await setInput('input[aria-label="팝업 제목"]', '변경된 점검 제목');
  check(await run(`${preview}.textContent.includes('변경된 점검 제목')`), 'Editing the title updates the inline preview from the same state');
  // 3) 본문 편집(실제 CKEditor) → 미리보기 반영, 커서 유지(편집기 다시 마운트 안 됨).
  await run(`(()=>{const ed=document.querySelector('.ck-editor__editable').ckeditorInstance;ed.model.change(w=>w.insertText(' 추가문구',ed.model.document.selection.getFirstPosition()));window.__editor=ed;})()`); await pause(300);
  check(await run(`${preview}.textContent.includes('추가문구')`), 'Body editor change appears in the inline preview');
  check(await run(`document.querySelector('.ck-editor__editable').ckeditorInstance===window.__editor`), 'Typing keeps the same editor instance (no remount, cursor kept)');
  // 4) 모달 미리보기: 같은 입력값을 실제 크기로 표시, 종료 후 편집기 유지.
  await clickButton('실제 크기로 보기');
  await until(`document.querySelectorAll('.MuiDialog-root').length >= 2`, 'preview dialog');
  check(await run(`Array.from(document.querySelectorAll('.MuiDialog-root')).at(-1).textContent.includes('변경된 점검 제목') && Array.from(document.querySelectorAll('.MuiDialog-root')).at(-1).textContent.includes('추가문구')`),
    'Modal preview shows the same latest popup');
  await run(`document.querySelector('[aria-label="실제 크기 미리보기 종료"]').click()`); await pause(400);
  check(await run(`document.querySelectorAll('.MuiDialog-root').length`) === 1, 'Closing the modal keeps the editor open');
  // 5) 저장: toSaveRequest 결과가 편집값과 일치하고 목록이 바뀐다(서버 미전송 표시).
  await clickButton('저장');
  let saved = await request();
  check(saved.popup.title === '변경된 점검 제목' && saved.popup.content.plainText.includes('추가문구') && saved.popup.content.textBlocks[0].runs.some(r => r.text.includes('추가문구'))
    && saved.active === true && Array.isArray(saved.targetGroups), 'Save request carries the edited title, blocks and plainText');
  check(await run(`Array.from(document.querySelectorAll('tbody tr')).some(r=>r.textContent.includes('변경된 점검 제목'))`) && await run(`document.body.textContent.includes('서버 미전송')`),
    'Local list is updated and the request is marked as not sent to a server');
  // 6) SURVEY: 미리보기 시연 응답이 저장값에 섞이지 않는다.
  await editRow('SAMPLE-SURVEY');
  await until(`!!${preview}?.querySelector('input[type=radio],input[type=checkbox]')`, 'survey preview');
  const before = await run(`document.querySelectorAll('[data-testid=sample-editor-form] input').length`);
  await run(`${preview}.querySelector('input[type=radio],input[type=checkbox]').click()`); await pause(200);
  await clickButton('저장');
  saved = await request();
  check(saved.popup.popupType === 'SURVEY' && saved.popup.questions.length > 0 && !JSON.stringify(saved).includes('"selected') && !JSON.stringify(saved).includes('"answer"'),
    'Preview demo answers do not leak into the survey save request');
  check(before > 0, 'Question editor renders inputs for each question');
  // 7) 유형 전환(TEXT → QUIZ)과 영상+퀴즈 열기에서 오류 없이 다시 구성된다.
  await clickButton('신규');
  await until(`!!document.querySelector('[data-testid=sample-editor-form]')`, 'new editor');
  await run(`document.querySelector('[data-testid=sample-editor-form] [role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
  await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent==='퀴즈').click()`); await pause(400);
  check(await run(`document.querySelector('[data-testid=sample-editor-form]').textContent.includes('통과 점수')`), 'Switching to QUIZ remounts the question editor');
  await clickButton('취소');
  await editRow('SAMPLE-VIDEO-QUIZ');
  await until(`!!document.querySelector('[data-testid=sample-inline-preview]')`, 'video quiz editor');
  check(await run(`${preview}.textContent.includes('영상')`), 'VIDEO+QUIZ sample opens in the shared preview');
  await clickButton('취소');
  // ── IS063M02 연동 샘플(69-5~7) ──
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port + '/#is063'}); await pause(300);
  await run('location.reload()'); await until(`!!document.querySelector('[data-testid=is063-left]')`, 'is063');
  const mid = "document.querySelector('[data-testid=is063-mid]')", right = "document.querySelector('[data-testid=is063-right]')";
  const pickType = async label => {
    await run(`document.querySelector('[data-testid=is063-left] [role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
    await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent===${JSON.stringify(label)}).click()`); await pause(300);
  };
  check(await run(`document.querySelector('.nResultArea').children.length`) === 3 && await run(`['nContainer','nBreadArea','nConSection','nBtnWrap'].every(c=>document.querySelector('.'+c))`),
    '[IS063] Publishing structure (n* classes, three columns) is kept');
  await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('폼 생성')`), '[IS063] Save without a form is rejected instead of pretending success');
  await pickType('텍스트 팝업'); await clickButton('폼 생성');
  await until(`!!${mid}.querySelector('.ck-editor__editable')`, 'is063 editor');
  check(await run(`${mid}.querySelector('h4').textContent==='텍스트 컨텐츠'`), '[IS063] Middle title follows the selected type');
  await setInput('input[aria-label="헤더 제목"]', 'IS063 헤더'); await setInput('input[aria-label="컨텐츠 명"]', 'IS063 컨텐츠');
  await run(`(()=>{const ed=${mid}.querySelector('.ck-editor__editable').ckeditorInstance;ed.model.change(w=>w.insertText('IS063 본문',ed.model.document.selection.getFirstPosition()));})()`); await pause(300);
  check(await run(`${right}.textContent.includes('IS063 헤더') && ${right}.textContent.includes('IS063 본문')`), '[IS063] Shared editor and header title feed the right preview');
  await clickButton('실제 크기로 보기');
  await until(`!!document.querySelector('[aria-label="실제 크기 미리보기 종료"]')`, 'is063 modal');
  check(await run(`Array.from(document.querySelectorAll('.MuiDialog-root')).at(-1).textContent.includes('IS063 본문')`), '[IS063] Preview button opens the shared modal with the same popup');
  await run(`document.querySelector('[aria-label="실제 크기 미리보기 종료"]').click()`); await pause(400);
  await setInput('input[aria-label="가로"]', '299'); await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('300')`), '[IS063] Size below 300 is rejected (TODO68)');
  await setInput('input[aria-label="가로"]', '640'); await clickButton('저장');
  saved = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`));
  check(saved.popup.popupType === 'TEXT' && saved.popup.title === 'IS063 헤더' && saved.popup.width === 640 && saved.popup.content.plainText.includes('IS063 본문')
    && !('attachedFileName' in saved.popup.content) && !JSON.stringify(saved).includes('IS063 컨텐츠'), '[IS063] Save request matches the edit; content name is not invented into the contract');
  await clickButton('닫기');
  // 유형 전환: 공통 입력값 유지, 문항 편집기로 다시 구성.
  await pickType('퀴즈 팝업'); await clickButton('폼 생성');
  check(await run(`${mid}.textContent.includes('문항 추가') && document.querySelector('input[aria-label="헤더 제목"]').value==='IS063 헤더'`),
    '[IS063] Type change rebuilds the question area and keeps common inputs');
  // 불러오기 → 문항별 정답 선택이 서로 독립(원본의 공유 라디오 state 정리).
  await clickButton('불러오기');
  await run(`Array.from(document.querySelectorAll('[role=menuitem]')).find(o=>o.textContent.startsWith('SAMPLE-QUIZ')).click()`); await pause(500);
  await setInput('input[aria-label="헤더 제목"]', '보안 퀴즈'); await clickButton('저장');
  const first = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  await run(`document.querySelector('input[aria-label="1번 문항 2번 선택지 정답"]').click()`); await pause(200); await clickButton('저장');
  const second = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(first.popup.questions.length >= 2 && JSON.stringify(first.popup.questions[0]) !== JSON.stringify(second.popup.questions[0])
    && JSON.stringify(first.popup.questions[1]) === JSON.stringify(second.popup.questions[1]) && !('footerAction' in second.popup.content),
    '[IS063] Per-question answer selection is independent; quiz save omits footerAction (SUBMIT is fixed by the server)');
  // [확정 점수 규칙] 문항 1점 고정·총점 = 문항 수, 만점 통과 = 문항 수, 커트라인 N개 = N점.
  check(await run(`!document.querySelector('[data-testid=is063-mid]').textContent.includes('배점 모두 1점') && !Array.from(document.querySelectorAll('[data-testid=is063-mid] label')).some(l=>l.textContent==='배점' || l.textContent==='통과 점수')`),
    '[IS063] Quiz score is fixed at 1 point: no per-question score or passing score input');
  const count = second.popup.questions.length;
  check(second.popup.questions.every(q => q.questionScore === 1 && q.isScored === true) && second.popup.passingScore === 2,
    '[IS063] Loaded quiz keeps cutoff 2 and saves every question as 1 point: ' + JSON.stringify(second.popup.questions.map(q => q.questionScore)) + ' / ' + second.popup.passingScore);
  const pickRule = async label => {
    await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
    await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent===${JSON.stringify(label)}).click()`); await pause(300);
  };
  await pickRule('만점 통과');
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 ${count}점')`), '[IS063] Full-score pass shows passing score = question count');
  await clickButton('저장');
  let rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.popup.passingScore === count, `[IS063] Full-score pass saves passingScore ${count} for ${count} questions`);
  await pickRule('커트라인 통과'); await setInput('input[aria-label="통과 기준 개수"]', '1'); await clickButton('저장');
  rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.popup.passingScore === 1 && rule.popup.questions.every(q => q.questionScore === 1), '[IS063] Cutoff 1 saves passingScore 1');
  await setInput('input[aria-label="통과 기준 개수"]', String(count + 1)); await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('통과 기준')`), '[IS063] Cutoff above the question count is rejected');
  await setInput('input[aria-label="통과 기준 개수"]', '1');
  await pickRule('통과/실패 제출');
  check(await run(`document.querySelector('[data-testid=is063-mid]').textContent.includes('미달(실패)이면 제출되지 않고')`), '[IS063] Pass/fail submit explains that a failed quiz cannot be submitted');
  await clickButton('취소');
  check(await run(`!document.querySelector('[data-testid=is063-mid] .ck-editor__editable')`), '[IS063] Cancel clears the form');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'sample-list.png'), Buffer.from(shot.data, 'base64'));
  console.log('PASS: ' + checks + ' TODO69 common component sample checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
