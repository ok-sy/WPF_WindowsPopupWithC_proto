# POL-03 — TEXT·CKEditor 서식

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-03-01 | 저장·표시 경계 | 문단 + Run JSON을 저장·전달한다. HTML은 CKEditor 입출력에서 변환하고 WPF는 HTML/XAML 문자열을 로드하지 않는다. 서버는 허용 정책을 검증하고 WPF는 표시 변환·숫자 안전성·대체 표시를 맡는다. TODO36의 중복 화이트리스트 유지 결론은 TODO48로 대체됐다. | content.textBlocks; TEXT 구 제목·설명은 TODO37 통합 | 웹 변환 / 서버 검증 / WPF 표시 |
| POL-03-02 | 문단·글자 서식 | 정렬 LEFT/CENTER/RIGHT, indent 0 이상 정수(0 생략), 1단계 40px/DIP. 5단계 UX 제한은 없다. Java int 표현 범위 2147483647은 숫자 계약이다. bold/italic/underline/strikethrough와 color/size/font는 Run 속성이다. | 서버 크기 목록 12/14/16/18/20/24/28/32; #RRGGBB 대문자; 글꼴 4 ID | 서버·웹; WPF는 관용 표시 |
| POL-03-03 | 편집 UI | 상단 툴바와 우클릭/서식 패널을 공용으로 사용한다. 일괄 서식 초기화와 패널 색 초기화 버튼은 삭제했다. 팔레트·개별 서식·글꼴/크기 기본 선택·undo/redo는 유지한다. selected/mixed는 선택 영역의 상태 표시이며 저장 필드가 아니다. | TODO63: 횟수 제한 해제 / TODO66: 초기화 진입점 삭제 | 웹 |

## 구현·계약 근거

- [popupRichText.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupRichText.ts)
- [popupRichTextFormat.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupRichTextFormat.ts)
- [PopupRichTextEditor.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupRichTextEditor.tsx)
- [PopupRichTextMenu.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupRichTextMenu.tsx)
- [PopupRichText.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupRichText.java)
- [PopupRichText.cs](../../popup-frameWork/Popup/Views/Contents/PopupRichText.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [ADMIN_POPUP_EDITOR_TRANSFORM.md](../interfaces/ADMIN_POPUP_EDITOR_TRANSFORM.md)

## 원본 TODO와 대체 관계

- [TODO28](../design/28_TEXT_FONT_EDITING_TODO.md): 37 본문 통합·48 표시 방어·49/62/63/66 편집 확장.
- [TODO36](../design/36_TEXT_서식변환_타입검사_중복검토_TODO.md): 48: 중복 정책 검사 유지 결론 대체.
- [TODO37](../design/37_TEXT_EDITOR_BODY_통합검토_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO38](../design/38_WPF_TEXT_기울임_우측잘림_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO48](../design/48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO49](../design/49_TEXT_들여쓰기_우클릭팔레트_TODO.md): 62 서식 확장·63 5단계 해제·66 초기화 삭제.
- [TODO62](../design/62_취소선_문단서식_편집메뉴_TODO.md): 63 횟수 제한 제거·66 초기화 삭제; 서식 기능 유지.
- [TODO63](../design/63_문단들여쓰기_5회제한해제_TODO.md): 66: 초기화 방어 주석/설정은 후속 삭제.
- [TODO66](../design/66_서식초기화_버튼삭제_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

실제 관리자 편집→서버→재조회→WPF 및 IME·글꼴·기울임 끝획은 미검증 항목과 분리한다. 회사 전용 글꼴 추가는 현행 4 ID 계약에 포함되지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
