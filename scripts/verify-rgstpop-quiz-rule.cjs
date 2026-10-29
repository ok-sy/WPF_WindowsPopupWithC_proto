// RgstPop 등록 편집기(테스트 화면)에 전달 샘플과 같은 퀴즈 점수 규칙이 적용되는지 headless Edge로 확인한다.
// 규칙: 문항 1점 고정(총점 = 문항 수), 만점 통과 = 문항 수, 커트라인 N개 = N점, 통과/실패 제출도 N점(실패 시 제출 불가).
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
fs.writeFileSync(path.join(output, 'provider-shim.js'), `const api = { popupAdmin: {
  info: async () => ({ body: { popup: window.__detail, targetGroups: [{ targetName: 'ALL', targetDescription: '', conditions: [{ conditionType: 'EMPLOYEE_NO', conditionOperator: '=', value: 'E1001', includeChild: false }] }] } }),
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
  const mount = async (passingScore, questionScore) => {
    await run(`window.mountQuiz(${JSON.stringify(passingScore)}, ${questionScore})`);
    await until(`!!document.querySelector('[aria-label="퀴즈유형"]')`, 'quiz rule fields');
    await pause(400);
  };

  // 오류 수집(Runtime.exceptionThrown)은 Edge 기본 확장 프로그램(chrome-extension://) 콘텐츠 스크립트 오류를 제외한다.
  // CKEditor 49는 문서에 포커스가 있어야 편집 영역을 포커스 상태로 본다(headless 창은 포커스가 없어 선택 영역이 그려지지 않음).
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setFocusEmulationEnabled', {enabled: true}); await send('Emulation.setDeviceMetricsOverride', {width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  await until(`typeof window.mountQuiz === 'function'`, 'entry');

  // 1) 기존 데이터(배점 5점·통과 점수 2) 불러오기: 커트라인 2로 복원, 배점 입력 없음, 저장 시 전 문항 1점.
  await mount(2, 5);
  const count = await run('window.__detail.questions.length');
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 2점') && document.querySelector('[aria-label="통과 기준 개수"]').value==='2'`),
    'Loaded quiz with passingScore 2 restores cutoff 2');
  check(await run(`!Array.from(document.querySelectorAll('label')).some(l=>l.textContent==='배점' || l.textContent==='통과 점수') && !document.body.textContent.includes('배점 모두 1점')`),
    'RgstPop editor hides per-question score and passing score inputs');
  let saved = await save();
  check(saved && saved.popup.passingScore === 2 && saved.popup.questions.every(q => q.questionScore === 1 && q.isScored === true),
    'Save sends every question as 1 point and passingScore 2: ' + JSON.stringify(saved && saved.popup.questions.map(q => q.questionScore)) + ' toast=' + await toastText());
  // 2) 만점 통과 = 문항 수.
  await pickRule('만점 통과');
  saved = await save();
  check(saved && saved.popup.passingScore === count, `Full-score pass saves passingScore = ${count} questions`);
  // 3) 커트라인 범위 밖 거절, 1은 허용.
  await pickRule('커트라인 통과'); await setInput('input[aria-label="통과 기준 개수"]', String(count + 1));
  saved = await save();
  check(saved === null && (await toastText()).includes('통과 기준'), 'Cutoff above the question count is rejected');
  await setInput('input[aria-label="통과 기준 개수"]', '1');
  saved = await save();
  check(saved && saved.popup.passingScore === 1, 'Cutoff 1 saves passingScore 1');
  // 4) 통과/실패 제출: 실패 시 제출 불가 안내, 통과 점수 N 저장.
  await pickRule('통과/실패 제출');
  check(await run(`document.body.textContent.includes('미달(실패)이면 제출되지 않고')`), 'Pass/fail submit explains that a failed quiz cannot be submitted');
  saved = await save();
  check(saved && saved.popup.passingScore === 1, 'Pass/fail submit saves passingScore N');
  // 5) 통과 점수 없는 데이터: 유형 미선택이면 저장 거절.
  await mount(null, 1);
  check(await run(`document.querySelector('[data-testid=quiz-rule-score]').textContent.includes('통과 점수 -점')`), 'Quiz without passingScore starts unselected');
  saved = await save();
  check(saved === null && (await toastText()).includes('퀴즈유형'), 'Save without a quiz type is rejected');
  check(errors.length === 0, 'No browser runtime errors: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' RgstPop quiz rule checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
