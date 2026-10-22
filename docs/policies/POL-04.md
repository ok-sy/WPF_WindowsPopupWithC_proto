# POL-04 — IMAGE 크기·표시

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-04-01 | 공통 크기 입력 | 외부 크기는 popup.width/height 한 쌍이다. TODO15→23→58의 대체 관계를 따른다. 새 저장은 content.width/height를 받지 않으며 WPF의 구 응답 축별 대체 읽기는 호환 경로다. | popup.width/height | 서버 조립·WPF Factory·웹 |
| POL-04-02 | 모드별 기준 | ADAPTIVE와 ORIGINAL은 창 크기다. ADAPTIVE는 크롬을 뺀 남은 영역에 이미지를 배치한다. ORIGINAL은 원본 크기로 배치하고 넘침을 자른다. FIT_TO_IMAGE는 이미지 콘텐츠 영역에 크기를 할당한 뒤 헤더·푸터 등 부가 영역을 더한다. | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL; FULLSCREEN 우선 | 레이아웃 |
| POL-04-03 | 비율·상한 | FIT_TO_IMAGE 두 축은 지정 영역으로 유지하고 비율 고정이면 Uniform/contain, 해제면 Fill이다. TODO23의 너비 우선 높이 정규화를 현행으로 재사용하지 않는다. 최종 창 최소 300과 작업 영역 상한을 함께 적용한다. | 원본 비율·생략 축·클리핑은 인터페이스 IMAGE 표 | 웹·WPF |

## 구현·계약 근거

- [ImagePopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/ImagePopupView.xaml.cs)
- [ImageFillPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/ImageFillPopupView.xaml.cs)
- [PopupFactory.cs](../../popup-frameWork/Popup/Factories/PopupFactory.cs)
- [imagePreviewLayout.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout.ts)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)
- 계약/실행 안내: [POPUP_PREVIEW_WPF_PARITY.md](../reviews/POPUP_PREVIEW_WPF_PARITY.md)

## 원본 TODO와 대체 관계

- [TODO15](../design/15_IMAGE_팝업_크기모드_정리.md): 23→58: IMAGE 크기 계약 대체.
- [TODO23](../design/23_IMAGE_크기모드_단순화_TODO.md): 58: 최상위 크기·FIT_TO_IMAGE 영역 기준 대체.
- [TODO58](../design/58_IMAGE_공통크기필드_모드별기준_TODO.md): 68: 최소 300 추가; 모드별 크기 의미 유지.
- [TODO68](../design/68_팝업최소크기_300x300_공통화_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

구 content 크기 대체 읽기 삭제 시점, DPI·다중 모니터·작업 영역 실화면은 별도 확인한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
