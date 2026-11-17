# WPF API 장애별 분기 처리 정의서 (백엔드 전달용)

기준일: 2026-11-17 (KST) · 대상: WPF 팝업 Agent가 호출하는 조회·결과 API를 구현하는 백엔드
Excel 판: `docs/interfaces/Server/SERVER_ERROR_BRANCH_v1.5.xlsx` (이 문서에서 생성)

## 1. 백엔드 주요 개발 범위와 원칙

백엔드가 새로 개발할 것은 대부분 **결과 API(`POST /p/api/wpf/popups/results`)의 HTTP 200 분기**다. HTTP 오류는 401·400 두 가지가 제대로 나가는지 확인하는 정도다.

| 항목 | 해야 할 것 | 응답 |
|---|---|---|
| 예외 분류 | 업무·형식 검증 실패, 확인된 일시 장애(DB 연결·데드락·잠금 대기·타임아웃), 그 밖의 예외를 구분 | REJECTED / RETRYABLE_ERROR / INTERNAL_ERROR |
| 중복 처리 | resultId를 기록하고, 같은 resultId가 다시 오면 재처리하지 않음 | DUPLICATE |
| 다음 후보 | 저장 후 남은 표시 후보 확인 | `nextStatus` AVAILABLE·EMPTY, 확인 실패면 생략 + `R2001` |
| 장애 결과 | `resultCode=400` 요청을 받아 해당 전달 건만 오류로 종료(완료·숨김 미변경) | 일반 결과와 같은 status |
| 응답 형식 | 요청과 같은 `resultId`, 정해진 `status` 문자열, 5 Byte `code` | §4 |

| 구분 | 언제 | 응답 |
|---|---|---|
| HTTP 200 + status·code (주요 개발) | 결과 API에서 요청은 읽었고, 그 결과 1건의 처리 판정(저장·중복·거절·일시 장애·내부 오류)을 알려야 할 때 | HTTP 200 + `{resultId, status, nextStatus, code, message}` |
| HTTP 오류 (필수 2가지) | 인증 실패, 결과 API 본문 해석 불가 | HTTP 401, 400 (상태 코드만 필수, 본문 선택) |
| 오류가 아님 | 조회했지만 표시할 팝업이 없을 때 | HTTP 200 + `{pollingIntervalSeconds, popup: null}` |

- 필수 값은 `resultId`와 `status`다. `code`·`message`는 진단용이다.
- 426(클라이언트 버전 미지원)은 서버에서 버전 검증을 쓸 때만 보낸다(선택).
- 위 외의 HTTP 오류(403·404·405·500·502·503·504)는 기존 예외 처리기가 내는 상태·본문 그대로 보내면 된다.

## 2. 판정 순서 (요청 1건)

| 순서 | 단계 | 실패 상황 | 응답 |
|---|---|---|---|
| 1 | 클라이언트 버전(선택) | 버전 검증을 쓸 때만: `X-Client-Version` 없음·해석 불가·최소 버전 미만 | HTTP 426 |
| 2 | 인증 | 토큰 없음·만료·무효, 사번을 얻지 못함 | HTTP 401 |
| 3 | 본문 해석(결과 API) | JSON 구문 오류, 날짜·숫자 형식 오류, 알 수 없는 enum | HTTP 400 |
| 4 | 결과 형식 검사(결과 API) | resultId·deliveryId·popupId 누락·길이, 알 수 없는 resultType, hideDays 범위, score 음수, answers·optionIds null 요소, video 형식, resultDesc 1,000 Byte 초과 | HTTP 200 `REJECTED` `R4000` |
| 5 | 업무 검증(결과 API) | 전달 건 불일치·이미 완료·대상 아님·유형 불일치·문항·선택지·영상 검증 실패 | HTTP 200 `REJECTED` + 세부 code |
| 6 | 저장(결과 API) | DB 연결·데드락·잠금 대기·타임아웃 등 확인된 일시 장애(§4 RETRYABLE_ERROR 예시: ORA-12170·ORA-03113·ORA-00060 등) | HTTP 200 `RETRYABLE_ERROR` `R5030` |
| 7 | 저장(결과 API) | 그 밖의 예외(원인 미확정) | HTTP 200 `INTERNAL_ERROR` `R5000` |
| 8 | 저장 후 후보 확인(결과 API) | 저장은 됐으나 다음 후보 수 조회 실패 | HTTP 200 `ACCEPTED`·`DUPLICATE` + `R2001`, nextStatus 생략 |

- 버전 검증을 쓰면 426을 401보다 먼저 판정한다.
- 3은 결과 API에서 본문 자체를 읽지 못한 경우만 400이다. 본문은 읽었으나 값이 틀린 경우(4)는 200 REJECTED다.

## 3. 필수 HTTP 오류 (401·400)

아래 2가지는 반드시 이 HTTP 상태 코드로 보낸다. 본문은 선택이다.

| HTTP | 언제 | 본문 |
|---|---|---|
| 401 | 모든 WPF API에서 토큰 없음·만료·무효, 사번 확인 실패 | 선택 |
| 400 | 결과 API 본문을 해석하지 못함(JSON 구문·역직렬화 오류) | 선택 |

- 401: 토큰 검증 필터가 만료·무효 토큰을 302 리다이렉트나 200 + 자체 오류 코드로 처리하지 않는지 확인한다. 그렇게 처리하면 WPF 경로만 401로 나가도록 예외를 둔다.
- 400: Spring 기본 동작이다. 공통 예외 처리기가 이를 200·500으로 바꾸지 않는지 확인한다.
- 426은 선택이다. 버전 검증을 쓸 때만 인증보다 먼저 보낸다.
- 오류 본문·message에 SQL·스택·ORA 코드 같은 내부 정보를 넣지 않는다.

### 샘플

### H1. 인증 실패 → HTTP 401

상황: 토큰 없음·만료·무효

HTTP 401

```jsonc
{
  "code": "E4010",                          // 선택. 본문 자체가 선택이며, 줄 때의 권장 코드
  "message": "토큰이 유효하지 않거나 만료되었습니다.",       // 선택
  "timestamp": "2026-11-17T21:00:00+09:00"  // 선택. ISO 8601
}
```

본문 없이 상태 코드 401만 보내도 된다.

### H2. 결과 API 본문 해석 불가 → HTTP 400

상황: 결과 API 본문이 깨진 JSON: {"resultId": "r-0001", 

HTTP 400

```jsonc
{
  "code": "E4000",                          // 선택. 본문 자체가 선택이며, 줄 때의 권장 코드
  "message": "요청 본문을 해석할 수 없습니다.",          // 선택
  "timestamp": "2026-11-17T21:00:00+09:00"  // 선택. ISO 8601
}
```

본문 없이 상태 코드 400만 보내도 된다.

### H3. (선택) 클라이언트 버전 미지원 → HTTP 426

상황: X-Client-Version: 1.2.9 (최소 지원 1.3.0) — 버전 검증을 쓸 때만

HTTP 426

```jsonc
{
  "code": "E4260",                          // 선택
  "message": "WPF 클라이언트 업데이트가 필요합니다.",      // 선택
  "clientVersion": "1.2.9",                 // 선택. 요청 헤더의 버전
  "minimumSupportedVersion": "1.3.0",       // 선택. 최소 지원 버전
  "latestVersion": "1.4.2",                 // 선택. 최신 버전
  "timestamp": "2026-11-17T21:00:00+09:00"  // 선택. ISO 8601
}
```

본문 없이 상태 코드 426만 보내도 된다.

## 4. 결과 응답 (HTTP 200)

결과 1건에 응답 1건이다. 모든 결과 판정은 HTTP 200으로 보내고 `status`로 구분한다.

| status | 언제 | code | nextStatus |
|---|---|---|---|
| ACCEPTED | 처음 정상 저장 | 없음(후보 확인 실패면 R2001) | AVAILABLE·EMPTY(확인 실패면 생략) |
| DUPLICATE | 같은 resultId를 이미 처리함(본문이 달라도 비교하지 않음) | 없음(후보 확인 실패면 R2001) | AVAILABLE·EMPTY(확인 실패면 생략) |
| REJECTED | 다시 보내도 같은 결과가 나오는 형식·업무 오류 | R4000~R4006 | 없음 |
| RETRYABLE_ERROR | 확인된 일시 장애(DB 연결·DB 기동 중·연결 풀 고갈·데드락·잠금 대기·쿼리·트랜잭션 타임아웃, 아래 예시) | R5030 | 없음 |
| INTERNAL_ERROR | 그 밖의 예외(원인 미확정) | R5000 | 없음 |

- 분류되지 않은 예외를 REJECTED로 보내지 않는다. 확인된 일시 장애가 아니면 INTERNAL_ERROR다.
- RETRYABLE_ERROR와 INTERNAL_ERROR의 구분은 예외 형식(원인 포함)으로 하고 메시지 문자열로 하지 않는다. 무결성 위반은 일시 장애가 아니다.

RETRYABLE_ERROR 예시 — 잠시 뒤 같은 요청을 다시 받으면 성공할 수 있는 장애다. 저장하지 않은 상태로 응답한다.

| 구분 | 오류 (예) | 상황 | Spring·JDBC 예외 형식 (예) |
|---|---|---|---|
| DB 연결 | ORA-12170: TNS:Connect timeout occurred | DB 서버 연결 시간 초과 | SQLRecoverableException → DataAccessResourceFailureException |
| DB 연결 | ORA-12541: TNS:no listener | 리스너 중지·재기동 중 | SQLRecoverableException → DataAccessResourceFailureException |
| DB 연결 | ORA-12514: TNS:listener does not currently know of service requested in connect descriptor | DB 서비스 미등록(기동 중) | SQLRecoverableException → DataAccessResourceFailureException |
| DB 연결 | ORA-12537: TNS:connection closed | 연결 중 끊김 | SQLRecoverableException → RecoverableDataAccessException |
| DB 연결 | ORA-17002: IO Error: The Network Adapter could not establish the connection | 네트워크 단절 | SQLRecoverableException → DataAccessResourceFailureException |
| DB 연결 | ORA-03113: end-of-file on communication channel | 처리 중 세션 강제 종료·네트워크 끊김 | SQLRecoverableException → RecoverableDataAccessException |
| DB 연결 | ORA-03114: not connected to ORACLE | 이미 끊긴 연결 사용 | SQLRecoverableException → RecoverableDataAccessException |
| DB 연결 | ORA-03135: connection lost contact | 연결 유실 | SQLRecoverableException → RecoverableDataAccessException |
| DB 상태 | ORA-01033: ORACLE initialization or shutdown in progress | DB 기동·종료 중 | SQLRecoverableException → DataAccessResourceFailureException |
| DB 상태 | ORA-01034: ORACLE not available | DB 중지 | SQLRecoverableException → DataAccessResourceFailureException |
| DB 상태 | ORA-01089: immediate shutdown or close in progress - no operations are permitted | DB 즉시 종료 중 | SQLRecoverableException → RecoverableDataAccessException |
| 연결 풀 | HikariPool-1 - Connection is not available, request timed out after 30000ms | 연결 풀 고갈(동시 요청 폭주) | SQLTransientConnectionException → CannotCreateTransactionException |
| 연결 풀 | ORA-00018: maximum number of sessions exceeded / ORA-00020: maximum number of processes exceeded | DB 세션·프로세스 한도 초과 | 연결 풀이 연결 획득 실패로 감싼 경우 CannotCreateTransactionException |
| 잠금 | ORA-00060: deadlock detected while waiting for resource | 같은 전달 건 동시 갱신으로 교착 | CannotAcquireLockException(Spring 5.x: DeadlockLoserDataAccessException) |
| 잠금 | ORA-00054: resource busy and acquire with NOWAIT specified or timeout expired | 행·테이블 잠금 대기 실패(SELECT … FOR UPDATE NOWAIT 등) | CannotAcquireLockException |
| 잠금 | ORA-30006: resource busy; acquire with WAIT timeout expired | 잠금 대기 시간 초과(FOR UPDATE WAIT n) | CannotAcquireLockException |
| 잠금 | ORA-02049: timeout: distributed transaction waiting for lock | 분산 트랜잭션 잠금 대기 초과 | CannotAcquireLockException |
| 직렬화 | ORA-08177: can't serialize access for this transaction | SERIALIZABLE 격리 충돌 | CannotSerializeTransactionException(PessimisticLockingFailureException) |
| 타임아웃 | ORA-01013: user requested cancel of current operation | 쿼리 타임아웃(statement timeout)으로 취소 | SQLTimeoutException → QueryTimeoutException |
| 타임아웃 | Transaction timed out: deadline was … | 트랜잭션 제한 시간 초과(@Transactional timeout) | TransactionTimedOutException |

INTERNAL_ERROR 예시 — 다시 보내도 같은 결과가 나오거나 원인을 확정할 수 없는 오류다. RETRYABLE_ERROR로 보내지 않는다.

| 구분 | 오류 (예) | 상황 |
|---|---|---|
| 무결성 | ORA-00001: unique constraint (…) violated | 중복 키(같은 resultId 중복은 예외 전에 DUPLICATE로 판정) |
| 무결성 | ORA-01400: cannot insert NULL into (…) | 필수 컬럼 누락 |
| 무결성 | ORA-02291: integrity constraint (…) violated - parent key not found | 참조 대상 없음 |
| 데이터 | ORA-12899: value too large for column (…) | 컬럼 길이 초과 |
| 데이터 | ORA-01722: invalid number | 숫자 변환 실패 |
| SQL·스키마 | ORA-00942: table or view does not exist / ORA-00904: invalid identifier | 테이블·컬럼 누락, SQL 오류 |
| 권한 | ORA-01031: insufficient privileges | DB 계정 권한 없음 |
| 애플리케이션 | NullPointerException, IllegalStateException 등 | 분류되지 않은 코드 오류 |

- 위 오류 메시지는 판정 예시다. 판정은 메시지 문자열이 아니라 예외 형식(원인 체인 포함)으로 한다. 드라이버·Spring 버전에 따라 예외 형식이 다를 수 있으므로, 폐쇄망 환경에서 위 오류가 어떤 예외로 올라오는지 확인해 일시 장애 목록을 맞춘다.
- 자체 래핑 예외가 원인(SQLException)을 끊으면 일시 장애도 INTERNAL_ERROR로 분류된다. 래핑할 때 원인을 보존한다.
- ORA 코드·SQL·스택은 응답 message에 넣지 않고 서버 로그에만 남긴다.

### 응답 본문 전체

HTTP 200

```jsonc
{
  "resultId": "r-0001",         // 필수. 요청의 resultId 그대로
  "status": "ACCEPTED",         // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  "nextStatus": "AVAILABLE",    // 조건부 필수. ACCEPTED·DUPLICATE일 때 AVAILABLE(남은 후보 있음) | EMPTY(없음). 후보 확인 실패면 생략. 그 밖의 status에는 보내지 않음
  "code": "R4001",              // 선택. 5 Byte 코드(§5). REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR, 후보 확인 실패(R2001)일 때
  "message": "유효한 전달 건이 아닙니다."  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

## 5. 결과 응답 code 값 (VARCHAR2(5 BYTE))

| code | 이름 | status | 상황 |
|---|---|---|---|
| R2001 | NEXT_STATUS_UNKNOWN | ACCEPTED·DUPLICATE | 저장은 됐으나 다음 후보 확인 실패(nextStatus 생략) |
| R4000 | INVALID_RESULT | REJECTED | 결과 형식 오류, 또는 아래로 분류되지 않은 업무 검증 실패 |
| R4001 | INVALID_DELIVERY | REJECTED | 유효한 전달 건이 아님(없는 deliveryId, 다른 사용자 전달 건, popupId 불일치) |
| R4002 | DELIVERY_COMPLETED | REJECTED | 다른 resultId의 결과가 이미 저장된 전달 건 |
| R4003 | NOT_ELIGIBLE | REJECTED | 해당 사용자에게 제출·기록 가능한 팝업이 아님 |
| R4004 | TYPE_MISMATCH | REJECTED | 팝업 유형과 결과 유형 불일치 |
| R4005 | INVALID_ANSWER | REJECTED | 문항·선택지·답안 검증 실패 |
| R4006 | INVALID_VIDEO | REJECTED | 영상 시청 정보 검증 실패 |
| R5000 | RESULT_INTERNAL | INTERNAL_ERROR | 원인 미확정 내부 오류 |
| R5030 | RETRYABLE | RETRYABLE_ERROR | 확인된 일시 장애 |

- 형식: ASCII 5자(구분 1자 + HTTP 상태 기반 3자리 + 일련 1자리). 이름은 문서 설명용이며 응답에는 넣지 않는다.
- `status` 값은 5 Byte를 넘지만 응답 값은 바꾸지 않는다. DB에 짧게 저장해야 하면 저장용 코드와 응답 문자열을 서버에서 바꿔 준다.
- REJECTED 세부 code는 5 Byte 형식을 지키는 범위에서 늘리거나 합쳐도 된다.

## 6. 장애 결과 요청 (resultCode=400)

WPF가 HTTP 200 조회 응답을 처리하지 못하면(빈 본문, JSON 구문·형식 오류, 표시 변환 실패) 결과 API로 보내는 요청이다. 응답은 §4와 같다.

- `resultType` 없이 `resultCode=400`이 오면 장애 결과로 처리한다.
- 완료·숨김·표시 정보는 바꾸지 않는다. deliveryId가 있으면 그 전달 건만 오류로 종료하고, 없으면 수신 기록만 남긴다.
- resultDesc가 1,000 Byte를 넘으면 REJECTED `R4000`이다.

### 장애 결과 요청 본문 전체

POST /p/api/wpf/popups/results

```jsonc
{
  "resultId": "0f3c1c1e-6b5d-4bd6-9c63-0d8f6f0b2a11",              // 필수. WPF 생성, 재전송 시 같은 값
  "deliveryId": "DLV-20261111-0001",                               // 선택. WPF가 확보한 경우만
  "popupId": "P0001",                                              // 선택. WPF가 확보한 경우만
  "resultCode": 400,                                               // 필수. 400 고정
  "resultDesc": "팝업 조회 응답 처리 실패: JSON 형식 오류(Path=$.popup.width)",  // 필수. UTF-8 1,000 Byte 이하
  "closedAt": "2026-11-11T17:20:00+09:00"                          // 선택
  // "resultType": 보내지 않음 — 함께 오면 REJECTED R4000
}
```

## 7. 응답 예시

### Q1. 표시할 팝업 없음 → HTTP 200 (오류 아님)

상황: 조회 API(`POST /p/api/wpf/popups`), 대상 없음

HTTP 200

```jsonc
{
  "pollingIntervalSeconds": 1800,  // 필수. 다음 조회 간격(초)
  "popup": null                    // 필수. 표시할 팝업이 없으면 null (오류 아님)
}
```

### R1. 정상 저장 → HTTP 200 ACCEPTED

상황: CLOSED 결과, 저장 후 남은 후보 있음

HTTP 200

```jsonc
{
  "resultId": "r-0001",      // 필수. 요청의 resultId 그대로
  "status": "ACCEPTED",      // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  "nextStatus": "AVAILABLE"  // 필수(ACCEPTED·DUPLICATE). AVAILABLE | EMPTY
  // "code": 보내지 않음 — 정상 저장에는 없음
  // "message": 보내지 않음 — 정상 저장에는 없음
}
```

### R2. 같은 resultId 재전송 → HTTP 200 DUPLICATE

상황: 이미 처리한 resultId, 남은 후보 없음

HTTP 200

```jsonc
{
  "resultId": "r-0001",   // 필수. 요청의 resultId 그대로
  "status": "DUPLICATE",  // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  "nextStatus": "EMPTY"   // 필수(ACCEPTED·DUPLICATE). AVAILABLE | EMPTY
  // "code": 보내지 않음 — 정상 저장에는 없음
  // "message": 보내지 않음 — 정상 저장에는 없음
}
```

### R3. 결과 형식 오류 → HTTP 200 REJECTED (400 아님)

상황: 본문은 읽었으나 resultType 누락: {"resultId":"r-0001","deliveryId":"d-0001","popupId":"NOTICE-001"}

HTTP 200

```jsonc
{
  "resultId": "r-0001",                         // 필수. 요청의 resultId 그대로
  "status": "REJECTED",                         // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  // "nextStatus": 보내지 않음 — REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR에는 없음
  "code": "R4000",                              // 선택. R4000 INVALID_RESULT
  "message": "결과 형식 오류: resultType 공백일 수 없습니다"  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

### R4. 업무 검증 실패 → HTTP 200 REJECTED + 세부 code

상황: 전달 건이 없거나 다른 사용자 것

HTTP 200

```jsonc
{
  "resultId": "r-0001",                           // 필수. 요청의 resultId 그대로
  "status": "REJECTED",                           // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  // "nextStatus": 보내지 않음 — REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR에는 없음
  "code": "R4001",                                // 선택. R4001 INVALID_DELIVERY
  "message": "유효한 전달 건이 아닙니다. deliveryId=d-0001"  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

### R5. 확인된 일시 장애 → HTTP 200 RETRYABLE_ERROR

상황: 저장 중 DB 데드락(ORA-00060). 원인은 응답에 넣지 않음

HTTP 200

```jsonc
{
  "resultId": "r-0001",                             // 필수. 요청의 resultId 그대로
  "status": "RETRYABLE_ERROR",                      // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  // "nextStatus": 보내지 않음 — REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR에는 없음
  "code": "R5030",                                  // 선택. R5030 RETRYABLE
  "message": "일시적인 서버 오류로 처리하지 못했습니다. 다시 전송해 주세요."  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

### R6. 원인 미확정 오류 → HTTP 200 INTERNAL_ERROR

상황: 저장 중 분류되지 않은 예외

HTTP 200

```jsonc
{
  "resultId": "r-0001",             // 필수. 요청의 resultId 그대로
  "status": "INTERNAL_ERROR",       // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  // "nextStatus": 보내지 않음 — REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR에는 없음
  "code": "R5000",                  // 선택. R5000 RESULT_INTERNAL
  "message": "서버 처리 중 오류가 발생했습니다."  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

### R7. 저장은 됐으나 후보 확인 실패 → HTTP 200 ACCEPTED + R2001

상황: 저장 후 다음 후보 수 조회 실패

HTTP 200

```jsonc
{
  "resultId": "r-0001",                         // 필수. 요청의 resultId 그대로
  "status": "ACCEPTED",                         // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  // "nextStatus": 보내지 않음 — 생략. 후보 확인 실패 시 EMPTY로 보내지 않음
  "code": "R2001",                              // 선택. R2001 NEXT_STATUS_UNKNOWN
  "message": "결과는 저장했으나 다음 팝업 유무를 확인하지 못했습니다."  // 선택. 사유 설명(내부 오류 상세는 넣지 않음)
}
```

### R8. 장애 결과(resultCode=400) 수신 → HTTP 200 ACCEPTED

상황: §6 장애 결과 요청, 저장 후 남은 후보 없음

HTTP 200

```jsonc
{
  "resultId": "0f3c1c1e-6b5d-4bd6-9c63-0d8f6f0b2a11",  // 필수. 요청의 resultId 그대로
  "status": "ACCEPTED",                                // 필수. ACCEPTED | DUPLICATE | REJECTED | RETRYABLE_ERROR | INTERNAL_ERROR
  "nextStatus": "EMPTY"                                // 필수(ACCEPTED·DUPLICATE). AVAILABLE | EMPTY
  // "code": 보내지 않음 — 정상 저장에는 없음
  // "message": 보내지 않음 — 정상 저장에는 없음
}
```

## 8. 폐쇄망 백엔드 적용 시 확인

| 항목 | 확인할 것 | 기준 |
|---|---|---|
| 공통 예외 처리기 | 기존 전역 처리기가 오류를 HTTP 200 + 자체 결과 코드로 감싸는지 | 401·400(결과 본문 해석 불가)만 이 상태 코드로 나가면 된다. 그 밖의 오류는 기존 처리기 그대로 둔다 |
| 인증 필터 | 토큰 오류 응답이 HTTP 401인지, 리다이렉트(302)·로그인 HTML이 아닌지 | WPF 경로는 401 |
| 결과 형식 오류 | 본문은 읽었으나 값이 틀린 경우(Bean Validation 등)가 400으로 나가는지 | 결과 API는 200 REJECTED(R4000) |
| 업무 예외 분류 | 업무 검증 예외와 시스템 예외가 구분되는지 | 업무 검증 → REJECTED, 확인된 일시 장애 → RETRYABLE_ERROR, 나머지 → INTERNAL_ERROR |
| 일시 장애 판정 | 자체 래핑 예외가 원인(SQLException 등)을 보존하는지 | 원인이 끊기면 일시 장애도 INTERNAL_ERROR로 분류된다 |
| 응답 필드 | 결과 응답에 `resultId`·`status`가 항상 있는지, 식별 필드 이름 | 폐쇄망 결과 식별 필드(`requestId` 등)를 쓰면 이름 대조가 필요하다 |
| 내부 정보 노출 | 오류 message에 SQL·스택·ORA 코드가 들어가는지 | 응답에 넣지 않고 서버 로그에만 남긴다 |

## 9. 하지 말 것

| 금지 | 대신 |
|---|---|
| 표시할 팝업이 없을 때 404·204로 응답 | 200 `popup: null` |
| 결과 업무·형식 오류를 HTTP 400·409·422로 응답 | 200 REJECTED |
| 일시 장애·원인 미확정 오류를 REJECTED로 응답 | RETRYABLE_ERROR·INTERNAL_ERROR |
| 인증 실패를 200 + 오류 코드나 302로 응답 | 401 |
| 결과 응답의 resultId를 비우거나 바꿔서 응답 | 요청 resultId 그대로 |

## 10. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-11-17 | 최초 작성. HTTP 오류·결과 status 분기, code 값, 장애 결과, 실제 응답 예시, 참고 소스, 폐쇄망 적용 확인 항목 |
| v1.1 | 2026-11-17 | 응답 code를 폐쇄망 코드 컬럼 VARCHAR2(5 BYTE)에 맞춰 5자 코드(E4000~E5000, R2001~R5030)로 변경. HTTP 500과 결과 INTERNAL_ERROR 코드 분리(E5000·R5000). 예시 재생성 |
| v1.2 | 2026-11-17 | HTTP 오류를 필수 3가지(401·426·결과 API 본문 해석 불가 400)로 줄이고 나머지는 기존 처리기 그대로 허용, 본문·E 코드는 선택으로 정리. HTTP 오류 절(시트)에 샘플 추가. 결과 응답 code 표는 R 코드만 |
| v1.3 | 2026-11-17 | 맨 앞에 백엔드 주요 개발 범위(결과 API HTTP 200 분기: 예외 분류·중복 처리·트랜잭션·다음 후보·장애 결과·응답 형식) 추가. 필수 HTTP 오류를 401·400 두 가지로 줄이고 426은 버전 검증을 쓸 때만 보내는 선택으로 변경. 400은 Spring 기본 동작 확인, 401은 토큰 필터 확인 항목 추가 |
| v1.4 | 2026-11-17 | 참고 소스 절·구현 위치·WPF 처리 설명·트랜잭션 항목 삭제. 응답·요청 예시를 실제 payload 형태(본문 필드 전체 나열, 필수·선택 주석)로 변경, 결과 응답 본문 전체·장애 결과 요청 본문 전체 추가 |
| v1.5 | 2026-11-17 | §4에 RETRYABLE_ERROR 판정 예시(ORA-12170 등 DB 연결·DB 상태·연결 풀·잠금·직렬화·타임아웃 20건, 예외 형식 포함)와 대비용 INTERNAL_ERROR 예시(무결성·데이터·SQL·권한·애플리케이션) 추가 |
