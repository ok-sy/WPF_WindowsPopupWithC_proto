# 43. passingScore와 completionRatio 버튼 활성화 UX TODO

기준일: 2026-10-13 (KST).  
상태: **코드 구현 완료 · 실화면 확인 대기**.

Trello: [TODO43 passingScore와 completionRatio 버튼 활성화 UX](https://trello.com/c/c6PMZGd6/65-%EC%95%84%EC%9D%B4%EB%94%94%EC%96%B4-passingscorecompletionratio-%EC%B6%A9%EC%A1%B1-%EC%8B%9C-%EB%B2%84%ED%8A%BC-%ED%99%9C%EC%84%B1%ED%99%94-ux). Git TODO 반영 후 진행 확정 목록으로 이동한다. 두 과제를 보류로 분류했던 상태를 정정하며, 다른 나중에 보기·상시 팝업 보류 과제와 구분한다.

## 범위와 기존 동작

완료 조건 충족 전후의 버튼 상태·안내를 개선하는 검토다. 기존 TODO12·19·20·22의 동작을 먼저 대조하고 중복 구현하지 않는다. 자동 종료나 합격 판정 책임 변경은 포함하지 않는다.

## 작업 목록

- [x] 43-1 QUIZ 제출 전후 채점·passingScore·오답 수정 흐름을 대조한다. 제출해야 점수가 계산되는데 제출 버튼을 합격 전까지 비활성화하는 교착을 만들지 않는다.
- [x] 43-2 VIDEO completionRatio 도달 전후 닫기 및 allowCloseBeforeComplete 정책을 대조한다. 조기 닫기 허용 상태를 임의로 금지하지 않는다.
- [x] 43-3 VIDEO+QUIZ의 영상 시청 조건·문항 입력·제출 활성화 순서와 기존 규칙을 비교한다.
- [x] 43-4 숨김/비활성/활성 중 어떤 표현을 사용할지 결정하고 사유 안내, 키보드·스크린리더·포커스 이동을 정한다.
- [x] 43-5 showFooterButton·showFooter·passingScore 누락 및 VIDEO 오류/재시작/탐색의 상태 전이를 확인한다.
- [x] 43-6 서버 정책 전달·WPF 판정·관리자 미리보기·Demo·명세를 맞추고 정상/미충족/재응시/오류 상태를 검증한다. (WPF·명세·관리자 미리보기·자동 검증 완료. 실제 Windows 화면 확인은 남음)

## 완료 기준

기존 완료 조건과 제출 가능 경로를 보존하면서 결정한 버튼 UX가 팝업·미리보기·문서에서 일치한다.

기존 완료·채점·시청 판정 및 결과 전송·복구 계약을 유지하며 UX 변경에 필요한 구체적 상태 전이는 구현 전에 정리한다. 구현·자동 검증·실제 Windows 화면 검증을 각각 기록한다. 코드 변경 시 MINIMAL/ALL·관련 계약·관리자 미리보기·Demo 문서를 함께 검토한다.

## 결정 (2026-10-15)

- D1 표현: 숨기지 않고 **비활성 + 사유 표시**. 사유는 Footer 진행 문구 위치(`FooterResponseProgressText`)에 두고 Live Region(Polite)으로, 비활성 버튼에는 같은 사유를 HelpText로 둔다. 스크린리더 알림은 상태(시청 중→기준 충족·재생 실패, 문항 진행 문구)가 바뀔 때만 올리고 시청 % 변화마다 올리지 않는다.
- D2 일반 VIDEO(`allowCloseBeforeComplete=false`, 기준 미달, 재생 실패 아님): 푸터 닫기 비활성 + `영상 {현재}% 시청 · 기준 {기준}% 이상 시청하면 닫을 수 있습니다`. 기준 도달 시 활성 + `시청 기준을 충족했습니다. 닫을 수 있습니다.`, 재생 실패 시 활성(기존 정책) + 실패 문구. '필수 영상 시청' MessageBox 경로는 삭제하고 클릭 가드(안내 없이 차단)만 유지. `true`면 기존처럼 활성·문구 없음.
- D3 VIDEO+QUIZ 잠금 중: 제출·다시 보지 않기 비활성(기존 계약) + `영상 {현재}% 시청 · 기준 {기준}% 이상 시청하면 퀴즈와 제출이 활성화됩니다`. 해제 뒤 필수 문항 진행 문구로 바꾸고, 창이 활성이면 첫 문항으로 포커스를 옮긴다. 보조 닫기를 살리기 위해 비활성 단위를 FooterArea 전체에서 제출·다시 보지 않기로 좁혔다.
- D4 SURVEY/QUIZ: 제출 비활성 사유(필수 미응답)는 기존 진행 문구 유지 + HelpText·Live Region 추가. 통과 점수로 제출을 막지 않는다(채점 전 교착 금지).
- D5 QUIZ 불합격 안내: 점수·통과 점수에 `틀린 문항: 2, 4번`(채점 문항 중 오답, 화면 문항 번호)을 추가. `QuizGrader.Result.IncorrectQuestionNumbers`·`SurveySubmission.IncorrectQuestionNumbers`로 최소 확장했고 결과 계약(score·passed)은 바꾸지 않았다.
- D6 판정 공식은 바꾸지 않는다(설계 50 D4에서 별도). 표시 %는 누적 시청 / 길이를 내림해 비활성인데 기준 이상으로 보이는 일이 없게 한다.
- D7 보조 닫기(밝은 `SecondaryActionButtonStyle`, 제출 왼쪽): VIDEO+QUIZ는 `allowCloseBeforeComplete=true`(잠금 여부 무관) 또는 재생 실패, QUIZ(영상 없음)는 불합격 1회 이후 + Background Overlay 꺼짐일 때만 표시. Overlay가 켜진 QUIZ는 통과해야 닫힌다(오답 번호 안내로 재시도). SURVEY·TEXT·IMAGE·VIDEO와 `showFooter=false`에서는 숨김. 클릭 결과는 기존 닫기와 같은 CLOSED(영상은 VIDEO_WATCHED·시청량 포함). Overlay가 꺼진 QUIZ의 불합격 안내에는 보조 닫기 안내 문장을 붙인다.

## 구현 결과 (2026-10-15)

- `PopupWindow`: `RefreshFooterState()`가 푸터 주 버튼 활성·사유 문구·HelpText·보조 닫기 표시를 한 곳에서 계산한다. 영상 `ProgressUpdated`·`PlaybackFailed`, VIDEO+QUIZ `Unlocked`, 설문 `ResponseProgressChanged`, QUIZ 불합격(`NotifyQuizFailed`) 때 다시 계산하며 같은 문구는 다시 쓰지 않는다. `CloseButton_Click`의 '필수 영상 시청' MessageBox를 삭제했다.
- `PopupWindow.xaml`·`PopupStyles.xaml`: `FooterAuxCloseButton`(기본 숨김)과 `SecondaryActionButtonStyle`(ActionButtonStyle 기반) 추가, 진행 문구에 `AutomationProperties.LiveSetting=Polite`.
- `VideoPopupView`: `LatestProgress`(재생 상태를 다시 읽지 않는 스냅샷), `IsCompletionReached`(기존 `HasReachedCompletion`과 같은 식), `DisplayWatchedPercent`(내림), `PlaybackFailed` 이벤트. `VideoQuizPopupView.RequiredRatio` 공개.
- `SurveyPopupView`: 제출 HelpText·진행 문구 Live Region, `FocusFirstAnswer()`.
- `QuizGrader`·`SurveySubmission`: 틀린 문항 번호. `PopupManager.BuildQuizFailedMessage()`가 불합격 안내 문구를 만든다.
- 문서: `WPF_POPUP_ALL_SPEC.md`(완료 조건 버튼 표현 절), `POPUP_INTERFACE_SPEC.md`(동작 문장), `POPUP_OPTION_GUIDE.md`, `POPUP_USER_OPTION_GUIDE.md`, `WPF_POPUP_MINIMAL_SPEC.md`(Overlay 키보드 닫기와 모순되던 문장만 정정). 계약 필드 추가 없음.

## 검증 (2026-10-15)

- `dotnet build popup-frameWork/Popup/Popup.csproj`: 경고 0·오류 0.
- `dotnet run --project scripts/PopupWindowTests`(저장소 추적): PASS 97건(기존 23건 + 설계 43·44 74건).
- `dotnet run --project scripts/RichTextTests`: PASS 85건.
- 로컬 `popup-frameWork/Popup.BehaviorTests`: PASS 1014건(기존 1012건). 새 동작에 맞춰 기대를 바꾼 항목: VIDEO+QUIZ 잠금 검사를 FooterArea 전체 대신 제출·다시 보지 않기 비활성으로 확인, 같은 검사에서 Overlay 차단을 배제하려고 `UseBackgroundOverlay=false` 지정, 34-39 VIDEO 검사를 '필수 영상 시청' 안내창 대신 버튼 비활성·사유 문구·안내창 없는 클릭 가드로 확인(1건 → 2건).
- 로컬 `popup-frameWork/Popup.RecoveryTests`: PASS 158건.
- `scripts/PopupWindowTests` 설계 43 항목: VIDEO 미달 시 닫기 비활성·사유 문구·HelpText·LiveSetting, 79.99% → 79% 내림 표시, 클릭 가드(안내창 없음), 80% 도달 후 활성·닫힘, 재생 실패 시 활성·닫힘, 완료 전 닫기 허용 시 문구 없음; VIDEO+QUIZ 잠금 사유 문구·해제 후 문항 진행 문구, 잠금 중 재생 실패·완료 전 닫기 허용 시 보조 닫기 표시·클릭 닫힘, `showFooter=false` 숨김; QUIZ 보조 닫기(Overlay 꺼짐+푸터 표시+불합격 후에만), SURVEY·TEXT 미표시; 틀린 문항 번호 계산·안내 문구·결과 JSON에 미포함.
- 실행하지 않은 검증: 실제 Windows 화면에서의 버튼·문구 배치, 스크린리더(내레이터) 알림, 실제 영상 재생 중 문구 갱신.

## 남은 항목

- 실제 Windows 화면 확인(일반·고DPI, 푸터 글꼴 크기 지정 시 보조 닫기·사유 문구 줄바꿈).
- 관리자 미리보기 반영 완료(2026-10-15): 일반 VIDEO 시청 비율 슬라이더로 `allowCloseBeforeComplete=false` 비활성·사유·도달 후 활성 재현, VIDEO+QUIZ 잠금 문구(기준 % 포함), QUIZ 미달 틀린 문항 번호, 보조 닫기 표시 규칙, 사유 문구 `role="status"`·`aria-live`·`aria-describedby`. `scripts/verify-completion-ux-43.cjs` 27건 통과. 미리보기에는 재생 실패 상태가 없어 그 조건은 재현하지 않음(대조 문서 기록).
- 시청 판정 공식 정합은 설계 50 D4에서 다룬다.
