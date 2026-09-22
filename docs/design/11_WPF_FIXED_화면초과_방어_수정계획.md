# 11. WPF FIXED 크기 화면 초과 방어 수정 계획

## 0. 목적

WPF 팝업의 `SizeMode=FIXED`에서 서버가 현재 모니터 작업 영역보다 큰 Width/Height를 내려줄 경우,
Header/Footer 또는 닫기 버튼이 화면 밖으로 밀려 사용자가 팝업을 정상적으로 닫거나 다른 PC 작업을 하기 어려워지는 상황을 방지한다.

현재 `VIEWPORT_RATIO`와 `AUTO`는 화면 작업 영역을 기준으로 크기를 제한하지만,
`FIXED`는 서버 값을 그대로 적용하므로 화면 초과 가능성이 있다.

---

## 1. 현재 코드 위치

파일:

```text
popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs
```

메서드:

```csharp
ApplyWindowSize()
```

현재 FIXED 처리:

```csharp
case PopupSizeMode.Fixed:
{
    SizeToContent = SizeToContent.Manual;

    Width = _options.Width;
    Height = _options.Height;

    break;
}
```

즉 서버에서 내려온 `Width`, `Height`를 그대로 Window에 적용한다.

---

## 2. 문제 상황

예를 들어 사용자 PC의 작업 영역이:

```text
1920 x 1080
```

인데 관리자 설정 또는 잘못된 데이터로:

```text
Width  = 5000
Height = 3000
```

이 내려오면 현재 FIXED 모드는 그대로 5000 x 3000 크기를 적용한다.

이 경우 다음 문제가 생길 수 있다.

```text
팝업 상단 Header가 화면 밖으로 이동
Footer 또는 닫기 버튼이 화면 밖에 위치
Topmost 팝업이 다른 프로그램을 가림
Overlay가 함께 켜져 있으면 사용자 조작이 더 어려워짐
```

특히 현재 PopupManager는 팝업을 `Topmost=true`로 표시하므로
화면 초과 팝업은 사용자 작업을 실질적으로 막을 수 있다.

---

## 3. 현재 SizeMode별 방어 상태

| SizeMode | 화면 초과 방어 |
|---|---|
| `FIXED` | 없음 |
| `VIEWPORT_RATIO / RATIO` | 있음 |
| `AUTO` | 있음 |
| `FULLSCREEN` | 모니터 전체 사용이 의도된 동작 |

`VIEWPORT_RATIO`는 `SystemParameters.WorkArea`와 MaximumWidth/Height 중 작은 값을 사용해 제한한다.

`AUTO`는 작업 영역의 약 90%를 최대값으로 사용한다.

---

## 4. 수정 방향

FIXED도 최종적으로 현재 화면의 작업 영역을 넘지 않도록 제한한다.

권장 정책:

```text
서버 Width/Height
↓
서버 MaximumWidth/MaximumHeight 적용
↓
모니터 WorkArea 기준 최종 상한 적용
↓
최종 Window Width/Height 결정
```

기본 안전 여백은 작업 영역의 95%를 권장한다.

예:

```text
1920 x 1080 작업 영역

최대 안전 크기
≈ 1824 x 1026
```

이렇게 하면 Header/Footer가 화면 안에 남을 가능성이 높다.

---

## 5. 구현 예시

대상:

```csharp
case PopupSizeMode.Fixed:
```

예상 수정:

```csharp
case PopupSizeMode.Fixed:
{
    SizeToContent = SizeToContent.Manual;

    Rect workArea = SystemParameters.WorkArea;

    double safeMaxWidth =
        Math.Min(
            _options.MaximumWidth,
            workArea.Width * 0.95);

    double safeMaxHeight =
        Math.Min(
            _options.MaximumHeight,
            workArea.Height * 0.95);

    double safeMinWidth =
        Math.Min(
            _options.MinimumWidth,
            safeMaxWidth);

    double safeMinHeight =
        Math.Min(
            _options.MinimumHeight,
            safeMaxHeight);

    Width =
        Math.Clamp(
            _options.Width,
            safeMinWidth,
            safeMaxWidth);

    Height =
        Math.Clamp(
            _options.Height,
            safeMinHeight,
            safeMaxHeight);

    break;
}
```

---

## 6. Minimum 값 역전 방어

단순히 다음처럼 구현하면:

```csharp
Math.Clamp(
    _options.Width,
    _options.MinimumWidth,
    safeMaxWidth)
```

서버에서 잘못된 값이 내려온 경우 문제가 생길 수 있다.

예:

```text
MinimumWidth = 3000
safeMaxWidth = 1824
```

이 경우 최소값이 최대값보다 커진다.

따라서 먼저:

```csharp
safeMinWidth = Math.Min(_options.MinimumWidth, safeMaxWidth);
safeMinHeight = Math.Min(_options.MinimumHeight, safeMaxHeight);
```

로 최소값도 화면 안으로 보정해야 한다.

---

## 7. 다중 모니터 주의사항

현재 `SystemParameters.WorkArea`는 일반적으로 WPF 기준 주 작업 영역을 사용한다.

팝업이 항상 주 모니터에 표시된다면 우선 이 방식으로도 방어 효과가 있다.

하지만 향후 팝업을 사용자 현재 모니터 또는 특정 모니터에 표시하는 정책이 들어간다면
FIXED 크기 제한도 실제 팝업이 표시될 모니터의 `WorkingArea` 기준으로 계산하는 것이 더 정확하다.

FULLSCREEN 구현은 이미:

```text
System.Windows.Forms.Screen.FromHandle(...)
```

을 이용해 실제 모니터를 찾고 있으므로,
필요 시 FIXED에도 동일한 방식의 모니터 식별 로직을 재사용할 수 있다.

---

## 8. DPI 주의사항

WinForms `Screen.WorkingArea`는 실제 픽셀 좌표이고 WPF Window의 Width/Height는 DIP 단위다.

따라서 향후 `Screen.WorkingArea` 기반으로 변경할 경우
FULLSCREEN 구현처럼 WPF DPI 변환을 적용해야 한다.

현재 1차 방어를 `SystemParameters.WorkArea`로 구현하면 WPF DIP 단위이므로 단순 적용이 가능하다.

---

## 9. 테스트 항목

### T1. 정상 FIXED 크기

```text
화면: 1920 x 1080
팝업: 900 x 620
```

기대:

```text
기존과 동일하게 900 x 620 표시
```

### T2. Width 초과

```text
팝업 Width = 5000
```

기대:

```text
화면 안전 최대 너비로 제한
Header/Footer 정상 접근 가능
```

### T3. Height 초과

```text
팝업 Height = 3000
```

기대:

```text
화면 안전 최대 높이로 제한
Header/Footer 정상 접근 가능
```

### T4. Width/Height 모두 초과

```text
5000 x 3000
```

기대:

```text
둘 다 작업 영역 안으로 제한
```

### T5. Minimum > 화면 최대

```text
MinimumWidth  = 3000
MinimumHeight = 2000
```

기대:

```text
최소값도 화면 최대값 이하로 보정
Math.Clamp 예외 없음
```

### T6. Overlay + Topmost

```text
UseBackgroundOverlay = true
Topmost = true
FIXED 크기 초과 입력
```

기대:

```text
팝업이 화면 밖으로 벗어나 사용자 PC 조작을 막는 상황 없음
```

### T7. 기존 SizeMode 회귀

```text
VIEWPORT_RATIO
AUTO
FULLSCREEN
```

기대:

```text
기존 동작 변화 없음
```

---

## 10. 완료 기준

- FIXED Width/Height가 현재 작업 영역보다 큰 값이어도 화면 안으로 제한된다.
- Header/Footer/닫기 버튼이 사용자가 접근 가능한 위치에 남는다.
- 잘못된 Minimum/Maximum 값 조합에서도 예외가 발생하지 않는다.
- 기존 VIEWPORT_RATIO/AUTO/FULLSCREEN 동작에는 영향이 없다.
- 팝업이 Topmost + Overlay 상태에서도 사용자 PC 조작을 막는 크기로 생성되지 않는다.

---

## 11. 현재 상태

```text
문서화: 완료
코드 수정: 완료 (2026-09-22) — PopupWindow.ApplyWindowSize() Fixed 분기: WorkArea 95% 상한, Minimum 역전 보정,
           Window MinWidth/MaxWidth 도 보정값으로 재지정. default(알 수 없는 SizeMode) 분기도 Fixed로 합류.
빌드: dotnet build Popup.slnx 경고 0·오류 0
실행 테스트(T1~T7): 미수행 — 5000x3000 등 실제 초과 값으로 화면 확인 필요
```

구현 위치:

```text
popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs
→ ApplyWindowSize()
→ PopupSizeMode.Fixed
```
