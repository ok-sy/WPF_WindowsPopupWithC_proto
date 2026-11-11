# 45. 단건 RESULT 재전송과 오류 분류 후속 정책 검증 TODO

기준일: 2026-10-13 (KST).  
상태: **진행중 · 2026-11-11 통합 복구 주기·결과 우선(A안) 확정, 예외 정책 및 코드 반영·실환경 검증 대기**.

Trello: [TODO45 단건 RESULT 재전송과 오류 분류 후속 정책 검증](https://trello.com/c/SJnAYy3F/51-%EC%A0%95%EC%B1%85-%EA%B5%AC%EC%B2%B4%ED%99%94-result-%EC%9E%AC%EC%A0%84%EC%86%A1%ED%95%AD%EB%AA%A9%EB%B3%84-%EC%98%A4%EB%A5%98-%EB%B6%84%EB%A5%98). 원본 목록: 진행 프로세스 구체화 완료. Git 반영 후 진행 확정 목록으로 이동한다.

## 범위와 기존 과제 구분

TODO34·35·39에서 구현한 결과 상태·큐·복구를 다시 구현하는 과제가 아니다. 단건 전환 후 남은 최종 장애 정책 결정과 실제 서버·WPF 오류 분기 증거를 관리한다.

이번 반영은 TODO 문서와 카드 관리만 수행한다. 코드 변경·새 DB 적용·환경 배포·테스트 실행은 포함하지 않는다. 원본 카드의 아이디어/보류 표기는 제안 당시 이력이며 현재는 구체화·검토 착수를 진행 확정으로 관리한다. 숫자·필드·정책 선택이 필요한 항목은 아래에서 결정한다.

## 작업 목록

- [x] 45-1 HTTP 오류/네트워크·타임아웃과 HTTP 2xx의 status/code를 최신 단건 계약으로 대조한다. results[] 배치 계약을 전제로 하지 않는다.
- [x] 45-2 ACCEPTED/DUPLICATE·REJECTED·RETRYABLE_ERROR/INTERNAL_ERROR별 큐 종결·보존·재시도·조회 진행 기준을 확인한다.
- [ ] **보류** 45-3 HTTP400 실행중 격리, INTERNAL_ERROR 실행당3회 소진 뒤 조회 허용 등 현재 임시 예외를 최종 정책으로 채택/변경할지 결정한다. 기간·횟수·간격·보존기간을 임의 확정하지 않는다.
- [x] **정책 결정** 45-4 결과 우선(A안): 복구 대상 미종결 결과가 남으면 결과 재전송을 우선하고 다음 단건 팝업 조회를 보류한다. 단건 순차·메모리 전용·종료 시 유실 수용은 기존 결정 유지. **코드·실환경 정합성은 별도 미완료**.
- [x] 45-5 저장 성공·후보 확인 실패(WPF_NEXT_STATUS_UNKNOWN), 응답 유실·중복 제출·같은 ID 다른 본문 및 유예시각 미연장의 정책/검증 범위를 구분한다.
- [ ] 45-6 실제 서버와 WPF에서401·426·5xx·업무 오류의 분기/로그/메모리 큐 보관·소멸을 확인한다. TODO39 자동검증 완료 항목은 그 증거를 재사용하고 실환경 미확인만 보완한다.
- [ ] 45-7 코드·명세·예제·Excel·Word/PDF의 최신 code/message와 동작을 대조하고 결정·구현·실행검증 상태를 각각 기록한다. — 2026-11-03 대조: code/message 대조 자체는 2026-10-17 완료, 45-6 실환경 실행 뒤 상태 기록하고 닫음.
  - 2026-10-17(TODO53-1·53-2): 서버 Java code 상수와 계약서 code 표를 대조하고 Excel RESULT_RESPONSE·Word/PDF를 같은 기준으로 동기화. 45-3·45-4 정책 결정과 실서버 실행 검증(45-6)이 남아 열린 상태 유지.

## 결정 (2026-10-13)

- 45-3·45-4의 **2026-10-13 당시 기록**: 디스크 큐를 포함한 당시 동작은 임시 기준이었고 최종 정책을 보류했다. 이후 2026-10-28 메모리 전용으로 변경했으며 2026-11-11에는 결과 우선(A안)·복구 주기를 확정했다. HTTP 400 격리·INTERNAL_ERROR 3회 예외는 여전히 미결이다.
- 같은 resultId 다른 본문 판정·보존 기간(45-5 정책 부분)도 같은 보류 대상이다(현재: 본문 비교 없이 DUPLICATE, 보존 기간 없음).

## 결정 (2026-11-11) — 확정 정책과 미결 예외

- **확정: A안 결과 전송 우선.** 복구 대상 결과 전송 장애(HTTP 401 재인증 실패, 5xx, 응답 없음·타임아웃, RETRYABLE_ERROR, 재시도 대상 INTERNAL_ERROR 등)에서는 미처리 결과를 메모리에 유지하고 **다음 단건 팝업 조회를 보류**한다. 같은 resultId·deliveryId·본문으로 재전송하며 종결 후 다음 조회 흐름을 재개한다. 정상 저장 응답 ACCEPTED/DUPLICATE에서 nextStatus=AVAILABLE은 즉시 조회, EMPTY는 정상 간격 대기, nextStatus 생략은 즉시 조회한다. REJECTED는 종결로 처리한다. nextStatus 누락만으로 장애를 판정하지 않는다.
- **확정: 통합 복구 주기.** 로그인 실패와 조회·결과 전송의 401 재인증 1회 실패를 포함한 복구 대상 장애는 10초 간격 3회 × 최대 5사이클, 사이클 간 30분(현행 타이머 계산은 30분+10초), 소진 뒤 60분마다 1회 재시도한다. **60분 뒤 5사이클을 다시 시작하지 않는다.** 복구 성공 시 횟수를 초기화한다. HTTP 400·426 등 복구 비대상 오류는 기존 별도 처리한다.
- **현행과의 차이(구현 대기):** `MainWindow.LoadAndShowAvailablePopupsAsync()`의 조회 401 재인증 실패는 현재 정상 폴링 간격으로 돌아가므로 통합 복구 진입으로 변경해야 한다. 로그인 실패 경로와 결과 전송 401 실패 경로도 통합 주기 적용 여부를 코드·테스트로 확인해야 한다. `PopupPollingRecovery.NextDelay()`의 주기 자체는 변경하지 않는다.
- **미결(45-3):** HTTP 400 결과 격리 후 조회 허용, INTERNAL_ERROR resultId별 실행당 3회 상한 및 소진 후 조회 허용은 **현행 임시 예외**로 유지한다. A안 확정만으로 예외를 폐지하거나 무한 재시도로 바꾸지 않는다. 보존 기간·같은 resultId 다른 본문 비교 등 기존 미결도 유지한다.
- **검증 상태:** 이번 결정은 정책·TODO 문서만 반영한다. WPF·서버·DB 코드 변경 없음, 빌드·자동 테스트·로컬 실행·원격 DB·폐쇄망 실화면 검증 미실행.

### 구현 시 확인할 사항 (별도 승인 후)

- `popup-frameWork/Popup/MainWindow.xaml.cs`의 `LoadAndShowAvailablePopupsAsync()`와 로그인 시작·재로그인 경로: 401 1회 재인증 실패 또는 로그인 실패 시 통합 복구 타이머 예약, 중복 타이머·무한 즉시 재시도 방지, 인증 회복 후 정상 조회 확인.
- `popup-frameWork/Popup/Services/PopupApiService.cs`의 `SendWithAuthAsync()`, `PopupResultQueue.cs`의 `FlushAsync()`·`Settle()`: 결과 전송 401 실패 후 동일 resultId 유지·큐 보관·조회 보류, 400 격리·INTERNAL_ERROR 상한 임시 예외 유지 여부 확인.
- `popup-frameWork/Popup/Services/PopupPollingRecovery.cs`의 `NextDelay()`·`Reset()`: 10초 3회×5사이클, 사이클 간 30분+10초, 소진 후 60분 1회, 성공 초기화 회귀 검증. 주기 자체 수정 불필요.
- API 계약/서버·DB: 이번 결정으로 필드·상태·DB 스키마 변경 없음. 결과 저장 멱등성과 nextStatus(저장 성공 후에만 제공) 기존 계약 유지. 구버전 Agent는 새 인증 복구 정책 미적용 상태로 남으므로 배포 버전별 동작을 구분한다.
- 완료 기준: 인증·조회·결과 전송의 복구 대상 오류에 통합 주기 적용, 복구 중 조회 보류 및 종결 후 재개, 400/426 별도 처리와 미결 예외의 보존을 자동 테스트로 확인하고 실환경 검증 여부를 별도 기록한다.

## 검증 결과 (2026-10-13)

실환경: 이 PC의 새 서버(local 프로파일, 프로토타입 로그인) + **원격 개발 DB(11g XE)** + 실제 WPF exe(API 모드, 가짜 SSO). 테스트 사용자 E1002·E1003만 쓰고 끝난 뒤 해당 기록과 게시 상태를 정리했다(잔여 0). 원격 개발 서버 배포는 하지 않았다.

| 항목 | 결과 | 근거 |
|---|---|---|
| 45-1 | HTTP 401(잘못된 토큰, WPF_UNAUTHORIZED)·426(최소 버전 미만)·400(배열 본문, WPF_BAD_REQUEST)과 HTTP 200의 REJECTED(WPF_INVALID_RESULT·WPF_INVALID_DELIVERY·WPF_DELIVERY_COMPLETED)·ACCEPTED·DUPLICATE가 단건 계약대로 응답 | 실환경 HTTP. 5xx·타임아웃·연결 끊김은 RecoveryTests(가짜 HTTP)로 확인, 실환경 장애 유발은 미실행 |
| 45-2 | ACCEPTED·DUPLICATE·REJECTED는 큐에서 제거(종결), RETRYABLE_ERROR·INTERNAL_ERROR(상한 전)·응답 없음·다른 resultId 응답은 보관 후 조회 보류, 400은 실행 중 격리 후 진행, 저장 결과의 nextStatus로 조회 진행(AVAILABLE 즉시·EMPTY 대기·생략 즉시) | RecoveryTests 158건·BehaviorTests 960건(TODO39), 실환경 ACCEPTED/AVAILABLE→다음 팝업 표시 |
| 45-5 | 저장 성공·후보 확인 실패는 status=ACCEPTED·nextStatus 생략·WPF_NEXT_STATUS_UNKNOWN(EMPTY 아님, 즉시 조회) / 응답 유실 후 재조회는 같은 deliveryId / 같은 resultId 재전송은 DUPLICATE(+nextStatus)이며 종료된 전달 건 오류로 판정하지 않음 / DUPLICATE는 처리 전에 반환되어 재노출 유예 시각을 연장하지 않음 / 같은 resultId 다른 본문은 정책 보류 | 서버 단위 테스트, 실환경 HTTP(재조회 deliveryId 동일, DUPLICATE+AVAILABLE, 다른 resultId WPF_DELIVERY_COMPLETED) |
| 45-6 | 실환경 HTTP로 401·426·400·업무 오류 분기와 API_REQUEST_LOG 기록 확인. 실제 WPF로 표시→닫기→결과 저장(TEXT 완료)→다음 팝업, 표시 중 조회 없음(요청 로그) 확인 | **남음**: 실제 WPF에서 401 재로그인·426 안내·5xx 복구 화면, 큐 파일 복원·삭제의 실화면 확인 |
| 45-7 | TODO46 계약 대조와 함께 정리 | TODO46 참조 |
## 완료 기준

최종 장애 결정값과 현재 임시 예외의 처리 여부가 명시되고 단건 결과 상태와 큐/조회 동작이 실제 연동 증거와 일치한다.

구현한 부분과 자동검증·실제 화면/원격 환경 확인을 구분하여 변경 이력과 Trello에 근거를 남긴다. 체크되지 않은 작업은 완료로 표시하지 않는다.
