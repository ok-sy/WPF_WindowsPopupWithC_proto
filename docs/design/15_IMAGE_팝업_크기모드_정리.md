# 15. IMAGE 팝업 크기 모드(ADAPTIVE / FIT_TO_IMAGE / FILL) 정리

## 0. 목적

IMAGE 팝업의 `content.imageSizeMode` 세 가지가 "팝업 크기와 이미지 크기 중 무엇이 기준인가"를
서로 다르게 정의하는데, WPF 구현이 그 구분을 지키지 않아 작은 팝업에서 이미지가 잘려 보이고
FIT_TO_IMAGE로 지정해도 팝업 크기가 바뀌지 않는 문제가 있었다.

이 문서는 세 모드의 계약을 확정하고, 그 계약대로 동작하도록 수정한 내용과 검증 결과를 남긴다.

---

## 1. 모드별 계약

| 모드 | 크기 기준 | `imageWidth` / `imageHeight` | 이미지 표시 | 팝업 크기 변경 |
| --- | --- | --- | --- | --- |
| `ADAPTIVE` | 팝업 `width`/`height` | 최대 표시 크기로만 사용 | 팝업이 배정한 영역 안에 비율 유지하며 맞춤 | 없음 |
| `FIT_TO_IMAGE` | 이미지 크기 | 1순위 실제 표시 크기. 없으면 원본 크기 | 지정(또는 원본) 크기로 표시 | 이미지 크기에서 재계산 |
| `FILL` | 팝업 `width`/`height` | 사용하지 않음 | 영역을 꽉 채움(`UniformToFill`) | 없음 |

보충:

- `ADAPTIVE`에서 `imageWidth`/`imageHeight`는 상한일 뿐이므로, 영역이 그보다 좁으면 이미지는 더 줄어든다.
  반대로 상한이 원본보다 크더라도 원본 크기를 넘겨 확대하지 않는다(축소 표시만 허용).
- `FIT_TO_IMAGE`에서 지정 크기가 화면보다 크면 작업 영역의 90%를 넘지 않도록 비율을 유지한 채 축소한다.
  그 뒤 계산된 팝업 크기는 다시 `PopupOptions`의 Minimum/Maximum과 작업 영역의 95%로 보정한다(설계 11과 같은 기준).
- `FILL`은 제목·설명 없이 이미지만 전체 배경으로 쓰는 전용 화면(`ImageFillPopupView`)이라
  설명 배치 옵션(`descriptionPosition`, `imageAreaRatio`)의 적용 대상이 아니다.
- 과거 값 `FIXED`는 `ADAPTIVE`와 동일하게 처리한다.

---

## 2. 수정 전 동작과 문제

### 2.1 ADAPTIVE에서 이미지가 좌우로 잘림

`ApplyAdaptiveLayout()`이 배치를 정한 뒤, 모드와 무관하게 `TryApplyRequestedImageSize()`를 먼저 실행했다.

```csharp
bool requestedSizeApplied =
    TryApplyRequestedImageSize(bitmapImage);

if (!requestedSizeApplied &&
    _sizeMode == ImagePopupSizeMode.FitToImage)
{
    ApplyFitToImageSize(bitmapImage);
}
```

`TryApplyRequestedImageSize()`는 `imageWidth`/`imageHeight`를
`PopupImage.Width/Height`와 `ImageContainer.Width/Height`에 **절대값**으로 지정한다.
이 적용이 레이아웃 계산 뒤에 일어나고 가용 폭으로 제한되지도 않으므로,
지정 크기가 팝업이 내준 칸보다 크면 컨테이너가 칸을 넘친다.

Demo Mode의 `DEMO-IMAGE-001`이 정확히 이 조건이었다.

```text
팝업 sizeMode = FIXED, width = 400, height = 700
content.imageSizeMode = ADAPTIVE, imageWidth = 620, imageHeight = 520
```

400폭 창에서 이미지 열은 약 300이지만 컨테이너는 622로 잡혀 좌우가 잘렸다.
`Image`가 `HorizontalAlignment="Center"`였던 것도 원인 중 하나다.
`Stretch="Uniform"`이어도 정렬이 Center면 요소는 영역 크기와 무관하게 자기 크기를 유지하므로,
영역보다 클 때 축소되지 않고 넘친 부분이 잘린다.

### 2.2 배치 메서드가 팝업 크기까지 정하려 함

`ApplyLandscapeLayout()` / `ApplyPortraitLayout()` / `ApplySquareLayout()`이
행·열 구성뿐 아니라 `PopupImage.MaxWidth = 820`, `MaxHeight = 430` 같은 고정 상한과
`RecommendedSizeChanged?.Invoke(920, 680)` 같은 추천 팝업 크기까지 함께 지정했다.
팝업 실제 크기와 무관한 값이라 작은 팝업에서는 상한이 의미가 없었고,
ADAPTIVE인데도 팝업 크기를 바꾸려 시도하는 셈이었다.

### 2.3 FIT_TO_IMAGE가 팝업 크기를 바꾸지 못함

`RecommendedSizeChanged` 이벤트를 구독하는 곳이 저장소 어디에도 없었다.
즉 팝업 크기 재계산 코드는 모두 실행되지만 결과가 버려졌고,
FIT_TO_IMAGE로 지정해도 팝업은 `PopupOptions`의 크기 그대로였다.

### 2.4 그 밖의 정합성 문제

- `ApplyFitToImageSize()`는 설명 위치를 비율(`imageRatio <= 0.8`)로만 판단해,
  `descriptionPosition`을 RIGHT/BOTTOM으로 명시하면 실제 배치와 크기 계산이 어긋났다.
- `TryApplyRequestedImageSize()`에는 화면 크기 보정이 없어,
  `imageWidth`에 화면보다 큰 값이 오면 팝업이 화면 밖으로 밀릴 수 있었다.
- FIT_TO_IMAGE에서 이미지 칸은 여전히 `imageAreaRatio` 비율(Star)로 나뉘어 있었다.
  고정 크기 컨테이너가 비율로 계산된 칸보다 크면 같은 방식으로 잘린다.

---

## 3. 수정 내용

### 3.1 모드별 크기 계산 분리 — `ImagePopupView.ApplyAdaptiveLayout()`

```csharp
if (_sizeMode == ImagePopupSizeMode.FitToImage)
{
    bool requestedSizeApplied =
        TryApplyRequestedImageSize(bitmapImage);

    if (!requestedSizeApplied)
    {
        ApplyFitToImageSize(bitmapImage);
    }
}
else
{
    ApplyAdaptiveImageSizing(bitmapImage);
}
```

`TryApplyRequestedImageSize()`는 이제 FIT_TO_IMAGE에서만 호출된다.

### 3.2 ADAPTIVE 전용 크기 처리 — `ApplyAdaptiveImageSizing()` 추가

- `PopupImage`와 `ImageContainer`의 `Width`/`Height`를 `double.NaN`으로 되돌리고 정렬을 `Stretch`로 둔다.
- 한 축의 최대 표시 크기는 `ResolveAdaptiveMaximum()`으로 정한다.
  원본 크기와 요청 크기가 모두 있으면 둘 중 작은 값, 하나만 있으면 그 값, 둘 다 없으면 무제한이다.
  원본 크기를 상한에 포함해 작은 이미지가 흐리게 확대되는 것을 막는다.

영역이 상한보다 좁으면 `Stretch="Uniform"` 축소가 적용되므로 이미지는 항상 팝업 안에 들어온다.

### 3.3 `ImagePopupView.xaml` 기본 정렬 변경

```xml
<Image x:Name="PopupImage"
Stretch="Uniform"
HorizontalAlignment="Stretch"
VerticalAlignment="Stretch"/>
```

FIT_TO_IMAGE는 코드에서 `Width`/`Height`와 Center 정렬을 직접 지정하므로 이 기본값의 영향을 받지 않는다.

### 3.4 배치 메서드에서 크기 결정 제거

세 배치 메서드는 행·열 구성과 여백만 담당한다.
`PopupImage.MaxWidth/MaxHeight` 고정값과 `RecommendedSizeChanged` 호출을 모두 제거했다.

### 3.5 FIT_TO_IMAGE 그리드 보정 — `ApplyFitToImageGridSizing()` 추가

이미지 칸이 고정 크기 컨테이너를 그대로 담도록 바꾼다.

- 설명이 오른쪽: 이미지 열 `Auto`, 설명 열은 팝업 너비 계산에 쓴 고정 너비(260)
- 설명이 아래: 이미지 행 `Auto`, 설명 행 `1*`
- 설명 없음: 변경하지 않음(컨테이너가 중앙 정렬로 표시됨)

### 3.6 FIT_TO_IMAGE 지정 크기의 화면 보정

`TryApplyRequestedImageSize()`에 작업 영역 90% 기준 축소를 추가했다.
이미지 바깥 여백(팝업 좌우 공통 공간 56, 컨테이너 Padding·Border, 오른쪽 설명 영역 260)을 제외한 값을 상한으로 쓰고,
가로·세로 중 더 많이 줄여야 하는 쪽 배율을 적용한다. 자동 계산 경로(`ApplyFitToImageSize()`)와 같은 기준이다.

### 3.7 설명 위치 판단 기준 통일

`ApplyFitToImageSize()`의 `isPortrait`를 `ResolveDescriptionPosition()` 기준으로 바꿔,
배치와 크기 계산이 같은 값을 쓰도록 했다.

### 3.8 `RecommendedSizeChanged` 연결 — `PopupWindow`

```csharp
if (_options.Content is ImagePopupView imagePopupView)
{
    imagePopupView.RecommendedSizeChanged +=
        ImagePopupView_RecommendedSizeChanged;
}
```

핸들러는 `SizeToContent`를 Manual로 바꾼 뒤,
`PopupOptions`의 Minimum/Maximum과 작업 영역 95%로 보정한 크기를 적용하고 창을 다시 작업 영역 중앙에 맞춘다.
FULLSCREEN은 모니터 전체를 덮는 것이 목적이므로 크기를 바꾸지 않는다.

ADAPTIVE와 FILL은 이벤트를 발생시키지 않으므로 핸들러에서 모드를 다시 확인하지 않는다.

---

## 4. 주요 파일

```text
popup-frameWork/Popup/Views/Contents/ImagePopupView.xaml
popup-frameWork/Popup/Views/Contents/ImagePopupView.xaml.cs
popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs
popup-frameWork/Popup/Dtos/ImagePopupContentDto.cs
```

---

## 5. 검증

`dotnet build popup-frameWork/Popup/Popup.csproj` 오류 0 · 경고 0.

로컬에서 `Popup.exe --demo`를 실행해 `DEMO-IMAGE-001`(팝업 FIXED 400x700, `imageWidth` 620 · `imageHeight` 520,
원본 `Media/demo-image.jpg` 750x1030)로 세 모드를 확인했다.
FIT_TO_IMAGE와 FILL은 데모 JSON의 `imageSizeMode`만 임시로 바꿔 확인한 뒤 원래대로 되돌렸다.

| 모드 | 팝업 창 크기 | 결과 |
| --- | --- | --- |
| `ADAPTIVE` | 480 x 700 (변경 없음) | 이미지 전체가 잘림 없이 표시. 상하 여백이 생기고 설명은 오른쪽 열 유지 |
| `FIT_TO_IMAGE` | 938 x 712 로 재계산·재중앙 배치 | 지정 620x520 영역에 원본 비율로 표시, 설명 260 열. 계산식(622+260+56 = 938, 522+190 = 712)과 일치 |
| `FILL` | 480 x 700 (변경 없음) | 이미지가 영역을 꽉 채움 |

수정 전 같은 조건의 ADAPTIVE는 이미지 좌우가 잘렸고, FIT_TO_IMAGE는 팝업 크기가 480x700에서 바뀌지 않았다.

미실행: 외부 URL 이미지(다운로드 경로)와 VIEWPORT_RATIO·FULLSCREEN 팝업에서의 조합 확인,
폐쇄망 환경에서의 재확인.

---

## 6. 남은 항목

- 관리자 웹 팝업 편집기에 `imageSizeMode` 세 값과 `imageWidth`/`imageHeight`의 의미 차이를 안내하는 설명이 없다.
  ADAPTIVE에서 크기를 입력해도 팝업이 커지지 않는 점은 편집 화면에서 오해하기 쉬우므로 문구 보완이 필요하다.
- FIT_TO_IMAGE의 설명 영역 너비 260과 팝업 외부 여백 56 · 190 · 300은 상수로 남아 있다.
  Header/Footer 표시 여부에 따라 실제 값이 달라지므로, 오차가 문제되면 실제 측정값 기반으로 바꾼다.
