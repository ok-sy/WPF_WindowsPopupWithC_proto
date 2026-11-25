// 폐쇄망 전역 CSS 로컬 재현본(zero-rule-web/main/styles/globalStyle.ts)이 실행 중인 로컬 관리자 웹에 실제로 들어가는지 확인한다.
// 사용: 로컬 웹(next dev, 기본 http://localhost:3000)을 띄운 뒤 `node scripts/verify-closed-net-global-style.cjs [URL]`.
// NEXT_PUBLIC_CLOSED_NET_GLOBAL_STYLE=off로 띄웠으면 EXPECT=off로 실행한다(규칙이 없어야 통과).
// 결과(삽입된 전역 CSS 원문·@font-face 목록): .offline-verify/closed-net-global-style/result.json
const fs = require('fs'), path = require('path'), http = require('http'), {spawn} = require('child_process');
const WebSocket = require('../zero-rule-web/node_modules/next/dist/compiled/ws');
const url = process.argv[2] || 'http://localhost:3000/login';
const expectOn = (process.env.EXPECT || 'on') !== 'off';
const output = path.join(__dirname, '..', '.offline-verify', 'closed-net-global-style');
fs.mkdirSync(output, {recursive: true});
let checks = 0; const fail = [];
const check = (ok, msg) => { checks++; if (!ok) fail.push(msg); };
const getJson = (u) => new Promise((res, rej) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej));
const pause = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = spawn(process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9341', '--user-data-dir=' + path.join(output, 'edge-profile'), 'about:blank'], {windowsHide: true, stdio: 'ignore'});
  let socket;
  try {
    let targets;
    for (let i = 0; i < 50; i++) { try { targets = await getJson('http://127.0.0.1:9341/json'); break; } catch { await pause(200); } }
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => socket.once('open', r));
    let id = 0; const pending = new Map();
    socket.on('message', (m) => { const msg = JSON.parse(m); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
    const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); socket.send(JSON.stringify({id: n, method, params})); }).then(m => m.result);
    const run = async (expression) => (await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true})).result.value;
    await send('Page.enable'); await send('Page.navigate', {url});
    for (let i = 0; i < 150; i++) { if (await run(`document.readyState==='complete' && !!document.body`)) break; await pause(200); }
    await pause(1500);
    const result = await run(`(()=>{
      const css = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join('\\n');
      const probe = document.createElement('div'); probe.innerHTML = '<em>e</em><i>i</i>'; document.body.appendChild(probe);
      const r = {
        bodyBackground: getComputedStyle(document.body).backgroundColor, bodyWeight: getComputedStyle(document.body).fontWeight,
        emStyle: getComputedStyle(probe.querySelector('em')).fontStyle, iStyle: getComputedStyle(probe.querySelector('i')).fontStyle,
        faces: Array.from(document.fonts).map(f => f.family.replace(/"/g, '') + ' ' + f.weight),
        hasBodyRule: /body\\{background:#ebebeb;/.test(css.replace(/\\s/g, '')),
        globalCss: css.split('\\n').filter(l => /ebebeb|Youandi|font-style:normal/.test(l)).join('\\n').slice(0, 4000),
      };
      probe.remove(); return r;
    })()`);
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    if (expectOn) {
      check(result.bodyBackground === 'rgb(235, 235, 235)', 'body background is #ebebeb (globalStyle wins over CssBaseline): ' + result.bodyBackground);
      check(result.bodyWeight === '700', 'body font-weight 700 from globalStyle (2026-11-25 capture): ' + result.bodyWeight);
      check(result.emStyle === 'normal' && result.iStyle === 'normal', 'em, i reset is active outside popup components: ' + result.emStyle + '/' + result.iStyle);
      check(result.faces.includes('YouandiModern 200') && result.faces.includes('YouandiModern 700') && result.faces.includes('YouandiNewKr 400') && result.faces.includes('YouandiNewKr 500')
        && result.faces.includes('YouandiNewKr 700') && result.faces.includes('YouandiNewKr 800'),
        '@font-face aliases from globalStyle are registered: ' + JSON.stringify(result.faces));
    } else {
      check(!result.hasBodyRule && result.emStyle === 'italic' && !result.faces.some(f => f.startsWith('Youandi')), 'globalStyle is not injected when off: ' + JSON.stringify(result));
    }
    console.log('faces ' + JSON.stringify(result.faces.filter(f => f.startsWith('Youandi'))));
  } finally {
    try { socket?.close(); } catch {}
    browser.kill();
  }
  if (fail.length) { console.error('FAIL:\n- ' + fail.join('\n- ')); process.exit(1); }
  console.log('PASS: ' + checks + ' closed-net global style checks');
})().catch(e => { console.error(e); process.exit(1); });
