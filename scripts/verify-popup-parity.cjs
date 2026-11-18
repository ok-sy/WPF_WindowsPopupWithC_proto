// POL-16-02 : 재현 가능한 검증
// ■ 관리자 미리보기(PopupPreview)와 WPF 팝업(PopupWindow)을 같은 데이터로 그려 나란히 비교한다(2026-11-17).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-parity.cjs
// - 웹: headless Edge, deviceScaleFactor 1(100%), 팝업 width×height 상자. 테마 body1 0.85rem(관리자 화면과 같음).
// - WPF: scripts/PopupParityCapture가 같은 데이터를 서버 응답 형식으로 받아 실제 PopupWindow를 96 DPI로 렌더링.
// - 결과: .offline-verify/popup-parity/<id>.side.png(왼쪽 웹 흰 판·오른쪽 WPF 흰 판), report.html, measures.json. 자동 판정: 흰 판 크기, 선택지 높이·글자.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn, execFileSync} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/popup-parity');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, server, checks = 0;
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };

/* 같은 데이터(관리자 편집값 형식). WPF에는 서버 응답 형식으로 바꿔 넘긴다(toWpf). */
const option = (optionId, text, extra = {}) => ({optionId, value: String(optionId), text, sortOrder: optionId, isCorrect: false, ...extra});
const surveyQuestions = [
  {questionId: 1, title: '교육 내용에 만족하십니까?', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: false, sortOrder: 1,
    options: [option(1, '매우 그렇다'), option(2, '보통이다'), option(3, '그렇지 않다. 교육 시간이 너무 길어서 집중하기 어려웠고 실습 자료도 부족했습니다.')]},
  {questionId: 2, title: '도움이 된 항목을 모두 고르세요.', questionType: 'MULTIPLE_CHOICE', optionLayout: 'HORIZONTAL', isRequired: false, isScored: false, sortOrder: 2,
    options: [option(4, '강의'), option(5, '실습'), option(6, '자료')]},
  {questionId: 3, title: '기타 의견', questionType: 'TEXT', isRequired: false, isScored: false, sortOrder: 3, options: []},
];
const base = {displayMode: 'SINGLE', displayOrder: 1, sizeMode: 'FIXED', widthRatio: 0.7, heightRatio: 0.75, minimumWidth: 300, minimumHeight: 300,
  maximumWidth: 1200, maximumHeight: 900, showHeader: true, showFooter: true, showCloseButton: true, showDoNotShowAgain: false, showLater: false};
const fixtures = [
  {...base, popupId: 'PARITY-SURVEY', popupType: 'SURVEY', title: '설문 비교', width: 720, height: 820,
    content: {surveyTitle: '교육 만족도 조사', description: '교육 후 의견을 알려 주세요.'}, questions: surveyQuestions},
  {...base, popupId: 'PARITY-SURVEY-BODY18', popupType: 'SURVEY', title: '설문 비교 bodyFontSize 18', width: 720, height: 900,
    content: {surveyTitle: '교육 만족도 조사', description: '교육 후 의견을 알려 주세요.', bodyFontSize: 18}, questions: surveyQuestions},
  {...base, popupId: 'PARITY-QUIZ-OX', popupType: 'QUIZ', title: '퀴즈 비교', width: 720, height: 680, passingScore: 0,
    content: {surveyTitle: '보안 퀴즈'}, questions: [
      {questionId: 11, title: '비밀번호는 메모장에 적어 두어도 된다.', questionType: 'SINGLE_CHOICE', optionLayout: 'HORIZONTAL', isRequired: true, isScored: true, questionScore: 1, sortOrder: 1,
        options: [option(21, 'O'), option(22, 'X', {isCorrect: true})]},
      {questionId: 12, title: '사내 메일로 받은 첨부 파일을 열기 전에 확인할 것은?', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: true, questionScore: 1, sortOrder: 2,
        options: [option(23, '보낸 사람 주소', {isCorrect: true}), option(24, '파일 크기'), option(25, '받은 시각')]}]},
  {...base, popupId: 'PARITY-TEXT', popupType: 'TEXT', title: 'TEXT 기본 크기', width: 600, height: 420, questions: [],
    content: {showPlainText: true, plainText: '기본 크기 본문입니다.\n이십 크기 굵게',
      textBlocks: [{alignment: 'LEFT', runs: [{text: '기본 크기 본문입니다.'}]}, {alignment: 'LEFT', runs: [{text: '이십 크기 굵게', size: 20, bold: true}]}]}},
  {...base, popupId: 'PARITY-TEXT-FONTS', popupType: 'TEXT', title: 'TEXT 헤더 22·본문 12·푸터 16', width: 600, height: 420, questions: [],
    content: {showPlainText: true, plainText: '본문 12 크기입니다.', headerFontSize: 22, bodyFontSize: 12, footerFontSize: 16,
      textBlocks: [{alignment: 'LEFT', runs: [{text: '본문 12 크기입니다.'}]}]}},
];
const FONT_KEYS = ['headerFontSize', 'bodyFontSize', 'footerFontSize'];
const toWpf = p => {
  const content = Object.fromEntries(Object.entries(p.content).filter(([k]) => !FONT_KEYS.includes(k)));
  const survey = p.popupType === 'SURVEY' || p.popupType === 'QUIZ';
  return {...p, deliveryId: 'D-' + p.popupId, content, showFooterButton: p.showCloseButton, footerAction: survey ? 'SUBMIT' : 'CLOSE',
    useBackgroundOverlay: false, popupPosition: 'CENTER', ...Object.fromEntries(FONT_KEYS.filter(k => p.content[k] != null).map(k => [k, p.content[k]]))};
};

(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-popup-parity-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/},
      {test: /\.css$/, use: path.join(__dirname, 'verify-css-loader.cjs')}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  // 헤더 로고는 관리자 웹 public 폴더의 같은 파일을 내려준다.
  const logo = path.join(root, 'zero-rule-web/main/public/images/popup-header-logo.png');
  server = http.createServer((req, res) => {
    const file = req.url === '/images/popup-header-logo.png' ? logo : /^\/[\w.-]+\.(js|png)$/.test(req.url) ? path.join(output, req.url.slice(1)) : null;
    if (file && fs.existsSync(file)) { res.setHeader('Content-Type', file.endsWith('.png') ? 'image/png' : 'application/javascript'); res.end(fs.readFileSync(file)); return; }
    if (req.url.startsWith('/side')) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(sidePage(decodeURIComponent(req.url.split('?')[1]))); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><body style="margin:0;background:#fff"><div id="root"></div><script src="/bundle.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9366', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9366/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const shot = async (file, clip) => fs.writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', {format: 'png', ...(clip ? {clip: {...clip, scale: 1}} : {captureBeyondViewport: true})})).data, 'base64'));
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: 2200, height: 1000, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mountParity === "function"')) break; await pause(100);}

  // 1. 웹 캡처와 측정: 창(width×height) 안 흰 판(.MuiPaper-root, 그림자 여백 24 안쪽)만 잘라 WPF 흰 판과 같은 기준으로 비교한다.
  const web = {};
  for (const popup of fixtures) {
    await run(`window.mountParity(${JSON.stringify(popup)})`); await pause(600);
    web[popup.popupId] = await run(`(()=>{const f=document.querySelector('#frame .MuiPaper-root').getBoundingClientRect();const opts=Array.from(document.querySelectorAll('#frame .survey-option'));
      const fs0=document.querySelector('#frame fieldset[aria-labelledby]');const q=fs0&&document.getElementById(fs0.getAttribute('aria-labelledby'));
      return {frame:{x:f.x,y:f.y,width:f.width,height:f.height},firstQuestionTop:q?Math.round(q.getBoundingClientRect().top-f.y):null,choices:opts.map(o=>({name:o.textContent.trim(),height:o.getBoundingClientRect().height,font:parseFloat(getComputedStyle(o).fontSize)}))}})()`);
    const f = web[popup.popupId].frame;
    await shot(path.join(output, popup.popupId + '.web.png'), {x: f.x, y: f.y, width: f.width, height: f.height});
  }

  // 2. WPF 캡처(같은 데이터를 서버 응답 형식으로)
  const wpfJson = path.join(output, 'wpf-popups.json');
  fs.writeFileSync(wpfJson, JSON.stringify(fixtures.map(toWpf), null, 2));
  execFileSync('dotnet', ['run', '--project', path.join(__dirname, 'PopupParityCapture'), '-v', 'q', '--', wpfJson, output], {stdio: 'inherit'});
  const wpf = Object.fromEntries(fixtures.map(p => [p.popupId, JSON.parse(fs.readFileSync(path.join(output, p.popupId + '.wpf.json'), 'utf8'))]));

  // 3. 나란히 합성(왼쪽 웹, 오른쪽 WPF)
  for (const popup of fixtures) {
    await send('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/side?${encodeURIComponent(popup.popupId)}`}); await pause(500);
    await shot(path.join(output, popup.popupId + '.side.png'));
  }
  fs.writeFileSync(path.join(output, 'report.html'), '<!doctype html><meta charset="utf-8"><title>Popup parity</title><body style="font-family:Malgun Gothic;margin:16px">'
    + fixtures.map(p => `<h3>${p.popupId}</h3><img src="${p.popupId}.side.png" style="max-width:100%">`).join(''));

  // 4. 측정값 비교: 선택지 높이·글자(같은 이름끼리), 콘텐츠 크기
  const rows = [];
  for (const popup of fixtures) {
    const w = web[popup.popupId], d = wpf[popup.popupId];
    rows.push({id: popup.popupId, webFrame: [w.frame.width, w.frame.height], wpfContent: [d.content.width, d.content.height]});
    // 흰 판 크기(창 - 그림자 여백)가 WPF와 같아야 한다(2026-11-17).
    check(Math.abs(w.frame.width - d.content.width) <= 1 && Math.abs(w.frame.height - d.content.height) <= 1,
      `${popup.popupId} white panel web ${w.frame.width}×${w.frame.height} vs WPF ${d.content.width}×${d.content.height}`);
    for (const choice of d.choices.filter(c => c.name)) {
      const match = w.choices.find(c => c.name === choice.name);
      if (!match) continue;
      rows.push({id: popup.popupId, choice: choice.name.slice(0, 12), web: [match.height, match.font], wpf: [Math.round(choice.ActualHeight * 10) / 10, choice.FontSize]});
      check(Math.abs(match.height - choice.ActualHeight) <= 1 && match.font === choice.FontSize,
        `${popup.popupId} choice "${choice.name}" web ${match.height}/${match.font} vs WPF ${choice.ActualHeight}/${choice.FontSize}`);
    }
  }
  fs.writeFileSync(path.join(output, 'measures.json'), JSON.stringify(rows, null, 2));
  console.table(rows.map(r => ({...r, webFrame: r.webFrame?.join('×'), wpfContent: r.wpfContent?.join('×'), web: r.web?.join(' / '), wpf: r.wpf?.join(' / ')})));
  console.log('PASS: ' + checks + ' popup parity checks · images: ' + output);
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});

function sidePage(popupId) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:12px;background:#9ca3af;font:13px Malgun Gothic">
  <div style="display:flex;gap:16px;align-items:flex-start">
  <figure style="margin:0"><figcaption style="color:#fff;margin-bottom:4px">관리자 미리보기 흰 판 — ${popupId}</figcaption><img src="/${popupId}.web.png" style="display:block"></figure>
  <figure style="margin:0"><figcaption style="color:#fff;margin-bottom:4px">WPF 팝업 흰 판(그림자 여백 제외)</figcaption><img src="/${popupId}.wpf.png" style="display:block"></figure></div>`;
}
