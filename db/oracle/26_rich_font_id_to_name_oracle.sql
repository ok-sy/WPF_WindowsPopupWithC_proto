-- =====================================================================================================
-- 26_rich_font_id_to_name_oracle.sql — 서식 글꼴 ID를 Windows 글꼴 이름으로 변환 (2026-11-24)
-- POL-03-02 : 문단·글자 서식
-- -----------------------------------------------------------------------------------------------------
-- 배경: 서식 본문 runs[].font의 기본 4종 글꼴 ID(MALGUN_GOTHIC·GULIM·DOTUM·BATANG)를 없앴다. 관리자 웹은 기본 4종도
--       Windows 글꼴 패밀리 이름(Malgun Gothic·Gulim·Dotum·Batang)으로 저장하고, 서버는 ID 허용 목록을, WPF는 ID 매핑을 지웠다.
--       이미 저장된 서식 JSON의 ID를 이름으로 바꾸지 않으면 그 글자는 WPF·미리보기에서 기본 글꼴로 보인다(오류는 아님).
-- 대상: 서식 JSON을 담는 CLOB 4개
--       POPUP_CONTENT.CONTENT_OPTIONS (TEXT textBlocks, 설문·퀴즈·VIDEO surveyTitleBlocks·descriptionBlocks)
--       POPUP_QUESTION.TITLE_BLOCKS · DESCRIPTION_BLOCKS, POPUP_OPTION.TEXT_BLOCKS (문항 템플릿 행 포함)
-- 처리: "font":"MALGUN_GOTHIC" → "font":"Malgun Gothic" 등 4종을 문자열 치환한다(서버 Jackson 직렬화 형식, 콜론 뒤 공백 있는 형식도 함께).
--       글꼴 값 외의 글자(본문에 같은 낱말이 있어도 "font": 키가 붙은 형태만 바꾼다)는 건드리지 않는다.
-- 순서: 새 웹·서버·WPF 반영과 같은 시점에 실행한다. 이전 WPF(TODO28 이전)는 이름을 모르므로 그런 PC에서는 기본 글꼴로 보인다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @26_rich_font_id_to_name_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @26_rich_font_id_to_name_oracle.sql ""
-- 되돌리기: 같은 방식으로 이름 → ID 치환(필요할 때만). 여러 번 실행해도 결과가 같다(두 번째부터 0행).
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

PROMPT === 1. 변환 전 글꼴 ID가 남은 행 수 ===
SELECT 'POPUP_CONTENT.CONTENT_OPTIONS' AS COL, COUNT(*) AS CNT FROM &S.POPUP_CONTENT
 WHERE DBMS_LOB.INSTR(CONTENT_OPTIONS, '"MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(CONTENT_OPTIONS, '"GULIM"') > 0
    OR DBMS_LOB.INSTR(CONTENT_OPTIONS, '"DOTUM"') > 0 OR DBMS_LOB.INSTR(CONTENT_OPTIONS, '"BATANG"') > 0
UNION ALL
SELECT 'POPUP_QUESTION.TITLE_BLOCKS', COUNT(*) FROM &S.POPUP_QUESTION
 WHERE DBMS_LOB.INSTR(TITLE_BLOCKS, '"MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(TITLE_BLOCKS, '"GULIM"') > 0
    OR DBMS_LOB.INSTR(TITLE_BLOCKS, '"DOTUM"') > 0 OR DBMS_LOB.INSTR(TITLE_BLOCKS, '"BATANG"') > 0
UNION ALL
SELECT 'POPUP_QUESTION.DESCRIPTION_BLOCKS', COUNT(*) FROM &S.POPUP_QUESTION
 WHERE DBMS_LOB.INSTR(DESCRIPTION_BLOCKS, '"MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(DESCRIPTION_BLOCKS, '"GULIM"') > 0
    OR DBMS_LOB.INSTR(DESCRIPTION_BLOCKS, '"DOTUM"') > 0 OR DBMS_LOB.INSTR(DESCRIPTION_BLOCKS, '"BATANG"') > 0
UNION ALL
SELECT 'POPUP_OPTION.TEXT_BLOCKS', COUNT(*) FROM &S.POPUP_OPTION
 WHERE DBMS_LOB.INSTR(TEXT_BLOCKS, '"MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(TEXT_BLOCKS, '"GULIM"') > 0
    OR DBMS_LOB.INSTR(TEXT_BLOCKS, '"DOTUM"') > 0 OR DBMS_LOB.INSTR(TEXT_BLOCKS, '"BATANG"') > 0;

PROMPT === 2. 글꼴 ID → 이름 치환 ===
DECLARE
    TYPE t_list IS TABLE OF VARCHAR2(40);
    v_ids   t_list := t_list('MALGUN_GOTHIC', 'GULIM', 'DOTUM', 'BATANG');
    v_names t_list := t_list('Malgun Gothic', 'Gulim', 'Dotum', 'Batang');
    v_cols  t_list := t_list('POPUP_CONTENT.CONTENT_OPTIONS', 'POPUP_QUESTION.TITLE_BLOCKS',
                             'POPUP_QUESTION.DESCRIPTION_BLOCKS', 'POPUP_OPTION.TEXT_BLOCKS');
    v_table VARCHAR2(40);
    v_col   VARCHAR2(40);
BEGIN
    FOR c IN 1 .. v_cols.COUNT LOOP
        v_table := SUBSTR(v_cols(c), 1, INSTR(v_cols(c), '.') - 1);
        v_col   := SUBSTR(v_cols(c), INSTR(v_cols(c), '.') + 1);
        FOR i IN 1 .. v_ids.COUNT LOOP
            -- 서버 직렬화 형식("font":"ID")과 사람이 넣은 형식("font": "ID") 두 가지를 바꾼다.
            EXECUTE IMMEDIATE 'UPDATE &S.' || v_table || ' SET ' || v_col || ' = REPLACE(REPLACE(' || v_col
                || ', ''"font":"' || v_ids(i) || '"'', ''"font":"' || v_names(i) || '"''), ''"font": "' || v_ids(i) || '"'', ''"font": "' || v_names(i) || '"'')'
                || ' WHERE DBMS_LOB.INSTR(' || v_col || ', ''"font":"' || v_ids(i) || '"'') > 0'
                || '    OR DBMS_LOB.INSTR(' || v_col || ', ''"font": "' || v_ids(i) || '"'') > 0';
            DBMS_OUTPUT.PUT_LINE(RPAD(v_cols(c), 36) || RPAD(v_ids(i), 16) || SQL%ROWCOUNT || '행');
        END LOOP;
    END LOOP;
    COMMIT;
END;
/

PROMPT === 3. 확인 (글꼴 키에 ID가 남은 행 0 이어야 함) ===
SELECT COUNT(*) AS REMAINING_FONT_IDS FROM (
    SELECT CONTENT_OPTIONS AS J FROM &S.POPUP_CONTENT
    UNION ALL SELECT TITLE_BLOCKS FROM &S.POPUP_QUESTION
    UNION ALL SELECT DESCRIPTION_BLOCKS FROM &S.POPUP_QUESTION
    UNION ALL SELECT TEXT_BLOCKS FROM &S.POPUP_OPTION)
 WHERE DBMS_LOB.INSTR(J, '"font":"MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(J, '"font":"GULIM"') > 0
    OR DBMS_LOB.INSTR(J, '"font":"DOTUM"') > 0 OR DBMS_LOB.INSTR(J, '"font":"BATANG"') > 0
    OR DBMS_LOB.INSTR(J, '"font": "MALGUN_GOTHIC"') > 0 OR DBMS_LOB.INSTR(J, '"font": "GULIM"') > 0
    OR DBMS_LOB.INSTR(J, '"font": "DOTUM"') > 0 OR DBMS_LOB.INSTR(J, '"font": "BATANG"') > 0;
EXIT
