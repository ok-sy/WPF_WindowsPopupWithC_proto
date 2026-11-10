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
