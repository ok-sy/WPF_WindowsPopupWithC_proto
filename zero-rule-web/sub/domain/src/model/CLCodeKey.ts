/**
 * @interface CLCodeKey
 *
 * 공통 코드 키
 */
export interface CLCodeKey {
  /**
   * PK1, 코드유형
   * ex) BANK_CLS or 0001
   */
  codeType: string;

  /**
   * PK2, 코드
   * ex) 01
   */
  code: string;
}
