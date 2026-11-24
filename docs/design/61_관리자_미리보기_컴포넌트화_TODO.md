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


## 추가 TODO — IMAGE 실제 크기 미리보기 모서리/그림자 충돌 (2026-11-06)

상태: **로컬 재현·수정 완료(61-13·14) / 폐쇄망 CSS 원본 추적·실화면 확인 대기(61-12·15·16 일부)**

### 재현 조건과 범위

- 폐쇄망 관리자 웹에서 **팝업 타입 IMAGE**, **실제 크기로 보기** 모달을 열었을 때 모서리 둥글기(`border-radius`)가 기대값과 다르게 **0으로 강제 적용**되고, 그림자가 **이중으로 보이는** 현상을 확인.
- TEXT/VIDEO/SURVEY/QUIZ 등 다른 타입에서 동일 현상은 현재 관찰되지 않음. IMAGE 한정 분기와 전역 CSS 간 충돌을 우선 조사하며 원인을 IMAGE 자체로 단정하지 않는다.
- 관련 사진의 **깨진 이미지 표시는 잘못된 테스트 파일 경로로 발생한 별도 상황**이며 이번 수정 범위에서 **제외**. 이미지 URL·업로드·리소스 경로를 이 결함의 원인으로 연결하지 않는다.

### 현행 코드 기반 점검 지점

| 위치 | 현행 설정/단서 | 확인 사항 |
| --- | --- | --- |
| `PopupcommonComponent/PopupPreviewDialog.tsx` | 모달 `Dialog`의 `slotProps.paper.sx`에 `borderRadius: '6px'`, `bgcolor: 'transparent'`, `overflow: 'hidden'` | 해당 스타일이 폐쇄망에서 실제 적용되는지, 다른 선택자의 `border-radius: 0`에 덮이는지 확인 |
| `PopupcommonComponent/PopupPreview.tsx` | 외부 렌더러 Box 및 내부 `Paper`에 FULLSCREEN이 아니면 `borderRadius: '6px'`; `Paper elevation={isSurvey ? 0 : 8}` | IMAGE에서 내부 Paper 그림자(elevation 8)가 적용되며 모달 Dialog Paper의 기본 그림자와 겹치는지 확인 |
| 폐쇄망 DevTools Styles | `.MuiDialog-root .MuiPaper-root` 계열 규칙에서 `border-radius: 0` 표시됨 | **선택자 선언 원본 CSS/스타일 주입 위치**, 우선순위·로드 순서 및 어떤 DOM Paper에 매칭되는지 확인. GitHub 소스에서 해당 정확한 선언 위치는 미확인 |
| MUI Dialog 구조 | 바깥 Dialog Paper 내부에 미리보기용 Paper 중첩 | Paper 각각의 `box-shadow` 계산값 및 실제 그림자 소유자 추적; 사진의 `--Paper-shadow` CSS 변수와 `box-shadow`가 적용된 노드 확인 |

### 구현 전·후속 검증 TODO

- [ ] **61-12 원인 CSS 추적** (폐쇄망 확인 필요): IMAGE 실제 크기 모달의 Dialog Paper와 PopupPreview Paper를 각각 DevTools로 선택하여 `border-radius` Computed 값·적용/취소된 Style·선택자 출처(파일/행)·상속이 아닌 우선순위를 기록한다. `MuiDialog-root` 하위 Paper 전체를 대상으로 하는 폐쇄망 스타일인지 확인.
- [x] **61-13 radius 복원**: 원인 규칙의 적용 범위를 정리하여 IMAGE 일반 창의 **6px 모서리**를 유지하고 FULLSCREEN의 0px 동작은 유지한다. 무조건적인 `!important` 덮어쓰기는 우선 해결책으로 사용하지 않는다.
- [x] **61-14 그림자 소유자 단일화**: 외부 Dialog Paper와 내부 PopupPreview Paper 각각의 `box-shadow` 및 `--Paper-shadow` 값을 확인한다. IMAGE 실제 크기 미리보기에서 시각적 그림자가 한 번만 적용되도록 책임을 한 계층으로 정리하되, 기본 Dialog/인라인 다른 타입의 그림자 정책을 임의 변경하지 않는다.
- [ ] **61-15 IMAGE 조건별 검증** (radius·shadow·24px 여백은 하네스 확인, 폐쇄망 화면 대기): IMAGE의 ADAPTIVE/FIT_TO_IMAGE/ORIGINAL, FIXED/RATIO/FULLSCREEN 및 인라인/실제 크기 미리보기를 비교해 radius·shadow·이미지 표시 영역·푸터·스크롤·크기 계산의 변화를 검증한다.
- [ ] **61-16 회귀·환경 비교** (로컬 TEXT/VIDEO/SURVEY/QUIZ·샘플 하네스 회귀 확인, 폐쇄망 비교 대기): 동일 HTML/CSS 노드를 로컬과 폐쇄망 브라우저에서 비교하고, 프로젝트 MUI 및 전역 CSS 로드 순서 차이를 기록한다. TEXT/VIDEO/SURVEY/QUIZ와 기존 등록·샘플 화면도 회귀 확인한다. 변경 시 관련 웹 타입 검사·미리보기 검증을 별도로 수행한다.

**변경 제한(정의 시점):** TODO 정의 커밋은 정의서만 갱신했다. 수정 범위는 아래 구현 결과와 같다.

### 재현·구현 결과 (2026-11-06)

- 재현: 저장소에 없는 폐쇄망 규칙을 `.MuiDialog-root .MuiPaper-root { border-radius: 0 }`으로 가정해 headless Edge에 주입. 다른 유형은 계산값이 0이어도 내부 Paper가 틀을 채워 6px 틀(`overflow: hidden`)에 잘려 둥글게 보이고, IMAGE는 틀 패딩 24px로 안쪽에 있어 직각이 드러난다. 그림자 이중 표시는 규칙이 없어도 재현되어 저장소 코드 문제로 확인했다.
- 24px 패딩은 WPF `PopupOuterGrid Margin="24"`(그림자 여백)에 대응하므로 유지한다.
- 수정: IMAGE 일반 창의 Dialog Paper `boxShadow: none`, 내부 Paper 둥글기 `'&&&'`(우선순위 0,3,0)로 지정. `!important`와 폐쇄망 CSS 변경 없음. Dialog Paper 자체의 계산값은 규칙이 있으면 0으로 남지만 IMAGE는 투명·그림자 없음이라 보이지 않는다. 다른 유형의 Dialog 그림자는 유지한다.
- 미확인: 폐쇄망 규칙 원본·전체 내용, 폐쇄망 실화면, 로컬 관리자 웹 실화면.

## 추가 TODO — VIDEO 및 전체 유형 미리보기 레이아웃 회귀 검증 (2026-11-16)

- [x] (코드 대조·수정 완료, 캡처 비교 대기) **61-17 실제 크기 미리보기 Dialog와 WPF 팝업 대조.** 관리자 화면에서 VIDEO 미리보기의 레이아웃이 실제 팝업과 다르다는 피드백이 있었다. 차이가 발생한 영역, 화면 크기·배율 및 원인은 재현 후 기록한다.

### 구현 시 확인할 사항

- 관리자 웹의 `PopupPreviewDialog.tsx`, `popupPreviewDialogLayout.ts`, `PopupPreview.tsx`와 WPF의 `PopupWindow.xaml(.cs)`, VIDEO 콘텐츠 뷰의 크기·여백 계산을 대조한다. 기존 [미리보기·WPF 대조 기록](../reviews/POPUP_PREVIEW_WPF_PARITY.md)을 비교 기준으로 사용한다.
- 동일 설정·콘텐츠를 실제 크기 미리보기와 WPF에 적용하고 화면 캡처를 나란히 비교한다. 뷰포트, 브라우저 확대율, Windows 해상도·DPI, 팝업 크기 모드를 기록하고, 바깥쪽 Dialog 여백과 팝업 자체의 레이아웃 차이를 구분한다.
- VIDEO를 먼저 확인한다. 가로·세로 원본 비율, 영상 영역 높이와 잘림, 제목·설명 및 헤더·푸터 배치, 패딩과 스크롤을 비교한다. 미리보기가 시청 기준 충족 상태를 표시하는 기존 정책을 고려한다.
- TEXT, IMAGE(지원 크기 모드 및 채움 표시), SURVEY, QUIZ, VIDEO+QUIZ도 비교한다. 공통 헤더·본문·푸터, 모서리·그림자·Overlay, 긴 콘텐츠 스크롤을 점검하고, VIDEO+QUIZ는 영상 영역과 문항 배분을 추가 확인한다.
- 완료 기준은 유형별 캡처와 차이 기록을 남기고, 문서상 허용된 차이와 수정 대상 차이를 구분하는 것이다. 수정 대상은 같은 조건에서 다시 비교하고 다른 유형과 인라인 미리보기에 회귀가 없는지 확인한다. 현재는 피드백 기록 및 검증 계획 단계다.

### 구현 전에 결정할 사항

현재 미결 정책은 없다. 비교 결과 기존 사양에서 허용 여부를 정하지 않은 레이아웃 차이가 확인되면 해당 차이만 별도로 판단한다.

### 61-17 결과 (2026-11-16)

- 방법: 웹 `PopupPreview.tsx`·`PopupPreviewDialog.tsx`·`popupPreviewDialogLayout.ts`·`AspectVideoArea.tsx`와 WPF `PopupWindow.xaml(.cs)`·`PopupStyles.xaml`·`VideoPopupView.xaml`·`VideoQuizPopupView.cs`·`AspectSizing.cs`를 코드로 대조했다. 화면 캡처 비교는 아직 하지 않았다.
- 가장 유력한 피드백 원인: 단독 VIDEO 영상 영역이 남은 높이를 채우지 못하고 `minHeight: 170`에 머물렀다(상위 래퍼에 높이가 IMAGE만 있어 `height: 100%`가 auto로 계산). WPF는 `VideoRow Height="*"`로 창을 채운다. 760 높이 창에서 WPF 약 370 대 웹 170.
- 결정: 미기록 차이 전체를 수정하기로 했다(공통 Header·Footer 포함).
- 수정
  - VIDEO: 본문을 세로 flex로 두고 영상 영역이 남은 높이를 채움. 순서를 제목 → 영상 → 컨트롤 모형 → 설명으로 변경(설명은 영상 아래 14px `#4B5563`). 웹 전용 "완료 기준·기본 음량" 안내 삭제. 영상 영역 검정 배경·1px `#D1D5DB` 테두리·모서리 8. 콘텐츠 제목 22/600·아래 여백 15.
  - 동영상+퀴즈: 같은 순서·영상 영역 스타일. 높이 식을 WPF `AspectSizing`과 같이 테두리 포함 `(폭 − 2) × 세로/가로 + 2`로 바꾸고 폭은 테두리를 포함한 바깥 폭으로 측정.
  - 공통: Header 제목 기본 17/600, 본문 여백 28/24, Footer 높이 80(IMAGE 외 최소 높이)·여백 28/8/28/16·구분선 제거·확인 버튼 118×44.
- 허용 차이로 남긴 것: 컨트롤바 텍스트 모형, 실제 재생 안 함, 동영상+퀴즈 제목 생략 방식, 글꼴·DPI(PARITY 문서 기존 항목). 영향 낮은 미기록 차이(모달 상한 0.96, RATIO 보정, 동영상+퀴즈 상한의 패딩 포함)는 PARITY 문서에 기록하고 미수정.
- 검증: `tsc --noEmit` 통과, 변경 파일 eslint 경고·오류 없음. 하네스 `TODO61 preview` 126건(61-17 4건 추가: 영상 영역 채움·설명 위치, 영상·설명 스타일·안내 삭제, 제목·헤더·본문 여백, 푸터 80·버튼 44·구분선 없음), `completion UX 43` 76건(동영상+퀴즈 높이 식 기대값을 테두리 포함으로 갱신), `TODO69 sample` 62건(삭제한 완료 기준 안내 대신 영상 영역 표시 확인), `IMAGE preview` 54건, `survey rich text 55` 67건, `guide render` 31건, `guide registry` 296건, `rich text 49` 75건, `RgstPop quiz rule` 25건, `TODO64 transform` 78건, `quiz option byte 73` 44건, `question template picker` 7건, `pickPopupFields` 34건 통과.
- 보완(2026-11-16): 단독 VIDEO 미리보기에도 실제 영상을 넣었다. `AspectVideoArea.tsx`의 `FillVideoArea`가 남은 높이를 채운 검정 영역 안에 음소거·메타데이터만 읽은 video를 contain으로 그린다(WPF `Stretch=Uniform`). 재생하지 않으며 영역 높이를 영상 비율로 계산하지 않는다(WPF 단독 VIDEO도 `EnableAspectSizing` 미사용). 주소 없음·읽기 실패는 재생 아이콘과 안내 문구. 영상 레터박스 배경은 WPF와 같은 검정으로 통일(동영상+퀴즈 포함). 하네스 `completion UX 43` 78건(신규 2건: Demo 영상 contain·음소거·정지, 읽기 실패 안내). 1회 실행에서 동영상+퀴즈 메타데이터 검사가 대기 시간 안에 응답을 받지 못해 실패했고 이후 2회 연속 통과(이번 변경과 무관한 경로).
- 미실행: 관리자 웹 실화면과 WPF 캡처 나란히 비교(유형별), TEXT·IMAGE·SURVEY·QUIZ 공통 헤더·푸터 변경의 실화면 확인.

### 61-18 나중에 보기 버튼 크기 정렬과 푸터 회귀 검증

- 상태: 구현·자동 검증 완료(2026-11-18), 폐쇄망 실화면 확인 대기.
- 이슈: 폐쇄망 VIDEO 실제 크기 미리보기에서 ‘나중에 보기’가 브라우저 검사 기준 93.45 × 32px로 표시돼 ‘확인’보다 작다. Git main `1ee96e5`의 `PopupPreview.tsx`는 일반·설문 푸터에서 ‘나중에 보기’를 크기 지정 없는 MUI 텍스트 버튼으로 그린다. 일반 푸터의 ‘확인’은 최소 너비 118px, 높이 44px을 지정한다.
- WPF 기준: `PopupWindow.xaml`의 `FooterLaterButton`은 `PopupStyles.xaml`의 `SecondaryActionButtonStyle`을 적용한다. 이 스타일은 `ActionButtonStyle`의 최소 너비 118 DIP와 높이 44 DIP를 상속하고 밝은 배경과 테두리로 보조 버튼을 구분한다.
- [x] 관리자 웹 `PopupPreview.tsx`의 일반·설문 푸터에서 ‘나중에 보기’를 최소 너비 118px, 높이 44px로 맞추고 보조 버튼 스타일을 적용한다. 용도별 버튼 구분과 기존 클릭 핸들러를 유지한다. WPF 스타일을 비교 기준으로 사용한다.
- [x] 브라우저 100%에서 동일 데이터로 인라인·실제 크기 Dialog와 WPF를 비교한다. TEXT·IMAGE(푸터 사용 시)·VIDEO·SURVEY·QUIZ·VIDEO+QUIZ에서 ‘나중에 보기’ 크기와 좌측 배치, ‘확인’ 또는 ‘제출’과의 세로 정렬을 확인한다.
- [x] 좁은 인라인 폭과 확대 배율에서 푸터 문구·체크박스·버튼의 겹침·잘림을 확인한다. `showFooter`·`showLater` 조합, 시청·제출 잠금 중 ‘나중에 보기’ 동작, 활성·비활성 상태를 회귀 검증한다.
- [ ] 웹 타입 검사와 관련 미리보기·완료 동작 검증을 실행하고, 웹·WPF 비교 및 폐쇄망 실화면 결과를 기록한다. (웹 검사·WPF 비교 완료, 폐쇄망 실화면 대기)
- 구현(2026-11-18): `PopupPreview.tsx`에 `SECONDARY_FOOTER_BUTTON_SX`(WPF `SecondaryActionButtonStyle`: 최소 너비 118·높이 44·좌우 여백 22·모서리 9·SemiBold·배경 #F3F4F6·테두리 #D1D5DB, hover #E5E7EB·누름 #D1D5DB)를 두고 일반·설문 푸터의 ‘나중에 보기’와 설문 푸터 보조 ‘닫기’(WPF `FooterAuxCloseButton`과 같은 스타일)에 적용. 클릭 핸들러·표시 조건·‘확인’·‘제출’ 버튼은 변경 없음. WPF 변경 없음.
- 비교(브라우저 100%, 같은 데이터): 웹 ‘나중에 보기’ 120.9×44, ‘확인’·‘바로가기’ 118×44, 설문·퀴즈·VIDEO+QUIZ ‘제출’ 132×46 — WPF 실측(Demo 8종, 96 DPI)과 모든 값 일치.
- 회귀(preview-61 신규 34건): TEXT·IMAGE·VIDEO·SURVEY·QUIZ·VIDEO+QUIZ × 인라인·실제 크기 Dialog에서 크기·모양·왼쪽 끝 배치·‘확인’/‘제출’과 세로 중앙 일치(차이 1 이하)·푸터 요소 겹침/잘림 없음, 좁은 인라인(520)·확대 배율(150% 상당 CSS 폭 667) + 푸터 글자 18, `showFooter`·`showLater` 조합 3종 숨김, 클릭 시 Dialog 닫힘.
- 확인된 기존 동작(이번 변경 무관): IMAGE 푸터는 높이 80 고정이라 좁은 인라인(520) + 푸터 글자 18 + 다시 보지 않기 체크에서 줄이 3줄로 바뀌면 아래가 잘린다. 변경 전 코드도 같은 결과(전후 비교)라 별도 판단 대상으로 남긴다.
- 해당 없음: 관리자 미리보기는 시청·제출 잠금을 시연하지 않아(2026-11-13 슬라이더 삭제) 잠금 중 ‘나중에 보기’ 동작과 비활성 상태는 WPF 테스트 범위다.
- 검증: 웹 `tsc --noEmit`·eslint 통과, preview-61 192·completion-ux-43 82·common-sample-69 63·image-preview 54·survey-rich-text-55 74·guide-render 31 통과. 남은 항목: 폐쇄망 실화면.
- 후속(2026-11-18): 푸터 버튼 높이를 ‘나중에 보기’·‘확인’·‘바로가기’·‘제출’(본문 제출 영역 포함)·보조 ‘닫기’ 모두 **32**로 통일하고 WPF에도 반영. 너비 하한(118·제출 132)·색·모서리는 유지.
  - WPF: `PopupWindow.xaml`의 `FooterLaterButton`·`FooterAuxCloseButton`·`FooterCloseButton`, `SurveyPopupView.xaml`의 `SubmitButton`에 `Height=32`·위아래 여백 0을 직접 지정. 결과 안내창(`PopupAlert`)이 공유하는 `ActionButtonStyle` 높이 44는 변경하지 않음.
  - 웹: `PopupPreview.tsx` `FOOTER_BUTTON_HEIGHT`(32)를 확인·바로가기·제출·나중에 보기·보조 닫기에 적용.
  - 실측(같은 데이터, 96 DPI·브라우저 100%): 웹·WPF 모두 ‘나중에 보기’ 120.9×32, ‘확인’·‘바로가기’ 118×32, ‘제출’ 132×32.
  - 검증: WPF 빌드 경고·오류 0, PopupWindowTests 563(신규 `CheckFooterButtonHeight61_18` 33건: 데모 8종 × 푸터 표시/숨김 × 글자 기본/18의 높이 32·세로 정렬, 공유 스타일 44 유지, `CheckVideoQuizAspect60` 제외), BehaviorTests 1,740(제출 높이 고정값 46→32). 웹 tsc·eslint, preview-61 192(높이 기대값 32)·completion-ux-43 82·common-sample-69 63·image-preview 54·survey-rich-text-55 74·guide-render 31 통과. 폐쇄망 실화면 미실행.
- 후속 2(2026-11-18): 32·34·36 버튼 높이와 80·72·64·56 푸터 높이를 실제 WPF 화면으로 비교(이미지 `docs/reviews/TODO61-18_footer_button_size/`, 반입 문서에 포함)한 뒤 **버튼 34·푸터 64(위아래 15)**로 확정.
  - WPF: 푸터 버튼 3종·본문 제출 버튼 `Height=34`. `FooterRow` 64·`MinHeight` 64(푸터 숨김 시 0), `FooterArea` 여백 28,15,28,15. VIDEO 푸터는 시청 진행 문구 때문에 설문과 같이 자동 높이(최소 64). IMAGE 창 크기 계산은 `FooterRow` 값을 그대로 써 64 반영.
  - 웹: `FOOTER_BUTTON_HEIGHT` 34, `POPUP_FOOTER_HEIGHT` 64(IMAGE 권장 크기 계산 포함), 일반 푸터 위아래 15·최소 64, 설문 푸터 위아래 15·최소 64. IMAGE 푸터도 고정 높이 대신 최소 높이로 바꿔 줄바꿈 시 잘림을 없앰(줄바꿈이 없으면 64 그대로). → 위 ‘확인된 기존 동작’(IMAGE 좁은 폭 잘림)도 해소.
  - 실측(같은 데이터): 웹·WPF 모두 ‘나중에 보기’ 120.9×34, ‘확인’·‘바로가기’ 118×34, ‘제출’ 132×34.
  - 검증: WPF 빌드 경고·오류 0, PopupWindowTests 595(`CheckFooterButtonHeight61_18` 65건: 버튼 34·세로 정렬, TEXT·IMAGE 푸터 64, 진행 문구 푸터 64 이상·내용이 위아래 15 안에 들어감, 공유 스타일 44 유지 / `CheckVideoQuizAspect60` 제외), BehaviorTests 1,740(제출 높이 34, FIT_TO_IMAGE 헤더·푸터 창 높이 318 → 302). 웹 tsc·eslint, preview-61 192(IMAGE 좁은 폭 잘림 예외 제거)·image-preview 54(헤더·푸터 크롬 418 → 402)·completion-ux-43 82·common-sample-69 63·survey-rich-text-55 74·guide-render 31 통과. 폐쇄망 실화면 미실행.

#### 61-18 후속 — 설문·텍스트 푸터 하단 여백 통일 (2026-11-19)

- 폐쇄망 화면에서 설문 ‘제출’과 텍스트 ‘확인’의 버튼 아래 여백 차이를 관찰했다. 캡처상 차이이며 실제 치수와 적용 버전은 구현 시 확인한다.
- [ ] 웹 미리보기의 `PopupPreview.tsx` 설문·일반 푸터와 WPF `PopupWindow.xaml`의 `FooterArea`, `PopupWindow.xaml.cs`의 `FooterRow`를 같은 기준으로 맞춘다. 한 줄 기준 푸터 최소 높이 64, 좌우 여백 28, 상하 기본 여백 15, 버튼 높이 34를 사용한다. 웹 설문 분기의 `px: 3` 및 가운데 정렬과 WPF 텍스트의 고정 행 높이를 확인한다.
- [ ] 필수 응답·제출 상태 안내나 체크박스가 줄바꿈되면 푸터를 위로 확장하고, 버튼은 푸터 하단 기준으로 정렬한다. 실제 버튼 하단과 팝업 내부 하단 사이가 15px(웹) 또는 15 DIP(WPF)인지 확인한다.
- [ ] 같은 데이터로 TEXT·SURVEY 기본 한 줄, 긴 안내 문구·체크박스, 좁은 인라인·실제 크기 Dialog·확대 배율을 검증한다. 공통 푸터를 공유하는 VIDEO·IMAGE·QUIZ·VIDEO+QUIZ도 버튼 잘림·겹침과 본문 스크롤 회귀를 확인한다. 푸터 숨김 시 빈 공간이 남는지, 설문 본문 제출 경로가 동작하는지도 확인한다.
- [ ] TEXT 560×750에서 웹 미리보기가 WPF보다 하단이 약 15px 더 크게 보인다는 폐쇄망 관찰을 재현한다. 같은 크기 모드와 배율에서 창 외곽 높이, 그림자 여백을 제외한 패널 높이, 푸터 높이, 버튼 하단부터 패널 하단까지의 거리를 각각 비교한다. 웹 푸터의 `padding-bottom: 15px`과 WPF `FooterArea`의 하단 15 DIP가 각 레이아웃에 한 번만 반영되는지 확인한다. 관찰된 차이의 원인은 실측으로 확정한다.
- 추가 관찰(폐쇄망 인라인 DevTools): `pb: 0` 확인 상태에서 선택한 푸터 `Stack`의 상하 패딩은 0px, 좌우는 28px, 계산된 높이는 64px이었다. Git의 일반 푸터는 `minHeight`와 `alignItems="center"`를 사용하므로, 34px 버튼이 64px 푸터 안에 가운데 정렬되면 패딩이 0이어도 위아래가 각각 15px 남을 수 있다. 인라인·실제 크기 Dialog·WPF에서 버튼 하단과 내부 패널 하단을 각각 실측해 기존 15px 차이와의 관계를 확인한다.
- [ ] 웹 타입 검사·미리보기 회귀 검증, WPF 빌드·화면 대조, 폐쇄망 실화면 결과를 기록한다. 이번 후속 항목은 구현·검증 대기다.

## 추가 TODO — 61-19 폐쇄망 미리보기 헤더 글자 크기 (2026-11-19)

- **상태** · 폐쇄망 DevTools에서 원인 확인. 2026-11-19 웹 코드 적용·하네스 검증 완료. 폐쇄망 실화면 재검증 대기.
- **현상과 원인** · 폐쇄망 관리자 미리보기의 헤더 제목이 기본 17px에서 12px로 표시됐다. 폐쇄망 `theme/index.ts`의 `MuiTypography.styleOverrides.root['&.MuiTypography-body1']`가 제목의 `sx.fontSize`보다 높은 선택자 우선순위로 적용됐다. 전역 규칙의 12px 선언을 주석 처리했을 때 17px로 표시됐다. Git 기준 [PopupPreview.tsx](../../zero-rule-web/main/src/features/PopupcommonComponent/PopupPreview.tsx#L669)의 헤더 `Typography`는 `headerFontSize ?? POPUP_DEFAULT_FONT_SIZES.header`를 직접 지정한다.

### 구현 시 확인할 사항

- [x] 관리자 웹 공통 `PopupPreview`의 헤더 제목 한 곳에 `sx['&&'].fontSize`로 기존 값을 적용한다. 전역 `body1` 12px 규칙을 켠 상태에서 검증한다.
- [x] `&&`와 전역 규칙은 CSS 우선순위가 같으므로, 인라인과 실제 크기 Dialog 양쪽에서 생성 CSS의 적용 순서와 Computed `font-size`를 확인한다. 기본 17px과 명시값(예: 14px, 22px)이 그대로 표시되고, `showHeader=false`이면 헤더가 숨겨져야 한다.
- [ ] TEXT·IMAGE·VIDEO·SURVEY·QUIZ·VIDEO+QUIZ에서 공통 헤더와 로고·말줄임, 본문·푸터 및 전역 `body1` 적용 화면을 회귀 확인한다. 웹 타입 검사·변경 파일 eslint·미리보기 하네스와 폐쇄망 실화면 결과를 기록한다.
  - 2026-11-19 로컬: `verify-popup-preview-61.cjs`에 전역 body1 12px 테마를 추가해 여섯 유형 × 기본 17/14/22의 인라인·모달 헤더가 기대값으로 계산됨을 확인(수정 전 코드는 12px로 실패). 전역 규칙 활성·`showHeader=false` 숨김 확인, `tsc`·eslint·`verify-popup-parity.cjs` 통과. 로고·말줄임·본문·푸터 회귀는 기존 하네스 검사 범위. 폐쇄망 실화면은 미실행이라 미체크로 둔다.

## 61-20 팝업 UI 기본값 캡처 및 회귀 검증

**상태** · 기본값 사양 초판 작성. 2026-11-19 로컬 동일 데이터 캡처·실측 완료([결과](../reviews/TODO61-20_popup_ui_parity/README.md)). 편집기 비교·폐쇄망 배율·차이 2건 반영 여부 대기.  
**기준** · [팝업 UI 기본값 사양](61_POPUP_UI_DEFAULTS_SPEC.md)의 영역별 수치, 적용 조건 및 캡처 표를 사용한다.

### 구현 시 확인할 사항

- [ ] `PopupEditorDialog` → `InlinePopupPreview` / `PopupPreviewDialog` → `PopupPreview`와 실제 WPF `PopupWindow`에 같은 Demo 데이터를 적용한다. (2026-11-19 공통 렌더러 `PopupPreview` 기준 11세트 완료 — 등록 Dialog 경유 캡처는 남음) 기존 비교 하네스를 재사용하고, 표의 TEXT·SURVEY·QUIZ·IMAGE·VIDEO·VIDEO+QUIZ, 좁은 폭·긴 문구·헤더와 푸터 숨김·미디어 미첨부를 캡처한다.
- [x] 헤더·본문·푸터 및 유형별 구성마다 글자 크기·패밀리·굵기, CSS margin/padding 또는 WPF Margin/Padding, 너비·높이·최소 높이를 기록한다. TEXT 560×750은 창·패널·푸터·버튼 하단을 따로 측정한다. 최초 비교는 브라우저 100%·Windows 96 DPI로 하고, 폐쇄망 배율에서 추가 확인한다.
- [ ] `PopupQuestionEditor`·`PopupRichTextEditor`의 일반/서식 선택지와 제목·설명·본문을 미리보기와 비교한다. 한 줄·여러 줄, 기본 크기·명시 크기, 실제 글꼴·대체 글꼴을 확인한다. `textarea`와 `MuiInputBase`의 높이와 여백은 따로 측정한다.
- [ ] `PopupWindow.ApplyFontSizes`, `SurveyPopupView.ApplyBodyFontSize`와 웹 영역별 보정을 대조한다. 기존 저장 데이터 중 크기·글꼴 미지정, 지정값, Run 서식 값이 있는 샘플을 포함한다. 캡처는 기존 데이터 구조를 사용한다.
- [x] 푸터 15px 차이와 헤더 12px 충돌의 수정은 각각 61-18·61-19에서 추적한다. 이 항목에는 비교 캡처·실측을 연결한다. 다른 차이가 나오면 해당 요소의 선언·실측값과 적용 환경을 기록한다.

### 2026-11-19 로컬 실측 결과

- `scripts/verify-popup-parity.cjs`를 확장해 TEXT 560×750·좁은 폭 긴 문구·헤더/푸터 숨김·IMAGE·VIDEO·VIDEO+QUIZ를 추가(기존 5종 포함 11세트). WPF 캡처(`scripts/PopupParityCapture`)는 보이는 TextBlock·Run의 크기·굵기·패밀리·위치와 헤더·푸터·버튼 상자를 남기고, 같은 글자끼리 웹과 대조한다. 자동 판정 54건 통과.
- 일치: 헤더 40·제목 17/600, 주 버튼 118×34(제출 132×34)·글자 14, 버튼 아래 간격 15(TEXT 560×750 포함), TEXT 본문, 선택지. 글꼴 패밀리는 웹·WPF 모두 맑은 고딕(웹 테마 지정, WPF 시스템 기본).
- 차이: ① SURVEY·QUIZ 콘텐츠 제목 굵기 웹 800 / WPF 600. ② 설문·퀴즈 푸터 응답 진행 문구 웹 13px·왼쪽 24 / WPF 12·왼쪽 28. → 61-21에서 WPF 기준으로 반영. 기존 기록된 차이: VIDEO+QUIZ 상단 제목(웹 퀴즈 제목 1회, WPF 영상 제목).
- 캡처·표: [docs/reviews/TODO61-20_popup_ui_parity](../reviews/TODO61-20_popup_ui_parity/README.md). 미실행: 등록 편집기 비교, 브라우저 확대·Windows 배율, 폐쇄망.

### 구현 전에 결정할 사항

현재 사양은 기존 선언값·관찰 결과를 근거로 하며 새 디자인 값은 확정하지 않는다. 웹과 WPF의 실제 선택 글꼴이나 여백에 차이가 있으면 실측 결과를 바탕으로 해당 변경 범위를 검토한다.

### 완료 기준

여섯 대표 유형의 동일 데이터 캡처와 등록 편집기 증거를 Git에서 찾아볼 수 있고, 각 수치는 소스 선언·웹 Computed·WPF 실측 중 근거가 표시되어야 한다. 실화면에서 확인하지 못한 칸과 환경별 차이는 별도로 남긴다. 코드 변경이 필요한 후속 작업의 타입 검사·빌드·회귀 검증 결과는 각 수정 작업에 기록한다.

## 61-21 미리보기 레이아웃 공통화 (2026-11-19)

**상태** · 로컬 구현·검증 완료. 폐쇄망 실화면 확인 대기.
**배경** · 61-17~61-20으로 웹 미리보기와 WPF의 버튼·푸터·여백이 거의 같아져, 같은 값과 모양을 한곳에서 관리하도록 정리한다. 61-20 실측 차이 2건(설문 제목 굵기, 설문 푸터 진행 문구)은 WPF 기준으로 맞춘다.

- [x] 서식 문단 그리기 중복 제거: TEXT 본문도 `PopupRichBlocks`(`paragraph="div"`)를 쓴다. 문항·선택지는 기존 `span`.
- [x] 레이아웃 수치·색 상수: `popupLayout.ts`의 `POPUP_LAYOUT`(창 여백 24·헤더 40·본문 28/24·푸터 64·푸터 여백 28/15·묶음 간격 16·버튼 간격 10·버튼 34/118/132/22/9), `POPUP_COLORS`. `imagePreviewLayout.ts`·`popupPreviewDialogLayout.ts`·`AspectVideoArea.tsx`·`PopupPreview.tsx`가 이 값을 쓴다.
- [x] 푸터 공통화: `PopupFooter.tsx`의 `PopupFooter`(나중에 보기 → 안내·체크박스 → 오른쪽 버튼, WPF `FooterArea` 배치)와 `PopupFooterButton kind="primary|secondary|submit"`. 일반·설문 푸터 두 분기를 하나의 틀로 합쳤다. 푸터 글자 크기는 한 번 계산해 버튼·체크박스가 이어받는다.
- [x] 61-20 차이 반영: 설문·퀴즈 콘텐츠 제목 굵기 800 → 600, 설문 푸터 좌우 여백 24 → 28, 응답 진행 문구 13 → 12(WPF `FooterResponseProgressText`, 푸터 글자 크기 미적용). 콘텐츠 제목은 유형별 표(`CONTENT_TITLE_SX`)로 정리.
- [x] 체크박스 위치: MUI `FormControlLabel` 기본 여백(왼쪽 -11·오른쪽 16)을 푸터 안에서 0으로 두어 '다시 보지 않기' 글자 위치가 WPF와 같다(좁은 폭 세트 202.9 = 202.9).
- [x] WPF 푸터 버튼 스타일: `PopupStyles.xaml`에 `FooterActionButtonStyle`·`FooterSecondaryButtonStyle`(높이 34·여백 22,0), 설문 디자인 V1·V2에 `SurveyFooterSubmitButtonStyle`(높이 34·여백 24,0)을 두고 버튼별 `Height`·`Padding` 직접 지정을 없앴다. 결과 안내창 `ActionButtonStyle`(44)은 그대로.
- [ ] 폐쇄망 실화면(전역 CSS·배율)에서 푸터·제목 확인.

검증 · 웹 `tsc`·변경 파일 eslint 오류 0. 하네스 preview-61 234, completion-ux-43 82, common-sample-69 63, image-preview 54, survey-rich-text-55 74, rich-text-49 94, guide-render 31, guide-registry 313, transform-64 78, quiz-option-byte-73 44, rgstpop-quiz-rule 25, template-picker 7, pick-fields 34건 통과. `verify-popup-parity.cjs` 54건 통과, 글자 대조 차이 8건 → 1건(기존 기록된 VIDEO+QUIZ 상단 제목). WPF 빌드 경고·오류 0, BehaviorTests 1,740·RichTextTests 116·RecoveryTests 255·ApiDemoTests 150 통과, PopupWindowTests는 `CheckCloseButtonAfterDisplayChange`를 뺀 602건 통과(이 검사는 변경 전 코드에서도 현재 주 모니터 작업 영역 2561×1393에서 같은 위치로 실패하는 환경 문제).

## 61-22 팝업 레이아웃 가이드 (2026-11-19)

**상태** · 로컬 작성 완료. 폐쇄망 배율·전역 CSS 반영 캡처는 대기.
**결과** · [팝업 레이아웃 가이드](61_POPUP_LAYOUT_GUIDE.md)

- [x] `scripts/verify-popup-parity.cjs` 6단계: 웹 흰 판 캡처 위에 헤더·본문 여백·푸터·버튼 영역과 글자 번호를 표시한 `<ID>.guide.png`와 유형별 번호표(`guide-figures.md`, 웹·WPF 실측)를 생성한다.
- [x] 7세트(TEXT 560×750, TEXT 좁은 폭·긴 문구, SURVEY, QUIZ OX, IMAGE, VIDEO, VIDEO+QUIZ) 가이드 그림과 웹·WPF 나란히 캡처를 `docs/design/61_popup_layout_guide/`에 반입.
- [x] 공통 창 구조 표(값 · 웹 상수 `POPUP_LAYOUT`·`PopupFooterButton` · WPF 선언·스타일), 푸터 배치 규칙, 알려진 차이, 레이아웃 변경 절차를 정리했다.
- [x] (2026-11-23) 최소·최대 표시: 가이드 그림 아래에 유형별 창·콘텐츠 최소·최대 칸을 추가하고, 설문·퀴즈 콘텐츠 너비(최대 760)와 영상 높이(VIDEO+QUIZ 최소 180·최대 70%, 단독 웹 최소 170) 실측 상자를 그린다. 문서 유형별 절에도 같은 목록을 넣었다. 관리자 웹 가이드 「사용 순서」 탭에 「팝업 크기 최소·최대」 표(창 모드 5행·유형 6행·미리보기 2행, `guideData.LAYOUT_LIMITS`, 300·푸터·버튼 값은 실제 상수 참조)를 추가했다.
- [ ] 폐쇄망 배율·전역 CSS 환경 캡처 추가.

검증 · `verify-popup-parity.cjs` 54건 통과, 가이드 그림 7장 육안 확인(TEXT·좁은 폭·SURVEY·VIDEO+QUIZ).

## 61-23 실제 크기 미리보기 작업 영역 차이 재현 및 유형별 회귀 검증

### 확인된 현상과 기준

2026-11-24(KST) 관리자 실측. IMAGE 요청 크기 730×900, 관리자 「실제 크기로 보기」, 브라우저 F11 전후에 모달의 `getBoundingClientRect()`를 각각 다시 측정했다. 비교한 Git 기준은 `main` `30e2b57`이다.

| 브라우저 상태 | 브라우저 내부 높이 | 웹 모달 실측 |
|---|---:|---:|
| F11 전체화면 | 1080px | 730×900px |
| 일반 모드 | 945px | 730×851px |

- 웹 일반 IMAGE 분기에서 `945 × 0.90`을 반올림한 851px가 일반 모드 실측과 일치한다. 브라우저 상태에 따라 창 높이가 49px 바뀌었다. F11에서 실팝업과 더 비슷하게 보였으나 이 관찰에 대응하는 WPF 외곽·본문 실측, 사용 모니터 작업 영역, IMAGE 세부 모드는 추가 확인한다.
- 확정 기준은 [POL-04](../policies/POL-04.md), [POL-08](../policies/POL-08.md), [WPF 인터페이스](../interfaces/WPF/POPUP_INTERFACE_SPEC.md)다. ADAPTIVE의 width/height는 창 크기, FIT_TO_IMAGE의 width/height는 이미지 콘텐츠 영역이다. WPF 일반 IMAGE는 모니터 작업 영역의 90% 상한을 사용한다. 브라우저 F11과 팝업의 FULLSCREEN 설정을 각각 검증한다.
- 현행 웹에서 `PopupPreviewDialog.tsx`의 `readViewport()`는 `innerWidth/innerHeight`를 사용한다. `previewDialogSize()`는 일반 IMAGE에 90%, IMAGE 권장 크기 전달 경로와 일반 비IMAGE에 별도의 96% 제한을 적용하며, 모달 Paper에도 `96vw/96vh` 제한이 있다. WPF 비IMAGE의 창 모드별 화면 제한은 [레이아웃 가이드](61_POPUP_LAYOUT_GUIDE.md)와 `ApplyWindowSize()`를 대조한다.

### 표시 요구사항

- 배경 오버레이는 기존 브라우저 뷰포트에 고정한다. Windows 작업 영역은 팝업 외곽의 목표 크기 계산에만 사용한다. 오버레이와 바깥 레이아웃에는 페이지·모달 래퍼 스크롤이 생기지 않아야 한다.
- IMAGE는 정상 최대화 환경에서 Windows 작업 영역 90% 상한을 적용한 목표 크기가 브라우저에 들어가면 그대로 표시한다. 팝업 콘텐츠 자체의 기존 스크롤은 유형별로 검증한다. 브라우저에 목표 크기가 들어가지 않는 사례는 재현 후 처리 방식을 결정한다.

### 구현 시 확인할 사항

- [ ] 동일 이미지와 동일 설정으로 730×900 회귀 사례를 재현한다. F11 전후, 브라우저 창 축소, 확대율 100%와 비기본값, Windows 배율 100%와 확대 환경, 작업 영역이 다른 다중 모니터를 확인한다. `innerWidth/innerHeight`, `screen.availWidth/availHeight`, 브라우저 확대율·DPI, WPF 창 대상 모니터 작업 영역(DIP)을 기록한다. 브라우저 CSS px와 WPF DIP 및 캡처 물리 픽셀을 대응시켜 비교한다.
- [x] 관리자 웹 `PopupPreviewDialog.tsx`의 `readViewport()`·Paper 제한, `popupPreviewDialogLayout.ts`의 `previewDialogSize()`, `imagePreviewLayout.ts`의 `fitToImageLayout()`, `PopupPreview.tsx`의 권장 크기 보고·본문 렌더링, `InlinePopupPreview.tsx`의 모달 연결을 확인한다. `RgstPop`과 `IS063M02Sample`이 어떤 옵션·권장 크기를 넘기는지도 대조한다.
- [ ] WPF `Views/Windows/PopupWindow.xaml.cs`의 `ApplyWindowSize()`·`CurrentWorkArea()`와 `Views/Contents/ImagePopupView.xaml.cs`의 `UpdateLayoutForImage()`를 기준으로 같은 데이터를 비교한다. 요청 크기, 화면 보정 후 창 크기, 흰 판·헤더·푸터·본문 및 이미지 박스 크기를 순서대로 기록한다. 창 크기를 맞춘 뒤에도 차이가 남으면 리사이즈·패딩·설명 높이 등 해당 영역의 계산을 확인한다.
- [ ] 아래 유형별 검증에서 재현된 차이와 원인을 기록한 다음 수정한다. 웹 작업 영역 계산은 확인된 범위에 적용하고, WPF 동작이나 API·DB 변경은 증거상 필요할 때 영향과 하위 호환성을 먼저 확인한다. 구 응답의 IMAGE 축별 대체 읽기와 누락값 처리, 저장 데이터 및 미리보기 입력 객체의 불변성을 검증한다.

| 대상 | 회귀 확인 항목 |
|---|---|
| IMAGE | 730×900, ADAPTIVE·FIT_TO_IMAGE, 축 생략·원본 비율 고정/해제, 설명·헤더·푸터 표시, 이미지 중심·클리핑. 모달 첫 열기·재열기·리사이즈 후 권장 크기 수렴 |
| TEXT | 긴 본문 줄바꿈·세로 스크롤, 헤더·푸터 숨김 및 고정 배치 |
| VIDEO | 종횡비, 영상 영역·제어부·푸터 접근성 |
| SURVEY·QUIZ | 긴 문항·선택지·주관식, 본문 스크롤·제출 푸터 접근성 |
| VIDEO+QUIZ | 영상·문항 배분, 시청 잠금·해제, 스크롤, 높이 600px 전후에서 크기 진동 또는 스크롤 반복 여부 |
| 공통 창 모드 | 지원되는 FIXED·RATIO·AUTO·FULLSCREEN, 최소·최대값 경계, 배치·종료·오버레이, 인라인과 실제 크기 모달 간 회귀 |

### 오류·경계 재현 항목

| 상황 | 재현과 확인 기준 |
|---|---|
| 뷰포트 이중 제한 | 브라우저 내부 높이 945px에서 IMAGE 730×900을 확인한다. Windows 작업 영역 높이가 1040인 예에서는 상한 936px도 실제 가용 높이에 들어가는 경우 확인한다. 기존 `90%` 브라우저 상한이나 `96vh`(907.2px), 가로 `96vw`, Dialog 여백이 목표 크기를 추가로 줄이는지 Computed와 외곽 실측으로 대조한다. |
| 오버레이·페이지 스크롤 | 모달 열기·닫기, 휠·키보드 탐색, 리사이즈 시 배경이 뷰포트 끝까지 유지되고 관리자 페이지 및 모달 래퍼에 가로·세로 스크롤이 생기지 않는지 확인한다. 기존 팝업 본문 스크롤과 구분한다. |
| 브라우저 가용 영역 부족 | 창 축소, 브라우저 확대 또는 도킹한 DevTools, 너비 또는 높이 한 축만 부족한 상태에서 팝업·닫기·푸터가 잘리는지 확인한다. 기존 위치·정렬과 종료 수단을 검증하고, 처리 방식 결정에 실측을 사용한다. |
| 배율·모니터 이동 | 브라우저 확대율, Windows 고DPI, 작업 표시줄 숨김, 크기·배율이 다른 모니터 이동, F11 전환 시 화면 정보가 갱신되는지 확인한다. 잘못된 모니터 값이나 가용 크기 0·누락의 대체값으로 비정상 크기가 생기지 않아야 한다. |
| 권장 크기 갱신 | IMAGE FIT_TO_IMAGE의 인라인 권장값과 실제 모달 계산 기준이 충돌하는지 확인한다. 이미지 로드 전후·교체·재열기·연속 리사이즈에서 기존 크기 잔류, 깜빡임, 크기 계산 반복을 확인한다. |

### 구현 전에 결정할 사항

| 결정 항목 | 이유와 선택지 | 추천 및 영향 |
|---|---|---|
| 미리보기 목표 크기 기준 | 브라우저 여유 공간과 WPF 모니터 작업 영역이 다르다. A. 현행 브라우저 기준을 유지하고 제한을 안내한다. B. `screen.availWidth/availHeight`를 WPF 작업 영역의 근사값으로 사용하고 브라우저 내부 크기는 모달 표시 한계로 사용한다. | B 우선 검증. IMAGE 기본 모달과 FIT_TO_IMAGE 권장 크기가 같은 기준을 쓰도록 대조한다. 화면 가용 크기를 읽을 수 없으면 현행 브라우저 가용 크기를 대체값으로 사용하는 방안을 검증한다. 멀티 모니터·DPI와 작업 표시줄 숨김 조건은 실측으로 판단한다. 다른 유형은 개별 재현 결과로 적용 범위를 확정한다. |
| 목표 크기가 브라우저 표시 영역을 넘는 경우 | 크기를 줄이면 내부 줄바꿈·이미지 배치가 바뀔 수 있다. A. 기존처럼 모달 크기를 제한한다. B. 목표 크기로 내부 레이아웃을 계산하고 전체를 균일하게 축소해 표시한다. | 먼저 A로 730×900 재현 조건을 해결할 수 있는지 확인한다. 실제로 공간이 부족한 사례에서만 재배치(A)와 균일 축소(B)의 가독성·푸터 도달성을 비교한다. 바깥 스크롤은 표시 요구사항에서 제외하며 축소 동작은 검증 후 결정한다. |

### 기준 화면 선택박스

관리자 「실제 크기로 보기」에서 현재 모니터와 해상도 프리셋을 바꿔 같은 팝업의 창 크기와 레이아웃을 비교한다.

- [x] 모달 상단 도구 영역에 `기준 화면` 선택박스를 둔다. 초기값은 `현재 모니터`이며, 프리셋 후보는 `1920×1080`과 `2560×1440`이다. 프리셋의 표시 해상도와 실제 계산에 사용하는 가상 작업 영역을 구분해 보여준다. 예를 들어 `1920×1080`에서 작업 영역 높이 1040은 작업 표시줄을 가정한 검증값이다.
- [x] `PopupPreviewDialog.tsx`의 `previewDialogSize()` 호출부와 `PopupPreview.tsx`의 `fitToImageLayout()` 경로에 모달에서 선택한 동일 작업 영역을 전달한다. 선택을 바꾸면 모달 크기와 IMAGE 권장 크기를 일관되게 다시 계산한다. RgstPop과 IS063 샘플에서 같은 UI를 사용하고, 선택은 미리보기 상태로 유지한다.
- [x] 선택값은 팝업 크기 계산에만 사용한다. 배경은 실제 브라우저 뷰포트를 덮고 페이지·모달 래퍼는 스크롤 없이 표시한다. 도구 영역을 포함한 실제 표시 공간에 목표 크기가 들어갈 때 1:1로 표시한다. 공간 부족 시 1:1 표시가 어려움을 안내하며, 검증 결과로 축소 표시 여부를 결정한다.
- [ ] 일반 모드에서 IMAGE 730×900, 현재 모니터와 프리셋 전환, `FIT_TO_IMAGE` 이미지 로드 전후, 모달 닫고 재열기, 창 크기·브라우저 확대 변경을 확인한다. 팝업 외곽 치수와 오버레이, 닫기·푸터 도달성, 바깥 스크롤 여부를 기록한다. 기존 유형별 회귀 검증에 최소 한 번의 프리셋 전환을 포함한다.

**구현 전 결정** · 프리셋의 작업 영역과 배율을 고정값으로 제공할지, 사용자가 작업 영역을 별도로 입력하게 할지 결정한다. 동일 조건을 반복 재현하기 쉬운 100% 배율 고정 프리셋부터 검증하는 안을 추천한다. 직접 입력을 허용하면 비표준 화면을 비교할 수 있고, 치수·배율 검증과 UI가 추가된다.

### 구현 기록 (2026-11-24, 웹)

결정(구현 전 결정 사항 반영)

- 목표 크기 기준은 B: 작업 영역 = 현재 모니터 `screen.availWidth/availHeight`(0·누락이면 브라우저 표시 영역, 그것도 없으면 1920×1040) 또는 기준 화면 프리셋. 브라우저 내부 크기는 표시 한계로만 쓴다.
- 브라우저 표시 영역을 넘는 경우는 A: 넘치는 축만 표시 영역까지 줄이고 도구 영역에 '1:1로 표시하지 못했습니다 (목표 W×H)'를 안내한다. 균일 축소(B)는 실측 후 재검토.
- 프리셋은 배율 100% 고정 2종: 1920×1080(작업 영역 1920×1040), 2560×1440(작업 영역 2560×1400). 작업 영역 높이는 작업 표시줄 40을 가정한 검증값. 직접 입력은 두지 않음.
- 적용 범위는 모든 유형(FULLSCREEN 제외: 기준 화면과 무관하게 브라우저 화면을 채우고 선택박스를 두지 않음).
- 정합성 보완: 비IMAGE 화면 상한을 브라우저 96%에서 WPF `ApplyWindowSize()`와 같은 작업 영역 FIXED 95%·RATIO 100%로 바꾸고, RATIO 비율을 WPF처럼 0.1~1.0으로 보정(IMAGE 포함). IMAGE는 작업 영역 90% 그대로.
- 도구 묶음(1:1 안내·기준 화면·종료 버튼)은 기존 종료 버튼처럼 화면 위에 떠 있어 팝업 표시 공간을 줄이지 않는다(위쪽 배치 팝업이면 아래로 이동). 따라서 1:1 판정은 브라우저 표시 영역 전체 기준이다.

변경

- `popupPreviewDialogLayout.ts`: `PreviewScreenKey`·`PREVIEW_SCREEN_PRESETS`·`readBrowserViewport()`·`readScreenWorkArea()`·`previewWorkArea()`·`previewDisplaySize()` 추가. `previewDialogSize()`는 작업 영역 기준 목표 크기만 계산(권장 크기 fitWindow는 그대로 사용, 표시 한계는 `previewDisplaySize()`).
- `PopupPreviewDialog.tsx`: `readViewport()` 제거, 브라우저 표시 영역·현재 모니터 작업 영역을 resize 때 갱신(같은 값이면 상태 유지). '기준 화면' 선택박스와 1:1 안내 추가. Paper `96vw/96vh` 이중 제한을 `100vw/100vh`로 변경. 인라인 권장 크기(recommendedSize)는 현재 모니터 선택일 때만 첫 표시에 사용.
- `PopupPreview.tsx`: 선택 prop `workArea` 추가. 없으면 현재 모니터 작업 영역(인라인 권장 크기도 같은 기준). 모달은 선택한 작업 영역을 넘겨 FIT_TO_IMAGE·크기 미지정 ADAPTIVE 권장 크기를 다시 계산.
- RgstPop·IS063 샘플·샘플 편집기는 같은 `PopupPreviewDialog`를 쓰므로 호출부 변경 없이 같은 UI. 선택은 모달 컴포넌트 상태로만 남고 popup·저장 데이터에 들어가지 않는다.
- 가이드 표시(`guide/guideData.ts`)와 레이아웃 가이드·UI 기본값 사양·미리보기 컴포넌트 인터페이스·WPF 대조 기록의 '브라우저 96%' 표기를 작업 영역 기준으로 갱신.

검증

- `verify-popup-preview-61.cjs` 255건 통과(기존 226 + 61-23 29건): 일반 모드(뷰포트 1920×945·작업 영역 1920×1040)와 F11(1920×1080)에서 IMAGE 730×900이 모두 1:1 730×900, 작업 영역 90% 상한 936, 배경 뷰포트 전체·페이지/모달 래퍼 스크롤 없음, 프리셋 전환(TEXT RATIO 500×450 → 960×520 → 목표 1200×700이 폭 1000으로 제한되며 1:1 아님 안내 → 현재 모니터로 복귀), 종료 버튼 도달성, FIT_TO_IMAGE 권장 크기가 프리셋·현재 작업 영역을 따르는지, FIXED 95%·설정 최대·RATIO 100%·비율 0.1 하한·IMAGE 90%, `screen.availWidth` 0일 때 대체값. 기존 기대값 3건 갱신(Paper 최대 1000×900, 작은 작업 영역 FIXED 266×247, 종료 버튼을 도구 묶음 기준으로 측정).
- `tsc --noEmit` 통과, 변경 파일 eslint 오류 없음. `verify-image-preview` 48, `verify-popup-guide-render` 33, `verify-completion-ux-43` 82, `verify-popup-transform-64` 78, `verify-survey-rich-text-55` 81, `verify-rich-text-49` 107, `verify-popup-common-sample-69` 63, `verify-popup-parity` 54건 통과.
- 하네스의 화면 조건은 CDP 에뮬레이션(배율 1)이다. 미실행: 실제 브라우저 확대율·Windows 고DPI·다중 모니터·작업 표시줄 숨김에서 `screen.avail*` 실측, 같은 데이터의 WPF 창·흰 판·이미지 박스 실측 비교(구현 시 확인 1·3번), 전 유형 실화면 회귀, `next build`, 로그인 관리자 화면, 폐쇄망.

### 후속 — 화면 상한 90% 통일 (2026-11-24, WPF·웹)

- 배경: 대조 중 WPF 화면 상한이 FIXED 95%·AUTO 90%·IMAGE 90%로 나뉘어 있고, 값이 다른 근거가 설계 11·15·23에 없음을 확인. RATIO 100%는 '작업 영역 × 비율(0.1~1.0)' 정의에서 나온 값이라 유지.
- 결정: FIXED·AUTO·IMAGE를 90%로 통일. 동작이 바뀌는 범위는 FIXED에서 작업 영역 90%를 넘는 요청뿐이고, 화면 가장자리 여유(1040 높이 기준 위아래 약 52)를 남겨 Overlay·닫기 버튼 가시성과 VM 복귀·해상도 변경 시 안전성을 높인다.
- 변경: WPF `PopupWindow.xaml.cs` `FixedSizeSafeAreaRatio`(0.95)·`ImageSafeAreaRatio`(0.90)·AUTO 리터럴 0.9를 `ScreenSafeAreaRatio = 0.90` 하나로 통합. 웹 `previewDialogSize()` FIXED 상한 90%(`PREVIEW_SCREEN_SAFE_AREA_RATIO`), RgstPop 최대 크기 입력 안내·가이드 표시 문구, 레이아웃 가이드 그림·문서, WPF 인터페이스·정책 사양 갱신.
- 검증: `PopupWindowTests` 660건(FIXED 20000×20000 → 작업 영역 90% 검사 추가), 로컬 `Popup.BehaviorTests` 1644건, `verify-popup-preview-61` 255(FIXED 기대값 950×760 → 900×720, 작은 작업 영역 266×247 → 252×234), guide-render 33, image-preview 48, popup-parity 54, `tsc --noEmit`·eslint 통과. 실화면 미실행.

### 후속 — 기준 화면 프리셋을 가상 화면으로 표시 (2026-11-24, 웹)

- 배경: 프리셋을 바꿔도 FIXED 팝업(예: 560×420)은 어느 해상도에서든 90% 상한 아래라 크기가 같고, 모달을 브라우저에 1:1로 그려 화면 대비 크기 차이가 보이지 않았다.
- 변경: 프리셋을 고르면 그 해상도의 가상 화면(작업 영역 + 작업 표시줄 높이 40, 바탕 무채색)을 그리고 팝업을 WPF와 같은 크기·9방향 위치로 놓은 뒤, 가상 화면 전체를 같은 축척(`previewVirtualScale`, 최대 1)으로 줄여 브라우저에 넣는다. 팝업 내부는 실제 크기로 배치한 뒤 화면과 함께 축소하므로 줄바꿈·이미지 배치는 그 해상도의 실제 팝업과 같다. Overlay는 가상 화면 전체를 덮고, FULLSCREEN은 작업 표시줄까지 덮는 표시 해상도 크기. 도구 묶음은 위쪽 64px 자리에 고정하고 '가상 화면 W×H · 팝업 W×H · 축척 N%'를 표시한다. 상한으로 실제로 줄어드는 경우를 보기 위해 프리셋 1366×768(작업 영역 1366×728)을 추가했다. '현재 모니터'는 기존대로 1:1(넘치는 축만 제한·안내).
- 검증: `verify-popup-preview-61` 273건(가상 화면 축척·위치, RATIO 50% 960×520·1200×700·683×364, FIXED 1300×900이 1366×768에서 1229×655로 줄고 큰 화면일수록 화면 대비 비율이 작아짐, FULLSCREEN 1920×1080, FIT_TO_IMAGE 가상 작업 영역 추종, 현재 모니터 복귀·1:1 제한 안내, 바깥 스크롤 없음, 종료 버튼 도달성)과 프리셋별 캡처 육안 확인. image-preview 48·guide-render 33·completion-ux-43 82·common-sample-69 63·parity 54, `tsc --noEmit`·eslint 통과. 로그인 관리자 실화면 미확인.

### 후속 — 축소 대신 실제 크기 + 스크롤 (2026-11-24, 웹)

- 배경: 축소 표시는 해상도별 비교는 되지만 1920 화면에서 2560 화면을 실제 크기로 볼 수 없었다. 브라우저보다 큰 화면·팝업은 스크롤을 허용하기로 결정(앞의 '바깥 스크롤 금지'·'1:1 아님 안내' 결정을 대체).
- 변경: 해상도 프리셋 화면(작업 영역 + 작업 표시줄)을 축소 없이 실제 크기로 그리고, 브라우저보다 크면 화면 영역(`preview-virtual-scroll`)에 가로·세로 스크롤. 해상도를 바꾸거나 팝업 크기가 바뀌면 처음 스크롤을 팝업 가운데로 맞춘다. 현재 모니터도 목표 크기가 브라우저보다 크면 줄이지 않고 모달 컨테이너가 스크롤(넘치는 축은 시작점 정렬로 잘림 방지). '1:1' 표기·1:1 안내 문구, '가상 화면'·축척 표시 문구, `previewDisplaySize()`·`previewVirtualScale()` 제거. Paper 최대 크기 제한 없음.
- 검증: `verify-popup-preview-61` 278건(해상도 화면 실제 크기·팝업 크기, 브라우저보다 큰 화면 스크롤·오른쪽 아래 끝 도달, 해상도 전환 시 팝업 가운데 스크롤, 현재 모니터 큰 팝업 세로 스크롤·잘림 없음, 관리자 페이지 자체 스크롤 없음, 문구 제거). image-preview 48·guide-render 33·completion-ux-43 82·common-sample-69 63, `tsc --noEmit`·eslint 통과. 로그인 관리자 실화면 미확인.

### 완료 기준

- [ ] 730×900 사례와 전체 유형의 동일 데이터·동일 조건 결과가 남아 있고, 차이가 발생한 단계와 수정 근거를 확인할 수 있다. 목표 크기가 브라우저에 들어가는 조건에서는 F11 전환만으로 모달 크기가 달라지던 사례를 재검증한다.
- [ ] 확인된 차이 수정 후 해당 유형과 전체 유형을 다시 검증해 모달 열기·리사이즈·재열기, 콘텐츠 스크롤·이미지 클리핑·닫기 버튼과 푸터 도달성에 회귀가 없는지 확인한다. 배경은 브라우저 뷰포트를 덮고 바깥 스크롤이 발생하지 않아야 한다.
- [ ] `scripts/verify-popup-preview-61.cjs`, `scripts/verify-image-preview.cjs`, `scripts/verify-popup-parity.cjs`, `scripts/PopupParityCapture` 중 기존 경로를 활용한다. 정적 검토, 웹 타입 검사·빌드, 로컬 웹·Windows 실행 비교, 폐쇄망 실화면을 각각 기록하고 미실행 항목은 완료 처리하지 않는다.
