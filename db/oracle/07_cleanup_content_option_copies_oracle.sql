-- =====================================================================================================
-- 07_cleanup_content_option_copies_oracle.sql — CONTENT_OPTIONS의 정규 컬럼 사본·서버 파생 키 제거 (2026-09-28, 설계 18 L-3 / D-5②)
-- -----------------------------------------------------------------------------------------------------
-- 배경: 관리자 저장 시 content 전체가 POPUP_CONTENT.CONTENT_OPTIONS에 들어가, 정규 컬럼 값(제목·설명·본문·미디어 URL·
--       링크 URL)의 사본과 서버가 조회 때 덧붙이던 파생 키(completionRatio·allowCloseBeforeCompletion·passingScore·
--       validateRequiredQuestions)가 함께 저장됐다. 예전 조회는 옵션 JSON을 마지막에 병합해 오래된 사본이 컬럼 값을 가렸다.
--       L-3 서버는 저장 시 이 키들을 빼고 조회 시에도 무시하므로 기능상 필수는 아니며, 기존 행을 같은 형태로 맞추는 정리다.
-- 방식: Oracle 11g 호환을 위해 JSON 함수 대신 정규식으로 "키":값 쌍을 지운다. 값은 문자열(이스케이프 포함)·숫자·
--       true/false/null만 대상이다(배열·객체 값은 지우지 않고 4번 조회에 남는다).
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @07_cleanup_content_option_copies_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @07_cleanup_content_option_copies_oracle.sql ""
-- 여러 번 실행해도 결과가 같다. 서버 L-3 반영 전후 어느 쪽에서 실행해도 조회 결과는 컬럼 값 기준으로 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 LONG 4000 TRIMSPOOL ON FEEDBACK ON DEFINE ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
DEFINE K = 'contentTitle|imageTitle|videoTitle|surveyTitle|description|plainText|imageUrl|videoUrl|linkUrl|completionRatio|allowCloseBeforeCompletion|passingScore|validateRequiredQuestions|questions'
DEFINE V = '("([^"\]|\\.)*"|[^],{}"[]+)'

PROMPT === 1. 정리 대상 행 ===
COLUMN POPUP_ID FORMAT A24
COLUMN POPUP_TYPE FORMAT A10
COLUMN OPTS FORMAT A150
SELECT c.POPUP_ID, n.POPUP_TYPE, DBMS_LOB.SUBSTR(c.CONTENT_OPTIONS, 150, 1) OPTS
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE REGEXP_LIKE(c.CONTENT_OPTIONS, '"(&K)":')
 ORDER BY c.POPUP_ID;

PROMPT === 2. 첫 키가 아닌 쌍(",키:값") 제거 → 맨 앞 쌍("{키:값,") 제거 ===
UPDATE &S.POPUP_CONTENT
   SET CONTENT_OPTIONS = REGEXP_REPLACE(
           REGEXP_REPLACE(CONTENT_OPTIONS, ',"(&K)":&V', ''),
           '^\{"(&K)":&V,?', '{'),
       UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"(&K)":');
COMMIT;

PROMPT === 3. 정리 후 행 ===
SELECT c.POPUP_ID, n.POPUP_TYPE, DBMS_LOB.SUBSTR(c.CONTENT_OPTIONS, 150, 1) OPTS
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 ORDER BY c.POPUP_ID;

PROMPT === 4. 남은 행 수 (0 이어야 함; 배열·객체 값이면 남음 — 수동 확인) ===
SELECT COUNT(*) REMAINING FROM &S.POPUP_CONTENT WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"(&K)":');
EXIT
