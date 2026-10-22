# 서버 샘플 — 테이블 없이 백엔드와 통신하는 조회 API (TODO70)

기준일: 2026-10-22 (KST) · 관련: `docs/design/70_DB없는_백엔드통신_Java조회API_TODO.md`, TODO65(직접 DB 조회 샘플, `SERVER_SAMPLE_SINGLE_QUERY_API.md`)

Java 샘플 API가 테이블을 조회하지 않고 담당 백엔드 HTTP API를 호출해 받은 조회 결과를 WPF 단건 조회 계약으로 전달한다.
팝업 결과 제출·저장 API는 범위가 아니다. 백엔드 내부 DB 사용 여부는 백엔드 담당 책임이다. **기본 비활성**이다.

## 1. 흐름과 파일

```text
클라이언트 POST /p/api/sample/relay/wpf/popups  (본문 {}, Authorization·X-Client-Version)
 → PopupRelayController → PopupRelayService
 → BackendPopupClient     POST {base-url}{path}, 본문 {}, forward-headers + 서비스 인증 헤더, timeout, 재시도 없음
 → BackendResponseMapper  readTree 1회 → (ENVELOPE면 data 꺼내기) → 계약 검증
 → 클라이언트 {pollingIntervalSeconds, popup}
```

위치: web/api `server/web/api/popup/sample/relay/` — `RelaySampleConfig`(조건부·설정 바인딩), `RelayBackendProperties`, `BackendPopupClient`, `BackendResponseMapper`, `PopupRelayService`, `PopupRelayController`, `RelayExceptionHandler`(이 컨트롤러 한정), `BackendCallException`.
이 패키지는 DataSource·MyBatis를 쓰지 않는다(Spring `RestClient` + JDK HttpClient, 추가 의존성 없음).

테스트 소스 `web/api/src/test/java/server/web/api/popup/sample/relay/`: `MockBackendServer`(고정 응답 mock, JDK HttpServer), `RelaySampleBootConfig`(DB 없는 최소 부트 구성), `PopupRelaySampleDevServer`(mock + 중계를 함께 띄우는 main), 테스트 2종. mock 응답 파일: `web/api/src/test/resources/sample/relay/ok.json`·`survey.json`.

## 2. 설정 (70-3)

```yaml
popup:
  sample:
    relay:
      enabled: true                                              # 기본 false
      base-url: ${POPUP_SAMPLE_RELAY_BASE_URL:http://127.0.0.1:18090}   # [교체] 실제 개발/검증계 백엔드
      path: /api/wpf/popups                                      # [교체] 실제 경로(쿼리 포함 가능)
      connect-timeout: 3s
      read-timeout: 5s
      api-key-header: X-Api-Key                                  # 서비스 간 인증이 필요할 때만(비우면 안 보냄)
      api-key: ${POPUP_SAMPLE_RELAY_API_KEY:}                    # 비밀값은 환경 변수로 주입, 소스·설정 파일에 적지 않음
      forward-headers: [Authorization, X-Client-Version]         # 이 목록 외 클라이언트 헤더는 넘기지 않음
      response-shape: WPF                                        # WPF(같은 구조, 변환 없음) | ENVELOPE({resultCode, data} 예시)
```

로그에는 경로·상태·소요 시간·실패 분류만 남기고 토큰·API 키·응답 본문은 남기지 않는다.

## 3. 실행

DB 없이(로컬 확인): IDE에서 `PopupRelaySampleDevServer.main` 실행 → mock 백엔드 `127.0.0.1:18090` + 중계 `127.0.0.1:8090`. (같은 `RelaySampleBootConfig`로 SpringBootTest 기동은 확인했고, 이 main 자체의 IDE 실행은 미확인)

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8090/p/api/sample/relay/wpf/popups' -ContentType 'application/json' -Body '{}' `
  -Headers @{ Authorization = 'Bearer <token>'; 'X-Client-Version' = '1.4.2' }
```

```bash
curl -X POST http://127.0.0.1:8090/p/api/sample/relay/wpf/popups -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' -H 'X-Client-Version: 1.4.2' -d '{}'
```

mock 시나리오는 `-Dpopup.sample.relay.path=/api/wpf/popups?scenario=<이름>`으로 고른다: `ok`·`survey`·`empty`·`envelope`·`e400`·`e401`·`e403`·`e404`·`e426`·`e500`·`slow`(3초)·`badjson`·`notobject`·`nopolling`.
실제 백엔드로 바꿀 때는 `-Dmock.enabled=false -Dpopup.sample.relay.base-url=<주소>`.
전체 서버(app)에 넣어 실행하면 `enabled: true`와 위 설정을 추가한다. 이때 서버 자체의 DB·인증 설정은 그대로 필요하다.

## 4. 응답·오류 (70-6)

| 백엔드 결과 | 중계 응답 | `X-Sample-Upstream-Error` |
|---|---|---|
| 200 정상 | 200, 백엔드 JSON 그대로(WPF 구조) | 없음 |
| 200 `popup:null` | 200 `{"pollingIntervalSeconds":…, "popup":null}` (데이터 없음 = 정상) | 없음 |
| 400 / 401 / 403 | 같은 상태. 본문이 WPF 오류면 code·message 유지, 아니면 WPF_BAD_REQUEST / WPF_UNAUTHORIZED / WPF_USER_INACTIVE | HTTP_4XX |
| 426 | 426, 본문 그대로(CLIENT_VERSION_NOT_SUPPORTED·버전 값, 설계 13) | HTTP_4XX |
| 그 밖의 4xx, 5xx | 500 `WPF_INTERNAL`(백엔드 메시지 비노출) | HTTP_4XX / HTTP_5XX |
| 연결 실패 / 응답 timeout | 500 `WPF_INTERNAL` | CONNECT / TIMEOUT |
| JSON 아님 / 계약 불일치(객체 아님·pollingIntervalSeconds 누락·popup 키 누락·popupId 없음) | 500 `WPF_INTERNAL` | INVALID_JSON / INVALID_RESPONSE |

오류 본문은 기존 WPF 계약 `{code, message, timestamp}`다. 통신 실패를 `popup:null` 정상 응답으로 덮지 않는다.
`X-Sample-Upstream-Error`는 샘플 진단용이며 WPF 클라이언트는 읽지 않는다([교체] 운영 연계 시 유지 여부 결정). 자동 재시도는 하지 않는다(조회가 전달 건 생성 같은 부작용을 가질 수 있음).

## 5. 매핑과 책임 범위 (70-4·5·8)

- 백엔드가 WPF 조회 계약과 같은 구조면 검증만 하고 변환하지 않는다. content·questions 중첩, false·0·null을 그대로 보존하며 객체를 문자열로 다시 감싸지 않는다.
- 구조가 다르면 차이를 `BackendResponseMapper.unwrapEnvelope`(또는 새 매핑 함수) 한 곳에만 둔다. ENVELOPE는 `{resultCode, data}` 예시다.
- 응답은 **WPF 클라이언트 조회 모델**이다. 관리자 웹 편집 모델(`AdminPopupDetail`, TODO69 프론트 샘플)과 혼동하지 않는다.
- deliveryId·popupId 등 백엔드가 준 ID를 바꾸거나 새로 만들지 않는다. 전달 건 생성·대상/일정/완료/숨김·결과 중복 처리는 백엔드 책임이며 이 샘플에 복제하지 않는다.
- 입출력 매핑(70-1): 요청 `POST {path}` 본문 `{}` + `Authorization`·`X-Client-Version`(+선택 서비스 인증 헤더) → 응답 `{pollingIntervalSeconds, popup}`. 실제 백엔드 URL·Method·envelope는 미확정이라 예시값이며 위 [교체] 항목만 바꾼다.

## 5-1. 클래스별 선언 이유

| 클래스 | 선언 이유 |
|---|---|
| `RelaySampleConfig` | 기본 비활성. `enabled=true`일 때만 설정 바인딩·Bean 등록해 기존 서버 기동에 영향이 없게 한다 |
| `RelayBackendProperties` | URL·경로·timeout·인증 헤더·전달 헤더·응답 구조를 코드가 아니라 설정으로 바꾸게 한다(비밀값은 환경 변수) |
| `BackendPopupClient` | HTTP 호출·timeout·실패 분류만 담당. 재시도하지 않는 이유(조회가 전달 건을 만들 수 있음)를 한 곳에 고정한다 |
| `BackendResponseMapper` | 백엔드 응답 구조 차이를 이 클래스(특히 `unwrapEnvelope`)에만 모아, 백엔드 계약이 바뀌어도 다른 클래스를 고치지 않게 한다 |
| `PopupRelayService`·`PopupRelayController` | 호출 1회 → 매핑만 하는 얇은 계층. 기존 WPF API와 겹치지 않는 별도 경로 |
| `RelayExceptionHandler` | 이 컨트롤러 한정 오류 처리. 통신 실패를 정상 `popup:null`로 덮지 않고 기존 WPF 오류 계약으로 응답한다 |
| (테스트) `MockBackendServer`·`RelaySampleBootConfig`·`PopupRelaySampleDevServer` | 실제 백엔드·DB 없이 HTTP 실통신으로 확인하기 위한 도구. 운영 코드에 포함되지 않는다 |

## 5-2. 옵션 추가·삭제 예시

전달 헤더 추가 — 백엔드가 `X-Request-Id`를 요구하는 경우(코드 변경 없음):

```yaml
popup.sample.relay.forward-headers: [Authorization, X-Client-Version, X-Request-Id]
```

서비스 인증 헤더 빼기: `api-key-header`를 비우면 보내지 않는다.

백엔드 응답 구조가 다른 경우 — 예: `{ "result": "OK", "payload": { ... } }`:

```java
// BackendResponseMapper: 새 구조를 꺼내는 함수 추가 후 toWpfResponse에서 선택
JsonNode unwrapPayload(JsonNode root) {
    if (!root.isObject() || !root.path("payload").isObject()) throw invalid("payload 객체가 없습니다.");
    return root.get("payload");
}
// RelayBackendProperties.ResponseShape에 PAYLOAD 추가 → response-shape: PAYLOAD
```

요청 본문 바꾸기: `BackendPopupClient.fetch`의 `.body("{}")`([교체 지점])를 백엔드 계약 본문으로 바꾼다. 요청 Method가 GET이면 `restClient.post()` → `restClient.get()`으로 바꾸고 `.body(...)`를 지운다.

오류 매핑 바꾸기: `RelayExceptionHandler.PASS_THROUGH`에 상태를 더하거나 빼서 그대로 전달할 상태를 정한다(그 밖은 500 WPF_INTERNAL). 진단 헤더 `X-Sample-Upstream-Error`가 필요 없으면 `error(...)`에서 헤더 추가 줄을 지운다.

## 5-3. 실제 연동할 때 바뀌는 부분

| 항목 | 샘플 | 실제 연동 |
|---|---|---|
| 백엔드 주소·경로 | mock `127.0.0.1:18090/api/wpf/popups` | 개발/검증계 실제 주소(`base-url`·`path`) |
| 인증 | 클라이언트 `Authorization` 그대로 전달 + 선택 API 키 | 백엔드가 요구하는 방식(토큰 교환·서비스 계정 등)으로 `BackendPopupClient` 헤더 구성 |
| 요청 본문·Method | `POST {}` | 백엔드 계약 |
| 응답 구조 | WPF 구조 그대로 | 다르면 `BackendResponseMapper`에 매핑 함수 추가 |
| 기동 | DB 없는 최소 부트 구성(테스트) | 전체 서버에 `enabled: true` 설정(서버 자체 DB·인증 설정 필요) |
| 진단 헤더 | 응답에 포함 | 유지 여부 결정 |

## 6. 검증 상태

- web/api `PopupRelayIntegrationTest` 9건: 최소 부트 구성으로 DataSource·MyBatis 없이 기동, mock 백엔드 실제 HTTP 호출로 Method·경로·본문·전달 헤더·서비스 인증 헤더·미전달 헤더·1회 호출 확인, 정상 JSON 동일·중첩/false/0/null 보존·ID 보존, SURVEY 문항, 없음, 401/403/400 전달, 426 본문 유지, 5xx·404·잘못된 JSON·객체 아님·pollingIntervalSeconds 누락·timeout의 500 및 분류 헤더·재시도 없음, 잘못된 요청 본문 400.
- `BackendUnitTest` 3건: 닫힌 포트 연결 실패 분류, ENVELOPE 매핑, popupId 누락·잘못된 폴링 값 거절.
- WPF `scripts/PopupWindowTests`: mock 응답 `ok.json`·`survey.json`이 실제 WPF 조회 DTO(`WpfNextPopupResponseDto`)로 역직렬화되고 PopupFactory가 TEXT/SURVEY를 생성, false·0 보존.
- 미실행: 실제 개발/검증계 백엔드 연계(주소·계약 미확정), 실제 WPF 클라이언트를 중계 API에 연결한 실화면. mock 검증만으로 실연계 완료로 보지 않는다.
