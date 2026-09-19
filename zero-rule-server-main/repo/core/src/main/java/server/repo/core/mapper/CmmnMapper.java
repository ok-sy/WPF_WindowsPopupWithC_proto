package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.Nullable;
import server.domain.entity.UserPageRolePrivList;
import server.sql.ParamCmmn;
import server.domain.vo.CodeVo;

import java.util.List;

@Mapper
public interface CmmnMapper {
    /**
     * 공통코드 다건 조회
     */
    List<CodeVo> findCodeByCodeType(String codeType);

    int countByGrantedUserPriv(ParamCmmn.CountByGrantedUserPriv param);

    int createApiLog(ParamCmmn.Create param);

    @Nullable
    List<UserPageRolePrivList> userPageRolePrivList(long userId);
}
