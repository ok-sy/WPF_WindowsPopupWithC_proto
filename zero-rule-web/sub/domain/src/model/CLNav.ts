/**
 * @interface CLNav
 *
 * NAV는 메뉴들의 모음을 의미합니다.
 */
export interface CLNav {
  /**
   * PK, NAV_ID, 일련번호
   */
  navId: number;

  /**
   * nav 이름
   * ex) 기본, 부장님 메뉴, 사장님 메뉴, 개발자용 메뉴
   */
  navNm: string;

  /**
   * 설명
   * ex) 기본
   */
  expl?: string;
}
