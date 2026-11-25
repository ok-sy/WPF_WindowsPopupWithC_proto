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
    '--remote-debugging-port=9369', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9369/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
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
  // 5) 저장: 화면 입력 필드만 담은 저장 값이 편집값과 일치하고 목록이 바뀐다(서버 미전송 표시). proto 저장 값(기간·활성·대상 그룹)은 넣지 않는다.
  await clickButton('저장');
  let saved = await request();
  check(saved.title === '변경된 점검 제목' && saved.content.plainText.includes('추가문구') && saved.content.textBlocks[0].runs.some(r => r.text.includes('추가문구'))
    , 'Save value carries the edited title, blocks and plainText');
  check(['displayStartAt', 'displayEndAt', 'periodMode', 'repeatDayOfWeek', 'displayTimes', 'displayOrder', 'active', 'targetGroups', 'popup'].every(key => !(key in saved)),
    'Save value has no proto-only fields the screen does not edit (period·schedule·order·active·targets): ' + Object.keys(saved).join(','));
  check(await run(`Array.from(document.querySelectorAll('tbody tr')).some(r=>r.textContent.includes('변경된 점검 제목'))`) && await run(`document.body.textContent.includes('서버 미전송')`),
    'Local list is updated and the request is marked as not sent to a server');
  // 6) SURVEY: 미리보기 시연 응답이 저장값에 섞이지 않는다.
  await editRow('SAMPLE-SURVEY');
  await until(`!!${preview}?.querySelector('input[type=radio],input[type=checkbox]')`, 'survey preview');
  const before = await run(`document.querySelectorAll('[data-testid=sample-editor-form] input').length`);
  await run(`${preview}.querySelector('input[type=radio],input[type=checkbox]').click()`); await pause(200);
  await clickButton('저장');
  saved = await request();
  check(saved.popupType === 'SURVEY' && saved.questions.length > 0 && !JSON.stringify(saved).includes('"selected') && !JSON.stringify(saved).includes('"answer"'),
    'Preview demo answers do not leak into the survey save request');
  check(before > 0, 'Question editor renders inputs for each question');
  // 6-1) 미설정 기준: 신규를 바로 저장하면 입력하지 않은 값(창 크기·나중에 보기·content 옵션)은 키가 없다(서버 기본값 적용 대상).
  await clickButton('신규');
  await until(`!!document.querySelector('[data-testid=sample-editor-form]')`, 'new editor (unset)');
  check(await run(`${preview}.textContent.length > 0`), 'New unset popup still renders the inline preview (preview fallback)');
  await clickButton('저장');
  saved = await request();
  check(['width', 'height', 'showLater', 'sizeMode', 'showFooter'].every(key => !(key in saved)) && Object.keys(saved.content).length === 0,
    'New popup save value omits values the screen did not enter: ' + JSON.stringify(saved));
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
  check(await run(`${right}.querySelector('.MuiPaper-root').getBoundingClientRect().height > 300`), 'IS063 inline preview fills the right column');
  check(await run(`${mid}.querySelector('h4').textContent==='텍스트 컨텐츠'`), '[IS063] Middle title follows the selected type');
  await setInput('input[aria-label="헤더 제목"]', 'IS063 헤더'); await setInput('input[aria-label="컨텐츠 명"]', 'IS063 컨텐츠');
  await run(`(()=>{const ed=${mid}.querySelector('.ck-editor__editable').ckeditorInstance;ed.model.change(w=>w.insertText('IS063 본문',ed.model.document.selection.getFirstPosition()));})()`); await pause(300);
  check(await run(`${right}.textContent.includes('IS063 헤더') && ${right}.textContent.includes('IS063 본문')`), '[IS063] Shared editor and header title feed the right preview');
  await clickButton('실제 크기로 보기');
  await until(`!!document.querySelector('[aria-label="실제 크기 미리보기 종료"]')`, 'is063 modal');
  check(await run(`Array.from(document.querySelectorAll('.MuiDialog-root')).at(-1).textContent.includes('IS063 본문')`), '[IS063] Preview button opens the shared modal with the same popup');
  await run(`document.querySelector('[aria-label="실제 크기 미리보기 종료"]').click()`); await pause(400);
  // 2026-11-25 IMAGE가 아닌 폼은 가로·세로를 비운 채 저장하면 막는다(서버 필수 규칙). 폼 생성 때 값을 채우지는 않는다.
  check(await run(`document.querySelector('input[aria-label="가로"]').value==='' && document.querySelector('input[aria-label="세로"]').value===''`), '[IS063 size] New TEXT form does not prefill size');
  await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('가로·세로를 입력')`), '[IS063 size] Empty size is rejected for TEXT like the server: ' + await run(`document.querySelector('[role=alert]')?.textContent`));
  await setInput('input[aria-label="세로"]', '420'); await run(`document.querySelector('input[aria-label="세로"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`); await pause(150);
  await setInput('input[aria-label="가로"]', '299'); await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('300')`), '[IS063] Size below 300 is rejected (TODO68)');
  await setInput('input[aria-label="가로"]', '640'); await clickButton('저장');
  saved = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`));
  check(saved.popupType === 'TEXT' && saved.title === 'IS063 헤더' && saved.width === 640 && saved.content.plainText.includes('IS063 본문')
    && !('attachedFileName' in saved.content) && !JSON.stringify(saved).includes('IS063 컨텐츠'), '[IS063] Save request matches the edit; content name is not invented into the contract');
  check(!('displayStartAt' in saved) && !('periodMode' in saved) && !('active' in saved) && !('targetGroups' in saved), '[IS063] Save value has no period·schedule·active·targets (no input on this screen)');
  check(saved.height === 420 && !('showLater' in saved) && !('footerAction' in saved.content), '[IS063] Typed height 420 is saved; unset showLater·footerAction stay out of the save value (server defaults): ' + JSON.stringify(saved));
  await clickButton('닫기');
  // [예시] pickPopupFields 버튼: 호출 코드와 결과를 보여 준다. 입력하지 않은 항목(기간 등)은 결과에 없다.
  await clickButton('pickPopupFields로 가져오기');
  const picked = JSON.parse(await run(`document.querySelector('[data-testid=is063-pick-result]').textContent`));
  check(await run(`document.querySelector('[data-testid=is063-pick-code]').textContent.includes('pickPopupFields(popup, {')`)
    && picked.title === 'IS063 헤더' && picked.width === 640 && picked.content.plainText.includes('IS063 본문') && !('displayStartAt' in picked) && !('imageUrl' in picked.content),
    '[IS063] pickPopupFields button shows the call code and only entered fields: ' + JSON.stringify(picked).slice(0, 200));
  await clickButton('닫기');
  // 미설정 완료 비율: 저장 값에는 넣지 않는다. 미리보기의 '완료 기준·기본 음량' 안내는 WPF에 없어 TODO61-17에서 지웠다.
  await pickType('동영상 + 퀴즈 팝업'); await clickButton('폼 생성');
  // [20261110 후속 6] 등록 미리보기는 예시 표시 OFF: 영상 첨부 전에도 영상 영역(검정 + 재생 아이콘) 자리를 유지하고 안내 문구만 숨긴다.
  check(await run(`!${right}.textContent.includes('완료 기준') && !!${right}.querySelector('[data-testid=aspect-video-area]') && !${right}.textContent.includes('영상 재생 영역')`),
    '[IS063] VIDEO+QUIZ preview keeps the video area without the caption until a video is attached, without the preview-only completion caption (TODO61-17)');
  // 유형 전환: 공통 입력값 유지, 문항 편집기로 다시 구성.
  await pickType('퀴즈 팝업'); await clickButton('폼 생성');
  check(await run(`${mid}.textContent.includes('문항 추가') && document.querySelector('input[aria-label="헤더 제목"]').value==='IS063 헤더'`),
    '[IS063] Type change rebuilds the question area and keeps common inputs');
  // 불러오기 → 문항별 정답 선택이 서로 독립(원본의 공유 라디오 state 정리).
  await clickButton('불러오기');
  await run(`Array.from(document.querySelectorAll('[role=menuitem]')).find(o=>o.textContent.startsWith('SAMPLE-QUIZ')).click()`); await pause(500);
  // 2026-11-18: 문항 제목·설명 편집기는 위 라벨·'서식' 버튼을 숨기고 라벨을 묶음 접근 이름으로만 둔다.
  await until(`!!${mid}.querySelector('[role=group][aria-label="1번 문항 제목(필수)"] .ck-editor__editable')`, 'question title editor');
  const editorHead = await run(`(()=>{const m=${mid};const g=l=>m.querySelector('[role=group][aria-label="'+l+'"]');
    return {title:!!g('1번 문항 제목(필수)'),desc:!!g('설명'),fmt:Array.from(m.querySelectorAll('button')).filter(b=>b.textContent==='서식').length,
      caption:Array.from(m.querySelectorAll('.MuiTypography-caption')).some(e=>/^문항 제목|^설명$/.test(e.textContent))};})()`);
  check(editorHead.title && editorHead.desc && editorHead.fmt === 0 && !editorHead.caption,
    '[IS063] Question title and description editors hide the label and format button: ' + JSON.stringify(editorHead));
  await setInput('input[aria-label="헤더 제목"]', '보안 퀴즈'); await clickButton('저장');
  const first = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  await run(`document.querySelector('input[aria-label="1번 문항 2번 선택지 정답"]').click()`); await pause(200); await clickButton('저장');
  const second = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(first.questions.length >= 2 && JSON.stringify(first.questions[0]) !== JSON.stringify(second.questions[0])
    && JSON.stringify(first.questions[1]) === JSON.stringify(second.questions[1]) && !('footerAction' in second.content),
    '[IS063] Per-question answer selection is independent; quiz save omits footerAction (SUBMIT is fixed by the server)');
  // [확정 점수 규칙] 문항 1점 고정·총점 = 문항 수, 만점 통과 = 문항 수, 커트라인 N개 = N점.
  check(await run(`!document.querySelector('[data-testid=is063-mid]').textContent.includes('배점 모두 1점') && !Array.from(document.querySelectorAll('[data-testid=is063-mid] label')).some(l=>l.textContent==='배점' || l.textContent==='통과 점수')`),
    '[IS063] Quiz score is fixed at 1 point: no per-question score or passing score input');
  const count = second.questions.length;
  check(second.questions.every(q => q.questionScore === 1 && q.isScored === true) && second.passingScore === 2,
    '[IS063] Loaded quiz keeps cutoff 2 and saves every question as 1 point: ' + JSON.stringify(second.questions.map(q => q.questionScore)) + ' / ' + second.passingScore);
  const pickRule = async label => {
    await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
    await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent===${JSON.stringify(label)}).click()`); await pause(300);
  };
  await pickRule('만점형');
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 ${count}점')`), '[IS063] Full-score pass shows passing score = question count');
  await clickButton('저장');
  let rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.passingScore === count, `[IS063] Full-score pass saves passingScore ${count} for ${count} questions`);
  await pickRule('컷트라인형'); await setInput('input[aria-label="통과 기준 개수"]', '1'); await clickButton('저장');
  rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.passingScore === 1 && rule.questions.every(q => q.questionScore === 1), '[IS063] Cutoff 1 saves passingScore 1');
  await setInput('input[aria-label="통과 기준 개수"]', String(count + 1)); await clickButton('저장');
  check(await run(`document.querySelector('[role=alert]')?.textContent.includes('커트라인 점수')`), '[IS063] Cutoff above the question count is rejected');
  await setInput('input[aria-label="통과 기준 개수"]', '1');
  // 컷트라인형은 미달이면 통과하지 못한다는 안내, 참여형도 기준 개수(통계용 합격 기준)를 입력하고 제출하면 완료된다는 안내.
  check(await run(`document.querySelector('[data-testid=is063-mid]').textContent.includes('미달이면 통과(passed=true)가 되지 않습니다')`), '[IS063] Cutoff explains that a failed quiz does not pass');
  await clickButton('저장');
  rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.passingScore === 1 && rule.quizTypeCode === '02', '[IS063] Cutoff saves quizTypeCode 02: ' + rule.quizTypeCode);
  await pickRule('참여형');
  check(await run(`!!document.querySelector('input[aria-label="통과 기준 개수"]') && document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 1점') && document.querySelector('[data-testid=is063-mid]').textContent.includes('제출하면 완료됩니다')`), '[IS063] Participation has a count input and completion text');
  await setInput('input[aria-label="통과 기준 개수"]', String(count)); await clickButton('저장');
  rule = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(rule.passingScore === count && rule.quizTypeCode === '00', `[IS063] Participation saves passingScore ${count} and quizTypeCode 00: ` + JSON.stringify([rule.passingScore, rule.quizTypeCode]));
  check(rule.questions.every(q => q.questionType === 'SINGLE_CHOICE'), '[IS063] Sample quiz has only single choice questions');
  check(!('surveyTitle' in rule.content) && !('surveyTitleBlocks' in rule.content) && rule.questions.every(q => !('description' in q)), '[IS063] Quiz save omits the content title and question description');
  check(await run(`!document.querySelector('[data-testid=is063-mid]').textContent.includes('콘텐츠 제목') && !document.querySelector('[data-testid=is063-mid]').textContent.includes('문항 설명')`), '[IS063] Content title and question description inputs are removed');
  // 69-11~18: 3분할을 유지한 채 중앙 문항 편집 영역 밀도를 높인다(폭 회귀·커서·저장값 포함).
  const measureMid = () => run(`(()=>{const m=${mid},del=document.querySelector('[aria-label="1번 문항 삭제"]'),card=del.parentElement.parentElement.parentElement;
    const title=card.querySelector('textarea[aria-label="1번 문항 제목"]')?.closest('.MuiInputBase-root')??card.querySelector('.ck-editor__editable');
    const sel=Array.from(card.querySelectorAll('.MuiSelect-select')),labels=Array.from(card.querySelectorAll('.MuiInputLabel-root'));
    const cols=Array.from(document.querySelector('.nResultArea').children).map(c=>Math.round(c.getBoundingClientRect().top));
    return {mid:Math.round(m.getBoundingClientRect().width),overflow:m.scrollWidth-m.clientWidth,page:document.documentElement.scrollWidth-document.documentElement.clientWidth,card:Math.round(card.getBoundingClientRect().height),
      title:Math.round(title.getBoundingClientRect().height),selectH:sel[0]?Math.round(sel[0].closest('.MuiTextField-root').getBoundingClientRect().height):0,
      selectTops:sel.map(e=>Math.round(e.getBoundingClientRect().top)),clipped:sel.filter(e=>e.scrollWidth>e.clientWidth).length+labels.filter(e=>e.scrollWidth>e.clientWidth).length,cols};})()`);
  // TODO73-28: 선택지는 일반 입력(TextField multiline). 번호는 입력칸 앞 표시, 접근성 이름은 'N번 문항 선택지 M'.
  const measureOption = () => run(`(()=>{const del=document.querySelector('[aria-label="선택지 1 삭제"]'),row=del.closest('.MuiStack-root'),area=row.querySelector('textarea[aria-label]'),edit=area.closest('.MuiInputBase-root'),radio=row.querySelector('input[type=radio]');
    const r=edit.getBoundingClientRect(),d=del.getBoundingClientRect();
    return {height:Math.round(row.getBoundingClientRect().height),edit:Math.round(r.height),width:Math.round(r.width),del:{w:Math.round(d.width),h:Math.round(d.height)},number:area.getAttribute('aria-label'),
      shortLabel:edit.querySelector('.MuiInputAdornment-root')?.textContent??null,sameLine:Math.abs(d.top-r.top)<8&&(!radio||Math.abs(radio.parentElement.getBoundingClientRect().top-r.top)<8),overflow:area.scrollWidth-area.clientWidth};})()`);
  await clickButton('저장'); const beforeResize = await run(`document.querySelector('[data-testid=is063-save-request]').textContent`); await clickButton('닫기');
  const quizWide = await measureMid(), optionWide = await measureOption();
  console.log('[69 density] quiz@1400', JSON.stringify(quizWide), JSON.stringify(optionWide));
  await run(`void (window.__title69=document.querySelector(${JSON.stringify('[data-testid=is063-mid] .nQuizBox .ck-editor__editable')}))`);
  check(quizWide.cols.every(top => top === quizWide.cols[0]), '[69-17] Three columns stay on one row at 1400');
  check(quizWide.overflow <= 0 && quizWide.page <= 0 && quizWide.clipped === 0, '[69-11] Quiz editor has no horizontal overflow or clipped select: ' + JSON.stringify(quizWide));
  check(quizWide.title <= 40 && quizWide.selectH <= 40, '[69-12·13] Question title and select heights are compact: ' + JSON.stringify(quizWide));
  check(optionWide.sameLine && optionWide.edit <= 40 && optionWide.height <= 40 && optionWide.number === '1번 문항 선택지 1' && optionWide.shortLabel === null, '[69-14] Option input and delete share one line, no auto number in the input (2026-11-10): ' + JSON.stringify(optionWide));
  check(optionWide.del.w >= 32 && optionWide.del.h >= 32, '[69-16] Option delete keeps a 32px click target: ' + JSON.stringify(optionWide.del));
  const addButtons = await run(`Array.from(${mid}.querySelectorAll('button')).filter(b=>['선택지 추가','문항 추가'].includes(b.textContent.trim())).map(b=>{
    const name=b.textContent.trim(), row=name==='문항 추가'?b.parentElement.parentElement:b.parentElement;
    const style=getComputedStyle(row), start=row.getBoundingClientRect().left+parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft);
    return {name,offset:b.getBoundingClientRect().left-start};
  })`);
  check(new Set(addButtons.map(b=>b.name)).size === 2 && addButtons.every(b=>Math.abs(b.offset)<1), '[69-16] Add buttons align to the start of their containers: ' + JSON.stringify(addButtons));
  await send('Emulation.setDeviceMetricsOverride', {width: 1024, height: 950, deviceScaleFactor: 1, mobile: false}); await pause(300);
  const quizNarrow = await measureMid(), optionNarrow = await measureOption();
  console.log('[69 density] quiz@1024', JSON.stringify(quizNarrow), JSON.stringify(optionNarrow));
  check(quizNarrow.cols.every(top => top === quizNarrow.cols[0]) && quizNarrow.overflow <= 0 && quizNarrow.page <= 0 && quizNarrow.clipped === 0, '[69-17] Narrow window keeps three columns without overflow: ' + JSON.stringify(quizNarrow));
  check(optionNarrow.sameLine && optionNarrow.width >= 140, '[69-14] Narrow option row keeps a usable input width: ' + JSON.stringify(optionNarrow));
  check(await run(`document.querySelector(${JSON.stringify('[data-testid=is063-mid] .nQuizBox .ck-editor__editable')})===window.__title69`), '[69-18] Resizing keeps the same quiz title editor (no remount, RichTextEditor since 2026-11-10)');
  await clickButton('저장'); const afterResize = await run(`document.querySelector('[data-testid=is063-save-request]').textContent`); await clickButton('닫기');
  check(afterResize === beforeResize, '[69-18] Layout change does not alter the save value');
  // 긴 선택지는 줄바꿈으로 계속 편집하고, 미리보기에 그대로 전달한다.
  // QUIZ 선택지는 UTF-8 300 Byte까지라(TODO73-36) 기존 문구와 합쳐 한도 안인 길이(216 Byte + 기존)로 넣는다.
  const longOption = '긴선택지'.repeat(18);
  const optionArea = `document.querySelector('[aria-label="선택지 1 삭제"]').closest('.MuiStack-root').querySelector('textarea[aria-label]')`;
  await run(`(()=>{const i=${optionArea};window.__option69=i;Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,${JSON.stringify(longOption)}+i.value);i.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(300);
  const optionLong = await measureOption(), quizLong = await measureMid();
  check(optionLong.edit > optionNarrow.edit && optionLong.overflow <= 0 && quizLong.overflow <= 0, '[69-14] Long option wraps inside the row: ' + JSON.stringify(optionLong));
  check(await run(`${right}.textContent.includes(${JSON.stringify(longOption)})`), '[69-18] Option text reaches the inline preview');
  check(await run(`${optionArea}===window.__option69`), '[69-18] Typing keeps the same option input');
  const optionBefore = await run(`document.querySelectorAll('[aria-label$="선택지 정답"]').length`);
  await clickButton('선택지 추가', mid); await pause(300);
  check(await run(`document.querySelectorAll('[aria-label$="선택지 정답"]').length`) === optionBefore + 1 && await run(`${optionArea}===window.__option69`), '[69-18] Adding an option keeps the other inputs');
  fs.writeFileSync(path.join(output, 'is063-quiz-1024.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true})).data, 'base64'));
  // 설문: 응답 유형·레이아웃·응답 수는 폭이 되면 한 행, 좁으면 줄바꿈한다.
  await send('Emulation.setDeviceMetricsOverride', {width: 1400, height: 950, deviceScaleFactor: 1, mobile: false}); await pause(200);
  await clickButton('불러오기');
  await run(`Array.from(document.querySelectorAll('[role=menuitem]')).find(o=>o.textContent.startsWith('SAMPLE-SURVEY')).click()`); await pause(500);
  await until(`!!document.querySelector('[aria-label="1번 문항 응답 유형"]')`, 'survey editor');
  const surveyWide = await measureMid();
  console.log('[69 density] survey@1400', JSON.stringify(surveyWide));
  check(surveyWide.selectTops.length >= 3 && surveyWide.selectTops.slice(0, 3).every(top => top === surveyWide.selectTops[0]) && surveyWide.clipped === 0 && surveyWide.overflow <= 0, '[69-13] Survey selects share one row when wide: ' + JSON.stringify(surveyWide));
  await send('Emulation.setDeviceMetricsOverride', {width: 1024, height: 950, deviceScaleFactor: 1, mobile: false}); await pause(300);
  fs.writeFileSync(path.join(output, 'is063-survey-1024.png'), Buffer.from((await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: true})).data, 'base64'));
  const surveyNarrow = await measureMid();
  console.log('[69 density] survey@1024', JSON.stringify(surveyNarrow));
  check(surveyNarrow.overflow <= 0 && surveyNarrow.page <= 0 && surveyNarrow.clipped === 0, '[69-13] Survey selects wrap without overlap or clipping when narrow: ' + JSON.stringify(surveyNarrow));
  await send('Emulation.setDeviceMetricsOverride', {width: 1400, height: 950, deviceScaleFactor: 1, mobile: false}); await pause(200);
  // 2026-11-25 IMAGE 창 우선 맞춤: '세로 자동' 경로와 '이미지 크기에 맞추기' 버튼 경로가 창 최대(미리보기 기본 1200×900)에 걸리는
  // 세로형 이미지에서 같은 가로·세로를 화면·안내·저장 값에 남기는지, 가로 마지막 자리를 지울 수 있는지 확인한다.
  const tall = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1600"><rect width="400" height="1600" fill="red"/></svg>');
  await pickType('이미지 팝업'); await clickButton('폼 생성');
  await run(`(()=>{const e=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.trim()==='이미지 URL').parentElement.querySelector('input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(tall)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await until(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('이미지 크기에 맞추기')&&!b.disabled)`, 'is063 natural image size');
  await pause(400);
  await run(`window.__sz=()=>({width:document.querySelector('input[aria-label="가로"]').value,height:document.querySelector('input[aria-label="세로"]').value});
    window.__note=()=>{const m=/가장 큰 크기는 (\\d+)×(\\d+)px입니다/.exec(document.body.innerText);return m?{width:+m[1],height:+m[2]}:null;};
    window.__typeW=(v)=>{const e=document.querySelector('input[aria-label="가로"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};`);
  await run(`window.__typeW('1000')`); await run(`document.querySelector('input[aria-label="가로"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`); await pause(400);
  const autoSize = await run('window.__sz()'), autoNote = await run('window.__note()');
  check(autoNote && +autoSize.width === autoNote.width && +autoSize.height === autoNote.height && autoNote.height <= 900 && autoNote.width >= 300 && autoNote.width < 1000,
    '[IS063 fit] Auto height path shrinks both axes to the maximum and the fields match the notice: ' + JSON.stringify({autoSize, autoNote}));
  await clickButton('저장');
  let fitSaved = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(fitSaved.width === autoNote.width && fitSaved.height === autoNote.height, '[IS063 fit] Auto height path saves the noticed size: ' + JSON.stringify({w: fitSaved.width, h: fitSaved.height}));
  for (const value of [autoSize.width.slice(0, 2), autoSize.width.slice(0, 1), '']) await run(`window.__typeW(${JSON.stringify(value)})`);
  await pause(300);
  check((await run('window.__sz()')).width === '', '[IS063 fit] The last digit of the width can be deleted while auto height is on');
  await run(`document.querySelector('input[aria-label="가로"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`); await pause(400);
  check(JSON.stringify(await run('window.__sz()')) === JSON.stringify(autoSize), '[IS063 fit] Leaving an empty width refits to the same capped size');
  await run(`Array.from(document.querySelectorAll('label')).find(l=>l.textContent.includes('이미지에 맞춰 세로 자동')).querySelector('input').click()`); await pause(200);
  await run(`window.__typeW('1000')`); await run(`document.querySelector('input[aria-label="가로"]').dispatchEvent(new FocusEvent('focusout',{bubbles:true}))`); await pause(200);
  check((await run('window.__sz()')).width === '1000', '[IS063 fit] With auto height off the typed width stays');
  await clickButton('이미지 크기에 맞추기'); await pause(300);
  check(JSON.stringify(await run('window.__sz()')) === JSON.stringify(autoSize), '[IS063 fit] Fit button path sets the same capped size as the auto path: ' + JSON.stringify(await run('window.__sz()')));
  await clickButton('저장');
  fitSaved = JSON.parse(await run(`document.querySelector('[data-testid=is063-save-request]').textContent`)); await clickButton('닫기');
  check(fitSaved.width === +autoSize.width && fitSaved.height === +autoSize.height, '[IS063 fit] Fit button path saves the shown size');
  await clickButton('취소');
  check(await run(`!document.querySelector('[data-testid=is063-mid] .ck-editor__editable')`), '[IS063] Cancel clears the form');
  // 2026-11-25 공통코드 0101 연결: 라우트처럼 searchCodes를 넘기면 창 최대(MAXW·MAXH)·가로·세로 입력 하한(MINW·MINH)이 코드 값으로 바뀐다.
  //   SIZEMIN은 삭제한 코드라 남아 있어도 무시(알 수 없는 코드), 숫자 아닌 WRATIO도 무시.
  await send('Page.addScriptToEvaluateOnNewDocument', {source: "window.__defaultCodes=[{code:'MAXW',codeNm:'900'},{code:'MAXH',codeNm:'700'},{code:'MINW',codeNm:'320'},{code:'MINH',codeNm:'330'},{code:'SIZEMIN',codeNm:'500'},{code:'WRATIO',codeNm:'abc'}]"});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port + '/#is063-codes'}); await pause(300);
  await run('location.reload()'); await until(`!!document.querySelector('[data-testid=is063-left]')`, 'is063 codes'); await pause(300);
  await pickType('이미지 팝업'); await clickButton('폼 생성');
  await until(`!!document.querySelector('input[aria-label="가로"]')`, 'is063 codes form');
  check(await run(`document.querySelector('input[aria-label="가로"]').min`) === '320', '[IS063 0101] Code MINW 320 is the width input minimum (SIZEMIN 500 ignored): ' + await run(`document.querySelector('input[aria-label="가로"]').min`));
  check(await run(`document.querySelector('input[aria-label="세로"]').min`) === '330', '[IS063 0101] Code MINH 330 is the height input minimum: ' + await run(`document.querySelector('input[aria-label="세로"]').min`));
  // 2026-11-25 정수 칸 소수점 방어: '.'·'e' 키는 막고, 붙여 넣은 소수는 화면·값에 반영하지 않는다.
  const decimal = await run(`(()=>{const e=document.querySelector('input[aria-label="세로"]');const keys={};
    for(const k of ['.','e','5']){const ev=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true});e.dispatchEvent(ev);keys[k]=ev.defaultPrevented;}
    return keys;})()`);
  check(decimal['.'] === true && decimal.e === true && decimal['5'] === false, '[IS063 integer] Size input blocks decimal and exponent keys only: ' + JSON.stringify(decimal));
  await run(`(()=>{const e=document.querySelector('input[aria-label="세로"]');e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'480');e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(150);
  await run(`(()=>{const e=document.querySelector('input[aria-label="세로"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'480.5');e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(150);
  check(await run(`document.querySelector('input[aria-label="세로"]').value`) === '480', '[IS063 integer] Pasted 480.5 is not taken (value stays 480): ' + await run(`document.querySelector('input[aria-label="세로"]').value`));
  await run(`(()=>{const e=Array.from(document.querySelectorAll('label')).find(l=>l.textContent.trim()==='이미지 URL').parentElement.querySelector('input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(tall)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await until(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('이미지 크기에 맞추기')&&!b.disabled)`, 'is063 codes natural image size');
  await pause(400);
  await run(`window.__sz=()=>({width:document.querySelector('input[aria-label="가로"]').value,height:document.querySelector('input[aria-label="세로"]').value});
    window.__note=()=>{const m=/가장 큰 크기는 (\\d+)×(\\d+)px입니다/.exec(document.body.innerText);return m?{width:+m[1],height:+m[2]}:null;};`);
  await clickButton('이미지 크기에 맞추기'); await pause(300);
  const codeSize = await run('window.__sz()'), codeNote = await run('window.__note()');
  check(codeNote && +codeSize.width === codeNote.width && +codeSize.height === codeNote.height && codeNote.height <= 700 && codeNote.width <= 900 && codeNote.height < autoNote.height,
    '[IS063 0101] Code MAXW 900·MAXH 700 caps the image fit below the file default: ' + JSON.stringify({codeSize, codeNote, fileDefault: autoNote}));
  await clickButton('취소');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'sample-list.png'), Buffer.from(shot.data, 'base64'));
  console.log('PASS: ' + checks + ' TODO69 common component sample checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
