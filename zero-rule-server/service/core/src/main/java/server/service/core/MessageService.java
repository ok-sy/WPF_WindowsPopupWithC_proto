package server.service.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.domain.vo.CLMsgVo;
import server.repo.core.mapper.MessageMapper;

import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MessageMapper messageMapper;

//    private Map<String, CLMsg> msgByMsgId = new HashMap<>();


    /**
     * CLMessageVo 다건 조회
     */
    public List<CLMsgVo> findMsgListAll() {

        List<CLMsgVo> clMsgList = messageMapper.findMsgList();

        return clMsgList;
    }

}
