# 44. Background Overlay 키보드와 종료 동작 검토 TODO

기준일: 2026-10-13 (KST).  
상태: **코드 구현 완료 · 실화면 확인 대기**.

Trello: [TODO44 Background Overlay 키보드와 종료 동작 검토](https://trello.com/c/zDjMjmco/66-%EC%95%84%EC%9D%B4%EB%94%94%EC%96%B4-background-overlay-%EC%8B%9C-%ED%82%A4%EB%B3%B4%EB%93%9C%EC%A2%85%EB%A3%8C-%EB%8F%99%EC%9E%91-%EA%B2%80%ED%86%A0). Git TODO 반영 후 진행 확정 목록으로 이동한다. 두 과제를 보류로 분류했던 상태를 정정하며, 다른 나중에 보기·상시 팝업 보류 과제와 구분한다.

## 범위와 기존 동작

Overlay가 켜졌을 때 앱에서 처리하는 포커스·키보드·닫기 경로를 구체화한다. OS 보안 단축키·작업 관리자·프로세스 강제 종료 차단은 보장 범위가 아니다.

## 작업 목록

- [x] 44-1 현재 Overlay on/off의 클릭·포커스·Tab·Escape·Alt+F4·창 닫기·트레이 종료 경로를 수집한다.
- [x] 44-2 팝업 유형별 showFooterButton·allowCloseBeforeComplete·설문 필수 검증·퀴즈 통과·영상 완료 조건과 모든 종료 경로를 대조한다.
- [x] 44-3 차단·허용할 앱 내 입력과 복구 가능한 종료 경로를 명시한다. 관리자 옵션으로 추가할지 고정 동작인지 결정한다.
- [ ] 44-4 다중 모니터·전체화면 전환·다른 앱 활성화·키보드 전용 사용·보조 기술을 포함해 포커스 이탈과 복귀를 검토한다. (창 제목·첫 포커스만 반영. 나머지는 남은 항목)
- [x] 44-5 장애나 사용자 강제 종료 시 미전송 결과/전달 건 복구를 TODO35·39·45·47과 연결한다.
- [ ] 44-6 구현 결정 후 현재 숨김/닫기/제출·Overlay 비활성 흐름 회귀 및 실제 Windows 화면 검증을 기록한다. (자동 회귀 완료, 실제 Windows 화면 검증은 남음)

## 완료 기준

앱이 제어할 입력·종료 범위와 접근성·복구 경로가 명시되고 완료 제한과 충돌하지 않는다.

기존 완료·채점·시청 판정 및 결과 전송·복구 계약을 유지하며 UX 변경에 필요한 구체적 상태 전이는 구현 전에 정리한다. 구현·자동 검증·실제 Windows 화면 검증을 각각 기록한다. 코드 변경 시 MINIMAL/ALL·관련 계약·관리자 미리보기·Demo 문서를 함께 검토한다.

## 조사 결과 (2026-10-15, 구현 전 코드 기준)

- 닫기 경로는 푸터 버튼과 Alt+F4(시스템 메뉴 닫기·외부 WM_CLOSE 포함)였다. Esc는 처리하지 않았는데 `PopupWindow.OnClosing` 주석은 'ESC로 닫힘'이라 틀렸다. 창은 `WindowStyle=None`, 제목은 `PopupWindow` 고정이었다.
- Overlay(`BackgroundOverlayManager`)는 모든 모니터에 Topmost·NOACTIVATE 창을 띄워 클릭을 삼키고 팝업을 다시 앞으로 올린다. 키보드는 막지 않는다.
- 결함 1: 앱 종료·로그오프(Application.Shutdown) 중 `PopupWindow.OnClosing`이 취소를 표시하면 `PopupManager` Closing 핸들러가 취소를 보고 결과를 만들지 않았다. WPF는 종료 중 취소를 무시하고 닫으므로 VIDEO 미완료·VIDEO+QUIZ 잠금 상태의 CLOSED/VIDEO_WATCHED(시청량)가 사라졌다.
- 결함 2: `PopupManager.Show`가 Overlay를 먼저 띄운 뒤 팝업 생성·표시에서 예외가 나면 Overlay가 남아 모든 모니터 클릭을 삼켰다.
- 로그오프: `SessionEnding` 처리가 없어 `App.IsExiting`이 false로 남았다(App.xaml.cs 주석과 달랐다).

## 결정 (2026-10-15)

- D1 고정 동작이며 관리자 옵션은 추가하지 않는다.
- D2 `useBackgroundOverlay=true`: **앱이 시작한 닫기**(푸터 닫기·보조 닫기·LINK_AND_CLOSE·제출 완료 후 닫기)와 **앱 종료**(트레이 종료·426 종료·로그오프)만 허용한다. 그 밖의 닫기 요청(Alt+F4, Alt+Space→닫기, 외부 WM_CLOSE)은 `OnClosing`에서 취소하고 Alt+F4는 `PreviewKeyDown`(Key.System + F4)에서도 처리한다.
- D3 교착 방지: Overlay가 켜져 있어도 화면에 닫기·제출 수단이 하나도 없으면 키보드 닫기를 막지 않는다. 예: TEXT/IMAGE/VIDEO의 `showFooter=false` 또는 `showFooterButton=false`, 푸터 없는 VIDEO+QUIZ가 잠긴 채 재생 실패. 이때 VIDEO의 `allowCloseBeforeComplete` 제한은 그대로 적용한다. SURVEY/QUIZ는 제출 버튼이 항상 보이므로 막힌다(QUIZ는 통과해야 닫힘 — 설계 43 D7).
- D4 `useBackgroundOverlay=false`: 기존 동작(Alt+F4 허용, VIDEO 제한은 설계 50 A10).
- D5 Esc는 팝업 창에서 아무 동작도 하지 않는다. 영상 전체화면 해제·PopupAlert의 Esc는 유지한다.
- D6 앱 종료 중(`App.IsExiting` 또는 Dispatcher 종료)에는 닫기 제한을 적용하지 않고 결과를 저장한다. 로그오프는 `App.OnSessionEnding`에서 종료 플래그를 세운다(취소하지 않으면 WPF가 이어서 Shutdown).
- D7 접근성: 창 제목 = 팝업 제목(Alt+Tab·스크린리더). 첫 포커스는 SURVEY/QUIZ의 첫 입력, 그 밖에는 본문의 첫 포커스 가능 요소. **푸터 주 버튼의 IsDefault와 첫 포커스는 적용하지 않는다**: 팝업이 다른 작업 중에 뜨면 그 작업의 Enter·Space 입력으로 바로 닫히거나 제출될 위험이 있다.

## 구현 결과 (2026-10-15)

- `PopupWindow`: `_closeRequestedByApp` + `CloseByApp()`(앱 내부 닫기 공통 진입점, `CloseButton_Click`·`PopupManager.SubmitSurveyResult`가 사용), `BlocksExternalClose`/`HasVisibleExit()`(D2·D3), `PopupWindow_PreviewKeyDown`(Alt+F4), `IsApplicationExiting()`, `OnClosing`(종료 중 제한 미적용, Overlay 차단 추가), 창 제목·`SetInitialFocus()`. 'ESC로 닫힘' 주석 정정.
- `PopupManager`: 결함 1 — Closing 핸들러가 종료 중에는 취소와 관계없이 결과를 저장하고, 취소된 Closing 뒤 실제로 닫힌 경우(App 플래그 없는 Shutdown, 소유자 창 종료 등)를 Closed에서 한 번 더 확인해 저장(실패는 `RetainResultForExit`). 결함 2 — `Show`가 생성·표시 실패 시 열린 창 목록에서 빼고 Overlay를 닫은 뒤 예외를 다시 던진다. '닫기 버튼으로 나가면' 주석 정정.
- `App`: `OnSessionEnding` 추가, 종료 플래그·트레이 정리를 `BeginExit()`로 묶어 `ExitAgent`와 공유. `IsExiting` 주석 정정.
- 문서: `WPF_POPUP_ALL_SPEC.md`(Background Overlay와 닫기 경로 절), `POPUP_INTERFACE_SPEC.md`, `POPUP_OPTION_GUIDE.md`, `POPUP_USER_OPTION_GUIDE.md`, `WPF_POPUP_MINIMAL_SPEC.md`(모순 문장 정정).

## 검증 (2026-10-15)

- `dotnet build popup-frameWork/Popup/Popup.csproj`: 경고 0·오류 0.
- `dotnet run --project scripts/PopupWindowTests`(저장소 추적): PASS 97건(기존 23건 + 설계 43·44 74건).
- `dotnet run --project scripts/RichTextTests`: PASS 85건.
- 로컬 `popup-frameWork/Popup.BehaviorTests`: PASS 1014건(기존 1012건). 새 동작에 맞춰 기대를 바꾼 항목: VIDEO+QUIZ 잠금 검사를 FooterArea 전체 대신 제출·다시 보지 않기 비활성으로 확인, 같은 검사에서 Overlay 차단을 배제하려고 `UseBackgroundOverlay=false` 지정, 34-39 VIDEO 검사를 '필수 영상 시청' 안내창 대신 버튼 비활성·사유 문구·안내창 없는 클릭 가드로 확인(1건 → 2건).
- 로컬 `popup-frameWork/Popup.RecoveryTests`: PASS 158건.
- `scripts/PopupWindowTests` 설계 44 항목: Overlay 켜짐 TEXT에서 Alt+F4 키 처리, `WM_CLOSE`·`WM_SYSCOMMAND/SC_CLOSE`(실제 SendMessage)·외부 `Window.Close` 취소, Esc 무시, 푸터 닫기·`CloseByApp` 허용; `showFooter=false`·`showFooterButton=false`에서 키보드 닫기 허용; Overlay 켜짐 VIDEO(푸터 없음)의 완료 전 제한 유지·시청 후 허용; Overlay 켜짐 QUIZ 차단; 푸터 없는 VIDEO+QUIZ 잠금 + 재생 실패 시 허용; Overlay 꺼짐 기존 동작; 창 제목; PopupManager를 붙인 VIDEO·VIDEO+QUIZ·Overlay 켜진 VIDEO에서 사용자 닫기 취소 후 `InternalClose(true, true)`(Application.Shutdown 경로)로 닫으면 VIDEO_WATCHED·시청량 저장(결함 1); `SizeMode` 오류로 생성 실패 시 예외 전달·Overlay 닫힘·다음 팝업 정상 표시(결함 2).
- 회귀 검증의 유효성: 결함 1 보완(Closed 저장)과 결함 2 보완(Overlay 닫기)을 각각 일시적으로 되돌리면 해당 검사가 실패하는 것을 확인한 뒤 원복했다.
- 실행하지 않은 검증: 실제 Windows 화면에서의 Alt+F4·Alt+Space 메뉴, 다중 모니터 Overlay, 실제 로그오프·시스템 종료(SessionEnding) 시 결과 파일 저장, 스크린리더 창 이름 읽기.

## 남은 항목(범위 밖)

- 모니터 구성 변경(연결·해제·해상도 변경) 시 Overlay 재배치.
- 다른 앱으로 포커스가 넘어갔을 때 팝업 포커스 강제 복귀.
- 전체화면 앱(프레젠테이션·게임) 실행 중 표시 감지·지연.
- 불투명도 0일 때 클릭 통과 여부(현재는 0이어도 클릭을 삼킨다).
- OS 보안 단축키(Ctrl+Alt+Del)·작업 관리자·프로세스 강제 종료는 보장 범위가 아니다. 강제 종료 시 미전송 결과 복구는 TODO35·39·45·47의 기존 큐·복구 경로를 따른다.
- 영상 전체화면 창(별도 창)의 Alt+F4는 전체화면만 닫는다(팝업은 유지). 실화면 확인 대상.
