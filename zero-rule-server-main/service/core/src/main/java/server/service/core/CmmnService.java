package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.UserPageRolePrivList;
import server.domain.vo.CodeVo;
import server.repo.core.mapper.CmmnMapper;
import server.sql.ParamCmmn;

import java.util.List;

@Service
public class CmmnService {

    @Autowired
    CmmnMapper commMapper;

    /**
     * commMapper 공통코드 검색
     *
     * @param codeType 코드유형
     * @return CloverCode 공통코드리스트
     */
    public List<CodeVo> findCode(String codeType) {
        return commMapper.findCodeByCodeType(codeType);
    }

    public boolean hasPerm(long userId, String apiUrl) {

        int cnt = commMapper.countByGrantedUserPriv(
            ParamCmmn.CountByGrantedUserPriv.builder()
                .userId(userId)
                .apiUrl(apiUrl)
                .build());

        return cnt > 0;
    }

    @Transactional
    public void createApiLog(String apiUrl, String stTm, String edTm, String porctm, long userId) {

        commMapper.createApiLog(
            ParamCmmn.Create.builder()
                    .apiUrl(apiUrl)
                    .stTm(stTm)
                    .edTm(edTm)
                    .procTm(porctm)
                    .userId(userId)
                    .build());
    }

    public List<UserPageRolePrivList> userPageRolePrivList(long userId) {
        return commMapper.userPageRolePrivList(userId);
    }
}
