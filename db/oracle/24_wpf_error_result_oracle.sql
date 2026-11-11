-- =====================================================================================================
-- 24_wpf_error_result_oracle.sql — WPF 장애 결과(resultCode=400) 영수증 수용 (2026-11-11, TODO45)
-- POL-12-04 : 통합 복구 주기
-- -----------------------------------------------------------------------------------------------------
-- 배경: WPF가 받은 조회 응답을 처리하지 못하면(빈 본문·JSON 오류·표시 변환 실패) 장애 결과(resultCode=400·resultDesc)를
--       결과 API로 보낸다. 사용자 처리 결과가 아니라 resultType이 없고, JSON이 깨지면 popupId·deliveryId도 모를 수 있다.
--       서버는 영수증에 RESULT_TYPE='ERROR', RESULT_CODE='400', RESULT_DESC(UTF-8 1,000 Byte 이하)를 남기고,
--       deliveryId를 확보한 경우에만 그 전달 건을 RESULT_TYPE='ERROR'로 종료한다(WPF_POPUP_DELIVERY.RESULT_TYPE은 제약 없음).
-- 처리: 1) WPF_RESULT_RECEIPT.POPUP_ID NULL 허용(미확보 장애 결과) 2) RESULT_DESC VARCHAR2(1000 BYTE) 추가
--       3) CK_WPF_RESULT_TYPE에 'ERROR' 추가
-- 순서: 서버 반영 전에 실행. 새 서버는 장애 결과에 RESULT_DESC·'ERROR'를 쓰므로 없으면 ORA-00904·ORA-02290으로 INTERNAL_ERROR가 된다.
--       일반 결과 처리는 이 컬럼을 쓰지 않아 이전·새 서버 모두 실행 전후로 동작한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @24_wpf_error_result_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @24_wpf_error_result_oracle.sql ""
-- 되돌리기: ERROR 영수증 행을 먼저 정리한 뒤 CK_WPF_RESULT_TYPE을 ERROR 없이 다시 만들고,
--           ALTER TABLE <접두어>WPF_RESULT_RECEIPT DROP COLUMN RESULT_DESC;
--           ALTER TABLE <접두어>WPF_RESULT_RECEIPT MODIFY (POPUP_ID NOT NULL);
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. 장애 결과 영수증 컬럼·제약 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 100));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-01430: 이미 있는 컬럼, ORA-01451: 이미 NULL 허용, ORA-02443: 없는 제약 → 재실행으로 보고 건너뛴다
            IF SQLCODE IN (-1430, -1451, -2443) THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 100));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT MODIFY (POPUP_ID NULL)');
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT ADD (RESULT_DESC VARCHAR2(1000 BYTE))');
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT DROP CONSTRAINT CK_WPF_RESULT_TYPE');
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT ADD CONSTRAINT CK_WPF_RESULT_TYPE CHECK ('
        || 'RESULT_TYPE IN (''CLOSED'', ''HIDDEN'', ''LATER'', ''SUBMITTED'', ''VIDEO_WATCHED'', ''ERROR''))');
    run('COMMENT ON COLUMN &S.WPF_RESULT_RECEIPT.POPUP_ID IS ''대상 팝업. 장애 결과(ERROR)에서 확보하지 못하면 NULL''');
    run('COMMENT ON COLUMN &S.WPF_RESULT_RECEIPT.RESULT_DESC IS ''장애 결과(ERROR) 오류 내용·JSON 위치. '
        || 'UTF-8 1,000 Byte 이하, 원본 JSON 전체는 넣지 않음''');
END;
/

PROMPT === 2. 확인 (RESULT_DESC 1, POPUP_ID NULLABLE Y, 제약 1 이어야 함. 11g는 SEARCH_CONDITION이 LONG이라 ERROR 포함은 목록으로 본다) ===
SELECT COUNT(*) AS RESULT_DESC_COLUMN FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'WPF_RESULT_RECEIPT' AND COLUMN_NAME = 'RESULT_DESC';
SELECT NULLABLE AS POPUP_ID_NULLABLE FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'WPF_RESULT_RECEIPT' AND COLUMN_NAME = 'POPUP_ID';
SELECT CONSTRAINT_NAME, SEARCH_CONDITION FROM ALL_CONSTRAINTS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND CONSTRAINT_NAME = 'CK_WPF_RESULT_TYPE';
EXIT
