# POL-08 — 관리자 미리보기

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-08-01 | 공통 렌더러 | 우측 인라인과 실제 크기 모달은 PopupPreview를 공유한다. 입력 popup 객체를 변경하지 않고 저장·조회 API에 의존하지 않는다. | AdminPopupDetail; onOpenPreview/onClose | 웹 |
| POL-08-02 | 미리보기 상태 | 답변·채점·시청 비율 시연 상태는 각 미리보기 내부에 있다. 편집 데이터나 결과 전송에 섞지 않는다. 모달 언마운트 시 시연 상태를 초기화한다. | 두 미리보기 간 시연 상태 독립 | 웹 |
| POL-08-03 | Dialog 호환 | BackdropProps→slotProps.backdrop, PaperProps→slotProps.paper(소문자). 공통 slotProps 안에 두 설정을 합치며 FULLSCREEN paper 분기를 유지한다. 저장소 MUI와 폐쇄망 설치 버전을 별도로 확인한다. | 저장소 선언 ^6.4.1 / lock 6.5.0; 최소 300 | 웹 MUI |

## 구현·계약 근거

- [InlinePopupPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview.tsx)
- [PopupPreviewDialog.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreviewDialog.tsx)
- [PopupPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview.tsx)
- [popupPreviewDialogLayout.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupPreviewDialogLayout.ts)

- 계약/실행 안내: [ADMIN_POPUP_PREVIEW_COMPONENTS.md](../interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md)
- 계약/실행 안내: [POPUP_PREVIEW_WPF_PARITY.md](../reviews/POPUP_PREVIEW_WPF_PARITY.md)

## 원본 TODO와 대체 관계

- [TODO22](../design/22_WEB_SURVEY_QUIZ_UI.md): 원본 세부 요건·검증 이력 유지.
- [TODO60](../design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO61](../design/61_관리자_미리보기_컴포넌트화_TODO.md): 69: 공통 폴더 이동; 두 미리보기 API 유지.
- [TODO67](../design/67_MUIdeprecated속성_미리보기호환검증_TODO.md): 69: 공통 폴더 이동; slotProps 전환 유지.
- [TODO68](../design/68_팝업최소크기_300x300_공통화_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

브라우저 Esc 종료는 미리보기 UX이며 WPF 일반 팝업 Esc 계약과 다르다. 실제 관리자 화면·폐쇄망 CSS·설치 MUI 확인은 별도다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
