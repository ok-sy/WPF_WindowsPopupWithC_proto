// [설계 10 — 로컬 검증용] 사내 SSO 모의 서버.
//
// WPF SsoClient(Windows 통합 인증 GET)가 기대하는 XML(MAIN_USER_ID, MAIN_USER_CLASSI_CODE)을 돌려준다.
// 실제 SSO는 Negotiate 도전을 하지만 이 모의 서버는 도전 없이 바로 200을 준다(HttpClientHandler.UseDefaultCredentials=true 는
// 도전이 없으면 자격 증명을 보내지 않으므로 클라이언트 코드 경로는 동일하다). 사용자 진위 검증이 없는 프로토타입 전용이며
// 운영·개발 서버에 배포하지 않는다.
//
// 실행:  node shell/mock-sso.js                       → http://localhost:8099/  (어떤 경로든 같은 XML)
//        MOCK_SSO_PORT=8099 MOCK_SSO_USER_ID=E1001 MOCK_SSO_CLASS_CODE=A1 node shell/mock-sso.js
//        MOCK_SSO_FAIL=1  → 모든 요청에 401 (T7 SSO 실패 시나리오)
// WPF appsettings: "Auth": { "Mode": "SsoPrototype", "SsoUrl": "http://localhost:8099/sso/encriptloginprocess.aspx" }
'use strict';

const http = require('http');

const port = Number(process.env.MOCK_SSO_PORT || 8099);
const userId = process.env.MOCK_SSO_USER_ID || 'E1001';
const classCode = process.env.MOCK_SSO_CLASS_CODE || 'A1';
const fail = process.env.MOCK_SSO_FAIL === '1';

function xml() {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<ROOT>',
    '  <RESULT>SUCCESS</RESULT>',
    `  <MAIN_USER_ID>${userId}</MAIN_USER_ID>`,
    `  <MAIN_USER_CLASSI_CODE>${classCode}</MAIN_USER_CLASSI_CODE>`,
    '</ROOT>',
    '',
  ].join('\n');
}

const server = http.createServer((req, res) => {
  const stamp = new Date().toISOString();
  if (fail) {
    console.log(`${stamp} ${req.method} ${req.url} -> 401 (MOCK_SSO_FAIL)`);
    res.writeHead(401, { 'WWW-Authenticate': 'Negotiate', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unauthorized');
    return;
  }
  const body = xml();
  console.log(`${stamp} ${req.method} ${req.url} -> 200 userId=${userId} classCode=${classCode}`);
  res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
});

server.listen(port, () => {
  console.log(`mock SSO listening on http://localhost:${port}/  (userId=${userId}, classCode=${classCode}, fail=${fail})`);
});
