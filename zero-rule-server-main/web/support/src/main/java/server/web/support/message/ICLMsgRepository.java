package server.web.support.message;

import cl.cloverframework.ICLMsg;

import java.util.List;

public interface ICLMsgRepository {

    ICLMsg findByMsgId(String msgId);

    ICLMsg findByMsgName(String msgName);

    List<ICLMsg> findMsgDbAll();

    List<ICLMsg> findMsgEnumAll();

    boolean msgSave(ICLMsg msg);

    boolean msgModify(ICLMsg msg);

    boolean msgDelete(String msgId);


}
