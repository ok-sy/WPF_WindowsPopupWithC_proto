/**
 * @interface PagerData 페이지 데이터
 */
export interface PagerData<T> {
  /**
   * 데이터 배열
   */
  elements: T[];

  /**
   * 총 데이터 건수
   */
  totalElements: number;

  /**
   * 총 페이지 건수
   */
  totalPages: number;

  /**
   * 페이지 번호
   */
  pageNumber: number;

  /**
   * 데이터 오프셋
   */
  offset: number;

  /**
   * 페이지당 데이터 건수
   */
  rowsPerPage: number;
}
