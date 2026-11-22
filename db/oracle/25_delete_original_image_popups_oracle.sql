-- =====================================================================================================
-- 25_delete_original_image_popups_oracle.sql — IMAGE ORIGINAL 모드 팝업 삭제 (2026-11-23)
-- POL-04-02 : 모드별 기준
-- -----------------------------------------------------------------------------------------------------
-- 배경: IMAGE content.imageSizeMode 는 ADAPTIVE / FIT_TO_IMAGE 두 값만 지원한다(2026-11-22 ORIGINAL 삭제).
--       서버는 ORIGINAL 저장을 거절하지만 조회 조립은 저장값을 그대로 내려 주고, WPF 는 지원하지 않는 모드로 보고
--       팝업 변환에 실패한다. 관리자 웹은 ADAPTIVE 로 바꿔 보여 주므로 화면과 실제 표시가 어긋난다.
--       ORIGINAL 은 변환하지 않고 해당 팝업을 삭제한다.
-- 처리: 대상 = POPUP_TYPE='IMAGE' 이고 CONTENT_OPTIONS 의 imageSizeMode 가 ORIGINAL(대소문자 무관)인 팝업.
--       ON DELETE CASCADE 가 없는 참조(POPUP_RESPONSE·API_REQUEST_LOG)와 FK 없는 WPF_RESULT_RECEIPT·WPF_POPUP_DELIVERY 를
--       먼저 지우고 POPUP_NOTICE 를 지운다. POPUP_CONTENT·대상 그룹/조건·USER_POPUP_STATUS·VIDEO_VIEW_STATUS·
--       POPUP_DISPLAY_TIME·응답 답변/값은 CASCADE 로 함께 삭제된다.
-- 순서: WPF·서버의 ORIGINAL 삭제 반영 전후 어느 때나 실행 가능. 여러 번 실행해도 결과가 같다(두 번째부터 0행).
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @25_delete_original_image_popups_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @25_delete_original_image_popups_oracle.sql ""
-- 되돌리기: 행 삭제라 스크립트로 복원하지 않는다. 필요하면 실행 전 1번 목록으로 관리자 웹에서 새로 등록한다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

PROMPT === 1. 삭제 대상 (IMAGE + imageSizeMode ORIGINAL) ===
COLUMN POPUP_ID FORMAT A24
COLUMN TITLE FORMAT A60
SELECT n.POPUP_ID, n.TITLE, n.ACTIVE_YN
  FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
 WHERE n.POPUP_TYPE = 'IMAGE'
   AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i')
 ORDER BY n.POPUP_ID;

PROMPT === 2. 참조 행 → 팝업 삭제 ===
DELETE FROM &S.POPUP_RESPONSE WHERE POPUP_ID IN (
    SELECT c.POPUP_ID FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
     WHERE n.POPUP_TYPE = 'IMAGE'
       AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i'));
DELETE FROM &S.API_REQUEST_LOG WHERE POPUP_ID IN (
    SELECT c.POPUP_ID FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
     WHERE n.POPUP_TYPE = 'IMAGE'
       AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i'));
DELETE FROM &S.WPF_RESULT_RECEIPT WHERE POPUP_ID IN (
    SELECT c.POPUP_ID FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
     WHERE n.POPUP_TYPE = 'IMAGE'
       AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i'));
DELETE FROM &S.WPF_POPUP_DELIVERY WHERE POPUP_ID IN (
    SELECT c.POPUP_ID FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
     WHERE n.POPUP_TYPE = 'IMAGE'
       AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i'));
DELETE FROM &S.POPUP_NOTICE WHERE POPUP_ID IN (
    SELECT c.POPUP_ID FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
     WHERE n.POPUP_TYPE = 'IMAGE'
       AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i'));
COMMIT;

PROMPT === 3. IMAGE 팝업 크기 모드 분포 (ADAPTIVE / FIT_TO_IMAGE 외 값이 없어야 함) ===
COLUMN IMAGE_SIZE_MODE FORMAT A20
SELECT NVL(m.MODE_VALUE, '(없음)') IMAGE_SIZE_MODE, COUNT(*) CNT
  FROM (SELECT DBMS_LOB.SUBSTR(REGEXP_SUBSTR(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"([^"]*)"', 1, 1, NULL, 1), 40, 1) MODE_VALUE
          FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
         WHERE n.POPUP_TYPE = 'IMAGE') m
 GROUP BY m.MODE_VALUE
 ORDER BY 1;

PROMPT === 4. 남은 ORIGINAL 팝업 수 (0 이어야 함) ===
SELECT COUNT(*) REMAINING
  FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID = n.POPUP_ID
 WHERE n.POPUP_TYPE = 'IMAGE'
   AND REGEXP_LIKE(c.CONTENT_OPTIONS, '"imageSizeMode"[[:space:]]*:[[:space:]]*"original"', 'i');
EXIT
