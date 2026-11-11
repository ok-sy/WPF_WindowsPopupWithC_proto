# 팝업 프로젝트 통합 정책 (POLICY)

> 기존 16개 `POL-01.md`~`POL-16.md`를 한 파일에서 조회할 수 있도록 합친 **읽기용 통합본**이다. 원본 정책 파일·TODO·API 계약·검증 기록은 변경하지 않는다. 내용은 기존 정책 파일의 기준일과 검증 한계를 그대로 따른다.
>
> **계약 우선순위:** API 필드·필수값·ENUM·기본값은 [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)를 따른다. 충돌·미확정은 [TODO71 충돌표](../reviews/TODO71/CONFLICTS.md)를 참고한다. 이 통합본은 원본을 대체하거나 새로운 정책을 확정하지 않는다.

## 정책 목차

| 정책 | 카테고리 | 개별 원본 |
|---|---|---|
| POL-01 | 팝업 공통 옵션·데이터 | [원본](POL-01.md) |
| POL-02 | 창·헤더·푸터·Overlay | [원본](POL-02.md) |
| POL-03 | TEXT·CKEditor 서식 | [원본](POL-03.md) |
| POL-04 | IMAGE 크기·표시 | [원본](POL-04.md) |
| POL-05 | VIDEO 재생·완료 | [원본](POL-05.md) |
| POL-06 | SURVEY·QUIZ | [원본](POL-06.md) |
| POL-07 | 관리자 등록·저장·변환 | [원본](POL-07.md) |
| POL-08 | 관리자 미리보기 | [원본](POL-08.md) |
| POL-09 | API 인터페이스 계약 | [원본](POL-09.md) |
| POL-10 | 전달·결과·중복 처리 | [원본](POL-10.md) |
| POL-11 | 조회·노출·스케줄 | [원본](POL-11.md) |
| POL-12 | 오류·복구·동시성 | [원본](POL-12.md) |
| POL-13 | DB·영속성 | [원본](POL-13.md) |
| POL-14 | DEMO·샘플·컴포넌트 | [원본](POL-14.md) |
| POL-15 | 배포·실행 환경 | [원본](POL-15.md) |
| POL-16 | 검증·정합성·품질 | [원본](POL-16.md) |

- [정책 색인](README.md) · [활성 작업](ACTIVE_TASKS.md) · [TODO 전수조사표](../reviews/TODO71/INVENTORY.md)
- 개별 정책 파일의 상대경로 링크는 이 통합 파일과 같은 `docs/policies/`에 있으므로 그대로 유지한다.

---

# POL-01 — 팝업 공통 옵션·데이터

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-01-01 | 공통 옵션의 위치 | WPF 응답의 popup에 창·헤더·푸터·Overlay 옵션을 둔다. content는 유형별 콘텐츠다. 관리자 편집 객체의 content 및 DB 저장 위치와 WPF 응답 위치를 구분한다. | 입력: 관리자 편집값 / 출력: popup + content | 서버 응답 조립·WPF DTO |
| POL-01-02 | 기본값의 적용 | 누락 시 기본값을 적용하되 명시 false·0을 truthy 검사로 덮어쓰지 않는다. useBackgroundOverlay 기본 true, 불투명도 0.45. 글자별 Run.size가 있으면 해당 구간에 적용하고 없으면 본문 스타일을 따른다. | 옵션별 계약은 인터페이스 popup 필드 표 | 서버·웹·WPF |
| POL-01-03 | 최소 크기 | 창 최소 가로·세로는 각각 300(CSS px/WPF DIP). 관리자 저장 검증과 클라이언트의 구 데이터 표시 보정을 구분한다. FIT_TO_IMAGE의 입력은 콘텐츠 크기이며 최종 창에 하한을 적용한다. 기본 창 크기를 300으로 통일하는 요건은 아니다. | minimumWidth/minimumHeight 및 width/height | 등록 검증·레이아웃 |

## 구현·계약 근거

- [PopupResponseDto.cs](../../popup-frameWork/Popup/Dtos/PopupResponseDto.cs)
- [PopupOptions.cs](../../popup-frameWork/Popup/Models/PopupOptions.cs)
- [PopupWindowOptions.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/PopupWindowOptions.java)
- [popupCommon.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupCommon.ts)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO14](../design/14_폐쇄망_반입_및_UI_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO30](../design/30_Footer_Action_최상위_계약_TODO.md): 35: popups[]→popup; 푸터 역할 유지.
- [TODO31](../design/31_PopupWindow_공통_UI_옵션_최상위_계약_TODO.md): 35 단건화·57 폐기 옵션·68 최소 크기 후속 반영.
- [TODO34](../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md): 35 단건 결과; 복구 최종값은45 보류.
- [TODO57](../design/57_완료전닫기옵션_폐기_역할분리_TODO.md): 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리.
- [TODO68](../design/68_팝업최소크기_300x300_공통화_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

Windows DPI·작은 작업 영역 및 구 데이터 실화면은 TODO68에서 검증한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-02 — 창·헤더·푸터·Overlay

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-02-01 | 창 구조 | TODO26의 Header/Footer HWND 분리·모서리 창 제거안은 폐기했다. 현재 모서리 창 및 DPI·드래그 보완은 유지한다. 기능 전체 폐기로 해석하지 않는다. | 현재 PopupWindow + OpaqueWindowCorners | WPF |
| POL-02-02 | 종료 제어 | 외부 닫기 제한은 useBackgroundOverlay로 판단한다. Overlay OFF의 Alt+F4 등은 완료 기준 미달이어도 허용한다. ON은 완료 후에도 외부 닫기를 자동 허용하지 않는다. 앱 종료 및 화면 출구 없음 예외는 유지한다. | allowCloseBeforeComplete는 폐기; Esc는 일반 팝업 닫기 아님 | WPF 창 |
| POL-02-03 | 푸터 역할 | SURVEY·QUIZ는 SUBMIT. TEXT·IMAGE·VIDEO의 CLOSE/LINK_AND_CLOSE와 URL 검증은 API 계약을 따른다. showLater는 완료 전 연기 버튼 표시이며 showFooter 조건을 따른다. | showFooter / footerAction / footerLinkUrl | 서버·웹·WPF |

## 구현·계약 근거

- [PopupWindow.xaml.cs](../../popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs)
- [OpaqueWindowCorners.cs](../../popup-frameWork/Popup/Views/Windows/OpaqueWindowCorners.cs)
- [PopupManager.cs](../../popup-frameWork/Popup/Managers/PopupManager.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO07](../design/07_WPF_변경설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO11](../design/11_WPF_FIXED_화면초과_방어_수정계획.md): 원본 세부 요건·검증 이력 유지.
- TODO16: popupPosition 공통 옵션으로 유지 (Git `e65f88c`).
- [TODO25](../design/25_WPF_팝업_Header_외곽_UI_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO26](../design/26_VIDEO_팝업_HWND_구조_개선_TODO.md): Header/Footer 분리안 폐기; 기존 DPI·드래그 보완 유지.
- [TODO30](../design/30_Footer_Action_최상위_계약_TODO.md): 35: popups[]→popup; 푸터 역할 유지.
- [TODO44](../design/44_BackgroundOverlay_키보드종료_동작검토_TODO.md): 57: 외부 닫기 Overlay 책임 확정.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO57](../design/57_완료전닫기옵션_폐기_역할분리_TODO.md): 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리.

## 검증 상태·미확정 범위

실제 Windows 키보드·멀티 모니터·Horizon 확인은 TODO25·44·57에 남아 있다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

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

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-04 — IMAGE 크기·표시

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-04-01 | 공통 크기 입력 | 외부 크기는 popup.width/height 한 쌍이다. TODO15→23→58의 대체 관계를 따른다. 새 저장은 content.width/height를 받지 않으며 WPF의 구 응답 축별 대체 읽기는 호환 경로다. | popup.width/height | 서버 조립·WPF Factory·웹 |
| POL-04-02 | 모드별 기준 | ADAPTIVE와 ORIGINAL은 창 크기다. ADAPTIVE는 크롬을 뺀 남은 영역에 이미지를 배치한다. ORIGINAL은 원본 크기로 배치하고 넘침을 자른다. FIT_TO_IMAGE는 이미지 콘텐츠 영역에 크기를 할당한 뒤 헤더·푸터 등 부가 영역을 더한다. | ADAPTIVE / FIT_TO_IMAGE / ORIGINAL; FULLSCREEN 우선 | 레이아웃 |
| POL-04-03 | 비율·상한 | FIT_TO_IMAGE 두 축은 지정 영역으로 유지하고 비율 고정이면 Uniform/contain, 해제면 Fill이다. TODO23의 너비 우선 높이 정규화를 현행으로 재사용하지 않는다. 최종 창 최소 300과 작업 영역 상한을 함께 적용한다. | 원본 비율·생략 축·클리핑은 인터페이스 IMAGE 표 | 웹·WPF |

## 구현·계약 근거

- [ImagePopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/ImagePopupView.xaml.cs)
- [ImageFillPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/ImageFillPopupView.xaml.cs)
- [PopupFactory.cs](../../popup-frameWork/Popup/Factories/PopupFactory.cs)
- [imagePreviewLayout.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/imagePreviewLayout.ts)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)
- 계약/실행 안내: [POPUP_PREVIEW_WPF_PARITY.md](../reviews/POPUP_PREVIEW_WPF_PARITY.md)

## 원본 TODO와 대체 관계

- [TODO15](../design/15_IMAGE_팝업_크기모드_정리.md): 23→58: IMAGE 크기 계약 대체.
- [TODO23](../design/23_IMAGE_크기모드_단순화_TODO.md): 58: 최상위 크기·FIT_TO_IMAGE 영역 기준 대체.
- [TODO58](../design/58_IMAGE_공통크기필드_모드별기준_TODO.md): 68: 최소 300 추가; 모드별 크기 의미 유지.
- [TODO68](../design/68_팝업최소크기_300x300_공통화_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

구 content 크기 대체 읽기 삭제 시점, DPI·다중 모니터·작업 영역 실화면은 별도 확인한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-05 — VIDEO 재생·완료

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-05-01 | 재생 경로 | 로컬·HTTP 영상의 현재 재생 경로를 유지하며 YouTube 지원은 되살리지 않는다. allowSeek는 진행바 탐색 허용이고 창 드래그 옵션이 아니다. | VIDEO 및 QUIZ videoEnabled | WPF 플레이어·웹 미리보기 |
| POL-05-02 | 완료·화면 이탈 | completionRatio는 누적 시청 기준이다. 일반 VIDEO 버튼은 기준 전 비활성, 충족 후 활성. VIDEO+QUIZ는 기준 전 문항 잠금, 이후 기존 퀴즈 제출 조건 적용. 재생 실패 출구는 유지한다. 외부 닫기는 POL-02다. | 공통 VideoCompletion 계산; allowCloseBeforeComplete 폐기 | WPF·서버 판정 |
| POL-05-03 | 결합 화면 | 영상 원본 메타데이터 비율로 VIDEO+QUIZ 영상 영역을 할당하고 메타데이터 미확보 시 대체 비율을 사용한다. 중복 중간 notice는 제거하며 하단 완료 상태 안내까지 일괄 삭제하지 않는다. | 비율 처리 상세는 TODO60; 중간 안내 TODO59 | WPF·웹 |

## 구현·계약 근거

- [VideoPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs)
- [VideoQuizPopupView.cs](../../popup-frameWork/Popup/Views/Contents/VideoQuizPopupView.cs)
- [VideoCompletion.cs](../../popup-frameWork/Popup/Services/VideoCompletion.cs)
- [AspectVideoArea.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/AspectVideoArea.tsx)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [20261007_저사양_PC_VIDEO_측정_가이드.md](../reviews/20261007_저사양_PC_VIDEO_측정_가이드.md)

## 원본 TODO와 대체 관계

- [TODO19](../design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md): 35: 목록 큐/주기 대체; 영상 UI는 유지.
- [TODO24](../design/24_VIDEO_저사양_PC_CPU_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO27](../design/27_VIDEO_SEEK_ON_OFF_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO43](../design/43_완료조건_버튼활성화_UX_TODO.md): 57: allowCloseBeforeComplete 폐기; 완료 조건 UX 유지.
- [TODO57](../design/57_완료전닫기옵션_폐기_역할분리_TODO.md): 기존 옵션 폐기 구현; 완료/Overlay/LATER 분리.
- [TODO59](../design/59_VIDEO_QUIZ_중간안내제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO60](../design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

HTTP/WebView2 실제 영상·저사양 CPU 실측·폐쇄망 장치 검증을 코드/자동 검증 기록과 구분한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-06 — SURVEY·QUIZ

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-06-01 | 문항·서식 | SURVEY/QUIZ 및 VIDEO+QUIZ 설문 영역에 공용 문단·Run 서식을 사용한다. 평문 필드 옆의 대응 Blocks 배열을 사용한다. 문항·선택지의 식별자와 답변 값은 서식과 구분한다. | questions[].titleBlocks/descriptionBlocks, options[].textBlocks; 콘텐츠 surveyTitleBlocks/descriptionBlocks | 웹·서버·WPF |
| POL-06-02 | 선택·제출 | QUIZ MULTIPLE_CHOICE는 isCorrect=true인 정답 수만큼 선택 가능하다. 별도 count 필드는 추가하지 않는다. SURVEY 복수 선택은 이 제한을 적용하지 않는다. 필수 응답 후 WPF가 채점한다. 참여형은 기준 미달도 제출하며, 합격이 필요한 유형만 미달 제출을 차단한다(PU001 §7, 2026-11-09). 서버는 유효한 제출을 합불과 무관하게 완료 처리한다. | 조회 requiresPassing; 결과 score/passed는 WPF 계산값(기준 미달 false, 기준 이상 true) | 웹 미리보기·WPF; 서버 저장 |
| POL-06-03 | 표현·수명 | 선택 UI 개선은 답변 계약을 바꾸지 않는다. 영상 시청 완료만으로 퀴즈 완료가 되지 않는다. 미통과·닫기·LATER의 결과 매핑은 POL-10과 분리하지 않는다. | showLater / SUBMITTED / VIDEO_WATCHED | 웹·WPF·서버 |

## 구현·계약 근거

- [SurveyPopupView.xaml.cs](../../popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml.cs)
- [SurveyPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/SurveyPreview.tsx)
- [PopupQuestionDto.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/PopupQuestionDto.java)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO20](../design/20_SURVEY_QUIZ_UI_개선_TODO.md): 원본 세부 요건·검증 이력 유지.
- TODO21: TODO20 §6 통합; DEMO QA 유지 (Git `e65f88c`).
- [TODO22](../design/22_WEB_SURVEY_QUIZ_UI.md): 원본 세부 요건·검증 이력 유지.
- [TODO43](../design/43_완료조건_버튼활성화_UX_TODO.md): 57: allowCloseBeforeComplete 폐기; 완료 조건 UX 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO55](../design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO56](../design/56_SURVEY_QUIZ_선택상태_응답안내_UX_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

문항 description 삭제나 전체 Description ROOT 공통화는 이번 정리에서 확정하지 않는다. 실화면·저장 왕복은 TODO55·56·52 잔여 항목이다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-07 — 관리자 등록·저장·변환

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-07-01 | 부모의 데이터 소유 | 조회 래퍼 AdminPopupInfo를 toEditorPopup 등으로 편집 객체로 바꾸고 부모가 state를 소유한다. 두 미리보기에는 같은 편집 객체를 준다. 미리보기 전용 변환은 없다. | 조회 객체 → 편집 객체 → 저장 요청 객체 | 프론트 부모 + 순수 변환 함수 |
| POL-07-02 | 변환 책임 분리 | popupEditorTransform.ts는 전체 팝업 구성·기본값·저장 정규화를 맡고 popupRichText.ts는 HTML↔Blocks를 맡는다. 변환 함수에 API 호출·toast·React state를 넣지 않는다. | toSaveRequest → {popup, active, targetGroups} | 웹 |
| POL-07-03 | 저장 경계 | 프론트는 객체를 보내고 서버가 Jackson으로 매핑·검증한다. CONTENT_OPTIONS CLOB의 문자열 저장/파싱은 서버 책임이다. CLOB 내용을 JSON 문자열로 이중 인코딩해 WPF에 보내지 않는다. | DB 저장 구조 ≠ WPF 응답 구조 | 서버·MyBatis |

## 구현·계약 근거

- [popupEditorTransform.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform.ts)
- [PopupEditorDialog.tsx](../../zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx)
- [PopupContentAssembler.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupContentAssembler.java)
- [PopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupService.java)

- 계약/실행 안내: [ADMIN_POPUP_EDITOR_TRANSFORM.md](../interfaces/ADMIN_POPUP_EDITOR_TRANSFORM.md)
- 계약/실행 안내: [POPUP_FRONT_SAMPLE_HANDOVER.md](../interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md)
- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)

## 원본 TODO와 대체 관계

- TODO08: 설계09 단계7 흡수; 관리자 기능 유지 (Git `e65f88c`).
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO64](../design/64_팝업데이터변환_함수분리_이식가이드_TODO.md): 69: 공통 폴더 이동; 변환 역할 유지.

## 검증 상태·미확정 범위

담당 Front/Server의 실제 화면 이식·DB 저장 검증은 인계 범위로 남긴다. 서버 샘플을 완성된 대상 서버 구현으로 간주하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-08 — 관리자 미리보기

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-08-01 | 공통 렌더러 | 우측 인라인과 실제 크기 모달은 PopupPreview를 공유한다. 입력 popup 객체를 변경하지 않고 저장·조회 API에 의존하지 않는다. | AdminPopupDetail; onOpenPreview/onClose | 웹 |
| POL-08-02 | 미리보기 상태 | 답변·채점·시청 비율 시연 상태는 각 미리보기 내부에 있다. 편집 데이터나 결과 전송에 섞지 않는다. 모달 언마운트 시 시연 상태를 초기화한다. | 두 미리보기 간 시연 상태 독립 | 웹 |
| POL-08-03 | Dialog 호환 | BackdropProps→slotProps.backdrop, PaperProps→slotProps.paper(소문자). 공통 slotProps 안에 두 설정을 합치며 FULLSCREEN paper 분기를 유지한다. 저장소 MUI와 폐쇄망 설치 버전을 별도로 확인한다. | 저장소 선언 ^6.4.1 / lock 6.5.0; 최소 300 | 웹 MUI |

## 구현·계약 근거

- [InlinePopupPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview.tsx)
- [PopupPreviewDialog.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreviewDialog.tsx)
- [PopupPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview.tsx)
- [popupPreviewDialogLayout.ts](../../zero-rule-web/main/src/features/PopupcommonComponent/popupPreviewDialogLayout.ts)

- 계약/실행 안내: [ADMIN_POPUP_PREVIEW_COMPONENTS.md](../interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md)
- 계약/실행 안내: [POPUP_PREVIEW_WPF_PARITY.md](../reviews/POPUP_PREVIEW_WPF_PARITY.md)

## 원본 TODO와 대체 관계

- [TODO22](../design/22_WEB_SURVEY_QUIZ_UI.md): 원본 세부 요건·검증 이력 유지.
- [TODO60](../design/60_VIDEO_QUIZ_원본비율_영역할당_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO61](../design/61_관리자_미리보기_컴포넌트화_TODO.md): 69: 공통 폴더 이동; 두 미리보기 API 유지.
- [TODO67](../design/67_MUIdeprecated속성_미리보기호환검증_TODO.md): 69: 공통 폴더 이동; slotProps 전환 유지.
- [TODO68](../design/68_팝업최소크기_300x300_공통화_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

브라우저 Esc 종료는 미리보기 UX이며 WPF 일반 팝업 Esc 계약과 다르다. 실제 관리자 화면·폐쇄망 CSS·설치 MUI 확인은 별도다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-09 — API 인터페이스 계약

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-09-01 | 3 API 순서 | 로그인 → POST 단건 조회 → 결과 1건 저장 → 필요 시 재조회. 인증 만료는 로그인 재진입 경로를 따른다. 계약 BaseUrl의 /p와 상대 /api/wpf 경로를 구분한다. | auth/login, popups, popups/results | 서버 Controller·WPF API |
| POL-09-02 | 조회 응답 | 매 응답 pollingIntervalSeconds와 popup 객체 또는 명시 null을 준다. userId/serverTime/popups[]/displayOrder/nextStatus를 조회 계약으로 되살리지 않는다. 조회가 전달 건을 만들거나 재사용하므로 POST다. | {pollingIntervalSeconds, popup}; 주기 1800~3600초 | 서버 / WPF 최신 주기 반영 |
| POL-09-03 | 저장 응답 | resultId/status/code/message와 저장 성공 시 nextStatus. AVAILABLE 즉시 조회, EMPTY 주기 대기. 후보 확인 실패는 nextStatus 생략 + WPF_NEXT_STATUS_UNKNOWN이며 저장 실패로 재해석하지 않는다. | ACCEPTED/DUPLICATE/REJECTED/RETRYABLE_ERROR/INTERNAL_ERROR | 서버·WPF |

## 구현·계약 근거

- [WpfPopupController.java](../../zero-rule-server/web/api/src/main/java/server/web/api/popup/wpf/WpfPopupController.java)
- [WpfNextPopupResponse.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfNextPopupResponse.java)
- [WpfResultResponse.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/wpf/WpfResultResponse.java)
- [WpfNextPopupResponseDto.cs](../../popup-frameWork/Popup/Dtos/WpfNextPopupResponseDto.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_ALL_SPEC.md](../interfaces/WPF_POPUP_ALL_SPEC.md)
- 계약/실행 안내: [WPF_POPUP_MINIMAL_SPEC.md](../interfaces/WPF_POPUP_MINIMAL_SPEC.md)
- 계약/실행 안내: [WPF-01-popup-types.json](../interfaces/examples/WPF-01-popup-types.json)

## 원본 TODO와 대체 관계

- [TODO02](../design/02_목표아키텍처.md): 원본 세부 요건·검증 이력 유지.
- [TODO03](../design/03_WPF_API_설계.md): 12·18·29~35: 최초 목록/일괄 API 대체.
- [TODO04](../design/04_인증설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO10](../design/10_WPF_SSO_토큰_프로토타입_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO29](../design/29_WPF_목록_API_응답_계약_정리_TODO.md): 35: ROOT userId/serverTime/popups[] 제거; 노출 판단 서버 소유 유지.
- [TODO30](../design/30_Footer_Action_최상위_계약_TODO.md): 35: popups[]→popup; 푸터 역할 유지.
- [TODO31](../design/31_PopupWindow_공통_UI_옵션_최상위_계약_TODO.md): 35 단건화·57 폐기 옵션·68 최소 크기 후속 반영.
- [TODO32](../design/32_RESULT_responseStartedAt_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO33](../design/33_RESULT_응답_score판정값_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO34](../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md): 35 단건 결과; 복구 최종값은45 보류.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO46](../design/46_API_WPF_관리자웹_계약통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

Word/PDF/Excel은 별도 생성 산출물이며 2026-10-22 현행 v3.7 보완까지 동기화했다. 이후 계약 변경 시 함께 갱신하고 미동기화는 충돌표에서 추적한다. 통합 토큰의 실제 발급·검증은 담당 팀 범위다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-10 — 전달·결과·중복 처리

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-10-01 | 전달과 제출 식별 | deliveryId는 서버 발급 전달 건, resultId는 클라이언트가 확정 결과 생성 시 만드는 멱등 키다. 재전송은 같은 resultId·본문을 유지한다. 같은 팝업이 새 전달로 재노출될 수 있으므로 popupId와 둘을 합치지 않는다. | popup.deliveryId → 결과 deliveryId | 서버 전달 / WPF 결과 |
| POL-10-02 | 검증·원자성 | 활성 사용자 잠금 → 영수증 중복 확인 → 전달 소유·팝업 일치·종료 검사 → 결과 반영·전달 종료·영수증 기록. 같은 resultId는 재처리 없이 DUPLICATE. 다른 resultId로 이미 끝난 전달 제출은 WPF_DELIVERY_COMPLETED다. | 사용자→전달 건 잠금; 결과 저장 트랜잭션 | 서버·Oracle |
| POL-10-03 | 완료·숨김·연기 | TEXT/IMAGE CLOSED는 완료다. HIDDEN은 hideDays(누락 시 클라이언트 생성 기본 30, 유효 1~3650)의 숨김이다. LATER는 완료·숨김을 변경하지 않고 pollingIntervalSeconds 유예; SURVEY·QUIZ·VIDEO를 완료 없이 닫은 CLOSED와 미완료 VIDEO_WATCHED도 완료·숨김을 변경하지 않고 같은 유예를 받는다(창 닫기·앱 정상 종료 경로 포함). 프로세스 강제종료처럼 결과가 만들어지지 않으면 전달 건이 OPEN으로 남아 유예 없이 다음 조회에서 같은 deliveryId로 다시 내려간다(미완료 닫기와 구분); 버튼 동작은 숨김 체크보다 우선하며 이번 video를 싣지 않는다. VIDEO/QUIZ 완료는 각 조건을 따른다. | CLOSED/HIDDEN/LATER/SUBMITTED/VIDEO_WATCHED | WPF 생성 / 서버 저장 |

## 구현·계약 근거

- [WpfResultProcessor.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfResultProcessor.java)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [PopupResultBuilder.cs](../../popup-frameWork/Popup/Services/PopupResultBuilder.cs)
- [WpfPopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/WpfPopupMapper.xml)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [15_wpf_popup_delivery_oracle.sql](../../db/oracle/15_wpf_popup_delivery_oracle.sql)

## 원본 TODO와 대체 관계

- [TODO12](../design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO33](../design/33_RESULT_응답_score판정값_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO45](../design/45_단건_RESULT_재전송오류_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.

## 검증 상태·미확정 범위

같은 resultId 다른 본문 비교와 보존 기간은 보류다. 현행 무비교 DUPLICATE를 최종 정책으로 승격하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-11 — 조회·노출·스케줄

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-11-01 | 노출 판단 소유 | 활성·기간·대상·완료·숨김·유예·일정·정렬은 서버가 판단한다. WPF는 받은 1건을 표시하며 표시 중 다음 조회를 하지 않는다. 열린 전달이 유효하면 같은 deliveryId를 재사용한다. | displayOrder → createdAt → popupId; 관리자/서버 기준 | 서버 |
| POL-11-02 | 반복의 의미 | 반복은 미완료 팝업의 노출 가능 일정이다. 한 번 완료되면 다음 반복일에도 제외한다. 회차별 응답·회차 키는 추가하지 않는다. HIDDEN은 N일, LATER와 미완료 닫기(SURVEY·QUIZ·VIDEO의 CLOSED, 미완료 VIDEO_WATCHED)는 다음 조회 주기까지(강제종료로 결과가 없으면 유예 없음, POL-10-03)이며 일정 밖이면 다음 유효 시간대를 기다린다. | FIXED / SCHEDULE; ISO요일 1~7; 시간대 배열 | 서버·관리자 |
| POL-11-03 | 시간 경계 | 서버 KST, 복수 시간대, 자정 초과 허용(시작 요일 기준), 요일 없으면 매일·시간대 없으면 종일. 게시 기간 내에서만 후보가 된다. 정각·2분 표시 보장은 없고 조회 사이 시간대를 놓칠 수 있다. 기전달 결과는 시간대 종료 후에도 수용한다. | 요일·시간대는 WPF 조회 응답에 전달하지 않음 | 서버 일정 SQL |

## 구현·계약 근거

- [PopupDisplaySchedule.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupDisplaySchedule.java)
- [PopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/PopupMapper.xml)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [PopupPollingRecovery.cs](../../popup-frameWork/Popup/Services/PopupPollingRecovery.cs)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)
- 계약/실행 안내: [18_popup_display_time_oracle.sql](../../db/oracle/18_popup_display_time_oracle.sql)

## 원본 TODO와 대체 관계

- [TODO19](../design/19_WPF_운영_조회_및_VIDEO_UI_TODO.md): 35: 목록 큐/주기 대체; 영상 UI는 유지.
- [TODO29](../design/29_WPF_목록_API_응답_계약_정리_TODO.md): 35: ROOT userId/serverTime/popups[] 제거; 노출 판단 서버 소유 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- TODO40: 고정 1시간안; 확정 LATER는 TODO52-2 (Git `b2626d7`).
- TODO41: 횟수 제한 미확정; LATER에 자동 적용 금지 (Git `b2626d7`).
- TODO42: 상시 재노출안; 게시 반복 일정과 별개 (Git `b2626d7`).
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.

## 검증 상태·미확정 범위

상시 재노출 제안·나중에 보기 3회 제한·Agent 지연 조회의 미확정 내용을 반복 일정에 혼입하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-12 — 오류·복구·동시성

기준일: 2026-11-11 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-12-01 | 종결과 보관 | 요청 resultId와 일치하는 ACCEPTED/DUPLICATE/REJECTED만 큐에서 제거한다. 미종결·응답 유실·다른 ID 응답은 같은 결과를 보관한다. 보관은 실행 중 메모리에만 하며 프로세스 종료 시 미전송 결과 유실을 수용한다(2026-10-28 결정, 2026-11-03 구현). | 상태와 HTTP 오류를 별개로 처리 | WPF |
| POL-12-02 | 결과 전송 우선(A안) 확정 | 복구 대상 미종결 결과는 메모리에 보관해 같은 resultId로 우선 재전송하고 다음 단건 팝업 조회를 보류한다. HTTP 400 격리·INTERNAL_ERROR 실행당 3회 소진 후 조회 허용은 현행 임시 예외로 TODO45에서 별도 결정한다. | 결과 우선 원칙 확정 / 예외 미결 | WPF |
| POL-12-04 | 통합 복구 주기 확정 | 로그인 실패, 조회·결과 전송의 401 재인증 1회 실패 및 기타 복구 대상 장애: 10초 3회 × 3사이클(총 9회), 사이클 간 30분(현행 30분+10초), 소진 후 60분마다 1회. 복구 성공 시 초기화하며 전체 사이클은 다시 시작하지 않는다. | HTTP 400·403·426 별도 처리 / 401·로그인 실패 복구 진입 2026-11-11 WPF 반영 | WPF |
| POL-12-03 | 진행 단위 | 사번 단위 OPEN 최대 1건과 사용자→전달 건 잠금을 유지한다. 여러 PC는 현재 같은 OPEN 전달을 받을 수 있고 선행 결과가 반영된다. 다중 PC 동시 표시 허용 정책은 별도 보류다. | 기기/세션 진행 단위로 임의 변경 금지 | 서버·Oracle |

## 구현·계약 근거

- [PopupResultQueue.cs](../../popup-frameWork/Popup/Services/PopupResultQueue.cs)
- [PopupPollingRecovery.cs](../../popup-frameWork/Popup/Services/PopupPollingRecovery.cs)
- [WpfPopupService.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfPopupService.java)
- [WpfResultProcessor.java](../../zero-rule-server/service/core/src/main/java/server/service/core/popup/wpf/WpfResultProcessor.java)

- 계약/실행 안내: [POPUP_INTERFACE_SPEC.md](../interfaces/POPUP_INTERFACE_SPEC.md)

## 원본 TODO와 대체 관계

- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO34](../design/34_RESULT_계약_및_공통옵션_정합성_보완_TODO.md): 35 단건 결과; 복구 최종값은45 보류.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO45](../design/45_단건_RESULT_재전송오류_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

2026-11-11 확정: 결과 우선(A안)·통합 복구 주기. 400 격리·INTERNAL_ERROR 3회 상한과 소진 후 조회 허용·본문 비교·다중 PC는 미결이다. 종료 시 메모리 큐 유실은 수용 정책을 유지한다. 최대 3사이클, 조회 401 재인증 실패(로그인 실패 포함)의 복구 진입, 결과 저장 성공 시 횟수 초기화(이어진 조회 실패는 1회부터)는 2026-11-11 WPF에 반영하고 자동 테스트로 확인했다. 실환경 검증은 수행하지 않았다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-13 — DB·영속성

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-13-01 | 콘텐츠와 관리 상태 | JSON 콘텐츠 저장과 대상·완료·숨김·전달·영수증 관리를 구분한다. WPF 응답 구조를 DB 한 컬럼과 동일한 구조라고 가정하지 않는다. CLOB 파싱·필드 승격·기본값은 서버 조립 책임이다. | CONTENT_OPTIONS 및 담당 실테이블 CNTN_CN | 서버·DB |
| POL-13-02 | 전달·영수증 | WPF_POPUP_DELIVERY는 DELIVERY_ID PK, 사용자별 OPEN 함수 기반 UNIQUE, DONE/EXPIRED, RESULT_ID·DEFER_UNTIL_AT을 가진다. WPF_RESULT_RECEIPT는 resultId 멱등 확인이며 중복 요청을 새 업무 결과로 다시 기록하지 않는다. | DDL 15 및 01, 조회/결과 매퍼 | Oracle |
| POL-13-03 | 적용·샘플 구분 | 신규 스키마와 기존 DB 이관은 db/oracle/README 순서를 따른다. TODO65 DTIY3111 샘플은 정렬 후 ROWNUM 1·바인딩·CLOB→객체 조립 예제이며 자격/완료/소유권 전체 로직이 아니다. | 실테이블 코드표·전달 포트는 담당 서버에 맞게 교체 | 서버 담당 |

## 구현·계약 근거

- [WpfPopupMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/WpfPopupMapper.xml)
- [PopupSingleQuerySampleMapper.xml](../../zero-rule-server/repo/core/src/main/resources/mappers/popup/sample/PopupSingleQuerySampleMapper.xml)
- [PopupContentRow.java](../../zero-rule-server/domain/src/main/java/server/domain/popup/sample/PopupContentRow.java)

- 계약/실행 안내: [README.md](../../db/oracle/README.md)
- 계약/실행 안내: [01_popup_schema_oracle.sql](../../db/oracle/01_popup_schema_oracle.sql)
- 계약/실행 안내: [SERVER_SAMPLE_SINGLE_QUERY_API.md](../interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md)

## 원본 TODO와 대체 관계

- [TODO05](../design/05_Oracle_DB_설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO06](../design/06_서버_변경설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO32](../design/32_RESULT_responseStartedAt_제거_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO35](../design/35_WPF_단건_팝업_조회_결과_API_흐름_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO47](../design/47_팝업유효성_게시중단_전달상태_정책검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO52](../design/52_회의확정요건_게시반복_나중에보기_공통동작_TODO.md): 52-1·2·4·5 구현; 3·6~8 상세 계약·통합 확인 대기.
- [TODO55](../design/55_SURVEY_QUIZ_FONT_EDIT_확장_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO65](../design/65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

DDL 파일 존재는 원격 DB 적용 증거가 아니다. 실제 DTIY3111 SQL·코드표와 기존 DB 적용 여부는 해당 실행 기록으로 확인한다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-14 — DEMO·샘플·컴포넌트

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-14-01 | 공통 프론트 경계 | features/PopupcommonComponent는 API 비의존 편집기·서식·렌더러·미리보기·변환 진입점이다. sample 아래 목록 기반 및 IS063M02 연결 예제를 둔다. 원본 퍼블리싱은 대조용이다. | /popup-common-sample 및 /popup-common-sample/is063m02 | 웹 |
| POL-14-02 | Demo 모드 | 로컬 샘플과 API 연결 모드를 구분하고 요청 입력·응답 확인·팝업 표시를 제공한다. 상세옵션은 모달 그룹으로 편집한다. Demo 응답/미리보기 내부 시연값을 실제 저장 결과로 취급하지 않는다. | 실행 인자 --demo / --demo --api | WPF Demo |
| POL-14-03 | 서버 인계 예제 | TODO65는 DB 조회·조립 샘플, TODO70은 DB 없이 HTTP 백엔드를 호출하는 조회 중계 샘플이다. 기본 비활성이며 별도 경로를 쓴다. 중계는 응답을 객체로 파싱하고 timeout·오류 매핑을 제공하며 결과 저장 API로 범위를 늘리지 않는다. | single-query / relay 조건부 설정; 재시도 없음 | 서버 샘플 |

## 구현·계약 근거

- [PopupListSample.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/sample/PopupListSample.tsx)
- [IS063M02Sample.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/sample/IS063M02Sample.tsx)
- [PopupRelayController.java](../../zero-rule-server/web/api/src/main/java/server/web/api/popup/sample/relay/PopupRelayController.java)
- [PopupSampleEditor.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/sample/PopupSampleEditor.tsx)

- 계약/실행 안내: [POPUP_FRONT_SAMPLE_HANDOVER.md](../interfaces/POPUP_FRONT_SAMPLE_HANDOVER.md)
- 계약/실행 안내: [ADMIN_POPUP_PREVIEW_COMPONENTS.md](../interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md)
- 계약/실행 안내: [SERVER_SAMPLE_SINGLE_QUERY_API.md](../interfaces/SERVER_SAMPLE_SINGLE_QUERY_API.md)
- 계약/실행 안내: [SERVER_SAMPLE_BACKEND_RELAY_API.md](../interfaces/SERVER_SAMPLE_BACKEND_RELAY_API.md)

## 원본 TODO와 대체 관계

- [TODO14](../design/14_폐쇄망_반입_및_UI_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- TODO21: TODO20 §6 통합; DEMO QA 유지 (Git `e65f88c`).
- [TODO51](../design/51_DEMO_API_수동호출_팝업검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO54](../design/54_Demo_UI_UX_상세옵션_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO61](../design/61_관리자_미리보기_컴포넌트화_TODO.md): 69: 공통 폴더 이동; 두 미리보기 API 유지.
- [TODO64](../design/64_팝업데이터변환_함수분리_이식가이드_TODO.md): 69: 공통 폴더 이동; 변환 역할 유지.
- [TODO65](../design/65_단건조회_공통매핑_CLOB파싱_샘플API_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO69](../design/69_PopupcommonComponent_공통화_샘플페이지_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO70](../design/70_DB없는_백엔드통신_Java조회API_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

실제 백엔드·전체 서버 enabled 기동·실제 관리자 화면/폐쇄망 이식 검증은 각 샘플 인계 문서에 남긴다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-15 — 배포·실행 환경

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-15-01 | 배포 범위 | 자동 업데이트 TODO17은 폐기했다. 수동 EXE 교체와 기존 배포 스크립트를 사용한다. single-file은 배포 구성이고 업데이트 기능과 동일하지 않다. | 빌드 설정·외부 리소스는 오프라인 빌드 가이드 | WPF 배포 |
| POL-15-02 | 인증·버전 | 실제 통합 토큰 발급/검증은 담당 팀 범위다. WPF 헤더 확장 지점·MockSSO 프로토타입과 구분한다. 클라이언트 최소 버전 거절 426은 결과를 지우지 않고 진행을 멈추는 기준이다. | Authorization / X-Client-Version | 서버·WPF |
| POL-15-03 | 환경 확인 | WebView2·미디어·글꼴·DPI·Horizon·설치 의존성은 환경별 확인 대상이다. 저장소의 빌드 성공만으로 폐쇄망 동작을 보장하지 않는다. | 소스/로컬·원격 개발 DB·폐쇄망 검증 구분 | 각 담당 |

## 구현·계약 근거

- [Popup.csproj](../../popup-frameWork/Popup/Popup.csproj)
- [build-wpf-offline.ps1](../../scripts/build-wpf-offline.ps1)
- [export-offline-package.ps1](../../scripts/export-offline-package.ps1)

- 계약/실행 안내: [OFFLINE_WPF_BUILD.md](../../OFFLINE_WPF_BUILD.md)
- 계약/실행 안내: [README.md](../../popup-frameWork/README.md)
- 계약/실행 안내: [AGENTS.md](../../AGENTS.md)

## 원본 TODO와 대체 관계

- [TODO04](../design/04_인증설계.md): 원본 세부 요건·검증 이력 유지.
- [TODO10](../design/10_WPF_SSO_토큰_프로토타입_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO13](../design/13_WPF_클라이언트_버전_서버검증_계획.md): 원본 세부 요건·검증 이력 유지.
- [TODO14](../design/14_폐쇄망_반입_및_UI_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO17](../design/17_WPF_단일_EXE_자동업데이트_TODO.md): 자동 업데이트 폐기; 수동 교체 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO24](../design/24_VIDEO_저사양_PC_CPU_개선_TODO.md): 원본 세부 요건·검증 이력 유지.

## 검증 상태·미확정 범위

새 원격 DB 적용·토큰 발급·배포·업데이트를 문서 통폐합 작업에서 실행하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)

---

# POL-16 — 검증·정합성·품질

기준일: 2026-10-22 (KST). 현행 확정 내용과 보류 중인 현행 동작을 구분한 색인형 정책 문서다.
대조 기준: `9a8ec4eb8695e2be150e2de92da7338c34170d52`. API 필드의 상세 필수값·기본값·ENUM은 아래 계약 문서를 따른다.

## 정책 항목

| 정책 ID | 항목 | 기준·예외 | 입출력·기본값 | 담당 레이어 |
|---|---|---|---|---|
| POL-16-01 | 상태 구분 | 계획 구체화·코드 구현·자동 검증·실환경 검증·인계를 따로 기록한다. 체크박스 완료 수는 작업 진행 자료이며 구현/정책 확정의 단독 근거가 아니다. | 판정: 유지/후속 대체/부분 유지/폐기/미구현/충돌/판정 보류 | 문서·검증 |
| POL-16-02 | 재현 가능한 검증 | 로컬 전용 Popup.BehaviorTests/RecoveryTests의 과거 건수를 현재 재현했다고 주장하지 않는다. 추적된 scripts 검증과 서버 테스트를 사용하며 실행 환경/명령/skip를 적는다. | 문서·주석 변경은 링크/역추적/비주석 토큰 불변 검사 | 개발 |
| POL-16-03 | 문서 우선순위 | API 계약은 interfaces, 정책은 확정 결정+구현/계약 근거, TODO는 이력·잔여 작업, CHANGELOG는 당시 변경 기록이다. 충돌 시 단순 최신 번호 우선이나 코드 단독으로 확정하지 않는다. | 원본 경로 보존·다중 정책은 주/연관 참조 | 문서 관리 |

## 구현·계약 근거

- [Program.cs](../../scripts/RichTextTests/Program.cs)
- [Program.cs](../../scripts/PopupWindowTests/Program.cs)
- [verify-rich-text-49.cjs](../../scripts/verify-rich-text-49.cjs)
- [verify-popup-common-sample-69.cjs](../../scripts/verify-popup-common-sample-69.cjs)

- 계약/실행 안내: [AGENTS.md](../../AGENTS.md)
- 계약/실행 안내: [20261013_TRELLO_완료이력_현행구조_대조.md](../reviews/20261013_TRELLO_완료이력_현행구조_대조.md)

## 원본 TODO와 대체 관계

- [TODO01](../design/01_현행분석.md): 원본 세부 요건·검증 이력 유지.
- [TODO09](../design/09_전환계획_및_미결사항.md): 원본 세부 요건·검증 이력 유지.
- [TODO18](../design/18_팝업_구버전_분기_및_미사용_소스_정리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO39](../design/39_단건_API_복구_동시성_TEXT_정합성_보완_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO46](../design/46_API_WPF_관리자웹_계약통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO48](../design/48_TEXT_서버정책_CSharp_표시방어_분리_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO49](../design/49_TEXT_들여쓰기_우클릭팔레트_TODO.md): 62 서식 확장·63 5단계 해제·66 초기화 삭제.
- [TODO50](../design/50_구조정합성_전수점검_정리_TODO.md): 53-16에서 D3/D4 수정; D5는 미결.
- [TODO53](../design/53_프로젝트검증_후속구현_문서정합_통합검증_TODO.md): 원본 세부 요건·검증 이력 유지.
- [TODO67](../design/67_MUIdeprecated속성_미리보기호환검증_TODO.md): 69: 공통 폴더 이동; slotProps 전환 유지.
- TODO71: 본 정책 체계의 전수조사·색인·주석 정리.

## 검증 상태·미확정 범위

이번 TODO71은 정적 조사·문서/주석 정리다. Windows/브라우저/Oracle 실행과 바이너리 계약 산출물 재생성은 수행하지 않는다.

이번 작업은 소스·계약·DDL·변경 이력의 정적 대조다. 원본에 적힌 과거 테스트 수를 이번 실행 결과로 세지 않는다. 정책 미확정이나 실환경 미검증을 완료로 올리지 않는다.

[정책 색인](#정책-목차) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
