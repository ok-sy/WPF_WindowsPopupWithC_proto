package server.web.api;

import cl.cloverframework.ICLUserDetails;
import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import server.base.DocTags;
import server.base.logger.IAppLogger;
import server.domain.entity.Pds;
import server.domain.vo.PdsVo;
import server.domain.vo.UploadedFile;
import server.service.core.PdsService;
import server.service.core.SequenceService;
import server.util.BbsUtils;
import server.web.api.payload.PdsPayloads;
import server.web.support.ApiBaseController;
import server.web.support.payload.FileUploadResponse;

import java.time.Instant;
import java.util.Objects;

import static server.service.UserSecurityUtils.currentUserDetails;

@Tag(name = DocTags.PDS)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class PdsController extends ApiBaseController {

    @Autowired
    PdsService pdsService;

    @Autowired
    SequenceService sequenceService;

    @Autowired
    IAppLogger appLogger;

    @Operation(
        summary = "PDS 게시물 등록",
        description = "PDS 게시물을 신규 등록한다."
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 등록한 게시물 정보를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = PdsPayloads.PdsSimpleInfoResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/create")
    public CLNewApiResponse<PdsPayloads.PdsSimpleInfoResponse> create(
        @RequestBody PdsPayloads.PdsCreateRequest payload
    ) {
        ICLUserDetails loginUser = currentUserDetails();
        Objects.requireNonNull(loginUser);

        long pdsId = sequenceService.nextCommonSeq();
        Pds pds = Pds.builder()
            .pdsId(pdsId)
            .title(payload.getTitle())
            .titleNoSpace(StringUtils.trimAllWhitespace(payload.getTitle()).toLowerCase())
            .createUserId(loginUser.getLgonId())
            .substance(payload.getSubstance())
            .createdAt(Instant.now())
            .changedAt(Instant.now())
            .build();
        pdsService.create(pds, payload.getFileIds());

        // 샘플로 App 로그를 남긴다
        appLogger.pdsInserted(pdsId, payload.getTitle());

        return resultMsg("BE00000001",
            PdsPayloads.PdsSimpleInfoResponse.builder()
                .pds(pdsService.findPdsSimpleVoById(pdsId))
                .build()
        );
    }


    @Operation(
        summary = "PDS 게시물 수정",
        description = "PDS 게시물을 수정합니다.<br/>" +
            "<b>[에러코드]</b><br/>" +
            "E1_NO_SUCH_DATA: 해당 자료가 존재하지 않습니다.<br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 수정한 게시물 정보를 응답",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = PdsPayloads.PdsSimpleInfoResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/update")
    public CLNewApiResponse<PdsPayloads.PdsSimpleInfoResponse> update(
        @RequestBody PdsPayloads.PdsUpdateRequest payload
    ) {
        long pdsId = payload.getPdsId();
        if (!pdsService.existsPdsById(pdsId)) {
            // 해당 자료가 존재하지 않습니다
            return resultMsg("BE00000001");
        }

        pdsService.update(
            pdsId,
            payload.getTitle(),
            payload.getSubstance(),
            payload.getFileIds()
        );

        // 샘플로 App 로그를 남긴다
        appLogger.pdsUpdated(pdsId, payload.getTitle());

        return resultMsg("BE00000001",
            PdsPayloads.PdsSimpleInfoResponse.builder()
                .pds(pdsService.findPdsSimpleVoById(pdsId))
                .build()
        );
    }


    @Operation(
        summary = "PDS 게시물 목록 조회 - 페이징",
        description = "PDS 게시물 목록을 페이지 형태로 조회합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, PDS 게시물 목록을 페이지 형태로 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = PdsPayloads.PdsSimpleInfoResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/list")
    public CLNewApiResponse<PdsPayloads.PdsPageResponse> list(
        @RequestBody PdsPayloads.PdsPageRequest payload
    ) {
        return resultMsg("BE00000001",
            PdsPayloads.PdsPageResponse.builder()
                .pagerData(
                    pdsService.findPage(
                        payload.getPageNumber(),
                        payload.getRowsPerPage(),
                        payload.getTitle()
                    )
                )
                .build()
        );
    }

    @Operation(
        summary = "PDS 게시물 목록 조회 - 페이징 (Doc)",
        description = "PDS 게시물 목록을 페이지 형태로 조회합니다(Doc)"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, PDS 게시물 목록을 페이지 형태로 응답한다(Doc)",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = PdsPayloads.PdsSimpleInfoResponse.class)
        )
    )
    @PostMapping(value = "/p/api/pds/doc/list")
    public CLNewApiResponse<PdsPayloads.PdsPageResponse> docList(
        @RequestBody PdsPayloads.PdsPageRequest payload
    ) {
        return resultMsg("BE00000001",
            PdsPayloads.PdsPageResponse.builder()
                .pagerData(
                    pdsService.findDocPage(
                        payload.getPageNumber(),
                        payload.getRowsPerPage(),
                        payload.getTitle()
                    )
                )
                .build()
        );
    }

    @Operation(
        summary = "PDS 게시물 정보 조회",
        description = "PDS 게시물 정보 조회<br/>" +
            "<b>[에러코드]</b><br/>" +
            "E1_NO_SUCH_DATA: 해당 자료가 존재하지 않습니다.<br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, Pds 게시물 정보를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = PdsPayloads.PdsInfoResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/info/{pdsId}")
    public CLNewApiResponse<PdsPayloads.PdsInfoResponse> info(
        @Parameter(description = "자료 ID") @PathVariable("pdsId") long pdsId
    ) {
        PdsVo pds = pdsService.findPdsVoById(pdsId);
        if (pds == null) {
            return resultMsg("BE00000001");
        }

        return resultMsg("BE00000001",
            PdsPayloads.PdsInfoResponse.builder()
                .pds(pds)
                .build()
        );
    }

    @Operation(
        summary = "PDS 게시물 삭제",
        description = "PDS 게시물을 삭제합니다.<br/>" +
            "존재하지 않는 게시물인 경우 삭제한 것으로 정상 응답합니다.(어차피 없으니까, 삭제나 마찬가지)"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, success=true",
        content = @Content(mediaType = "application/json")
    )
    @PostMapping(value = "/api/pds/delete/{pdsId}")
    public CLNewApiResponse delete(
        @Parameter(description = "자료 ID") @PathVariable("pdsId") long pdsId
    ) {
        // 존재하지 않는 게시물이라도 정상 응답
        // 어차피 없으니까 삭제한 것이나 마찬가지
        if (!pdsService.existsPdsById(pdsId)) {
            return resultMsg("BE00000038");
        }
        boolean deleted = pdsService.deleteByPdsId(pdsId);
        if (!deleted) {
            log.warn("ignore pds delete fail:" + pdsId);
        } else {
            // 샘플로 App 로그를 남긴다
            appLogger.pdsDeleted(pdsId);
        }
        return resultMsg("BE00000038");
    }

    @Operation(
        summary = "PDS 파일 업로드",
        description = "PDS 첨부파일을 업로드합니다.<br/>" +
            "업로드 된 파일은 임시 저장 상태입니다.<br/>" +
            "<b>[에러코드]</b><br/>" +
            "E1_BLOCKED_ATTACH_FILE: 허용되지 않는 첨부파일입니다.<br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 업로드된 파일의 정보를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = FileUploadResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/upload")
    public CLNewApiResponse<FileUploadResponse> uploadTempFile(
        @Parameter(description = "파일") @RequestParam("file") MultipartFile file
    ) {
        if (BbsUtils.isBlockedAttachFileName(file.getOriginalFilename())) {
            // 허용되지 않는 첨부파일입니다
            return resultMsg("BE00000020");
        }

        UploadedFile uploadedFile = pdsService.saveTempFile(file, sequenceService.nextFileSeq());

        return resultMsg("BE00000001",
            FileUploadResponse.builder()
                .file(uploadedFile)
                .build()
        );
    }


    @Operation(
        summary = "PDS 첨부 파일 이름 변경",
        description = "PDS 첨부 파일의 이름을 변경합니다.<br/>" +
            "<b>[에러코드]</b><br/>" +
            "E1_NO_SUCH_DATA: 해당 데이터를 찾을 수 없습니다.<br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 파일의 정보를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = FileUploadResponse.class)
        )
    )
    @PostMapping(value = "/api/pds/update-file-name/{fileId}")
    public CLNewApiResponse<FileUploadResponse> updateFileName(
        @Parameter(description = "파일 ID") @PathVariable("fileId") String fileId,
        @Parameter(description = "변경할 파일명") @RequestParam("fileName") String fileName
    ) {
        if (!StringUtils.hasText(fileName)) {
            return resultMsg("FW00000003");
        }

        if (!pdsService.existsPdsFileById(fileId)) {
            return resultMsg("BE00000013");
        }

        UploadedFile uploadedFile = pdsService.updateFileName(fileId, fileName);

        return resultMsg("BE00000001",
            FileUploadResponse.builder()
                .file(uploadedFile)
                .build()
        );
    }
}
