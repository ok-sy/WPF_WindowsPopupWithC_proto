-- =====================================================================================================
-- 15_wpf_popup_delivery_oracle.sql — WPF 팝업 전달 건(WPF_POPUP_DELIVERY) 신설 (2026-10-13)
-- POL-13-02 : 전달·영수증
-- -----------------------------------------------------------------------------------------------------
-- 배경: WPF 조회 API를 목록에서 단건 순차 전달로 바꿨다(POST /p/api/wpf/popups → popup 1건 또는 null).
--       조회 API가 표시할 팝업에 전달 건 ID(deliveryId)를 발급하고, 결과 수신 API가 그 전달 건을 종료한다.
--       미완료로 닫힌 팝업은 결과 저장 시각부터 pollingIntervalSeconds 동안 재노출을 유예한다(DEFER_UNTIL_AT).
-- 처리: 1) WPF_POPUP_DELIVERY 테이블·인덱스 생성(이미 있으면 SKIP)
-- 순서: 서버 반영 전에 실행. 새 서버는 조회·결과 처리에서 이 테이블을 사용하므로 없으면 ORA-00942로 실패한다.
--       이전 서버는 이 테이블을 쓰지 않으므로 실행 후에도 동작한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @15_wpf_popup_delivery_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @15_wpf_popup_delivery_oracle.sql ""
--       팝업 테이블 소유 계정과 앱 계정이 다르면(방식 A) 03_grant_zero_rule_oracle.sql을 다시 실행해 권한을 준다.
-- 되돌리기: DROP TABLE <접두어>WPF_POPUP_DELIVERY. 여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. WPF_POPUP_DELIVERY 생성 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 80));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-00955: 이미 있는 이름, ORA-01408: 같은 컬럼 목록 인덱스 존재 → 재실행으로 보고 건너뛴다
            IF SQLCODE IN (-955, -1408) THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 80));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('CREATE TABLE &S.WPF_POPUP_DELIVERY ('
        || ' DELIVERY_ID VARCHAR2(64 CHAR) NOT NULL,'
        || ' EMPLOYEE_NO VARCHAR2(30 CHAR) NOT NULL,'
        || ' POPUP_ID VARCHAR2(50 CHAR) NOT NULL,'
        || ' DELIVERY_STATUS VARCHAR2(10 CHAR) DEFAULT ''OPEN'' NOT NULL,'
        || ' RESULT_ID VARCHAR2(64 CHAR),'
        || ' RESULT_TYPE VARCHAR2(20 CHAR),'
        || ' DELIVERED_AT TIMESTAMP(6) DEFAULT CAST(SYSTIMESTAMP AT TIME ZONE ''Asia/Seoul'' AS TIMESTAMP) NOT NULL,'
        || ' COMPLETED_AT TIMESTAMP(6),'
        || ' DEFER_UNTIL_AT TIMESTAMP(6),'
        || ' CONSTRAINT PK_WPF_POPUP_DELIVERY PRIMARY KEY (DELIVERY_ID),'
        || ' CONSTRAINT CK_WPF_DELIVERY_STATUS CHECK (DELIVERY_STATUS IN (''OPEN'', ''DONE'', ''EXPIRED'')))');
    run('CREATE UNIQUE INDEX &S.UX_WPF_POPUP_DELIVERY_OPEN ON &S.WPF_POPUP_DELIVERY '
        || '(CASE WHEN DELIVERY_STATUS = ''OPEN'' THEN EMPLOYEE_NO END)');
    run('CREATE INDEX &S.IX_WPF_POPUP_DELIVERY_DEFER ON &S.WPF_POPUP_DELIVERY (EMPLOYEE_NO, POPUP_ID, DEFER_UNTIL_AT)');
    run('COMMENT ON TABLE &S.WPF_POPUP_DELIVERY IS ''WPF 팝업 전달 건. 조회 API가 생성·재사용하고 결과 수신 API가 종료''');
    run('COMMENT ON COLUMN &S.WPF_POPUP_DELIVERY.DELIVERY_STATUS IS ''OPEN(표시 중·결과 대기) / DONE(결과 저장) / EXPIRED(재조회 시 대상 아님)''');
    run('COMMENT ON COLUMN &S.WPF_POPUP_DELIVERY.DEFER_UNTIL_AT IS ''결과 저장 시각 + 폴링 간격. 이 시각 전에는 같은 사용자·팝업을 다시 선정하지 않음''');
END;
/

PROMPT === 2. 확인 ===
SELECT COUNT(*) AS DELIVERY_ROWS FROM &S.WPF_POPUP_DELIVERY;
