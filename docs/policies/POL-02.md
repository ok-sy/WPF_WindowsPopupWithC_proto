# POL-02 — 창·헤더·푸터·Overlay

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-02-01 | 창 구조 | TODO26의 Header/Footer HWND 분리·모서리 창 제거안은 폐기했다. 현재 모서리 창 및 DPI·드래그 보완은 유지한다. 기능 전체 폐기로 해석하지 않는다. | 현재 PopupWindow + OpaqueWindowCorners | WPF |
| POL-02-02 | 종료 제어 | 외부 닫기 제한은 useBackgroundOverlay로 판단한다. Overlay OFF의 Alt+F4 등은 완료 기준 미달이어도 허용한다. ON은 완료 후에도 외부 닫기를 자동 허용하지 않는다. 앱 종료 및 화면 출구 없음 예외는 유지한다. | allowCloseBeforeComplete는 폐기; Esc는 일반 팝업 닫기 아님 | WPF 창 |
| POL-02-03 | 푸터 역할 | SURVEY·QUIZ는 SUBMIT. TEXT·IMAGE·VIDEO의 CLOSE/LINK_AND_CLOSE와 URL 검증은 API 계약을 따른다. showLater는 완료 전 연기 버튼 표시이며 showFooter 조건을 따른다. | showFooter / footerAction / footerLinkUrl | 서버·웹·WPF |

## 구현·계약 근거

- [PopupWindow.xaml.cs](../../popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs)
- [OpaqueWindowCorners.cs](../../popup-frameWork/Popup/Views/Windows/OpaqueWindowCorners.cs)
- [PopupManager.cs](../../popup-frameWork/Popup/Managers/PopupManager.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO07](../design/07_WPF_변경설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO11](../design/11_WPF_FIXED_화면초과_방어_수정계획.md): 원본 세부 요건·검증 이력 유지.
- TODO16: popupPosition 공통 옵션으로 유지 (Git `e65f88c`).
- [TODO25](../design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO26](../design/26_VIDEO_팝업_HWND_구조_개선_TODO.md): Header/Footer 분리안 폐기; 기존 DPI·드래그 보완 유지.
- [TODO30](../design/30_Footer_Action_최상위_계약_TODO.md): 35: popups[]→popup; 푸터 역할 유지.
- [TODO44](../design/44_BackgroundOverlay_키보드종료_동작검토_TODO.md): 57: 외부 닫기 Overlay 책임 확정.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO57](../design/57_완료전닫기옵션_폐기_역할분리_TODO.md): 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리.

## 검증 상태·미확정 범위

실제 Windows 키보드·멀티 모니터·Horizon 확인은 TODO25·44·57에 남아 있다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
