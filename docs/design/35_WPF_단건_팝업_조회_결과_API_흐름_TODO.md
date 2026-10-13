# 35. 단건 팝업 조회·결과 수신 API 흐름 TODO

기준일: 2026-10-13 (KST).  
상태: **진행중 · 정상 흐름 구현 완료(2026-10-13), 장애 복구 정책 결정 대기 · 원격 개발 DB DDL 적용 완료**.

2026-10-13: 진행협의중에서 진행중으로 전환한다. 정상 API 흐름 개발을 진행하며, 아직 선택값이 전달되지 않은 장애 복구 세부 정책은 §4에서 별도로 관리한다.

이 문서는 로그인, 조회, 결과 수신을 분리한 진행 확정 요건이다. 2026-10-13 docs/interfaces/popup_api_proposal_v0.3.docx(제안 0.3)와 아래 §7 결정값으로 정상 흐름을 구현했다. 확정된 정상 흐름과 회의 결정 대기 항목을 분리한다.

## Trello 연결

- 목록: **진행중** (2026-10-13 전환).
- 카드: [목록 조회,결과저장,결과수신 세단계](https://trello.com/c/z0xv8TnE).
- 카드 제목과 별개로 현재 합의한 세 API는 **로그인·조회·결과 수신**이다. 결과 저장은 결과 수신 API의 책임이며 별도 네 번째 API를 뜻하지 않는다.
- 정상 흐름 합의와 장애 복구 정책 보류를 구분하며, 카드 연결만으로 구현 완료 또는 모든 정책 확정으로 표시하지 않는다.

## 1. 확정된 API 구성

| 순서 | API | 책임 |
|---|---|---|
| 1 | 로그인 | SSO 사용자 정보를 인증하고 토큰 발급 |
| 2 | 팝업 조회 | 현재 표시 조건을 만족하는 팝업 최대 1건 조회 |
| 3 | 결과 수신 | 현재 표시한 팝업 결과 1건 저장 |

정상 흐름은 로그인 → 조회 → 표시/사용자 처리 → 결과 수신 → 조회다. 토큰 만료 시 로그인한 뒤 실패한 API를 재호출한다. 결과 수신이 만료로 실패했다면 조회부터 다시 시작하지 말고 해당 결과를 보존해 결과 수신을 재시도한다.

## 2. 조회 API 응답

- [x] 조회는 배열이 아닌 단일 팝업 객체 또는 null을 반환한다. → `POST /p/api/wpf/popups` 응답 `popup`(제안 0.3에서 nextPopup → popup)
- [x] pollingIntervalSeconds를 매 조회 응답마다 반환한다. 첫 조회, 결과 수신 후 조회, 빈 결과 후 재조회에 적용하고 클라이언트는 최신 값을 반영한다.
- [x] 조회 응답에서 nextStatus를 제거한다. 성공 응답의 단일 popup 값으로 구분한다. 객체이면 표시하고 null이면 폴링 간격 후 다시 조회한다.
- [x] 조회 오류는 정상적인 null과 구분하여 HTTP/API 오류로 처리한다. → 오류는 기존 HTTP 오류·복구 조회, popup=null만 정상 빈 응답
- [x] 인증 토큰이 사용자 식별을 제공한다면 조회 요청·응답에서 불필요한 userId를 전달하지 않는다. → 응답 serverTime·userId 삭제, 요청 본문 {}
- [x] C# 조회 DTO는 List<PopupDto>가 아닌 단일 PopupDto? 속성으로 정의한다. → `WpfNextPopupResponseDto.Popup`
- [x] 기존 공통·유형별 팝업 필드를 popup 한 개 구조에 매핑하고 JSON 예시, Excel 정의서, Markdown 및 Word 정의서를 함께 갱신한다. → popup 맨 앞 `deliveryId` 추가, `displayOrder` 삭제(서버 정렬 전용)

응답 예시: { "pollingIntervalSeconds": 1800, "popup": null } — popup 키는 null이어도 항상 보낸다.

## 3. 결과 수신 응답의 다음 대상 상태

- [x] 결과 저장 상태와 다음 대상 상태를 별도로 표현한다. 기존 결과 처리 status는 저장·처리 상태이며, nextStatus는 후속 팝업 후보 유무다.
- [x] 결과 저장 후 현재 게시·기간·대상·완료 조건에 맞는 후보를 확인하고, 없으면 nextStatus=EMPTY, 있으면 AVAILABLE을 반환한다. → 조회와 같은 SQL 조각(`eligiblePopupCte`)에 `ROWNUM = 1`로 존재만 확인(COUNT 전체 집계·콘텐츠 조회 없음)
- [x] EMPTY이면 클라이언트는 조회 API를 즉시 호출하지 않고 가장 최근 pollingIntervalSeconds까지 대기한다.
- [x] AVAILABLE이면 클라이언트가 조회 API를 즉시 호출하여 팝업 단건 객체를 받는다. 결과 수신 응답에 팝업 콘텐츠를 중복해서 포함하지 않는다.
- [x] 결과 저장은 성공했으나 다음 후보 확인이 실패한 경우를 EMPTY로 오인하지 않도록 오류 계약과 클라이언트 동작을 정한다. → status=ACCEPTED, nextStatus 생략, code=WPF_NEXT_STATUS_UNKNOWN. 클라이언트는 즉시 조회(popup=null 정상 처리)
- [x] 후보 확인과 실제 조회 사이 게시 중단·기간 만료·대상 변경이 있을 수 있으므로, 조회 API는 후보 유효성을 다시 확인하고 null을 정상 처리한다.
- [x] nextStatus 적용에 따라 결과 응답 DTO·예시·Excel의 RESULT_RESPONSE 및 API 계약 문서를 갱신한다.

응답 예시: { "resultId": "RESULT-001", "status": "ACCEPTED", "nextStatus": "EMPTY" }

status는 기존 RESULT 계약(ACCEPTED·DUPLICATE·REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR)을 그대로 쓴다(제안 예시의 SAVED는 쓰지 않음). nextStatus는 ACCEPTED·DUPLICATE일 때만 있다.

## 4. 장애 복구 — 세부 결정값 확인 필요

다음 항목은 의사결정 전까지 구현 계약으로 확정하지 않는다. 정상 흐름 구현에 동작 하나는 필요해 **임시 기준**을 두었으며(§7), 결정되면 바꾼다.

- [ ] 미전송 결과가 여러 건일 때 단건 순차 재전송 또는 일괄 전송 여부. → 임시: 단건 순차 재전송(저장 순서). 일괄 전송 API는 만들지 않음
- [ ] 미전송 결과가 남아 있을 때 먼저 결과를 처리한 뒤 다음 팝업을 조회할지, 결과를 보관하고 팝업 진행을 허용할지. → 임시: 결과 우선. 미종결 결과가 남으면 조회하지 않고 복구 간격(10초×3…) 뒤 재시도. 변경 지점은 `MainWindow.LoadAndShowAvailablePopupsAsync`·`OnPopupFinished`의 `Blocked` 분기
- [ ] 결과를 메모리에만 보관할 경우 앱 종료·PC 재부팅 때 유실을 허용할지, 디스크에 영속 보관할지. → 임시: 기존 디스크 대기열(`%LOCALAPPDATA%\Popup\pending-results.json`) 유지
- [x] 결과 저장 성공과 후보 확인 실패를 응답에서 어떻게 구분하고 이후 어떤 API부터 재호출할지. → §3
- [ ] 중복 제출 시 같은 결과로 판정할 식별자·본문 기준과 보존 기간을 기존 resultId·deliveryId 계약에 매핑한다. → 현재: 같은 resultId는 DUPLICATE(본문 비교 없음, 제안의 RESULT_ID_CONFLICT 미적용), 같은 deliveryId에 다른 resultId는 REJECTED `WPF_DELIVERY_COMPLETED`. 보존 기간 미정

일괄 전송을 선택하면 정상 단건 요청과 별도로 배열 요청 및 항목별 처리 결과 계약이 필요하다. 이번 정상 흐름의 단건 응답에 이를 미리 섞지 않는다.

### 2026-10-13 착수 전 확인(구현 전 기록)

현행 코드 대조 당시 서버·WPF 모두 목록(popups[])·배치 결과(results[] 최대 50건)·디스크 대기열 구조였다. 닫기(CLOSED)는 완료·숨김으로 기록되지 않아 단건 흐름에서는 같은 팝업이 반복 조회될 수 있었고, 클라이언트가 실행 중 표시한 팝업 ID(`_shownPopupIds`)로 막고 있었다. 이 재노출 기준은 §7 결정으로 해소했고 `_shownPopupIds`는 삭제했다.

## 5. 서버·클라이언트 정합성 검토

- [x] 후보 확인은 결과 저장(REQUIRES_NEW 커밋) 뒤 실행하고, 저장된 결과를 다시 제출하지 않으면서 다음 대상 상태를 알려준다.
- [ ] 빈 후보면 즉시 별도 조회하는 HTTP 왕복·서버 처리 단계를 줄이는 효과를 측정한다. → 미측정
- [x] 후보 확인 및 조회가 동일한 사용자·게시·기간·완료·숨김·재노출 유예 기준을 사용하도록 확인한다. → 같은 SQL 조각
- [x] 동시에 여러 조회가 와도 한 사용자에게 중복 OPEN 전달 건이 생성되지 않는다. → 함수 기반 유니크 인덱스, 위반 시 먼저 생긴 전달 건 재사용
- [ ] 다중 PC 허용 여부에 따라 진행 단위가 사용자, 장치 또는 세션 중 무엇인지 확정한다. → 현재 사용자 단위(사용자당 OPEN 1건). 다중 PC 정책 미정
- [x] 결과 응답 유실·중복 제출·조회 유실·EMPTY 폴링·AVAILABLE 후 게시중단 시나리오를 계약 테스트로 검증한다. → §7 검증. 401 재인증은 기존 RecoveryTests(POST 재전송)로 확인
- [x] 실제 URL, 토큰 재발급 계약, resultId/deliveryId 사용처, 현재 RESULT_REQUEST 필드, HTTP 및 업무 오류 코드를 기존 서버 구현과 대조한다. → 기존 경로·필드 유지, deliveryId만 추가

## 6. 완료 기준

- 세 API의 책임과 정상 호출 순서가 서버 계약, C# DTO, Excel/Word/Markdown 정의서 및 샘플 JSON에 일치한다.
- 조회 응답에는 pollingIntervalSeconds와 팝업 단건/null만 있고 userId·nextStatus·팝업 목록이 없다.
- 결과 수신 응답은 저장 처리 status와 후속 후보 nextStatus를 구분한다.
- 회의 미결 항목은 결정 전 확정 계약으로 문서화하지 않고 임시 기준·보류로 남긴다.
- 서버·클라이언트·샘플 테스트에서 정상 단건 흐름과 오류·재시도를 검증한다.

## 7. 구현 결과 (2026-10-13)

### 결정값

| 항목 | 결정 |
|---|---|
| 기준 문서 | `docs/interfaces/popup_api_proposal_v0.3.docx`(제안 0.3) |
| 조회 경로 | 새 경로 없이 기존 경로를 `POST /p/api/wpf/popups`로 교체(전달 건 생성·재사용). 이전 GET 목록은 삭제, 하위 호환 없음 |
| 전달 건 | 포함. `WPF_POPUP_DELIVERY` 신설(`db/oracle/15_wpf_popup_delivery_oracle.sql`, `01` §12) |
| 결과 요청 필드 | 기존 필드명 유지(resultType 4종·closedAt·hideDays·video·score/passed) + `deliveryId`. 제안의 action·completedAt 미사용. 요청 = 결과 1건(이전 envelope·results[] 삭제) |
| 일반 안내 닫기 | TEXT·IMAGE의 CLOSE·LINK_AND_CLOSE(CLOSED)는 결과 저장 시 완료 처리 → 이후 조회 제외 |
| 설문·퀴즈·영상 | 기존 제출·통과·시청 완료 조건 유지 |
| 미완료 결과 재노출 | 완료 처리하지 않는다. 결과를 정상 저장한 시각부터 pollingIntervalSeconds 동안 사용자·팝업 단위로 유예(`DEFER_UNTIL_AT`). 조회와 nextStatus 후보 판정에 같은 조건. 다른 후보는 계속 진행, 유예 후 조건을 만족하면 다시 표시 |
| nextStatus | 완료·숨김·유예로 방금 저장한 팝업이 제외된 후보 기준 |
| 대기 시간 | popup=null·EMPTY 뒤 가장 최근 pollingIntervalSeconds(30~60분) 전체 대기. 기동 시점 기준 경계 정렬은 없앰 |

### 변경

- 서버: `WpfPopupController`(POST 조회, 결과 1건), `WpfPopupService.getNextPopup`(OPEN 전달 건 재사용·만료·생성, 고른 1건만 문항 조회)·`processResult`(nextStatus), `WpfResultProcessor`(전달 건 소유·팝업 일치·미종료 검증 → 처리 → 전달 건 종료·유예 기록, TEXT·IMAGE CLOSED 완료), `PopupMapper.xml`(`eligiblePopupCte` 조각 분리, 유예 제외, `countAvailablePopups`), `WpfPopupMapper.xml`(전달 건 구문), DTO(`WpfNextPopupResponse`, 단건 `WpfResultResponse`, `WpfPopupItem.deliveryId`·displayOrder 삭제, `WpfResultRequest` 단건). 새 거절 코드 `WPF_INVALID_DELIVERY`·`WPF_DELIVERY_COMPLETED`, 후보 확인 실패 `WPF_NEXT_STATUS_UNKNOWN`.
- WPF: `IPopupGateway.GetNextPopupAsync`·`PostResultAsync`, `PopupApiService`, `PopupResultQueue.FlushAsync`(저장 순서 1건씩, 미종결에서 멈춤 → `ResultFlushOutcome`), `MainWindow`(1건 표시 → 닫힘 → 결과 → nextStatus, 표시 중 조회 금지, `_shownPopupIds` 삭제), `PopupResultBuilder`·`PopupOptions`·`PopupFactory`(deliveryId 전달), Demo 게이트웨이·Demo 화면 단건 흐름.
- 문서: 인터페이스 명세·예제 JSON·Excel 정의서·Word/PDF, DB README.

### 검증

- 서버 `gradlew test --offline`(로컬 XE, `POPUP_TEST_DB_PASSWORD` 설정) 120건 통과·skip 0: 단위(전달 건 생성·재사용·만료·동시 조회, nextStatus·후보 확인 실패, 거절 코드, 전달 건 검증, TEXT·IMAGE 닫기 완료), 실DB 롤백 테스트(TEXT 닫기 완료 → 영상 미완료 닫기 유예 1800초 → QUIZ → SURVEY → EMPTY → popup=null, 다른 사용자 전달 건 거절), 실서버 HTTP 통합 테스트(POST 단건 조회·재사용, 결과 1건 순차·DUPLICATE·popup=null·영수증·전달 건·요청 로그 커밋).
- WPF BehaviorTests 955건: 실제 `MainWindow`를 가짜 HTTP 서버에 연결해 1건 표시 → 닫힘 → deliveryId 포함 결과 → AVAILABLE 즉시 다음 조회 → EMPTY 2700초 대기, 결과 전송 실패 시 조회 보류·10초 복구 예약 확인. RecoveryTests 153건(POST 401 재전송, 순차 전송·미종결 멈춤·400 격리·INTERNAL_ERROR 상한).
- 원격 개발 DB(11g XE, ZERO-RULE)에 15 스크립트 적용 완료(2026-10-13, 테이블·인덱스 생성, 행 0).
- 미실행: 원격 개발 DB에 새 서버 반영 후 실제 서버+WPF 화면 연동, 폐쇄망 반입.