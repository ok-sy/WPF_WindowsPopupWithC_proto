-- =====================================================================
--  POPUP 스키마 객체 권한 → 애플리케이션 접속 계정(ZERO_RULE) — Oracle (POPUP 계정으로 실행)
-- =====================================================================
--  용도 : zeroserver는 JndiResource의 애플리케이션 계정으로 접속하고, 팝업 매퍼는 POPUP. 한정자로
--         POPUP 스키마 테이블·시퀀스를 직접 참조한다(PostgreSQL 판의 popup. 과 동일). 그러므로 앱 계정에
--         POPUP 객체의 DML·시퀀스 권한이 필요하다. 01(테이블)·02(샘플) 적용 후 실행한다.
--  인자 : 1 = 권한을 받을 앱 계정 이름 (대소문자·특수문자 그대로 큰따옴표 식별자로 사용)
--         로컬 XE 21c : ZERO_RULE      원격 개발 DB 11g XE(192.168.114.71) : ZERO-RULE  (하이픈 포함 계정, 업스트림 JndiResource 기본값)
--  실행 : sqlplus popup/<pw>@//localhost:1521/XEPDB1 @03_grant_zero_rule_oracle.sql ZERO_RULE
--         sqlplus popup/<pw>@//192.168.114.71:4004/XE  @03_grant_zero_rule_oracle.sql ZERO-RULE
--  재실행 : 안전하다(GRANT는 멱등). 테이블·시퀀스를 새로 추가하면 다시 실행한다.
-- =====================================================================

SET SERVEROUTPUT ON
DEFINE grantee = &1
DECLARE
    -- 인자로 받은 계정명을 큰따옴표 식별자로 감싼다 (ZERO-RULE 같은 이름도 허용)
    v_grantee CONSTANT VARCHAR2(40) := '"' || UPPER('&grantee') || '"';
BEGIN
    FOR t IN (SELECT table_name FROM user_tables ORDER BY table_name) LOOP
        EXECUTE IMMEDIATE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ' || t.table_name || ' TO ' || v_grantee;
    END LOOP;
    FOR s IN (SELECT sequence_name FROM user_sequences ORDER BY sequence_name) LOOP
        EXECUTE IMMEDIATE 'GRANT SELECT ON ' || s.sequence_name || ' TO ' || v_grantee;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('granted POPUP tables/sequences to ' || v_grantee);
END;
/

-- 확인
SELECT grantee, COUNT(*) AS object_count
FROM user_tab_privs_made
WHERE grantee = UPPER('&grantee')
GROUP BY grantee;

EXIT
