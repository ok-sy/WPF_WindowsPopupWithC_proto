# TODO64 — 팝업 데이터 변환 함수 분리 및 프론트 이식 가이드

- 작성일: 2026-10-21 (KST)
- 상태: 구현 완료 / 실제 관리자 화면 저장 왕복·다른 화면 실제 이식 검증 대기
- 관련: TODO61 미리보기 컴포넌트 분리, TODO62 공용 RichText 편집

## 목적과 확정 방향

신규 콘텐츠 등록·팝업 등록 화면에서 에디터와 우측/모달 미리보기를 재사용할 수 있도록 부모 PopupEditorDialog.tsx에 남아 있는 데이터 구성·변환 책임을 일반 TypeScript 함수로 분리한다. 화면을 렌더링하지 않는 변환 처리는 React 컴포넌트로 만들지 않는다.

popupRichText.ts는 HTML↔문단/Run Blocks와 일반 문자열 파생 등 글자 서식 변환을 계속 담당한다. 제목·창 크기·푸터·유형별 콘텐츠·questions를 합쳐 편집/미리보기/저장 객체를 만드는 책임은 별도 변환 모듈에 둔다. 부모는 입력 state·이벤트·모달 열림 상태·API 호출을 담당한다.

## 현재 구조와 경계

- PopupRichTextEditor는 initialBlocks를 HTML로 바꾸고 변경 시 blocks와 plainText를 부모로 전달한다.
- InlinePopupPreview와 PopupPreviewDialog는 동일한 AdminPopupDetail 형태의 popup을 받으며 PopupPreview를 공유한다.
- 부모에는 contentForType 등 저장 데이터 정리·조합과 편집 state 갱신이 남아 있다.
- 기존 ADMIN_POPUP_PREVIEW_COMPONENTS.md는 미리보기 이식만 안내하며 부모 저장 변환과 CKEditor는 범위에서 제외한다. 이번 TODO의 구현 시 이 경계를 명확히 확장·연결한다.

## 구현 TODO

- [x] 64-1. 부모의 조회/불러오기 초기화, 유형별 content 구성, 기본값·푸터 정규화, 미리보기 객체 및 저장 body 구성 지점을 조사하고 입력·출력 타입/호출 관계를 정리한다. 기존 동작과 필드 계약을 기준으로 추출한다.
- [x] 64-2. 별도 모듈(예: popupEditorTransform.ts)에 순수 변환 함수를 정의한다. 조회 데이터→편집값(toEditorValue), 편집값→미리보기 popup(toPreviewPopup), 편집값→저장 요청(toSaveRequest)은 역할 예시이며 최종 이름은 현행 타입에 맞춘다. 미리보기와 저장이 같은 부분은 공통 구성 함수를 공유하고 불필요한 중간 모델·중복 변환은 만들지 않는다.
- [x] 64-3. contentForType 및 저장에 필요한 정규화·필드 조합을 이동하고 부모를 함수 호출로 교체한다. 대상 유형의 content/questions 위치, 기존 plainText·Blocks 우선순위, null/누락/기본값, 푸터 URL 처리 결과를 보존한다. API 검증·전송·toast·라우팅·React state 변경은 변환 함수에 넣지 않는다.
- [x] 64-4. 변환 입력을 변경하지 않고 새 결과를 반환한다. 조회 응답 래퍼, 편집용 객체, 미리보기 객체, 저장 요청 body의 차이를 타입과 예시로 명시한다. 함수 입출력은 JavaScript 객체이며 JSON 문자열 parse/stringify는 필요한 외부 경계에서만 수행한다.
- [x] 64-5. 에디터 연결 예제를 제공한다. 불러온 데이터→Blocks 초기값→onChange(blocks, plainText)→부모 state→공통 미리보기 객체→우측·모달 전달까지 설명한다. initialBlocks는 최초 마운트 입력이라는 점과 다른 콘텐츠 불러오기 시 key 갱신, 일반 입력 시 재마운트 금지/커서 보존을 포함한다.
- [x] 64-6. 프론트 이식 가이드를 보완한다. 기존 미리보기 안내와 연결되는 통합 안내에 신규/수정/불러오기/유형 변경/저장 흐름, 함수 시그니처·입출력 샘플, 최소 부모 사용 예시, 필요한 파일·타입 export·경로 별칭·의존성·로고·글꼴/CSS 연결을 정리한다. 변환 모듈이 PopupEditorDialog를 역참조하지 않게 한다.
- [x] 64-7. 전체 등록 화면 없이 에디터·우측 미리보기·모달 미리보기·변환 함수를 연결하는 최소 호스트 예제를 제공한다. 실 API 저장 없이 저장 요청 객체를 확인할 수 있도록 하며 기존 검증 호스트를 재사용할 수 있으면 확장한다.

## 검증 기준

- [x] 대표 TEXT·IMAGE·VIDEO·SURVEY·QUIZ 데이터에서 추출 전후 미리보기/저장 객체의 실질 내용이 동일하다. JSON 키 순서 차이는 오류로 보지 않는다.
- [x] TEXT 본문 및 설문·퀴즈 서식/문항/선택지 데이터가 불러오기→편집→저장 요청 구성에서 보존된다.
- [x] 에디터 변경이 두 미리보기에 반영되고, 모달 시연 응답·시청 상태가 저장 데이터에 섞이지 않는다.
- [x] 신규/수정/콘텐츠 불러오기 시 초기값이 반영되고 일반 편집 중 커서·선택 범위가 초기화되지 않는다.
- [x] 변환 함수가 입력 객체를 변경하지 않고 필수 UI/API 모듈 없이 호출 가능하다.
- [x] 기존 타입 검사와 변경에 필요한 최소 회귀 검사를 수행하고 실제 폐쇄망 이식·서버 저장 왕복은 별도 검증 상태로 기록한다.

## 구현 기록 (2026-10-21)

| 항목 | 반영 |
|---|---|
| 64-1 조사 | 부모 데이터 구성 지점: 신규 기본값(`createDefaultPopup`), 조회 응답 정리(표시 순서·정답 비교 방식·IMAGE 크기 모드), 템플릿 적용, 유형 변경, 저장 요청 조립(`contentForType`·URL·푸터·날짜·IMAGE 크기). 미리보기는 편집값을 그대로 받으므로 변환이 없다 |
| 64-2 모듈 | `popupEditorTransform.ts` 추가: `createDefaultPopup`·`toEditorPopup`·`toEditorPopupFromTemplate`·`changePopupType`·`toSaveRequestPopup`·`toSaveRequest`(+보조 `toDateTimeLocal`·`contentValue`·`isSubmitPopupType`·`normalizeImageSizeMode`·`withDefaultAnswerMatchMode`). 미리보기 전용 중간 모델·`toPreviewPopup`은 동일 객체라 만들지 않음 |
| 64-3 이동 | 부모 `PopupEditorDialog`의 기본값·불러오기·템플릿·유형 변경·저장 조립을 함수 호출로 교체. 입력 검증·toast·API·state는 부모에 유지. `withDefaultAnswerMatchMode`는 `PopupQuestionEditor`에서 변환 모듈로 이동(중복 제거) |
| 64-4 불변·타입 | 모든 함수가 새 객체 반환(동결 입력 검증). 저장 요청에서 IMAGE `delete` 변경 대신 구조 분해로 새 content 생성. 객체 4종(조회 래퍼·편집값·미리보기·저장 body)을 모듈 주석·가이드에 명시, `PopupSaveRequest` 타입 export |
| 64-5·64-6 가이드 | `docs/interfaces/ADMIN_POPUP_EDITOR_TRANSFORM.md` 신규 — 책임 분리, 객체 구분, 함수 시그니처·처리·입출력 예, 에디터 `initialBlocks`/`key` 규칙, 최소 부모 예시, 파일·타입·별칭·패키지·로고·글꼴 의존성. 미리보기 안내에서 연결 |
| 64-7 호스트 | `scripts/verify-popup-transform-64(.cjs·-entry.tsx)` — 등록 화면 없이 에디터·우측/모달 미리보기·변환 함수 연결, 저장 요청 객체 표시. 분리 전 코드 비교 기준 `verify-popup-transform-64-legacy.ts`(497c4c8에서 그대로 추출) |

## 검증 결과

- `verify-popup-transform-64` 71건 통과: 변환 모듈이 React·MUI·API·부모 모듈 없이 번들됨, 대표 10건(TEXT 2·IMAGE 4·VIDEO·SURVEY·QUIZ·VIDEO+QUIZ)의 저장 요청·불러오기·템플릿·유형 변경 6종 결과가 분리 전 코드와 동일(키 순서 무시), 동결 입력 불변, TEXT URL 정규화·다른 유형 키 제외·들여쓰기 6단계 유지, SURVEY 콘텐츠/문항/선택지 서식 보존, 실제 CKEditor 입력 '가나다' 연속 입력 시 커서 유지·우측/모달 미리보기·저장 요청 반영, 다른 콘텐츠 불러오기 시 에디터 재마운트, 모달 설문 응답이 저장 요청에 섞이지 않음, 런타임 오류 0.
- 웹 `tsc --noEmit` 오류 0, 변경 파일 eslint 오류 0. 기존 하네스 회귀 통과: preview-61 42건, survey-rich-text-55 23건, rich-text-49 59건, completion-ux-43 60건, image-preview 34건, question-template-picker 7건.
- 미실행: 실제 관리자 웹 로그인 화면에서 신규·수정·템플릿 저장→서버 재조회 왕복, 다른 등록 화면·폐쇄망 프론트 실제 이식.

## 범위와 완료 상태

TODO 작성(c95ab6a) 후 2026-10-21 구현·가이드 보완을 반영했다. 실제 프론트 이식은 대상 화면 작업에서 수행한다. API/DB/WPF 계약 변경이나 신규 입력 폼 전체의 컴포넌트화는 포함하지 않는다. WPF ALL/MINIMAL은 구현 단계에서 계약 영향 유무를 검토하며 이번 문서 작성으로 기능 범위를 바꾸지 않는다.
