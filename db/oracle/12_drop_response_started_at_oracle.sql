-- =====================================================================================================
-- 12_drop_response_started_at_oracle.sql — POPUP_RESPONSE.RESPONSE_STARTED_AT 삭제 (2026-10-12)
-- POL-13-01 : 콘텐츠와 관리 상태
-- -----------------------------------------------------------------------------------------------------
-- 배경: WPF가 SUBMITTED 결과의 responseStartedAt에 displayedAt을 그대로 복사해 보내 표시 시각과 중복이었다.
--       결과 계약 정리로 결과 요청·서버 저장에서 해당 값을 제거했고 이 컬럼을 읽는 곳도 없다(통계·관리자 조회 미사용).
--       응답·처리 소요 시간은 USER_POPUP_STATUS의 표시·닫기 시각(closedAt - displayedAt)으로 계산한다.
-- 순서: responseStartedAt을 쓰지 않는 서버 배포 후 실행. 새 서버는 이 컬럼을 쓰지 않으므로 실행 전후 모두 동작한다.
--       실행 후에는 이전 서버의 응답 저장(MERGE)이 ORA-00904로 실패한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @12_drop_response_started_at_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @12_drop_response_started_at_oracle.sql ""
-- 되돌리기: 컬럼 삭제는 되돌릴 수 없다. 필요하면 실행 전 1번 조회 결과를 보관한다. 여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;

PROMPT === 1. 확인: 값이 있는 행 수 (오류는 이미 삭제된 경우) ===
WHENEVER SQLERROR CONTINUE
SELECT COUNT(*) FILLED_ROWS FROM &S.POPUP_RESPONSE WHERE RESPONSE_STARTED_AT IS NOT NULL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 2. 컬럼 삭제 (이미 없으면 건너뜀) ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || p_sql);
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-00904 컬럼 없음
            IF SQLCODE = -904 THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || p_sql);
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('ALTER TABLE &S.POPUP_RESPONSE DROP (RESPONSE_STARTED_AT)');
END;
/

PROMPT === 3. 결과 확인 (0 이어야 함) ===
SELECT COUNT(*) REMAINING_COLUMNS FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND TABLE_NAME = 'POPUP_RESPONSE' AND COLUMN_NAME = 'RESPONSE_STARTED_AT';
EXIT
