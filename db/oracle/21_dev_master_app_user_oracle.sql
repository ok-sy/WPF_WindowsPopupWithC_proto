-- =====================================================================================================
-- 21_dev_master_app_user_oracle.sql — 개발 테스트 계정 master를 팝업 활성 사용자로 등록 (2026-11-04)
-- POL-15-02 : 인증·버전
-- -----------------------------------------------------------------------------------------------------
-- 배경: API Demo 로그인 회귀에 쓰는 master 계정이 APP_USER에 없어 팝업 조회가 403 WPF_USER_INACTIVE로 끝난다.
--       팝업 API는 로그인 ID를 사번으로 보고 APP_USER의 활성 행을 확인한다.
-- 처리: APP_USER에 EMPLOYEE_NO='master'를 활성으로 넣는다. 부서·직위는 샘플 사용자 E1001과 같은 D110·P01이다.
--       이미 있으면 활성으로만 맞춘다. 이 등록만으로 표시되는 팝업은 없다(대상 조건에 맞는 게시 팝업만 표시).
-- 범위: 로컬 XE·원격 개발 DB 전용 테스트 데이터. 폐쇄망·운영 DB에는 실행하지 않는다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @21_dev_master_app_user_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @21_dev_master_app_user_oracle.sql ""
-- 되돌리기: DELETE FROM <접두어>APP_USER WHERE EMPLOYEE_NO = 'master'; (전달·결과 행이 있으면 먼저 지운다)
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다.
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. master 활성 사용자 등록 ===
MERGE INTO &S.APP_USER t
USING (SELECT 'master' EMPLOYEE_NO FROM DUAL) s
   ON (t.EMPLOYEE_NO = s.EMPLOYEE_NO)
 WHEN MATCHED THEN UPDATE SET t.ACTIVE_YN = 'Y', t.UPDATED_BY = 'DEV-21', t.UPDATED_AT = SYSTIMESTAMP
 WHEN NOT MATCHED THEN INSERT (EMPLOYEE_NO, EMPLOYEE_NAME, DEPARTMENT_ID, POSITION_ID, ACTIVE_YN, CREATED_BY, CREATED_AT, UPDATED_BY, UPDATED_AT)
      VALUES ('master', '개발 테스트 계정', 'D110', 'P01', 'Y', 'DEV-21', SYSTIMESTAMP, 'DEV-21', SYSTIMESTAMP);
COMMIT;

PROMPT === 2. 확인 ===
SELECT EMPLOYEE_NO, DEPARTMENT_ID, POSITION_ID, ACTIVE_YN FROM &S.APP_USER WHERE EMPLOYEE_NO = 'master';
EXIT
