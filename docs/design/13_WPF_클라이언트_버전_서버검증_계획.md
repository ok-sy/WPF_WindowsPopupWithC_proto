# 13. WPF 클라이언트 버전 서버 검증 계획

## 0. 목적

WPF 클라이언트가 오래된 버전으로 서버 API를 계속 호출하여
서버와 DTO/API 계약이 맞지 않거나 필수 수정사항이 적용되지 않은 상태로 동작하는 것을 방지한다.

버전 기준은 서버가 보유하고,
WPF가 주요 API 요청마다 자신의 실행 버전을 전달하며,
서버가 요청을 처리하기 전에 버전을 비교·검증한다.

핵심 흐름:

```text
WPF 실행 버전
↓
API Request에 Client Version 전달
↓
Server
↓
서버가 보유한 최소 지원 버전과 비교
↓
지원 버전이면 정상 처리
지원 종료 버전이면 요청 차단
```

---

## 1. 서버가 관리할 버전 정보

서버는 최소한 다음 정보를 관리한다.

```text
latestVersion
minimumSupportedVersion
```

예:

```text
latestVersion          = 1.4.2
minimumSupportedVersion = 1.3.0
```

의미:

- `1.4.2`: 현재 배포된 최신 WPF 버전
- `1.3.0`: 서버가 정상 동작을 보장하는 최소 WPF 버전

예를 들어 WPF가 `1.3.5`이면 최신은 아니지만 서버 요청은 허용한다.

WPF가 `1.2.9`이면 최소 지원 버전보다 낮으므로 요청을 차단한다.

---

## 2. 요청에 버전 전달

WPF는 주요 API 요청마다 자신의 앱 버전을 전달한다.

권장 방식은 HTTP Header다.

예:

```http
X-Client-Version: 1.4.2
```

Authorization과 함께:

```http
Authorization: Bearer <token>
X-Client-Version: 1.4.2
```

버전은 API DTO의 비즈니스 데이터가 아니므로
각 Request Body마다 중복 필드를 추가하는 것보다 공통 Header가 적합하다.

---

## 3. WPF에서 버전 가져오기

WPF는 실행 중인 프로그램의 Assembly 버전 또는 별도로 지정한 제품 버전을 읽어
공통 API Client가 Header에 넣는다.

개념 예:

```csharp
string clientVersion =
    Assembly
        .GetExecutingAssembly()
        .GetName()
        .Version?
        .ToString()
    ?? "0.0.0";
```

실제 구현에서는 배포 버전 정책에 맞춰
AssemblyVersion / FileVersion / InformationalVersion 중 하나를 기준으로 통일한다.

권장:

```text
InformationalVersion 또는 명시적인 AppVersion
```

이유:

- `1.4.2`처럼 배포 버전을 관리하기 쉽다.
- 빌드용 AssemblyVersion 정책과 분리할 수 있다.

---

## 4. 적용 위치

WPF에서 버전 Header를 붙이는 위치는
각 화면이 아니라 공통 HTTP 요청 계층으로 한다.

현재 구조 기준 후보:

```text
popup-frameWork/Popup/Service/PopupApiService.cs
popup-frameWork/Popup/Service/Auth/WpfLoginClient.cs
```

가능하면 향후 공통 HttpClient 구성으로 합쳐
모든 WPF → Zero Server 요청에 동일한 버전 Header가 붙도록 한다.

목표:

```text
화면 코드
↓
API Service
↓
공통 Client Version Header 자동 추가
↓
Server
```

---

## 5. 서버 검증 시점

서버는 Controller 비즈니스 로직에 들어가기 전에 공통 검증한다.

권장 흐름:

```text
HTTP Request
↓
인증/토큰 확인
↓
Client Version 확인
↓
최소 지원 버전 비교
↓
Controller
↓
Service
```

버전 검증을 각 Controller마다 반복 구현하지 않고
Filter / Interceptor 등 공통 계층에서 수행하는 방향을 권장한다.

---

## 6. 비교 규칙

버전은 문자열 비교를 하면 안 된다.

잘못된 예:

```text
"1.10.0" < "1.9.0"
```

문자열 기준으로 비교하면 잘못된 결과가 나올 수 있다.

반드시 버전 숫자 단위로 비교한다.

예:

```text
1.2.9 < 1.3.0  → 차단
1.3.0 = 1.3.0  → 허용
1.3.5 > 1.3.0  → 허용
1.4.2 > 1.3.0  → 허용
```

.NET의 `Version`, Java의 명시적인 버전 파서 또는
동일한 규칙의 비교 로직을 사용한다.

---

## 7. 서버 응답 정책

### 지원 가능한 버전

예:

```text
clientVersion = 1.3.5
minimumSupportedVersion = 1.3.0
```

정상 처리한다.

최신 버전이 아니더라도 최소 지원 버전 이상이면 API 호출을 허용한다.

### 지원 종료 버전

예:

```text
clientVersion = 1.2.9
minimumSupportedVersion = 1.3.0
```

서버는 요청을 처리하지 않고 명확한 오류를 반환한다.

권장 HTTP 상태:

```text
426 Upgrade Required
```

예시 Response:

```json
{
  "code": "CLIENT_VERSION_NOT_SUPPORTED",
  "message": "WPF 클라이언트 업데이트가 필요합니다.",
  "clientVersion": "1.2.9",
  "minimumSupportedVersion": "1.3.0",
  "latestVersion": "1.4.2"
}
```

---

## 8. WPF 처리

WPF가 버전 차단 응답을 받으면
일반적인 네트워크 오류나 401 토큰 오류와 구분한다.

특히 현재 401 처리처럼 재로그인 후 재요청하면 안 된다.

```text
426
↓
재로그인하지 않음
↓
같은 API 무한 재시도하지 않음
↓
사용자에게 업데이트 필요 안내
```

예:

```text
현재 프로그램 버전은 더 이상 지원되지 않습니다.
최신 버전으로 업데이트 후 다시 실행해주세요.

현재 버전: 1.2.9
최소 지원 버전: 1.3.0
최신 버전: 1.4.2
```

---

## 9. 로그인 API도 버전 검증

WPF에서 서버로 가는 최초 요청부터 버전이 맞지 않으면
이후 기능을 시작하지 않는 것이 안전하다.

따라서 다음 로그인 요청에도 버전을 포함한다.

```text
POST /api/wpf/auth/login
Authorization 이전 단계
X-Client-Version: 1.4.2
```

흐름:

```text
WPF 시작
↓
SSO 사용자 정보 획득
↓
Zero login API
  + X-Client-Version
↓
서버 버전 검증
↓
지원 버전
  → 토큰 발급

지원 종료 버전
  → 426
  → 로그인/팝업 조회 진행 중단
```

즉 오래된 클라이언트가 토큰을 발급받은 뒤 여러 API를 호출하는 것보다
최초 서버 접점에서 빠르게 차단할 수 있다.

동시에 이후 주요 요청에도 Header를 계속 보내
서버 최소 지원 버전이 실행 중 변경되는 경우도 검증 가능하게 한다.

---

## 10. 실행 중 서버 기준 변경

예를 들어 WPF가 오전에 실행된 상태에서:

```text
오전
minimumSupportedVersion = 1.3.0

오후
minimumSupportedVersion = 1.4.0
```

으로 서버 기준이 변경될 수 있다.

WPF가 요청마다 버전을 보내면 다음 API 호출 시점에 바로 검증된다.

```text
실행 중 WPF 1.3.5
↓
다음 Popup 조회/결과 요청
↓
서버 minimum = 1.4.0
↓
426
↓
업데이트 필요 안내
```

따라서 버전 확인을 WPF 시작 시 한 번만 하는 것보다
요청마다 서버가 검증하는 방식이 안전하다.

---

## 11. 결과 전송과 버전 차단의 관계

`pending-results.json`에 보관된 결과를 전송할 때도
현재 WPF 버전을 Header에 포함한다.

만약 서버가 426을 반환하면:

```text
pending 결과 삭제하지 않음
↓
전송 중단
↓
사용자 업데이트 후 새 버전에서 다시 Flush
```

즉 버전 차단 때문에 아직 서버에 저장되지 않은 결과가 유실되면 안 된다.

---

## 12. 버전 정보 저장 위치

프로토타입/초기 운영 단계에서는 서버 설정값으로 관리할 수 있다.

예:

```yaml
custom:
  wpf-client:
    latest-version: 1.4.2
    minimum-supported-version: 1.3.0
```

향후 관리자 화면에서 버전을 변경해야 할 필요가 생기면
DB 테이블로 이동할 수 있다.

현재 요구사항의 핵심은 저장 매체가 아니라:

```text
버전 기준의 주체는 Server
WPF는 자신의 버전을 Request마다 전달
Server가 비교 검증
```

하는 것이다.

---

## 13. 테스트 항목

### T1. 최소 지원 버전과 동일

```text
client = 1.3.0
minimum = 1.3.0
```

기대:

```text
정상 허용
```

### T2. 최소 지원 버전보다 높음

```text
client = 1.3.5
minimum = 1.3.0
```

기대:

```text
정상 허용
```

### T3. 최소 지원 버전보다 낮음

```text
client = 1.2.9
minimum = 1.3.0
```

기대:

```text
426 Upgrade Required
비즈니스 API 미실행
```

### T4. 1.10.0 vs 1.9.0

기대:

```text
숫자 버전 비교
1.10.0 > 1.9.0
```

### T5. 버전 Header 누락

기대:

```text
정책에 따라 요청 차단
구버전 클라이언트가 검증을 우회하지 못함
```

권장:

```text
WPF 전용 API에서는 Header 누락을 미지원 클라이언트로 처리
```

### T6. 로그인 API

기대:

```text
지원 종료 버전이면 토큰 발급 전 426
```

### T7. 실행 중 최소 지원 버전 변경

기대:

```text
다음 Request에서 즉시 426
```

### T8. pending 결과 전송 중 426

기대:

```text
pending 결과 유지
삭제하지 않음
업데이트 후 재전송 가능
```

---

## 14. 완료 기준

- 서버가 latestVersion / minimumSupportedVersion을 관리한다.
- WPF 주요 Request에 Client Version이 항상 포함된다.
- 서버가 요청마다 버전을 비교한다.
- 최소 지원 버전 미만의 WPF 요청은 Controller 비즈니스 처리 전에 차단된다.
- 버전 비교는 문자열 비교가 아닌 숫자 버전 비교를 사용한다.
- 426은 401 재로그인 로직에 들어가지 않는다.
- 결과 전송이 426으로 차단돼도 pending 결과는 삭제되지 않는다.
- 오래된 클라이언트가 실행 중이면 사용자에게 명확한 업데이트 안내를 표시한다.

---

## 15. 현재 상태

```text
문서화: 완료
코드 수정: 미수행
빌드/실행 테스트: 미수행
```

후속 구현 주요 대상:

```text
WPF
- 공통 Client Version 생성/조회
- PopupApiService Header 추가
- WpfLoginClient Header 추가
- 426 처리
- pending 결과 426 시 보존

Server
- latest/minimum 버전 설정
- 공통 Filter 또는 Interceptor
- 숫자 버전 비교
- 426 응답
```
