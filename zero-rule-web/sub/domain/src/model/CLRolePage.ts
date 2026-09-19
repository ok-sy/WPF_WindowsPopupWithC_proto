/**
 * @interface CLRolePage
 *
 * 역할
 */
export interface CLRolePage {
  /**
   * 롤 ID
   */
  roleId: string;

  /**
   * 페이지 ID
   */
  pageId: number;

  /**
   * create 권한 여부
   */
  c: boolean;

  /**
   * read 권한 여부
   */
  r: boolean;

  /**
   * update 권한 여부
   */
  u: boolean;

  /**
   * delete 권한 여부
   */
  d: boolean;
}
