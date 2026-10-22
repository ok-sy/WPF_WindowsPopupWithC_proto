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

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
