# TODO61-20 팝업 UI 기본값 웹·WPF 실측 (2026-11-19)

- 기준 형상: `main` `7fba333` 이후 작업 트리(TODO61-19 헤더 `&&`, TODO28 글꼴 이름 반영 후)
- 도구: `node scripts/verify-popup-parity.cjs` — 같은 데이터를 관리자 `PopupPreview`(headless Edge, 100%, 테마 body1 0.85rem)와 실제 WPF `PopupWindow`(RenderTargetBitmap 96 DPI)로 그린다. 그림자 여백을 뺀 흰 판끼리 나란히 저장한다.
- 결과: `*.side.png`(왼쪽 웹, 오른쪽 WPF), [MEASURES.md](MEASURES.md)(같은 글자끼리 크기/굵기·위치·패밀리, 헤더 높이·주 버튼 크기·버튼 아래 간격), `measures.json`.
- 환경 한계: 로그인한 관리자 화면이 아닌 같은 컴포넌트 하네스다. 확대 배율(브라우저·Windows)과 폐쇄망 전역 CSS는 포함하지 않는다. WPF 영상(WebView2)은 RenderTargetBitmap에 그려지지 않아 '불러오는 중'으로 보이고, 영상 영역 높이는 메타데이터 전 기본 16:9로 계산된다(웹은 실제 영상 비율).

## 세트

| ID | 유형·크기 | 확인 목적 |
|---|---|---|
| PARITY-SURVEY, -SURVEY-BODY18 | SURVEY 720×820·720×900 | 기본·bodyFontSize 18 문항/선택지/푸터 |
| PARITY-QUIZ-OX | QUIZ 720×680 | OX·선다형 |
| PARITY-TEXT, -TEXT-FONTS | TEXT 600×420 | 기본 15·Run 20 굵게, 헤더 22·본문 12·푸터 16 |
| PARITY-TEXT-560x750 | TEXT 560×750 | 61-18 하단 15 차이 재현 조건(로컬) |
| PARITY-TEXT-NARROW-LONG | TEXT 360×480 | 긴 제목 말줄임, 긴 본문 줄바꿈, 나중에 보기·다시 보지 않기 |
| PARITY-TEXT-NO-HEADER-FOOTER | TEXT 480×320 | 헤더·푸터 숨김 |
| PARITY-IMAGE | IMAGE 640×560 ADAPTIVE | 제목·설명·이미지 상자 |
| PARITY-VIDEO | VIDEO 720×640 | 제목·영상·설명 |
| PARITY-VIDEO-QUIZ | QUIZ+VIDEO 720×900 | 영상 결합 퀴즈 |

## 결과 요약

- 일치(자동 판정 54건 통과): 11세트 모두 흰 판 크기, 헤더 높이 40, 헤더 제목 17/600(TEXT-FONTS 22), 주 버튼 118×34(제출 132×34)·글자 14, **주 버튼 아래~흰 판 아래 15**, TEXT 본문 첫 줄 크기·굵기, 선택지 높이·글자. TEXT 560×750도 웹·WPF 모두 버튼 아래 15로 같아 61-18의 폐쇄망 약 15px 차이는 로컬 컴포넌트 기준으로 재현되지 않는다(폐쇄망 전역 CSS·배율 확인 필요).
- 글자 대조 71건 중 크기·굵기 차이 8건(같은 원인 3종):
  1. **SURVEY·QUIZ 콘텐츠 제목 굵기** — 웹 25/**800**, WPF 25/**600**(`CommonContentTitleStyle` SemiBold). 웹 `PopupPreview` 콘텐츠 제목 `fontWeight={800}`을 IMAGE·VIDEO는 600으로 덮지만 설문 분기는 덮지 않는다. 제목 상자 위치도 웹 y 64, WPF 68(다음 설명 줄은 둘 다 109.3로 같음).
  2. **설문·퀴즈 푸터 응답 진행 문구** — 웹 **13**px·왼쪽 **24**, WPF `FooterResponseProgressText` **12**·왼쪽 **28**. 웹 설문 푸터가 `px: 3`(24)과 글자 13을 쓴다.
  3. **VIDEO+QUIZ 상단 제목** — 웹은 퀴즈 제목(25/800)을 상단에 한 번, WPF는 영상 제목(22/600)을 표시하고 같은 퀴즈 제목을 접는다. [비교 문서](../POPUP_PREVIEW_WPF_PARITY.md)에 기록된 기존 차이다.
- 그 밖의 관찰: IMAGE 이미지·설명 상자는 웹이 회색 테두리, WPF는 연한 배경·테두리 없음으로 보인다(치수는 같음). 웹 VIDEO+QUIZ는 미리보기 전용 컨트롤 줄(▶ 00:00 · 1.0× · 전체화면)을 그린다.
- 1·2는 수정하지 않았다(TODO61-20은 실측·기록 범위, 변경 범위는 별도 결정).
