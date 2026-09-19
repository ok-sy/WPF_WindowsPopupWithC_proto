package server.domain.entity;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailTransInfo {
    private String emailTracsceiveDatetime; // 이메일송수신시간
    private String emailTransceiveTypeCd; // 이메일송수신타입
    private String empId; // 사번
    private String opponentEmailDomainAddr; // 상대방메일도메인주소
    private String fileAttachYn; // 첨부파일여부
    private long fileAttachSize; // 첨부파일용량
    private String emailTitle; // 이메일제목
    private String departmentCd; // 부서코드
    private String regDatetime; // 등록시간
    private String inspectionYn; // 점검대상여부
    private String callRuleResult; // 룰호출결과
}
