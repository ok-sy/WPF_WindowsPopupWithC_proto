# WPF_WindowsPopupWithC_proto — WPF 팝업 시스템 개선 개발 저장소

`ok-sy/WPF_WindowsPopupWithC_sample` (커밋 `db0cc4c`, 2026-09-16)을 **베이스라인**으로 두고, [docs/design](docs/design) 설계에 따라 개선 기능을 개발한다.

**서버 베이스라인 교체 (2026-09-20)**: sample의 `zero-rule-server-main`(PostgreSQL 전용 cloverframework `0.0.1-POSTGRE-SNAPSHOT`)은 업스트림 **`git.labcl.net/clover/zero-rule-server` @`56bb0c5` Oracle 버전**(Spring Boot 3.4.1 / Java 17 / cloverframework `3.0.3-SNAPSHOT`, 공통 매퍼 Oracle SQL)으로 교체했다(`zero-rule-server/`, 커밋 `0294d1e`가 업스트림 원본). 공통 프레임워크 대비 우리 변경은 `git diff 0294d1e..HEAD -- zero-rule-server` 로 확인한다.

## 개발 원칙

1. **기존 구조 변경 최소화, 기능 추가 방식** — `zero-rule-server`(zeroserver)과 `zero-rule-web`(zeroweb)의 기존 클래스·필터·매퍼·화면은 재구성하지 않고 새 파일을 추가한다. 기존 파일 수정은 설계 문서의 자체 점검표에 명시된 최소 범위로 한정한다. 베이스라인 커밋과의 diff로 확인한다.
2. **상세 주석** — 추가·수정한 모든 소스 파일 헤더에 `[역할] / [추가 이유 — 기준 항목] / [기존 구조와의 관계]`를, 주요 메서드에 동작·예외·주의사항을 적는다.
3. **변경 이력** — 파일을 수정하면 [version-history/CHANGELOG.md](version-history/CHANGELOG.md)를 갱신한다 ([AGENTS.md](AGENTS.md) 규칙).
4. **인증 범위** — 서버 토큰 인증(웹·WPF 통합 토큰)은 타 팀이 개발한다. 이 저장소는 WPF `IAuthHeaderProvider` 확장 지점과 서버 `WpfUserResolver` 어댑터만 구현한다 ([docs/design/04](docs/design/04_인증설계.md)).

## 디렉터리

| 경로 | 내용 | 출처 |
|---|---|---|
| `docs/design/` | 설계 기준(`기준0.1.txt`)과 설계 문서 01~09 | 신규 |
| `db/oracle/` | Oracle DDL·샘플 (`POPUP` 스키마) | 신규 |
| `api/examples/` | 신규 WPF API JSON 예제 | 신규 |
| `zero-rule-server/` | 주 서버 (Spring Boot 3.4.1, MyBatis, Oracle) | 업스트림 zero-rule-server @56bb0c5 (2026-09-20 교체) |
| `zero-rule-web/` | 관리자 웹 (Next.js) | 베이스라인 |
| `popup-frameWork/` | WPF 클라이언트 (.NET 10) | 베이스라인 |
| `ERD/` | PostgreSQL 기준 DDL·검토 문서 (Oracle 전환 원본 참조용) | 베이스라인 |
| `docs/interfaces/` | 현행(구) 인터페이스 설계서 | 베이스라인 |
| `scripts/`, `shell/`, `OFFLINE_WPF_BUILD.md` | 빌드·실행 스크립트 | 베이스라인 |

## 베이스라인에서 제외한 항목

저장소 용량을 위해 다음은 커밋하지 않는다 (`.gitignore`). 필요하면 sample 저장소에서 복사한다.

| 항목 | 크기 | 비고 |
|---|---|---|
| `offline-sdk/dotnet-sdk-10.0.400-win-x64.exe` | 215MB | 폐쇄망 빌드용. `OFFLINE_WPF_BUILD.md` 참조 |
| `offline-packages/nuget/*.nupkg` | 97MB | 동일 |
| `popup-frameWork/dist/` | 146MB | 게시 결과물 |
| `popup-api/` | – | 별도 팝업 서버. 설계상 폐기(주 서버 단일화) |
| `ERD/2026hyundaicard_popup_data_insert.sql`, `popup-frameWork/Popup/Docs/2026hyundaicard_popup_data_insert.sql` | 14MB×2 | PostgreSQL 데이터 스냅샷. Oracle 전환 후 불필요 |
| `.vs/`, `zero-rule-server/.idea/` | – | IDE 캐시 |
| `zero-rule-server/.git-upstream-56bb0c5/` | – | 업스트림 클론의 .git을 이름만 바꿔 보관(별도 저장소 이력) |

## 구현 순서·진행 상태

[docs/design/09_전환계획_및_미결사항.md](docs/design/09_전환계획_및_미결사항.md) §1 을 따른다: Oracle 스키마 → 서버 매퍼 Oracle 변환 → 사용자 식별 어댑터 → WPF 조회 API → WPF 결과 API → WPF 클라이언트 → 관리자 웹(선택).

| 단계 | 상태 (2026-09-20) | 검증 |
|---|---|---|
| 1 Oracle 스키마 | 완료 — 21c XE `XEPDB1`에 `db/oracle/00~03` 적용 | 테이블 17·시퀀스 12·샘플 적재 |
| 2 서버 Oracle 전환 | 완료 `74456d2` | **실DB 롤백 테스트 통과**(`PopupQuestionDatabaseTest`) |
| 3~5 신규 WPF API | 완료 `8697300` | 단위·MockMvc + **실DB 롤백 테스트**(`WpfPopupDatabaseTest`) 46개 통과 |
| 6 WPF 클라이언트 | 완료 `65247b7` | `dotnet build` 경고 0·오류 0. 실연동 확인(`1f9eabc`) |
| 7 관리자 웹 | 변경 불필요(베이스라인이 이미 SURVEY 채점 입력 숨김) | 코드 확인 |
| 서버 베이스라인 교체 | 완료 `0294d1e` + popup 재적용 — **전체 zeroserver가 Oracle에서 기동**(로컬 XE, `ZERO_RULE_DB_*` 환경변수) | 서버 테스트 50개 통과·skip 0. 전체 서버로 `/p/api/wpf/popups` 401/200, 결과 ACCEPTED·DUPLICATE 확인 |
| 8 구 API 제거 | 미수행 — 통합 토큰(타 팀) 적용 후 | — |

## 서버 실행 (zero-rule-server)

- 요구: JDK 17, Gradle wrapper 8.11.1, `repo.labcl.net`(cloverframework `3.0.3-SNAPSHOT`) 접근.
- 기본 DB는 업스트림 `JndiResource`의 공통 개발 DB(`192.168.114.71:4004/XE`, 계정 `zero-rule`). 접속이 안 되는 로컬에서는 환경변수로 로컬 Oracle을 지정한다(추가한 분기, 없으면 업스트림 값 그대로):
  ```powershell
  $env:ZERO_RULE_DB_URL='jdbc:log4jdbc:oracle:thin:@//localhost:1521/XEPDB1'; $env:ZERO_RULE_DB_USER='ZERO_RULE'; $env:ZERO_RULE_DB_PASSWORD='<pw>'
  cd zero-rule-server; .gradlew :app:bootRun -Pprofile=local     # http://localhost:8080/zero-rule-server
  ```
  로컬 DB에는 `db/oracle/00~03`(POPUP 스키마·ZERO_RULE 권한)과 공통 스키마(`db/oracle/10_*`, 참고용 변환본)가 있어야 한다. 팝업 매퍼는 `POPUP.` 한정자를 쓰므로 공통 계정으로 접속해도 된다.
- 팝업 슬라이스만 띄우기(공통 DB 불필요): `.gradlew :app:wpfDevServer` (`POPUP_TEST_DB_*` 환경변수, 테스트 소스).
- 테스트: `.gradlew :service:core:test :web:api:test :app:test --tests 'server.*popup*' --tests 'server.app.wpf.*'` — 실DB 테스트는 `POPUP_TEST_DB_PASSWORD`가 없으면 skip.

## WPF 실행·빌드

- **Demo Mode** (서버·DB 없이 시연): `Popup.exe --demo` 또는 `appsettings.json`의 `PopupApi.DemoMode: true`. 샘플 팝업 5종을 띄우고, 창이 닫힐 때 만들어지는 결과 항목과 인메모리 서버(`DemoPopupGateway`)의 응답을 화면 오른쪽 로그에 JSON으로 보여 준다. 숨김·완료는 실서버처럼 다음 조회에서 제외되며 "서버 상태 초기화"로 되돌린다.
- **실서버 모드**: `appsettings.json`의 `BaseUrl`(예: `http://localhost:8080/zero-rule-server/p`), 개발 단계에서는 `DevUserId`(서버 `custom.wpf-popup.dev-user-header=true` 필요).
- **단일 exe 게시** (self-contained, win-x64, 약 82MB):
  ```powershell
  cd popup-frameWork
  dotnet publish Popup/Popup.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true -p:DebugType=None --source https://api.nuget.org/v3/index.json -o publish/win-x64
  ```
  결과: `popup-frameWork/publish/win-x64/Popup.exe` (Git 제외). 폐쇄망은 `OFFLINE_WPF_BUILD.md`·`scripts/build-wpf-offline.ps1` 참조.

로컬 빌드 시 NuGet: 저장소 `NuGet.config`는 폐쇄망 오프라인 소스만 가리키고 nupkg는 커밋하지 않으므로, 온라인 환경에서는 `dotnet restore --source https://api.nuget.org/v3/index.json` 로 복원한다.
