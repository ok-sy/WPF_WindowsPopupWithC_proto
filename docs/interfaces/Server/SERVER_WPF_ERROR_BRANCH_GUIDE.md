# WPF API 장애별 분기 처리 정의서 (백엔드 전달용)

기준일: 2026-11-17 (KST) · 대상: WPF 팝업 Agent가 호출하는 로그인·조회·결과 API를 구현하는 백엔드
Excel 판: `docs/interfaces/Server/SERVER_ERROR_BRANCH_v1.2.xlsx` (이 문서에서 생성, `python scripts/export-server-error-branch-xlsx.py`)
관련 계약: [WPF 인터페이스 계약](../WPF/POPUP_INTERFACE_SPEC.md) §10.10 장애 결과, §11 결과 응답, §12.1 재전송, §13 오류 응답

## 1. 한 줄 원칙

| 구분 | 언제 | 응답 | WPF가 보는 것 |
|---|---|---|---|
| HTTP 오류(필수 3가지) | 인증 실패, 클라이언트 버전 미지원, 결과 API 본문 해석 불가 | 각각 HTTP 401, 426, 400(상태 코드만 필수, 본문 선택) | HTTP 상태 코드 |
| HTTP 200 + status·code를 만들어 응답 | 결과 API에서 요청은 읽었고, 그 결과 1건의 처리 판정(저장·중복·거절·일시 장애·내부 오류)을 알려야 할 때 | HTTP 200 + `{resultId, status, nextStatus?, code?, message?}` | `status`(삭제할지 보관·재전송할지) |
| 오류가 아님 | 조회했지만 표시할 팝업이 없을 때 | HTTP 200 + `{pollingIntervalSeconds, popup: null}` | `popup`이 null이면 조회 간격 대기 |

- 위 필수 3가지 외의 HTTP 오류(403·404·405·500·502·503·504, 연결 실패·타임아웃)는 기존 예외 처리기가 내는 상태 그대로 와도 WPF 동작에 문제가 없다. 본문 형식·code도 맞출 필요가 없다(WPF는 HTTP 오류 본문을 판정에 쓰지 않음).
- 결과 API에서 status를 쓰는 이유: WPF는 결과를 메모리 큐에 보관했다가 "이 결과의 처리가 끝났는지"로 지울지 정한다. HTTP 오류는 "다시 보내 봐야 하는 실패"로 보고 보관·재전송하므로, 다시 보내도 같은 업무 오류를 HTTP 오류로 주면 같은 결과를 계속 다시 보낸다. 반대로 일시 장애를 REJECTED로 주면 결과를 지워 데이터가 사라진다.
- WPF는 `message` 문구로 판단하지 않는다. `code`는 로그·진단용이며 큐 처리는 HTTP 상태와 `status`로만 한다.

## 2. 판정 순서 (요청 1건)

| 순서 | 단계 | 실패 상황 | 응답 | 구현 위치(저장소) |
|---|---|---|---|---|
| 1 | 클라이언트 버전 | `X-Client-Version` 없음·해석 불가·최소 버전 미만 | HTTP 426 | `WpfClientVersionInterceptor` |
| 2 | 인증 | 토큰 없음·만료, 사번을 얻지 못함 | HTTP 401 | 통합 토큰 필터(타 팀) 또는 `WpfUserResolver` → `WpfApiExceptionHandler` |
| 3 | 본문 해석(결과 API) | JSON 구문 오류, 날짜·숫자 형식 오류, 알 수 없는 enum | HTTP 400 | `WpfApiExceptionHandler` |
| 4 | 결과 형식 검사(결과 API) | resultId·deliveryId·popupId 누락·길이, 알 수 없는 resultType, hideDays 범위, score 음수, answers·optionIds null 요소, video 형식, resultDesc 1,000 Byte 초과 | HTTP 200 `REJECTED` `R4000(INVALID_RESULT)` | `WpfPopupController.process` · `WpfResultRequest.validationError` |
| 5 | 업무 검증(결과 API) | 전달 건 불일치·이미 완료·대상 아님·유형 불일치·문항·선택지·영상 검증 실패 | HTTP 200 `REJECTED` + 세부 code | `WpfResultFailures.rejectCode` |
| 6 | 저장(결과 API) | DB 연결·데드락·잠금 대기·타임아웃 등 확인된 일시 장애 | HTTP 200 `RETRYABLE_ERROR` `R5030(RETRYABLE)` | `WpfResultFailures.isTransient` |
| 7 | 저장(결과 API) | 그 밖의 예외(원인 미확정) | HTTP 200 `INTERNAL_ERROR` `R5000(RESULT_INTERNAL)` | `WpfPopupService.processResult` |
| 8 | 저장 후 후보 확인(결과 API) | 저장은 됐으나 다음 후보 수 조회 실패 | HTTP 200 `ACCEPTED`·`DUPLICATE` + `R2001(NEXT_STATUS_UNKNOWN)`, nextStatus 생략 | `WpfPopupService.processResult` |

- 1·2는 모든 WPF API 공통이고 426이 401보다 먼저다(버전 미지원 클라이언트가 재로그인을 반복하지 않도록). 3은 결과 API에서 본문 자체를 읽지 못한 경우만 400이다. 본문은 읽었으나 값이 틀린 경우(4)는 200 REJECTED다.
- 결과 저장·전달 건 종료·재노출 유예·resultId 영수증은 한 트랜잭션이다. 6·7은 롤백된 상태로 응답해 같은 resultId를 다시 받을 수 있어야 한다. 8의 후보 확인은 커밋 뒤에 한다.
- 사용자 비활성(저장소는 403), 조회 처리 오류(저장소는 500) 등 위에 없는 실패는 기존 처리기가 내는 HTTP 오류 그대로 보내면 된다.

## 3. 필수 HTTP 오류

WPF가 HTTP 오류에서 보는 것은 상태 코드뿐이다. 아래 3가지는 반드시 이 상태 코드로 보내야 한다. 본문은 선택이다.

| HTTP | 언제 | 다른 상태로 보내면 생기는 문제 | 본문 | WPF 처리 |
|---|---|---|---|---|
| 401 | 토큰 없음·만료, 사번 확인 실패 (모든 WPF API) | 302 리다이렉트·로그인 HTML(200)·403으로 보내면 재로그인하지 않아 토큰 만료 후 복구되지 않는다 | 선택 | 재로그인 후 원 요청 1회 재시도. 그래도 401이면 조회는 장애 복구 주기, 결과는 보관·재전송 |
| 426 | 클라이언트 버전 미지원·버전 헤더 없음 (모든 WPF API, 인증보다 먼저) | 다른 상태로 보내면 업데이트 안내·중단이 동작하지 않고 구버전이 계속 호출한다 | 선택. 주면 `clientVersion`·`minimumSupportedVersion`·`latestVersion`을 안내 창에 표시(없으면 '-') | 조회·결과 전송·정기 로그인 중단, 결과 큐 유지, 업데이트 안내 후 종료 |
| 400 | 결과 API 본문을 해석하지 못함(JSON 구문·역직렬화 오류) | 500으로 보내면 같은 깨진 본문을 장애 복구 주기로 계속 재전송한다 | 선택 | 그 결과를 종결·삭제하고 다음 결과·조회를 막지 않음 |

- 본문을 줄 때의 형식: `{"code": "E4010", "message": "...", "timestamp": "..."}`. code는 5 Byte(E4000 400 · E4010 401 · E4260 426)를 권장하지만 WPF는 읽지 않는다.
- 위 3가지 외 HTTP 오류는 형식을 맞출 필요가 없다. 다만 오류 본문·message에 SQL·스택·ORA 코드 같은 내부 정보를 넣지 않는다.

### 샘플

### H2. 인증 실패 → HTTP 401

상황: 토큰 없음·만료. message는 인증 방식에 따라 다르다(예시는 개발용 헤더 식별기 문구)

HTTP 401

```json
{
  "code": "E4010",
  "message": "개발 모드: X-Dev-User-Id 헤더가 필요합니다.",
  "timestamp": "2026-11-17T22:21:20+09:00"
}
```

본문 없이 상태 코드 401만 보내도 된다.

### H1. 클라이언트 버전 미지원 → HTTP 426

상황: X-Client-Version: 1.2.9 (최소 지원 1.3.0)

HTTP 426

```json
{
  "code": "E4260",
  "message": "WPF 클라이언트 업데이트가 필요합니다.",
  "clientVersion": "1.2.9",
  "minimumSupportedVersion": "1.3.0",
  "latestVersion": "1.4.2",
  "timestamp": "2026-11-17T22:21:20+09:00"
}
```

본문 없이 상태 코드 426만 보내도 된다(안내 창의 버전 칸이 '-'로 표시).

### H4. 결과 API 본문 해석 불가 → HTTP 400

상황: 결과 API 본문이 깨진 JSON: {"resultId": "r-0001", 

HTTP 400

```json
{
  "code": "E4000",
  "message": "요청 본문을 해석할 수 없습니다.",
  "timestamp": "2026-11-17T22:21:20+09:00"
}
```

본문 없이 상태 코드 400만 보내도 된다.

## 4. 결과 응답(HTTP 200) status 정의

| status | 언제 만드는가 | code | nextStatus | 트랜잭션 | WPF 처리 |
|---|---|---|---|---|---|
| ACCEPTED | 처음 정상 저장 | 없음(후보 확인 실패면 R2001(NEXT_STATUS_UNKNOWN)) | AVAILABLE·EMPTY(확인 실패면 생략) | 커밋 | 큐에서 삭제. AVAILABLE·생략이면 즉시 조회, EMPTY면 조회 간격 대기 |
| DUPLICATE | 같은 resultId를 이미 처리함(본문이 달라도 비교하지 않음) | 없음(후보 확인 실패면 R2001(NEXT_STATUS_UNKNOWN)) | ACCEPTED와 같음 | 변경 없음 | ACCEPTED와 같음 |
| REJECTED | 다시 보내도 같은 결과가 나오는 형식·업무 오류 | R4000(INVALID_RESULT) 등 세부 code(§5) | 없음 | 롤백(저장 없음) | 사유를 로그로 남기고 삭제. 다음 조회를 막지 않음 |
| RETRYABLE_ERROR | 확인된 일시 장애(예외 형식으로 판정) | R5030(RETRYABLE) | 없음 | 롤백 | 보관, 같은 resultId로 재전송. 종결 전 다음 조회 보류 |
| INTERNAL_ERROR | 그 밖의 예외(원인 미확정) | R5000(RESULT_INTERNAL) | 없음 | 롤백 | 보관, 실행당 3회까지 재전송 후 삭제. 그동안 조회 보류 |

- 응답 `resultId`는 요청과 같아야 한다. 다르면 WPF는 종결로 보지 않는다(응답 이상으로 3회까지 재전송 후 삭제).
- 분류되지 않은 예외를 REJECTED로 보내지 않는다. REJECTED는 WPF가 결과를 지우는 신호다.
- RETRYABLE_ERROR와 INTERNAL_ERROR의 구분은 예외 형식(원인 체인 포함)으로 하고 메시지 문자열로 하지 않는다. 일시 장애로 보는 형식: Spring `TransientDataAccessException`(데드락·잠금 대기·쿼리 타임아웃), `RecoverableDataAccessException`, `DataAccessResourceFailureException`(연결 불가), `CannotCreateTransactionException`, `TransactionTimedOutException`, JDBC `SQLTransientException`·`SQLRecoverableException`. 무결성 위반은 일시 장애가 아니다.

## 5. 결과 응답 code 값 (VARCHAR2(5 BYTE))

폐쇄망 코드 컬럼이 VARCHAR2(5 BYTE)(UTF-8)이므로 code는 ASCII 5자로 정한다. 형식은 「구분 1자 + HTTP 상태 기반 3자리 + 일련 1자리」다. R은 HTTP 200 결과 응답이다(HTTP 오류 본문의 E 코드는 선택, §3). 이름은 문서·로그에서 의미를 설명할 때만 쓰며 응답에는 넣지 않는다.

| code | 이름 | 응답 | 상황 |
|---|---|---|---|
| R2001 | NEXT_STATUS_UNKNOWN | 200 ACCEPTED·DUPLICATE | 저장은 됐으나 다음 후보 확인 실패(nextStatus 생략) |
| R4000 | INVALID_RESULT | 200 REJECTED | 결과 형식 오류, 또는 아래로 분류되지 않은 업무 검증 실패 |
| R4001 | INVALID_DELIVERY | 200 REJECTED | 유효한 전달 건이 아님(없는 deliveryId, 다른 사용자 전달 건, popupId 불일치) |
| R4002 | DELIVERY_COMPLETED | 200 REJECTED | 다른 resultId의 결과가 이미 저장된 전달 건 |
| R4003 | NOT_ELIGIBLE | 200 REJECTED | 해당 사용자에게 제출·기록 가능한 팝업이 아님 |
| R4004 | TYPE_MISMATCH | 200 REJECTED | 팝업 유형과 결과 유형 불일치 |
| R4005 | INVALID_ANSWER | 200 REJECTED | 문항·선택지·답안 검증 실패 |
| R4006 | INVALID_VIDEO | 200 REJECTED | 영상 시청 정보 검증 실패 |
| R5000 | RESULT_INTERNAL | 200 INTERNAL_ERROR | 원인 미확정 내부 오류(롤백) |
| R5030 | RETRYABLE | 200 RETRYABLE_ERROR | 확인된 일시 장애(롤백) |

- WPF는 code를 판정에 쓰지 않는다(로그 전용). 그래서 code 형식을 바꿔도 WPF 동작은 같다. 처리 분기는 HTTP 상태와 status로만 한다.
- status 값(ACCEPTED·DUPLICATE·REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR)은 5 Byte를 넘지만 응답 값은 바꾸면 안 된다. DB에 status를 짧게 저장해야 하면 저장용 코드와 응답 문자열을 서버에서 바꿔 준다.
- REJECTED 세부 code는 진단값이다. 형식(5 Byte)을 지키는 범위에서 백엔드 업무 예외 체계에 맞게 늘리거나 합쳐도 된다. 결과 응답에는 R 코드만 쓴다.
- 저장소는 업무 예외 메시지로 세부 code를 나눈다(`WpfResultFailures.rejectCode`). 폐쇄망 업무 예외가 예외 클래스·오류 코드를 가지면 그 기준으로 바꾼다. 코드표 원본은 `WpfResponseCodes`다.

## 6. WPF가 보내는 장애 결과 (resultCode=400)

WPF가 HTTP 200 조회 응답을 처리하지 못하면(빈 본문, JSON 구문·형식 오류, 표시 변환 실패) 결과 API로 `resultCode=400`·`resultDesc`를 담은 장애 결과를 보낸다. 서버 쪽 오류 응답이 아니라 WPF가 보내는 요청이며, 서버는 일반 결과와 같은 status 규칙으로 응답한다.

| 항목 | 규칙 |
|---|---|
| 식별 | `resultType` 없이 `resultCode=400`이 오면 장애 결과로 처리한다. `resultType`이 함께 오면 REJECTED(R4000(INVALID_RESULT)) |
| 필드 | `resultId`·`resultCode`·`resultDesc`(UTF-8 1,000 Byte 이하) 필수, `deliveryId`·`popupId`는 확보한 경우만 |
| 저장 | 완료·숨김·표시 정보를 바꾸지 않는다. deliveryId가 있으면 그 전달 건만 오류로 종료(조회 간격 동안 재노출 유예), 없으면 영수증만 남긴다 |
| 응답 | 일반 결과와 같다(ACCEPTED·DUPLICATE·REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR) |

HTTP 오류(400·401·403·5xx)로 받은 조회 응답은 장애 결과 대상이 아니다.

## 7. 결과 예시

아래 응답은 저장소 서버의 실제 컨트롤러·서비스·예외 처리기를 거쳐 만든 것이다(`WpfErrorBranchExamplesTest`, 매퍼·결과 처리기만 mock). HTTP 오류 샘플은 §3에 있다.

### Q1. 표시할 팝업 없음 → HTTP 200 (오류 아님)

상황: 조회 API, 대상 없음

HTTP 200

```json
{
  "pollingIntervalSeconds": 1800,
  "popup": null
}
```

### R1. 정상 저장 → HTTP 200 ACCEPTED

상황: CLOSED 결과, 저장 후 남은 후보 있음

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "ACCEPTED",
  "nextStatus": "AVAILABLE"
}
```

### R2. 같은 resultId 재전송 → HTTP 200 DUPLICATE

상황: 이미 처리한 resultId, 남은 후보 없음

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "DUPLICATE",
  "nextStatus": "EMPTY"
}
```

### R3. 결과 형식 오류 → HTTP 200 REJECTED (400 아님)

상황: 본문은 읽었으나 resultType 누락: {"resultId":"r-0001","deliveryId":"d-0001","popupId":"NOTICE-001"}

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "REJECTED",
  "code": "R4000",
  "message": "결과 형식 오류: resultType 공백일 수 없습니다"
}
```

### R4. 업무 검증 실패 → HTTP 200 REJECTED + 세부 code

상황: 결과 처리에서 "유효한 전달 건이 아닙니다" 업무 예외

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "REJECTED",
  "code": "R4001",
  "message": "유효한 전달 건이 아닙니다. deliveryId=d-0001"
}
```

### R5. 확인된 일시 장애 → HTTP 200 RETRYABLE_ERROR

상황: 저장 중 CannotAcquireLockException(ORA-00060 데드락). 트랜잭션 롤백

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "RETRYABLE_ERROR",
  "code": "R5030",
  "message": "일시적인 서버 오류로 처리하지 못했습니다. 다시 전송해 주세요."
}
```

### R6. 원인 미확정 오류 → HTTP 200 INTERNAL_ERROR

상황: 저장 중 IllegalStateException 등 분류되지 않은 예외. 트랜잭션 롤백

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "INTERNAL_ERROR",
  "code": "R5000",
  "message": "서버 처리 중 오류가 발생했습니다."
}
```

### R7. 저장은 됐으나 후보 확인 실패 → HTTP 200 ACCEPTED + R2001

상황: 저장 커밋 후 다음 후보 수 조회가 실패. nextStatus 생략

HTTP 200

```json
{
  "resultId": "r-0001",
  "status": "ACCEPTED",
  "code": "R2001",
  "message": "결과는 저장했으나 다음 팝업 유무를 확인하지 못했습니다."
}
```

### R8. WPF 장애 결과(resultCode=400) 수신 → HTTP 200 ACCEPTED

상황: 요청: {"resultId":"r-0002","deliveryId":"d-0002","popupId":"NOTICE-002","resultCode":400,"resultDesc":"팝업 조회 응답 처리 실패: JSON 형식 오류(Path=$.popup.width)",...}

HTTP 200

```json
{
  "resultId": "r-0002",
  "status": "ACCEPTED",
  "nextStatus": "EMPTY"
}
```

## 8. 참고 소스

| 역할 | 파일(zero-rule-server) | 볼 내용 |
|---|---|---|
| HTTP 오류 매핑 | `web/api/src/main/java/server/web/api/popup/wpf/WpfApiExceptionHandler.java` | 예외 → 400·401·403·500과 `{code, message, timestamp}`. WPF 컨트롤러에만 적용(`assignableTypes`) |
| HTTP 오류 본문 | `domain/src/main/java/server/domain/popup/wpf/WpfErrorResponse.java` | 오류 본문 형식 |
| 버전 426 | `web/api/src/main/java/server/web/api/popup/wpf/version/WpfClientVersionInterceptor.java` | 인증보다 먼저 426 응답 |
| 결과 형식 검사 → REJECTED | `web/api/src/main/java/server/web/api/popup/wpf/WpfPopupController.java` (`process`) | 형식 오류는 200 REJECTED, 변환 중 예상 못한 예외는 INTERNAL_ERROR |
| 결과 status 분류 | `service/core/src/main/java/server/service/core/popup/wpf/WpfResultFailures.java` | 일시 장애 판정(`isTransient`), REJECTED 세부 code(`rejectCode`), 고정 code·message |
| 결과 처리 분기 | `service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java` (`processResult`·`processErrorResult`) | 예외 → REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR, 커밋 후 nextStatus·R2001(NEXT_STATUS_UNKNOWN) |
| 결과 응답 형식 | `domain/src/main/java/server/domain/popup/wpf/WpfResultResponse.java`·`WpfResultItemResponse.java` | 응답 필드·status 값 |
| 결과 예시 생성 | `web/api/src/test/java/server/web/api/popup/wpf/WpfErrorBranchExamplesTest.java` | 위 예시를 만드는 테스트. `build/wpf-error-branch-examples/`에 저장 |
| WPF 판정(참고) | `popup-frameWork/Popup/Services/PopupResultQueue.cs`·`PopupPollingRecovery.cs` | 클라이언트가 HTTP 상태·status를 어떻게 처리하는지 |

## 9. 폐쇄망 백엔드 적용 시 확인

| 항목 | 확인할 것 | 기준 |
|---|---|---|
| 공통 예외 처리기 | 기존 전역 처리기가 오류를 HTTP 200 + 자체 결과 코드로 감싸는지 | 401·426·400(결과 본문 해석 불가)만 이 상태 코드로 나가면 된다. 그 밖의 오류는 기존 처리기 그대로 둔다. 감싸는 처리기라면 WPF 경로에서 이 3가지만 예외로 둔다 |
| 인증 필터 | 토큰 오류 응답이 HTTP 401인지, 리다이렉트(302)·로그인 HTML이 아닌지 | WPF는 401만 재로그인 경로로 본다 |
| 결과 형식 오류 | Bean Validation 실패가 400으로 나가는지 | 결과 API는 본문을 읽은 뒤의 형식 오류를 200 REJECTED로 보낸다(로그인 API는 400 유지) |
| 업무 예외 분류 | 업무 검증 예외와 시스템 예외가 구분되는지 | 업무 검증 → REJECTED, 확인된 일시 장애 → RETRYABLE_ERROR, 나머지 → INTERNAL_ERROR |
| 일시 장애 판정 | 자체 래핑 예외가 원인(SQLException 등)을 보존하는지 | 원인 체인이 끊기면 일시 장애도 INTERNAL_ERROR로 분류된다. 래핑할 때 cause를 넘기거나 판정 목록에 래핑 예외를 추가한다 |
| 트랜잭션 | 결과 저장·전달 건 종료·영수증이 한 트랜잭션인지 | RETRYABLE_ERROR·INTERNAL_ERROR·REJECTED는 롤백된 상태로 응답 |
| 응답 필드 | 결과 응답에 `resultId`·`status`가 항상 있는지, 식별 필드 이름 | 폐쇄망 결과 식별 필드(`requestId` 등)를 쓰면 WPF 계약 이름과 대조가 필요하다 |
| 내부 정보 노출 | 오류 message에 SQL·스택·ORA 코드가 들어가는지 | 응답에 넣지 않고 서버 로그에만 남긴다 |

## 10. 하지 말 것

| 금지 | 이유 |
|---|---|
| 표시할 팝업이 없을 때 404·204로 응답 | 오류가 아니다. 200 `popup: null` |
| 결과 업무 오류를 HTTP 400·409·422로 응답 | WPF가 같은 결과를 보관·재전송하거나 이번 실행에서 제외해 종결 기록이 남지 않는다. 200 REJECTED |
| 일시 장애·원인 미확정 오류를 REJECTED로 응답 | WPF가 결과를 지운다(데이터 유실) |
| 401을 200 + 오류 코드로 감싸서 응답 | WPF가 재로그인하지 못한다 |
| 오류 message 문구로 status를 정하거나 WPF가 message로 판단하길 기대 | WPF는 HTTP 상태와 status만 본다 |
| 결과 응답 resultId를 비우거나 바꿔서 응답 | WPF가 종결로 보지 않는다 |

## 11. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-11-17 | 최초 작성. HTTP 오류·결과 status 분기, code 값, 장애 결과, 실제 응답 예시, 참고 소스, 폐쇄망 적용 확인 항목 |
| v1.1 | 2026-11-17 | 응답 code를 폐쇄망 코드 컬럼 VARCHAR2(5 BYTE)에 맞춰 5자 코드(E4000~E5000, R2001~R5030)로 변경. HTTP 500과 결과 INTERNAL_ERROR 코드 분리(E5000·R5000). 예시 재생성 |
| v1.2 | 2026-11-17 | HTTP 오류를 필수 3가지(401·426·결과 API 본문 해석 불가 400)로 줄이고 나머지는 기존 처리기 그대로 허용, 본문·E 코드는 선택으로 정리. HTTP 오류 절(시트)에 샘플 추가. 결과 응답 code 표는 R 코드만 |
