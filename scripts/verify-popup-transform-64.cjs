// [TODO64] 팝업 데이터 변환 함수(popupEditorTransform.ts)를 분리 전 코드와 비교하고, 편집기·우측/모달 미리보기·변환 함수 최소 호스트를 확인한다.
// 기본 Windows Edge. 다른 Chromium은 BROWSER_PATH로 지정한다. 저장소 루트에서 웹 의존성 설치 후 실행: node scripts/verify-popup-transform-64.cjs
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.offline-verify/transform64');
const compiled = require('../zero-rule-web/node_modules/next/dist/compiled/webpack/webpack');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
compiled.init(); fs.mkdirSync(output, {recursive: true});
// next/dynamic은 Next 런타임 밖에서 React.lazy로 대신한다.
fs.writeFileSync(path.join(output, 'next-dynamic-shim.js'), `const React = require('react');
module.exports = function dynamic(loader) { const Lazy = React.lazy(() => loader().then((c) => ({ default: c })));
  return (props) => React.createElement(React.Suspense, { fallback: null }, React.createElement(Lazy, props)); };
module.exports.default = module.exports;`);
// 미리보기의 Next 라우터 의존(@/lib/urls)은 경로를 그대로 돌려주는 대역으로 바꾼다.
fs.writeFileSync(path.join(output, 'urls-shim.js'), 'exports.routerUrlOf = (url) => url;');
let browser, socket, server, checks = 0;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (ok, message) => { if (!ok) throw Error(message); checks++; };
(async () => {
  await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(__dirname, 'verify-popup-transform-64-entry.tsx'), output: {path: output, filename: 'bundle.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules'],
      alias: {'next/dynamic$': path.join(output, 'next-dynamic-shim.js'), '@/lib/urls$': path.join(output, 'urls-shim.js')}},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve()));
  // 편집기는 동적 import라 bundle.js 외 청크도 내려준다.
  server = http.createServer((req, res) => {const script = /^\/[\w.-]+\.js$/.test(req.url) && fs.existsSync(path.join(output, req.url.slice(1)));
    res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html; charset=utf-8');
    res.end(script ? fs.readFileSync(path.join(output, req.url.slice(1))) : '<!doctype html><div id="root"></div><script src="/bundle.js"></script>');});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    '--remote-debugging-port=9364', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let browserError; browser.on('error', error => { browserError = error; });
  let targets;
  for (let i = 0; i < 100; i++) {try {targets = await (await fetch('http://127.0.0.1:9364/json/list')).json(); if (targets.length) break;} catch {} await pause(100);}
  if (!targets?.length) throw browserError || Error('Chromium did not start; set BROWSER_PATH to its executable');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.once('open', resolve));
  let id = 0; const waiting = new Map();
  socket.on('message', raw => {const m = JSON.parse(raw); if (waiting.has(m.id)) {const p = waiting.get(m.id); waiting.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result);}});
  const send = (method, params = {}) => new Promise((resolve, reject) => {const key = ++id; waiting.set(key, {resolve, reject}); socket.send(JSON.stringify({id: key, method, params}));});
  const run = async expression => {const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const waitEditor = async () => { for (let i = 0; i < 100; i++) { if (await run('!!window.editor()')) return; await pause(100); } throw Error('editor not ready: ' + errors.join(' | ') + ' / ' + await run('document.body.innerHTML.slice(0, 600)')); };

  const errors = [];
  socket.on('message', raw => { const m = JSON.parse(raw); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1000, height: 900, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: 'http://127.0.0.1:' + server.address().port});
  for (let i = 0; i < 100; i++) {if (await run('typeof window.mountHost === "function"')) break; await pause(100);}

  // ── 0. 변환 모듈 의존성: UI·API 모듈 없이 번들된다 ──
  const deps = await new Promise((resolve, reject) => compiled.webpack({mode: 'development', devtool: false,
    entry: path.join(root, 'zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform.ts'), output: {path: path.join(output, 'deps'), filename: 'deps.js'},
    resolve: {extensions: ['.tsx', '.ts', '.js'], modules: [path.join(root, 'zero-rule-web/node_modules'), 'node_modules']},
    module: {rules: [{test: /\.tsx?$/, use: path.join(__dirname, 'verify-ts-loader.cjs'), exclude: /node_modules/}]},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || Error(stats.toString({all: false, errors: true}))) : resolve(stats.toJson({modules: true}).modules.map(m => m.name))));
  check(deps.every(name => !/react|@mui|PopupEditorDialog|provider|handle-error|toastify/.test(name)) && deps.some(name => name.includes('popupEditorTransform')),
    'Transform module bundles without React/MUI/API/parent modules: ' + deps.join(', '));

  // ── 1. 분리 전 코드와 결과 비교(키 순서 무시), 입력 불변 ──
  const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"/>');
  const sampleBlocks = [{alignment: 'LEFT', runs: [{text: '굵게', bold: true}, {text: ' 본문'}]}, {alignment: 'CENTER', indent: 6, runs: [{text: '가운데'}]}];
  const question = (id, type, extra = {}) => ({questionId: id, title: '문항 ' + id, questionType: type, isRequired: true, isScored: true, questionScore: 50,
    sortOrder: id, optionLayout: 'VERTICAL', titleBlocks: [{alignment: 'LEFT', runs: [{text: '문항 ' + id, italic: true}]}],
    options: type === 'TEXT' ? [] : [{optionId: id * 10 + 1, text: '가', isCorrect: true, sortOrder: 1, textBlocks: [{alignment: 'LEFT', runs: [{text: '가', underline: true}]}]},
      {optionId: id * 10 + 2, text: '나', isCorrect: false, sortOrder: 2}], ...extra});
  const base = {popupId: '  P64  ', title: '  변환  ', displayStartAt: '2026-10-21T01:02:00.000Z', displayEndAt: 1792000000, displayMode: 'SEQUENTIAL', displayOrder: null,
    sizeMode: 'FIXED', width: 560, height: 420, widthRatio: .7, heightRatio: .75, minimumWidth: 480, minimumHeight: 320, maximumWidth: 1200, maximumHeight: 900,
    showHeader: true, showCloseButton: true, showFooter: true, showDoNotShowAgain: false, showLater: true, questionTemplateId: 7, periodMode: 'FIXED',
    repeatInterval: null, repeatDayOfWeek: null, repeatDayOfMonth: null, hideDays: 3, completionRatio: .9, passingScore: 50, questions: []};
  const everything = {plainText: '굵게 본문\n가운데', textBlocks: sampleBlocks, showPlainText: true, highlightText: '강조', showHighlight: true,
    bottomDescription: '하단', bottomDescriptionUrl: ' example.com/a ', showBottomDescription: true, imageTitle: '이미지', imageUrl: svg, description: '설명',
    descriptionBlocks: [{alignment: 'LEFT', runs: [{text: '설명', bold: true}]}], surveyTitle: '설문', surveyTitleBlocks: [{alignment: 'RIGHT', runs: [{text: '설문'}]}],
    showDescription: true, videoTitle: '영상', videoUrl: 'C:/v.mp4', showControls: true, allowFullScreen: true, allowPlaybackRateChange: true, allowSeek: false,
    autoPlay: false, isLoop: false, defaultVolume: .5, useBackgroundOverlay: true, backgroundOverlayOpacity: .3, popupPosition: 'TOP_LEFT',
    headerFontSize: 18, bodyFontSize: null, footerFontSize: 14, footerAction: 'LINK_AND_CLOSE', footerLinkUrl: 'naver.com', keepAspectRatio: true, unknownKey: 'x'};
  const {keepAspectRatio: _ratio, ...withoutRatio} = everything;
  const cases = {
    TEXT: {...base, popupType: 'TEXT', content: everything},
    TEXT_CLOSE: {...base, popupType: 'TEXT', content: {...everything, footerAction: 'CLOSE', bottomDescriptionUrl: 'javascript:alert(1)'}},
    IMAGE_ADAPTIVE_LEGACY: {...base, popupType: 'IMAGE', width: null, content: {...everything, imageSizeMode: 'fixed', width: 640, height: '480'}},
    IMAGE_FIT: {...base, popupType: 'IMAGE', content: {...everything, imageSizeMode: 'FIT_TO_IMAGE', keepAspectRatio: false}},
    IMAGE_FIT_NO_RATIO_KEY: {...base, popupType: 'IMAGE', content: {...withoutRatio, imageSizeMode: 'FIT_TO_IMAGE'}},
    IMAGE_ORIGINAL_FULL: {...base, popupType: 'IMAGE', sizeMode: 'FULLSCREEN', content: {...everything, imageSizeMode: 'ORIGINAL'}},
    VIDEO: {...base, popupType: 'VIDEO', content: {...everything, footerLinkUrl: 'ftp://bad'}},
    SURVEY: {...base, popupType: 'SURVEY', questions: [question(1, 'SINGLE_CHOICE'), question(2, 'MULTIPLE_CHOICE')], content: everything},
    QUIZ: {...base, popupType: 'QUIZ', questions: [question(1, 'SINGLE_CHOICE'), question(2, 'TEXT', {answerMatchMode: null})], content: {...everything, videoEnabled: false}},
    VIDEO_QUIZ: {...base, popupType: 'QUIZ', completionRatio: null, questions: [question(3, 'TEXT')], content: {...everything, videoEnabled: true}},
  };
  const result = await run(`(()=>{const cases=${JSON.stringify(cases)};const out={};
    for(const [name,c] of Object.entries(cases)){const input=deepFreeze(JSON.parse(JSON.stringify(c)));const before=JSON.stringify(input);
      const same=(a,b)=>canonical(a)===canonical(b);
      out[name]={save:same(toSaveRequestPopup(input),legacySave(input)),load:same(toEditorPopup(input),legacyLoad({popup:input})),
        template:same(toEditorPopupFromTemplate(input,'NEW-ID'),legacyTemplate(input,'NEW-ID')),
        types:['TEXT','IMAGE','VIDEO','SURVEY','QUIZ','VIDEO_QUIZ'].filter(t=>!same(changePopupType(input,t),legacyChangeType(input,t))),
        request:same(toSaveRequest(input,false,[{targetName:'g',conditions:[]}]),{popup:legacySave(input),active:false,targetGroups:[{targetName:'g',conditions:[]}]}),
        unchanged:JSON.stringify(input)===before};}
    return out;})()`);
  for (const [name, r] of Object.entries(result)) {
    check(r.save, `${name}: save request popup equals pre-split result`);
    check(r.load, `${name}: loaded editor value equals pre-split result`);
    check(r.template, `${name}: template editor value equals pre-split result`);
    check(r.types.length === 0, `${name}: type change equals pre-split result (mismatch ${r.types})`);
    check(r.request, `${name}: toSaveRequest wraps popup, active and targetGroups`);
    check(r.unchanged, `${name}: frozen input is not modified`);
  }
  check(await run(`(()=>{const p=toSaveRequestPopup(deepFreeze(${JSON.stringify(cases.TEXT)}));return p.popupId==='P64'&&p.content.bottomDescriptionUrl==='https://example.com/a'
    &&p.content.footerLinkUrl==='https://naver.com/'&&!('imageUrl' in p.content)&&!('unknownKey' in p.content)&&p.content.textBlocks[1].indent===6;})()`),
    'TEXT save keeps blocks/plainText, normalizes URLs and drops other-type keys');
  check(await run(`(()=>{const p=toSaveRequestPopup(deepFreeze(${JSON.stringify(cases.SURVEY)}));return !('footerAction' in p.content)&&!!p.content.surveyTitleBlocks&&!!p.content.descriptionBlocks
    &&p.questions[0].titleBlocks[0].runs[0].italic&&p.questions[0].options[0].textBlocks[0].runs[0].underline;})()`),
    'SURVEY save keeps content/question/option blocks and drops footer action');
  check(await run(`(()=>{const a=createDefaultPopup(new Date('2026-01-31T00:00:00Z')),b=legacyDefault();const strip=p=>{const {displayTimes,...rest}=p;return {...rest,displayStartAt:0,displayEndAt:0};};b.minimumWidth=300;b.minimumHeight=300;
    return canonical(strip(a))===canonical(strip(b))&&a.minimumWidth===300&&a.minimumHeight===300&&a.displayStartAt==='2026-01-31T00:00:00.000Z'&&createDefaultPopup()!==createDefaultPopup();})()`),
    'Default editor value equals pre-split defaults (except TODO52-1 displayTimes, TODO68 minimum 300x300) and returns a new object');
  check(await run(`JSON.stringify(createDefaultPopup().displayTimes)==='[]'&&createDefaultPopup().periodMode==='FIXED'`), '[52-1] default schedule is FIXED with no display times');

  // ── 1-1. [TODO52-1] 노출 일정 요약·검증·입력 ──
  check(await run(`[describeSchedule('FIXED','1,3',[{startTime:'09:00',endTime:'10:00'}]),describeSchedule('SCHEDULE',null,[]),
    describeSchedule('SCHEDULE','5,1,3',[{startTime:'09:00',endTime:'12:00'},{startTime:'22:00',endTime:'02:00'}]),
    describeSchedule('SCHEDULE','1,2,3,4,5,6,7','14:00~18:00')].join('|')==='상시|매일 · 종일|월·수·금 · 09:00~12:00, 22:00~02:00|매일 · 14:00~18:00'`),
    '[52-1] schedule summary: FIXED = 상시, no days = 매일, no times = 종일, midnight crossing kept');
  check(await run(`[validatePopupSchedule({periodMode:'FIXED',displayTimes:[{startTime:'',endTime:''}]}),
    validatePopupSchedule({periodMode:'SCHEDULE',displayTimes:[{startTime:'22:00',endTime:'02:00'},{startTime:'09:00',endTime:'11:00'},{startTime:'10:00',endTime:'12:00'}]})].every(v=>v===null)
    &&/같을 수 없습니다/.test(validatePopupSchedule({periodMode:'SCHEDULE',displayTimes:[{startTime:'10:00',endTime:'10:00'}]}))
    &&/이미 있습니다/.test(validatePopupSchedule({periodMode:'SCHEDULE',displayTimes:[{startTime:'09:00',endTime:'10:00'},{startTime:'09:00',endTime:'10:00'}]}))
    &&/입력해 주세요/.test(validatePopupSchedule({periodMode:'SCHEDULE',displayTimes:[{startTime:'',endTime:'10:00'}]}))`),
    '[52-1] schedule validation allows midnight crossing and overlaps, rejects same start/end, duplicates and empty times');
  await run(`window.mountSchedule({periodMode:'FIXED',repeatDayOfWeek:null,displayTimes:[]})`); await pause(300);
  check(await run(`!document.querySelector('[aria-label="노출 요일"]')&&document.querySelector('#schedule').textContent.includes('노출 일정: 상시')`), '[52-1] FIXED hides weekday/time inputs');
  await run(`document.querySelector('#schedule input[type=checkbox]').click()`); await pause(200);
  await run(`document.querySelector('[aria-label="수요일"]').click()`); await pause(100);
  await run(`document.querySelector('[aria-label="월요일"]').click()`); await pause(100);
  await run(`Array.from(document.querySelectorAll('#schedule button')).find(b=>b.textContent.includes('시간대 추가')).click()`); await pause(200);
  const setTime = async (label, value) => run(`(()=>{const i=Array.from(document.querySelectorAll('#schedule input[type=time]')).find(x=>x.closest('.MuiFormControl-root').textContent.includes(${JSON.stringify(label)}));
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(value)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`).then(() => pause(150));
  await setTime('시작 1', '22:00'); await setTime('종료 1', '02:00');
  const schedule = await run('window.schedule');
  check(schedule.periodMode === 'SCHEDULE' && schedule.repeatDayOfWeek === '1,3' && JSON.stringify(schedule.displayTimes) === JSON.stringify([{startTime: '22:00', endTime: '02:00'}])
    && await run(`document.querySelector('#schedule').textContent.includes('노출 일정: 월·수 · 22:00~02:00')&&document.querySelector('#schedule').textContent.includes('다음 날까지(자정 초과)')`),
    '[52-1] schedule inputs set SCHEDULE, sorted weekdays and a midnight-crossing window: ' + JSON.stringify(schedule));
  await run(`document.querySelector('[aria-label="노출 시간대 1 삭제"]').click()`); await pause(150);
  await run(`document.querySelector('[aria-label="월요일"]').click()`); await pause(100); await run(`document.querySelector('[aria-label="수요일"]').click()`); await pause(150);
  check(JSON.stringify(await run('window.schedule')) === JSON.stringify({periodMode: 'SCHEDULE', repeatDayOfWeek: null, displayTimes: []})
    && await run(`document.querySelector('#schedule').textContent.includes('노출 일정: 매일 · 종일')`), '[52-1] clearing weekdays/times means every day, all day');

  // ── 2. 최소 호스트: 편집기 → 부모 state → 우측·모달 미리보기, 저장 요청 객체 ──
  await run('window.mountHost(createDefaultPopup())'); await waitEditor(); await pause(200);
  await run('window.editor().editing.view.focus()');
  for (const text of ['가', '나', '다']) { await send('Input.insertText', {text}); await pause(150); }
  check(await run('window.hostPopup.content.plainText') === '가나다', 'Typing keeps the cursor (no remount) and updates parent state: ' + await run('window.hostPopup.content.plainText'));
  check(await run("document.querySelector('#root').textContent.split('가나다').length > 2"), 'Inline preview reflects editor changes');
  const request = await run('window.saveRequest()');
  check(request.popup.content.plainText === '가나다' && request.popup.content.textBlocks[0].runs[0].text === '가나다' && request.active === true
    && await run("document.querySelector('#save-request').textContent.includes('가나다')"), 'Save request object contains editor blocks and plainText');
  await run('window.openPreview()'); await pause(400);
  check(await run("document.querySelector('.MuiDialog-paper').textContent.includes('가나다')"), 'Dialog preview shows the same editor value');
  await send('Input.dispatchKeyEvent', {type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
  await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27}); await pause(400);
  const loaded = {...cases.TEXT, popupId: 'LOADED', content: {...everything, plainText: '불러온 본문', textBlocks: [{alignment: 'LEFT', runs: [{text: '불러온 본문'}]}]}};
  await run(`window.loadContent(${JSON.stringify(loaded)})`); await pause(400); await waitEditor();
  check((await run('window.editor().getData()')).includes('불러온 본문') && await run("document.querySelector('#root').textContent.includes('불러온 본문')")
    && await run('window.hostPopup.displayOrder') === 100, 'Loading another content remounts the editor with new initial blocks');

  // ── 3. 모달 시연 응답은 저장 요청에 섞이지 않는다 ──
  await run(`window.mountHost(toEditorPopup(${JSON.stringify(cases.SURVEY)}))`); await pause(500);
  const beforeSurvey = await run('canonical(window.saveRequest())');
  await run('window.openPreview()'); await pause(400);
  await run("document.querySelector('.MuiDialog-root input[type=radio]').click()"); await pause(150);
  check(await run("document.querySelector('.MuiDialog-root input[type=radio]').checked") && await run('canonical(window.saveRequest())') === beforeSurvey,
    'Survey demo answer in the dialog does not change the save request');
  const shot = await send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(output, 'host-survey.png'), Buffer.from(shot.data, 'base64'));
  check(errors.length === 0, 'No runtime errors: ' + errors.join(' | '));
  console.log('PASS: ' + checks + ' TODO64 transform checks');
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(() => {socket?.close(); browser?.kill(); server?.close();});
