package server.service.core;

import cl.cloverframework.CLException;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.ItemMgmt;
import server.domain.vo.ItemRefVo;
import server.domain.vo.ItemMgmtCheckNmVo;
import server.domain.vo.UsedRuleInfoVo;
import server.repo.core.mapper.ItemMgmtMapper;
import server.sql.ParamsItemMgmt;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ItemMgmtService {

    @Autowired
    private ItemMgmtMapper itemMgmtMapper;

    @Transactional
    public int itemMgmtInsert(ParamsItemMgmt.ItemMgmtInsert params) {

        List<ItemMgmtCheckNmVo> rst =  itemMgmtMapper.itemMgmtCheckNm(params.getItemAliasNm(), params.getIfid(), params.getItemNm());

        for (int i = 0; i < rst.size(); i++) {
            if(rst.get(0).getCnt() > 0) {
                throw new CLException("BE00000082", "항목 별칭이 존재합니다");
            }else if(rst.get(1).getCnt() > 0) {
                throw new CLException("BE00000083", "항목 이름이 존재합니다");
            }
        }

        return itemMgmtMapper.itemMgmtInsert(params);
    }
    @Transactional
    public int itemMgmtModify(ParamsItemMgmt.ItemMgmtInsert params) {

        List<ItemMgmtCheckNmVo> rst =  itemMgmtMapper.itemMgmtCheckNm(params.getItemAliasNm(), params.getIfid(), params.getItemNm());

        for (int i = 0; i < rst.size(); i++) {
            if(rst.get(0).getCnt() > 0) {
                throw new CLException("BE00000082", "항목 별칭이 존재합니다");
            }else if(rst.get(1).getCnt() > 0) {
                throw new CLException("BE00000083", "항목 이름이 존재합니다");
            }
        }

        return itemMgmtMapper.itemMgmtModify(params);
    }

    public List<ItemMgmt> itemMgmtSelect(ParamsItemMgmt.ItemMgmtSelect params) {


        List<ItemMgmt> itemMgmts = itemMgmtMapper.itemMgmtSelect(params);

//        List<ItemMgmt> resultItemMgmts = itemMgmts.stream().map((el) -> {
//            List<String> returnRules = itemMgmtMapper.selectReturnItem(el.getItemid());
//            List<String> condidtionRules = itemMgmtMapper.selectConditonItem("["+el.getItemid()+"]");
//            List<String> conditionReturnRules = itemMgmtMapper.selectCondtionReturnItem("[" + el.getItemid() + "]");
//            List<String> usedRules = Stream.of(returnRules, condidtionRules, conditionReturnRules)
//                    .flatMap(List::stream)
//                    .distinct()
//                    .collect(Collectors.toList());
//            List<UsedRuleInfoVo> usedRuleInfo = usedRules.stream().map((ruleid)->{
//                return itemMgmtMapper.selectRuleInfo(ruleid);
//            }).collect(Collectors.toList());
//
//            return ItemMgmt.builder()
//                    .itemid(el.getItemid())
//                    .itemNm(el.getItemNm())
//                    .itemAliasNm(el.getItemAliasNm())
//                    .itemExplanDesc(el.getItemExplanDesc())
//                    .dataTypeCd(el.getDataTypeCd())
//                    .dataTypeNm(el.getDataTypeNm())
//                    .updateUserID(el.getUpdateUserID())
//                    .itemUseYn(el.getItemUseYn())
//                    .firstRegUserId(el.getFirstRegUserId())
//                    .updateDateTime(el.getUpdateDateTime())
//                    .firstRegDateTime(el.getFirstRegDateTime())
//                    .ifid(el.getIfid())
//                    .usedRuleInfo(usedRuleInfo)
//                    .build();
//        }).collect(Collectors.toList());


        return itemMgmts;
    }

    public List<UsedRuleInfoVo> itemUsedRuleInfo(String itemid) {

            List<String> returnRules = itemMgmtMapper.selectReturnItem(itemid);
            List<String> condidtionRules = itemMgmtMapper.selectConditonItem("["+itemid+"]");
            List<String> conditionReturnRules = itemMgmtMapper.selectCondtionReturnItem("[" + itemid + "]");
            List<String> usedRules = Stream.of(returnRules, condidtionRules, conditionReturnRules)
                    .flatMap(List::stream)
                    .distinct()
                    .collect(Collectors.toList());
            List<UsedRuleInfoVo> usedRuleInfo = usedRules.stream().map((ruleid)->{
                return itemMgmtMapper.selectRuleInfo(ruleid);
            }).collect(Collectors.toList());

        return usedRuleInfo;
    }

    public ItemMgmt itemInfo(String value){
        return itemMgmtMapper.itemInfo(value);
    };


    public List<ItemRefVo> itemRefList(String value) {
        return itemMgmtMapper.itemRefList(value);
    }
    @Transactional
    public int itemRefInsert(ParamsItemMgmt.ItemRefInsert value) {
        return itemMgmtMapper.itemRefInsert(value);
    }
    @Transactional
    public int itemRefModify(ParamsItemMgmt.ItemRefModify value) {
        return itemMgmtMapper.itemRefModify(value);
    }
    @Transactional
    public int itemRefDel(String itemid,String itemrefCd) {
        return itemMgmtMapper.itemRefDel(itemid,itemrefCd);
    }

    public int itemInsertDupCheck(String itemid,String itemrefCd) {
        return itemMgmtMapper.itemInsertDupCheck(itemid,itemrefCd);
    }




}
