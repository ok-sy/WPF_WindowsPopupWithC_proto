# 폐쇄망 전역 CSS·_app.tsx·Youandi 글꼴 영향 검증 (참고)

기준일: 2026-11-25 (KST). 관련: [TODO28](28_TEXT_FONT_EDITING_TODO.md).

- 원래 GitHub 이슈 #1 "[참고][TODO28] 폐쇄망 전역 CSS·_app.tsx·Youandi 글꼴 영향 검증"(2026-11-25 등록)에 있던 내용을 문서로 옮겼다. 아래 본문은 이슈 원문 그대로이며 링크만 저장소 상대 경로로 바꿨다.
- 처리 현황(2026-11-25)
  - 로컬 재현본(`globalStyle.ts`)을 캡처 기준으로 갱신하고 `_app.tsx`를 페이지 `Component` 뒤 Emotion `<Global>` 방식으로 바꿨다(`e14e205`). 본문의 "Git main의 로컬 재현본은 MUI `GlobalStyles`를 페이지 앞에 조건부로 배치", "NewKr 700 이상 미확인" 서술은 이 변경 전 기준이다.
  - 판단: NewKr Text는 기존 `font`·`bold` 계약으로 충분, Title은 사용 시 `faces` 필요, Modern은 한 글꼴 안에서 Text 또는 Head 계열 하나로 맞춰 `faces`로 등록하는 조건으로 사용 가능(각 패밀리 700 서체 확인 대기). 상세는 TODO28 '폐쇄망 글꼴 확인 결과 (2026-11-25)'.
  - 아래 '실환경 확인 항목'은 모두 폐쇄망 확인 대기다(로컬 하네스로 대체 검증한 범위는 TODO28에 기록).

---

## 목적

2026-11-25 폐쇄망 캡처를 기준으로 전역 스타일 주입, CKEditor와 팝업 미리보기의 서식, Windows WPF 글꼴을 대조할 때 사용할 참고 이슈. 캡처에서 읽은 선언과 PowerShell 열거 결과를 기록한다. 브라우저가 실제로 선택한 서체, 저장·조회 왕복, WPF Agent 실화면은 검증 대기다.

- [TODO28 §14 폐쇄망 글꼴 이름 직접 전달](28_TEXT_FONT_EDITING_TODO.md#14-후속--폐쇄망-사용자-지정-폰트-이름-직접-전달)
- [Git main의 로컬 재현용 globalStyle.ts](../../zero-rule-web/main/styles/globalStyle.ts) · [Git main의 _app.tsx](../../zero-rule-web/main/pages/_app.tsx)

## 캡처 및 Git 대조

| 확인 지점 | 폐쇄망 캡처 | 확인할 영향 |
|---|---|---|
| `main/pages/_app.tsx`의 `MyApp()` | `AppCacheProvider` 아래 `ThemeProvider`, `DialogProvider`, `CustomThemeWrapper`. `CssBaseline` → 페이지 `Component` → Emotion `<Global styles={globalStyle} />` 순으로 선언 | Git main의 로컬 재현본은 MUI `GlobalStyles`를 페이지 앞에 조건부로 배치한다. JSX 위치와 실제 CSS 삽입·우선순위를 실화면에서 확인한다. 반입 산출물에서 두 로컬 재현 파일 제외 여부도 확인한다. |
| `main/styles/globalStyle.ts` 기본값 | `body`에 `YouandiNewKr`와 맑은 고딕 대체 글꼴, 기본 굵기 700 및 크기 12px. 일부 입력·조회 UI는 맑은 고딕을 별도로 지정 | 앱 기본 글꼴 상속, 해당 화면의 명시 규칙, MUI 컴포넌트 규칙을 대조한다. |
| `globalStyle.ts` CKEditor 및 팝업 UI | 전역 `em, i`는 `font-style: normal`. CKEditor 영역의 `em, i`에 `font-style: initial`, `.ck-content *`에 굵기 400, `.ck-content strong`에 700 선언. 팝업 등록·상세·문항·답변·게시 대상·트리·스위치에 전역 규칙이 적용되는 구조 | 굵기·기울임이 편집기와 미리보기에서 덮이는지 확인하고, 전역 규칙 조정 시 등록·상세·게시 대상 화면의 입력·스크롤·레이아웃 회귀를 확인한다. |

## 웹 별칭과 WPF 열거 결과

| 웹 CSS 별칭 | 선언된 굵기 → `local()` 이름 |
|---|---|
| `YouandiModern` | 200 → `YouandiModern HeadRegular` · 300 → `YouandiModern TextRegular` · 500 → `YouandiModern TextBold` · 700 → `YouandiModern HeadBold` |
| `YouandiNewKr` | 300 → `YouandiNewKr Text Light` · 400 → `YouandiNewKr Text Regular` · 500 → `YouandiNewKr Text Medium` · 700 → `YouandiNewKr Text Bold` · 800 → `YouandiNewKr Text ExtraBold` |

- Windows PowerShell의 WPF 열거에서 `YouandiNewKr Text`와 `YouandiNewKr Title`은 별도 패밀리이며 각각 300·400·500·700·800의 Normal·Oblique가 조회됐다. 캡처의 웹 별칭 `YouandiNewKr`는 Text 서체를 가리킨다. Title을 선택지로 쓸 경우 웹에서 실제 Title 서체가 선택되는지 별도 확인한다.
- Modern은 `YouandiModern Head`, `YouandiModern Text`가 각각 400·700으로, `YouandiModern HeadBold`, `YouandiModern HeadExtraBold`, `YouandiModern TextBold`가 각각 700으로 조회됐다. 웹 별칭의 숫자와 Windows 서체 메타데이터의 숫자는 별도로 기록한다.
- **기존 TODO28의 400 → Light 가정 재확인.** 이번 캡처의 선언은 **300 → Light, 400 → Regular, 700 → Bold**다. Git main 재현본의 주석에는 NewKr 700 이상이 아직 미확인으로 남아 있다. 선언 확인과 실제 렌더링 확인을 각각 기록한다.

## 실환경 확인 항목

- [ ] 같은 폐쇄망 Windows 세션에서 DevTools의 Computed와 Rendered Fonts로 300·400·500·700·800, `normal`·`bold`·`italic` 적용을 확인한다. Modern의 명시 선언이 없는 400과 글꼴 미설치 PC의 대체 글꼴도 확인한다.
- [ ] TEXT 본문, SURVEY·QUIZ·VIDEO+QUIZ 문항과 선택지에서 기본·명시 글꼴, 굵게·기울임 적용 및 해제를 확인한다. CKEditor → 인라인 미리보기 → 실제 크기 미리보기 → 저장 후 재편집 순서로 동일 문구의 실제 렌더링과 줄바꿈을 대조한다.
- [ ] `registerPopupRichFonts()`, `htmlToBlocks()`, `blocksToHtml()`에서 웹 CSS 별칭과 저장할 Windows 패밀리 이름의 양방향 매핑을 확인한다. 기존 ID와 신규 이름에 대해 저장 요청·조회 응답의 `runs[].font`·`bold`·`italic` 보존을 확인한다.
- [ ] WPF `PopupRichText.cs`의 `CreateRun()`에서 NewKr Text·Title의 일반 400·굵게 700 실제 표시 및 미설치 대체 글꼴을 확인한다. PowerShell 열거 결과와 Agent 팝업에서 선택된 서체를 별도로 기록한다.
- [ ] 반입용 산출물에서 `globalStyle.ts`·`_app.tsx`의 처리와 폐쇄망 원본 파일 유지 여부를 확인한다. 팝업 등록/상세, 게시 대상 선택, 트리·스위치·문항 UI의 레이아웃 및 스크롤을 함께 점검한다.

**판정 기준** · 각 화면에서 선택한 실제 서체와 굵기, 기울임, 저장 후 재편집 값, 대체 표시 결과를 남긴다. NewKr 400/700이 일치하면 기존 `font`·`bold`를 유지한다. 차이가 확인되면 웹 별칭·가중치 조정 또는 Windows 패밀리 매핑 조정의 영향부터 검토하고, 기존 필드로 표현할 수 없는 요구가 확인될 때만 계약 변경을 별도로 검토한다.
