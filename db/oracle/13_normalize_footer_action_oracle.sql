-- =====================================================================================================
-- 13_normalize_footer_action_oracle.sql — CONTENT_OPTIONS의 Footer 동작 키 저장 정규화 (2026-10-12, 설계 30)
-- -----------------------------------------------------------------------------------------------------
-- 배경: 설계 30으로 Footer 동작을 CLOSE / LINK_AND_CLOSE / SUBMIT 3값으로 정리했다. SURVEY/QUIZ(동영상+퀴즈 포함)는
--       SUBMIT 고정이고, 그 밖의 유형은 CLOSE가 기본값이다. 서버는 저장 시 다음 정규형만 남긴다.
--         - SURVEY/QUIZ                  : footerAction·footerLinkUrl 저장 안 함
--         - TEXT/IMAGE/VIDEO, LINK_AND_CLOSE : footerAction·footerLinkUrl 저장
--         - TEXT/IMAGE/VIDEO, 그 밖(CLOSE·생략) : 두 키 저장 안 함
--       서버 WPF 응답은 저장 값과 무관하게 같은 규칙으로 최상위 footerAction을 만들므로 기능상 필수는 아니며,
--       기존 행을 같은 형태로 맞추는 정리다(관리자 화면 재편집 시 이전 바로가기 URL이 남아 보이지 않게 함).
-- 방식: Oracle 11g 호환을 위해 JSON 함수 대신 정규식으로 "키":값 쌍을 지운다(07과 같은 방식). 값은 문자열(이스케이프
--       포함)·숫자·true/false/null만 대상이다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @13_normalize_footer_action_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @13_normalize_footer_action_oracle.sql ""
-- 여러 번 실행해도 결과가 같다. 서버 반영 전후 어느 쪽에서 실행해도 WPF 응답은 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 LONG 4000 TRIMSPOOL ON FEEDBACK ON DEFINE ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
DEFINE K = 'footerAction|footerLinkUrl'
DEFINE V = '("([^"\]|\\.)*"|[^],{}"[]+)'

PROMPT === 1. 정리 대상 행 (SURVEY/QUIZ 전부, 그 밖은 LINK_AND_CLOSE가 아닌 행) ===
COLUMN POPUP_ID FORMAT A24
COLUMN POPUP_TYPE FORMAT A10
COLUMN OPTS FORMAT A150
SELECT c.POPUP_ID, n.POPUP_TYPE, DBMS_LOB.SUBSTR(c.CONTENT_OPTIONS, 150, 1) OPTS
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE REGEXP_LIKE(c.CONTENT_OPTIONS, '"(&K)":')
   AND (n.POPUP_TYPE IN ('SURVEY', 'QUIZ') OR NOT REGEXP_LIKE(c.CONTENT_OPTIONS, '"footerAction":"LINK_AND_CLOSE"'))
 ORDER BY c.POPUP_ID;

PROMPT === 2. 첫 키가 아닌 쌍(",키:값") 제거 → 맨 앞 쌍("{키:값,") 제거 ===
UPDATE &S.POPUP_CONTENT c
   SET CONTENT_OPTIONS = REGEXP_REPLACE(
           REGEXP_REPLACE(REGEXP_REPLACE(CONTENT_OPTIONS, ',"(&K)":&V', ''),
               '^\{"(&K)":&V,?', '{'),
           '^\{"(&K)":&V,?', '{'),
       UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"(&K)":')
   AND ((SELECT n.POPUP_TYPE FROM &S.POPUP_NOTICE n WHERE n.POPUP_ID = c.POPUP_ID) IN ('SURVEY', 'QUIZ')
        OR NOT REGEXP_LIKE(CONTENT_OPTIONS, '"footerAction":"LINK_AND_CLOSE"'));
COMMIT;

PROMPT === 3. 남은 행 수 (0 이어야 함; 배열·객체 값이면 남음 — 수동 확인) ===
SELECT COUNT(*) REMAINING
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE REGEXP_LIKE(c.CONTENT_OPTIONS, '"(&K)":')
   AND (n.POPUP_TYPE IN ('SURVEY', 'QUIZ') OR NOT REGEXP_LIKE(c.CONTENT_OPTIONS, '"footerAction":"LINK_AND_CLOSE"'));
EXIT
