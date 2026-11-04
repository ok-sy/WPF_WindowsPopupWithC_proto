# PopupRichTextEditor 상단 툴바 숨김 TODO

작성일 2026-11-04 · 구현 대기

## 현행 Git 기준

상단 툴바는 `DecoupledEditor`의 `onReady`에서 `toolbarRef`가 붙은 Box에 연결한다. 현재 `compact`를 켜면 툴바가 숨겨지고 본문 최소 높이도 140px에서 40px로 줄어든다.

[PopupRichTextEditor.tsx](https://github.com/ok-sy/WPF_WindowsPopupWithC_proto/blob/main/zero-rule-web/main/src/features/PopupcommonComponent/PopupRichTextEditor.tsx#L125)

## 변경 요건

- [ ] 선택 prop `hideToolbar?: boolean`을 추가한다. 지정하지 않으면 기존 화면과 동일하게 동작한다.
- [ ] 툴바 Box는 `compact || hideToolbar` 조건으로 숨긴다. 같은 조건을 본문 Box와 편집 영역의 상단 모서리에도 적용한다.
- [ ] 본문 높이와 문단 간격은 기존 `compact` 조건을 따른다.
- [ ] 우클릭 서식 메뉴, Shift+우클릭 기본 메뉴, 읽기 전용 처리와 본문 변경 이벤트를 유지한다.
- [ ] 툴바를 숨길 화면의 호출부에서 `hideToolbar`를 전달한다.

## 완료 기준

| 호출 조건 | 상단 툴바 | 본문 최소 높이 |
|---|---|---:|
| 기본 | 표시 | 140px |
| hideToolbar | 숨김 | 140px |
| compact | 숨김 | 40px |
| compact + hideToolbar | 숨김 | 40px |

- [ ] 툴바를 숨겼을 때 상단에 빈 줄이 없고 본문 테두리의 위쪽 모서리가 둥글게 표시된다.
- [ ] 숨김 상태에서도 본문 입력, 우클릭 서식 적용, 저장용 변경 이벤트를 확인한다.
- [ ] 웹 프로젝트 타입 체크를 통과한다.
