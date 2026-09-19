package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.domain.vo.CLMsgVo;
import server.repo.core.mapper.MessageMapper;

import java.util.List;

@Service
public class MessageService {
    @Autowired
    MessageMapper messageMapper;

    /**
     * CLMessageVo 다건 조회
     */
    public List<CLMsgVo> findMsgListAll() {
        return messageMapper.findMsgList();
    }

}
