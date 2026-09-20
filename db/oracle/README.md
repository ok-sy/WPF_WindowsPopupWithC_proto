# POPUP 스키마 — Oracle 스크립트

기준 5(PostgreSQL popup 스키마 → Oracle). 검증 환경: **로컬 Oracle 21c XE `XEPDB1`**(2026-09-19, POPUP 계정) 및 **원격 개발 DB Oracle 11g XE 11.2.0.2 `192.168.114.71:4004/XE`**(2026-09-20, `zero-rule` 계정 스키마). DDL은 11g 호환으로 작성되어 있다(식별자 30자 이하, `IS JSON` 체크 없음).

## 스키마 배치 — 두 가지 방식 (2026-09-20 스키마 분리 설정화)

매퍼 XML의 테이블·시퀀스 앞 `${popupSchemaPrefix}`는 서버 설정 `custom.popup.schema`로 정해진다(`MyBatisConfig` → `PopupSchema`).

| 방식 | DB | `custom.popup.schema` | DDL 실행 계정 | 비고 |
|---|---|---|---|---|
| A. 별도 POPUP 계정(설계 기본) | 로컬 XE 21c | `POPUP`(기본값) | `popup` | 0→1→2→3 순서. 03으로 앱 계정에 권한 부여 |
| B. 앱 계정 스키마 안에 팝업 테이블 | 원격 개발 DB 11g XE | `""` (application-dev_db.yml) | `zero-rule` | 앱 계정에 CREATE USER 권한이 없어 POPUP 계정을 만들 수 없음. 1→2만 실행(0·3 불필요). 팝업 테이블 17개 이름은 공통 53개와 충돌 없음 |

원격(B) 적용 절차 (2026-09-20 실행 완료 — 테이블 17·시퀀스 12·주석 37·샘플 36행):
```powershell
$env:NLS_LANG = "KOREAN_KOREA.AL32UTF8"     # 필수 — 없으면 한글 주석의 따옴표가 깨져 ORA-01756
cd db\oracle
sqlplus zero-rule/<pw>@//192.168.114.71:4004/XE @01_popup_schema_oracle.sql
sqlplus zero-rule/<pw>@//192.168.114.71:4004/XE @02_popup_sample_oracle.sql
```

## 실행 순서

| 순서 | 파일 | 실행 계정 | 내용 |
|---|---|---|---|
| 0 | `00_create_schema_oracle.sql` | SYSTEM(DBA) | `POPUP` 사용자(=스키마) 생성, 없으면 앱 접속 계정 `ZERO_RULE`도 생성 |
| 1 | `01_popup_schema_oracle.sql` | POPUP | 테이블 17개(원본 16 + `WPF_RESULT_RECEIPT`), 시퀀스 12개, 인덱스, 주석 |
| 2 | `02_popup_sample_oracle.sql` | POPUP | 개발 샘플(사용자 3·팝업 4·대상 조건 6·문항 3). 운영 금지 |
| 3 | `03_grant_zero_rule_oracle.sql <앱계정>` | POPUP | 인자로 준 앱 계정(`ZERO_RULE` 또는 `ZERO-RULE`)에 POPUP 테이블 DML·시퀀스 SELECT 권한 (방식 A에서만) |
| 4 | `04_popup_web_menu_oracle.sql` | 앱 계정(zero-rule) | **관리자 웹 메뉴 데이터**: 공통 테이블에 폴더(`CLOVER_NAV` "팝업 관리")·그룹(`CLOVER_PAGE_SECTION` "팝업 관리")·페이지(`CLOVER_PAGE` "팝업 등록" `/rgst-pop`)·항목(`CLOVER_NAV_ITEM`: 새 NAV + 기존 "관리자 메뉴" 끝)을 추가. 코드 변경 없음, 멱등, 되돌리기 SQL은 파일 끝 주석 |

```powershell
$env:NLS_LANG = "KOREAN_KOREA.AL32UTF8"     # 한글 주석·샘플이 UTF-8이므로 지정
sqlplus system/<pw>@//localhost:1521/XEPDB1 @00_create_schema_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @01_popup_schema_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @02_popup_sample_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @03_grant_zero_rule_oracle.sql ZERO_RULE
```

01은 신규 스키마용이다. 다시 적용하려면 `DROP USER POPUP CASCADE` 후 0부터 실행한다.

### 04 — 관리자 웹 메뉴 데이터 (2026-09-20)

zero-rule-web 사이드바는 `lib/side-menu-list.tsx`가 아니라 DB 메뉴를 쓴다: 로그인 사용자 `CLOVER_USER.nav_id` → `CLOVER_NAV`(웹 "Nav 관리"의 폴더) → `CLOVER_NAV_ITEM` → `CLOVER_PAGE_SECTION`(메뉴 편집의 "새 그룹 추가") → `CLOVER_PAGE`(url = scene-router 경로). 팝업 등록 화면(`/rgst-pop`)은 라우터에는 있으나 DB 메뉴에 없어 사이드바에 보이지 않았다. 04는 공통 테이블에 **데이터만** 넣는다(ID는 공통 `CLOVERFRAMEWORK_SEQ`).

```powershell
$env:NLS_LANG = "KOREAN_KOREA.AL32UTF8"
cd db\oracle
sqlplus zero-rule/<pw>@//192.168.114.71:4004/XE @04_popup_web_menu_oracle.sql
```

- 결과: `master`(nav 2 "관리자 메뉴") 로그인 시 사이드바 맨 끝에 "팝업 관리 > 팝업 등록"이 보인다. 팝업 메뉴만 보이게 하려면 해당 사용자의 `CLOVER_USER.nav_id`를 새 NAV "팝업 관리" id로 바꾼다(웹 사용자 관리 화면 또는 UPDATE).
- 실행 전 조회 스냅샷(2026-09-20): NAV 2개(1 기본, 2 관리자 메뉴), 사용자 3명(master·codingsb·aadd233, nav 2/1/2), `/rgst-pop` 페이지 없음, `CLOVERFRAMEWORK_SEQ` ≈ 376030.

## 실DB 테스트 (롤백 전용)

```powershell
$env:POPUP_TEST_DB_PASSWORD = "popup"
$env:POPUP_TEST_DB_URL = "jdbc:oracle:thin:@//localhost:1521/XEPDB1"   # 기본값과 같으면 생략 가능
$env:POPUP_TEST_DB_USER = "POPUP"
$env:POPUP_TEST_DB_SCHEMA = "POPUP"   # 방식 B(원격, 앱 계정 스키마)면 "" — 매퍼의 ${popupSchemaPrefix}. 원격 예: URL=...@//192.168.114.71:4004/XE, USER=zero-rule, SCHEMA=""
cd zero-rule-server
.\gradlew :service:core:test --tests "server.service.core.popup.PopupQuestionDatabaseTest" --tests "server.service.core.popup.wpf.WpfPopupDatabaseTest"
```

- `PopupQuestionDatabaseTest`: 관리자 저장(템플릿·문항·MERGE·selectKey) → 재조회 → 기존 WPF 조회 → 제출·채점·재제출 왕복
- `WpfPopupDatabaseTest`: 신규 WPF 목록(사용자 3명 기대 목록) → 결과 HIDDEN/SUBMITTED(QUIZ·SURVEY)/VIDEO_WATCHED/DUPLICATE → 완료·숨김 제외 → 대상 외 REJECTED → 요청 로그
- 두 테스트 모두 `session.rollback(true)`로 끝나 샘플 외 행을 남기지 않는다.

## 실DB에서 확인된 Oracle 특이사항 (DDL·매퍼에 반영됨)

| 현상 | 조치 |
|---|---|
| `ORA-01408` UNIQUE 제약과 같은 컬럼 목록의 인덱스 중복 불가 | `ix_question_template`, `ix_option_question` 생략 (UNIQUE 제약 인덱스가 대신함) |
| `ORA-17004` NULL 바인드에 `Types.OTHER`(1111) 거부 | MyBatis `jdbcTypeForNull=NULL` (운영 `mybatis-config.xml`에 이미 설정, 테스트 Configuration에도 지정) |
| `ORA-00932` `Types.NULL` 바인드를 CHAR로 추론해 `COALESCE(?, TIMESTAMP)` 타입 충돌 | `KstTimestampTypeHandler`가 null도 `setNull(Types.TIMESTAMP)`로 바인딩 |

## 개발 서버(팝업 슬라이스)로 WPF 실연동

2026-09-20부터 **전체 zeroserver가 Oracle에서 기동된다**(업스트림 zero-rule-server Oracle 버전, 루트 README "서버 실행" 참조). 아래 슬라이스 서버는 공통 DB 없이 팝업 API만 띄울 때 쓴다. `POPUP_TEST_DB_SCHEMA`로 방식 A/B를 고른다.

```powershell
cd zero-rule-server
$env:POPUP_TEST_DB_PASSWORD = "popup"
.\gradlew :app:wpfDevServer        # http://localhost:8080/zero-rule-server/p/api/wpf/** , X-Dev-User-Id 헤더로 사용자 지정
```

WPF는 `appsettings.json`의 `BaseUrl=http://localhost:8080/zero-rule-server/p`, `DevUserId=E1001`로 실행한다(인자 없이).
HTTP 계약 자동 검증: `.\gradlew :app:test --tests server.app.wpf.WpfApiOracleHttpTest` (E1002 데이터는 테스트가 정리).

- `10_zero_rule_common_schema_oracle.sql` — `ERD/01_schema.sql`의 공통 스키마 53개 테이블을 `tools/convert-zero-rule-ddl.pl`로 변환한 것. 로컬 XE의 `ZERO_RULE` 계정에 적용해 전체 서버를 로컬 DB로 띄울 때 쓰지만 정식 공통 DDL은 아니다(기동 시 `CLOVER_BATCH_NODE` PK 충돌 로그 1건 — 원격 정식 스키마에서는 없음). 참고용.

## 원격 11g XE에서 실제로 부딪힌 것 (2026-09-20)

| 현상 | 조치 |
|---|---|
| 식별자 30바이트 제한 (`ORA-00972`) | 제약명 3개 단축: `UK_QTEMPLATE_GROUP_VERSION`, `CK_TCOND_INCLUDE_CHILD`, `CK_TCOND_CHILD_DEPARTMENT` |
| `IS JSON` 체크 미지원 (12.1+) | `POPUP_CONTENT.CONTENT_OPTIONS`의 CHECK 제거. JSON 유효성은 `PopupContentAssembler`가 보장 |
| `NLS_LANG` 미지정 시 한글 주석 따옴표 깨짐 (`ORA-01756`) | 실행 전 `KOREAN_KOREA.AL32UTF8` 지정 |
| DDL 주석 안의 `;`를 SQL*Plus가 문장 끝으로 처리 (`ORA-00907`) | 주석에서 세미콜론 제거 |
| 앱 계정에 `CREATE USER` 없음 | 방식 B(앱 계정 스키마) + `custom.popup.schema=""` |
