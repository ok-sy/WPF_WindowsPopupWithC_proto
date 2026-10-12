-- =====================================================================================================
-- 14_drop_link_url_oracle.sql — IMAGE 클릭 링크(POPUP_CONTENT.LINK_URL) 삭제 (2026-10-12)
-- -----------------------------------------------------------------------------------------------------
-- 배경: IMAGE 이미지 클릭 시 URL을 여는 기능(content.linkUrl, ORIGINAL 모드 포함)을 모든 모드에서 폐기했다.
--       WPF·서버·관리자 웹에서 linkUrl을 제거했고, 서버는 요청에 linkUrl이 남아 있어도 저장하지 않는다.
--       LINK_URL 컬럼은 IMAGE 클릭 링크 전용이었다(다른 유형·통계·조회에서 읽는 곳 없음).
--       Footer '바로가기'(CONTENT_OPTIONS.footerLinkUrl)와 하단 안내 링크(bottomDescriptionUrl)는 별개 기능이라 그대로 둔다.
-- 처리: 1) CONTENT_OPTIONS에 남은 "linkUrl" 키 제거(07과 같은 정규식 방식, 11g 호환)
--       2) POPUP_CONTENT.LINK_URL 컬럼 삭제
-- 순서: 서버 반영 후 실행. 새 서버는 이 컬럼을 쓰지 않으므로 실행 전후 모두 동작한다.
--       실행 후에는 이전 서버의 팝업 조회(SELECT LINK_URL)·저장이 ORA-00904로 실패한다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @14_drop_link_url_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @14_drop_link_url_oracle.sql ""
-- 되돌리기: 컬럼 삭제는 되돌릴 수 없다. 필요하면 실행 전 1번 조회 결과를 보관한다. 여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 LONG 4000 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
DEFINE K = 'linkUrl'
DEFINE V = '("([^"\]|\\.)*"|[^],{}"[]+)'

PROMPT === 1. 확인: LINK_URL 값이 있는 행 (오류는 이미 삭제된 경우) ===
COLUMN POPUP_ID FORMAT A24
COLUMN POPUP_TYPE FORMAT A10
COLUMN LINK_URL FORMAT A150
WHENEVER SQLERROR CONTINUE
SELECT c.POPUP_ID, n.POPUP_TYPE, c.LINK_URL
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE c.LINK_URL IS NOT NULL
 ORDER BY c.POPUP_ID;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 2. 확인: CONTENT_OPTIONS에 "linkUrl" 키가 있는 행 ===
COLUMN OPTS FORMAT A150
SELECT c.POPUP_ID, n.POPUP_TYPE, DBMS_LOB.SUBSTR(c.CONTENT_OPTIONS, 150, 1) OPTS
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE REGEXP_LIKE(c.CONTENT_OPTIONS, '"(&K)":')
 ORDER BY c.POPUP_ID;

PROMPT === 3. 첫 키가 아닌 쌍(",키:값") 제거 → 맨 앞 쌍("{키:값,") 제거 ===
UPDATE &S.POPUP_CONTENT
   SET CONTENT_OPTIONS = REGEXP_REPLACE(
           REGEXP_REPLACE(CONTENT_OPTIONS, ',"(&K)":&V', ''),
           '^\{"(&K)":&V,?', '{'),
       UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"(&K)":');
COMMIT;

PROMPT === 4. 컬럼 삭제 (이미 없으면 건너뜀) ===
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
    run('ALTER TABLE &S.POPUP_CONTENT DROP (LINK_URL)');
END;
/

PROMPT === 5. 결과 확인 (둘 다 0 이어야 함; 배열·객체 값이면 REMAINING_KEYS가 남음 — 수동 확인) ===
SELECT COUNT(*) REMAINING_COLUMNS FROM ALL_TAB_COLUMNS
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER)
   AND TABLE_NAME = 'POPUP_CONTENT' AND COLUMN_NAME = 'LINK_URL';
SELECT COUNT(*) REMAINING_KEYS FROM &S.POPUP_CONTENT WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"(&K)":');
EXIT
