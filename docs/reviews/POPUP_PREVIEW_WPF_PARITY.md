# 관리자 미리보기와 WPF 표시 정합성

관리자 편집기(`zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`)의 미리보기(`PopupPreview.tsx`)는
`popup-frameWork/Popup`의 표시 계약을 브라우저에서 근사한다. 미리보기는 두 곳에서만 쓴다.

- 편집기 오른쪽 패널의 축소 미리보기
- 편집기 안의 **실제 크기로 보기** 모달(FIXED·RATIO는 브라우저 창 안에서 해당 크기, FULLSCREEN은 전체 화면, 배경 어둡기 반영)

별도 새 창 미리보기 페이지(`pages/popup-preview.tsx`)는 설계 18 L-0(W-2)에서 삭제했다.

> 옵션 위치: 관리자 API·DB는 공통 UI 옵션(`footerAction`, `footerLinkUrl`, `useBackgroundOverlay`, `backgroundOverlayOpacity`, `popupPosition`, `headerFontSize`, `bodyFontSize`, `footerFontSize`)을 `content.*`에 저장하고 미리보기도 `content.*`를 읽는다. WPF 조회 응답(`POST /p/api/wpf/popups`)에서는 같은 값이 `popup` 최상위 필드다(설계 30·31·35, `popup-frameWork/Popup/Dtos/PopupResponseDto.cs`). 관리자 `showCloseButton`(편집기 라벨 "닫기 표시")은 WPF `showFooterButton`(Footer 버튼 표시)에 대응한다.

| 영역 | WPF 소스 | 웹 미리보기 |
| --- | --- | --- |
| 창 크기 | `PopupWindow` | `sizeMode` FIXED / RATIO / FULLSCREEN, 최소·최대 크기(FULLSCREEN은 입력 숨김, IMAGE는 최소만 — 최대는 작업 영역 90%). WPF의 `AUTO`는 관리자 웹에서 선택하지 않는다 |
| 표시 위치 | `PopupWindow` | `content.popupPosition`(9방향, 기본 CENTER). **실제 크기로 보기** 모달은 브라우저 창을 작업 영역으로 보고 9방향 가장자리에 배치한다(가장자리 여백은 WPF 그림자 여백과 같은 일반 24px·영상 0px, FULLSCREEN은 위치 무시). 편집기 안 패널 미리보기는 위치를 반영하지 않는다 |
| 헤더·푸터 | `Views/Windows/PopupWindow.xaml` | 헤더 제목, 푸터, 다시 보지 않기, Footer 버튼(`닫기`/`바로가기`, SURVEY·QUIZ는 `제출`) |
| 폰트 크기 | `PopupWindow`, 콘텐츠 View | `content.headerFontSize` / `bodyFontSize` / `footerFontSize`, 10~40 보정, 비우면 기본 크기 |
| 배경 | `PopupWindow` | `useBackgroundOverlay`, `backgroundOverlayOpacity`(기본 0.45) |
| TEXT | `TextPopupView` | 카드 없이 일반 텍스트(콘텐츠 제목·설명은 본문 앞 문단, 설계 37), 강조 문구, 하단 설명(+연결 URL)을 각 표시 스위치대로 표시. `textBlocks`(설계 28 서식 본문)가 있으면 문단 정렬·들여쓰기(설계 49, 단계 × 40px = WPF 40 DIP)와 Run별 굵게·기울임·밑줄·색·크기·글꼴을 React 요소로 그린다(`innerHTML` 미사용) |
| IMAGE | `ImagePopupView` / `ImageFillPopupView` | `imageSizeMode` ORIGINAL / ADAPTIVE / FIT_TO_IMAGE. ORIGINAL은 `ImageFillPopupView`에 대응하며 좌상단 원본 크기·클리핑·무스크롤을 재현한다 |
| VIDEO | `VideoPopupView` | 설명, 컨트롤 표시, 배속·전체화면·재생 위치 변경(`allowSeek`) 허용 여부, 기본 음량, 완료 비율(실제 재생은 하지 않음) |
| 동영상+퀴즈 | `VideoQuizPopupView` | 시청 비율 슬라이더로 잠금/해제 상태, 퀴즈·푸터 활성화 조건을 미리보기 |
| SURVEY/QUIZ | `SurveyPopupView` | 문항·설명·필수 여부·보기, 문항별 `optionLayout` VERTICAL / HORIZONTAL, QUIZ 총점·통과 점수 |

## 알려진 차이

- Header: 미리보기도 WPF와 같이 Header에 닫기 버튼 없이 클릭되지 않는 고정 로고(`public/images/popup-header-logo.png`, WPF `Resources/HeaderLogo.png` 사본, 100×24)를 그린다. 닫기는 Footer 버튼 하나다(WPF 그 밖의 종료 경로는 Alt+F4). WPF Header 배경은 검정이고 미리보기 Header는 흰색이라 로고 대비가 다르게 보인다.
- IMAGE 크기 계산: `imagePreviewLayout.ts`가 WPF `ImagePopupView`(설계 15·23)와 같은 규칙으로 계산한다. FILL 모드와 `imageAreaRatio`·`descriptionPosition`·오른쪽 설명 폭은 설계 23에서 제거했으며 설명은 항상 이미지 아래다.
  - ORIGINAL: 자연 이미지 픽셀 크기를 그대로 쓰고 좌상단에 배치한 뒤 초과 영역을 숨긴다. 작은 이미지는 확대하지 않는다. 제목·설명은 쓰지 않는다.
  - ADAPTIVE: `content.width/height`는 창 크기이며 이미지는 원본보다 확대하지 않고 비율을 유지해 맞춘다.
  - FIT_TO_IMAGE: `content.width/height`(없으면 원본)는 이미지 표시 크기이며 팝업 창 크기를 다시 계산한다. 편집기 패널에 그 값을 안내하고 **실제 크기로 보기** 모달이 그 크기로 열린다.
  - 창 최대는 작업 영역의 90%다. 미리보기는 모니터 작업 영역 대신 브라우저 창 크기(`window.innerWidth/innerHeight`)를 쓰므로 실제 PC와 차이가 날 수 있다.
- VIDEO 컨트롤: WPF는 로컬/HTTP(S) HTML5 영상 모두 영상 하단에 겹치는 WPF Overlay 컨트롤바를 사용하고 WebView2 네이티브 controls는 표시하지 않는다. 웹 미리보기는 영상 영역 아래에 한 줄 텍스트 모형(시간·탐색 제한·배속·전체화면)만 그리며 실제 재생·탐색·버퍼링·전체화면·시청량 동기화를 검증하지 않는다.
- 동영상+퀴즈 미리보기의 시청 비율 슬라이더는 실제 영상 재생 시간이 아니라 UI 상태 확인용이다.
- WPF 동영상+퀴즈는 내부 Quiz ScrollViewer를 제거해 영상·전체 문항·제출 영역을 단일 스크롤로 이동하고 공통 푸터를 고정한다. 웹 미리보기는 문항/잠금 상태를 근사하며 실제 WPF의 측정 높이·입력 스크롤 동작은 수동 비교한다.
- 글꼴 메트릭, 창 테두리, DPI 반올림은 WPF와 조금 다를 수 있다.

## 수동 비교 절차

1. 서버·관리자 웹·WPF 클라이언트를 같은 DB로 실행한다.
2. 유형별 팝업을 편집기에서 열고 **실제 크기로 보기**로 캡처한다.
3. 같은 사용자 ID로 WPF 클라이언트를 실행해 팝업을 캡처한다(숨김 상태면 결과 행을 정리한다).
4. 헤더·푸터 표시, 콘텐츠 순서, 스크롤, 창 크기·위치를 비교한다.

관련 문서: [IMAGE 크기 모드 단순화(설계 23)](../design/23_IMAGE_크기모드_단순화_TODO.md), [TEXT 서식 편집(설계 28)](../design/28_TEXT_FONT_EDITING_TODO.md), [옵션 가이드](../POPUP_OPTION_GUIDE.md).
