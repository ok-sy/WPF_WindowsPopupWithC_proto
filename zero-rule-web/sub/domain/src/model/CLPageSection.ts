/**
 * @interface CLPageSection
 *
 * 메뉴 섹션
 */
export interface CLPageSection {
  /**
   * 섹션ID, 일련번호
   */
  sectionId: number;

  /**
   * 섹션 이름
   */
  sectionNm: string;

  /**
   * 섹션 아이콘
   * ex) face
   */
  icon?: string;
}
