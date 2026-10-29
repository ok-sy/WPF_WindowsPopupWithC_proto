-- =====================================================================================================
-- 19_question_selection_limit_oracle.sql — SURVEY 복수 선택 최소·최대 선택 수 컬럼 추가 (2026-10-29)
-- POL-06-02 : 선택·제출
-- -----------------------------------------------------------------------------------------------------
-- 배경: SURVEY의 MULTIPLE_CHOICE 문항에서 응답자가 고를 수 있는 선택지 수를 관리자가 정한다.
--       QUIZ 복수 선택은 기존대로 정답 선택지 수가 한도이므로 이 컬럼을 쓰지 않는다(서버가 QUIZ에는 NULL로 저장).
--       NULL = 제한 없음(기존 문항은 모두 NULL로 남아 동작이 바뀌지 않는다).
--       서버 결과 수신은 선택 수 범위를 검사하지 않는다(관리자 미리보기·WPF 화면에서 제한).
-- 처리: POPUP_QUESTION.MIN_SELECTIONS·MAX_SELECTIONS (NUMBER(4), NULL 허용) + 1 이상·최소 ≤ 최대 CHECK.
--       선택지 수 이하 여부는 선택지가 다른 테이블이라 서버 저장 검증(PopupQuestionRules)이 맡는다.
-- 순서: 서버 반영 전에 실행. 새 서버는 두 컬럼을 조회·저장하므로 없으면 ORA-00904로 실패한다.
--       이전 서버는 이 컬럼을 쓰지 않으므로 실행 후에도 동작한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @19_question_selection_limit_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @19_question_selection_limit_oracle.sql ""
-- 되돌리기: ALTER TABLE <접두어>POPUP_QUESTION DROP CONSTRAINT CK_QUESTION_SELECTION_RANGE;
--           ALTER TABLE <접두어>POPUP_QUESTION DROP (MIN_SELECTIONS, MAX_SELECTIONS);
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. 최소·최대 선택 수 컬럼·제약 추가 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 100));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-01430: 이미 있는 컬럼, ORA-02264: 이미 있는 제약 이름 → 재실행으로 보고 건너뛴다
            IF SQLCODE IN (-1430, -2264) THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 100));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('ALTER TABLE &S.POPUP_QUESTION ADD (MIN_SELECTIONS NUMBER(4))');
    run('ALTER TABLE &S.POPUP_QUESTION ADD (MAX_SELECTIONS NUMBER(4))');
    run('ALTER TABLE &S.POPUP_QUESTION ADD CONSTRAINT CK_QUESTION_SELECTION_RANGE CHECK ('
        || '(MIN_SELECTIONS IS NULL OR MIN_SELECTIONS >= 1) AND (MAX_SELECTIONS IS NULL OR MAX_SELECTIONS >= 1) '
        || 'AND (MIN_SELECTIONS IS NULL OR MAX_SELECTIONS IS NULL OR MIN_SELECTIONS <= MAX_SELECTIONS))');
    run('COMMENT ON COLUMN &S.POPUP_QUESTION.MIN_SELECTIONS IS ''SURVEY 복수 선택 최소 선택 수. '
        || 'NULL = 제한 없음, QUIZ는 사용하지 않음''');
    run('COMMENT ON COLUMN &S.POPUP_QUESTION.MAX_SELECTIONS IS ''SURVEY 복수 선택 최대 선택 수. '
        || 'NULL = 제한 없음, QUIZ는 정답 수가 한도''');
END;
/

PROMPT === 2. 확인 (컬럼 2, 제약 1 이어야 함) ===
SELECT COUNT(*) AS SELECTION_COLUMNS FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND TABLE_NAME = 'POPUP_QUESTION' AND COLUMN_NAME IN ('MIN_SELECTIONS', 'MAX_SELECTIONS');
SELECT COUNT(*) AS SELECTION_CONSTRAINTS FROM ALL_CONSTRAINTS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND TABLE_NAME = 'POPUP_QUESTION' AND CONSTRAINT_NAME = 'CK_QUESTION_SELECTION_RANGE';
EXIT
