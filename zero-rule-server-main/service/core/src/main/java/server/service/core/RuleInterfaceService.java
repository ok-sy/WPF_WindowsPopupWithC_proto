package server.service.core;

import cl.cloverframework.CLException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.vo.RuleInterfaceInfoVo;
import server.domain.vo.RuleInterfaceMapSave;
import server.domain.vo.RuleInterfaceMapVo;
import server.repo.core.mapper.ItemMgmtMapper;
import server.repo.core.mapper.RuleInterfaceMapper;
import server.sql.ParamsInterface;
import server.sql.ParamsItemMgmt;

import java.util.List;
import java.util.Objects;

@Service
public class RuleInterfaceService {

    @Autowired
    RuleInterfaceMapper ruleInterfaceMapper;

    @Autowired
    ItemMgmtMapper itemMgmtMapper;

    public  List<RuleInterfaceInfoVo> findRuleInterfaceInfo(ParamsInterface.InterfaceInfos value) {
        return ruleInterfaceMapper.findRuleInterfaceInfo(value);
    }

    public String newIfidSeq(){
        return ruleInterfaceMapper.newIfidSeq();
    };

    @Transactional
    public int insertRuleInterface(ParamsInterface.InterfaceInsert param){
        return ruleInterfaceMapper.insertRuleInterface(param);
    };
    @Transactional
    public int updateInterfaceInfo(ParamsInterface.InterfaceUpdate param){
        return ruleInterfaceMapper.updateInterfaceInfo(param);
    };
    public  List<RuleInterfaceMapVo> findRuleInterfaceMap(ParamsInterface.InterfaceInfos value) {
        return ruleInterfaceMapper.findRuleInterfaceMap(value);
    }

    @Transactional
    public int saveAllInterface(List<RuleInterfaceMapSave> param, int userId) {
        param.forEach((el)->{
            if(el.getCrudGubun() != null){
                String datatypeCd = Objects.equals(el.getDatatypeCd(), "number") ? "0" : "1";
                switch (el.getCrudGubun()) {
                    case "C" -> {
                        int interVali = ruleInterfaceMapper.interfaceFindedOne(el.getIfid(), el.getIfNm());
                        if (interVali != 1) {
                            throw new CLException("BE00000079", el.getIfid() + "(" + el.getIfNm() + ") " + "의 정보가 존재하지 않습니다.");
                        }
                        int itemVali = ruleInterfaceMapper.itemFindedOne(el.getIfid(), el.getFieldEngNm());
                        if (itemVali != 0) {
                            throw new CLException("BE00000079", el.getIfid() + "(" + el.getFieldEngNm() + ") " + "의 정보가 이미 항목에 존재합니다");
                        }
                        itemMgmtMapper.itemMgmtInsert(ParamsItemMgmt.ItemMgmtInsert.builder()
                                .itemNm(el.getFieldKorNm())
                                .itemAliasNm(el.getFieldEngNm())
                                .itemExplanDesc(el.getFieldKorNm())
                                .dataTypeCd(datatypeCd)
                                .updateUserID(String.valueOf(userId))
                                .itemUseYn("Y")
                                .firstRegUserId(String.valueOf(userId))
//                          .firstregDatetime(el.)
                                .ifid(el.getIfid())
                                .build());
                        ruleInterfaceMapper.insertRuleMap(
                                ParamsInterface.InterfaceMapInsert.builder()
                                        .ifid(el.getIfid())
                                        .fieldEngNm(el.getFieldEngNm())
                                        .fieldKorNm(el.getFieldKorNm())
                                        .fieldOrder(el.getFieldOrder())
                                        .fieldLength(el.getFieldLength())
                                        .fieldStartNo(el.getFieldStartNo())
                                        .fieldCodeType(el.getFieldCodeType())
                                        .datatypeCd(datatypeCd)
                                        .fieldScale(el.getFieldScale())
                                        .trimYn(el.getTrimYn())
                                        .characterset(el.getCharacterset())
                                        .firstregUserid(userId)
//                                    .firstregDatetime(el.get)
                                        .build()
                        );
                    }
                    case "U" -> ruleInterfaceMapper.updateRuleMap(
                            ParamsInterface.InterfaceMapUpdate.builder()
                                    .ifid(el.getIfid())
                                    .fieldEngNm(el.getFieldEngNm())
                                    .fieldKorNm(el.getFieldKorNm())
                                    .fieldOrder(el.getFieldOrder())
                                    .fieldLength(el.getFieldLength())
                                    .fieldStartNo(el.getFieldStartNo())
                                    .fieldCodeType(el.getFieldCodeType())
                                    .datatypeCd(datatypeCd)
                                    .fieldScale(el.getFieldScale())
                                    .trimYn(el.getTrimYn())
                                    .characterset(el.getCharacterset())
                                    .updateUserid(userId)
//                                    .updateDatetime()
                                    .build()
                    );
                    case "D" -> ruleInterfaceMapper.deleteRuleMap(
                            el.getIfid(), el.getFieldEngNm()
                    );
                }
            }


        });

        return 1;
    }

    @Transactional
    public int delInterfaceInfo(String value){
        return ruleInterfaceMapper.delInterfaceInfo(value);
    };


}
