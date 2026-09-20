package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import server.domain.vo.LockVo;
import server.domain.vo.RuleNameVo;
import server.domain.vo.RuleReturnItemAndItemInfoVo;
import server.domain.vo.RuleVo;
import server.sql.ParamLock;

import java.util.List;

@Mapper
public interface LockMapper {

     List<LockVo> findList(ParamLock.LockSearch param);

     int deleteOne(String key);

     int deleteDepLock(String key);

     int insertLock(ParamLock.InsertLock param);

     int findLockKey(String key);
     int findIsTokenVali(String token);

     int findRuleUptMode(ParamLock.FindRuleUptMode params);

     int findRuleApplyMode(String lockkey);

     String findLockNote(String lockkey);

     String findRuleApplyModeCnt();
}
