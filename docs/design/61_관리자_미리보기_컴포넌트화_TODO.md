# 61. 관리자 등록 화면 인라인·모달 미리보기 컴포넌트화 TODO

기준일: 2026-10-20 (KST)
상태: **구현 완료(61-1~61-11) · 실제 관리자 웹 로그인 화면 회귀 미실행**

## 목적

기존 팝업 등록 화면의 우측 인라인 미리보기와 ‘실제 크기로 보기’ 버튼으로 여는 모달을 다른 등록 화면에서도 사용할 수 있도록 분리한다.
기존 PopupPreview.tsx는 공통 렌더러로 재사용하고, PopupEditorDialog.tsx에 묶여 있는 미리보기 배치·크기 계산·모달 제어의 책임을 정리한다.

## 범위

| 구분 | 이번 범위 |
|---|---|
| 우측 인라인 미리보기 | 컨테이너·배치·크기 안내·확대 진입 UI를 독립 컴포넌트로 분리 |
| 버튼으로 여는 미리보기 | 모달의 열기·닫기·표시 위치·크기·배경 및 종료 UI를 독립 컴포넌트로 분리 |
| 팝업 내용 렌더링 | 기존 PopupPreview 및 SurveyPreview·AspectVideoArea 등 하위 컴포넌트 공유 |
| 부모 등록 화면 | 입력 폼·편집 원본 데이터·저장·상세 조회를 담당 |
| JSON 변환 | 제외. 저장 요청 정규화·직렬화·HTML↔Blocks 변환 모듈 분리는 수행하지 않음 |
| 서버·WPF | 이번 범위에서 코드·API 계약·DB 변경 없음 |

컴포넌트 이름은 아래 초안대로 확정했다(InlinePopupPreview.tsx·PopupPreviewDialog.tsx, 계산 함수 popupPreviewDialogLayout.ts).

## 컴포넌트 책임 초안

### InlinePopupPreview
- 편집 중인 팝업 객체를 props로 받는다.
- 우측 패널의 배치·미리보기 표시 및 현재 크기 안내를 담당한다.
- 필요 시 onOpenPreview 콜백으로 확대 모달 열기를 요청한다.
- 자체 저장 API나 등록 화면 조회 API를 호출하지 않는다.
- 팝업 콘텐츠 렌더링은 기존 PopupPreview로 위임한다.

### PopupPreviewDialog
- popup, open, onClose 등을 받아 실제 크기 미리보기를 표시한다.
- 창 크기 모드·작업 영역·표시 위치·배경 Overlay·닫기 UI를 처리한다.
- 뷰포트 변경·콘텐츠 권장 크기 변화에 따른 재계산을 처리한다.
- 입력 폼과 저장 API에 직접 의존하지 않는다.
- 모달을 닫아도 등록 중인 본문·설문 답안 설정 등 편집 원본을 변경하지 않는다.

### 공통 PopupPreview
- 헤더·콘텐츠·푸터 및 TEXT/IMAGE/VIDEO/SURVEY/QUIZ 유형별 표시를 공유한다.
- 인라인용과 모달용으로 렌더러를 복사하지 않는다.
- 모달 전용 배치·배경 처리와 콘텐츠 렌더러의 책임을 구분한다.

## 데이터·의존성 원칙

- 부모가 편집 원본의 단일 소유자이며 두 미리보기는 같은 최신 데이터를 받는다.
- 설문 선택·미리보기 시청 비율 등 시연 상태는 편집 원본과 분리한다.
- API나 등록 폼 없이 샘플 객체를 전달해 미리보기를 렌더링할 수 있어야 한다.
- onRecommendedSize 등 기존 계산 결과 콜백의 소유·초기화 시점을 정리한다.
- 크기·배치 계산 함수의 최소한의 추출은 UI 분리를 위한 범위에 포함한다. JSON 변환 재설계로 확대하지 않는다.
- 현행 AdminPopupDetail 공용 타입을 우선 사용하고 동일 타입을 새로 복제하지 않는다. API 전용 정보가 표시 컴포넌트에 불필요하게 결합되어 있으면 필요한 props 범위만 좁힌다.
- 다른 프로젝트 이식에 필요한 @local/domain 타입 정의·export, @ 별칭, MUI·아이콘, 공용 표시 모듈·로고·스타일 의존성을 목록으로 남긴다.
- normalizePopupLink 등 기존 보조 모듈은 현재 사용 관계를 문서화하며, URL 정책 변경이나 JSON 변환 모듈 분리를 이번 작업으로 수행하지 않는다.

## TODO

- [x] **61-1 현행 경계 조사**: PopupEditorDialog의 우측 패널, 실제 크기 버튼, previewOpen·fitWindow 상태, previewDialogSize·위치 정렬·Overlay 계산, PopupPreview 호출부를 구분한다.
  - 구현: PopupEditorDialog의 우측 패널 제목·버튼·PopupPreview(onRecommendedSize=setFitWindow), previewOpen 상태, fitWindow를 쓰는 IMAGE 크기 안내와 previewDialogSize, PREVIEW_POSITION_ALIGN·가장자리 여백·Overlay 값, 모달 Dialog·종료 버튼을 경계로 구분.
- [x] **61-2 입력·콜백 계약**: popup·열림 상태·종료·확대 요청·권장 크기 전달의 최소 props와 책임을 정의한다. 데이터 복사·API 호출을 불필요하게 요구하지 않는다.
  - 구현: 인라인 `popup`·`onOpenPreview?`·`onRecommendedSize?`·`title?`, 모달 `popup`·`open`·`onClose`·`recommendedSize?`로 확정. 열림 상태와 권장 크기 보관은 부모 소유, 두 컴포넌트는 popup을 복사·변경하지 않는다.
- [x] **61-3 인라인 분리**: 우측 미리보기 컨테이너와 관련 UI를 독립 컴포넌트로 옮기고 등록 화면에 다시 연결한다.
  - 구현: InlinePopupPreview.tsx 추가, 편집기 우측 패널을 교체.
- [x] **61-4 모달 분리**: 실제 크기 미리보기 Dialog와 배경·위치·크기·종료 UI를 독립 컴포넌트로 옮긴다.
  - 구현: PopupPreviewDialog.tsx 추가. 크기·위치·여백·Overlay 계산은 popupPreviewDialogLayout.ts 순수 함수로 이동(계산식 동일). 모달은 자체 PopupPreview의 권장 크기를 받아 단독 사용 가능하고, 브라우저 창 resize에서 다시 계산한다(기존에는 다른 렌더 때만 반영).
- [x] **61-5 렌더러 공유**: 두 표시 방식이 같은 PopupPreview를 사용하고 유형별 UI·판정 로직이 중복되지 않도록 한다.
  - 구현: 두 컴포넌트 모두 기존 PopupPreview를 그대로 사용. 유형별 UI·채점·잠금 로직 복제 없음, PopupPreview 변경 없음.
- [x] **61-6 상태 생명주기**: 모달 열기·닫기·재열기, 팝업 변경·유형 변경·템플릿 불러오기에서 이전 미리보기 상태·원본 크기가 섞이지 않도록 초기화 기준을 정의한다. 두 미리보기가 동시에 존재할 때 이벤트·미디어 리소스도 확인한다.
  - 구현: 모달 내용은 닫히면 언마운트되어 재열기 시 시연 상태 초기화, 닫을 때 모달이 측정한 권장 크기도 초기화. 편집기를 다시 열면 previewOpen을 닫힘으로 초기화. 유형 변경·템플릿 적용 시 권장 크기는 PopupPreview가 다시 보고(null 포함). 동시 표시 시 AspectVideoArea가 각각 메타데이터만 읽고(음소거·자동 재생 없음) 모달 종료 시 모달 쪽만 정리됨을 확인.
- [x] **61-7 기존 표시 보존**: FIXED/RATIO/FULLSCREEN, IMAGE ADAPTIVE/FIT_TO_IMAGE/ORIGINAL, 원본 비율, 헤더·푸터·설명 표시, 위치·Overlay·폰트 서식·기울임·들여쓰기·긴 콘텐츠 스크롤을 확인한다.
  - 구현: FIXED·RATIO·FULLSCREEN, 9개 위치 중 CENTER·TOP_LEFT·BOTTOM_RIGHT, 일반 24px·영상 0px 여백, Overlay ON/OFF, IMAGE FIT_TO_IMAGE 크기를 새 하네스로 확인. 렌더러 표시(IMAGE 모드·서식·스크롤 등)는 PopupPreview 미변경이며 기존 하네스로 회귀 확인.
- [x] **61-8 설문·영상 보존**: 설문 선택·필수 안내·퀴즈 제출 시연·VIDEO+QUIZ 원본 비율 할당과 시청 기준 시연이 양쪽에서 유지되는지 확인한다. 관리자 미리보기와 실제 WPF의 차이를 기존 문서와 맞춘다.
  - 구현: 설문 선택이 모달에만 반영되고 재열기 시 초기화, VIDEO+QUIZ 시청 잠금 안내 유지 확인. 퀴즈 채점·VIDEO+QUIZ 비율 할당은 기존 verify-completion-ux-43 회귀로 확인. WPF와의 차이 문서(POPUP_PREVIEW_WPF_PARITY.md)는 컴포넌트 이름만 갱신.
- [x] **61-9 연결·이식 검증**: 신규 등록·수정·템플릿 적용에서 최신 입력이 양쪽에 반영되고, 미리보기 조작이 저장 데이터에 섞이지 않는지 확인한다. 등록 모달 밖의 최소 호스트에서도 샘플 props로 표시할 수 있는 예시를 만든다.
  - 구현: scripts/verify-popup-preview-61(.cjs·-entry.tsx)에 등록 화면 없는 최소 호스트를 두고 동결한 샘플 popup으로 표시·조작 후 객체 불변 확인. 실제 등록 화면의 신규·수정·템플릿 적용 흐름은 브라우저 실화면 미실행.
- [x] **61-10 의존성·인계**: 필요한 파일·타입 export·별칭·패키지·리소스와 최소 사용 예시를 문서화한다. 폐쇄망 반입 시 RgstPop 폴더만 복사하면 부족할 수 있음을 명시한다.
  - 구현: docs/interfaces/ADMIN_POPUP_PREVIEW_COMPONENTS.md에 props·사용 예시·상태 규칙·이식 의존성(같은 폴더 12개 파일, @local/domain 타입 export 경로, @/ 별칭, routerUrlOf, 로고 리소스, MUI·아이콘 패키지) 기록. RgstPop 일부 복사만으로 부족함을 명시.
- [x] **61-11 검증 기록**: 변경 파일 타입 검사와 필요한 화면 회귀를 수행하고, 실제 브라우저 검증·미실행 항목을 구분한다. 이번 TODO 작성 시점에는 구현·실행 검증을 완료로 표기하지 않는다.
  - 구현: 아래 검증 기록 참조.

## 완료 기준

- 등록 화면 외부에서도 전달한 팝업 객체로 인라인·모달 미리보기를 사용할 수 있다.
- 부모 등록 폼의 내부 state·상세 조회·저장 API를 가져오지 않아도 된다.
- 공통 렌더러를 복제하지 않고 기존 기능과 표시를 유지한다.
- 모달 종료 후 편집 데이터가 유지되며 샘플 시연 값이 저장 요청으로 유입되지 않는다.
- JSON 변환 로직 분리는 후속 검토로 남기며 본 TODO 완료 조건에 포함하지 않는다.

## 주요 확인 파일

- zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx
- zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx
- zero-rule-web/main/src/features/RgstPop/SurveyPreview.tsx
- zero-rule-web/main/src/features/RgstPop/AspectVideoArea.tsx
- zero-rule-web/main/src/features/RgstPop/imagePreviewLayout.ts
- zero-rule-web/sub/domain/src/model/PopupAdmin.ts 및 타입 export 진입점
- docs/reviews/POPUP_PREVIEW_WPF_PARITY.md

## 검증 기록 (2026-10-20)

- 웹 `tsc --noEmit` 오류 0, 변경 파일 eslint 오류 0.
- 신규 `node scripts/verify-popup-preview-61.cjs` 42건 통과(headless Edge, 최소 호스트).
- 기존 하네스: verify-image-preview 34건, verify-completion-ux-43 60건, verify-survey-rich-text-55 23건, verify-question-template-picker 7건 통과. verify-rich-text-49는 처음 두 번 'Mixed bold selection is shown as mixed'(서식 메뉴 선택 상태, 미리보기 분리와 무관)에서 실패하고 세 번째 실행에서 40건 통과.
- 미실행: 실제 관리자 웹 로그인 화면에서 신규·수정·템플릿 적용 후 미리보기 확인, 다른 등록 화면에 실제 이식.
