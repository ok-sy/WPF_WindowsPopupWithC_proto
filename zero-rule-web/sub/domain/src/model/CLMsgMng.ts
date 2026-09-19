/**
 * @interface CLMsgMng
 */

export interface CLMsgMng {
  /**
   * 메시지 아이디
   */
  msgId: string;

  /**
   * 메시지 타입
   */
  msgClsf: string;

  /**
   * 업무구분코드
   */
  tskClsfCd: string;

  /**
   * 팀 아이디
   */
  teamId: number;

  /**
   * 팀 이름
   */
  teamNm: string;

  /**
   * 발생구분코드
   */
  occrClsfCd: string;

  /**
   * 메시지출력코드
   */
  msgPrntCd: string;

  /**
   * 메시지 내용
   */
  msgCn: string;

  /**
   * 메시지사용여부
   */
  useYn: string;

  /**
   * 등록 일시
   */
  regDttm: number;

  /**
   * 등록자 ID
   */
  regrId: string;

  /**
   * 변경 일시
   */
  chngDttm: number;

  /**
   * 변경자 ID
   */
  chgrId: string;
}
