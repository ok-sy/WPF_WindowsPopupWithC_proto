-- =====================================================================
--  POPUP 스키마 사용자 생성 — Oracle (SYSTEM 등 DBA 계정으로 실행)
-- =====================================================================
--  용도 : 01_popup_schema_oracle.sql 을 실행할 소유 계정(POPUP)을 만든다.
--         zero 프레임워크 공통 스키마(ZERO_RULE)가 같은 DB에 있으면 팝업 테이블 접근 권한도 부여한다.
--  실행 : sqlplus system/<pw>@//localhost:1521/XEPDB1 @00_create_schema_oracle.sql       (로컬 XE 21c)
--         sqlplus system/<pw>@//192.168.114.71:4004/XE @00_create_schema_oracle.sql     (원격 개발 DB 11g XE — 앱 계정 ZERO-RULE은 이미 있음)
--  주의 : 앱 계정(zero-rule)에는 CREATE USER 권한이 없으므로 이 스크립트는 DBA가 실행해야 한다.
--  비밀번호는 개발 기본값이다. 운영에서는 반드시 바꾸고 소스에 적지 않는다.
--
--  [기준 5] PostgreSQL의 `CREATE SCHEMA popup` 에 대응한다. Oracle은 스키마 = 사용자이므로 사용자를 만든다.
--  애플리케이션(zeroserver)은 ZERO_RULE 계정으로 접속하고 팝업 매퍼는 POPUP. 한정자를 쓰므로,
--  ZERO_RULE이 있으면 POPUP 객체에 대한 DML/시퀀스 권한을 준다(01 실행 후 03_grant 로 처리).
-- =====================================================================

-- XE 기본 테이블스페이스 USERS 사용
CREATE USER POPUP IDENTIFIED BY popup
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW, CREATE PROCEDURE TO POPUP;

-- 개발 편의: 애플리케이션 접속 계정. 공통(ZERO_RULE) 스키마 DDL은 이 저장소 범위 밖이므로 계정만 만든다.
-- 이미 있으면 이 블록은 오류 없이 지나간다.
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM dba_users WHERE username = 'ZERO_RULE';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE USER ZERO_RULE IDENTIFIED BY zero_rule DEFAULT TABLESPACE USERS TEMPORARY TABLESPACE TEMP QUOTA UNLIMITED ON USERS';
        EXECUTE IMMEDIATE 'GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO ZERO_RULE';
    END IF;
END;
/

EXIT
