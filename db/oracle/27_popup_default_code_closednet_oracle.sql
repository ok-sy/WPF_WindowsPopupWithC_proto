-- =====================================================================================================
-- 27_popup_default_code_closednet_oracle.sql — 팝업 기본값·입력 범위 공통코드(0101) 등록, 폐쇄망용 (2026-11-25)
-- POL-01-02 : 기본값의 적용
-- -----------------------------------------------------------------------------------------------------
-- 27_popup_default_code_oracle.sql(로컬·원격 개발 DB)과 같은 24건. 폐쇄망 CLOVER_CODE에만 있는 SORT_SEQ(NUMBER(3))에 1~24 순번을 넣는다.
-- 형식: CODE = 키, CODE_NM = 값(숫자 문자열), DTL_EXPL = 설명. 웹 popupDefaults.ts(loadPopupDefaultCodes)가 읽는다.
-- 값: 현재 웹 파일 기본값과 같다(넣어도 화면 동작은 바뀌지 않음). 바꿀 때는 코드 관리 화면에서 CODE_NM만 고친다.
--     범위는 서버·WPF 계약 범위(창 300 이상, 비율 0.1~1, 글자 10~40, 0~1, 숨김 1~3650) 안에서만 좁힐 수 있다. 밖의 값·숫자 아닌 값은 웹이 무시한다.
-- 처리: 코드 그룹과 코드가 없을 때만 넣는다(MERGE). 이미 있으면 바꾸지 않는다. 0101 그룹이 비어 있는 것을 확인한 뒤 실행.
-- 확인: CLOVER_CODE_TYPE에 0101이 이미 있으면 그룹 행은 건너뛴다. 그룹 테이블 필수 컬럼이 다르면 첫 MERGE만 코드 관리 화면에서 그룹 등록으로 대신한다.
-- 실행: 공통 테이블이 있는 앱 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8). 실행 후 아래 확인 쿼리로 24건 확인.
-- =====================================================================================================
SET DEFINE OFF
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

MERGE INTO CLOVER_CODE_TYPE t
USING (SELECT '0101' code_type, '팝업 기본값' code_type_nm FROM dual) s
ON (t.code_type = s.code_type)
WHEN NOT MATCHED THEN
    INSERT (code_type, code_type_nm, reg_dttm, chng_dttm)
    VALUES (s.code_type, s.code_type_nm, SYSTIMESTAMP, SYSTIMESTAMP);

MERGE INTO CLOVER_CODE t
USING (
    SELECT 'WIDTH' code, '560' code_nm, '기본 창 너비(px, 고정 크기)' dtl_expl, 1 sort_seq FROM dual UNION ALL
    SELECT 'HEIGHT' code, '420' code_nm, '기본 창 높이(px, 고정 크기)' dtl_expl, 2 sort_seq FROM dual UNION ALL
    SELECT 'WRATIO' code, '0.7' code_nm, '기본 화면 너비 비율(화면 비율 모드)' dtl_expl, 3 sort_seq FROM dual UNION ALL
    SELECT 'HRATIO' code, '0.75' code_nm, '기본 화면 높이 비율(화면 비율 모드)' dtl_expl, 4 sort_seq FROM dual UNION ALL
    SELECT 'MINW' code, '300' code_nm, '기본 창 최소 너비(px, 300 이상)' dtl_expl, 5 sort_seq FROM dual UNION ALL
    SELECT 'MINH' code, '300' code_nm, '기본 창 최소 높이(px, 300 이상)' dtl_expl, 6 sort_seq FROM dual UNION ALL
    SELECT 'MAXW' code, '1200' code_nm, '기본 창 최대 너비(px)' dtl_expl, 7 sort_seq FROM dual UNION ALL
    SELECT 'MAXH' code, '900' code_nm, '기본 창 최대 높이(px)' dtl_expl, 8 sort_seq FROM dual UNION ALL
    SELECT 'OVERLAY' code, '0.45' code_nm, '기본 배경 어둡기(0~1)' dtl_expl, 9 sort_seq FROM dual UNION ALL
    SELECT 'VOLUME' code, '0.7' code_nm, '기본 영상 음량(0~1)' dtl_expl, 10 sort_seq FROM dual UNION ALL
    SELECT 'VQRATIO' code, '0.8' code_nm, '동영상+퀴즈 기본 완료 비율(0~1)' dtl_expl, 11 sort_seq FROM dual UNION ALL
    SELECT 'SIZEMIN' code, '300' code_nm, '창 크기 입력 하한(px, 300 이상만)' dtl_expl, 12 sort_seq FROM dual UNION ALL
    SELECT 'RATIOMIN' code, '0.1' code_nm, '화면 비율 입력 하한(0.1 이상)' dtl_expl, 13 sort_seq FROM dual UNION ALL
    SELECT 'RATIOMAX' code, '1' code_nm, '화면 비율 입력 상한(1 이하)' dtl_expl, 14 sort_seq FROM dual UNION ALL
    SELECT 'FONTMIN' code, '10' code_nm, '글자 크기 입력 하한(10 이상)' dtl_expl, 15 sort_seq FROM dual UNION ALL
    SELECT 'FONTMAX' code, '40' code_nm, '글자 크기 입력 상한(40 이하)' dtl_expl, 16 sort_seq FROM dual UNION ALL
    SELECT 'OVERLAYMIN' code, '0' code_nm, '배경 어둡기 입력 하한(0 이상)' dtl_expl, 17 sort_seq FROM dual UNION ALL
    SELECT 'OVERLAYMAX' code, '1' code_nm, '배경 어둡기 입력 상한(1 이하)' dtl_expl, 18 sort_seq FROM dual UNION ALL
    SELECT 'VOLUMEMIN' code, '0' code_nm, '음량 입력 하한(0 이상)' dtl_expl, 19 sort_seq FROM dual UNION ALL
    SELECT 'VOLUMEMAX' code, '1' code_nm, '음량 입력 상한(1 이하)' dtl_expl, 20 sort_seq FROM dual UNION ALL
    SELECT 'VQRATIOMIN' code, '0' code_nm, '완료 비율 입력 하한(0 이상)' dtl_expl, 21 sort_seq FROM dual UNION ALL
    SELECT 'VQRATIOMAX' code, '1' code_nm, '완료 비율 입력 상한(1 이하)' dtl_expl, 22 sort_seq FROM dual UNION ALL
    SELECT 'HIDEDAYSMIN' code, '1' code_nm, '숨김 일수 입력 하한(1 이상)' dtl_expl, 23 sort_seq FROM dual UNION ALL
    SELECT 'HIDEDAYSMAX' code, '3650' code_nm, '숨김 일수 입력 상한(3650 이하)' dtl_expl, 24 sort_seq FROM dual
) s ON (t.code_type = '0101' AND t.code = s.code)
WHEN NOT MATCHED THEN
    INSERT (code_type, code, code_nm, dtl_expl, sort_seq, reg_dttm, chng_dttm)
    VALUES ('0101', s.code, s.code_nm, s.dtl_expl, s.sort_seq, SYSTIMESTAMP, SYSTIMESTAMP);

COMMIT;

-- 확인(24건): SELECT code, code_nm, sort_seq FROM CLOVER_CODE WHERE code_type = '0101' ORDER BY sort_seq;
EXIT
