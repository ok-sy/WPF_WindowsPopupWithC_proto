package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.domain.entity.EmailTransInfo;
import server.repo.core.mapper.EmailTransInfoMapper;
import server.sql.ParamEmailTransInfo;

import java.util.List;

@Service
public class EmailTransInfoService {
    @Autowired
    EmailTransInfoMapper emailTransInfoMapper;

    public List<EmailTransInfo> emailTransInfoList(ParamEmailTransInfo.EmailTransInfoList params) {
        return emailTransInfoMapper.emailTransInfoList(params);
    }
}
