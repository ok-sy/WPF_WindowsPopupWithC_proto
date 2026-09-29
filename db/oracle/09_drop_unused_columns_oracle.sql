-- =====================================================================================================
-- 09_drop_unused_columns_oracle.sql — 쓰이지 않는 템플릿 버전·예약 표시 컬럼 삭제 (2026-09-28, 설계 18 L-5 / D-6)
-- -----------------------------------------------------------------------------------------------------
-- 배경: 문항 템플릿 버전 정책은 구현되지 않았다(저장마다 난수 그룹·버전 1·CURRENT_YN='Y'). 팝업의 로그인/예약 표시
--       플래그와 예약 시각은 항상 'N'/NULL로만 쓰고 읽지 않는다. 정책을 구현하지 않고 컬럼을 삭제하기로 결정했다.
--   QUESTION_TEMPLATE : TEMPLATE_GROUP_ID, TEMPLATE_VERSION, CURRENT_YN
--                       (+ UK_QTEMPLATE_GROUP_VERSION, CK_QUESTION_TEMPLATE_VERSION, CK_QUESTION_TEMPLATE_CURRENT,
--                          UX_QUESTION_TEMPLATE_CURRENT)
--   POPUP_NOTICE      : SHOW_ON_LOGIN_YN, SHOW_ON_SCHEDULE_YN, SCHEDULED_AT (+ CK_POPUP_SCHEDULED_AT)
--                       CK_POPUP_YN_VALUES는 두 플래그를 함께 검사하므로 삭제 후 나머지 Y/N 컬럼만으로 다시 만든다.
-- 순서: **L-5 서버 배포 전에 실행.** 삭제 전 서버는 이 컬럼들을 INSERT하므로 실행 후에는 이전 서버가 저장에 실패하고,
--       실행 전에는 새 서버의 템플릿 INSERT가 NOT NULL 위반으로 실패한다. 서버 교체와 같은 시점에 실행한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @09_drop_unused_columns_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @09_drop_unused_columns_oracle.sql ""
-- 되돌리기: 컬럼 삭제는 되돌릴 수 없다. 필요하면 실행 전 1번 조회 결과를 보관한다. 여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;

PROMPT === 1. 확인: 삭제 대상 컬럼에 의미 있는 값이 있는 행 (없어야 정상, 오류는 이미 삭제된 경우) ===
WHENEVER SQLERROR CONTINUE
SELECT POPUP_ID, SHOW_ON_LOGIN_YN, SHOW_ON_SCHEDULE_YN, SCHEDULED_AT FROM &S.POPUP_NOTICE
 WHERE SHOW_ON_LOGIN_YN = 'Y' OR SHOW_ON_SCHEDULE_YN = 'Y' OR SCHEDULED_AT IS NOT NULL;
SELECT QUESTION_TEMPLATE_ID, TEMPLATE_NAME, TEMPLATE_VERSION, CURRENT_YN, ACTIVE_YN FROM &S.QUESTION_TEMPLATE
 WHERE TEMPLATE_VERSION <> 1 OR CURRENT_YN <> 'Y';

PROMPT === 2. 보정: CURRENT_YN='N' 템플릿은 ACTIVE_YN='N'으로 (템플릿 선택 목록에서 계속 숨김) ===
UPDATE &S.QUESTION_TEMPLATE
   SET ACTIVE_YN = 'N', UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE CURRENT_YN = 'N' AND ACTIVE_YN = 'Y';
COMMIT;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 3. 인덱스·제약·컬럼 삭제 (이미 없으면 건너뜀) ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || p_sql);
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-01418 인덱스 없음, ORA-02443 제약 없음, ORA-00904 컬럼 없음, ORA-02264 제약 이름 중복
            IF SQLCODE IN (-1418, -2443, -904, -2264) THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || p_sql);
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('DROP INDEX &S.UX_QUESTION_TEMPLATE_CURRENT');
    run('ALTER TABLE &S.QUESTION_TEMPLATE DROP (TEMPLATE_GROUP_ID, TEMPLATE_VERSION, CURRENT_YN) CASCADE CONSTRAINTS');
    run('ALTER TABLE &S.POPUP_NOTICE DROP CONSTRAINT CK_POPUP_SCHEDULED_AT');
    run('ALTER TABLE &S.POPUP_NOTICE DROP CONSTRAINT CK_POPUP_YN_VALUES');
    run('ALTER TABLE &S.POPUP_NOTICE DROP (SHOW_ON_LOGIN_YN, SHOW_ON_SCHEDULE_YN, SCHEDULED_AT) CASCADE CONSTRAINTS');
    run('ALTER TABLE &S.POPUP_NOTICE ADD CONSTRAINT CK_POPUP_YN_VALUES CHECK ('
        || 'ACTIVE_YN IN (''Y'', ''N'') AND SHOW_HEADER_YN IN (''Y'', ''N'') AND SHOW_CLOSE_BUTTON_YN IN (''Y'', ''N'') '
        || 'AND SHOW_FOOTER_YN IN (''Y'', ''N'') AND SHOW_DO_NOT_SHOW_AGAIN_YN IN (''Y'', ''N'') '
        || 'AND ALLOW_CLOSE_BEFORE_COMPLETE_YN IN (''Y'', ''N''))');
END;
/
COMMENT ON TABLE &S.QUESTION_TEMPLATE IS '문항 템플릿. 문항이 바뀌면 새 행을 만들고 팝업이 QUESTION_TEMPLATE_ID로 참조';

PROMPT === 4. 결과 확인 (0 이어야 함) ===
SELECT COUNT(*) REMAINING_COLUMNS FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND ((TABLE_NAME = 'QUESTION_TEMPLATE' AND COLUMN_NAME IN ('TEMPLATE_GROUP_ID', 'TEMPLATE_VERSION', 'CURRENT_YN'))
     OR (TABLE_NAME = 'POPUP_NOTICE' AND COLUMN_NAME IN ('SHOW_ON_LOGIN_YN', 'SHOW_ON_SCHEDULE_YN', 'SCHEDULED_AT')));
EXIT
