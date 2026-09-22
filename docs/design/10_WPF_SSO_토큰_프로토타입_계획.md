# 10. WPF SSO·토큰 프로토타입 구현 계획

## 0. 목적

WPF 클라이언트가 브라우저 로그인 화면 없이 Windows 로그인 사용자의 사내 SSO 정보를 얻고,
Zero 서버에서 WPF용 토큰(프로토타입에서는 opaque hash)을 발급받아 메모리에만 보관한 뒤
`/p/api/wpf/**` 호출에 `Authorization: Bearer {token}`으로 사용하는 흐름을 검증한다.

이번 단계는 **실제 SSO 진위 검증/운영 토큰 구현이 아니라 통신 형태와 재인증·재시도 동작을 검증하는 프로토타입**이다.

## 1. 이미 확인된 사실

```text
curl.exe -v --negotiate -u : "SSO_URL"
```

위 호출이 정상 동작하므로 WPF에서는 브라우저 쿠키/WebView2 캐시 대신 Windows 통합 인증(Negotiate)을 사용한다.

C#에서는 다음 형태로 동일한 인증 흐름을 재현한다.

```csharp
var handler = new HttpClientHandler
{
    UseDefaultCredentials = true
};
```

현재 WPF에는 이미 `IAuthHeaderProvider` 확장 지점이 있다.

또한 현재 `PopupApiService.SendWithAuthAsync()`는 다음 구조를 이미 가지고 있다.

```text
API 호출
→ Authorization 헤더 부착
→ 401 발생
→ IAuthHeaderProvider.OnUnauthorizedAsync()
→ 동일 method / url / body로 1회 재전송
```

따라서 새 인증 기능은 기존 `PopupApiService`를 크게 수정하지 않고
`SsoAuthHeaderProvider`를 추가하는 방향으로 구현한다.

토큰은 파일·Registry·appsettings에 저장하지 않고 메모리에만 보관한다.

## 2. 이번 프로토타입 범위

### 포함

1. WPF → 사내 SSO GET(Negotiate)
2. SSO XML에서 사용자 식별값 추출
   - `MAIN_USER_ID`
   - `MAIN_USER_CLASSI_CODE`
3. WPF → Zero 서버 로그인 API 호출
4. Zero 서버 → 10분 유효 opaque hash 토큰 발급
5. WPF 메모리에 토큰/만료정보 보관
6. 이후 WPF API 호출에 Bearer 토큰 부착
7. 1시간마다 로그인 API를 다시 호출해 토큰 갱신
8. 그 사이 토큰이 만료되어 API가 401을 반환하면 즉시 비동기 재로그인
9. 재로그인 성공 후 **401이 발생했던 기존 요청을 동일 body/resultId로 1회 재전송**
10. 다중 요청이 동시에 401을 받아도 실제 재로그인은 한 번만 수행하도록 동시성 제어

### 제외

- 실제 SSO 서버 응답의 암호학적 검증
- 운영용 JWT 서명/검증
- Refresh Token
- 인증용 DB 테이블
- 브라우저/WebView2 로그인
- 로그인 UI
- 팝업 DISPLAYED/CLOSED 이벤트 로그 API
- 영상 진행률 실시간 로그 API
- 인증 이력 DB 저장

> 프로토타입에서는 SSO가 돌려준 사용자 값을 로그인 API가 신뢰한다.
> 단, 서버가 발급한 hash 토큰의 존재 여부와 10분 만료시간은 검사해야
> `401 → 재로그인 → 원 요청 재시도` 시나리오를 검증할 수 있다.

## 3. 전체 흐름

```text
Windows 로그인
    ↓
WPF 시작
    ↓
SsoClient
  GET SSO_URL
  UseDefaultCredentials = true
    ↓
SSO XML
  MAIN_USER_ID
  MAIN_USER_CLASSI_CODE
    ↓
POST /p/api/wpf/auth/login
    ↓
Zero 서버 (Prototype)
  - SSO 진위 검증 안 함
  - opaque hash 발급
  - expiresAt = 발급시각 + 10분
    ↓
WPF SsoAuthHeaderProvider
  - accessToken 메모리 보관
  - expiresAt 메모리 보관
    ↓
Authorization: Bearer {hash}
    ↓
GET  /p/api/wpf/popups
POST /p/api/wpf/popups/results
```

## 4. 토큰 갱신 정책

### 4.1 시작 시

```text
SSO GET
→ login API
→ token 메모리 저장
→ popup API 호출
```

### 4.2 평상시 1시간 주기

**확정(2026-09-21): SSO 조회는 WPF 프로세스 시작 후 최초 1회만 수행한다.**

최초 SSO GET에서 얻은 `MAIN_USER_ID` / `MAIN_USER_CLASSI_CODE`는
`SsoAuthHeaderProvider`의 메모리(`_lastUser`)에 보관한다.

이후 1시간 정기 갱신에서는 사내 SSO를 다시 호출하지 않고,
메모리에 보관한 사용자 정보로 Zero 로그인 API만 호출해 새 토큰을 발급받는다.

```text
1시간 Timer
→ 메모리 _lastUser 사용
→ login API만 호출
→ 새 token으로 메모리 교체
```

프로세스가 종료되면 `_lastUser`도 함께 사라지며, 다음 실행에서는 다시 SSO GET 1회를 수행한다.

### 4.3 10분 토큰 만료와의 관계

프로토타입 토큰은 서버 기준 10분 후 만료된다.

```text
기존 API 요청
→ 401
→ IAuthHeaderProvider.OnUnauthorizedAsync()
→ 메모리 _lastUser 사용
→ login API만 호출
→ 새 token 메모리 저장
→ 기존 API 요청 동일 body로 1회 재전송
```

- 1시간 주기 = 정기 재로그인 테스트
- 10분 만료 = 401 기반 즉시 재로그인 테스트

## 5. WPF 구현 계획

### 5.1 신규: `popup-frameWork/Popup/Services/Auth/SsoClient.cs`

역할:
- 사내 SSO URL 호출
- Windows 통합 인증 사용
- XML 파싱

핵심 형태:

```csharp
var handler = new HttpClientHandler
{
    UseDefaultCredentials = true
};

using var client = new HttpClient(handler);
string xml = await client.GetStringAsync(ssoUrl);
```

반환 모델:
- `LogonId`
- `ClassCode`

SSO XML 태그:
- `MAIN_USER_ID`
- `MAIN_USER_CLASSI_CODE`

### 5.2 신규: `popup-frameWork/Popup/Services/Auth/WpfLoginClient.cs`

역할:
- SSO에서 얻은 값을 Zero 서버 로그인 API에 전달
- hash token + expiresAt 수신

요청 예:

```json
{
  "logonId": "E1001",
  "classCode": "...",
  "linkYn": "N"
}
```

응답 예:

```json
{
  "accessToken": "6f0f...opaque-hash...",
  "tokenType": "Bearer",
  "expiresAt": "2026-09-21T18:10:00+09:00"
}
```

### 5.3 신규: `popup-frameWork/Popup/Services/Auth/SsoAuthHeaderProvider.cs`

기존 `IAuthHeaderProvider` 구현체로 추가한다.

메모리 상태:
- 현재 token
- expiresAt
- 마지막 SSO 사용자 정보
- `SemaphoreSlim` 재로그인 lock

책임:
- `GetAuthorizationHeaderAsync()` → `Bearer {token}`
- 최초 토큰이 없으면 SSO GET 1회 → 사용자 정보(`_lastUser`) 메모리 보관 → 로그인 API
- `OnUnauthorizedAsync()` → `_lastUser`로 로그인 API만 다시 호출
- 1시간 정기 갱신도 `_lastUser`로 로그인 API만 호출
- 동시에 여러 요청이 401이어도 login API 중복 호출 방지
- 파일/Registry/appsettings에 토큰·사용자 정보를 저장하지 않음

### 5.4 1시간 재로그인

권장:

```csharp
PeriodicTimer(TimeSpan.FromHours(1))
```

앱 종료 `CancellationToken`과 연결한다.

정기 재로그인 실패 시:
- 현재 토큰을 즉시 삭제하지 않음
- 다음 실제 API 요청에서 401이 오면 즉시 재인증
- UI 로그인 화면은 띄우지 않음

### 5.5 수정: `popup-frameWork/Popup/MainWindow.xaml.cs`

현재:

```text
Auth.Mode = None | Static
```

추가:

```text
Auth.Mode = SsoPrototype
```

예:

```csharp
IAuthHeaderProvider authHeaderProvider =
    settings.AuthMode.Trim().ToUpperInvariant() switch
    {
        "SSOPROTOTYPE" => new SsoAuthHeaderProvider(...),
        "STATIC" => new StaticAuthHeaderProvider(settings.AuthStaticHeader),
        _ => new NoAuthHeaderProvider()
    };
```

### 5.6 `PopupApiService.cs`

기존 구조를 최대한 유지한다.

이미 존재하는 흐름:

```text
요청
→ Authorization 부착
→ 401
→ OnUnauthorizedAsync()
→ 같은 method/url/body 1회 재시도
```

`POST /p/api/wpf/popups/results`가 401을 받은 경우 기존 `WpfResultRequestDto` 객체를 그대로 사용해 새 토큰으로 재전송한다.

`resultId`도 동일하게 유지한다.

## 6. 서버 프로토타입 구현 계획

### 6.1 신규 API

```text
POST /p/api/wpf/auth/login
```

### 6.2 로그인 API 동작

입력:
- logonId
- classCode
- linkYn

프로토타입에서는:
- 사내 SSO에 다시 확인하지 않음
- 사용자 진위 검증하지 않음
- 필수 값 존재 여부만 검사

토큰 발급:
- `RandomNumberGenerator` 기반 난수 또는 SHA-256 형태 opaque hash
- 서버 메모리 token store에 저장
- TTL = 10분

서버 메모리:

```text
token
→ logonId
→ classCode
→ expiresAt
```

서버 재시작 시 token store가 사라져도 된다.

### 6.3 WPF API 토큰 검사

대상:

```text
GET  /p/api/wpf/popups
POST /p/api/wpf/popups/results
```

검사:
1. `Authorization: Bearer ...` 존재
2. 서버 메모리 token store에 존재
3. `expiresAt > now`

실패:
- `401 Unauthorized`

성공:
- token에 연결된 logonId를 인증 사용자 사번으로 사용

## 7. 실제 SSO 검증과의 차이

프로토타입:

```text
WPF SSO GET
→ user 정보 획득
→ login API가 그대로 신뢰
→ hash 발급
```

운영 전환:

```text
WPF SSO/인증 증빙
→ 운영 인증 서버 검증
→ 정식 token 발급
```

클라이언트에서는 `IAuthHeaderProvider` 계약을 그대로 유지한다.

## 8. 로깅 기능 제외 범위

사용하지 않을 기존 구 기능:
- `RecordPopupEventAsync`
- `SaveVideoProgressAsync`
- DISPLAYED/CLOSED 이벤트 전송
- 영상 진행률 주기 전송

신규 WPF 흐름:

```text
GET  /p/api/wpf/popups
POST /p/api/wpf/popups/results
```

### `PopupResultQueue`는 유지

`PopupResultQueue`는 로그가 아니라 네트워크 실패 시 업무 결과 유실을 막는 재전송 큐다.

```text
팝업 결과 생성
→ pending-results.json 보관
→ 서버 전송
→ 실패 시 유지
→ 동일 resultId로 재전송
```

따라서 토큰 만료 후 기존 응답값을 다시 보내기 위해 유지한다.

`Debug.WriteLine`은 DB 로그와 별개의 개발 진단 출력이므로 프로토타입에서는 유지 가능하다.

## 9. 설정 예시

### WPF `appsettings.json`

```json
{
  "PopupApi": {
    "DemoMode": false,
    "BaseUrl": "http://localhost:8080/zero-rule-server/p",
    "AutoLoadOnStartup": true,
    "PollingIntervalSeconds": 1800,
    "Auth": {
      "Mode": "SsoPrototype",
      "SsoUrl": "https://SSO_URL/encriptloginprocess.aspx",
      "LoginPath": "/api/wpf/auth/login",
      "PeriodicLoginMinutes": 60
    },
    "DevUserId": ""
  }
}
```

### 서버 설정

```yaml
custom:
  wpf-auth-prototype:
    enabled: true
    token-ttl-minutes: 10
```

운영 환경에서는 기본값 `enabled=false`.

## 10. 테스트 시나리오

### T1. 최초 실행
- WPF 실행
- SSO GET 200
- XML 사용자 정보 파싱
- login API 200
- token 메모리 저장
- popup GET 성공

### T2. 10분 만료
- token 발급
- 10분 경과
- popup GET 또는 result POST
- 서버 401
- WPF async 재로그인
- 새 token 수신
- 원 요청 1회 자동 재전송
- 성공

### T3. 결과 POST 재시도
- 동일 resultId 결과 POST
- 401
- 재로그인
- 동일 body/resultId 재전송
- 중복 신규 결과 생성 없음

### T4. 1시간 주기 로그인
- 앱 계속 실행
- 1시간 Timer
- SSO 재호출 없음
- 메모리 `_lastUser`로 login API만 호출
- 메모리 token 교체

### T5. 동시 401
- 여러 요청이 동시에 401
- `SemaphoreSlim`
- SSO 재호출 없이 login API 1회
- 나머지 요청은 갱신된 token 사용

### T6. 앱 재시작
- 기존 token 파일 없음
- SSO부터 다시 수행
- 새 token 발급

### T7. SSO 실패
- SSO 401 / 네트워크 오류 / XML 필드 없음
- 로그인 UI 표시 안 함
- 다음 polling 또는 수동 조회에서 재시도

## 11. 구현 전 확인할 항목

1. 로그인 API 경로
   - 현재 계획: `POST /p/api/wpf/auth/login`

2. 로그인 API 요청 필드
   - `logonId`
   - `classCode`
   - `linkYn = "N"`

3. SSO XML 태그
   - `MAIN_USER_ID`
   - `MAIN_USER_CLASSI_CODE`

4. 로깅 제외 범위
   - 제외: DB 이벤트 로그, DISPLAYED/CLOSED, video-progress, 인증 이력 DB
   - 유지: PopupResultQueue, 개발용 Debug.WriteLine

5. 1시간 주기 의미
   - 1시간마다 선제 login API 호출
   - 최초 SSO GET 이후에는 메모리 사용자 정보로 login API만 호출
   - 그 전에 token 만료 상태에서 API 호출 시 401 기반 즉시 재로그인(SSO 재호출 없음)

## 12. 구현 순서

```text
1. 서버 mock login API 추가
2. 서버 in-memory token store 추가
3. 서버 token TTL 10분 구현
4. 서버 WPF API token 검사 연결
5. WPF SsoClient 구현
6. WPF WpfLoginClient 구현
7. WPF SsoAuthHeaderProvider 구현
8. MainWindow SsoPrototype mode 연결
9. 1시간 PeriodicTimer 연결
10. 최초 실행 E2E
11. 10분 만료 → 401 → 재로그인 → 원 요청 재전송 E2E
12. 결과 queue/resultId 보존 확인
13. 구 이벤트/영상 진행 API가 호출되지 않는지 확인
14. README / docs / CHANGELOG 반영
```

## 13. 완료 기준

- 브라우저 또는 로그인 페이지가 뜨지 않는다.
- Windows 로그인 상태만으로 SSO GET이 성공한다.
- WPF가 token을 파일에 저장하지 않는다.
- 서버는 프로토타입 token을 10분 뒤 만료시킨다.
- 만료 후 API 호출 시 사용자 조작 없이 자동 재로그인한다.
- 401을 발생시킨 원 요청이 새 token으로 자동 1회 재전송된다.
- `POST /p/api/wpf/popups/results`의 기존 body/resultId가 유지된다.
- 1시간 정기 로그인도 별도로 동작한다.
- 팝업 이벤트/영상 진행률 로그 API는 신규 흐름에서 호출하지 않는다.
- 기존 팝업 조회/결과 큐 구조는 유지한다.


## 14. 2026-09-21 검토 후 확정사항

현재 구현 검토 후 다음 정책을 확정했다.

| 항목 | 확정 내용 | 처리 |
|---|---|---|
| 실제 SSO 응답 인코딩(`ks_c_5601-1987`) | 폐쇄망에서 실제 사내 SSO에 연결한 뒤 확인한다. 현재 모의 SSO 기준으로 선제 수정하지 않는다. | **폐쇄망 실연동 시 확인** |
| SSO 호출 주기 | **WPF 프로세스 시작 후 최초 1회만 SSO GET**. 이후 토큰 만료(401) 및 1시간 정기 갱신은 메모리에 저장한 `logonId/classCode`로 로그인 API만 호출한다. | **확정 — 구현 수정 필요** |
| `DevUserId` / `X-Dev-User-Id` | SSO 프로토타입과 함께 남길지 제거할지는 별도 의사결정을 받는다. 현재 PrototypeTokenWpfUserResolver가 Bearer를 우선 사용하므로 기능 충돌은 없다. | **의사결정 대기** |
| 로깅 제외 범위 | DB 이벤트 로그, DISPLAYED/CLOSED 이벤트, video-progress 등 업무성 로그 호출은 신규 흐름에서 제외한다. `Debug.WriteLine`/서버 개발 로그와 `PopupResultQueue`는 유지한다. | **확정** |

### 14.1 수정 대상 — SSO 최초 1회 정책

현재 `SsoAuthHeaderProvider.LoginAsync()`가 재로그인 때마다 아래 두 단계를 모두 수행한다.

```text
SsoClient.GetUserAsync()
→ WpfLoginClient.LoginAsync()
```

이를 다음처럼 변경한다.

```text
최초 로그인
  _lastUser == null
  → SsoClient.GetUserAsync()
  → _lastUser 메모리 저장
  → WpfLoginClient.LoginAsync(_lastUser)

401 재로그인
  _lastUser != null
  → WpfLoginClient.LoginAsync(_lastUser)
  → SSO 재호출 없음

1시간 정기 재로그인
  _lastUser != null
  → WpfLoginClient.LoginAsync(_lastUser)
  → SSO 재호출 없음
```

개념 코드:

```csharp
SsoUserInfo user;

if (_lastUser == null)
{
    user = await _ssoClient.GetUserAsync(linked.Token);
    _lastUser = user;
}
else
{
    user = _lastUser;
}

WpfLoginResponseDto login =
    await _loginClient.LoginAsync(user, linked.Token);
```

단, 관리 화면의 **SSO 로그인 테스트 버튼**은 실제 SSO 통신 확인 용도이므로
현재처럼 버튼을 누를 때마다 SSO GET을 강제로 수행하는 동작을 유지해도 된다.

### 14.2 폐쇄망 실연동 확인 항목

실제 사내 SSO에 연결할 때 다음을 확인한다.

1. `HttpClientHandler.UseDefaultCredentials = true`로 실제 Negotiate가 성공하는지
2. 응답 `Content-Type charset`과 XML 선언의 인코딩이 실제로 `ks_c_5601-1987`/CP949인지
3. `ReadAsStringAsync()`로 한글이 정상 해석되는지
4. 깨질 경우에만 `CodePagesEncodingProvider` + CP949(949) 바이트 디코딩을 추가
5. `MAIN_USER_ID`, `MAIN_USER_CLASSI_CODE` 값이 실제 응답에서 정상 추출되는지
