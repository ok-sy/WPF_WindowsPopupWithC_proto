-- =====================================================================================================
-- 22_popup_question_code_oracle.sql — 퀴즈·설문 편집기 공통코드 등록 (2026-11-05)
-- POL-06-02 : 선택·제출
-- -----------------------------------------------------------------------------------------------------
-- 배경: 관리자 웹 답안 유형은 코드 그룹 0089, 퀴즈 유형은 코드 그룹 0090을 조회한다.
-- 처리: 코드 그룹과 코드가 없을 때만 넣는다. 이미 있으면 바꾸지 않는다.
-- 범위: 로컬 XE·원격 개발 DB 전용. 폐쇄망은 이 코드가 이미 있으므로 실행하지 않는다.
-- 실행: 공통 테이블이 있는 앱 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
-- =====================================================================================================
SET DEFINE OFF
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

MERGE INTO CLOVER_CODE_TYPE t
USING (
    SELECT '0089' code_type, '답안 유형' code_type_nm FROM dual UNION ALL
    SELECT '0090', '퀴즈 유형' FROM dual
) s ON (t.code_type = s.code_type)
WHEN NOT MATCHED THEN
    INSERT (code_type, code_type_nm, reg_dttm, chng_dttm)
    VALUES (s.code_type, s.code_type_nm, SYSTIMESTAMP, SYSTIMESTAMP);

MERGE INTO CLOVER_CODE t
USING (
    SELECT '0089' code_type, '01' code, 'OX형' code_nm FROM dual UNION ALL
    SELECT '0089', '02', '선다형' FROM dual UNION ALL
    SELECT '0090', '00', '참여형' FROM dual UNION ALL
    SELECT '0090', '01', '만점형' FROM dual UNION ALL
    SELECT '0090', '02', '컷트라인형' FROM dual
) s ON (t.code_type = s.code_type AND t.code = s.code)
WHEN NOT MATCHED THEN
    INSERT (code_type, code, code_nm, reg_dttm, chng_dttm)
    VALUES (s.code_type, s.code, s.code_nm, SYSTIMESTAMP, SYSTIMESTAMP);

COMMIT;
EXIT
