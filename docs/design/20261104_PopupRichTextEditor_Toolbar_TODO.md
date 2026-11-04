# PopupRichTextEditor 상단 툴바 숨김 TODO

작성일 2026-11-04 · 공통 컴포넌트 구현 완료 · 호출 화면 미지정

## 현행 Git 기준

상단 툴바는 `DecoupledEditor`의 `onReady`에서 `toolbarRef`가 붙은 Box에 연결한다. 현재 `compact`를 켜면 툴바가 숨겨지고 본문 최소 높이도 140px에서 40px로 줄어든다.

[PopupRichTextEditor.tsx](https://github.com/ok-sy/WPF_WindowsPopupWithC_proto/blob/main/zero-rule-web/main/src/features/PopupcommonComponent/PopupRichTextEditor.tsx#L125)

## 변경 요건

- [x] 선택 prop `hideToolbar?: boolean`을 추가한다. 지정하지 않으면 기존 화면과 동일하게 동작한다.
- [x] 툴바 Box는 `compact || hideToolbar` 조건으로 숨긴다. 같은 조건을 본문 Box와 편집 영역의 상단 모서리에도 적용한다.
- [x] 본문 높이와 문단 간격은 기존 `compact` 조건을 따른다.
- [x] 우클릭 서식 메뉴, Shift+우클릭 기본 메뉴, 읽기 전용 처리와 본문 변경 이벤트를 유지한다.
- [ ] 툴바를 숨길 화면의 호출부에서 `hideToolbar`를 전달한다. — 대상 화면이 지정되지 않아 미적용. 기존 호출부는 prop을 넘기지 않아 화면 변화 없음.

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
