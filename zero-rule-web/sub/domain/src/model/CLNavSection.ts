import { CLNavItemTypeKey } from '../enum-types';
import { CLNavPage } from './CLNavPage';
/**
 * @interface CLNavSection
 *
 * 메뉴 섹션 항목
 */
export interface CLNavSection {
  /**
   * 섹션 ID, 일련번호
   * 섹션ID와 페이지ID 일련번호는 중복되지 않는다.
   * 고유 식별자로 사용가능
   */
  sectionId: number;

  /**
   * 아이템 타입, 고정값 'SECTION'
   * CLNavItemTypeKey
   * 섹션인지 페이지인지
   */
  itemType: 'SECTION';

  /**
   * 섹션 이름
   */
  sectionNm: string;

  /**
   * 섹션 아이콘
   * ex) face
   */
  icon?: string;

  /**
   * 섹션 아래의 페이지들
   */
  subitems: Array<CLNavPage>;
}
