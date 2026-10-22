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

[정책 색인](README.md) · [충돌·보류 검토](../reviews/TODO71/CONFLICTS.md) · [활성 작업](ACTIVE_TASKS.md)
