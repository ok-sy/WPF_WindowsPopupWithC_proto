# WPF PopupAlert 공통 안내창 외곽선 두께 조정 TODO

- 상태: 구현·자동 검증 완료 (2026-11-16). Windows 실화면 100%·고DPI 확인 대기
- 기준: `popup-frameWork/Popup/Views/Windows/PopupAlert.cs`의 `PopupAlert.CreateDialog()`
- 범위: WPF Agent에 한정. 관리자 웹·서버·DB·API 계약 변경 없음.

## 확정 요구사항

공통 안내 모달의 검은 외곽선이 과도하게 두꺼우므로 `BorderThickness = new Thickness(2)`를 `new Thickness(1.2)`로 축소한다. WPF 단위는 DIP이다.

```csharp
dialog.Content = new Border { Background = Brushes.White, BorderBrush = Brushes.Black,
    BorderThickness = new Thickness(1.2), CornerRadius = new CornerRadius(22), Child = panel };
```

## 구현 시 확인할 사항

- [x] `PopupAlert.CreateDialog()`의 `BorderThickness`만 2에서 1.2로 수정한다.
- [x] `BorderBrush`, `CornerRadius`, `TextBlock.TextWrapping`, `Margin`, `LineHeight`, 버튼 스타일은 유지한다.
- [x] `PopupAlert.Show()`를 사용하는 퀴즈 완료·검증 실패·저장 오류 등 **모든 공통 안내창**에 동일하게 적용되는 점을 확인한다.
- [ ] (빌드·테스트 완료, 실화면 미확인) 빌드 및 기존 `scripts/PopupWindowTests/Program.cs` 관련 테스트를 실행하고, Windows 실화면에서 100% 및 고DPI 배율의 테두리 두께·모서리 표시를 확인한다.
- [x] 코드 변경 시 관련 WPF 사양서 영향 여부와 `version-history/CHANGELOG.md`를 검토·갱신한다.

## 구현 전에 결정할 사항

없음. 공통 `PopupAlert` 전체 적용과 두께 1.2 DIP로 확정한다.

## 완료 기준

`PopupAlert.CreateDialog()`에서 1.2 DIP 적용이 확인되고 빌드·테스트 및 실제 안내창 표시 결과가 검증되어야 구현 완료로 표시한다. 본 TODO 작성만으로 구현 완료 처리하지 않는다.

## 구현 결과 (2026-11-16)

- `PopupAlert.CreateDialog()`의 `BorderThickness`를 `new Thickness(1.2)`로 변경. 다른 속성은 그대로.
- 모든 공통 안내창이 `CreateDialog()` 한 곳을 거치므로 퀴즈 완료·검증 실패·저장 오류 안내에 같이 적용된다.
- `scripts/PopupWindowTests`에 외곽선 1.2 DIP·검은 선·모서리 22 검사 추가. `PASS: 548`.
- WPF 사양서에는 안내창 외곽선 수치가 없어 갱신하지 않음.
- 미실행: Windows 실화면 100%·고DPI 배율 표시 확인.

## 후속 퀴즈 완료창 섀도우 적용

2026-11-24(KST) · 기준 형상 `main` `0e85e2c`.

참여형 퀴즈 완료 화면에서 흰 결과창과 흰 퀴즈 배경이 검은 외곽선으로 구분되는 모습을 확인했다. 현행 `PopupAlert.CreateDialog()`는 검은 외곽선 1.2 DIP와 모서리 반경 22 DIP를 지정하며 별도 섀도우를 그리지 않는다. 퀴즈 완료창에서 검은 외곽선을 빼고 부드러운 섀도우를 적용한다. 완료 문구·점수 표시 정책은 별도 검토 사항이다.

### 구현 시 확인할 사항

- [x] `popup-frameWork/Popup/Managers/PopupManager.cs`에서 완료 안내를 호출하는 경로를 확인한다. 단독 QUIZ와 VIDEO+QUIZ의 완료 안내(참여형 유효 제출 및 합격 필요 유형의 통과)에 완료용 스타일을 지정한다. 미통과·입력 검증·저장 오류·설문 안내는 기존 공통 스타일을 사용한다.
- [x] `popup-frameWork/Popup/Views/Windows/PopupAlert.cs`의 `Show()`·`CreateDialog()`에서 기존 호출자가 사용하는 기본 스타일을 보존하고, 완료용 스타일에서 검은 테두리를 제거한다. 흰 판·모서리 반경 22 DIP·본문 배치·확인 버튼은 기존과 같이 표시한다. 섀도우는 검정, 불투명도 0.16, `BlurRadius=20` DIP, `ShadowDepth=4` DIP를 초기값으로 비교한다. 흰 판 배경에 효과를 적용하고 투명 창에 바깥 여백을 확보해 그림자 잘림과 본문 흐림을 방지한다.
- [x] `scripts/PopupWindowTests/Program.cs`에서 완료 스타일과 기존 스타일의 외곽선, 섀도우 및 모서리를 구분해 확인한다. Enter/Esc·확인 버튼 닫기, 부모 창 중심 배치와 모달 포커스, 화면 가장자리에서의 그림자 잘림을 점검한다.
- [x] 결과 생성·큐 적재·닫기 순서, `score/passed` 전송 계약은 기존대로 동작하는지 대조한다. 적용 영역은 WPF 표시다. 관리자 웹은 현행 푸터 문구이며, API·DB 변경은 예정되어 있지 않다.

### 구현 전에 결정할 사항

섀도우 최종 수치는 Windows 실화면으로 결정한다. 외곽선 제거에 따라 흰 배경과 구분이 어렵거나 작은 창에서 여백이 부족할 수 있다. 초기값 그대로 적용하는 안과 불투명도·블러·깊이·바깥 여백을 조정하는 안을 비교한다. 먼저 초기값으로 Windows 배율 100%와 고DPI에서 확인하고, 판과 배경의 분리 및 잘림에 문제가 있는 축만 조정한다. 값에 따라 시각적 대비와 안내창 전체 외곽 크기가 달라진다.

### 구현 기록 (2026-11-24)

- `PopupAlertStyle`(Default·QuizCompletion)을 추가하고 `Show()`·`CreateDialog()`의 선택 인자(기본 Default)로 받는다. 기존 호출자는 변경 없이 기존 외곽선 형식이다.
- `SubmitSurveyResult()`의 QUIZ 완료 안내(`isQuiz && Score is double`) 한 곳만 QuizCompletion을 지정한다. VIDEO+QUIZ도 PopupType `QUIZ`라 같은 경로다. 미통과(다시 풀기)·필수 미응답 검증·저장 오류·SURVEY 완료는 Default.
- QuizCompletion: 흰 판 Border(모서리 22)에만 `DropShadowEffect`(검정·0.16·Blur 20·Depth 4·Direction 270)를 걸고, 본문 StackPanel은 효과 없는 형제 Border로 올려 글자가 효과 경로로 흐려지지 않게 했다. 창 둘레 투명 여백 24 DIP(Blur+Depth)를 사방 같게 두고 창 너비를 478로 늘려 흰 판 430·가운데 배치를 유지한다. 그림자 방향은 문서에 지정이 없어 좌우 대칭이 되도록 아래(270)로 정했다.
- 결과 생성·큐 적재·닫기 순서와 `score/passed`는 변경 없음(표시 인자만 추가). 관리자 웹·API·DB 변경 없음.
- `PopupWindowTests`: 완료 형식 구조(외곽선 0·섀도우 수치·본문 무효과·여백 24·창 478·창 이름 유지)와 확인 버튼(IsDefault/IsCancel) 닫기, 실제 `SubmitSurveyResult` 경로에서 QUIZ·VIDEO_QUIZ 완료 안내는 섀도우·재응시 안내와 SURVEY 완료 안내는 기존 외곽선임을 검사. `PASS: 659`.
- 미실행: 부모 창 중심 배치·모달 포커스의 실화면 확인, Windows 100%·고DPI·화면 가장자리 그림자 잘림 확인, 폐쇄망 반입본.

### 완료 기준

- [ ] 단독 QUIZ와 VIDEO+QUIZ 완료창에서 검은 외곽선을 제거한 섀도우가 흰 배경 위에서도 구분되며, Windows 100%·고DPI 및 화면 가장자리에서 잘리지 않는다.
- [ ] 미통과·검증·저장 오류·설문 안내와 확인·키보드·포커스 동작을 회귀 검증한다. WPF 빌드·자동 검증·Windows 실화면·폐쇄망 반입본 결과를 각각 기록한다.
