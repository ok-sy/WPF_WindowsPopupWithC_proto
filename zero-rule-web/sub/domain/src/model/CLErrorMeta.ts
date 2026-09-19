/**
 * @interface CLErrorMeta 에러코드
 */
export interface CLErrorMeta {
  /**
   * 에러 이름
   * 사람이 인지할 수 있는 형태의 에러 이름
   * ex) E1_NO_SUCH_USER
   */
  errorName: string;

  /**
   * 에러 키
   * 에러 코드에 대한 일련번호
   * ex) 001, 002, 999
   */
  errorKey: string;

  /**
   * 에러 메시지
   */
  errorMessage?: string;
}
