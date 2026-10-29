# SURVEY 복수 선택 최소·최대 선택 수 TODO

기준일: 2026-10-29 (KST). 상태: **구현 완료 · 원격 개발 DB 적용 완료 · 실화면 확인 대기**. 신규 숫자 TODO 번호는 임의 부여하지 않음.

## 확정 결정

| 항목 | 결정 |
|---|---|
| 대상 | SURVEY의 `MULTIPLE_CHOICE` 문항 |
| 필드 | 문항 `minSelections`·`maxSelections` (정수, 둘 다 nullable) |
| 기본값 | `null` = 제한 없음(기존 동작 유지) |
| QUIZ | 기존 규칙 유지 — 복수 선택 한도 = 정답 선택지 수(TODO52-5). QUIZ 문항에는 두 값을 저장하지 않는다 |
| 서버 결과 수신 | 선택 수가 범위를 벗어난 제출도 **거부하지 않음**(제한은 관리자 미리보기·WPF 화면에서 적용) |
| 적용 범위 | 관리자 원본(POPUP 스키마 DB) → 서버 저장·조회 → 관리자 편집기·미리보기 → WPF 응답·표시 |

## 동작 규칙

- 저장 검증(서버·웹 동일): SURVEY `MULTIPLE_CHOICE`에서만 값을 가질 수 있다. 각 값은 1 이상 선택지 수 이하의 정수, `minSelections ≤ maxSelections`. QUIZ·단일 선택·주관식에 값이 있으면 저장 거부.
- 최대: 한도만큼 고르면 남은 선택지 비활성화, 하나를 해제하면 복구(QUIZ 정답 수 한도와 같은 동작).
- 최소: 필수 문항은 `max(1, minSelections)`개 이상이어야 응답 완료. 선택 문항은 미응답(0개) 또는 `minSelections`개 이상이어야 제출 가능.
- 안내 문구: 최소·최대 모두 `N~M개 선택`, 같으면 `N개 선택`, 최소만 `최소 N개 선택`, 최대만 `최대 M개 선택`, 둘 다 없으면 `여러 개 선택 가능`.
- WPF 응답·관리자 상세 응답은 값이 있을 때만 키를 싣는다(null이면 생략 = 제한 없음).

## 작업

- [x] DB: `19_question_selection_limit_oracle.sql` — `POPUP_QUESTION.MIN_SELECTIONS`·`MAX_SELECTIONS` NUMBER(4) NULL, 1 이상·최소 ≤ 최대 CHECK. `01` 스키마·README 반영. 로컬 XE·원격 개발 DB 적용(아래 진행 기록).
- [x] 서버: 엔티티·DTO·Mapper INSERT/SELECT, `PopupQuestionRules` 저장 검증, 관리자 상세·WPF 응답(SURVEY 정답 제거 경로 포함) 전달, 문항 템플릿 재사용 비교에 포함, 3117 등록 검증기 타입 검사.
- [x] 관리자 웹: 모델, 편집기 입력(SURVEY 복수 선택만, 비우면 제한 없음)·저장 전 확인, 미리보기 한도·최소 판정·안내 문구.
- [x] WPF: DTO·Factory·모델, 최대 한도·최소 판정(제출 가능·진행 문구)·안내 문구, Demo 샘플.
- [x] 문서: 인터페이스 명세·ALL 명세·옵션 가이드. MINIMAL은 최초 외부 제공 범위라 확장하지 않는다.
- [x] 검증: 서버 단위·Oracle 테스트, 웹 tsc·하네스, WPF 빌드·PopupWindowTests.

## 진행 기록

### 2026-10-29 구현

- DB: `19_question_selection_limit_oracle.sql`·`01` 스키마·README. 로컬 XE(POPUP) 적용 — 컬럼 2·제약 1, 재실행 SKIP. 원격 개발 DB(192.168.114.71:4004)는 이 PC에서 TCP 연결 실패로 미적용 → 서버 배포 전 `apply-dev-db.ps1 19_question_selection_limit_oracle.sql` 실행 필요.
- 서버: `PopupQuestionEntity`·`PopupQuestionDto`(기존 생성자 유지, null이면 JSON 생략), Mapper INSERT(QUIZ는 NULL)·resultMap·SELECT, `PopupService` 매핑, `PopupSurveyRichText` 파생, `WpfPopupItem.withoutAnswerKey`(SURVEY 응답 경로) 전달, `PopupQuestionRules.validateSelectionLimits`. 문항 템플릿 재사용은 record 동등 비교라 선택 수 변경 시 새 템플릿. 3117 등록 검증기 `PopupJsonValidator` 같은 규칙.
- 관리자 웹: `PopupQuestion.minSelections`·`maxSelections`, 편집기 SURVEY 복수 선택 입력(비우면 제한 없음, 유형 변경 시 비움)·`selectionLimitError`, 미리보기 `maxSelectionsOf`(SURVEY 최대)·`minSelectionsOf`·`multipleChoiceHint`·`answerStateOf`, 제출 비활성·사유. `IS063M02` 정적 화면의 "답변 선택 개수" 틀은 연결하지 않음(실제 입력은 공용 편집기).
- WPF: `SurveyQuestionDto`·`PopupFactory`·`SurveyQuestion`(`MaxSelections` QUIZ 정답 수 우선, `MinSelections`, `IsAnsweredBy`·`IsBelowMinimum`), `SurveyPopupView` 진행 문구·제출 가능·제출 시 검증·안내 문구, Demo `DEMO-SURVEY-PLAIN` 5004 문항(선택, 최소 2·최대 3).
- 검증: 서버 `PopupQuestionRulesTest` 4건·`PopupJsonValidatorTest` 1건 추가, 로컬 XE 접속으로 Oracle 테스트까지 실행 — 실DB `PopupQuestionDatabaseTest` 통과. 웹 tsc 0·eslint 0, `verify-completion-ux-43` 71건(신규 6)·`verify-survey-rich-text-55` 23건. WPF 빌드 경고·오류 0, `PopupWindowTests` 385건(신규 선택 수 검사 포함), `ApiDemoTests` 70건.
- 기존 실패(이번 변경 전 코드에서도 동일하게 재현): `WpfPopupDatabaseTest` 2건·`WpfApiOracleHttpTest` 2건(로컬 XE 데이터 상태로 조회 결과 없음), `PopupWindowTests` `CheckVideoQuizAspect60`(창 폭 복원 계산, 실행 시 임시 제외 후 원복), `RichTextTests`(TODO69에서 옮겨진 `RgstPop/popupRichText.ts` 경로 참조).
- 미실행: 관리자 웹 저장 → WPF 실화면 조작, Excel·Word·PDF 산출물 반영.

### 2026-10-29 원격 개발 DB 적용

- 원격 개발 DB(192.168.114.71:4004/XE, zero-rule) 접속 복구 후 `db\oracle	oolspply-dev-db.ps1 19_question_selection_limit_oracle.sql` 실행: `MIN_SELECTIONS`·`MAX_SELECTIONS` 컬럼·`CK_QUESTION_SELECTION_RANGE` 제약·주석 OK, 확인 쿼리 컬럼 2·제약 1.
