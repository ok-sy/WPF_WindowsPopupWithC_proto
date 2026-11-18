# PopupRichTextEditor 상단 툴바 숨김 TODO

작성일 2026-11-04 · 구현 완료(가이드 실습 탭 적용)

## 현행 Git 기준

상단 툴바는 `DecoupledEditor`의 `onReady`에서 `toolbarRef`가 붙은 Box에 연결한다. 현재 `compact`를 켜면 툴바가 숨겨지고 본문 최소 높이도 140px에서 40px로 줄어든다.

[PopupRichTextEditor.tsx](https://github.com/ok-sy/WPF_WindowsPopupWithC_proto/blob/main/zero-rule-web/main/src/features/PopupcommonComponent/PopupRichTextEditor.tsx#L125)

## 변경 요건

- [x] 선택 prop `hideToolbar?: boolean`을 추가한다. 지정하지 않으면 기존 화면과 동일하게 동작한다.
- [x] 툴바 Box는 `compact || hideToolbar` 조건으로 숨긴다. 같은 조건을 본문 Box와 편집 영역의 상단 모서리에도 적용한다.
- [x] 본문 높이와 문단 간격은 기존 `compact` 조건을 따른다.
- [x] 우클릭 서식 메뉴, Shift+우클릭 기본 메뉴, 읽기 전용 처리와 본문 변경 이벤트를 유지한다.
- [x] 툴바를 숨길 화면의 호출부에서 `hideToolbar`를 전달한다. — 가이드 실습 탭에 스위치로 적용. 그 밖의 기존 호출부는 prop을 넘기지 않아 화면 변화 없음.

## 완료 기준

| 호출 조건 | 상단 툴바 | 본문 최소 높이 |
|---|---|---:|
| 기본 | 표시 | 140px |
| hideToolbar | 숨김 | 140px |
| compact | 숨김 | 40px |
| compact + hideToolbar | 숨김 | 40px |

- [x] 툴바를 숨겼을 때 상단에 빈 줄이 없고 본문 테두리의 위쪽 모서리가 둥글게 표시된다.
- [x] 숨김 상태에서도 본문 입력, 우클릭 서식 적용, 저장용 변경 이벤트를 확인한다.
- [x] 웹 프로젝트 타입 체크를 통과한다.

## 구현 결과

- 표시 상태만 바꾸므로 부모 state로 값을 바꿔도 다시 마운트하지 않고 입력 내용·선택 범위를 유지한다(켜고 끄기).
- 기본 호출의 툴바·높이·모서리·문단 간격은 기존과 같다. 추가 버튼 등 새 UI는 없다.
- 확인 사항: 하네스에서 `compact`의 문단 상단 여백이 코드의 6px가 아니라 12px로 계산된다. 이번 변경 범위 밖이라 수정하지 않았고, 실제 화면에서는 미확인.

## 후속 — 2026-11-18 위 라벨·'서식' 버튼 켜고 끄기

- [x] `hideLabel?: boolean`(기본 false): 입력칸 위 라벨 글자를 숨긴다. 라벨은 편집기 묶음(`role=group`)의 `aria-label`로 유지한다. 한 줄 배치(`inlineLabel`)의 짧은 표시는 영향 없음.
- [x] `hideFormatButton?: boolean`(기본 false): '서식' 버튼을 숨긴다(일반·compact·한 줄 배치 모두). 서식은 우클릭·키보드 서식 패널과 상단 툴바(켜져 있으면)로 지정한다.
- [x] 둘 다 숨기면 라벨 줄을 그리지 않는다. 넘기지 않으면 기존 화면과 같다. 툴바·라벨·서식 버튼을 모두 끄면 서식 진입이 우클릭뿐이라 가이드에 안내.
- [x] 가이드 props·실행기·공지, 인계 문서(`POPUP_FRONT_SAMPLE_HANDOVER.md`) 반영.
- 검증: tsc·eslint 통과. `verify-rich-text-49` 85건(조합 6종 라벨·버튼·라벨 줄·접근 이름, 버튼 숨김 시 우클릭 패널), guide-render 31·guide-registry 300·survey-rich-text-55 74·common-sample-69 62·quiz-option-byte-73 44 통과. 실화면 미실행.
- [x] 적용(2026-11-18): `PopupQuestionEditor` 문항 제목 편집기(접근 이름 `N번 문항 제목(필수)`)와 설명 편집기(IS063 샘플·`PopupSampleEditor`·RgstPop `PopupEditorDialog`)에 `hideLabel`·`hideFormatButton`. 빈 입력은 placeholder(`문항 제목을 입력하세요.`·`설명(선택)`)로 구분. 검증: tsc·eslint, common-sample-69 63(라벨·버튼 미표시·접근 이름), survey-rich-text-55 74·rgstpop-quiz-rule 25·question-template-picker 7·quiz-option-byte-73 44·guide-render 31·guide-registry 300·transform-64 78·rich-text-49 85 통과.
