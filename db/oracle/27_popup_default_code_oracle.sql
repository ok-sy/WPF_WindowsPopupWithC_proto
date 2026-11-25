-- =====================================================================================================
-- 27_popup_default_code_oracle.sql — 팝업 기본값·입력 범위 공통코드(0101) 등록 (2026-11-25)
-- POL-01-02 : 기본값의 적용
-- -----------------------------------------------------------------------------------------------------
-- 배경: 관리자 웹의 팝업 기본값(창 크기·최소·최대·비율·배경 어둡기·음량·완료 비율)과 입력 허용 범위를
--       코드 관리 화면에서 바꿀 수 있게 공통코드 그룹 0101로 둔다. 웹은 popupDefaults.ts(applyPopupDefaultCodes)가 읽는다.
-- 형식: CODE = 키(영문 대문자·숫자, 관리 화면 규칙), CODE_NM = 값(숫자 문자열), DTL_EXPL = 설명.
--       기본값 키: WIDTH·HEIGHT·WRATIO·HRATIO·MINW·MINH·MAXW·MAXH·OVERLAY·VOLUME·VQRATIO.
--       범위 키: <접두어>MIN / <접두어>MAX (RATIO·FONT·OVERLAY·VOLUME·VQRATIO·HIDEDAYS).
--       창 크기는 범위 키가 없다 — 기본 창 최소 크기 MINW·MINH가 가로·세로 입력 하한을 겸한다(SIZEMIN 삭제, 2026-11-25. 이미 넣은 DB는 28 스크립트로 삭제).
--       범위는 서버·WPF 계약 범위(창 300 이상, 비율 0.1~1, 글자 10~40, 0~1, 숨김 1~3650) 안에서만 좁힐 수 있다. 밖의 값·숫자 아닌 값은 웹이 무시한다.
-- 값: 현재 파일 기본값과 같다(넣어도 화면 동작은 바뀌지 않음).
-- 처리: 코드 그룹과 코드가 없을 때만 넣는다. 이미 있으면 바꾸지 않는다(관리 화면에서 고친 값 보존).
-- 범위: 로컬 XE·원격 개발 DB. 폐쇄망은 0101 그룹이 비어 있는지 확인한 뒤 실행하거나 코드 관리 화면으로 입력한다
--       (폐쇄망 CLOVER_CODE에는 SORT_SEQ가 더 있고 NULL 허용이라 이 스크립트는 넣지 않는다).
-- 실행: 공통 테이블이 있는 앱 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
-- =====================================================================================================
SET DEFINE OFF
WHENEVER SQLERROR EXIT FAILURE ROLLBACK

MERGE INTO CLOVER_CODE_TYPE t
USING (SELECT '0101' code_type, '팝업 기본값' code_type_nm, '팝업 등록 화면 기본값·입력 허용 범위(CODE=키, CODE_NM=값)' dtl_expl FROM dual) s
ON (t.code_type = s.code_type)
WHEN NOT MATCHED THEN
    INSERT (code_type, code_type_nm, dtl_expl, reg_dttm, chng_dttm)
    VALUES (s.code_type, s.code_type_nm, s.dtl_expl, SYSTIMESTAMP, SYSTIMESTAMP);

MERGE INTO CLOVER_CODE t
USING (
    SELECT 'WIDTH' code, '560' code_nm, '기본 창 너비(px, 고정 크기)' dtl_expl FROM dual UNION ALL
    SELECT 'HEIGHT', '420', '기본 창 높이(px, 고정 크기)' FROM dual UNION ALL
    SELECT 'WRATIO', '0.7', '기본 화면 너비 비율(화면 비율 모드)' FROM dual UNION ALL
    SELECT 'HRATIO', '0.75', '기본 화면 높이 비율(화면 비율 모드)' FROM dual UNION ALL
    SELECT 'MINW', '300', '기본 창 최소 너비·가로 입력 하한(px, 300 이상)' FROM dual UNION ALL
    SELECT 'MINH', '300', '기본 창 최소 높이·세로 입력 하한(px, 300 이상)' FROM dual UNION ALL
    SELECT 'MAXW', '1200', '기본 창 최대 너비(px)' FROM dual UNION ALL
    SELECT 'MAXH', '900', '기본 창 최대 높이(px)' FROM dual UNION ALL
    SELECT 'OVERLAY', '0.45', '기본 배경 어둡기(0~1)' FROM dual UNION ALL
    SELECT 'VOLUME', '0.7', '기본 영상 음량(0~1)' FROM dual UNION ALL
    SELECT 'VQRATIO', '0.8', '동영상+퀴즈 기본 완료 비율(0~1)' FROM dual UNION ALL
    SELECT 'RATIOMIN', '0.1', '화면 비율 입력 하한(0.1 이상)' FROM dual UNION ALL
    SELECT 'RATIOMAX', '1', '화면 비율 입력 상한(1 이하)' FROM dual UNION ALL
    SELECT 'FONTMIN', '10', '글자 크기 입력 하한(10 이상)' FROM dual UNION ALL
    SELECT 'FONTMAX', '40', '글자 크기 입력 상한(40 이하)' FROM dual UNION ALL
    SELECT 'OVERLAYMIN', '0', '배경 어둡기 입력 하한(0 이상)' FROM dual UNION ALL
    SELECT 'OVERLAYMAX', '1', '배경 어둡기 입력 상한(1 이하)' FROM dual UNION ALL
    SELECT 'VOLUMEMIN', '0', '음량 입력 하한(0 이상)' FROM dual UNION ALL
    SELECT 'VOLUMEMAX', '1', '음량 입력 상한(1 이하)' FROM dual UNION ALL
    SELECT 'VQRATIOMIN', '0', '완료 비율 입력 하한(0 이상)' FROM dual UNION ALL
    SELECT 'VQRATIOMAX', '1', '완료 비율 입력 상한(1 이하)' FROM dual UNION ALL
    SELECT 'HIDEDAYSMIN', '1', '숨김 일수 입력 하한(1 이상)' FROM dual UNION ALL
    SELECT 'HIDEDAYSMAX', '3650', '숨김 일수 입력 상한(3650 이하)' FROM dual
) s ON (t.code_type = '0101' AND t.code = s.code)
WHEN NOT MATCHED THEN
    INSERT (code_type, code, code_nm, dtl_expl, reg_dttm, chng_dttm)
    VALUES ('0101', s.code, s.code_nm, s.dtl_expl, SYSTIMESTAMP, SYSTIMESTAMP);

COMMIT;
EXIT
