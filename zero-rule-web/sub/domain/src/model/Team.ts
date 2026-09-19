/**
 * @interface Team
 *
 * 팀
 */
export interface Team {
  /**
   * 팀 아이디
   */
  teamId: number;

  /**
   * 팀 명
   */
  teamNm: string;

  /**
   * 팀 설명
   */
  teamExpl?: string;

  /**
   * 개인설정 허용여부
   */
  psnlStupAcceYn: 'Y' | 'N';

  /**
   * 팀 공통 설정 내용
   */
  teamCmmnStupCn?: string;

  /**
   * 팀 상태
   */
  teamStat?: string;

  /**
   * 팀 업무 구분
   */
  teamTskClsf?: number;

  /**
   * 등록일시
   */
  regDttm: number;

  /**
   * 등록자 아이디
   */
  regrId: string;

  /**
   * 변경일시
   */
  chngDttm?: number;

  /**
   * 변경자 아이디
   */
  chgrId?: string;

  /**
   * 사용자 건수
   */
  userCnt: string;
}
