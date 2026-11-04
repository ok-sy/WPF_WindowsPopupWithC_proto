# API Demo master 로그인 → 팝업 API 연동 및 입력 UI 최적화 회귀검증 TODO

작성일: 2026-11-04  
상태: **구현·로컬 검증 완료(2026-11-04) / 원격 개발 DB 회귀와 TEXT 외 유형 확인 남음**  
대상: `popup-frameWork/Popup` API Demo (`-Demo -Api`) 및 실제 개발/검증 서버

## 목적

SSO 호출 없이 테스트 계정 `master`(비밀번호는 문서에 적지 않음)로 로그인하고, 발급된 인증 정보를 이용해 **팝업 단건 조회 → 팝업 표시 → 결과 단건 전송 → 다음 조회**를 수동으로 회귀검증한다. 동시에 Demo API 입력창의 사용성을 개선한다.

> **중요한 현행 계약 차이:** 기존 WPF 프로토타입 로그인 `POST /api/wpf/auth/login`은 `{lgonId, classCode, linkYn}`을 받는 **SSO 기반 토큰 발급 모의 API**이며 비밀번호를 받지 않는다. 한편 관리자 웹의 `api.auth.signIn({lgonId, passwd})`은 **별도의 일반 로그인 경로**다. 따라서 `master` 계정 비밀번호 로그인이 현재 WPF 로그인 API에서 그대로 동작한다고 가정하면 안 된다. 일반 로그인 API의 URL·실제 응답 형식·인증 쿠키/헤더·팝업 API 인증 호환 여부를 먼저 확인한 뒤 연결 방식을 결정한다. 임의로 프로토타입 로그인에 비밀번호를 끼워 넣거나 SSO가 성공한 것처럼 처리하지 않는다.

## 1. 선행 조사 — 실제 인증 계약

- [x] **A-01** `zero-rule-web/sub/domain/src/user-apis/AuthApi.ts`의 `signIn` 및 `AUTH_API_URL.signIn` 실제 경로·요청/응답을 확인한다. 테스트 계정은 `lgonId=master`(로그·문서에 실제 비밀번호 보존 금지). — 확인: `POST /p/api/auth/login`, 요청 `{lgonId, passwd}`.
- [x] **A-02** `zero-rule-server` 로그인 구현 및 Spring Security 설정에서 반환이 JSON 최상위 토큰인지, `body` 중첩인지, 응답 헤더/쿠키 기반인지 확인한다. `WpfLoginClient`가 기대하는 `{accessToken,tokenType,expiresAt}`와 대조한다. — 확인: 토큰은 응답 헤더 `x-custom-authorization`(본문·쿠키 아님), 본문은 메시지 봉투. 실패도 HTTP 200이고 헤더가 없다. `WpfLoginClient` 응답 형식과 달라 전용 클라이언트를 둔다.
- [x] **A-03** 일반 로그인으로 얻은 인증값이 `POST /api/wpf/popups`와 `POST /api/wpf/popups/results`에서 유효한지 서버 인증 필터 기준으로 확인한다. WPF 프로토타입 토큰과 일반 관리자 세션의 차이 및 환경별 플래그를 기록한다. — 확인: `Authorization: Bearer {token}`이면 인증 필터가 SecurityContext를 채운다. 팝업 API 인식 조건은 `custom.wpf-auth-prototype.enabled=false`와 `custom.wpf-popup.dev-user-header=false`(운영 경로 `SecurityContextWpfUserResolver`). 프로토타입 또는 개발 헤더 모드가 켜지면 이 토큰을 쓰지 않는다. 사번은 로그인 ID이며 `APP_USER`에 활성 행이 있어야 한다(없으면 403 `WPF_USER_INACTIVE`).
- [x] **A-04** 일반 로그인으로 팝업 API 인증이 불가능하면, **테스트 전용으로 명시적으로 승인된** 연동 방식을 결정한다(운영 인증 우회, 임의 고정 토큰, 사용자 위조 기능을 운영 코드에 추가하지 않음). — 결정: 서버 코드·인증 우회 없이 위 설정으로 일반 로그인 토큰을 그대로 쓴다. 고정 토큰·사용자 위조 추가 없음.
- [x] **A-05** 기존 `DemoWindow.AuthTest.cs`의 SSO·로그인 테스트와 `DemoWindow.Api.cs`의 API Demo 로그인 기능을 구분하고, 이번 회귀검증이 **API Demo**에 속함을 명시한다. — 확인: `DemoWindow.Api.cs`의 인증 방식 `ID/비밀번호 로그인`으로 구현. `DemoWindow.AuthTest.cs`는 변경 없음.

## 2. API Demo 수동 회귀검증 시나리오

- [x] **R-01 환경/실행**: `Popup.exe -Demo -Api`로 진입, 대상 Base URL 및 로그인 경로 확인. 자동 폴링이 실행되지 않는지 점검. — `ApiDemoTests`로 실제 DemoWindow를 API 모드로 실행(자동 조회 없음).
- [x] **R-02 SSO 미사용 로그인**: `master` 계정과 비밀번호로 승인된 일반 로그인 API를 호출. HTTP 상태, 요청 Content-Type, 응답 인증 데이터 형식 확인. 비밀번호·토큰은 기본 로그 마스킹. — 로컬 XE 서버에서 실제 로그인 성공, 잘못된 비밀번호는 실패로 구분.
- [x] **R-03 인증 전달**: 로그인 후 저장된 토큰 또는 쿠키를 다음 요청에 올바르게 부착하는지 확인. `Authorization: Bearer ...`를 무조건 가정하지 않음. 인증 정보는 메모리에서만 유지. — 로컬 XE 서버에서 조회·결과에 같은 토큰 사용, 메모리 보관.
- [x] **R-04 단건 조회**: `POST /api/wpf/popups` 요청 본문 `{}` → `pollingIntervalSeconds` 및 `popup` 확인. `popup=null`은 정상 결과로 처리. — 로컬 XE 서버에서 `popup` 있음·`popup=null` 모두 확인.
- [ ] **R-05 실제 렌더링**: 반환된 팝업의 `deliveryId`, `popupId`, 콘텐츠 유형과 실제 화면을 비교. TEXT/IMAGE/VIDEO/SURVEY/QUIZ, VIDEO+QUIZ는 테스트 데이터가 준비된 유형만 순차 수행. — TEXT·VIDEO·SURVEY·QUIZ는 원격 개발 DB에서 화면 생성까지 확인. IMAGE·VIDEO+QUIZ는 샘플 없음. 육안 비교는 미실행.
- [x] **R-06 결과 제출**: 실제 팝업 닫기/제출 시 `POST /api/wpf/popups/results`로 `resultId`·`deliveryId`·`popupId`·`resultType` 전송, 서버의 `status`·`nextStatus` 확인. — 로컬 XE 서버에서 TEXT 결과 저장, `nextStatus=EMPTY` 확인.
- [x] **R-07 다음 조회**: `AVAILABLE`이어도 자동 호출하지 않고 버튼으로 수동 조회. `EMPTY`·미전송 결과 존재 시 현재 정책 유지. — 로컬 XE 서버에서 자동 호출 없이 버튼으로 재조회 확인.
- [ ] **R-08 오류/복구**: 잘못된 비밀번호, 미인증·401, 로그인 응답에 토큰 없음/응답 형태 불일치(토큰 기반일 때), 403·404·426·500, 잘못된 JSON, 타임아웃·연결 실패, 중복 클릭을 구분해 표시. — 잘못된 비밀번호·토큰 없음·형식 불일치·로그인 500·조회 500·빈 응답·잘못된 JSON은 검사 완료, 실제 서버 401·403은 HTTP 호출로 확인. 타임아웃·연결 실패의 신규 로그인 경로는 미실행.
- [x] **R-09 재전송/멱등**: 로그인 이후 401 시 승인된 재인증 방식으로 최대 1회 재시도. 결과 재전송 시 동일 `resultId` 및 동일 본문 유지; `DUPLICATE` 처리 확인. — 모의 서버에서 401 후 1회 재로그인·재시도 확인. 결과 재전송 `resultId` 유지는 기존 `ApiDemoTests` 검사.
- [x] **R-10 기존 모드 보호**: 인메모리 Demo, 기존 SSO 프로토타입 모드, 직접 토큰 입력 모드, 일반 실행 자동 폴링이 영향을 받지 않는지 확인. — `ApiDemoTests`로 프로토타입·토큰 방식, `PopupWindowTests`로 공통 표시 경로 확인. 일반 실행 코드는 변경 없음.
- [x] **R-11 증적**: 요청/응답 구조와 HTTP 상태, 소요 시간, 토큰 마스킹된 로그, 팝업 표시/닫힘, 최종 성공·실패·미실행 항목 기록. 실제 개발/검증 DB 데이터 변경은 테스트 범위에 포함되므로 대상 계정/환경 확인. — HTTP 기록·단계 표시로 확인. 비밀번호는 기록하지 않고 토큰은 기본 마스킹.

## 3. 입력창 UX 최적화 TODO

- [x] **U-01 목적별 그룹 분리**: 연결 설정(Base URL) / 인증 방식·로그인 / 팝업 조회 JSON / 결과 로그·본문을 명확하게 나눈다.
- [x] **U-02 인증 방식별 입력 노출**: SSO 없는 ID/비밀번호 로그인에서는 사번·classCode·SSO URL을 숨기고, 직접 토큰 모드에는 토큰 입력만, 기존 프로토타입 로그인에는 기존 JSON 입력을 노출한다. **실제 인증 호환성 조사(A-01~04) 후** 탭/옵션 구조 확정.
- [x] **U-03 기본값**: URL·조회 본문 `{}`는 기존 설정 기반으로 초기화하되 계정 비밀번호를 소스/설정의 기본값으로 저장하거나 자동 채우지 않는다. 테스트 계정 ID만 비밀이 아닌 경우 예시로 제시 가능.
- [x] **U-04 민감정보**: 비밀번호는 `PasswordBox`, 토큰은 기본 마스킹. Request/Response 로그·복사·오류 메시지·설정 재적용에 비밀번호와 토큰이 노출되지 않도록 한다. — 비밀번호는 기록을 만들 때 지워 `토큰 평문 표시`를 켜도 나오지 않는다.
- [x] **U-05 입력 검증**: 빈 URL, 잘못된 URL·로그인 경로, 빈 아이디/비밀번호, 잘못된 JSON, 중복 로그인·조회 클릭의 메시지를 해당 입력란 가까이에 명확하게 제공.
- [x] **U-06 실행 단계 표시**: 연결 → 로그인 → 인증 준비 → 팝업 조회 → 표시 → 결과 전송의 단계별 상태(대기/성공/실패)와 최종 HTTP 상태·경과 시간 표기.
- [ ] **U-07 조작 동선**: 화면 높이가 낮아도 로그인/조회 버튼을 찾을 수 있도록 배치·스크롤·입력 폭 개선. Enter 로그인·키보드 탭 이동·포커스·멀티라인 JSON 편집/복사 동작 점검. — Enter 로그인·조회 버튼 하단 고정·실패 시 입력 펼침 구현. 낮은 화면·탭 이동의 육안 확인은 미실행.
- [x] **U-08 연결 변경 안전성**: 인증 방법/Base URL/계정 변경 시 이전 인증 상태 초기화와 미전송 결과의 다른 서버 오전송 방지 확인.
- [x] **U-09 기존 기능 유지**: HTTP Request/Response 상세 보기, 로그 복사/초기화, 마스킹 토글, 수동 결과 재전송, 기존 Demo 모드 UI와 충돌하지 않게 구현. — 기존 `ApiDemoTests` 흐름 통과. 비밀번호 비노출 검사 추가.

## 4. 관련 코드 및 완료 조건

대상: `Popup/DemoWindow.Api.cs`, `Popup/DemoWindow.xaml`, `Popup/Services/Auth/WpfLoginClient.cs`, `DemoApiAuthHeaderProvider.cs`, `Popup/Services/PopupApiService.cs`; 서버 일반 로그인/인증 경계는 선행 조사만 진행.

**완료 기준**: SSO 미사용 로그인→실제 팝업 조회→렌더링→결과 저장→수동 다음 조회가 동일 인증 세션으로 검증되고, 로그인/파싱 실패 원인을 UI에서 식별 가능하며, 기존 인증 방식 및 Demo/일반 실행 회귀 테스트가 통과한다.

## 5. 실행 결과 (2026-11-04)

- 화면 정리(2026-11-04): 인증 방식을 `로그인 API 호출 후 토큰 사용`과 `토큰 직접 입력` 2가지로 줄였다. ID/비밀번호 전용 입력(PasswordBox·Enter 로그인)과 `인증 헤더 없음`을 삭제하고, 일반 로그인은 로그인 경로 `/api/auth/login`과 JSON `{lgonId, passwd}`로 호출한다. 그래서 U-02·U-03·U-04·U-07의 비밀번호 입력 항목은 이 결정으로 대체되며, JSON 칸의 비밀번호는 화면에 보이지만 HTTP 기록·로그에는 남지 않는다. 단건 조회 요청 JSON은 기본으로 접어 둔다.

- 실행 조건: 서버 환경변수 `CUSTOM_WPF_AUTH_PROTOTYPE_ENABLED=false`, `CUSTOM_WPF_POPUP_DEV_USER_HEADER=false`. 계정은 로그인 권한 조회(`/apis/cloverframework/nav/items`)가 통과하고 `APP_USER`에 활성 행이 있어야 한다.
- 로컬 XE에는 권한·`APP_USER` 데이터가 없어 임시 행과 임시 TEXT 팝업으로 검증하고 모두 지웠다. 로그인 시각·`CLOVER_USER_AUTH`·실패 횟수는 로컬 XE의 `master`에 남을 수 있다.
- 실제 서버 회귀는 `POPUP_DEMO_REAL_BASE_URL`·`POPUP_DEMO_REAL_ID`·`POPUP_DEMO_REAL_PASSWORD`를 설정하고 `scripts/ApiDemoTests`를 실행한다. 비밀번호는 저장소에 두지 않는다.
- 원격 개발 DB(2026-11-04): `master` 전용 임시 `APP_USER`와 샘플 복사 팝업을 유형별로 만들어 검증하고 모두 지웠다(남은 행 0건, 기존 공지 4건 유지). TEXT·VIDEO·SURVEY·QUIZ 모두 로그인 → 조회 → 화면 생성 → 결과 저장(`nextStatus=EMPTY`) → 수동 재조회(`popup=null`) 통과.
- 2026-11-04 이후 `master`는 `db/oracle/21_dev_master_app_user_oracle.sql`로 로컬 XE·원격 개발 DB의 `APP_USER`에 영구 등록되어 있다(로컬 XE의 로그인 권한 행은 없음).
- TEXT는 4회 중 첫 1회만 결과 단계 대기 시간(20초) 초과로 실패했다. 이때도 서버에 결과 행은 저장됐고, 같은 조건 재실행 3회는 모두 통과해 원인은 재현·확정하지 못했다. 재발 시 로그를 남기도록 검사를 보완했다.
- 남은 항목: IMAGE·VIDEO+QUIZ 실제 서버 렌더링(원격 샘플 없음), 신규 로그인 경로의 타임아웃·연결 실패 수동 확인, 화면 육안 확인.

참고: `docs/design/51_DEMO_API_수동호출_팝업검증_TODO.md`, `docs/design/10_WPF_SSO_토큰_프로토타입_계획.md`.
