# 14. 폐쇄망 반입 준비 및 WPF UI 보완 TODO

## 0. 목적

현재 팝업 시스템 프로토타입을 폐쇄망 개발/검증 환경으로 옮기기 전에
문서, 서버/웹 소스, WPF 소스 반입 범위를 정리하고
추가 UI 요구사항(폰트 크기 설정)을 함께 관리한다.

이번 TODO의 범위는 다음 네 가지다.

1. 기존 Word 인터페이스 정의서를 현재 구현 기준으로 최신화
2. zero-rule-server는 팝업 관련 소스만 선별하여 폐쇄망 반입 준비
3. zero-rule-web은 팝업 관련 소스만 선별하여 폐쇄망 반입 준비
4. popup-frameWork는 빌드 산출물(EXE/DLL 등) 제외, 소스만 폐쇄망 반입 준비
5. Header / Footer / 본문 폰트 크기를 관리자 설정으로 조절 가능하게 보완

---

## 1. 기존 Word 인터페이스 정의서 최신화

### 1.1 기준 파일

기존 편집용 기준본:

```text
WPF_Popup_API_Interface_Baseline_With_Admin_Content_Options.docx
```

현재 구현과 차이가 있으므로
최종 폐쇄망 반입 전에 지금 기준으로 다시 정리한다.

### 1.2 반영해야 할 현재 구조

기존 개별 API 중심 구조를 현재 WPF 전용 인터페이스 기준으로 갱신한다.

현재 핵심 API 방향:

```text
POST /p/api/wpf/auth/login
GET  /p/api/wpf/popups
POST /p/api/wpf/popups/results
```

기존 문서에 남아 있을 수 있는 아래 개별 호출은
현재 사용 여부를 다시 확인하고 구형/참고 인터페이스로 구분한다.

```text
/popups/{popupId}/hide
/popups/{popupId}/responses
/popups/{popupId}/video-progress
/popups/{popupId}/events
/popups/statuses
```

현재 방향은 팝업 결과를
`/api/wpf/popups/results`로 통합하는 구조다.

### 1.3 인증/공통 Header 반영

문서에 현재 WPF 인증 흐름을 포함한다.

```text
WPF 시작
→ 사내 SSO 사용자 정보 획득
→ WPF 로그인 API
→ 메모리 토큰 발급
→ Authorization: Bearer ...
```

추가 계획으로 확정된 Client Version도 공통 Header에 반영한다.

예:

```http
Authorization: Bearer <token>
X-Client-Version: 1.4.2
```

서버 최소 지원 버전 미달 시
`426 Upgrade Required` 처리 계획도 인터페이스 정의서에 포함한다.

### 1.4 결과 API 최신화

현재 결과 유형 기준으로 IN/OUT 표와 Sample을 다시 작성한다.

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

공통:

```text
resultId
popupId
resultType
displayedAt
closedAt
```

유형별:

```text
HIDDEN
- hideDays

SUBMITTED
- answers
- score
- passed

VIDEO_WATCHED
- durationSeconds
- watchedSeconds
- positionSeconds 등 현재 DTO 기준 필드
```

실제 DTO 명칭은 코드 구현 완료 후 최종 확인하여 Word와 일치시킨다.

### 1.5 설문/퀴즈 판정 정책 반영

현재 확정 방향:

```text
필수 응답 검증 → WPF
점수 계산       → WPF
통과 여부       → WPF
서버            → 결과 저장 중심
```

현재 용도는 신규 입사자 안내 영상,
간단 설문/퀴즈 수준이므로 서버 재채점은 현재 범위에서 제외한다.

### 1.6 영상 시청 정책 반영

현재 목적:

```text
신규 입사자 안내 영상 등의 시청 완료 여부 확인
```

WPF가 시청 비율과 완료 여부를 판단하고
최종 결과만 서버에 전송하는 방향으로 문서화한다.

---

## 2. zero-rule-server 폐쇄망 반입 준비

### 2.1 원칙

zero-rule-server 전체 소스를 반입하지 않고
이번 팝업 기능에 직접 관련된 변경 범위만 선별한다.

단, 팝업 코드가 기존 공통 클래스/설정에 의존하는 경우
컴파일에 꼭 필요한 최소 공통 파일은 별도 목록으로 추가한다.

### 2.2 우선 반입 대상

#### Domain

```text
zero-rule-server/domain/src/main/java/server/domain/popup/**
```

포함 예:

```text
popup/wpf/**
PopupResponseDto
PopupQuestionDto
PopupSubmit*
Video*
AdminPopup*
```

#### Repository / Mapper

```text
zero-rule-server/repo/core/src/main/java/server/repo/core/mapper/popup/**
zero-rule-server/repo/core/src/main/resources/mappers/popup/**
```

#### Service

```text
zero-rule-server/service/core/src/main/java/server/service/core/popup/**
```

포함 예:

```text
PopupService
PopupContentAssembler
PopupQuestionRules
wpf/WpfPopupService
wpf/WpfResultProcessor
```

#### Web API

```text
zero-rule-server/web/api/src/main/java/server/web/api/popup/**
zero-rule-server/web/api/src/main/java/server/web/api/payload/popup/**
```

포함 예:

```text
PopupAdminController
WpfPopupController
WpfApiExceptionHandler
WpfUserResolver 계열
auth/WpfAuthController
auth/WpfPrototypeTokenStore
WpfResultRequest
WpfLoginRequest
```

#### 설정

팝업 전용 설정 클래스 확인:

```text
zero-rule-server/base/src/main/java/server/base/props/WpfPopupProps.java
```

추가로 실제 폐쇄망 서버에서 필요한
DB/JNDI/프로파일 설정 변경분이 있는지 최종 점검한다.

### 2.3 제외 원칙

팝업과 관계없는 기존 Zero Rule 업무 기능은 반입 대상에서 제외한다.

예:

```text
기존 Rule Interface 기능
기존 비팝업 Controller
기존 비팝업 화면/API
팝업 작업과 무관한 도메인
```

### 2.4 반입 전 체크

- [ ] 팝업 관련 변경 파일 목록 생성
- [ ] 신규 파일 / 수정 파일 구분
- [ ] 공통 의존 파일 확인
- [ ] Oracle 대상 SQL/Mapper 확인
- [ ] 테스트 코드 중 팝업 관련 항목 별도 보관
- [ ] 폐쇄망 기존 프로젝트와 충돌 파일 확인
- [ ] 절대경로/개발 DB 주소/로컬 설정 제거 또는 환경화
- [ ] 개발용 `DevUserId` 최종 처리 결정
- [ ] SSO Prototype 코드를 운영 반입할지 최종 결정
- [ ] Client Version 검증 구현 반영 여부 확인

---

## 3. zero-rule-web 폐쇄망 반입 준비

### 3.1 원칙

zero-rule-web 전체 프론트 소스가 아니라
팝업 관리자 기능에 해당하는 소스만 선별한다.

기존 프로젝트의 공통 Layout, API Client, MUI Theme 등에 의존하는 부분은
폐쇄망 기존 소스에 이미 존재하는지 확인하고
없는 것만 최소 추가한다.

### 3.2 우선 반입 대상

관리자 팝업 등록/수정 UI:

```text
zero-rule-web/main/src/features/RgstPop/**
```

현재 확인되는 주요 파일:

```text
PopupEditorDialog.tsx
PopupPreview.tsx
PopupQuestionEditor.tsx
PopupQuestionTemplatePicker.tsx
PopupTemplateDialog.tsx
normalizePopupLink.ts
```

팝업 관련 공통 유틸:

```text
zero-rule-web/main/src/lib/popup-handle.ts
```

도메인/API:

```text
zero-rule-web/sub/domain/src/model/PopupAdmin.ts
zero-rule-web/sub/domain/src/user-apis/PopupAdminApi.ts
```

필요 시 미리보기 페이지:

```text
zero-rule-web/main/pages/popup-preview.tsx
```

### 3.3 제외 원칙

```text
InterfaceMgmt
기존 Zero Rule 관리 기능
팝업과 무관한 페이지/도메인/API
node_modules
빌드 산출물
.next
dist
coverage
```

### 3.4 반입 전 체크

- [ ] 팝업 UI 변경 파일 목록 확정
- [ ] 신규/수정 파일 구분
- [ ] pnpm dependency 추가 여부 확인
- [ ] 폐쇄망 package store에 필요한 npm package 존재 여부 확인
- [ ] API base URL 하드코딩 확인
- [ ] PopupAdmin DTO와 서버 DTO 최신 일치 확인
- [ ] Header/Footer/본문 폰트 크기 설정 UI 추가
- [ ] FIXED 크기 화면 초과 방어와 관리자 입력 범위 정합성 확인
- [ ] Preview와 실제 WPF 렌더링 차이 확인

---

## 4. popup-frameWork 폐쇄망 반입 준비

### 4.1 원칙

WPF는 빌드 완료 EXE를 반입하는 것이 아니라
폐쇄망에서 직접 빌드할 수 있도록 **소스만 반입**한다.

즉 외부망 산출물을 실행 파일 형태로 가져가지 않는다.

### 4.2 반입 대상

```text
popup-frameWork/Popup.slnx
popup-frameWork/Popup/**
popup-frameWork/README.md
```

소스/설정/리소스 포함:

```text
*.cs
*.xaml
*.csproj
*.json
*.pubxml (필요 시)
Media 리소스
Docs
```

MockSso가 폐쇄망 SSO 확인에 필요하면 별도 포함:

```text
popup-frameWork/MockSso/**
```

실제 사내 SSO만 테스트할 예정이면 MockSso는 선택 항목으로 둔다.

### 4.3 반입 제외

반입 패키지에 아래 빌드 산출물을 포함하지 않는다.

```text
bin/**
obj/**
publish/**
*.exe
*.dll
*.pdb
*.deps.json
*.runtimeconfig.json
```

단,
NuGet 패키지 자체는 WPF 소스 산출물이 아니므로
폐쇄망 빌드 의존성 패키지로 별도 관리한다.

### 4.4 별도 준비해야 할 개발환경 의존성

소스 반입과 별개로 폐쇄망 PC에 준비:

```text
.NET SDK 10
필요 NuGet packages
VS Code C# VSIX
.NET Install Tool VSIX
WPF/XAML 지원 VSIX
필요 시 SharpDbg
WebView2 NuGet/Runtime (실제 사용 기능이 있을 경우)
```

### 4.5 반입 전 체크

- [ ] `dotnet restore`가 외부 인터넷 없이 가능한 패키지 구성 확인
- [ ] `dotnet build` 폐쇄망 성공 확인
- [ ] DemoMode=true 구동 확인
- [ ] 실제 API Mode 구동 확인
- [ ] appsettings의 외부망 주소 제거/변경
- [ ] SSO URL 폐쇄망 실제 주소 적용
- [ ] 소스에 개인 PC 절대경로가 없는지 확인
- [ ] bin/obj/publish 삭제 후 반입 패키지 생성
- [ ] EXE/DLL/PDB 미포함 확인
- [ ] Media 파일 반입 필요 여부 확인
- [ ] Windows 시작프로그램 Registry 이름 최종 확정
- [ ] Client Version 생성 기준 확정

---

## 5. Header / Footer / 본문 폰트 크기 설정

### 5.1 요구사항

관리자 화면에서 팝업의 다음 영역별 폰트 크기를 설정할 수 있게 한다.

```text
Header
Footer
본문(Content)
```

각 영역은 독립적으로 설정 가능해야 한다.

예:

```text
HeaderFontSize  = 18
BodyFontSize    = 15
FooterFontSize  = 13
```

### 5.2 데이터 전달 방향

관리자 Web:

```text
폰트 크기 입력
↓
Server 저장
↓
WPF Popup API 응답
↓
PopupFactory
↓
PopupOptions
↓
PopupWindow / Content View
```

### 5.3 권장 필드

공통 Popup 옵션에 다음 필드를 추가하는 방향을 검토한다.

```text
headerFontSize
bodyFontSize
footerFontSize
```

WPF:

```csharp
public double HeaderFontSize { get; set; } = 16;
public double BodyFontSize { get; set; } = 14;
public double FooterFontSize { get; set; } = 12;
```

정확한 기본값은 현재 XAML 스타일 값을 확인한 뒤
기존 화면과 동일하게 결정한다.

### 5.4 Header 적용 대상

예:

```text
PopupWindow 상단 제목
```

대상 후보:

```text
PopupTitleText.FontSize
```

### 5.5 Footer 적용 대상

예:

```text
닫기 버튼
다시 보지 않기
Footer 안내문구
```

Footer 내 모든 글자에 동일 옵션을 적용할지,
버튼/체크박스를 별도 크기로 둘지는 구현 시 현재 XAML 구조를 확인한다.

현재 요구사항에서는 우선 **Footer 공통 FontSize** 하나로 처리한다.

### 5.6 본문 적용 대상

본문은 타입마다 View가 다르므로 공통 처리 범위를 정의해야 한다.

```text
TEXT
IMAGE 설명
VIDEO 제목/설명
SURVEY/QUIZ 질문/설명
```

1차 정책:

```text
bodyFontSize = 각 콘텐츠 View의 기본 본문 텍스트 크기
```

단,
퀴즈/설문의 선택지나 강조문구처럼
기존에 의도적으로 크기가 다른 요소는
상대적 계층을 유지할지 추가 검토한다.

### 5.7 입력 방어

관리자에서 비정상적으로 큰/작은 폰트가 들어오는 것을 막는다.

예시 권장 범위:

```text
최소 10
최대 40
```

실제 범위는 시연 후 조정한다.

WPF에서도 서버값을 그대로 신뢰하지 않고
최종 Clamp를 두는 것이 안전하다.

예:

```csharp
double fontSize =
    Math.Clamp(
        options.BodyFontSize,
        10,
        40);
```

### 5.8 기존 데이터 호환

기존 DB 데이터에 폰트 크기 값이 없더라도
현재 화면과 동일하게 표시되어야 한다.

즉 필드는 nullable 또는 기본값 처리한다.

```text
값 있음 → 관리자 설정값 사용
값 없음 → 기존 기본 FontSize 사용
```

---


## 5A. WPF Service 폴더 / namespace 정합성 정리

### 5A.1 현재 상태

현재 WPF 프로젝트에는 다음과 같은 불일치가 있다.

```text
폴더명: popup-frameWork/Popup/Service/
namespace: Popup.Services
```

C# 문법상 폴더 구조와 namespace는 강제로 일치할 필요가 없으므로 컴파일은 가능하다.
하지만 IDE0130 같은 namespace/folder structure 스타일 진단이 발생할 수 있고,
소스를 처음 보는 사람이 파일 위치와 namespace 관계를 헷갈릴 수 있다.

### 5A.2 권장 정리 방향

특별한 호환성 이유가 없다면 폴더명과 namespace를 맞춘다.

권장안:

```text
폴더: popup-frameWork/Popup/Services/
namespace: Popup.Services
```

현재 서비스 클래스가 여러 개이므로 단수형 `Service`보다 복수형 `Services`가 자연스럽다.

대상 예:

```text
PopupService.cs
PopupApiService.cs
PopupResultQueue.cs
PopupResultBuilder.cs
WindowsStartupService.cs
DemoPopupGateway.cs
DemoPopupDataService.cs
DemoMediaPathService.cs
CrashGuard.cs
Auth/**
```

### 5A.3 변경 시 확인사항

폴더명만 `Service` → `Services`로 변경하고 각 파일의 namespace가 이미 `Popup.Services` 또는 `Popup.Services.Auth`라면
대부분의 C# 코드 수정은 필요하지 않다.

다만 다음은 확인한다.

- [ ] csproj에 특정 파일 경로를 직접 Include/Remove 하고 있는지
- [ ] 문서/README에 `Popup/Service/` 경로가 하드코딩되어 있는지
- [ ] 테스트/스크립트가 기존 경로를 참조하는지
- [ ] XAML이나 리소스 경로에 물리 경로가 직접 연결되어 있는지
- [ ] Git 이동 후 IDE0130이 사라지는지
- [ ] `dotnet build` 성공 여부

### 5A.4 폐쇄망 반입 관점

폐쇄망 반입 전에 이 정리를 끝내면
새 환경에서 소스를 처음 열었을 때 namespace 경고와 폴더 혼동을 줄일 수 있다.

반입 기준도 다음처럼 단순해진다.

```text
Popup/Services/**
→ namespace Popup.Services

Popup/Services/Auth/**
→ namespace Popup.Services.Auth
```

### 5A.5 상태

```text
문서화: 완료
폴더 rename: 미수행
코드 namespace 변경: 불필요 예상
빌드 테스트: 미수행
```

## 6. 관련 기존 TODO/설계와 함께 확인

폐쇄망 반입 전에 아래 문서의 후속 코드 변경도 같이 확인한다.

```text
docs/design/11_WPF_FIXED_화면초과_방어_수정계획.md
docs/design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md
docs/design/13_WPF_클라이언트_버전_서버검증_계획.md
```

특히 다음은 반입 직전에 코드와 문서 일치 여부를 재검증한다.

- [ ] FIXED 화면 초과 방어
- [ ] 결과 로컬 저장 후 UI 즉시 종료
- [ ] 설문/퀴즈 WPF 로컬 판정
- [ ] 영상 시청 완료 로컬 판정
- [ ] 서버 Client Version 검증
- [ ] SSO 최초 1회 조회 / 토큰 재발급 정책
- [ ] Header/Footer/본문 폰트 크기 옵션

---

## 7. 최종 폐쇄망 반입 산출물 구분

최종적으로 반입 자료를 다음처럼 분리한다.

### A. 문서

```text
최신 Word 인터페이스 정의서
DB/ERD 관련 필요한 문서
WPF 실행/빌드 README
폐쇄망 빌드 절차
```

### B. Server 팝업 소스

```text
zero-rule-server의 popup 관련 신규/수정 소스
필수 공통 의존 소스
관련 SQL/Mapper
```

### C. Web 팝업 소스

```text
zero-rule-web의 팝업 관리자 기능 신규/수정 소스
필수 공통 의존 소스
```

### D. WPF 소스

```text
popup-frameWork 소스
XAML
csproj/slnx
설정
필요 리소스
```

빌드 산출물은 제외:

```text
EXE 제외
DLL 제외
PDB 제외
bin/obj/publish 제외
```

### E. 폐쇄망 개발 의존 패키지

```text
.NET SDK
NuGet offline packages
VSIX
필요 Runtime
```

소스 반입물과 개발도구/의존 패키지는 별도 묶음으로 관리한다.

---

## 8. 우선순위

### P0 — 폐쇄망 반입 전 필수

- [ ] Word 인터페이스 정의서 현재 기준 최신화
- [ ] Server 팝업 변경 파일 목록 확정
- [ ] Web 팝업 변경 파일 목록 확정
- [ ] WPF 소스-only 반입 패키지 생성
- [ ] 폐쇄망 빌드 의존 패키지 확인
- [ ] appsettings / URL / 환경별 설정 확인

### P1 — 기능 보완 후 반입 권장

- [ ] FIXED 화면 초과 방어
- [ ] 결과 비동기 전송 UX
- [ ] 로컬 설문/퀴즈 판정
- [ ] Client Version 검증
- [ ] Header/Footer/본문 폰트 크기 설정

### P2 — 최종 검증

- [ ] DemoMode 전체 팝업 실행
- [ ] 실제 사내 SSO
- [ ] API 로그인
- [ ] Popup 조회
- [ ] 결과 저장/재전송
- [ ] 관리자 등록 → WPF 표시 E2E
- [ ] 폐쇄망 PC 재부팅 후 자동 실행

---

## 9. 현재 상태

```text
TODO 문서화: 완료
Word 최신화: 미수행
Server 반입 패키지 생성: 미수행
Web 반입 패키지 생성: 미수행
WPF 소스 반입 패키지 생성: 미수행
폰트 크기 기능 구현: 미수행
빌드/실행 테스트: 미수행
```
