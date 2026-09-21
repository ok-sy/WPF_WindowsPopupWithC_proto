-- =====================================================================================================
-- 04_cleanup_markdown_fields_oracle.sql — TEXT 팝업 Markdown 모드 제거에 따른 데이터 정리 (2026-09-21)
-- -----------------------------------------------------------------------------------------------------
-- 배경: WPF·관리자 웹에서 TEXT 팝업의 markdownMode / markdownContent 를 제거했다(변경 이력 2026-09-21-05).
--       POPUP_CONTENT.CONTENT_OPTIONS(JSON CLOB)에 두 필드가 남아 있어도 코드가 무시하지만,
--       markdownMode=true 로 저장된 팝업은 본문이 markdownContent 에만 있어 화면에 빈 본문으로 뜬다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : 아래 &1 에 POPUP.  를 넣는다  → @04_cleanup_markdown_fields_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : 팝업 테이블이 접속 계정 스키마에 있으므로 &1 을 빈 값("")으로 → @04_... ""
-- 절차: 1) 조회로 대상 확인 → 2) markdownMode=false 행은 두 필드만 제거(내용 보존)
--       → 3) markdownMode=true 행은 목록만 출력(삭제는 확인 후 수동: 아래 주석의 DELETE)
-- 로컬 XE 에는 2026-09-21 적용 완료(SAMPLE-TEXT-001, markdownMode=false → 필드 제거).
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 LONG 4000 TRIMSPOOL ON FEEDBACK ON DEFINE ON
DEFINE S = &1

PROMPT === 1. markdown 필드가 남아 있는 POPUP_CONTENT 행 ===
COLUMN POPUP_ID FORMAT A24
COLUMN MD_MODE FORMAT A8
COLUMN OPTS FORMAT A120
SELECT c.POPUP_ID, n.POPUP_TYPE,
       CASE WHEN DBMS_LOB.INSTR(c.CONTENT_OPTIONS, '"markdownMode":true') > 0 THEN 'TRUE'
            WHEN DBMS_LOB.INSTR(c.CONTENT_OPTIONS, '"markdownMode":false') > 0 THEN 'FALSE' ELSE '?' END MD_MODE,
       DBMS_LOB.SUBSTR(c.CONTENT_OPTIONS, 120, 1) OPTS
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE DBMS_LOB.INSTR(c.CONTENT_OPTIONS, 'markdown') > 0
 ORDER BY c.POPUP_ID;

PROMPT === 2. markdownMode=false 행: 두 필드만 제거 (본문·옵션 보존) ===
UPDATE &S.POPUP_CONTENT
   SET CONTENT_OPTIONS = REPLACE(REPLACE(CONTENT_OPTIONS, '"markdownMode":false,"markdownContent":"",', ''),
                                 ',"markdownMode":false,"markdownContent":""', ''),
       UPDATED_BY = 'CLEANUP', UPDATED_AT = CAST(SYSTIMESTAMP AT TIME ZONE 'Asia/Seoul' AS TIMESTAMP)
 WHERE DBMS_LOB.INSTR(CONTENT_OPTIONS, '"markdownMode":false') > 0;
COMMIT;

PROMPT === 3. markdownMode=true 행 (본문이 markdownContent 에만 있음 — 확인 후 수동 삭제) ===
SELECT c.POPUP_ID, n.TITLE, n.ACTIVE_YN
  FROM &S.POPUP_CONTENT c JOIN &S.POPUP_NOTICE n ON n.POPUP_ID = c.POPUP_ID
 WHERE DBMS_LOB.INSTR(c.CONTENT_OPTIONS, '"markdownMode":true') > 0;
-- 삭제(POPUP_NOTICE → POPUP_CONTENT·문항·상태·영수증 ON DELETE CASCADE):
--   DELETE FROM &S.POPUP_NOTICE WHERE POPUP_ID IN ( ... 위 목록 ... );
--   COMMIT;

PROMPT === 4. 남은 행 수 (0 이어야 함; 3번 대상이 있으면 그 수만큼 남음) ===
SELECT COUNT(*) REMAINING FROM &S.POPUP_CONTENT WHERE DBMS_LOB.INSTR(CONTENT_OPTIONS, 'markdown') > 0;
EXIT
