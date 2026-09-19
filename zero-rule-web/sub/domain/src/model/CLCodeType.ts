/**
 * @interface CLCodeType
 *
 * 공통 코드 그룹
 */
export interface CLCodeType {
  /**
   * PK, 코드유형
   * ex) BANK_CLS or 0001
   */
  codeType: string;

  /**
   * 코드 그룹 이름
   */
  codeTypeNm: string;

  /**
   * 세부설명
   */
  dtlExpl?: string;

  /**
   * 등록 사용자ID
   */
  regrId?: string;

  /**
   * 변경 사용자ID
   */
  chgrId?: string;

  /**
   * 변경일시
   */
  chngDttm: number;

  /**
   * 등록일시
   */
  regDttm: number;
}
