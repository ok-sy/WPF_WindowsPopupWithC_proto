import { CLNavItemTypeKey } from '../enum-types';
/**
 * @interface CLNavPage
 *
 * 메뉴 페이지 항목
 */
export interface CLNavPage {
  /**
   * 페이지ID, 일련번호
   * 섹션ID와 페이지ID 일련번호는 중복되지 않는다.
   * 고유 식별자로 사용가능
   */
  pageId: number;

  /**
   * 아이템 타입, 고정값 'PAGE'
   * CLNavItemTypeKey
   * 섹션인지 페이지인지
   */
  itemType: 'PAGE';

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

  /**
   * 숨김 여부
   */
  hidden: boolean;
}
