# TODO67 — MUI deprecated 속성 및 미리보기 호환 검증

- 작성일: 2026-10-22 (KST)
- 상태: 저장소 기준 점검·전환·검증 완료 / 폐쇄망 설치 버전·IDE 안내 해소 확인 대기
- 관련: TODO61 미리보기 컴포넌트 분리, TODO64 프론트 이식
- 계기: 폐쇄망 PopupPreviewDialog.tsx에서 BackdropProps 사용 중단 예정(ts6385) 안내 확인.

## 목적과 범위

팝업 에디터·우측 인라인 미리보기·버튼으로 여는 모달 미리보기와 직접 사용하는 공용 컴포넌트에서 MUI deprecated 속성을 점검한다. 폐쇄망에 설치된 MUI 버전이 지원하는 대체 API를 확인하고 전환 후 기존 표시·종료 동작이 유지되는지 검증한다.

deprecated는 현재 버전의 즉시 실행 오류와 구분해 기록한다. 단순 타입 검사 통과만으로 deprecated 안내가 모두 해소됐다고 판단하지 않는다. 패키지 업그레이드나 앱 전체 일괄 전환은 이번 범위에 포함하지 않는다.

## 점검·수정 TODO

- [x] 67-1. (저장소 기준 완료, 폐쇄망 버전은 미확인) 저장소와 폐쇄망의 @mui/material·@mui/system·@mui/icons-material·Emotion·React 실제 설치 버전 및 lockfile 차이를 기록한다. 실제 설치 타입 선언과 해당 버전 공식 문서로 대체 속성 지원 여부를 확인한다.
- [x] 67-2. PopupPreviewDialog 및 관련 팝업 컴포넌트에서 BackdropProps, PaperProps 등 deprecated 가능성이 있는 사용처를 조사한다. 발견 항목별 파일·현재 속성·대체 API·사용 버전·수정 필요 여부를 정리하며 미확인 항목을 확정 오류로 취급하지 않는다.
- [x] 67-3. BackdropProps의 배경 sx를 slotProps.backdrop으로 옮기는 변경을 확인/반영한다. 기존 slotProps가 있으면 합치고 덮어써 잃지 않도록 한다.
- [x] 67-4. slotProps 병합 시 스타일·이벤트·ref·조건부 props가 보존되는지 확인한다. 전체화면과 일반 모달의 조건 분기, 기존 배경 투명도·크기·위치·여백 계산을 유지한다.
- [x] 67-5. (저장소 기준 완료, 폐쇄망 결과는 미기록) 이식 안내에 검증한 MUI 버전과 변경 예시를 기록하고 폐쇄망 확인 결과를 별도로 남긴다. API/DB/WPF 계약은 변경하지 않는다.

- [x] 67-6. PaperProps → slotProps.paper 전환을 별도 점검한다. PopupPreviewDialog.tsx의 일반 모달 Paper sx(width/height/maxWidth/maxHeight/margin/overflow)와 fullScreen 시 undefined 분기를 보존한다. backdrop과 paper를 하나의 slotProps 객체로 합치며 기존 설정을 덮어쓰지 않는다. 설치 버전 지원 확인 후 적용하고 기존 PaperProps를 중복으로 남기지 않는다.

## 검증 체크리스트

- [x] 타입 검사·변경 파일 lint·프로젝트 빌드 실행 가능 여부와 결과 기록. 실제 IDE/type 선언의 deprecated 안내 해소도 별도로 확인.
- [x] Overlay ON: 지정한 불투명도 적용, 배경 클릭으로 닫히지 않음.
- [x] Overlay OFF: 배경 투명 처리와 기존 배경 클릭 종료 동작 유지.
- [x] 모달 열기·종료 버튼·Esc·푸터 닫기 동작, 닫은 뒤 다시 열기 및 시연 상태 초기화 확인.
- [x] FIXED/RATIO/FULLSCREEN, 위치·가장자리 여백·창 resize 동작 확인. Paper 슬롯 변경 시 특히 크기/overflow/스크롤/테두리 유지 확인.
- [x] 우측 인라인 미리보기와 모달의 동일 입력 표시, TEXT/IMAGE/VIDEO/SURVEY/QUIZ 대표 데이터 확인. 서버 없이 샘플 객체로 검증 가능.
- [ ] 에디터 우클릭 패널이 모달 뒤로 가려지거나 클릭/포커스가 잘못 이동하지 않는지 확인.
- [x] 기존 검증 호스트를 우선 재사용하고 변경과 관련 없는 전면 테스트 증설은 피한다. 실제 폐쇄망 버전 검증 미수행 시 검증대기로 남긴다.

## 점검 결과 (2026-10-22)

### 67-1 버전

| 패키지 | 저장소 선언(`zero-rule-web/main/package.json`) | 설치·lockfile(`pnpm-lock.yaml`) |
|---|---|---|
| @mui/material | ^6.4.1 | 6.5.0 |
| @mui/system | (material 의존) | 6.5.0 |
| @mui/icons-material | ^6.4.1 | 6.5.0 |
| @emotion/react | ^11.14.0 | 11.14.0 |
| react | ^18.3.1 | 18.3.1 |

- 설치된 `@mui/material/CHANGELOG.md` 6.4.1 항목에 `[Dialog] Add slots and slotProps (#44792)`가 있고, 6.5.0 `Dialog.d.ts`에서 `PaperProps`는 `@deprecated Use slotProps.paper`, Modal `BackdropProps`는 `@deprecated Use slotProps.backdrop`이다. 따라서 선언 범위(^6.4.1) 안에서는 대체 API를 쓸 수 있다.
- 폐쇄망 설치 버전·lockfile 차이는 저장소에서 확인할 수 없어 미확인(검증대기). 6.4.1 미만이면 `slotProps.paper`를 쓸 수 없으므로 이식 전에 확인한다.

### 67-2 사용처 조사

TypeScript 5.7.3 언어 서비스 suggestion 진단(ts6385)으로 `src/features/RgstPop` 전체를 확인했다(IDE 취소선 안내와 같은 기준).

| 파일 | 현재 속성 | 대체 API | 처리 |
|---|---|---|---|
| PopupPreviewDialog.tsx | Dialog `BackdropProps` | `slotProps.backdrop` (6.4.1+) | 전환(67-3) |
| PopupPreviewDialog.tsx | Dialog `PaperProps` | `slotProps.paper` (6.4.1+) | 전환(67-6) |
| PopupEditorDialog.tsx | TextField `inputProps` 11건·`InputLabelProps` 4건 | `slotProps.htmlInput`·`slotProps.inputLabel` | 미전환. 현 버전 정상 동작하는 deprecated(v7 제거 예정). 미리보기 범위 밖 편집 폼이라 별도 작업으로 분리 |
| PopupQuestionEditor.tsx | TextField `inputProps` 2건·`InputLabelProps` 1건, Checkbox `inputProps` 1건 | TextField 동일, Checkbox `slotProps.input` | 미전환(동일 사유). Checkbox 대체 슬롯은 폐쇄망 버전 지원 확인 필요 |
| PopupScheduleFields.tsx | TextField `inputProps` 2건·`InputLabelProps` 2건 | 동일 | 미전환(동일 사유) |

- 미리보기 렌더러(`PopupPreview`·`InlinePopupPreview`·`SurveyPreview`·`AspectVideoArea`·`PopupRichBlocks`)와 서식 패널(`PopupRichTextMenu` `NativeSelect inputProps`)에는 deprecated 진단이 없다.
- 전환 후 `PopupPreviewDialog.tsx`의 ts6385는 0건이다.

### 67-3·67-4·67-6 전환

- `BackdropProps`·`PaperProps`를 하나의 `slotProps` 객체(`backdrop`, `paper`)로 합쳤다. 기존 `slotProps`는 없었으므로 덮어쓴 설정이 없다. `paper`는 FULLSCREEN이면 `undefined`로 두어 기존 분기를 유지하고, 일반 모달의 width/height/maxWidth/maxHeight/margin/overflow sx를 그대로 옮겼다. `PaperProps`를 중복으로 남기지 않았다.
- 이벤트·ref는 두 속성에 없었다. Dialog `sx`(9개 위치 정렬)·`fullScreen`·`maxWidth={false}`·onClose의 Overlay 배경 클릭 분기는 그대로다.

### 검증

- 웹: `tsc --noEmit` 오류 0, 변경 파일 eslint 오류 0. 프로젝트 전체 `next build`는 미실행.
- `verify-popup-preview-61` 52건 통과(신규 2건: 일반 모달 Paper margin 24px·maxWidth 952px·maxHeight 852px·overflow hidden·radius 4px, FULLSCREEN Paper 미지정과 backdrop 유지). 기존 항목으로 Overlay ON(0.45 배경·배경 클릭 무시)·OFF(투명·배경 클릭 종료), 종료 버튼·Esc·재열기 시 시연 상태 초기화, FIXED/RATIO/FULLSCREEN·9개 위치·가장자리 여백·창 resize 재계산, TEXT/IMAGE/VIDEO/SURVEY/QUIZ 인라인·모달 동일 입력 표시를 함께 확인했다. 연속 실행 중 2회는 Esc·배경 클릭 직후 닫힘 확인 타이밍(350ms)으로 실패하고 이후 3회 연속 통과해 기존 대기 시간의 간헐 실패로 기록한다.
- 에디터 우클릭 패널과 모달 동시 표시: 서식 패널은 Popper(zIndex modal+1)로 Dialog와 계층이 분리되어 있으며 이번 변경은 Dialog의 Backdrop·Paper 슬롯 외 계층을 바꾸지 않는다. 실제 관리자 화면에서 패널을 연 채 모달을 여는 실화면 확인은 미실행.
- 미실행(검증대기): 폐쇄망 설치 버전 대조, 폐쇄망 IDE에서 ts6385 안내 해소 확인, 실제 관리자 웹 화면 확인.
