/**
 * @interface CLPage
 *
 * 메뉴 페이지
 */
export interface CLPage {
  /**
   * 페이지ID, 일련번호
   * 섹션ID와 페이지ID 일련번호는 중복되지 않는다.
   * 고유 식별자로 사용가능
   */
  pageId: number;

  /**
   * 페이지 이름
   */
  pageNm: string;

  /**
   * 페이지 키
   * ex) 0001, 0002, ...
   */
  pageKey?: string;

  /**
   * URL
   * ex) /app-logs/list
   */
  url: string;

  /**
   * 메뉴 아이콘
   * ex) face
   */
  icon?: string;
}
