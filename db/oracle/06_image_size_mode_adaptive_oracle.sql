-- =====================================================================================================
-- 06_image_size_mode_adaptive_oracle.sql — IMAGE 크기 모드 과거 값 FIXED 정리 (2026-09-28, 설계 18 L-1 / D-5①)
-- -----------------------------------------------------------------------------------------------------
-- 배경: IMAGE content.imageSizeMode 는 ADAPTIVE / FIT_TO_IMAGE / FILL 세 값만 쓴다(설계 15, 계약서 v3.0).
--       관리자 웹이 신규 팝업 기본값으로 FIXED 를 저장해 왔고, WPF 는 L-1 이후 FIXED 를 지원하지 않는 값으로
--       오류 처리한다(한 건이라도 남아 있으면 해당 사용자의 팝업 목록 변환이 실패). 따라서 WPF 반영 전에 실행한다.
--       모든 팝업 유형의 content 에 imageSizeMode 키가 들어 있으므로(웹 createDefaultPopup) 유형과 무관하게 정리한다.
--       빈 값("")도 WPF 에서 같은 오류가 나므로 ADAPTIVE 로 바꾼다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @06_image_size_mode_adaptive_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @06_image_size_mode_adaptive_oracle.sql ""
-- 여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 LONG 4000 TRIMSPOOL ON FEEDBACK ON DEFINE ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;

PROMPT === 1. imageSizeMode 가 FIXED 또는 빈 값인 POPUP_CONTENT 행 ===
COLUMN POPUP_ID FORMAT A24
COLUMN POPUP_TYPE FORMAT A10
SELECT c.POPUP_ID, n.POPUP_TYPE, n.ACTIVE_YN
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode":"(fixed)?"', 'i')
 ORDER BY n.POPUP_TYPE, c.POPUP_ID;

PROMPT === 2. FIXED / 빈 값 → ADAPTIVE ===
UPDATE &S.POPUP_CONTENT
   SET CONTENT_OPTIONS = REGEXP_REPLACE(CONTENT_OPTIONS, '"imageSizeMode":"(fixed)?"', '"imageSizeMode":"ADAPTIVE"', 1, 0, 'i'),
       UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"imageSizeMode":"(fixed)?"', 'i');
COMMIT;

PROMPT === 3. IMAGE 팝업 크기 모드 분포 (ADAPTIVE / FIT_TO_IMAGE / FILL 외 값이 없어야 함) ===
COLUMN IMAGE_SIZE_MODE FORMAT A20
SELECT NVL(m.MODE_VALUE, '(없음)') IMAGE_SIZE_MODE, COUNT(*) CNT
  FROM (SELECT DBMS_LOB.SUBSTR(REGEXP_SUBSTR(c.CONTENT_OPTIONS, '"imageSizeMode":"([^"]*)"', 1, 1, NULL, 1), 40, 1) MODE_VALUE
          FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
         WHERE n.POPUP_TYPE = 'IMAGE') m
 GROUP BY m.MODE_VALUE
 ORDER BY 1;

PROMPT === 4. 남은 FIXED / 빈 값 행 수 (0 이어야 함) ===
SELECT COUNT(*) REMAINING FROM &S.POPUP_CONTENT
 WHERE REGEXP_LIKE(CONTENT_OPTIONS, '"imageSizeMode":"(fixed)?"', 'i');
EXIT
