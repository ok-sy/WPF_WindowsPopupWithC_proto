// [설계 43] 관리자 미리보기 완료 조건 버튼 UX 검증(Windows headless Edge). 저장소 루트에서 웹 의존성 설치 후 실행.
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/completion-ux-43');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// PopupPreview가 Header 로고 경로에 쓰는 Next 전용 모듈을 하네스용으로 대체한다(verify-image-preview.cjs와 같은 방식).
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-completion-ux-43-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/bundle.js' ? fs.readFileSync(path.join(output, 'bundle.js')) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9343', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9343/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  await send('Page.enable');
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('!!window.renderPopup && !!document.querySelector("button")')) break; await pause(100);}
  await pause(300);
  const render = async (type, overrides = {}, content = {}) => {
    await run(`window.renderPopup(${JSON.stringify(type)}, ${JSON.stringify(overrides)}, ${JSON.stringify(content)})`); await pause(250); };
  // 실제 MUI Slider의 숨은 range 입력에 값을 넣고 input 이벤트를 보낸다.
  const watch = async percent => { await run(`(()=>{const input=document.querySelector('input[type=range]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input, '${percent}');
    input.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(200); };
  // 버튼 상태와 aria-describedby가 가리키는 사유 문구(role/aria-live 포함)를 읽는다.
  const button = label => run(`(()=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===${JSON.stringify(label)});
    if(!bs.length) return null; const b=bs[bs.length-1], d=b.getAttribute('aria-describedby'), r=d&&document.getElementById(d);
    return {count: bs.length, disabled: b.disabled, reason: r ? r.textContent : null, role: r && r.getAttribute('role'), live: r && r.getAttribute('aria-live')};})()`);
  const bodyText = () => run('document.body.innerText');
  const click = label => run(`[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()===${JSON.stringify(label)}).pop().click()`);

  // 1. 일반 VIDEO · allowCloseBeforeComplete=false: 기준 미달이면 비활성 + 사유, 도달하면 활성 + 충족 문구.
  await render('VIDEO');
  let b = await button('닫기');
  check(b && b.disabled && b.reason === '영상 0% 시청 · 기준 80% 이상 시청하면 닫을 수 있습니다' && b.role === 'status' && b.live === 'polite',
    'VIDEO blocked close shows reason: ' + JSON.stringify(b));
  await watch(79); b = await button('닫기');
  check(b.disabled && b.reason.startsWith('영상 79% 시청'), 'VIDEO stays disabled below the ratio: ' + JSON.stringify(b));
  await watch(80); b = await button('닫기');
  check(!b.disabled && b.reason === null && (await bodyText()).includes('시청 기준을 충족했습니다'), 'VIDEO enables close at the ratio: ' + JSON.stringify(b));
  await click('닫기'); check(await run('window.closeCount') === 1, 'Enabled VIDEO close runs onClose');
  // 바로가기 라벨도 같은 기준으로 막는다.
  await render('VIDEO', {}, {footerAction: 'LINK_AND_CLOSE', footerLinkUrl: 'https://example.com'});
  b = await button('바로가기'); check(b.disabled && b.reason.includes('닫을 수 있습니다'), 'VIDEO link button is blocked too: ' + JSON.stringify(b));
  // 4자리 내림 의도: 정수 % 슬라이더에서 29% = 기준 0.29는 도달로 본다.
  await render('VIDEO', {completionRatio: .29}); await watch(29); b = await button('닫기');
  check(!b.disabled, 'Integer slider reaches 0.29 exactly: ' + JSON.stringify(b));
  await render('VIDEO', {completionRatio: .805}); await watch(80); b = await button('닫기');
  check(b.disabled && b.reason.includes('기준 80.5%'), 'Fractional ratio text and judgment: ' + JSON.stringify(b));

  // 2. 일반 VIDEO · allowCloseBeforeComplete=true: 항상 활성, 사유 없음.
  await render('VIDEO', {allowCloseBeforeComplete: true}); b = await button('닫기');
  check(!b.disabled && b.reason === null && !(await bodyText()).includes('닫을 수 있습니다'), 'VIDEO allow-close stays enabled: ' + JSON.stringify(b));

  // 3. VIDEO+QUIZ 잠금: 진행 문구에 기준 % 포함, 제출 비활성 + 사유 연결, 보조 닫기 없음(완료 전 닫기 금지).
  await render('QUIZ', {}, {videoEnabled: true});
  b = await button('제출');
  check(b.disabled && b.reason === '영상 0% · 기준 80% 이상 시청하면 퀴즈와 제출이 활성화됩니다' && b.role === 'status',
    'VIDEO+QUIZ lock progress: ' + JSON.stringify(b));
  check((await bodyText()).includes('영상을 80% 이상 시청하면 퀴즈와 하단 버튼이 활성화됩니다.'), 'VIDEO+QUIZ body notice includes the ratio');
  check(await button('닫기') === null, 'VIDEO+QUIZ without allow-close has no secondary close');
  await watch(50); b = await button('제출'); check(b.reason.startsWith('영상 50% · 기준 80%'), 'VIDEO+QUIZ lock progress follows the slider');
  await watch(80); b = await button('제출');
  check(b.disabled && b.reason === '필수 응답 0/4 · 4문항 남음', 'VIDEO+QUIZ unlock switches to question progress: ' + JSON.stringify(b));
  check((await bodyText()).includes('시청 기준을 충족했습니다. 퀴즈에 응답해 주세요.'), 'VIDEO+QUIZ unlocked notice');
  // allowCloseBeforeComplete=true면 보조 닫기 표시, showFooter=false면 숨김.
  await render('QUIZ', {allowCloseBeforeComplete: true}, {videoEnabled: true});
  b = await button('닫기'); check(b && !b.disabled, 'VIDEO+QUIZ allow-close shows secondary close');
  await watch(40); await click('닫기');
  check(await run('window.closeCount') === 2 && (await button('제출')).reason.startsWith('영상 0%'), 'Secondary close resets the preview and runs onClose');
  await render('QUIZ', {allowCloseBeforeComplete: true, showFooter: false}, {videoEnabled: true});
  check(await button('닫기') === null, 'showFooter=false hides the secondary close');
  // [설계 53-16·50-D3] 영상 영역에 보인 설명은 퀴즈 머리말에서 반복하지 않는다. 영상 설명을 숨기면 퀴즈 쪽에 한 번 보인다.
  const countText = t => run(`document.body.innerText.split(${JSON.stringify(t)}).length - 1`);
  await render('QUIZ', {}, {videoEnabled: true, description: '중복 확인 설명'});
  check(await countText('중복 확인 설명') === 1, 'VIDEO+QUIZ shows the shared description once');
  await render('QUIZ', {}, {videoEnabled: true, description: '중복 확인 설명', showDescription: false});
  check(await countText('중복 확인 설명') === 1, 'VIDEO+QUIZ with hidden video description shows it in the quiz header');
  await render('QUIZ', {}, {description: '퀴즈 설명'});
  check(await countText('퀴즈 설명') === 1, 'plain QUIZ keeps its description');

  // 4. QUIZ(영상 없음): 오답 번호 표시, 미달 판정 후 배경 어둡기 미사용일 때만 보조 닫기.
  const answerQuiz = () => run(`(()=>{for (const t of ['정답 1','오답 2','정답 3','오답 4'])
    document.querySelector('input[aria-label="'+t+'"]').click();})()`);
  await render('QUIZ', {}, {useBackgroundOverlay: false});
  check(await button('닫기') === null, 'QUIZ has no secondary close before a failed judgment');
  await answerQuiz(); await pause(200);
  b = await button('제출'); check(!b.disabled && b.reason === null, 'QUIZ submit enabled when all required answered: ' + JSON.stringify(b));
  await click('제출'); await pause(200);
  check((await bodyText()).includes('미리보기: 50점 · 미통과 · 틀린 문항: 2, 4번'), 'QUIZ failure lists wrong question numbers');
  check((await button('닫기')) !== null, 'QUIZ failure without overlay shows secondary close');
  await run(`document.querySelector('input[aria-label="정답 2"]').click()`); await pause(200);
  check((await button('닫기')) !== null, 'Secondary close stays after editing answers');
  await render('QUIZ', {}, {});
  await answerQuiz(); await pause(200); await click('제출'); await pause(200);
  check((await bodyText()).includes('틀린 문항: 2, 4번') && await button('닫기') === null, 'QUIZ with overlay hides secondary close');
  await render('QUIZ', {showFooter: false}, {useBackgroundOverlay: false});
  await answerQuiz(); await pause(200); await click('제출'); await pause(200);
  check(await button('닫기') === null, 'QUIZ with showFooter=false hides secondary close');
  await render('QUIZ', {}, {useBackgroundOverlay: false});
  await run(`(()=>{for (const t of ['정답 1','정답 2','정답 3','정답 4']) document.querySelector('input[aria-label="'+t+'"]').click();})()`); await pause(200);
  await click('제출'); await pause(200);
  const passed = await bodyText();
  check(passed.includes('미리보기: 100점 · 통과') && !passed.includes('틀린 문항') && await button('닫기') === null, 'QUIZ pass has no wrong numbers or secondary close');

  // 5. SURVEY: 보조 닫기 없음. 필수 미응답이면 제출 비활성 + 진행 문구 연결.
  await render('SURVEY', {questions: [{questionId: 9, title: '의견', questionType: 'TEXT', isRequired: true, sortOrder: 1, options: []}]}, {useBackgroundOverlay: false});
  b = await button('제출');
  check(b.disabled && b.reason === '필수 응답 0/1 · 1문항 남음' && await button('닫기') === null, 'SURVEY submit reason and no secondary close: ' + JSON.stringify(b));
  // 필수 문항이 0개(선택 문항만)면 바로 제출할 수 있다.
  await render('SURVEY', {questions: [{questionId: 9, title: '의견', questionType: 'TEXT', isRequired: false, sortOrder: 1, options: []}]});
  b = await button('제출'); check(!b.disabled, 'SURVEY with no required question can submit: ' + JSON.stringify(b));
  // 6. [TODO52-2] 나중에 보기: showFooter·showLater일 때만 표시, 완료 전 잠금(VIDEO 시청·VIDEO+QUIZ)과 관계없이 활성이며 누르면 닫힌다.
  for (const [type, content] of [['TEXT', {}], ['VIDEO', {}], ['QUIZ', {videoEnabled: true}], ['QUIZ', {}], ['SURVEY', {}]]) {
    const label = type + (content.videoEnabled ? '+VIDEO' : '');
    await render(type, {}, content);
    check(await button('나중에 보기') === null, `${label} hides later by default`);
    await render(type, {showLater: true, showFooter: false}, content);
    check(await button('나중에 보기') === null, `${label} hides later without footer`);
    await render(type, {showLater: true}, content);
    b = await button('나중에 보기'); check(b && !b.disabled, `${label} shows an enabled later button: ` + JSON.stringify(b));
    const before = await run('window.closeCount ?? 0'); await click('나중에 보기');
    check(await run('window.closeCount') === before + 1, `${label} later runs onClose`);
  }
  // 7. [TODO56] 설문 디자인 V2: 흰 본문, 문항 카드 없이 구분선(마지막 제외), 제목 끝 선택 안내, 라운드 6,
  //    라디오·체크박스 표시 없음, 선택 = 2px 테두리(크기 불변) + 세로형만 체크, 선택해도 굵기 불변.
  const opt = (id, text) => ({optionId: id, value: String(id), text, sortOrder: id});
  await render('SURVEY', {questions: [
    {questionId: 1, title: '전반적으로 만족하셨나요?', questionType: 'SINGLE_CHOICE', optionLayout: 'VERTICAL', isRequired: true, sortOrder: 1, options: [opt(11, '만족'), opt(12, '보통')]},
    {questionId: 2, title: '교육 시간은 적절했나요?', questionType: 'SINGLE_CHOICE', optionLayout: 'HORIZONTAL', isRequired: true, sortOrder: 2, options: [opt(21, '짧았다'), opt(22, '적절했다')]},
    {questionId: 3, title: '도움이 된 부분을 모두 선택해주세요.', questionType: 'MULTIPLE_CHOICE', optionLayout: 'VERTICAL', isRequired: false, sortOrder: 3, options: [opt(31, '실습'), opt(32, '자료')]},
    {questionId: 4, title: '의견', questionType: 'TEXT', isRequired: false, sortOrder: 4, options: []}]}, {useBackgroundOverlay: false});
  const v2 = () => run(`(()=>{const fs=[...document.querySelectorAll('fieldset')];
    const opt=t=>{const i=document.querySelector('input[aria-label="'+t+'"]'), o=i.nextElementSibling, s=getComputedStyle(o), r=o.getBoundingClientRect();
      return {shadow:s.boxShadow, border:s.borderTopColor, radius:s.borderTopLeftRadius, weight:getComputedStyle(o.querySelector('span')).fontWeight, svg:o.querySelectorAll('svg').length, w:r.width, h:r.height};};
    return {borders: fs.map(f=>getComputedStyle(f).borderBottomWidth), bgs: fs.map(f=>getComputedStyle(f).backgroundColor), radii: fs.map(f=>getComputedStyle(f).borderTopLeftRadius),
      hints: fs.map(f=>{const h=f.getAttribute('aria-describedby'); return h ? document.getElementById(h).textContent : null;}),
      row: opt('만족'), chip: opt('적절했다'), multi: opt('실습')};})()`);
  let s = await v2();
  check(s.borders.join() === '1px,1px,1px,0px' && s.bgs.every(c => c === 'rgba(0, 0, 0, 0)') && s.radii.every(r => r === '0px'),
    'TODO56 V2 questions have no card surface and a separator except the last: ' + JSON.stringify(s));
  check(JSON.stringify(s.hints) === JSON.stringify(['하나 선택', '하나 선택', '여러 개 선택 가능', null]),
    'TODO56 V2 choice hint follows choice titles only: ' + JSON.stringify(s.hints));
  check([s.row, s.chip, s.multi].every(o => o.radius === '6px' && o.shadow === 'none' && o.svg === 0 && o.weight === '400'),
    'TODO56 V2 unselected choices have radius 6, no indicator or check: ' + JSON.stringify(s));
  const before56 = {row: [s.row.w, s.row.h], chip: [s.chip.w, s.chip.h]};
  await run(`(()=>{for (const t of ['만족','적절했다','실습']) document.querySelector('input[aria-label="'+t+'"]').click();})()`); await pause(200);
  s = await v2();
  check([s.row, s.chip, s.multi].every(o => o.shadow.includes('inset') && o.border === 'rgb(23, 23, 23)' && o.weight === '400'),
    'TODO56 V2 selection draws the #171717 2px ring without bold: ' + JSON.stringify(s));
  check(s.row.svg === 1 && s.multi.svg === 1 && s.chip.svg === 0, 'TODO56 V2 check appears on selected vertical rows only: ' + JSON.stringify(s));
  check(s.row.w === before56.row[0] && s.row.h === before56.row[1] && s.chip.w === before56.chip[0] && s.chip.h === before56.chip[1],
    'TODO56 V2 selection keeps choice size: ' + JSON.stringify({before56, after: s}));
  const shot = await send('Page.captureScreenshot', {format: 'png'});
  fs.writeFileSync(path.join(output, 'survey-v2.png'), Buffer.from(shot.data, 'base64'));
  console.log(`PASS: ${checks} completion UX 43 checks`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {socket?.close(); browser?.kill(); server?.close();});
