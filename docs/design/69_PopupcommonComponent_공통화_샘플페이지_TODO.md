# TODO69 — PopupcommonComponent 공통화 및 샘플 페이지 2종

- 작성일: 2026-10-22 (KST)
- 상태: 구현 완료(69-1~69-10) / next build·실제 관리자 화면·폐쇄망 확인 대기
- 관련: TODO61 미리보기 분리, TODO64 변환 모듈·이식 가이드, TODO66 초기화 버튼, TODO67 MUI 호환, TODO68 최소 크기

## 확정 요건

기존 팝업 공통 컴포넌트를 PopupcommonComponent 폴더로 모으고, 그 내부 sample 폴더에 기존 목록 기반 샘플과 복원한 IS063M02에 공통 기능을 추가한 샘플을 각각 둔다. 두 페이지에서 에디터·우측 인라인 미리보기·버튼으로 여는 모달 미리보기를 같은 공통 컴포넌트로 재사용한다.

IS063M02의 기준 입력은 사진 15장 및 추가 IMG_1445.jpeg 대조를 반영한 복원본 IS063M02.tsx다. 첫 O/X 영역은 설명만 주석이고 JSX는 표시되는 정정본을 사용한다. 원본 퍼블리싱 구조를 기준으로 기능을 연결하며 사진에 없던 업무 정책을 새로 확정하지 않는다.

## 목표 구조

구현 시 경로는 zero-rule-web/main/src/features/PopupcommonComponent/를 기준으로 한다. 폴더명은 요청한 대소문자 그대로 PopupcommonComponent, 내부 샘플 폴더는 sample로 통일한다.

- PopupcommonComponent/: 에디터·우클릭 패널·RichText 표시·우측 미리보기·모달·공용 렌더러 및 필요한 변환/계산 유틸.
- PopupcommonComponent/sample/: 기존 목록 기반 샘플 페이지와 IS063M02 연동 샘플 페이지의 엔트리 2종. 샘플 데이터·목록 전용 다이얼로그/폼 등 샘플에만 필요한 파일도 이 아래에 정리할 수 있다.
- 실제 Next/scene router 진입부: 샘플 엔트리를 연결하는 얇은 라우트. sample 폴더 안 TSX 파일만으로 URL이 자동 생성된다고 설명하지 않는다.

기존 목록은 현재 RgstPop/RgstPop.tsx를 기준으로 한다. 샘플 이름 예시는 PopupListSample.tsx 및 IS063M02Sample.tsx이며 최종 이름·경로는 구현 시 호출 관계를 확인해 문서에 확정한다.

## 구현 TODO

- [x] 69-1. 현재 에디터·미리보기·목록·변환 모듈의 import/export 및 라우트를 조사하고 공통/샘플 전용 책임을 구분한다. TODO64의 기존 popupEditorTransform.ts 구현을 재사용하며 같은 변환을 다시 만들지 않는다.
- [x] 69-2. PopupRichTextEditor, PopupRichTextMenu, PopupRichBlocks, InlinePopupPreview, PopupPreviewDialog, PopupPreview 및 SurveyPreview/AspectVideoArea 등 직접 의존 컴포넌트를 공통 폴더로 정리한다. popupRichText, popupRichTextFormat, popupEditorTransform, popupPreviewDialogLayout, imagePreviewLayout, popupCommon, normalizePopupLink 등 필요한 유틸도 함께 검토한다. 질문 편집기 등 실제 재사용되는 파일은 같은 원칙으로 배치한다.
- [x] 69-3. 경로 변경 후 전체 호출부·타입 export·검증 호스트·가이드의 경로를 갱신한다. 공통 폴더가 sample 또는 기존 등록 부모를 역참조하지 않도록 한다. 임시 re-export가 필요하면 한 구현을 가리키도록 하고 복제본을 따로 유지하지 않는다.
- [x] 69-4. 기존 목록 기반 샘플 페이지를 구성한다. 현재 목록→신규/수정→편집기·두 미리보기 사용 흐름을 예제로 제공한다. 실제 관리자 API 연결과 샘플 데이터 공급 경계를 분리하고 서버 없이 확인 가능한 기본 샘플 데이터·페이지 진입 방법을 제공한다. 로컬 저장이면 실제 DB 저장과 구분해 표시한다.
- [x] 69-5. 복원 IS063M02의 레이아웃/클래스를 기준으로 연동 샘플 페이지를 구성한다. 기존 BbsCKEditor 위치에 공통 PopupRichTextEditor를 연결하고 우측 영역에 InlinePopupPreview, 미리보기 버튼에 PopupPreviewDialog를 연결한다. 퍼블리싱 원본은 대조 가능하도록 보존하고 공통 기능 추가 버전을 별도 샘플 엔트리로 제공한다.
- [x] 69-6. IS063M02 부모 state와 변환 입출력을 연결한다. 유형·제목·창 크기·나중에 보기·푸터/URL·본문·문항/선택지를 편집값으로 관리하고 동일한 최신 popup을 두 미리보기에 전달한다. 모든 에디터가 하나의 inputData를 쓰던 원본 구조와 문항 라디오 선택 state 공유를 각 필드/문항별로 분리한다.
- [x] 69-7. 신규/불러오기/유형 변경 시 초기값·editor key 정책, 숫자 Select 값과 문자열 비교 불일치, FormControlLabel 단독 label 타입 및 미연결 추가/삭제 버튼 등 사진 전사본의 연결 이슈를 정리한다. 저장은 기존 변환 함수를 이용해 요청 객체를 확인할 수 있게 하고 서버 저장이 없으면 성공으로 위장하지 않는다.
- [x] 69-8. 타입(AdminPopupDetail 등)과 HTTP 클라이언트(PopupAdminApi) 역할을 구분해 안내한다. 공통 UI를 단독 사용하기 위해 관리자 서버·목록·인증 API가 강제로 필요하지 않게 한다. 타입/패키지 별칭·MUI·Emotion·CKEditor·로고/URL 유틸·n* 클래스/테마·글꼴 등록 등 이식 의존성을 명시한다.
- [x] 69-9. 샘플별 URL/라우트와 화면 간 진입을 연결한다. 기존 등록/목록의 정상 경로를 무단 대체하지 않고 이동한 구현을 가리키도록 정리한다. 각 컴포넌트를 별도 화면에서 단독 사용하는 최소 예제와 두 페이지의 데이터 흐름·가져갈 파일 목록·실행 방법을 가이드에 제공한다.
- [x] 69-10. TODO66/67/68 적용 상태를 확인하고 샘플에 반영한다. 아직 미구현인 요구를 공통화만으로 완료로 표시하지 않는다. 실제 최소 크기 기준·서식/색 초기화 제거·MUI 슬롯 변경은 해당 TODO 구현을 공유한다.

## 검증 기준

- [x] 기존 목록 기반 샘플과 IS063M02 연동 샘플에 각각 진입할 수 있으며 두 화면 모두 동일 공통 모듈을 사용한다.
- [x] 에디터만/우측 미리보기만/모달 미리보기만 별도 부모에서 사용하는 경우에 등록 부모·API 호출이 필수로 따라오지 않는다.
- [x] 편집→우측 표시→모달 표시→저장 요청 객체의 본문·공통 옵션이 일치한다. 미리보기 시연 응답·영상 상태가 저장값에 섞이지 않는다.
- [x] 문항별 입력과 선택이 독립적이고 신규/불러오기/유형 전환에서 이전 문서/옵션이 섞이거나 입력 중 커서가 초기화되지 않는다.
- [x] TEXT/IMAGE/VIDEO/SURVEY/QUIZ 및 VIDEO+QUIZ 구성의 대표 샘플로 기존 표시와 상호작용을 확인한다.
- [x] 공통 경로 이동 후 타입 검사·빌드·관련 기존 검증을 수행하고 대소문자 경로 문제·끊긴 import·순환 참조를 확인한다.
- [ ] 폐쇄망의 글로벌 CSS/폰트·MUI 버전·로고 경로를 실제 확인한 결과와 미실행 범위를 구분해 인계한다.

## 구현 결과 (2026-10-22)

- 69-1: RgstPop 18개 공통 후보와 API 의존 4개(RgstPop·PopupEditorDialog·PopupTemplateDialog·PopupQuestionTemplatePicker)를 import 기준으로 구분. TODO64 popupEditorTransform 재사용(새 변환 없음).
- 69-2·3: 에디터·우클릭 패널·RichText 표시·인라인/모달 미리보기·공용 렌더러·SurveyPreview·AspectVideoArea·문항/일정 편집기와 변환·계산 유틸을 `features/PopupcommonComponent/`로 `git mv`. RgstPop·검증 호스트 8종·transform 스크립트·이식 가이드 경로 갱신, `index.ts` 진입점 추가. 공통 폴더는 RgstPop·sample·`@/provider`를 참조하지 않음(검색 확인), 복제본·re-export 없음.
- 69-4: `sample/PopupListSample.tsx`(목록 6종 → 신규/수정 → `PopupSampleEditor` → 우측·모달 미리보기 → `toSaveRequest` 요청 객체 표시, 메모리 목록만 갱신·서버 미전송 표시), `sample/popupSampleData.ts`.
- 69-8·9: 타입(`@local/domain`)과 HTTP 클라이언트(`api.popupAdmin`) 역할, 이식 의존성, 단독 사용 최소 예, 데이터 흐름·실서버 교체 지점을 `docs/interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md` §5에 정리. 라우트 `/popup-common-sample` 추가(기존 `/rgst-pop` 유지, 메뉴 DB 등록은 범위 밖).
- 69-10: TODO66·67·68 구현이 같은 공통 파일이라 샘플에도 적용됨을 확인. 샘플 편집 Dialog도 `slotProps`(paper·htmlInput) 사용.
- 69-5~7(2차): 수령한 복원본 `sample/IS063M02.tsx`를 대조용 원본으로 보존(첫 줄 `// @ts-nocheck`만 추가 — 저장소에 없는 `IS035Info`·폐쇄망 `n*` CSS 의존). `sample/IS063M02Sample.tsx`에 원본 레이아웃·클래스를 유지하고 BbsCKEditor 자리에 공통 에디터, 우측에 인라인 미리보기, 버튼에 모달 미리보기, 문항 영역에 공통 문항 편집기, 저장에 `toSaveRequest`를 연결. 공유 `inputData`·공유 라디오 state·숫자/문자열 Select 불일치·단독 label·미연결 버튼·최소 200 표기를 정리. '컨텐츠 명'(저장 계약 필드 없음)·'퀴즈유형' 점수 환산은 정책 미확정으로 두고 확인 필요로 표시. 라우트 `/popup-common-sample/is063m02`.

## 검증 결과

- 웹: `tsc --noEmit` 오류 0, 변경 범위 eslint 오류 0(기존 경고 2). 신규 `verify-popup-common-sample-69` 25건 통과(목록 샘플 15·IS063M02 샘플 10). 경로 이동 후 기존 `verify-rich-text-49` 60·`verify-survey-rich-text-55` 23·`verify-popup-preview-61` 52·`verify-image-preview` 34·`verify-popup-transform-64` 77·`verify-completion-ux-43` 65·`verify-question-template-picker` 7건 통과.
- 미실행(검증대기): `next build`, 실제 관리자 웹 로그인 화면에서 `/rgst-pop`·`/popup-common-sample` 진입, 폐쇄망 글로벌 CSS(`n*` 클래스)/폰트·MUI 버전·로고 경로 확인, 원본 대비 IS063M02 시각 대조.
