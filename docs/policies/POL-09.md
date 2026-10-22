# POL-09 — API 인터페이스 계약

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-09-01 | 3 API 순서 | 로그인 → POST 단건 조회 → 결과 1건 저장 → 필요 시 재조회. 인증 만료는 로그인 재진입 경로를 따른다. 계약 BaseUrl의 /p와 상대 /api/wpf 경로를 구분한다. | auth/login, popups, popups/results | 서버 Controller·WPF API |
| POL-09-02 | 조회 응답 | 매 응답 pollingIntervalSeconds와 popup 객체 또는 명시 null을 준다. userId/serverTime/popups[]/displayOrder/nextStatus를 조회 계약으로 되살리지 않는다. 조회가 전달 건을 만들거나 재사용하므로 POST다. | {pollingIntervalSeconds, popup}; 주기 1800~3600초 | 서버 / WPF 최신 주기 반영 |
| POL-09-03 | 저장 응답 | resultId/status/code/message와 저장 성공 시 nextStatus. AVAILABLE 즉시 조회, EMPTY 주기 대기. 후보 확인 실패는 nextStatus 생략 + WPF_NEXT_STATUS_UNKNOWN이며 저장 실패로 재해석하지 않는다. | ACCEPTED/DUPLICATE/REJECTED/RETRYABLE_ERROR/INTERNAL_ERROR | 서버·WPF |

## 구현·계약 근거

- [WpfPopupController.java](../../zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/WpfPopupController.java)
- [WpfNextPopupResponse.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfNextPopupResponse.java)
- [WpfResultResponse.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfResultResponse.java)
- [WpfNextPopupResponseDto.cs](../../popup-frameWork/Popup/Dtos/WpfNextPopupResponseDto.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)
- 계약/실행 안내: [WPF-01-popup-types.json](../interfaces/examples/WPF-01-popup-types.json)

## 원본 TODO와 대체 관계

- [TODO02](../design/02_목표아키텍처.md): 원본 세부 요건·검증 이력 유지.
- [TODO03](../design/03_WPF_API_설계.md): 12·18·29~35: 최초 목록/일괄 API 대체.
- [TODO04](../design/04_인증설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO10](../design/10_WPF_SSO_토큰_프로토타입_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO29](../design/29_WPF_목록_API_응답_계약_정리_TODO.md): 35: ROOT userId/serverTime/popups[] 제거; 노출 판단 서버 소유 유지.
- [TODO30](../design/30_Footer_Action_최상위_계약_TODO.md): 35: popups[]→popup; 푸터 역할 유지.
- [TODO31](../design/31_PopupWindow_공통_UI_옵션_최상위_계약_TODO.md): 35 단건화·57 폐기 옵션·68 최소 크기 후속 반영.
- [TODO32](../design/32_RESULT_responseStartedAt_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO33](../design/33_RESULT_응답_score판정값_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO34](../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md): 35 단건 결과; 복구 최종값은45 보류.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO46](../design/46_API_WPF_관리자웹_계약통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

Word/PDF/Excel은 별도 생성 산출물이며 2026-10-22 현행 v3.7 보완까지 동기화했다. 이후 계약 변경 시 함께 갱신하고 미동기화는 충돌표에서 추적한다. 통합 토큰의 실제 발급·검증은 담당 팀 범위다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
