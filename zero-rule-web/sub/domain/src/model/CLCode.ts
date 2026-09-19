import { CLCodeKey } from './CLCodeKey';

/**
 * @interface CLCode
 *
 * 공통 코드
 */
export interface CLCode extends CLCodeKey {
  /**
   * 코드 그룹 이름
   */
  codeTypeNm: string;

  /**
   * 코드 이름
   * ex) 기업은행
   */
  codeNm: string;

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
