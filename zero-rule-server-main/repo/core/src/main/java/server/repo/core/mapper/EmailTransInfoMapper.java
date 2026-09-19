package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import server.domain.entity.EmailTransInfo;
import server.sql.ParamEmailTransInfo;

import java.util.List;

@Mapper
public interface EmailTransInfoMapper {

    List<EmailTransInfo> emailTransInfoList(ParamEmailTransInfo.EmailTransInfoList params);

    long emailTransInfoListCnt(ParamEmailTransInfo.EmailTransInfoList params);
}
