package server.web.support.message;

import cl.cloverframework.CLMsg;
import cl.cloverframework.ICLMsg;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import server.base.AppMsg;
import server.domain.vo.CLMsgVo;
import server.service.core.MessageService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CLMsgDbRepository implements ICLMsgRepository {
    @Autowired
    MessageService messageService;

    private Map<String, ICLMsg> msgMap = new ConcurrentHashMap<>();  // db message
    private Map<String, ICLMsg> bfmsgMap = new ConcurrentHashMap<>(); // before db message

    private Map<String, ICLMsg> msgEnumMap = new ConcurrentHashMap<>(); // enum message


    private boolean mapCompletion = true;

    private String msgType;

    public CLMsgDbRepository(String msgType) {
        this.msgType = msgType;
    }

    @PostConstruct
    public void createMsg() {

        mapCompletion = false;

        List<CLMsgVo> clMsgList;

        if("MSGDB".equals(msgType)) {
            clMsgList =  messageService.findMsgListAll();
            clMsgList.forEach(msg -> {
                msgMap.put(msg.getMsgId(), new CLMsg(msg.getMsgId(), msg.getMsgCn(), msg.getMsgClsf(), msg.getMsgPrntCd()) );
            });
        } else if("ENUM".equals(msgType)) {

            Arrays.asList(AppMsg.values())
                .forEach(msg -> {
                    msgMap.put(msg.getMsgId(), new CLMsg(msg.getMsgId(), msg.getMsgCn(), msg.getMsgClsf(), msg.getMsgPrntCd()) );
                    msgEnumMap.put(msg.name(), new CLMsg(msg.getMsgId(), msg.getMsgCn(), msg.getMsgClsf(), msg.getMsgPrntCd()) );
                });

        } else {
            throw new RuntimeException("올바르지 않은 파라미터입니다:"+msgType);
        }
        mapCompletion = true;

//        System.out.println(">>>>>>>>>>>>>11"+ AppMsg.ER_AUTH_EXPIRED.name());
//        List<ICLMsg> test = new ArrayList<>(msgEnumMap.values());
//        test.forEach( (msg) -> {
//            System.out.println(msg);
//            System.out.println(msg.getMsgId()+msg.getMsgCn()+msg.getMsgClsf()+msg.getMsgPrntCd());
//            }
//        );
    }

    @Override
    public ICLMsg findByMsgId(String msgId) {
        if (mapCompletion) {
            return msgMap.get(msgId);
        } else {
            return bfmsgMap.get(msgId);
        }
    }

    @Override
    public ICLMsg findByMsgName(String msgName) {
        return msgEnumMap.get(msgName);
    }

    public List<ICLMsg> findMsgDbAll() {
        return new ArrayList<>(msgMap.values());
    }

    public List<ICLMsg> findMsgEnumAll() {
        return new ArrayList<>(msgEnumMap.values());
    }

    public boolean msgSave(ICLMsg msg) {
        if(mapCompletion && "MSGDB".equals(msgType)) {
            msgMap.put(msg.getMsgId(), new CLMsg(msg.getMsgId(), msg.getMsgCn(), msg.getMsgClsf(), msg.getMsgPrntCd()));
        }
        return mapCompletion;
    }

    public boolean msgModify(ICLMsg msg) {
        if(mapCompletion && "MSGDB".equals(msgType)) {
            msgMap.replace(msg.getMsgId(), msg);
        }
        return mapCompletion;
    }

    public boolean msgDelete(String msgId) {
        if(mapCompletion && "MSGDB".equals(msgType)) {
            msgMap.remove(msgId);
        }
        return mapCompletion;
    }

    public boolean msgReload() {
        //동시수행방지
        if(mapCompletion) {
            return mapCompletion;
        }

        bfmsgMap.clear();
        bfmsgMap.putAll(msgMap);

        mapCompletion = false;

        msgMap.clear();

        List<CLMsgVo> tempMsgList =  messageService.findMsgListAll();
        tempMsgList.forEach(msg -> {
            msgMap.put(msg.getMsgId(), new CLMsg(msg.getMsgId(), msg.getMsgCn(), msg.getMsgClsf(), msg.getMsgPrntCd()) );
        });

        mapCompletion = true;
        return mapCompletion;
    }

}
