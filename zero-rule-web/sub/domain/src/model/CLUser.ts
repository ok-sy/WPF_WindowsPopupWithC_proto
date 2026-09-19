import { CLUserStateKey } from '../enum-types';

/**
 * @interface CLUser
 *
 * 사용자
 */
export interface CLUser {
  /**
   * 사용자 아이디
   */
  userId: number;

  /**
   * 로그인 아이디
   */
  lgonId: string;

  /**
   * 비밀번호
   */
  pswd: string;

  /**
   * 사용자 이름
   */
  userNm: string;

  /**
   * 생년월일
   */
  bryyMndy?: string;

  /**
   * 사용자핸드폰번호
   */
  userTno?: string;

  /**
   * 사용자내선번호
   */
  userExno?: string;

  /**
   * CTI사용자고유번호
   */
  ctiUserNtno?: string;

  /**
   * 프린트가능여부
   */
  prtPosbYn: 'Y' | 'N';

  /**
   * 다운로드가능여부
   */
  dwnlPosbYn: 'Y' | 'N';

  /**
   * 야간여부
   */
  atntYn: 'Y' | 'N';

  /**
   * 팀아이디
   */
  teamId?: number;

  /**
   * 사용자등급
   */
  userGd: string;

  /**
   * 사용자 상태
   */
  userState: CLUserStateKey;

  /**
   * 로그인 실패 횟수
   */
  lgonFailCnt: number;

  /**
   * 비밀번호 초기화여부
   */
  pswdInitYn: 'Y' | 'N';

  /**
   * 최종비밀번호변경일시
   */
  lastPswdChngDttm?: number;

  /**
   * 최종 로그인 일시
   */
  lastLgonDttm?: number;

  /**
   * 메모
   */
  memo?: string;

  /**
   * 생성일
   */
  regDttm: number;

  /**
   * 등록 사용자 ID
   */
  regrId?: string;

  /**
   * 수정일
   */
  chngDttm: number;

  /**
   * 변경 사용자 ID
   */
  chgrId?: string;

  /**
   * 팀 이름
   */
  teamNm?: string;
}

export interface CLUserCreateParam {
  lgonId: string;
  userName: string;
  userState: CLUserStateKey;
  regrId?: string;
  bryyMndy?: string;
  userTno?: string;
  userExno?: string;
  userGd?: string;
  ctiUserNtno?: string;
  prtPosbYn?: 'Y' | 'N';
  dwnlPosbYn?: 'Y' | 'N';
  atntYn?: 'Y' | 'N';
  memo?: string;
  teamId?: number;
}
