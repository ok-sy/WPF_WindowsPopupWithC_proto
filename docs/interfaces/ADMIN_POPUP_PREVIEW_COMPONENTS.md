# 관리자 팝업 미리보기 컴포넌트 사용·이식 안내

기준일: 2026-10-20 (KST) · 관련: `docs/design/61_관리자_미리보기_컴포넌트화_TODO.md`

팝업 등록 화면의 우측 인라인 미리보기와 **실제 크기로 보기** 모달을 다른 등록 화면에서 쓰기 위한 안내다.
두 컴포넌트는 전달받은 팝업 객체(`AdminPopupDetail`)만 읽으며 저장·조회 API와 등록 폼 state에 의존하지 않는다.
서버 API·DB·WPF 계약은 바뀌지 않았다.

## 1. 구성

| 파일(`zero-rule-web/main/src/features/PopupcommonComponent/`) | 역할 |
|---|---|
| `InlinePopupPreview.tsx` | 제목 + "실제 크기로 보기" 버튼 + `PopupPreview`. 부모 영역의 남은 높이를 채운다 |
| `PopupPreviewDialog.tsx` | 실제 크기 모달. 크기 모드·브라우저 창 크기 변경·9개 위치·배경 Overlay·배경 클릭 차단·Esc/종료 버튼 |
| `popupPreviewDialogLayout.ts` | 모달 크기(`previewDialogSize`)·위치(`previewPositionAlign`)·가장자리 여백(`previewEdgeMargin`)·Overlay 값(`previewOverlay`) 순수 함수 |
| `PopupPreview.tsx` | 공통 렌더러(헤더·콘텐츠·푸터, TEXT/IMAGE/VIDEO/SURVEY/QUIZ). 두 컴포넌트가 함께 쓴다 |

### Props

```ts
interface InlinePopupPreviewProps {
  popup: AdminPopupDetail;
  onOpenPreview?: () => void;                         // 있으면 "실제 크기로 보기" 버튼 표시
  onRecommendedSize?: (size: Size | null) => void;    // IMAGE 권장 창 크기(FIT_TO_IMAGE 등). 없으면 null
  title?: string;                                     // 기본 "팝업 미리보기"
}
interface PopupPreviewDialogProps {
  popup: AdminPopupDetail;
  open: boolean;
  onClose: () => void;                                // 종료 버튼·Esc·(Overlay 꺼짐 시) 배경 클릭·푸터 닫기
  recommendedSize?: Size | null;                      // 인라인이 계산한 권장 크기(선택). 모달 계산 전 첫 표시용
}
```

## 2. 최소 사용 예시

```tsx
import { useState } from 'react';
import type { AdminPopupDetail } from '@local/domain';
import InlinePopupPreview from '@/features/PopupcommonComponent/InlinePopupPreview';
import PopupPreviewDialog from '@/features/PopupcommonComponent/PopupPreviewDialog';
import type { Size } from '@/features/PopupcommonComponent/imagePreviewLayout';

export default function MyPopupForm({ popup }: { popup: AdminPopupDetail }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  return <>
    {/* 높이가 정해진 부모 안에 둔다(미리보기가 남은 높이를 채움). */}
    <div style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
      <InlinePopupPreview popup={popup} onOpenPreview={() => setPreviewOpen(true)} onRecommendedSize={setRecommended} />
    </div>
    <PopupPreviewDialog popup={popup} open={previewOpen} onClose={() => setPreviewOpen(false)} recommendedSize={recommended} />
  </>;
}
```

- 모달만 쓸 때는 `recommendedSize`를 생략해도 된다. 모달 안 `PopupPreview`가 IMAGE 권장 크기를 직접 계산한다.
- 저장소 안 실행 예시: `scripts/verify-popup-preview-61-entry.tsx`(등록 화면 없이 샘플 객체로 두 컴포넌트를 표시하는 최소 호스트).

## 3. 데이터·상태 규칙

- `popup`의 단일 소유자는 부모 화면이다. 두 미리보기는 같은 최신 객체를 받고 값을 바꾸지 않는다(검증 스크립트에서 동결 객체로 확인).
- 설문 응답·퀴즈 채점·"예제 문항 보기"·시청 비율 슬라이더는 각 `PopupPreview` 내부 시연 상태다. 인라인과 모달은 서로 공유하지 않으며 저장 요청에 들어가지 않는다.
- 모달을 닫으면 내용이 언마운트되어 다시 열 때 시연 상태가 초기화된다. 문항·팝업 ID가 바뀌어도 초기화된다.
- 두 미리보기가 동시에 열려 있으면 VIDEO+QUIZ 영상 영역(`AspectVideoArea`)이 각각 메타데이터만 읽는다(`preload="metadata"`, 음소거, 자동 재생 없음).
- 등록 화면(`PopupEditorDialog`)은 다시 열 때 모달 열림 상태를 닫힘으로 초기화한다.
- [TODO67] `PopupPreviewDialog`는 deprecated `BackdropProps`·`PaperProps` 대신 Dialog `slotProps` 한 객체에 `backdrop`(Overlay 배경 sx)과 `paper`(일반 모달 크기·최대 크기·여백·overflow, FULLSCREEN은 `undefined`)를 함께 넘긴다. 6.4.1 미만 MUI에서는 Dialog `slotProps.paper`가 없으므로 이식 전 설치 버전을 확인한다.

```tsx
// 변경 전(ts6385): BackdropProps={{ sx: backdropSx }} PaperProps={fullScreen ? undefined : { sx: paperSx }}
<Dialog slotProps={{ backdrop: { sx: backdropSx }, paper: fullScreen ? undefined : { sx: paperSx } }} />
```
- [TODO68] 실제 크기 모달과 IMAGE 권장 창 크기는 `popupCommon.ts`의 `POPUP_MIN_WINDOW_SIZE`(300)·`popupMinimumSize`로 최종 창 하한 300×300을 WPF와 같은 순서(하한 → 설정 최대값 → 화면 상한)로 적용한다. 인라인 축소 표시의 외형 크기는 300 이상으로 강제하지 않는다. 이전 모달 전용 하한(320×260)은 제거했다.

## 4. 이식 시 필요한 의존성

`PopupcommonComponent` 폴더(TODO69, 기존 `RgstPop`에서 이동) 중 미리보기 관련 파일만 복사하면 부족하다. 아래를 함께 확인한다.

| 구분 | 항목 |
|---|---|
| 같은 폴더 파일 | `InlinePopupPreview.tsx`, `PopupPreviewDialog.tsx`, `popupPreviewDialogLayout.ts`, `PopupPreview.tsx`, `SurveyPreview.tsx`, `AspectVideoArea.tsx`, `PopupRichBlocks.tsx`, `popupRichText.ts`, `popupCommon.ts`, `popupDemoQuestions.ts`, `normalizePopupLink.ts`, `imagePreviewLayout.ts` |
| 공용 타입 | `@local/domain`의 `AdminPopupDetail`·`PopupQuestion`·`PopupDateValue`·`PopupType` (`zero-rule-web/sub/domain/src/model/PopupAdmin.ts`, `model/index.ts` → `src/index.ts`의 `export type * from './model'`) |
| 경로 별칭 | `@/` → `zero-rule-web/main/src/`, `@local/domain` → workspace 패키지 `sub/domain` |
| 앱 모듈 | `@/lib/urls`의 `routerUrlOf`(헤더 로고 경로). 다른 앱에서는 같은 이름의 함수로 대체하거나 로고 경로를 바꾼다 |
| 리소스 | `zero-rule-web/main/public/images/popup-header-logo.png` |
| 패키지 | `react`·`react-dom` 18, `@mui/material` **6.4.1 이상**(Dialog `slotProps.backdrop`·`slotProps.paper`, TODO67), `@mui/icons-material` 6(`Preview`, `PlayCircleOutline`). 저장소 검증 버전: lockfile 기준 `@mui/material`·`@mui/system`·`@mui/icons-material` 6.5.0, `@emotion/react` 11.14.0, `react` 18.3.1 |
| 사용하지 않음 | 저장 요청 정규화·JSON 변환(`popupEditorTransform.ts`, TODO64), CKEditor 편집기, 관리자 API 클라이언트 |

`normalizePopupLink`는 푸터 바로가기 URL 확인에만 쓰며 이번 분리에서 URL 정책은 바꾸지 않았다.

편집값 구성·저장 요청 변환과 에디터 연결은 `ADMIN_POPUP_EDITOR_TRANSFORM.md`(TODO64)를 함께 본다. 미리보기에는 편집값을 그대로 전달하며 별도 변환 함수가 없다.

## 5. 공통 폴더와 샘플 페이지 (TODO69)

경로: `zero-rule-web/main/src/features/PopupcommonComponent/` (폴더명 대소문자 그대로).

| 구분 | 파일 | 비고 |
|---|---|---|
| 에디터 | `PopupRichTextEditor.tsx`, `PopupRichTextMenu.tsx`, `popupRichText.ts`, `popupRichTextFormat.ts`, `PopupQuestionEditor.tsx`, `PopupScheduleFields.tsx` | CKEditor 커스텀 빌드 필요(`next/dynamic` 동적 import) |
| 표시·미리보기 | `PopupRichBlocks.tsx`, `InlinePopupPreview.tsx`, `PopupPreviewDialog.tsx`, `PopupPreview.tsx`, `SurveyPreview.tsx`, `AspectVideoArea.tsx`, `popupPreviewDialogLayout.ts`, `imagePreviewLayout.ts` | |
| 변환·공용 | `popupEditorTransform.ts`(TODO64), `popupCommon.ts`, `normalizePopupLink.ts`, `popupDemoQuestions.ts`, `index.ts`(진입점) | |
| 샘플 | `sample/PopupListSample.tsx`(목록 기반), `sample/PopupSampleEditor.tsx`(공통 컴포넌트만으로 만든 편집 화면), `sample/popupSampleData.ts`(로컬 편집값 6종) | 서버·인증 없이 동작 |

- 공통 폴더는 관리자 API(`@/provider`)·등록 부모(`features/RgstPop`)·`sample`을 참조하지 않는다. 실제 등록 화면(`RgstPop.tsx`, `PopupEditorDialog.tsx`, 관리자 API를 쓰는 `PopupTemplateDialog.tsx`·`PopupQuestionTemplatePicker.tsx`)은 `features/RgstPop`에 남고 공통 폴더를 import한다. 복제본·임시 re-export는 두지 않았다.
- 타입과 HTTP 클라이언트 구분: 공통 컴포넌트는 `@local/domain`의 **타입**(`AdminPopupDetail` 등)만 쓴다. 관리자 서버 호출(`api.popupAdmin.*`, `@/provider` `useApi`)은 부모 화면 책임이다.
- 라우트: `scene-router.tsx`에 `/popup-common-sample`(팝업 공통 컴포넌트 샘플)을 추가했다. 기존 `/rgst-pop`은 그대로다. sample 폴더의 TSX만으로 URL이 생기지 않으며, 메뉴 노출이 필요하면 기존 메뉴 등록 절차를 따른다(메뉴 DB 등록은 이번 범위 밖).
- 데이터 흐름(목록 샘플): `createSamplePopups()` → 행 `수정` → `PopupSampleEditor`(state 하나) → 같은 객체를 `InlinePopupPreview`·`PopupPreviewDialog`에 전달 → `저장` 시 `toSaveRequest(popup, true, [])` 결과를 화면에 표시하고 메모리 목록만 갱신(서버 미전송). 실제 연결은 목록 `api.popupAdmin.list`, 편집 시작 `api.popupAdmin.info → toEditorPopup`, 저장 `api.popupAdmin.save(toSaveRequest(...))`로 바꾼다.
- 단독 사용 최소 예: 에디터만은 `PopupRichTextEditor`(initialBlocks·onChange), 우측 미리보기만은 `InlinePopupPreview popup={...}`, 모달만은 `PopupPreviewDialog popup open onClose`. 어느 것도 등록 부모·API를 요구하지 않는다(`scripts/verify-*-entry.tsx`가 각각의 단독 호스트 예시).
- TODO66(서식/색 초기화 버튼 없음)·TODO67(Dialog `slotProps`)·TODO68(최소 300×300)은 같은 공통 파일을 쓰므로 샘플에도 그대로 적용된다. 샘플 편집 Dialog도 `slotProps.paper`·`slotProps.htmlInput`을 쓴다.
- IS063M02 연동 샘플(69-5~69-7): `sample/IS063M02.tsx`는 사진 복원 퍼블리싱 원본(대조용, 첫 줄 `// @ts-nocheck`만 추가 — 저장소에 없는 `IS035Info` 타입·폐쇄망 전역 `n*` CSS 의존), `sample/IS063M02Sample.tsx`는 원본 레이아웃·클래스에 공통 기능을 연결한 샘플(라우트 `/popup-common-sample/is063m02`).
  - 연결: BbsCKEditor 자리 → `PopupRichTextEditor`(본문·설명), 우측 '미리보기' → `InlinePopupPreview`, 미리보기 버튼 → `PopupPreviewDialog`, 문항 영역 → `PopupQuestionEditor`, 저장 → `toSaveRequest`(서버 미전송).
  - 정리한 원본 연결 이슈: 모든 에디터가 공유하던 `inputData` → 필드별 편집값, 문항 간 공유되던 라디오 `selectedValue` → 문항별 정답 선택, 숫자 Select 값(1~7)과 문자열 `'2'` 비교 → 계약 문자열 값, `FormControlLabel` 단독 `label`·미연결 추가/삭제 버튼 → 문항 편집기 기능으로 대체, 크기 '최소 200' → 300(TODO68). 신규/불러오기/유형 전환에만 편집기 key를 바꿔 입력 중 커서를 유지한다.
  - 정하지 않은 정책(확인 필요): '컨텐츠 명'은 현재 저장 계약에 필드가 없어 요청에 넣지 않는다. [확정] '퀴즈유형': 문항 1점 고정(총점 = 문항 수), 만점 통과 = 통과 점수 문항 수(10문항 → 10점), 커트라인 통과 = N개 이상(7개 → 7점), 통과/실패 제출도 통과 점수 N. 샘플은 배점 입력을 숨기고(`fixedQuestionScore=1`) 통과 점수를 유형에서 계산한다(`hidePassingScore`). [확정] '통과/실패 제출'도 미달(실패)이면 제출하지 못한다(WPF 재채점, 통과 시에만 SUBMITTED). 샘플은 안내 문구만 표시한다. 파일 첨부는 브라우저 object URL 미리보기만 하며 서버 업로드·서버 경로 URL 생성은 서버 구현이다.
- 검증: `node scripts/verify-popup-common-sample-69.cjs` 25건(목록 샘플 15: 목록 6종·수정·제목/본문 → 우측·모달 반영·재마운트 없음·저장 요청·설문 시연 응답 미혼입·유형 전환·영상+퀴즈 / IS063M02 샘플 10: 원본 구조 유지·폼 없이 저장 거절·유형별 제목·우측/모달 반영·300 미만 거절·저장 요청 일치·컨텐츠 명 미주입·유형 전환 시 공통값 유지·문항별 정답 독립·취소 초기화).
