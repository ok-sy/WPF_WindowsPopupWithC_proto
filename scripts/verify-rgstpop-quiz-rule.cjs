// RgstPop 등록 편집기(테스트 화면)에 전달 샘플과 같은 퀴즈 점수 규칙이 적용되는지 headless Edge로 확인한다.
// 규칙: 문항 1점 고정(총점 = 문항 수), 만점 통과 = 문항 수, 커트라인 N개 = N점(실패 시 제출 불가), 참여형도 N개(통계용 합격 기준, 제출하면 완료).
// 퀴즈 유형 코드 quizTypeCode(0090: 00 참여형·01 만점형·02 컷트라인형)를 함께 저장하고, 다시 열면 코드로 유형을 복원한다(코드 없으면 통과 점수로 추정).
// 관리자 API는 @/provider 대역으로 바꿔 서버 없이 실행한다. 저장소 루트에서: node scripts/verify-rgstpop-quiz-rule.cjs
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/rgstpop-quiz');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
fs.writeFileSync(path.join(output, 'handle-error-shim.js'), 'module.exports = function handleError(e) { (window.__errors = window.__errors || []).push(String(e)); }; module.exports.default = module.exports;');
fs.writeFileSync(path.join(output, 'provider-shim.js'), `const codes = { '0089': [{code: '01', codeNm: 'OX형'}, {code: '02', codeNm: '선다형'}], '0090': [{code: '00', codeNm: '참여코드'}, {code: '01', codeNm: '만점코드'}, {code: '02', codeNm: '컷트코드'}, {code: '99', codeNm: '매핑없음'}] };
const api = { clCode: { search: async (params) => { (window.__codeCalls = window.__codeCalls || []).push(params.codeType); if (window.__codeFail) throw new Error('code fail'); return { body: { pagerData: { elements: params.codeType === '0101' ? (window.__defaultCodes || []) : (codes[params.codeType] || []) } } }; } }, popupAdmin: {
  info: async ({popupId}) => { if (popupId === "FAILED") throw Error("fixture lookup failure"); return ({ body: { popup: window.__detail, targetGroups: [{ targetName: 'ALL', targetDescription: '', conditions: [{ conditionType: 'EMPLOYEE_NO', conditionOperator: '=', value: 'E1001', includeChild: false }] }] } }); },
  save: async (request) => { window.__saved = request; return { body: { popup: { popupId: request.popup.popupId } } }; },
  list: async () => ({ body: [] }),
  questionTemplates: async () => ({ body: { templates: [] } }),
  questionTemplate: async () => ({ body: { questions: [] } }),
} };
exports.useApi = () => api; exports.api = api;`);
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-rgstpop-quiz-rule-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/components/ckeditor$': path.join(root, 'zero-rule-web/main/src/components/ckeditor'), '@/lib/urls$': path.join(output, 'urls-shim.js'),
        '@/lib/handle-error$': path.join(output, 'handle-error-shim.js'), '@/provider$': path.join(output, 'provider-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/},
      // CKEditor 공통 엔진(ckeditor5)의 CSS를 style 태그로 넣는다.
      {test: /\.css$/, use: path.join(__dirname, 'verify-css-loader.cjs')},
      {test: /\.css$/, type: 'asset/source'}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--remote-debugging-port=9371', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9371/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  if (!targets?.length) throw Error('Chromium did not start; set BROWSER_PATH');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map(); const errors = [];
  socket.on('message', raw => {const m = JSON.parse(raw);
    if (m.method === 'Runtime.exceptionThrown' && !m.params.exceptionDetails.url?.startsWith('chrome-extension://')) errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const until = async (expression, label) => { for (let i = 0; i < 100; i++) { if (await run(expression)) return; await pause(100); } throw Error('timeout: ' + label + ' ' + errors.join(' | ')); };
  const setInput = async (selector, value) => { await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(200); };
  const pickRule = async label => {
    await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
    await run(`Array.from(document.querySelectorAll('[role=option]')).find(o=>o.textContent===${JSON.stringify(label)}).click()`); await pause(300);
  };
  const save = async () => { await run(`window.__saved=null;Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='저장').click()`); await pause(600); return run('window.__saved'); };
  const toastText = () => run(`Array.from(document.querySelectorAll('.Toastify__toast')).map(t=>t.textContent).join(' | ')`);
  const mount = async (passingScore, questionScore, quizTypeCode) => {
    await run(`window.mountQuiz(${JSON.stringify(passingScore)}, ${questionScore}${quizTypeCode === undefined ? '' : ', ' + JSON.stringify(quizTypeCode)})`);
    await until(`!!document.querySelector('[aria-label="퀴즈유형"]')`, 'quiz rule fields');
    await pause(400);
  };

  // 오류 수집(Runtime.exceptionThrown)은 Edge 기본 확장 프로그램(chrome-extension://) 콘텐츠 스크립트 오류를 제외한다.
  // CKEditor 49는 문서에 포커스가 있어야 편집 영역을 포커스 상태로 본다(headless 창은 포커스가 없어 선택 영역이 그려지지 않음).
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', {enabled: true}); await send('Emulation.setDeviceMetricsOverride', {width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  await until(`typeof window.mountQuiz === 'function'`, 'entry');

  // 1) 기존 데이터(배점 5점·통과 점수 1) 불러오기: 커트라인 1로 복원, 배점 입력 없음, 저장 시 전 문항 1점.
  await mount(1, 5);
  const count = await run('window.__detail.questions.length');
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 1점') && document.querySelector('[aria-label="통과 기준 개수"]').value==='1'`),
    'Loaded quiz with passingScore 1 restores cutoff 1');
  check(await run(`!Array.from(document.querySelectorAll('label')).some(l=>l.textContent==='배점' || l.textContent==='통과 점수') && !document.body.textContent.includes('배점 모두 1점')`),
    'RgstPop editor hides per-question score and passing score inputs');
  let saved = await save();
  check(saved && saved.popup.passingScore === 1 && saved.popup.quizTypeCode === '02' && saved.popup.questions.every(q => q.questionScore === 1 && q.isScored === true),
    'Save sends every question as 1 point, passingScore 1 and quizTypeCode 02: ' + JSON.stringify(saved && saved.popup.questions.map(q => q.questionScore)) + ' toast=' + await toastText());
  // 2) 만점 통과 = 문항 수.
  await pickRule('만점코드');
  saved = await save();
  check(saved && saved.popup.passingScore === count && saved.popup.quizTypeCode === '01', `Full-score pass saves passingScore = ${count} questions and quizTypeCode 01`);
  // 3) 커트라인 범위 밖 거절, 1은 허용.
  await pickRule('컷트코드'); await setInput('input[aria-label="통과 기준 개수"]', String(count + 1));
  saved = await save();
  check(saved === null && (await toastText()).includes('커트라인 점수'), 'Cutoff above the question count is rejected');
  await setInput('input[aria-label="통과 기준 개수"]', '1');
  saved = await save();
  check(saved && saved.popup.passingScore === 1 && saved.popup.quizTypeCode === '02', 'Cutoff 1 saves passingScore 1 and quizTypeCode 02');
  // 4) 공통코드: 0089·0090을 조회하고 코드 이름을 표시하며, 매핑 없는 코드는 뺀다.
  check((await run('window.__codeCalls.slice().sort().join()')).includes('0089,0090'), 'Editor loads code groups 0089 and 0090');
  await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`); await pause(300);
  const ruleLabels = await run(`Array.from(document.querySelectorAll('[role=option]')).map(o=>o.textContent).join()`);
  await run(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.querySelector('[role=listbox]')?.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await pause(300);
  check(ruleLabels === '선택하세요,참여코드,만점코드,컷트코드', 'Quiz types use code names and drop unmapped codes: ' + ruleLabels);
  // 5) 참여형(PU001 §7): 기준 개수 입력이 있고 passingScore = N·quizTypeCode '00'으로 저장한다. 미달이어도 제출하면 완료된다는 안내.
  await pickRule('참여코드');
  check(await run(`!!document.querySelector('[aria-label="통과 기준 개수"]') && document.body.textContent.includes('제출하면 완료됩니다')
    && !document.body.textContent.includes('제출하면 통과(passed=true)')`), 'Participation shows the count input and completion text');
  await setInput('input[aria-label="통과 기준 개수"]', '2');
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 2점')`), 'Participation count 2 shows passing score 2');
  saved = await save();
  check(saved && saved.popup.passingScore === 2 && saved.popup.quizTypeCode === '00' && saved.popup.questions.every(q => q.questionScore === 1 && q.isScored === true),
    'Participation saves passingScore 2 and quizTypeCode 00 with 1-point scored questions: ' + JSON.stringify(saved && [saved.popup.passingScore, saved.popup.quizTypeCode]) + ' toast=' + await toastText());
  await setInput('input[aria-label="통과 기준 개수"]', String(count + 1));
  saved = await save();
  check(saved === null && (await toastText()).includes('합격 기준 개수'), 'Participation count above the question count is rejected');
  await setInput('input[aria-label="통과 기준 개수"]', '0');
  saved = await save();
  check(saved === null && (await toastText()).includes('1개 이상의 정수'), 'Participation count 0 is rejected');
  // 5-1) 코드 '00' + passingScore = 문항 수(코드 없으면 만점형으로 추정될 값)로 다시 열어도 참여형 N개로 복원되고 그대로 저장된다.
  await mount(count, 1, '00');
  check(await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.textContent.includes('참여코드') && document.querySelector('[aria-label="통과 기준 개수"]').value===${JSON.stringify(String(count))}`),
    'Loaded quizTypeCode 00 with passingScore = question count restores participation, not full');
  saved = await save();
  check(saved && saved.popup.passingScore === count && saved.popup.quizTypeCode === '00', 'Re-saving participation keeps passingScore N and quizTypeCode 00: ' + JSON.stringify(saved && [saved.popup.passingScore, saved.popup.quizTypeCode]) + ' toast=' + await toastText());
  // 5-2) 컷트라인 N = 문항 수는 코드 '02'로 저장되어 다시 열어도 만점형이 아니라 컷트라인형이다.
  await mount(count, 1, '02');
  check(await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.textContent.includes('컷트코드') && document.querySelector('[aria-label="통과 기준 개수"]').value===${JSON.stringify(String(count))}`),
    'Loaded quizTypeCode 02 with N = question count reopens as cutoff, not full');
  saved = await save();
  check(saved && saved.popup.passingScore === count && saved.popup.quizTypeCode === '02', 'Cutoff N = question count saves quizTypeCode 02');
  await mount(1, 1, '01');
  check(await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.textContent.includes('만점코드') && !document.querySelector('[aria-label="통과 기준 개수"]')`),
    'Loaded quizTypeCode 01 restores full regardless of passingScore');
  saved = await save();
  check(saved && saved.popup.passingScore === count && saved.popup.quizTypeCode === '01', 'Full saves passingScore = question count and quizTypeCode 01');
  // 5-3) 코드 없는 기존 데이터: 통과 점수로 추정(0 = 참여형 1개, 문항 수 = 만점형).
  await mount(0, 1);
  check(await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.textContent.includes('참여코드') && document.querySelector('[aria-label="통과 기준 개수"]').value==='1'`),
    'Legacy passingScore 0 without code restores participation with count 1');
  saved = await save();
  check(saved && saved.popup.passingScore === 1 && saved.popup.quizTypeCode === '00', 'Re-saving a legacy participation quiz stores passingScore 1 and quizTypeCode 00: ' + JSON.stringify(saved && [saved.popup.passingScore, saved.popup.quizTypeCode]));
  await mount(count, 1);
  check(await run(`document.querySelector('[aria-label="퀴즈유형"]').parentElement.textContent.includes('만점코드')`), 'Legacy passingScore = question count without code falls back to full');
  // 6) 통과 점수 없는 데이터: 유형 미선택이면 저장 거절.
  await mount(null, 1);
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 -점')`), 'Quiz without passingScore starts unselected');
  saved = await save();
  check(saved === null && (await toastText()).includes('퀴즈유형'), 'Save without a quiz type is rejected');
  await run("window.mountQuiz(2,1,'01',true)");
  await until("Array.from(document.querySelectorAll('input')).some(e=>e.value==='추가 의견') || document.body.textContent.includes('기존 유형: 주관식')", 'opinion loaded');
  await run("Array.from(document.querySelectorAll('input')).find(e=>e.value==='보안 퀴즈').id='quiz-title-test'");
  await setInput('#quiz-title-test', '제목만 변경');
  saved = await save();
  check(saved?.popup.title === '제목만 변경' && saved.popup.passingScore === 2 && saved.popup.questions.length === 3
    && saved.popup.questions[2].isScored === false && saved.popup.questions[2].questionScore == null, 'Title-only change preserves unscored opinion and 2-point maximum');
  await run("window.__detail=structuredClone(window.__saved.popup); window.openQuiz('FAILED')");
  await until("window.__errors?.some(m=>m.includes('fixture lookup failure'))", 'detail failure');
  check(await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='저장').disabled"),'Failed detail disables save');
  check(await save() === null, 'Failed detail cannot submit previous ID');
  await run("window.openQuiz('RGST-QUIZ')");
  await until("Array.from(document.querySelectorAll('input')).some(e=>e.value==='제목만 변경')", 'saved title reloaded');
  saved = await save();
  check(saved?.popup.popupId === 'RGST-QUIZ' && saved.popup.questions[2].isScored === false && saved.popup.passingScore === 2,'Successful reload enables saving correct record');
  await run("window.__detail={...window.__detail,popupId:'OPINION',title:'의견만 있는 퀴즈',questions:[window.__detail.questions[2]],passingScore:0};window.openQuiz('OPINION',false)");
  await until("Array.from(document.querySelectorAll('input')).some(e=>e.value==='의견만 있는 퀴즈')", 'opinion-only quiz loaded');
  for (const label of ['만점코드', '참여코드', '컷트코드']) {
    await pickRule(label);
    check(await save() === null && (await toastText()).includes('채점 문항'), label + ' rejects an opinion-only quiz before save');
  }
  for (const type of ['IMAGE', 'VIDEO']) {
    await run(`window.__detail={...window.__detail,popupId:'MEDIA-${type}',popupType:'${type}',title:'Media ${type}',questions:[],content:{}};window.openQuiz('MEDIA-${type}')`);
    await until(`Array.from(document.querySelectorAll('input')).some(e=>e.value==='Media ${type}')`, 'media loaded');
    check(await save() === null && (await toastText()).includes('URL'), type + ' empty URL blocks active save');
    await run(`window.openQuiz('MEDIA-${type}',false)`);
    await pause(350);
    const draft = await save();
    check(draft?.popup.popupId === 'MEDIA-' + type && draft.active === false, type + ' inactive draft saves');
  }
  // 2026-11-25 숫자 입력 지우기(PopupNumberField)와 IMAGE 창 우선 크기 맞춤: '높이 자동' 체크 경로와 '이미지 크기에 맞추기' 버튼 경로가
  // 설정 최대(900)를 넘는 세로형 이미지에서 같은 너비·높이를 화면·안내·저장 값에 남기는지 각각 확인한다.
  const tall = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1600"><rect width="400" height="1600" fill="red"/></svg>');
  await run(`window.__field=(label)=>Array.from(document.querySelectorAll('label')).find(l=>l.textContent.replace('*','').trim()===label)?.parentElement.querySelector('input');
    window.__type=(label,value)=>{const e=window.__field(label);e.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));};
    window.__leave=(label)=>window.__field(label).blur();
    window.__fitNote=()=>{const m=/가장 큰 크기는 (\\d+)×(\\d+)px입니다/.exec(document.body.innerText);return m?{width:+m[1],height:+m[2]}:null;};
    window.__detail={...window.__detail,popupId:'IMG-FIT',popupType:'IMAGE',title:'Img fit',questions:[],sizeMode:'FIXED',width:1000,height:700,
      minimumWidth:300,minimumHeight:300,maximumWidth:1200,maximumHeight:900,content:{imageSizeMode:'ADAPTIVE',imageUrl:${JSON.stringify(tall)},imageTitle:'',description:''}};
    window.openQuiz('IMG-FIT')`);
  await until(`Array.from(document.querySelectorAll('input')).some(e=>e.value==='Img fit')`, 'image popup loaded');
  await until(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('이미지 크기에 맞추기')&&!b.disabled)`, 'natural image size');
  const sizes = () => run(`({width:window.__field('팝업 너비').value,height:window.__field('팝업 높이').value})`);
  check((await sizes()).width === '1000' && (await sizes()).height === '700', 'Editing an image popup keeps the stored size until a fit is requested: ' + JSON.stringify(await sizes()));
  // 자동 경로: 체크하면 입력 너비 1000이 설정 최대 900에 걸려 두 축이 함께 줄고, 화면·안내가 같은 값이다.
  await run(`Array.from(document.querySelectorAll('label')).find(l=>l.textContent.includes('이미지에 맞춰 높이 자동')).querySelector('input').click()`); await pause(400);
  const auto = await sizes(), autoNote = await run('window.__fitNote()');
  check(autoNote && +auto.width === autoNote.width && +auto.height === autoNote.height && autoNote.height <= 900 && autoNote.height > 880 && autoNote.width < 1000,
    'Auto height path shrinks both axes to the stored maximum and the fields match the notice: ' + JSON.stringify({auto, autoNote}));
  const autoSaved = await save();
  check(autoSaved?.popup.width === autoNote.width && autoSaved.popup.height === autoNote.height, 'Auto height path saves the noticed width and height: ' + JSON.stringify(autoSaved?.popup && {w: autoSaved.popup.width, h: autoSaved.popup.height}));
  // 이미 최대에 걸린 상태에서 너비만 다시 크게 넣어도(계산 결과는 같음) 자동 경로가 다시 맞춘다.
  await run(`window.__type('팝업 너비','1200')`); await run(`window.__leave('팝업 너비')`); await pause(400);
  check(JSON.stringify(await sizes()) === JSON.stringify(auto), 'Typing a larger width again while capped refits to the same maximum size: ' + JSON.stringify(await sizes()));
  // 숫자 지우기: 마지막 자리까지 지우면 빈 칸이 보이고(높이 자동이 다시 채우지 않음), 입력을 마치면 원본 기준으로 다시 맞춘다.
  for (const value of [String(auto.width).slice(0, 2), String(auto.width).slice(0, 1), '']) await run(`window.__type('팝업 너비', ${JSON.stringify(value)})`);
  await pause(300);
  check((await sizes()).width === '', 'The last digit of the image width can be deleted while auto height is on: ' + JSON.stringify(await sizes()));
  await run(`window.__leave('팝업 너비')`); await pause(400);
  check((await sizes()).width === auto.width && (await sizes()).height === auto.height, 'Leaving an empty width refits from the original size (same capped result): ' + JSON.stringify(await sizes()));
  // 버튼 경로: 자동을 끄고 너비 1000을 넣은 뒤 버튼을 누르면 자동 경로와 같은 두 축이 들어간다.
  await run(`Array.from(document.querySelectorAll('label')).find(l=>l.textContent.includes('이미지에 맞춰 높이 자동')).querySelector('input').click()`); await pause(200);
  await run(`window.__type('팝업 너비','1000')`); await run(`window.__leave('팝업 너비')`); await pause(200);
  check((await sizes()).width === '1000', 'With auto height off the typed width stays: ' + JSON.stringify(await sizes()));
  await run(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('이미지 크기에 맞추기')).click()`); await pause(400);
  const button = await sizes();
  check(button.width === auto.width && button.height === auto.height, 'Fit button path sets the same capped width and height as the auto path: ' + JSON.stringify({button, auto}));
  const buttonSaved = await save();
  check(buttonSaved?.popup.width === +button.width && buttonSaved.popup.height === +button.height, 'Fit button path saves the shown width and height');
  // 표시 우선순위·비율 등 필수 숫자칸: 지우면 빈 칸(0이 다시 보이지 않음), 입력을 마치면 이전 값으로 돌아간다.
  const order = await run(`window.__field('표시 우선순위').value`);
  await run(`window.__type('표시 우선순위','')`); await pause(200);
  check(await run(`window.__field('표시 우선순위').value`) === '', 'Display order shows an empty field instead of 0 while clearing');
  await run(`window.__leave('표시 우선순위')`); await pause(200);
  check(await run(`window.__field('표시 우선순위').value`) === order, 'Display order returns to the previous value when left empty');

  // 2026-11-25 공통코드 0101(팝업 기본값·입력 범위): 신규 등록 폼이 코드 값으로 열리고, 계약 범위를 넓히는 값·숫자 아닌 값·최소 > 최대는 무시한다.
  const unit = await run(`(()=>{const a=window.applyPopupDefaultCodes;const d=window.POPUP_DEFAULTS,r=window.POPUP_INPUT_RANGES;
    const one=a([{code:'WIDTH',codeNm:'640'},{code:'MAXH',codeNm:'800'},{code:'RATIOMAX',codeNm:'0.9'},{code:'FONTMAX',codeNm:'50'},{code:'MINW',codeNm:'abc'},{code:'NOPE',codeNm:'1'},{code:'WRATIO',codeNm:'0.95'}]);
    const first={width:d.window.width,maxH:d.window.maximumHeight,minW:d.window.minimumWidth,wRatio:d.window.widthRatio,ratioMax:r.ratio.max,fontMax:r.font.max,applied:one.applied.sort(),ignored:one.ignored.map(i=>i.code).sort()};
    const two=a([{code:'MINW',codeNm:'900'},{code:'MAXW',codeNm:'800'}]);
    const second={minW:d.window.minimumWidth,maxW:d.window.maximumWidth,width:d.window.width,ratioMax:r.ratio.max,ignored:two.ignored.map(i=>i.code)};
    a([]);return {first,second,reset:{width:d.window.width,maxH:d.window.maximumHeight,ratioMax:r.ratio.max}};})()`);
  check(JSON.stringify(unit.first) === JSON.stringify({width: 640, maxH: 800, minW: 300, wRatio: 0.7, ratioMax: 0.9, fontMax: 40, applied: ['MAXH', 'RATIOMAX', 'WIDTH'], ignored: ['FONTMAX', 'MINW', 'NOPE', 'WRATIO']}),
    '0101 codes apply valid values, ignore widening ranges, non-numbers, unknown codes and defaults outside the narrowed range: ' + JSON.stringify(unit.first));
  check(unit.second.minW === 300 && unit.second.maxW === 1200 && unit.second.width === 560 && unit.second.ratioMax === 1 && unit.second.ignored.includes('MINW/MAXW'),
    '0101 re-apply starts from file defaults and reverts minimum > maximum: ' + JSON.stringify(unit.second));
  check(JSON.stringify(unit.reset) === JSON.stringify({width: 560, maxH: 900, ratioMax: 1}), 'Applying no codes restores file defaults');
  await run(`window.__defaultCodes=[{code:'WIDTH',codeNm:'640'},{code:'HEIGHT',codeNm:'480'},{code:'MAXW',codeNm:'1000'},{code:'HIDEDAYSMAX',codeNm:'365'}];window.openNew()`);
  await until(`!!window.__field('창 최대 너비')`, 'new popup form');
  await pause(500);
  check(await run(`window.__field('창 최대 너비').value==='1000' && window.__codeCalls.includes('0101')`), 'New popup form opens with 0101 code defaults (maximum width 1000): ' + await run(`window.__field('창 최대 너비')?.value`));
  check(await run(`window.__field('다시 보지 않기 숨김 일수').max==='365'`), 'Input range code narrows the hide-days input (max 365)');
  await run(`window.__defaultCodes=[]`);
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' RgstPop quiz rule checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
