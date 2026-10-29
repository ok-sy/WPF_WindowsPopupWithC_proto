# 관리자 팝업 편집 데이터 변환·에디터 연결 이식 안내

기준일: 2026-10-21 (KST) · 관련: `docs/design/64_팝업데이터변환_함수분리_이식가이드_TODO.md`, 미리보기 컴포넌트 안내 `ADMIN_POPUP_PREVIEW_COMPONENTS.md`(TODO61)

신규 콘텐츠 등록·팝업 등록 화면에서 서식 에디터와 우측/모달 미리보기를 재사용할 때 필요한 데이터 구성·변환 함수와 연결 방법을 정리한다.
미리보기 컴포넌트 자체(props·상태·의존성)는 `ADMIN_POPUP_PREVIEW_COMPONENTS.md`를 따른다. 서버 API·DB·WPF 계약은 바뀌지 않았다.

## 1. 책임 분리

| 위치 | 담당 | 넣지 않는 것 |
|---|---|---|
| 부모 화면(예: `PopupEditorDialog.tsx`) | 편집값 state, 입력 이벤트, 에디터 `key`, 모달 열림 상태, 입력 검증 메시지(toast), API 호출·라우팅 | 저장 객체 조합 로직 |
| `popupEditorTransform.ts` | 기본 편집값, 조회 응답·템플릿 → 편집값, 유형 변경, 편집값 → 저장 요청 | React state·API·toast·라우팅·검증 메시지. UI 모듈(React·MUI·`PopupEditorDialog`)을 참조하지 않는다 |
| `popupRichText.ts` | 글자 서식 계약, HTML↔문단/Run Blocks, 일반 문자열 파생·불러오기 정리 | 제목·창 크기·푸터·유형별 content 조합 |
| `PopupRichTextEditor.tsx` | CKEditor 입력, `onChange(blocks, plainText)` 전달 | 부모 state 변경 |
| `InlinePopupPreview.tsx`·`PopupPreviewDialog.tsx` | 편집값 표시(시연 상태는 내부) | 저장 객체 생성 |

## 2. 객체 구분

| 객체 | 형태 | 만드는 곳 → 쓰는 곳 |
|---|---|---|
| 조회 응답 래퍼 | `AdminPopupInfo { popup, targetGroups }` | `api.popupAdmin.info` / 템플릿 조회 → `toEditorPopup(body.popup)` |
| 편집값 | `AdminPopupDetail` | `createDefaultPopup`·`toEditorPopup`·`toEditorPopupFromTemplate`·`changePopupType` → 부모 state |
| 미리보기 popup | 편집값 그대로(`AdminPopupDetail`) | 부모 state → `InlinePopupPreview`·`PopupPreviewDialog`. 별도 변환 함수를 두지 않는다 |
| 저장 요청 body | `PopupSaveRequest { popup, active, targetGroups }` | `toSaveRequest(popup, active, targetGroups)` → `api.popupAdmin.save` |

편집값은 유형을 바꿔도 다른 유형의 입력값을 지우지 않는다. 다른 유형의 content 키는 저장 요청에서만 걸러진다. 모든 함수 입출력은 JavaScript 객체이며 JSON 문자열 parse/stringify는 API 클라이언트 경계에서만 한다.

## 3. 함수

```ts
// zero-rule-web/main/src/features/PopupcommonComponent/popupEditorTransform.ts
type PopupTypeSelection = PopupType | 'VIDEO_QUIZ';                // 동영상+퀴즈 = QUIZ + content.videoEnabled=true
interface PopupSaveRequest { popup: AdminPopupDetail; active: boolean; targetGroups: PopupTargetGroup[] }

createDefaultPopup(now?: Date): AdminPopupDetail                   // 신규 기본값(노출 기간 now ~ 한 달 뒤)
toEditorPopup(loaded: AdminPopupDetail): AdminPopupDetail          // 조회 응답 popup → 편집값
toEditorPopupFromTemplate(template, currentPopupId): AdminPopupDetail  // 템플릿 → 편집값(입력한 팝업 ID 유지, questionTemplateId=null)
changePopupType(previous, selection: PopupTypeSelection): AdminPopupDetail  // 유형 변경
toSaveRequestPopup(popup: AdminPopupDetail): AdminPopupDetail      // 편집값 → 저장 요청 popup
toSaveRequest(popup, active, targetGroups): PopupSaveRequest       // 저장 API body
// 보조: toDateTimeLocal, contentValue, isSubmitPopupType, normalizeImageSizeMode, withDefaultAnswerMatchMode
// [TODO52-1] 일정: WEEKDAYS, parseWeekdays('1,3,5'), describeSchedule(periodMode, repeatDayOfWeek, displayTimes | 요약 문자열)
```

모든 함수는 입력 객체를 바꾸지 않고 새 객체를 돌려준다(동결 입력으로 검증). 입력 검증(필수값·범위·URL 오류 안내)은 하지 않으므로 부모가 `toSaveRequest` 호출 전에 검사한다.

| 함수 | 처리 |
|---|---|
| `toEditorPopup` | `displayOrder` 누락 → 100, QUIZ 주관식 `answerMatchMode` 누락 → `EXACT`, IMAGE 크기 모드 정규화(과거 `FIXED`·빈 값 → `ADAPTIVE`), 구 `content.width/height` → 최상위 `width/height`(TODO58) |
| `changePopupType` | `content.videoEnabled` 설정, `width/height` 누락 시 560×420, 완료 비율(동영상+퀴즈 기본 0.8, VIDEO 유지, 그 밖 null), QUIZ 정답 비교 방식 기본값 |
| `toSaveRequestPopup` | 팝업 ID·제목 공백 제거, 유형별 content 키만 남김, TEXT 하단 설명 URL·푸터 URL 정규화(http/https, 실패 시 빈 값), 푸터 정규형(설문·퀴즈와 `CLOSE`는 키 제거), 노출 기간 ISO 문자열, IMAGE `content.width/height` 제거·`keepAspectRatio`는 FIT_TO_IMAGE만 |

서식 데이터 우선순위는 그대로다. TEXT는 `textBlocks`가 기준이고 `plainText`는 파생값이며, 설문·퀴즈 콘텐츠 제목·설명과 문항·선택지도 서식(`*Blocks`)이 있으면 서버가 일반 문자열을 서식에서 다시 파생한다. 변환 함수는 서식 내용을 고치지 않고 전달한다.

입출력 예(TEXT, 일부 키 생략):

```jsonc
// 편집값(content)
{ "plainText": "굵게 본문", "textBlocks": [{ "alignment": "LEFT", "runs": [{ "text": "굵게", "bold": true }, { "text": " 본문" }] }],
  "bottomDescriptionUrl": " example.com/a ", "imageUrl": "...", "footerAction": "LINK_AND_CLOSE", "footerLinkUrl": "naver.com" }
// toSaveRequestPopup(...).content
{ "plainText": "굵게 본문", "textBlocks": [ ...같음 ], "bottomDescriptionUrl": "https://example.com/a",
  "footerAction": "LINK_AND_CLOSE", "footerLinkUrl": "https://naver.com/" }       // imageUrl 등 다른 유형 키 제외
```

## 4. 에디터 연결 흐름

```
불러온 데이터(info / 템플릿)
  → toEditorPopup / toEditorPopupFromTemplate → 부모 state(popup) + editorKey + 1
  → PopupRichTextEditor initialBlocks = readTextBlocks(content.textBlocks) ?? plainTextToBlocks(content.plainText)
  → 입력 시 onChange(blocks, plainText) → setPopup(이전 값 + content.textBlocks/plainText)
  → 같은 popup을 InlinePopupPreview·PopupPreviewDialog에 전달
  → 저장 버튼: 부모 검증 → api.popupAdmin.save(toSaveRequest(popup, active, targetGroups))
```

- `initialBlocks`는 **최초 마운트 입력**이다. 에디터는 이후 props 변화를 다시 읽지 않는다(커서·선택 범위 보존).
- 다른 콘텐츠 불러오기·템플릿 적용·신규로 다시 열기처럼 내용을 통째로 바꿀 때만 에디터 `key`를 바꿔 다시 마운트한다.
- 일반 입력 중에는 `key`를 바꾸지 않는다. `onChange`에서 부모 state만 갱신한다.
- 설문·퀴즈 콘텐츠 제목·설명은 같은 방식으로 `surveyTitleBlocks`·`descriptionBlocks`(초기값 `richBlocksOrNull(...) ?? plainTextToBlocks(...)`, 글자가 없으면 서식 null)를 쓴다. 문항·선택지는 `PopupQuestionEditor`가 담당한다.
- 미리보기의 설문 응답·채점·시청 상태는 미리보기 내부 상태이며 편집값·저장 요청에 들어가지 않는다.

## 5. 최소 부모 예시

```tsx
import { useState } from 'react';
import type { AdminPopupDetail, PopupTargetGroup } from '@local/domain';
import PopupRichTextEditor from '@/features/PopupcommonComponent/PopupRichTextEditor';
import InlinePopupPreview from '@/features/PopupcommonComponent/InlinePopupPreview';
import PopupPreviewDialog from '@/features/PopupcommonComponent/PopupPreviewDialog';
import type { Size } from '@/features/PopupcommonComponent/imagePreviewLayout';
import { plainTextToBlocks, readTextBlocks } from '@/features/PopupcommonComponent/popupRichText';
import { contentValue, createDefaultPopup, toEditorPopup, toSaveRequest } from '@/features/PopupcommonComponent/popupEditorTransform';

export default function MyTextPopupForm({ api }: { api: any }) {
  const [popup, setPopup] = useState<AdminPopupDetail>(() => createDefaultPopup());
  const [targetGroups, setTargetGroups] = useState<PopupTargetGroup[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);

  const load = async (popupId: string) => {
    const { body } = await api.popupAdmin.info({ popupId });
    setPopup(toEditorPopup(body.popup)); setTargetGroups(body.targetGroups ?? []);
    setEditorKey((key) => key + 1);                       // 새 initialBlocks로 에디터 다시 열기
  };
  const save = async () => {
    if (!popup.popupId.trim() || !popup.title.trim()) return;   // 검증·안내는 부모 책임
    await api.popupAdmin.save(toSaveRequest(popup, true, targetGroups));
  };

  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    <PopupRichTextEditor key={editorKey} label="일반 텍스트"
      initialBlocks={readTextBlocks(popup.content.textBlocks) ?? plainTextToBlocks(contentValue(popup, 'plainText'))}
      onChange={(blocks, plainText) => setPopup((prev) => ({ ...prev, content: { ...prev.content, textBlocks: blocks, plainText } }))} />
    <div style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
      <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setRecommended} />
    </div>
    <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={recommended} />
  </div>;
}
```

저장소 안 실행 예시: `scripts/verify-popup-transform-64-entry.tsx`의 `TransformHost`(전체 등록 화면 없이 에디터·우측/모달 미리보기·변환 함수 연결, 실제 저장 대신 저장 요청 객체를 화면과 `window.saveRequest()`로 확인). 실행: `node scripts/verify-popup-transform-64.cjs`.

## 5-1. 선택 필드 추출 (`pickPopupFields`, 2026-10-30)

근거: [독립 재사용·선택 필드 추출 TODO](../design/20261030_PopupcommonComponent_독립재사용_선택필드추출_TODO.md). 공통 모듈은 특정 테이블·API·저장 형식과 무관하며, `toSaveRequest()`는 proto 사용 사례 중 하나다.

| 함수 | 입력 → 반환 | 설명 |
|---|---|---|
| `pickPopupFields(source, { topLevelKeys?, contentKeys?, questionKeys? })` | → `{ ...최상위 키, content?, questions? }` | 최상위·content·각 문항에서 고른 키만 **값 그대로** 새 객체로. 준 영역만 결과에 포함(빈 배열이면 빈 값), 키가 실제로 없으면 생략·있으면 null·false·0·빈 문자열 보존, 문항 순서 유지, 고른 중첩 값은 원본 참조(얕은 복사). 날짜 변환·키 이름 변경·기본값·검증·저장 요청 생성 없음. 타입: `topLevelKeys`는 content·questions 제외 `AdminPopupDetail` 키, `questionKeys`는 `PopupQuestion` 키. proto 저장 기준이 필요할 때만 `toSaveRequestPopup(popup)` 결과를 넘긴다 |

- `PopupScheduleFields`는 일정 전용 `value: PopupScheduleValue`(+ `showPeriod`)로 단독 사용한다. 기존 `popup` prop은 호환용.
- 테스트: `scripts/verify-popup-pick-fields.cjs`(Node 25건), 타입 테스트 `__typetests__/pickPopupFields.typetest.ts`(웹 type-check).
- 서버 없는 샘플: `sample/PopupIndependentSamples.tsx`(일정만 / RichText + content 일부 / 문항 일부 / 세 영역 조합). 관리자 '팝업 관리 > PopupcommonComponent 가이드'의 '독립 재사용·필드 추출' 탭에서 실행된다.

## 6. 이식 시 필요한 파일·의존성

미리보기 컴포넌트 의존성(`ADMIN_POPUP_PREVIEW_COMPONENTS.md` §4)에 아래를 더한다.

| 구분 | 항목 |
|---|---|
| 변환 | `popupEditorTransform.ts`(의존: `normalizePopupLink.ts`, `popupCommon.ts`, `@local/domain` 타입만), 선택 필드 추출 `pickPopupFields`(같은 파일) |
| 에디터 | `PopupRichTextEditor.tsx`, `PopupRichTextMenu.tsx`, `popupRichTextFormat.ts`, `popupRichText.ts`, (설문·퀴즈 서식) `PopupRichBlocks.tsx`의 `richBlocksOrNull`, (문항) `PopupQuestionEditor.tsx` |
| 공용 타입 | `@local/domain`의 `AdminPopupDetail`·`AdminPopupInfo`·`PopupTargetGroup`·`PopupQuestion`·`PopupType`·`PopupDateValue` |
| 경로 별칭 | `@/` → `zero-rule-web/main/src/`, `@local/domain` → workspace 패키지 `sub/domain` |
| 패키지 | `ckeditor5` 49(licenseKey 'GPL'), `@ckeditor/ckeditor5-react` 12, 공통 엔진 `src/components/ckeditor/`(`ckeditorEngine.ts`·`index.ts` — 엔진·플러그인·CSS는 여기서만 불러온다. 다른 출처로 한 번 더 불러오면 `ckeditor-duplicated-modules`), `next/dynamic`(Next 밖에서는 `React.lazy` 대체 — 검증 하네스의 `next-dynamic-shim.js` 참고), `react` 18, `@mui/material`·`@mui/icons-material` 6 |
| 리소스·CSS | 헤더 로고 `public/images/popup-header-logo.png`, 글꼴은 `popupRichText.ts`의 `RICH_FONTS` CSS 이름(맑은 고딕·굴림·돋움·바탕)을 사용자 PC 글꼴로 표시. 글로벌 CSS 추가 없음(에디터 CSS `ckeditor5/ckeditor5.css`는 공통 엔진 모듈이 불러옴. Next 밖 번들러는 CSS 로더 필요 — 하네스 `scripts/verify-css-loader.cjs` 참고) |

변환 모듈은 `PopupEditorDialog`를 참조하지 않는다. 새 content 옵션을 추가하면 `popupEditorTransform.ts`의 유형별 키 목록(`COMMON_CONTENT_KEYS`·`CONTENT_KEYS_BY_TYPE`)에도 넣어야 저장된다.
