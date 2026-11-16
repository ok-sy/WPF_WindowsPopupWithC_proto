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
