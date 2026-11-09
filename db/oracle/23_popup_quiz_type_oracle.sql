-- =====================================================================================================
-- 23_popup_quiz_type_oracle.sql — QUIZ 퀴즈 유형 코드 컬럼 추가·기존 데이터 이관 (2026-11-09)
-- POL-06-02 : 선택·제출
-- -----------------------------------------------------------------------------------------------------
-- 배경: 참여형 퀴즈도 양수 기준 점수를 둘 수 있게 되어(PU001 §7) PASSING_SCORE만으로는 참여형·컷트라인형·만점형을
--       구분할 수 없다. 공통코드 그룹 0090(00 참여형·01 만점형·02 컷트라인형)을 POPUP_NOTICE.QUIZ_TYPE_CD에 저장한다.
--       QUIZ만 값을 가지며 그 밖 유형은 NULL이다. WPF 조회 응답은 코드 대신 파생값 requiresPassing(00=false, 01·02=true)을 받는다.
-- 처리: 1) QUIZ_TYPE_CD VARCHAR2(2 CHAR) NULL 허용 + CK_POPUP_QUIZ_TYPE_CD(NULL 또는 00·01·02) + 주석.
--       2) 유형 코드가 비어 있는 기존 QUIZ 행을 기존 점수 기준으로 복원한다(이미 값이 있는 행은 바꾸지 않는다).
--          - PASSING_SCORE NULL 또는 0 이하                    → '00' 참여형
--          - PASSING_SCORE ≥ 문항 배점 합계(POPUP_QUESTION)   → '01' 만점형 (만점 기준 컷트라인과 구분할 수 없어 만점형으로 본다)
--          - 그 밖                                             → '02' 컷트라인형
--          QUIZ가 아닌 행에 남은 값은 NULL로 비운다.
-- 순서: 서버 반영 전에 실행. 새 서버는 이 컬럼을 조회·저장하므로 없으면 ORA-00904로 실패한다.
--       이전 서버는 이 컬럼을 쓰지 않으므로 실행 후에도 동작한다(이전 서버가 새로 저장한 QUIZ는 NULL로 남아
--       새 서버가 점수 기준으로 처리한다. 이 스크립트를 다시 실행하면 같은 기준으로 채운다).
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @23_popup_quiz_type_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @23_popup_quiz_type_oracle.sql ""
-- 되돌리기: ALTER TABLE <접두어>POPUP_NOTICE DROP CONSTRAINT CK_POPUP_QUIZ_TYPE_CD;
--           ALTER TABLE <접두어>POPUP_NOTICE DROP COLUMN QUIZ_TYPE_CD;
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

PROMPT === 1. 퀴즈 유형 코드 컬럼·제약 추가 ===
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
    run('ALTER TABLE &S.POPUP_NOTICE ADD (QUIZ_TYPE_CD VARCHAR2(2 CHAR))');
    run('ALTER TABLE &S.POPUP_NOTICE ADD CONSTRAINT CK_POPUP_QUIZ_TYPE_CD CHECK ('
        || 'QUIZ_TYPE_CD IS NULL OR QUIZ_TYPE_CD IN (''00'', ''01'', ''02''))');
    run('COMMENT ON COLUMN &S.POPUP_NOTICE.QUIZ_TYPE_CD IS ''QUIZ 퀴즈 유형 공통코드 0090: '
        || '00 참여형 / 01 만점형 / 02 컷트라인형. QUIZ 외 NULL. WPF 응답 requiresPassing(00=false, 01·02=true)으로 파생''');
END;
/

PROMPT === 2. 기존 QUIZ 유형 복원 (유형 코드가 빈 행만) ===
UPDATE &S.POPUP_NOTICE n
   SET n.QUIZ_TYPE_CD = CASE
           WHEN NVL(n.PASSING_SCORE, 0) <= 0 THEN '00'
           WHEN n.PASSING_SCORE >= (SELECT NVL(SUM(NVL(q.QUESTION_SCORE, 0)), 0)
                                      FROM &S.POPUP_QUESTION q
                                     WHERE q.QUESTION_TEMPLATE_ID = n.QUESTION_TEMPLATE_ID) THEN '01'
           ELSE '02'
       END
 WHERE n.POPUP_TYPE = 'QUIZ'
   AND n.QUIZ_TYPE_CD IS NULL;

UPDATE &S.POPUP_NOTICE
   SET QUIZ_TYPE_CD = NULL
 WHERE POPUP_TYPE <> 'QUIZ'
   AND QUIZ_TYPE_CD IS NOT NULL;
COMMIT;

PROMPT === 3. 확인 (컬럼 1, 제약 1, 유형 없는 QUIZ 0 이어야 함) ===
SELECT COUNT(*) AS QUIZ_TYPE_COLUMN FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'POPUP_NOTICE' AND COLUMN_NAME = 'QUIZ_TYPE_CD';
SELECT COUNT(*) AS QUIZ_TYPE_CONSTRAINT FROM ALL_CONSTRAINTS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'POPUP_NOTICE' AND CONSTRAINT_NAME = 'CK_POPUP_QUIZ_TYPE_CD';
SELECT COUNT(*) AS QUIZ_WITHOUT_TYPE FROM &S.POPUP_NOTICE WHERE POPUP_TYPE = 'QUIZ' AND QUIZ_TYPE_CD IS NULL;
SELECT POPUP_TYPE, QUIZ_TYPE_CD, COUNT(*) AS POPUP_COUNT
  FROM &S.POPUP_NOTICE
 WHERE POPUP_TYPE = 'QUIZ' OR QUIZ_TYPE_CD IS NOT NULL
 GROUP BY POPUP_TYPE, QUIZ_TYPE_CD
 ORDER BY POPUP_TYPE, QUIZ_TYPE_CD;
EXIT
