-- =====================================================================================================
-- 17_question_rich_text_oracle.sql — 문항·선택지 서식(FONT EDIT) 저장 컬럼 추가 (2026-10-19)
-- POL-06-01 : 문항·서식
-- -----------------------------------------------------------------------------------------------------
-- 배경: SURVEY·QUIZ의 문항 제목·설명과 선택지 표시 문구에 TEXT와 같은 문단·구간 서식(textBlocks 스키마)을 둔다.
--       콘텐츠 제목·설명 서식(surveyTitleBlocks·descriptionBlocks)은 기존 POPUP_CONTENT.CONTENT_OPTIONS(CLOB JSON)에
--       저장하므로 DDL이 필요 없다. 문항·선택지는 정규 컬럼(VARCHAR2)뿐이라 서식 JSON 배열을 담을 CLOB을 추가한다.
--       문항 템플릿은 변경 시 새 버전(새 문항·선택지 행)으로 저장되므로 서식도 같은 행에 두어 템플릿 버전과 함께 보존한다.
--       일반 문자열 컬럼(QUESTION_TITLE·QUESTION_DESCRIPTION·OPTION_TEXT)은 서버가 서식에서 파생해 함께 저장한다.
-- 처리: POPUP_QUESTION.TITLE_BLOCKS·DESCRIPTION_BLOCKS, POPUP_OPTION.TEXT_BLOCKS (CLOB, NULL 허용 — NULL은 서식 없음)
-- 순서: 서버 반영 전에 실행. 새 서버는 세 컬럼을 조회·저장하므로 없으면 ORA-00904로 실패한다.
--       이전 서버는 이 컬럼을 쓰지 않으므로 실행 후에도 동작한다(서식은 저장·반환되지 않음).
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @17_question_rich_text_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @17_question_rich_text_oracle.sql ""
-- 되돌리기: ALTER TABLE <접두어>POPUP_QUESTION DROP (TITLE_BLOCKS, DESCRIPTION_BLOCKS);
--           ALTER TABLE <접두어>POPUP_OPTION DROP COLUMN TEXT_BLOCKS;  (저장된 서식은 사라지고 일반 문자열만 남는다)
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. 문항·선택지 서식 컬럼 추가 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 100));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-01430: 이미 있는 컬럼 → 재실행으로 보고 건너뛴다
            IF SQLCODE = -1430 THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 100));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('ALTER TABLE &S.POPUP_QUESTION ADD (TITLE_BLOCKS CLOB)');
    run('ALTER TABLE &S.POPUP_QUESTION ADD (DESCRIPTION_BLOCKS CLOB)');
    run('ALTER TABLE &S.POPUP_OPTION ADD (TEXT_BLOCKS CLOB)');
    run('COMMENT ON COLUMN &S.POPUP_QUESTION.TITLE_BLOCKS IS ''문항 제목 서식 JSON 배열(textBlocks 스키마). '
        || 'NULL = 서식 없음, QUESTION_TITLE은 서식에서 파생''');
    run('COMMENT ON COLUMN &S.POPUP_QUESTION.DESCRIPTION_BLOCKS IS ''문항 설명 서식 JSON 배열(textBlocks 스키마). '
        || 'NULL = 서식 없음, QUESTION_DESCRIPTION은 서식에서 파생''');
    run('COMMENT ON COLUMN &S.POPUP_OPTION.TEXT_BLOCKS IS ''선택지 표시 문구 서식 JSON 배열(textBlocks 스키마). '
        || 'NULL = 서식 없음, OPTION_TEXT는 서식에서 파생''');
END;
/

PROMPT === 2. 확인 (컬럼 3 이어야 함) ===
SELECT COUNT(*) AS RICH_TEXT_COLUMNS FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND ((TABLE_NAME = 'POPUP_QUESTION' AND COLUMN_NAME IN ('TITLE_BLOCKS', 'DESCRIPTION_BLOCKS'))
     OR (TABLE_NAME = 'POPUP_OPTION' AND COLUMN_NAME = 'TEXT_BLOCKS'));
EXIT
