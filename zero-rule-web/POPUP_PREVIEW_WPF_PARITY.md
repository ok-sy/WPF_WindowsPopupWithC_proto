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
| 헤더·닫기·푸터 | `PopupWindow` | 헤더, 닫기 버튼, 푸터, 다시 보지 않기 플래그 |
| 폰트 크기 | `PopupWindow`, 콘텐츠 View | `content.headerFontSize` / `bodyFontSize` / `footerFontSize`, 10~40 보정, 비우면 기본 크기 |
| 배경 | `PopupWindow` | `useBackgroundOverlay`, `backgroundOverlayOpacity` |
| TEXT | `TextPopupView` | 카드 없이 콘텐츠 제목·설명, 일반 텍스트, 강조 문구, 하단 설명(+연결 URL)을 각 표시 스위치대로 표시 |
| IMAGE | `ImagePopupView` | `imageSizeMode` ADAPTIVE / FIT_TO_IMAGE / FILL(FILL은 이미지와 클릭 링크만). 아래 차이 참고 |
| VIDEO | `VideoPopupView` | 설명, 컨트롤, 배속·전체화면 허용, 기본 음량, 완료 비율(실제 재생은 하지 않음) |
| SURVEY/QUIZ | `SurveyPopupView` | 문항·설명·필수 여부·보기, 문항별 `optionLayout` VERTICAL / HORIZONTAL, QUIZ 총점·통과 점수 |

## 알려진 차이

- IMAGE: FILL이 아닌 모드는 모두 `imageWidth`/`imageHeight`를 최대 크기로만 적용한다.
  ADAPTIVE와 FIT_TO_IMAGE의 기준 차이(팝업 크기 기준 vs 이미지 크기 기준) 계약은 아직 재현하지 않는다.
- IMAGE: `descriptionPosition`, `imageAreaRatio` 편집 UI가 없어 미리보기에도 반영되지 않는다(설계 18 W-10).
- 글꼴 메트릭, 네이티브 미디어 컨트롤, 창 테두리, DPI 반올림은 WPF와 조금 다를 수 있다.

## 수동 비교 절차

1. 서버·관리자 웹·WPF 클라이언트를 같은 DB로 실행한다.
2. 유형별 팝업을 편집기에서 열고 **실제 크기로 보기**로 캡처한다.
3. 같은 사용자 ID로 WPF 클라이언트를 실행해 팝업을 캡처한다(숨김 상태면 결과 행을 정리한다).
4. 헤더·푸터 표시, 콘텐츠 순서, 스크롤, 창 크기·위치를 비교한다.
