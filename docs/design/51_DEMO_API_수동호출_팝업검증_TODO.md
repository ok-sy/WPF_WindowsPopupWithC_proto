# 51. API 호출형 Demo와 수동 요청·응답 팝업 검증 TODO

기준일: 2026-10-16 (KST).  
상태: **WPF 구현 완료 · 개발계/검증계 실제 확인 대기** (2026-10-17). 로컬 모의 HTTP 서버 검증까지 완료, 실제 서버 확인(51-9)은 미실행.

Trello: https://trello.com/c/AV0U32nH (진행 확정).

검토 기준: main `6b743d6`.

## 목적과 확정 범위

기존 인메모리 Demo에 더해 `-Demo -Api` 실행 시 Demo 화면에서 실제 개발계/검증계 API를 호출한다. 요청 JSON을 입력하고 실제 응답을 확인한 뒤 응답의 팝업을 기존 WPF 경로로 표시한다. 닫기·제출 결과도 실제 서버로 전송하고 요청·응답을 확인한다.

- 기본 동작은 **수동 호출, 자동 폴링 OFF**다. 결과 수신 뒤 다음 후보가 있어도 수동으로 다음 조회를 실행한다.
- 개발계/검증계 사용을 전제로 실제 전달 건·결과 데이터가 생성되는 것을 허용한다. 읽기 전용 모드나 테스트 데이터 자동 정리 기능은 요구하지 않는다.
- WPF 샘플 전달·표시·요청/응답 관찰을 위한 기능이다. 서버 정책을 클라이언트에 복제하거나 Front/Server 전체 검증 책임을 WPF에 추가하지 않는다.
- 현행 단건 API 계약을 사용하며 상시 노출·나중에 보기 등 미확정 기능은 포함하지 않는다.

## 현재 구조와 변경 지점

> 아래는 구현 전(main `6b743d6`) 구조 기록이다. 구현 후 구조는 아래 '구현 결과 (2026-10-17)'를 따른다(`-Demo -Api` 인자 처리, DemoWindow API 패널, `PopupApiService`·결과 큐 연결).

- `App.xaml.cs`는 MainWindow.IsDemoMode에 따라 DemoWindow 또는 일반 API 화면으로 진입한다.
- `MainWindow.xaml.cs`는 현재 `--demo`만 인자로 읽고, 실제 API 모드에서 PopupApiService·인증 공급자·결과 큐·폴링을 구성한다.
- `DemoWindow.xaml.cs`는 DemoPopupGateway에 고정되어 있다. UI만 열어도 실제 API를 사용하도록 전환되는 구조가 아니므로 실행 모드·초기화·조회 및 결과 경로 연결을 함께 변경해야 한다.
- IPopupGateway는 공통 결과 전달 경계이며, 조회는 각 화면이 구체 서비스를 사용한다. 인터페이스 이름만 바꾸는 것으로 끝내지 않고 필요한 공통 경계만 검토한다.

## 구현 TODO

- [x] **51-1 실행 모드 분리**: `Popup.exe -Demo -Api`로 API Demo에 진입한다. 기존 `--demo`를 유지하고 단일/이중 하이픈·대소문자 처리 및 인자 우선순위를 명시한다. 일반 실행·기존 인메모리 Demo·API Demo를 구분하고 `-Api` 단독 및 설정값 충돌 처리를 정의한다.
- [x] **51-2 요청 입력 화면**: 대상 Base URL, 로그인/조회 요청 JSON, 필요한 인증 헤더를 입력하고 수동 호출한다. endpoint·method는 현행 로그인/단건 조회/결과 API 계약에 맞춘다. 조회 기본 본문은 {}이며 임의의 범용 HTTP 도구로 확장하지 않는다. 토큰을 직접 입력하는 경로와 로그인 후 토큰을 사용하는 경로를 구분한다.
- [x] **51-3 HTTP 요청·응답 표시**: 실제로 전송한 method·URL·업무 헤더·본문과 응답 HTTP 상태·본문·소요 시간·오류를 화면에서 확인한다. JSON 복사 및 로그 초기화를 지원하고 빈 응답·잘못된 JSON·비정상 HTTP 응답을 팝업 생성 오류와 구분한다. 인증 토큰은 기본 마스킹하고 평문을 파일 로그에 남기지 않는다.
- [x] **51-4 공통 API·팝업 경로 재사용**: 실제 API 모드의 PopupApiService·인증 공급자·DTO 역직렬화·PopupFactory/PopupManager·결과 DTO 생성 경로를 재사용한다. 입력 JSON을 실제 요청 본문으로 보내는 경계와 HTTP 관찰 지점을 설계하고, Demo용 응답 구조 재작성·별도 렌더러·가짜 deliveryId 생성은 하지 않는다.
- [x] **51-5 단건 조회·표시**: 정상 응답의 popup 단일 객체로 기존 WPF 팝업을 표시한다. popup=null은 정상적인 표시 대상 없음으로 안내한다. pollingIntervalSeconds 등 응답값을 표시하되 기본 수동 모드에서는 타이머를 시작하지 않는다. 표시 중/호출 중 중복 조회를 막는다.
- [x] **51-6 결과 실제 전송**: 팝업 닫기·숨김·설문/퀴즈 제출·영상 결과를 현행 계약에 따라 실제 결과 API로 전송한다. 생성된 request와 response를 함께 표시한다. response nextStatus는 화면에 보여주고, AVAILABLE이어도 다음 조회는 기본적으로 수동 버튼으로 실행한다. 새 결과 유형이나 업무 정책을 이 과제로 추가하지 않는다.
- [x] **51-7 ID·실패·재시도**: 서버의 popupId/deliveryId를 그대로 사용한다. 결과 생성 시 resultId를 한 번 확정하고 같은 결과 재시도는 같은 ID·본문으로 전송한다. 실패 결과 보관·중복 클릭 차단·인증 만료/401 재로그인·DUPLICATE/REJECTED 및 통신 실패 동작은 기존 API 흐름을 재사용하고 관찰 가능하게 한다. 환경·계정 변경 시 미전송 결과가 다른 대상으로 전송되지 않게 경계를 정한다.
- [x] **51-8 Demo 전용 동작 구분**: 현재 Demo의 인메모리 초기화·유형 필터·샘플 옵션 편집·인증 테스트와 API Demo의 적용 범위를 구분한다. 트레이의 팝업 다시 조회도 API Demo에서는 실제 조회 경로로 연결한다. 수동 UI와 일반 API 자동 조회 루프가 동시에 실행되지 않게 한다.
- [ ] **51-9 WPF 검증** (로컬 모의 서버 검증 완료, 개발계/검증계 실제 확인 미실행): 개발계/검증계에서 로그인 또는 토큰 입력→수동 조회→유형별 실제 팝업 표시→결과 실제 전송→다음 수동 조회를 확인한다. popup=null·잘못된 JSON·401·통신 실패·결과 재전송·반복 클릭도 확인하고 WPF 검증 방법과 샘플 요청을 남긴다. 서버 내부 정합성과 관리자 웹 전체 검증은 각 담당 범위로 구분한다.
- [x] **51-10 문서·샘플 전달**: 실행 명령·입력 항목·수동 흐름·인증 방식·오류 확인·재시도 방법을 Demo 가이드와 README에 반영한다. ALL/MINIMAL 및 인터페이스 명세를 검토하되 개발 검증 도구 추가로 최소 외부 제공 범위를 확대하지 않는다. 필요 패키지 추가 여부·폐쇄망 빌드 영향을 확인한다.

## 구현 결과 (2026-10-17)

| 항목 | 구현 |
|---|---|
| 51-1 | `Services/LaunchArguments`: `-`/`--`·대소문자 무시, 순서 무관. Demo = `-Demo` 인자 또는 appsettings `DemoMode`, API Demo = Demo이면서 `-Api`. `-Api` 단독은 무시(일반 실행 유지, Debug 로그). `PopupClientSettings.DemoApi`는 인자로만 켬. `--show-main`도 같은 파서 사용 |
| 51-2 | DemoWindow `ApiPanel`: Base URL, 인증 방식(로그인 API 후 토큰 / 토큰 직접 입력 / 헤더 없음 — 초기 선택은 `Auth.Mode`), 로그인 경로·로그인 요청 JSON, 토큰(PasswordBox), X-Dev-User-Id, 단건 조회 요청 JSON(기본 `{}`). 입력은 JSON 객체만 허용하고 형식 오류는 요청 없이 기록. endpoint·method는 현행 계약 고정 |
| 51-3 | `HttpExchangeRecorder`(HttpClient 안쪽 DelegatingHandler)가 실제 method·URL·헤더·본문, HTTP 상태·본문·소요 시간·오류를 메모리 이벤트로 기록. 로그 선택 시 Request·Response JSON(기존 복사·로그 지우기 재사용). `bodyKind`(JSON·EMPTY·INVALID_JSON·NO_RESPONSE)와 오류 단계(HTTP 오류·통신 실패·시간 초과·426·응답 해석 실패·팝업 생성)를 구분. Authorization·accessToken 기본 마스킹, `토큰 평문 표시(화면만)`. 파일 로그 없음 |
| 51-4 | `PopupApiService`(인증 헤더·401 1회 재시도·426·역직렬화)·`PopupResultQueue`·`PopupService`/`PopupManager`·`PopupResultBuilder` 재사용. 추가는 입력 JSON 본문 오버로드(`GetNextPopupAsync(JsonElement)`, `WpfLoginClient.LoginAsync(JsonElement)`), 관찰 핸들러, `DemoApiAuthHeaderProvider`뿐. IPopupGateway는 변경 없음 |
| 51-5 | 응답 popup 1건을 일반 경로로 표시, `popup=null`은 정상 안내, `pollingIntervalSeconds`는 로그·상태줄만(타이머 없음). 호출 중·표시 중 조회·연결 변경 버튼 잠금, 표시 중 트레이 조회는 안내 |
| 51-6 | 결과 훅은 일반 실행과 동일(Enqueue→닫기→전송). 닫힘 후 실제 결과 API 전송, status·nextStatus 표시. AVAILABLE이어도 다음 조회는 버튼 |
| 51-7 | resultId는 결과 생성 시 확정, 재전송은 큐 파일의 같은 본문. 조회 전 미전송 전송·남으면 조회 보류(일반 실행 규칙), `미전송 결과 재전송` 버튼. 로그인 방식 401은 같은 로그인 본문으로 1회 재로그인(동시 401 중복 방지), 토큰 직접 입력은 재로그인 없음. 결과 큐 파일을 Base URL·인증 방식·인증 대상·X-Dev-User-Id 해시별로 분리(`%TEMP%/Popup/api-demo/pending-<해시>.json`), 미전송이 있으면 연결 변경 전 확인. 426은 결과 전송 중단·항목 보관(연결 재적용 시 재개) |
| 51-8 | 인메모리 전용 조작(샘플·옵션·상태 초기화·전체 실행·SSO·로그인 테스트) 숨김. 트레이 `팝업 다시 조회`는 `DemoWindow.RefreshFromTray`로 API Demo에서 실제 조회. MainWindow는 Demo에서 API 서비스·주기 조회를 만들지 않음 |
| 51-10 | `popup-frameWork/README.md` "API Demo", 루트 README, ALL 정의서 5절 실행 행. MINIMAL은 검토만(개발 검증 도구라 외부 제공 범위 변경 없음). 추가 NuGet 없음(폐쇄망 빌드 영향 없음) |

검증: `scripts/ApiDemoTests`(로컬 HttpListener 모의 서버, 실제 DemoWindow 경로) 48건 — 인자 해석, 마스킹·bodyKind, 연결 키 분리, 로그인 JSON·조회 본문 그대로 전송, 토큰·버전 헤더, 표시·버튼 잠금, CLOSED 결과 실제 전송(popupId·deliveryId), AVAILABLE 후 자동 조회 없음, 401 재로그인·재전송, 결과 500 보관·같은 본문 재전송·조회 보류·수동 재전송 종결, popup=null·빈 응답·잘못된 JSON·HTTP 500·팝업 생성 오류 구분, 비객체 입력 미전송, 연결 변경 시 새 큐·새 토큰·X-Dev-User-Id. 조회 본문 오버로드를 되돌리면 실패함을 확인.

남은 항목(51-9): 개발계/검증계에서 로그인 또는 토큰 입력→수동 조회→유형별(TEXT/IMAGE/VIDEO/SURVEY/QUIZ) 실제 팝업→결과 실제 전송→다음 수동 조회, 실제 401·통신 실패 확인. 실제 Windows 화면에서 API Demo 조작 육안 확인.

## 완료 기준

- `-Demo -Api`는 수동 API Demo, 기존 `--demo`는 인메모리 Demo로 동작하며 일반 API 모드의 기존 흐름이 유지된다.
- 입력한 요청이 실제 서버로 전달되고 실제 응답 popup으로 TEXT/IMAGE/VIDEO/SURVEY/QUIZ를 표시한다.
- 닫기·제출 결과의 실제 요청·응답과 ID를 확인할 수 있으며 동일 결과 재전송은 ID·본문을 유지한다.
- 기본 수동 모드에서 자동 폴링·nextStatus 기반 연속 조회·중복 팝업 생성이 발생하지 않는다.
- 서버 장애·인증 만료·잘못된 응답에도 오류를 화면에서 확인하고 정의된 재시도 경로를 사용할 수 있다.
- 개발계/검증계 실제 확인과 로컬 WPF 검증의 실행 환경·범위·미실행 항목을 구분해 기록한다.

## 관련 파일·과제

- `popup-frameWork/Popup/App.xaml.cs`, `MainWindow.xaml.cs`, `DemoWindow.xaml(.cs)`, `DemoWindow.AuthTest.cs`
- `Services/PopupApiService.cs`, `Services/IPopupGateway.cs`, `Services/DemoPopupGateway.cs`, `Services/PopupResultQueue.cs`, `Services/Auth/*`
- `Managers/PopupManager.cs`, `Factories/PopupFactory.cs`, 실행 설정·Demo 가이드
- TODO10(인증 테스트), TODO35(단건 API), TODO39·45(결과 복구), TODO48·49(WPF 서식 표시)

## 2026-11-16 후속 TODO — appsettings만으로 API Demo 실행

상태: **구현·자동 검증 완료(2026-11-16)** · 로컬/폐쇄망 실화면 확인 대기. 기존 51-1~51-8 구현 완료 표시는 유지한다.

### 현행 코드·계약

- `popup-frameWork/Popup/MainWindow.xaml.cs` → `LoadPopupClientSettings()`: `DemoMode = arguments.Demo || GetBoolean(api, "DemoMode", false)`, `DemoApi = demoMode && arguments.Api`. 따라서 `PopupApi.DemoMode=true`만으로는 인메모리 Demo이고, API Demo에는 `-Api` 인자가 필요하다.
- `popup-frameWork/Popup/appsettings.json`: `PopupApi.DemoMode`는 존재하지만 API Demo 활성화용 설정 키는 없다. `DemoApiTargets`는 연결 대상 입력칸의 초기값이며 실행 모드를 정하지 않는다.
- `popup-frameWork/Popup/Popup.csproj`: 개발 빌드는 외부 설정 우선, 운영 빌드는 내장 설정만 사용하도록 분리되어 있다. 이번 변경에서도 이 경계를 유지한다.

### 구현 시 확인할 사항

- [x] **51-11** `PopupApi` 설정만으로 API Demo 모드에 진입할 수 있도록 `LoadPopupClientSettings()`의 `DemoApi` 판정 보완. 기존 `-Demo -Api`와 `DemoMode=true + -Api` 동작 유지.
- [x] 일반 API / 인메모리 Demo / API Demo의 세 모드가 상호 배타적으로 선택되는지 확인하고, `-Api` 단독 및 설정 충돌을 회귀 검증한다.
- [x] `App.xaml.cs`의 창 선택, `DemoWindow.Api.cs`의 수동 호출·자동 폴링 OFF, `PopupClientSettings` 전달 경로 확인. 관리자 웹·Java 서버·DB·API JSON 계약은 변경하지 않는다.
- [x] `popup-frameWork/Popup/appsettings.json`, `popup-frameWork/README.md`, WPF 사양서·관련 테스트(`scripts/ApiDemoTests/Program.cs`)를 함께 갱신하고 Debug/Release 설정 로딩 차이를 검증한다.
- [ ] 코드·단위 테스트와 로컬/폐쇄망 실화면 검증을 구분해 기록한다. 실제 서버 API 호출은 테스트 데이터 생성 가능성을 안내하고 별도 확인한다.

### 구현 전에 결정할 사항

1. **설정 키 이름·의미**: 기존 `DemoMode`만으로 인메모리 Demo와 API Demo를 구분할 수 없으므로 별도 선택 수단이 필요하다. (A) `PopupApi.DemoApi` 불리언 추가, (B) `PopupApi.DemoType` 등 모드 열거형 도입. **추천 A**: 기존 `DemoMode`와 최소 변경으로 호환 가능. B는 모드 조합을 명확히 표현하지만 설정·파싱·문서 변경 폭이 커진다. 사용자 승인 전 키 이름을 확정하지 않는다.
2. **설정과 실행 인자의 우선순위**: (A) 기존 `-Demo -Api`를 항상 우선하고 설정은 인자 없는 경우에 사용, (B) 설정값이 실행 인자를 덮어쓰도록 처리. **추천 A**: 기존 실행 방식과 설정 우선순위 규칙을 보존한다. `DemoMode=false`와 신규 API Demo 설정이 충돌하는 경우 자동으로 Demo를 켤지, 설정 오류로 처리할지도 결정해야 한다. 추천은 명시적 설정 오류로 처리하여 오설정을 드러내는 방식이다.

### 결정 (2026-11-16)

1. 설정 키: **B 채택** — `PopupApi.DemoType` 열거형(`InMemory` | `Api`, 생략·빈 값은 `InMemory`). `DemoMode`는 그대로 두고 Demo 종류만 고른다.
2. 우선순위: **A 채택** — 실행 인자 우선. 충돌(`DemoMode=false` + `DemoType=Api`)과 모르는 `DemoType` 값은 설정 오류(예외)로 시작하지 않는다.

### 구현 결과 (2026-11-16)

- `LaunchArguments.ResolveDemo(configuredDemoMode, configuredDemoType)` 추가. `-Demo -Api` → API Demo, `-Demo` → 인메모리(설정 `Api` 무시), `-Api` 단독 → 설정 `DemoMode=true`면 API Demo·아니면 무시, 인자 없음 → 설정. 인자가 `-Demo`를 주면 설정 충돌 검사를 하지 않는다.
- `MainWindow.LoadPopupClientSettings()`가 `PopupApi.DemoType`을 읽어 `ResolveDemo` 결과로 `DemoMode`·`DemoApi`를 정한다. `App.xaml.cs` 창 선택·`DemoWindow.Api.cs` 경로는 `PopupClientSettings.DemoApi`를 그대로 쓰므로 변경 없음.
- `appsettings.json`에 `"DemoType": "InMemory"`와 설명 주석 추가. README·`WPF_AGENT_SPEC.md` §11·`WPF_POPUP_ALL_SPEC.md` 실행 행 갱신. Debug(외부 설정)/Release(내장 설정) 경계는 변경 없음.
- 검증: `scripts/ApiDemoTests` `[51-11]` 9건 추가(설정만으로 진입·인자 우선·`-Api` 보강·충돌/모르는 값 예외) 포함 `PASS: 143`. Popup Release 빌드 경고·오류 0. 실제 EXE를 설정만으로 띄우는 로컬·폐쇄망 실화면 확인은 미실행.

### 완료 기준

- 인자 없이 appsettings 설정만으로 API Demo에 진입하며 수동 API 호출 화면이 열린다.
- 기존 인자 방식, 인메모리 Demo, 일반 API, Debug/Release 설정 정책이 회귀 없이 유지된다.
- 구현·테스트·실화면 결과 확인 전에는 완료 표시하지 않는다.

## 2026-11-16 후속 TODO — API Demo 로그인 입력 모드 / SSO 프로세스 모드

상태: **요구사항 접수 · 구현 대기**. 앞선 51-11(appsettings 기반 API Demo 실행)과 별개로 인증 경로를 추가한다. 기존 구현 완료 항목은 변경하지 않는다.

### 현행 코드

- `popup-frameWork/Popup/DemoWindow.xaml` → `ApiAuthModeCombo`: `LOGIN`(로그인 요청 JSON 직접 입력), `TOKEN`(토큰 직접 입력), `NONE`(인증 헤더 없음) 제공. SSO 프로세스 선택지는 없다.
- `popup-frameWork/Popup/DemoWindow.Api.cs` → `InitializeApiDemo()`, `ApplyAuthModeVisibility()`, `ApiLoginButton_Click()`, `EnsureApiConnection()`: `Auth.Mode=SsoPrototype`여도 현재는 로그인 본문 직접 입력 모드로 초기화한다. `DemoApiAuthHeaderProvider.ForLogin()`은 SSO 호출 없이 JSON으로 로그인한다.
- `popup-frameWork/Popup/Services/Auth/SsoAuthHeaderProvider.cs` → `GetAuthorizationHeaderAsync()`, `OnUnauthorizedAsync()`: 일반 API에서 `SsoClient.GetUserAsync()`(SSO GET) → `WpfLoginClient.LoginAsync(user)` → 토큰 보관, 401 재로그인에 기존 사용자 정보 재사용.
- `popup-frameWork/Popup/appsettings.json` → `PopupApi.Auth.SsoUrl`, `Auth.LoginPath`: SSO 주소와 로그인 API 경로가 이미 분리되어 있다.

### 구현 시 확인할 사항

- [ ] **51-12** API Demo 인증 선택에서 **입력 모드**(기존 로그인 JSON 직접 입력)와 **SSO 프로세스 모드**(`PopupApi.Auth.SsoUrl`로 SSO GET → 사용자 정보 파싱 → 로그인 API → 토큰 저장)를 제공한다. 기존 `LOGIN` 입력 방식은 유지한다.
- [ ] SSO 프로세스 모드는 기존 `SsoClient` / `SsoAuthHeaderProvider` / `WpfLoginClient`의 공통 인증 규칙을 재사용하고, 일반 API 자동 폴링은 시작하지 않는다. SSO URL·로그인 경로·인증 오류·401 재로그인·426 처리 확인.
- [ ] `DemoWindow.xaml` 및 `DemoWindow.Api.cs`의 선택 UI·입력 표시·로그인 버튼·상태 표시를 모드별로 분리하고, SSO 모드에서 직접 입력 JSON이 인증에 섞이지 않도록 한다.
- [ ] API Demo의 요청·응답 로그에서 SSO GET 단계와 로그인 POST 단계를 구별하고 토큰·인증 정보 평문 노출을 방지한다. SSO 호출 실패·XML 필드 누락·SSO 인증 실패·로그인 API 실패를 구분한다.
- [ ] 모드 전환 시 인증 상태·연결 키·미전송 결과 큐의 사용자/서버 분리 영향을 확인한다. `scripts/ApiDemoTests/Program.cs` 및 기존 일반 API/입력 모드 회귀 테스트 추가.
- [ ] 관리자 웹·Java 서버·Oracle·WPF API JSON 계약 변경 없이 진행하는 것을 기본으로 하며, 실환경 SSO(Negotiate)와 폐쇄망 실행은 별도 검증한다.

### 구현 전에 결정할 사항

1. **기존 토큰 직접 입력/헤더 없음 옵션의 유지 여부**: (A) 기존 3가지 선택지를 보존하고 SSO 프로세스 모드를 추가, (B) 요청대로 로그인 방식을 입력/SSO 두 가지로 단순화하면서 토큰·헤더 없음 경로를 다른 고급 옵션으로 이동 또는 제거. **추천 A**: 기존 API Demo 검증·테스트의 하위 호환을 보존. UI를 정확히 두 가지로 제한할지는 사용자 승인 필요.
2. **SSO 주소의 우선순위와 변경 가능 범위**: (A) `PopupApi.Auth.SsoUrl`을 고정 사용, (B) 설정을 초기값으로 하되 API Demo 화면에서 수정 허용. **추천 A**: 설정과 실제 인증 대상의 불일치·임의 인증 서버 접근 위험을 줄임. 개발/운영 빌드의 외부 설정 허용 정책은 유지.
3. **SSO 재호출 시점**: (A) 최초 1회 SSO GET 후 401에는 캐시 사용자 정보로 로그인 API만 재호출(일반 API와 동일), (B) 매 재로그인 시 SSO GET 재호출. **추천 A**: 기존 인증 정책·구현 재사용. 수동 '로그인' 버튼의 강제 호출 시점과 SSO 재호출 여부는 구현 전에 확인한다.

### 완료 기준

- API Demo에서 입력 모드와 SSO 프로세스 모드로 로그인할 수 있고, SSO 모드는 설정된 SsoUrl을 통해 실제 SSO 조회 후 로그인 API에서 토큰을 받는다.
- 모드별 토큰·결과 큐 격리와 401·426·실패 로그를 검증하며 기존 수동 API 호출 및 일반 실행은 유지한다.
- 코드 변경, 테스트, 로컬/폐쇄망 실환경 검증이 확인되기 전에는 구현 완료로 표시하지 않는다.
