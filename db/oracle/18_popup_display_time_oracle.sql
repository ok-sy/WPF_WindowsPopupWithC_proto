-- =====================================================================================================
-- 18_popup_display_time_oracle.sql — 게시 기간 안 노출 시간대 테이블 추가 (2026-10-21)
-- POL-11-03 : 시간 경계
-- -----------------------------------------------------------------------------------------------------
-- 배경: 게시 기간(DISPLAY_START_AT~DISPLAY_END_AT) 안에서 요일·시간대를 지정해 미완료 팝업의 노출 가능 일정을 정한다.
--       요일은 기존 POPUP_NOTICE.REPEAT_DAY_OF_WEEK(ISO 번호 '1,3,5', 1=월, NULL=매일), 모드는 PERIOD_MODE
--       (FIXED=기간 내 상시, SCHEDULE=요일·시간대 지정)를 재사용한다. 시간대는 개수 제한이 없어 하위 테이블로 둔다.
--       분 단위(0~1439)로 저장하며 END_MINUTE < START_MINUTE은 자정을 넘는 시간대(요일은 시작 시각 기준)다.
--       시간대 행이 없으면 하루 종일이다. 판단은 서버 KST 기준이며 WPF 조회 응답에는 싣지 않는다.
-- 처리: POPUP_DISPLAY_TIME 테이블(PK POPUP_ID+SORT_ORDER, POPUP_NOTICE 삭제 시 함께 삭제) 생성.
--       11g 호환을 위해 IDENTITY·시퀀스 없이 복합 키를 쓴다.
-- 순서: 서버 반영 전에 실행. 새 서버는 저장·조회·노출 판단에서 이 테이블을 사용하므로 없으면 ORA-00942로 실패한다.
--       이전 서버는 이 테이블을 쓰지 않으므로 실행 후에도 동작한다.
--       팝업 테이블 소유 계정과 앱 계정이 다르면(방식 A) 03_grant_zero_rule_oracle.sql을 다시 실행해 권한을 준다.
-- 실행: 팝업 테이블이 있는 계정으로 SQL*Plus 실행 (NLS_LANG=KOREAN_KOREA.AL32UTF8).
--       - 로컬 XE(POPUP 계정 스키마)      : @18_popup_display_time_oracle.sql POPUP.
--       - 원격 개발 DB(앱 계정 zero-rule) : @18_popup_display_time_oracle.sql ""
-- 되돌리기: DROP TABLE <접두어>POPUP_DISPLAY_TIME;  (저장된 시간대는 사라지고 SCHEDULE 팝업은 하루 종일로 판단된다)
--           여러 번 실행해도 결과가 같다.
-- =====================================================================================================
SET PAGESIZE 200 LINESIZE 250 TRIMSPOOL ON FEEDBACK ON DEFINE ON SERVEROUTPUT ON
-- 빈 인자("")도 받도록 DEFINE 대신 NEW_VALUE로 접두어를 받는다(DEFINE S = &1 은 빈 값에서 SP2-0137 오류).
COLUMN schema_prefix NEW_VALUE S NOPRINT
SELECT '&1' schema_prefix FROM DUAL;
WHENEVER SQLERROR EXIT FAILURE

PROMPT === 1. 노출 시간대 테이블 생성 ===
DECLARE
    PROCEDURE run(p_sql VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_sql;
        DBMS_OUTPUT.PUT_LINE('OK   ' || SUBSTR(p_sql, 1, 100));
    EXCEPTION
        WHEN OTHERS THEN
            -- ORA-00955: 이미 있는 이름 → 재실행으로 보고 건너뛴다
            IF SQLCODE = -955 THEN
                DBMS_OUTPUT.PUT_LINE('SKIP ' || SUBSTR(p_sql, 1, 100));
            ELSE
                RAISE;
            END IF;
    END;
BEGIN
    run('CREATE TABLE &S.POPUP_DISPLAY_TIME ('
        || ' POPUP_ID VARCHAR2(50 CHAR) NOT NULL,'
        || ' SORT_ORDER NUMBER(10) NOT NULL,'
        || ' START_MINUTE NUMBER(4) NOT NULL,'
        || ' END_MINUTE NUMBER(4) NOT NULL,'
        || ' CREATED_BY VARCHAR2(30 CHAR) NOT NULL,'
        || ' CREATED_AT TIMESTAMP(6) DEFAULT CAST(SYSTIMESTAMP AT TIME ZONE ''Asia/Seoul'' AS TIMESTAMP) NOT NULL,'
        || ' CONSTRAINT PK_POPUP_DISPLAY_TIME PRIMARY KEY (POPUP_ID, SORT_ORDER),'
        || ' CONSTRAINT FK_DISPLAY_TIME_POPUP FOREIGN KEY (POPUP_ID) REFERENCES &S.POPUP_NOTICE (POPUP_ID) ON DELETE CASCADE,'
        || ' CONSTRAINT CK_DISPLAY_TIME_ORDER CHECK (SORT_ORDER >= 1),'
        || ' CONSTRAINT CK_DISPLAY_TIME_RANGE CHECK (START_MINUTE BETWEEN 0 AND 1439 AND END_MINUTE BETWEEN 0 AND 1439'
        || ' AND START_MINUTE <> END_MINUTE))');
END;
/
-- 주석은 매번 다시 단다(멱등).
COMMENT ON TABLE  &S.POPUP_DISPLAY_TIME IS '게시 기간 안 노출 시간대(PERIOD_MODE=SCHEDULE). 행이 없으면 하루 종일';
COMMENT ON COLUMN &S.POPUP_DISPLAY_TIME.START_MINUTE IS '시작 분(0~1439, KST). 포함';
COMMENT ON COLUMN &S.POPUP_DISPLAY_TIME.END_MINUTE IS '종료 분(0~1439, KST). 미포함. START보다 작으면 다음 날로 넘어가는 시간대(요일은 시작 기준)';
COMMENT ON COLUMN &S.POPUP_NOTICE.PERIOD_MODE IS 'FIXED(게시 기간 내 상시) / SCHEDULE(게시 기간 안 요일·시간대 지정, TODO52-1)';
COMMENT ON COLUMN &S.POPUP_NOTICE.REPEAT_DAY_OF_WEEK IS 'SCHEDULE 노출 요일 ISO 번호 목록(예: 1,3,5 / 1=월). NULL = 매일';

PROMPT === 2. 확인 (테이블 1 이어야 함) ===
SELECT COUNT(*) AS DISPLAY_TIME_TABLE FROM ALL_TABLES
 WHERE OWNER = NVL(RTRIM('&S', '.'), USER) AND TABLE_NAME = 'POPUP_DISPLAY_TIME';
EXIT
