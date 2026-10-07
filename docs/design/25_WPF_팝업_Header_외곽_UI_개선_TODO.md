# WPF 팝업 Header / 외곽 UI 개선 TODO

## 현재 상태 — 2026-10-07

설계 25의 코드 구현은 완료했다. 현재 남은 작업은 **최종 로고 확정과 Horizon/저사양 PC 실환경 검증**이다.

### 구현 완료

- [x] 공통 팝업 외곽 테두리 제거(`BorderThickness=0`)
- [x] 일반 팝업 Radius `16 → 6`
- [x] Fullscreen Radius 0 유지
- [x] Header 배경 Black / 제목 White 적용
- [x] Header 높이 `48 → 40`, XAML을 높이의 단일 기준으로 사용
- [x] C#에서는 `ShowHeader=false`일 때만 Header row 높이를 0으로 처리
- [x] Header 우측 X 닫기 버튼 제거
- [x] Header 우측에 고정 WPF Resource 로고 표시
- [x] `ShowCloseButton → ShowFooterButton`으로 WPF/Demo 옵션 정리
- [x] 기존 서버 `showCloseButton` JSON은 DTO에서 하위 호환 수신
- [x] VIDEO / VIDEO+QUIZ는 `AllowsTransparency=false` 유지
- [x] VIDEO 내부 WPF `PopupBodyBorder/HeaderArea CornerRadius=0` 유지
- [x] VIDEO Fullscreen에서는 별도 모서리 처리 미적용
- [x] DWM rounded-corner 구현 제거
- [x] `CreateRoundRectRgn` 방식 대신 `OpaqueWindowCorners` 방식 적용
- [x] 본 HWND에서 네 모서리 `s × s` 물리 픽셀 영역을 직사각형 Region으로 제거
- [x] 제거한 영역에 작은 per-pixel-alpha `HwndSource` 4개를 배치
- [x] 기존 `bodySize = size * 4` Border Clip 방식을 제거하고 quarter-circle Geometry로 직접 렌더링
- [x] Region 절단 크기와 Corner HWND/Geometry를 물리 픽셀 기준으로 대응
- [x] DPI 변경 후 지연 재생성하여 새 DPI 기준으로 Region/Corner를 다시 맞춤
- [x] 드래그 중 Corner를 숨기지 않고 본 창 위치를 추적
- [x] 이동 종료 시 HWND를 불필요하게 재생성하지 않고 위치 갱신
- [x] 로컬 PC에서 이전 흰색 돌출/고양이귀 문제가 크게 개선된 것을 확인
- [x] 빌드 경고/오류 0 확인
- [x] 변경 당시 BehaviorTests 798건 통과 확인

## 남은 TODO

- [ ] Header 로고 최종 이미지 확정
- [ ] TEXT / IMAGE / SURVEY / QUIZ 일반 팝업 Radius 6 최종 육안 확인
- [ ] Footer 버튼 표시/숨김 및 SURVEY / QUIZ / VIDEO+QUIZ 제출 동작 회귀 확인
- [ ] Fullscreen Radius 0 및 VIDEO 전체화면 Z-order 확인
- [ ] Horizon에서 VIDEO / VIDEO+QUIZ 모서리 곡선 품질 확인
- [ ] 검은색/짙은색/밝은색 배경에서 돌출, 빈틈, 1px seam 확인
- [ ] Horizon에서 빠른 드래그 시 Corner HWND 추적 지연 확인
- [ ] 100% ↔ 125%, 100% ↔ 150%, 125% ↔ 150% DPI 모니터 양방향 이동 확인
- [ ] DPI 이동 시 이전 '고양이귀' 현상이 재발하지 않는지 확인
- [ ] VIDEO 재생 CPU가 `AllowsTransparency=false` 기준 수준에서 유의미하게 증가하지 않는지 측정
- [ ] 저사양 PC/Horizon 검증까지 통과하면 `OpaqueWindowCorners`를 최종 채택으로 확정

## 현재 VIDEO / VIDEO+QUIZ 구현 기준

```text
Top-level Window
  AllowsTransparency = false
  ↓
WPF 내부 CornerRadius = 0
  ↓
Main HWND
  네 모서리 s × s 직사각형 Region 제거
  ↓
OpaqueWindowCorners
  작은 HwndSource 4개
  UsesPerPixelTransparency = true
  quarter-circle Geometry 직접 렌더링
  ↓
Fullscreen
  Radius = 0 / OpaqueWindowCorners 미적용
```

영상 프레임이 갱신되는 **큰 본 Window는 계속 불투명**하다. 투명 합성은 정적인 수 px 크기의 모서리 HWND 4개에만 사용하여 기존 `AllowsTransparency=true` VIDEO 창의 높은 합성 비용을 피한다.

## 성능 검증에서 확정된 사실

- [x] 기존 Progress/로딩 UI의 불필요한 갱신이 대기 상태 CPU 부하의 한 원인이었고 수정 후 개선됨
- [x] VIDEO 최상위 Window가 `AllowsTransparency=true`이면 재생 중 CPU 약 70~80%가 재현됨
- [x] 같은 조건에서 일시정지하면 CPU 사용률이 크게 내려감
- [x] `AllowsTransparency=false`에서는 VIDEO 재생 CPU가 약 10% 내외까지 내려가는 것을 확인
- [x] 따라서 VIDEO / VIDEO+QUIZ의 `AllowsTransparency=false`는 유지해야 하는 성능 조건으로 확정

## 폐기/대체된 실험

### DWM Rounded Corner — 폐기

현재 Horizon 환경에서는 API 호출 성공 여부와 별개로 둥근 모서리 시각 효과가 보장되지 않았다. 메모장 등 일반 Window에서도 동일하게 각진 외곽이 관찰되어 제품 구현으로 사용하지 않는다.

### CreateRoundRectRgn + SetWindowRgn — 대체됨

`CreateRoundRectRgn` 자체는 Horizon에서 동작했지만 곡선 경계가 픽셀 단위라 계단/우글거림이 남았다.

확인한 내용:

- Radius 6보다 7~9로 키울수록 계단이 더 눈에 띔
- `Math.Ceiling → Math.Round` 변경으로 큰 개선 없음
- `width + 1 / height + 1` 제거로 큰 개선 없음
- ellipse diameter 반올림 조정으로 큰 개선 없음

따라서 **둥근 Region을 직접 만드는 방식은 현재 기본 구현이 아니다.**
현재는 직사각형 Region 절단 + `OpaqueWindowCorners` 안티앨리어싱 Geometry 방식으로 대체했다.

### OpaqueWindowCorners 초기 Border Clip 방식 — 대체됨

초기 구현은 `bodySize = size * 4` 크기의 WPF Border를 만들고 작은 Corner HWND에서 일부만 Clip했다.

실화면에서:

- 대비가 큰 배경에서 흰색 돌출부가 보임
- DPI가 다른 모니터 이동 시 순간적으로 '고양이귀'가 발생

하여 현재 구현에서는 사용하지 않는다.

현재는:

```text
Main HWND가 제거하는 s × s 물리 픽셀
                 ↕
Corner HWND의 s × s 물리 픽셀
                 ↕
quarter-circle Geometry
```

가 직접 대응하도록 변경했고 DPI 변경 후 새 좌표계로 재생성한다.

## 재시도하지 않을 항목

특별한 환경 변화나 새로운 근거가 없는 한 다음 실험은 반복하지 않는다.

1. VIDEO / VIDEO+QUIZ 최상위 Window를 `AllowsTransparency=true`로 운영하지 않는다.
2. `CreateRoundRectRgn` Radius를 7~9 이상으로 키워 계단을 숨기려 하지 않는다.
3. Region의 `Ceiling/Round`, `width + 1` 수준의 미세조정을 반복하지 않는다.
4. Overlay 색으로 모서리를 덮지 않는다. Overlay는 존재 여부와 투명도가 옵션이므로 실제 배경을 안정적으로 재현할 수 없다.
5. DWM Rounded Corner만을 전제로 구현하지 않는다.
6. 초기 `bodySize = size * 4` Border Clip 방식으로 되돌리지 않는다.

## OpaqueWindowCorners 최종 채택 기준

다음 조건을 모두 만족하면 현재 방식을 최종안으로 확정한다.

1. Horizon의 검은색 등 대비가 큰 배경에서도 네 모서리 돌출/빈틈이 육안으로 보이지 않을 것.
2. DPI가 다른 모니터 사이를 이동해도 고양이귀가 발생하지 않을 것.
3. 드래그 중 Corner HWND 추적 지연이 눈에 띄지 않을 것.
4. VIDEO 재생 CPU가 기존 `AllowsTransparency=false` 수준에서 유의미하게 증가하지 않을 것.
5. VIDEO 내부 Fullscreen과 다른 Window의 Z-order에 이상이 없을 것.

조건을 만족하지 못하고 추가 복잡도가 과도해지면 VIDEO Radius 0 사각형 정책을 최종 fallback으로 검토한다.

## 향후 별도 검토

`WebView2CompositionControl`은 WPF WebView2의 airspace 문제를 해결하는 대체 컨트롤이지만, 최상위 WPF Layered Window의 VIDEO 합성 비용까지 제거한다고 현재 판단할 근거는 없다.

따라서 지금 제품 코드에는 적용하지 않는다. WebView2 Runtime/SDK 또는 Horizon 그래픽 환경이 바뀐 경우에만 기존 WebView2와 동일 조건 CPU 비교 후 별도 검토한다.
