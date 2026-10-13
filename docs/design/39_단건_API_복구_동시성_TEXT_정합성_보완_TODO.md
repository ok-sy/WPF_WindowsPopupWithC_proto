# 39. 단건 API 복구·동시성·TEXT 정합성 보완 TODO

기준일: 2026-10-13 (KST).  
상태: **구현·자동 검증 완료(2026-10-13) · 실제 서버+WPF 화면 확인 대기**. 우선순위: P2 후속 보완.

검토 범위는 `7e7a56fa14d87fdafc8a7c908a802462ad026afb` 포함부터 `76d50e6478ffa41dcc1ab03800d8b59160e9a9e5`까지 5개 커밋이다. TODO35 정상 단건 흐름·TODO37 본문 통합의 후속 보완이다. TODO36 검사 유지 결정과 TODO38 화면 검증은 기존 과제에서 관리한다.

## 연결 및 범위

- Trello: [TODO39 단건 API 복구·동시성·TEXT 정합성 보완](https://trello.com/c/eexcAkJ7), **진행 확정** 목록. TODO 문서가 Git에 반영된 개발 대기 단계이며 구현 완료를 뜻하지 않는다.
- 연계: [TODO35](35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md) / [Trello TODO35](https://trello.com/c/z0xv8TnE), [TODO37](37_TEXT_EDITOR_BODY_통합검토_TODO.md) / [Trello TODO37](https://trello.com/c/M7zvelWc).
- 기존 재전송 정책·API 계약·팝업 유효성 카드의 전체 범위를 복제하지 않고 이번 검토의 구체적인 5개 보완을 관리한다.
- 프로토타입 기준이며 이전 배포 버전 호환·단계적 반영은 추가하지 않는다. TEXT 기존 행 보존은 TODO37이 이미 선택한 조회 시 변환 범위에서 다룬다.
- 최종 장애 복구 정책·다중 PC 허용 정책은 TODO35 미결로 유지한다. 현재 임시 정책의 설명과 코드 정합성을 구분한다.
- 최신 main `804cc00` 기록상 원격 개발 DB 전달 건 DDL 적용은 완료됐다. 실제 서버+WPF 연동과 폐쇄망 반입은 별도 검증이며 DDL 재적용 과제를 만들지 않는다.

## 39-1 큐 파일 읽기 실패 시 다음 조회 보류

대상: `popup-frameWork/Popup/Services/PopupResultQueue.cs`의 `FlushAsync`, `MainWindow.xaml.cs`의 `Blocked` 처리.

현재 큐 파일을 읽거나 보존할 수 없으면 메모리 보관분만 처리한다. 메모리 목록이 비면 마지막에 `Blocked=false`를 반환해 다음 조회를 허용한다. 디스크의 미전송 결과가 없다는 사실을 확인한 것이 아니다.

- [x] 큐 파일 사용 불가를 정상 빈 큐와 구분하고 다음 조회 보류 상태를 반환한다.
- [x] 파일 원본을 보존하며 확정된 메모리 보관분의 전송 가능 여부와 다음 조회 허용 여부를 분리한다.
- [x] 미전송 파일 읽기 실패 + 빈 메모리 큐에서 조회 API 호출 0회를 확인한다. 접근 복구 후 같은 resultId·본문 전송과 정상 빈 큐 조회를 회귀 검증한다.

## 39-2 복구 재전송 후 EMPTY 대기

대상: `MainWindow.xaml.cs`의 `LoadAndShowAvailablePopupsAsync`, `OnPopupFinished`.

닫힘 직후 경로만 EMPTY를 확인한다. 전송 실패 → 복구 타이머 → ACCEPTED/EMPTY에서도 복구 경로는 무조건 즉시 조회한다.

- [x] 복구로 실제 결과를 저장한 경우에도 마지막 저장 응답의 nextStatus를 반영한다.
- [x] EMPTY는 최신 pollingIntervalSeconds 전체 대기, AVAILABLE은 즉시 조회, 후보 확인 실패로 nextStatus 생략이면 즉시 조회를 유지한다. 정상 최초 조회·빈 큐를 임의로 늦추지 않는다.
- [x] 가짜 HTTP로 실패 후 ACCEPTED/EMPTY·DUPLICATE/EMPTY의 즉시 조회 0회와 예약 간격을 확인한다. AVAILABLE·WPF_NEXT_STATUS_UNKNOWN·정상 최초 조회도 검증한다.

## 39-3 TEXT 기존 표시 옵션 조합 보존

**확정 규칙(2026-10-13): 헤더만 보이기.** 기존에 보이던 제목·설명만 본문 문단으로 변환하고 숨겨진 본문은 표시 응답에서 제외한다(`showPlainText=true`로 보냄). 관리자 재저장 시 숨긴 본문이 삭제되는 것을 허용한다. 제목·설명을 숨겼던 행(`showContentHeader=false`)은 기존대로 합치지 않는다.

대상: 서버 `PopupRichText.mergeLegacyHeader`·`PopupContentAssembler`, 웹 TEXT 미리보기·재편집, WPF `TextPopupView`.

재현 데이터: CONTENT_TITLE·DESCRIPTION 존재, `showContentHeader=true`, `showPlainText=false`. 제목·설명을 textBlocks에 합쳐도 false가 유지되어 통합 본문 전체가 숨겨진다. 기존에 보이던 제목·설명이 사라진다.

- [x] 기존 헤더 표시/본문 숨김 조합의 보존 규칙을 구체화한다. 단순 showPlainText=true로 원래 숨긴 본문을 노출하지 않는다.
- [x] 선택한 규칙을 서버 변환과 관리자 재편집·저장에 반영한다. 새 필드·호환 분기는 필요한 범위만 검토한다.
- [x] 헤더 표시/숨김 × 본문 표시/숨김, 제목만·설명만·둘 다, plainText·textBlocks를 검증한다. 파생 plainText 일치, 재조회·재저장 시 중복 문단 없음, 원래 보이던/숨기던 내용의 처리 일치를 확인한다.

## 39-4 결과 커밋과 조회 후보 발급 경합 보호

대상: 서버 `WpfPopupService.getNextPopup`, `WpfResultProcessor.processOne`, 전달 건 매퍼.

재현: 조회 A 후보 목록 확보 → 결과 B가 기존 OPEN 건 완료/유예 및 DONE 커밋 → A가 OPEN 없음 확인 → 오래된 후보 목록으로 같은 팝업 새 OPEN 생성. 기존 건이 DONE이라 OPEN 유니크 인덱스로 막지 못한다. 단일 WPF 정상 순차 흐름 밖의 동시 요청 문제다.

- [x] 조회·결과 처리 공통 직렬화 또는 동등한 방식으로 완료/유예와 발급 사이 경합을 보호한다. 단순 재확인만 추가해 경쟁 구간을 남기지 않는다.
- [x] 노출 기준·잠금 단위·순서·트랜잭션 범위를 검토하고 불필요한 전체 사용자 직렬화와 데드락을 피한다.
- [x] latch/barrier로 위 순서를 재현해 TEXT 완료·VIDEO 미완료 유예 각각에서 새 OPEN 미발급을 확인한다. 동시 조회 OPEN 1건·deliveryId 재사용·다른 사용자 독립 처리도 검증한다. Oracle 실제 커밋 경계 검증을 mock 분기 검사와 구분한다.

## 39-5 동일 결과 동시 제출의 DUPLICATE 판정

대상: 서버 `WpfResultProcessor.processOne`·`requireDelivery`, 영수증·전달 건 매퍼.

재현: 동일 resultId·deliveryId 두 요청이 영수증 없음 확인 통과 → 후발 전달 건 잠금 대기 → 선발 커밋 후 후발은 DONE을 보고 WPF_DELIVERY_COMPLETED로 거절. 순차 재전송은 정상이나 동시 요청 판정이 다르다.

- [x] 잠금 이후에도 같은 결과의 성공 저장 여부를 확인해 후발을 DUPLICATE로 판정한다. 전달 건 결과 ID·영수증 조회 및 MyBatis 로컬 캐시 영향을 검토한다.
- [x] 같은 전달 건에 다른 resultId는 REJECTED/WPF_DELIVERY_COMPLETED를 유지한다. 소유·팝업 일치 검증을 우회하지 않는다.
- [x] Oracle 동시 요청 ACCEPTED 1건 + DUPLICATE 1건, 영수증·답안/완료/표시 횟수 1회 반영을 확인한다. 선발 롤백·응답 유실 후 순차 재전송·다른 resultId와 후속 nextStatus를 검증한다. 본문 비교·보존 기간의 최종 정책은 임의 확정하지 않는다.

## 39-6 문서 상태 및 임시 복구 예외 대조

- [x] TODO37의 TODO35 구현 보류 표기를 현재 정상 흐름 구현·검증대기 상태로 갱신하고 popup 명칭을 맞춘다.
- [x] TODO35에 기존 HTTP 400 실행 중 격리 및 INTERNAL_ERROR 실행당 3회 소진 이후 조회 차단 해제 예외를 임시 동작으로 기록한다.
- [x] 구현 후 TODO35·37·39, README, 인터페이스 계약·MINIMAL/ALL, 예제와 Trello를 대조한다. 계약 변경 시 Excel/Word/PDF도 갱신한다.
- [x] 예외에 따른 차단 해제 뒤 같은 OPEN 재표시·새 resultId·큐 누적 가능성을 임시 정책 검토에 포함한다. 기존 예외를 신규 결함으로 단정하거나 최종 정책으로 승격하지 않는다.

## 39-7 검증 및 완료 기준

- [x] 서버·WPF 관련 회귀 및 새 실패 시나리오별 증거를 남긴다. 정책 예외·서버 동시성·최초 조회를 포함한다.
- [x] 실제 서버+WPF 화면, Oracle 동시성, 폐쇄망 검증의 수행/미실행 상태를 각각 기록한다.
- [ ] Git 코드·이력 반영 후 Trello 검증대기로, 완료 기준 검증 후 완료로 이동한다. TODO 작성만으로 구현·검증을 체크하지 않는다.

## 구현 결과 (2026-10-13)

| 항목 | 구현 | 검증 |
|---|---|---|
| 39-1 | `PopupResultQueue.FlushAsync`가 큐 파일을 읽거나 보존할 수 없으면 메모리 보관분 전송 후에도 `Blocked=true`. 파일 원본은 그대로 | RecoveryTests: 배타 잠금 파일 + 빈 메모리에서 전송 0·조회 보류, 메모리 보관분은 전송하되 보류 유지, 잠금 해제 후 같은 resultId 전송·보류 해제, 정상 빈 큐는 보류 없음, 손상 파일 보존 실패도 보류 |
| 39-2 | `LoadAndShowAvailablePopupsAsync`가 이번에 저장한 결과의 nextStatus=EMPTY면 조회하지 않고 최신 간격 대기. `OnPopupFinished`는 같은 메서드로 위임(닫힘 직후·복구 경로 공통) | BehaviorTests(실제 MainWindow + 가짜 HTTP): 복구 ACCEPTED/EMPTY·DUPLICATE/EMPTY 조회 0회·2700초 예약, AVAILABLE·nextStatus 생략은 즉시 조회, 빈 큐 최초 조회는 바로 조회 |
| 39-3 | `PopupRichText.mergeLegacyHeader`: 헤더 표시 + `showPlainText=false`면 헤더 문단만, 숨긴 본문(plainText·textBlocks) 제외, `showPlainText=true`. 관리자 웹·WPF는 서버 응답을 그대로 써 추가 변경 없음 | `PopupContentAssemblerTest`: plainText·textBlocks 행 각각, 제목만·설명만, 헤더·본문 모두 숨김(미병합·숨김 유지), 헤더·본문 모두 표시, 파생 plainText 일치, 변환된 행 재조회 시 문단 중복 없음 |
| 39-4 | `WpfPopupMapper.lockActiveUser`(APP_USER 행 `FOR UPDATE`)를 조회(`getNextPopup` 시작)와 결과 처리(`processOne` 시작)가 같은 순서로 먼저 잡는다. 사용자 단위 잠금이라 다른 사용자와 독립, 잠금 순서는 사용자 → 전달 건 | `WpfPopupDatabaseTest.queryAndResultAreSerializedPerUserOnOracle`(두 연결, 실제 커밋): 결과 커밋 전 조회가 잠금 대기 → 커밋 후 TEXT 완료·SURVEY 유예 각각 새 OPEN 미발급, 다른 사용자 즉시 처리, 동시 조회 OPEN 1건 재사용. 단위: 조회가 잠금 후 후보 조회 |
| 39-5 | 같은 잠금 뒤에 영수증 확인 → 동시 제출의 뒤 요청은 앞 커밋을 보고 DUPLICATE. 다른 resultId는 기존대로 WPF_DELIVERY_COMPLETED | 같은 Oracle 테스트: ACCEPTED 1 + DUPLICATE 1, 영수증 1건·표시 횟수 1회. 단위: 잠금 → 영수증 순서 |
| 39-6 | 인터페이스 명세(3.7 이력·TEXT 변환·§12.1)·ALL/MINIMAL·popup-frameWork README·TODO35/37 갱신, Word/PDF 재생성. API 필드 계약 변경 없음(Excel 변경 없음). 예외 이후 재표시는 §12.1에 임시 동작으로 기록 | 문서 대조 |

- 서버 `gradlew test --offline --continue`(로컬 XE) 124건 통과·skip 0. WPF BehaviorTests 960건·RecoveryTests 158건 통과(테스트 프로젝트는 .gitignore 대상).
- Oracle 테스트 하네스 주의: MyBatis `commit()`은 쓰기가 없으면 커밋을 건너뛰어 `SELECT … FOR UPDATE` 잠금이 남으므로 테스트는 `commit(true)`를 쓴다(운영은 Spring 트랜잭션 관리자가 커밋).
- 미실행: 원격 개발 환경 새 서버 반영 후 실제 서버+WPF 화면, 원격 DB 동시성, 폐쇄망 반입.

작성 당시 근거와 한계:
- TEXT 변환 실제 메서드를 Java 17로 독립 컴파일·실행해 헤더 병합 후 showPlainText=false 유지를 확인했다. WPF 화면 실행 결과는 아니다.
- 파일 실패·EMPTY 복구·서버 경합은 제어 흐름 검토다. Oracle 실제 동시 실행과 WPF 화면 재현은 미실행이다.
- 검토 범위 JSON 예제 5개·명세 JSON 블록 39개·매퍼 XML 2개·Office 내부 XML 42개 파싱과 git diff --check는 통과했다.
- 서버 120건·WPF BehaviorTests 955건/RecoveryTests 153건 통과는 기존 개발 기록이다. 이번 환경은 Gradle 배포 다운로드 접근 불가·WPF 실행 환경 없음으로 전체 테스트를 재실행하지 못했다.

완료 기준: 위 5개 재현 조건에서 합의한 상태 전이가 성립하고 정상 흐름·데이터 보존·임시 정책 예외가 회귀하지 않으며 문서와 코드가 일치한다.
