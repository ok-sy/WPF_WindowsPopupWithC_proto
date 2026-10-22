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

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
