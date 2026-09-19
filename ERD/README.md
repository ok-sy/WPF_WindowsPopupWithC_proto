# DB 구조와 실행 파일

2026-09-13 정리. 현재 Java 서버의 스키마 이름은 `zero_rule`과 `popup`이다. 데이터베이스 이름은 환경 설정을 따르며 `popup_db`라는 DB/스키마를 새로 만들 필요가 없다.

## 파일과 실행 순서

| 파일 | 용도 | 실행 대상 |
|---|---|---|
| [01_schema.sql](01_schema.sql) | 공통 53개 + 팝업 16개 테이블의 통합 초기 DDL | 두 스키마에 테이블이 없는 신규 DB |
| [02_sample.sql](02_sample.sql) | 팝업 기능 확인용 샘플 | 초기 DDL 적용 후 빈 popup 테이블 |
| [03_validation.sql](03_validation.sql) | 기존 샘플의 대상자·문항·응답 관련 조회 | 샘플 적용 DB, 읽기 전용 |
| [migrations/20260913_popup_question_template_permissions.sql](migrations/20260913_popup_question_template_permissions.sql) | 기존 팝업 상세 권한을 템플릿 API 2개에 복사 | 실제 관리자 페이지/권한 데이터가 있는 DB |
| [STRUCTURE_REVIEW.md](STRUCTURE_REVIEW.md) | DB·Java·React 점검 결과와 수정/추가 개발 목록 | 개발 기준 문서 |
| model/*.erwin | 기존 물리/논리 ERwin 모델 원본 | ERwin에서 열어 확인, 현재 DDL과 자동 동기화되지 않음 |

신규 설치는 01 → 02(선택) → 03(샘플 검증) 순서다. 관리자 로그인·메뉴·권한의 기본 데이터는 팝업 샘플에 포함되지 않는다. 권한 마이그레이션은 기존 `/apis/popup/info` 매핑이 있어야 실행된다.

01은 기존 DB 업그레이드용이 아니다. 테이블이 있으면 중단하도록 보호한다. DBeaver 등에서 **스크립트 전체를 실행하고 오류 시 중단**한다. 03은 결과를 검토하는 조회 모음이며 자동 합격/불합격 테스트는 아니다.

02는 기존 v0.8의 동작 재현 샘플을 유지한다. 설문에 채점 문항이 포함돼 있으므로, 새 설문/퀴즈 정책 적용 시 함께 수정할 대상이다. 이번 정리는 실행 경로와 파일 중복을 정리한 것이며 기능 정책을 변경하지 않았다.

## 기존 파일 통합 내역

| 이전 파일 | 처리 |
|---|---|
| zero_ddl.sql / zero_rule_postgresql_schema.sql | 스키마 이름 정규화 후 내용이 동일함을 확인하고 01에 통합 |
| popup_system_postgresql_v0.8.sql / popup_db_postgresql_schema.sql | 트랜잭션 내부 DDL이 동일함을 확인하고 01에 통합. 대상 스키마는 Java와 같은 popup으로 수정 |
| popup_system_postgresql_v0.8_sample.sql | 02로 정리. DB 이름 제한을 제거하고 popup 검색 경로를 트랜잭션에 명시 |
| popup_system_postgresql_v0.8_validation.sql | 03으로 정리. popup 검색 경로와 읽기 전용 트랜잭션 적용 |
| popup_question_template_permissions.sql | migrations로 이동 |
| 팝업시스템_ERD_물리논리_v0.2_한글논리명.erwin | model로 이동, 바이너리 원본 유지 |

중복 원본은 Git 이력으로 확인할 수 있다.

## 별도 보존 자료

- [기존 zero_rule DDL 스냅샷](../popup-frameWork/Popup/Docs/2026hyundaicard_popup_ddl.sql): 이름과 달리 popup 테이블은 포함하지 않는다. 이력 자료로 보존하며 신규 설치는 01을 사용한다.
- [기존 전체 데이터 스냅샷](../popup-frameWork/Popup/Docs/2026hyundaicard_popup_data_insert.sql): popup과 zero_rule 양쪽 데이터를 포함한다. 02 샘플과 중복 적용하지 않는다. 환경별 데이터가 있으므로 일반 개발 샘플로 합치지 않았다.

## 검증 기록

- PostgreSQL 로컬 DB의 독립적인 임시 스키마에서 01 → 02 → 03 실행 성공.
- 생성 테이블 수: zero_rule 53개, popup 16개.
- 실제 popup과 통합 DDL의 테이블/컬럼/자료형/NULL 허용 여부 차이 0건.
- 임시 스키마 생성·샘플 입력을 모두 롤백. 실제 업무 데이터 변경 없음.
- 전체 인덱스·제약·ERwin 모델 및 zero_rule 스냅샷과의 완전한 동등성 검증은 별도 항목이다.

## 2026-09-15 master ??

- ?? DDL? ?? ????? ??? ????? ?? ??? ????.
- ?? DB? `popup_display_order_migration.sql`, `popup_question_answer_migration.sql`? ????. ?? ???? DB? ?? ???? ???.
- `popup_db_postgresql_schema.sql`, `zero_ddl.sql`? ??? `01_schema.sql`? ???? ?? ??? ???? ???.
