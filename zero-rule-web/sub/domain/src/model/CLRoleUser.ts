/**
 * @interface CLRoleUser
 *
 * 역할
 */
export interface CLRoleUser {
  /**
   * 사용자 ID
   */
  userId: number;

  /**
   * 로그인 ID
   */
  lgonId: string;

  /**
   * 사용자 명
   */
  userNm: string;

  /**
   * 팀 아이디
   */
  teamId: string;

  /**
   * 팀명
   */
  teamNm: string;
}
