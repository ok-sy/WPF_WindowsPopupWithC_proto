package server.service.core;

import cl.cloverframework.CLException;
import cl.cloverframework.ICLErrorResolver;
import cl.cloverframework.filemanager.CLFileManager;
import cl.cloverframework.filemanager.CLFileNameUtils;
import cl.cloverframework.filemanager.CLFileType;
import cl.cloverframework.filemanager.saver.ICLFileSaveResult;
import cl.cloverframework.impl.domain.vo.CLPagerData;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import server.base.AppError;
import server.base.filemanager.FileDomain;
import server.domain.entity.Pds;
import server.domain.entity.PdsFile;
import server.domain.vo.PdsSimpleVo;
import server.domain.vo.PdsVo;
import server.domain.vo.UploadedFile;
import server.repo.core.mapper.PdsFileMapper;
import server.repo.core.mapper.PdsMapper;
import server.service.FileBaseUtils;
import server.sql.ParamsPds;
import server.sql.ParamsPdsFile;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Pds 게시판 Service
 */
@Service
public class PdsService {

    @Autowired
    PdsMapper pdsMapper;

    @Autowired
    PdsFileMapper pdsFileMapper;


    @Autowired
    CLFileManager fileManager;


    @Autowired
    FileBaseUtils fileBaseUtils;

    @Autowired
    ICLErrorResolver errorResolver;

    /**
     * pds 신규 등록
     *
     * @param pds           등록할 pds
     * @param attachFileIds 첨부파일ID 목록
     */
    @Transactional
    public void create(Pds pds, List<String> attachFileIds) {
        if (attachFileIds.size() > 0 && pdsFileMapper.countByFileIdIn(attachFileIds) != attachFileIds.size()) {
            // 파라미터로 전달된 fileId들이 DB에 존재하지 않음
            throw new CLException(
                errorResolver.errorForMeta(AppError.E1_INVALID_PARAMS)
            );
        }

        if (attachFileIds.size() > 0) {
            IntStream.range(0, attachFileIds.size())
                .mapToObj(i -> {
                    String fileId = attachFileIds.get(i);
                    return ParamsPdsFile.UpdatePdsIdById.builder()
                        .pdsId(pds.getPdsId())
                        .sortNumber(i)
                        .fileId(fileId)
                        .build();
                }).forEach(param -> {
                    pdsFileMapper.updatePdsIdById(param);
                });
        }
        pds.setAttachFileCount(attachFileIds.size());
        pdsMapper.insert(pds);
    }

    /**
     * pds 업데이트
     */
    @Transactional
    public void update(long pdsId, String title, String substance, List<String> attachFileIds) {
        Set<String> allFileIds = Sets.newHashSet(attachFileIds);
        Set<String> oldFileIds = new HashSet<>(pdsFileMapper.findFileIdByPdsId(pdsId));

        Set<String> toInsert = Sets.difference(allFileIds, oldFileIds).immutableCopy();
        Set<String> toRemove = Sets.difference(oldFileIds, allFileIds).immutableCopy();
        if (!toRemove.isEmpty()) {
            pdsFileMapper.updateDeleteMarkByFileIdIn(Lists.newArrayList(toRemove));
        }

        if (!toInsert.isEmpty()) {
            // 신규 등록할 것이 있다면, 정렬번호를 변경해야 하므로
            // 첨부파일 전체를 하나씩 업데이트 한다
            IntStream.range(0, attachFileIds.size())
                .mapToObj(i -> {
                    String fileId = attachFileIds.get(i);
                    return ParamsPdsFile.UpdatePdsIdById.builder()
                        .pdsId(pdsId)
                        .sortNumber(i)
                        .fileId(fileId)
                        .build();
                }).forEach(param -> {
                    pdsFileMapper.updatePdsIdById(param);
                });
        }

        // attachFileCount는 쿼리에서 카운트하므로 여기서 설정하지 않아도 되는데,
        // 참고용 코드로 남겨두었다
        Pds pds = Pds.builder()
            .pdsId(pdsId)
            .title(title)
            .attachFileCount(attachFileIds.size())
            .titleNoSpace(StringUtils.trimAllWhitespace(title).toLowerCase())
            .substance(substance)
            .changedAt(Instant.now())
            .build();
        pdsMapper.update(pds);
    }

    /**
     * Pds 페이지 조회
     *
     * @param pageNumber  페이지 번호 0부터 시작
     * @param rowsPerPage 페이지당 조회 건수
     * @param title       검색할 제목
     * @return PdsSimpleVo 페이지 데이터
     */
    @NonNull
    public CLPagerData<PdsSimpleVo> findPage(
        int pageNumber,
        int rowsPerPage,
        @Nullable String title
    ) {
        ParamsPds.FindPageSearch params = ParamsPds.FindPageSearch.builder()
            .pageNumber(pageNumber)
            .rowsPerPage(rowsPerPage)
            .title(title)
            .build();

        List<PdsSimpleVo> elements = pdsMapper.findPage(params); // 목록 조회
        long totalElements = pdsMapper.countForPage(params); // 전체 건수 조회

        return new CLPagerData<>(
            elements,
            totalElements,
            pageNumber,
            rowsPerPage
        );
    }

    @NonNull
    public CLPagerData<PdsSimpleVo> findDocPage(
            int pageNumber,
            int rowsPerPage,
            @Nullable String title
    ) {
        ParamsPds.FindPageSearch params = ParamsPds.FindPageSearch.builder()
                .pageNumber(pageNumber)
                .rowsPerPage(rowsPerPage)
                .title(title)
                .build();

        List<PdsSimpleVo> elements = pdsMapper.findDocPage(params); // 목록 조회
        long totalElements = pdsMapper.countForDocPage(params); // 전체 건수 조회

        return new CLPagerData<>(
                elements,
                totalElements,
                pageNumber,
                rowsPerPage
        );
    }

    /**
     * PdsSimpleVo 조회
     *
     * @param pdsId PDS ID
     * @return PdsSimpleVo 객체
     */
    @Nullable
    public PdsSimpleVo findPdsSimpleVoById(long pdsId) {
        return pdsMapper.findSimpleVoById(pdsId);
    }

    /**
     * PdsVo 조회
     *
     * @param pdsId PDS ID
     * @return PdsVo 객체
     */
    @Nullable
    public PdsVo findPdsVoById(long pdsId) {
        PdsVo pds = pdsMapper.findVoById(pdsId);
        if (pds == null) return null;

        pds.setAttachFiles(
            pdsFileMapper.findByPdsId(pdsId)
                .stream()
                .map(fileBaseUtils::toUploadedFile)
                .collect(Collectors.toList())
        );
        return pds;
    }


    /**
     * Pds Id로 게시물 존재여부 체크
     */
    public boolean existsPdsById(long pdsId) {
        return pdsMapper.existsById(pdsId);
    }

    /**
     * fileId로 PdsFile 존재여부 체크
     */
    public boolean existsPdsFileById(String fileId) {
        return pdsFileMapper.existsById(fileId);
    }

    /**
     * Pds 게시물 삭제
     *
     * @param pdsId 삭제할 pdsId
     * @return 삭제되었으면 true를 리턴
     */
    @Transactional
    public boolean deleteByPdsId(long pdsId) {
        int rows = pdsMapper.deleteById(pdsId);
        pdsFileMapper.updateDeleteMarkByPdsId(pdsId);
        return rows > 0;
    }

    /**
     * 업로드된 파일 임시저장
     *
     * @param multipartFile 업로드된 멀티파트 파일
     * @param fileSeq       파일 일련번호
     * @return 업로드 된 파일 정보
     */
    @Transactional
    public UploadedFile saveTempFile(MultipartFile multipartFile, long fileSeq) {
        String fileName = multipartFile.getOriginalFilename();

        CLFileType fileType = CLFileNameUtils.getFileTypeFromFileName(fileName);
        FileDomain fileDomain = FileDomain.PDS;
        ICLFileSaveResult result;
        if (fileType == CLFileType.IMAGE) {
            result = fileManager.saveImageFile(multipartFile, fileSeq, fileDomain);
        } else {
            result = fileManager.saveBinaryFile(multipartFile, fileSeq, fileDomain);
        }

        String fileId = result.getFileId();
        PdsFile fileObject = PdsFile.builder()
            .pdsId(0)
            .delYn("Y") // 삭제마킹 상태로 등록
            .fileId(fileId)
            .fileType(fileType)
            .fileName(fileName)
            .sortNumber(System.currentTimeMillis())
            .createdAt(Instant.now())
            .changedAt(Instant.now())
            .build();

        // 디스크에 저장한 정보를 file 객체에 복사
        fileBaseUtils.copyFromDiskSaveResult(result, fileObject);
        pdsFileMapper.insert(fileObject);

        // 업로드 중 마킹이 있다면 삭제
        fileManager.deleteUploadingMark(fileId);
        return fileBaseUtils.toUploadedFile(fileObject);
    }

    /**
     * 특정 파일의 파일명을 변경
     *
     * @param fileId   파일 ID
     * @param fileName 변경할 파일명
     * @return 변경된 파일 정보 객체
     */
    @Transactional
    public UploadedFile updateFileName(@NonNull String fileId, @NonNull String fileName) {
        PdsFile file = pdsFileMapper.findById(fileId);
        if (file == null) {
            throw new CLException(errorResolver.errorForMeta(AppError.E1_NO_SUCH_DATA));
        }
        if (!fileName.equals(file.getFileName())) {
            file.setFileName(fileName);

            pdsFileMapper.updateFileNameById(
                ParamsPdsFile.UpdateFileNameById.builder()
                    .fileId(fileId)
                    .fileName(fileName)
                    .build()
            );
        }
        return fileBaseUtils.toUploadedFile(file);
    }
}
