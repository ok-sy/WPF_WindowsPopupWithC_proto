# 변경 이력

프로젝트의 수정 내역과 검증 결과를 기록한다. 날짜는 한국 시간(KST)을 사용한다.

## 기록 규칙

- 수정 작업 한 건마다 항목을 추가한다. 같은 작업의 후속 수정은 해당 항목에 보완한다.
- 최신 항목을 위에 적는다. 기록 ID는 `YYYY-MM-DD-NN` 형식으로 날짜별 순번을 사용한다.
- 변경 이유, 실제 변경 내용, 주요 파일, 검증 결과, 커밋 및 미완료 사항을 기록한다.
- 확인만 한 내용은 실제 수정과 구분하고, 미실행·실패·건너뛴 검증을 명시한다.
- 배포 버전과 기록 ID는 별개다. Git 커밋을 소스 버전 기준으로 사용하고, 배포하지 않은 작업을 배포 완료로 기록하지 않는다.
- 비밀번호, 토큰, 개인정보는 적지 않는다.
- zeroserver/zeroweb 변경은 추가/수정/삭제로 분류해 기존 구조 변경 여부를 함께 적는다.

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
