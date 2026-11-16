# 76. VM 복귀 시 표시 중인 WPF 팝업과 Overlay 배치 회귀 검증

상태: **추정 원인 기준 수정·진단 로그·자동 검증 완료(2026-11-16)** · VM 실환경 재현·로그 확인 대기.

## 관찰 결과

- Windows 호스트에서 VMware VM에 로그인한다. VM에서 팝업을 표시한 상태로 자리비움으로 호스트 Windows 화면에 전환된다. 호스트 잠금을 해제한 후 VM으로 복귀하면 기존 팝업과 배경 Overlay가 좌상단에 쏠린다.
- 사용자 확인 결과 기존 창에서만 발생했다. 복귀 후 새로 호출한 후속 팝업은 정상 배치됐다. VM 종류·버전, 모니터 구성·DPI와 이벤트 순서는 추가 확인이 필요하다.
- 잠금·전환 중 게스트의 화면 정보가 바뀌고 기존 창이 그 정보를 기준으로 배치된 뒤 복구되지 않았을 가능성이 있다. 원인은 아직 확정되지 않았다.

## 구현 시 확인할 사항

- [x] 기준 코드 `c5ea76b`의 `popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs`에서 `CurrentWorkArea()`, `ApplyPosition()`, `RefreshForDisplayChange()`를 추적한다. 현재 작업 영역 안에 들어온 좌상단 위치가 복귀 후 그대로 유지되는지 확인한다.
- [x] `Managers/BackgroundOverlayManager.cs`의 `Show()`와 `FitToScreen()`에서 생성 당시 `Screen.AllScreens`와 모니터 좌표를 사용한다. 복귀 뒤 기존 Overlay의 화면 개수·크기·좌표가 게스트 모니터 목록과 일치하는지 확인한다. `Managers/PopupManager.cs`의 `Show()`에서 팝업과 Overlay의 생성 순서도 비교한다.
- [ ] (로그 기능 구현, VM 수집 대기) 잠금 전, VM 복귀 직후와 약 1초 뒤에 게스트의 모니터 개수·장치명·Bounds·WorkingArea·DPI, 팝업·Overlay 창 좌표, 세션 및 디스플레이 변경 이벤트 시각을 같은 로그에서 비교한다. 호스트 잠금과 게스트 화면 전환을 구분하고, 게스트 정보만으로 원인이 설명되는지 먼저 확인한다.
- [ ] (VM 실환경 대기) 기존 팝업을 띄워 둔 상태에서 잠금·복귀를 반복하고 후속 팝업 신규 호출을 대조군으로 둔다. Overlay 켜짐·꺼짐, 단일·다중 모니터, 배율 변경이 가능한 구성, 잠금 없이 VM 창 전환하는 경우를 비교한다.
- 완료 기준은 재현 조건과 좌표가 어긋나는 시점을 로그로 설명하고, 수정 후 동일 절차에서 기존 팝업이 유효한 위치로 돌아오며 Overlay가 현재 모니터 영역에 맞는 것이다. 화면 구성이 그대로인 복귀에서 유효한 드래그 위치를 유지하고, 후속 팝업 정상 배치 및 종료 시 Overlay 정리도 확인한다.
- 영향 범위는 WPF 창 배치와 Overlay 수명주기다. 이번 등록은 관찰 및 코드 검토 기준만 기록한다. VM 실환경 재현·수정·회귀 실행은 대기다.

## 구현 전에 결정할 사항

- 복귀 이벤트에서 게스트 화면 변화가 실제로 관측될 경우, 기존 창 좌표를 다시 계산하는 방식과 모니터 구성 변경 시 Overlay를 다시 맞추는 방식을 검토한다. 원인이 확인되면 변경된 화면의 창만 보정하는 범위를 우선한다. 화면 구성 변경이 없는 복귀에도 재배치하면 사용자 드래그 위치가 달라질 수 있다.

## 결정 (2026-11-16)

VM 재현 환경이 없어 로그로 원인을 확정하지 못했으나, 코드 추적으로 설명되는 추정 원인을 기준으로 **진단 로그와 수정을 함께 반영**하고 VM 실환경에서 로그로 확인하기로 했다.

## 코드 추적 결과 (추정 원인)

- 호스트 잠금·전환 중 VMware 게스트 해상도가 잠시 줄면 Windows가 창을 줄어든 화면 안(좌상단 쪽)으로 밀어 넣는다.
- Overlay(`BackgroundOverlayManager`)는 `Show()` 때 `FitToScreen()`으로 한 번만 모니터 물리 영역에 맞추고 화면 변경 이벤트를 받지 않는다. 복귀 뒤에도 줄어든 크기·좌상단 위치로 남는다.
- 팝업(`PopupWindow.RefreshForDisplayChange()`)은 작업 영역을 **벗어났을 때만** 설정 위치로 되돌렸다. 좌상단으로 밀린 위치는 복귀 뒤 넓어진 작업 영역 안이라 그대로 남는다. 또한 이 경로는 `DpiChanged`·`SystemParameters.WorkArea` 변경에만 걸려 있어 해상도 변경에서 호출되지 않을 수 있다.
- 후속 팝업은 표시 시점의 작업 영역으로 새로 계산하므로 정상이다. 관찰 결과(기존 창만 쏠림)와 일치한다.

## 구현 결과 (2026-11-16)

- `PopupManager`: 팝업 표시 중에만 `SystemEvents.DisplaySettingsChanged`·`SessionSwitch`(잠금/해제·콘솔/원격 연결/해제)를 구독하고 닫히면 해제. 이벤트 직후 1회 + 1초 뒤 1회 `Overlay.Refit()` → 각 팝업 `RefreshForDisplayChange()` → 팝업을 Overlay 위로(`SetWindowPos HWND_TOPMOST`, 활성화 없음).
- `BackgroundOverlayManager.Refit()`: 모니터 수가 같으면 같은 순서의 모니터 물리 영역으로 다시 맞추고, 바뀌었으면 닫고 현재 모니터 목록으로 다시 만든다.
- `PopupWindow`: Header를 실제로 끌어 옮겼을 때만 사용자 위치(`_userPlacement`)를 기억한다. 화면 변경 시 사용자 위치가 없으면 설정 위치로, 있으면 현재 작업 영역에 들어갈 때 그 위치로, 들어가지 않으면 설정 위치로 둔다(사용자 위치는 기억해 두어 화면이 다시 넓어지면 복원). 화면 구성이 그대로인 복귀에서는 드래그 위치가 유지된다.
- `Services/DisplayDiagnostics`: 각 시점(보정 전/후, `+1s`)의 모니터 장치명·Bounds·WorkingArea(물리 픽셀)와 팝업·Overlay의 WPF 좌표(DIP)·실제 창 사각형(물리 픽셀)·모니터·DPI 배율을 `%LOCALAPPDATA%\Popup\logs\display-yyyyMMdd.log`에 남긴다. 사용자 정보·팝업 내용은 남기지 않는다.
- 문서: `WPF_POPUP_ALL_SPEC.md` 위치 규칙, `WPF_AGENT_SPEC.md` §5.4.
- 검증: `PopupWindowTests` `PASS: 558`(신규 10건 — 밀린 창 설정 위치 복귀, 끌어 놓은 위치 복원·영역 밖이면 설정 위치, Overlay 재맞춤·모니터 수 일치, 팝업이 Overlay 위, 진단 로그 기록, 1초 뒤 재적용, 닫힘 시 구독 해제). 기존 "화면 안 드래그 위치 유지" 검사는 실제 끌기와 같은 사용자 위치 기록으로 바꿔 유지. `Popup.BehaviorTests` 1740, `ApiDemoTests` 143 통과, Release 빌드 경고·오류 0.
- 미실행: VMware 실환경 잠금·복귀 재현과 로그 확인, 다중 모니터·배율 변경 구성, 잠금 없는 VM 창 전환 비교.

## VM 확인 절차

1. 팝업(Overlay 켜짐)을 띄운 채 호스트 잠금 → 해제 → VM 복귀.
2. 기존 팝업이 설정 위치로, Overlay가 전체 모니터로 돌아오는지 확인. 팝업을 끌어 옮긴 뒤 같은 절차에서 그 위치가 유지되는지 확인.
3. 게스트 `%LOCALAPPDATA%\Popup\logs\display-*.log`에서 `SessionSwitch:*`·`DisplaySettingsChanged`와 `+1s`의 보정 전/후 좌표를 비교해 추정 원인(해상도 축소 → 좌상단 이동)이 맞는지 기록.
