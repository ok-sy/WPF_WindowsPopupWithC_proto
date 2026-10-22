# POL-12 — 오류·복구·동시성

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-12-01 | 종결과 보관 | 요청 resultId와 일치하는 ACCEPTED/DUPLICATE/REJECTED만 큐에서 제거한다. 미종결·응답 유실·다른 ID 응답은 같은 결과를 보관한다. 큐 파일을 읽거나 보존할 수 없으면 빈 큐로 간주하지 않는다. | 상태와 HTTP 오류를 별개로 처리 | WPF |
| POL-12-02 | 현행 임시 복구 | 디스크 큐, 저장 순서 단건 전송, 결과 우선·미종결 조회 보류. HTTP400은 실행 중 격리하고 파일 보존, INTERNAL_ERROR는 실행당 3회. 재시도/보존 최종 선택은 TODO45 보류다. | 현행 동작 설명이며 신규 확정값 아님 | WPF |
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

400 격리·3회 상한·보존기간·본문 비교·다중 PC 최종 정책, 종료 시 메모리 보관분 유실 개선은 미결로 유지한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
