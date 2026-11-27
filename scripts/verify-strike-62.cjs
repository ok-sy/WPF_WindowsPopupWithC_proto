// POL-03-02 : 문단·글자 서식
// POL-16-02 : 재현 가능한 검증
// ■ TODO62-5 취소선 위치 실측 — 관리자 미리보기(PopupPreview)와 WPF 팝업(PopupWindow)을 같은 textBlocks로 그려 비교한다(2026-11-28).
// 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-strike-62.cjs
// - 케이스마다 장식만 다른 변형을 그린다: G(장식 없음) · S(취소선만) · U(밑줄만, 케이스에 밑줄이 있을 때) · C(케이스 그대로, 둘 다일 때).
// - 웹: headless Edge(deviceScaleFactor 1), 흰 판 캡처. WPF: scripts/PopupParityCapture가 실제 PopupWindow를 96 DPI로 그린 흰 판.
// - 측정: G와 변형의 차이 행 = 선. G의 어두운 픽셀 상자 = 글자 잉크. 선 중심을 잉크 위쪽 기준 px와 잉크 높이 비율로 남긴다.
// - 자동 판정(구조): 두 플랫폼 모두 취소선이 그려지고 잉크 안에 있으며 글자 폭을 덮는다, 밑줄은 취소선보다 아래, 둘 다면 두 선 모두 그려진다,
//   strikethrough false·누락·잘못된 타입은 장식이 없다(웹 DOM, WPF는 RichTextTests CheckStrikethrough62).
//   웹·WPF 차이: 글자 잉크 기준 취소선 중심 ±1px·두께 ±1px(2026-11-28 실측 후 확정, 픽셀 완전 동일이 아니라 선의 상대 위치·두께 기준).
//   수정 전(브라우저 line-through)은 1~3.5px 위·32px에서 1px 굵어 이 기준에 실패했다.
// - 결과: .offline-verify/strike-62/report.md·report.json, <케이스>.<변형>.web.png·.wpf.png
const fs = require('fs'), path = require('path'), http = require('http'), {spawn, execFileSync} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/strike-62');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, server, checks = 0;
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };

/* 케이스: 글꼴(미지정 = 기본 글꼴)·크기·굵게·기울임·정렬·밑줄. 취소선 유무는 변형으로 만든다. */
const SAMPLE = '가나다 Hxg 123';
const cases = [
  {id: 'STR-01', font: '유앤아이Modern', size: 32, underline: true, note: '이 PC 미설치 → 대체 글꼴'},
  {id: 'STR-01N', font: 'Noto Sans KR', size: 32, underline: true, note: 'STR-01 대체 측정(설치 글꼴)'},
  {id: 'STR-02', font: 'Noto Sans KR', size: 32, italic: true},
  ...[12, 16, 32].map(size => ({id: `STR-03-${size}`, size})),
  {id: 'STR-04', font: 'Noto Serif KR', size: 32, underline: true},
  ...[12, 16, 28, 32].flatMap(size => ['bold', 'italic'].flatMap(style => ['LEFT', 'CENTER', 'RIGHT'].map(alignment =>
    ({id: `STR-05-${size}-${style}-${alignment}`, size, [style]: true, alignment})))),
];
const variantsOf = c => ['G', 'S', ...(c.underline ? ['U', 'C'] : [])];
const runOf = (c, v) => ({text: SAMPLE, ...(c.font ? {font: c.font} : {}), size: c.size, ...(c.bold ? {bold: true} : {}), ...(c.italic ? {italic: true} : {}),
  ...(v === 'S' || v === 'C' ? {strikethrough: true} : {}), ...(v === 'U' || v === 'C' ? {underline: true} : {})});
const popupOf = (c, v) => ({popupId: `${c.id}.${v}`, popupType: 'TEXT', title: c.id, displayMode: 'SINGLE', displayOrder: 1, sizeMode: 'FIXED',
  width: 720, height: 300, widthRatio: 0.7, heightRatio: 0.75, minimumWidth: 300, minimumHeight: 300, maximumWidth: 1200, maximumHeight: 900,
  showHeader: false, showFooter: false, showCloseButton: true, showDoNotShowAgain: false, showLater: false, questions: [],
  content: {showPlainText: true, plainText: SAMPLE, textBlocks: [{alignment: c.alignment ?? 'LEFT', runs: [runOf(c, v)]}]}});
const toWpf = p => ({...p, deliveryId: 'D-' + p.popupId, showFooterButton: false, footerAction: 'CLOSE', useBackgroundOverlay: false, popupPosition: 'CENTER'});
const popups = cases.flatMap(c => variantsOf(c).map(v => popupOf(c, v)));

(async () => {
  // 1) WPF: 같은 데이터를 서버 응답 형식으로 넘겨 실제 PopupWindow 흰 판을 캡처한다.
  const wpfJson = path.join(output, 'wpf-popups.json');
  fs.writeFileSync(wpfJson, JSON.stringify(popups.map(toWpf)));
  execFileSync('dotnet', ['run', '--project', path.join(__dirname, 'PopupParityCapture'), '-v', 'q', '--', wpfJson, output], {stdio: 'inherit'});

  // 2) 웹: 흰 판 캡처
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-strike-62-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/features/PopupcommonComponent$': path.join(root, 'zero-rule-web/main/src/features/PopupcommonComponent/index.ts'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/},
      {test: /\.css$/, use: path.join(__dirname, 'verify-css-loader.cjs')}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  const logo = path.join(root, 'zero-rule-web/main/public/images/popup-header-logo.png');
  server = http.createServer((req, res) => {
    const file = req.url === '/images/popup-header-logo.png' ? logo : /^\/[\w.%-]+\.(js|png)$/.test(req.url) ? path.join(output, decodeURIComponent(req.url.slice(1))) : null;
    if (file && fs.existsSync(file)) { res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : 'image/png'); res.end(fs.readFileSync(file)); return; }
    if (req.url !== '/') { res.statusCode = 404; res.end(); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><body style="margin:0;background:#fff"><div id="root"></div><script src="/bundle.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  fs.rmSync(path.join(output, 'edge-profile'), {recursive: true, force: true});
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9372', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9372/json/list')).json(); if (targets.some(t => t.type === 'page')) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id;
    const timer = setTimeout(() => {waiting.delete(key); reject(Error(`CDP timeout: ${method}`));}, 30000);
    waiting.set(key, {resolve: v => {clearTimeout(timer); resolve(v);}, reject: e => {clearTimeout(timer); reject(e);}}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  await send('Page.enable');
  // 화면(screen)을 뷰포트 이상으로 둔다(작으면 Edge 158 headless 페이지가 hidden이 되어 스크린샷이 멈춤, verify-popup-preview-61 참고).
  await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 600, screenWidth: 1000, screenHeight: 600, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mountStrike === "function"')) break; await pause(100);}
  await run('document.fonts.ready.then(() => true)');
  const fontsUsed = {};
  for (const popup of popups) {
    await run(`window.mountStrike(${JSON.stringify(popup)})`); await pause(120);
    await run('document.fonts.ready.then(() => true)');
    const info = await run(`(()=>{const p=document.querySelector('#frame .MuiPaper-root').getBoundingClientRect();const s=Array.from(document.querySelectorAll('#frame span')).find(e=>e.textContent===${JSON.stringify(SAMPLE)});
      const cs=s&&getComputedStyle(s);return {clip:{x:p.x,y:p.y,width:p.width,height:p.height},family:cs&&cs.fontFamily,decoration:cs&&cs.textDecorationLine,size:cs&&cs.fontSize};})()`);
    fontsUsed[popup.popupId] = info;
    const shot = await send('Page.captureScreenshot', {format: 'png', clip: {...info.clip, scale: 1}});
    fs.writeFileSync(path.join(output, popup.popupId + '.web.png'), Buffer.from(shot.data, 'base64'));
  }

  // 3) 측정: 같은 플랫폼 안에서 G와 각 변형을 비교한다(웹·WPF 캡처 크기는 서로 달라도 된다).
  const url = file => '/' + encodeURIComponent(file);
  const measure = (c, v, platform) => run(`window.analyzeStrike(${JSON.stringify(url(`${c.id}.G.${platform}.png`))}, ${JSON.stringify(url(`${c.id}.${v}.${platform}.png`))})`);
  const results = [];
  for (const c of cases) {
    const row = {case: c};
    for (const platform of ['web', 'wpf']) {
      const strike = await measure(c, 'S', platform), under = c.underline ? await measure(c, 'U', platform) : null, both = c.underline ? await measure(c, 'C', platform) : null;
      check(!strike.error && strike.lines.length === 1, `${c.id} ${platform}: exactly one strikethrough line is drawn: ` + JSON.stringify(strike));
      const s = strike.lines[0], ink = strike.ink;
      check(s.top > ink.top && s.bottom < ink.bottom, `${c.id} ${platform}: strikethrough lies inside the glyph ink box: ` + JSON.stringify({s, ink}));
      check(s.left <= ink.left + c.size * 0.2 && s.right >= ink.right - c.size * 0.4, `${c.id} ${platform}: strikethrough spans the text width: ` + JSON.stringify({s, ink}));
      const m = {ink, strike: s, offset: s.center - ink.top, ratio: (s.center - ink.top) / ink.height};
      if (under) {
        check(!under.error && under.lines.length === 1 && under.lines[0].center > s.bottom, `${c.id} ${platform}: underline is drawn below the strikethrough: ` + JSON.stringify({under, s}));
        check(!both.error && both.lines.length === 2 && Math.abs(both.lines[0].center - s.center) <= 1 && Math.abs(both.lines[1].center - under.lines[0].center) <= 1,
          `${c.id} ${platform}: underline + strikethrough draws both lines at the same places: ` + JSON.stringify({both, s, under: under.lines[0]}));
        m.underline = under.lines[0];
      }
      row[platform] = m;
    }
    row.delta = {offset: row.web.offset - row.wpf.offset, ratio: row.web.ratio - row.wpf.ratio, thickness: row.web.strike.thickness - row.wpf.strike.thickness,
      inkHeight: row.web.ink.height - row.wpf.ink.height};
    // 합격 기준(2026-11-28 실측 후 확정, TODO62-5 결정 B): 같은 글자 잉크 기준 취소선 중심 차이 ±1px, 두께 차이 ±1px(반올림 차이 허용).
    check(Math.abs(row.delta.offset) <= 1 && Math.abs(row.delta.thickness) <= 1,
      `${c.id}: web strikethrough matches WPF within 1px (center and thickness): ` + JSON.stringify(row.delta));
    results.push(row);
  }

  // 4) STR-06: false·누락·잘못된 타입·빈 문단은 장식이 없다(웹). 빈 문단도 한 줄 자리를 유지한다.
  await run(`window.mountStrike(${JSON.stringify({...popupOf({id: 'STR-06', size: 16}, 'G'), content: {showPlainText: true, plainText: 'a', textBlocks: [
    {runs: [{text: '거짓', strikethrough: false}, {text: '누락'}, {text: '타입', strikethrough: 'true'}, {text: '숫자', strikethrough: 1}]}, {runs: []}, {runs: [{text: '끝'}]}]}})})`);
  await pause(150);
  const s06 = await run(`(()=>{const spans=Array.from(document.querySelectorAll('#frame span')).filter(e=>['거짓','누락','타입','숫자','끝'].includes(e.textContent));
    return {texts:spans.map(e=>e.textContent),decorations:spans.map(e=>getComputedStyle(e).textDecorationLine)};})()`);
  check(['거짓', '누락', '끝'].every(t => s06.texts.includes(t)) && s06.decorations.every(d => d === 'none'),
    'STR-06 web: false, missing and invalid-type strikethrough draw no decoration and keep the text: ' + JSON.stringify(s06));

  // 5) 보고서
  const fmt = n => (Math.round(n * 100) / 100).toString();
  const lines = ['# TODO62-5 취소선 위치 실측 (웹 미리보기 ↔ WPF)', '',
    `- 생성: ${new Date().toISOString()} · 표본 글자 \`${SAMPLE}\` · 웹 headless Edge 100% · WPF RenderTargetBitmap 96 DPI`,
    '- offset = 취소선 중심 - 글자 잉크 위쪽(px), ratio = offset ÷ 잉크 높이, Δ = 웹 - WPF. 두께는 px 행 수.', '',
    '| 케이스 | 글꼴(웹 계산값) | 크기 | 잉크 높이 웹/WPF | 취소선 offset 웹/WPF (Δ) | ratio 웹/WPF (Δ) | 두께 웹/WPF | 밑줄 중심 웹/WPF | 비고 |',
    '|---|---|---|---|---|---|---|---|---|'];
  for (const r of results) {
    const family = (fontsUsed[`${r.case.id}.S`]?.family ?? '').split(',')[0];
    lines.push(`| ${r.case.id} | ${family}${r.case.bold ? ' 굵게' : ''}${r.case.italic ? ' 기울임' : ''}${r.case.alignment ? ' ' + r.case.alignment : ''} | ${r.case.size} | ${r.web.ink.height}/${r.wpf.ink.height} | `
      + `${fmt(r.web.offset)}/${fmt(r.wpf.offset)} (${fmt(r.delta.offset)}) | ${fmt(r.web.ratio)}/${fmt(r.wpf.ratio)} (${fmt(r.delta.ratio)}) | ${r.web.strike.thickness}/${r.wpf.strike.thickness} | `
      + `${r.web.underline ? fmt(r.web.underline.center - r.web.ink.top) + '/' + fmt(r.wpf.underline.center - r.wpf.ink.top) : '-'} | ${r.case.note ?? ''} |`);
  }
  const worst = results.reduce((a, r) => Math.abs(r.delta.ratio) > Math.abs(a.delta.ratio) ? r : a, results[0]);
  lines.push('', `- 최대 |Δratio|: ${worst.case.id} ${fmt(worst.delta.ratio)} (offset Δ ${fmt(worst.delta.offset)}px, 크기 ${worst.case.size})`);
  fs.writeFileSync(path.join(output, 'report.md'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({sample: SAMPLE, results, fontsUsed, s06}, null, 2));
  console.log(lines.slice(4).join('\n'));
  console.log(`PASS: ${checks} TODO62-5 strikethrough checks · report: ${path.join(output, 'report.md')}`);
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
