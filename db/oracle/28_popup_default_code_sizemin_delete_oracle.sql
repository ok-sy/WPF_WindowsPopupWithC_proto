-- =====================================================================================================
-- 28_popup_default_code_sizemin_delete_oracle.sql — 공통코드 0101 SIZEMIN 삭제 (2026-11-25)
-- POL-01-03 : 최소 크기
-- -----------------------------------------------------------------------------------------------------
-- 배경: 창 크기 입력 하한(SIZEMIN)과 기본 창 최소 크기(MINW·MINH)가 같은 역할이라 합쳤다. 관리자 웹은 가로·세로 입력 하한으로
--       MINW·MINH를 쓰고 SIZEMIN은 더 읽지 않는다(남아 있으면 '알 수 없는 코드'로 무시). 27 스크립트에서도 SIZEMIN을 뺐다.
-- 범위: 이전 27 스크립트(24건)를 이미 실행한 DB만 — 원격 개발 DB(2026-11-25 실행). 새로 27(23건)을 실행하는 DB(폐쇄망 포함)는 필요 없다.
-- 처리: 0101 그룹의 SIZEMIN 한 건을 지우고, MINW·MINH 설명을 입력 하한을 겸한다는 문구로 바꾼다(27과 같은 문구).
--       설명이 이전 문구 그대로일 때만 바꾼다(코드 관리 화면에서 고친 설명 보존). 다시 실행해도 같다.
-- 실행: 공통 테이블이 있는 앱 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
-- 확인: SELECT COUNT(*) FROM CLOVER_CODE WHERE code_type = '0101'; → 23
-- =====================================================================================================
SET DEFINE OFF
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

DELETE FROM CLOVER_CODE WHERE code_type = '0101' AND code = 'SIZEMIN';
UPDATE CLOVER_CODE SET dtl_expl = '기본 창 최소 너비·가로 입력 하한(px, 300 이상)', chng_dttm = SYSTIMESTAMP
 WHERE code_type = '0101' AND code = 'MINW' AND dtl_expl = '기본 창 최소 너비(px, 300 이상)';
UPDATE CLOVER_CODE SET dtl_expl = '기본 창 최소 높이·세로 입력 하한(px, 300 이상)', chng_dttm = SYSTIMESTAMP
 WHERE code_type = '0101' AND code = 'MINH' AND dtl_expl = '기본 창 최소 높이(px, 300 이상)';

COMMIT;
EXIT
