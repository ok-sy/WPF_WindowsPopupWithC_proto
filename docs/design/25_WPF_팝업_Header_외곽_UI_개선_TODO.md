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
