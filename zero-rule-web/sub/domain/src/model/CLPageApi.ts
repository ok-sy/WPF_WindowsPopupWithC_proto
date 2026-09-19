/**
 * @interface CLPageApi
 *
 * NAV는 메뉴들의 모음을 의미합니다.
 */
export interface CLPageApi {
  /**
   * API URL
   */
  apiUrl: string;

  /**
   * 페이지 아이디
   */
  pageId: number;

  /**
   * 권한 C R U D
   */
  privId: string;

  /**
   * 이름
   */
  apiUrlNm: string;
}
