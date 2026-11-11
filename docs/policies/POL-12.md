# POL-12 — 오류·복구·동시성

기준일: 2026-11-11 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-12-01 | 종결과 보관 | 요청 resultId와 일치하는 ACCEPTED/DUPLICATE/REJECTED만 큐에서 제거한다. 미종결·응답 유실·다른 ID 응답은 같은 결과를 보관한다. 보관은 실행 중 메모리에만 하며 프로세스 종료 시 미전송 결과 유실을 수용한다(2026-10-28 결정, 2026-11-03 구현). | 상태와 HTTP 오류를 별개로 처리 | WPF |
| POL-12-02 | 결과 전송 우선(A안) 확정 | 결과 전송 중 복구 대상 장애로 미종결 결과가 남으면 메모리 큐에서 동일 resultId로 순차 재전송하고 다음 단건 팝업 조회를 보류한다. 종결(ACCEPTED/DUPLICATE/REJECTED) 후 조회 흐름을 재개한다. HTTP 400 실행 중 격리 및 INTERNAL_ERROR 실행당 3회 소진 후 조회 허용은 **현행 임시 예외**로서 TODO45 별도 결정 대상이다. HTTP 2xx인데 응답 내용이 잘못된 경우(빈 본문·JSON 오류·resultId 불일치·status 누락/미지원 값)는 복구 무한 루프를 막기 위해 같은 resultId를 실행당 3회까지만 재전송하고 이후 보관한 채 조회를 허용한다(2026-11-11 확정). 응답 없음·5xx·401·RETRYABLE_ERROR는 이 상한 없이 통합 복구 주기를 따른다. | 결과 우선·조회 보류 원칙 확정 / 예외는 미확정 | WPF |
| POL-12-04 | 통합 복구 주기 확정 | 로그인 실패 및 팝업 조회·결과 전송의 401 재인증 1회 실패, 복구 대상 서버·통신 장애에 동일한 복구 간격을 적용한다. 10초 간격 3회 × 최대 3사이클(총 9회), 사이클 사이 30분 대기(현행 계산은 30분+10초), 소진 뒤 60분마다 1회 재시도하며 복구 성공 시 초기화한다. 60분 후 전체 사이클을 재시작하지 않는다. | HTTP 400·426은 일반 복구 대상 제외(403 포함). 401·로그인 실패 복구 진입은 2026-11-11 WPF 반영(`PopupPollingRecovery.IsRecoverable`), 실환경 검증은 TODO45 추적 | WPF |
| POL-12-03 | 진행 단위 | 사번 단위 OPEN 최대 1건과 사용자→전달 건 잠금을 유지한다. 여러 PC는 현재 같은 OPEN 전달을 받을 수 있고 선행 결과가 반영된다. 다중 PC 동시 표시 허용 정책은 별도 보류다. | 기기/세션 진행 단위로 임의 변경 금지 | 서버·Oracle |

## 구현·계약 근거

- [PopupResultQueue.cs](../../popup-frameWork/Popup/Services/PopupResultQueue.cs)
- [PopupPollingRecovery.cs](../../popup-frameWork/Popup/Services/PopupPollingRecovery.cs)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [WpfResultProcessor.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfResultProcessor.java)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO34](../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md): 35 단건 결과; 복구 최종값은45 보류.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO45](../design/45_단건_RESULT_재전송오류_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

2026-11-11 확정: 통합 복구 주기 및 결과 전송 우선(A안). 미결: HTTP 400 격리, INTERNAL_ERROR 3회 상한과 조회 허용 예외, 본문 비교·다중 PC. 종료 시 메모리 큐 유실은 기존 수용 정책을 유지한다. **코드 반영(2026-11-11):** 최대 3사이클, 조회 401 재인증 실패(로그인 실패 포함)의 통합 복구 진입, 결과 저장 성공 시(nextStatus 무관) 횟수 초기화 후 조회 실패를 별도로 세는 단계 분리를 WPF에 반영하고 자동 테스트로 확인했다. 인증 복구·결과 전송의 실환경 검증은 수행하지 않았다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
