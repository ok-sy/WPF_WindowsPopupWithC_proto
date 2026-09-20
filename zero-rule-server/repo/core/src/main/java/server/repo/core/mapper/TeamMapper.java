package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.Nullable;
import server.domain.vo.TeamForUserVo;
import server.sql.ParamsTeam;
import server.domain.vo.TeamVo;

import java.util.List;

@Mapper
public interface TeamMapper {

    /**
     * @param params 파라미터 객체
     * TeamVo 다건 조회
     */

    List<TeamVo> findTeamVoByParam(ParamsTeam.FindTeamVoByParam params);

    int create(ParamsTeam.Create team);

    int update(ParamsTeam.Update team);


    /**
     * 팀 조회 by 팀ID
     *
     * @param teamId 팀ID
     * @return 사용자 정보, 없으면 null
     */
    @Nullable
    TeamVo findTeamVoByTeamId(long teamId);

    /**
     * 팀별 사용자 조회
     */
    List<TeamForUserVo> findUserForTeam(long teamId);
}
