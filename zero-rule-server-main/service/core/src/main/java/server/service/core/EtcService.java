package server.service.core;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.repo.core.mapper.EtcMapper;

import java.time.Instant;

@Service
@Slf4j
public class EtcService {
    @Autowired
    EtcMapper etcMapper;


    public int deleteOld(Instant maxRegDttm){
        return etcMapper.deleteOldLoginFailByMaxRegDttmBefore(maxRegDttm);
    }
}
