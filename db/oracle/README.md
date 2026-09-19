# POPUP 스키마 — Oracle 스크립트

기준 5(PostgreSQL popup 스키마 → Oracle). 검증 환경: **Oracle 21c XE, PDB `XEPDB1`** (2026-09-19).

## 실행 순서

| 순서 | 파일 | 실행 계정 | 내용 |
|---|---|---|---|
| 0 | `00_create_schema_oracle.sql` | SYSTEM(DBA) | `POPUP` 사용자(=스키마) 생성, 없으면 앱 접속 계정 `ZERO_RULE`도 생성 |
| 1 | `01_popup_schema_oracle.sql` | POPUP | 테이블 17개(원본 16 + `WPF_RESULT_RECEIPT`), 시퀀스 12개, 인덱스, 주석 |
| 2 | `02_popup_sample_oracle.sql` | POPUP | 개발 샘플(사용자 3·팝업 4·대상 조건 6·문항 3). 운영 금지 |
| 3 | `03_grant_zero_rule_oracle.sql` | POPUP | `ZERO_RULE`에 POPUP 테이블 DML·시퀀스 SELECT 권한 (매퍼가 `POPUP.` 한정자로 접근) |

```powershell
$env:NLS_LANG = "KOREAN_KOREA.AL32UTF8"     # 한글 주석·샘플이 UTF-8이므로 지정
sqlplus system/<pw>@//localhost:1521/XEPDB1 @00_create_schema_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @01_popup_schema_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @02_popup_sample_oracle.sql
sqlplus popup/popup@//localhost:1521/XEPDB1  @03_grant_zero_rule_oracle.sql
```

01은 신규 스키마용이다. 다시 적용하려면 `DROP USER POPUP CASCADE` 후 0부터 실행한다.

## 실DB 테스트 (롤백 전용)

```powershell
$env:POPUP_TEST_DB_PASSWORD = "popup"
$env:POPUP_TEST_DB_URL = "jdbc:oracle:thin:@//localhost:1521/XEPDB1"   # 기본값과 같으면 생략 가능
$env:POPUP_TEST_DB_USER = "POPUP"
cd zero-rule-server-main
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

이 저장소의 zero 프레임워크(`clover-* 0.0.1-POSTGRE-SNAPSHOT`)와 공통 매퍼 13개는 PostgreSQL 전용 SQL이라 **전체 zeroserver는 Oracle에서 기동되지 않는다**(공통 프레임워크의 Oracle 빌드는 타 팀/운영 소관). WPF 실연동은 팝업·WPF API 빈만 올린 개발 서버로 한다.

```powershell
cd zero-rule-server-main
$env:POPUP_TEST_DB_PASSWORD = "popup"
.\gradlew :app:wpfDevServer        # http://localhost:8080/zero-rule-server/p/api/wpf/** , X-Dev-User-Id 헤더로 사용자 지정
```

WPF는 `appsettings.json`의 `BaseUrl=http://localhost:8080/zero-rule-server/p`, `DevUserId=E1001`로 실행한다(인자 없이).
HTTP 계약 자동 검증: `.\gradlew :app:test --tests server.app.wpf.WpfApiOracleHttpTest` (E1002 데이터는 테스트가 정리).

- `10_zero_rule_common_schema_oracle.sql` — `ERD/01_schema.sql`의 공통 스키마 53개 테이블을 `tools/convert-zero-rule-ddl.pl`로 변환한 것. `ZERO_RULE` 계정에 적용되지만 위 이유로 앱 기동에는 충분하지 않다(공통 매퍼가 PG 문법). 참고용.
