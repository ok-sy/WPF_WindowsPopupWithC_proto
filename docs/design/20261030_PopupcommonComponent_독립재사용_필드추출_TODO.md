# PopupcommonComponent 독립 재사용·선택적 필드 추출 TODO

작성: 2026-10-30 (KST)
상태: **A~E 완료**(운영 빌드 2026-10-30 성공). 신규 숫자 TODO 번호는 임의 부여하지 않음.
WEB 표시 기본값 / SERVER 업무 정책 책임 분리(F)는 별도 문서: [WEB 표시 기본값 / SERVER 정책 책임 분리 TODO](20261030_PopupcommonComponent_WEB표시기본값_SERVER정책_책임분리_TODO.md).

## 목적
PopupcommonComponent는 특정 테이블(3111/3117 포함), API, 저장 요청 형식과 관계없이 다양한 업무 화면에서 **입력 UI·독립 상태·필드 추출·미리보기**를 재사용하는 공통 모듈이다. 기존 proto의 `toSaveRequest()`는 여러 사용 사례 중 하나이지 공통 컴포넌트의 기준 계약이 아니다.

## 현행과 경계
- 기존 `PopupScheduleFields`는 prop 이름이 `popup`이라 팝업 전체를 넘겨야 하는 것처럼 보였다(실제 타입은 `Pick<AdminPopupDetail, 'periodMode' | 'repeatDayOfWeek' | 'displayTimes'>`). 게시 기간 입력은 등록 화면(`PopupEditorDialog`)에 따로 있었다.
- `popupEditorTransform.ts`의 `toSaveRequestPopup()`은 ISO 날짜 변환, URL 정규화, 유형별 content 키 필터링, IMAGE 크기·비율 정리를 포함한 **proto 저장 변환**이다. 범용 선택 필드 추출과 혼용하지 않는다.
- RichText의 HTML ↔ RichBlock[], questions 편집, 미리보기는 기존 데이터 계약을 보존한다.
- 범용 컴포넌트 내부에서 API 호출, DB 컬럼명 선택, 특정 테이블용 날짜 직렬화, 게시 정책을 강제하지 않는다.

## A. 컴포넌트 입출력 독립화
- [x] `PopupScheduleFields`: 일정 전용 `value: PopupScheduleValue`(`periodMode`·`repeatDayOfWeek?`·`displayTimes?`·`displayStartAt?`·`displayEndAt?`) 추가, `index.ts`에서 타입 export. `showPeriod`로 게시 기간 입력(입력란 문자열 그대로 onChange, 직렬화는 부모). 기존 `popup` prop은 호환용(deprecated)으로 유지 — 등록 화면 호출부 변경 없음.
- [x] `PopupRichTextEditor`: `initialBlocks`/`onChange(blocks, plainText)`만으로 단독 사용(변경 없음, 샘플로 확인).
- [x] `PopupQuestionEditor`: `questions`·`quiz`·콜백만으로 단독 사용(변경 없음, 샘플로 확인).
- [x] 미리보기: 표시용 데이터만 받고 저장·API 호출 없음(변경 없음). 표시용 전체 모양은 `createDefaultPopup()` 위에 화면 state를 얹어 만든다.
- [x] 컴포넌트별 최소 입력·출력·부모 책임 문서화(가이드 '독립 재사용·필드 추출' 탭 표, 컴포넌트 탭 props).

## B. 공통 선택 필드 추출 유틸
- [x] `popupEditorTransform.ts`에 `pickPopupFields()` (기존 변환 함수 수정 없음).
- [x] `topLevelKeys`·`contentKeys`·`questionKeys` 독립 선택, 미지정 영역은 생략.
- [x] 문항은 각 원소에서 지정 필드만, 원본 배열 순서 유지.
- [x] 키가 실제로 없으면 생략(own property 기준), 있으면 null·false·0·빈 문자열(값이 undefined여도) 보존.
- [x] 원본 불변, 새 컨테이너(최상위·content·각 문항 객체) 반환. 고른 중첩 값은 원본 참조(얕은 복사) — 주석·가이드에 명시.
- [x] 타입: `topLevelKeys`는 `Exclude<keyof AdminPopupDetail, 'content' | 'questions'>`, `questionKeys`는 `keyof PopupQuestion`, 결과는 고른 키만(`Partial<Pick<…>>` — 키가 없으면 생략되므로). 잘못된 키는 컴파일 오류. 런타임 외부 문자열 입력은 별도 검증 필요(주석 명시).
- [x] 최상위만·content만·questions만·조합 추출.
- [x] 문항 하위(options 안 필드) 선택은 1차 범위 제외. `'options'`를 고르면 선택지 배열을 참조 그대로 담는다.
- 날짜 ISO 변환·키 리네이밍·기본값 생성·검증·저장 요청 생성 없음(입력 값 그대로).

## C. 기존 proto와 외부 사용 화면 분리
- [x] `toSaveRequestPopup()`·`toSaveRequest()`·`createDefaultPopup()`·`RgstPop` 동작·API 계약 변경 없음.
- [x] proto는 기존 저장 변환 유지. 다른 화면은 컴포넌트 조합·반환값을 독립적으로 쓰고 자기 저장 형식을 책임진다(가이드·샘플에 명시).
- [x] 저장 포맷 변환은 각 업무 경계에서. 공통 입력 컴포넌트에 추가하지 않음.
- [x] `PopupScheduleFields` API 변경은 `value` 추가 + `popup` 호환 유지로 레거시 호출부 깨짐 없음.
- [x] 샘플 화면(`IS063M02Sample`·`PopupListSample`)은 proto 저장 변환(`toSaveRequest`)을 쓰지 않고 `toSampleScreenValues`(= `pickPopupFields`)로 화면이 입력하는 필드만 저장 값에 담는다. 입력이 없는 게시 기간·노출 일정·표시 순서·활성·대상 그룹은 결과에 없다(미리보기용 state는 그대로). `verify-popup-common-sample-69` 34건(미포함 검사 2건 추가).

## D. 개발 가이드·샘플
- [x] 가이드 '독립 재사용·필드 추출' 탭: 원칙, 컴포넌트 최소 입력·출력 표, `pickPopupFields` 규칙·실제 상수 content 키 표, 실행기.
- [x] 서버 없는 샘플 `sample/PopupIndependentSamples.tsx`: ① 일정만 ② RichText + content 일부 ③ questions 일부 ④ 세 영역 조합(+ 미리보기). 각 샘플에 붙이는 코드.
- [x] 특정 DB 테이블·API 없이 동작.
- [x] 가이드 공지·변경 이력 기재.

## E. 검증 및 완료 조건
- [x] topLevel/content/questions 단독·동시, 미지정·빈 키·누락 키 — `scripts/verify-popup-pick-fields.cjs` 25건.
- [x] null·false·0·빈 문자열·빈 questions 보존 — 같은 스크립트.
- [x] 원본 불변(동결 객체), 문항 원소별 선택·순서 유지, 얕은 복사 참조, TypeScript 타입 검사(`__typetests__/pickPopupFields.typetest.ts`, 웹 type-check). 변이 확인: own property 판단을 `!== undefined`로 바꾸면 런타임 검사 실패.
- [x] 공통 UI 단독 장착 시 AdminPopupDetail 전체 불필요 — 샘플 ①~③ 실화면.
- [x] 기존 RgstPop 회귀: 하네스 transform-64 77·common-sample-69 32·rgstpop-quiz-rule 11·preview-61 52·completion-ux-43 71·rich-text-49 60건 통과, 로컬 관리자 웹 신규 등록 노출 일정 스위치(legacy `popup` prop) 동작.
- [x] 운영 빌드(`next build`) — 2026-10-30 성공(`/popup-common-guide` 포함).
- [x] 실제 브라우저 샘플 동작(로컬 관리자 웹, Turbopack 개발 서버): 샘플 ① 요일 토글 → 결과 갱신, ② 본문 입력 → plainText 반영, ④ 미리보기 표시, 실행기 결과, 예외 0건.

## 제외 범위
- 3111/3117 등 개별 테이블 전용 Adapter 구현, 서버/DB 변경, 원본 저장 API 리팩터링.
- 공통 컴포넌트가 외부 저장 형식을 추측하거나 강제하는 기능.
