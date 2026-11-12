# TODO74 — WPF BaseUrl의 `/p`를 API 경로로 이동

작성일: 2026-11-12  
상태: **구현·자동 검증 완료(2026-11-12) / 폐쇄망 appsettings 동시 교체 확인 대기**  
적용 범위: WPF 설정·API 호출 경로·Demo 화면 문구·테스트·현행 문서. 서버·관리자 웹·DB 변경 없음(최종 요청 URL 동일).

## 1. 배경

- 서버 context-path는 `/zero-rule-server`이고 `/p`는 컨트롤러 매핑에 들어 있다(`@RequestMapping("/p/api/wpf/popups")`, `/p/api/wpf/auth`, `/p/api/popups/video`, `/admin/p/**`).
- 관리자 웹도 `/p/api/auth/login`처럼 경로 쪽에 `/p`를 붙인다(`zero-rule-web/sub/domain/src/api-url.ts`).
- WPF만 `BaseUrl = .../zero-rule-server/p` + 경로 `/api/wpf/...`로 나눠 서버·웹과 기준이 달랐고, 문서도 `p/api/...`·`BaseUrl(/p 포함)` 표기가 섞여 있었다.

## 2. 변경 기준

| 항목 | 이전 | 이후 |
| --- | --- | --- |
| `PopupApi.BaseUrl` | `http://localhost:8080/zero-rule-server/p` | `http://localhost:8080/zero-rule-server` (컨텍스트 경로까지, `/p` 제외) |
| 단건 조회 | `{BaseUrl}/api/wpf/popups` | `{BaseUrl}/p/api/wpf/popups` |
| 결과 전송 | `{BaseUrl}/api/wpf/popups/results` | `{BaseUrl}/p/api/wpf/popups/results` |
| `Auth.LoginPath` 기본(로컬 프로토타입) | `/api/wpf/auth/login` | `/p/api/wpf/auth/login` |
| `Auth.LoginPath` 폐쇄망 | `/api/auth/sso/login` | `/p/api/auth/sso/login` |
| `DemoApiTargets.Local`·`Dev` | `.../p` · `/api/...` | `/p` 제외 · `/p/api/...` |

최종 요청 URL은 변경 전후가 같다.

## 3. 호환·반입 주의

- 옛 설정(`BaseUrl`에 `/p` 포함)을 새 빌드에 쓰면 `/p/p/api/...`가 되어 404가 난다. 옛 `LoginPath`(`/api/auth/sso/login`)를 쓰면 로그인 경로에 `/p`가 빠진다.
- 폐쇄망은 새 WPF 반입 때 `appsettings.json`의 `BaseUrl`(끝 `/p` 제거)과 `Auth.LoginPath`(`/p/api/auth/sso/login`)를 함께 바꾼다.
- 옛 값 자동 보정(끝 `/p` 제거 등)은 넣지 않았다. 설정 기준을 하나로 두기 위함이다.

## 4. 변경 파일

- 코드: `PopupApiService.cs`, `PopupClientSettings.cs`, `WpfLoginClient.cs`, `MainWindow.xaml.cs`, `DemoWindow.xaml`·`.xaml.cs`·`.Api.cs`, `HttpExchangeRecorder.cs`, `appsettings.json`.
- 테스트: `scripts/ApiDemoTests`, `scripts/PopupWindowTests`, 로컬 검증 프로젝트(Git 제외) `Popup.BehaviorTests`·`Popup.RecoveryTests`.
- 문서: 인터페이스 계약서 §3·WPF-00~02 경로, WPF 에이전트 사양서, ALL 정의서, POL-09·POLICY, `POPUP_OPTION_GUIDE.md`, `README.md`, `popup-frameWork/README.md`, `shell/start-dev.ps1` 주석, 반입 안내(`export-offline-package.ps1`), Excel 생성 스크립트 문구.
- 설계·검토·CHANGELOG의 과거 기록은 당시 표기로 둔다.

## 5. 검증

- [x] `Popup.csproj` 빌드 경고 0·오류 0
- [x] `Popup.RecoveryTests` 255건, `Popup.BehaviorTests` 1,736건, `scripts/ApiDemoTests` 124건, `scripts/PopupWindowTests` 547건 통과
- [ ] 로컬 서버 기동 상태 실호출(로그인·조회·결과)
- [ ] 폐쇄망 appsettings 교체 후 로그인·조회 확인
- [ ] Excel·Word·PDF 인터페이스 산출물 재생성(다음 산출물 갱신 때)
