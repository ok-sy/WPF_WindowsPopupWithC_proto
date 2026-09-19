package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import server.domain.vo.CLMsgVo;

import java.util.List;

@Mapper
public interface MessageMapper {

    List<CLMsgVo> findMsgList();
}
