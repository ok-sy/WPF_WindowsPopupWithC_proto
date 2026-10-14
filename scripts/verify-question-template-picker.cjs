// [설계 50] 문항 템플릿 선택 초기화 검증(Windows headless Edge). 저장소 루트에서 웹 의존성 설치 후 실행.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/question-template-picker');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// 서버 API·오류 처리 모듈을 하네스용으로 대체한다. useApi는 effect 의존성이 바뀌지 않도록 같은 객체를 돌려준다.
fs.writeFileSync(path.join(output, 'provider-shim.js'), [
  'const api = {popupAdmin: {',
  '  questionTemplates: async () => ({body: {templates: [',
  "    {templateId: 11, templateType: 'SURVEY', templateName: 'Survey A'}, {templateId: 12, templateType: 'SURVEY', templateName: 'Survey B'},",
  "    {templateId: 21, templateType: 'QUIZ', templateName: 'Quiz A'}]}}),",
  '  questionTemplate: async () => ({body: {adminQuestions: []}})}};',
  'exports.useApi = () => api;'].join('\n'));
fs.writeFileSync(path.join(output, 'handle-error-shim.js'), 'exports.__esModule = true; exports.default = (error) => { throw error; };');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-question-template-picker-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/provider$': path.join(output, 'provider-shim.js'), '@/lib/handle-error$': path.join(output, 'handle-error-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? fs.readFileSync(path.join(output, 'bundle.js')) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9341', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9341/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  await send('Page.enable');
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('!!document.querySelector("[role=combobox]")')) break; await pause(100);}
  await pause(300);
  const state = () => run(`(()=>{const c=document.querySelector('[role=combobox]'), b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('불러오기'));
    return {text: c.textContent.trim(), loadDisabled: b.disabled};})()`);
  const options = () => run(`[...document.querySelectorAll('[role=option]')].map(o=>o.textContent.trim())`);
  // 실제 MUI Select 조작: 콤보박스를 열고 옵션을 누른다.
  const open = async () => { await run(`document.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))`); await pause(250); };
  const choose = async name => { await open(); await run(`[...document.querySelectorAll('[role=option]')].find(o=>o.textContent.includes(${JSON.stringify(name)})).click()`); await pause(250); };
  let s = await state();
  check(s.loadDisabled && !s.text.includes('Survey'), 'Initially nothing is selected: ' + JSON.stringify(s));
  await choose('Survey B'); s = await state();
  check(s.text.includes('Survey B') && !s.loadDisabled, 'Selecting a SURVEY template enables loading: ' + JSON.stringify(s));
  await run(`window.renderPicker('QUIZ')`); await pause(250); s = await state();
  check(!s.text.includes('Survey') && s.loadDisabled, 'Switching to QUIZ clears the SURVEY selection: ' + JSON.stringify(s));
  await run(`window.renderPicker('SURVEY')`); await pause(250); s = await state();
  check(!s.text.includes('Survey B') && s.loadDisabled, 'Returning to SURVEY does not restore the previous selection: ' + JSON.stringify(s));
  await open();
  const surveyOptions = await options();
  check(surveyOptions.some(o => o.includes('Survey A')) && !surveyOptions.some(o => o.includes('Quiz')), 'SURVEY list hides QUIZ templates: ' + JSON.stringify(surveyOptions));
  await run(`[...document.querySelectorAll('[role=option]')].find(o=>o.textContent.includes('Survey A')).click()`); await pause(250);
  await run(`window.renderPicker('QUIZ')`); await pause(250);
  await choose('Quiz A'); s = await state();
  check(s.text.includes('Quiz A') && !s.loadDisabled, 'QUIZ selection works after switching: ' + JSON.stringify(s));
  await run(`[...document.querySelectorAll('button')].find(x=>x.textContent.includes('불러오기')).click()`); await pause(250);
  check(await run('JSON.stringify(window.loaded)') === '[21]', 'Load uses the current selection');
  console.log(`PASS: ${checks} question template picker checks`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {socket?.close(); browser?.kill(); server?.close();});
