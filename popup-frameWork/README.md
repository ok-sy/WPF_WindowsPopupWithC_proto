# Popup WPF Client

이 문서는 `popup-frameWork` WPF 프로그램을 **실제 실행 순서대로** 따라가기 위한 입문용 README다.

처음 소스를 볼 때는 아래 순서대로 읽으면 된다.

```text
1. Popup/App.xaml.cs
2. Popup/MainWindow.xaml.cs
3. Popup/Service/Auth/SsoClient.cs
4. Popup/Service/Auth/WpfLoginClient.cs
5. Popup/Service/Auth/SsoAuthHeaderProvider.cs
6. Popup/Service/PopupApiService.cs
7. Popup/Service/PopupService.cs
8. Popup/Factories/PopupFactory.cs
9. Popup/Managers/PopupManager.cs
10. Popup/Views/Windows/PopupWindow.xaml.cs
11. Popup/Service/PopupResultBuilder.cs
12. Popup/Service/PopupResultQueue.cs
```

---

## 1. 전체 실행 흐름

```text
Popup.exe 실행
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
팝업 목록 API 호출
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
결과 API 전송
```

SSO 조회와 로그인 API 호출은 별도 시작 단계가 아니라 **첫 `GET /p/api/wpf/popups` 를 보내기 직전**에
`SsoAuthHeaderProvider.GetAuthorizationHeaderAsync()` 안에서 지연 실행된다(위 흐름도의 순서는 같다).

WPF는 **누가 어떤 팝업을 봐야 하는지 판단하지 않는다.**

서버의:

```text
GET /p/api/wpf/popups
```

응답이 이미 최종 표시 대상이므로, WPF는 받은 목록을 화면으로 변환해서 표시하는 역할에 집중한다.

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
Popup.exe
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
Popup.exe 실행 중
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
Popup/Service/Auth/SsoClient.cs
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
Popup/Service/Auth/WpfLoginClient.cs
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
Popup/Service/Auth/SsoAuthHeaderProvider.cs
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
Popup/Service/PopupApiService.cs
```

신규 WPF의 핵심 API는 두 개다.

```text
GET  /p/api/wpf/popups
POST /p/api/wpf/popups/results
```

### 목록 조회

```csharp
GetWpfPopupsAsync()
```

호출 흐름:

```text
PopupApiService
↓
IAuthHeaderProvider.GetAuthorizationHeaderAsync()
↓
Authorization: Bearer ...
↓
GET /p/api/wpf/popups
```

### 결과 전송

```csharp
PostResultsAsync()
```

호출 흐름:

```text
WpfResultRequestDto
↓
Authorization: Bearer ...
↓
POST /p/api/wpf/popups/results
```

---

## 10. 401 발생 시 원 요청 재전송

### 파일

```text
Popup/Service/PopupApiService.cs
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

결과 POST의 경우 기존 `WpfResultRequestDto` 객체를 그대로 다시 직렬화하므로
항목의 `resultId`는 바뀌지 않는다.

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
1. PopupResultQueue.FlushAsync()
2. GET /p/api/wpf/popups
3. pollingIntervalSeconds 적용
4. 같은 실행에서 이미 표시한 popupId 제거
5. PopupService.CreatePopupOptions()
6. PopupManager.ShowRange()
```

팝업이 이미 열려 있으면 주기 조회는 건너뛴다.

---

## 12. 서버 DTO → WPF 화면 설정 변환

### 파일

```text
Popup/Service/PopupService.cs
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
  → ImagePopupView / ImageFillPopupView

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
Title
DisplayMode
DisplayOrder
ShowHeader
ShowCloseButton
ShowFooter
ShowDoNotShowAgain
UseBackgroundOverlay
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
PopupOptions 목록
↓
DisplayOrder 정렬
↓
같은 DisplayOrder 그룹화
↓
SIMULTANEOUS / SEQUENTIAL 결정
↓
PopupWindow 생성
↓
화면 표시
```

### 동시 표시

```text
SIMULTANEOUS
→ 같은 그룹 팝업을 동시에 Show()
```

### 순차 표시

```text
SEQUENTIAL
→ 첫 팝업 Show()
→ Closed
→ 다음 팝업 Show()
```

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
Popup/Service/PopupResultBuilder.cs
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
→ SUBMITTED
```

설문/퀴즈는 서버 응답을 바로 사용자에게 보여줘야 하므로 즉시 전송한다.

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
Popup/Service/PopupResultQueue.cs
```

이 클래스는 로그가 아니라 **업무 결과 재전송 큐**다.

흐름:

```text
결과 생성
↓
pending-results.json 저장
↓
POST /p/api/wpf/popups/results
↓
성공
↓
파일에서 제거
```

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

지만 서버의 목록 응답에:

```text
pollingIntervalSeconds
```

가 있으면 서버 값이 우선한다.

흐름:

```text
Timer Tick
↓
팝업이 열려 있나?
 ├─ Yes → 이번 조회 생략
 └─ No
      ↓
      Flush pending results
      ↓
      GET /p/api/wpf/popups
      ↓
      새 팝업 표시
```

---

## 19. 프로그램 종료

트레이 메뉴의 **종료**를 눌러야 실제로 끝난다.

`MainWindow.OnClosed()`에서:

```text
polling timer 정지
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
→ PopupApiService.GetWpfPopupsAsync()
→ PopupService.CreatePopupOptions()
→ PopupFactory.Create()
```

### 4단계 — 화면 표시만 보기

```text
PopupManager.ShowRange()
→ PopupWindow
→ Text/Image/Video/Survey View
```

### 5단계 — 결과 전송만 보기

```text
PopupManager.AttachResultCollection()
→ PopupResultBuilder
→ PopupResultQueue
→ PopupApiService.PostResultsAsync()
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

Demo Mode에서는 프로그램 시작 시 팝업 선택 화면이 표시된다. TEXT, IMAGE,
VIDEO, SURVEY, QUIZ 버튼으로 원하는 화면을 하나씩 열거나, `전체 팝업 순차 실행`
버튼으로 5종을 순서대로 확인할 수 있다.

실제 API 연동 모드로 돌아가려면 `DemoMode`를 `false`로 변경한다.

### 폐쇄망 Demo 미디어

다음 파일명으로 미디어를 추가하면 빌드 시 내장 리소스로 포함된다.

```text
Popup/Media/demo-image.jpg
Popup/Media/demo-video.mp4
```

실행 시 `%LOCALAPPDATA%/Popup/DemoMedia/<콘텐츠 해시>/`에 내장 미디어를 추출한다.
캐시 파일의 해시가 일치하면 재사용하며, EXE 옆 `Media/demo-image.jpg` 또는
`Media/demo-video.mp4`가 있으면 해당 외부 파일을 우선 사용한다.
