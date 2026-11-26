# 관리자 팝업 미리보기 컴포넌트 사용·이식 안내

기준일: 2026-10-20 (KST) · 관련: `docs/design/61_관리자_미리보기_컴포넌트화_TODO.md`

팝업 등록 화면의 우측 인라인 미리보기와 **실제 크기로 보기** 모달을 다른 등록 화면에서 쓰기 위한 안내다.
두 컴포넌트는 전달받은 팝업 객체(`AdminPopupDetail`)만 읽으며 저장·조회 API와 등록 폼 state에 의존하지 않는다.
서버 API·DB·WPF 계약은 바뀌지 않았다.

## 1. 구성

| 파일(`zero-rule-web/main/src/features/PopupcommonComponent/`) | 역할 |
|---|---|
| `InlinePopupPreview.tsx` | 제목 + "실제 크기로 보기" 버튼 + `PopupPreview`. 부모 영역의 남은 높이를 채운다. 부모 높이가 없으면 미리보기 영역을 최소 320px로 표시한다. 예시 표시(`showPlaceholders`)는 실제 크기 모달과 같이 기본 OFF |
| `PopupPreviewDialog.tsx` | 실제 크기 모달. 값이 없는 제목·설명·이미지에 입력 안내 문구를 표시하지 않는다. 영상 미첨부여도 영상 영역은 첨부 후와 같은 크기의 검정 영역 + 재생 아이콘으로 자리를 유지하고 '영상 재생 영역' 문구만 숨긴다(`showPlaceholders` 기본 false. 가이드·샘플만 켬, 2026-11-18). 크기 모드·9개 위치·배경 Overlay·Esc/종료 버튼. TODO61-23(2026-11-24): 기준 화면은 해상도 13종(1280×720~3840×2160) × Windows 배율(100·125·150·175%)이며, 크기·위치는 DIP 작업 영역(해상도 ÷ 배율, 작업 표시줄 40 제외)으로 WPF와 같이 계산한다. 처음에는 내 모니터와 같은 해상도·배율(목록에 `*` 표시), 없으면 1920×1080·100%. 선택한 해상도의 가상 데스크톱(작업 영역 흰색·작업 표시줄 검정·바깥 검정 30%)을 물리 크기로 그리고 팝업을 WPF와 같은 크기·위치로 놓는다. 배율은 화면 크기를 유지한 채 안쪽을 확대해 보여 준다. 브라우저보다 크면 축소 없이 스크롤(처음 스크롤은 팝업 가운데). 선택박스·종료 버튼은 흰 도구 패널에 있고 스크롤바 폭만큼 안쪽에 둔다. `recommendedSize` prop은 호환용으로 남아 있고 쓰지 않는다(모달이 선택한 작업 영역으로 다시 계산) |
| `popupPreviewDialogLayout.ts` | 모달 크기(`previewDialogSize`)·위치(`previewPositionAlign`)·가장자리 여백(`previewEdgeMargin`)·Overlay 값(`previewOverlay`) 순수 함수 |
| `PopupPreview.tsx` | 공통 렌더러(헤더·콘텐츠·푸터, TEXT/IMAGE/VIDEO/SURVEY/QUIZ). 두 컴포넌트가 함께 쓴다. 선택 prop `workArea`로 IMAGE 권장 창 크기 계산 작업 영역을 받는다(없으면 현재 모니터 작업 영역, TODO61-23). VIDEO 설명은 `descriptionBlocks` 서식이 있으면 문단 정렬·서식으로 그린다(2026-11-24). 영상 아래 컨트롤 모형 줄(▶ 00:00 / 00:00 · 1.0× · 전체화면)은 삭제했다 |
| `videoFixedDescription.ts` | 동영상·동영상+퀴즈 고정 안내 문구(`VIDEO_FIXED_DESCRIPTION`). `applyVideoFixedDescription()`은 미리보기·저장 값(effective)의 `descriptionBlocks` 맨 앞에 오른쪽 정렬 문단으로 붙이고 `description`을 '고정 문구
사용자 설명'으로 만든다(중복 없이). `stripVideoFixedDescription()`은 불러온 값에서 떼어 에디터에 사용자 입력만 보이게 한다. 문구를 바꾸면 이전 문구를 `PREVIOUS_VIDEO_FIXED_DESCRIPTIONS`에 넣어 기존 데이터도 떼어 낸다 |
| `imagePreviewLayout.ts` `adaptiveWindowForImage()` · `useNaturalImageSize.ts` | IMAGE ADAPTIVE(창 우선)에서 이미지 칸 바깥 띠가 생기지 않는 창 크기 계산(가로 → 세로, 가로가 원본보다 크면 원본 기준·limited, 창 최대를 넘으면 가로·세로를 함께 줄이고 cappedByMaximum — 이때 가로도 결과 값으로 넣는다, 창 가로는 최소 300 이상). 이미지 원본 크기 읽기 훅. RgstPop·IS063 샘플의 '이미지에 맞춰 세로/높이 자동'·'이미지 크기에 맞추기'가 쓴다(신규는 자동 켬, 수정·불러오기는 끔, 두 경로 같은 결과) |
| `popupDefaults.ts` | 웹 기본값 단일 출처 `POPUP_DEFAULTS`(창 560×420·비율 0.7×0.75·최소 300·최대 1200×900, 헤더·푸터, 배경 어둡기 0.45, 음량 0.7, 동영상+퀴즈 완료 0.8)와 입력 범위 `POPUP_INPUT_RANGES`·계약 범위 `POPUP_CONTRACT_RANGES`. 공통코드 0101이 있으면 `loadPopupDefaultCodes`·`applyPopupDefaultCodes`로 덮어쓴다(계약 범위 안에서만, 잘못된 값은 무시) |
| `PopupNumberField.tsx` | 숫자 입력칸. 입력 중 글자를 따로 들고 있어 마지막 자리까지 지울 수 있다. 빈 칸 처리 `empty`: commit(즉시 null)·onBlur(입력을 마칠 때 null)·keep(이전 값으로 되돌림) |
| `popupPreviewFallback.ts` | 미리보기 전용 표시값 채우기 `withPreviewFallback`·`PREVIEW_FALLBACK`. 화면 state에 없는 창 크기·최소·최대·헤더·푸터 표시값만 `POPUP_DEFAULTS`(공통코드 0101 반영)에서 읽는 시점 값으로 채운다. 저장 값에는 섞지 않는다 |
| `PopupQuizRuleFields.tsx` | 퀴즈 유형(공통코드 0090)과 통과 기준 개수 입력 묶음. 기준 개수는 `PopupNumberField`로 받는다 |
| `popupQuizRule.ts` | 퀴즈 통과 유형(`QuizRule`: 만점형·커트라인형·참여형)과 기준 개수·채점 문항 수 계산, 저장 값 반영(`withQuizRule`) |
| `popupQuestionCodes.ts` | 답안 유형(0089)·퀴즈 유형(0090) 공통코드 상수와 코드 ↔ 퀴즈 유형 변환. 조회 함수는 부모가 넘긴다(`loadPopupQuestionCodes`) |
| `popupQuizResultNotice.ts` | QUIZ 결과 안내 문구(커트라인형·만점형·참여형). WPF `QuizResultNotice.cs`와 같은 판별·문구 |
| `popupByteLimit.ts` | 선택지 문구 UTF-8 바이트 제한(`OPTION_TEXT_MAX_BYTES` 300, 폐쇄망 OPTION_TEXT VARCHAR2(300 BYTE)) |

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
// 공통 기능은 진입점(index.ts) 한 곳에서 가져온다(2026-11-26, TODO69 후속).
import { InlinePopupPreview, PopupPreviewDialog, type Size } from '@/features/PopupcommonComponent';

export default function MyPopupForm({ popup }: { popup: AdminPopupDetail }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recommended, setRecommended] = useState<Size | null>(null);
  return <>
    {/* 부모는 grid·flex·일반 div 모두 가능하다. 높이를 정하면 남은 높이를 채우고, 없으면 미리보기 영역 최소 320px로 표시한다. */}
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
- 설문 응답·퀴즈 채점은 각 `PopupPreview` 내부 시연 상태다(시청 비율 슬라이더는 2026-11-13 삭제, VIDEO·VIDEO+QUIZ는 시청 기준 충족 상태로 표시). 인라인과 모달은 서로 공유하지 않으며 저장 요청에 들어가지 않는다.
- 모달을 닫으면 내용이 언마운트되어 다시 열 때 시연 상태가 초기화된다. 문항·팝업 ID가 바뀌어도 초기화된다.
- 두 미리보기가 동시에 열려 있으면 VIDEO+QUIZ 영상 영역(`AspectVideoArea`)이 각각 메타데이터만 읽는다(`preload="metadata"`, 음소거, 자동 재생 없음).
- 등록 화면(`PopupEditorDialog`)은 다시 열 때 모달 열림 상태를 닫힘으로 초기화한다.
- [TODO67] `PopupPreviewDialog`는 deprecated `BackdropProps`·`PaperProps` 대신 Dialog `slotProps` 한 객체에 `backdrop`(Overlay 배경 sx)과 `paper`(일반 모달 크기·최대 크기·여백·overflow, FULLSCREEN은 `undefined`)를 함께 넘긴다. 6.4.1 미만 MUI에서는 Dialog `slotProps.paper`가 없으므로 이식 전 설치 버전을 확인한다.

```tsx
// 변경 전(ts6385): BackdropProps={{ sx: backdropSx }} PaperProps={fullScreen ? undefined : { sx: paperSx }}
<Dialog slotProps={{ backdrop: { sx: backdropSx }, paper: fullScreen ? undefined : { sx: paperSx } }} />
```
- [TODO68] 실제 크기 모달과 IMAGE 권장 창 크기는 `popupCommon.ts`의 `popupWindowBounds`(하한 `POPUP_MIN_WINDOW_SIZE` 300 → 설정 최대값 → 작업 영역 90%)로 WPF와 같은 순서를 적용한다. 2026-11-25부터 IMAGE도 설정 최대값을 쓰고, 화면 비율(RATIO)도 90%가 상한이다(FULLSCREEN 제외). 인라인 축소 표시의 외형 크기는 300 이상으로 강제하지 않는다. 이전 모달 전용 하한(320×260)은 제거했다.

## 4. 이식 시 필요한 의존성

`PopupcommonComponent` 폴더(TODO69, 기존 `RgstPop`에서 이동) 중 미리보기 관련 파일만 복사하면 부족하다. 아래를 함께 확인한다.

| 구분 | 항목 |
|---|---|
| 같은 폴더 파일 | `InlinePopupPreview.tsx`, `PopupPreviewDialog.tsx`, `popupPreviewDialogLayout.ts`, `PopupPreview.tsx`, `PopupFooter.tsx`, `popupLayout.ts`, `SurveyPreview.tsx`, `AspectVideoArea.tsx`, `PopupRichBlocks.tsx`, `popupRichText.ts`, `popupCommon.ts`, `popupDemoQuestions.ts`, `normalizePopupLink.ts`, `imagePreviewLayout.ts` |
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
| 표시·미리보기 | `PopupRichBlocks.tsx`, `InlinePopupPreview.tsx`, `PopupPreviewDialog.tsx`, `PopupPreview.tsx`, `PopupFooter.tsx`(푸터·푸터 버튼), `popupLayout.ts`(공통 수치·색), `SurveyPreview.tsx`, `AspectVideoArea.tsx`, `popupPreviewDialogLayout.ts`, `imagePreviewLayout.ts` | |
| 변환·공용 | `popupEditorTransform.ts`(TODO64), `popupCommon.ts`, `normalizePopupLink.ts`, `popupDemoQuestions.ts`, `index.ts`(진입점) | |
| 샘플 | `sample/PopupListSample.tsx`(목록 기반), `sample/PopupSampleEditor.tsx`(공통 컴포넌트만으로 만든 편집 화면), `sample/popupSampleData.ts`(로컬 편집값 6종) | 서버·인증 없이 동작 |
| 가이드 | `guide/PopupCommonGuide.tsx`(화면), `guide/guideData.ts`(프로세스·컴포넌트·함수 설명), `guide/guideNotices.ts`(공지) | 라우트 `/popup-common-guide`, 메뉴 `db/oracle/20_popup_common_guide_menu_oracle.sql`. 서버 API 미사용 |

- 공통 폴더는 관리자 API(`@/provider`)·등록 부모(`features/RgstPop`)·`sample`을 참조하지 않는다. 실제 등록 화면(`RgstPop.tsx`, `PopupEditorDialog.tsx`, 관리자 API를 쓰는 `PopupTemplateDialog.tsx`·`PopupQuestionTemplatePicker.tsx`)은 `features/RgstPop`에 남고 공통 폴더를 import한다. 복제본·임시 re-export는 두지 않았다.
- 타입과 HTTP 클라이언트 구분: 공통 컴포넌트는 `@local/domain`의 **타입**(`AdminPopupDetail` 등)만 쓴다. 관리자 서버 호출(`api.popupAdmin.*`, `@/provider` `useApi`)은 부모 화면 책임이다.
- 가이드 화면(2026-10-29, 2026-10-30 정리): 관리자 사이드바 '팝업 관리 > PopupcommonComponent 가이드'. 탭 8개 — 시작하기(소개·알아둘 점·가져오기·가장 짧은 사용 예)·사용 순서(공통 사용 ①~⑥ / 기존 팝업 등록 P1~P5)·컴포넌트(받는 값·돌려주는 값·사용 방법·실행기)·다른 화면에서 사용하기·예시(IS063M02Sample)·데이터 처리 함수(공통 사용 / 기존 팝업 등록)·실습(필요한 항목만 가져오기 기본, 기존 팝업 등록 방식 선택)·공지(컴포넌트·함수 동작 변경만). 화면 문구는 쉬운 말로 쓰고 함수명·Props 이름은 그대로 둔다(작성 규칙: `guide/guideData.ts` 머리 주석). 화면 파일: 컨테이너 `guide/PopupCommonGuide.tsx`, 탭 `guide/tabs/*`, 공통 표시 `guide/GuideUi.tsx`. 컴포넌트·함수가 바뀌면 `guideData.ts`(scope 포함)를, 동작 변경은 `guideNotices.ts`를 함께 고치고 `scripts/verify-popup-guide-registry.cjs`로 등록 누락을 확인한다.
- 라우트: `scene-router.tsx`에 `/popup-common-sample`(팝업 공통 컴포넌트 샘플)을 추가했다. 기존 `/rgst-pop`은 그대로다. sample 폴더의 TSX만으로 URL이 생기지 않으며, 메뉴 노출이 필요하면 기존 메뉴 등록 절차를 따른다(메뉴 DB 등록은 이번 범위 밖).
- 데이터 흐름(목록 샘플): `createSamplePopups()` → 행 `수정` → `PopupSampleEditor`(state 하나, 2026-10-30부터 미설정 기준) → `withPreviewFallback(state)`로 표시용 값만 채운 객체를 `InlinePopupPreview`·`PopupPreviewDialog`에 전달 → `저장` 시 화면이 입력하는 필드만 담은 값(`toSampleScreenValues` = `pickPopupFields`, 2026-10-30부터 proto 저장 변환 미사용 — 기간·활성·대상 그룹 없음)을 화면에 표시하고 메모리 목록만 갱신(서버 미전송). 실제 연결은 목록·편집 시작을 그 화면의 API로, 저장은 이 값을 그 API 형식으로 바꿔 호출한다(proto 등록 화면은 `api.popupAdmin.save(toSaveRequest(...))`).
- 단독 사용 최소 예: 에디터만은 `PopupRichTextEditor`(initialBlocks·onChange), 우측 미리보기만은 `InlinePopupPreview popup={...}`, 모달만은 `PopupPreviewDialog popup open onClose`. 어느 것도 등록 부모·API를 요구하지 않는다(`scripts/verify-*-entry.tsx`가 각각의 단독 호스트 예시).
- TODO66(서식/색 초기화 버튼 없음)·TODO67(Dialog `slotProps`)·TODO68(최소 300×300)은 같은 공통 파일을 쓰므로 샘플에도 그대로 적용된다. 샘플 편집 Dialog도 `slotProps.paper`·`slotProps.htmlInput`을 쓴다.
- IS063M02 연동 샘플(69-5~69-7): `sample/IS063M02.tsx`는 사진 복원 퍼블리싱 원본(대조용, 첫 줄 `// @ts-nocheck`만 추가 — 저장소에 없는 `IS035Info` 타입·폐쇄망 전역 `n*` CSS 의존), `sample/IS063M02Sample.tsx`는 원본 레이아웃·클래스에 공통 기능을 연결한 샘플(라우트 `/popup-common-sample/is063m02`).
  - 연결: BbsCKEditor 자리 → `PopupRichTextEditor`(본문·설명), 우측 '미리보기' → `InlinePopupPreview`, 미리보기 버튼 → `PopupPreviewDialog`, 문항 영역 → `PopupQuestionEditor`, 저장 → `toSampleScreenValues`(화면 입력 필드만, 서버 미전송).
  - 정리한 원본 연결 이슈: 모든 에디터가 공유하던 `inputData` → 필드별 편집값, 문항 간 공유되던 라디오 `selectedValue` → 문항별 정답 선택, 숫자 Select 값(1~7)과 문자열 `'2'` 비교 → 계약 문자열 값, `FormControlLabel` 단독 `label`·미연결 추가/삭제 버튼 → 문항 편집기 기능으로 대체, 크기 '최소 200' → 300(TODO68). 신규/불러오기/유형 전환에만 편집기 key를 바꿔 입력 중 커서를 유지한다.
  - 정하지 않은 정책(확인 필요): '컨텐츠 명'은 현재 저장 계약에 필드가 없어 요청에 넣지 않는다. [확정] '퀴즈유형': 퀴즈 등록·수정에는 채점 문항이 최소 1개 필요하다. 채점 문항은 각 1점이고 비채점 주관식은 총점에서 제외한다. 만점형의 통과 점수는 채점 문항 수다. 컷트라인형과 참여형은 지정한 기준 개수를 통과 점수로 쓴다. 만점형과 컷트라인형은 기준을 충족해야 제출할 수 있고, 참여형은 제출하면 완료되며 합격 여부를 별도로 기록한다. 샘플은 통과 점수를 유형에서 계산한다(`hidePassingScore`). 파일 첨부는 브라우저 object URL 미리보기만 하며 서버 업로드·서버 경로 URL 생성은 서버 구현이다.
- 검증: `node scripts/verify-popup-common-sample-69.cjs` 25건(목록 샘플 15: 목록 6종·수정·제목/본문 → 우측·모달 반영·재마운트 없음·저장 요청·설문 시연 응답 미혼입·유형 전환·영상+퀴즈 / IS063M02 샘플 10: 원본 구조 유지·폼 없이 저장 거절·유형별 제목·우측/모달 반영·300 미만 거절·저장 요청 일치·컨텐츠 명 미주입·유형 전환 시 공통값 유지·문항별 정답 독립·취소 초기화).
