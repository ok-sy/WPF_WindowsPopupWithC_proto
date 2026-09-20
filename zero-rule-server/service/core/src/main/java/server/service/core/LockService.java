package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.vo.LockVo;
import server.domain.vo.RuleNameVo;
import server.domain.vo.RuleReturnItemAndItemInfoVo;
import server.domain.vo.RuleVo;
import server.repo.core.mapper.LockMapper;
import server.repo.core.mapper.RuleMapper;
import server.sql.ParamLock;

import java.util.List;

@Service
public class LockService {

    @Autowired
    private LockMapper lockMapper;


    public List<LockVo> findList(ParamLock.LockSearch param) {
       return lockMapper.findList(param);
    }

    @Transactional
    public Long deleteArr(List<String> param) {
        param.stream().forEach((el)->{
            lockMapper.deleteOne(el);
        });
        return (long) param.size();
    }

    public int deleteDepLock(String key){
        return lockMapper.deleteDepLock(key);
    }

    @Transactional
    public int insertLock(ParamLock.InsertLock param) {
        return lockMapper.insertLock(param);
    }

    public int findLockKey(String key) {
        return lockMapper.findLockKey(key);
    }

    public int findIsTokenVali(String token) {
        return lockMapper.findIsTokenVali(token);
    }

    public int findRuleUptMode(ParamLock.FindRuleUptMode params) {
        return lockMapper.findRuleUptMode(params);
    }

    public int findRuleApplyMode(String lockkey){
        return lockMapper.findRuleApplyMode(lockkey);
    }

    public String findLockNote(String lockkey) {
        return lockMapper.findLockNote(lockkey);
    }

    public String findRuleApplyModeCnt(){
        return lockMapper.findRuleApplyModeCnt();
    }

}
