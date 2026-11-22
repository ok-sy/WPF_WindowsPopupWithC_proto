# 관리자 미리보기와 WPF 표시 정합성

관리자 편집기(`zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`)의 미리보기(`PopupPreview.tsx`)는
`popup-frameWork/Popup`의 표시 계약을 브라우저에서 근사한다. 미리보기는 두 곳에서만 쓴다.

- 편집기 오른쪽 패널의 축소 미리보기(`InlinePopupPreview.tsx`)
- 편집기 안의 **실제 크기로 보기** 모달(`PopupPreviewDialog.tsx`, 크기·위치 계산 `popupPreviewDialogLayout.ts`. FIXED·RATIO는 브라우저 창 안에서 해당 크기, FULLSCREEN은 전체 화면, 배경 어둡기 반영)

두 컴포넌트는 TODO61에서 편집기와 분리했으며 같은 `PopupPreview`로 내용을 그린다. 다른 화면에서 쓰는 방법과 의존성은 `docs/interfaces/Web/ADMIN_POPUP_PREVIEW_COMPONENTS.md`를 본다.

별도 새 창 미리보기 페이지(`pages/popup-preview.tsx`)는 설계 18 L-0(W-2)에서 삭제했다.

> 옵션 위치: 관리자 API·DB는 공통 UI 옵션(`footerAction`, `footerLinkUrl`, `useBackgroundOverlay`, `backgroundOverlayOpacity`, `popupPosition`, `headerFontSize`, `bodyFontSize`, `footerFontSize`)을 `content.*`에 저장하고 미리보기도 `content.*`를 읽는다. WPF 조회 응답(`POST /p/api/wpf/popups`)에서는 같은 값이 `popup` 최상위 필드다(설계 30·31·35, `popup-frameWork/Popup/Dtos/PopupResponseDto.cs`). 관리자 `showCloseButton`(편집기 라벨 "닫기 표시")은 WPF `showFooterButton`(Footer 버튼 표시)에 대응한다.

| 영역 | WPF 소스 | 웹 미리보기 |
| --- | --- | --- |
| 창 크기 | `PopupWindow` | `sizeMode` FIXED / RATIO / FULLSCREEN, 최소·최대 크기(FULLSCREEN은 입력 숨김, IMAGE는 최소만 — 최대는 작업 영역 90%). WPF의 `AUTO`는 관리자 웹에서 선택하지 않는다 |
| 표시 위치 | `PopupWindow` | `content.popupPosition`(9방향, 기본 CENTER). **실제 크기로 보기** 모달은 브라우저 창을 작업 영역으로 보고 9방향 가장자리에 배치한다. 모달 크기는 WPF 창 크기이고, 일반 창은 그 안에 그림자 여백 24px를 두고 흰 판(창 - 48)과 WPF와 같은 그림자를 그린다(영상 창·FULLSCREEN은 여백·그림자 0, 2026-11-17 모든 유형으로 확대). FULLSCREEN은 위치 무시. 편집기 안 패널 미리보기는 위치를 반영하지 않는다 |
| 헤더·푸터 | `Views/Windows/PopupWindow.xaml` | 헤더 제목, 푸터, 다시 보지 않기, Footer 버튼(`닫기`/`바로가기`, SURVEY·QUIZ는 `제출`) |
| 폰트 크기 | `PopupWindow`, 콘텐츠 View | `content.headerFontSize` / `bodyFontSize` / `footerFontSize`, 10~40 보정, 비우면 기본 크기 |
| 배경 | `PopupWindow` | `useBackgroundOverlay`, `backgroundOverlayOpacity`(기본 0.45) |
| TEXT | `TextPopupView` | 카드 없이 일반 텍스트(콘텐츠 제목·설명은 본문 앞 문단, 설계 37), 하단 설명(+연결 URL)을 각 표시 스위치대로 표시. `textBlocks`(설계 28 서식 본문)가 있으면 문단 정렬·들여쓰기(설계 49, 단계 × 40px = WPF 40 DIP)와 Run별 굵게·기울임·밑줄·색·크기·글꼴을 React 요소로 그린다(`innerHTML` 미사용) |
| IMAGE | `ImagePopupView` | `imageSizeMode` ADAPTIVE / FIT_TO_IMAGE(ORIGINAL·`ImageFillPopupView`는 2026-11-22 삭제) |
| VIDEO | `VideoPopupView` | WPF와 같은 순서(콘텐츠 제목 → 영상 → 설명)로 그리고, 단독 VIDEO 영상 영역은 남은 높이를 채운다(TODO61-17). 그 안에 실제 영상을 음소거·메타데이터만 읽어 비율 유지(contain)로 그린다(`FillVideoArea`, WPF `Stretch=Uniform`과 같이 위아래·좌우 검은 여백). 단독 VIDEO는 WPF와 같이 영상 비율로 영역 높이를 계산하지 않는다(비율 높이 계산은 동영상+퀴즈만). 주소가 없거나 읽지 못하면 재생 아이콘·안내 문구를 표시한다. 컨트롤 표시, 배속·전체화면·재생 위치 변경(`allowSeek`) 허용 여부를 한 줄 모형으로 표시(실제 재생은 하지 않음). 완료 기준·기본 음량 같은 미리보기 전용 안내는 WPF에 없어 그리지 않는다. 2026-11-13 미리보기 상단 시청 비율 슬라이더(재생 진행 상태에 따른 버튼 활성화 시연)를 삭제해 미리보기는 시청 기준 충족 상태(Footer 버튼 활성, 사유 문구 없음)로 그린다. 기준 미달 Footer 비활성·사유 문구(설계 43, TODO57로 항상 적용)는 WPF 실제 팝업에서만 확인한다 |
| 동영상+퀴즈 | `VideoQuizPopupView` | 2026-11-13부터 시청 비율 슬라이더 없이 잠금 해제 상태(퀴즈 입력·제출 진행 문구)로 미리보기. 시청 전 퀴즈·푸터 잠금과 "영상 {현재}% · 기준 {기준}% 이상 시청하면…" 문구는 WPF 실제 팝업에서만 동작한다. 영상과 퀴즈 사이 본문 안내는 두지 않는다(TODO59). 영상 영역은 HTML video 메타데이터(videoWidth/Height)로 WPF와 같은 원본 비율·상한 원칙을 적용한다(TODO60, `AspectVideoArea`) |
| SURVEY/QUIZ | `SurveyPopupView` | 문항·설명·필수 여부·보기, 문항별 `optionLayout` VERTICAL / HORIZONTAL, QUIZ 총점·통과 점수. QUIZ 미달 시 점수와 틀린 채점 문항 번호("틀린 문항: 2, 4번", 문항 목록 순서 1부터)를 표시한다(설계 43) |

## 알려진 차이

- Header: 미리보기도 WPF와 같이 Header에 닫기 버튼 없이 클릭되지 않는 고정 로고(`public/images/popup-header-logo.png`, WPF `Resources/HeaderLogo.png` 사본, 100×24)를 그린다. 닫기는 Footer 버튼 하나다(WPF 그 밖의 종료 경로는 Alt+F4). Header 배경·제목 색은 WPF와 같은 검정·흰색이고, 로고는 검은 배경에서 보이도록 CLOVER 글자를 흰색으로 바꾼 그림을 WPF·미리보기가 같이 쓴다(기본 로고. 다른 로고를 쓰려면 두 파일을 같은 이름으로 교체). Header 높이는 유형과 관계없이 WPF `HeaderRow`와 같은 40이며 제목은 한 줄 말줄임으로 그린다. IMAGE 미리보기 창에는 WPF `PopupBodyBorder`(두께 0)와 같이 테두리를 그리지 않는다.
- IMAGE 크기 계산: `imagePreviewLayout.ts`가 WPF `ImagePopupView`(설계 15·23)와 같은 규칙으로 계산한다. FILL 모드와 `imageAreaRatio`·`descriptionPosition`·오른쪽 설명 폭은 설계 23에서 제거했으며 설명은 항상 이미지 아래다.
  - ADAPTIVE: `popup.width/height`는 창 크기이며(TODO58로 content에서 이동) 이미지는 원본보다 확대하지 않고 비율을 유지해 맞춘다.
  - FIT_TO_IMAGE: `popup.width/height`(없으면 원본)는 이미지 콘텐츠 영역 크기이며(비율 고정 시 영역 안 contain) 팝업 창 크기를 다시 계산한다(TODO58). 창 크롬은 WPF `PopupWindow`와 같이 가로 104(콘텐츠 여백 28+28, 외곽 여백 24+24, 본문 테두리 0), 세로 96(24+24, 24+24)에 Header 40·Footer 80을 더하고 이미지 테두리 1+1을 포함한다. 편집기 패널에 그 값을 안내하고 **실제 크기로 보기** 모달이 그 크기로 열린다.
  - 창 최대는 작업 영역의 90%다. 미리보기는 모니터 작업 영역 대신 브라우저 창 크기(`window.innerWidth/innerHeight`)를 쓰므로 실제 PC와 차이가 날 수 있다.
- VIDEO 컨트롤: WPF는 로컬/HTTP(S) HTML5 영상 모두 영상 하단에 겹치는 WPF Overlay 컨트롤바를 사용하고 WebView2 네이티브 controls는 표시하지 않는다. 웹 미리보기는 영상 영역 아래에 한 줄 텍스트 모형(시간·탐색 제한·배속·전체화면)만 그리며 실제 재생·탐색·버퍼링·전체화면·시청량 동기화를 검증하지 않는다.
- 일반 VIDEO·동영상+퀴즈 미리보기의 시청 비율 슬라이더는 2026-11-13 삭제했다(관리자 화면에서 재생 진행에 따른 버튼 활성화 시연 불필요). 시청 판정(누적 시청 비율을 소수점 4자리에서 내림해 완료 기준과 비교, 설계 53-16)은 WPF에서만 수행한다.
- 동영상+퀴즈: 영상 영역에 설명이 보이면 퀴즈 머리말의 같은 설명을 생략한다(WPF는 같은 제목도 생략, 미리보기는 원래 제목을 상단에 1번만 표시). 영상 설명을 숨기면 퀴즈 머리말에 표시한다(설계 53-16).
- 완료 조건 버튼 UX(설계 43): 미달 시 버튼은 숨기지 않고 비활성 + 사유 표시다. 미리보기는 사유 문구(Footer 진행 문구)에 `role="status"`·`aria-live="polite"`를 두고 비활성 버튼의 `aria-describedby`로 연결한다. WPF 일반 VIDEO의 '필수 영상 시청' 메시지 상자는 버튼이 비활성이라 미리보기에서 재현하지 않는다.
- 보조 "닫기" 버튼(설계 43): 동영상+퀴즈는 WPF에서 재생 실패 때만 표시하므로 미리보기에는 없다(TODO57), QUIZ(영상 없음)는 미달 판정을 한 번 받은 뒤 `useBackgroundOverlay=false`일 때만 표시하며 SURVEY는 없다. `showFooter=false`면 숨긴다. 미리보기의 보조 닫기는 응답·시청 비율·미달 상태를 초기화하고 **실제 크기로 보기** 모달이면 모달을 닫는다.
- 문항 0개: 편집기 저장 검증("문항을 한 개 이상 추가해 주세요.")이 막아 저장될 수 없으므로 미리보기는 제출을 비활성으로 둔다. 필수 문항이 0개(선택 문항만)면 WPF와 같이 바로 제출할 수 있다.
- WPF 동영상+퀴즈는 내부 Quiz ScrollViewer를 제거해 영상·전체 문항·제출 영역을 단일 스크롤로 이동하고 공통 푸터를 고정한다. 웹 미리보기는 문항/잠금 상태를 근사하며 실제 WPF의 측정 높이·입력 스크롤 동작은 수동 비교한다.
- 글꼴 메트릭, 창 테두리, DPI 반올림은 WPF와 조금 다를 수 있다.
- 공통화(TODO61-21, 2026-11-19): 창·헤더·본문·푸터 수치와 버튼 색은 `popupLayout.ts`, 푸터·푸터 버튼은 `PopupFooter.tsx` 한곳에서 그린다. WPF 푸터 버튼은 `FooterActionButtonStyle`·`FooterSecondaryButtonStyle`·`SurveyFooterSubmitButtonStyle`. 설문 제목 굵기 600, 설문 푸터 여백 28·진행 문구 12로 WPF와 같다.
- 공통 수치 정렬(TODO61-17, 2026-11-16): Header 제목 기본 17 SemiBold(600), 본문 여백 좌우 28·상하 24(`PopupContent Margin`), Footer 높이 80·여백 28/8/28/16·구분선 없음·확인 버튼 최소 118×44(`ActionButtonStyle`)를 모든 유형에 맞췄다. 좁은 인라인 미리보기에서 Footer 줄이 바뀌면 잘리지 않도록 IMAGE 외에는 최소 높이 80이다. VIDEO 콘텐츠 제목 22 SemiBold·아래 여백 15, 설명 14px `#4B5563`, 영상 영역 검정 배경·1px `#D1D5DB` 테두리·모서리 8. 동영상+퀴즈 영상 높이는 WPF `AspectSizing`과 같이 `(폭 − 2) × 세로/가로 + 2`(테두리 포함)다.
- 남은 미기록 차이(영향 낮음, 미수정): 실제 크기 모달 화면 상한은 0.96(WPF FIXED 0.95), RATIO 비율을 0.1~1로 보정하지 않음, 동영상+퀴즈 영상 높이 상한(가용 높이 × 0.7)의 가용 높이에 스크롤 영역 상하 패딩 48이 포함됨(WPF보다 상한이 약 34px 큼). 캡처 비교에서 문제가 되면 따로 맞춘다.

## 수동 비교 절차

1. 서버·관리자 웹·WPF 클라이언트를 같은 DB로 실행한다.
2. 유형별 팝업을 편집기에서 열고 **실제 크기로 보기**로 캡처한다.
3. 같은 사용자 ID로 WPF 클라이언트를 실행해 팝업을 캡처한다(숨김 상태면 결과 행을 정리한다).
4. 헤더·푸터 표시, 콘텐츠 순서, 스크롤, 창 크기·위치를 비교한다.

## 자동 검증

- `node scripts/verify-completion-ux-43.cjs`(저장소 루트, headless Edge): 일반 VIDEO 비활성·사유·도달 후 활성, 동영상+퀴즈 잠금 문구, QUIZ 오답 번호·보조 닫기 표시 규칙, 동영상+퀴즈 영상 영역 비율(TODO60, WPF Demo 영상 메타데이터)을 실제 DOM으로 확인한다.
- TODO60 비율 값은 엔진마다 다를 수 있다: 같은 Demo 영상을 브라우저(Edge)는 593×252, WPF MediaElement는 592×252로 보고한다. 같은 계산 원칙만 맞추며 CSS px·DIP·물리 픽셀이 같다고 보지 않는다.

관련 문서: [IMAGE 크기 모드 단순화(설계 23)](../design/23_IMAGE_크기모드_단순화_TODO.md), [TEXT 서식 편집(설계 28)](../design/28_TEXT_FONT_EDITING_TODO.md), [옵션 가이드](../POPUP_OPTION_GUIDE.md).

## 2026-11-17 같은 데이터 나란히 비교

- 도구: `node scripts/verify-popup-parity.cjs`. 같은 고정 데이터 5종(SURVEY 기본·`bodyFontSize` 18, QUIZ OX+선다형, TEXT 기본, TEXT 헤더 22·본문 12·푸터 16)을 관리자 미리보기(`PopupPreview`, 실제 Dialog처럼 `hidePlaceholders`, 테마 body1 0.85rem, headless Edge 100%)와 WPF `PopupWindow`(서버 응답 형식, `scripts/PopupParityCapture`, 96 DPI)로 그려 `.offline-verify/popup-parity/<id>.side.png`에 세 장(웹 원래 크기 · 웹을 WPF 흰 판 크기로 맞춤 · WPF 흰 판)을 나란히 저장한다. 선택지는 이름별로 높이·글자를 자동 대조한다.
- 일치: 선택지 17개 높이·글자(기본 32/12, `bodyFontSize` 18이면 38/16, 긴 선택지 두 줄 62), 헤더 제목 크기(기본 17, `headerFontSize` 22), TEXT 본문 기본 15·지정 크기 20·본문 12, 문항 제목·설명 크기, 칩·OX 칸 배치, 필수 응답 문구.
- 차이(2026-11-17 같은 날 미리보기를 WPF 기준으로 모두 수정, 아래 「WPF 기준 정렬」 참고):
  1. **흰 판 크기**: FIXED 720×820 일반 팝업에서 미리보기 Dialog는 흰 판을 720×820으로 그리지만 WPF는 창 720×820 안에 그림자 여백 24를 둬 흰 판이 672×772다(영상 창은 여백 0이라 같음). 같은 데이터에서 줄바꿈 위치가 달라질 수 있다.
  2. **푸터 확인 버튼 색**: 미리보기는 MUI `color="inherit"` 회색, WPF `ActionButtonStyle`은 배경 #111827·흰 글자.
  3. **설문·퀴즈 푸터 구분선**: 미리보기 SURVEY·QUIZ 푸터에만 위쪽 1px 구분선이 있고 WPF에는 없다(일반 푸터는 TODO61-17에서 이미 제거).
  4. **콘텐츠 설명 자리**: 설명이 비어 있으면 미리보기는 자리를 접지만 WPF는 빈 설명 줄 높이만큼(약 36) 띄운다. 설명이 있어도 제목·설명과 첫 문항 사이가 WPF에서 약 12 더 넓다.
  5. 주관식 입력칸 크기 조절 손잡이는 브라우저 기본 표시라 비교 대상에서 뺀다.
- 한계: 로그인한 실제 관리자 화면이 아니라 같은 `PopupPreview` 컴포넌트를 하네스에서 그린 것이고, WPF도 실제 모니터 배율이 아니라 96 DPI 렌더링이다. 확대 DPI(125~200%)·폐쇄망 화면은 미확인.

### WPF 기준 정렬 (2026-11-17)

위 차이 1~4를 미리보기 쪽에서 WPF와 같게 고쳤다. WPF 코드는 바꾸지 않았다.

1. 흰 판 크기: `previewShadowMargin`(영상 창·FULLSCREEN 0, 그 밖 24)을 모든 유형에 적용. `PopupPreview`가 창 크기 안에 여백을 두고 흰 판에 WPF `DropShadowEffect`와 같은 그림자(`0 4px 22px rgba(0,0,0,.28)`)를 그린다. Dialog Paper는 창 크기·투명·여백 0(창이 작업 영역 가장자리에 붙음). 이전 IMAGE 전용 규칙과 Dialog 바깥 여백 24(IMAGE는 합쳐 48이 떨어졌음)를 대체.
2. 확인 버튼: WPF `ActionButtonStyle`과 같이 배경 #111827·흰 글자·SemiBold·모서리 9·좌우 여백 22, hover #1F2937, 누름 #374151, 비활성 #E5E7EB/#9CA3AF.
3. 설문·퀴즈 푸터 위 구분선 제거.
4. 설문 머리말: 제목 위 4, 설명 줄 높이 22, 설명 아래 14(머리말 10 + 문항 목록 4). 설명이 비어도 한 줄 자리를 둔다(VIDEO+QUIZ에서 영상 설명과 같아 숨길 때만 접음, `reserveDescription`).

검증: `verify-popup-parity.cjs` 22건(5종 흰 판 크기 웹=WPF, 선택지 17개 높이·글자) 통과, 나란히 이미지에서 첫 문항 위치·버튼 색·구분선 일치 확인(설명 줄 1~2px 이내 차이는 글꼴 렌더링 차이).
