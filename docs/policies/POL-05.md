# POL-05 — VIDEO 재생·완료

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-05-01 | 재생 경로 | 로컬·HTTP 영상의 현재 재생 경로를 유지하며 YouTube 지원은 되살리지 않는다. allowSeek는 진행바 탐색 허용이고 창 드래그 옵션이 아니다. | VIDEO 및 QUIZ videoEnabled | WPF 플레이어·웹 미리보기 |
| POL-05-02 | 완료·화면 이탈 | completionRatio는 누적 시청 기준이다. 일반 VIDEO 버튼은 기준 전 비활성, 충족 후 활성. VIDEO+QUIZ는 기준 전 문항 잠금, 이후 기존 퀴즈 제출 조건 적용. 재생 실패 출구는 유지한다. 외부 닫기는 POL-02다. | 공통 VideoCompletion 계산; allowCloseBeforeComplete 폐기 | WPF·서버 판정 |
| POL-05-03 | 결합 화면 | 영상 원본 메타데이터 비율로 VIDEO+QUIZ 영상 영역을 할당하고 메타데이터 미확보 시 대체 비율을 사용한다. 중복 중간 notice는 제거하며 하단 완료 상태 안내까지 일괄 삭제하지 않는다. | 비율 처리 상세는 TODO60; 중간 안내 TODO59 | WPF·웹 |

## 구현·계약 근거

- [VideoPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs)
- [VideoQuizPopupView.cs](../../popup-frameWork/Popup/Views/Contents/VideoQuizPopupView.cs)
- [VideoCompletion.cs](../../popup-frameWork/Popup/Services/VideoCompletion.cs)
- [AspectVideoArea.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/AspectVideoArea.tsx)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [20261007_저사양_PC_VIDEO_측정_가이드.md](../reviews/20261007_저사양_PC_VIDEO_측정_가이드.md)

## 원본 TODO와 대체 관계

- [TODO19](../design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md): 35: 목록 큐/주기 대체; 영상 UI는 유지.
- [TODO24](../design/24_VIDEO_저사양_PC_CPU_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO27](../design/27_VIDEO_SEEK_ON_OFF_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO43](../design/43_완료조건_버튼활성화_UX_TODO.md): 57: allowCloseBeforeComplete 폐기; 완료 조건 UX 유지.
- [TODO57](../design/57_완료전닫기옵션_폐기_역할분리_TODO.md): 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리.
- [TODO59](../design/59_VIDEO_QUIZ_중간안내제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO60](../design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

HTTP/WebView2 실제 영상·저사양 CPU 실측·폐쇄망 장치 검증을 코드/자동 검증 기록과 구분한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
