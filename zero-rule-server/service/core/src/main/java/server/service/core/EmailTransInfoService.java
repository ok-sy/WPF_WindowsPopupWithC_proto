package server.service.core;

import cl.cloverframework.impl.domain.vo.CLPagerData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.domain.entity.EmailTransInfo;
import server.repo.core.mapper.EmailTransInfoMapper;
import server.sql.ParamEmailTransInfo;

import java.util.List;

@Service
public class EmailTransInfoService {
    @Autowired
    private EmailTransInfoMapper emailTransInfoMapper;

    public List<EmailTransInfo> emailTransInfoList(ParamEmailTransInfo.EmailTransInfoList params) {
        return emailTransInfoMapper.emailTransInfoList(params);
    }
//    public CLPagerData<EmailTransInfo> emailTransInfoList(ParamEmailTransInfo.EmailTransInfoList params) {
//        List<EmailTransInfo> elements =emailTransInfoMapper.emailTransInfoList(params);
//        long totalElements = emailTransInfoMapper.emailTransInfoListCnt(params);
//        return new CLPagerData<>(
//                elements,
//                totalElements,
//                params.getPageNumber(),
//                params.getRowsPerPage()
//        );
//    }
}
