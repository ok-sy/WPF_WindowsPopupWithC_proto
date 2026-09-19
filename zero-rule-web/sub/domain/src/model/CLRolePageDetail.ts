import { CLRolePage } from './CLRolePage';
/**
 * @interface CLRolePageDetail
 *
 * 역할
 */
export interface CLRolePageDetail extends CLRolePage {
  /**
   * 페이지 키
   */
  pageKey?: string;

  /**
   * 페이지 이름
   */
  pageNm: string;
}
