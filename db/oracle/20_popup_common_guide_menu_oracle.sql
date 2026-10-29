-- =====================================================================
--  zero-rule-web 메뉴 데이터 — "PopupcommonComponent 가이드" 페이지 등록 (Oracle)
-- =====================================================================
--  용도 : 관리자 웹 사이드바의 "팝업 관리" 그룹에 가이드 화면(/popup-common-guide,
--         features/PopupcommonComponent/guide/PopupCommonGuide)을 추가한다. *데이터만* 추가한다.
--  전제 : 04_popup_web_menu_oracle.sql 실행 완료("팝업 관리" 그룹과 /rgst-pop 메뉴 항목이 있어야 한다).
--  내용 : 1) PAGE     "PopupcommonComponent 가이드" — url /popup-common-guide, 아이콘 Description,
--                     page_key 는 기존 4자리 이하 숫자 키 최대값 + 1(04와 같은 규칙).
--         2) NAV_ITEM — /rgst-pop 항목이 있는 모든 NAV에 같은 그룹(section)으로, 팝업 등록 바로 뒤(sort_no + 10)에 추가.
--  ID    : CLOVERFRAMEWORK_SEQ 로 채번한다(04와 동일).
--  실행  : 앱 계정(zero-rule)으로 접속해 실행한다. 원격 개발 DB는 db\oracle\tools\apply-dev-db.ps1 20_popup_common_guide_menu_oracle.sql
--  멱등  : url·nav 로 존재 여부를 확인하고 없는 것만 넣는다.
--  되돌리기 : 파일 끝의 주석 블록 참고.
-- =====================================================================

SET SERVEROUTPUT ON
SET DEFINE OFF

DECLARE
    v_page_id   CLOVER_PAGE.page_id%TYPE;
    v_page_key  CLOVER_PAGE.page_key%TYPE;
    v_cnt       PLS_INTEGER;
BEGIN
    ------------------------------------------------------------------
    -- 1) 페이지(PAGE) — url 은 zero-rule-web scene-router 의 '/popup-common-guide'
    ------------------------------------------------------------------
    BEGIN
        SELECT page_id INTO v_page_id FROM CLOVER_PAGE WHERE url = '/popup-common-guide' AND ROWNUM = 1;
        DBMS_OUTPUT.PUT_LINE('PAGE    기존 사용: ' || v_page_id);
    EXCEPTION WHEN NO_DATA_FOUND THEN
        SELECT TO_CHAR(NVL(MAX(TO_NUMBER(page_key)), 0) + 1)
          INTO v_page_key
          FROM CLOVER_PAGE
         WHERE REGEXP_LIKE(page_key, '^[0-9]{1,4}$');
        SELECT CLOVERFRAMEWORK_SEQ.NEXTVAL INTO v_page_id FROM DUAL;
        INSERT INTO CLOVER_PAGE (page_id, page_key, page_nm, url, icon, dtl_expl)
        VALUES (v_page_id, v_page_key, 'PopupcommonComponent 가이드', '/popup-common-guide', 'Description',
                '팝업 공통 컴포넌트 사용 안내·변경 공지');
        DBMS_OUTPUT.PUT_LINE('PAGE    추가: ' || v_page_id || ' (page_key=' || v_page_key || ')');
    END;

    ------------------------------------------------------------------
    -- 2) /rgst-pop 항목이 있는 NAV마다 같은 그룹·바로 뒤 순서로 추가
    ------------------------------------------------------------------
    FOR r IN (SELECT i.nav_id, i.section_id, i.sort_no
                FROM CLOVER_NAV_ITEM i
                JOIN CLOVER_PAGE p ON p.page_id = i.page_id
               WHERE p.url = '/rgst-pop') LOOP
        SELECT COUNT(*) INTO v_cnt FROM CLOVER_NAV_ITEM WHERE nav_id = r.nav_id AND page_id = v_page_id;
        IF v_cnt = 0 THEN
            INSERT INTO CLOVER_NAV_ITEM (item_id, nav_id, page_id, section_id, sort_no)
            VALUES (CLOVERFRAMEWORK_SEQ.NEXTVAL, r.nav_id, v_page_id, r.section_id, r.sort_no + 10);
            DBMS_OUTPUT.PUT_LINE('ITEM    추가: nav ' || r.nav_id || ' / 가이드 (sort ' || (r.sort_no + 10) || ')');
        ELSE
            DBMS_OUTPUT.PUT_LINE('ITEM    기존 사용: nav ' || r.nav_id);
        END IF;
    END LOOP;

    COMMIT;
END;
/

-- 확인
SELECT n.nav_nm, s.section_nm, p.page_nm, p.url, p.page_key, i.sort_no
  FROM CLOVER_NAV_ITEM i
  JOIN CLOVER_NAV  n ON n.nav_id  = i.nav_id
  JOIN CLOVER_PAGE p ON p.page_id = i.page_id
  LEFT JOIN CLOVER_PAGE_SECTION s ON s.section_id = i.section_id
 WHERE p.url IN ('/rgst-pop', '/popup-common-guide')
 ORDER BY n.nav_id, i.sort_no;

-- ---------------------------------------------------------------------
-- 되돌리기 (필요할 때만 수동 실행)
-- ---------------------------------------------------------------------
-- DELETE FROM CLOVER_NAV_ITEM WHERE page_id IN (SELECT page_id FROM CLOVER_PAGE WHERE url = '/popup-common-guide');
-- DELETE FROM CLOVER_PAGE     WHERE url = '/popup-common-guide';
-- COMMIT;
