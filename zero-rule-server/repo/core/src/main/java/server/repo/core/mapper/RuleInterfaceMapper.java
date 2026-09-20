package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import server.domain.vo.*;
import server.sql.ParamsInterface;

import java.util.List;

@Mapper
public interface RuleInterfaceMapper {

    List<RuleInterfaceInfoVo> findRuleInterfaceInfo(ParamsInterface.InterfaceInfos value);

    String newIfidSeq();

    int insertRuleInterface(ParamsInterface.InterfaceInsert param);

    int updateInterfaceInfo(ParamsInterface.InterfaceUpdate param);

    List<RuleInterfaceMapVo> findRuleInterfaceMap(ParamsInterface.InterfaceInfos value);

    int insertRuleMap(ParamsInterface.InterfaceMapInsert param);

    int updateRuleMap(ParamsInterface.InterfaceMapUpdate param);
    int deleteRuleMap(@Param("ifid") String ifid, @Param("fieldEngNm") String fieldEngNm);

    int interfaceFindedOne(@Param("ifid") String ifid, @Param("ifNm") String ifNm);
    int itemFindedOne(@Param("ifid") String ifid, @Param("itemaliasNm") String itemaliasNm);

    int delInterfaceInfo(String value);

}
