# PopupCommonGuide 화면·콘텐츠 정리 구현 명세 TODO

기준: 2026-10-30 / 대상: zero-rule-web/main/src/features/PopupcommonComponent/guide/
상태: **현행 정적 분석 및 구현 명세 확정 / 구현·테스트 미착수**. 기존 변경사항과 충돌 없이 별도 작업한다.
숫자 TODO 번호는 임의 부여하지 않는다.

## 0. 목표·비목표
- 대상 독자: PopupcommonComponent를 다른 업무 화면에 가져다 쓰는 프론트 개발자.
- 원하는 경험: **시작하기 → 컴포넌트 선택 → 입출력 확인 → 독립 재사용 → 실제 데이터 변환 확인 → 변경 공지 확인**.
- 공통 모듈은 **UI·입력·미리보기·선택 필드 추출**을 제공한다. 특정 DB/API/3117/3111 저장 계약, 업무 기본값의 권위를 제공하지 않는다.
- proto(RgstPop)의 `createDefaultPopup / toSaveRequest / toSaveRequestPopup`는 별도 사용 예시. **이들을 독립 화면의 필수 사전 처리로 가르치지 않는다.**
- 서버 정책은 별도 F TODO와 서버 JSON 검증 TODO를 참조. 이 작업으로 서버/API/DB/공통 컴포넌트 동작을 변경하지 않는다.

## 1. 현행 확인 및 정합성 수정 목록 (P0)
현재 `PopupCommonGuide.tsx`는 7개 탭(공지/프로세스/컴포넌트/독립 재사용·필드 추출/예시/변환·유틸/실습)과 Tab 내부 렌더러를 겸한다. `guideData.ts`는 프로세스·컴포넌트·함수 메타데이터, `guideNotices.ts`는 공지, `GuideSavePartsTab.tsx`는 독립 추출 설명·실행기를 소유한다.
- [ ] **프로세스의 '신규 등록'**: `createDefaultPopup()`을 공통 필수 시작으로 표현한 내용을 '독립 입력 state(미설정 키 생략)'와 'proto 편집값 생성(createDefaultPopup)' 두 경로로 나누어 설명.
- [ ] **프로세스의 '저장'**: `toSaveRequest()`를 공통 저장 요청 생성으로 서술한 설명을 '공통 pickPopupFields(값 그대로) → 각 업무 화면의 저장 경계'로 변경. proto API 저장은 별도 흐름으로 이동.
- [ ] **프로세스의 미리보기**: `createDefaultPopup()`과 state 병합을 보편 사용법으로 설명하는 부분을 현재 `withPreviewFallback(state)` 사용 원칙으로 통일. 미리보기 전용이며 state/전송값은 변경하지 않음.
- [ ] **프로세스 '조회·수정'·'템플릿'·'유형 변경'**: proto 전용 `toEditorPopup`, `toEditorPopupFromTemplate`, `changePopupType` 처리와 독립 컴포넌트 사용 흐름을 눈에 띄게 구분. '부모 책임'도 해당 경로별로 재작성.
- [ ] `GuideSavePartsTab.tsx`의 **'proto 저장 기준 비교'** 예시는 이식 필요 시 참고사항으로만 유지. `pickPopupFields(toSaveRequestPopup(...))`를 다른 업무의 기본 사용법으로 안내하지 않음.
- [ ] WEB=표시·입력·미리보기, SERVER=업무 기본값·최종 검증·정규화·판정. 공통 UI의 검증은 즉시 안내이며 저장 성공 보증이 아님.
- [ ] 미설정/명시값 규칙: 키 생략(미설정), null(현행 서버 기본값 적용 대상), false/0/''(명시값, 빈 문자열 유효성은 필드별 판단). `undefined` 직렬화 시 생략됨. 미리보기 fallback이 기본값을 전송하지 않음.
- [ ] 코드의 현재 필드명과 타입·예제 정확성을 확인하여 오래된 안내 정리. 기능이 미지원이면 미지원이라고 표기하고 존재하지 않는 Props를 만들지 않는다.

## 2. 탭별 최종 역할 (P1)
화면은 **기존 7개 탭을 유지**하여 기존 사용자 동선을 깨지 않되, 설명 책임과 배치만 재정리한다. 첫 진입은 **시작하기** 탭, 공지에는 최근 건수 표기.
| 탭 | 주된 질문 | 다룰 내용 | 다른 탭에 반복하지 않을 내용 |
|---|---|---|---|
| 시작하기(신규) | 어디서 시작하고 어떻게 붙이나 | import, 최소 사용 코드, 공통/부모/서버 경계, 진입 링크 | 모든 Props와 전수 필드 표 |
| 프로세스 | 어떤 순서로 데이터가 흐르나 | 독립 입력 → 상태 → 출력 → 선택 추출 → 화면별 저장 경계, proto 대체 흐름 | Props 전수 목록 |
| 컴포넌트 | 어떤 값을 받거나 돌려주나 | 컴포넌트명·파일·필수/선택 Props·콜백·실행기·최소 예제 | 전체 저장 정책 |
| 독립 재사용·필드 추출 | 다른 화면에서 어떻게 조합하나 | 세 영역 선택, 원본값 보존, 예제 4종, 실행기 | 컴포넌트별 Props 중복 표는 간결하게 |
| 예시 | 기존 업무 화면에 어떻게 붙이나 | IS063M02Sample, 연결 단계·기존 화면과 달라진 값 | 구현 정책 전체 반복 |
| 변환·유틸 | 각 함수 입력/출력은 무엇인가 | **범용** / **proto 전용** 표시와 짧은 입출력 예 | 프로세스 설명 전체 |
| 실습 | 실제 입력에 따라 값이 어떻게 달라지나 | 독립 필드 추출 실습 우선, proto `toSaveRequest` 비교는 명시적 선택 | 특정 저장 방식의 범용화 |
| 공지 | 업데이트 때 내가 무엇을 바꿔야 하나 | 날짜·상태·영향 컴포넌트·사용자 조치·관련 상세 링크 | 컴포넌트 설명 전체 복제 |

기존 '공지' 탭은 뒤로 배치하되 **공지 배지·최근 변경 안내**로 발견성을 보존. 탭 변경 시 내부 입력 state/에디터 재마운트가 의도한 동작인지 검증.

## 3. 파일별 구현 설계 (P2)
- [ ] `PopupCommonGuide.tsx`: 탭 정의/배치, 선택 상태, 공지 배지만 남기는 **컨테이너**로 축소. 현재 파일 내 `ProcessTab`, `ComponentTab`, `FunctionTab`, `LiveTab`, `NoticeTab`를 탭 파일로 분리. 기존 `GuideSavePartsTab` 재사용.
- [ ] `guide/tabs/GuideStartTab.tsx` 신설: 가장 간단한 독립 입력 코드 예시, `withPreviewFallback`, `pickPopupFields`, WEB/SERVER 경계, 기존 proto 경로 설명.
- [ ] `guide/tabs/GuideProcessTab.tsx`: 독립 흐름을 먼저, proto 흐름은 별도 소절/토글로 구분. `guideData.ts` 프로세스 데이터도 `scope: 'COMMON' | 'PROTO'` 등 명시적 분류를 갖도록 정리.
- [ ] `guide/tabs/GuideComponentTab.tsx`: 기존 Props·콜백·실행기 내용 그대로 기능 이관; 선택 상태/실행기 초기화·sticky 영역 동작 유지.
- [ ] `guide/tabs/GuideFunctionTab.tsx`: `GuideFunction`에 범용/PROTO 범위 표시; 기존 `guideData.ts`의 각 함수 실제 책임 기준으로 분류.
- [ ] `guide/tabs/GuideLiveTab.tsx`: 현재 실습은 `toSaveRequest()` 중심이므로 'proto 저장 변환 실습'으로 표시하거나 독립 실습을 첫 모드로 배치. 기존 편집 상태·본문 입력·미리보기 및 초기화 기능 보존.
- [ ] `guide/tabs/GuideNoticeTab.tsx`: `guideNotices.ts`의 category/status/doneDate/action/affected components 유지, 공지 상세는 해당 함수/탭으로 이동하는 링크 제공.
- [ ] `guide/GuideUi.tsx` 등 공통 표시 컴포넌트 하나로 `Section`, `CodeBlock`, `InlineCode`, `FieldTable`, `Bullets` 공유. `GuideSavePartsTab.tsx` 내부의 동일 렌더러 중복 제거. 단 UI 구조 정리 중 값·이벤트 로직 변경 금지.
- [ ] `guideData.ts`: 프로세스, 컴포넌트, 함수 데이터는 현행 코드와 대조. `guideNotices.ts`는 변경 공지의 유일한 데이터 출처로 유지, 게시물 DB/API 만들지 않음.
- [ ] 탭 분리 후 상대 import 경로와 `index.ts` 공개 경계 확인. guide가 `PopupcommonComponent`의 공통 소스를 역참조/순환 import하지 않는지 점검.
- [ ] 파일의 코드·키 이름·시각적 설명은 실제 소스 기준. 새 항목을 추가할 때 가이드 등록 누락을 검사할 수 있는 정적 테스트 준비.

## 4. 개발 가이드 운영 규칙 (P3)
- [ ] 컴포넌트 신규 추가 시 `index.ts` public export → `guideData.COMPONENTS`의 Props·출력·예제 → 실행기 가능 여부 → `guideNotices.GUIDE_NOTICES` 신규 공지 순으로 함께 수정.
- [ ] Props 변경/제거 시 영향받는 화면·마이그레이션 방법을 공지 `action`에 기록. 미완료(PLANNED/IN_PROGRESS)와 완료(DONE)를 구분.
- [ ] 공지의 최근 14일 배지는 '최근 게시'를 뜻함. 완료·실행 여부를 자동 추측하지 않는다.
- [ ] 공통 정책(선택 필드 추출, WEB/SERVER 분리) 상세의 단일 근거는 해당 `docs/design` TODO와 `docs/policies`. 화면 설명은 요약+링크; 같은 계약을 여러 파일에 장문 복제하지 않는다.

## 5. 검증 체크리스트 (P0~P3 종료 기준)
- [ ] 공통 독립 예제에서 **AdminPopupDetail 전체 구성 없이** 일정/RichText/Questions를 단독 사용 가능.
- [ ] `withPreviewFallback`는 렌더 시에만 적용; 원본 state, `pickPopupFields` 결과, 외부 전송값 불변.
- [ ] `pickPopupFields` topLevel/content/questions 단독·조합, 누락, null/false/0/'', 문항 순서 유지.
- [ ] proto RgstPop의 `toSaveRequest`/ISO/URL/IMAGE/푸터/유형별 필터링 동작 변경 없음.
- [ ] 컴포넌트 실행기, 독립 추출 실행기, IS063M02 예시, Live 미리보기, 공지 필터·NEW 표시 정상.
- [ ] 탭 이동 전후 에디터 조합 입력·커서·포커스·초기화, 브라우저 너비 변경/스크롤, 오류 콘솔 0.
- [ ] 정적 검증: 문서 내 import/export·Props·함수명·분류가 실제 코드와 일치하는지 확인.
- [ ] typecheck, eslint, 관련 기존 scripts/verify-*.cjs, `pnpm build`, 브라우저 실화면 테스트. 결과를 CHANGELOG에 기록. 미실행 테스트는 완료 처리하지 않는다.

## 6. 구현 우선순위/완료 산출
1. P0: 잘못된/혼동을 유발하는 정책 설명 수정(가장 우선)
2. P1: 시작 탭 및 동선 재편, 중복 내용 축소
3. P2: 화면 파일을 탭/공통 표시로 분할(기존 이벤트 처리 보존)
4. P3: 공지·문서 관리 규칙 및 정적 검증 추가

완료 산출물: 가이드 8개 탭, 현재 공통 컴포넌트와 맞는 예제/실행기, 단일 출처 공지, 회귀 검증 기록.
관련 문서: `20261030_PopupcommonComponent_독립재사용_필드추출_TODO.md`, `20261030_PopupcommonComponent_WEB표시기본값_SERVER정책_책임분리_TODO.md`, `POPUP_FRONT_SAMPLE_HANDOVER.md`, `ADMIN_POPUP_EDITOR_TRANSFORM.md`.
