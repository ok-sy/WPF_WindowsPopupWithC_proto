# PopupcommonComponent 독립 재사용·선택적 필드 추출 TODO

작성: 2026-10-30 (KST)
상태: TODO 정의만 완료. 코드/DB/API 변경 및 테스트 미실행.

## 목적
PopupcommonComponent는 특정 테이블(3111/3117 포함), API, 저장 요청 형식과 관계없이 다양한 업무 화면에서 **입력 UI·독립 상태·필드 추출·미리보기**를 재사용하는 공통 모듈이다. 기존 proto의 toSaveRequest()는 여러 사용 사례 중 하나이지 공통 컴포넌트의 기준 계약이 아니다.

## 현행과 경계
- 기존 PopupScheduleFields는 AdminPopupDetail 전체와 onChange를 받는 구조라 단독 사용 시 불필요한 팝업 필드까지 요구할 수 있다.
- popupEditorTransform.ts의 toSaveRequestPopup()는 ISO 날짜 변환, URL 정규화, 유형별 content 키 필터링, IMAGE 크기/비율 정리를 포함한 **proto 저장 변환**이다. 범용 선택 필드 추출과 혼용하지 않는다.
- RichText의 HTML ↔ RichBlock[], questions 편집, 미리보기는 기존 데이터 계약을 보존한다.
- 범용 컴포넌트 내부에서 API 호출, DB 컬럼명 선택, 특정 테이블용 날짜 직렬화, 게시 정책을 강제하지 않는다.

## A. 컴포넌트 입출력 독립화
- [ ] PopupScheduleFields 사용 필드를 조사해 전체 AdminPopupDetail 대신 일정 전용 value/onChange 형태를 제공할 수 있도록 설계. 날짜·요일·시간 입력 UI는 재사용하고 기존 등록 화면과 호환 유지.
- [ ] PopupRichTextEditor는 RichBlock[]/plainText 반환 및 서식/커서 유지. 부모가 전체 AdminPopupDetail을 만들어야만 사용할 수 있는 종속성은 도입하지 않는다.
- [ ] PopupQuestionEditor의 questions 및 관련 옵션을 독립 Props로 사용 가능하게 유지·정리.
- [ ] 미리보기는 표시용 데이터만 받고 저장/API 호출을 수행하지 않도록 경계 유지.
- [ ] 각 컴포넌트별 최소 입력/출력 타입, 기본값, 선택 필드 및 부모의 책임 문서화.

## B. 공통 선택 필드 추출 유틸
- [ ] popupEditorTransform.ts 또는 팝업 공통 유틸 위치에 `pickPopupFields()` 추가(기존 변환 함수 수정 없음).
- [ ] `topLevelKeys`, `contentKeys`, `questionKeys`를 각각 독립 선택. 선택 영역 미지정 시 해당 영역 생략.
- [ ] `questions`는 각 문항 객체마다 지정 필드만 추출하고 원본 배열 순서를 유지.
- [ ] 필드가 실제로 없으면 생략하되, 존재하는 null/false/0/빈 문자열 값은 그대로 보존.
- [ ] 원본 객체를 변경하지 않고 새 컨테이너 객체를 반환. 중첩 선택값은 별도 요구가 없는 한 참조 유지(얕은 복사), 이 정책 명시.
- [ ] keyof/Pick 기반 타입 안전성을 확보하고 잘못된 키의 컴파일 시 검출 검토. 런타임 외부 문자열 입력은 별도 검증 필요.
- [ ] 동일한 함수로 최상위만, content만, questions만, 조합 추출 가능.
- [ ] options 등 questions 하위 중첩 선택은 1차 범위 제외; 필요 시 별도 옵션 추가 설계.

### 사용 예시(키는 실제 타입 확인 후 확정)
```ts
const selected = pickPopupFields(popup, {
  topLevelKeys: ['popupId', 'title', 'displayStartAt', 'periodMode'],
  contentKeys: ['plainText', 'textBlocks'],
  questionKeys: ['questionId', 'questionText'],
});
// { popupId, title, displayStartAt, periodMode, content: { ... }, questions: [{ ... }] }
```
필드 추출은 **날짜 ISO 변환, 키 리네이밍, 기본값 생성, 검증, 저장 요청 생성**을 하지 않는다. 입력 데이터의 값 그대로 반환한다.

## C. 기존 proto와 외부 사용 화면 분리
- [ ] 기존 `toSaveRequestPopup()`, `toSaveRequest()`, `createDefaultPopup()`, `RgstPop` 동작·API 계약 변경 금지.
- [ ] proto는 기존 저장 변환 유지. 다른 화면은 필요한 컴포넌트 조합 및 반환값을 독립적으로 사용하고 각 화면이 자기 저장 형식을 책임진다.
- [ ] 저장 포맷 변환(날짜/키명/JSON 형태)은 각 업무의 경계에서 구현하며 공통 입력 컴포넌트에 추가하지 않는다.
- [ ] 기존 PopupScheduleFields 등의 API 변경이 필요할 경우 호환 Wrapper 또는 점진 이관으로 레거시 호출부 깨짐 방지.

## D. 개발 가이드·샘플
- [ ] PopupcommonComponent Guide와 연계하여 컴포넌트 Props, 상태 흐름, 데이터 타입, 필드 추출 전후 비교, 사용 가능한 선택 키와 재사용 코드를 설명.
- [ ] 서버 없이 동작하는 샘플: 일정만 사용 / RichText + content 일부 / questions 일부 / 세 영역 조합.
- [ ] 샘플은 특정 DB 테이블 또는 API 없이 작동하도록 구성하고 외부 화면에서 붙이는 방법 명시.
- [ ] 변경 사항·신규 옵션은 가이드 공지/변경 이력에 함께 기재.

## E. 검증 및 완료 조건
- [ ] topLevel/content/questions 각각 단독, 동시 추출 및 미지정·빈 키·누락 키 동작 확인.
- [ ] null, false, 0, 빈 문자열, 빈 questions 배열이 의도대로 보존되는지 확인.
- [ ] 원본 불변, questions 원소별 선택/순서 유지, TypeScript 타입 검사.
- [ ] 공통 UI 단독 장착 시 AdminPopupDetail 전체 생성 불필요한지 확인.
- [ ] 기존 RgstPop 편집·미리보기·저장 결과가 변경 전과 동일한지 회귀 검증.
- [ ] 빌드 및 실제 브라우저에서 샘플 동작 확인. 미실행 테스트는 완료 처리하지 않는다.

## 제외 범위
- 3111/3117 등 개별 테이블 전용 Adapter 구현, 서버/DB 변경, 원본 저장 API 리팩터링.
- 공통 컴포넌트가 외부 저장 형식을 추측하거나 강제하는 기능.
