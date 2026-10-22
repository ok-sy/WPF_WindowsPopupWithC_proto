# 팝업 공통 컴포넌트 프론트 샘플 인수인계 가이드 (TODO69)

기준일: 2026-10-22 (KST) · 대상 폴더: `zero-rule-web/main/src/features/PopupcommonComponent/`
관련 문서: 미리보기 이식 안내 `ADMIN_POPUP_PREVIEW_COMPONENTS.md`, 변환 함수 `ADMIN_POPUP_EDITOR_TRANSFORM.md`, 서버 샘플 `SERVER_SAMPLE_SINGLE_QUERY_API.md`·`SERVER_SAMPLE_BACKEND_RELAY_API.md`

이 문서를 받은 사람이 샘플을 실행하고, 옵션을 바꾸고, 실제 화면에 붙일 수 있도록 다섯 가지를 정리한다.
1) 각 파일을 왜 이렇게 선언했는지 2) 로직 흐름 3) 조절할 수 있는 옵션 4) 옵션을 추가·삭제하는 예시 5) 실제 연동할 때 바뀌는 부분

## 1. 파일과 선언 이유

| 파일 | 선언 이유 |
|---|---|
| `sample/PopupListSample.tsx` | 기존 등록 화면(`RgstPop`)의 "목록 → 신규/수정 → 편집 → 미리보기 → 저장" 흐름을 **서버 없이** 재현하는 예제. 실제 화면에서 API 호출만 바꿔 끼우면 되도록 데이터 공급(목록·저장)을 이 파일 한 곳에 모았다 |
| `sample/PopupSampleEditor.tsx` | 공통 컴포넌트만으로 만든 최소 편집 Dialog. 실제 `PopupEditorDialog`는 일정·대상 그룹·템플릿·API까지 섞여 있어 이식 예제로 읽기 어렵기 때문에, **편집값(state) 하나 → 두 미리보기** 구조만 남긴 축소판을 따로 뒀다 |
| `sample/IS063M02.tsx` | 사진 복원 퍼블리싱 원본. **대조용으로만 보존**(첫 줄 `// @ts-nocheck`만 추가). 저장소에 없는 `IS035Info` 타입·폐쇄망 전역 `n*` CSS에 의존해 그대로는 컴파일되지 않는다 |
| `sample/IS063M02Sample.tsx` | 원본 레이아웃·클래스를 유지하고 공통 기능을 연결한 실제 이식 예제. 원본과 나란히 비교하며 무엇이 바뀌었는지 볼 수 있게 별도 파일로 뒀다 |
| `sample/popupSampleData.ts` | 서버 대신 공급하는 **편집값(AdminPopupDetail)** 6종(TEXT·IMAGE·VIDEO·SURVEY·QUIZ·영상+퀴즈). 조회 응답 형태가 아니라 화면에 바로 넣는 값이라는 점을 분리해 두려고 별도 파일로 뒀다. 샘플이므로 `SAMPLE_FULL_CONTENT_OPTIONS`로 계약상 가능한 content 옵션 키를 모두 싣고, 신규 작성도 `newSamplePopup()`(= `createDefaultPopup()` + 전체 옵션)을 쓴다. 실제 등록 화면 기본값(`createDefaultPopup`)은 바꾸지 않았다 |
| 공통 폴더 나머지 | 에디터(`PopupRichTextEditor`·`PopupRichTextMenu`·`PopupQuestionEditor`·`PopupScheduleFields`), 표시·미리보기(`InlinePopupPreview`·`PopupPreviewDialog`·`PopupPreview`·`SurveyPreview`·`AspectVideoArea`·`PopupRichBlocks`), 변환·계산(`popupEditorTransform`·`popupRichText`·`popupRichTextFormat`·`popupPreviewDialogLayout`·`imagePreviewLayout`·`popupCommon`·`normalizePopupLink`·`popupDemoQuestions`). **관리자 API·등록 부모·sample을 참조하지 않는다**(그래서 다른 화면에 복사해도 따라오는 의존이 없다) |

라우트(`scene/scene-router.tsx`): `/popup-common-sample`(목록 샘플), `/popup-common-sample/is063m02`(IS063M02 샘플). 기존 `/rgst-pop`은 그대로다. 메뉴 노출은 기존 메뉴 등록 절차가 따로 필요하다.

## 2. 로직 흐름

```text
[데이터 공급]  createSamplePopups()  ──(실연동: api.popupAdmin.list({ ctx }) / info({ popupId }) → toEditorPopup(body.popup))
      │
      ▼
[편집 state]   popup: AdminPopupDetail  ← 화면이 가진 유일한 원본(단일 소유자 = 부모 화면)
      │  입력 → setPopup(새 객체)          (입력 객체를 직접 바꾸지 않는다)
      ├──────────► InlinePopupPreview popup={popup}     (우측, 축소 표시)
      ├──────────► PopupPreviewDialog popup={popup}     (버튼으로 여는 실제 크기)
      ▼
[저장]         toSaveRequest(popup, active, targetGroups)  → 요청 객체
               └ 샘플: 화면에 JSON 표시(서버 미전송)   ──(실연동: api.popupAdmin.save)
```

핵심 규칙:
- **편집값은 하나다.** 우측·모달 미리보기는 같은 `popup`을 받기만 하고 값을 바꾸지 않는다. 설문 응답·퀴즈 채점·영상 시청 비율 같은 미리보기 시연 상태는 각 미리보기 내부에만 있고 저장값에 섞이지 않는다.
- **에디터 key 정책.** `PopupRichTextEditor`는 `initialBlocks`를 처음 마운트할 때만 읽는다(입력 중 커서 유지). 그래서 신규 폼 생성·불러오기·유형 전환에서만 `editorKey`를 올려 다시 마운트하고, 글자 입력 중에는 key를 바꾸지 않는다.
- **유형 전환은 `changePopupType`.** 공통 입력값(제목·크기 등)은 유지하고 유형별 필수 값(창 크기·완료 비율·정답 비교 방식)만 맞춘다. 편집 중에는 다른 유형의 content 키도 남겨 두고, 저장 요청을 만들 때(`toSaveRequestPopup`) 해당 유형 키만 남긴다.
- **본문 서식.** 에디터 `onChange(blocks, plainText)` → `content.textBlocks`(서식 기준)와 `content.plainText`(서식 없는 문자열)를 함께 갱신한다. 설문·퀴즈의 제목·설명은 `surveyTitleBlocks/surveyTitle`, `descriptionBlocks/description` 쌍이다.
- **저장 정규화.** `toSaveRequestPopup`이 ID·제목 공백 제거, 유형별 content 키 화이트리스트, URL 정규화, 푸터 정규형(설문·퀴즈는 SUBMIT 고정이라 `footerAction`을 저장하지 않고, 그 밖에는 바로가기일 때만 `footerAction`·`footerLinkUrl` 저장), 날짜 ISO 변환을 한다. 입력 검증(필수값·범위)은 하지 않으므로 부모가 저장 전에 검사한다(샘플: 제목·크기 300 이상).

## 3. 조절 가능한 옵션

### 3.1 공통 컴포넌트 props

| 컴포넌트 | props | 설명 |
|---|---|---|
| `PopupRichTextEditor` | `label`, `initialBlocks`, `onChange(blocks, plainText)`, `disabled?`, `compact?`, `placeholder?` | `compact`는 툴바를 숨긴 짧은 입력(문항·선택지·설명). 서식은 우클릭/'서식' 버튼 패널로 지정 |
| `InlinePopupPreview` | `popup`, `onOpenPreview?`, `onRecommendedSize?`, `title?` | `onOpenPreview`가 있으면 "실제 크기로 보기" 버튼 표시. `title` 기본 "팝업 미리보기" |
| `PopupPreviewDialog` | `popup`, `open`, `onClose`, `recommendedSize?` | `recommendedSize`는 인라인이 계산한 IMAGE 권장 창 크기(첫 표시용, 선택) |
| `PopupQuestionEditor` | `questions`, `quiz`, `passingScore?`, `onChange`, `onPassingScoreChange`, `fixedQuestionScore?`, `hidePassingScore?` | `quiz=true`면 정답·배점·통과 점수 입력 표시. `fixedQuestionScore`(예: 1)면 배점 입력을 숨기고 새 문항도 그 배점, `hidePassingScore`면 통과 점수 입력을 숨김(부모가 계산) |
| `PopupScheduleFields` | `popup`, `onChange` | 게시 기간 안 노출 일정(TODO52-1). 샘플에는 넣지 않았다 |

### 3.2 값으로 조절하는 옵션(편집값 `AdminPopupDetail`)

| 위치 | 키 | 비고 |
|---|---|---|
| 최상위 | `title`, `popupType`, `sizeMode`, `width`/`height`, `widthRatio`/`heightRatio`, `minimumWidth`/`minimumHeight`(300 이상, TODO68), `maximumWidth`/`maximumHeight`, `showHeader`, `showCloseButton`(푸터 버튼 표시), `showFooter`, `showDoNotShowAgain`, `showLater`, `hideDays`, `completionRatio`, `passingScore`, `questions` | 기본값은 `createDefaultPopup()` |
| `content` 공통 | `useBackgroundOverlay`, `backgroundOverlayOpacity`, `popupPosition`, `headerFontSize`/`bodyFontSize`/`footerFontSize`, `footerAction`, `footerLinkUrl` | |
| `content` 유형별 | `CONTENT_KEYS_BY_TYPE`(popupEditorTransform.ts) 참조. 예: TEXT `plainText`·`textBlocks`·`highlightText`…, IMAGE `imageUrl`·`imageSizeMode`…, QUIZ `videoEnabled`·`videoUrl`… | **이 목록에 없는 키는 저장 요청에서 빠진다** |

### 3.3 코드 상수로 조절하는 옵션

| 상수 | 파일 | 함께 맞춰야 하는 곳 |
|---|---|---|
| `richEditorConfig.toolbar.items` | `popupRichText.ts` | 없음(화면 전용). TODO66으로 `removeFormat` 제거됨 |
| `RICH_SIZES`(12~32) | `popupRichText.ts` | 서버 `PopupRichText.SIZES`, WPF 표시·Demo(`DemoOptionsWindow.ServerRichSizes`). 웹만 바꾸면 서버 저장 검증에서 거절된다 |
| `RICH_FONTS`(4종) | `popupRichText.ts` | 서버 `PopupRichText.FONTS`, WPF 글꼴 매핑 |
| `RICH_COLORS`(8계열×5단계) | `popupRichText.ts` | 서버 색 규칙(대문자 `#RRGGBB`)만 맞으면 됨 |
| `POPUP_MIN_WINDOW_SIZE`(300) | `popupCommon.ts` | 서버 `PopupService.POPUP_MIN_WINDOW_SIZE`, WPF `PopupOptions.MinWindowSize` |
| `FONT_SIZE_MIN/MAX`(10~40) | `popupCommon.ts` | 서버 `validateFontSizeOptions`, WPF `PopupOptions.FontSizeMin/Max` |
| `TYPE_OPTIONS` | `sample/IS063M02Sample.tsx` | 화면 선택지만. 유형 자체를 추가하려면 서버·WPF 계약 변경이 필요 |
| `createSamplePopups()`, `newSamplePopup()`, `SAMPLE_FULL_CONTENT_OPTIONS` | `sample/popupSampleData.ts` | 샘플 전용. 옵션 키를 더하면 `CONTENT_KEYS_BY_TYPE`(저장 화이트리스트)과 서버 샘플 `CONTENT_DEFAULTS`도 함께 맞춘다 |

## 4. 옵션을 추가·삭제하는 예시

### 4.1 화면에 기존 옵션 입력 추가 — "다시 보지 않기" 스위치를 IS063M02 샘플에 넣기

계약에 이미 있는 최상위 값이므로 입력만 추가하면 저장·미리보기에 바로 반영된다.

```tsx
// IS063M02Sample.tsx — '나중에 보기' Stack 아래에 추가
<Stack className="nConSectionDiv" direction="row" alignItems="center">
  <Typography className="nConSectionTitle"><Required not />다시 보지 않기</Typography>
  <Switch className="ios-switch" disableRipple checked={popup?.showDoNotShowAgain ?? false} disabled={!popup}
    onChange={(event) => update('showDoNotShowAgain', event.target.checked)} />
</Stack>
```

### 4.2 content 옵션 입력 추가 — 배경 Overlay 불투명도

```tsx
<TextField type="number" label="배경 불투명도(0~1)" value={popup ? contentValue(popup, 'backgroundOverlayOpacity') : ''}
  slotProps={{ htmlInput: { min: 0, max: 1, step: 0.05 } }}
  onChange={(event) => updateContent('backgroundOverlayOpacity', Number(event.target.value))} />
```

`backgroundOverlayOpacity`는 `COMMON_CONTENT_KEYS`에 있으므로 저장된다. **새 content 키**(계약에 없는 키)를 만들 때는 아래 순서가 모두 필요하다.
1. `popupEditorTransform.ts`의 `COMMON_CONTENT_KEYS` 또는 `CONTENT_KEYS_BY_TYPE[유형]`에 키 추가(빠뜨리면 저장 요청에서 조용히 빠진다).
2. 서버 저장 검증·WPF DTO·인터페이스 명세(`POPUP_INTERFACE_SPEC.md`, ALL/MINIMAL)에 추가. 화면 값만으로 계약이 생기지 않는다.
3. 미리보기에 보여야 하면 `PopupPreview.tsx`에서 읽는다.

### 4.3 옵션 빼기 — 유형 선택지에서 "동영상 + 퀴즈" 제거

```ts
// IS063M02Sample.tsx — TYPE_OPTIONS에서 해당 줄 삭제
// { value: 'VIDEO_QUIZ', label: '동영상 + 퀴즈 팝업', title: '동영상 + 퀴즈 컨텐츠' },
```

선택지만 숨기는 것이므로 기존 저장 데이터(영상+퀴즈)를 불러오면 여전히 표시·편집된다. 화면 입력 하나를 빼고 싶을 때(예: 나중에 보기)는 해당 JSX만 지우면 되고, 값은 `createDefaultPopup()` 기본값(false)으로 저장된다.

### 4.4 서식 옵션 추가·삭제

```ts
// popupRichText.ts — 툴바에서 취소선 빼기
toolbar: { items: ['bold', 'italic', 'underline', '|', 'fontColor', 'fontSize', 'fontFamily', '|', 'alignment', 'outdent', 'indent', '|', 'undo', 'redo'] },
// 글자 크기 36 추가: RICH_SIZES에 36 추가 + 서버 PopupRichText.SIZES + WPF/Demo 목록 동시 변경(§3.3)
export const RICH_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36];
```

툴바에서 빼도 우클릭/'서식' 패널(`PopupRichTextMenu.tsx`)에는 남는다. 두 곳 모두에서 빼야 기능이 사라진다. 기존 저장 데이터의 해당 서식은 계속 표시된다.

### 4.5 샘플 데이터 추가

```ts
// popupSampleData.ts — createSamplePopups() 배열에 추가
sample('SAMPLE-TEXT-LINK', '바로가기 공지', { popupType: 'TEXT' },
  { plainText: '자세히 보기', textBlocks: plainTextToBlocks('자세히 보기'), footerAction: 'LINK_AND_CLOSE', footerLinkUrl: 'https://example.com' }),
```

## 5. 실제 연동할 때 바뀌는 부분

| 지점 | 샘플 | 실제 연동 | 참고 구현 |
|---|---|---|---|
| 목록 | `createSamplePopups()` | `api.popupAdmin.list({ ctx })`의 `body`(목록 항목) | `RgstPop.tsx` |
| 편집 시작 | 목록 행 객체 그대로 | `api.popupAdmin.info({ popupId })` → `toEditorPopup(body.popup)` + `body.targetGroups` | `PopupEditorDialog.tsx` |
| 불러오기(템플릿) | 샘플 메뉴 | `PopupTemplateDialog` → `toEditorPopupFromTemplate` | `PopupEditorDialog.tsx` |
| 저장 | `toSaveRequest(popup, true, [])` JSON 표시 | `api.popupAdmin.save(toSaveRequest(popup, active, targetGroups))` + 성공/실패 처리(`handleError`, toast) | `PopupEditorDialog.tsx` |
| 입력 검증 | 제목·크기 300 | `validatePopupSchedule`, `validatePopupQuestions`, 최소·최대 크기, 숨김 일수 등 | `PopupEditorDialog.tsx`의 save |
| 파일 첨부 | `URL.createObjectURL` 미리보기 | 서버 업로드 API → 서버 경로 URL을 `imageUrl`/`videoUrl`에 저장(영상은 `samples/popup-video-range` Range API 규칙) | 서버 구현 필요 |
| 팝업 ID | 고정 `N2609001`/`LOCAL-n` | 서버 채번 또는 입력 규칙 | 확인 필요 |
| 컨텐츠 명(IS063M02) | 화면 값만, 요청에 미포함 | 저장 계약 필드 확정 후 추가(§4.2 절차) | 확인 필요 |
| 퀴즈유형(만점/커트라인/통과·실패) | [확정] 문항 1점 고정(총점 = 문항 수), 만점 통과 = 통과 점수 문항 수(10문항 → 10점), 커트라인 통과 = N개 이상(7개 → 7점), 통과/실패 제출도 통과 점수 N. `withQuizRule`이 미리보기·저장 값에 적용 | 그대로 사용. 단 "실패도 제출"은 현재 WPF 계약에 없음(미통과 시 창 유지·재채점) → 계약 변경 필요 시 별도 결정 | `sample/IS063M02Sample.tsx` |
| 스타일 | `n*` 클래스(전역 CSS 없음) + sx 3단 배치 | 폐쇄망 전역 CSS 적용 후 sx 중복 여부 정리 | 폐쇄망 확인 |
| 권한·메뉴 | 라우트만 등록 | 메뉴 DB 등록·권한 | 기존 절차 |

이식할 때 복사하는 범위: 공통 폴더 전체(`sample` 제외 가능) + `@local/domain` 타입 + `@/lib/urls`(`routerUrlOf`) + 로고 `public/images/popup-header-logo.png` + CKEditor 커스텀 빌드. 자세한 의존성 표는 `ADMIN_POPUP_PREVIEW_COMPONENTS.md` §4.

## 6. 실행·검증

- 화면: 웹 개발 서버에서 `/popup-common-sample`, `/popup-common-sample/is063m02`.
- 자동 검증: `node scripts/verify-popup-common-sample-69.cjs`(서버·라우터 없이 headless Edge, 25건).
