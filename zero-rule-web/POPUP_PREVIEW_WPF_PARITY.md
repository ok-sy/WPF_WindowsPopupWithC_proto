# 관리자 미리보기와 WPF 표시 정합성

관리자 편집기(`main/src/features/RgstPop/PopupEditorDialog.tsx`)의 미리보기(`PopupPreview.tsx`)는
`popup-frameWork/Popup`의 표시 계약을 브라우저에서 근사한다. 미리보기는 두 곳에서만 쓴다.

- 편집기 오른쪽 패널의 축소 미리보기
- 편집기 안의 **실제 크기로 보기** 모달(FIXED·RATIO는 화면 안에서 해당 크기, FULLSCREEN은 전체 화면, 배경 어둡기 반영)

별도 새 창 미리보기 페이지(`pages/popup-preview.tsx`)는 설계 18 L-0(W-2)에서 삭제했다.

| 영역 | WPF 소스 | 웹 미리보기 |
| --- | --- | --- |
| 창 크기 | `PopupWindow` | `sizeMode` FIXED / RATIO / FULLSCREEN, 최소·최대 크기 |
| 표시 위치 | `PopupWindow` | `content.popupPosition`(9방향, 기본 CENTER)은 편집만 가능하고 미리보기 위치에는 반영하지 않는다(모달은 항상 중앙) |
| 헤더·닫기·푸터 | `PopupWindow` | 헤더, 닫기 버튼, 푸터, 다시 보지 않기, `footerAction` 바로가기 |
| 폰트 크기 | `PopupWindow`, 콘텐츠 View | `content.headerFontSize` / `bodyFontSize` / `footerFontSize`, 10~40 보정, 비우면 기본 크기 |
| 배경 | `PopupWindow` | `useBackgroundOverlay`, `backgroundOverlayOpacity` |
| TEXT | `TextPopupView` | 카드 없이 콘텐츠 제목·설명, 일반 텍스트, 강조 문구, 하단 설명(+연결 URL)을 각 표시 스위치대로 표시 |
| IMAGE | `ImagePopupView` / `ImageFillPopupView` | `imageSizeMode` ORIGINAL / ADAPTIVE / FIT_TO_IMAGE / FILL. ORIGINAL은 좌상단 원본 크기·클리핑·무스크롤을 재현 |
| VIDEO | `VideoPopupView` | 설명, 컨트롤, 배속·전체화면 허용, 기본 음량, 완료 비율(실제 재생은 하지 않음) |
| 동영상+퀴즈 | `VideoQuizPopupView` | 시청 비율 슬라이더로 잠금/해제 상태, 퀴즈·푸터 활성화 조건을 미리보기 |
| SURVEY/QUIZ | `SurveyPopupView` | 문항·설명·필수 여부·보기, 문항별 `optionLayout` VERTICAL / HORIZONTAL, QUIZ 총점·통과 점수 |

## 알려진 차이

- IMAGE(2026-09-28, 설계 18 W-10 반영): 크기 모드와 설명 배치는 `imagePreviewLayout.ts`가 WPF `ImagePopupView`(설계 15)와 같은 규칙·상수로 계산한다.
  ORIGINAL은 자연 이미지 픽셀 크기를 그대로 쓰고 좌상단에 배치한 뒤 초과 영역을 숨긴다. 작은 이미지는 확대하지 않는다.
  ADAPTIVE는 원본·요청 크기 중 작은 값을 최대 표시 크기로 쓰고 `imageAreaRatio`로 이미지·설명 영역을 나눈다.
  FIT_TO_IMAGE는 요청(없으면 원본) 크기로 이미지를 표시하고 팝업 창 크기를 다시 계산한다 — 편집기 패널에는 그 값을 안내하고, "실제 크기로 보기" 모달이 그 크기로 열린다.
  `descriptionPosition` AUTO는 가로/세로 0.8 이하면 오른쪽, 그 외 아래. 남은 차이: 작업 영역 대신 브라우저 창 크기를 쓰고, 오른쪽 설명 폭 260·여백 56/190/300은 WPF 상수를 그대로 쓰므로 Header/Footer 유무에 따른 실제 크기는 조금 다를 수 있다.
- 동영상+퀴즈 미리보기의 시청 비율 슬라이더는 실제 영상 재생 시간이 아니라 UI 상태 확인용이다.
- WPF(2026-09-30)는 로컬/HTTP(S) HTML5 영상 모두 영상 아래 고정 WPF 컨트롤바를 사용하고 WebView2 네이티브 controls는 표시하지 않는다. 웹 미리보기의 컨트롤은 시각 모형이며 실제 재생·탐색·버퍼링·전체화면·시청량 동기화를 검증하지 않는다. YouTube iframe은 WPF에서도 별도 플레이어를 유지한다.
- WPF 동영상+퀴즈는 내부 Quiz ScrollViewer를 제거해 영상·전체 문항·제출 영역을 단일 스크롤로 이동하고 공통 푸터를 고정한다. 웹 미리보기는 문항/잠금 상태를 근사하며 실제 WPF의 측정 높이·입력 스크롤 동작은 수동 비교한다.
- 글꼴 메트릭, 창 테두리, DPI 반올림은 WPF와 조금 다를 수 있다.

## 수동 비교 절차

1. 서버·관리자 웹·WPF 클라이언트를 같은 DB로 실행한다.
2. 유형별 팝업을 편집기에서 열고 **실제 크기로 보기**로 캡처한다.
3. 같은 사용자 ID로 WPF 클라이언트를 실행해 팝업을 캡처한다(숨김 상태면 결과 행을 정리한다).
4. 헤더·푸터 표시, 콘텐츠 순서, 스크롤, 창 크기·위치를 비교한다.
