/**
 * @interface CLMsgMngCreateParams
 *
 * NAV는 메뉴들의 모음을 의미합니다.
 */
export interface CLMsgMngCreateParams {
  msgClsf: string; //메시지 타입
  tskClsfCd: string; //업무구분코드
  teamId?: string; //팀 아이디
  occrClsfCd: string; //발생구분코드
  msgPrntCd: string; //메시지출력코드
  msgCn: string; //메시지내용
}
