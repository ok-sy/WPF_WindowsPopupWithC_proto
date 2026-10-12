# WPF 폐쇄망 빌드 준비

## 고정 환경

- .NET SDK: `10.0.400`
- Target Framework: `net10.0-windows10.0.17763.0` (WebView2CompositionControl용 Windows SDK 런타임 포함)
- 실행 파일: `popupSample.exe` (`AssemblyName` = `popupSample`)
- Runtime: `win-x64`
- 배포 방식: Self-contained
- 외부 NuGet 패키지: `Microsoft.Web.WebView2 1.0.3124.44`
- Windows SDK 참조 패키지: `Microsoft.Windows.SDK.NET.Ref` 등 (대상 프레임워크의 Windows 버전 지정으로 restore 시 함께 필요)

## 저장소 구성

```text
global.json                         SDK 10.0.400 고정
NuGet.config                        저장소 내부 NuGet 피드만 사용
offline-sdk/                        .NET SDK Windows 설치 파일 위치 (*.exe는 Git 제외)
offline-packages/nuget/             .nupkg 파일 위치 (*.nupkg는 Git 제외)
scripts/prepare-offline-packages.ps1 온라인 PC 패키지 수집·검증
scripts/build-wpf-offline.ps1        폐쇄망 restore·publish
scripts/export-offline-package.ps1   폐쇄망 반입 묶음(문서·서버·웹·WPF 소스, 선택 시 개발 의존) 생성
```

## 1. 인터넷 가능 Windows PC에서 준비

저장소 루트의 PowerShell에서 실행한다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\prepare-offline-packages.ps1
```

이 스크립트는 WebView2·Windows SDK 참조 패키지뿐 아니라 `win-x64` Self-contained 게시에 필요한
Runtime Pack까지 솔루션 restore 결과 전체를 `offline-packages\nuget`에 수집한 후 오프라인 복원을 검증한다.
대상 프레임워크나 패키지 버전이 바뀌면 다시 실행한다.

`offline-packages/nuget/*.nupkg`는 용량 때문에 `.gitignore`로 Git에서 제외한다. 저장소에 커밋하지 않고
아래 "4. 반입 묶음 만들기"의 개발 의존 묶음(E-dev-deps)으로 따로 반입한다.

## 2. SDK 설치 파일

Microsoft의 `.NET SDK 10.0.400 Windows x64 Installer`를 받아 다음 위치에 넣는다.

```text
offline-sdk\dotnet-sdk-10.0.400-win-x64.exe
```

`offline-sdk/*.exe`도 `.gitignore`로 Git에서 제외한다(`.gitattributes`에 Git LFS 지정이 남아 있지만 현재 커밋하지 않는다).
SDK 설치 파일은 개발 의존 묶음(E-dev-deps)으로 포함하거나 저장소와 별도로 보안 반입한다.

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

실행 파일 하나만 만들려면 `-SingleFile` 옵션을 준다. .NET 런타임·`appsettings.json`·Demo 이미지·영상이 `popupSample.exe` 안에 포함된다(2026-10-12 기준 91,631,438바이트).

```powershell
.\scripts\build-wpf-offline.ps1 -SingleFile
```

```text
popup-frameWork\publish\win-x64-single\popupSample.exe
```

- 설정은 `popup-frameWork\Popup\Properties\PublishProfiles\FolderProfile.pubxml`과 같다(PublishSingleFile, 네이티브 라이브러리 포함, 압축, 디버그 기호 제외). 참조 설명서(.xml) 파일은 내보내지 않는다.
- WebView2 Runtime은 포함되지 않으므로 대상 PC에 따로 설치되어 있어야 한다.
- 첫 실행 때 포함된 네이티브 라이브러리를 사용자 임시 폴더에 풀어 쓴다. 실행 중 EXE 옆에 WebView2 사용자 데이터 폴더(`popupSample.exe.WebView2`)가 만들어진다.

실행 전 다음 파일도 확인한다.

```text
appsettings.json           DemoMode가 true인지 확인
Media\demo-image.jpg       사용자가 추가
Media\demo-video.mp4       사용자가 추가
```

## 4. 반입 묶음 만들기

외부망 PC의 저장소 루트에서 실행한다. 서버·웹 변경분은 커밋된 상태여야 `git diff`에 잡힌다.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\export-offline-package.ps1                          # offline-export\<날짜시각>
.\scripts\export-offline-package.ps1 -IncludeDevDependencies  # E-dev-deps(offline-packages·offline-sdk)도 생성
```

- 묶음: `A-docs`(docs·db·api·README 등), `B-server`·`C-web`(베이스라인 대비 변경분), `D-wpf`(WPF 소스만, EXE/DLL/PDB 제외), 선택 `E-dev-deps`.
- 묶음별 `MANIFEST-*.txt`와 `README-IMPORT.md`(반입 전 확인 항목)를 함께 만든다. `-IncludeMockSso`로 임시 SSO 프로그램을, `-NoZip`으로 압축 생략을 선택한다.
- `offline-export/`는 Git 제외 대상이다.
