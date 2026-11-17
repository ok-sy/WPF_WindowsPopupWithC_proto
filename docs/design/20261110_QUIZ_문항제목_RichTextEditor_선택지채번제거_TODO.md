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


## 후속 TODO — 2026-11-17 관리자 WEB 설문 제목·기본 폰트 미리보기 정합성

- 상태: **요건·방향 확정 / 구현 및 검증 대기**. 기존 2026-11-10 완료 항목의 완료 표시는 유지한다.
- 대상: 관리자 WEB 편집기 및 미리보기. 이 단계에서는 **TODO 문서만 변경**하며 코드·정책·API·DB·WPF는 수정하지 않는다.

### 1. SURVEY·QUIZ 문항 제목 서식 편집기 상시 사용

**확정 요구사항**
- [ ] 문항 제목은 `quiz=true/false` 및 `richQuestionText=true/false`와 무관하게 항상 `PopupRichTextEditor`(compact)로 입력·수정 가능해야 한다.
- [ ] `richQuestionText`는 **선택지 입력 방식**(일반 텍스트 / 서식 편집기)만 제어한다. `quiz`는 정답·채점 등 퀴즈 전용 UI에만 영향을 주며 문항 제목 편집기를 전환하지 않는다.
- [ ] `title`·`titleBlocks` 기존 저장 계약을 유지하고 일반 입력 ↔ 서식 입력 전환 시 기존 제목과 서식을 유실하지 않는다.

**현행 코드와 차이**
- `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`의 `questions.map` 내부 `const richTitle = quiz || richQuestionText` 때문에 SURVEY + `richQuestionText=false`에서 제목이 일반 `TextField`로 렌더링된다. 실제 disabled 속성 여부는 별도로 확인한다.
- `richQuestionText` 선택지 분기는 유지하되 제목 분기는 제거하거나 상시 서식 편집기로 고정한다.
- 이 변경은 위 문서의 **SURVEY 제목 동작 유지**라는 2026-11-10 기존 범위를 대체한다.

**구현 시 확인 및 완료 기준**
- [ ] `PopupQuestionEditor.tsx` 제목 분기·`onChange`(`title/titleBlocks`)·선택지 `richQuestionText` 분리 확인.
- [ ] QUIZ/SURVEY × `richQuestionText` true/false 4조합에서 제목 서식 편집 가능, 선택지 편집 방식만 해당 props에 따라 변경되는지 검증.
- [ ] 신규/기존 문항, 일반 문자열만 저장된 기존 문항, 서식 블록 포함 문항의 편집→저장→재조회→미리보기 왕복 확인. 제목 내용·서식 보존, 선택지 번호·정답·점수 회귀 확인.
- [ ] 관련 가이드·props 설명·기존 테스트를 수정 범위에서 동기화하고 타입 검사 및 관련 자동 검증 수행. 실제 브라우저·폐쇄망 검증은 별도 보고.

### 2. CKEditor 기본 글자 크기와 미리보기 Dialog 일치

**확정 방향: B안 — 공통 기본 폰트 크기를 명시적으로 적용**
- [ ] 폰트 크기가 **명시되지 않은** 편집기 콘텐츠에 대해 CKEditor 입력 영역과 관리자 미리보기 Dialog가 동일한 공통 기본 `font-size`를 사용한다.
- [ ] `.ck-editor` 및 Dialog 상위 요소의 상속 CSS 차이에 의존하지 않도록 공통 기준을 적용한다. 명시적 run/inline 크기는 덮어쓰지 않는다.
- [ ] 기본 크기·명시적 크기 혼합, 기존 저장 데이터(크기 속성 없음)에도 동일한 기준을 적용한다.

**구현 전 확인할 사항 — 기본 px 수치**
- 현행 CKEditor의 실제 기본 글자 크기, 편집 영역의 computed style, 미리보기 Dialog 및 공통 렌더러의 computed style을 동일 브라우저/배율에서 비교한 뒤 **공통 기본 px 수치를 확정**한다. 임의로 새 숫자를 지정하지 않는다.
- 선택지: (A) 편집기의 암묵적 CSS 크기를 미리보기에만 복제 / **(B, 채택)** 명시적 공통 기본값을 편집기·미리보기에 적용. B는 상위 CSS 상속 변화에 따른 재발 위험을 줄인다. 확정 수치가 기존 TEXT 기본 크기·bodyFontSize 및 WPF 표시 계약과 충돌하는지는 구현 전 확인한다.

**구현 시 확인 및 완료 기준**
- [ ] `zero-rule-web/main/src/components/ckeditor/ckeditorEngine.ts`, `PopupRichTextEditor`, `PopupPreviewDialog`, 미리보기 렌더러, `popupEditorTransform.ts`의 기본 크기·스타일 상속·블록 변환 경로를 확인한다.
- [ ] 크기 미지정 / 명시적 크기 / 혼합 구간 / 기존 저장 블록 / 재편집·미리보기 Dialog에 대해 computed `font-size` 및 실제 표시를 대조한다. TEXT·SURVEY·QUIZ 관련 사용처의 회귀를 확인한다.
- [ ] 기본값만 변경하고 데이터에 불필요한 `size` 속성을 강제 저장하지 않는지 확인한다. API·DB·WPF 계약 변경 필요성이 발견되면 별도 승인 대상으로 분리한다.
- [ ] 타입 검사·관련 하네스·브라우저 실화면을 구분해 검증 결과를 기록하고, 폐쇄망 화면은 별도 확인한다.

### 3. SURVEY·QUIZ 선택지 입력 기본 크기

**확정 요구사항**
- [ ] 관리자 웹에서 SURVEY·QUIZ 선택지의 기본 입력 높이는 `32px`, 기본 글자 크기는 `12px`로 적용한다. 일반 텍스트와 서식 편집기의 기본 표시 기준을 동일하게 맞춘다.
- [ ] `32px`는 기본 한 줄 입력 영역 기준이다. 줄바꿈·긴 내용에서 잘림이 없는지 확인하며, 명시한 글자 크기는 기존 서식대로 표시한다. 2번의 전체 콘텐츠 공통 기본 글자 크기는 별도로 확인한다.

**구현 시 확인 및 완료 기준**
- [ ] `PopupQuestionEditor.tsx`의 일반 선택지 입력과 `PopupRichTextEditor`의 선택지용 compact 경로를 확인한다. 문항 제목·주관식 답변·단독 TEXT 편집기로 크기가 전파되지 않도록 한다.
- [ ] 동일 브라우저와 확대율에서 SURVEY/QUIZ × 일반/서식 선택지의 한 줄 입력 영역 실측 높이 `32px` 및 기본 글자 computed `12px`를 확인한다. OX의 기존 입력·정답 선택, 포커스·검증 표시, 긴 입력 및 명시 서식 보존도 확인한다.
- 상태: 요건 확정. 구현·타입 검사·실화면 확인 대기.
