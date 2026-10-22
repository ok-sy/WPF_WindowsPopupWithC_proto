# POL-10 — 전달·결과·중복 처리

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-10-01 | 전달과 제출 식별 | deliveryId는 서버 발급 전달 건, resultId는 클라이언트가 확정 결과 생성 시 만드는 멱등 키다. 재전송은 같은 resultId·본문을 유지한다. 같은 팝업이 새 전달로 재노출될 수 있으므로 popupId와 둘을 합치지 않는다. | popup.deliveryId → 결과 deliveryId | 서버 전달 / WPF 결과 |
| POL-10-02 | 검증·원자성 | 활성 사용자 잠금 → 영수증 중복 확인 → 전달 소유·팝업 일치·종료 검사 → 결과 반영·전달 종료·영수증 기록. 같은 resultId는 재처리 없이 DUPLICATE. 다른 resultId로 이미 끝난 전달 제출은 WPF_DELIVERY_COMPLETED다. | 사용자→전달 건 잠금; 결과 저장 트랜잭션 | 서버·Oracle |
| POL-10-03 | 완료·숨김·연기 | TEXT/IMAGE CLOSED는 완료다. HIDDEN은 hideDays(누락 시 클라이언트 생성 기본 30, 유효 1~3650)의 숨김이다. LATER는 완료·숨김을 변경하지 않고 pollingIntervalSeconds 유예; SURVEY·QUIZ·VIDEO를 완료 없이 닫은 CLOSED와 미완료 VIDEO_WATCHED도 완료·숨김을 변경하지 않고 같은 유예를 받는다(창 닫기·앱 정상 종료 경로 포함). 프로세스 강제종료처럼 결과가 만들어지지 않으면 전달 건이 OPEN으로 남아 유예 없이 다음 조회에서 같은 deliveryId로 다시 내려간다(미완료 닫기와 구분); 버튼 동작은 숨김 체크보다 우선하며 이번 video를 싣지 않는다. VIDEO/QUIZ 완료는 각 조건을 따른다. | CLOSED/HIDDEN/LATER/SUBMITTED/VIDEO_WATCHED | WPF 생성 / 서버 저장 |

## 구현·계약 근거

- [WpfResultProcessor.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfResultProcessor.java)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [PopupResultBuilder.cs](../../popup-frameWork/Popup/Services/PopupResultBuilder.cs)
- [WpfPopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/WpfPopupMapper.xml)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [15_wpf_popup_delivery_oracle.sql](../../db/oracle/15_wpf_popup_delivery_oracle.sql)

## 원본 TODO와 대체 관계

- [TODO12](../design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO33](../design/33_RESULT_응답_score판정값_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO45](../design/45_단건_RESULT_재전송오류_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.

## 검증 상태·미확정 범위

같은 resultId 다른 본문 비교와 보존 기간은 보류다. 현행 무비교 DUPLICATE를 최종 정책으로 승격하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
