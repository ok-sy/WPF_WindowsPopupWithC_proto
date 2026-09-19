/**
 * @interface CLPriv
 *
 * 권한
 */
export interface CLPriv {
  /**
   * 권한 ID
   */
  privId: string;

  /**
   * 권한 이름
   */
  privNm: string;

  /**
   * 세부 설명
   */
  dtlExpl?: string;
}
