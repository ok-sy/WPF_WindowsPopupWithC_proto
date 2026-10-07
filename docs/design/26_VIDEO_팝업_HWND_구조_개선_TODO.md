# 26. VIDEO 팝업 HWND 구조 개선 TODO

## 목표

- VIDEO 팝업의 둥근 모서리를 위해 추가된 보정 구조를 구조적으로 재검토한다.
- `OpaqueWindowCorners` 및 모서리용 `HwndSource` 4개를 제거할 수 있는 구조를 검증한다.
- WebView2는 사각형 Opaque 렌더링 영역으로 책임을 분리한다.
- Popup 외형(Header/Footer)과 Content 렌더링 영역의 책임을 분리한다.
- `AllowsTransparency=false`의 VIDEO 성능 이점을 유지한다.
- 사용자 관점에서는 하나의 Popup으로 동작하도록 한다.
- VIDEO에서 안정성이 검증되면 공통 Popup Host 구조로 승격 가능한지 검토한다.

## 1. 현재 구조 분석

- [ ] 현재 VIDEO HWND 구조 정리
- [ ] `OpaqueWindowCorners` 의존성 정리
- [ ] 모서리 `HwndSource` 4개의 생성/이동/DPI/Z-Order 처리 범위 정리
- [ ] 현재 구조에서 Header/Footer/WebView2의 책임 범위 정리

## 2. 목표 구조 설계

- [ ] Popup Host 책임 정의
  - 위치
  - 크기
  - 드래그
  - Lifecycle
  - Fullscreen
- [ ] Header 책임 정의
  - 상단 UI
  - 상단 Radius
- [ ] Video Surface 책임 정의
  - WebView2 전용
  - 사각형 Opaque 영역
  - `AllowsTransparency=false`
- [ ] Footer 책임 정의
  - 하단 UI
  - 하단 Radius
- [ ] Header / Content / Footer와 Popup Chrome의 경계 정의

## 3. VIDEO Prototype

- [ ] Header / Footer / WebView2 분리 Prototype 구현
- [ ] 부모 Popup을 하나의 이동 단위로 유지 가능한지 검증
- [ ] Header 드래그 시 전체 Popup이 하나처럼 이동하는지 검증
- [ ] 부모 HWND의 사각형 배경이 Radius 바깥에 노출되는지 검증
- [ ] WebView2 Airspace / Child HWND 문제 검증
- [ ] Header 상단 Radius 정상 표시 확인
- [ ] Footer 하단 Radius 정상 표시 확인
- [ ] Header / Video / Footer 사이 seam 발생 여부 확인

## 4. 성능 및 동작 검증

- [ ] VIDEO `AllowsTransparency=false` 유지 확인
- [ ] VIDEO 재생 CPU 사용률 비교
  - 현재 OpaqueWindowCorners 방식
  - 신규 구조
- [ ] Fullscreen 진입/복귀 검증
- [ ] Fullscreen Radius 0 적용 확인
- [ ] Fullscreen VIDEO Z-Order 검증
- [ ] 다중 모니터 이동 검증
- [ ] 100% ↔ 125% DPI 이동 검증
- [ ] 100% ↔ 150% DPI 이동 검증
- [ ] 125% ↔ 150% DPI 이동 검증
- [ ] 빠른 드래그 시 구성 요소 추적 상태 검증
- [ ] VMware Horizon 환경 검증
- [ ] 저사양 PC 성능 검증

## 5. 기존 VIDEO 기능 회귀 테스트

- [ ] Play / Pause
- [ ] Seek
- [ ] Volume / Mute
- [ ] PlaybackRate
- [ ] Fullscreen
- [ ] CompletionRatio
- [ ] VIDEO + QUIZ
- [ ] Footer

## 6. 기존 모서리 보정 구조 제거 검토

- [ ] 신규 구조가 안정적이면 `OpaqueWindowCorners` 제거
- [ ] Corner `HwndSource` 생성 코드 제거
- [ ] Corner 위치 추적 코드 제거
- [ ] Corner DPI 물리 픽셀 보정 코드 제거
- [ ] Corner Geometry 생성 코드 제거
- [ ] Corner Z-Order 동기화 코드 제거
- [ ] 기존 방식 대비 구조 복잡도 비교
- [ ] 신규 구조 채택 / 기존 구조 유지 최종 결정

## 7. 공통 Popup Host 승격 검토

> VIDEO Prototype이 CPU, Horizon, DPI, 드래그, Fullscreen 검증을 통과한 경우에만 진행한다.

- [ ] 신규 HWND 구조의 공통 Popup Host 적용 가능성 검토
- [ ] 공통 Popup Host 책임 정의
  - Header
  - Footer
  - Drag
  - Position
  - Size
  - Radius
  - Fullscreen
  - Lifecycle
- [ ] Content 영역과 Popup Chrome 영역 분리
- [ ] TEXT 적용 검증
- [ ] IMAGE 적용 검증
- [ ] SURVEY 적용 검증
- [ ] QUIZ 적용 검증
- [ ] VIDEO 적용 검증
- [ ] VIDEO + QUIZ 적용 검증
- [ ] 팝업 유형별 중복 Window 처리 제거 가능 범위 확인
- [ ] 공통 Popup Host 최종 채택 여부 결정

## 최종 채택 기준

신규 구조는 아래 조건을 모두 만족할 때 기존 구조를 대체한다.

- VIDEO 재생 CPU가 현재 Opaque 기준에서 유의미하게 악화되지 않을 것
- Horizon에서 모서리, seam, 돌출 문제가 없을 것
- 서로 다른 DPI 모니터 이동 시 시각적 깨짐이 없을 것
- 드래그 시 Header / Content / Footer가 하나의 Popup처럼 동작할 것
- Fullscreen 진입/복귀 및 Z-Order가 정상일 것
- 기존 VIDEO / VIDEO+QUIZ 기능에 회귀가 없을 것
- 기존 Corner HWND 보정 방식보다 구조와 유지보수성이 단순할 것

## 원칙

- 단순히 모서리 증상을 숨기기 위한 보정 코드를 추가하지 않는다.
- VIDEO 렌더링 영역은 사각형 Opaque Surface로 유지하는 것을 우선한다.
- Popup 외형과 Content 렌더링 책임을 분리한다.
- Prototype 검증 전 기존 안정 구조를 제거하지 않는다.
- 공통화는 VIDEO Prototype의 안정성 검증 이후에만 진행한다.
