/**
 * @interface EmailTransInfo 전체목록
 */
export interface EmailTransInfo {
  emailTracsceiveDatetime: string; // 이메일송수신시간
  emailTransceiveTypeCd: string; // 이메일송수신타입
  empId: string; // 사번
  opponentEmailDomainAddr: string; // 상대방메일도메인주소
  fileAttachYn: string; // 첨부파일여부
  fileAttachSize: number; // 첨부파일용량
  emailTitle: string; // 이메일제목
  departmentCd: string; // 부서코드
  regDatetime: string; // 등록시간
  inspectionYn: string; // 점검대상여부
  callRuleResult: string; // 룰호출결과
}
