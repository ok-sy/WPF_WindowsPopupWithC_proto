package server.service.core;

import cl.cloverframework.filemanager.ICLFileDomain;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import server.base.filemanager.FileDomain;
import server.domain.vo.CommonFileVo;
import server.repo.core.mapper.CommonFileMapper;
import server.sql.ParamsCommonFile;

import java.time.Instant;
import java.util.*;

@Service
@Slf4j
public class CommonFileService implements InitializingBean {

    @Autowired
    CommonFileMapper commonFileMapper;

    @Override
    public void afterPropertiesSet() throws Exception {
        // fileMappersByFileDomainName.put(FileDomain.PDS, pdsFileMapper);
    }

    @Nullable
    private FileDomain toEnum(@NonNull ICLFileDomain fileDomain) {
        return FileDomain.findByName(fileDomain.getName());
    }

    @Nullable
    public CommonFileVo findByFileId(@NonNull ICLFileDomain fileDomain, @NonNull String fileId) {
        FileDomain domain = toEnum(fileDomain);
        if (domain == null) {
            throw new RuntimeException("not ready fileDomain:" + fileDomain.getName());
        }
        String tableName = domain.getTableName();
        if (!StringUtils.hasText(tableName)) {
            log.warn("FileDomain {}에 매핑된 테이블 없음", fileDomain.getName());
            return null;
        }

        return commonFileMapper.findByFileId(
            ParamsCommonFile.FindByFileId.builder()
                .tableName(tableName)
                .fileId(fileId)
                .build()
        );
    }

    /**
     * 삭제 마킹된 파일 ID 목록 조회
     *
     * @param fileDomain   파일 도메인
     * @param maxTimestamp 변경 시간의 최대값
     * @param maxCount     최대 조회건수
     * @return 파일 ID 목록
     */
    public List<String> findDeleteMarkedFileIds(ICLFileDomain fileDomain, Instant maxTimestamp, int maxCount) {
        FileDomain domain = toEnum(fileDomain);
        if (domain == null) {
            throw new RuntimeException("not ready fileDomain:" + fileDomain.getName());
        }
        String tableName = domain.getTableName();
        if (!StringUtils.hasText(tableName)) {
            log.warn("FileDomain {}에 매핑된 테이블 없음", fileDomain.getName());
            return Collections.emptyList();
        }

        return commonFileMapper.findDeleteMarkedFileIds(
            ParamsCommonFile.FindDeleteMarkedFiles.builder()
                .maxCount(maxCount)
                .maxTimestamp(maxTimestamp)
                .tableName(domain.getTableName())
                .build());
    }

    /**
     * 주어진 파일ID들을 삭제
     */
    @Transactional
    public int deleteFilesOnDb(Collection<String> fileIds) {
        Map<FileDomain, List<String>> fileDomainMap = new HashMap<>();
        // FileDomain별 파일ID 모으기
        for (String fileId : fileIds) {
            FileDomain fileDomain = FileDomain.findByPrefix(fileId.substring(0, 4));
            if (fileDomain == null) continue;
            List<String> fileIdList = fileDomainMap.computeIfAbsent(fileDomain, k -> new ArrayList<>());
            fileIdList.add(fileId);
        }

        int totalDeletedRows = 0;
        // 루프를 돌면서 파일 삭제
        for (FileDomain fileDomain : fileDomainMap.keySet()) {
            List<String> fileIdList = fileDomainMap.get(fileDomain);
            String tableName = fileDomain.getTableName();
            if (!StringUtils.hasText(tableName)) {
                log.warn("FileDomain {}에 매핑된 테이블 없음", fileDomain.getName());
                continue;
            }

            totalDeletedRows += commonFileMapper.deleteByFileIdIn(
                ParamsCommonFile.DeleteByFileIdIn.builder()
                    .tableName(tableName)
                    .fileIds(fileIdList)
                    .build()
            );
        }
        return totalDeletedRows;
    }
}
