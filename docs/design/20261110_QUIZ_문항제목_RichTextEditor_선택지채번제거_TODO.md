# QUIZ 문항 제목 RichTextEditor 통일·선택지 자동 채번 제거 TODO

- 정의일: 2026-11-10
- 상태: 구현·자동 검증 완료(2026-11-10) / 저장·재조회 실화면, 폐쇄망 반입 확인 대기
- 대상: `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`
- 범위: 관리자 WEB 에디터. 서버·DB·WPF 및 API 계약 변경 없음(기존 필드 재사용 전제).

## 확정 요구사항

- [x] **QUIZ 문항 제목 RichTextEditor로 통일**: `questions.map` 내부의 `richTitle ? <PopupRichTextEditor ...> : <TextField ...>` 삼항 분기를 제거하고 QUIZ 문항 제목은 OX 여부와 무관하게 `PopupRichTextEditor`(compact)로 입력·편집한다. 일반 `TextField` 제목 분기를 제거한다. SURVEY 제목 동작은 변경 대상에서 제외한다.
- [x] 제목 서식 입력은 기존 `initialRich(q.titleBlocks, q.title)`와 `onChange`의 `richValue(blocks, plain)` 및 `update(index, { title: value.plain, titleBlocks: value.blocks })`를 유지한다. 저장·재조회·미리보기에서 제목 및 서식 블록 정합성을 확인한다.
- [x] **선택지 자동 채번 제거**: 일반 선택지 `TextField`의 `slotProps.input.startAdornment`에 있는 `{oi + 1}` 표시를 제거한다. 입력값에 번호를 자동 결합하지 않는다.
- [x] 접근성 목적의 `aria-label`(문항·선택지 번호)은 유지한다. 문항 배열 순서, `optionId`, 정답 선택·저장 계약 및 문항 카드 상단의 `{index + 1}번 문항` 표시는 변경하지 않는다.
- [x] `richQuestionText` 및 OX 관련 분기·주석·기존 테스트 영향도를 확인한다. QUIZ 제목에만 RichTextEditor를 고정하고 SURVEY의 기존 선택 동작을 보존하도록 조건을 재구성한다.

## 완료 기준

- [x] 일반 QUIZ·OX QUIZ 모두 RichTextEditor로 제목과 서식 입력·수정 가능
- [x] 선택지 입력 앞 자동 번호 없음, 접근성 라벨 유지
- [ ] 저장·재조회·미리보기에서 제목/선택지 내용 유지 — 하네스에서 편집 값 보존·재마운트 복원·미리보기 서식 표시는 통과. 서버 저장 후 재조회 실화면은 미실행
- [x] 프론트 타입 검사·관련 하네스 통과 — 2026-11-10 `tsc --noEmit`·변경 파일 eslint 통과, `verify-survey-rich-text-55.cjs` 67건 통과
- [ ] 폐쇄망 반입 및 실화면 검증은 별도

## 확인 근거

- `PopupQuestionEditor.tsx`: 문항 제목 `richTitle` 삼항 분기(약 232행 이후), 일반 선택지 `startAdornment`의 `oi + 1`.
- 본 TODO는 구현 지시서로 작성되었고, 아래 구현 결과는 2026-11-10 반영분이다.

## 구현 결과 (2026-11-10)

- 제목 분기 조건을 `richTitle = quiz || richQuestionText`로 바꿨다. QUIZ 제목은 OX·선다형·기존 복수 선택·주관식 모두 RichTextEditor, SURVEY 제목은 `richQuestionText=false`(기본)면 기존 일반 입력을 유지한다. `oxQuestion`은 OX 정답 UI 분기에만 남았다.
- 일반 선택지 `TextField`의 `startAdornment` 번호를 제거하고 `aria-label`(`N번 문항 선택지 M`)은 유지했다.
- 범위 외로 유지한 항목: `richQuestionText=true`일 때 선택지 `PopupRichTextEditor`의 `inlineLabel` 번호는 TODO 대상(일반 `TextField` 선택지)이 아니고 compact 한 줄 배치에 쓰여 그대로 둔다. 필요하면 별도 요건으로 정한다.
- 정합성 보완: 최초 파일명의 `일반입력`이 정정된 본문(RichTextEditor 통일)과 맞지 않아 파일명을 `QUIZ_문항제목_RichTextEditor_선택지채번제거`로 바꿨다. 가이드(요약·props·재사용·시작 탭·공지)와 `POPUP_FRONT_SAMPLE_HANDOVER.md`의 「퀴즈 OX 제목만 서식 편집기」 표현을 새 기준으로 고쳤다. TODO73 §7은 당시 기록으로 두고, TODO73 요약 체크 항목에 이 문서로 QUIZ 제목 기준이 대체됐다는 연결을 추가했다.
- 하네스 `scripts/verify-survey-rich-text-55.cjs`에 설문 선택지 번호 미표시, 새 퀴즈 선다형 제목 서식 편집기·선택지 일반 입력, 기존 퀴즈(복수·주관식·OX) 제목 전부 서식 편집기 검사를 추가했다. 이전 편집기 코드로 실행하면 새 검사가 실패하는 것을 확인했다.


## 후속 TODO — 2026-11-17 관리자 WEB 편집기·미리보기와 WPF 팝업 정합성

- 상태: **구현·자동 검증 완료(2026-11-17)** / 같은 데이터의 브라우저·WPF 실화면 나란히 비교, 확대 DPI, 서버 저장→재조회, 폐쇄망 확인 대기. 기존 2026-11-10 완료 항목의 완료 표시는 유지한다.
- 구현 대상: 관리자 WEB 편집기·미리보기 및 실제 팝업을 표시하는 WPF. 이번 반영은 TODO 문서 등록 단계다.

### 1. SURVEY·QUIZ 문항 제목 서식 편집기 상시 사용

**확정 요구사항**
- [x] 문항 제목은 `quiz=true/false` 및 `richQuestionText=true/false`와 무관하게 항상 `PopupRichTextEditor`(compact)로 입력·수정 가능해야 한다.
- [x] `richQuestionText`는 **선택지 입력 방식**(일반 텍스트 / 서식 편집기)만 제어한다. `quiz`는 정답·채점 등 퀴즈 전용 UI에만 영향을 주며 문항 제목 편집기를 전환하지 않는다.
- [x] `title`·`titleBlocks` 기존 저장 계약을 유지하고 일반 입력 ↔ 서식 입력 전환 시 기존 제목과 서식을 유실하지 않는다.

**현행 코드와 차이**
- `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`의 `questions.map` 내부 `const richTitle = quiz || richQuestionText` 때문에 SURVEY + `richQuestionText=false`에서 제목이 일반 `TextField`로 렌더링된다. 실제 disabled 속성 여부는 별도로 확인한다.
- `richQuestionText` 선택지 분기는 유지하되 제목 분기는 제거하거나 상시 서식 편집기로 고정한다.
- 이 변경은 위 문서의 **SURVEY 제목 동작 유지**라는 2026-11-10 기존 범위를 대체한다.

**구현 시 확인 및 완료 기준**
- [x] `PopupQuestionEditor.tsx` 제목 분기·`onChange`(`title/titleBlocks`)·선택지 `richQuestionText` 분리 확인.
- [x] QUIZ/SURVEY × `richQuestionText` true/false 4조합에서 제목 서식 편집 가능, 선택지 편집 방식만 해당 props에 따라 변경되는지 검증.
- [ ] 신규/기존 문항, 일반 문자열만 저장된 기존 문항, 서식 블록 포함 문항의 편집→저장→재조회→미리보기 왕복 확인. 제목 내용·서식 보존, 선택지 번호·정답·점수 회귀 확인.
- [x] 관련 가이드·props 설명·기존 테스트를 수정 범위에서 동기화하고 타입 검사 및 관련 자동 검증 수행. 실제 브라우저·폐쇄망 검증은 별도 보고.

**구현 결과 (2026-11-17)**
- `PopupQuestionEditor.tsx`의 `richTitle` 분기와 일반 `TextField` 제목을 제거해 제목은 항상 `PopupRichTextEditor`(compact)다. `richQuestionText`는 선택지 분기(및 정답·삭제 칸 높이)에만 남았다. disabled 속성은 원래 없었고, 일반 입력으로 바뀌는 분기가 원인이었다.
- 제목 저장은 기존 `initialRich(titleBlocks, title)`·`richValue`를 그대로 쓴다. `title`만 있는 기존 문항은 서식 없는 문단으로 열리고 열기만 하면 저장값이 바뀌지 않는다. 일반 입력에서 고칠 때 `titleBlocks`를 비우던 동작(TODO73-29)은 제목에는 더 이상 해당하지 않는다(선택지 일반 입력에는 유지).
- 가이드(요약·props·사용 예 힌트·시작 탭)·공지(`2026-11-17-question-title-always-rich`)·`POPUP_FRONT_SAMPLE_HANDOVER.md`를 새 기준으로 고쳤다.
- 검증: `tsc --noEmit`·변경 파일 eslint 통과. `verify-survey-rich-text-55.cjs` 67건(설문 제목 서식 편집기·저장 서식 표시, 문단→`title` 줄바꿈·`titleBlocks` 저장, 빈 제목·1001자 검증, `title`만 있는 주관식 문항 열기 시 저장값 불변, `richQuestionText=true` 제목+선택지, 퀴즈 4종 제목) 통과. `quiz option byte 73` 44건, `guide registry` 299건, `guide render` 31건, `TODO69 sample` 62건, `RgstPop quiz rule` 25건, `question template picker` 7건 통과. 서버 저장→재조회 실화면은 미실행.

### 2. CKEditor 기본 글자 크기와 미리보기 Dialog 일치

**확정 방향: B안 — 공통 기본 폰트 크기를 명시적으로 적용**
- [x] 폰트 크기가 **명시되지 않은** 편집기 콘텐츠에 대해 CKEditor 입력 영역과 관리자 미리보기 Dialog가 동일한 공통 기본 `font-size`를 사용한다.
- [x] `.ck-editor` 및 Dialog 상위 요소의 상속 CSS 차이에 의존하지 않도록 공통 기준을 적용한다. 명시적 run/inline 크기는 덮어쓰지 않는다.
- [x] 기본 크기·명시적 크기 혼합, 기존 저장 데이터(크기 속성 없음)에도 동일한 기준을 적용한다.

**구현 전 확인할 사항 — 기본 px 수치**
- 현행 CKEditor의 실제 기본 글자 크기, 편집 영역의 computed style, 미리보기 Dialog 및 공통 렌더러의 computed style을 동일 브라우저/배율에서 비교한 뒤 **공통 기본 px 수치를 확정**한다. 임의로 새 숫자를 지정하지 않는다.
- 선택지: (A) 편집기의 암묵적 CSS 크기를 미리보기에만 복제 / **(B, 채택)** 명시적 공통 기본값을 편집기·미리보기에 적용. B는 상위 CSS 상속 변화에 따른 재발 위험을 줄인다. 확정 수치가 기존 TEXT 기본 크기·bodyFontSize 및 WPF 표시 계약과 충돌하는지는 구현 전 확인한다.

**구현 시 확인 및 완료 기준**
- [x] `zero-rule-web/main/src/components/ckeditor/ckeditorEngine.ts`, `PopupRichTextEditor`, `PopupPreviewDialog`, 미리보기 렌더러, `popupEditorTransform.ts`의 기본 크기·스타일 상속·블록 변환 경로를 확인한다.
- [x] 크기 미지정 / 명시적 크기 / 혼합 구간 / 기존 저장 블록 / 재편집·미리보기 Dialog에 대해 computed `font-size` 및 실제 표시를 대조한다. TEXT·SURVEY·QUIZ 관련 사용처의 회귀를 확인한다.
- [x] 기본값만 변경하고 데이터에 불필요한 `size` 속성을 강제 저장하지 않는지 확인한다. API·DB·WPF 계약 변경 필요성이 발견되면 별도 승인 대상으로 분리한다.
- [ ] 타입 검사·관련 하네스·브라우저 실화면을 구분해 검증 결과를 기록하고, 폐쇄망 화면은 별도 확인한다.

**구현 결과 (2026-11-17)**
- 실측(headless Edge, 100%): 하네스 기본 테마에서는 CKEditor 편집 영역·미리보기·Dialog 모두 상속값 16px였다. 관리자 웹 테마는 `body1` 0.85rem(13.6px)이라 Dialog 안 미리보기는 상속값을 따르고, CKEditor는 편집 영역 상위 요소에 따라 달라진다. 어느 쪽도 WPF 기본값(TEXT 본문 15)과 같다는 보장이 없어 상속에 맡기지 않는다.
- 공통 기본 px는 새 숫자를 만들지 않고 WPF XAML 기본값을 그대로 쓴다: `popupCommon.ts` `POPUP_DEFAULT_FONT_SIZES`(헤더 17, 푸터 14, TEXT 본문 15, IMAGE·VIDEO 설명 14, 설문 설명 14, 문항 제목 16, 문항 설명 13, 선택지 12, 설문 본문 14). 기존 TEXT 기본 크기·`bodyFontSize`·WPF 표시 계약과 충돌하지 않으며 API·DB·WPF 계약 변경 없음.
- `PopupRichTextEditor`: 편집 영역에 기본 `font-size`를 명시하고 `baseFontSize` prop 추가(생략 시 optionSize 12, compact 14, 그 밖 15). 문항 제목 편집기는 16. 서식의 `size`는 span 인라인 크기로 그대로 우선하고, 기본값을 `size`로 저장하지 않는다.
- `PopupPreview`: SURVEY·QUIZ 이외 본문 영역에 `bodyFontSize ?? 유형별 기본값`을 항상 명시하고, 푸터도 `footerFontSize ?? 14`를 항상 명시한다. 헤더는 기존대로 `headerFontSize ?? 17`.
- 확인한 것: 미사용 `ckeditorEngine.ts` 기본 크기 설정은 없음(툴바 `fontSize` 항목만). 글꼴 종류는 편집기(CKEditor 기본 Helvetica 계열)와 미리보기(테마 Malgun Gothic)가 다르지만 이번 범위(크기)가 아니라 그대로 두고 별도 확인 항목으로 남긴다.
- 검증: `verify-rich-text-49` 78건(TEXT 편집기·미리보기 기본 15, 지정 크기 20 유지, 기본값을 run `size`로 저장하지 않음, compact 14), `verify-survey-rich-text-55` 74건(문항 제목 편집기 16, 테마 body 13.6px에서도 Dialog 헤더 17·TEXT 본문 15·푸터 14) 통과. 실제 관리자 화면·폐쇄망 화면은 미확인.

### 3. SURVEY·QUIZ 선택지 기본 크기

**확정 요구사항**
- [x] 관리자 웹에서 SURVEY·QUIZ 선택지의 기본 입력 높이는 `32px`, 기본 글자 크기는 `12px`로 적용한다. 일반 텍스트와 서식 편집기의 기본 표시 기준을 동일하게 맞춘다.
- [x] `32px`는 기본 한 줄 입력 영역 기준이다. 줄바꿈·긴 내용에서 잘림이 없는지 확인하며, 명시한 글자 크기는 기존 서식대로 표시한다. 2번의 전체 콘텐츠 공통 기본 글자 크기는 별도로 확인한다.

- [x] 관리자 미리보기와 WPF 실제 팝업의 선택지에도 한 줄 기본 높이 `32px` 및 기본 글자 크기 `12px`에 해당하는 논리 크기를 적용한다. 100% 기준으로 웹 CSS px와 WPF DIP를 비교한다. 긴 문구의 줄바꿈과 명시적 서식을 확인한다.

**구현 시 확인 및 완료 기준**
- [x] `PopupQuestionEditor.tsx`의 일반 선택지 입력과 `PopupRichTextEditor`의 선택지용 compact 경로를 확인한다. 문항 제목·주관식 답변·단독 TEXT 편집기로 크기가 전파되지 않도록 한다.
- [x] 동일 브라우저와 확대율에서 SURVEY/QUIZ × 일반/서식 선택지의 한 줄 입력 영역 실측 높이 `32px` 및 기본 글자 computed `12px`를 확인한다. OX의 기존 입력·정답 선택, 포커스·검증 표시, 긴 입력 및 명시 서식 보존도 확인한다.
- 상태: 구현·자동 검증 완료(2026-11-17). 브라우저·WPF 실화면 나란히 비교는 대기.

**결정 (2026-11-17)**
- 선택지 글자 = `bodyFontSize - 2`(미지정 시 14 - 2 = 12). 문항 제목 +4·설명 +1의 기존 상대 계층을 유지하고 `bodyFontSize` 변경이 선택지에도 반영된다.
- OX 문항도 일반 선택지와 같은 32·12(줄 18)로 통일한다(2026-11-13 56·24 대체). 두 칸 같은 폭·굵게·가운데 정렬만 유지한다.

**구현 결과 (2026-11-17)**
- 편집기: 일반 선택지 `TextField`에 `OPTION_INPUT_SX`(글자 12·줄 18·위아래 여백 7, MUI 외곽선은 겹쳐 그려 높이에 더해지지 않음), 서식 선택지 `PopupRichTextEditor`에 새 prop `optionSize`(안쪽 최소 30 + 테두리 2 = 32, 글자 12·줄 18·문단 위아래 6). 정답·삭제 칸은 일반·서식 모두 32. 문항 제목 편집기·주관식 정답 입력은 변경 없음.
- 미리보기 `SurveyPreview`: 선택지 `minHeight` 32, 여백 6/16(세로형)·6/14(가로형), 글자 `surveyOptionFontSize(bodyFontSize)`(본문 - 2), 줄 높이 글자 × 1.5. OX도 같은 크기. `bodyFontSize`를 받아 문항 제목 +4·설명 +1·주관식 = 본문으로 직접 정하고, `PopupPreview`는 SURVEY·QUIZ에 `.MuiTypography-root { font-size: inherit }` 상속 규칙을 적용하지 않는다(이전에는 문항 제목·설명이 본문과 같은 크기로 표시돼 WPF +4·+1과 달랐음).
- WPF: `SurveyStyles.V1/V2.xaml` 선택지 `MinHeight` 44·48 → 32, 여백 14,10 → 14,6(포커스 13,5), 행 16,12 → 16,6. `SurveyPopupView`가 선택지 컨트롤 글자를 본문 - 2로 정하고(`RegisterOptionControl`), 일반 문구 줄 높이 22 고정을 글자 × 1.5로 변경. `ApplyBodyFontSize`가 선택지 글자·줄 높이(서식 문단 포함)를 함께 갱신. OX 전용 상수(56·24·32) 제거. 화면 재구성 시 서식 선택지 문단 목록도 비우도록 정리.
- 문서: WPF 사양서 2종에 선택지 크기·본문 매핑, 가이드 props(`optionSize`)·공지 추가.
- 검증: 웹 `tsc --noEmit`·eslint(기존 `popupRichText.ts` 경고 1건 외 없음). 하네스 `survey rich text 55` 71건(일반·서식 선택지 입력 32px·12px, 두 문단 56px, 제목 편집기 크기 불변, 미리보기 선택지 32·12·줄 18, OX 32·12·굵게, `bodyFontSize` 18 → 선택지 16·줄 24·제목 22·설명 19·헤더 17), `TODO61 preview` 126건, `completion UX 43` 78건, `TODO69 sample` 62건, `IMAGE preview` 54건, `rich text 49` 75건, `TODO64 transform` 78건, `quiz option byte 73` 44건, `RgstPop quiz rule` 25건, `guide registry` 304건, `guide render` 31건, `question template picker` 7건 통과. WPF 빌드 경고·오류 0, PopupWindowTests 562건(OX 32·12·굵게·같은 폭, 일반 선택지 MinHeight 32·글자 12·한 줄 32, `ApplyBodyFontSize(18)` → 선택지 16·줄 24), Popup.BehaviorTests 1740건(긴 선택지 두 줄 50 = 18 × 2 + 여백 12 + 테두리 2), Popup.RecoveryTests 255건, ApiDemoTests 150건 통과. 같은 데이터로 브라우저·WPF 실화면 나란히 비교, 확대 DPI, 폐쇄망은 미실행.

### 4. 실제 팝업 레이아웃 변경 동시 반영

- [x] 이번 TODO에서 실제 팝업 표시를 바꾸는 항목은 관리자 미리보기와 WPF에 같은 변경 단위로 반영한다. 편집기 입력에만 쓰이는 컨트롤은 관리자 웹에서 적용한다.
- [x] 관리자 웹 `PopupPreviewDialog`와 유형별 미리보기 렌더러, `popup-frameWork/Popup`의 대응 팝업 뷰 및 스타일에서 한 줄 높이, 기본 글자 크기, 간격, 줄바꿈을 확인한다. 기본값과 명시 서식의 우선순위를 대조한다.
- [ ] 같은 팝업 데이터로 관리자 미리보기와 WPF 실화면을 비교한다. SURVEY·QUIZ에서 기본/명시 서식, 긴 선택지, 기존 데이터 및 100%·확대 DPI의 잘림을 확인한다. 공통 스타일을 변경하면 해당 스타일을 쓰는 다른 팝업 유형도 회귀 검증한다.
- [ ] 완료 기준은 관리자 웹 타입 검사, WPF 빌드, 동일 데이터로 양쪽 실화면 비교 통과다. 폐쇄망 실화면 검증 결과는 별도 기록한다.

### 5. 편집 기능이 없는 표시 영역의 기본 스타일 회귀 검증

**구현 시 확인할 사항**
- [x] 관리자 웹 `PopupPreviewDialog`와 유형별 렌더러의 CSS 및 스타일 매핑, WPF `popup-frameWork/Popup`의 공통 창과 유형별 뷰·XAML 스타일을 따라가며 에디터를 거치지 않는 표시 영역에 해당 영역의 기본 스타일을 명시적으로 적용한다. 헤더·본문·푸터의 폰트 키와 상속 경로를 각각 대조한다.
- [x] 헤더에 `bodyFontSize`가 적용된 것으로 보고된 웹 사례를 재현한다. 헤더는 명시된 `headerFontSize`를 우선 적용하고, 생략한 경우 계약에 명시된 기본값 17을 적용한다. 웹에서는 해당 제목 요소의 CSS `font-size`로, WPF에서는 대응 요소의 `FontSize`로 확인한다. 본문과 푸터에는 각 영역의 기존 기본값과 명시값을 적용한다.
- [x] 유형별로 헤더·본문·푸터 및 서식 편집 없는 제목·안내문·선택지 등 실제 표시 영역을 확인한다. 기존 필드와 표시 기본값을 사용하고, 이미 명시된 인라인 서식과 선택지 기본 12px의 적용 범위를 확인한다.

**완료 기준 및 검증 방법**
- [x] TEXT·IMAGE·IMAGE_FILL·VIDEO·SURVEY·QUIZ에 공통 스타일 변경이 전파되는지 회귀 검증한다. (자동 검증 범위는 아래 결과 참고) 각 유형에서 값 미지정(구버전 데이터 포함), 영역별 명시값을 서로 다르게 지정, 해당 영역 숨김을 확인한다. 특히 `bodyFontSize`만 지정했을 때 헤더는 17이고, 헤더와 본문을 모두 지정하면 각자의 값으로 표시되는지 확인한다.
- [ ] 동일한 팝업 데이터로 브라우저의 computed `font-size`와 WPF 요소의 실제 `FontSize`를 대조하고, 100% 기준 화면과 확대 DPI에서 줄바꿈·잘림을 확인한다. 웹 타입 검사, WPF 빌드, 양쪽 실화면 및 폐쇄망 실화면 결과를 구분해 기록한다.

**구현 결과 (2026-11-17)**
- 재현: 저장소 기준으로 웹 헤더가 `bodyFontSize`를 받는 경로는 없었다(헤더는 본문 Box 밖, `headerFontSize ?? 17`). 하네스에서 테마 body 13.6px·`bodyFontSize` 18로도 헤더 17 유지. 보고된 사례는 발생 화면 정보가 없어 저장소 기준으로 재현하지 못했다. 대신 실제 차이를 찾았다: SURVEY·QUIZ 미리보기는 `bodyFontSize`가 있으면 본문 Box의 `.MuiTypography-root { font-size: inherit }` 규칙 때문에 문항 제목·설명까지 본문과 같은 크기가 돼 WPF(제목 +4·설명 +1)와 달랐다 → 3번 커밋에서 SurveyPreview 직접 매핑으로 수정.
- 영역별 기본값 명시는 2번 구현 결과 참고. 웹: 값 미지정·각 영역 다른 값(헤더 22·본문 12·푸터 16)·`bodyFontSize`만 지정(헤더 17·푸터 14 유지)을 TEXT Dialog로, 설문 매핑(선택지 -2·제목 +4·설명 +1)을 SURVEY 미리보기로 확인. WPF: PopupWindowTests에 TEXT 기본(17·15·14)·`bodyFontSize`만(17·18·14)·각자 값(22·12·16) 검사 추가(565건 통과), 설문 `ApplyBodyFontSize(18)` → 선택지 16 검사.
- 남은 확인: IMAGE·IMAGE_FILL·VIDEO의 영역별 값은 기존 하네스(`IMAGE preview` 54건, `TODO61 preview` 126건, `completion UX 43` 78건) 회귀 통과로만 확인했고 새 계측 검사는 추가하지 않았다. 브라우저·WPF 실화면 나란히 비교, 확대 DPI, 폐쇄망 화면은 미실행.

**나란히 비교 결과 (2026-11-17)**
- `scripts/verify-popup-parity.cjs`로 같은 데이터(SURVEY·SURVEY `bodyFontSize` 18·QUIZ OX·TEXT 기본·TEXT 영역별 값)를 관리자 미리보기와 WPF 팝업에 그려 나란히 비교했다. 이번 TODO 범위(선택지 32/12·본문 매핑·영역별 기본 글자)는 선택지 17개 높이·글자 자동 대조와 이미지 육안 확인 모두 일치.
- 이번 범위 밖 차이 4건(흰 판 크기 48 차이, 확인 버튼 색, 설문 푸터 구분선, 빈 설명 자리·문항 간격)은 `docs/reviews/POPUP_PREVIEW_WPF_PARITY.md`에 기록하고 수정 여부 결정 대기.
- 남은 확인: 로그인한 실제 관리자 화면, 확대 DPI, 서버 저장→재조회, 폐쇄망.

## 후속 TODO — 2026-11-18 폐쇄망 등록 미리보기와 동영상+퀴즈 설명 표시

### 6. 폐쇄망 등록 미리보기의 예시 표시 기본 OFF

- [ ] 등록 화면의 인라인 미리보기와 실제 크기 Dialog에 같은 표시 기준을 적용한다. 폼에 입력란이 없거나 값이 비어 있는 항목의 예시 표시를 기본 OFF로 둔다. 입력한 헤더 제목과 설명은 표시하고, 입력란이 없는 영상 본문 제목의 예시 문구는 숨긴다. 폼에 노출된 실제 표시 스위치는 값을 반영한다.
- [ ] `PopupPreview.tsx`, `PopupPreviewDialog.tsx`, `AspectVideoArea.tsx`의 `hidePlaceholders`와 영상 렌더링 조건을 확인한다. 폐쇄망 등록 미리보기에서 영상을 첨부하지 않았으면 검은 영역·안내·예시 컨트롤을 포함한 영상 영역 전체를 접는다. 첨부하면 영상 영역을 표시하고 첨부를 제거하면 다시 접는다. 가이드 등 샘플 호출부는 예시 표시를 명시적으로 켤 수 있어야 한다.
- [ ] 동영상·동영상+퀴즈·퀴즈·설문에서 빈 값·입력·삭제와 인라인/Dialog 일치를 확인한다. 동영상이 있는 경우 재생 컨트롤과 시청 완료 조건을 회귀 검증한다.

### 7. 동영상+퀴즈에서 설명 한 번 표시

- [ ] 동영상+퀴즈 결합 화면의 제목·설명 표시에는 내부 동영상의 제목·설명 표시 옵션을 적용하지 않는다. 공통 설명은 퀴즈 머리말에 한 번 표시한다. 유효한 `descriptionBlocks`가 있으면 서식을 표시하고, 일반 설명만 있는 기존 데이터는 `description`을 사용한다. 빈 설명은 숨긴다.
- [ ] 웹의 `PopupPreview.tsx` → `SurveyPreview.tsx` 렌더링과 WPF의 `VideoQuizPopupView.cs` → `SurveyPopupView.CollapseHeaderShownAbove()` 경로에 같은 기준을 적용한다. 표시만 조정하며 기존 요청·저장 형식을 사용한다.
- [ ] 일반 설명·서식 설명·빈 설명과 내부 영상 설명 옵션 ON/OFF를 포함해, 같은 데이터로 웹과 WPF의 표시 위치·횟수·서식을 비교한다. 단독 동영상의 제목·설명과 동영상+퀴즈의 시청 잠금·제출 동작을 회귀 검증한다.

### 8. 설문·퀴즈 미리보기 문항 자동 채번 제거 — 미진행

- [ ] `SurveyPreview.tsx`에서 제목 앞에 자동 렌더링하는 `01`, `02` 문항 번호와 번호가 차지하던 여백을 제거한다. 등록 편집기의 일반 선택지 앞 번호 제거와 별개인 미구현 항목이다.
- [ ] 설문·퀴즈·동영상+퀴즈의 인라인 미리보기와 실제 크기 Dialog에서 번호가 없어지고, 제목에 직접 입력한 숫자·문항 순서·필수 표시·채점이 보존되는지 확인한다. 동일 데이터로 WPF의 문항 제목 표시를 대조하고, WPF 실제 팝업의 번호 표시까지 변경할 범위는 대조 결과로 확인한다.

- 완료 검증은 웹 타입 검사, WPF 빌드, 동일 데이터의 웹·WPF 화면 비교, 폐쇄망 실화면 확인으로 기록한다.
