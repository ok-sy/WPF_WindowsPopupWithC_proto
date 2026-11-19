// POL-16-02 : 재현 가능한 검증
// ■ 관리자 미리보기(PopupPreview)와 WPF 팝업(PopupWindow)을 같은 데이터로 그려 나란히 비교한다(2026-11-17).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-parity.cjs
// - 웹: headless Edge, deviceScaleFactor 1(100%), 팝업 width×height 상자. 테마 body1 0.85rem(관리자 화면과 같음).
// - WPF: scripts/PopupParityCapture가 같은 데이터를 서버 응답 형식으로 받아 실제 PopupWindow를 96 DPI로 렌더링.
// - 결과: .offline-verify/popup-parity/<id>.side.png(왼쪽 웹 흰 판·오른쪽 WPF 흰 판), report.html, measures.json. 자동 판정: 흰 판 크기, 선택지 높이·글자.
// - TODO61-20(2026-11-19): 유형 6종(TEXT·SURVEY·QUIZ·IMAGE·VIDEO·VIDEO+QUIZ)과 TEXT 560×750·좁은 폭·긴 문구·헤더/푸터 숨김을 추가하고,
//   같은 글자끼리 크기·굵기·패밀리·흰 판 기준 위치, 헤더·확인 버튼 상자를 대조해 texts.md·texts.json에 남긴다.
//   자동 판정은 헤더 제목·확인/제출 버튼·TEXT 본문 첫 줄의 크기·굵기 일치와 헤더 높이·버튼 크기·버튼 아래 간격(±1)이다.
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
// TODO61-20 추가 세트. 미디어는 WPF Demo 파일을 웹에는 HTTP(/media/…)로, WPF에는 로컬 경로로 넘긴다.
const LONG = '긴 문구 줄바꿈 확인용 본문입니다. 좁은 창에서 여러 줄로 나뉘어도 글자 크기와 여백은 기본값을 유지해야 합니다. '.repeat(3).trim();
fixtures.push(
  {...base, popupId: 'PARITY-TEXT-560x750', popupType: 'TEXT', title: 'TEXT 560×750', width: 560, height: 750, questions: [],
    content: {showPlainText: true, plainText: '공지 본문 첫 줄입니다.\n둘째 줄입니다.'}},
  {...base, popupId: 'PARITY-TEXT-NARROW-LONG', popupType: 'TEXT', title: '좁은 폭에서 아주 긴 팝업 제목이 한 줄 말줄임으로 표시되는지 확인합니다', width: 360, height: 480,
    questions: [], showDoNotShowAgain: true, showLater: true, content: {showPlainText: true, plainText: LONG}},
  {...base, popupId: 'PARITY-TEXT-NO-HEADER-FOOTER', popupType: 'TEXT', title: '숨김', width: 480, height: 320, showHeader: false, showFooter: false,
    questions: [], content: {showPlainText: true, plainText: '헤더와 푸터를 숨긴 본문입니다.'}},
  {...base, popupId: 'PARITY-IMAGE', popupType: 'IMAGE', title: 'IMAGE 비교', width: 640, height: 560, questions: [],
    content: {imageUrl: '/media/demo-image.jpg', imageTitle: '이미지 제목', description: '이미지 설명입니다.', showDescription: true, imageSizeMode: 'ADAPTIVE', keepAspectRatio: true}},
  {...base, popupId: 'PARITY-VIDEO', popupType: 'VIDEO', title: 'VIDEO 비교', width: 720, height: 640, questions: [], completionRatio: 0,
    content: {videoUrl: '/media/demo-video.mp4', videoTitle: '영상 제목', description: '영상 설명입니다.', showDescription: true, showControls: true}},
  {...base, popupId: 'PARITY-VIDEO-QUIZ', popupType: 'QUIZ', title: 'VIDEO+QUIZ 비교', width: 720, height: 900, passingScore: 0, completionRatio: 0,
    content: {videoEnabled: true, videoUrl: '/media/demo-video.mp4', videoTitle: '영상 퀴즈', surveyTitle: '영상 퀴즈', description: '영상을 보고 답하세요.'},
    questions: [{questionId: 31, title: '영상에서 확인한 내용은?', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, isScored: true, questionScore: 1, sortOrder: 1,
      options: [option(41, '첫째', {isCorrect: true}), option(42, '둘째')]}]},
);
const MEDIA = path.join(root, 'popup-frameWork/Popup/Media');
const FONT_KEYS = ['headerFontSize', 'bodyFontSize', 'footerFontSize'];
const toWpf = p => {
  const content = Object.fromEntries(Object.entries(p.content).filter(([k]) => !FONT_KEYS.includes(k))
    .map(([k, v]) => [k, typeof v === 'string' && v.startsWith('/media/') ? path.join(MEDIA, v.slice(7)) : v]));
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
    const file = req.url === '/images/popup-header-logo.png' ? logo : /^\/media\/[\w.-]+$/.test(req.url) ? path.join(MEDIA, req.url.slice(7))
      : /^\/[\w.-]+\.(js|png)$/.test(req.url) ? path.join(output, req.url.slice(1)) : null;
    const types = {png: 'image/png', jpg: 'image/jpeg', mp4: 'video/mp4', js: 'application/javascript'};
    if (file && fs.existsSync(file)) { res.setHeader('Content-Type', types[file.split('.').pop()]); res.end(fs.readFileSync(file)); return; }
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
    await run(`window.mountParity(${JSON.stringify(popup)})`); await pause(popup.popupType === 'IMAGE' || popup.content.videoUrl ? 1500 : 600);
    web[popup.popupId] = await run(`(()=>{const f=document.querySelector('#frame .MuiPaper-root').getBoundingClientRect();const opts=Array.from(document.querySelectorAll('#frame .survey-option'));
      const fs0=document.querySelector('#frame fieldset[aria-labelledby]');const q=fs0&&document.getElementById(fs0.getAttribute('aria-labelledby'));
      const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return r.width>0?{x:Math.round((r.x-f.x)*10)/10,y:Math.round((r.y-f.y)*10)/10,w:Math.round(r.width*10)/10,h:Math.round(r.height*10)/10}:null;};
      const panel=document.querySelector('#frame .MuiPaper-root');
      /* TODO61-20: 직접 글자 노드가 있는 보이는 요소 전부 — 같은 글자끼리 WPF TextBlock과 대조한다. */
      const texts=Array.from(panel.querySelectorAll('*')).filter(e=>Array.from(e.childNodes).some(n=>n.nodeType===3&&n.data.trim())).map(e=>{const s=getComputedStyle(e);
        return {text:e.textContent.trim(),size:parseFloat(s.fontSize),weight:Number(s.fontWeight),family:s.fontFamily,box:box(e)};}).filter(t=>t.box);
      const buttons=Array.from(panel.querySelectorAll('button')).map(b=>({text:b.textContent.trim(),size:parseFloat(getComputedStyle(b).fontSize),box:box(b)})).filter(b=>b.box);
      const header=panel.firstElementChild&&getComputedStyle(panel.firstElementChild).backgroundColor==='rgb(0, 0, 0)'?panel.firstElementChild:null;
      return {frame:{x:f.x,y:f.y,width:f.width,height:f.height},firstQuestionTop:q?Math.round(q.getBoundingClientRect().top-f.y):null,choices:opts.map(o=>({name:o.textContent.trim(),height:o.getBoundingClientRect().height,font:parseFloat(getComputedStyle(o).fontSize)})),
        texts,regions:{header:box(header),buttons}}})()`);
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

  // 5. TODO61-20 같은 글자끼리 대조(크기·굵기·패밀리·위치)와 영역 실측. 차이는 기록하고, 기본값 계약 항목만 판정한다.
  const textRows = [], md = ['# 웹 미리보기·WPF 글자·영역 실측 (TODO61-20)', '',
    `생성 ${new Date().toISOString()} · 웹 headless Edge 100% · WPF RenderTargetBitmap 96 DPI · 좌표는 흰 판 왼쪽 위 기준(px = DIP)`, ''];
  const near = (a, b, t = 1) => a != null && b != null && Math.abs(a - b) <= t;
  const cell = v => String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const popup of fixtures) {
    const w = web[popup.popupId], d = wpf[popup.popupId];
    const wpfTexts = d.texts ?? [], used = new Set();
    md.push(`## ${popup.popupId} (${popup.popupType}${popup.content.videoEnabled ? '+VIDEO' : ''} ${popup.width}×${popup.height})`, '',
      `![${popup.popupId}](${popup.popupId}.side.png)`, '', '| 글자 | 웹 크기/굵기 | WPF 크기/굵기 | 웹 x,y | WPF x,y | 웹 패밀리 | WPF 패밀리 |', '|---|---|---|---|---|---|---|');
    for (const t of w.texts) {
      const i = wpfTexts.findIndex((x, k) => !used.has(k) && x.text === t.text);
      const x = i >= 0 ? wpfTexts[i] : null; if (i >= 0) used.add(i);
      const row = {id: popup.popupId, text: t.text.slice(0, 24), web: `${t.size}/${t.weight}`, wpf: x ? `${x.size}/${x.weight}` : '—',
        webPos: `${t.box.x},${t.box.y}`, wpfPos: x?.box ? `${x.box.x},${x.box.y}` : '—', webFamily: t.family.split(',')[0].replace(/"/g, ''), wpfFamily: x?.family ?? '—',
        same: x ? t.size === x.size && t.weight === x.weight : null};
      textRows.push(row);
      md.push(`| ${cell(row.text)} | ${row.web} | ${row.wpf}${x && !row.same ? ' ⚠' : ''} | ${row.webPos} | ${row.wpfPos} | ${cell(row.webFamily)} | ${cell(row.wpfFamily)} |`);
    }
    const unmatched = wpfTexts.filter((_, k) => !used.has(k)).map(x => x.text.slice(0, 20));
    if (unmatched.length) md.push('', 'WPF에만 있는 글자: ' + unmatched.map(t => '`' + cell(t).replace(/`/g, '') + '`').join(', '));
    // 영역: 헤더 높이, 확인·제출 버튼 크기와 흰 판 아래까지 간격
    const primary = ['확인', '제출', '바로가기'];
    const wb = w.regions.buttons.find(b => primary.includes(b.text)), db = (d.regions?.buttons ?? []).find(b => primary.includes(b.text));
    const wh = w.regions.header, dh = d.regions?.header;
    const gap = (b, h) => b?.box ? Math.round((h - b.box.y - b.box.h) * 10) / 10 : null;
    md.push('', '| 영역 | 웹 | WPF |', '|---|---|---|',
      `| 헤더 높이 | ${wh?.h ?? '숨김'} | ${dh?.h ?? '숨김'} |`,
      `| 주 버튼(${wb?.text ?? db?.text ?? '없음'}) 크기 | ${wb ? wb.box.w + '×' + wb.box.h : '—'} | ${db ? db.box.w + '×' + db.box.h : '—'} |`,
      `| 주 버튼 아래~흰 판 아래 | ${gap(wb, w.frame.height) ?? '—'} | ${gap(db, d.content.height) ?? '—'} |`, '');
    const titleRow = textRows.find(r => r.id === popup.popupId && r.text === popup.title.slice(0, 24));
    if (popup.showHeader) check(near(wh?.h, dh?.h) && (titleRow ? titleRow.same === true : popup.title.length > 24),
      `[61-20] ${popup.popupId} header title size/weight and header height match: ` + JSON.stringify({titleRow, wh, dh}));
    if (wb || db) check(wb && db && near(wb.box.w, db.box.w) && near(wb.box.h, db.box.h) && near(gap(wb, w.frame.height), gap(db, d.content.height)) && wb.size === db.FontSize,
      `[61-20] ${popup.popupId} primary button size and bottom gap match: ` + JSON.stringify({wb, db}));
    const bodyText = popup.content.plainText?.split('\n')[0];
    if (popup.popupType === 'TEXT' && bodyText && bodyText.length < 24) {
      const r = textRows.find(x => x.id === popup.popupId && x.text.startsWith(bodyText));
      check(r?.same === true, `[61-20] ${popup.popupId} body text size/weight match: ` + JSON.stringify(r));
    }
  }
  const diffs = textRows.filter(r => r.same === false);
  md.splice(4, 0, `요약: 대조 글자 ${textRows.filter(r => r.same != null).length}건, 크기·굵기 차이 ${diffs.length}건(⚠), WPF에서 같은 글자를 찾지 못한 웹 글자 ${textRows.filter(r => r.same == null).length}건.`, '');
  fs.writeFileSync(path.join(output, 'texts.json'), JSON.stringify(textRows, null, 2));
  fs.writeFileSync(path.join(output, 'texts.md'), md.join('\n') + '\n');
  if (diffs.length) console.table(diffs);
  console.table(rows.map(r => ({...r, webFrame: r.webFrame?.join('×'), wpfContent: r.wpfContent?.join('×'), web: r.web?.join(' / '), wpf: r.wpf?.join(' / ')})));
  console.log('PASS: ' + checks + ' popup parity checks · images: ' + output);
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});

function sidePage(popupId) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:12px;background:#9ca3af;font:13px Malgun Gothic">
  <div style="display:flex;gap:16px;align-items:flex-start">
  <figure style="margin:0"><figcaption style="color:#fff;margin-bottom:4px">관리자 미리보기 흰 판 — ${popupId}</figcaption><img src="/${popupId}.web.png" style="display:block"></figure>
  <figure style="margin:0"><figcaption style="color:#fff;margin-bottom:4px">WPF 팝업 흰 판(그림자 여백 제외)</figcaption><img src="/${popupId}.wpf.png" style="display:block"></figure></div>`;
}
