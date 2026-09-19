package server.web.api;

import cl.cloverframework.CLException;
import cl.cloverframework.CLMsg;
import cl.cloverframework.ICLMsg;
import cl.cloverframework.api.CLNewApiResponse;
import cl.cloverframework.impl.domain.vo.CLPagerData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import server.base.AppMsg;
import server.base.DocTags;
import server.base.logger.IAppLogger;
import server.domain.entity.CLMsgMng;
import server.service.UserSecurityUtils;
import server.service.core.CLMsgMngService;
import server.sql.ParamsCLMsgMng;
import server.web.api.payload.CLMsgMngPayloads;
import server.web.support.ApiBaseController;
import server.web.support.message.ICLMsgRepository;

import java.util.List;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Tag(name = DocTags.MSG_MNG_DESC)
@RestController
@SuppressWarnings("unused")
public class CLMsgMngController extends ApiBaseController {

    @Autowired
    CLMsgMngService clMsgMngService;

    @Autowired
    ICLMsgRepository msgRepository;

    @Autowired
    IAppLogger appLogger;

    private final Lock lock = new ReentrantLock();


    @Operation(
        summary = "메시지 목록 조회 - 페이징",
        description = "메시지 목록을 페이지 형태로 조회합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 메시지 목록을 페이지 형태로 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CLMsgMngPayloads.FindPageResponse.class)
        )
    )
    @PostMapping(value = "/apis/msg-mng/list")
    public CLNewApiResponse<CLMsgMngPayloads.FindPageResponse> list(
        @RequestBody CLMsgMngPayloads.FindPageRequest payload
    ) {

        CLPagerData<CLMsgMng> tempData = null;

        tempData = clMsgMngService.findMsgPage(
            payload.getRowsPerPage(),
            payload.getPageNumber(),
            payload.getMsgClsf(),
            payload.getTskClsfCd(),
            payload.getOccrClsfCd(),
            payload.getTeamId(),
            payload.getMsgId(),
            payload.getMsgCn()
        );
        // 조회된 데이터가 없는 경우
        if (tempData.getElements().isEmpty()) {
            return resultMsg("BE00000044",
                CLMsgMngPayloads.FindPageResponse.builder()
                    .pagerData(tempData)
                    .build());
        }

        return resultMsg(
            "BE00000001",
            CLMsgMngPayloads.FindPageResponse.builder()
                .pagerData(tempData)
                .build()
        );
    }

    @Operation(
        summary = "메시지 등록",
        description = "메시지 등록합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 메시지 등록 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CLMsgMngPayloads.InsertResponse.class)
        )
    )
    @PostMapping(value = "/apis/msg-mng/create")
    public synchronized CLNewApiResponse<CLMsgMngPayloads.InsertResponse> create(
        @RequestBody CLMsgMngPayloads.InsertArrRequest payload
    ) {

        int insertCnt = 0;
        List<ParamsCLMsgMng.InsertArr> msgArr = payload.getInsertArrs();

        for (ParamsCLMsgMng.InsertArr el : msgArr) {

            ParamsCLMsgMng.Insert insert = ParamsCLMsgMng.Insert.builder()
                    .msgClsf(el.getMsgClsf())
                    .tskClsfCd(el.getTskClsfCd())
                    .teamId(el.getTeamId())
                    .occrClsfCd(el.getOccrClsfCd())
                    .msgPrntCd(el.getMsgPrntCd())
                    .msgCn(el.getMsgCn())
                    .regrId(UserSecurityUtils.currentLgonIdOrNull())
                    .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                    .build();
            try {
                clMsgMngService.insert(insert);
                msgRepository.msgSave(new CLMsg(insert.getMsgId(), insert.getMsgCn(), insert.getMsgClsf(), insert.getMsgPrntCd()));
                insertCnt++; // insert 성공 시 1 증가
            } catch (DuplicateKeyException e) {
                // BE00000047:등록 중 키중복 오류 발생 하였습니다.
                return resultMsg("BE00000047");
            } catch (CLException cl) {
                log.debug(cl.getMsg());
                return resultMsg(cl.getErrorCode());
            }
        }

        return resultMsg(
            "BE00000002",  // BE00000002: 메시지가 등록되었습니다
            CLMsgMngPayloads.InsertResponse.builder()
                .insertCnt(insertCnt)
                .build()
        );
    }

    @Operation(
        summary = "메시지 수정",
        description = "메시지 수정합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 메시지 수정 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CLMsgMngPayloads.UpdateResponse.class)
        )
    )
    @PostMapping(value = "/apis/msg-mng/update")
    public CLNewApiResponse<CLMsgMngPayloads.UpdateResponse> update(
        @RequestBody CLMsgMngPayloads.UpdateRequest payload
    ) {
        int uptCnt=0;
        try{

            uptCnt = clMsgMngService.update(
                ParamsCLMsgMng.Update.builder()
                    .msgClsf(payload.getMsgClsf())
                    .teamId(payload.getTeamId())
                    .occrClsfCd(payload.getOccrClsfCd())
                    .msgPrntCd(payload.getMsgPrntCd())
                    .msgCn(payload.getMsgCn())
                    .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                    .msgId(payload.getMsgId())
                    .build()
            );
            //정상 메시지 db 수정시에만 메시지 hashmap에 등록
            msgRepository.msgModify(new CLMsg(payload.getMsgId(), payload.getMsgCn(),  payload.getMsgClsf(),payload.getMsgPrntCd()));
        } catch (CLException cl){
            appLogger.devDebug("ERRMSG : " + cl.getMsg(),"");
            return resultMsg(cl.getMessage());
        } catch (Exception e) {
            // BE00000007:오류가 발생했습니다
            return resultMsg("BE00000007");
        }

        return resultMsg(
            //BE00000003:메시지가 수정되었습니다
            "BE00000003",
            CLMsgMngPayloads.UpdateResponse.builder()
                .uptCnt(uptCnt)
                .build()
        );
    }

    @Operation(
        summary = "사용여부 수정",
        description = "사용여부 수정합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 사용여부 수정 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CLMsgMngPayloads.UpdateResponse.class)
        )
    )
    @PostMapping(value = "/apis/msg-mng/update-use-yn")
    public CLNewApiResponse<CLMsgMngPayloads.UpdateResponse> updateUseYn(
        @RequestBody CLMsgMngPayloads.UpdateUseYnRequest payload
    ) {
        int uptCnt=0;
        try{

            uptCnt = clMsgMngService.updateUseYn(
                ParamsCLMsgMng.UpdateUseYn.builder()
                    .useYn(payload.getUseYn())
                    .msgId(payload.getMsgId())
                    .build()
            );
            if("Y".equals(payload.getUseYn())){
                msgRepository.msgSave(new CLMsg(payload.getMsgId(), payload.getMsgCn(),  payload.getMsgClsf(),payload.getMsgPrntCd()));
            }else{
                msgRepository.msgDelete(payload.getMsgId());
            }
        }catch (Exception e){
            return resultMsg("ER00100001", null);
        }
        if("Y".equals(payload.getUseYn())) {
            return resultMsg(
                "BE00000005",
                CLMsgMngPayloads.UpdateResponse.builder()
                    .uptCnt(uptCnt)
                    .build()
            );
        }
        return resultMsg(
            // BE00000004: 사용해지로 변경되었습니다
            "BE00000004",
            CLMsgMngPayloads.UpdateResponse.builder()
                .uptCnt(uptCnt)
                .build()
        );
    }


    @Operation(
        summary = "enum클래스 목록 조회",
        description = "enum클래스 목록 조회합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, enum클래스 목록 조회 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CLMsgMngPayloads.MsgEnumListResponse.class)
        )
    )
    @PostMapping(value = "/apis/msg-mng/enum-list")
    public CLNewApiResponse<CLMsgMngPayloads.MsgEnumListResponse> msgEnumList() {

        List<ICLMsg> enumList = msgRepository.findMsgEnumAll();
        return resultMsg(
            AppMsg.NM_REQUEST_SUCCESS,
            CLMsgMngPayloads.MsgEnumListResponse.builder()
                .enumList(enumList)
                .build()
        );
    }

    // 타임아웃을 시뮬레이션하는 메서드
    private void simulateTimeout() throws InterruptedException {
        // 35초 동안 대기
        Thread.sleep(35000);
    }
}

