# TODO73 — 관리자 웹 퀴즈·설문 에디터 입력 정리 및 공통코드 매핑

작성일: 2026-11-05  
상태: **구현·자동 검증 완료(2026-11-05, §6~§9는 2026-11-09) / 실화면·원격 개발 DB·폐쇄망 확인 대기**  
적용 범위: 관리자 웹 **편집기 및 편집용 데이터 변환**, 기획서 퀴즈(1/2, 2/2) 화면과 전달된 변경요청 기준. WPF·서버·DB·인터페이스 계약 변경은 이번 단계에서 제외.

## 1. 요구사항 기준

| 번호 | 요구사항 | 화면 처리 | 계약·데이터 주의 |
| --- | --- | --- | --- |
| 73-1 | **세부 설명 항목 삭제** | 퀴즈/설문 **문항별 설명** 입력 영역을 에디터에서 제거. 문항 제목·선택지 입력은 유지 | 기존 `description`/`descriptionBlocks` 보유 데이터를 편집기에서 보이지 않는다는 이유로 저장 시 임의 삭제하지 않음 |
| 73-2 | **답안 유형: 선다형·OX형** | 기획서의 '답안 유형'을 선택하는 SelectBox 제공. 퀴즈/설문 편집기에서 OX 선택 시 O·X 항목, 선다형 선택 시 선택지 추가·삭제 가능 | OX형은 기존 `SINGLE_CHOICE` + `O/X` 선택지로 매핑할 수 있는지 확인. 기존 복수 선택·주관식 데이터 보존, 선택 형식/정답 규칙 회귀검증 |
| 73-3 | **InputBox/SelectBox 공통코드 매핑** | 퀴즈 유형은 **0090**, 답안 유형은 **0089** 코드 목록과 연결(`CLOVER_CODE_TYPE`·`CLOVER_CODE`) | 0089: 01 OX형, 02 선다형. 0090: 00 참여형, 01 만점형, 02 컷트라인형. 표시 이름은 조회 결과를 쓰고 코드값은 저장하지 않음 |
| 73-4 | **퀴즈 유형 정리** | 퀴즈 유형 SelectBox에 **참여형·만점형·커트라인형** 제공 | 기존 `passingScore` 매핑: 참여형 0(항상 `passed=true`), 만점형 총점, 컷트라인형 지정 통과 기준(미달이면 `passed=false`, 제출되지 않음). 배점 1점 고정 여부/표시 단위 확인. 신규 서버 필드 임의 생성하지 않음 |

> 요청 원문 대조(2026-11-05): 메일 2번 콘텐츠 제목(`surveyTitleBlocks`) 삭제와 5번 Text CKEditor 헤더(상단 툴바, `hideToolbar`)도 이번 범위에 포함한다. 1번 나중에 보기 좌측은 `2edbb40`에서 반영 완료. 퀴즈 문항은 단일 객관식만 있고 OX형은 웹 프리셋이다. `surveyTitle`은 쓰지 않고 콘텐츠 안의 `description`(서식은 `descriptionBlocks`)만 쓴다. 답안 유형(0089)은 퀴즈 전용이고, 설문은 기획서 5장 기준 응답 유형(객관식·주관식)·레이아웃·응답 수(단일·복수, 개수)를 쓴다.

## 2. 현행 구현·수정 후보

- `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`: 현재 문항 제목/설명 `PopupRichTextEditor`, 문항 유형 `SINGLE_CHOICE/MULTIPLE_CHOICE/TEXT`, OX 문항 추가 프리셋, 선택지/정답/배점 편집을 제공. 변경 중심 파일.
- `zero-rule-web/main/src/features/RgstPop/` 및 관련 편집 부모: 퀴즈 유형 선택과 `passingScore` 연동, 저장 요청 전에 공통코드 선택값을 기존 모델로 변환하는 책임 위치 확인.
- 공통코드 로딩: 기존 `UserMainApi.clCode` 또는 코드 조회 경로 및 E0089/E0090 데이터·권한·오프라인 환경 제공 여부 확인. 구체 호출 메서드와 응답 구조는 구현 전 소스 확인.
- `PopupcommonComponent` 가이드·샘플·미리보기: **에디터에서만** 변경한다는 범위를 유지하며 필요 시 설명·검증만 조정. WPF 표시 모양과 API DTO 스키마는 변경 대상으로 간주하지 않음.

## 3. 구현 결과

- [x] **73-1** 문항 설명 입력 제거. 기존 `description`·`descriptionBlocks`는 문항 객체에 남겨 저장 시 유지.
- [x] **요청 2** 콘텐츠 제목 입력 제거. 기존 `surveyTitle`·`surveyTitleBlocks`는 등록 화면 편집값에 남아 유지·표시. 설명(`description`) 입력은 유지.
- [x] **요청 5** TEXT 본문 편집기에 `hideToolbar` 적용. 서식은 우클릭 패널로 지정.
- [x] **73-2** 퀴즈 답안 유형 SelectBox. OX형은 `SINGLE_CHOICE` + O·X 선택지 + 가로 배치, 선다형은 선택지 추가·삭제. `OX 문항 추가` 버튼 제거. 정답 선택은 단일 선택 문항에서 라디오.
- [x] **73-3·73-4** `popupQuestionCodes.ts`로 코드 → 내부 값 매핑. RgstPop은 `api.clCode.search`로 조회하고, 조회 전·실패 시 선택을 막고 안내. 샘플은 서버가 없어 샘플용 목록 사용(`[실연동]` 표시). 통과/실패 제출 유형은 삭제. 참여형은 기준 개수 입력 없이 통과 점수 0.
- [x] **73-5** 기존 복수 선택·주관식 퀴즈 문항은 `기존 유형` 항목으로 표시하고 값을 유지. 새 문항에서는 선택할 수 없음.
- [x] **설문** 응답 유형·레이아웃·응답 수 입력으로 변경. 복수 선택 개수는 `maxSelections`로 저장.
- [x] **개발 DB 코드** `db/oracle/22_popup_question_code_oracle.sql` 추가. 로컬 XE 적용 완료, 원격 개발 DB는 접속 복구 후 적용.
- [x] **미리보기** 설문·퀴즈의 `예제 문항 보기` 버튼 삭제.
- [ ] 문항 추가 직후 기획서의 `선택하세요` 기본값은 미적용. 새 문항은 선다형·단일 선택으로 시작.
- [x] OX 외 문항 제목·선택지는 일반 텍스트 입력으로 전환한다. 적용 기준은 §7을 따른다. — 2026-11-09 반영. QUIZ 문항 제목은 2026-11-10 [QUIZ 문항 제목 RichTextEditor 통일 TODO](20261110_QUIZ_문항제목_RichTextEditor_선택지채번제거_TODO.md)로 대체(OX 여부와 무관하게 서식 편집기, 선택지 자동 번호 제거).

## 3-1. 확인 대기

- **참여형 통계(2026-11-09 갱신):** 아래는 당시 기록이다. 이후 PU001 TODO §7에서 참여형도 합격 기준 개수(`passingScore`)를 입력·저장하고 유형을 `quizTypeCode`(POPUP_NOTICE.QUIZ_TYPE_CD)로 저장하며, 결과 `passed`로 합불을 기록하도록 바뀌었다(73-4의 '참여형 0' 매핑 대체). 당시 기록: 참여형은 항상 통과한다. 기획서 1-4의 "개 이상 합격 / 미만 불합격"은 서버가 관리하는 출력용 통계값이며 WPF 에이전트와 웹 편집기는 다루지 않는다. 서버 구현은 이번 범위에 포함하지 않았다.
- **미실행:** 실화면 확인, 원격 개발 DB 코드 조회, 폐쇄망 코드 조회·`SORT_SEQ` 순서 확인, WPF에서 제목 없는 설문·퀴즈 표시.

## 4. 완료 기준·변경 제한

- 관리자 편집 화면에서 문항별 세부 설명 입력을 제거하고, 퀴즈 유형/답안 유형은 정확한 공통코드 기반 선택 UI를 제공한다.
- 기존 저장 JSON, 정답/배점 계산, 이전 유형의 데이터가 저장 과정에서 손실되지 않는다.
- 화면 입력값이 기존 `PopupQuestion`, `passingScore` 및 저장 API에 올바르게 매핑되고 회귀검증을 통과한다.

참고: `docs/design/20261102_PU001P01-P06_요구사항정의_정합성검토_TODO.md`, `docs/design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md`.

## 5. 추가 TODO — OX형 정답 선택 영역 단순화 (2026-11-05)

상태: **구현·하네스 검증 완료(2026-11-05) / 실화면·서버 저장 왕복 미수행**

### 요구사항

- [x] **73-10 OX 정답 선택 UI**: 관리자 웹 `PopupQuestionEditor`의 **OX형 문항 편집 영역에만** 큰 선택 칸 **2개(O / X)를 가로 배치**한다.
- [x] **73-11 중앙 정렬·클릭**: 각 칸 중앙에 **O 또는 X 문자 하나만 크게 표시**한다. 별도 라디오 원형·작은 선택 아이콘·'정답' 보조 배지 없이 **칸 전체 클릭**으로 정답을 선택한다.
- [x] **73-12 선택 상태**: 선택한 칸에만 테두리/배경 차이를 주고 다른 칸은 기본 상태로 표시한다. **둘 중 하나만 정답**으로 선택할 수 있게 한다. 키보드 포커스·선택 상태의 접근성 표현도 유지한다. — 화살표 키로도 옮기며 Tab 정지는 그룹당 1개다.
- [x] **73-13 기존 저장 계약 유지**: 선택 결과는 기존 `SINGLE_CHOICE`의 O/X 옵션과 `isCorrect`에 매핑한다. 신규 `questionType`, 별도 OX 정답 필드, 서버·WPF DTO 변경은 하지 않는다.
- [x] **73-14 적용 범위·회귀**: 선다형 문항의 선택지/정답 입력 UI는 기존대로 유지한다. **우측 인라인 미리보기와 실제 크기 미리보기의 응답 버튼 디자인을 이번 요구사항으로 일괄 변경하지 않는다.** 편집기 정답 X와 미리보기 사용자의 O 선택 상태가 독립적인지 검증한다.
- [x] **73-15 검증**: O↔X 전환, 단일 정답 유지, 저장·재조회, 기존 문항 로딩, 좁은 편집기 너비, 키보드 조작 및 관련 웹 타입 검사·회귀 테스트를 수행한다. — O↔X 전환, 단일 정답, 기존 문항 로딩, 300px 너비, 키보드, 타입 검사는 하네스로 확인. 저장·재조회는 편집값 JSON 왕복까지 확인했고 서버 저장 왕복은 미실행.

**의도한 화면**: `정답 선택 *` 아래에 같은 크기의 큰 `[      O      ] [      X      ]` 두 칸을 배치하고 가운데 글자만 표시한다. OX형은 선택지 추가/삭제/텍스트 편집을 제공하지 않는다.

**변경 제한**: 앞선 73-1~73-9 구현 이력 및 완료 표시를 소급 수정하지 않는다.

### 방향 변경 — 큰 칸은 미리보기·실제 팝업에 적용 (2026-11-05)

위 73-10·73-11의 큰 칸 크기와 73-14의 "미리보기 응답 버튼 변경 금지"는 이 절로 대체한다. 73-12·73-13과 편집기 키보드·단일 정답 동작은 유지한다.

- [x] **73-16 편집기 크기**: `PopupQuestionEditor`의 O·X 칸은 높이 52, 글자 20으로 되돌리고 가로만 두 칸이 폭을 똑같이 나눈다. `정답 선택 *` 라벨, 칸 전체 클릭, 화살표 키, 단일 정답은 유지한다.
- [x] **73-17 미리보기·실제 팝업**: `SurveyPreview`와 WPF `SurveyPopupView`의 OX 문항(가로 배치 단일 선택 + O·X)은 같은 크기의 칸 2개가 폭을 똑같이 나눠 표시한다. 높이 88 이상, 글자 36·굵게, 가운데 정렬, 간격 8(2026-11-13 높이 56·글자 24로 축소). 선택 표시는 문항 디자인(V1·V2)의 기존 칩 스타일을 그대로 쓰고, JSON·저장 형식은 바꾸지 않는다.
- [x] **73-18 검증**: 웹 타입 검사·eslint, `verify-survey-rich-text-55`, WPF `CheckOxQuestion73`으로 확인한다. 실화면 확인은 미수행.


## 6. 추가 TODO — MUI deprecated 정리·문항 30개 제한·미리보기 안내 (2026-11-09)

상태: **구현·하네스 검증 완료(2026-11-09) / 실화면·폐쇄망 미확인**. 기존 73-1~73-18 완료 이력·기존 데이터 정책은 변경하지 않는다.

### 6-1. MUI deprecated 속성 점검

- [x] **73-19 속성 현황 조사**: 관리자 설문·퀴즈 편집기 `PopupQuestionEditor.tsx`에서 TS6385 등 deprecated 경고가 발생하는 MUI 속성을 확인한다. 해당 편집기에서 실제 사용하는 항목만 대상으로 하며 연관된 입력 컴포넌트까지 점검한다.
- [x] **73-20 slotProps 전환**: MUI 설치 버전과 컴포넌트별 지원 여부를 확인한 후 아래 속성을 대응되는 `slotProps`로 이관한다. **기존 값·유효성·이벤트·스타일·접근성은 변경하지 않는다.**

  | 기존 TextField 속성 | 전환 대상 |
  | --- | --- |
  | `inputProps` | `slotProps.htmlInput` |
  | `InputProps` | `slotProps.input` |
  | `InputLabelProps` | `slotProps.inputLabel` |
  | `FormHelperTextProps` | `slotProps.formHelperText` |
  | `SelectProps` | `slotProps.select` |

- [x] **73-21 회귀검증**: 타입 검사·deprecated 경고·실제 입력 및 라벨·Select·에러 안내·폼 저장/재조회 동작을 비교한다. 프로젝트 전체 무관한 MUI 컴포넌트까지 일괄 치환하지 않는다.

### 6-2. 설문·퀴즈 최대 30문항

- [x] **73-22 상한 적용**: 관리자 설문·퀴즈 문항의 최대 개수를 **30개**로 제한한다. 신규 추가, 유형 변경, 템플릿 불러오기, 기존 데이터 로딩에서 동일한 상한을 검증한다.
- [x] **73-23 편집 UX**: `문항 N/30`을 보여 주고 30개 도달 시 `문항 추가` 버튼을 비활성화한다. 삭제하여 29개 이하가 되면 다시 활성화한다. 30개 초과 데이터는 **조용히 자르거나 덮어쓰지 않고** 사용자에게 사유를 표시하고 저장 제한 또는 별도 대응 여부를 확인한다.
- [x] **73-24 호환성**: 질문 유형·선택지·배점·통과 점수·응답 제한·저장 JSON은 유지한다. **이번 TODO는 우선 관리자 에디터의 개수 제한**이며 서버/WPF에도 동일 제한이 필요한지는 계약 검토 후 별도로 판단한다.

### 6-3. 우측 인라인 미리보기 크기 안내

- [x] **73-25 안내 문구**: 관리자 팝업 등록 화면의 **우측 인라인 미리보기 제목 오른쪽, '실제 크기로 보기' 버튼 왼쪽**에 다음 문구를 작은 회색 보조 텍스트로 표시한다: **`실제 팝업 크기와 다를 수 있습니다.`**
- [x] **73-26 레이아웃**: 3분할 레이아웃 및 우측 미리보기 실제 콘텐츠 크기를 변경하지 않는다. 가로 공간이 부족하면 안내 문구가 자연스럽게 줄바꿈되거나 별도 줄에 배치되도록 하며 제목/버튼과 겹치지 않도록 한다.
- [x] **73-27 표시 범위**: `InlinePopupPreview.tsx`와 필요 시 등록 부모의 헤더 배치를 점검한다. 안내는 **인라인 미리보기에서만** 표시하고 실제 크기 모달·실제 팝업 본문에는 넣지 않는다. 해당 공통 컴포넌트의 타 화면 호출부 영향도 검증한다.

### 변경 범위·완료 기준

- 후보 파일: `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`, `InlinePopupPreview.tsx`, `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx` (실제 호출 위치 확인 후 확정).
- 변경은 UI 입력 속성·문항 수 제한·미리보기 안내로 한정한다. 서버·WPF·API·DTO·DB 계약은 별도 승인 없이 수정하지 않는다.
- 문항 수 29→30→29, 템플릿에서 31문항 유입, 기존 자료 재조회, 작은 화면의 안내 문구 표시 및 MUI 속성 이전 후 동일한 입력 동작을 검증한다.
- **이번 등록은 TODO 문서 변경만** 수행한다. 구현, 빌드, 폐쇄망 테스트는 하지 않았다.

#### 구현 결과(2026-11-09)

- **73-19·20**: `PopupQuestionEditor.tsx`의 deprecated TextField 속성은 통과 점수 `inputProps`, 배점 `InputLabelProps` 2곳이었고 `slotProps.htmlInput`·`slotProps.inputLabel`로 옮겼다(MUI 6.5.0). `InputProps`·`FormHelperTextProps`·`SelectProps` 사용은 없었다. Radio·Checkbox의 `inputProps`는 6.x에서 deprecated가 아니어서 유지했다. 다른 공통 파일(`PopupScheduleFields` 등)은 73-21 범위 제한에 따라 바꾸지 않았다.
- **73-22·23**: `QUESTION_MAX = 30`(index.ts 공개). 헤더 `설문/퀴즈 문항 N/30`, 30개면 `문항 추가` 비활성과 `최대 30개까지 추가할 수 있습니다.` 표시, 삭제하면 다시 활성. 템플릿·기존 자료로 30개를 넘게 들어오면 자르지 않고 `role=alert` 안내를 표시하며 `validatePopupQuestions`가 같은 문구로 저장을 막는다. 템플릿 불러오기·유형 변경·재조회는 모두 이 편집기와 저장 전 검증을 거치므로 부모(RgstPop) 변경은 없다.
- **73-24**: 저장 JSON·서버·WPF·DTO는 변경 없음. 서버·WPF 상한은 미적용(별도 판단).
- **73-25~27**: `InlinePopupPreview` 제목과 버튼 사이에 `실제 팝업 크기와 다를 수 있습니다.`(caption·회색)를 둔다. 줄바꿈 허용 행 배치이며 버튼은 오른쪽 끝을 유지한다. 실제 크기 모달·팝업 본문에는 없다. `title=""`이면 제목 요소를 생략한다(IS063M02 샘플). 호출부 6곳(RgstPop·샘플 3·가이드 2)은 props 변경이 없다.

### §6 검증(2026-11-09)

- 웹 `tsc --noEmit`, eslint(PopupcommonComponent, 기존 `popupRichText.ts` 경고 1건 외 없음).
- `verify-survey-rich-text-55`(59): 29→30→29 문항 추가 버튼, 31문항 유입 유지·안내·저장 차단, 퀴즈 헤더 `31/30`.
- `verify-popup-preview-61`(121): 안내 위치(제목 오른쪽·버튼 왼쪽, 12px 이하 회색), 240px 폭 줄바꿈 시 겹침 없음, 실제 크기 모달 미표시.
- `verify-popup-common-sample-69`(61), `verify-rich-text-49`(75), `verify-popup-pick-fields`(34), `verify-popup-transform-64`(77), `verify-image-preview`(54) 통과.
- 미실행: 로컬 관리자 웹 실화면, 서버 저장·재조회 왕복, 폐쇄망.

## 7. 추가 TODO — 설문·퀴즈 일반 텍스트 입력 (2026-11-09)

상태 **요구사항 정의 완료 / 구현 대기**

- [x] **73-28 입력 UI** — 공통 `PopupQuestionEditor`에서 `isOxQuestion(q)`로 구분한다. 설문·퀴즈 모두 OX 외 문항 제목과 선택지 문구를 MUI `TextField multiline`으로 편집한다. OX 문항 제목과 OX 선택지·정답 UI는 현행 동작을 유지한다. 주관식은 제목에 적용하고 기존 정답 입력을 유지한다.
- [x] **73-29 데이터 매핑** — 기존 `title`·`text`에 줄바꿈을 포함한 일반 문자열을 저장한다. 기존 서식 문항을 열 때는 일반 문자열을 우선 사용하고 문자열이 없는 경우 서식 블록에서 텍스트를 복원한다. 일반 입력에서 값을 수정하면 해당 `titleBlocks`·`textBlocks`를 기존 계약에 맞게 비워 미리보기나 저장 시 이전 서식이 우선되지 않도록 한다. 열기만 한 기존 문항의 데이터는 보존한다.
- [x] **73-30 검증** — 설문 단일·복수 선택 및 주관식, 퀴즈 선다형·OX의 입력 UI와 정답 선택을 확인한다. 유형 전환, 기존 서식 문항 수정, 줄바꿈, 미리보기, 저장·재조회 및 웹 타입 검사를 확인한다.

`compact`와 `hideToolbar`는 CKEditor 툴바 표시를 제어한다. 이 요건은 공통 문항 편집기에서 분기하며 API·DTO 변경은 범위에서 제외한다. 화면 옵션은 §9에서 props로 추가했다(기본값은 이 절의 동작).

**구현 결과(2026-11-09)**: OX 판별은 `quiz && isOxQuestion(q)`로 한다. 설문에는 OX 답안 유형이 없어(0089는 퀴즈 전용, §1) 설문 문항은 선택지가 O·X여도 일반 입력이다 — 입력 도중 O·X가 되는 순간 편집기가 바뀌는 문제를 피한다. 제목·선택지는 `TextField multiline`(size small), 선택지 번호는 입력칸 앞 표시, 접근성 이름은 `N번 문항 제목`·`N번 문항 선택지 M`. 표시값은 일반 문자열 우선, 비면 `blocksToPlainText`로 복원. 입력 시 `titleBlocks`·`textBlocks`를 `null`로 바꾸고 열기만 하면 문항 객체를 바꾸지 않는다. 글자 수 상한은 기존 `validatePopupQuestions`를 유지한다. 선택지 줄의 정답·삭제 칸 높이는 입력칸 첫 줄(40px)에 맞췄다.

**검증(2026-11-09)**: `verify-survey-rich-text-55` 1~6절을 일반 입력 기준으로 바꿨다 — 서식 문항 열기(문자열 우선·블록 복원·데이터 무변경), 선택지·제목 수정 시 해당 블록만 null, 줄바꿈 저장, 선택지 삭제 후 ID 유지, 빈 제목·1000자 초과 차단, 주관식 제목 일반 입력. 퀴즈 OX(제목 서식 편집기 1개·O/X 정답), 유형 전환, 기존 유형 보존, 미리보기 절은 기존 그대로 통과. `verify-popup-common-sample-69`는 선택지·제목 측정 대상을 입력칸으로 바꿔 통과. 실화면·서버 저장 왕복은 미실행.

## 8. 추가 TODO — 가이드 페이지 PopupAdmin 타입 안내 (2026-11-09)

상태 **요구사항 정의 완료 / 구현 대기**

- [x] **73-31 타입 안내** — `/popup-common-guide`의 시작 탭에 `PopupAdmin.ts` 타입 안내를 추가한다. `PopupType`, `AdminPopupDetail`, `PopupQuestion`, `PopupOption`의 역할과 포함 관계를 보여 준다. 화면 초기 상태의 `Partial<AdminPopupDetail>`, 상세 모델, 저장 요청의 차이를 구분한다.
- [x] **73-32 예시** — 최소 팝업 입력 예시와 설문·퀴즈 문항 예시를 제공한다. 현행 모델에서 `content`와 `questions`의 위치, `title`·`text`와 서식 블록의 관계, OX의 `SINGLE_CHOICE` 및 O/X 선택지 표현을 설명한다. 73-28~73-30의 일반 텍스트 전환은 적용 상태에 맞춰 안내한다.
- [x] **73-33 검증** — 예시의 타입과 import를 실제 workspace 공개 경로에 맞추고 기존 가이드 예제 타입 검사에 연결한다. 기존 탭과 예시 실행을 확인한다.

기준 모델은 `zero-rule-web/sub/domain/src/model/PopupAdmin.ts`이며 표시 위치는 `guide/tabs/GuideStartTab.tsx`를 우선 검토한다.

**구현 결과(2026-11-09)**: 시작 탭에 `3. 데이터 타입(PopupAdmin.ts)` 절을 추가하고 기존 `기존 팝업 등록 화면`을 4번으로 옮겼다. import(`@local/domain`), 네 타입 역할, 포함 관계 트리, 화면 입력값(`Partial<AdminPopupDetail>`)·상세 값(`AdminPopupDetail`)·저장 요청(`pickPopupFields`/`toSaveRequest` → `PopupSaveRequest`) 차이, 최소 입력 예시와 퀴즈 예시(OX형 + 선다형, `questions` 위치, `content.description`), `title`·`text`와 서식 블록 관계, OX 판별, 30문항 상한을 안내한다. 예시 값은 `guide/guideTypeExamples.ts`에 실제 타입으로 선언해 웹 `tsc`가 검사하고, 화면은 그 값을 코드 문자열로 보여 준다(별도 예제 타입 검사 스크립트는 없었으므로 웹 타입 검사에 연결).

**검증(2026-11-09)**: 웹 `tsc`, `verify-popup-guide-render`(31, 시작 탭 타입 안내·예시 2건 추가), `verify-popup-guide-registry`(272) 통과.

## 9. 추가 TODO — 문항 편집기 입력 방식·최대 문항 수 props (2026-11-09)

상태 **구현·하네스 검증 완료(2026-11-09) / 실화면 미확인**

- [x] **73-34 props** — `PopupQuestionEditor`에 선택 props 2개를 추가한다. 기본값은 §6·§7 동작과 같아 기존 호출부(RgstPop·샘플·가이드)는 바꾸지 않는다.
  - `richQuestionText?: boolean`(기본 `false`): `true`면 모든 문항 제목·선택지를 서식 편집기(compact)로 입력하고 `titleBlocks`·`textBlocks`를 저장한다(§7 이전 동작). 퀴즈 OX 정답 선택 UI는 같다. `false`면 §7대로 OX 외 문항은 일반 텍스트, 퀴즈 OX 제목만 서식 편집기.
  - `maxQuestions?: number`(기본 `QUESTION_MAX` = 30, 1 이상 정수): 헤더 `N/max`, 추가 비활성, 초과 안내에 쓴다. `validatePopupQuestions(questions, quiz, passingScore?, maxQuestions?)`가 네 번째 인자로 같은 값을 받으며 생략하면 30이다. 편집기와 저장 전 확인에 같은 값을 넘기는 것은 부모 책임이다.
- [x] **73-35 가이드·검증** — 가이드 컴포넌트 표·실행기 입력·공지에 반영. `verify-survey-rich-text-55`에 서식 편집기 모드(제목·선택지 편집기 4개, 선택지 서식 저장)와 `maxQuestions=3`(표시·추가 비활성·초과 안내·검증 인자, 기본 30 유지) 검사를 추가했다. 웹 `tsc`·eslint, 55(64)·69(61)·61(121)·guide-render(31)·guide-registry(276) 통과. 실화면 미실행.

## 10. 추가 TODO — UTF-8 BYTE 입력 제한 (2026-11-10)

상태: **WEB·WPF 입력 제한·서버 저장 전 바이트 검증 구현 완료(2026-11-10) / 실화면·폐쇄망 DB 확인 대기**. DB 담당자 확인: 선택지 `VARCHAR2(300 BYTE)`, 주관식 응답 `VARCHAR2(1000 BYTE)`. 관리자 웹·WPF 입력 제한과 서버 저장 전 검증(WPF 결과 400, 관리자 저장은 기존 관리자 검증과 같이 500)을 넣었고, 필드·형식과 DB 스키마는 변경하지 않았다.

### 확정 정책
- **관리자 WEB QUIZ 선택지 Input**: UTF-8 인코딩 결과 **최대 300 Byte**까지 허용, 초과 입력 차단. QUIZ 문항 제목은 `CLOB`이므로 이 제한의 대상이 아니다. ~~설문 선택지까지 자동 확대하지 않는다.~~ → **2026-11-11 결정: 설문 선택지도 같은 OPTION_TEXT 컬럼이라 300 Byte를 적용**(웹 입력 차단·저장 전 확인·서버 검증). 설문 문항 제목은 QUIZ와 같이 CLOB으로 보고 제한하지 않는다.
- **관리자 API 입력 오류 응답(2026-11-11 결정)**: `/apis/popup/**`의 입력 검증 오류(`IllegalArgumentException`·`@Valid`·본문 해석 실패)는 `PopupAdminExceptionHandler`가 HTTP 400 + 기존 응답 형식(`msgClsf=ER`, `msgId=FW00000003`, `msgCn`=검증 문구)으로 응답한다. 공통 오류 변환(`sub/domain/src/error.ts`)이 HTTP 오류 본문의 `msgCn`을 오류 메시지로 써서 관리자 화면이 사유를 표시한다. 그 밖의 서버 오류는 500 그대로.
- **WPF SURVEY/QUIZ 주관식 응답 Input**: UTF-8 인코딩 결과 **최대 1,000 Byte**까지 허용, 초과 입력 차단.
- 한글 IME 조합, 키보드 입력, 붙여넣기 모두 동일 기준. 초과 입력은 기존 유효한 값을 유지하며, 초과된 문자열을 조용히 저장하지 않는다.
- DB BYTE 제한과 API 송수신 문자열의 UTF-8 바이트 길이를 일치시킨다. 글자 수·UTF-16 길이 기준으로 대체하지 않는다.

### 구현 시 확인할 사항
- [x] **73-36 WEB 선택지**: `zero-rule-web/main/src/features/PopupcommonComponent/PopupQuestionEditor.tsx`의 QUIZ 선택지 입력 및 값 변경 경로를 확인해 300 Byte 초과 입력을 차단한다. 일반 TextField와 `richQuestionText` 옵션에 따른 서식 편집 경로를 모두 확인한다. 문항 제목·OX 고정 선택지와의 영향 구분.
- [x] **73-37 WPF 주관식**: `popup-frameWork`의 SURVEY/QUIZ 실제 주관식 입력 컨트롤 및 응답 수집 경로를 찾아 1,000 Byte 초과 입력을 차단한다. 결과 전송 직전에도 동일 길이를 검증한다. 관련 함수명은 코드 확인 후 기록.
- [x] **73-38 저장·계약 정합성**(서버 변경은 결정 대기): WEB 저장 전 선택지 검증, WPF 결과 직렬화, Java API 요청 검증 및 Oracle 컬럼 매핑을 대조한다. 서버/DB 변경이 필요한지 확인하되 별도 승인 없이 변경하지 않는다. 기존 초과 길이 데이터는 자동 절단·덮어쓰기하지 않고 검증/안내 방안을 확인한다.
- [x] **73-39 회귀검증**(코드·하네스 범위, 실화면·DB 미실행): UTF-8 300/301 Byte 및 1000/1001 Byte 경계, 한글·영문·이모지 혼합, IME 조합 중/확정 후, 붙여넣기, 삭제 후 재입력, 기존 데이터 로딩, 저장·재조회, WPF 결과 API 전송을 확인한다. WEB 타입 검사·관련 하네스, WPF 빌드·테스트, 실제 DB/폐쇄망 실화면은 수행 여부를 별도로 기록한다.

### 완료 기준
- QUIZ 선택지는 300 Byte까지, SURVEY/QUIZ 주관식 응답은 1,000 Byte까지 정상 입력되고 각각 1 Byte라도 초과하는 입력은 반영되지 않는다.
- 정상 입력값·선택지 ID·응답 데이터 계약은 유지하며, QUIZ 문항 제목 `CLOB`에는 신규 300 Byte 제한이 적용되지 않는다.
- 코드 검증, 로컬 실화면, 원격 DB, 폐쇄망 실화면 검증 결과를 구분해 보고한다.

### 구현 결과 (2026-11-10)
- **73-36 WEB**: `popupByteLimit.ts`(`QUIZ_OPTION_TEXT_MAX_BYTES`=300, `utf8ByteLength`, `acceptsByteLimitedChange`, `byteLimitMessage`) 추가.
  - 일반 입력칸: `PopupQuestionEditor`의 QUIZ 선택지를 `ByteLimitedTextField`로 바꿨다. 넘는 키보드 입력·붙여넣기는 반영하지 않고 직전 값을 유지하며, 커서는 입력하려던 위치로 돌린다.
  - 한글 IME: 조합 중에는 브라우저 조합을 깨지 않도록 값을 그대로 넘기고, `compositionend`에서 다시 확인해 넘으면 조합 전 값으로 되돌린다. 막히면 입력칸 아래에 안내 문구가 나온다.
  - 서식 편집기 경로(`richQuestionText=true`): `PopupRichTextEditor`에 `maxPlainBytes`를 추가했다. 서식 없는 문자열(`text`, OPTION_TEXT) 기준으로 넘는 편집을 `onChange`로 보내지 않고 직전 내용·커서로 되돌린다(`change:isComposing` 종료 시 재확인). 되돌리면 편집기 실행 취소 기록이 비워진다.
  - 제외: QUIZ 문항 제목(CLOB), 설문 선택지, OX 고정 선택지(입력칸 없음).
- **73-37 WPF**: `Services/Utf8ByteLimit`(`TextAnswerMaxBytes`=1000)를 추가했다.
  - `SurveyPopupView.CreateTextControl` → `AttachTextAnswerByteLimit`: 키보드·IME·붙여넣기·끌어 놓기·실행 취소 모두 `TextChanged`에서 확인한다. 넘으면 같은 입력 처리 직후(Dispatcher Send) 직전 유효 값·커서로 되돌린다. 커서만 옮긴 경우에도 되돌릴 위치를 갱신한다(`SelectionChanged`).
  - 입력칸 툴팁·접근성 도움말에 한도를 표시한다.
  - 제출 직전 `ValidateRequiredQuestions`에서 1,000 Byte 초과 답변을 막고 현재 Byte를 안내한다. 결과 DTO(`PopupResultBuilder.BuildSubmitted`)는 값을 그대로 보낸다.
  - TextBox 줄바꿈 `\r\n`은 보내는 그대로 2 Byte로 센다.
- **73-38 정합성**:
  - WEB: `validatePopupQuestions`가 QUIZ 선택지 300 Byte 초과를 막는다(`N번 선택지는 300 Byte(한글 약 100자)까지 … 현재 X Byte`). RgstPop 저장도 이 함수를 쓴다. 이미 넘은 기존 값은 자르지 않고 그대로 보여 주며 안내하고, 줄이는 편집만 받는다.
  - WPF: 결과 `answers[].textAnswer`는 입력·제출 전 제한으로 1,000 Byte 이하만 만든다.
  - 서버(2026-11-10 추가 승인 후 구현): `PopupUtf8Limits`(`QUIZ_OPTION_TEXT_MAX_BYTES`=300, `TEXT_ANSWER_MAX_BYTES`=1000, `utf8Length`) 추가.
    - 관리자 저장: `PopupQuestionRules.validate`가 QUIZ 선택지 300 Byte 초과를 거부한다(`… UTF-8 300 Byte 이하여야 합니다. (현재 N Byte)`). 관리자 저장 API는 `IllegalArgumentException`을 따로 매핑하지 않아 다른 관리자 검증 오류와 같이 HTTP 500으로 응답한다(2026-11-11 원격 개발 DB 실호출로 301 Byte → 500·메시지 확인. 처음 기록한 '400'은 정정). 서식 선택지는 `PopupSurveyRichText` 정규화 뒤 파생 일반 문자열(OPTION_TEXT 저장값)로 센다. 기존 1~1000자 규칙은 유지했고, 설문 선택지·문항 제목은 바이트 제한이 없다.
    - WPF 결과: `PopupService.validateAnswer`가 TEXT 문항 `textAnswer`의 저장값(trim 후)이 1000 Byte를 넘으면 저장 전에 거부한다(`WpfApiExceptionHandler` → 400 `WPF_BAD_REQUEST`). WPF 큐는 400 결과를 이번 실행에서 전송 대상에서 빼고 보관한다(기존 동작).
    - 로컬 스키마(`OPTION_TEXT VARCHAR2(1000 CHAR)`, `TEXT_ANSWER CLOB`)는 그대로 두었다. 폐쇄망 BYTE 컬럼에서도 넘는 값이 DB까지 가지 않아 ORA-12899가 나지 않는다.
    - 이미 DB에 있는 300 Byte 초과 QUIZ 선택지는 자동으로 자르지 않는다. 그 팝업을 다시 저장할 때 서버가 거부한다(관리자 API 500, 메시지에 현재 Byte).
  - 인터페이스: 필드·형식 변경 없음. `POPUP_INTERFACE_SPEC` 3.7 보완, `WPF_POPUP_ALL_SPEC`·`WPF_POPUP_MINIMAL_SPEC`, 프론트 인계 문서, 가이드 공지(`2026-11-10-quiz-option-300-byte`)에 기록했다.
- **73-39 검증**:
  - WEB: `node scripts/verify-quiz-option-byte-73.cjs` 39건 통과(Windows headless Edge, CDP `Input.insertText`·`Input.imeSetComposition`). 다룬 항목:
    - 300/301 Byte 경계, 한글·영문·이모지(296+4 / 297+4)
    - 끝·중간 입력과 커서 위치, 붙여넣기 전체 거부
    - IME 확정이 한도 안이면 반영, 넘으면 되돌림. 조합 중에는 임시 표시를 유지
    - 삭제 후 재입력, 이전 초과 데이터의 표시·안내·키우기 거부·줄이기 허용·저장 전 확인
    - 설문 선택지·QUIZ 제목 제외
    - 서식 편집기 경로: 경계, 되돌림, 커서 경로, 붙여넣기, 삭제, IME, 이전 데이터
  - WEB 음성 대조: 상한을 100000으로 바꾸면 첫 경계 검사가 실패함을 확인했다.
  - WPF: `Popup.BehaviorTests` 1,724건 통과.
    - 새 검사 `CheckTextAnswerByteLimit73`: Byte 계산, 1000/1001, 한글 중간 삽입과 커서 복원, 한글→영문 치환, 이모지 경계, 클립보드 붙여넣기 전체 거부, 삭제 후 재입력, 제출 직전 검증 1000/1001, 결과 DTO 값 유지
    - 제한 연결을 빼면 첫 경계 검사가 실패함을 확인했다.
  - 기존 하네스:
    - 55(67)·61(121)·guide-render(31)·guide-registry(270)·rgstpop-quiz-rule(25)·question-template-picker(7) 통과
    - 69(62): 2026-11-10 선택지 자동 번호 제거·QUIZ 제목 서식 편집기 전환 뒤 낡은 검사(번호 표시 기대, 제목 textarea)와, 300 Byte를 넘던 긴 선택지 입력(360 Byte)을 새 정책에 맞게 고쳐 통과
  - 웹 `tsc`·변경 파일 eslint 오류 0, WPF 빌드 경고·오류 0.
  - 서버: `gradlew test` 268건 통과·13 skip(Oracle 연동)·실패 0. 새 `PopupUtf8LimitTest` 6건(바이트 계산, 퀴즈 선택지 300/301·이모지 경계, 설문 선택지·퀴즈 제목 제외, 서식 선택지 파생 문자열, 주관식 1000/1001(SURVEY·QUIZ)·거부 시 저장 0건, trim 후 계산). 상한을 풀면 거부 검사 3건이 실패함을 확인했다.
  - 미실행(구현 당시): 실제 한글 IME(Windows 키보드) 수동 입력, 관리자 웹·WPF 실화면, 서버 저장·재조회, 원격 개발 DB, 폐쇄망 DB(BYTE 컬럼) 저장, WPF 결과 API 실제 전송.
  - 2026-11-11 R1(로컬 서버 + 원격 개발 DB + 로컬 관리자 웹 + WPF 일반 실행, 125% 배율): 로그인 후 실제 관리자 수정 화면 QUIZ 선택지에 브라우저 입력(insertText)으로 한글 101자(303 Byte) 거부·100자(300 Byte) 입력·끝에 1자 추가 거부와 300 Byte 안내 확인, 300 Byte로 저장 성공(원격 개발 DB). 같은 관리자 저장 API를 직접 호출해 301 Byte는 거부(메시지 `현재 301 Byte`, HTTP 500) 확인. WPF가 서버에서 받은 VIDEO+QUIZ 제출 → 결과 저장 후 재조회 시 '현재 표시할 팝업이 없습니다' 확인. 남은 확인: WPF 주관식 1,000 Byte 실서버 전송, 실제 한글 IME 수동 입력, 폐쇄망 DB(BYTE 컬럼) 저장.
  - 2026-11-11 후속(설문 300 Byte·관리자 400): 로컬 서버(원격 개발 DB) 재기동 후 설문 템플릿 새 등록 화면에서 설문 선택지 101자 거부·100자(300 Byte) 허용·초과 1자 거부·안내 확인. 저장 API 301 Byte → HTTP 400 `{msgId: FW00000003, msgClsf: ER, msgCn: "선택지 내용은 UTF-8 300 Byte 이하여야 합니다. (현재 301 Byte)"}`(오류 추적 정보 없음). 등록 화면에서 서버 전용 검증(노출 종료 < 시작) 저장 시 서버 문구 "팝업 노출 종료일은 시작일 이후여야 합니다." 토스트 1건 표시(이전에는 사유 없는 일반 오류 문구).
