# 75. WPF 개발·운영 빌드 설정 분리

상태: 구현 완료(2026-11-13) · 단일 EXE 실실행 비교 미실행

## 확정 정책

| 설정 경로 | 개발 빌드 | 운영 빌드 |
|---|---|---|
| EXE 옆 `appsettings.json` | 있으면 우선 적용 | 읽지 않음 |
| 앱 설정을 덮어쓰는 환경변수 | 기존 우선순위 유지 | 읽지 않음 |
| 내장 설정 | 외부 JSON이 없을 때 적용 | 배포 환경별 빌드 시 확정 |

운영 빌드의 외부 설정 차단은 컴파일 단계에서 결정한다. 운영 설정 변경은 재빌드·재배포로 반영한다. Windows와 .NET이 사용하는 일반 환경변수는 범위 밖이다. 내장 설정에는 비밀번호·고정 토큰을 넣지 않는다.

## 구현 시 확인할 사항

- [x] `popup-frameWork/Popup/Popup.csproj`와 단일 EXE 게시 경로: 명시적인 개발 빌드에서만 외부 설정을 허용한다. 기본값은 차단으로 두고 운영 게시가 개발 옵션을 사용하지 않는지 확인한다.
- [x] `MainWindow.xaml.cs`의 `LoadPopupClientSettings()`: 운영 빌드에서 EXE 옆 파일의 탐색·읽기 분기를 제외하고 내장 리소스를 읽는다. 개발 빌드는 외부 파일 우선 및 내장 설정 대체 동작을 유지한다.
- [x] `MainWindow.xaml.cs`의 `POPUP_DEV_USER_ID` 참조 및 `Services/StartupOptions.cs`의 `Resolve()`: 운영 빌드에서 `WPF_POPUP_TRAY_ENABLED`, `WPF_POPUP_AUTOSTART_ENABLED`를 포함한 앱 설정용 환경변수 참조를 차단한다. 전체 WPF 환경변수 호출부를 찾아 서버 주소·사용자 ID·실행 모드에 적용되는 추가 경로도 확인한다.
- [ ] 개발·운영 단일 EXE에 동일한 외부 JSON과 앱 환경변수를 제공해 비교한다. 개발 EXE에서 기존 우선순위가 적용되고, 운영 EXE의 API·SSO 대상과 시작 옵션이 내장 설정대로 유지되는지 확인한다. 운영 EXE 옆에 잘못된 JSON을 두어도 파일 읽기나 파싱 실패가 발생하지 않아야 한다.
- 영향 범위는 WPF 빌드·설정 로더·게시 안내다. API 필드·서버·DB 변경은 없다. 기존 EXE에는 새 정책이 적용되지 않으므로 산출물 버전을 구분한다.

## 구현 전 결정할 사항

- **운영 명령행 옵션 범위:** `--demo` 등은 JSON·환경변수와 별도 경로이며 운영 실행 모드를 바꿀 수 있다. 기존 실행 인자를 유지하는 안과 운영에서 모드를 바꾸는 인자만 제한하는 안이 있다. 이번에는 승인된 JSON·환경변수 차단을 적용하고, 운영 실행 모드까지 고정할 경우 모드 변경 인자 제한을 별도로 결정하는 안을 추천한다. 제한하면 해당 인자를 사용하는 운영 시연·진단 방식에 영향이 있다.

## 구현 결과 (2026-11-13)

- **빌드 구분:** `Popup.csproj`에 `PopupAllowExternalConfig` 속성을 추가했다. Debug 구성은 기본 `true`(F5 개발 실행·`launchSettings.json` 환경변수 유지), Release 구성은 기본 `false`다. `true`일 때만 컴파일 상수 `POPUP_EXTERNAL_CONFIG`를 정의한다. `Services/BuildProfile.cs`가 결과를 노출한다.
- **설정 로더:** `LoadPopupClientSettings()`의 EXE 옆 파일 탐색·읽기 분기를 `#if POPUP_EXTERNAL_CONFIG`로 감싸 운영 빌드에서는 코드 자체가 없다.
- **환경변수:** `ResolveDevUserId()`의 `POPUP_DEV_USER_ID` 읽기를 개발 빌드로 한정했다. `StartupOptions.Resolve()`의 기본 환경 읽기 함수를 `DefaultEnvironmentReader`로 바꿔 운영 빌드는 항상 미설정으로 처리한다(테스트 주입 함수는 그대로 사용). WPF 전체 `Environment.GetEnvironmentVariable` 호출부는 이 두 곳뿐이며, 그 외 `Environment` 사용은 폴더 경로·명령행·프로세스 경로로 앱 설정 대상이 아니다.
- **게시 스크립트:** `scripts/build-wpf-offline.ps1`은 기본 `-p:PopupAllowExternalConfig=false`를 명시하고, `-DevConfig` 스위치일 때만 `true`와 `-dev` 접미 출력 폴더를 쓴다. `FolderProfile.pubxml`은 Release 기본값으로 운영 빌드다.
- **명령행 옵션 결정:** 추천안대로 이번에는 JSON·환경변수만 차단하고 `-Demo`·`-Api`·`--tray` 실행 인자는 유지한다. 운영 실행 모드 고정이 필요해지면 별도 TODO로 결정한다.
- **검증:** BehaviorTests(Debug) `PASS: 1740`(개발 빌드 허용·환경변수 우선순위 검사 추가). Release 운영/개발 빌드를 각각 만들어 `popupSample.dll` 문자열을 비교: `POPUP_DEV_USER_ID` 운영 0회·개발 1회, `appsettings.json` 리터럴 운영 5회·개발 6회(외부 파일 경로 분기 제거 확인).
- **미실행:** 운영·개발 단일 EXE에 같은 외부 JSON·환경변수를 주고 실행해 API·SSO 대상과 시작 옵션을 비교하는 실실행 검증, 운영 EXE 옆 잘못된 JSON 배치 실행은 하지 않았다.
