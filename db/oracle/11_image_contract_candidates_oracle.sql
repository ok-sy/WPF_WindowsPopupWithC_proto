-- TODO 23 migration audit; Oracle 11g compatible. Read-only.
-- SQL*Plus: @11_image_contract_candidates_oracle.sql POPUP.  (or "" for current schema)
SET PAGESIZE 200 LINESIZE 250 LONG 10000 TRIMSPOOL ON
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
SELECT n.POPUP_ID, n.SIZE_MODE, n.POPUP_WIDTH, n.POPUP_HEIGHT, c.CONTENT_OPTIONS
FROM &S.POPUP_NOTICE n JOIN &S.POPUP_CONTENT c ON c.POPUP_ID=n.POPUP_ID
WHERE n.POPUP_TYPE='IMAGE'
ORDER BY n.POPUP_ID;
-- JSON rewriting is performed by the Java planner, because Oracle 11g has no JSON_OBJECT/JSON_TRANSFORM.
-- No UPDATE or COMMIT is executed by this audit script or by the planner.
