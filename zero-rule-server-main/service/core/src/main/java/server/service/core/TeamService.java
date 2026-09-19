package server.service.core;

import cl.cloverframework.impl.CLRequestUserHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.vo.TeamForUserVo;
import server.domain.vo.TeamVo;
import server.repo.core.mapper.TeamMapper;
import server.sql.ParamsTeam;

import java.util.List;

@Service
@Slf4j
public class TeamService {

    @Autowired
    TeamMapper teamMapper;

    @Autowired
    CLRequestUserHelper requestUserHelper;

    /**
     * 팀 검색
     *
     * @param params 파라미터 객체
     * @return 팀 리스트
     */
    @NonNull
    @Transactional
    public List<TeamVo> findTeamBySearchParams(ParamsTeam.FindTeamVoByParam params) {
        return teamMapper.findTeamVoByParam(params) ;
    }

    /**
     * 팀 검색
     *
     * @param params 파라미터 객체
     * @return 팀 리스트
     */
    @Transactional
    @NonNull
    public int create(ParamsTeam.Create params) {
        params.setChgrId(requestUserHelper.currentLgonIdOrNull());
        params.setRegrId(requestUserHelper.currentLgonIdOrNull());
        return teamMapper.create(params);
    }

    @Transactional
    @NonNull
    public int update(ParamsTeam.Update params) {
        params.setChgrId(requestUserHelper.currentLgonIdOrNull());
        return teamMapper.update(params);
    }

    /**
     * TeamVo 단건 조회 by userId
     */
    @Nullable
    public TeamVo findTeamVoByTeamId(long teamId) {
        return teamMapper.findTeamVoByTeamId(teamId);
    }

    /**
     * 팀별 사용자 조회
     */
    public List<TeamForUserVo> findUserForTeam(long teamId){
        return teamMapper.findUserForTeam(teamId);
    }
}
