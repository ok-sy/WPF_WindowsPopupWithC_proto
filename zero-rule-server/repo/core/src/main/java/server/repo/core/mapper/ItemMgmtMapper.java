package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.ItemMgmt;
import server.domain.vo.ItemRefVo;
import server.domain.vo.ItemMgmtCheckNmVo;
import server.domain.vo.UsedRuleInfoVo;
import server.sql.ParamsItemMgmt;

import java.util.List;

@Mapper
public interface ItemMgmtMapper {

    int itemMgmtInsert(ParamsItemMgmt.ItemMgmtInsert param);

    int itemMgmtModify(ParamsItemMgmt.ItemMgmtInsert params);

    List<ItemMgmt> itemMgmtSelect(ParamsItemMgmt.ItemMgmtSelect param);


    ItemMgmt itemInfo(String value);

    List<ItemRefVo> itemRefList(String value);

    int itemRefInsert(ParamsItemMgmt.ItemRefInsert value);

    int itemRefModify(ParamsItemMgmt.ItemRefModify value);

    int itemRefDel(@Param("itemId") String itemId, @Param("itemrefCd") String itemrefCd);

    int itemInsertDupCheck(@Param("itemid") String itemId, @Param("itemrefCd") String itemrefCd);


    List<String> selectReturnItem(String value);

    List<String> selectConditonItem(String value);

    List<String> selectCondtionReturnItem(String value);

    UsedRuleInfoVo selectRuleInfo(String value);

    List<ItemMgmtCheckNmVo> itemMgmtCheckNm(@Param("itemAliasNm") String itemAliasNm,
                                            @Param("ifid") String ifid,
                                            @Param("itemNm") String itemNm);


}
