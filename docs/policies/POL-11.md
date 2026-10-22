# POL-11 — 조회·노출·스케줄

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-11-01 | 노출 판단 소유 | 활성·기간·대상·완료·숨김·유예·일정·정렬은 서버가 판단한다. WPF는 받은 1건을 표시하며 표시 중 다음 조회를 하지 않는다. 열린 전달이 유효하면 같은 deliveryId를 재사용한다. | displayOrder → createdAt → popupId; 관리자/서버 기준 | 서버 |
| POL-11-02 | 반복의 의미 | 반복은 미완료 팝업의 노출 가능 일정이다. 한 번 완료되면 다음 반복일에도 제외한다. 회차별 응답·회차 키는 추가하지 않는다. HIDDEN은 N일, LATER는 다음 조회 주기까지이며 일정 밖이면 다음 유효 시간대를 기다린다. | FIXED / SCHEDULE; ISO요일 1~7; 시간대 배열 | 서버·관리자 |
| POL-11-03 | 시간 경계 | 서버 KST, 복수 시간대, 자정 초과 허용(시작 요일 기준), 요일 없으면 매일·시간대 없으면 종일. 게시 기간 내에서만 후보가 된다. 정각·2분 표시 보장은 없고 조회 사이 시간대를 놓칠 수 있다. 기전달 결과는 시간대 종료 후에도 수용한다. | 요일·시간대는 WPF 조회 응답에 전달하지 않음 | 서버 일정 SQL |

## 구현·계약 근거

- [PopupDisplaySchedule.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupDisplaySchedule.java)
- [PopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/PopupMapper.xml)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [PopupPollingRecovery.cs](../../popup-frameWork/Popup/Services/PopupPollingRecovery.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [18_popup_display_time_oracle.sql](../../db/oracle/18_popup_display_time_oracle.sql)

## 원본 TODO와 대체 관계

- [TODO19](../design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md): 35: 목록 큐/주기 대체; 영상 UI는 유지.
- [TODO29](../design/29_WPF_목록_API_응답_계약_정리_TODO.md): 35: ROOT userId/serverTime/popups[] 제거; 노출 판단 서버 소유 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- TODO40: 고정 1시간안; 확정 LATER는 TODO52-2 (Git `b2626d7`).
- TODO41: 횟수 제한 미확정; LATER에 자동 적용 금지 (Git `b2626d7`).
- TODO42: 상시 재노출안; 게시 반복 일정과 별개 (Git `b2626d7`).
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.

## 검증 상태·미확정 범위

상시 재노출 제안·나중에 보기 3회 제한·Agent 지연 조회의 미확정 내용을 반복 일정에 혼입하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
