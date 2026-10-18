# Popup WPF Client

이 문서는 `popup-frameWork` WPF 프로그램을 **실제 실행 순서대로** 따라가기 위한 입문용 README다.

처음 소스를 볼 때는 아래 순서대로 읽으면 된다.

```text
1. Popup/App.xaml.cs
2. Popup/MainWindow.xaml.cs
3. Popup/Services/Auth/SsoClient.cs
4. Popup/Services/Auth/WpfLoginClient.cs
5. Popup/Services/Auth/SsoAuthHeaderProvider.cs
6. Popup/Services/PopupApiService.cs
7. Popup/Services/PopupService.cs
8. Popup/Factories/PopupFactory.cs
9. Popup/Managers/PopupManager.cs
10. Popup/Views/Windows/PopupWindow.xaml.cs
11. Popup/Services/PopupResultBuilder.cs
12. Popup/Services/PopupResultQueue.cs
```

---

## 1. 전체 실행 흐름

```text
popupSample.exe 실행
    ↓
App.xaml.cs
    ↓
MainWindow 생성
    ↓
appsettings.json 읽기
    ↓
인증 객체 생성
    ↓
SSO 사용자 정보 조회
    ↓
Zero 로그인 API 호출
    ↓
Bearer Token 메모리 보관
    ↓
팝업 조회 API 호출 (팝업 1건 또는 null)
    ↓
서버 JSON 수신
    ↓
PopupService
    ↓
PopupFactory
    ↓
PopupOptions
    ↓
PopupManager
    ↓
PopupWindow 표시
    ↓
사용자 닫기 / 숨김 / 설문 / 영상 시청
    ↓
PopupResultBuilder
    ↓
PopupResultQueue
    ↓
결과 API 전송 (결과 1건)
    ↓
nextStatus=AVAILABLE이면 즉시 다음 조회, EMPTY면 조회 간격 대기
```

SSO 조회와 로그인 API 호출은 별도 시작 단계가 아니라 **첫 `POST /p/api/wpf/popups` 를 보내기 직전**에
`SsoAuthHeaderProvider.GetAuthorizationHeaderAsync()` 안에서 지연 실행된다(위 흐름도의 순서는 같다).

WPF는 **누가 어떤 팝업을 봐야 하는지 판단하지 않는다.**

서버의:

```text
POST /p/api/wpf/popups
```

응답이 이미 서버가 고른 표시 대상 1건(`popup`, 없으면 `null`)이므로, WPF는 받은 팝업을 화면으로 변환해서 표시하는 역할에 집중한다([설계 35] 단건 순차 흐름).

---

## 2. 프로그램 시작

### 파일

```text
Popup/App.xaml
Popup/App.xaml.cs
```

### App.xaml

```xml
<Application ...
             ShutdownMode="OnExplicitShutdown">
```

트레이 상주 프로그램이므로 MainWindow가 숨겨지거나 닫혀도 프로그램이 자동 종료되지 않게 한다.

### App.xaml.cs

실제 WPF 프로그램 시작점은:

```csharp
protected override void OnStartup(StartupEventArgs e)
```

이다.

실행 순서:

```text
popupSample.exe
↓
CrashGuard 설치
↓
Mutex로 중복 실행 방지
↓
MainWindow 생성
↓
트레이 아이콘 생성
↓
MainWindow.Show()
↓
Loaded 이벤트 발생
↓
API 모드면 MainWindow.Hide()
```

MainWindow를 잠깐 `Show()` 하는 이유는 화면을 보여주기 위해서가 아니라
`MainWindow.Loaded` 이벤트를 발생시켜 자동 팝업 조회를 시작하기 위해서다.

일반 실행에서는 관리 화면을 다시 숨기고 트레이에서 상주한다.

```text
popupSample.exe 실행 중
MainWindow 숨김
트레이 아이콘 표시
```

실행 인자:

```text
--show-main
```

을 주면 개발/테스트용 관리 화면을 숨기지 않는다.

---

## 3. MainWindow에서 프로그램 구성

### 파일

```text
Popup/MainWindow.xaml
Popup/MainWindow.xaml.cs
```

`MainWindow`는 실제 팝업 그 자체가 아니라 **WPF 클라이언트 전체를 조립하는 관리 창**이다.

생성자:

```csharp
public MainWindow()
```

에서 다음 객체들을 만든다.

```text
PopupManager
PopupService
IAuthHeaderProvider
PopupApiService
PopupResultQueue
```

관계:

```text
MainWindow
 ├─ PopupManager
 ├─ PopupService
 ├─ PopupApiService
 │    └─ IAuthHeaderProvider
 └─ PopupResultQueue
      └─ PopupApiService
```

---

## 4. appsettings.json

### 파일

```text
Popup/appsettings.json
```

대표 설정:

```json
{
  "PopupApi": {
    "DemoMode": false,
    "DemoSsoLoginTest": false,
    "BaseUrl": "http://localhost:8080/zero-rule-server/p",
    "AutoLoadOnStartup": true,
    "PollingIntervalSeconds": 1800,
    "Auth": {
      "Mode": "SsoPrototype",
      "StaticHeader": "",
      "SsoUrl": "http://localhost:8099/sso/encriptloginprocess.aspx",
      "LoginPath": "/api/wpf/auth/login",
      "PeriodicLoginMinutes": 60
    },
    "DevUserId": "E1001"
  }
}
```

의미:

| 설정 | 역할 |
|---|---|
| `DemoMode` | Java 서버 없이 WPF 화면만 테스트 |
| `DemoSsoLoginTest` | `DemoMode`에서 Demo 화면에 SSO 테스트·로그인 테스트 버튼을 따로 표시(기본 false). `Auth.SsoUrl`·`BaseUrl`+`Auth.LoginPath` 사용. API Demo(`-Demo -Api`)에서는 표시하지 않음 |
| `BaseUrl` | Zero Spring 서버 주소 |
| `AutoLoadOnStartup` | 프로그램 시작 시 자동 팝업 조회 |
| `PollingIntervalSeconds` | 기본 팝업 재조회 간격 |
| `Auth.Mode` | None / Static / SsoPrototype |
| `Auth.SsoUrl` | SSO 사용자 정보 조회 주소 |
| `Auth.LoginPath` | Zero WPF 로그인 API |
| `Auth.PeriodicLoginMinutes` | 정기 로그인 API 호출 주기 |
| `DevUserId` | 개발용 `X-Dev-User-Id` 헤더 값. 서버가 프로토타입 토큰 모드(`custom.wpf-auth-prototype.enabled=true`)이면 **무시**되고 Bearer 토큰만 통한다. 유지/제거는 별도 결정(설계 10 §14) |

현재 로컬 테스트의 SSO URL:

```text
http://localhost:8099/sso/encriptloginprocess.aspx
```

는 실제 사내 SSO가 아니라 `popup-frameWork/MockSso` 테스트 서버다.

폐쇄망 실연동에서는 이 값을 실제 SSO 주소로 바꾼다.

---

## 5. 인증 방식 선택

### 파일

```text
Popup/MainWindow.xaml.cs
```

`Auth.Mode`에 따라 인증 객체를 선택한다.

```text
None
  → NoAuthHeaderProvider

Static
  → StaticAuthHeaderProvider

SsoPrototype
  → SsoAuthHeaderProvider
```

현재 기본 테스트 흐름은:

```text
SsoPrototype
```

이다.

---

## 6. SSO 사용자 정보 조회

### 파일

```text
Popup/Services/Auth/SsoClient.cs
```

역할:

```text
Windows 로그인 사용자
↓
SSO 서버
↓
XML
↓
MAIN_USER_ID
MAIN_USER_CLASSI_CODE
```

Windows 통합 인증은:

```csharp
HttpClientHandler handler = new()
{
    UseDefaultCredentials = true
};
```

로 처리한다.

명령행 테스트의:

```text
curl.exe --negotiate -u : SSO_URL
```

과 같은 목적이다.

SSO 응답에서 찾는 XML 태그:

```text
MAIN_USER_ID
MAIN_USER_CLASSI_CODE
```

결과:

```csharp
SsoUserInfo
{
    LogonId,
    ClassCode
}
```

> 실제 사내 SSO의 `ks_c_5601-1987`/CP949 응답 처리는 폐쇄망 실연동에서 확인 후 보강한다.

---

## 7. Zero 로그인 API 호출

### 파일

```text
Popup/Services/Auth/WpfLoginClient.cs
```

SSO에서 얻은 정보를 Zero 서버로 전달한다.

```text
SsoUserInfo
↓
WpfLoginClient
↓
POST /p/api/wpf/auth/login
```

요청:

```json
{
  "logonId": "E1001",
  "classCode": "A1",
  "linkYn": "N"
}
```

응답:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresAt": "..."
}
```

토큰 값은 로그에 출력하지 않는다.

---

## 8. 토큰 메모리 관리

### 파일

```text
Popup/Services/Auth/SsoAuthHeaderProvider.cs
```

이 클래스가 WPF 인증 상태를 관리한다.

대표 메모리 상태:

```text
_accessToken
_expiresAt
_lastUser
```

토큰은 파일이나 Registry에 저장하지 않는다.

`PopupApiService`가 API를 호출하기 전에:

```csharp
GetAuthorizationHeaderAsync()
```

를 호출하면:

```text
Bearer {token}
```

형태의 헤더를 돌려준다.

서버가 401을 반환하면:

```csharp
OnUnauthorizedAsync(...)
```

가 호출되고 토큰 갱신 기회를 가진다.

## 현재 코드와 확정 정책

설계상 확정한 목표는:

```text
프로세스 시작
→ SSO GET 1회
→ logonId/classCode 메모리 보관

이후 401 또는 1시간 주기
→ 저장된 사용자 정보로 로그인 API만 재호출
→ SSO GET 재호출 없음
```

이다.

구현 상태(2026-09-21, 커밋 `4fe59aa`): `SsoAuthHeaderProvider.LoginAsync()`가 `_lastUser`가 없을 때만 `SsoClient.GetUserAsync()`를
호출하고, 401 재로그인·정기 갱신은 `WpfLoginClient.LoginAsync(_lastUser)`만 호출한다. 임시 SSO(`MockSso`) + 토큰 TTL 20초로
만료 2회를 겪는 동안 SSO GET이 프로세스 전체에서 1회만 발생하는 것을 확인했다.

관리 화면의 **SSO 로그인 테스트** 버튼은 실제 SSO 연결 확인용이므로 강제 SSO GET을 수행해도 된다.

---

## 9. 서버 API 호출

### 파일

```text
Popup/Services/PopupApiService.cs
```

신규 WPF의 핵심 API는 두 개다([설계 35] 단건 조회·결과 1건 전송).

```text
POST /p/api/wpf/popups           (본문 {}, 응답 pollingIntervalSeconds + popup 1건 또는 null)
POST /p/api/wpf/popups/results   (결과 1건, 응답 resultId·status·nextStatus)
```

### 팝업 조회

```csharp
GetNextPopupAsync()
```

호출 흐름:

```text
PopupApiService
↓
IAuthHeaderProvider.GetAuthorizationHeaderAsync()
↓
Authorization: Bearer ...
↓
POST /p/api/wpf/popups
```

### 결과 전송

```csharp
PostResultAsync(WpfResultItemDto item)
```

호출 흐름:

```text
WpfResultItemDto (resultId·deliveryId·popupId·resultType …)
↓
Authorization: Bearer ...
↓
POST /p/api/wpf/popups/results
```

---

## 10. 401 발생 시 원 요청 재전송

### 파일

```text
Popup/Services/PopupApiService.cs
```

공통 전송 메서드:

```csharp
SendWithAuthAsync(...)
```

흐름:

```text
API 요청
↓
401 Unauthorized
↓
OnUnauthorizedAsync()
↓
새 Authorization 헤더 획득
↓
동일 method / URL / body
↓
1회 재전송
```

결과 POST의 경우 기존 `WpfResultItemDto` 객체를 그대로 다시 직렬화하므로
`resultId`·`deliveryId`는 바뀌지 않는다.

---

## 11. 자동 팝업 조회

### 파일

```text
Popup/MainWindow.xaml.cs
```

`MainWindow.Loaded`에서:

```csharp
LoadAndShowAvailablePopupsAsync(...)
```

를 호출한다.

순서:

```text
1. PopupResultQueue.FlushAsync()   — 미전송 결과를 순서대로 1건씩 전송. 미종결 결과가 남으면 조회하지 않고 복구 간격 뒤 재시도
2. POST /p/api/wpf/popups          — popup 1건 또는 null
3. pollingIntervalSeconds 적용      — 가장 최근 값
4. popup=null이면 조회 간격 대기
5. PopupService.CreatePopupOptions()
6. PopupManager.Show()             — 1건 표시
7. 창 닫힘 → OnPopupFinished()     — 결과 전송 후 nextStatus로 다음 단계 결정
```

[설계 35] 팝업이 표시 중이면 주기·수동 조회를 하지 않는다. 창이 닫혀 결과가 저장되면 `nextStatus`=AVAILABLE이면 즉시 다음 조회, EMPTY면 가장 최근 조회 간격만큼 기다린다. `nextStatus`가 없으면(후보 확인 실패 등) 즉시 조회하며 `popup=null`은 정상 처리한다. REJECTED 결과는 종결이므로 다음 조회를 막지 않는다. [설계 39] 닫힘 직후와 복구 타이머 경로가 같은 메서드(`LoadAndShowAvailablePopupsAsync`)에서 결과를 보내고 nextStatus를 판단하며, 결과 큐 파일을 읽을 수 없으면 조회를 보류한다. 이전의 실행 중 표시 ID 기억(`_shownPopupIds`)은 서버가 완료·재노출 유예로 판단하므로 삭제했다. 미전송 결과를 먼저 보내고 다음 조회를 미루는 동작은 주간회의 결정 전 임시 기준이다.

---

## 12. 서버 DTO → WPF 화면 설정 변환

### 파일

```text
Popup/Services/PopupService.cs
```

이 클래스는 복잡한 판단을 하지 않는다.

```text
PopupResponseDto
↓
PopupFactory.Create()
↓
PopupOptions
```

서버가 최종 표시 대상을 결정하므로 클라이언트에서 기간/대상/완료 여부를 다시 판단하지 않는다.

---

## 13. 팝업 종류별 View 생성

### 파일

```text
Popup/Factories/PopupFactory.cs
```

`popupType`에 따라 실제 Content View를 만든다.

```text
TEXT
  → TextPopupView

IMAGE
  → ImagePopupView (ADAPTIVE / FIT_TO_IMAGE)
  → ImageFillPopupView (ORIGINAL: 원본 크기·왼쪽 위 잘림. 이미지 클릭 링크는 계약 3.7에서 삭제, 클래스명은 FILL 시절 이름 유지)

VIDEO
  → VideoPopupView

SURVEY
  → SurveyPopupView

QUIZ
  → SurveyPopupView (Quiz Mode)
```

그리고 공통 창 옵션을 `PopupOptions`에 넣는다.

대표 값:

```text
PopupId
DeliveryId
Title
ShowHeader
ShowFooterButton
ShowFooter
FooterAction / FooterLinkUrl
ShowDoNotShowAgain
UseBackgroundOverlay / BackgroundOverlayOpacity
Position
HeaderFontSize / BodyFontSize / FooterFontSize
SizeMode
Width / Height
WidthRatio / HeightRatio
```

---

## 14. 실제 팝업 표시

### 파일

```text
Popup/Managers/PopupManager.cs
```

역할:

```text
PopupOptions 1건
↓
배경 Overlay 설정
↓
PopupWindow 생성
↓
화면 표시
↓
Closed → Overlay 닫기 → 결과 처리 훅(FlushResultsInBackground)
```

[설계 35·50-B] 서버 조회 응답이 1건이고 MainWindow·DemoWindow 모두 표시 중에는 다음 팝업을 요청하지 않으므로 `PopupManager.Show()`는 1건만 받는다(표시 중 다시 부르면 예외). DisplayOrder 정렬·그룹 큐·동시 표시(SIMULTANEOUS) 경로는 삭제했다. 계약 필드 `displayMode`는 DTO에 남지만 WPF는 읽지 않으며 모르는 값이 와도 팝업 생성을 실패시키지 않는다. 표시 순서는 서버가 `DISPLAY_ORDER`로 정렬해 정하며 조회 응답에는 `displayOrder`가 없다(Demo는 DemoPopupGateway가 후보 정렬에 사용).

Overlay도 이 클래스에서 관리한다.

---

## 15. 공통 팝업 창

### 파일

```text
Popup/Views/Windows/PopupWindow.xaml
Popup/Views/Windows/PopupWindow.xaml.cs
```

`PopupWindow`는 TEXT/IMAGE/VIDEO/SURVEY별 내용 자체보다 **공통 외곽 창**을 담당한다.

`PopupOptions`를 받아:

```text
제목
Header
닫기 버튼
Footer
다시 보지 않기
창 크기
전체화면
본문 Content
```

를 적용한다.

본문에는 `PopupFactory`가 만든 View가 들어간다.

---

## 16. 사용자 행동을 결과 하나로 수집

### 파일

```text
Popup/Services/PopupResultBuilder.cs
Popup/Managers/PopupManager.cs
```

팝업 창 하나가 만들어질 때 `PopupResultBuilder`도 하나 생성된다.

이때:

```text
ResultId = GUID
```

가 만들어진다.

결과 종류:

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

### 일반 닫기

```text
창 닫기
→ CLOSED
```

### 다시 보지 않기

```text
체크 후 닫기
→ HIDDEN
```

### 설문/퀴즈

```text
제출
→ 필수 응답 검증 (WPF 즉시)
→ QUIZ 채점: QuizGrader (WPF 즉시, 정답 키·배점·통과 점수는 서버 조회 응답 popup에 포함)
→ 통과: SUBMITTED (score/passed 포함) → 안내 → 닫기
→ 미통과: 안내만 하고 창 유지 → 답안 수정 → 다시 "제출" (통과할 때까지 SUBMITTED 결과 없음)
```

[설계 12] 예전에는 서버 채점 응답을 기다렸지만, 이제 설문/퀴즈도 다른 결과와 똑같이
"로컬 큐 저장 → 점수 안내(QUIZ) → 창 닫기 → 백그라운드 전송" 순서다. 서버는 결과 저장만 한다.

### 영상

예전처럼 주기적으로 진행률을 보내지 않는다.

```text
창 닫기 직전
→ GetFinalProgress()
→ VIDEO_WATCHED
```

한 번만 만든다.

---

## 17. 결과 유실 방지 큐

### 파일

```text
Popup/Services/PopupResultQueue.cs
```

이 클래스는 로그가 아니라 **업무 결과 재전송 큐**다.

흐름 ([설계 12] 사용자 화면과 서버 전송 분리):

```text
결과 생성
↓
Enqueue()  → pending-results.json 저장 (동기 — 이 뒤엔 유실되지 않음. 일반 결과도 창이 닫히기 전 Closing에서 저장)
↓
창 닫기 (서버 응답을 기다리지 않음)
↓
FlushAsync() → POST /p/api/wpf/popups/results (저장 순서대로 1건씩)
↓
status가 ACCEPTED / DUPLICATE / REJECTED(종결)
↓
파일에서 제거 (RETRYABLE_ERROR·INTERNAL_ERROR·응답 누락은 보관 후 같은 resultId로 재전송하고, 그동안 다음 조회를 미룸)
```

[설계 34] 파일은 임시 파일에 쓴 뒤 교체하고, 읽을 수 없는 파일은 `pending-results.corrupt-시각.json`으로 보존한다.
이미 확정되어 파일에 있던 항목의 재기록 실패와 앱 종료 중 결과만 이번 실행 동안 메모리에 보관했다가 다시 기록·전송한다. 새 결과의 저장 실패는 큐에 남기지 않는다(창 유지 후 다음 닫기·제출 때 다시 저장).
INTERNAL_ERROR 항목은 실행당 3회까지만 재시도하며(임시값) 횟수를 소진해도 삭제하지 않는다.
HTTP 400인 결과는 이번 실행에서 제외(파일 보관)해 뒤의 결과 전송과 조회를 막지 않는다. [설계 35] 배열·일괄 재전송은 없으며 결과 1건씩 순서대로 보낸다(임시 기준).
손상 파일을 보존(이동)하지 못하면 파일을 덮어쓰지 않고 저장 실패로 알린다. 일반 닫기에서 저장에 실패하면 안내 후 창을 닫지 않으며, 그 결과는 큐에 남기지 않아 전송되지 않는다(다음 닫기 때 최종 상태로 다시 생성·저장). 앱 종료 중에는 닫기를 막을 수 없어 메모리에만 남기지만(RetainForExit), 종료 경로가 이미 전송을 멈췄고(StopTransmission) 종료 직전 전송도 하지 않으므로 이 결과는 서버에 보내지 못한 채 프로세스 종료와 함께 사라질 수 있다.

서버가 426(클라이언트 버전 미지원, [설계 13])을 주면 전송을 멈추고 항목을 보존한다. 업데이트된 버전에서 재전송된다.

전송 실패:

```text
네트워크 오류
또는
서버 오류
↓
pending-results.json 유지
↓
다음 FlushAsync()에서 재전송
```

파일 위치:

```text
%LOCALAPPDATA%\Popup\pending-results.json
```

토큰이나 사번은 이 파일에 저장하지 않는다.

---

## 18. 주기 조회

### 파일

```text
Popup/MainWindow.xaml.cs
```

`DispatcherTimer`를 사용한다.

기본값은 appsettings의:

```text
PollingIntervalSeconds
```

지만 서버의 조회 응답에:

```text
pollingIntervalSeconds
```

가 양수이면 서버 값이 우선한다(매 응답의 가장 최근 값). 서버 설정과 WPF 로컬 fallback은 모두 1800~3600초(30~60분)로 제한한다. [설계 35] 대기는 기동 시점 기준 경계가 아니라 빈 조회(`popup=null`)·EMPTY 응답 시점부터 그 간격만큼 센다. 팝업 표시 중에는 타이머를 걸지 않는다. 기본 `AutoLoadOnStartup=true`로 로그인 직후 최초 조회한다.

흐름:

```text
Timer Tick
↓
조회 진행 중이거나 팝업 표시 중인가?
 ├─ Yes → 조회 생략
 └─ No → Flush pending results (미종결 결과가 남으면 조회 보류·복구 간격 뒤 재시도)
            ↓
          POST /p/api/wpf/popups
            ↓
          popup 있음 → 1건 표시 / null → 조회 간격 대기
```

---

조회 실패가 DNS/연결 오류·Timeout·500/502/503/504이면 같은 타이머로 10초 간격 3회씩 5사이클 복구한다. 사이클 사이에는 30분 휴식 후 첫 10초를 기다린다. 이후 계속 실패하면 60분 간격으로 확인한다. 성공하면 복구 횟수를 초기화하고 응답의 최신 주기를 적용한다. 미전송 결과 때문에 조회를 보류한 경우도 같은 복구 간격으로 재시도한다. 400/403과 재인증 후에도 실패한 401은 복구 대상에서 제외한다.

`PopupWindow`의 공통 `PopupBodyContent` Grid가 모든 WPF 콘텐츠를 테두리 안쪽 둥근 영역으로 자른다. IMAGE 일반 모드도 같은 Clip을 사용하며 ORIGINAL의 Canvas는 창 측정용으로 유지한다. 실제 DPI 및 WebView2 네이티브 영상 경계는 Windows 검증이 필요하다.

WPF 화면 동작 및 복구/HTTP/인증/큐 검증 프로젝트는 2026-10-03부터 로컬 전용으로 관리하며 Git·소스 반입 대상에서 제외한다. 저장소의 일반 빌드에는 필요하지 않다. 실행한 검증 결과는 `version-history/CHANGELOG.md`와 설계 19에 기록한다.

SURVEY·QUIZ(VIDEO+QUIZ 포함)는 본문 여백·푸터까지 옅은 회색(#F5F6F8) 콘텐츠 배경 위에 흰색(#FFFFFF) 문항 카드(radius 11·padding 20/18·간격 14)를 두고 세로 선택 Row와 가로 Choice Chip을 배치한다. 기본 글자색은 #222222다. RadioButton·CheckBox 기능은 유지하고 선택지는 흰 배경·연한 회색 테두리(#E5E5E5)와 항상 보이는 옅은 체크 Path(세로형 오른쪽, 가로형 왼쪽 — 선택 시 폭 변화 없음)로 표시한다. 선택한 선택지는 흰 배경에 팝업 공통 강조색 #171717 테두리·체크와 SemiBold로 강조한다. 배경 없는 01 번호·제목 25·줄바꿈·포커스 outline을 적용하며 세로형 MinHeight는 48이다. Normal/SemiBold 텍스트 높이를 미리 확보해 선택 시 줄바꿈 높이 변화를 방지한다. 주관식은 radius 10·placeholder·약한 테두리·focus 강조를 사용하고 96~180 높이에서 입력을 스크롤한다. 필수 응답 상태와 #4A4A4F Submit은 하단에 고정하고 VIDEO+QUIZ의 내부 제출 영역도 공통 푸터를 끈 상태에서 고정한다. 스크롤바 폭은 8이며 본문과 10 간격을 둔다. 상세 구현·검증 범위는 `docs/design/20_SURVEY_QUIZ_UI_개선_TODO.md`에 기록한다. Demo SURVEY 6문항·QUIZ/VIDEO+QUIZ 5문항과 정답·배점은 설계 20 §6, 웹 미리보기 정합성은 설계 22를 참조한다.

## 19. 프로그램 종료

트레이 메뉴의 **종료** 또는 426 업데이트 안내를 닫으면 실제로 끝난다.

`MainWindow.OnClosed()`에서:

```text
polling/복구 timer 정지
HTTP/인증 요청 취소 및 결과 전송 중단(로컬 큐 유지)
SSO periodic login 정지
메모리 token 제거
```

그 후 `App.OnExit()`에서 Mutex를 해제한다.

---

## 20. 처음 소스를 볼 때 추천 순서

### 1단계 — 프로그램 시작만 보기

```text
App.xaml.cs
→ MainWindow.xaml.cs
```

### 2단계 — 인증만 보기

```text
SsoClient.cs
→ WpfLoginClient.cs
→ SsoAuthHeaderProvider.cs
→ IAuthHeaderProvider.cs
```

### 3단계 — 팝업 조회만 보기

```text
MainWindow.LoadAndShowAvailablePopupsAsync()
→ PopupApiService.GetNextPopupAsync()
→ PopupService.CreatePopupOptions()
→ PopupFactory.Create()
```

### 4단계 — 화면 표시만 보기

```text
PopupManager.Show()
→ PopupWindow
→ Text/Image/Video/Survey View
```

### 5단계 — 결과 전송만 보기

```text
PopupManager.AttachResultCollection()
→ PopupResultBuilder
→ PopupResultQueue
→ PopupApiService.PostResultAsync()
```

이 다섯 흐름을 따로 보면 전체 코드가 훨씬 읽기 쉽다.

---

## 21. 한 줄 역할표

| 파일 | 역할 |
|---|---|
| `App.xaml.cs` | 프로그램 시작/종료, 트레이, 단일 실행 |
| `MainWindow.xaml.cs` | 전체 객체 조립, 자동 조회, polling |
| `SsoClient.cs` | Windows 통합 인증으로 SSO XML 조회 |
| `WpfLoginClient.cs` | SSO 사용자 정보로 Zero 로그인 API 호출 |
| `SsoAuthHeaderProvider.cs` | Bearer Token 메모리 관리, 401 재인증 |
| `PopupApiService.cs` | WPF HTTP API 호출 |
| `PopupService.cs` | 서버 DTO를 화면 옵션으로 변환하는 입구 |
| `PopupFactory.cs` | TEXT/IMAGE/VIDEO/SURVEY/QUIZ View 생성 |
| `PopupManager.cs` | 팝업 순서/동시성/Overlay/창 생명주기 관리 |
| `PopupWindow.xaml.cs` | 공통 팝업 창 UI 적용 |
| `PopupResultBuilder.cs` | 팝업 하나의 최종 결과 DTO 생성 |
| `PopupResultQueue.cs` | 결과 파일 보관 및 재전송 |

---

## WPF Demo Mode

`Popup/appsettings.json`에서 `PopupApi.DemoMode`를 `true`로 설정하면
Java API와 DB 없이 WPF 화면만 시연할 수 있다.

```json
{
  "PopupApi": {
    "DemoMode": true
  }
}
```

Demo Mode에서는 프로그램 시작 시 Demo 관리 화면이 표시된다(실행 인자 `--demo`·`-Demo`로도 켤 수 있다. 실제 API를 수동 호출하는 `-Demo -Api`는 아래 "API Demo" 참고).
`시연할 샘플` 목록에서 텍스트·이미지·동영상·설문·퀴즈·동영상 + 퀴즈·푸터 바로가기 7종 중 하나를 골라
`선택한 샘플 실행`으로 열거나, `전체 실행`으로 모두 확인할 수 있다. 세부 버튼은 아래 "Demo 관리 화면"을 참고한다.

실제 API 연동 모드로 돌아가려면 `DemoMode`를 `false`로 변경한다.

### Demo SSO·로그인 테스트

`PopupApi.DemoSsoLoginTest`를 `true`로 두면 Demo 화면 왼쪽 아래에 `SSO · 로그인 테스트` 영역이 나타난다.
팝업 조회·결과 전송은 Demo 그대로 서버 없이 동작하고, 이 영역의 버튼만 실제로 통신한다.

- `SSO 테스트`: `Auth.SsoUrl`을 Windows 통합 인증으로 GET 해 `MAIN_USER_ID`·`MAIN_USER_CLASSI_CODE`를 읽고 입력칸에 채운다.
- `로그인 테스트`: 입력칸의 사번·사용자 구분 코드로 `BaseUrl`+`Auth.LoginPath`(`POST /p/api/wpf/auth/login`)를 호출한다. SSO 없이 값을 직접 입력해 단독으로 호출할 수 있다.
- 결과칸에 호출 주소·값·소요 시간 또는 실패 예외를 표시한다. 발급 토큰은 길이만 표시하고 보관하지 않는다.

### API Demo (`-Demo -Api`, 설계 51)

개발계/검증계 실제 API를 Demo 화면에서 **수동으로** 호출해 요청·응답과 실제 팝업·결과 전송을 확인한다.
실제 전달 건·결과 데이터가 서버에 생성되므로 개발계/검증계에서만 쓴다.

```text
popupSample.exe -Demo -Api
```

- 실행 인자: 단일·이중 하이픈과 대소문자를 구분하지 않는다(`-demo -api`, `--Demo --Api` 동일, 순서 무관).
  `-Demo`(또는 `--demo`) 단독은 기존 인메모리 Demo, `-Api` 단독은 효과 없음(일반 실행). appsettings `DemoMode=true`에 `-Api`만 붙여도 API Demo가 된다.
- 입력: `Base URL`(초기값 appsettings `BaseUrl`), `인증 방식`(로그인 API 호출 후 토큰 사용 / 토큰 직접 입력 / 인증 헤더 없음 — 초기 선택은 `Auth.Mode`),
  `로그인 경로`·`로그인 요청 JSON`(`{"logonId","classCode","linkYn"}` 그대로 전송), `Authorization 토큰`(스킴 없이 넣으면 `Bearer ` 추가),
  `X-Dev-User-Id`(선택, 서버 dev-user-header 전용), `단건 조회 요청 JSON`(기본 `{}`).
- 흐름: `팝업 조회` → (바뀐 연결 입력 적용) → 미전송 결과 먼저 전송(남으면 조회 보류) → `POST /api/wpf/popups` → 응답 `popup`을 일반 실행과 같은 경로로 표시
  → 창 닫기·제출 → 결과를 `POST /api/wpf/popups/results`로 실제 전송 → `status`·`nextStatus`를 로그에 표시.
  **자동 폴링은 없고** `nextStatus=AVAILABLE`이어도 다음 조회는 버튼으로 실행한다. `pollingIntervalSeconds`는 로그·상태줄에만 표시한다.
  `popup=null`은 정상적인 표시 대상 없음으로 기록한다. 호출 중·팝업 표시 중에는 조회·연결 변경 버튼이 잠긴다.
- 화면(TODO54-6): 연결·인증 입력은 `연결·인증 설정` 접기 영역에 있고, 그 위 요약에 현재 대상·인증 방식·토큰 보관 여부·미전송 건수가 항상 보인다(토큰 값은 표시하지 않음). 연결을 적용하면 설정 영역이 접히고 연결 입력 오류가 나면 다시 펼쳐진다.
- 로그: 실제로 보낸 method·URL·헤더·본문과 HTTP 상태·본문·소요 시간·오류가 한 줄씩 남고, 선택하면 Request·Response JSON으로 볼 수 있다.
  실패는 `HTTP 오류 N`·`통신 실패`·`시간 초과`·`클라이언트 버전 차단(426)`·`응답 해석 실패(빈 응답/잘못된 JSON/구조 불일치)`·`팝업 생성` 단계로 구분한다.
  `Authorization` 헤더와 응답의 `accessToken`은 기본 마스킹하며 `토큰 평문 표시(화면만)`로만 볼 수 있다. 토큰은 메모리에만 두고 파일 로그에 남기지 않는다.
- 인증: 로그인 방식은 첫 요청 직전 로그인하고, 401이면 같은 로그인 본문으로 1회 재로그인 후 같은 요청을 재전송한다. 토큰 직접 입력은 재로그인하지 않는다. `로그인` 버튼은 지금 로그인해 토큰을 교체한다.
- 재시도: 결과의 `resultId`는 생성 시 확정되며 `미전송 결과 재전송`(또는 다음 조회 전 자동 전송)은 같은 ID·본문으로 보낸다. 종결(ACCEPTED·DUPLICATE·REJECTED) 판정·400 제외·INTERNAL_ERROR 재시도 상한은 일반 실행의 결과 큐와 같다.
- 연결 경계: 미전송 결과는 `Base URL·인증 방식·인증 대상(로그인 본문 또는 토큰)·X-Dev-User-Id` 조합별 파일
  `%TEMP%/Popup/api-demo/pending-<해시>.json`에 보관한다. 연결을 바꾸면 이전 결과는 그 파일에 남고 같은 연결을 다시 적용할 때만 전송된다(미전송이 있으면 변경 전 확인). 일반 실행의 `pending-results.json`과 섞이지 않는다.
- 트레이 `팝업 다시 조회`는 API Demo에서 `팝업 조회`와 같은 실제 조회로 동작한다. 이 모드의 관리 화면(MainWindow)은 API 서비스·주기 조회를 만들지 않아 자동 조회 루프와 겹치지 않는다.
- 인메모리 전용 조작(샘플 선택·옵션 설정·상태 초기화·전체 실행·SSO·로그인 테스트)은 API Demo에서 숨긴다.
- 회귀 검증: `dotnet run --project scripts/ApiDemoTests` (로컬 모의 HTTP 서버, 실제 창을 잠깐 띄움).

### 폐쇄망 Demo 미디어

다음 파일명으로 미디어를 추가하면 빌드 시 내장 리소스로 포함된다.

```text
Popup/Media/demo-image.jpg
Popup/Media/demo-video.mp4
```

실행 시 `%LOCALAPPDATA%/Popup/DemoMedia/<콘텐츠 해시>/`에 내장 미디어를 추출한다.
캐시 파일의 해시가 일치하면 재사용하며, EXE 옆 `Media/demo-image.jpg` 또는
`Media/demo-video.mp4`가 있으면 해당 외부 파일을 우선 사용한다.

### VIDEO Overlay 컨트롤

로컬 MediaElement와 직접 HTTP/HTTPS 영상은 영상 하단의 반투명 WPF Overlay 컨트롤을 사용한다. 마우스가 영상에 들어오면 즉시 표시하고 재생 중 영상 밖으로 나가면 즉시 숨긴다. 영상 안에서 입력이 없으면 기존처럼 일반 화면 3초·영상 전체화면 2초 후 숨기고 이동/클릭 시 다시 표시한다. 일시정지 및 Seek/음량/키보드 조작 중에는 표시를 유지한다. 영상 클릭은 재생/일시정지를 전환하고 중앙 아이콘을 700ms 표시한다. showControls=false이면 컨트롤은 숨기지만 영상 클릭은 사용할 수 있다. 로딩·버퍼링은 중앙 Spinner, 오류는 별도 안내로 표현한다. URL 진행바의 회색 구간은 다운로드 확보 범위이며 시청 완료율과 구분된다.

음량·음소거는 Core Audio COM API로 Windows 기본 멀티미디어 출력 장치의 Master Volume/Mute와 양방향 동기화한다(추가 NuGet 없음). 시작 시 현재 시스템 값을 읽으며 내부 MediaElement/HTML5 음량은 1.0으로 유지한다. `defaultVolume`은 시스템 연결 전/실패 시 내부 플레이어 초기값이다. 외부 볼륨 변경은 이벤트로 반영하고 기본 장치 변경·장치 없음은 2초 주기로 확인한다. 슬라이더를 올리면 Windows 음소거도 해제하며 음소거 버튼은 음량 값을 유지한다. 다른 프로그램의 출력에도 영향을 주고 종료 시 이전 값으로 복원하지 않는다. 장치 복구 시 새 장치의 현재 값을 읽는다.

URL은 WebView2CompositionControl을 사용해 WPF 컨트롤이 영상 위에 표시된다. Windows SDK 런타임을 포함하려고 대상 프레임워크를 net10.0-windows10.0.17763.0으로 지정했다. WebView2 1.0.3124.44는 유지한다. 폐쇄망 반입 전 Microsoft.Windows.SDK.NET.Ref 등 Windows SDK 패키지를 `scripts/prepare-offline-packages.ps1`로 수집하고, 반입 묶음은 `scripts/export-offline-package.ps1`로 만든다(절차는 루트 `OFFLINE_WPF_BUILD.md`).

## Demo 관리 화면

Demo 관리 화면에서 텍스트·이미지·동영상·설문·퀴즈·동영상+퀴즈·푸터 바로가기 샘플을 선택해 `선택한 샘플 실행`으로 열거나 `옵션 설정`으로 옵션을 편집한다. `전체 실행`은 데모 단건 조회 흐름으로 숨김·완료·재노출 유예되지 않은 샘플을 1건씩 표시하고, 결과 저장 응답이 AVAILABLE이면 다음 1건을 이어서 표시한다. 설정창(TODO54)은 탭 `창·배치`·`헤더·푸터`·`콘텐츠`·`완료·동작`·`문항·선택지`(설문·퀴즈)·`고급`으로 나뉜다. 같은 탭에서 상위 옵션을 끄면 하위 입력이 숨겨지고, 다른 탭 설정이나 창 크기 방식 때문에 쓰지 않는 입력은 비활성 + 사유로 표시된다. 각 입력에는 범위·샘플 기본값이 표시되고 잘못된 값은 입력 즉시 안내하며, 샘플 기본값과 다른 항목에 `변경됨`과 하단 변경 개수가 나온다. `이 탭 기본값 복원`은 그 탭만 되돌린다. 설정창은 복사본을 편집하므로 `취소`하면 바뀌지 않고 `설정 적용` 때만 샘플별 다음 실행과 데모 결과 검증에 반영되며, 앱 종료 시 초기화된다.

메인 화면 제목 옆 배지가 현재 모드(`로컬 샘플`/`API 연결`)를 보여 주며 모드는 실행 인자로 고른다. 주 실행 버튼은 왼쪽 패널 아래에 고정된다 — 로컬: `선택한 샘플 실행`·`전체 실행`·`상태 초기화`, API: `팝업 조회`·`미전송 결과 재전송`. 그 위 상태 줄은 대기·조회/요청 중·팝업 표시 중·결과 전송 중·실패를 표시하고, 진행 중에는 실행 버튼을 막는다. 로그 줄은 `[조회]`·`[결과]`·`[로그인]`으로 구분되며 퀴즈 점수는 결과 줄과(점수가 있을 때만 보이는) 점수 상자에 표시된다. 초기화는 세 가지로 구분한다 — `선택한 샘플 옵션 전체 기본값 복원`(그 샘플 옵션만), `상태 초기화`(숨김·완료·재노출 유예·전달 건·영수증, 옵션과 로그 유지), `로그 지우기`(화면 로그·상세만).

오른쪽 결과 로그를 선택하면 해당 결과의 Request·Response JSON이 들여쓰기된 읽기 전용 텍스트로 표시되며, 각 탭의 복사 버튼 또는 텍스트 선택·Ctrl+C로 복사할 수 있다. 로그 지우기는 로그·상세 JSON·점수 표시를 지우며 숨김/완료 상태는 유지한다.

## IMAGE 계약 (설계 23)

일반 모드는 ADAPTIVE(창 우선)와 FIT_TO_IMAGE(이미지 우선)이며 외부 크기는 content.width/height 한 쌍만 사용한다. FIT_TO_IMAGE는 keepAspectRatio 기본 true, 해제 시 지정 너비·높이로 왜곡을 허용한다. IMAGE 창 최대는 작업 영역 너비·높이의 90%이며 고정 최대 픽셀값을 사용하지 않는다. 최소는 화면 상한 이하로 보정하며 최대 초과 이미지는 축소 없이 중앙에서 자른다. 설명은 하단 선택 표시와 세로 스크롤을 사용한다. ORIGINAL의 기존 최상위 창 크기·왼쪽 위 원본 잘림은 유지한다. 계약·예제는 docs/interfaces/POPUP_INTERFACE_SPEC.md v3.7, 기존 DB 전환은 db/oracle/11_IMAGE_CONTRACT_TRANSITION.md를 참조한다.
