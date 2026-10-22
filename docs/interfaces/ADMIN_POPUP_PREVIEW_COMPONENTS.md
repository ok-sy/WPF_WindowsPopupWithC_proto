# 관리자 팝업 미리보기 컴포넌트 사용·이식 안내

기준일: 2026-10-20 (KST) · 관련: `docs/design/61_관리자_미리보기_컴포넌트화_TODO.md`

팝업 등록 화면의 우측 인라인 미리보기와 **실제 크기로 보기** 모달을 다른 등록 화면에서 쓰기 위한 안내다.
두 컴포넌트는 전달받은 팝업 객체(`AdminPopupDetail`)만 읽으며 저장·조회 API와 등록 폼 state에 의존하지 않는다.
서버 API·DB·WPF 계약은 바뀌지 않았다.

## 1. 구성

| 파일(`zero-rule-web/main/src/features/RgstPop/`) | 역할 |
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
import InlinePopupPreview from '@/features/RgstPop/InlinePopupPreview';
import PopupPreviewDialog from '@/features/RgstPop/PopupPreviewDialog';
import type { Size } from '@/features/RgstPop/imagePreviewLayout';

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

`RgstPop` 폴더 중 미리보기 관련 파일만 복사하면 부족하다. 아래를 함께 확인한다.

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
