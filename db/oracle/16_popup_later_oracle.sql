-- =====================================================================================================
-- 16_popup_later_oracle.sql — 나중에 보기(SHOW_LATER_YN·결과 LATER) 추가 (2026-10-18)
-- POL-10-03 : 완료·숨김·연기
-- -----------------------------------------------------------------------------------------------------
-- 배경: 팝업 Footer에 "나중에 보기" 버튼을 둔다. 표시 여부는 팝업별 SHOW_LATER_YN(기본 'N')으로 정하고,
--       누르면 WPF가 결과 LATER를 보낸다. 서버는 완료 처리 없이 전달 건만 종료해 다음 조회 주기까지 재노출을 유예한다.
--       기존 다시 보지 않기(SHOW_DO_NOT_SHOW_AGAIN_YN·HIDDEN·HIDE_DAYS)는 그대로 둔다.
-- 처리: 1) POPUP_NOTICE.SHOW_LATER_YN 추가(기본 'N', 기존 행도 'N') 2) CK_POPUP_YN_VALUES에 SHOW_LATER_YN 포함
--       [11g 주의] ADD ... DEFAULT 'N' NOT NULL 한 번에 추가하면 11g는 기존 행에 값을 쓰지 않고 메타데이터 기본값만 둔다.
--       이 컬럼을 CHECK 제약이 참조하면 원격 11.2.0.2에서 POPUP_NOTICE UPDATE가 ORA-00600 [qkebCreateConstantOpn1]로
--       세션째 실패했다(2026-10-18). 그래서 NULL 허용으로 추가(기존 행에 기본값 기록) → 빈 값 채움 → NOT NULL 순서로 만든다.
--       3) WPF_RESULT_RECEIPT.CK_WPF_RESULT_TYPE에 'LATER' 추가
-- 순서: 서버 반영 전에 실행. 새 서버는 SHOW_LATER_YN을 조회·저장하므로 없으면 ORA-00904로 실패한다.
--       이전 서버는 이 컬럼을 쓰지 않고 기본값이 있어 실행 후에도 동작한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @16_popup_later_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @16_popup_later_oracle.sql ""
-- 되돌리기: CK_WPF_RESULT_TYPE을 LATER 없이 다시 만들고(LATER 영수증 행이 있으면 먼저 정리),
--           CK_POPUP_YN_VALUES를 SHOW_LATER_YN 없이 다시 만든 뒤 ALTER TABLE <접두어>POPUP_NOTICE DROP COLUMN SHOW_LATER_YN.
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. SHOW_LATER_YN 추가 및 제약 갱신 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 100));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-01430: 이미 있는 컬럼, ORA-02443: 없는 제약, ORA-01442: 이미 NOT NULL → 재실행으로 보고 건너뛴다
            IF SQLCODE IN (-1430, -2443, -1442) THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 100));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('ALTER TABLE &S.POPUP_NOTICE ADD (SHOW_LATER_YN CHAR(1) DEFAULT ''N'')');
    run('UPDATE &S.POPUP_NOTICE SET SHOW_LATER_YN = ''N'' WHERE SHOW_LATER_YN IS NULL');
    COMMIT;
    run('ALTER TABLE &S.POPUP_NOTICE MODIFY (SHOW_LATER_YN NOT NULL)');
    run('ALTER TABLE &S.POPUP_NOTICE DROP CONSTRAINT CK_POPUP_YN_VALUES');
    run('ALTER TABLE &S.POPUP_NOTICE ADD CONSTRAINT CK_POPUP_YN_VALUES CHECK ('
        || 'ACTIVE_YN IN (''Y'', ''N'') AND SHOW_HEADER_YN IN (''Y'', ''N'') AND SHOW_CLOSE_BUTTON_YN IN (''Y'', ''N'') '
        || 'AND SHOW_FOOTER_YN IN (''Y'', ''N'') AND SHOW_DO_NOT_SHOW_AGAIN_YN IN (''Y'', ''N'') '
        || 'AND SHOW_LATER_YN IN (''Y'', ''N'') AND ALLOW_CLOSE_BEFORE_COMPLETE_YN IN (''Y'', ''N''))');
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT DROP CONSTRAINT CK_WPF_RESULT_TYPE');
    run('ALTER TABLE &S.WPF_RESULT_RECEIPT ADD CONSTRAINT CK_WPF_RESULT_TYPE CHECK ('
        || 'RESULT_TYPE IN (''CLOSED'', ''HIDDEN'', ''LATER'', ''SUBMITTED'', ''VIDEO_WATCHED''))');
    run('COMMENT ON COLUMN &S.POPUP_NOTICE.SHOW_LATER_YN IS ''나중에 보기 버튼 표시(Footer 표시 시). '
        || '결과 LATER는 완료 없이 다음 조회 주기까지 재노출 유예''');
END;
/

PROMPT === 2. 확인 (컬럼 1, 제약 2 이어야 함) ===
SELECT COUNT(*) AS LATER_COLUMN FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'POPUP_NOTICE' AND COLUMN_NAME = 'SHOW_LATER_YN';
SELECT COUNT(*) AS LATER_CONSTRAINTS FROM ALL_CONSTRAINTS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND CONSTRAINT_NAME IN ('CK_POPUP_YN_VALUES', 'CK_WPF_RESULT_TYPE');
EXIT
