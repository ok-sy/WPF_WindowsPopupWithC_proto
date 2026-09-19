# WPF 폐쇄망 빌드 준비

## 고정 환경

- .NET SDK: `10.0.400`
- Target Framework: `net10.0-windows`
- Runtime: `win-x64`
- 배포 방식: Self-contained
- 외부 NuGet 패키지: `Microsoft.Web.WebView2 1.0.4078.44`

## 저장소 구성

```text
global.json                         SDK 10.0.400 고정
NuGet.config                        저장소 내부 NuGet 피드만 사용
offline-sdk/                        .NET SDK Windows 설치 파일 위치
offline-packages/nuget/             .nupkg 파일 위치
scripts/prepare-offline-packages.ps1 온라인 PC 패키지 수집·검증
scripts/build-wpf-offline.ps1        폐쇄망 restore·publish
```

## 1. 인터넷 가능 Windows PC에서 준비

저장소 루트의 PowerShell에서 실행한다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\prepare-offline-packages.ps1
```

이 스크립트는 WebView2뿐 아니라 `win-x64` Self-contained 게시에 필요한
Runtime Pack까지 `offline-packages\nuget`에 수집한 후 오프라인 복원을 검증한다.

생성된 `.nupkg` 파일은 일반 Git 파일로 추가한다.

```powershell
git add offline-packages/nuget
```

## 2. SDK 설치 파일

Microsoft의 `.NET SDK 10.0.400 Windows x64 Installer`를 받아 다음 위치에 넣는다.

```text
offline-sdk\dotnet-sdk-10.0.400-win-x64.exe
```

SDK 설치 파일은 GitHub 일반 파일 제한을 넘을 수 있으므로 `.gitattributes`에서
Git LFS 대상으로 지정했다. 외부망 PC에서 다음 명령으로 추가한다.

```powershell
git lfs install
git add offline-sdk/dotnet-sdk-10.0.400-win-x64.exe
```

폐쇄망 반입 전에 `git lfs pull`을 실행하여 EXE가 포인터가 아니라 실제 파일인지
반드시 확인한다. 폐쇄망에 Git LFS가 없다면 저장소와 별도로 보안 반입한다.

## 3. 폐쇄망에서 빌드

SDK 설치 후 저장소 루트에서 실행한다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\build-wpf-offline.ps1
```

게시 결과는 다음 위치에 만들어진다.

```text
popup-frameWork\publish\win-x64
```

실행 전 다음 파일도 확인한다.

```text
appsettings.json           DemoMode가 true인지 확인
Media\demo-image.jpg       사용자가 추가
Media\demo-video.mp4       사용자가 추가
```
