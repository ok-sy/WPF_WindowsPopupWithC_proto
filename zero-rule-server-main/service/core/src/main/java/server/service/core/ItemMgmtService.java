package server.service.core;

import cl.cloverframework.CLException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.ItemMgmt;
import server.domain.vo.ItemMgmtCheckNmVo;
import server.domain.vo.ItemRefVo;
import server.domain.vo.UsedRuleInfoVo;
import server.repo.core.mapper.ItemMgmtMapper;
import server.sql.ParamsItemMgmt;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ItemMgmtService {

    @Autowired
    ItemMgmtMapper itemMgmtMapper;

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
        return itemMgmtMapper.itemMgmtSelect(params);
    }

    public List<UsedRuleInfoVo> itemUsedRuleInfo(String itemid) {

            List<String> returnRules = itemMgmtMapper.selectReturnItem(itemid);
            List<String> condidtionRules = itemMgmtMapper.selectConditonItem("["+itemid+"]");
            List<String> conditionReturnRules = itemMgmtMapper.selectCondtionReturnItem("[" + itemid + "]");
            List<String> usedRules = Stream.of(returnRules, condidtionRules, conditionReturnRules)
                    .flatMap(List::stream)
                    .distinct()
                    .toList();

        return usedRules.stream().map((ruleid)-> itemMgmtMapper.selectRuleInfo(ruleid)).collect(Collectors.toList());
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
