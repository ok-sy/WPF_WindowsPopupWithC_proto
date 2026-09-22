# 변경 이력

프로젝트의 수정 내역과 검증 결과를 기록한다. 날짜는 한국 시간(KST)을 사용한다.

## 2026-09-22-06 — 설계 11·12·13·14 TODO 구현 (FIXED 방어, 결과 비동기·로컬 판정, 클라이언트 버전 검증, 폰트 크기, Services 폴더, 반입 패키지, 정의서 v2.0)

- 이유: 사용자 지시 "git pull 받고 todo 해야해" — pull로 받은 설계 11~14의 미수행 항목(코드 수정·반입 준비·정의서 최신화) 처리.
- **WPF 폴더 정리(설계 14 §5A)**: `git mv Popup/Service → Popup/Services`(namespace `Popup.Services` 그대로). README·정의서·설계 10/12/13의 경로 참조 갱신.
- **FIXED 화면 초과 방어(설계 11)**: `PopupWindow.ApplyWindowSize()` Fixed 분기 — WorkArea 95% 상한, 서버 Maximum 적용, Minimum > 상한 역전 보정, Window Min/Max도 보정값으로 재지정. 알 수 없는 SizeMode(default)도 Fixed 분기로 합류.
- **결과 제출 UX·로컬 판정(설계 12)**:
  - WPF: `PopupResultQueue` — `EnqueueAsync`(파일 저장만) / `FlushAsync` / `FlushInBackground`(예외 내부 처리)로 역할 분리, `EnqueueAndSendAsync`·`SendImmediateAsync` 삭제. `PopupOptions` 훅을 `EnqueueResultAsync`/`FlushResultsInBackground`로 교체(`ReportResult*` 삭제). `PopupManager` — 제출·닫기 모두 "로컬 큐 저장(await) → QUIZ 점수 안내 → 창 닫기 → 백그라운드 전송". `SurveyPopupView` — 필수 응답 검증 후 QUIZ는 새 `Services/QuizGrader`(서버 gradeAnswer와 같은 규칙: 선택 집합==정답 집합·EXACT/CONTAINS·부분 점수 없음, 구 데모 JSON correctAnswers 호환)로 즉시 채점, 이벤트 인자를 `Models/SurveySubmission`(answers/score/passed/passingScore)으로 변경, `passingScore` 매개변수 복원. DTO/모델에 `questionScore`/`correctAnswer`/`answerMatchMode`/`options[].isCorrect` 추가, `WpfResultItemDto.Score/Passed` 추가, `PopupResultBuilder.BuildSubmitted(SurveySubmission)`. `PopupFactory` — 정답 키·passingScore(최상위 우선, content 폴백) 전달. `DemoPopupGateway` — WPF가 보낸 score/passed 우선 사용. `MainWindow`/`DemoWindow` 훅 연결 교체.
  - 서버(popup 영역만): `WpfPopupService.getPopupsForUser` — `PopupService.loadQuestionsWithAnswerKey`(신규, admin=true 재사용)로 1회 조회 후 **QUIZ에만** 정답 키·최상위 `passingScore` 포함, 그 외는 `WpfPopupItem.withoutAnswerKey`로 제거. `WpfPopupItem`에 `passingScore` 필드·`from(dto, includeGradingInfo)`. `WpfResultRequest.Item`/`WpfResultCommand`에 `score`/`passed`(선택, 기존 9-인자 생성자 유지). `WpfResultProcessor.handleSubmitted` — 서버 저장 계산값과 WPF 값이 다르면 경고 로그만(재채점·거절 없음).
- **클라이언트 버전 서버 검증(설계 13)**:
  - WPF: `Popup.csproj` `<Version>1.0.0</Version>`(+Assembly/FileVersion), `Services/ClientVersion.cs`(InformationalVersion 읽기, `X-Client-Version`), `PopupApiService.SendWithAuthAsync`·`WpfLoginClient.LoginAsync`에 헤더 부착. 426 → `WpfClientVersionException`(401 재시도 경로와 분리) → `MainWindow.HandleClientVersionRejected`(주기 조회 중단, 업데이트 안내 1회, 수동 조회 시 재안내), `PopupResultQueue.FlushAsync`는 426이면 pending 보존·전파(`ClientVersionRejected` 이벤트), `SsoAuthHeaderProvider`는 로그인 426을 삼키지 않고 정기 재로그인 루프 중단.
  - 서버(신규 파일만, 공통 WebMvcConfig 미수정): `base/props/WpfClientVersionProps`(custom.wpf-client: latest-version / minimum-supported-version / require-header), `web/api/.../wpf/version/ClientSemver`(숫자 비교), `WpfClientVersionInterceptor`(/p/api/wpf/** 전용, 426 + `domain/.../WpfClientVersionErrorResponse` JSON), `WpfClientVersionWebConfig`(별도 WebMvcConfigurer). `application-common.yml`에 latest 1.0.0 / minimum 1.0.0 / require-header true.
- **폰트 크기(설계 14 §5)**: DB 컬럼 없이 content(CONTENT_OPTIONS)의 `headerFontSize`/`bodyFontSize`/`footerFontSize`(10~40, 없으면 기본). 웹 `PopupEditorDialog` "폰트 크기" 입력 3개(`PopupFontSizeField`, 비우면 null)·`PopupPreview` 반영. 서버 `PopupService.validateFontSizeOptions`(저장 시 범위 검사). WPF `PopupOptions.Header/Body/FooterFontSize` → `PopupFactory` → `PopupWindow.ApplyFontSizes`(Clamp; Header=제목, Footer=체크박스+닫기 버튼) → 본문은 새 `IBodyFontSizeAware`를 TEXT(본문 4개+LineHeight 비율)/IMAGE(설명)/VIDEO(설명)/SURVEY(선택지 상속 + 문항 제목 +4·설명 +1)가 구현.
- **폐쇄망 반입 준비(설계 14 §2·3·4·7)**: `scripts/export-offline-package.ps1` 신규 — A 문서 / B 서버(`git diff 0294d1e..HEAD`) / C 웹(`git diff f66e8ed..HEAD`) / D WPF 소스(bin·obj·publish·exe·dll·pdb 제외, 누출 검사) / E 개발 의존(옵션) 묶음·MANIFEST(A/M 상태)·README-IMPORT·zip 생성. `.gitignore`에 `offline-export/`.
- **인터페이스 정의서 최신화(설계 14 §1)**: `docs/interfaces/POPUP_INTERFACE_SPEC.md` v2.0 — §1.1 공통 헤더·인증 흐름, §1.2 WPF 오류(426 포함), §2 목록에 WPF2-00~02 추가·구형 표시, §3-A WPF2-00/01/02 IN/OUT 표·샘플, §3-B 구형 WPF-01~06 부록, §3-C 관리자, §5 폰트 크기 공통 필드, §6 정답 키 제공 범위·로컬 채점 규칙, §8·§9·§10 갱신. `api/examples/wpf-popups-response.json`(QUIZ isCorrect/passingScore/폰트 크기)·`wpf-results-request.json`(score/passed, 공통 헤더 주석) 갱신. **Word 기준본(.docx)은 이 PC·저장소에 없어 Word 파일 갱신은 미수행.**
- 문서: 설계 11·12·13·14 상태 절과 체크리스트 갱신, `popup-frameWork/README.md` §16·§17 흐름 갱신.
- 검증: `dotnet build Popup.slnx` 경고 0·오류 0. 서버 `gradle --offline :web:api:test --tests server.web.api.popup.wpf.* :service:core:test --tests server.service.core.popup.*` 55개 통과(DB 필요 2개 skip; 신규 `WpfClientVersionInterceptorTest` 8개, `WpfPopupServiceTest` SURVEY 정답 제거 케이스, `WpfPopupControllerTest` score/passed 전달 추가, `WpfPopupDatabaseTest` 기대값 갱신). RgstPop 8개 파일 한정 `tsc --noEmit` 오류 0. 예제 JSON 파싱 확인. 반입 스크립트 로컬 실행(A 34/B 87/C 4/D 79 파일, zip 생성) 확인.
- 미실행: WPF 실제 실행(FIXED 초과 값 화면, QUIZ 통과/미통과 안내, 네트워크 단절 pending, 426 안내, 폰트 크기 표시), 관리자 웹 화면 조작, 실제 서버 기동 E2E, 폐쇄망 PC `dotnet restore/build`, 원격 개발 DB 통합 테스트(`WpfPopupDatabaseTest`·`WpfApiOracleHttpTest`).
- 상태: 미커밋(아래 커밋 시 갱신).

## 2026-09-21-05 — TEXT 팝업 Markdown 모드 제거 (WPF·관리자 웹·예제·문서)

- 이유: 사용자 지시 "text 팝업 markdown도 안 쓴다, 관련 소스 다 지우자". TEXT 팝업은 콘텐츠 제목·설명, 일반 텍스트, 강조 문구, 하단 설명만 사용한다.
- 변경(WPF): `TextPopupView.xaml(.cs)` — 생성자 매개변수 `markdownMode`/`markdownContent`, `MarkdownPanel`, `RenderMarkdown`/`AddInlineMarkdown`(자체 렌더러) 삭제. `TextPopupContentDto` — `MarkdownMode`/`MarkdownContent` 삭제(서버 JSON에 남아 있어도 무시). `PopupFactory.CreateTextPopupView` 인자 정리. `DemoPopupDataService` — 데모 TEXT를 plainText/강조/하단 설명 구성으로 교체. `popup-frameWork/demo-text-notice.json`(markdown 데모, 코드 미참조) 삭제.
- 변경(관리자 웹, popup 영역): `PopupEditorDialog.tsx` — 기본 content의 markdown 필드, "Markdown 모드" 스위치, "Markdown 내용" 입력란 삭제(일반 텍스트·강조 문구 항상 표시). `PopupPreview.tsx` — `MarkdownView`·markdown 분기 삭제, `react-markdown`/`remark-gfm` import 제거. `main/package.json` — 두 의존성 제거(팝업 전용이었음, 다른 사용처 없음 확인). `pnpm-lock.yaml` — pnpm 9.15.2 `install --lockfile-only`로 재생성(삭제만 875줄, 추가 0줄; pnpm이 바꾼 무관한 glob deprecated 문구 1줄은 원복).
- 변경(서버): 없음 — content는 JSON 문자열로만 다루며 Java에 markdown 관련 코드 없음.
- 변경(예제·문서): `api/examples/wpf-popups-response.json`, `docs/interfaces/popup-interface-examples.json`·`POPUP_INTERFACE_SPEC.md`, `docs/design/03`, `db/oracle/02` 샘플 content JSON에서 두 필드 제거. `Popup/Docs/POPUP_OPTION_GUIDE.md`·`POPUP_USER_OPTION_GUIDE.md`·`POPUP_ADMIN_UI_GAP.md`, `ERD/STRUCTURE_REVIEW.md` 표기 갱신. 루트 설계본(`docs/03`, `api/examples`, `db/oracle/02`)도 동일 반영.
- 검증: `dotnet build Popup.slnx` 경고 0·오류 0. RgstPop 9개 파일 한정 `tsc --noEmit` 오류 0(전체 웹 type-check는 공통 MUI 타입 문제로 기존부터 미실행). `pnpm install --frozen-lockfile --offline` 성공(lockfile 정합). JSON 예제 파싱 확인. 소스 트리에 markdown 참조 없음(변경 이력·과거 검토표 제외). 미실행: 관리자 웹 화면 조작, 기존 DB에 markdownMode=true로 저장된 팝업의 표시 확인(해당 팝업은 plainText가 비어 있으면 본문이 비게 됨 — 운영 데이터 점검 필요).
- 상태: 커밋 `1a445ec` 푸시 완료(pull 시 CHANGELOG만 충돌 — 원격의 `2026-09-21-04` 항목과 번호가 겹쳐 이 항목을 `-05`로 조정, 코드 충돌 없음).
- **후속(DB 데이터 점검·정리, 사용자 요청)**: 로컬 XE `POPUP.POPUP_CONTENT` 4행 중 1행(`SAMPLE-TEXT-001`, `markdownMode:false` — 일반 텍스트 팝업)에만 두 필드가 남아 있어 JSON에서 필드만 제거(UPDATE 1행, COMMIT, 잔여 0행). `markdownMode=true` 팝업은 없음. 재실행 가능한 정리 스크립트 `db/oracle/04_cleanup_markdown_fields_oracle.sql`(인자: 스키마 접두어) 추가 — false 행은 필드 제거, true 행은 목록만 출력(삭제는 확인 후 수동). 로컬에서 재실행해 0행 확인. **원격 개발 DB(192.168.114.71)는 VPN 미연결로 미점검** — 연결 후 `sqlplus zero-rule/...@//192.168.114.71:4004/XE @04_cleanup_markdown_fields_oracle.sql ""` 실행 필요.
## 2026-09-22-05 — WPF Service 폴더와 namespace 정합성 TODO 추가

- 이유: 현재 물리 폴더는 `Popup/Service/`인데 namespace는 `Popup.Services`로 달라 IDE0130 스타일 진단과 소스 탐색 혼동이 발생할 수 있어 폐쇄망 반입 전 정리 필요.
- 문서 갱신: `docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md`
- 권장 방향:
  - 폴더 `Service` → `Services` rename.
  - 기존 namespace `Popup.Services`, `Popup.Services.Auth`는 유지.
  - csproj/README/스크립트/XAML 등 물리 경로 직접 참조 여부 확인.
  - rename 후 IDE0130 및 `dotnet build` 확인.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: TODO 반영 완료, 실제 폴더 rename은 후속 작업.

## 2026-09-22-04 — 폐쇄망 반입 및 WPF UI 보완 TODO 문서화

- 이유: 폐쇄망 반입 전 문서/Server/Web/WPF 소스 범위를 분리하고, 현재 확정된 후속 기능을 한 체크리스트로 관리하기 위함.
- 추가 문서: `docs/design/14_폐쇄망_반입_및_UI_보완_TODO.md`
- 주요 내용:
  - 기존 Word 기준본 `WPF_Popup_API_Interface_Baseline_With_Admin_Content_Options.docx`를 현재 WPF 전용 API/결과 구조 기준으로 최신화하는 TODO.
  - zero-rule-server는 popup 관련 domain/mapper/service/web-api와 최소 공통 의존 파일만 선별 반입.
  - zero-rule-web은 popup 관리자 UI/도메인/API 관련 소스만 선별 반입.
  - popup-frameWork는 EXE/DLL/PDB/bin/obj/publish 제외, 소스/XAML/csproj/slnx/설정/필요 리소스만 반입.
  - .NET SDK/NuGet/VSIX 등 개발 의존성은 소스 반입물과 별도 패키지로 관리.
  - Header/Footer/본문 폰트 크기를 관리자 설정 → Server → WPF로 전달하는 옵션 추가 계획.
  - 폰트 크기 기본값/Clamp/기존 데이터 호환 정책과 적용 대상 정리.
  - FIXED 화면 초과, 비동기 결과 제출, 로컬 판정, Client Version 검증 등 기존 설계 TODO를 폐쇄망 반입 전 점검 항목에 포함.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: TODO 문서 main 반영 완료, 실제 반입 패키지/폰트 기능 구현은 후속 작업.

## 2026-09-22-03 — WPF 클라이언트 버전 서버 검증 계획 문서화

- 이유: 오래된 WPF 클라이언트가 서버 API를 호출해 DTO/API 계약 불일치나 필수 수정 미적용 상태로 동작하는 것을 방지하기 위함.
- 추가 문서: `docs/design/13_WPF_클라이언트_버전_서버검증_계획.md`
- 주요 내용:
  - 서버가 `latestVersion`, `minimumSupportedVersion`을 보유.
  - WPF는 주요 요청마다 `X-Client-Version` Header 전달.
  - 로그인 API 포함 최초 서버 접점부터 버전 검증.
  - 최소 지원 버전 미만 요청은 비즈니스 처리 전에 차단.
  - 버전 비교는 문자열이 아닌 숫자 버전 비교.
  - 권장 응답은 `426 Upgrade Required`.
  - 426은 401 재로그인 로직과 분리.
  - pending 결과 전송 중 426이면 결과를 삭제하지 않고 유지.
  - 실행 중 서버 최소 지원 버전이 변경돼도 다음 요청에서 즉시 검증.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-22-02 — WPF 결과 제출 UX 및 로컬 판정 구조 문서화

- 이유: 팝업 닫기/제출 시 서버 결과 API 응답 대기로 사용자가 기다리지 않도록 UI 처리와 결과 전송을 분리하기 위함.
- 추가 문서: `docs/design/12_WPF_결과제출_UX_및_로컬판정_수정계획.md`
- 주요 내용:
  - CLOSED/HIDDEN/VIDEO_WATCHED/SURVEY/QUIZ 결과는 서버 응답을 기다리지 않는 방향.
  - 결과는 먼저 `pending-results.json`에 저장한 뒤 창을 닫고 백그라운드에서 Flush.
  - 설문 필수응답 검증은 WPF에서 즉시 처리.
  - 퀴즈 점수/통과 여부는 WPF에서 즉시 계산.
  - 신규 입사자 안내 영상 수준의 시청 확인은 WPF의 로컬 시청 비율 판정 유지.
  - 현재 사용 범위에서는 서버 재채점/재검증은 구현하지 않고 결과 저장과 resultId 멱등성에 집중.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-22-01 — WPF FIXED 크기 화면 초과 방어 수정 계획 문서화

- 이유: FIXED 픽셀 크기가 사용자 모니터 작업 영역보다 크게 설정될 경우 Header/Footer/닫기 버튼이 화면 밖으로 밀리고, Topmost + Overlay 조합에서 사용자 PC 조작을 방해할 수 있는 위험 확인.
- 추가 문서: `docs/design/11_WPF_FIXED_화면초과_방어_수정계획.md`
- 주요 내용:
  - 현재 SizeMode별 화면 초과 방어 상태 정리(FIXED만 미방어).
  - `PopupWindow.ApplyWindowSize()`의 `PopupSizeMode.Fixed`에서 WorkArea 기준 최종 clamp 적용안.
  - `MinimumWidth/MinimumHeight > 화면 최대값`일 때 최소/최대 역전 방어.
  - 다중 모니터 및 DPI 단위 주의사항.
  - 정상/초과/Minimum 역전/Overlay+Topmost/회귀 테스트 항목 정의.
- 코드 변경: 없음.
- 빌드/실행 테스트: 문서 변경만 수행하여 미실행.
- 상태: 문서 main 반영 완료, 코드 구현은 후속 작업.

## 2026-09-21-04 — WPF 실행 흐름 README 및 소스 길잡이 주석 보강

- 이유: 전체 프로젝트 설명이 방대해 WPF(`popup-frameWork`)만 프로그램 실행 순서대로 따라볼 수 있는 입문 문서와 소스 내 길잡이 주석을 요청.
- 변경:
  - `popup-frameWork/README.md`를 WPF 전용 실행 흐름 문서로 확장. `App → MainWindow → SSO → 로그인 → API → PopupFactory → PopupManager → PopupWindow → ResultBuilder/Queue` 순서와 파일 역할표, 추천 소스 읽기 순서 추가.
  - 핵심 소스에 `[실행 순서]`, `[인증 흐름]`, `[401 복구 지점]`, `[결과 전송 흐름]` 주석 추가.
  - 주석 추가 파일: `App.xaml.cs`, `MainWindow.xaml.cs`, `SsoAuthHeaderProvider.cs`, `PopupApiService.cs`, `PopupFactory.cs`, `PopupManager.cs`, `PopupResultQueue.cs`.
  - 기능 로직·API 계약·설정값은 변경하지 않음.
- 참고: README와 인증 주석에 현재 코드와 확정 설계의 차이(자동 재로그인 시 SSO 재호출 부분)를 명시해 후속 수정 위치를 찾기 쉽게 함.
- 검증: 변경 내용은 README/주석만이며 실행 코드 변경 없음. GitHub main에 각 파일 반영 확인. 별도 빌드·실행 테스트는 미수행.
- 상태: main 반영 완료.
- 후속(검토 반영, 2026-09-21): ① `SsoAuthHeaderProvider` `[401 복구 지점]`·README §8의 "현재 구현은 재로그인마다 SSO 재호출 → 후속 수정 대상" 문장은 `4fe59aa`에서 이미 구현돼 낡았으므로 구현 상태로 정정. ② `[실행 순서 3/6]`이 비어 있어 인증 진입점(`GetAuthorizationHeaderAsync`) 주석을 `3/6 — 인증 흐름`으로 번호 부여. ③ README §1에 "SSO·로그인은 첫 GET popups 직전에 지연 실행" 한 줄, §4 `DevUserId`에 서버 프로토타입 모드에서 무시됨(설계 10 §14) 명시, 섹션 헤딩 레벨 통일(`## N.` / `### 파일`). 코드 동작 변경 없음, WPF 빌드 경고 0·오류 0.

## 2026-09-21-03 — WPF SSO 재로그인 정책 확정 및 설계 10 보완

- 이유: SSO·토큰 프로토타입 구현 검토 후 실제 운영 의도에 맞는 재인증 정책을 확정.
- 확정:
  - 실제 사내 SSO 응답의 `ks_c_5601-1987`/CP949 인코딩 처리는 폐쇄망 실연동에서 확인 후 필요 시 보강.
  - **SSO GET은 WPF 프로세스 시작 후 최초 1회만 수행**. 이후 토큰 만료(401) 및 1시간 정기 갱신은 메모리에 보관한 `MAIN_USER_ID`/`MAIN_USER_CLASSI_CODE`로 Zero 로그인 API만 재호출.
  - `DevUserId`/`X-Dev-User-Id` 유지 여부는 별도 의사결정 대기.
  - 로깅 제외 범위는 DB 이벤트·DISPLAYED/CLOSED·video-progress 호출이며, 개발 진단 로그와 `PopupResultQueue`는 유지.
- 변경(문서): `docs/design/10_WPF_SSO_토큰_프로토타입_계획.md`의 1시간 갱신/401 재로그인 흐름을 SSO 재호출 없는 구조로 수정하고, 확정사항 및 폐쇄망 실연동 확인 항목 추가.
- 코드 변경: 없음. 현재 `SsoAuthHeaderProvider.LoginAsync()`는 재로그인마다 SSO를 다시 호출하므로 후속 구현 수정 필요.
- 검증: 현재 main 소스와 설계 문서를 대조해 변경 대상 확인. 실행/빌드 테스트는 문서 변경만 수행하여 미실행.
- 상태: main 반영 완료.
- **후속(같은 작업, 구현 반영)**: `popup-frameWork/Popup/Service/Auth/SsoAuthHeaderProvider.cs` `LoginAsync()` — §14.1대로 `_lastUser`가 없을 때만 `SsoClient.GetUserAsync()`를 호출하고, 있으면 그 값으로 `WpfLoginClient.LoginAsync()`만 호출(401 재로그인·정기 갱신 모두). 진단 로그에 "SSO 호출/재호출 없음" 표시. 관리 화면 "SSO 로그인 테스트"(`TestLoginAsync`)는 §14.1 단서대로 매번 SSO GET 유지. 헤더 주석 갱신.
  - 검증(MockSso Negotiate + 로컬 XE + TTL 20초, exe 자동 조회): 시작 시 SSO GET **1회**(20:28:02, NTLM) → `auth/login` → `GET popups` 200 → TEXT 팝업. 26초 후 닫기 → `POST results` 401(만료) → **SSO 재호출 없이** `auth/login` → 같은 resultId 재전송 → 영수증 ACCEPTED(TEXT). 다시 26초 후 VIDEO 닫기 → 401 → `auth/login`만 → 재전송 → ACCEPTED(VIDEO). MockSso 로그의 GET은 프로세스 전체에서 1건. `dotnet build Popup.slnx` 경고 0·오류 0.
  - 미실행: 1시간 정기 갱신에서의 SSO 미호출(코드 경로는 401과 동일한 `LoginAsync`), 실제 사내 SSO 인코딩 확인(§14.2).

## 기록 규칙

- 수정 작업 한 건마다 항목을 추가한다. 같은 작업의 후속 수정은 해당 항목에 보완한다.
- 최신 항목을 위에 적는다. 기록 ID는 `YYYY-MM-DD-NN` 형식으로 날짜별 순번을 사용한다.
- 변경 이유, 실제 변경 내용, 주요 파일, 검증 결과, 커밋 및 미완료 사항을 기록한다.
- 확인만 한 내용은 실제 수정과 구분하고, 미실행·실패·건너뛴 검증을 명시한다.
- 배포 버전과 기록 ID는 별개다. Git 커밋을 소스 버전 기준으로 사용하고, 배포하지 않은 작업을 배포 완료로 기록하지 않는다.
- 비밀번호, 토큰, 개인정보는 적지 않는다.
- zeroserver/zeroweb 변경은 추가/수정/삭제로 분류해 기존 구조 변경 여부를 함께 적는다.

## 2026-09-21-02 — 임시 SSO 프로그램(C#, Negotiate)·WPF "SSO 로그인 테스트" 버튼 — 로그인까지 단독 테스트 가능

- 이유: 사용자 요청 "sso는 xml을 get한 후 파싱해서 쓸 건데, xml을 리턴하는 임시 프로그램으로 구현하고 로그인까지 테스트할 수 있게". 필드는 사용자 확인대로 `classCode`(XML `MAIN_USER_CLASSI_CODE`) 유지 — 중간에 `userId/groupId`로 바꿨던 서버 변경은 커밋 전에 되돌림(설계 10 그대로 `logonId`/`classCode`).
- 변경(WPF·도구):
  - [추가] `popup-frameWork/MockSso`(콘솔, `HttpListener`, 외부 패키지 없음 → 폐쇄망 SDK로 빌드) — 실제 SSO처럼 **Windows 통합 인증(Negotiate) 도전**을 하고(`--anonymous`면 도전 없음) `MAIN_USER_ID`·`MAIN_USER_CLASSI_CODE`(+진단용 `WINDOWS_USER`/`AUTH_TYPE`) XML을 돌려준다. `--user E1001|windows`, `--class A1`, `--port 8099`, `--fail`(항상 401). `Popup.slnx`에 추가.
  - [삭제] `shell/mock-sso.js`(node) — WPF PC에 node가 없을 수 있어 C#으로 대체. `start-dev.ps1 -MockSso`는 `dotnet run --project popup-frameWork/MockSso`를 띄우고 `-MockSsoClassCode` 인자 추가.
  - [추가] 관리 화면 `MainWindow.xaml` "SSO 로그인 테스트" 버튼 → `SsoAuthHeaderProvider.TestLoginAsync()`(`SsoLoginTestResult`): SSO GET(URL·파싱된 logonId/classCode·소요 ms) → 로그인 API(URL·요청 필드·tokenType·토큰 길이·expiresAt·소요 ms)를 MessageBox로 표시, 실패 시 예외 종류·메시지로 단계 구분. 성공 토큰은 현재 토큰으로 교체. `SsoClient.SsoUrl` 속성 추가.
  - [추가] `App.xaml.cs` 실행 인자 `--show-main` — 관리 화면을 트레이로 숨기지 않고 띄운 채 시작(테스트 버튼을 바로 누르기 위함). 인자 없으면 기존 동작.
- 문서: README(임시 SSO 실행·`--show-main`·테스트 버튼), `docs/design/04 §6`(도구 행; 루트 docs/04 동일), `09` 진행 상태.
- 검증:
  - `curl` 무인증 → 401(`WWW-Authenticate: Negotiate`), `curl --negotiate -u :` → 200 XML(AUTH_TYPE=NTLM) — 사용자가 실제 SSO에서 확인한 것과 같은 조건.
  - **WPF exe(`--show-main`) + MockSso(Negotiate) + 전체 서버(로컬 XE)**: 시작 시 `UseDefaultCredentials`로 NTLM 인증 후 XML 수신 → `auth/login` → 팝업 GET 200. UI Automation으로 "SSO 로그인 테스트" 클릭 → MockSso 로그에 두 번째 GET(NTLM), 서버에 두 번째 `auth/login`, MessageBox "SSO 로그인 테스트 — 성공"(MAIN_USER_ID=E1001, MAIN_USER_CLASSI_CODE=A1, 토큰 64자, expiresAt +10분) 스크린샷 확인.
  - `dotnet build Popup.slnx` 경고 0·오류 0. 서버 소스는 2026-09-21-01 커밋과 동일(변경 없음). `start-dev.ps1` 구문 검사 통과(`-MockSso` 창 실제 기동은 미수행 — MockSso.exe를 직접 띄워 검증).
  - 미실행: `--fail`·`--user windows` 옵션의 WPF 연동, 실제 사내 SSO URL.
  - **세션(토큰) 만료 재검증(사용자 요청, MockSso Negotiate 구성 + 서버 TTL 20초, 로컬 XE)**: exe 옆 appsettings로 `AutoLoadOnStartup=false`, `--show-main`. ① "SSO 로그인 테스트"로 토큰 발급(20:24:38) → 25초 대기 → "팝업 다시 조회" → `GET popups` 401(서버 "토큰 만료") → SSO GET(NTLM) → `auth/login` 재발급 → `GET popups` 200·팝업 표시(사용자 조작 없음). ② 새 토큰 만료 후 TEXT 팝업 닫기 → `POST results` 401 → SSO GET → `auth/login` → **같은 RESULT_ID(07183dd6…)로 재전송 → `WPF_RESULT_RECEIPT` INSERT 1건 CLOSED/ACCEPTED**(RESULT_ID 조회 1회 = 중복 없음). 만료마다 SSO·로그인 각 1회. 검증 후 exe 옆 appsettings 삭제.
- 상태: 커밋 `95300ea` 푸시 완료. 만료 재검증 기록은 후속 커밋.

## 2026-09-21-01 — WPF SSO·토큰 프로토타입 (설계 10): 서버 로그인 API·메모리 토큰 검사, WPF SSO→로그인→Bearer·401 재로그인·정기 재로그인

- 이유: 사용자가 작성한 `docs/10_WPF_SSO_토큰_프로토타입_계획.md`("docs 체크해서 이어서 진행"). 운영 토큰(타 팀 통합 토큰) 구현이 아니라 **통신 형태와 `401 → 재로그인 → 원 요청 재전송` 동작을 검증하는 프로토타입**. 04 문서의 범위(타 팀)는 유지하며 서버 기본값은 꺼짐.
- 변경(서버, 모두 popup·WPF 영역 — 공통 프레임워크 파일 무변경):
  - [추가] `base/.../props/WpfAuthPrototypeProps` — `custom.wpf-auth-prototype.enabled`(기본 false), `token-ttl-minutes`(Duration, 단위 없는 숫자=분, 기본 10; `20s` 처럼 초 지정 가능).
  - [추가] `web/api/.../popup/wpf/auth/WpfPrototypeTokenStore` — JVM 메모리 `ConcurrentHashMap`, 토큰 = SecureRandom 32B + logonId + 발급시각의 SHA-256 hex(64자), 발급 시 만료 항목 정리, `Clock` 주입. `WpfAuthController` — `POST /p/api/wpf/auth/login {logonId, classCode, linkYn}` → `{accessToken, tokenType, expiresAt}`(진위 검증 없음, 필수 값만). `PrototypeTokenWpfUserResolver` — `WpfUserResolver` 구현, `@Primary` + `@ConditionalOnProperty(enabled=true)`: Bearer 없음/미등록/만료 → `WpfUnauthorizedException`(401 `WPF_UNAUTHORIZED`). `WpfLoginRequest`(payload)·`WpfLoginResponse`(domain, ISO 날짜).
  - [수정] `WpfApiExceptionHandler` — `assignableTypes`에 `WpfAuthController` 추가. `application-local.yml` — `custom.wpf-auth-prototype.enabled: true, token-ttl-minutes: 10`(로컬 전용; 켜지면 `X-Dev-User-Id`는 무시됨). `application-common.yml` — 주석만(값은 local에만 두는 이유 기재).
  - [테스트 추가] `WpfPrototypeTokenStoreTest` 4개(TTL 경계·미등록·재로그인 시 이전 토큰 유지·만료 정리), `WpfAuthPrototypeControllerTest` 4개(T1 로그인→Bearer→200, T2 만료→401→재로그인→200, 헤더 없음/Basic/모르는 토큰/개발 헤더만 → 401, 필수 값 검증 400).
- 변경(WPF):
  - [추가] `Service/Auth/SsoClient.cs` — `HttpClientHandler.UseDefaultCredentials=true`(+PreAuthenticate)로 SSO GET, XML에서 `MAIN_USER_ID`·`MAIN_USER_CLASSI_CODE`를 대소문자·네임스페이스 무시로 추출. `WpfLoginClient.cs` — 로그인 API 호출(자격 증명 미전송). `SsoAuthHeaderProvider.cs` — `IAuthHeaderProvider` 구현: 토큰 없으면 최초 로그인, `OnUnauthorizedAsync`는 `SemaphoreSlim` 안에서 "현재 토큰 == 401 받은 토큰"일 때만 재로그인(동시 401 → 1회), `PeriodicTimer` 정기 재로그인(실패 시 기존 토큰 유지), `Dispose`로 루프 정지·토큰 폐기. 토큰은 메모리 필드에만.
  - [수정] `IAuthHeaderProvider.OnUnauthorizedAsync(string? failedAuthorizationHeader, ct)` — 실패한 헤더 값을 넘기도록 시그니처 변경(구현체 없던 기본 메서드). `PopupApiService.SendWithAuthAsync` — 그 값을 넘기고 진단 로그 1줄(재시도 구조·body 객체 재사용은 그대로 → resultId 유지). `PopupClientSettings` — `AuthSsoUrl/AuthLoginPath/AuthPeriodicLoginMinutes`. `MainWindow` — `Auth.Mode=SsoPrototype` 분기(+정기 루프 시작), `OnClosed`에서 Dispose, SsoUrl 필수 검증. `appsettings.json` — `Mode: SsoPrototype`, `SsoUrl`(기본 로컬 모의 SSO `http://localhost:8099/...`), `LoginPath`, `PeriodicLoginMinutes: 60`.
- 변경(도구·문서): [추가] `shell/mock-sso.js` — SSO 모의 서버(node, 의존성 없음, `MOCK_SSO_USER_ID`/`MOCK_SSO_FAIL`). `shell/start-dev.ps1` — `-MockSso`(세 번째 창), `-TokenTtl '20s'`(백엔드 환경변수). 문서: `docs/design/10` 반입, `04 §6`(프로토타입 추가/수정 목록; 루트 docs/04에도 동일 반영), `09`(진행 상태 2026-09-21, 미결 2·9), README(진행 상태 행·서버 실행 안내).
- 검증:
  - 서버 전체 테스트(로컬 XE, `POPUP_TEST_DB_*`) **59개 통과·skip 0**(신규 8 포함).
  - 전체 zeroserver를 로컬 XE + `CUSTOM_WPF_AUTH_PROTOTYPE_TOKEN_TTL_MINUTES=20s`로 기동: 헤더 없음 401, `X-Dev-User-Id`만 → 401("Bearer 토큰이 필요"), 로그인 200(64자 hex, expiresAt +20s), 토큰으로 팝업 GET 200(E1001 실DB 목록), 21초 후 같은 토큰 401("만료").
  - **WPF Debug exe + 모의 SSO + 전체 서버 E2E**(서버 로그·모의 SSO 로그로 확인): T1 시작 → SSO GET 200 → `POST auth/login` → `GET popups` Bearer 200(로그인 UI 없음). T2/T3 토큰 만료 후 TEXT 팝업 닫기(UI Automation `FooterCloseButton`) → `POST popups/results` 401(서버 "토큰 만료") → SSO GET → `auth/login` 재발급 → **같은 RESULT_ID로 재전송 → `WPF_RESULT_RECEIPT` INSERT 1건 ACCEPTED**(중복 없음). T4 exe 옆 appsettings로 `PeriodicLoginMinutes=1` → 정확히 1분 뒤 401 없이 `auth/login` 재발급. 구 이벤트/영상 진행률 API(`/events`, `/video-progress`) 호출 0건(`/p/api/popups/video?path=`는 VIDEO 팝업의 WebView2 영상 파일 요청).
  - WPF `dotnet build` 경고 0·오류 0. `start-dev.ps1` 구문 검사 통과(`-MockSso` 창 실제 기동은 미수행 — 모의 SSO는 직접 `node`로 띄워 검증).
  - 미실행: T5 동시 401(코드의 `SemaphoreSlim`+토큰 비교로 설계, 동시 실행 테스트 없음), T6 앱 재시작, T7 SSO 실패(`MOCK_SSO_FAIL=1` 미실행), **실제 사내 SSO(Negotiate 도전) 연결**, 원격 개발 DB(VPN 미연결).
- 상태: 커밋 후 푸시 예정. 로컬 XE 검증 행(`WPF_RESULT_RECEIPT`·`USER_POPUP_STATUS` E1001)은 정리하지 않음(로컬 전용 DB).

## 2026-09-20-03 — 백엔드·프런트엔드 동시 실행 스크립트 보강 (`shell/start-dev.ps1`)

- 후속 2(같은 작업, 2026-09-21 커밋): 백엔드 창의 `-Command` 인자에 괄호가 없어 `'Write-Host "DB: '` 까지만 바인딩되고 나머지가 `$args`로 새어 새 창이 `TerminatorExpectedAtEndOfString`으로 실패(8080 미기동). 프런트 호출과 같이 괄호로 감싸 수정(스크립트 주석에 기록). 구문 검사 통과, 이번 세션의 서버는 같은 환경변수로 직접 기동해 확인.
- 후속(같은 작업): 첫 커밋 `ee7d5e9`에 전역 pnpm 7.29가 다시 쓴 `zero-rule-web/pnpm-lock.yaml`(lockfile 9.0 → 6.0, 의존성 버전 변동)이 딸려 들어갔음을 발견 → 원본으로 되돌림(공통 웹 파일 무변경). 원인 제거: 스크립트가 `package.json`의 `packageManager`(pnpm@9.15.2)를 `npx --yes`로 실행하고 `install --frozen-lockfile`을 쓴다(corepack 0.29는 서명 키 오류로 사용 불가). 9.15.2로 재설치 후 lockfile 무변경·프런트 기동·`API_BASE_URL` 주입 재확인. `README.md` "서버 실행"에 스크립트 안내 추가.

- 이유: 사용자 요청 "back front 동시 접속 쉘". 기존 스크립트는 경로만 바뀐 상태라 새 구조(원격/로컬 DB 전환, 팝업 스키마 설정, 프런트 API 주소)를 반영하지 못했고, 프런트 `.env`가 없어 `API_BASE_URL`이 비어 있었다.
- 변경(수정, `shell/start-dev.ps1`): 백엔드·프런트 창을 각각 띄우는 구조는 유지하고
  - 옵션 `-LocalDb`(로컬 XE: `ZERO_RULE_DB_URL/USER/PASSWORD` + `CUSTOM_POPUP_SCHEMA=POPUP`을 창 환경변수로), `-ApiBaseUrl`(기본 `http://localhost:8080/zero-rule-server`), `-RouterBaseUrl`, `-SkipBackend`, `-SkipFrontend`.
  - JDK 17을 `JAVA_HOME` 또는 `C:\Program Files\Java\jdk-17*`에서 찾아 창에 지정. 프런트 `node_modules`가 없으면 `pnpm install`을 먼저 실행.
  - 프런트 창에 `API_BASE_URL`·`ROUTER_BASE_URL` 환경변수 주입 후 `pnpm run dev --env-mode=loose`. **turbo 2.x는 strict env 모드**라 turbo.json에 선언되지 않은 환경변수를 `next dev`에 넘기지 않으므로 `--env-mode=loose`가 필요(turbo.json은 공통 파일이라 미수정). `pnpm run dev -- --env-mode=loose`처럼 `--`를 넣으면 turbo가 그 뒤를 next에 통째로 넘겨 효과가 없었다.
- 검증: 스크립트로 두 창 기동 → 백엔드 `http://localhost:8080/zero-rule-server`(원격 DB) 401/200, 프런트 `http://localhost:3000/login/` 200이며 페이지 runtimeConfig에 `API_BASE_URL=http://localhost:8080/zero-rule-server`, `ROUTER_BASE_URL=/` 포함 확인. 브라우저와 같은 조건(Origin `http://localhost:3000`)의 preflight 200·로그인 POST에 `Access-Control-Allow-Origin` 반환·서버가 원격 DB 조회 응답("해당 사용자가 없습니다"). `-LocalDb`·`-SkipFrontend` 조합 기동 확인. 실제 브라우저 로그인·화면 조작은 미수행.
  - 참고: 확인 초기에 preflight가 403(`Invalid CORS request`)으로 보였으나 서버 재기동 후 재현되지 않음(기동 중 요청 또는 이전 프로세스 잔존으로 추정, 설정 변경 없음).
- 상태: 커밋 후 푸시.


## 2026-09-20-02 — 원격 개발 DB(Oracle 11g XE) 연동: 매퍼 PG 잔재 점검, DDL 11g 호환, 팝업 스키마 한정자 설정화, WPF↔서버↔원격 DB 왕복 확인

- 이유: 사용자 요청 "postgres 매퍼로 남아있는건 다 변환하고 wpf <-> java <-> db(원격 서버, VPN) 테스트까지". 이후 "팝업 계정 따로" → 앱 계정에 CREATE USER 권한이 없음을 확인하자 "스키마만 따로 해서 스키마 분리로" 확정.
- 확인(읽기):
  - 서버 매퍼 XML에 PostgreSQL 구문 없음(`nextval(`·`::`·`LIMIT`·`ON CONFLICT`·`RETURNING` 등 검색 — `PopupMapper.xml` 변환 규칙 *주석*에만 존재). cloverframework 3.0.3 내장 매퍼도 Oracle. nav는 프레임워크 `CLNavApiController`(`/apis/cloverframework/nav/*`)가 제공하고 zero-rule-web(`sub/domain/src/api-url.ts`)이 그 경로를 호출 → sample의 `/apis/nav/*` 서버 코드는 웹이 쓰지 않던 사본. 미결 16 해소.
  - 원격 개발 DB `192.168.114.71:4004/XE`: **Oracle 11g XE 11.2.0.2**(설계 가정 19c와 다름). 앱 계정 `zero-rule`: 공통 테이블 53개, 권한 CONNECT/RESOURCE(+CREATE TABLE/SEQUENCE…), **CREATE USER 없음**. `POPUP` 계정 없음. 팝업 객체 17테이블·12시퀀스·제약/인덱스 이름은 기존 175개 객체와 충돌 없음. `ojdbc8 23.5.0.24.07`·`ojdbc6 11.2.0.4` 모두 11g 접속·`nowKst` 쿼리 정상.
- 변경(DDL, `db/oracle/`): `01` — 11g 호환: 30자 초과 제약명 3개 단축(`UK_QTEMPLATE_GROUP_VERSION`, `CK_TCOND_INCLUDE_CHILD`, `CK_TCOND_CHILD_DEPARTMENT`), `CK_CONTENT_OPTIONS_JSON (IS JSON)` 제거(JSON 유효성은 Java), 헤더 "대상 11g XE 이상", `ALTER SESSION SET CURRENT_SCHEMA=POPUP` 주석 처리(실행 계정 스키마에 생성), 주석 안 세미콜론 제거(SQL*Plus가 문장 끝으로 오해 → ORA-00907). `02` — CURRENT_SCHEMA 주석 처리. `03` — 권한 대상 계정을 인자(`&1`)로 받아 큰따옴표 식별자로 사용(`ZERO_RULE` / `ZERO-RULE`). `00` — 원격 실행 안내.
- 변경(서버, 스키마 분리 설정화):
  - `repo/core/.../popup/PopupSchema.java` [추가] — 설정 `custom.popup.schema` → MyBatis 변수 `popupSchemaPrefix`("POPUP." 또는 ""). `PopupMapper.xml`·`WpfPopupMapper.xml` — `POPUP.` 67곳 → `${popupSchemaPrefix}`(상수 치환, 설정값만 사용).
  - `app/.../config/MyBatisConfig.java` [공통, 추가 4줄] — `@Value custom.popup.schema`(기본 POPUP) → `factoryBean.setConfigurationProperties(PopupSchema.variables(...))`. 다른 매퍼는 변수를 쓰지 않아 영향 없음. 공통 파일 수정은 이제 6개(모두 추가형).
  - `application-dev_db.yml` [공통, 추가] — `custom.popup.schema: ""`(원격 개발 DB는 앱 계정 스키마). 로컬 XE(POPUP 계정)로 띄울 때는 `CUSTOM_POPUP_SCHEMA=POPUP` 환경변수.
  - 테스트 6개 — `POPUP_TEST_DB_SCHEMA`(기본 POPUP, 빈 값 = 접속 계정 스키마)로 같은 변수 주입(`Configuration.setVariables` / `mybatis.configuration-properties.*`), `WpfApiOracleHttpTest` 정리 SQL 접두어 변수화, `WpfApiDevServer` 동일.
- 문서: `db/oracle/README.md`(11g·원격 적용 절차·스키마 배치 A/B·원격에서 부딪힌 것 5건), `README.md`(서버 실행: 기본 원격/로컬 환경변수, 진행 상태 행), `docs/design/05`(전제 11g·스키마 배치 행), `06`(공통 파일 6개), `09`(진행 상태 2차, 미결 1·16·17 해소).
- 검증:
  - 로컬 XE(POPUP 계정, 접두어 "POPUP."): 서버 테스트 50개 통과·skip 0 (변경 후 회귀 확인).
  - 원격 11g에 `zero-rule`로 `01`·`02` 적용: 테이블 17·시퀀스 12·주석 37·샘플 36행 (`NLS_LANG=KOREAN_KOREA.AL32UTF8` 필요 — 없으면 한글 주석 따옴표가 깨져 ORA-01756. 1차 실행에서 7개 문장 실패 후 실패분만 재적용, COMMENT 37개는 UTF-8로 전부 덮어씀).
  - 원격으로 `cleanTest` 후 popup 테스트 38개(service:core 34 + app HTTP 4) 통과·skip 0 — 시퀀스 진행값(`SEQ_API_REQUEST_LOG` 101 등)으로 실제 원격 실행 확인, E1002 정리 확인.
  - **전체 zeroserver를 기본 설정(JNDI → 원격 11g, 접두어 "")으로 기동** → `PK_BATCH_NODE` 오류 없음(정식 공통 스키마). `/p/api/wpf/popups` 무헤더 401, E1001 200(팝업 4건).
  - **WPF Debug exe(`BaseUrl=localhost:8080/zero-rule-server/p`, `DevUserId=E1001`) 실행 → UI Automation으로 TEXT 팝업 "9월 시스템 점검 안내" 닫기(`FooterCloseButton`) → 서버 로그 `GET popups`·`POST popups/results` → 원격 DB `USER_POPUP_STATUS`(CLOSED, 표시 1회, 표시·닫힘 시각)·`WPF_RESULT_RECEIPT`(CLOSED/ACCEPTED)·`API_REQUEST_LOG`(200) 기록 확인.** 다음 팝업(VIDEO) 창 표시 확인. 로그 SQL `INSERT INTO WPF_RESULT_RECEIPT`(한정자 없음)로 설정 반영 확인. 검증 행 3건 삭제, 원격은 샘플만 남음.
  - 미수행: 관리자 웹 화면, VIDEO/SURVEY/QUIZ 팝업의 WPF 조작(자동화 범위 밖 — 서버 측은 HTTP 테스트로 커버), 운영 DB.
- 상태: 커밋 후 푸시 예정.


## 2026-09-20-01 — 서버 공통 베이스라인을 업스트림 zero-rule-server Oracle 버전으로 교체, popup 재적용, 전체 서버 Oracle 기동 확인

- 이유: 사용자가 zero-rule-server의 Oracle 버전(업스트림 `git.labcl.net/clover/zero-rule-server` @`56bb0c5`)을 전달하며 "정합성·설정 정보를 맞추고, 공통 영역은 추가·분기만, 기본은 서비스 추가"를 요청. 기존 sample 서버는 PostgreSQL 전용 프레임워크라 전체 기동이 불가했음(미결 15).
- 정합성 확인(읽기): 업스트림은 Spring Boot 3.4.1 / Java 17 / cloverframework `3.0.3-SNAPSHOT`(repo.labcl.net 접근 확인) / 공통 매퍼 13개 Oracle SQL. 공통 보안·설정 파일(`SecurityConfig`·`CustomAuthenticationFilter`·`DefaultPublicUrls`·`MyBatisConfig`·`BasicConfig`·`WebMvcConfig`)은 기존과 내용 동일. popup 코드가 의존하는 공통 클래스는 `ApiBaseController`·`CLNewApiResponse` 뿐. 업스트림에 없는 것: popup/WPF 71개(우리 추가분), `nav` 기능 26개(sample 전용).
  - 처음 전달된 버전(`zero-server`, Spring Boot 2.7 / Java 8 / `/zero-server` 컨텍스트)은 다른 제품 계열이라 사용자가 교체 → 두 번째 버전으로 진행.
- 변경(교체, 커밋 `0294d1e`): `zero-rule-server-main/` 제거 → `zero-rule-server/`(업스트림 원본 그대로). 업스트림 클론의 `.git`은 `zero-rule-server/.git-upstream-56bb0c5/`로 이름만 바꿔 보관(.gitignore). `.idea/`도 ignore. `.gitignore` 경로 갱신.
- 변경(재적용, 추가): popup·WPF 소스 71개(`domain/popup/**`, `repo/.../popup/**`, `service/.../popup/**`, `web/api/.../popup/**`, `base/props/WpfPopupProps`, 테스트 12개, `samples/popup-video-range/README.md`)를 이전 커밋에서 그대로 복원.
- 변경(공통 파일, 모두 추가형·분기):
  - `app/src/main/java/server/app/config/JndiResource.java` — 환경변수 `ZERO_RULE_DB_URL/USER/PASSWORD` 우선 분기 추가(없으면 업스트림 개발 DB 값 그대로). 드라이버(log4jdbc)·JNDI 이름 등 업스트림 유지. 이전 판의 `ALTER SESSION SET TIME_ZONE`은 popup 매퍼가 `SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul'`로 세션 시간대와 무관하므로 넣지 않음.
  - `application-common.yml` — `custom.wpf-popup.polling-interval-seconds` 추가. **`dev-user-header: false`는 넣지 않음**: 전체 서버 기동 확인에서 `X-Dev-User-Id`가 무시됨 → 활성 프로파일 순서가 `local, common, springdoc, dev_db`라 common 값이 local의 `true`를 덮어쓰는 것이 원인. 기본값(false)은 `WpfPopupProps`가 가지므로 local에만 `true`를 둔다(주석에 기록).
  - `application-local.yml` — `popup.video.*`, `custom.wpf-popup.dev-user-header: true` 추가.
  - `service/core/build.gradle.kts` — `jackson-databind` 추가(PopupContentAssembler·PopupService). `app/build.gradle.kts` — `wpfDevServer` 태스크 재추가(주석을 "공통 DB 접속 불가 환경용"으로 수정).
- 문서·스크립트: `README.md`(베이스라인 교체 설명, 디렉터리·진행 상태 표, "서버 실행" 절 신설), `docs/design/06`(헤더·공통 파일 5개 명시), `docs/design/09`(진행 상태 2026-09-20, 미결 15 해소, 미결 16 nav·17 로컬 BATCH_NODE 추가), `db/oracle/README.md`·`docs/interfaces/POPUP_INTERFACE_SPEC.md`·`shell/start-dev.ps1` 경로 `zero-rule-server-main` → `zero-rule-server`. 01·02 설계 문서와 과거 이력의 옛 경로는 역사 기록으로 그대로 둠.
- 검증:
  - `gradlew compileJava compileTestJava -Pprofile=local` 성공(JDK 17, Gradle 8.11.1, cloverframework 3.0.3-SNAPSHOT 원격 해석).
  - 서버 테스트 50개 통과·실패 0·skip 0 (`service:core` 34, `web:api` 12, `app` 4 — 실DB `PopupQuestionDatabaseTest`·`WpfPopupDatabaseTest`·HTTP `WpfApiOracleHttpTest` 포함, 로컬 XE `XEPDB1`).
  - **전체 zeroserver 기동**: `ZERO_RULE_DB_*`=로컬 XE로 `:app:bootRun -Pprofile=local` → `Started App`. 공통 `CustomAuthenticationFilter`를 거쳐 `GET /p/api/wpf/popups` 무헤더 401, `X-Dev-User-Id: E1001` 200(팝업 4건), `POST /p/api/wpf/popups/results` CLOSED → ACCEPTED, 재전송 → DUPLICATE. 검증 행(USER_POPUP_STATUS·WPF_RESULT_RECEIPT·API_REQUEST_LOG)은 sqlplus로 삭제.
  - 기동 로그에 `CLOVER_BATCH_NODE` INSERT `ORA-00001` 1건 — 로컬 공통 스키마(PG DDL 변환본) 이슈, 동작 영향 없음(미결 17). 개발 DB `192.168.114.71:4004`는 이 PC에서 접속 불가라 미확인.
  - WPF exe 실연동·관리자 웹은 이번에 재실행하지 않음(서버 API 계약 변경 없음).
- 상태: 커밋 후 푸시 예정. nav 기능 반입 여부는 사용자 결정 대기.


## 2026-09-19-10 — 서버 확인: 실제 HTTP+Oracle 통합 테스트, 팝업 슬라이스 개발 서버, WPF 실연동

- 이유: 사용자 요청 "서버쪽 확인". Oracle 위에서 신규 WPF API를 실제 HTTP로 검증하고 WPF exe를 붙여 본다.
- 확인된 제약: 전체 zeroserver를 Oracle로 기동하면 `SELECT nextval('cloverframework_seq')`(cloverframework_mappers/CLSequenceMapper.xml)에서 `ORA-00923` — 저장소의 zero 프레임워크가 `clover-* 0.0.1-POSTGRE-SNAPSHOT`이고 공통 매퍼 13개(`repo/core/mappers/*.xml`, popup 제외)도 PostgreSQL 전용. 공통 프레임워크 Oracle 빌드는 타 팀/운영 소관 → 미결 15로 기록. 공통 스키마 DDL은 참고용으로 변환해 둠(`db/oracle/10_zero_rule_common_schema_oracle.sql`, `tools/convert-zero-rule-ddl.pl`, ZERO_RULE에 53개 테이블·54 PK/UK·12 시퀀스 적용 성공).
- 변경(추가): `app/src/test/.../wpf/WpfApiOracleHttpTest.java` — 팝업·WPF 빈만 올린 `@SpringBootTest(RANDOM_PORT)` + 실제 Oracle: 401/403 코드, 목록(사용자 판정·ISO 날짜·정답 비노출·content.questions 제거), 결과 5항목(HIDDEN·SURVEY 완료·VIDEO 완료·대상 외 REJECTED·DUPLICATE)이 항목별 커밋(영수증 3·로그 1)되고 이후 목록이 비는 것, 400 코드. E1002 데이터 자동 정리. `WpfApiDevServer`(테스트 소스) + Gradle 태스크 `:app:wpfDevServer` — 같은 슬라이스를 8080으로 실행.
- 변경(수정): WPF 응답 DTO 5개에 `@JsonInclude(NON_NULL)` 명시 — 전역 BasicConfig 설정 없이도 계약 유지(HTTP 테스트에서 `totalScore: null` 노출로 발견). `app/build.gradle.kts` 태스크 추가(기존 빌드 설정 변경 없음).
- 주요 파일: app/src/test/java/server/app/wpf/*, app/build.gradle.kts, domain/.../popup/wpf/*.java, db/oracle/10_*.sql, db/oracle/tools/*, db/oracle/README.md, docs/design/09.
- 검증: 서버 테스트 50개 통과·skip 0(HTTP 통합 4 포함). `:app:wpfDevServer` 기동 후 `curl`로 목록 200/무헤더 401 확인. **WPF Debug 빌드(실서버 모드, DevUserId=E1001)를 붙여 UI Automation으로 첫 팝업(TEXT) 닫기 → Oracle `USER_POPUP_STATUS`(CLOSED, 표시 1회, 표시·닫힘 시각)·`WPF_RESULT_RECEIPT`(ACCEPTED)·`API_REQUEST_LOG`(200, accepted=1) 기록, 다음 팝업(VIDEO) 표시 확인.** 테스트 행 정리, 서버 종료.
- 상태: 커밋 후 푸시.

## 2026-09-19-09 — WPF 방어 로직: 전역 예외 처리·크래시 로그·자동 재시작

- 이유: 사용자 요청. 트레이 상주 프로그램이 처리되지 않은 예외로 죽으면 이후 팝업이 뜨지 않고 미전송 결과 큐도 멈춘다.
- 변경: `Service/CrashGuard.cs` 신규 — `DispatcherUnhandledException`(로그 후 Handled=true, 프로세스 유지·안내), `TaskScheduler.UnobservedTaskException`(로그·SetObserved), `AppDomain.UnhandledException`(로그 후 같은 인자로 자동 재시작, 10분 내 3회 제한, `--restarted` 인자). 로그 `%LOCALAPPDATA%\Popup\logs\crash-yyyyMMdd.log`. `App.OnStartup` — `CrashGuard.Install` 최우선 호출, `--restarted`이면 단일 인스턴스 Mutex 획득을 5초간 재시도(죽어 가는 부모와의 경합 대비).
- 주요 파일: popup-frameWork/Popup/Service/CrashGuard.cs, App.xaml.cs.
- 검증: 빌드 경고 0·오류 0. `--demo --restarted`로 기동 확인, 두 번째 인스턴스 즉시 종료 확인. 실제 예외 유발 경로(강제 크래시)는 미검증. 재게시 `dist/Popup.exe`.
- 상태: 커밋 후 푸시.

## 2026-09-19-08 — VIDEO 전체화면을 팝업 창이 있는 모니터에 표시

- 이유: 사용자 시연 피드백. 전체화면 창이 `WindowState.Maximized`만 지정되어 기본 위치(주 모니터/마지막 활성 모니터)에서 최대화되므로, 팝업이 보조 모니터에 있어도 전체화면은 다른 모니터에 떴다.
- 변경: `VideoPopupView.EnterFullScreen` — 팝업 창 HWND로 현재 모니터(`Forms.Screen.FromHandle`)를 구해 `WindowStartupLocation.Manual` + 그 모니터 영역으로 Left/Top/Width/Height 지정, `SourceInitialized`에서 `SetWindowPos(HWND_TOPMOST, 물리 픽셀 영역)`로 정확히 맞춤. `Topmost=true`(팝업·Overlay와 동일 층). `WindowState`는 Normal 유지.
- 주요 파일: popup-frameWork/Popup/Views/Contents/VideoPopupView.xaml.cs.
- 검증(UI Automation): Demo Mode에서 비디오 팝업을 열고 창을 오른쪽 모니터(3200,300)로 이동 후 전체화면 버튼 실행 → 전체화면 창 rect `(2560,0)-(5120,1440)` = 해당 모니터 전체. 빌드 경고 0·오류 0. 재게시 `publish/win-x64/Popup.exe`·`dist/Popup.exe`. 고DPI(150%) 모니터에서의 전체화면은 미검증.
- 상태: 커밋 후 푸시.

## 2026-09-19-07 — WPF 시연 피드백 반영: 창 목록 1개·팝업 항상 최상위·Overlay 수정

- 이유: 사용자 시연 결과 (1) 작업 관리자·작업 표시줄에 창이 여러 개 보임, (2) 배경을 누르면 팝업이 뒤로 가림, (3) 설문 시 메인 모니터에 배경(Overlay)이 안 보임.
- 변경:
  - `PopupWindow.xaml` — `ShowInTaskbar="False"`, `Topmost="True"`. `PopupManager` — 팝업은 Overlay 사용 여부와 무관하게 항상 Topmost, `Deactivated` 시 재확인, 열린 창 집합(`_openWindows`) 관리, Overlay 클릭 시 `BringPopupsToFront()`.
  - `BackgroundOverlayManager` — Overlay 창에 `WS_EX_NOACTIVATE|WS_EX_TOOLWINDOW`, `WM_MOUSEACTIVATE → MA_NOACTIVATEANDEAT`(클릭은 삼키되 활성화 안 함 → 팝업 z-순서·포커스 유지), 제목 비움·소유자 지정(앱 창 목록 제외), Show/Loaded 뒤 `SetWindowPos`로 모니터 영역 재적용, `BackgroundClicked` 이벤트. **`AllowsTransparency=true` 추가** — 원본은 이 설정이 없어 `Opacity`가 무시되고 Overlay가 완전 불투명(검정)으로 떴음(실행 캡처로 확인).
  - 팝업 위에 뜨는 `MessageBox` 전부에 팝업 창을 owner로 지정(Topmost 팝업 뒤에 숨지 않도록): `PopupManager`, `PopupWindow`, `SurveyPopupView`, `ImageFillPopupView`, `TextPopupView`.
- 주요 파일: popup-frameWork/Popup/Managers/BackgroundOverlayManager.cs, Managers/PopupManager.cs, Views/Windows/PopupWindow.xaml(.cs), Views/Contents/SurveyPopupView.xaml.cs, ImageFillPopupView.xaml.cs, TextPopupView.xaml.cs.
- 검증(UI Automation으로 Demo Mode 실행·설문 팝업 열기·창 열거·화면 캡처, 3모니터 환경): Overlay가 3개 모니터(주 모니터 (0,0)-(2560,1440) 포함) 모두에 생성되고 툴창·NOACTIVATE·Topmost 확인. 주 모니터 배경 클릭 후에도 `PopupWindow`가 z-순서 최상단·포그라운드 유지. Overlay 어둡기: 흰 배경 픽셀 250→137(≈0.55, 설정 0.45 반영), 수정 전에는 순흑(불투명). 재게시 `publish/win-x64/Popup.exe`·`dist/Popup.exe`. **(3)의 "설문 시 메인 모니터 Overlay 미생성"은 수정 전 빌드로도 재현되지 않았고**(모든 모니터에 생성됨) 원인이 불투명 Overlay 또는 창 소유 관계로 추정되어 위 수정으로 함께 대응. 작업 관리자 목록은 자동 확인 불가 — 수동 확인 필요.
- 상태: 커밋 후 푸시.

## 2026-09-19-06 — WPF Demo Mode 재구성(결과 흐름 시뮬레이션) 및 단일 exe 게시

- 이유: 사용자 요청. 기존 Demo Mode는 샘플 팝업만 띄우고 결과를 버렸다. 새 구조(기준 3·4)의 핵심인 "종료 시 결과 항목 1회 전송"을 서버 없이도 확인할 수 있게 하고, 배포용 exe를 만든다.
- 변경(추가): `Service/IPopupGateway`(목록·결과 2개 메서드 추상화, `PopupApiService`가 구현), `Service/DemoPopupGateway`(인메모리 서버: 숨김·완료 상태 유지·다음 조회 제외, QUIZ는 샘플 JSON `correctAnswers`로 채점, SURVEY 즉시 완료, VIDEO 비율 판정, DUPLICATE, `ResultProcessed` 이벤트).
- 변경(수정): `PopupResultQueue` 생성자를 `IPopupGateway`로. `DemoWindow.xaml/.cs` — 실제 모드와 같은 `PopupResultQueue`·훅을 쓰고 오른쪽에 결과 요청/응답 JSON 로그, "서버 상태 초기화"·"로그 지우기" 버튼, 숨김·완료 카운트. `MainWindow` — 실행 인자 `--demo`로 Demo Mode 활성(설정 파일 수정 불필요). README에 실행·게시 방법.
- 주요 파일: popup-frameWork/Popup/Service/IPopupGateway.cs, DemoPopupGateway.cs, PopupResultQueue.cs, PopupApiService.cs, DemoWindow.xaml(.cs), MainWindow.xaml.cs, README.md.
- 검증: `dotnet build` 경고 0·오류 0. `dotnet publish`(Release, win-x64, self-contained, single-file) → `popup-frameWork/publish/win-x64/Popup.exe` 82MB(Git 제외, 사본 `D:\work\PopupProject2026\dist\Popup.exe`). 게시본을 `--demo`로 실행해 8초 후 프로세스 생존·창 제목 `Popup Demo Mode` 확인 후 종료. **팝업 버튼 클릭·결과 로그 표시·퀴즈 채점 등 화면 조작은 미검증**(자동화 불가, 수동 확인 필요).
- 상태: 커밋 후 푸시. 게시 결과물은 커밋하지 않음.

## 2026-09-19-05 — [단계 1] Oracle 스키마 실제 적용 및 실DB 검증

- 이유: 로컬 Oracle 21c XE(system 계정) 확보. 기준 5의 DDL과 단계 2~5의 매퍼·서비스를 실DB로 검증.
- 변경(DB): `db/oracle/00_create_schema_oracle.sql`(POPUP·ZERO_RULE 사용자 생성)·`03_grant_zero_rule_oracle.sql`(ZERO_RULE에 POPUP DML·시퀀스 권한) 신규, `db/oracle/README.md`(실행 순서·테스트 방법·실DB 특이사항). `01_popup_schema_oracle.sql`에서 UNIQUE 제약과 같은 컬럼의 인덱스 2개(`ix_question_template`, `ix_option_question`) 생략 — Oracle `ORA-01408`.
- 변경(서버): `KstTimestampTypeHandler` — null도 `setNull(Types.TIMESTAMP)`로 바인딩(`Types.NULL`은 CHAR로 추론되어 `COALESCE(?, TIMESTAMP)`에서 `ORA-00932`). `PopupQuestionDatabaseTest` Configuration에 `jdbcTypeForNull=NULL`(운영 mybatis-config와 동일, 없으면 `ORA-17004`). 신규 `WpfPopupDatabaseTest`(실DB 롤백 전용: 사용자 3명 기대 목록, HIDDEN/SUBMITTED QUIZ·SURVEY/VIDEO_WATCHED/DUPLICATE, 완료·숨김 제외, 구 WPF-01 계약 유지, 대상 외 REJECTED, 요청 로그).
- 변경(문서): `docs/design/05` §7 검증 결과, `docs/design/09` 진행 상태, README 단계 표.
- 주요 파일: db/oracle/00·01·03·README, zero-rule-server-main/repo/core/.../KstTimestampTypeHandler.java, service/core/src/test/.../PopupQuestionDatabaseTest.java, service/core/src/test/.../wpf/WpfPopupDatabaseTest.java.
- 검증: XEPDB1에 `POPUP` 스키마 적용(테이블 17·시퀀스 12·인덱스 15·주석 37·샘플 36행, 한글·`IS JSON` 정상). `ZERO_RULE` 계정에서 POPUP 테이블 조회·시퀀스 사용 확인. `POPUP_TEST_DB_PASSWORD` 설정으로 `:service:core:test :web:api:test` 46개 통과·skip 0. 롤백 후 잔여 행 0 확인(status/response/receipt/log). **zeroserver 기동·WPF HTTP 실연동은 미수행** — 공통 `ZERO_RULE` 스키마(PostgreSQL DDL만 존재)가 Oracle에 없어 앱이 뜨지 않으며, 이는 기준 범위(popup DB) 밖.
- 상태: 단계 1 완료. 커밋 후 푸시.

## 2026-09-19-04 — [단계 6] WPF 클라이언트를 신규 API(조회 1 + 결과 1)로 전환

- 이유: 기준 2(서버 판정 목록 그대로 렌더링), 3(API 2개), 4(종료 시 1회 전송·실시간 제거), 6(userId 미전송, 인증 헤더 확장 지점).
- 변경(추가): `Service/Auth/IAuthHeaderProvider`(+None/Static 구현) — Authorization 헤더 공급 확장 지점(SSO·통합 토큰은 타 팀, 지금은 동작 불필요). `Service/PopupResultQueue`(로컬 파일 큐 `%LOCALAPPDATA%\Popup\pending-results.json`, 즉시 전송·flush·항목 종결 시 제거), `Service/PopupResultBuilder`(창 생명주기 → 결과 항목 1개, resultId 창 생성 시 확정), `Dtos/WpfPopupListResponseDto`, `Dtos/WpfResultDtos`.
- 변경(수정): `PopupApiService` — `GetWpfPopupsAsync`·`PostResultsAsync`·`SendWithAuthAsync`(헤더 부착·401 1회 재시도·WPF 오류 JSON 해석), 생성자에 헤더 공급자·개발용 `X-Dev-User-Id`. 기존 6개 메서드는 호출부 없이 유지. `MainWindow` — UserId 제거, 시작·조회 전 큐 flush, 서버 `pollingIntervalSeconds` 우선, `HasOpenPopups`면 조회 건너뜀, `/statuses`·완료 필터 제거. `PopupManager` — 콜백 5개를 `PopupResultBuilder` 기반 결과 수집으로 교체(제출은 즉시 전송 후 QUIZ 통과/미통과·REJECTED 안내), `HasOpenPopups` 추가. `PopupOptions` — 콜백 → `ReportResultAsync`/`ReportResultImmediateAsync`, `DoNotShowAgainChecked`/`HideDays`/`PopupType`. `PopupWindow` — 숨김 API 직접 호출 제거, `OnClosing`에서 체크 기록, 완료 전 닫기 금지 판단을 `VideoPopupView.HasReachedCompletion` 로컬 추정으로. `VideoPopupView` — 10초 진행률 저장 타이머·`VideoProgressSaveRequested` 제거, `GetFinalProgress()`·`HasReachedCompletion()` 추가. `SurveyPopupView` — 로컬 퀴즈 채점(`CalculateScore`·`AreAnswersEqual`·`_passingScore`) 제거(서버 채점). `PopupFactory` — 최상위 `questions` 우선(없으면 `content.questions` 호환), `PopupType`·`HideDays` 전달. `PopupService` — 로컬 정책 제거. `PopupClientSettings`·`appsettings.json`·`launchSettings.json` — `UserId`/`POPUP_USER_ID` → `Auth.Mode/StaticHeader`, `DevUserId`/`POPUP_DEV_USER_ID`, 폴링 기본 1800.
- 변경(삭제): `Service/PopupPolicyService.cs`, `Service/PopupStorageService.cs`.
- 변경(문서): `docs/design/07` 구현 결과 요약 추가, `Popup/Docs/POPUP_OPTION_GUIDE.md` §8 신규 API 안내.
- 주요 파일: popup-frameWork/Popup/{MainWindow.xaml.cs, Managers/PopupManager.cs, Models/PopupOptions.cs, Models/PopupClientSettings.cs, Factories/PopupFactory.cs, Service/*, Dtos/Wpf*.cs, Views/Windows/PopupWindow.xaml.cs, Views/Contents/VideoPopupView.xaml.cs, Views/Contents/SurveyPopupView.xaml.cs, appsettings.json, Properties/launchSettings.json}.
- 검증: `dotnet build Popup.csproj -c Debug` 경고 0·오류 0 (SDK 10.0.400). 저장소 `NuGet.config`는 폐쇄망 오프라인 소스만 가리키고 nupkg는 저장소에 없어 `--source https://api.nuget.org/v3/index.json`으로 복원함(설정 파일 변경 없음). csproj의 WebView2 1.0.3124.44와 `OFFLINE_WPF_BUILD.md`의 1.0.4078.44가 베이스라인부터 불일치 — 미수정, 미결로 기록. **실서버 연동·화면 동작·데모 모드 실행은 미검증.**
- 상태: 단계 6 코드 완료. 다음 단계 7(관리자 웹 SURVEY 채점 입력 숨김, 선택) 및 실DB·실연동 검증.

## 2026-09-19-03 — [단계 3~5] 신규 WPF API: 사용자 식별 어댑터·조회 API·결과 API

- 이유: 기준 2(서버 노출 판단·완료 제외), 3(조회 1개 + 결과 1개 API), 4(종료 시점 1회 전송), 6(토큰 기준 사용자 식별, 토큰 자체는 타 팀).
- 변경(추가 21개 소스 + 테스트 3개):
  - `GET /p/api/wpf/popups`, `POST /p/api/wpf/popups/results` — `WpfPopupController`, `WpfApiExceptionHandler`(WPF 컨트롤러 한정 {code,message,timestamp}), 요청 DTO `WpfResultRequest`(본문 userId 무시).
  - 사용자 식별 어댑터 `WpfUserResolver` + `SecurityContextWpfUserResolver`(기본, 통합 토큰 필터 결과 사용·매핑 TBD) + `DevHeaderWpfUserResolver`(`custom.wpf-popup.dev-user-header=true`일 때만, `X-Dev-User-Id`).
  - `WpfPopupService`(목록 조립·결과 일괄·요청 로그), `WpfResultProcessor`(항목 REQUIRES_NEW, CLOSED/HIDDEN/SUBMITTED/VIDEO_WATCHED를 기존 `PopupService.hidePopup/submitResponse/saveVideoProgress`에 위임, `WPF_RESULT_RECEIPT` 멱등), `WpfPopupMapper`(+XML: mergeDisplayAndClose·countActiveUser·selectStatus·countReceipt·insertReceipt·insertApiRequestLog).
  - 도메인 DTO `server.domain.popup.wpf.*` 10개 (날짜는 `@JsonFormat` ISO 8601 — 전역 epoch 설정 미변경). `WpfPopupProps`(base/props).
- 변경(popup 소스 수정): `PopupMapper.selectAvailablePopups(userId, excludeCompleted)` + 호환 default, `PopupMapper.xml`에 `<if test="excludeCompleted"> OR COMPLETED_YN='Y'`, `PopupService`에 public `loadPublicQuestions`·`toPublicResponseDto`.
- 변경(설정): `application-common.yml` `custom.wpf-popup`(polling 1800, dev-user-header false), `application-local.yml` dev-user-header true.
- 변경(문서): `docs/design/06` 구현 반영 전면 갱신, `docs/design/03` REJECTED 코드 목록.
- 주요 파일: web/api/.../popup/wpf/*, web/api/.../payload/popup/wpf/WpfResultRequest.java, service/core/.../popup/wpf/*, repo/core/.../WpfPopupMapper.java·.xml, domain/.../popup/wpf/*, base/.../props/WpfPopupProps.java.
- 검증: `:service:core:test` + `:web:api:test` 45개 통과·1개 skip(실DB). 신규 `WpfResultProcessorTest`(7)·`WpfPopupServiceTest`(3)·`WpfPopupControllerTest`(4, MockMvc)·`PopupMapperOracleStatementTest`(+1: WPF 매퍼 바인딩·cross-namespace include·excludeCompleted 동적 SQL). `:app:compileJava` 통과. **Oracle 실DB·실연동 미검증.** 프레임워크 파일(SecurityConfig·필터·MyBatisConfig·WebMvcConfig·BasicConfig) 미수정.
- 상태: 단계 3~5 코드 완료. 통합 토큰 필터 적용 후 `SecurityContextWpfUserResolver` 매핑 확정 필요. 다음 단계 6(WPF 클라이언트).

## 2026-09-19-02 — [단계 2] 서버 popup 매퍼·데이터소스 Oracle 전환

- 이유: 기준 5(PostgreSQL popup 스키마 → Oracle). 관리자 API와 기존 WPF API가 Oracle POPUP 스키마에서 동작하도록 매퍼를 변환한다. popup 관련 소스는 사용자가 직접 추가한 코드이므로 구조 수정을 허용하고, 프레임워크 파일은 접속 값·드라이버 토글만 바꿨다.
- 변경(popup 소스):
  - `PopupMapper.xml` 27개 구문 Oracle 변환 — RETURNING→selectKey(시퀀스), ON CONFLICT→MERGE, AT TIME ZONE→FROM_TZ, CURRENT_TIMESTAMP→공통 조각 `nowKst`, boolean 바인드 `= 1`, TO_CHAR/TO_DATE, CLOB jdbcType, WITH 재귀 컬럼 목록, BOOL_AND→MIN=1. 구문 ID·파라미터 유지. 콘텐츠 JSON은 SQL 조립을 제거하고 컬럼 6개를 반환.
  - `PopupMapper.java` — 키 반환 5개 메서드를 Map 파라미터 추상 메서드 + 기존 시그니처 default 어댑터로 분리(PopupService 호출부 변경 없음).
  - `PopupEntity` — `contentJson` 대신 콘텐츠 컬럼 6개 필드. `PopupService` — `PopupContentAssembler`로 content 조립, `parseContentJson` 제거.
  - 신규 `PopupContentAssembler`(원본 JSONB 조립 규칙 재현), `KstTimestampTypeHandler`(OffsetDateTime→KST TIMESTAMP 바인드).
  - `PopupQuestionDatabaseTest` 대상 DB를 Oracle(POPUP, SAMPLE-SURVEY-004)로 변경.
- 변경(프레임워크, 최소): `JndiResource` JNDI 데이터소스를 Oracle 드라이버·URL·계정(환경변수 우선)으로, 세션 TIME_ZONE 초기화 SQL 추가. `app/build.gradle.kts`·`service/core/build.gradle.kts` PostgreSQL→ojdbc 토글.
- 변경(DDL·문서): `db/oracle/01_popup_schema_oracle.sql`의 `DEFAULT SYSTIMESTAMP` 33곳을 KST 고정식으로. `docs/design/05` §3·§6·§7을 구현 결과로 갱신.
- 주요 파일: zero-rule-server-main/repo/core/src/main/resources/mappers/popup/PopupMapper.xml, repo/core/.../PopupMapper.java, repo/core/.../KstTimestampTypeHandler.java, domain/.../PopupEntity.java, service/core/.../PopupService.java, service/core/.../PopupContentAssembler.java, app/.../JndiResource.java, app/build.gradle.kts, service/core/build.gradle.kts, db/oracle/01_popup_schema_oracle.sql, docs/design/05_Oracle_DB_설계.md.
- 검증: `:app:compileJava` 등 전체 컴파일 통과. `:service:core:test --tests server.service.core.popup.*` 21개 통과·1개 skip — 기존 `PopupAdminQuestionsTest`(7)·`PopupQuestionRulesTest`(5) 회귀 없음, 신규 `PopupMapperOracleStatementTest`(4: 매퍼 메서드↔구문 1:1, selectKey keyProperty, 레코드 속성 경로, PG 문법 잔존 0)·`PopupContentAssemblerTest`(5). **Oracle 실DB 실행은 미수행**(로컬에 Oracle 없음). 관리자 웹·기존 WPF 실연동 미검증.
- 상태: 단계 2 코드 완료. 실DB 검증은 단계 1(스키마 적용) 환경 확보 후 `POPUP_TEST_DB_PASSWORD` 설정으로 `PopupQuestionDatabaseTest` 실행 예정. 커밋 후 푸시.

## 2026-09-19-01 — proto 저장소 베이스라인 구성 및 설계 문서 반입

- 이유: `WPF_WindowsPopupWithC_proto`를 개선 개발 저장소로 지정. sample 저장소 최신 소스(커밋 db0cc4c)를 베이스라인으로 두고 그 위에 설계(docs/design)에 따른 변경을 쌓기 위함.
- 변경: sample의 `zero-rule-server-main`, `zero-rule-web`, `popup-frameWork`, `ERD`, `docs/interfaces`, `scripts`, `shell`, 빌드 설정을 복사. 대용량 바이너리(offline-sdk exe, nupkg, dist)와 `popup-api/`(폐기), PG 데이터 스냅샷 2개, IDE 캐시는 제외하고 `.gitignore`에 추가. 설계 문서 9개와 기준 파일을 `docs/design/`, Oracle DDL·샘플을 `db/oracle/`, 신규 WPF API JSON 예제를 `api/examples/`에 반입. 저장소 README 신규 작성.
- 주요 파일: README.md, .gitignore, docs/design/*, db/oracle/*, api/examples/*, version-history/CHANGELOG.md.
- 검증: 복사 후 파일 1,616개·37MB. 2MB 초과 파일은 `popup-frameWork/Popup/Media/demo-video.mp4`(9.2MB, 데모용 유지)만 남음. 빌드·테스트 미실행(소스 변경 없음).
- 상태: 베이스라인 소스는 sample과 동일(제외 항목 외 수정 없음). 커밋·푸시는 사용자 확인 후 수행.

## 2026-09-16-08 — JSON 송수신 인터페이스 설계서 작성

- 이유: 사용자 요청에 따라 시스템 간 주고받는 JSON 기준 인터페이스 설계서 제공.
- 변경: 팝업 공개 API 6개와 관리자 API 6개 요청·응답, 공통 필드, 유형별 content, 문항·정답·대상 조건, 날짜/응답 래퍼/null 규칙 및 검증 한계 문서화. 복사 가능한 가상 JSON 예제 모음 추가.
- 주요 파일: docs/interfaces/POPUP_INTERFACE_SPEC.md, docs/interfaces/popup-interface-examples.json, version-history/CHANGELOG.md.
- 검증: 실제 컨트롤러·DTO·서비스·매퍼·ObjectMapper·웹 API 클라이언트 대조. 문서 JSON 코드 블록 30개 파싱, API 예제 12개 경로·메서드 대조, 응답 DTO 7종 필드 대조 및 공개 예시 정답 비노출 검사 통과. git diff --check 통과. 서버 호출·배포 미실행.
- 상태: 사용자 요청에 따라 이번 master 커밋에 포함(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 직전 편집 화면 배치 수정 유지.

## 2026-09-16-07 — 팝업 편집 입력과 표시 옵션 재배치

- 이유: 입력 항목이 길어 필수·주요 입력은 왼쪽, 토글 옵션은 오른쪽 아래로 정리하도록 요청함.
- 변경: 왼쪽을 기본 정보 → 콘텐츠 → 노출 대상으로 정리. 공통 활성화·헤더·닫기·푸터·다시 보지 않기·배경 차단 및 유형별 표시/재생 토글을 오른쪽 미리보기 아래로 이동. 크기 설정도 오른쪽 옵션에 배치. 미리보기와 옵션 영역을 나누고 옵션만 독립 스크롤. 좁은 화면은 한 열로 전환. 대상 조건에 종속된 하위 부서 포함 토글은 대상 입력 옆에 유지.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: TSX 구문 검사 및 git diff --check 통과. 변경 전후 AST 비교로 입력 변경 처리 50개 보존 확인(CRLF/LF 정규화). 전체 타입 검사 및 실제 브라우저 배치 검증은 미실행. 저장 데이터 구조와 기본값 변경 없음.
- 상태: 사용자 요청에 따라 이번 master 커밋에 포함(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 배포 없음.

## 2026-09-16-06 — 실제 크기 미리보기 전용 종료 버튼 추가

- 이유: 헤더·닫기 표시를 끄고 배경 차단을 켜면 실제 크기 미리보기에서 마우스로 나갈 수 없음.
- 변경: 팝업 표시 옵션과 독립적인 미리보기 종료 버튼을 화면 오른쪽 위에 항상 표시. 고정·비율·전체화면에서 동일하게 동작하고 기존 Esc 종료도 유지. 팝업 자체 크기를 바꾸지 않는 고정 위치 버튼 사용.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: TypeScript transpileModule TSX 구문 오류 0개 및 git diff --check 통과. 전체 타입 검사는 재실행하지 않음. 실제 브라우저 클릭 동작 미검증.
- 상태: 사용자 요청에 따라 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 기존 작업 보존. 배포 없음.

## 2026-09-16-05 — 좌우 카드 제거 및 하단 설명 링크 추가

- 이유: 좌우 카드 기능을 제거하고 하단 설명에 URL 이동과 클릭·호버 동작을 제공하도록 요청함.
- 변경: 관리자 입력 및 웹/WPF 렌더링, DTO, 팩토리에서 좌우 카드와 추가 설명 제거. 서버 본문 저장·조회 필드를 plainText로 통일. bottomDescriptionUrl 입력 추가, HTTP/HTTPS 링크를 웹 새 창/WPF 기본 브라우저로 열고 호버·키보드 포커스 스타일 적용. URL이 없거나 유효하지 않은 경우 일반 설명 표시. Markdown 모드에도 하단 설명 표시.
- 주요 파일: PopupEditorDialog.tsx, PopupPreview.tsx, TextPopupContentDto.cs, TextPopupView.xaml 및 코드 비하인드, PopupFactory.cs, PopupService.java, PopupMapper.xml(주 서버 및 popup-api), DemoPopupDataService.cs, demo-text-notice.json, POPUP_OPTION_GUIDE.md, ERD/STRUCTURE_REVIEW.md.
- 후속 수정: 미리보기 URL 미적용 제보에 따라 https:// 생략 주소를 보정하는 공통 함수를 입력 저장·미리보기에 적용. 설명 없이 URL만 입력해도 링크 표시. 하단 설명 영역 전체를 클릭 가능한 링크로 변경. 주요 파일에 normalizePopupLink.ts 추가. WPF도 설명이 없으면 URL 표시. 후속 검증: URL 보정 6개 및 미리보기 정적 렌더링 5개(일반/Markdown 모드, URL 단독, 숨김) 통과. Markdown 렌더러는 테스트 대역 사용. 편집기 TSX 구문 및 diff 검사 통과. WPF 재빌드 경고·오류 0개. 전체 타입 검사 재실행 및 브라우저 실제 클릭은 미검증.
- 검증: WPF dotnet build --no-restore 경고·오류 0개. 서버 :service:core:compileJava 통과. 웹 전체 타입 검사에서 이전과 동일한 108개 오류 발생, 수정한 PopupPreview.tsx 및 PopupEditorDialog.tsx 오류 없음. 미리보기 페이지 HTTP 200 및 git diff --check 통과. 실제 브라우저/WPF 클릭·호버 동작 미검증. 기존 DB 및 SQL 스냅샷은 변경하지 않음. 과거 JSON의 카드 필드는 더 이상 표시하지 않으며 DB 데이터 변환은 미실행.
- 상태: 사용자 요청에 따라 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 앞선 배경 미리보기 수정 유지. 운영 배포 없음.

## 2026-09-16-04 — 배경 차단 설정 미리보기 반영

- 이유: 배경 차단 사용 여부와 어둡기 설정이 미리보기 렌더링에 연결되지 않아 변경 효과가 보이지 않음.
- 변경: 편집기 미리보기에 배경 여백 및 설정값에 따른 검정 오버레이 표시. 실제 크기 창의 배경에도 사용 여부와 어둡기 적용. 차단 사용 시 배경 클릭으로 미리보기가 닫히지 않도록 처리. 실제 크기 창 내부에는 중복 배경을 표시하지 않음.
- 주요 파일: zero-rule-web/main/src/features/RgstPop/PopupPreview.tsx, PopupEditorDialog.tsx, version-history/CHANGELOG.md.
- 검증: git diff --check 통과. 전체 웹 TypeScript 검사 실행 결과 공통 UI의 MUI SxProps 타입 충돌 등 108개 오류로 실패. 오류 목록에서 수정한 PopupPreview.tsx 및 PopupEditorDialog.tsx 오류 없음 확인. 개발 서버 /popup-preview/ HTTP 200 확인. 별도 창 미리보기의 기존 크기 유지. 브라우저 실제 배경색·클릭 동작 및 WPF 화면 미검증.
- 상태: 사용자 요청에 따라 이번 master 커밋에 포함할 내용으로 확정(커밋 직전 기록). 푸시 결과는 원격 브랜치와 완료 응답으로 확인. 운영 배포 없음.

## 2026-09-16-03 — 남은 로컬 커밋 및 변경 이력 master 통합

- 이유: 사용자가 미반영 브랜치 커밋과 변경 이력을 모두 master에 반영하고 푸시하도록 요청함.
- 변경: agent/wpf-7-user-configuration의 79f8910 커밋 이력을 master에 병합. 해당 launchSettings.json의 POPUP_USER_ID=E1002 설정은 이미 master에 동일하게 존재하여 소스 변경 없음. 오늘 작업 기록 2026-09-16-01 및 02를 함께 커밋 대상으로 포함.
- 주요 파일: version-history/CHANGELOG.md. 병합 대상 커밋의 파일은 popup-frameWork/Popup/Properties/launchSettings.json.
- 검증: 최신 origin/master와 동기화 상태 확인. 병합 충돌 및 소스 변경 없음. 실행 설정 JSON 파싱 성공. build/offline-wpf-dependencies와 feature/popup-video-db-samples의 커밋은 이미 master에 포함됨. 소스 변경이 없어 빌드 및 테스트는 추가 실행하지 않음.
- 상태: 병합 및 변경 이력 커밋 직전 기록. 앞선 두 항목의 미커밋·미푸시 표시는 최초 기록 당시 상태이며 이번 커밋에 함께 포함함. 푸시 결과는 작업 완료 응답과 실제 원격 브랜치로 확인. 운영 배포 없음.

## 2026-09-16-02 — 로컬 DB 문항 편집 및 표시 순서 마이그레이션 적용

- 이유: 사용자가 미완료 DB 변경 적용을 요청. 서버 JNDI 설정의 실제 대상은 localhost:5432/postgres이며 표시 순서·주관식 정답 관련 컬럼 3개가 누락되어 있었음.
- 변경: 기존 마이그레이션 3개를 단일 트랜잭션으로 실행하고 COMMIT 확인. popup.popup_notice.display_order(integer, NOT NULL, 기본값 100) 및 1 이상 제약, popup.popup_question.correct_answer(text), answer_match_mode(varchar(10), EXACT/CONTAINS 제약) 추가.
- 권한: 문항 템플릿 목록·상세 API 권한은 이미 존재하여 추가 행 0개. 기존 팝업 상세 권한 복사 SQL 실행 완료.
- 주요 파일: 실행한 ERD/popup_display_order_migration.sql, ERD/popup_question_answer_migration.sql, ERD/migrations/20260913_popup_question_template_permissions.sql. SQL 원본 변경 없음. 기록 파일 version-history/CHANGELOG.md 갱신.
- 검증: 적용 전후 팝업 5개·문항 3개 유지. 별도 연결에서 컬럼·제약 및 기존 표시 순서 기본값 100 확인. 실제 postgres DB에서 PopupQuestionDatabaseTest 1개 실행, 실패·오류·건너뜀 0개. 문항 저장·재조회·주관식/객관식 채점·공개 응답 정답 비노출·기존 템플릿 보존 검사 통과. 테스트 데이터 롤백 후 팝업/문항 수 유지 확인.
- 상태: 로컬 DB 반영 완료, 변경 이력 미커밋. 커밋·푸시·운영 배포 없음. 브라우저/WPF 화면 미검증. 템플릿 버전 증가·재제출 이력 정책·기존 설문 데이터 전환은 이번 마이그레이션 범위에 포함하지 않음.

## 2026-09-16-01 — 노트북 변경 반영 후 markdown 의존성 복구

- 이유: 최신 커밋에서 추가한 `react-markdown`, `remark-gfm`이 현재 PC에 설치되지 않아 모듈을 찾지 못하는 오류 발생.
- 확인: 프로젝트 지정 pnpm은 9.15.2이나 현재 전역 pnpm은 8.15.4. 두 패키지 모두 `MODULE_NOT_FOUND` 재현.
- 변경: `zero-rule-web`에서 `npx.cmd --yes pnpm@9.15.2 install --frozen-lockfile` 실행으로 로컬 의존성 복구. 소스, package.json, pnpm-lock.yaml 변경 없음. 전역 pnpm 버전 변경 없음.
- 주요 파일: `version-history/CHANGELOG.md`. 설치 대상은 Git 추적 제외된 `zero-rule-web/node_modules` 및 워크스페이스 의존성.
- 검증: 의존성 설치 종료 코드 0. Node ESM으로 두 패키지 import 성공. 설치 후 Git 추적 파일 변경 없음 확인. 전체 TypeScript 검사는 장시간 완료되지 않아 중단했으며 통과로 판단하지 않음. 실제 웹 화면 미검증.
- 상태: 변경 이력 미커밋. 커밋·푸시·배포 없음.

## 2026-09-15-05 — 로컬 작업 보존 및 최신 master 동기화

- 이유: 미커밋 로컬 변경이 있는 상태에서 원격 변경 반영이 막혀 Git 충돌 해결을 요청함.
- 변경: 로컬 수정 및 미추적 JSON을 stash에 백업하고 원격 13개 커밋을 fast-forward로 반영한 뒤 로컬 변경을 재적용. `Popup.csproj`와 서버 `PopupService.java`는 자동 병합됨.
- 보존: 미디어 내장·교체 이미지·데모 공지·영상 탐색·마크다운 미리보기·서비스 주석·로컬 설정 유지. 내부망에 맞춘 WebView2 SDK `1.0.3124.44` 고정과 원격 문항 편집 기능 유지.
- 주요 파일: `popup-frameWork/Popup/Popup.csproj`, `zero-rule-server-main/service/core/src/main/java/server/service/core/popup/PopupService.java`, 기존 로컬 수정 파일 및 `popup-frameWork/demo-text-notice.json`.
- 검증: 미해결 Git 항목 없음, HEAD와 origin/master 차이 0개, 자동 병합 외 로컬 수정 10개 파일은 stash와 동일. 지정 SDK 복원 후 WPF 빌드 경고·오류 0개. 전체 웹 `pnpm type-check` 통과. `git diff --check` 통과.
- 상태: 로컬 수정은 미커밋으로 유지. 추가 커밋·푸시·배포 없음. 백업 stash `backup before master sync 2026-09-15` 보존. 실제 UI 및 Java 테스트는 이번 동기화에서 실행하지 않음.

## 2026-09-15-04 — 실행 스크립트·이력 파일 커밋 및 master 반영 준비

- 이유: 사용자가 작업 브랜치 푸시, master 병합, fetch 및 로컬 master 전환을 요청함.
- 변경: `shell/start-dev.ps1`, `AGENTS.md`, 변경 이력을 함께 커밋 대상으로 정리. 이전 항목의 미커밋·미푸시 표기는 최초 기록 시점의 상태임을 명시.
- 검증: 최신 origin/master의 추가 미반영 커밋 없음. PowerShell 구문 및 신규 파일 공백 검사 확인.
- 진행 상태: 이 항목은 커밋 직전에 작성함. 원격 반영 여부는 Git 원격 브랜치와 최종 작업 결과로 확인한다.
- 참고: MUI 참조 경로 수정과 실제 DB 마이그레이션은 이번 작업에 포함하지 않음.
## 2026-09-15-03 — 변경 이력 관리 시작

- 이유: 수정할 때마다 작업 내역을 누적하고 이후 작업에서도 기록을 유지하기 위함.
- 변경: `version-history/CHANGELOG.md`에 기록 규칙과 초기 이력 작성. 루트 `AGENTS.md`에 수정 시 이력 갱신 규칙 추가.
- 주요 파일: `version-history/CHANGELOG.md`, `AGENTS.md`.
- 검증: 문서 내용과 Git 변경 상태 확인.
- 상태(최초 기록 당시): 미커밋·미푸시.

## 2026-09-15-02 — master 병합 및 공통 UI 타입 오류 검증

- 이유: 현재 작업 브랜치에 없던 다중 모니터 배경 팝업과 관리자 설정을 반영하기 위함.
- 변경:
  - `origin/master`의 `7eec255`를 `feat/popup-question-editor-erd`에 병합.
  - 모니터별 배경창, 배경 클릭 차단, 관리자 배경 사용 여부·어둡기 설정 반영.
  - 최신 문항 편집 기능에 기존 문항 템플릿 조회·불러오기 기능 통합.
  - 중복 문항 저장 SQL 제거, 로컬 DB 설정 유지.
  - 통합 ERD에 표시 우선순위와 주관식 정답·비교 방식 컬럼 반영.
- 주요 파일:
  - `popup-frameWork/Popup/Managers/BackgroundOverlayManager.cs`
  - `zero-rule-web/main/src/features/RgstPop/PopupEditorDialog.tsx`
  - `zero-rule-web/main/src/features/RgstPop/PopupQuestionTemplatePicker.tsx`
  - `zero-rule-server-main/service/core/src/main/java/server/service/core/popup/PopupService.java`
  - `zero-rule-server-main/repo/core/src/main/resources/mappers/popup/PopupMapper.xml`
  - `ERD/01_schema.sql`
- 검증:
  - Java API 컴파일 성공, 서비스·영상 API 테스트 20개 통과.
  - DB 연결 테스트 1개는 연결 설정이 없어 건너뜀. 실제 DB 마이그레이션 미실행.
  - 지정 WebView2 SDK 복원 후 WPF 빌드 성공, 경고·오류 0개. 실제 다중 모니터 동작은 미검증.
  - 팝업 관련 9개 파일 타입 검사 오류 0개.
  - 원래 설정의 전체 프런트엔드 타입 검사는 공통 UI의 MUI 스타일 타입 충돌로 실패.
  - 후속 원인 검증: 대표 컴포넌트 2개에서 오류 재현. 메모리상으로 MUI 참조 경로를 통일하면 전체 885개 파일 검사 오류 0개.
- 커밋: `4e54d19` (부모: `d6a7b0f`, `7eec255`). 최초 기록 당시 원격 푸시 미실행.
- 남은 사항: MUI 경로 통일은 검증만 했으며 실제 `tsconfig.json` 수정은 아직 하지 않음.

## 2026-09-15-01 — 개발 서버 통합 실행 스크립트

- 이유: 한 번의 명령으로 Java 백엔드와 프런트엔드 개발 서버를 실행하기 위함.
- 변경: `shell/start-dev.ps1` 추가. 백엔드 `:app:bootRun -Pprofile=local`과 프런트엔드 `pnpm run dev`를 각각 별도 PowerShell 창에서 실행.
- 주요 파일: `shell/start-dev.ps1`.
- 실행: 프로젝트 루트에서 `powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1`.
- 검증: PowerShell 구문 검사 통과. 스크립트를 통한 실제 서버 실행은 미검증.
- 상태(최초 기록 당시): 미커밋·미푸시. master 병합 커밋에는 포함하지 않음.
