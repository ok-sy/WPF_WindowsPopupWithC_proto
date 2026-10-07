# WPF 팝업 Header / 외곽 UI 개선 TODO

## 목적

팝업 공통 외형을 단순화하고 VIDEO / VIDEO+QUIZ에서도 저사양 PC 성능 개선 상태(`AllowsTransparency=false`)를 유지하면서 일반 팝업과 최대한 동일한 Radius 6 외형을 적용한다.

## 확정 사항

- [ ] 팝업 외곽선 제거
  - `PopupBodyBorder.BorderThickness = 0`
  - 기존 밝은 `BorderBrush` 외곽선이 화면에 노출되지 않도록 한다.
- [ ] 전체 팝업 CornerRadius를 16에서 6으로 변경
  - 일반 팝업: `PopupBodyBorder CornerRadius="6"`
  - Header: `HeaderArea CornerRadius="6,6,0,0"`
  - Fullscreen: 기존과 동일하게 Radius 0 유지
- [ ] Header 배경을 검은색으로 변경
  - `HeaderArea.Background = Black`
  - 제목 글자색은 White로 변경
- [ ] Header 우측 상단의 X 닫기 버튼 제거
  - 기존 닫기 버튼 위치에는 고정 로고 이미지를 표시한다.
  - 로고에는 닫기 동작을 연결하지 않는다.
  - 로고는 서버 옵션/URL로 받지 않고 WPF Resource로 관리한다.
- [ ] 기존 `ShowCloseButton` 의미를 Footer 버튼 표시 여부로 정리
  - Header 닫기 버튼은 더 이상 존재하지 않으므로 `ShowHeaderCloseButton`은 추가하지 않는다.
  - `ShowCloseButton`을 `ShowFooterButton`으로 변경한다.
  - `PopupOptions`, `PopupResponseDto`, `PopupFactory`, `PopupWindow`, Demo JSON 사용처를 함께 변경한다.
  - SURVEY / QUIZ / VIDEO+QUIZ에서 Footer 버튼이 제출 역할을 할 수 있으므로 이름을 `ShowFooterButton`으로 사용한다.

## VIDEO / VIDEO+QUIZ Radius

- [ ] `AllowsTransparency=false` 유지
  - 영상 재생 시 CPU 부하 개선을 회귀시키지 않는다.
- [ ] VIDEO의 WPF `PopupBodyBorder.CornerRadius=0`, `HeaderArea.CornerRadius=0` 정책은 유지한다.
- [ ] 기존 `ApplyDwmRoundedCorners()` 호출을 `ApplyRoundedWindowRegion()`으로 교체한다.
- [ ] Win32 `CreateRoundRectRgn + SetWindowRgn`으로 HWND 자체를 둥글게 자른다.
- [ ] WPF Radius 6과 최대한 유사하도록 ellipse diameter를 12 DIP 기준으로 계산한다.
- [ ] WPF DIP와 Win32 pixel 차이를 보정하기 위해 현재 모니터 DPI 배율을 적용한다.
- [ ] 창 크기가 바뀌면 `SizeChanged`에서 Window Region을 다시 계산한다.
- [ ] Fullscreen에서는 Window Region Radius를 적용하지 않는다.
- [ ] `SetWindowRgn` 성공 시 HRGN 소유권이 Windows로 넘어가므로 성공한 Region에는 `DeleteObject`를 호출하지 않는다.
- [ ] 실패한 Region만 `DeleteObject`로 해제한다.
- [ ] SetWindowRgn 외형 확인 전까지 기존 DWM 메서드/PInvoke는 삭제하지 않고 호출만 제거한다.
- [ ] SetWindowRgn 검증 완료 후 미사용 DWM rounded-corner 코드를 정리한다.

## 일반 팝업 Clip

- [ ] 기존 `PopupBodyContent_SizeChanged()` Clip 계산은 유지한다.
- [ ] `PopupBodyBorder.CornerRadius.TopLeft`를 기준으로 내부 Clip이 자동 계산되는 현재 구조를 유지한다.
- [ ] BorderThickness가 0이 되므로 일반 팝업 내부 Clip도 최종 Radius 6 기준으로 계산되는지 확인한다.

## Header 높이

- [ ] Header 높이의 단일 기준을 XAML로 둔다.
- [ ] `PopupWindow.xaml.cs`에서 Header 높이를 48로 다시 덮어쓰는 하드코딩을 제거한다.
- [ ] C#에서는 `ShowHeader=false`일 때만 Header row 높이를 0으로 만든다.
- [ ] Header 높이 축소 후 제목과 우측 로고의 수직 중앙 정렬을 확인한다.

## 주요 수정 대상

- `popup-frameWork/Popup/Views/Windows/PopupWindow.xaml`
- `popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs`
- `popup-frameWork/Popup/Models/PopupOptions.cs`
- `popup-frameWork/Popup/Dtos/PopupResponseDto.cs`
- `popup-frameWork/Popup/Factories/PopupFactory.cs`
- `popup-frameWork/Popup/Services/DemoPopupDataService.cs`
- Header 로고 Resource 파일 및 프로젝트 Resource 설정

## 확인 항목

- [ ] TEXT / IMAGE / SURVEY 일반 팝업 Radius 6 확인
- [ ] VIDEO / VIDEO+QUIZ Radius가 일반 팝업과 육안상 최대한 동일한지 확인
- [ ] Horizon 환경에서 SetWindowRgn이 실제 외곽을 자르는지 확인
- [ ] VIDEO 재생 CPU 사용률이 `AllowsTransparency=false` 적용 전 수준으로 회귀하지 않는지 확인
- [ ] Header 검은색이 외곽까지 자연스럽게 연결되고 흰색 외곽선이 남지 않는지 확인
- [ ] Header 우측 상단 로고의 크기/여백/수직 정렬 확인
- [ ] Footer 버튼 숨김/표시가 `ShowFooterButton`에 따라 정상 동작하는지 확인
- [ ] SURVEY / QUIZ / VIDEO+QUIZ 제출 버튼 동작에 회귀가 없는지 확인
- [ ] Fullscreen에서 Radius 0 및 Region 처리 회귀가 없는지 확인


## 2026-10-07 VIDEO 투명창 / Radius 성능 검증 결과

### 실측 결과

- [x] 로딩바/Progress UI 수정 후 대기 상태의 비정상 CPU 점유가 개선되는 것을 확인했다.
- [x] `AllowsTransparency=true` 상태에서 VIDEO 재생 시 CPU 사용률이 약 70~80%까지 다시 상승하는 것을 확인했다.
- [x] 동일 조건에서 영상을 일시정지하면 CPU 사용률이 크게 내려가는 것을 확인했다.
- [x] `AllowsTransparency=false` 상태에서는 VIDEO 재생 중 CPU 사용률이 약 10% 내외로 유지되는 것을 확인했다.
- [x] 따라서 기존 고CPU 원인은 하나가 아니라 다음 두 가지가 함께 존재했던 것으로 판단한다.
  1. 기존 Progress/로딩 UI의 불필요한 갱신 부하
  2. `AllowsTransparency=true`인 WPF 최상위 Window에서 WebView2 영상 프레임이 계속 갱신될 때 발생하는 합성 부하
- [x] Progress UI 문제를 수정해도 두 번째 부하는 남으므로 VIDEO / VIDEO+QUIZ의 `AllowsTransparency=false` 정책은 유지한다.

### SetWindowRgn Radius 검증

- [x] `CreateRoundRectRgn + SetWindowRgn`으로 VIDEO Window 외곽 Radius 적용이 가능한 것을 확인했다.
- [x] Radius 6보다 값을 크게 올릴수록 곡선 구간의 계단/우글거림이 더 눈에 띄었다.
- [x] `Math.Ceiling` 대신 `Math.Round` 사용, `width + 1 / height + 1` 제거, ellipse diameter 반올림 통일을 시험했으나 육안상 큰 개선은 없었다.
- [x] 따라서 현재 보이는 거친 외곽은 좌표 보정 오차보다는 Win32 Region 방식 자체의 픽셀 단위 경계 특성에 의한 것으로 판단한다.
- [x] VIDEO의 Region Radius는 디자인 기준인 6을 유지한다. 7~9로 키워 숨기는 방식은 현재 환경에서 오히려 품질이 나빠지므로 사용하지 않는다.

### 현재 결론

VIDEO / VIDEO+QUIZ는 아래 조합을 기본 구현으로 사용한다.

```text
AllowsTransparency = false
WPF 내부 CornerRadius = 0
CreateRoundRectRgn + SetWindowRgn = 사용
Region Radius = 6 DIP 기준, DPI 배율 적용
Fullscreen = Region 미적용 / Radius 0
```

이 조합은 WPF 투명창만큼 외곽이 매끈하지는 않지만, 현재 Horizon 환경과 저사양 PC 성능 조건을 동시에 만족시키는 가장 현실적인 절충안이다.

### 재시도하지 않을 항목

특별한 환경 변화나 명확한 근거가 없으면 아래 실험을 반복하지 않는다.

- `AllowsTransparency=true`로 되돌려 VIDEO를 운영하지 않는다.
  - Progress UI 개선 후에도 영상 재생 중 약 70~80% CPU가 재현되었다.
- Region Radius를 7~9 이상으로 키워 계단 현상을 숨기려 하지 않는다.
  - 현재 환경에서는 Radius가 커질수록 우글거림이 더 눈에 띄었다.
- `Ceiling/Round`, `width + 1` 수준의 좌표 미세조정을 반복하지 않는다.
  - 이미 비교했으며 큰 개선이 없었다.
- Overlay 색으로 모서리를 덮는 방식은 사용하지 않는다.
  - Overlay 자체가 선택사항이고 투명도도 가변이므로 실제 뒤 배경색을 안정적으로 재현할 수 없다.
- DWM Rounded Corner만을 전제로 하지 않는다.
  - 현재 Horizon 환경에서는 DWM rounded corner 시각 효과가 보장되지 않는다.

### 더 나은 방식 검토 결과

- Microsoft의 `WebView2CompositionControl`은 WPF의 WebView2 airspace 문제를 해결하기 위한 컨트롤이며 일반 `WebView2`의 대체재가 될 수 있다.
- 다만 현재 확인 가능한 공식 문서만으로는 이것이 `AllowsTransparency=true`인 최상위 WPF Layered Window에서 발생하는 VIDEO 재생 합성 비용까지 제거한다고 볼 근거가 없다.
- 따라서 현재 제품 코드에는 구조 변경을 적용하지 않는다.
- 향후 WebView2 런타임/SDK 또는 Horizon 그래픽 드라이버가 바뀌는 시점에만 별도 실험 항목으로 검토한다.
- 해당 실험을 하게 되면 기존 `WebView2`와 `WebView2CompositionControl`을 동일 영상/동일 Window 조건에서 비교하고, 재생 중 CPU가 `AllowsTransparency=false` 수준에 근접하는 경우에만 채택한다.

### 후속 개발 원칙

더 나은 방법이 새로 확인되지 않는 한 다음 개발자는 위 결론을 그대로 답습한다.

1. VIDEO / VIDEO+QUIZ는 `AllowsTransparency=false`를 유지한다.
2. Radius가 필요하면 `SetWindowRgn` 방식과 Radius 6을 사용한다.
3. 약간의 Region 계단 현상은 현재 성능/환경 제약에서 허용 가능한 한계로 본다.
4. 외곽 품질이 절대적으로 더 중요해지는 경우에만 VIDEO를 Radius 0의 사각형 Window로 전환하는 안을 제품 디자인과 협의한다.
5. Fullscreen에서는 기존대로 Radius 0을 유지한다.

## 2026-10-07 VIDEO Radius 대안: Region 직사각형 절단 + 안티앨리어싱 모서리 창

### 배경

둥근 Region(`CreateRoundRectRgn`)은 픽셀 단위 on/off 경계라 좌표를 어떻게 보정해도 곡선 계단이 남는다. 반면 VIDEO 창의 네 모서리 아래에는 영상이 오지 않는다(콘텐츠 여백 28/24 안쪽에만 영상이 있음). 모서리 아래는 항상 Header 또는 본문 단색이므로 모서리만 별도 창으로 그려도 이음새가 생기지 않는다.

### 방식

- [x] 본 창은 `AllowsTransparency=false` 유지.
- [x] 본 창 Region은 전체 사각형에서 네 모서리의 Radius 크기 정사각형(`ceil(Radius × DPI 배율)` px)만 `CombineRgn(RGN_DIFF)`로 뺀다. 직사각형 Region이라 계단이 생기지 않는다.
- [x] 잘라낸 네 자리에 per-pixel alpha 레이어드 창(`HwndSource`, `UsesPerPixelTransparency`) 4개를 띄우고, 일반 팝업과 같은 WPF `Border(CornerRadius, BorderThickness, BorderBrush, Background)`의 해당 모서리만 그린다. 일반 팝업과 같은 WPF 래스터라이저를 쓰므로 곡선 품질이 동일하다.
- [x] 모서리 창은 본 창 소유(owned), `WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT | WS_EX_TOPMOST`. 포커스·Alt+Tab·클릭에 관여하지 않는다.
- [x] 본 창 `WM_WINDOWPOSCHANGED`에서 모서리 창 위치를 따라 옮기고, 크기가 바뀐 경우에만 Region을 다시 만든다. `DpiChanged`에서 모서리 창을 다시 만든다. `IsVisibleChanged`로 표시/숨김을 맞추고 `Closed`에서 해제한다.
- [x] 모서리 색: 위쪽은 `ShowHeader`이면 `HeaderArea.Background`, 아니면 본문 배경. 아래쪽은 본문 배경. 테두리는 `PopupBodyBorder`의 두께·색(설계 25에서 0이 되면 자동으로 테두리 없음).
- [x] Radius는 `PopupBodyBorder`의 XAML 값(현재 16, 설계 25 적용 후 6)을 읽어 일반 팝업과 항상 같게 맞춘다.
- [x] Fullscreen은 기존대로 미적용.
- [x] 기존 DWM rounded-corner 코드와 PInvoke는 제거했다.

### 성능 판단

모서리 창은 수 px 크기의 정적 화면이며 생성·DPI 변경 때만 렌더링된다. 영상 프레임은 불투명 본 창에서만 갱신되므로 레이어드 합성 비용(`AllowsTransparency=true` 시 70~80% CPU)이 다시 생기지 않는다. 레이어드 창 자체는 DWM rounded corner와 달리 Horizon에서도 동작한다(기존 `AllowsTransparency=true` 창이 표시되었던 것으로 확인됨).

### 확인 필요

- [ ] Horizon 환경에서 모서리 곡선이 일반 팝업과 육안상 동일한지
- [ ] VIDEO 재생 CPU가 기존 `AllowsTransparency=false` 수준(약 10%)에서 늘지 않는지
- [ ] 드래그 이동 중 모서리 창이 본 창을 늦게 따라와 모서리가 잠깐 비어 보이는지(원격 세션 지연 포함)
- [ ] 100%/125%/150% DPI 및 다중 모니터 이동 시 모서리 정렬
- [ ] VIDEO 내부 전체화면 창이 모서리 창보다 위에 표시되는지

드래그 중 모서리 지연이 눈에 띄면, 이동 중에만 모서리 창을 숨기고 이동 종료(`WM_EXITSIZEMOVE`) 후 다시 표시하는 방식으로 보완한다. 그래도 수용이 어려우면 기존 결론(둥근 Region 6 또는 Radius 0 사각형)으로 되돌린다.
