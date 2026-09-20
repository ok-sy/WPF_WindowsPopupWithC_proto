-- =====================================================================
--  zero-rule-web 메뉴 데이터 — 팝업 관리 폴더(NAV)·그룹(SECTION)·페이지 등록 (Oracle)
-- =====================================================================
--  용도 : 관리자 웹(zero-rule-web)의 사이드바에 "팝업 등록" 화면(/rgst-pop, features/RgstPop)이 나오도록
--         공통 메뉴 테이블에 *데이터만* 추가한다. 코드 변경 없음(기준: 공통 프레임워크는 구조 변경 없이 추가만).
--  배경 : zero-rule-web 사이드바는 정적 side-menu-list 가 아니라 DB 메뉴를 쓴다.
--           로그인 사용자 CLOVER_USER.nav_id
--             → CLOVER_NAV           (웹 "Nav 관리" 화면의 폴더 아이콘 항목 = 폴더)
--             → CLOVER_NAV_ITEM      (nav 안의 정렬 항목; section_id 가 있으면 그룹 아래, 없으면 최상위)
--             → CLOVER_PAGE_SECTION  (웹 메뉴 편집의 "새 그룹 추가" = 그룹)
--             → CLOVER_PAGE          (페이지 목록의 페이지; url 이 scene-router 의 경로와 같아야 한다)
--         팝업 등록 페이지는 scene-router 에는 있지만(/rgst-pop) DB 메뉴에 등록되지 않아 사이드바에 보이지 않았다.
--  내용 : 1) NAV      "팝업 관리"  — 팝업 전용 폴더. 사용자의 nav_id 를 이 값으로 바꾸면 팝업 메뉴만 보인다.
--         2) SECTION  "팝업 관리"  — 그룹(아이콘 FolderOutlined).
--         3) PAGE     "팝업 등록"  — url /rgst-pop, page_key 는 기존 최대 숫자 키 + 1.
--         4) NAV_ITEM — (a) 새 NAV: CLOVER 메인(기존 페이지 117063, 다른 NAV 와 같은 첫 항목) + 그룹/팝업 등록
--                       (b) 기존 "관리자 메뉴"(nav_id 2, master 사용자) 끝에 같은 그룹/팝업 등록 항목 추가
--  ID    : 공통 프레임워크가 쓰는 CLOVERFRAMEWORK_SEQ 로 채번한다(cloverframework CLSequenceMapper 와 동일).
--  실행  : 앱 계정(zero-rule)으로 접속해 실행한다. 공통 테이블은 앱 계정 스키마에 있다.
--         $env:NLS_LANG = "KOREAN_KOREA.AL32UTF8"
--         sqlplus zero-rule/<pw>@//192.168.114.71:4004/XE @04_popup_web_menu_oracle.sql
--  멱등  : 이름·url 로 존재 여부를 확인하고 없는 것만 넣으므로 여러 번 실행해도 중복되지 않는다.
--  되돌리기 : 파일 끝의 주석 블록 참고.
-- =====================================================================

SET SERVEROUTPUT ON
SET DEFINE OFF

DECLARE
    v_nav_id        CLOVER_NAV.nav_id%TYPE;
    v_section_id    CLOVER_PAGE_SECTION.section_id%TYPE;
    v_page_id       CLOVER_PAGE.page_id%TYPE;
    v_main_page_id  CLOVER_PAGE.page_id%TYPE;          -- "CLOVER 메인"(/clover-main), 다른 NAV 의 첫 항목
    v_admin_nav_id  CLOVER_NAV.nav_id%TYPE;            -- "관리자 메뉴"(master 사용자의 nav)
    v_page_key      CLOVER_PAGE.page_key%TYPE;
    v_sort_no       CLOVER_NAV_ITEM.sort_no%TYPE;
    v_cnt           PLS_INTEGER;
BEGIN
    ------------------------------------------------------------------
    -- 1) 폴더(NAV) "팝업 관리"
    ------------------------------------------------------------------
    BEGIN
        SELECT nav_id INTO v_nav_id FROM CLOVER_NAV WHERE nav_nm = '팝업 관리' AND ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('NAV     기존 사용: ' || v_nav_id);
    EXCEPTION WHEN NO_DATA_FOUND THEN
        SELECT CLOVERFRAMEWORK_SEQ.NEXTVAL INTO v_nav_id FROM DUAL;
        INSERT INTO CLOVER_NAV (nav_id, nav_nm, expl)
        VALUES (v_nav_id, '팝업 관리', 'WPF 팝업 시스템 관리자 메뉴. 사용자 nav_id 를 이 값으로 두면 팝업 메뉴만 보인다.');
        DBMS_OUTPUT.PUT_LINE('NAV     추가: ' || v_nav_id);
    END;

    ------------------------------------------------------------------
    -- 2) 그룹(SECTION) "팝업 관리"
    ------------------------------------------------------------------
    BEGIN
        SELECT section_id INTO v_section_id FROM CLOVER_PAGE_SECTION WHERE section_nm = '팝업 관리' AND ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('SECTION 기존 사용: ' || v_section_id);
    EXCEPTION WHEN NO_DATA_FOUND THEN
        SELECT CLOVERFRAMEWORK_SEQ.NEXTVAL INTO v_section_id FROM DUAL;
        INSERT INTO CLOVER_PAGE_SECTION (section_id, section_nm, icon)
        VALUES (v_section_id, '팝업 관리', 'FolderOutlined');
        DBMS_OUTPUT.PUT_LINE('SECTION 추가: ' || v_section_id);
    END;

    ------------------------------------------------------------------
    -- 3) 페이지(PAGE) "팝업 등록" — url 은 zero-rule-web scene-router 의 '/rgst-pop'
    --    page_key: 웹이 4자리로 0 패딩해 조회하므로 숫자 문자열. 기존 숫자 키의 최대값 + 1.
    ------------------------------------------------------------------
    BEGIN
        SELECT page_id INTO v_page_id FROM CLOVER_PAGE WHERE url = '/rgst-pop' AND ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('PAGE    기존 사용: ' || v_page_id);
    EXCEPTION WHEN NO_DATA_FOUND THEN
        SELECT TO_CHAR(NVL(MAX(TO_NUMBER(page_key)), 0) + 1)
          INTO v_page_key
          FROM CLOVER_PAGE
         WHERE REGEXP_LIKE(page_key, '^[0-9]+$');
        SELECT CLOVERFRAMEWORK_SEQ.NEXTVAL INTO v_page_id FROM DUAL;
        INSERT INTO CLOVER_PAGE (page_id, page_key, page_nm, url, icon, dtl_expl)
        VALUES (v_page_id, v_page_key, '팝업 등록', '/rgst-pop', 'NoteAlt',
                'WPF 팝업 등록·수정·활성화 화면 (features/RgstPop)');
        DBMS_OUTPUT.PUT_LINE('PAGE    추가: ' || v_page_id || ' (page_key=' || v_page_key || ')');
    END;

    ------------------------------------------------------------------
    -- 4-a) 새 NAV 의 항목: CLOVER 메인(있으면) + 팝업 등록(그룹 아래)
    ------------------------------------------------------------------
    BEGIN
        SELECT page_id INTO v_main_page_id FROM CLOVER_PAGE WHERE url = '/clover-main' AND ROWNUM = 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        v_main_page_id := NULL;
    END;

    IF v_main_page_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_cnt FROM CLOVER_NAV_ITEM WHERE nav_id = v_nav_id AND page_id = v_main_page_id;
        IF v_cnt = 0 THEN
            INSERT INTO CLOVER_NAV_ITEM (item_id, nav_id, page_id, section_id, sort_no)
            VALUES (CLOVERFRAMEWORK_SEQ.NEXTVAL, v_nav_id, v_main_page_id, NULL, 100);
            DBMS_OUTPUT.PUT_LINE('ITEM    추가: nav ' || v_nav_id || ' / CLOVER 메인 (sort 100)');
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_cnt FROM CLOVER_NAV_ITEM WHERE nav_id = v_nav_id AND page_id = v_page_id;
    IF v_cnt = 0 THEN
        INSERT INTO CLOVER_NAV_ITEM (item_id, nav_id, page_id, section_id, sort_no)
        VALUES (CLOVERFRAMEWORK_SEQ.NEXTVAL, v_nav_id, v_page_id, v_section_id, 200);
        DBMS_OUTPUT.PUT_LINE('ITEM    추가: nav ' || v_nav_id || ' / 팝업 관리 > 팝업 등록 (sort 200)');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ITEM    기존 사용: nav ' || v_nav_id || ' / 팝업 등록');
    END IF;

    ------------------------------------------------------------------
    -- 4-b) 기존 "관리자 메뉴" NAV 끝에 같은 그룹/페이지 추가 (master 사용자가 바로 볼 수 있도록)
    ------------------------------------------------------------------
    BEGIN
        SELECT nav_id INTO v_admin_nav_id FROM CLOVER_NAV WHERE nav_nm = '관리자 메뉴' AND ROWNUM = 1;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        v_admin_nav_id := NULL;
    END;

    IF v_admin_nav_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_cnt FROM CLOVER_NAV_ITEM WHERE nav_id = v_admin_nav_id AND page_id = v_page_id;
        IF v_cnt = 0 THEN
            SELECT NVL(MAX(sort_no), 0) + 100 INTO v_sort_no FROM CLOVER_NAV_ITEM WHERE nav_id = v_admin_nav_id;
            INSERT INTO CLOVER_NAV_ITEM (item_id, nav_id, page_id, section_id, sort_no)
            VALUES (CLOVERFRAMEWORK_SEQ.NEXTVAL, v_admin_nav_id, v_page_id, v_section_id, v_sort_no);
            DBMS_OUTPUT.PUT_LINE('ITEM    추가: nav ' || v_admin_nav_id || '(관리자 메뉴) / 팝업 관리 > 팝업 등록 (sort ' || v_sort_no || ')');
        ELSE
            DBMS_OUTPUT.PUT_LINE('ITEM    기존 사용: nav ' || v_admin_nav_id || '(관리자 메뉴) / 팝업 등록');
        END IF;
    END IF;

    COMMIT;
END;
/

-- 확인
SELECT n.nav_id, n.nav_nm, i.sort_no, s.section_nm, p.page_nm, p.url, p.page_key
  FROM CLOVER_NAV_ITEM i
  JOIN CLOVER_NAV  n ON n.nav_id  = i.nav_id
  JOIN CLOVER_PAGE p ON p.page_id = i.page_id
  LEFT JOIN CLOVER_PAGE_SECTION s ON s.section_id = i.section_id
 WHERE n.nav_nm = '팝업 관리' OR p.url = '/rgst-pop'
 ORDER BY n.nav_id, i.sort_no;

-- ---------------------------------------------------------------------
-- 되돌리기 (필요할 때만 수동 실행)
-- ---------------------------------------------------------------------
-- DELETE FROM CLOVER_NAV_ITEM WHERE page_id IN (SELECT page_id FROM CLOVER_PAGE WHERE url = '/rgst-pop');
-- DELETE FROM CLOVER_NAV_ITEM WHERE nav_id  IN (SELECT nav_id  FROM CLOVER_NAV  WHERE nav_nm = '팝업 관리');
-- DELETE FROM CLOVER_PAGE          WHERE url = '/rgst-pop';
-- DELETE FROM CLOVER_PAGE_SECTION  WHERE section_nm = '팝업 관리';
-- DELETE FROM CLOVER_NAV           WHERE nav_nm = '팝업 관리';
-- COMMIT;
