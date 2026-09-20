package server.web.api.payload;

import cl.cloverframework.ICLMsg;
import cl.cloverframework.impl.domain.vo.CLPagerData;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.entity.CLMsgMng;
import server.sql.ParamsCLMsgMng;

import java.util.List;

public class CLMsgMngPayloads {
    @Schema(description = "메시지 목록 조회 응답 - 페이징")
    @Data
    @Builder
    public static class FindPageResponse {
        @Schema(description = "페이지 데이터")
        private CLPagerData<CLMsgMng> pagerData;
    }

    @Schema(description = "메시지 목록 조회 요청 - 페이징")
    @Data
    public static class FindPageRequest {
        @Schema(description = "페이지당 데이터 건수")
        private int rowsPerPage;

        @Schema(description = "페이지 번호, 첫번째 페이지가 0번")
        private int pageNumber;

        @Schema(description = "메시지 타입",nullable = true)
        private String msgClsf;

        @Schema(description = "업무구분코드",nullable = true)
        private String tskClsfCd;

        @Schema(description = "발생구분코드",nullable = true)
        private String occrClsfCd;

        @Schema(description = "팀 아이디",nullable = true)
        private long teamId;

        @Schema(description = "메시지 아이디",nullable = true)
        private String msgId;

        @Schema(description = "메시지",nullable = true)
        private String msgCn;
    }

    @Schema(description = "메시지 등록 응답")
    @Data
    @Builder
    public static class InsertResponse {
        @Schema(description = "성공 여부")
        private int insertCnt;
    }

    @Schema(description = "메시지 등록 요청")
    @Data
    public static class InsertRequest {
        @Schema(description = "메시지 타입")
        private String msgClsf;

        @Schema(description = "업무구분코드")
        private String tskClsfCd;

        @Schema(description = "팀 아이디")
        private String teamId;

        @Schema(description = "발생구분코드")
        private String occrClsfCd;

        @Schema(description = "메시지출력코드")
        private String msgPrntCd;

        @Schema(description = "메시지내용")
        private String msgCn;
    }
    @Schema(description = "메시지 등록 요청")
    @Data
    public static class InsertArrRequest {
        // 임시
        @Schema(description = "메시지 타입")
        private List<ParamsCLMsgMng.InsertArr> insertArrs;
    }

    @Schema(description = "메시지 수정 응답")
    @Data
    @Builder
    public static class UpdateResponse {
        @Schema(description = "성공 여부")
        private int uptCnt;
    }

    @Schema(description = "메시지 수정 요청")
    @Data
    public static class UpdateRequest {
        @Schema(description = "메시지 타입")
        private String msgClsf;

        @Schema(description = "팀 아이디")
        private int teamId;

        @Schema(description = "발생구분코드")
        private String occrClsfCd;

        @Schema(description = "메시지출력코드")
        private String msgPrntCd;

        @Schema(description = "메시지내용")
        private String msgCn;

        @Schema(description = "메시지 아이디")
        private String msgId;
    }

    @Schema(description = "메시지 수정 요청")
    @Data
    public static class UpdateUseYnRequest {
        @Schema(description = "메시지 타입")
        private String msgClsf;

        @Schema(description = "사용여부")
        private String useYn;

        @Schema(description = "메시지 아이디")
        private String msgId;

        @Schema(description = "메시지")
        private String msgCn;

        @Schema(description = "메시지출력코드")
        private String msgPrntCd;
    }

    @Schema(description = "메시지 수정 응답")
    @Data
    @Builder
    public static class MsgEnumListResponse {
        @Schema(description = "성공 여부")
        private List<ICLMsg> enumList;
    }
}
