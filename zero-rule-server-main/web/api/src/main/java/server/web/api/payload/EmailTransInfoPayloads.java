package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.entity.EmailTransInfo;

import java.util.List;

public class EmailTransInfoPayloads {
//    @Schema(description = "송수신이메일 응답 데이터")
//    @Builder
//    @Data
//    public static class EmailTransInfoListResponse {
//        @Schema(description = "송수신이메일 정보")
//        private CLPagerData<EmailTransInfo> list;
//    }
    @Schema(description = "송수신이메일 응답 데이터")
    @Builder
    @Data
    public static class EmailTransInfoListResponse {
        @Schema(description = "송수신이메일 정보")
        private List<EmailTransInfo> list;
    }

    @Schema(description = "송수신이메일 요청 데이터")
    @Data
    public static class EmailTransInfoListRequest {
//        @Schema(description = "사번")
//        private int pageNumber;
//        @Schema(description = "사번")
//        private int rowsPerPage;

        @Schema(description = "사번")
        private String empId;

        @Schema(description = "송수신타입")
        private String emailTransceiveTypeCd;

        @Schema(description = "시작일")
        private String fromDt;

        @Schema(description = "종료일")
        private String toDt;
    }
}
